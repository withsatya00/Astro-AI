"""
Database engine, session management, and table creation.
Supports SQLite and PostgreSQL/pgvector seamlessly.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import settings

Base = declarative_base()

# SQLite requires check_same_thread=False for multi-threaded FastAPI workers
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes all database tables."""
    # Import all models before create_all
    import backend.app.models.models  # noqa
    Base.metadata.create_all(bind=engine)
