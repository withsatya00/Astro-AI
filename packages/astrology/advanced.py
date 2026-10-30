"""Deterministic chart exploration. All timestamps are local to the supplied offset."""
from datetime import date, datetime, timedelta
from packages.astrology.calculations import calculate_chart, VIMSHOTTARI_LORDS, NAKSHATRAS
from packages.astrology.panchang import calculate_panchang


def recalculate(profile, instant=None):
    return calculate_chart(
        date_of_birth=instant.date().isoformat() if instant else profile.date_of_birth,
        time_of_birth=instant.strftime("%H:%M:%S") if instant else profile.time_of_birth,
        is_time_approximate=profile.is_time_approximate,
        latitude=profile.latitude, longitude=profile.longitude,
        timezone_offset=profile.timezone_offset, system=profile.system, ayanamsa=profile.ayanamsa)


def dasha_periods(profile):
    """Recover the full first mahadasha before dividing it, then clip at birth.

    Dividing the remaining balance into nine parts would give incorrect antardashas.
    """
    chart = profile.chart_data
    moon = next(p for p in chart["planets"] if p["name"] == "Moon")
    span = 360 / 27
    longitude = moon["longitude"] % 360
    index = int(longitude / span) % 9
    elapsed = (longitude % span) / span * VIMSHOTTARI_LORDS[index][1]
    birth = datetime.fromisoformat(profile.date_of_birth + "T" + (profile.time_of_birth or "12:00:00"))
    cursor = birth - timedelta(days=elapsed * 365.25)
    periods = []
    for i in range(10):
        major_index = (index + i) % 9
        lord, years = VIMSHOTTARI_LORDS[major_index]
        end = cursor + timedelta(days=years * 365.25)
        sub_cursor = cursor
        subs = []
        for j in range(9):
            sub_lord, sub_years = VIMSHOTTARI_LORDS[(major_index + j) % 9]
            sub_end = sub_cursor + timedelta(days=years * sub_years / 120 * 365.25)
            if sub_end > birth:
                subs.append(dict(planet=sub_lord, start=max(sub_cursor, birth).isoformat(), end=sub_end.isoformat()))
            sub_cursor = sub_end
        periods.append(dict(planet=lord, start=max(cursor, birth).isoformat(), end=end.isoformat(), antardashas=subs))
        cursor = end
    return periods


def timeline(profile, selected: date):
    if selected < date.fromisoformat(profile.date_of_birth):
        raise ValueError("Select a date on or after birth")
    instant = datetime.combine(selected, datetime.min.time()).replace(hour=12)
    transits = recalculate(profile, instant)
    natal = {p["name"]: p for p in profile.chart_data["planets"]}
    lagna = int(profile.chart_data["ascendant"] / 30)
    for p in transits["planets"]:
        p["natal_house"] = (int(p["longitude"] / 30) - lagna) % 12 + 1
        p["natal_sign"] = natal.get(p["name"], {}).get("sign")
    periods = dasha_periods(profile) if profile.system == "Vedic" else []
    active = next((p for p in periods if p["start"] <= instant.isoformat() < p["end"]), None)
    from packages.astrology.chart_svg import generate_north_indian_kundli_svg
    overlay = {**profile.chart_data, "planets": [{**p, "house": p["natal_house"]} for p in transits["planets"]]}
    return dict(date=selected.isoformat(), periods=periods, active=active, transits=transits,
                chart_svg=generate_north_indian_kundli_svg(overlay),
                note="Transits sampled at local noon. Whole-sign natal houses. Dasha year = 365.25 days; traditional interpretation is not a prediction.")


def uncertainty(profile, minutes):
    if not profile.time_of_birth:
        raise ValueError("A recorded birth time is required to explore uncertainty")
    base = datetime.fromisoformat(profile.date_of_birth + "T" + profile.time_of_birth)
    samples = []
    for offset in (-minutes, -minutes // 2, 0, minutes // 2, minutes):
        instant = base + timedelta(minutes=offset)
        chart = recalculate(profile, instant)
        samples.append(dict(offset_minutes=offset, instant=instant.isoformat(), chart=chart))
    changed = [p["name"] for p in samples[2]["chart"]["planets"] if len({
        (q["sign"], q["house"], q["navamsha_sign"]) for s in samples for q in s["chart"]["planets"] if q["name"] == p["name"]}) > 1]
    return dict(samples=samples, changed_planets=changed,
                ascendant_changes=len({s["chart"]["ascendant_sign"] for s in samples}) > 1,
                note="Five sensitivity samples, not birth-time rectification or an exhaustive boundary search.")


def evidence(profile):
    from packages.astrology.interpretations import generate_interpretations
    chart = profile.chart_data
    return dict(calculation_engine=chart.get("calculation_engine"), system=profile.system,
                ayanamsa=profile.ayanamsa, approximate_time=profile.is_time_approximate,
                interpretations=generate_interpretations(chart),
                placements=[dict(planet=p["name"], sign=p["sign"], house=p["house"],
                                 longitude=p["longitude"], nakshatra=p["nakshatra"],
                                 rule="Planet longitude mapped to zodiac sign and whole-sign house" if profile.system == "Vedic" else "Planet longitude and configured tropical house system") for p in chart["planets"]],
                note="Placements are calculated facts; meanings are traditional interpretations. Source excerpts are shown only when retrieved for a consultation.")


def muhurat(profile, start, days, event):
    """Transparent daily shortlist using existing panchang rules, not precision electional astrology."""
    candidates, excluded = [], []
    category = {"marriage": 0, "housewarming": 1, "business": 2, "vehicle": 3}[event]
    for i in range(days):
        day = start + timedelta(days=i)
        p = calculate_panchang(day.isoformat() + "T12:00:00", profile.latitude, profile.longitude, profile.timezone_offset)
        reasons = []
        event_rule = p["shubh_muhurats"][category]
        if event_rule["status"] in ("Madhyam (General)", "Moderate", "Avoid Today"):
            reasons.append(f"Event rule did not qualify: {event_rule['status']}")
        if p["karan"]["is_bhadra"]:
            reasons.append("Bhadra at local noon")
        if p["tithi"]["number"] in (9, 14, 30):
            reasons.append("Excluded tithi: 9, 14 or 30")
        natal_nak = profile.chart_data.get("moon_nakshatra")
        nak_names = [n["name"] for n in NAKSHATRAS]
        tara = None
        if natal_nak in nak_names and p["nakshatra"]["name"] in nak_names:
            tara = ((nak_names.index(p["nakshatra"]["name"]) - nak_names.index(natal_nak)) % 27) % 9 + 1
            if tara in (3, 5, 7):
                reasons.append(f"Unfavourable Tara Bala group {tara} for the natal Moon")
        item = dict(date=day.isoformat(), tithi=p["tithi"], nakshatra=p["nakshatra"],
                    candidate_window=p["shubh_muhurats"][category]["ideal_timing"],
                    rahu_kaal=p["timings"]["rahu_kaal"],
                    tara_bala_group=tara,
                    reasons=reasons or [p["shubh_muhurats"][category]["guideline"], "No excluded tithi or Bhadra at local noon", f"Natal Tara Bala group: {tara if tara else 'unavailable'}"])
        (excluded if reasons else candidates).append(item)
    return dict(event=event, candidates=candidates, excluded=excluded,
                location=dict(latitude=profile.latitude, longitude=profile.longitude, timezone_offset=profile.timezone_offset),
                note="Preliminary daily shortlist from existing panchang at local noon. Windows use its approximate timing model; transitions and natal compatibility require astrologer review. Avoid displayed Rahu Kaal.")
