"""
Web Chat endpoints:
  GET  /webchat/config/{subdomain}   — Widget config (public)
  POST /webchat/message              — Receive message from widget
  GET  /webchat/messages/{visitor_id} — Poll for new messages
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db, tenant_db_session
from app.models.core import Tenant, TenantSettings
from app.services.crm import ingest_lead
from app.services.automation import trigger_n8n_workflow

router = APIRouter()


class WebChatMessage(BaseModel):
    tenant_subdomain: str
    visitor_id: str       # UUID stored in widget's localStorage
    visitor_name: str = "Visitante"
    message: str


@router.get("/config/{subdomain}")
def get_widget_config(subdomain: str, db: Session = Depends(get_db)):
    """Public endpoint — returns widget appearance config for embedding."""
    tenant = db.query(Tenant).filter(Tenant.subdomain == subdomain).first()
    if not tenant or not tenant.settings:
        raise HTTPException(status_code=404, detail="Tenant not found")
    s = tenant.settings
    return {
        "tenant_name": tenant.name,
        "greeting": s.webchat_greeting or "¡Hola! ¿En qué puedo ayudarte?",
        "bot_name": s.webchat_bot_name or "Asistente",
        "color": s.webchat_color or s.primary_color or "#7c3aed",
        "enabled": s.webchat_enabled if s.webchat_enabled is not None else True,
    }


@router.post("/message")
async def receive_webchat_message(payload: WebChatMessage, db: Session = Depends(get_db)):
    """Receive a message from the embeddable widget."""
    tenant = db.query(Tenant).filter(Tenant.subdomain == payload.tenant_subdomain).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    settings = tenant.settings

    with tenant_db_session(tenant.schema_name) as tdb:
        contact, conversation = ingest_lead(tdb, {
            "name": payload.visitor_name,
            "external_id": payload.visitor_id,
            "source": "web",
            "message": payload.message,
        }, tenant.id)
        cid, cvid = contact.id, conversation.id

    if settings and settings.n8n_url and settings.n8n_webhook_path:
        await trigger_n8n_workflow(settings, {
            "tenant_id": tenant.id,
            "channel": "web",
            "contact": {"id": cid, "name": payload.visitor_name},
            "message": {"content": payload.message, "conversation_id": cvid},
        })

    return {"status": "ok", "conversation_id": cvid, "contact_id": cid}


@router.get("/messages/{visitor_id}")
def poll_webchat_messages(visitor_id: str, tenant_subdomain: str, db: Session = Depends(get_db)):
    """Widget polls this endpoint every few seconds for agent/bot replies."""
    from app.models.tenant import Contact, Conversation, Message

    tenant = db.query(Tenant).filter(Tenant.subdomain == tenant_subdomain).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    with tenant_db_session(tenant.schema_name) as tdb:
        contact = tdb.query(Contact).filter(Contact.external_id == visitor_id).first()
        if not contact:
            return []
        conv = (tdb.query(Conversation)
                .filter(Conversation.contact_id == contact.id,
                        Conversation.channel == "web")
                .first())
        if not conv:
            return []
        messages = (tdb.query(Message)
                    .filter(Message.conversation_id == conv.id)
                    .order_by(Message.timestamp.asc())
                    .all())
        return [
            {
                "id": m.id,
                "sender_type": m.sender_type,
                "content": m.content,
                "timestamp": m.timestamp.isoformat(),
            }
            for m in messages
        ]
