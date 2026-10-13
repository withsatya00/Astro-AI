"""
Comprehensive Conversational Quality and Regression Test Suite for AstroAI Agent.
Validates the 10 critical criteria outlined in Part G:
1. "hii" -> Friendly greeting only, no chart claims.
2. "mere love ke bare me btao" without chart -> Natural Hinglish asking for optional details.
3. "career kaisa rahega?" without chart -> Asks general guidance vs personalized reading.
4. "mera moon sign kya hai?" without chart -> Requests birth details.
5. "continue" -> Continues workflow only if valid active context exists.
6. "short me btao" -> Concise response.
7. "detail me kundli analysis do" -> Detailed analysis using actual chart data.
8. Birth profile change -> Context isolation, no placement leakage from previous profile.
9. Relationship follow-up -> Context retention without fabricating facts.
10. Model provider failure -> Clear error or honest fallback, never fabricated answer.
"""
import pytest
from unittest.mock import patch
from backend.app.services.llm_service import LLMService, generate_demo_response
from backend.app.astrology.chart_context import ChartContext, validate_and_build_chart_context
from backend.app.agents.orchestrator import AgentOrchestrator
from backend.app.db.session import SessionLocal
from backend.app.models.models import BirthChart, ChatSession, ChatMessage

@pytest.fixture
def empty_chart_context():
    return validate_and_build_chart_context(None)

@pytest.fixture
def rohit_chart_context():
    raw_data = {
        "ascendant_sign": "Scorpio",
        "ascendant_nakshatra": "Anuradha",
        "sun_sign": "Libra",
        "moon_sign": "Sagittarius",
        "moon_nakshatra": "Mula",
        "planets": [
            {"name": "Venus", "sign": "Libra", "house": 12, "nakshatra": "Chitra", "is_retrograde": False},
            {"name": "Jupiter", "sign": "Cancer", "house": 9, "nakshatra": "Pushya", "is_retrograde": False},
            {"name": "Sun", "sign": "Libra", "house": 12, "nakshatra": "Swati", "is_retrograde": False},
            {"name": "Moon", "sign": "Sagittarius", "house": 2, "nakshatra": "Mula", "is_retrograde": False}
        ],
        "dashas": [
            {"planet": "Jupiter", "start_date": "2020-01-01", "end_date": "2036-01-01"}
        ]
    }
    class MockRecord:
        id = "profile-rohit-001"
        name = "Rohit"
        date_of_birth = "1990-10-24"
        time_of_birth = "07:30:00"
        is_time_approximate = False
        city = "New Delhi"
        country = "India"
        latitude = 28.6139
        longitude = 77.2090
        timezone_offset = 5.5
        system = "Vedic"
        ayanamsa = "Lahiri"
        chart_data = raw_data

    return validate_and_build_chart_context(MockRecord())

@pytest.fixture
def ananya_chart_context():
    raw_data = {
        "ascendant_sign": "Taurus",
        "ascendant_nakshatra": "Rohini",
        "sun_sign": "Leo",
        "moon_sign": "Pisces",
        "moon_nakshatra": "Revati",
        "planets": [
            {"name": "Venus", "sign": "Virgo", "house": 5, "nakshatra": "Hasta", "is_retrograde": False},
            {"name": "Jupiter", "sign": "Pisces", "house": 11, "nakshatra": "Purva Bhadrapada", "is_retrograde": False}
        ],
        "dashas": [
            {"planet": "Mercury", "start_date": "2022-01-01", "end_date": "2039-01-01"}
        ]
    }
    class MockRecord:
        id = "profile-ananya-002"
        name = "Ananya"
        date_of_birth = "1995-08-15"
        time_of_birth = "14:15:00"
        is_time_approximate = False
        city = "Mumbai"
        country = "India"
        latitude = 19.0760
        longitude = 72.8777
        timezone_offset = 5.5
        system = "Vedic"
        ayanamsa = "Lahiri"
        chart_data = raw_data

    return validate_and_build_chart_context(MockRecord())


# ---------------- CASE 1: User says "hii" ----------------
def test_case_1_greeting_only(empty_chart_context):
    resp = LLMService.generate_chat_response(
        user_message="hii",
        conversation_history=[],
        chart_context=empty_chart_context,
        force_demo_mode=True
    )
    content = resp["content"].lower()
    # Must be friendly greeting only, no horoscope report or planetary placement claims
    assert any(g in content for g in ["hey", "kaise ho", "hello", "hi"])
    assert "lagna" not in content
    assert "nakshatra" not in content
    assert "degree" not in content
    assert len(resp["content"].split("\n")) <= 3  # Short single sentence/greeting


