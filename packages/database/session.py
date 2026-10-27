"""
Database engine, session management, and table creation.
Supports SQLite and PostgreSQL/pgvector seamlessly.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from packages.core.config import settings

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
    src_db = Path(__file__).resolve().parent.parent.parent / "astro_ai.db"
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
    import packages.database.models  # noqa
    Base.metadata.create_all(bind=engine)

    # Safe migration check for metadata and extended columns in SQLite / Postgres
    try:
        from sqlalchemy import inspect, text
        with engine.connect() as conn:
            insp = inspect(engine)
            table_names = insp.get_table_names()
            
            if "document_chunks" in table_names:
                chunk_cols = [c["name"] for c in insp.get_columns("document_chunks")]
                if "chunk_metadata" not in chunk_cols:
                    conn.execute(text("ALTER TABLE document_chunks ADD COLUMN chunk_metadata JSON"))
                    conn.commit()

            if "documents" in table_names:
                doc_cols = [c["name"] for c in insp.get_columns("documents")]
                if "doc_metadata" not in doc_cols:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN doc_metadata JSON"))
                    conn.commit()

            if "chat_messages" in table_names:
                msg_cols = [c["name"] for c in insp.get_columns("chat_messages")]
                if "consultation_id" not in msg_cols:
                    conn.execute(text("ALTER TABLE chat_messages ADD COLUMN consultation_id VARCHAR(36)"))
                    conn.commit()

            if "chat_sessions" in table_names:
                session_cols = [c["name"] for c in insp.get_columns("chat_sessions")]
                if "astrologer_id" not in session_cols:
                    conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN astrologer_id VARCHAR(36)"))
                    conn.commit()
                if "consultation_id" not in session_cols:
                    conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN consultation_id VARCHAR(36)"))
                    conn.commit()
                if "status" not in session_cols:
                    conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN status VARCHAR(50) DEFAULT 'active'"))
                    conn.commit()

            if "birth_charts" in table_names:
                chart_cols = [c["name"] for c in insp.get_columns("birth_charts")]
                if "is_default" not in chart_cols:
                    conn.execute(text("ALTER TABLE birth_charts ADD COLUMN is_default BOOLEAN DEFAULT 0"))
                    conn.commit()

            # Per-owner data isolation: every private table carries the owner it belongs to.
            for table in ("consultations", "chat_sessions", "birth_charts", "bookings"):
                if table in table_names:
                    cols = [c["name"] for c in insp.get_columns(table)]
                    if "owner_key" not in cols:
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN owner_key VARCHAR(80)"))
                        conn.commit()
                    conn.execute(text(f"CREATE INDEX IF NOT EXISTS ix_{table}_owner_key ON {table} (owner_key)"))
                    # Signed-in users keep their history; rows with no user were shared between all visitors
                    # and cannot be attributed to anyone, so they stay unowned (and therefore invisible).
                    conn.execute(text(f"UPDATE {table} SET owner_key = 'u:' || user_id WHERE owner_key IS NULL AND user_id IS NOT NULL"))
                    conn.commit()

            # Mandir Seva / Astro Mall columns added after the first release.
            extra_cols = {
                "users": {"loyalty_points": "INTEGER DEFAULT 0", "referral_code": "VARCHAR(12)", "referred_by": "VARCHAR(36)"},
                "temples": {"live_url": "VARCHAR(500)", "aarti_timings": "TEXT"},
                "marketplace_products": {"listing_status": "VARCHAR(12) DEFAULT 'APPROVED'", "option_groups": "TEXT", "extra_images": "TEXT", "certificate_status": "VARCHAR(20) DEFAULT 'NONE'",
                                         "certificate_code": "VARCHAR(24)", "certificate_file": "VARCHAR(500)",
                                         "certificate_lab": "VARCHAR(120)", "certificate_number": "VARCHAR(80)",
                                         "return_days": "INTEGER DEFAULT 7"},
                "notifications": {"kind": "VARCHAR(40)", "params": "TEXT"},
                "chadawa_bookings": {"payment_method": "VARCHAR(30)", "payment_ref": "VARCHAR(100)",
                                     "scheduled_for": "VARCHAR(40)", "video_recorded_at": "DATETIME",
                                     "family_members": "TEXT", "priest_id": "VARCHAR(36)", "coupon_code": "VARCHAR(30)",
                                     "discount_amount": "FLOAT DEFAULT 0", "points_used": "INTEGER DEFAULT 0",
                                     "package_ref": "VARCHAR(40)", "certificate_code": "VARCHAR(24)",
                                     "completed_at": "DATETIME"},
                "marketplace_orders": {"unit_price": "FLOAT", "payment_method": "VARCHAR(30)", "payment_ref": "VARCHAR(100)",
                                       "order_status": "VARCHAR(50)", "energization_status": "VARCHAR(50)",
                                       "group_ref": "VARCHAR(40)", "options": "TEXT", "discount_amount": "FLOAT DEFAULT 0",
                                       "points_used": "INTEGER DEFAULT 0", "coupon_code": "VARCHAR(30)",
                                       "seller_id": "VARCHAR(36)", "commission_amount": "FLOAT DEFAULT 0",
                                       "seller_amount": "FLOAT DEFAULT 0", "payout_id": "VARCHAR(36)"},
            }
            for table, cols_map in extra_cols.items():
                if table in table_names:
                    have = [c["name"] for c in insp.get_columns(table)]
                    for col, ddl in cols_map.items():
                        if col not in have:
                            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {ddl}"))
                            conn.commit()

            if "users" in table_names:
                user_cols = [c["name"] for c in insp.get_columns("users")]
                if "phone" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(50)"))
                    conn.commit()
                if "wallet_balance" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN wallet_balance FLOAT DEFAULT 250.0"))
                    conn.commit()
    except Exception:
        pass

    # Seed default astrologers if database is ready
    try:
        db = SessionLocal()
        from packages.database.seed_astrologers import seed_astrologers
        seed_astrologers(db)
        db.close()
    except Exception:
        pass
