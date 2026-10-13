"""
Unit and reference validation tests for Swiss Ephemeris calculations.
"""
import pytest
from backend.app.astrology.calculations import (
    calculate_julian_day,
    calculate_chart,
    get_zodiac_sign,
    get_nakshatra_info,
    calculate_vimshottari_dashas,
    calculate_navamsha,
    ZODIAC_SIGNS,
    NAKSHATRAS
)
from backend.app.astrology.chart_validation import validate_birth_coordinates, validate_birth_datetime

def test_julian_day_calculation():
    # Jan 1, 2000, 12:00:00 UT is JD 2451545.0
    jd = calculate_julian_day("2000-01-01", "12:00:00", 0.0)
    assert abs(jd - 2451545.0) < 0.0001

def test_zodiac_and_nakshatra_partitioning():
    assert len(ZODIAC_SIGNS) == 12
    assert len(NAKSHATRAS) == 27

    # 0 degrees is Aries, Ashwini Pada 1
    sign, deg = get_zodiac_sign(0.0)
    assert sign["name"] == "Aries"
    assert deg == 0.0

    nak_name, nak_lord, pada = get_nakshatra_info(0.0)
    assert nak_name == "Ashwini"
    assert nak_lord == "Ketu"
    assert pada == 1

    # 45 degrees is Taurus 15 degrees, Rohini Pada 2
    # Rohini spans 40 to 53.3333 degrees
    sign_t, deg_t = get_zodiac_sign(45.0)
    assert sign_t["name"] == "Taurus"
    assert deg_t == 15.0

    nak_r, lord_r, pada_r = get_nakshatra_info(45.0)
    assert nak_r == "Rohini"
    assert lord_r == "Moon"
    assert pada_r == 2

def test_navamsha_calculation():
    # 0 degrees Aries (movable) should be Aries in D9
    assert calculate_navamsha(0.0) == "Aries"
    # 35 degrees (Taurus 5 deg - fixed): Taurus is fixed, start sign is Capricorn (9th from Taurus)
    # Navamsha index is 1 (3°20' to 6°40') -> Aquarius
    assert calculate_navamsha(35.0) == "Aquarius"

def test_full_chart_calculation():
    # Test birth chart for New Delhi, 1990-10-24 07:30:00
    res = calculate_chart(
        date_of_birth="1990-10-24",
        time_of_birth="07:30:00",
        is_time_approximate=False,
        latitude=28.6139,
        longitude=77.2090,
        timezone_offset=5.5,
        system="Vedic",
        ayanamsa="Lahiri"
    )

    assert "ascendant" in res
    assert res["ascendant_sign"] == "Libra"
    assert len(res["planets"]) == 12  # 11 + Ketu
    assert len(res["houses"]) == 12
    assert len(res["dashas"]) == 9
    assert res["sun_sign"] == "Libra"
    assert res["moon_sign"] == "Sagittarius"

    # Verify Ketu is 180 degrees from Rahu
    rahu = next(p for p in res["planets"] if p["name"] == "Rahu")
    ketu = next(p for p in res["planets"] if p["name"] == "Ketu")
    diff = abs(rahu["longitude"] - ketu["longitude"])
    assert round(diff, 1) in (180.0, 180.0)

def test_chart_input_validations():
    valid, err = validate_birth_coordinates(95.0, 77.0)
    assert not valid
    assert "Latitude" in err

    valid, err = validate_birth_coordinates(28.0, 190.0)
    assert not valid
    assert "Longitude" in err

    valid, err = validate_birth_datetime("1750-01-01", "12:00:00")
    assert not valid

    valid, err = validate_birth_datetime("1995-05-15", "25:99:00")
    assert not valid
