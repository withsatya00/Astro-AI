"""
Premium experience: daily brief, remedies tracker, gift cards, festival packs, membership benefits,
referral milestones, astrologer trust signals and the Kundali Milan PDF.
"""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from packages.core.security import create_access_token
from packages.database.models import Astrologer, Booking, LoyaltyEntry, Membership, User
from packages.database.session import SessionLocal, init_db
from website.backend.app.main import app

GUEST = {"X-Client-Id": "test-premium-123456789abcdef"}
BIRTH = {"name": "Rahul", "date_of_birth": "1992-05-14", "time_of_birth": "08:30:00", "latitude": 28.6139, "longitude": 77.2090,
         "timezone_offset": 5.5, "city": "Delhi", "country": "India"}


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app, headers=GUEST) as c:
        yield c


def _make_user(balance=50000.0):
    db = SessionLocal()
    try:
        u = User(email=f"{uuid.uuid4().hex[:10]}@test.in", full_name="Test User", hashed_password="x", role="client",
                 wallet_balance=balance, is_active=True)
        db.add(u)
        db.commit()
        uid = u.id
    finally:
        db.close()
    return uid, {"Authorization": f"Bearer {create_access_token(data={'sub': uid, 'role': 'client'})}"}


def _wallet(uid):
    db = SessionLocal()
    try:
        return db.query(User).filter(User.id == uid).first().wallet_balance
    finally:
        db.close()




# --------------------------------------------------------------------------------------------- daily brief
def test_daily_brief_requires_login_and_personalises(client):
    assert client.get("/api/v1/experience/daily-brief").status_code == 401
    uid, auth = _make_user()
    plain = client.get("/api/v1/experience/daily-brief", headers=auth).json()
    assert plain["has_profile"] is False and plain["panchang"]["tithi"] and plain["deity"]["temple_slug"]

    assert client.post("/api/v1/charts/calculate", json=BIRTH, headers=auth).status_code in (200, 201)
    brief = client.get("/api/v1/experience/daily-brief", headers=auth).json()
    assert brief["has_profile"] is True
    assert brief["profile"]["moon_sign"] == "Virgo" and brief["profile"]["lord"] == "Mercury"
    assert 20 <= brief["score"] <= 96
    assert 1 <= brief["chandra_bala"]["house"] <= 12 and isinstance(brief["tara_bala"]["favourable"], bool)
    assert brief["dasha"]["planet"] in {"Mars", "Rahu", "Jupiter", "Saturn", "Mercury", "Ketu", "Venus", "Sun", "Moon"}
    assert brief["remedy"]["gem"] == "Emerald"


# --------------------------------------------------------------------------------------------- remedies tracker
def test_remedy_checkin_streak_completion_and_privacy(client):
    uid, auth = _make_user()
    _, other = _make_user()
    body = {"title": "Hanuman Chalisa", "kind": "mantra", "frequency": "daily", "target_days": 2}
    task = client.post("/api/v1/experience/remedies", json=body, headers=auth).json()
    assert client.post("/api/v1/experience/remedies", json=body, headers=auth).status_code == 409
    assert client.post("/api/v1/experience/remedies", json={**body, "title": "x", "kind": "bogus"}, headers=auth).status_code == 422

    assert client.post(f"/api/v1/experience/remedies/{task['id']}/checkin", headers=other).status_code == 404
    done = client.post(f"/api/v1/experience/remedies/{task['id']}/checkin", headers=auth).json()
    assert done["done_today"] and done["streak"] == 1 and done["done_count"] == 1
    again = client.post(f"/api/v1/experience/remedies/{task['id']}/checkin", headers=auth).json()
    assert again["done_count"] == 1                     # a second tap on the same day does not count twice

    undone = client.delete(f"/api/v1/experience/remedies/{task['id']}/checkin", headers=auth).json()
    assert not undone["done_today"] and undone["done_count"] == 0

    one_day = client.post("/api/v1/experience/remedies", json={**body, "title": "One day", "target_days": 1}, headers=auth).json()
    finished = client.post(f"/api/v1/experience/remedies/{one_day['id']}/checkin", headers=auth).json()
    assert finished["status"] == "completed"

    listing = client.get("/api/v1/experience/remedies", headers=auth).json()
    assert len(listing["tasks"]) == 2 and listing["suggestions"] and listing["best_streak"] >= 1
    assert client.get("/api/v1/experience/remedies", headers=other).json()["tasks"] == []
    assert client.delete(f"/api/v1/experience/remedies/{task['id']}", headers=auth).json()["success"]