# ---------------- CASE 2: User says "mere love ke bare me btao" without chart ----------------
def test_case_2_love_without_chart(empty_chart_context):
    resp = LLMService.generate_chat_response(
        user_message="mere love ke bare me btao",
        conversation_history=[],
        chart_context=empty_chart_context,
        force_demo_mode=True
    )
    content = resp["content"]
    # Natural Hinglish asking for optional birth details (dob, time, place)
    assert any(k in content.lower() for k in ["date of birth", "birth time", "birth place", "details"])
    assert "bilkul" in content.lower() or "love" in content.lower()
    assert not resp["calculated_data_used"]


# ---------------- CASE 3: User says "career kaisa rahega?" without chart ----------------
def test_case_3_career_without_chart(empty_chart_context):
    resp = LLMService.generate_chat_response(
        user_message="career kaisa rahega?",
        conversation_history=[],
        chart_context=empty_chart_context,
        force_demo_mode=True
    )
    content = resp["content"].lower()
    # Asks whether they want general guidance or personalized reading with birth details
    assert "career" in content
    assert "guidance" in content or "birth details" in content or "kundli" in content
    assert not resp["calculated_data_used"]


# ---------------- CASE 4: User says "mera moon sign kya hai?" without chart ----------------
def test_case_4_moon_sign_without_chart(empty_chart_context):
    resp = LLMService.generate_chat_response(
        user_message="mera moon sign kya hai?",
        conversation_history=[],
        chart_context=empty_chart_context,
        force_demo_mode=True
    )
    content = resp["content"].lower()
    # Explicitly requests birth details rather than inventing a moon sign
    assert any(k in content for k in ["birth time", "date of birth", "birth place", "details"])
    assert "your moon sign is aries" not in content


# ---------------- CASE 5: User says "continue" ----------------
def test_case_5_continue_behavior(empty_chart_context):
    # With active history
    resp_with_history = LLMService.generate_chat_response(
        user_message="continue",
        conversation_history=[
            {"role": "user", "content": "Tell me about career growth"},
            {"role": "assistant", "content": "Patience and skill mastery are key in astrology."}
        ],
        chart_context=empty_chart_context,
        force_demo_mode=True
    )
    assert len(resp_with_history["content"]) > 10

    # Without active history
    resp_empty = LLMService.generate_chat_response(
        user_message="continue",
        conversation_history=[],
        chart_context=empty_chart_context,
        force_demo_mode=True
    )
    assert "?" in resp_empty["content"]  # Prompts user for which topic to proceed with


# ---------------- CASE 6: User says "short me btao" ----------------
def test_case_6_short_answer(empty_chart_context):
    resp = LLMService.generate_chat_response(
        user_message="short me btao",
        conversation_history=[],
        chart_context=empty_chart_context,
        force_demo_mode=True
    )
    # Concise response: ~1-3 sentences, not a huge dump
    assert len(resp["content"].split(".")) <= 4
    assert len(resp["content"]) < 250


# ---------------- CASE 7: User says "detail me kundli analysis do" with verified chart ----------------
def test_case_7_detailed_kundli_with_chart(rohit_chart_context):
    resp = LLMService.generate_chat_response(
        user_message="detail me kundli analysis do",
        conversation_history=[],
        chart_context=rohit_chart_context,
        force_demo_mode=True
    )
    content = resp["content"]
    assert "Scorpio" in content or "Lagna" in content
    assert "Sagittarius" in content or "Moon" in content
    assert resp["calculated_data_used"] is True


# ---------------- CASE 8: Context isolation when profile changes ----------------
def test_case_8_profile_switching_isolation(rohit_chart_context, ananya_chart_context):
    resp_rohit = LLMService.generate_chat_response(
        user_message="mere love ke bare me btao",
        conversation_history=[],
        chart_context=rohit_chart_context,
        force_demo_mode=True
    )
    assert "Scorpio" in resp_rohit["content"]
    assert "Taurus" not in resp_rohit["content"]

    # Now switch to Ananya
    resp_ananya = LLMService.generate_chat_response(
        user_message="mere love ke bare me btao",
        conversation_history=[],
        chart_context=ananya_chart_context,
        force_demo_mode=True
    )
    assert "Taurus" in resp_ananya["content"]
    # Rohit's Scorpio lagna must NOT leak into Ananya's reading
    assert "Scorpio" not in resp_ananya["content"]


