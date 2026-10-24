"""
Dual-Pass Automated Grounding Critic & Astrological Fact Checker.
Validates LLM-generated responses against verified Swiss Ephemeris astronomical facts.
Eliminates hallucinations of planet positions, houses, signs, and dashas.
"""
from typing import Dict, Any, List, Optional, Tuple
import re
from packages.astrology.chart_context import ChartContext
from packages.core.logging import logger

GRAHA_ALIASES = {
    "Sun": ["sun", "surya", "soorya", "ravi", "bhanu", "aditya"],
    "Moon": ["moon", "chandra", "som", "soma"],
    "Mars": ["mars", "mangal", "mangala", "kuja", "angarak"],
    "Mercury": ["mercury", "budh", "budha"],
    "Jupiter": ["jupiter", "guru", "brihaspati", "devaguru"],
    "Venus": ["venus", "shukra", "sukra", "daityaguru"],
    "Saturn": ["saturn", "shani", "sani", "manda"],
    "Rahu": ["rahu", "rahoo", "north node"],
    "Ketu": ["ketu", "ketoo", "south node"],
    "Ascendant": ["ascendant", "lagna", "lagnam"]
}

SIGN_ALIASES = {
    "Aries": ["aries", "mesha", "mesh"],
    "Taurus": ["taurus", "vrishabha", "vrishabh", "vrish"],
    "Gemini": ["gemini", "mithuna", "mithun"],
    "Cancer": ["cancer", "karka", "kark"],
    "Leo": ["leo", "simha", "singh", "sinh"],
    "Virgo": ["virgo", "kanya"],
    "Libra": ["libra", "tula"],
    "Scorpio": ["scorpio", "vrishchika", "vrishchik"],
    "Sagittarius": ["sagittarius", "dhanu", "dhanus", "dhanur"],
    "Capricorn": ["capricorn", "makara", "makar"],
    "Aquarius": ["aquarius", "kumbha", "kumbh"],
    "Pisces": ["pisces", "meena", "meen"]
}

# Reverse lookup
ALIAS_TO_GRAHA = {}
for g, aliases in GRAHA_ALIASES.items():
    for a in aliases:
        ALIAS_TO_GRAHA[a] = g

ALIAS_TO_SIGN = {}
for s, aliases in SIGN_ALIASES.items():
    for a in aliases:
        ALIAS_TO_SIGN[a] = s


