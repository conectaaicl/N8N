from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Plan(Base):
    """
    Subscription plans (Starter, Pro, Enterprise).
    """
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    price = Column(Float)
    currency = Column(String, default="USD")
    interval = Column(String, default="month") # month, year
    features = Column(JSON) # e.g. {"max_contacts": 1000, "max_messages": 5000}
    stripe_price_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Subscription(Base):
    """
    Links a Tenant to a Plan.
    """
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    plan_id = Column(Integer, ForeignKey("plans.id"))
    status = Column(String) # active, trialing, past_due, canceled
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    stripe_subscription_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    plan = relationship("Plan")