# ---------------- CASE 9: Follow-up question retaining relationship context ----------------
def test_case_9_relationship_follow_up(rohit_chart_context):
    history = [
        {"role": "user", "content": "mere love ke bare me btao"},
        {"role": "assistant", "content": "Tumhari kundli mein Lagna Scorpio hai aur Venus Libra mein sthit hai."}
    ]
    resp = LLMService.generate_chat_response(
        user_message="is relationship me mutual communication kaise help karega?",
        conversation_history=history,
        chart_context=rohit_chart_context,
        force_demo_mode=True
    )
    assert len(resp["content"]) > 20
    # Must not invent uncalculated partners or fake dates
    assert "2027" not in resp["content"]
    assert "cheating" not in resp["content"].lower()


# ---------------- CASE 10: Model provider failure handling ----------------
def test_case_10_provider_failure_graceful_handling(rohit_chart_context):
    with patch("google.genai.Client", side_effect=Exception("API Connection Refused")):
        # When live provider throws exception, fallback generates honest response without crashing
        resp = LLMService.generate_chat_response(
            user_message="kuch advice do",
            conversation_history=[],
            chart_context=rohit_chart_context,
            force_demo_mode=False
        )
        assert resp["is_demo_mode"] is True
        assert len(resp["content"]) > 10


# ---------------- CASE 11: Dynamic Domain Guardrail (Off-Topic Blocking) ----------------
def test_case_11_dynamic_domain_guardrail():
    # 1. Technical / Programming queries
    resp_coding = LLMService.generate_chat_response(
        user_message="write a python script to scrape data",
        conversation_history=[],
        chart_context=None,
        force_demo_mode=True
    )
    assert any(w in resp_coding["content"].lower() for w in ["astrology", "jyotish", "kundli", "palmistry", "technical", "coding"])
    assert "def " not in resp_coding["content"]
    assert "import " not in resp_coding["content"]

    # 2. Math equation query
    resp_math = LLMService.generate_chat_response(
        user_message="solve the equation x^2 + 5x + 6 = 0",
        conversation_history=[],
        chart_context=None,
        force_demo_mode=True
    )
    assert any(w in resp_math["content"].lower() for w in ["astrology", "jyotish", "kundli", "palmistry"])

    # 3. Off-topic politics/sports query
    resp_sports = LLMService.generate_chat_response(
        user_message="who won the ipl match score yesterday?",
        conversation_history=[],
        chart_context=None,
        force_demo_mode=True
    )
    assert any(w in resp_sports["content"].lower() for w in ["astrology", "jyotish", "kundli", "palmistry"])

    # 4. In Hinglish
    resp_hinglish = LLMService.generate_chat_response(
        user_message="docker container run karne ka code snippet do",
        conversation_history=[],
        chart_context=None,
        force_demo_mode=True
    )
    assert "Main sirf Astrology" in resp_hinglish["content"] or "Astrology" in resp_hinglish["content"]


# ---------------- CASE 12: Inline Kundli SVG Generation ----------------
def test_case_12_inline_kundli_rendering(rohit_chart_context):
    resp = LLMService.generate_chat_response(
        user_message="kundli dikhao chat mein",
        conversation_history=[],
        chart_context=rohit_chart_context,
        chart_data=rohit_chart_context.to_dict(),
        force_demo_mode=True
    )
    assert resp.get("chart_svg") is not None
    assert "<svg" in resp["chart_svg"]
    assert "</svg>" in resp["chart_svg"]
    assert "Scorpio" in resp["content"] or "Lagna" in resp["content"]


# ---------------- CASE 13: Multimodal Palm Photo Analysis ----------------
def test_case_13_palm_photo_analysis():
    # 1x1 transparent png in base64
    fake_png_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    resp = LLMService.generate_chat_response(
        user_message="Analyze my palm lines",
        conversation_history=[],
        chart_context=None,
        force_demo_mode=True,
        image_base64=fake_png_base64
    )
    assert resp.get("is_palm_analysis") is True
    assert "Life Line" in resp["content"] or "Jeevan Rekha" in resp["content"]
    assert "Heart Line" in resp["content"] or "Hriday Rekha" in resp["content"]
    assert "Head Line" in resp["content"] or "Mastishk Rekha" in resp["content"]