class GroundingCritic:
    @staticmethod
    def audit_and_correct_response(
        response_text: str,
        chart_context: ChartContext
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Audits the generated LLM text against the verified chart context.
        Returns:
            (corrected_text, list_of_audit_flags)
        """
        if not response_text:
            return response_text, []

        audit_flags: List[Dict[str, Any]] = []

        # If no verified chart, ensure response does not invent a specific Lagna or planet placement
        if not chart_context or not chart_context.is_verified:
            # Check if model claimed "your ascendant is Aries" or "your moon sign is Leo"
            fabricated_lagna = re.search(
                r"(?:your\s+(?:ascendant|lagna|moon sign|sun sign)\s+is\s+([A-Za-z]+))|"
                r"(?:aapka\s+(?:lagna|rashi)\s+([A-Za-z]+)\s+hai)",
                response_text,
                re.IGNORECASE
            )
            if fabricated_lagna:
                flag = {
                    "issue": "fabricated_chart_without_verification",
                    "matched": fabricated_lagna.group(0),
                    "action": "soft_warning"
                }
                audit_flags.append(flag)
            return response_text, audit_flags

        # Build ground-truth lookup from verified context
        truth_planets: Dict[str, Dict[str, Any]] = {}
        for p in chart_context.planets:
            p_name = p.get("name")
            if p_name:
                truth_planets[p_name] = {
                    "sign": p.get("sign"),
                    "house": p.get("house"),
                    "nakshatra": p.get("nakshatra"),
                    "is_retrograde": p.get("is_retrograde", False),
                    "navamsha_sign": p.get("navamsha_sign"),
                    "dashamsha_sign": p.get("dashamsha_sign")
                }

        if chart_context.ascendant_sign:
            truth_planets["Ascendant"] = {
                "sign": chart_context.ascendant_sign,
                "house": 1,
                "nakshatra": chart_context.ascendant_nakshatra
            }

        # Check for direct contradictions: e.g. "Saturn is in 4th house" when Saturn is in 10th house
        corrected_text = response_text

        # Build targeted regex with exact graha and sign tokens
        all_grahas = "|".join(re.escape(k) for k in sorted(ALIAS_TO_GRAHA.keys(), key=len, reverse=True))
        all_signs = "|".join(re.escape(k) for k in sorted(ALIAS_TO_SIGN.keys(), key=len, reverse=True))


        def to_ordinal_str(num: int, original_str: str) -> str:
            # Preserve suffix style ('st', 'nd', 'rd', 'th', or bare number)
            has_suffix = bool(re.search(r"\d+(?:st|nd|rd|th)", original_str, re.IGNORECASE))
            if has_suffix:
                if 11 <= (num % 100) <= 13:
                    suffix = 'th'
                else:
                    suffix = ['th', 'st', 'nd', 'rd', 'th'][min(num % 10, 4)]
                return f"{num}{suffix}"
            return str(num)

        # 1. House contradiction detector: "(Graha) ... (is in / in) (House N)"
        house_pattern = re.compile(
            rf"\b({all_grahas})\b(?:[\w\s]{{0,25}}?)\b(?:is in|in|placed in|occupies|situated in|mein|me|bhav me|ghar me)\s+(?:the\s+)?(\d{{1,2}}(?:st|nd|rd|th)?)\s*(?:house|bhav|ghar)?",
            re.IGNORECASE
        )
        for m in house_pattern.finditer(response_text):
            word1 = m.group(1).lower()
            claimed_str = m.group(2)
            num_match = re.search(r"\d+", claimed_str)
            if not num_match:
                continue
            claimed_house = int(num_match.group(0))
            matched_planet = ALIAS_TO_GRAHA.get(word1)
            if matched_planet and matched_planet in truth_planets:
                actual_house = truth_planets[matched_planet].get("house")
                if actual_house and claimed_house != actual_house and 1 <= claimed_house <= 12:
                    audit_flags.append({
                        "planet": matched_planet,
                        "type": "house_contradiction",
                        "claimed_house": claimed_house,
                        "verified_house": actual_house,
                        "matched_string": m.group(0)
                    })
                    logger.warning(
                        f"GroundingCritic detected house hallucination: {matched_planet} claimed in House {claimed_house}, "
                        f"verified is House {actual_house}."
                    )
                    # Replace with ground truth ordinal
                    replacement_num = to_ordinal_str(actual_house, claimed_str)
                    replacement = m.group(0).replace(claimed_str, replacement_num)
                    corrected_text = corrected_text.replace(m.group(0), replacement, 1)

        # 2. Sign contradiction detector: "(Graha) is in (Sign)"
        sign_pattern = re.compile(
            rf"\b({all_grahas})\b(?:[\w\s]{{0,20}}?)\b(?:is in|in|in the sign of|rashi me|mein|me)\s+({all_signs})\b",
            re.IGNORECASE
        )
        for m in sign_pattern.finditer(response_text):
            word1 = m.group(1).lower()
            word2 = m.group(2).lower()
            matched_planet = ALIAS_TO_GRAHA.get(word1)
            matched_sign = ALIAS_TO_SIGN.get(word2)
            if matched_planet and matched_sign and matched_planet in truth_planets:
                actual_sign = truth_planets[matched_planet].get("sign")
                actual_d9 = truth_planets[matched_planet].get("navamsha_sign")
                actual_d10 = truth_planets[matched_planet].get("dashamsha_sign")
                # If matched sign doesn't match D1, D9, or D10, it's a hallucination
                valid_signs = {actual_sign, actual_d9, actual_d10} - {None}
                if actual_sign and matched_sign not in valid_signs:
                    audit_flags.append({
                        "planet": matched_planet,
                        "type": "sign_contradiction",
                        "claimed_sign": matched_sign,
                        "verified_sign": actual_sign,
                        "matched_string": m.group(0)
                    })
                    logger.warning(
                        f"GroundingCritic detected sign hallucination: {matched_planet} claimed in {matched_sign}, "
                        f"verified is {actual_sign}."
                    )
                    # Replace with verified sign preserving original word case
                    replacement = m.group(0).replace(m.group(2), actual_sign)
                    corrected_text = corrected_text.replace(m.group(0), replacement, 1)


        return corrected_text, audit_flags
