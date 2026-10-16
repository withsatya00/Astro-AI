"""
Classical Vedic Planetary Aspects (Graha Drishti) Calculation Engine.
Strictly implements Brihat Parashara Hora Shastra (BPHS Ch. 26 - Drishti Shastra):
- Universal 7th house aspect (Purna Drishti) for all grahas.
- Special full aspects (Vishesh Drishti):
  * Mars: 4th (Chaturtha) and 8th (Ashtama) aspects.
  * Jupiter: 5th (Panchama Trikona) and 9th (Navama Trikona) aspects.
  * Saturn: 3rd (Tritiya) and 10th (Dashama) aspects.
- Conjunctions (Yuti) with degree proximity.
- Exact longitudinal difference, orb calculation, and Virupa strength percentage.
"""
from typing import List, Dict, Any, Optional

BENEFIC_GRAHAS = {"Jupiter", "Venus", "Moon", "Mercury"}
MALEFIC_GRAHAS = {"Saturn", "Mars", "Rahu", "Ketu", "Sun"}

# Classical aspect rules: forward house distances and expected degrees
# In Vedic astrology, house 1 is conjunction (0°), house 3 is 60°, house 4 is 90°, etc.
ASPECT_DEFINITIONS = {
    "Mars": [
        {"house_offset": 4, "exact_deg": 90.0, "orb": 12.0, "name": "4th Drishti (Mars Chaturtha)", "virupa_max": 60},
        {"house_offset": 7, "exact_deg": 180.0, "orb": 15.0, "name": "7th Drishti (Direct)", "virupa_max": 60},
        {"house_offset": 8, "exact_deg": 210.0, "orb": 12.0, "name": "8th Drishti (Mars Ashtama)", "virupa_max": 60},
    ],
    "Jupiter": [
        {"house_offset": 5, "exact_deg": 120.0, "orb": 12.0, "name": "5th Drishti (Guru Trikona)", "virupa_max": 60},
        {"house_offset": 7, "exact_deg": 180.0, "orb": 15.0, "name": "7th Drishti (Direct)", "virupa_max": 60},
        {"house_offset": 9, "exact_deg": 240.0, "orb": 12.0, "name": "9th Drishti (Guru Trikona)", "virupa_max": 60},
    ],
    "Saturn": [
        {"house_offset": 3, "exact_deg": 60.0, "orb": 12.0, "name": "3rd Drishti (Shani Tritiya)", "virupa_max": 60},
        {"house_offset": 7, "exact_deg": 180.0, "orb": 15.0, "name": "7th Drishti (Direct)", "virupa_max": 60},
        {"house_offset": 10, "exact_deg": 270.0, "orb": 12.0, "name": "10th Drishti (Shani Dashama)", "virupa_max": 60},
    ],
    # All other Grahas cast full 7th aspect
    "Sun": [
        {"house_offset": 7, "exact_deg": 180.0, "orb": 15.0, "name": "7th Drishti (Direct)", "virupa_max": 60}
    ],
    "Moon": [
        {"house_offset": 7, "exact_deg": 180.0, "orb": 15.0, "name": "7th Drishti (Direct)", "virupa_max": 60}
    ],
    "Mercury": [
        {"house_offset": 7, "exact_deg": 180.0, "orb": 15.0, "name": "7th Drishti (Direct)", "virupa_max": 60}
    ],
    "Venus": [
        {"house_offset": 7, "exact_deg": 180.0, "orb": 15.0, "name": "7th Drishti (Direct)", "virupa_max": 60}
    ],
    "Rahu": [
        {"house_offset": 7, "exact_deg": 180.0, "orb": 15.0, "name": "7th Drishti (Direct)", "virupa_max": 60},
        {"house_offset": 5, "exact_deg": 120.0, "orb": 12.0, "name": "5th Drishti (Trikona)", "virupa_max": 45},
        {"house_offset": 9, "exact_deg": 240.0, "orb": 12.0, "name": "9th Drishti (Trikona)", "virupa_max": 45},
    ],
    "Ketu": [
        {"house_offset": 7, "exact_deg": 180.0, "orb": 15.0, "name": "7th Drishti (Direct)", "virupa_max": 60}
    ]
}


