"""Puja Vidhi, the festival calendar (engine and API), confirmed-date overrides, reminders, mantra meanings and the Guide's new sources."""
import json
import uuid
from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from packages.database.models import User
from packages.database.session import SessionLocal, init_db
from website.backend.app import panchang_engine as pe
from website.backend.app.api import bhakti, bhakti_calendar, bhakti_gita, bhakti_guide, bhakti_temples, bhakti_vedanta
from website.backend.app.main import app


@pytest.fixture(scope="module")
def client():
    init_db()
    with SessionLocal() as db:
        bhakti.seed_bhakti_if_empty(db)
        bhakti_gita.seed_gita_and_library_if_missing(db)
        bhakti_temples.seed_temples_if_missing(db)
        bhakti_vedanta.seed_articles_if_missing(db)
        bhakti_calendar.seed_puja_if_missing(db)
        bhakti_calendar.seed_puja_if_missing(db)  # twice: no duplicates
    with TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"}) as c:
        yield c


@pytest.fixture(autouse=True)
def isolate(monkeypatch):
    bhakti_guide._hits.clear()
    monkeypatch.setattr(bhakti_guide, "_ai_available", lambda: True)


def _user(client, admin=False):
    email = f"cal-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!x", "full_name": "T"})
    if admin:
        with SessionLocal() as db:
            db.query(User).filter(User.email == email).update({"role": "admin"})
            db.commit()
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


# ------------------------------------------------------------------ engine
def test_tithi_names_and_paksha():
    assert pe.tithi_name(1) == ("Pratipada", "प्रतिपदा", "Shukla")
    assert pe.tithi_name(15)[0] == "Purnima" and pe.tithi_name(15)[2] == "Shukla"
    assert pe.tithi_name(30)[0] == "Amavasya" and pe.tithi_name(30)[2] == "Krishna"
    assert pe.tithi_name(26)[0] == "Ekadashi" and pe.tithi_name(26)[2] == "Krishna"


def test_sunrise_is_real_and_depends_on_place():
    sr_d, ss_d = pe.sunrise_sunset(date(2026, 11, 8), 28.6139, 77.2090, 5.5)
    sr_c, _ = pe.sunrise_sunset(date(2026, 11, 8), 13.0827, 80.2707, 5.5)
    assert "06:30" <= sr_d.strftime("%H:%M") <= "06:50" and "17:20" <= ss_d.strftime("%H:%M") <= "17:40"
    assert sr_c.strftime("%H:%M") != sr_d.strftime("%H:%M")  # Chennai's sun rises earlier than Delhi's in November
    assert sr_c < sr_d.replace(hour=sr_c.hour, minute=sr_c.minute) or sr_c.strftime("%H:%M") < sr_d.strftime("%H:%M")


def test_sunrise_unavailable_near_the_pole_is_refused():
    with pytest.raises(ValueError):
        pe.sunrise_sunset(date(2026, 6, 21), 78.0, 15.0, 1.0)


def test_new_moon_is_where_the_moon_meets_the_sun():
    t = datetime(2026, 11, 1, tzinfo=timezone.utc)
    nm = pe.new_moon_after(pe.new_moon_before(t))
    assert abs(pe._elong_signed(nm)) < 0.01
    assert 29.0 < (pe.new_moon_after(nm) - nm).total_seconds() / 86400 < 30.0


def test_lunar_month_names_for_known_points():
    def month_on(d):
        return pe.lunar_month(datetime(d.year, d.month, d.day, 6, tzinfo=timezone.utc))
    assert month_on(date(2026, 11, 1)).name == "Ashwin" and not month_on(date(2026, 11, 1)).adhika
    assert month_on(date(2026, 11, 20)).name == "Kartik"
    assert month_on(date(2026, 2, 5)).name == "Magha"
    assert any(month_on(date(2026, 5, 1) + timedelta(days=i)).adhika for i in range(0, 60, 5))  # 2026 has an extra (adhika) month in May-June


def test_vishti_karana_runs_in_eight_stretches_a_month():
    start = datetime(2026, 11, 10, tzinfo=timezone.utc)
    flags = [pe.bhadra_at(start + timedelta(minutes=30 * i)) for i in range(29 * 48)]
    stretches = sum(1 for i in range(1, len(flags)) if flags[i] and not flags[i - 1])
    assert 7 <= stretches <= 9


