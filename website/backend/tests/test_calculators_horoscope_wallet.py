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

    res_recharge = client.post("/api/v1/wallet/recharge", json={
        "amount": 500.0,
        "payment_method": "UPI Test"
    })
    assert res_recharge.status_code == 200
    assert res_recharge.json()["status"] == "success"
    assert res_recharge.json()["amount_added"] == 500.0

def test_astrologer_booking_lifecycle(client):
    # Book appointment with Acharya Shastri
    res_bkg = client.post("/api/v1/wallet/bookings", json={
        "astrologer_id": "acharya-shastri",
        "user_name": "Test Client",
        "user_phone": "+91 9876543210",
        "scheduled_at": "2026-10-25 10:30",
        "duration_minutes": 15,
        "mode": "chat",
        "concern": "Career promotion timing"
    })
    assert res_bkg.status_code == 200
    b_data = res_bkg.json()
    assert b_data["status"] == "confirmed"
    booking_id = b_data["booking_id"]

    # List bookings
    res_list = client.get("/api/v1/wallet/bookings")
    assert res_list.status_code == 200
    assert any(b["id"] == booking_id for b in res_list.json())

    # Cancel booking
    res_cancel = client.post(f"/api/v1/wallet/bookings/{booking_id}/cancel")
    assert res_cancel.status_code == 200
    assert res_cancel.json()["status"] == "cancelled"
