"""
End-to-end smoke and integration tests for AstroAI Agent API.
"""
import pytest
from fastapi.testclient import TestClient
from website.backend.app.main import app

client = TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"})

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "app_name" in data
    assert "demo_mode" in data

def test_readiness_endpoint():
    response = client.get("/api/v1/readiness")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("ready", "degraded")
    assert "database" in data["components"]
    assert "astrology_engine" in data["components"]

def test_calculate_chart_api():
    payload = {
        "name": "Integration Test Subject",
        "date_of_birth": "1995-04-14",
        "time_of_birth": "14:30:00",
        "is_time_approximate": False,
        "latitude": 28.6139,
        "longitude": 77.2090,
        "timezone_offset": 5.5,
        "city": "New Delhi",
        "country": "India",
        "system": "Vedic",
        "ayanamsa": "Lahiri"
    }
    response = client.post("/api/v1/charts/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Integration Test Subject"
    assert "chart_data" in data
    assert data["chart_data"]["ascendant_sign"] != ""
    assert len(data["chart_data"]["planets"]) >= 11
    assert "id" in data
    return data["id"]

def test_agent_tools_listing_and_execution():
    # 1. Listing tools
    response = client.get("/api/v1/agent/tools")
    assert response.status_code == 200
    tools = response.json()
    assert len(tools) >= 5
    tool_names = [t["name"] for t in tools]
    assert "calculate_birth_chart" in tool_names
    assert "evaluate_compatibility_rules" in tool_names

    # 2. Executing compatibility tool
    payload = {
        "tool_name": "evaluate_compatibility_rules",
        "arguments": {
            "person1_moon_sign": "Taurus",
            "person1_nakshatra": "Rohini",
            "person2_moon_sign": "Virgo",
            "person2_nakshatra": "Hasta"
        }
    }
    exec_resp = client.post("/api/v1/agent/execute", json=payload)
    assert exec_resp.status_code == 200
    exec_data = exec_resp.json()
    assert exec_data["status"] == "success"
    assert exec_data["result"]["compatibility_index_score"] > 50

def test_chat_interaction():
    payload = {
        "message": "What is the nature of Jupiter (Brihaspati) in Vedic astrology?",
        "language": "en",
        "force_demo_mode": True
    }
    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "assistant"
    assert len(data["content"]) > 20
    assert data["is_demo_mode"] is True
    assert "citations" in data

def test_documents_listing():
    response = client.get("/api/v1/documents")
    assert response.status_code == 200
    docs = response.json()
    assert isinstance(docs, list)
