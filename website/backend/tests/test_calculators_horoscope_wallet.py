"""
Comprehensive test suite for Vedic Calculators, Panchang Expansion,
Horoscope, Wallet & Astrologer Bookings.
"""
import pytest
from fastapi.testclient import TestClient
from website.backend.app.main import app
from packages.database.session import init_db

@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"}) as c:
        yield c

# ----------------- Calculator Tests -----------------
def test_calculator_numerology(client):
    res = client.post("/api/v1/calculators/numerology", json={
        "date_of_birth": "1990-10-15",
        "full_name": "Aarav Sharma"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["mulank"] == 6  # 1+5 = 6
    assert data["bhagyank"] == 8  # 1+9+9+0+1+0+1+5 = 26 -> 8
    assert "Venus" in data["ruling_planet"]
    assert len(data["compatible_numbers"]) > 0

def test_calculator_name_numerology(client):
    res = client.post("/api/v1/calculators/name-numerology", json={
        "name": "Devendra"
    })
    assert res.status_code == 200
    data = res.json()
    assert "chaldean_destiny" in data
    assert "pythagorean_destiny" in data
    assert data["chaldean_destiny"] >= 1 and data["chaldean_destiny"] <= 9

def test_calculator_sun_sign(client):
    res = client.post("/api/v1/calculators/sun-sign", json={
        "date_of_birth": "1994-04-18"
    })
    assert res.status_code == 200
    data = res.json()
    assert "Aries" in data["vedic_sun_sign"] or "Mesha" in data["vedic_sanskrit"]

def test_calculator_moon_sign(client):
    res = client.post("/api/v1/calculators/moon-sign", json={
        "date_of_birth": "1992-05-14",
        "time_of_birth": "08:30:00"
    })
    assert res.status_code == 200
    data = res.json()
    assert "moon_sign" in data
    assert "nakshatra" in data

def test_calculator_rising_sign(client):
    res = client.post("/api/v1/calculators/rising-sign", json={
        "date_of_birth": "1992-05-14",
        "time_of_birth": "08:30:00"
    })
    assert res.status_code == 200
    data = res.json()
    assert "lagna_sign" in data
    assert "degree" in data

def test_calculator_nakshatra(client):
    res = client.post("/api/v1/calculators/nakshatra", json={
        "date_of_birth": "1992-05-14",
        "time_of_birth": "08:30:00"
    })
    assert res.status_code == 200
    data = res.json()
    assert "nakshatra" in data
    assert "recommended_naming_syllable" in data
    assert data["pada"] in [1, 2, 3, 4]

def test_calculator_mangal_dosha(client):
    res = client.post("/api/v1/calculators/mangal-dosha", json={
        "date_of_birth": "1992-05-14",
        "time_of_birth": "08:30:00"
    })
    assert res.status_code == 200
    data = res.json()
    assert "is_manglik" in data
    assert "verdict" in data
    assert "remedies" in data

def test_calculator_jaimini_karakas(client):
    res = client.post("/api/v1/calculators/jaimini-karakas", json={
        "date_of_birth": "1992-05-14",
        "time_of_birth": "08:30:00"
    })
    assert res.status_code == 200
    data = res.json()
    assert "atmakaraka" in data
    assert "darakaraka" in data
    assert len(data["all_karakas"]) == 7

def test_calculator_kaal_sarp(client):
    res = client.post("/api/v1/calculators/kaal-sarp", json={
        "date_of_birth": "1992-05-14",
        "time_of_birth": "08:30:00"
    })
    assert res.status_code == 200
    data = res.json()
    assert "has_dosha" in data
    assert "verdict" in data

def test_calculator_moon_phase(client):
    res = client.get("/api/v1/calculators/moon-phase")
    assert res.status_code == 200
    data = res.json()
    assert "illumination_percentage" in data
    assert "paksha" in data
    assert "days_to_purnima" in data

def test_calculator_love_and_friendship(client):
    res_f = client.post("/api/v1/calculators/friendship-compatibility", json={
        "sign_1": "Aries",
        "sign_2": "Leo"
    })
    assert res_f.status_code == 200
    assert res_f.json()["compatibility_score"] >= 80

    res_l = client.post("/api/v1/calculators/love-compatibility", json={
        "sign_1": "Cancer",
        "sign_2": "Scorpio",
        "partner_1_name": "Rohan",
        "partner_2_name": "Pooja"
    })
    assert res_l.status_code == 200
    assert res_l.json()["love_score"] >= 85

# ----------------- Panchang Tests -----------------
def test_panchang_with_choghadiya_and_muhurats(client):
    res = client.get("/api/v1/charts/panchang")
    assert res.status_code == 200
    data = res.json()
    assert "choghadiya_day" in data
    assert len(data["choghadiya_day"]) == 8
    assert "shubh_muhurats" in data
    assert len(data["shubh_muhurats"]) >= 3
    assert "tithi" in data

# ----------------- Horoscope Tests -----------------
def test_horoscope_all_rashis_and_detail(client):
    res_list = client.get("/api/v1/horoscope")
    assert res_list.status_code == 200
    assert len(res_list.json()) == 12

    res_aries = client.get("/api/v1/horoscope/Aries?timeframe=daily")
    assert res_aries.status_code == 200
    data = res_aries.json()
    assert data["rashi"] == "Aries"
    assert "career" in data
    assert "love" in data
    assert "lucky_number" in data
    assert "share_summary" in data

# ----------------- Wallet & Bookings Tests -----------------
def test_wallet_status_and_recharge(client):
    res = client.get("/api/v1/wallet")
    assert res.status_code == 200
    data = res.json()
    assert "balance" in data
    assert data["currency"] == "INR"
    assert data["balance"] == 0
    assert data["transactions"] == []

    res_recharge = client.post("/api/v1/wallet/recharge", json={
        "amount": 500.0,
        "payment_method": "UPI Test"
    })
    assert res_recharge.status_code == 401

    # New accounts start empty; recharge receipts belong only to that account.
    import uuid
    from packages.database.models import User
    from packages.database.session import SessionLocal
    from packages.core.security import create_access_token
    with SessionLocal() as db:
        user = User(email=f"wallet-{uuid.uuid4().hex}@test.in", hashed_password="test", full_name="Wallet User")
        db.add(user)
        db.commit()
        assert user.wallet_balance == 0
        headers = {"Authorization": f"Bearer {create_access_token({'sub': user.id})}"}
    assert client.get('/api/v1/wallet', headers=headers).json()['balance'] == 0
    res_recharge = client.post('/api/v1/wallet/recharge', headers=headers, json={"amount": 500, "payment_method": "UPI Test"})
    assert res_recharge.status_code == 200
    assert res_recharge.json()["status"] == "success"
    assert res_recharge.json()["amount_added"] == 500.0
    wallet = client.get('/api/v1/wallet', headers=headers).json()
    assert wallet['balance'] == 500
    assert wallet['transactions'][0]['amount'] == 500
    assert wallet['transactions'][0]['reference_id'] == res_recharge.json()['transaction_id']
    assert wallet['transactions'][0]['created_at'].endswith('+00:00')
    assert client.get('/api/v1/wallet').json()['transactions'] == []

def _funded_headers(balance):
    import uuid
    from packages.database.models import User
    from packages.database.session import SessionLocal
    from packages.core.security import create_access_token
    with SessionLocal() as db:
        user = User(email=f"book-{uuid.uuid4().hex}@test.in", hashed_password="test", full_name="Booking User", wallet_balance=balance)
        db.add(user)
        db.commit()
        return {"Authorization": f"Bearer {create_access_token({'sub': user.id})}"}


def _booking(astro="acharya-anand-joshi", when=None, **extra):
    from datetime import datetime, timedelta
    when = when or (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d 10:30")
    return {"astrologer_id": astro, "user_name": "Test Client", "scheduled_at": when,
            "duration_minutes": 15, "mode": "chat", "concern": "Career promotion timing", **extra}


def test_astrologer_booking_lifecycle(client):
    # Guests cannot book: every appointment belongs to a signed-in account.
    assert client.post("/api/v1/wallet/bookings", json=_booking()).status_code == 401

    headers = _funded_headers(5000)
    res_bkg = client.post("/api/v1/wallet/bookings", headers=headers, json=_booking(astro="dr-meenakshi-iyer"))
    assert client.get("/api/v1/wallet", headers=headers).json()["balance"] == 5000 - 600
    assert res_bkg.status_code == 200, res_bkg.text
    b_data = res_bkg.json()
    assert b_data["status"] == "confirmed"
    booking_id = b_data["booking_id"]

    res_list = client.get("/api/v1/wallet/bookings", headers=headers)
    assert any(b["id"] == booking_id and b["can_cancel"] for b in res_list.json())
    notes = client.get("/api/v1/notifications", headers=headers).json()["notifications"]
    assert any(n["title"] == "Consultation confirmed" for n in notes)

    res_cancel = client.post(f"/api/v1/wallet/bookings/{booking_id}/cancel", headers=headers)
    assert res_cancel.status_code == 200
    assert res_cancel.json()["status"] == "cancelled"
    wallet = client.get("/api/v1/wallet", headers=headers).json()
    assert wallet["balance"] == 5000
    assert wallet["transactions"][0]["type"] == "refund"


def test_booking_validation_rules(client):
    headers = _funded_headers(5000)
    assert client.post("/api/v1/wallet/bookings", headers=headers, json=_booking(astro="acharya-shastri")).status_code == 422  # AI persona
    assert client.post("/api/v1/wallet/bookings", headers=headers, json=_booking(mode="telepathy")).status_code == 422
    assert client.post("/api/v1/wallet/bookings", headers=headers, json=_booking(when="2020-01-01 10:30")).status_code == 422
    assert client.post("/api/v1/wallet/bookings", headers=headers, json=_booking(when="not a date")).status_code == 422

    first = client.post("/api/v1/wallet/bookings", headers=headers, json=_booking(astro="acharya-anand-joshi", when="2031-05-05 11:00"))
    assert first.status_code == 200, first.text
    # Same astrologer, overlapping window, other user: slot is taken. A different time is fine.
    other = _funded_headers(5000)
    assert client.post("/api/v1/wallet/bookings", headers=other, json=_booking(when="2031-05-05 11:10")).status_code == 409
    assert client.post("/api/v1/wallet/bookings", headers=other, json=_booking(when="2031-05-05 12:00")).status_code == 200
    busy = client.get("/api/v1/wallet/bookings/busy", params={"astrologer_id": "acharya-anand-joshi"}).json()["busy"]
    assert any(b["start"].startswith("2031-05-05T05:30") for b in busy)

    # Someone else's appointment can't be cancelled.
    assert client.post(f"/api/v1/wallet/bookings/{first.json()['booking_id']}/cancel", headers=other).status_code == 404


def test_booking_insufficient_balance(client):
    headers = _funded_headers(0)
    res = client.post("/api/v1/wallet/bookings", headers=headers, json=_booking(astro="dr-meenakshi-iyer"))
    assert res.status_code == 402
    assert client.get("/api/v1/wallet", headers=headers).json()["balance"] == 0


def test_admin_consultation_wallet_and_availability_views_are_admin_only(client):
    from packages.database.models import User
    from packages.database.session import SessionLocal
    from packages.core.security import create_access_token
    import uuid
    user_headers = _funded_headers(1000)
    for path in ("/consultations", "/wallet-history", "/astrologers"):
        assert client.get(f"/api/v1/shop-admin{path}").status_code == 403
        assert client.get(f"/api/v1/shop-admin{path}", headers=user_headers).status_code == 403
    with SessionLocal() as db:
        admin = User(email=f"adm-{uuid.uuid4().hex}@test.in", hashed_password="test", role="admin")
        db.add(admin)
        db.commit()
        headers = {"Authorization": f"Bearer {create_access_token({'sub': admin.id})}"}
    booked = client.post("/api/v1/wallet/bookings", headers=user_headers, json=_booking(astro="dr-meenakshi-iyer", when="2032-01-01 10:30"))
    assert booked.status_code == 200, booked.text
    rows = client.get("/api/v1/shop-admin/consultations", headers=headers, params={"q": "test client", "limit": 5}).json()
    assert rows["total"] >= 1 and any(r["id"] == booked.json()["booking_id"] for r in rows["consultations"])
    ledger = client.get("/api/v1/shop-admin/wallet-history", headers=headers, params={"kind": "debit", "limit": 5}).json()
    assert ledger["total"] >= 1 and all(t["type"] == "debit" for t in ledger["transactions"])
    assert client.get("/api/v1/shop-admin/astrologers", headers=headers, params={"q": "shastri"}).json()["total"] >= 1


def test_account_export_and_delete(client):
    headers = _funded_headers(300)
    export = client.get("/api/v1/auth/me/export", headers=headers).json()
    assert export["account"]["full_name"] == "Booking User" and "hashed_password" not in export["account"]
    assert client.get("/api/v1/auth/me/export").status_code in (401, 403)
    # Only the account's own password can delete it, and a remaining balance needs explicit confirmation.
    wrong = client.post("/api/v1/auth/me/delete", headers=headers, json={"password": "nope"})
    assert wrong.status_code == 403
    import uuid
    from packages.database.models import User
    from packages.database.session import SessionLocal
    from website.backend.app.api.auth import get_password_hash
    from packages.core.security import create_access_token
    with SessionLocal() as db:
        u = User(email=f"del-{uuid.uuid4().hex}@test.in", hashed_password=get_password_hash("Right-Pass-1!"), full_name="Del Me", wallet_balance=50)
        db.add(u)
        db.commit()
        uid = u.id
        h = {"Authorization": f"Bearer {create_access_token({'sub': uid})}"}
    assert client.post("/api/v1/auth/me/delete", headers=h, json={"password": "Right-Pass-1!"}).status_code == 409
    assert client.post("/api/v1/auth/me/delete", headers=h, json={"password": "Right-Pass-1!", "confirm_forfeit_balance": True}).status_code == 200
    assert client.get("/api/v1/auth/me", headers=h).status_code in (401, 403)
    with SessionLocal() as db:
        gone = db.query(User).filter(User.id == uid).first()
        assert gone.full_name is None and gone.email.endswith("@deleted.invalid") and gone.is_active is False


def test_razorpay_flow_verifies_signature_ownership_and_is_idempotent(client, monkeypatch):
    import hashlib, hmac
    from website.backend.app.api import wallet as wallet_api
    headers = _funded_headers(0)
    assert client.get("/api/v1/wallet/payment-config").json()["provider"] == "test"
    monkeypatch.setattr(wallet_api.settings, "RAZORPAY_KEY_ID", "rzp_test_x")
    monkeypatch.setattr(wallet_api.settings, "RAZORPAY_KEY_SECRET", "secret")
    assert client.get("/api/v1/wallet/payment-config").json() == {"provider": "razorpay", "key_id": "rzp_test_x"}
    assert client.post("/api/v1/wallet/recharge", headers=headers, json={"amount": 500}).status_code == 409  # no free test credit once live

    me = client.get("/api/v1/auth/me", headers=headers).json()["id"]
    calls = []
    def fake(method, path, **kw):
        calls.append((method, path))
        if method == "POST":
            return {"id": "order_1"}
        return {"id": "order_1", "status": "paid", "amount_paid": 50000, "notes": {"user_id": me}}
    monkeypatch.setattr(wallet_api, "_razorpay", fake)
    assert client.post("/api/v1/wallet/razorpay/order", headers=headers, json={"amount": 500}).json()["amount"] == 50000
    sign = lambda o, p: hmac.new(b"secret", f"{o}|{p}".encode(), hashlib.sha256).hexdigest()
    bad = client.post("/api/v1/wallet/razorpay/verify", headers=headers, json={"razorpay_order_id": "order_1", "razorpay_payment_id": "pay_1", "razorpay_signature": "x"})
    assert bad.status_code == 400
    ok = {"razorpay_order_id": "order_1", "razorpay_payment_id": "pay_1", "razorpay_signature": sign("order_1", "pay_1")}
    assert client.post("/api/v1/wallet/razorpay/verify", headers=headers, json=ok).json()["new_balance"] == 500
    assert client.post("/api/v1/wallet/razorpay/verify", headers=headers, json=ok).json().get("duplicate") is True
    assert client.get("/api/v1/wallet", headers=headers).json()["balance"] == 500
    # Someone else cannot claim this payment.
    other = _funded_headers(0)
    ok2 = {"razorpay_order_id": "order_1", "razorpay_payment_id": "pay_2", "razorpay_signature": sign("order_1", "pay_2")}
    assert client.post("/api/v1/wallet/razorpay/verify", headers=other, json=ok2).status_code == 400
    assert client.get("/api/v1/wallet", headers=other).json()["balance"] == 0
