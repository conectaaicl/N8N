from sqlalchemy import create_engine, MetaData, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator
from app.core.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# MetaData for dynamic schema mapping
metadata = MetaData()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class TenantSessionManager:
    """
    Manages database sessions with dynamic schema switching.
    """
    def __init__(self, db: Session):
        self.db = db

    def set_tenant_schema(self, schema_name: str):
        """
        Sets the search_path to the specified tenant schema.
        """
        import re
        if not re.match(r'^[a-z0-9_]+$', schema_name):
            raise ValueError(f"Invalid schema name: {schema_name}")
        from sqlalchemy import text
        self.db.execute(text(f"SET search_path TO {schema_name}, public"))

@contextmanager
def tenant_db_session(schema_name: str) -> Generator[Session, None, None]:
    import re
    if not re.match(r'^[a-z0-9_]+$', schema_name):
        raise ValueError(f"Invalid schema name: {schema_name}")
    from sqlalchemy import text
    db = SessionLocal()
    try:
        db.execute(text(f"SET search_path TO {schema_name}, public"))
        yield db
    finally:
        db.close()
