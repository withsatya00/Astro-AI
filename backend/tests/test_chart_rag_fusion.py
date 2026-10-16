"""
Tests for Chart-to-RAG Fusion and Classical Yoga Detection Pipeline.
Validates:
1. Pancha Mahapurusha, Gajakesari, Budhaditya, and Vipareeta Raja Yoga detection.
2. Kuja Dosha with classical cancellations and Shani Sade Sati transit calculations.
3. End-to-end ChartRAGFusion grounded report generation using Swiss Ephemeris + RAG.
4. FastAPI endpoints for grounded chart reports.
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import SessionLocal
from backend.app.astrology.calculations import calculate_chart
from backend.app.astrology.yoga_detection import (
    analyze_all_chart_yogas,
    detect_pancha_mahapurusha_yogas,
    detect_gajakesari_yoga,
    detect_budhaditya_yoga,
    detect_kuja_dosha,
    detect_sade_sati_status
)
from backend.app.astrology.chart_rag_fusion import ChartRAGFusion


client = TestClient(app)


def test_pancha_mahapurusha_detection():
    # Saturn in 10th house in Libra (Exalted) -> Sasa Yoga
    planets = [
        {"name": "Saturn", "house": 10, "sign": "Libra", "longitude": 200.0},
        {"name": "Mars", "house": 1, "sign": "Aries", "longitude": 10.0},  # Ruchaka Yoga
        {"name": "Jupiter", "house": 5, "sign": "Cancer", "longitude": 95.0}  # Not in Kendra
    ]
    yogas = detect_pancha_mahapurusha_yogas(planets)
    yoga_names = [y["yoga_name"] for y in yogas]

    assert "Sasa Yoga" in yoga_names
    assert "Ruchaka Yoga" in yoga_names
    assert "Hamsa Yoga" not in yoga_names  # Jupiter is in 5th (not Kendra)


def test_gajakesari_yoga_detection():
    # Moon in 1st house, Jupiter in 4th house (4th from Moon = Kendra)
    planets = [
        {"name": "Moon", "house": 1, "sign": "Aries"},
        {"name": "Jupiter", "house": 4, "sign": "Cancer"}
    ]
    gj = detect_gajakesari_yoga(planets)
    assert gj is not None
    assert gj["yoga_name"] == "Gajakesari Yoga"
    assert "Jupiter in 4th house from Moon" in gj["relative_position"]


def test_budhaditya_yoga_detection():
    # Sun and Mercury in 10th house
    planets = [
        {"name": "Sun", "house": 10, "sign": "Aries", "longitude": 15.0},
        {"name": "Mercury", "house": 10, "sign": "Aries", "longitude": 22.0}
    ]
    ba = detect_budhaditya_yoga(planets)
    assert ba is not None
    assert ba["yoga_name"] == "Budhaditya Yoga"
    assert ba["house"] == 10


def test_kuja_dosha_with_classical_cancellation():
    # Mars in 1st house in Aries (Own sign cancels Kuja Dosha)
    planets = [
        {"name": "Mars", "house": 1, "sign": "Aries", "longitude": 12.0},
        {"name": "Moon", "house": 3, "sign": "Gemini", "longitude": 70.0}
    ]
    kd = detect_kuja_dosha(planets)
    assert kd["has_kuja_dosha"] is True
    assert kd["affliction_level"] == "Mitigated / Cancelled"
    assert len(kd["cancellations"]) > 0


def test_sade_sati_status_detection():
    # Natal Moon in Pisces -> Transit Saturn in Pisces -> Peak phase (Janma Shani)
    ss_pisces = detect_sade_sati_status("Pisces", current_saturn_sign="Pisces")
    assert ss_pisces["is_active"] is True
    assert "Peak Phase" in ss_pisces["phase"]

    # Natal Moon in Taurus -> Saturn in Pisces (11th house) -> Not active
    ss_taurus = detect_sade_sati_status("Taurus", current_saturn_sign="Pisces")
    assert ss_taurus["is_active"] is False


def test_chart_rag_fusion_full_grounded_report():
    """Calculates a real Swiss Ephemeris chart and generates a full grounded RAG report."""
    db = SessionLocal()
    try:
        # Calculate birth chart for 1990-10-24, New Delhi (Vedic)
        chart_data = calculate_chart(
            date_of_birth="1990-10-24",
            time_of_birth="10:30:00",
            is_time_approximate=False,
            latitude=28.6139,
            longitude=77.2090,
            timezone_offset=5.5,
            system="Vedic",
            ayanamsa="Lahiri"
        )

        report = ChartRAGFusion.generate_grounded_chart_report(
            db=db,
            chart_data=chart_data,
            language="en"
        )

        assert "report_title" in report
        assert "astronomical_facts" in report
        assert report["astronomical_facts"]["ascendant_sign"] is not None
        assert report["astronomical_facts"]["moon_sign"] is not None
        assert "detected_yogas_summary" in report
        assert "grounded_sections" in report
        assert len(report["grounded_sections"]) > 0

        # Check that authentic citations from the knowledge base are attached
        assert "citations" in report
        assert len(report["citations"]) > 0
        first_citation = report["citations"][0]
        assert "source_title" in first_citation
        assert "excerpt" in first_citation

    finally:
        db.close()


def test_api_grounded_report_endpoint():
    """Tests the new POST /api/v1/charts/grounded-report API endpoint."""
    payload = {
        "name": "Arjun Sharma",
        "date_of_birth": "1994-08-15",
        "time_of_birth": "14:15:00",
        "is_time_approximate": False,
        "latitude": 28.6139,
        "longitude": 77.2090,
        "timezone_offset": 5.5,
        "city": "New Delhi",
        "country": "India",
        "system": "Vedic",
        "ayanamsa": "Lahiri"
    }

    response = client.post("/api/v1/charts/grounded-report?language=en", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "chart_id" in data
    assert data["name"] == "Arjun Sharma"
    assert "report_title" in data
    assert "astronomical_facts" in data
    assert "detected_yogas_summary" in data
    assert "grounded_sections" in data
    assert len(data["citations"]) > 0

    # Test GET /api/v1/charts/{chart_id}/grounded-report
    chart_id = data["chart_id"]
    get_res = client.get(f"/api/v1/charts/{chart_id}/grounded-report?language=hi")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["language"] == "hi"
    assert "कुंडली" in get_data["report_title"]

