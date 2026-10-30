"""One scheduled reminder sweep for deployments with an external scheduler."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from packages.database.session import init_db, SessionLocal
from packages.core.advanced import send_due

if __name__ == "__main__":
    init_db()
    with SessionLocal() as db:
        send_due(db)
