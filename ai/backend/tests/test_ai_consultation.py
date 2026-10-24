"""
Domain Test Suite for AI Backend
Verifies AI Consultation, streaming chat, astrologer personas, and RAG endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from ai.backend.app.main import app

client = TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"})

def test_ai_backend_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "version" in data

def test_ai_consultation_creation():
    payload = {
        "astrologer_id": "pt-rameshwar-dwivedi",
        "language": "hi",
        "title": "Kundli Consultation Test"
    }
    res = client.post("/api/v1/consultations", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    assert data["astrologer_id"]
    assert data["status"] == "active"

def test_ai_chat_message_validation():
    # Sending empty message should be rejected with 422 Unprocessable Entity
    res = client.post("/api/v1/chat", json={})
    assert res.status_code == 422
