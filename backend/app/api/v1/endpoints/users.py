"""
Team / User management within a tenant.
The tenant admin (jefe) can:
  GET    /users/                  — list all team members
  POST   /users/                  — create a new member (sets password)
  PATCH  /users/{id}              — update name, email, role, is_active
  POST   /users/{id}/set-password — reset any member's password (admin override)
  DELETE /users/{id}              — deactivate (soft delete)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import httpx

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user, get_password_hash
from app.models.core import User, Tenant

router = APIRouter()


# ── Auth helper ───────────────────────────────────────────────────────────────

def _require_admin(current_user: User = Depends(get_current_user)) -> User:
    """User must be authenticated. Platform superadmins pass unconditionally."""
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Usuario inactivo")
    return current_user


def _check_same_tenant(actor: User, target: User) -> None:
    """Actor can only modify users in their own tenant (unless platform superadmin)."""
    if actor.is_superuser:
        return
    if actor.tenant_id != target.tenant_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar este usuario")


# ── Schemas ───────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role_id: Optional[int] = None
    is_active: bool = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None


class SetPasswordRequest(BaseModel):
    new_password: str


# ── Serializer ────────────────────────────────────────────────────────────────

def _user_out(u: User) -> dict:
    return {
        "id": u.id,
        "full_name": u.full_name,
        "email": u.email,
        "is_active": u.is_active,
        "is_superuser": u.is_superuser,
        "role_id": u.role_id,
        "role_name": u.role.name if u.role else ("superadmin" if u.is_superuser else "admin"),
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    """List all users in the current user's tenant."""
    users = (
        db.query(User)
        .filter(User.tenant_id == current_user.tenant_id)
        .order_by(User.id.asc())
        .all()
    )
    return [_user_out(u) for u in users]


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    """Create a new team member in the same tenant."""
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese email")

    new_user = User(
        tenant_id=current_user.tenant_id,
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role_id=payload.role_id,
        is_active=payload.is_active,
        is_superuser=False,  # Never superuser when created by tenant admin
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send credentials email via mail.conectaai.cl
    _send_welcome_email(new_user, payload.password, current_user)

    return _user_out(new_user)


def _send_welcome_email(new_user: User, plain_password: str, creator: User) -> None:
    """Fire-and-forget: send login credentials to the new user's email."""
    try:
        tenant = getattr(creator, "tenant", None)
        tenant_name = (tenant.name if tenant and hasattr(tenant, "name") else None) or "OmniFlow"
        login_url = f"{settings.FRONTEND_URL}/login"
        role_label = {1: "Administrador", 2: "Agente", 3: "Visualizador"}.get(new_user.role_id or 0, "Usuario")

        html = f"""
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:500px;margin:0 auto;padding:32px 24px;background:#080812;color:#e2e8f0">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
    <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center">
      <span style="color:white;font-size:16px;font-weight:700">O</span>
    </div>
    <span style="font-size:20px;font-weight:700;color:#a78bfa">OmniFlow</span>
  </div>
  <h2 style="color:#f1f5f9;font-size:22px;margin:0 0 8px">Bienvenido a {tenant_name}</h2>
  <p style="color:#94a3b8;margin:0 0 24px">Hola {new_user.full_name or 'usuario'}, tu cuenta ha sido creada. Aquí están tus credenciales de acceso:</p>
  <div style="background:#0f0f20;border:1px solid #1e1e3a;border-radius:12px;padding:20px;margin-bottom:24px">
    <div style="margin-bottom:12px">
      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Email</div>
      <div style="font-size:15px;color:#e2e8f0;font-weight:600">{new_user.email}</div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Contraseña</div>
      <div style="font-size:15px;color:#e2e8f0;font-weight:600;font-family:monospace">{plain_password}</div>
    </div>
    <div>
      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Rol</div>
      <div style="font-size:15px;color:#a78bfa;font-weight:600">{role_label}</div>
    </div>
  </div>
  <a href="{login_url}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:24px">
    Iniciar sesión
  </a>
  <p style="color:#64748b;font-size:13px;margin-bottom:8px">
    Por seguridad, te recomendamos cambiar tu contraseña desde <strong style="color:#94a3b8">Ajustes &gt; Seguridad</strong> al ingresar por primera vez.
  </p>
  <hr style="border:none;border-top:1px solid #1e293b;margin:32px 0">
  <p style="color:#334155;font-size:12px;text-align:center">© OmniFlow — Automatización Omnicanal</p>
</div>"""

        if settings.MAILSAAS_URL and settings.MAILSAAS_API_KEY:
            resp = httpx.post(
                f"{settings.MAILSAAS_URL}/api/send",
                headers={"Authorization": f"Bearer {settings.MAILSAAS_API_KEY}"},
                json={"to": new_user.email, "subject": f"Tus credenciales de acceso — {tenant_name}", "html": html},
                timeout=10,
            )
            if resp.status_code < 400:
                print(f"[email] Credentials sent to {new_user.email}", flush=True)
            else:
                print(f"[email] MailSaaS error {resp.status_code}: {resp.text}", flush=True)
        else:
            print(f"[dev] New user credentials — email: {new_user.email} / password: {plain_password}", flush=True)
    except Exception as e:
        print(f"[email] Failed to send welcome email: {e}", flush=True)


@router.patch("/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    """Update a team member's details."""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    _check_same_tenant(current_user, target)

    if payload.full_name is not None:
        target.full_name = payload.full_name
    if payload.email is not None:
        existing = db.query(User).filter(User.email == payload.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ese email ya está en uso")
        target.email = payload.email
    if payload.role_id is not None:
        target.role_id = payload.role_id
    if payload.is_active is not None:
        target.is_active = payload.is_active

    db.add(target)
    db.commit()
    db.refresh(target)
    return _user_out(target)


@router.post("/{user_id}/set-password")
def set_user_password(
    user_id: int,
    payload: SetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    """Admin override: set any team member's password without needing their current password."""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    _check_same_tenant(current_user, target)

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")

    target.hashed_password = get_password_hash(payload.new_password)
    db.add(target)
    db.commit()
    return {"message": "Contraseña actualizada"}


@router.delete("/{user_id}")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    """Deactivate (soft-delete) a team member. Cannot deactivate yourself."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propia cuenta")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    _check_same_tenant(current_user, target)

    target.is_active = False
    db.add(target)
    db.commit()
    return {"message": "Usuario desactivado"}


@router.get("/roles/")
def list_roles(
    db: Session = Depends(get_db),
    _: User = Depends(_require_admin),
):
    """List available roles."""
    return [{"id": 1, "name": "admin"}, {"id": 2, "name": "agent"}, {"id": 3, "name": "viewer"}]
