from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.billing import Plan, Subscription
from app.models.core import Tenant
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/current")
def get_current_subscription(db: Session = Depends(get_db)):
    """
    Get the subscription for the current tenant.
    """
    # For now, get the first tenant
    tenant = db.query(Tenant).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant.id).first()
    if not sub:
        return {"status": "none", "plan": "Free"}
        
    return {
        "status": sub.status,
        "plan": sub.plan.name,
        "current_period_end": sub.current_period_end
    }

@router.post("/subscribe/{plan_id}")
def create_subscription(plan_id: int, db: Session = Depends(get_db)):
    """
    Mock subscription creation. In production, this would use Stripe.
    """
    tenant = db.query(Tenant).first()
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    # Check if existing
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant.id).first()
    if sub:
        sub.plan_id = plan.id
        sub.status = "active"
    else:
        sub = Subscription(
            tenant_id=tenant.id,
            plan_id=plan.id,
            status="active",
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=30)
        )
        db.add(sub)
        
@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle Stripe webhooks for subscription updates.
    """
    payload = await request.body()
    # In production, verify signature with stripe.Webhook.construct_event
    
    # Mocking successful subscription from Stripe
    # event = stripe.Event.construct_from(json.loads(payload), stripe.api_key)
    # if event.type == 'checkout.session.completed': ...
    
    return {"status": "received"}

from fastapi import Request
