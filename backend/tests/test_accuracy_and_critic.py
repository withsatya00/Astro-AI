"""
Tests for GroundingCritic and Astronomical Fact Verification Accuracy Engine.
"""
import pytest
from backend.app.astrology.chart_context import ChartContext
from backend.app.astrology.grounding_critic import GroundingCritic


def test_grounding_critic_corrects_house_hallucination():
    sample_planets = [
        {"name": "Saturn", "sign": "Capricorn", "house": 10, "nakshatra": "Shravana"},
        {"name": "Jupiter", "sign": "Cancer", "house": 4, "nakshatra": "Pushya"},
        {"name": "Sun", "sign": "Aries", "house": 1, "nakshatra": "Ashwini"}
    ]
    ctx = ChartContext(
        is_verified=True,
        ascendant_sign="Aries",
        planets=sample_planets
    )

    # Contradictory text claiming Saturn is in 4th house and Jupiter is in 8th house
    hallucinated_text = "According to your kundli, Saturn is in 4th house and Jupiter is in 8th house, bringing delays."
    corrected, flags = GroundingCritic.audit_and_correct_response(hallucinated_text, ctx)

    assert len(flags) >= 1
    # Check that Saturn was corrected to house 10
    assert "Saturn is in 10th house" in corrected
    assert "Jupiter is in 4th house" in corrected


def test_grounding_critic_corrects_sign_hallucination():
    sample_planets = [
        {"name": "Sun", "sign": "Libra", "house": 7, "nakshatra": "Swati", "navamsha_sign": "Gemini", "dashamsha_sign": "Aquarius"},
        {"name": "Moon", "sign": "Taurus", "house": 2, "nakshatra": "Rohini", "navamsha_sign": "Cancer", "dashamsha_sign": "Pisces"}
    ]
    ctx = ChartContext(
        is_verified=True,
        ascendant_sign="Aries",
        planets=sample_planets
    )

    # Hallucinated text claiming Sun is in Scorpio
    hallucinated_text = "Sun is in Scorpio which brings intense emotions."
    corrected, flags = GroundingCritic.audit_and_correct_response(hallucinated_text, ctx)

    assert len(flags) == 1
    assert flags[0]["type"] == "sign_contradiction"
    assert flags[0]["verified_sign"] == "Libra"
    assert "Sun is in Libra" in corrected


def test_grounding_critic_passes_truthful_statements():
    sample_planets = [
        {"name": "Jupiter", "sign": "Cancer", "house": 4, "nakshatra": "Pushya", "is_vargottama": True, "navamsha_sign": "Cancer"},
        {"name": "Mars", "sign": "Capricorn", "house": 10, "nakshatra": "Shravana"}
    ]
    ctx = ChartContext(
        is_verified=True,
        ascendant_sign="Aries",
        planets=sample_planets
    )

    truthful_text = "Aapki kundli me Jupiter 4th house me Cancer sign me exalted sthiti me hai."
    corrected, flags = GroundingCritic.audit_and_correct_response(truthful_text, ctx)

    assert len(flags) == 0
    assert corrected == truthful_text


def test_grounding_critic_unverified_chart_flag():
    ctx = ChartContext(is_verified=False)
    unverified_text = "Aapka lagna Aries hai aur aap bohot energetic hain."
    corrected, flags = GroundingCritic.audit_and_correct_response(unverified_text, ctx)
    assert len(flags) >= 1
    assert flags[0]["issue"] == "fabricated_chart_without_verification"
