"""
Database engine, session management, and table creation.
Supports SQLite and PostgreSQL/pgvector seamlessly.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import settings

Base = declarative_base()

import os
import shutil
from pathlib import Path

# SQLite requires check_same_thread=False for multi-threaded FastAPI workers
db_url = settings.DATABASE_URL
connect_args = {}

# Handle serverless read-only filesystems (e.g. Vercel, AWS Lambda)
if (os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")) and db_url.startswith("sqlite"):
    tmp_db = Path("/tmp/astro_ai.db")
    src_db = Path(__file__).resolve().parent.parent.parent.parent / "astro_ai.db"
    if src_db.exists() and not tmp_db.exists():
        try:
            shutil.copyfile(src_db, tmp_db)
        except Exception:
            pass
    db_url = "sqlite:////tmp/astro_ai.db"

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
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
    """Initializes all database tables and ensures required columns exist."""
    # Import all models before create_all
    import backend.app.models.models  # noqa
    Base.metadata.create_all(bind=engine)

    # Safe migration check for metadata columns in SQLite / Postgres
    try:
        from sqlalchemy import inspect, text
        with engine.connect() as conn:
            insp = inspect(engine)
            if "document_chunks" in insp.get_table_names():
                chunk_cols = [c["name"] for c in insp.get_columns("document_chunks")]
                if "chunk_metadata" not in chunk_cols:
                    conn.execute(text("ALTER TABLE document_chunks ADD COLUMN chunk_metadata JSON"))
                    conn.commit()
            if "documents" in insp.get_table_names():
                doc_cols = [c["name"] for c in insp.get_columns("documents")]
                if "doc_metadata" not in doc_cols:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN doc_metadata JSON"))
                    conn.commit()
    except Exception:
        pass