def test_streak_counts_consecutive_days_and_weeks():
    from website.backend.app.api.experience import _streak
    today = datetime.now(timezone(timedelta(hours=5, minutes=30))).date()
    days = [(today - timedelta(days=i)).isoformat() for i in (0, 1, 2, 4)]
    assert _streak(days, "daily", today) == 3
    assert _streak([(today - timedelta(days=1)).isoformat()], "daily", today) == 1   # yesterday still keeps the streak alive
    assert _streak([(today - timedelta(days=3)).isoformat()], "daily", today) == 0
    assert _streak([(today - timedelta(days=7 * i)).isoformat() for i in range(3)], "weekly", today) == 3
    assert _streak([], "daily", today) == 0


# --------------------------------------------------------------------------------------------- gift cards
def test_gift_card_purchase_redeem_once_and_ledger(client):
    buyer, b_auth = _make_user(1000)
    friend, f_auth = _make_user(0)
    assert client.post("/api/v1/experience/gifts/buy", json={"amount": 333, "theme": "blessing"}, headers=b_auth).status_code == 422
    poor_id, poor = _make_user(10)
    assert client.post("/api/v1/experience/gifts/buy", json={"amount": 501, "theme": "blessing"}, headers=poor).status_code == 402
    assert _wallet(poor_id) == 10

    card = client.post("/api/v1/experience/gifts/buy", json={"amount": 501, "theme": "diwali", "recipient_name": "Anita", "message": "Shubh Diwali"},
                       headers=b_auth).json()
    assert card["code"].startswith("AJ-") and _wallet(buyer) == 499

    assert client.post("/api/v1/experience/gifts/redeem", json={"code": "AJ-NOPE-NOPE-NOPE"}, headers=f_auth).status_code == 404
    ok = client.post("/api/v1/experience/gifts/redeem", json={"code": card["code"].lower()}, headers=f_auth)
    assert ok.status_code == 200 and ok.json()["amount"] == 501 and _wallet(friend) == 501
    assert client.post("/api/v1/experience/gifts/redeem", json={"code": card["code"]}, headers=b_auth).status_code == 409
    assert _wallet(buyer) == 499 and _wallet(friend) == 501

    sent = client.get("/api/v1/experience/gifts", headers=b_auth).json()["sent"]
    assert sent[0]["status"] == "REDEEMED"
    got = client.get("/api/v1/experience/gifts", headers=f_auth).json()["received"]
    assert got[0]["amount"] == 501 and got[0]["code"] is None


# --------------------------------------------------------------------------------------------- festival packs
def test_festival_packs_have_products_and_working_coupons(client):
    packs = client.get("/api/v1/experience/festival-packs").json()["packs"]
    assert packs, "expected at least one pack with matching catalog items"
    for p in packs:
        assert p["products"] and p["total"] > 0 and p["save"] <= 500
        if p["days_left"] is not None:
            assert p["days_left"] >= 0
    uid, auth = _make_user()
    pack = packs[0]
    check = client.post("/api/v1/rewards/coupons/validate", json={"code": pack["coupon"], "scope": "mall", "amount": 2000}, headers=auth)
    assert check.status_code == 200 and check.json()["discount"] > 0


# --------------------------------------------------------------------------------------------- membership + referral
def test_member_gets_appointment_discount_priority_and_one_monthly_bonus(client):
    uid, auth = _make_user(10000)
    assert client.post("/api/v1/rewards/membership/claim-bonus", headers=auth).status_code == 403
    db = SessionLocal()
    try:
        astro = db.query(Astrologer).filter(Astrologer.is_ai == False, Astrologer.price_per_minute > 0).first()  # noqa: E712
        astro_id, rate = astro.id, astro.price_per_minute
    finally:
        db.close()

    def book(hours):
        when = (datetime.now(timezone.utc) + timedelta(days=30 + hours)).strftime("%Y-%m-%dT%H:%M:00Z")
        return client.post("/api/v1/wallet/bookings", headers=auth, json={"astrologer_id": astro_id, "user_name": "T", "user_phone": "9876543210",
                                                                          "scheduled_at": when, "duration_minutes": 15, "mode": "chat"})
    normal = book(1)
    assert normal.status_code == 200, normal.text
    assert normal.json()["total_amount"] == round(rate * 15, 2) and normal.json()["priority"] is False

    assert client.post("/api/v1/rewards/membership", json={"plan": "monthly"}, headers=auth).status_code == 200
    member = book(5)
    assert member.status_code == 200, member.text
    assert member.json()["total_amount"] == round(rate * 15 * 0.9, 2) and member.json()["priority"] is True and member.json()["member_discount"] > 0

    summary = client.get("/api/v1/rewards/summary", headers=auth).json()
    assert summary["benefits"]["active"] and summary["benefits"]["saved_consultations"] == member.json()["member_discount"]
    before = _wallet(uid)
    assert client.post("/api/v1/rewards/membership/claim-bonus", headers=auth).json()["amount"] == 100
    assert _wallet(uid) == before + 100
    assert client.post("/api/v1/rewards/membership/claim-bonus", headers=auth).status_code == 409


