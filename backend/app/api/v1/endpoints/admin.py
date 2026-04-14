from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.core import Tenant, TenantSettings, User
from app.models.billing import Plan, Subscription
from app.models.tenant import Contact, Conversation
from app.core.database import tenant_db_session

router = APIRouter()


def require_superuser(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superuser access required")
    return current_user


def _tenant_row(t: Tenant, db: Session) -> dict:
    sub = db.query(Subscription).filter(Subscription.tenant_id == t.id).first()
    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first() if sub else None
    settings = db.query(TenantSettings).filter(TenantSettings.tenant_id == t.id).first()

    contacts = 0
    conversations = 0
    try:
        with tenant_db_session(t.schema_name) as tdb:
            contacts = tdb.query(Contact).count()
            conversations = tdb.query(Conversation).count()
    except Exception:
        pass

    channels = []
    if settings:
        if settings.whatsapp_phone_id and settings.whatsapp_access_token:
            channels.append("whatsapp")
        if settings.instagram_page_id and settings.instagram_access_token:
            channels.append("instagram")
        if settings.facebook_page_id and settings.facebook_access_token:
            channels.append("facebook")
        if settings.tiktok_app_id:
            channels.append("tiktok")
        if settings.shopify_shop_domain:
            channels.append("shopify")
        if settings.email_provider:
            channels.append("email")
        if settings.webchat_enabled:
            channels.append("webchat")

    return {
        "id": t.id,
        "name": t.name,
        "subdomain": t.subdomain,
        "is_active": t.is_active,
        "plan": plan.name if plan else "Free",
        "plan_price": float(plan.price) if plan else 0,
        "sub_status": sub.status if sub else "none",
        "sub_period_end": sub.current_period_end if sub else None,
        "created_at": t.created_at,
        "contacts": contacts,
        "conversations": conversations,
        "channels": channels,
    }


@router.get("/tenants")
def list_tenants(db: Session = Depends(get_db), _: User = Depends(require_superuser)):
    tenants = db.query(Tenant).order_by(Tenant.created_at.desc()).all()
    return [_tenant_row(t, db) for t in tenants]


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _: User = Depends(require_superuser)):
    tenants = db.query(Tenant).all()
    active = [t for t in tenants if t.is_active]

    subs = db.query(Subscription).filter(Subscription.status == "active").all()
    mrr = 0.0
    for sub in subs:
        plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
        if plan:
            mrr += float(plan.price)

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_tenants = db.query(Tenant).filter(Tenant.created_at >= thirty_days_ago).count()

    plan_dist: dict = {}
    for sub in subs:
        plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
        name = plan.name if plan else "Free"
        plan_dist[name] = plan_dist.get(name, 0) + 1

    with_sub_ids = {sub.tenant_id for sub in subs}
    free_count = sum(1 for t in active if t.id not in with_sub_ids)
    if free_count:
        plan_dist["Free"] = free_count

    return {
        "total_tenants": len(tenants),
        "active_tenants": len(active),
        "suspended_tenants": len([t for t in tenants if not t.is_active]),
        "mrr": round(mrr, 2),
        "arr": round(mrr * 12, 2),
        "new_tenants_30d": new_tenants,
        "plan_distribution": plan_dist,
    }


@router.patch("/tenants/{tenant_id}/toggle")
def toggle_tenant(tenant_id: int, db: Session = Depends(get_db), _: User = Depends(require_superuser)):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant.is_active = not tenant.is_active
    db.commit()
    return {"id": tenant_id, "is_active": tenant.is_active}


@router.post("/tenants")
def create_tenant_admin(
    name: str, subdomain: str, admin_email: str, password: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    from app.core.security import get_password_hash
    from app.services.tenant import create_new_tenant
    existing = db.query(Tenant).filter(Tenant.subdomain == subdomain).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subdomain already taken")
    hashed = get_password_hash(password)
    tenant = create_new_tenant(db, tenant_name=name, subdomain=subdomain,
                               admin_email=admin_email, hashed_password=hashed)
    return {"id": tenant.id, "name": tenant.name, "subdomain": tenant.subdomain}


@router.get("/plans")
def list_plans(db: Session = Depends(get_db), _: User = Depends(require_superuser)):
    return db.query(Plan).all()


@router.post("/plans")
def create_plan(name: str, price: float, db: Session = Depends(get_db), _: User = Depends(require_superuser)):
    plan = Plan(name=name, price=price, features={})
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    features: Optional[dict] = None


@router.patch("/plans/{plan_id}")
def update_plan(
    plan_id: int,
    payload: PlanUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if payload.name is not None:
        plan.name = payload.name
    if payload.price is not None:
        plan.price = payload.price
    if payload.features is not None:
        plan.features = payload.features
    if payload.description is not None:
        # Store description inside features dict
        current = dict(plan.features or {})
        current["description"] = payload.description
        plan.features = current
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/plans/public")
def list_plans_public(db: Session = Depends(get_db)):
    """Public plan listing — no auth required."""
    return db.query(Plan).order_by(Plan.id).all()
