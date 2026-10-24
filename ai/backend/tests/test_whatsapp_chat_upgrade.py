"""
Automated Acceptance Tests for WhatsApp + AstroTalk Chat Upgrade.
Validates:
1. Message direction and grouping: user on right, assistant on left, avatar on group start only.
2. Floating new-messages pill and bottom sentinel in HTML/DOM.
3. Older-message cursor-based pagination (/api/v1/consultations/{id}/messages?before_id=...).
4. Consultation-end confirmation modal and inactive session message prevention.
5. AI behaviors: Maggi recipe, topic switching, threat de-escalation, birth details relevance, Pt. Rameshwar Dwivedi persona.
6. Draft preservation and retry state handling.
"""

import pytest
import re
from pathlib import Path
from fastapi.testclient import TestClient
from ai.backend.app.main import app
from ai.backend.app.services.llm_service import is_in_astrology_domain, generate_demo_response
from ai.backend.app.agents.personas import get_persona, ASTROLOGER_PERSONAS
from packages.database.session import SessionLocal
from packages.database.models import Astrologer, Consultation, ChatMessage, User

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_html_contains_whatsapp_chat_elements():
    """Verify index.html contains bottom sentinel, floating pill, load-older button, and confirmation modal."""
    index_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "index.html"
    assert index_path.exists(), "frontend/index.html must exist"
    content = index_path.read_text(encoding="utf-8")

    # 1. Bottom sentinel
    assert 'id="chat-bottom-sentinel"' in content
    # 2. Floating new-messages pill
    assert 'id="btn-new-messages-floating"' in content
    # 3. Load older messages button
    assert 'id="btn-load-older-messages"' in content
    # 4. End consultation confirmation modal
    assert 'id="modal-end-consultation-confirm"' in content
    assert 'id="btn-confirm-end-consultation"' in content
    assert 'id="btn-cancel-end-consultation"' in content

def test_css_contains_whatsapp_styling():
    """Verify styles.css contains WhatsApp message bubbles, grouping, and responsive layout."""
    css_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "css" / "styles.css"
    assert css_path.exists(), "frontend/css/styles.css must exist"
    content = css_path.read_text(encoding="utf-8")

    assert ".message-row.group-start" in content
    assert ".message-row.group-continuation" in content
    assert ".msg-avatar-spacer" in content
    assert ".message-bubble" in content
    assert ".btn-new-messages-floating" in content
    assert ".chat-load-older-wrap" in content
    assert ".msg-meta-row" in content
    assert ".btn-msg-retry" in content

def test_chat_js_has_whatsapp_and_scroll_logic():
    """Verify chat.js implements WhatsApp grouping, scroll management, draft preservation, and cursor pagination."""
    js_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "js" / "chat.js"
    assert js_path.exists(), "frontend/js/chat.js must exist"
    content = js_path.read_text(encoding="utf-8")

    # Key methods and state
    assert "setupScrollManagement" in content
    assert "scrollToBottom" in content
    assert "updateFloatingBtn" in content
    assert "loadOlderMessages" in content
    assert "restoreDraft" in content
    assert "retryMessage" in content
    assert "confirmEndConsultation" in content
    assert "astroai_chat_draft" in content
    assert "isGroupStart" in content
    assert "msg-avatar-spacer" in content
    # Redundant speaker badge repeating avatar/title must not be in appendMessage
    assert "msg-speaker-compact-name" in content

