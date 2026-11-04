"""Make an existing account an administrator (or remove the role). Needed to open /bhakti/admin.

Usage:
    python scripts/make_admin.py you@example.com            # grant admin
    python scripts/make_admin.py you@example.com --remove   # back to a normal account

The person must already have registered on the site. The change is made in the database the app uses (DATABASE_URL, by default
./astro_ai.db), so run this from the project folder, with the same environment as the backend.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from packages.database.models import User  # noqa: E402
from packages.database.session import SessionLocal  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("email")
    ap.add_argument("--remove", action="store_true", help="remove the admin role instead of granting it")
    args = ap.parse_args()
    email = args.email.strip().lower()
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"No account found for {email}. Register on the site first, then run this again.")
            return 1
        user.role = "client" if args.remove else "admin"
        db.commit()
        print(f"{email} is now: {user.role}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
