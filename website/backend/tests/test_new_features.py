"""
Tests for new AstroAI features:
1. Kundali Milan (36 Gunas Ashtakoota & Manglik Dosha)
2. Daily Aaj Ka Panchang (Tithi, Nakshatra, Muhurat, Rahu Kaal)
3. Shani Sade Sati & Transit Tracker
4. Multiple Astrologer Personas
5. Real-time Streaming Consultation (SSE)
"""
import pytest
from fastapi.testclient import TestClient
from website.backend.app.main import app

client = TestClient(app)

def test_astrologer_personas_api():
    res = client.get("/api/v1/chat/astrologers")
    assert res.status_code == 200
    personas = res.json()
    assert len(personas) >= 3
    ids = [p["id"] for p in personas]
    assert "acharya_shastri" in ids
    assert "dr_sunita" in ids
    assert "pandit_maharaj" in ids

def test_kundali_milan_api():
    payload = {
        "boy": {
            "name": "Rahul Sharma",
            "date_of_birth": "1995-05-15",
            "time_of_birth": "14:30:00",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "timezone_offset": 5.5,
            "city": "New Delhi"
        },
        "girl": {
            "name": "Priya Verma",
            "date_of_birth": "1997-08-22",
            "time_of_birth": "10:15:00",
            "latitude": 19.0760,
            "longitude": 72.8777,
            "timezone_offset": 5.5,
            "city": "Mumbai"
        }
    }
    res = client.post("/api/v1/charts/milan", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "total_score" in data
    assert "kootas" in data
    assert len(data["kootas"]) == 8
    assert "manglik_compatibility" in data
    assert data["max_score"] == 36.0
    assert data["total_score"] >= 0.0

def test_daily_panchang_api():
    res = client.get("/api/v1/charts/panchang?latitude=28.6139&longitude=77.2090")
    assert res.status_code == 200
    data = res.json()
    assert "tithi" in data
    assert "nakshatra" in data
    assert "yog" in data
    assert "karan" in data
    assert "timings" in data
    assert "abhijit_muhurat" in data["timings"]
    assert "rahu_kaal" in data["timings"]

def test_sade_sati_api():
    # Test for Pisces (Peak Phase)
    res_pisces = client.post("/api/v1/charts/sade-sati", json={"moon_sign": "Pisces"})
    assert res_pisces.status_code == 200
    d_pisces = res_pisces.json()
    assert d_pisces["is_sade_sati"] is True
    assert d_pisces["phase_code"] == "peak"
    assert len(d_pisces["remedies"]) > 0

    # Test for Aries (Rising Phase)
    res_aries = client.post("/api/v1/charts/sade-sati", json={"moon_sign": "Aries"})
    assert res_aries.status_code == 200
    d_aries = res_aries.json()
    assert d_aries["is_sade_sati"] is True
    assert d_aries["phase_code"] == "rising"

    # Test for Leo (Free)
    res_leo = client.post("/api/v1/charts/sade-sati", json={"moon_sign": "Leo"})
    assert res_leo.status_code == 200
    d_leo = res_leo.json()
    assert d_leo["is_sade_sati"] is False
    assert d_leo["phase_code"] == "favorable"

def test_chat_streaming_api():
    payload = {
        "message": "Namaste",
        "language": "hi",
        "astrologer_id": "dr_sunita",
        "force_demo_mode": True
    }
    with client.stream("POST", "/api/v1/chat/stream", json=payload) as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        events = []
        for line in response.iter_lines():
            if line and line.startswith("data: "):
                events.append(line)
        assert len(events) >= 2
