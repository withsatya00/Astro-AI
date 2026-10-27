"""Promote an existing user to admin: python scripts/make_admin.py user@example.com"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from packages.database.models import User  # noqa: E402
from packages.database.session import SessionLocal, init_db  # noqa: E402


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    init_db()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == sys.argv[1].strip().lower()).first()
        if not user:
            print(f"No user with email {sys.argv[1]}. Register on the site first.")
            return 1
        user.role = "admin"
        db.commit()
        print(f"{user.email} is now an admin. Sign out and sign in again to refresh the session.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
