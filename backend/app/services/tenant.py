from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.core import Tenant, TenantSettings, User
from app.models.tenant import Base as TenantBase
from app.core.database import engine

def create_tenant_schema(db: Session, schema_name: str):
    """
    Creates a new PostgreSQL schema for a tenant and initializes tables.
    """
    # Create schema
    db.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
    db.commit()
    
    # Initialize tables in the new schema
    # We switch the search_path temporarily to the new schema to create tables
    db.execute(text(f"SET search_path TO {schema_name}"))
    TenantBase.metadata.create_all(bind=engine)
    
    # Reset search_path to public
    db.execute(text("SET search_path TO public"))
    db.commit()

def create_new_tenant(db: Session, tenant_name: str, subdomain: str, admin_email: str, hashed_password: str):
    schema_name = f"tenant_{subdomain.replace('-', '_')}"
    
    # Create Tenant record in public schema
    new_tenant = Tenant(
        name=tenant_name,
        schema_name=schema_name,
        subdomain=subdomain
    )
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    
    # Create Tenant Settings
    settings = TenantSettings(tenant_id=new_tenant.id)
    db.add(settings)
    
    # Create Schema and Tables
    create_tenant_schema(db, schema_name)
    
    # Create Admin User
    new_user = User(
        tenant_id=new_tenant.id,
        email=admin_email,
        hashed_password=hashed_password,
        full_name="Admin",
        is_superuser=True
    )
    db.add(new_user)
    db.commit()
    
    return new_tenant

def get_tenant_by_host(db: Session, host: str):
    """
    Retrieves a tenant by subdomain or custom domain.
    """
    # Assuming host is something like "tenant1.omniflow.com" or "custom.com"
    # We split by '.' and check for subdomain matches or exact custom domain matches
    parts = host.split('.')
    subdomain = parts[0] if len(parts) > 1 else host
    
    tenant = db.query(Tenant).filter(
        (Tenant.subdomain == subdomain) | (Tenant.custom_domain == host)
    ).first()
    return tenant