def test_tithi_advances_one_step_at_a_time_across_a_year():
    days = pe.build_days(date(2025, 12, 1), date(2027, 1, 31), 28.6139, 77.2090, 5.5)
    repeats = 0
    for a, b in zip(days, days[1:]):
        step = (b.tithi_sunrise - a.tithi_sunrise) % 30
        # 1 is the usual step; 2 when a tithi falls between two sunrises; 0 when one tithi (longer than a day) covers two sunrises
        assert step in (0, 1, 2), f"{a.date}: {a.tithi_sunrise} -> {b.tithi_sunrise}"
        repeats = repeats + 1 if step == 0 else 0
        assert repeats < 2, f"a tithi cannot last across three sunrises ({a.date})"


def test_festival_engine_finds_the_year_of_festivals_and_keeps_to_the_year():
    days = pe.build_days(date(2025, 12, 1), date(2027, 1, 31), 28.6139, 77.2090, 5.5)
    fests = pe.find_festivals(days, 2026)
    slugs = {f["slug"] for f in fests}
    assert slugs == {r[0] for r in pe.FESTIVAL_RULES}
    assert all(f["date"].startswith("2026-") for f in fests)
    assert [f["date"] for f in fests] == sorted(f["date"] for f in fests)
    by = {f["slug"]: f for f in fests}
    assert by["diwali"]["date"] == "2026-11-08" and by["janmashtami"]["date"] == "2026-09-04"
    assert by["chaitra-navratri-begins"]["date"] == "2026-03-19"  # the tithi that begins between two sunrises is still found
    assert by["gita-jayanti"]["date"].startswith("2026-12")      # not the December 2025 occurrence
    assert by["holi"]["date"] == (date.fromisoformat(by["holika-dahan"]["date"]) + timedelta(days=1)).isoformat()


def test_observances_include_a_tithi_that_falls_between_two_sunrises():
    days = pe.build_days(date(2025, 12, 1), date(2027, 1, 31), 28.6139, 77.2090, 5.5)
    found = {}
    for i, d in enumerate(days):
        for o in pe.observances_for(d, days[i + 1] if i + 1 < len(days) else None):
            found.setdefault(d.date.isoformat(), []).append(o)
    assert any(o["kind"] == "ekadashi" and not o["approx"] for o in found["2026-11-05"])
    assert any(o["kind"] == "ekadashi" and o["approx"] for o in found["2026-11-20"])
    assert any(o["kind"] == "purnima" for o in found["2026-11-24"])


def test_location_resolution_rules():
    assert pe.resolve_location("chennai", None, None, None)[4] == "chennai"
    assert pe.resolve_location(None, None, None, None)[4] == "delhi"
    assert pe.resolve_location(None, 19.0, 73.0, 5.5)[4] == "custom"
    for bad in [("nowhere", None, None, None), (None, 19.0, None, None), (None, 80.0, 70.0, 5.5), (None, 19.0, 200.0, 5.5), (None, 19.0, 70.0, 20.0)]:
        with pytest.raises(ValueError):
            pe.resolve_location(*bad)


# ------------------------------------------------------------------ calendar API
def test_month_endpoint_is_location_aware_and_complete(client):
    d = client.get("/api/v1/bhakti/calendar/month?year=2026&month=11&location=delhi").json()
    c = client.get("/api/v1/bhakti/calendar/month?year=2026&month=11&location=chennai").json()
    assert len(d["days"]) == 30 and d["location"]["label"] == "Delhi" and d["ayanamsa"] == "Lahiri" and "differ by a day" in d["assumptions"]
    assert d["days"][7]["date"] == "2026-11-08" and any(f["slug"] == "diwali" for f in d["days"][7]["festivals"])
    assert d["days"][4]["observances"][0]["kind"] == "ekadashi"
    assert d["days"][0]["sunrise"] != c["days"][0]["sunrise"]


def test_calendar_validation(client):
    base = "/api/v1/bhakti/calendar"
    assert client.get(f"{base}/month?year=1800&month=1").status_code == 422
    assert client.get(f"{base}/month?year=2026&month=13").status_code == 422
    assert client.get(f"{base}/month?year=2026&month=1&location=atlantis").status_code == 422
    assert client.get(f"{base}/month?year=2026&month=1&lat=10&lon=70").status_code == 422          # tz missing
    assert client.get(f"{base}/month?year=2026&month=1&lat=85&lon=70&tz=5.5").status_code == 422  # too far north
    assert client.get(f"{base}/month?year=2026&month=1&lat=19&lon=73&tz=5.5").status_code == 200
    assert client.get(f"{base}/festivals?year=2026&location=mumbai").json()["location"]["label"] == "Mumbai"
    assert len(client.get(f"{base}/locations").json()) >= 5