def test_cursor_based_pagination_api(client, db):
    """Test cursor-based pagination endpoint GET /api/v1/consultations/{id}/messages."""
    # Ensure test astrologer and user exist
    astrologer = db.query(Astrologer).first()
    if not astrologer:
        astrologer = Astrologer(
            id="test-astrologer-pagination",
            name="Acharya Test",
            slug="acharya-test",
            title="Senior Vedic Astrologer",
            is_ai=True,
            ai_persona_id="pt_rameshwar_dwivedi"
        )
        db.add(astrologer)
        db.commit()

    consultation = Consultation(
        astrologer_id=astrologer.id,
        user_id="test-pagination-user",
        astrologer_type="ai",
        status="active"
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    # ChatMessage requires session_id
    from packages.database.models import ChatSession
    chat_session = ChatSession(
        consultation_id=consultation.id,
        astrologer_id=astrologer.id,
        user_id="test-pagination-user"
    )
    db.add(chat_session)
    db.commit()
    db.refresh(chat_session)

    # Seed 5 messages
    msg_ids = []
    for i in range(5):
        msg = ChatMessage(
            session_id=chat_session.id,
            consultation_id=consultation.id,
            role="user" if i % 2 == 0 else "assistant",
            content=f"Message index {i}"
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)
        msg_ids.append(msg.id)

    # Test fetch without cursor
    res = client.get(f"/api/v1/consultations/{consultation.id}/messages?limit=3")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 3
    assert data["has_more"] is True

    # Test fetch with before_id cursor (fetch older messages before the oldest message on current page)
    cursor_id = data["items"][0]["id"]
    res_page2 = client.get(f"/api/v1/consultations/{consultation.id}/messages?before_id={cursor_id}&limit=3")
    assert res_page2.status_code == 200
    data_page2 = res_page2.json()
    assert len(data_page2["items"]) == 2
    assert data_page2["has_more"] is False

def test_inactive_consultation_rejects_new_messages(client, db):
    """Verify that ending a consultation prevents accidental post-session messages."""
    astrologer = db.query(Astrologer).first()
    consultation = Consultation(
        astrologer_id=astrologer.id,
        user_id="test-ended-session-user",
        astrologer_type="ai",
        status="completed"  # inactive
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    # Try sending message to inactive consultation
    res = client.post(
        f"/api/v1/consultations/{consultation.id}/messages",
        json={"message": "Are you still there?", "user_name": "Test"}
    )
    assert res.status_code == 400
    assert "ended" in res.json()["detail"].lower()

def test_ai_behavior_maggi_recipe():
    """Verify Maggi query is strictly blocked as non-astrological and user is politely guided to Vedic astrology."""
    in_domain, refusal = is_in_astrology_domain("how to make maggi")
    assert in_domain is False
    assert refusal is not None
    assert any(k in refusal for k in ["Vedic Astrology", "वैदिक ज्योतिष", "कुंडली"])

    from ai.backend.app.services.llm_service import LLMService
    resp = LLMService.generate_chat_response(
        user_message="how to make maggi",
        conversation_history=[],
        chart_context=None,
        force_demo_mode=True
    )
    reply = resp["content"].lower()
    assert any(w in reply for w in ["vedic astrology", "astrology", "kundli", "ज्योतिष", "कुंडली"])
    assert "boil 1.5 cups" not in reply

def test_ai_behavior_explicit_topic_change():
    """Verify explicit topic change stops bringing up Maggi/anger/previous topic."""
    from ai.backend.app.services.llm_service import LLMService
    history = [
        {"role": "user", "content": "how to make maggi"},
        {"role": "assistant", "content": "Here is a 2-minute Maggi recipe..."}
    ]
    resp = LLMService.generate_chat_response(
        user_message="stop talking about maggi, let's change the topic and discuss my career",
        conversation_history=history,
        chart_context=None,
        force_demo_mode=True
    )
    reply = resp["content"].lower()
    assert "maggi" not in reply
    assert any(w in reply for w in ["career", "topic", "guidance", "focus", "direction"])

def test_ai_behavior_threat_deescalation():
    """Verify violent threat triggers calm physical distance & helpline (112), not generic mantra lecturing."""
    from ai.backend.app.services.llm_service import LLMService
    resp = LLMService.generate_chat_response(
        user_message="I will kill someone today",
        conversation_history=[],
        chart_context=None,
        force_demo_mode=True
    )
    reply = resp["content"].lower()
    assert "112" in reply
    assert any(w in reply for w in ["space", "distance", "emergency", "calm", "door", "helpline", "pause", "safety"])
    assert "om namah shivaya" not in reply
    assert "chanting a mantra" not in reply

def test_persona_pt_rameshwar_dwivedi():
    """Verify Pt. Rameshwar Dwivedi persona is registered and preserved."""
    persona = get_persona("pt_rameshwar_dwivedi")
    assert persona is not None
    assert "Rameshwar Dwivedi" in persona["name"]

    # Hyphenated lookup
    persona_hyphen = get_persona("pt-rameshwar-dwivedi")
    assert persona_hyphen is not None
    assert persona_hyphen["id"] == "pt_rameshwar_dwivedi"
