from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.core.database import Base

class GlobalAdmin(Base):
    """
    SuperAdmin users who manage the entire SaaS platform.
    """
    __tablename__ = "global_admins"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemLog(Base):
    """
    Audit logs for global administrative actions.
    """
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer)
    action = Column(String)
    details = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
