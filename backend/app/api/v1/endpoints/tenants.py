from typing import Any
from fastapi import APIRouter, Request, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.schemas.tenant import TenantCreate, TenantRead, PublicTenantInfo, TenantSettingsUpdate, TenantSettingsRead
from app.services.tenant import create_new_tenant, get_tenant_by_host
from app.core.security import get_password_hash
from app.models.core import Tenant, TenantSettings, User
from app.models.tenant import Contact, Deal
from app.core.database import get_db, tenant_db_session

router = APIRouter()


def _settings_to_read(s: TenantSettings) -> dict:
    """Convert TenantSettings ORM to TenantSettingsRead-compatible dict with has_X flags."""
    return {
        "logo_url": s.logo_url,
        "primary_color": s.primary_color or "#7c3aed",
        "favicon_url": s.favicon_url,
        "support_email": s.support_email,
        "support_phone": s.support_phone,
        "timezone": s.timezone or "UTC",
        "language": s.language or "es",
        "has_whatsapp": bool(s.whatsapp_phone_id and s.whatsapp_access_token),
        "has_instagram": bool(s.instagram_page_id and s.instagram_access_token),
        "has_facebook": bool(s.facebook_page_id and s.facebook_access_token),
        "has_tiktok": bool(s.tiktok_app_id and s.tiktok_app_secret),
        "has_shopify": bool(s.shopify_shop_domain and s.shopify_access_token),
        "has_email": bool(
            (s.email_provider == "sendgrid" and s.sendgrid_api_key) or
            (s.email_provider == "mailgun" and s.mailgun_api_key) or
            (s.smtp_host and s.smtp_user)
        ),
        "webchat_enabled": s.webchat_enabled if s.webchat_enabled is not None else True,
        "webchat_greeting": s.webchat_greeting,
        "webchat_bot_name": s.webchat_bot_name,
        "webchat_color": s.webchat_color,
        "n8n_url": s.n8n_url,
        "n8n_webhook_path": s.n8n_webhook_path,
    }


@router.get("/public-info")
def get_public_info(request: Request, db: Session = Depends(get_db)):
    host = request.headers.get("host", "")
    tenant = get_tenant_by_host(db, host)
    if not tenant:
        tenant = db.query(Tenant).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
    s = tenant.settings
    return {
        "name": tenant.name,
        "subdomain": tenant.subdomain,
        "custom_domain": tenant.custom_domain,
        "settings": _settings_to_read(s) if s else {},
    }


@router.get("/settings")
def get_tenant_settings(db: Session = Depends(get_db)):
    tenant = db.query(Tenant).first()
    if not tenant or not tenant.settings:
        raise HTTPException(status_code=404, detail="Tenant not found")
    s = tenant.settings
    # Return full settings including credential fields (for the config form)
    return {
        **_settings_to_read(s),
        # WhatsApp (partial — don't expose full token)
        "whatsapp_phone_id": s.whatsapp_phone_id or "",
        "whatsapp_verify_token": s.whatsapp_verify_token or "",
        "whatsapp_number": s.whatsapp_number or "",
        # Instagram
        "instagram_page_id": s.instagram_page_id or "",
        "instagram_verify_token": s.instagram_verify_token or "",
        # Facebook
        "facebook_page_id": s.facebook_page_id or "",
        "facebook_verify_token": s.facebook_verify_token or "",
        # TikTok
        "tiktok_app_id": s.tiktok_app_id or "",
        # Shopify
        "shopify_shop_domain": s.shopify_shop_domain or "",
        # Email
        "email_provider": s.email_provider or "",
        "smtp_host": s.smtp_host or "",
        "smtp_port": s.smtp_port,
        "smtp_user": s.smtp_user or "",
        "smtp_from_address": s.smtp_from_address or "",
        "mailgun_domain": s.mailgun_domain or "",
    }


@router.patch("/settings")
def update_tenant_settings(settings_in: TenantSettingsUpdate, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    s = tenant.settings
    for field, value in settings_in.model_dump(exclude_unset=True).items():
        setattr(s, field, value)
    db.add(s)
    db.commit()
    db.refresh(s)
    return _settings_to_read(s)


@router.post("/register", response_model=TenantRead)
def register_tenant(tenant_in: TenantCreate, db: Session = Depends(get_db)):
    existing = db.query(Tenant).filter(Tenant.subdomain == tenant_in.subdomain).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subdomain already taken")
    hashed_password = get_password_hash(tenant_in.password)
    new_tenant = create_new_tenant(
        db,
        tenant_name=tenant_in.name,
        subdomain=tenant_in.subdomain,
        admin_email=tenant_in.admin_email,
        hashed_password=hashed_password,
    )
    return new_tenant


@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    tenant = db.query(Tenant).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    with tenant_db_session(tenant.schema_name) as tdb:
        total_contacts = tdb.query(Contact).count()
        hot_leads = tdb.query(Contact).filter(Contact.lead_score > 70).count()
        total_deals = tdb.query(Deal).count()
        won_deals = tdb.query(Deal).filter(Deal.status == "won").count()
        sources = tdb.query(Contact.source, func.count(Contact.id)).group_by(Contact.source).all()
        return {
            "stats": {
                "total_contacts": total_contacts,
                "hot_leads": hot_leads,
                "total_deals": total_deals,
                "won_deals": won_deals,
                "conversion_rate": (won_deals / total_deals * 100) if total_deals > 0 else 0,
            },
            "source_distribution": [{"source": s[0], "count": s[1]} for s in sources],
        }
