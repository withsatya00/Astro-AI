"""
Comprehensive test suite for Multi-Astrologer Consultation Platform.
Tests Astrologer Directory, Profiles, Smart Matching, Persistent Consultations,
Auth, Saved Profiles, and Summaries.
"""
import pytest
import uuid
from fastapi.testclient import TestClient
from website.backend.app.main import app
from packages.database.session import SessionLocal, init_db
from packages.database.models import Astrologer, Consultation, User, BirthChart

@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as c:
        yield c

def test_astrologer_directory_list_and_filter(client):
    """Verifies that astrologers are loaded dynamically with search and filters."""
    res = client.get("/api/v1/astrologers")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] >= 8
    assert len(data["items"]) >= 1

    # Filter by language
    res_hindi = client.get("/api/v1/astrologers?language=Hindi")
    assert res_hindi.status_code == 200
    assert res_hindi.json()["total"] >= 1

    # Filter by AI vs Human
    res_ai = client.get("/api/v1/astrologers?is_ai=true")
    assert res_ai.status_code == 200
    assert all(item["is_ai"] is True for item in res_ai.json()["items"])

    res_human = client.get("/api/v1/astrologers?is_ai=false")
    assert res_human.status_code == 200
    assert all(item["is_ai"] is False for item in res_human.json()["items"])

    # Search filter
    res_search = client.get("/api/v1/astrologers?search=Shastri")
    assert res_search.status_code == 200
    assert any("Shastri" in item["name"] for item in res_search.json()["items"])

def test_astrologer_profile_by_slug(client):
    """Verifies retrieving an individual astrologer profile by stable slug."""
    res = client.get("/api/v1/astrologers/acharya-shastri")
    assert res.status_code == 200
    data = res.json()
    assert data["slug"] == "acharya-shastri"
    assert "Acharya Shastri" in data["name"]
    assert data["rating"] >= 4.0
    assert len(data["reviews"]) >= 1

    # Non-existent slug returns 404
    res_404 = client.get("/api/v1/astrologers/non-existent-astrologer-xyz")
    assert res_404.status_code == 404

def test_smart_astrologer_matching(client):
    """Verifies the smart astrologer recommendation matching engine."""
    res = client.get("/api/v1/astrologers/match?concern=love&preferred_language=Hindi")
    assert res.status_code == 200
    data = res.json()
    assert data["concern"] == "love"
    assert len(data["matches"]) >= 1
    top_match = data["matches"][0]
    assert "match_score" in top_match
    assert top_match["match_score"] > 50
    assert len(top_match["match_reasons"]) >= 1

def test_persistent_consultation_lifecycle(client):
    """Verifies consultation session creation, persistence, message exchange, and summary."""
    # 1. Create or resume consultation with Acharya Shastri
    res_create = client.post("/api/v1/consultations", json={
        "astrologer_id": "acharya-shastri",
        "language": "hinglish",
        "initial_message": "Namaste Acharya ji, mera career kaisa rahega?"
    })
    assert res_create.status_code in [200, 201]
    consultation = res_create.json()
    c_id = consultation["id"]
    assert c_id is not None
    assert consultation["astrologer"]["slug"] == "acharya-shastri"
    assert len(consultation["messages"]) >= 2  # user msg + AI assistant response

    # 2. Retrieve history to verify persistence across navigation / simulated reload
    res_get = client.get(f"/api/v1/consultations/{c_id}")
    assert res_get.status_code == 200
    data_get = res_get.json()
    assert data_get["id"] == c_id
    assert len(data_get["messages"]) >= 2

    # 3. Send follow-up message in the same consultation
    res_msg = client.post(f"/api/v1/consultations/{c_id}/messages", json={
        "message": "Dhan labh ke liye koi saral upay bataiye",
        "user_name": "Test Seeker"
    })
    assert res_msg.status_code == 200
    msg_data = res_msg.json()
    assert msg_data["role"] == "assistant"
    assert len(msg_data["content"]) > 10

    # 4. End consultation and check summary
    res_end = client.post(f"/api/v1/consultations/{c_id}/end", json={"reason": "User completed"})
    assert res_end.status_code == 200
    summary = res_end.json()
    assert summary["consultation_id"] == c_id
    assert len(summary["key_insights"]) >= 1
    assert len(summary["remedies"]) >= 1

    # 5. Submit feedback
    res_feedback = client.post(f"/api/v1/consultations/{c_id}/feedback", json={
        "rating": 5,
        "feedback_text": "Wonderful and spiritually comforting consultation!"
    })
    assert res_feedback.status_code == 200
    assert res_feedback.json()["status"] == "success"