def test_referral_stats_and_milestone_awarded_once(client):
    from packages.core.pricing import maybe_reward_referral
    ref_id, ref_auth = _make_user()
    code = client.get("/api/v1/rewards/summary", headers=ref_auth).json()["referral_code"]
    db = SessionLocal()
    try:
        for i in range(3):
            fid, f_auth = _make_user()
            assert client.post("/api/v1/rewards/referral", json={"code": code}, headers=f_auth).status_code == 200
            friend = db.query(User).filter(User.id == fid).first()
            assert maybe_reward_referral(db, friend, f"T{i}")
            db.commit()
            assert not maybe_reward_referral(db, friend, f"T{i}")      # a friend only counts once
            db.commit()
        entries = db.query(LoyaltyEntry).filter(LoyaltyEntry.user_id == ref_id).all()
        assert sum(1 for e in entries if e.reason == "referral_milestone_3") == 1
        assert sum(e.points for e in entries) == 3 * 100 + 150
    finally:
        db.close()
    stats = client.get("/api/v1/rewards/referrals", headers=ref_auth).json()
    assert stats["joined"] == 3 and stats["completed"] == 3 and stats["points_earned"] == 450
    assert [m["reached"] for m in stats["milestones"]] == [True, False, False]
    assert all("@" not in f["name"] and len(f["name"]) >= 3 for f in stats["friends"])


# --------------------------------------------------------------------------------------------- trust + milan pdf
def test_astrologer_trust_uses_real_records_and_hides_thin_data(client):
    slug = client.get("/api/v1/astrologers").json()["items"][0]["slug"]
    trust = client.get(f"/api/v1/astrologers/{slug}/trust").json()
    assert trust["verified"] in (True, False) and set(trust["rating_spread"]) == {"1", "2", "3", "4", "5"}
    assert trust["repeat_client_percent"] is None or 0 <= trust["repeat_client_percent"] <= 100
    assert client.get("/api/v1/astrologers/does-not-exist/trust").status_code == 404


def test_milan_pdf_download(client):
    partner = {"name": "A", "date_of_birth": "1992-05-14", "time_of_birth": "08:30:00", "latitude": 28.6, "longitude": 77.2, "timezone_offset": 5.5}
    res = client.post("/api/v1/charts/milan/pdf", json={"boy": partner, "girl": {**partner, "name": "B", "date_of_birth": "1994-02-03"}})
    assert res.status_code == 200 and res.headers["content-type"] == "application/pdf" and res.content.startswith(b"%PDF")


def test_saved_astrologers_toggle_and_privacy(client):
    assert client.get("/api/v1/experience/favourites").status_code == 401
    uid, auth = _make_user()
    _, other = _make_user()
    slug = client.get("/api/v1/astrologers").json()["items"][0]["slug"]
    saved = client.put(f"/api/v1/experience/favourites/{slug}", headers=auth).json()
    assert saved["saved"] is True
    client.put(f"/api/v1/experience/favourites/{saved['astrologer_id']}", headers=auth)      # saving twice stays one row
    assert client.get("/api/v1/experience/favourites", headers=auth).json()["ids"] == [saved["astrologer_id"]]
    assert client.get("/api/v1/experience/favourites", headers=other).json()["ids"] == []
    assert client.put("/api/v1/experience/favourites/nobody", headers=auth).status_code == 404
    assert client.delete(f"/api/v1/experience/favourites/{slug}", headers=auth).json()["saved"] is False
    assert client.get("/api/v1/experience/favourites", headers=auth).json()["ids"] == []
