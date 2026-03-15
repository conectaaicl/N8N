from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    schema_name = Column(String, unique=True, index=True)
    subdomain = Column(String, unique=True, index=True)
    custom_domain = Column(String, unique=True, index=True, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    settings = relationship("TenantSettings", back_populates="tenant", uselist=False)
    users = relationship("User", back_populates="tenant")

class TenantSettings(Base):
    __tablename__ = "tenant_settings"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    logo_url = Column(String, nullable=True)
    primary_color = Column(String, default="#3b82f6")
    favicon_url = Column(String, nullable=True)
    support_email = Column(String, nullable=True)
    whatsapp_number = Column(String, nullable=True)
    whatsapp_phone_id = Column(String, nullable=True)
    whatsapp_access_token = Column(String, nullable=True)
    n8n_url = Column(String, nullable=True)
    n8n_webhook_path = Column(String, nullable=True)
    timezone = Column(String, default="UTC")
    language = Column(String, default="es")
    
    tenant = relationship("Tenant", back_populates="settings")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    
    tenant = relationship("Tenant", back_populates="users")
    role = relationship("Role")

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True) # e.g., admin, manager, agent
    permissions = Column(JSON) # List of permission strings