def test_human_astrologer_session_honest_state(client):
    """Verifies that selecting a human astrologer does NOT produce fake AI responses."""
    # Find a human astrologer
    res_astro = client.get("/api/v1/astrologers?is_ai=false")
    assert res_astro.status_code == 200
    human_astros = res_astro.json()["items"]
    assert len(human_astros) >= 1
    human_astro = human_astros[0]

    # Start consultation
    res_consult = client.post("/api/v1/consultations", json={
        "astrologer_id": human_astro["id"],
        "language": "hi"
    })
    assert res_consult.status_code in [200, 201]
    c_id = res_consult.json()["id"]

    # Send message to human astrologer
    res_msg = client.post(f"/api/v1/consultations/{c_id}/messages", json={
        "message": "Pranam Pandit ji, kripya margdarshan karein"
    })
    assert res_msg.status_code == 200
    result = res_msg.json()
    # Must communicate delivery and honest availability status, NEVER a fabricated AI response
    assert result["astrologer_type"] == "human"
    assert "status_note" in result
    assert result["status"] == "delivered"

def test_user_auth_and_profiles(client):
    """Verifies user registration, login, and birth profile management."""
    unique_email = f"test_{str(uuid.uuid4())[:8]}@astroai.com"
    
    # 1. Register
    res_reg = client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "Password123!",
        "full_name": "Dev Seeker"
    })
    assert res_reg.status_code == 201
    auth_data = res_reg.json()
    token = auth_data["access_token"]
    assert token is not None

    # 2. Login
    res_login = client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "Password123!"
    })
    assert res_login.status_code == 200
    assert "access_token" in res_login.json()

    # 3. Get Current User Me
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["email"] == unique_email

def test_cross_user_consultation_isolation(client):
    """Verifies that private consultations are isolated and cannot be snooped across users."""
    # User 1 registers and creates consultation
    email1 = f"user1_{str(uuid.uuid4())[:8]}@astroai.com"
    res1 = client.post("/api/v1/auth/register", json={"email": email1, "password": "Password123!", "full_name": "User One"})
    user1_id = res1.json()["user"]["id"]

    res_c1 = client.post("/api/v1/consultations", json={
        "astrologer_id": "acharya-shastri",
        "user_id": user1_id,
        "initial_message": "Confidential question from user 1"
    })
    c1_id = res_c1.json()["id"]

    # User 2 registers
    email2 = f"user2_{str(uuid.uuid4())[:8]}@astroai.com"
    res2 = client.post("/api/v1/auth/register", json={"email": email2, "password": "Password123!", "full_name": "User Two"})
    user2_id = res2.json()["user"]["id"]

    # Listing user 2 consultations must NOT contain user 1's consultation
    res_list2 = client.get(f"/api/v1/consultations?user_id={user2_id}")
    assert res_list2.status_code == 200
    user2_consultation_ids = [c["id"] for c in res_list2.json()]
    assert c1_id not in user2_consultation_ids

def test_astrologer_reviews_and_availability_update(client):
    """Verifies adding a verified review and toggling astrologer availability."""
    res_astro = client.get("/api/v1/astrologers")
    astro_id = res_astro.json()["items"][0]["id"]

    # Add review
    res_review = client.post(f"/api/v1/astrologers/{astro_id}/reviews", json={
        "rating": 5,
        "comment": "Accurate prediction and very soothing guidance.",
        "user_name": "Satisfied Seeker"
    })
    assert res_review.status_code == 200
    assert res_review.json()["comment"] == "Accurate prediction and very soothing guidance."
    assert res_review.json()["rating"] == 5

    # Update availability
    res_avail = client.patch(f"/api/v1/astrologers/{astro_id}/availability", json={
        "availability": "busy"
    })
    assert res_avail.status_code == 200
    assert res_avail.json()["availability"] == "busy"

def test_admin_persona_update(client):
    """Verifies that an administrator can update an AI astrologer persona's credentials and pricing."""
    res_astro = client.get("/api/v1/astrologers")
    astro = res_astro.json()["items"][0]
    astro_id = astro["id"]

    res_update = client.patch(f"/api/v1/astrologers/{astro_id}", json={
        "price_per_minute": 0,
        "is_ai": True,
        "title": "Master Vedic Numerologist & Jyotish Scholar (AI)"
    })
    assert res_update.status_code == 200
    updated = res_update.json()
    assert updated["price_per_minute"] == 0
    assert updated["is_ai"] is True
    assert "Master Vedic Numerologist" in updated["title"]


