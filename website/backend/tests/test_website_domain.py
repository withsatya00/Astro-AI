"""
Domain Test Suite for Website Backend
Verifies Astrologers Directory, Calculators, Horoscope, and Reports endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from website.backend.app.main import app

client = TestClient(app)

def test_website_backend_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"

def test_website_astrologers_directory():
    res = client.get("/api/v1/astrologers")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert len(data["items"]) > 0
    names = [a["name"] for a in data["items"]]
    assert any("Rameshwar" in n for n in names)

def test_website_horoscope_api():
    res = client.get("/api/v1/horoscope/aries")
    assert res.status_code == 200
    data = res.json()
    assert data["rashi"].lower() == "aries"
    assert "overview" in data

def test_website_calculator():
    payload = {
        "date_of_birth": "1992-05-14",
        "time_of_birth": "08:30:00"
    }
    res = client.post("/api/v1/calculators/kaal-sarp", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "has_dosha" in data
    assert "verdict" in data
