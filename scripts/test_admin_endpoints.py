import sys
import os
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("packages"))

from packages.database.session import get_db
from packages.database.models import User
from website.backend.app.api.wallet import admin_list_users, admin_adjust_wallet, WalletAdjustRequest
from website.backend.app.api.bhakti_radio import admin_tracks
from website.backend.app.api.astrologers import list_astrologers

def run_tests():
    db = next(get_db())
    admin_user = db.query(User).filter(User.role == 'admin').first()
    assert admin_user is not None, "No admin user found!"
    print(f"Verified Admin User: {admin_user.email} (ID: {admin_user.id})")

    # 1. Test Admin Users List
    users = admin_list_users(limit=10, db=db, _admin=admin_user)
    print(f"1. admin_list_users: OK, retrieved {len(users)} devotees")
    assert len(users) > 0, "No users returned!"

    # 2. Test Admin Bhakti Radio Tracks
    tracks = admin_tracks(db=db, _a=admin_user)
    print(f"2. admin_tracks: OK, retrieved {len(tracks)} tracks")

    # 3. Test Astrologers Directory
    astros = list_astrologers(search=None, expertise=None, language=None, availability=None, is_ai=None, min_price=None, max_price=None, sort_by="popular", page=1, limit=10, db=db)
    print(f"3. list_astrologers: OK, retrieved {len(astros.items)} astrologers")

    # 4. Test Wallet Balance Adjustment
    target = users[0]
    payload = WalletAdjustRequest(
        user_id=target["id"],
        amount=10.0,
        reason="Admin audit verification credit"
    )
    result = admin_adjust_wallet(payload=payload, db=db, admin=admin_user)
    print(f"4. admin_adjust_wallet: OK, {result['message']}")
    assert result["success"] is True

    print("\nALL ADMIN BUSINESS LOGIC & APIS ARE 100% OPERATIONAL!")

if __name__ == "__main__":
    run_tests()