def calculate_planetary_aspects(planets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Computes all active Graha Drishti (aspects) between planets in the chart.
    Includes both whole-sign house aspects and exact degree longitudinal proximity.
    """
    aspects: List[Dict[str, Any]] = []
    if not planets:
        return aspects

    planet_dict = {p.get("name"): p for p in planets if p.get("name")}
    planet_names = [p.get("name") for p in planets if p.get("name")]

    # 1. Conjunctions (Yuti) between distinct planets within 10 degrees or same house
    for i in range(len(planet_names)):
        for j in range(i + 1, len(planet_names)):
            p1_name = planet_names[i]
            p2_name = planet_names[j]
            p1 = planet_dict[p1_name]
            p2 = planet_dict[p2_name]

            # Avoid Rahu-Ketu being marked as conjunction (they are 180° opposite)
            if {p1_name, p2_name} == {"Rahu", "Ketu"}:
                continue

            lon1 = p1.get("longitude", 0.0)
            lon2 = p2.get("longitude", 0.0)
            h1 = p1.get("house", 0)
            h2 = p2.get("house", 0)

            # Circular separation
            diff = abs(lon1 - lon2)
            if diff > 180.0:
                diff = 360.0 - diff

            if h1 == h2 or diff <= 10.0:
                # Active conjunction
                exactness = max(0.0, min(100.0, (1.0 - (diff / 10.0)) * 100.0))
                # Base strength of 50% for same house, rising to 100% for exact degree
                strength = 50.0 + (exactness * 0.5) if h1 == h2 else exactness
                is_combust = (p1_name == "Sun" and diff <= 8.0) or (p2_name == "Sun" and diff <= 8.0)
                aspects.append({
                    "aspect_type": "Conjunction (Yuti)",
                    "source_planet": p1_name,
                    "target_planet": p2_name,
                    "house": h1,
                    "separation_deg": round(diff, 2),
                    "strength_pct": round(strength, 1),
                    "virupa_strength": round((strength / 100.0) * 60, 1),
                    "is_combustion": is_combust,
                    "nature": "Affliction (Combustion)" if is_combust else (
                        "Benefic Alliance" if (p1_name in BENEFIC_GRAHAS and p2_name in BENEFIC_GRAHAS)
                        else ("Karmic Tension" if (p1_name in MALEFIC_GRAHAS and p2_name in MALEFIC_GRAHAS) else "Mixed Influence")
                    ),
                    "description": (
                        f"{p1_name} and {p2_name} are conjunct in House {h1} "
                        f"(separation: {diff:.2f}°, strength: {strength:.1f}%)."
                        + (" [Combust Sun proximity]" if is_combust else "")
                    )
                })

    # 2. Parashari Graha Drishti (one-way and mutual aspects)
    for p1_name in planet_names:
        p1 = planet_dict[p1_name]
        p1_lon = p1.get("longitude", 0.0)
        p1_house = p1.get("house", 1)
        rules = ASPECT_DEFINITIONS.get(p1_name, [])

        for rule in rules:
            h_offset = rule["house_offset"]
            target_house = ((p1_house - 1 + (h_offset - 1)) % 12) + 1
            exact_target_deg = (p1_lon + rule["exact_deg"]) % 360.0
            max_orb = rule["orb"]

            # Check every other planet
            for p2_name in planet_names:
                if p1_name == p2_name:
                    continue
                # Skip Rahu aspecting Ketu or vice versa
                if {p1_name, p2_name} == {"Rahu", "Ketu"}:
                    continue

                p2 = planet_dict[p2_name]
                p2_lon = p2.get("longitude", 0.0)
                p2_house = p2.get("house", 1)

                # Check if p2 is in the aspected house OR within exact degree orb
                # Forward angle from p1 to p2
                forward_angle = (p2_lon - p1_lon) % 360.0
                angular_deviation = abs(forward_angle - rule["exact_deg"])
                if angular_deviation > 180.0:
                    angular_deviation = 360.0 - angular_deviation

                is_in_house = (p2_house == target_house)
                is_within_orb = (angular_deviation <= max_orb)

                if is_in_house or is_within_orb:
                    exactness = max(0.0, min(100.0, (1.0 - (angular_deviation / max_orb)) * 100.0))
                    # House placement provides at least 50% strength; exact degree scales to 100%
                    strength = 50.0 + (exactness * 0.5) if is_in_house else exactness
                    virupas = (strength / 100.0) * rule["virupa_max"]

                    is_benefic_aspect = p1_name in BENEFIC_GRAHAS
                    aspects.append({
                        "aspect_type": rule["name"],
                        "source_planet": p1_name,
                        "target_planet": p2_name,
                        "source_house": p1_house,
                        "target_house": p2_house,
                        "angular_deviation": round(angular_deviation, 2),
                        "strength_pct": round(strength, 1),
                        "virupa_strength": round(virupas, 1),
                        "is_benefic": is_benefic_aspect,
                        "nature": "Benefic Grace (Protection)" if is_benefic_aspect else "Malefic Pressure / Discipline",
                        "description": (
                            f"{p1_name} (House {p1_house}) casts {rule['name']} on {p2_name} in House {p2_house} "
                            f"(Deviation: {angular_deviation:.2f}°, Virupa Strength: {virupas:.1f}/60, {strength:.1f}%)."
                        )
                    })

    return aspects


def calculate_lagna_and_house_aspects(
    planets: List[Dict[str, Any]],
    asc_deg: float,
    asc_sign: str
) -> List[Dict[str, Any]]:
    """
    Computes classical aspects cast by planets directly on the Lagna (Ascendant)
    and the 10th House (Karma Bhava/MC), which shape career and constitution.
    """
    house_aspects: List[Dict[str, Any]] = []
    if not planets:
        return house_aspects

    for p in planets:
        p_name = p.get("name")
        p_lon = p.get("longitude", 0.0)
        p_house = p.get("house", 1)
        rules = ASPECT_DEFINITIONS.get(p_name, [])

        for rule in rules:
            # Check aspect on Lagna (House 1)
            target_house = ((p_house - 1 + (rule["house_offset"] - 1)) % 12) + 1
            if target_house == 1:
                # Aspecting Lagna
                forward_to_asc = (asc_deg - p_lon) % 360.0
                dev = abs(forward_to_asc - rule["exact_deg"])
                if dev > 180.0:
                    dev = 360.0 - dev
                exactness = max(0.0, min(100.0, (1.0 - (dev / rule["orb"])) * 100.0))
                strength = 50.0 + (exactness * 0.5)

                house_aspects.append({
                    "target": "Lagna (Ascendant)",
                    "source_planet": p_name,
                    "source_house": p_house,
                    "aspect_type": rule["name"],
                    "deviation_deg": round(dev, 2),
                    "strength_pct": round(strength, 1),
                    "is_benefic": p_name in BENEFIC_GRAHAS,
                    "description": (
                        f"{p_name} in House {p_house} casts {rule['name']} directly on Lagna ({asc_sign}) "
                        f"with {strength:.1f}% strength."
                    )
                })

            # Check aspect on 10th House (Karma/Career)
            if target_house == 10:
                tenth_approx_deg = (asc_deg + 270.0) % 360.0
                forward_to_10 = (tenth_approx_deg - p_lon) % 360.0
                dev10 = abs(forward_to_10 - rule["exact_deg"])
                if dev10 > 180.0:
                    dev10 = 360.0 - dev10
                exactness10 = max(0.0, min(100.0, (1.0 - (dev10 / rule["orb"])) * 100.0))
                strength10 = 50.0 + (exactness10 * 0.5)

                house_aspects.append({
                    "target": "10th House (Career / Karma Bhava)",
                    "source_planet": p_name,
                    "source_house": p_house,
                    "aspect_type": rule["name"],
                    "deviation_deg": round(dev10, 2),
                    "strength_pct": round(strength10, 1),
                    "is_benefic": p_name in BENEFIC_GRAHAS,
                    "description": (
                        f"{p_name} in House {p_house} casts {rule['name']} on the 10th House of Career "
                        f"with {strength10:.1f}% strength."
                    )
                })

    return house_aspects
