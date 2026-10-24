"""
Tests for Strict Dynamic Domain Guardrails and Strict Language/Script Mirroring.
Ensures zero answers to off-topic queries and exact language reflection.
"""
import pytest
from fastapi.testclient import TestClient
from ai.backend.app.main import app
from ai.backend.app.services.llm_service import is_in_astrology_domain, _detect_language

client = TestClient(app)

def test_language_detection():
    """Verifies that Hindi, Hinglish, English and regional scripts are detected accurately."""
    # Hindi (Devanagari)
    assert _detect_language("मेरी कुंडली में कौन सा ग्रह मजबूत है?") == "hi"
    assert _detect_language("नमस्ते पंडित जी") == "hi"

    # Hinglish
    assert _detect_language("meri shadi kab hogi?") == "hinglish"
    assert _detect_language("bhai career kaisa rahega mera?") == "hinglish"
    assert _detect_language("kya mujhe sarkari naukri milegi?") == "hinglish"
    assert _detect_language("aaj ka panchang batao") == "hinglish"

    # English
    assert _detect_language("What are the career prospects for Saturn in 10th house?") == "en"
    assert _detect_language("Can you explain Gajakesari yoga?") == "en"

    # Regional scripts
    assert _detect_language("আমার বিবাহ কবে হবে?") == "bn" # Bengali
    assert _detect_language("મારી કુંડળી કેવી છે?") == "gu" # Gujarati


def test_strict_out_of_domain_blocking():
    """Verifies that any query outside astrology/palmistry/spirituality is blocked."""
    off_topic_queries = [
        ("Write a python script to reverse a linked list", "en"),
        ("What is the capital of France?", "en"),
        ("Recipe for chicken biryani", "en"),
        ("IPL match score today", "en"),
        ("Derivative of x^2 + 5x", "en"),
        ("Who is the prime minister of India?", "en"),
        ("Tell me a funny joke", "en"),
        ("Python me function kaise likhte hain?", "hinglish"),
        ("Biryani banana sikhao bhai", "hinglish"),
        ("Virat Kohli kaun hai?", "hinglish"),
        ("पायथन में कोड कैसे लिखें?", "hi"),
        ("फ्रांस की राजधानी क्या है?", "hi"),
        ("পায়থন কোড লিখুন", "bn")
    ]

    for q, expected_lang in off_topic_queries:
        in_domain, refusal = is_in_astrology_domain(q)
        assert in_domain is False, f"Query '{q}' should have been blocked as out of domain!"
        assert refusal is not None and len(refusal) > 10, f"Refusal message should be present for '{q}'"
        
        # Verify refusal language matches
        if expected_lang == "hi":
            assert "ज्योतिष" in refusal or "कुंडली" in refusal
        elif expected_lang == "hinglish":
            assert "Astrology" in refusal and ("sawaal" in refusal or "jawab" in refusal)
        elif expected_lang == "bn":
            assert "জ্যোতিষ" in refusal or "কোষ্ঠী" in refusal
        elif expected_lang == "en":
            assert "Vedic Astrology" in refusal or "astrology" in refusal.lower()


def test_in_domain_astrology_allowed():
    """Verifies that valid astrology, palmistry and life guidance queries are allowed."""
    valid_queries = [
        "Hi, how are you?",
        "Namaste ji",
        "Kaise ho aap?",
        "Mere career mein growth kab hogi?",
        "Mera moon sign kya hai?",
        "What does Jupiter in 9th house indicate?",
        "Shani ki sade sati ka prabhav kaisa rahega?",
        "Is there any Manglik dosha in my chart?",
        "Palm line analysis for heart line",
        "Aaj ka shubh muhurat kya hai?",
        "Which gemstone should I wear for mental peace?"
    ]

    for q in valid_queries:
        in_domain, refusal = is_in_astrology_domain(q)
        assert in_domain is True, f"Valid query '{q}' was incorrectly blocked!"
        assert refusal is None


def test_api_chat_domain_guardrail_rejection():
    """Verifies that API endpoint rejects off-topic queries immediately without answering."""
    response = client.post(
        "/api/v1/chat",
        json={
            "message": "Write a python script to hack a wifi network",
            "language": "en",
            "force_demo_mode": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "cannot answer" in data["content"].lower() or "specialize exclusively" in data["content"].lower()
    assert len(data["citations"]) == 0