def test_confirmed_date_takes_precedence_and_needs_a_source(client):
    admin = _user(client, admin=True)
    body = {"slug": "diwali", "name_en": "Diwali (Lakshmi Puja)", "date": "2026-11-09", "source": "", "published": True}
    assert client.put("/api/v1/bhakti/calendar/admin/date", json=body, headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/calendar/admin/date", json={**body, "date": "2026-13-45", "source": "x"}, headers=admin).status_code == 422
    ok = client.put("/api/v1/bhakti/calendar/admin/date", json={**body, "source": "Local panchang, checked by editor", "location": "chennai"}, headers=admin)
    assert ok.status_code == 200
    chennai = {f["slug"]: f for f in client.get("/api/v1/bhakti/calendar/festivals?year=2026&location=chennai").json()["festivals"]}
    delhi = {f["slug"]: f for f in client.get("/api/v1/bhakti/calendar/festivals?year=2026&location=delhi").json()["festivals"]}
    assert chennai["diwali"]["status"] == "confirmed" and chennai["diwali"]["date"] == "2026-11-09" and chennai["diwali"]["computed_date"] == "2026-11-08"
    assert delhi["diwali"]["status"] == "computed" and delhi["diwali"]["date"] == "2026-11-08"  # a Chennai-only date does not leak to Delhi
    client.put("/api/v1/bhakti/calendar/admin/date", json={**body, "source": "s", "location": "chennai", "published": False}, headers=admin)
    again = {f["slug"]: f for f in client.get("/api/v1/bhakti/calendar/festivals?year=2026&location=chennai").json()["festivals"]}
    assert again["diwali"]["status"] == "computed"  # unpublished confirmations are ignored
    assert client.delete(f"/api/v1/bhakti/calendar/admin/date/{ok.json()['id']}", headers=admin).status_code == 200


def test_calendar_admin_endpoints_are_closed_to_others(client):
    user = _user(client)
    for h in ({}, user):
        assert client.get("/api/v1/bhakti/calendar/admin/dates", headers=h).status_code == 403
        assert client.put("/api/v1/bhakti/calendar/admin/date", json={"slug": "x", "name_en": "x", "date": "2026-01-01"}, headers=h).status_code == 403


# ------------------------------------------------------------------ reminders
def test_reminders_are_private_validated_and_respect_lead_days(client):
    alice, bob = _user(client), _user(client)
    assert client.get("/api/v1/bhakti/calendar/reminders").status_code == 401
    assert client.put("/api/v1/bhakti/calendar/reminders", json={"kind": "ekadashi", "lead_days": 9}, headers=alice).status_code == 422
    assert client.put("/api/v1/bhakti/calendar/reminders", json={"kind": "bogus"}, headers=alice).status_code == 422
    assert client.put("/api/v1/bhakti/calendar/reminders", json={"kind": "purnima", "location": "nowhere"}, headers=alice).status_code == 422
    assert client.put("/api/v1/bhakti/calendar/reminders", json={"kind": "purnima", "enabled": True, "lead_days": 2, "location": "delhi"}, headers=alice).status_code == 200
    prefs = {p["kind"]: p for p in client.get("/api/v1/bhakti/calendar/reminders", headers=alice).json()["prefs"]}
    assert prefs["purnima"]["enabled"] and prefs["purnima"]["lead_days"] == 2 and not prefs["ekadashi"]["enabled"]
    up = client.get("/api/v1/bhakti/calendar/reminders/upcoming", headers=alice).json()
    assert up["delivery"] == "in-app" and up["items"] and all(i["kind"] == "purnima" for i in up["items"])
    for i in up["items"]:
        assert date.fromisoformat(i["remind_on"]) == date.fromisoformat(i["date"]) - timedelta(days=2) and i["days_to_remind"] >= 0
    assert client.get("/api/v1/bhakti/calendar/reminders/upcoming", headers=bob).json()["items"] == []  # another person's choices are not shared


def test_upcoming_public_feed_is_sorted(client):
    items = client.get("/api/v1/bhakti/calendar/upcoming?days=60").json()["items"]
    assert items and [i["date"] for i in items] == sorted(i["date"] for i in items)


# ------------------------------------------------------------------ puja vidhi
def test_seeded_puja_guides_are_attributed_unverified_and_complete(client):
    items = client.get("/api/v1/bhakti/puja").json()
    assert len(items) >= 6 and [i["slug"] for i in items][0] == "daily-home-puja"
    for i in items:
        d = client.get(f"/api/v1/bhakti/puja/{i['slug']}").json()
        assert d["steps"] and d["samagri"] and d["sources"] and d["reviewed_on"] and d["is_verified"] is False
        assert "differ" in d["notes"]  # every guide says that practice varies
    assert "doctor" in client.get("/api/v1/bhakti/puja/ekadashi-vrat").json()["notes"]  # a fasting guide carries a health caution
    assert client.get("/api/v1/bhakti/puja/nope").status_code == 404


def test_puja_admin_rules(client):
    user, admin = _user(client), _user(client, admin=True)
    body = {"slug": f"p-{uuid.uuid4().hex[:6]}", "title_en": "Test puja", "steps": [{"title": "Step", "text": "Do it"}], "sources": [{"title": "A book"}],
            "reviewed_on": "2026-01-01", "published": True}
    for h in ({}, user):
        assert client.put("/api/v1/bhakti/puja/admin/guide", json=body, headers=h).status_code == 403
        assert client.get("/api/v1/bhakti/puja/admin/list", headers=h).status_code == 403
    assert client.put("/api/v1/bhakti/puja/admin/guide", json={**body, "sources": []}, headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/puja/admin/guide", json={**body, "steps": []}, headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/puja/admin/guide", json={**body, "sources": [{"title": "x", "url": "http://insecure.example.com"}]}, headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/puja/admin/guide", json=body, headers=admin).status_code == 200
    assert client.get(f"/api/v1/bhakti/puja/{body['slug']}").status_code == 200
    client.put("/api/v1/bhakti/puja/admin/guide", json={**body, "published": False}, headers=admin)
    assert client.get(f"/api/v1/bhakti/puja/{body['slug']}").status_code == 404
    assert any(g["slug"] == body["slug"] for g in client.get("/api/v1/bhakti/puja/admin/list", headers=admin).json())
    assert client.delete(f"/api/v1/bhakti/puja/admin/guide/{body['slug']}", headers=admin).status_code == 200


# ------------------------------------------------------------------ mantra meanings + Guide
def test_catalogue_mantras_carry_a_meaning(client):
    ms = {m["slug"]: m for m in client.get("/api/v1/bhakti/mantras").json()}
    for slug in ("om-namah-shivaya", "jai-mata-di", "om-gan-ganapataye-namah", "radhe-radhe"):
        assert ms[slug]["meaning_en"] and ms[slug]["meaning_hi"]
    assert "salutation" in ms["om-namah-shivaya"]["meaning_en"].lower()


def _llm(monkeypatch):
    monkeypatch.setattr(bhakti_guide, "_call_llm", lambda s, u: json.dumps({"explanation": "ok [S1]", "used_refs": ["S1"]}))


def test_guide_now_knows_the_peethas_mantras_and_puja(client, monkeypatch):
    _llm(monkeypatch)
    r = client.post("/api/v1/bhakti/guide/ask", json={"question": "Which Veda is linked with the Sringeri peetha in the south?"}).json()
    assert r["sources"][0]["title"] == "The four Amnaya Peethas" and "Yajurveda" in r["sources"][0]["commentary"]
    assert "Rigveda" in client.post("/api/v1/bhakti/guide/ask", json={"question": "Govardhana Math Puri Rigveda peetha east"}).json()["sources"][0]["commentary"]
    m = client.post("/api/v1/bhakti/guide/ask", json={"question": "What does the mantra Om Namah Shivaya mean?"}).json()
    assert any(s["kind_label"] == "Mantra meaning" for s in m["sources"]) and "Shiva" in " ".join(s["meaning"] for s in m["sources"])
    p = client.post("/api/v1/bhakti/guide/ask", json={"question": "How do I do Ganesh puja at home, what samagri do I need?"}).json()
    assert p["sources"][0]["kind_label"] == "Puja guide" and "Ganesh" in p["sources"][0]["title"]
    assert "never contains" not in p["sources"][0]["commentary"]


def test_guide_does_not_list_present_day_officeholders(client, monkeypatch):
    _llm(monkeypatch)
    r = client.post("/api/v1/bhakti/guide/ask", json={"question": "Who is the current Shankaracharya of Sringeri?"}).json()
    text = " ".join(s["commentary"] for s in r["sources"])
    assert "not listed here" in text or "does not list current officeholders" in text


def test_a_tithi_covering_two_sunrises_is_flagged_on_the_observance():
    days = pe.build_days(date(2025, 12, 1), date(2027, 1, 31), 28.6139, 77.2090, 5.5)
    flagged = [o for i, d in enumerate(days) for o in pe.observances_for(d, days[i + 1] if i + 1 < len(days) else None) if "also covers the next sunrise" in o["detail"]]
    assert flagged, "expected at least one repeated sunrise tithi in 14 months"
