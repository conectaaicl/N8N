from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db, tenant_db_session
from app.models.core import Tenant, TenantSettings
from app.models.tenant import Conversation, Message, Contact
from app.services import messaging

router = APIRouter()


@router.get("/")
def get_conversations(db: Session = Depends(get_db)):
    tenant = db.query(Tenant).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    with tenant_db_session(tenant.schema_name) as tdb:
        convs = tdb.query(Conversation).order_by(Conversation.updated_at.desc()).all()
        result = []
        for conv in convs:
            contact = tdb.query(Contact).filter(Contact.id == conv.contact_id).first()
            if not contact:
                continue
            result.append({
                "id": conv.id,
                "channel": conv.channel,
                "status": conv.status,
                "last_message": conv.last_message,
                "updated_at": conv.updated_at,
                "contact": {
                    "id": contact.id,
                    "name": contact.name,
                    "phone": contact.phone,
                    "email": contact.email,
                    "lead_score": contact.lead_score,
                    "intent": contact.intent,
                },
            })
        return result


@router.get("/{conversation_id}/messages")
def get_messages(conversation_id: int, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    with tenant_db_session(tenant.schema_name) as tdb:
        msgs = (tdb.query(Message)
                .filter(Message.conversation_id == conversation_id)
                .order_by(Message.timestamp.asc())
                .all())
        return [
            {
                "id": m.id,
                "sender_type": m.sender_type,
                "content": m.content,
                "timestamp": m.timestamp.isoformat(),
            }
            for m in msgs
        ]


@router.post("/{conversation_id}/send")
async def send_message(conversation_id: int, content: str, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    s = tenant.settings

    with tenant_db_session(tenant.schema_name) as tdb:
        conv = tdb.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        contact = tdb.query(Contact).filter(Contact.id == conv.contact_id).first()

        # Save outbound message to DB
        msg = Message(
            conversation_id=conversation_id,
            sender_type="human",
            content=content,
        )
        tdb.add(msg)
        conv.last_message = content
        conv.updated_at = datetime.utcnow()
        tdb.commit()

        channel = conv.channel
        sent = False

        # Send via the channel's API
        if channel == "whatsapp" and s and s.whatsapp_phone_id and s.whatsapp_access_token and contact and contact.phone:
            sent = await messaging.send_whatsapp(
                s.whatsapp_phone_id, s.whatsapp_access_token, contact.phone, content
            )

        elif channel == "instagram" and s and s.instagram_access_token and contact and contact.external_id:
            sent = await messaging.send_instagram(
                s.instagram_access_token, contact.external_id, content
            )

        elif channel == "facebook" and s and s.facebook_access_token and contact and contact.external_id:
            sent = await messaging.send_facebook(
                s.facebook_access_token, contact.external_id, content
            )

        elif channel == "email" and s and contact and contact.email:
            sent = await messaging.send_email(s, contact.email, "Mensaje de OmniFlow", content)

        elif channel == "web":
            sent = True  # Web chat: message saved to DB, widget polls for it

    return {"status": "sent", "delivered": sent, "channel": channel}
