"""
Broadcasts API — mass messaging campaigns across WhatsApp, Instagram, Facebook.

GET  /broadcasts          → list all broadcasts
POST /broadcasts          → create new broadcast (draft)
POST /broadcasts/{id}/send → execute send to all matching contacts
DELETE /broadcasts/{id}   → delete draft broadcast
"""
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.core.database import get_db, tenant_db_session
from app.core.security import get_current_user
from app.models.core import Tenant, TenantSettings, User
from app.models.tenant import Broadcast, Contact
from app.services import messaging

router = APIRouter()


class BroadcastCreate(BaseModel):
    name: str
    channel: str          # whatsapp | instagram | facebook
    message: str
    filter_tag: Optional[str] = None   # filter contacts by tag/campaign


def _get_tenant(db: Session, current_user: User) -> Tenant:
    t = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return t


@router.get("/")
def list_broadcasts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant = _get_tenant(db, current_user)
    with tenant_db_session(tenant.schema_name) as tdb:
        items = tdb.query(Broadcast).order_by(Broadcast.created_at.desc()).limit(50).all()
        return [
            {
                "id": b.id,
                "name": b.name,
                "channel": b.channel,
                "message": b.message,
                "status": b.status,
                "sent_count": b.sent_count,
                "failed_count": b.failed_count,
                "filter_tag": b.filter_tag,
                "created_at": b.created_at.isoformat() if b.created_at else None,
                "sent_at": b.sent_at.isoformat() if b.sent_at else None,
            }
            for b in items
        ]


@router.post("/")
def create_broadcast(
    payload: BroadcastCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.channel not in ("whatsapp", "instagram", "facebook"):
        raise HTTPException(status_code=400, detail="Canal debe ser whatsapp, instagram o facebook")
    tenant = _get_tenant(db, current_user)
    with tenant_db_session(tenant.schema_name) as tdb:
        b = Broadcast(
            name=payload.name,
            channel=payload.channel,
            message=payload.message,
            filter_tag=payload.filter_tag,
            status="draft",
        )
        tdb.add(b)
        tdb.commit()
        tdb.refresh(b)
        return {"id": b.id, "status": "draft", "name": b.name}


@router.post("/{broadcast_id}/send")
async def send_broadcast(
    broadcast_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant = _get_tenant(db, current_user)
    s = db.query(TenantSettings).filter(TenantSettings.tenant_id == tenant.id).first()

    with tenant_db_session(tenant.schema_name) as tdb:
        b = tdb.query(Broadcast).filter(Broadcast.id == broadcast_id).first()
        if not b:
            raise HTTPException(status_code=404, detail="Broadcast no encontrado")
        if b.status == "sending":
            raise HTTPException(status_code=409, detail="Ya está enviándose")
        b.status = "sending"
        tdb.commit()

    background_tasks.add_task(
        _do_send_broadcast,
        tenant_schema=tenant.schema_name,
        broadcast_id=broadcast_id,
        settings=s,
    )
    return {"status": "sending", "broadcast_id": broadcast_id}


@router.delete("/{broadcast_id}")
def delete_broadcast(
    broadcast_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant = _get_tenant(db, current_user)
    with tenant_db_session(tenant.schema_name) as tdb:
        b = tdb.query(Broadcast).filter(Broadcast.id == broadcast_id).first()
        if not b:
            raise HTTPException(status_code=404, detail="Broadcast no encontrado")
        if b.status == "sending":
            raise HTTPException(status_code=409, detail="No se puede eliminar mientras se envía")
        tdb.delete(b)
        tdb.commit()
    return {"deleted": True}


async def _do_send_broadcast(tenant_schema: str, broadcast_id: int, settings: TenantSettings):
    """Background task: send broadcast message to all matching contacts."""
    sent = 0
    failed = 0

    try:
        with tenant_db_session(tenant_schema) as tdb:
            b = tdb.query(Broadcast).filter(Broadcast.id == broadcast_id).first()
            if not b:
                return

            # Build contact query
            q = tdb.query(Contact)
            if b.filter_tag:
                q = q.filter(Contact.campaign == b.filter_tag)
            contacts = q.all()

            channel = b.channel
            message = b.message

            for contact in contacts:
                ok = False
                try:
                    if channel == "whatsapp":
                        wa_token = (
                            settings.whatsapp_access_token if settings else None
                        )
                        wa_phone_id = settings.whatsapp_phone_id if settings else None
                        if wa_token and wa_phone_id and contact.phone:
                            phone = contact.phone.lstrip("+")
                            ok = await messaging.send_whatsapp(wa_phone_id, wa_token, phone, message)

                    elif channel == "instagram":
                        ig_token = settings.instagram_access_token if settings else None
                        ig_page_id = getattr(settings, "instagram_page_id", "me") or "me"
                        if ig_token and contact.external_id:
                            ok = await messaging.send_instagram(ig_token, contact.external_id, message, ig_page_id)

                    elif channel == "facebook":
                        fb_token = settings.facebook_access_token if settings else None
                        if fb_token and contact.external_id:
                            ok = await messaging.send_facebook(fb_token, contact.external_id, message)

                except Exception as e:
                    print(f"[broadcast] Contact {contact.id} error: {e}")
                    ok = False

                if ok:
                    sent += 1
                else:
                    failed += 1

                # Throttle: avoid API rate limits
                await asyncio.sleep(0.3)

            b.sent_count = sent
            b.failed_count = failed
            b.status = "done"
            b.sent_at = datetime.utcnow()
            tdb.commit()

    except Exception as e:
        print(f"[broadcast] Fatal error in broadcast {broadcast_id}: {e}")
        try:
            with tenant_db_session(tenant_schema) as tdb:
                b = tdb.query(Broadcast).filter(Broadcast.id == broadcast_id).first()
                if b:
                    b.status = "failed"
                    b.sent_count = sent
                    b.failed_count = failed
                    tdb.commit()
        except Exception:
            pass
