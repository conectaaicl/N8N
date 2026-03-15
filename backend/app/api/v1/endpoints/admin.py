from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.core import Tenant
from app.models.billing import Plan, Subscription
from typing import List

router = APIRouter()

@router.get("/tenants")
def list_tenants(db: Session = Depends(get_db)):
    """
    List all tenants for the SuperAdmin.
    """
    tenants = db.query(Tenant).all()
    result = []
    for t in tenants:
        # Get subscription info if exists
        sub = db.query(Subscription).filter(Subscription.tenant_id == t.id).first()
        plan = db.query(Plan).filter(Plan.id == sub.plan_id).first() if sub else None
        
        result.append({
            "id": t.id,
            "name": t.name,
            "subdomain": t.subdomain,
            "is_active": t.is_active,
            "plan": plan.name if plan else "Free",
            "created_at": t.created_at
        })
    return result

@router.get("/plans")
def list_plans(db: Session = Depends(get_db)):
    """
    List all available subscription plans.
    """
    return db.query(Plan).all()

@router.post("/plans")
def create_plan(name: str, price: float, features: dict, db: Session = Depends(get_db)):
    """
    Create a new subscription plan.
    """
    plan = Plan(name=name, price=price, features=features)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan
