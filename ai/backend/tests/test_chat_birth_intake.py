"""Exercise the actual routes without a model API or the user's application DB."""
import json

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from packages.database.session import Base, get_db
from packages.database.models import Astrologer, BirthChart, ChatMessage, Consultation, ChatSession
from website.backend.app.main import app
from ai.backend.app.services.chat_birth_intake import parse_birth_fields


@pytest.fixture
def clients(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    with factory() as db:
        db.add(Astrologer(id="intake-test", slug="intake-test", name="Test Scholar", title="Vedic Astrologer",
                          is_ai=True, ai_persona_id="acharya_shastri"))
        db.commit()
    def database():
        with factory() as db:
            yield db
    app.dependency_overrides[get_db] = database
    # The intake and real ephemeris run; retrieval is irrelevant to this regression.
    monkeypatch.setattr("ai.backend.app.rag.retrieval.RetrievalService.retrieve_relevant_chunks", lambda **kwargs: [])
    a = TestClient(app, headers={"X-Client-Id": "intake-owner-000000001"})
    b = TestClient(app, headers={"X-Client-Id": "intake-owner-000000002"})
    yield a, b, factory
    app.dependency_overrides.pop(get_db, None)
    engine.dispose()


def ask(client, route, message, ident=None):
    payload = {"message": message, "language": "hinglish", "force_demo_mode": True}
    if route.startswith("/chat") and ident:
        payload["session_id"] = ident
    response = client.post("/api/v1" + route, json=payload)
    assert response.status_code == 200, response.text
    if route.endswith("/stream"):
        events = [json.loads(line[6:]) for line in response.text.splitlines() if line.startswith("data: ")]
        return next(event for event in events if event["event"] == "done")
    return response.json()


@pytest.mark.parametrize("route", ["/chat", "/chat/stream", "/consultations/intake-test/messages", "/consultations/intake-test/stream"])
def test_details_resume_career_and_chart_survives_followup(clients, route):
    a, _, factory = clients
    first = ask(a, route, "Mera career kaisa rahega?")
    ident = first.get("session_id") or first.get("consultation_id")
    second = ask(a, route, "DOB 02-03-2004, time 12:00 PM, place Tirupati", ident)
    assert second.get("chart_id"), second
    assert second["calculated_data_used"] is True
    assert "marriage" not in second["content"].lower()
    assert "vivah" not in second["content"].lower()
    assert any(word in second["content"].lower() for word in ("career", "professional", "karya", "dasham", "karm", "shani"))
    third = ask(a, route, "Career mein promotion kab milega?", ident)
    assert third["chart_id"] == second["chart_id"]
    assert third["calculated_data_used"] is True
    assert "share your date" not in third["content"].lower()
    with factory() as db:
        assert db.query(BirthChart).count() == 1


def test_piecemeal_birth_details_only_ask_missing_fields(clients):
    a, _, _ = clients
    route = "/consultations/intake-test/stream"
    ask(a, route, "Mere carrier ke baare mein batao")
    date = ask(a, route, "2 March 2004")
    assert "janm tareekh" not in date["content"]
    city = ask(a, route, "Lucknow")
    assert "shehar" not in city["content"]
    assert "samay" in city["content"]
    clock = ask(a, route, "8:30")
    assert "AM/PM" in clock["content"]
    final = ask(a, route, "subah")
    assert final["chart_id"] and final["calculated_data_used"]
    assert "vivah" not in final["content"].lower()


def test_birth_details_and_pending_topic_are_isolated_by_owner(clients):
    a, b, factory = clients
    route = "/consultations/intake-test/stream"
    ask(a, route, "My career prospects?")
    ask(a, route, "2004-03-02, 08:30 AM, Lucknow")
    other = ask(b, route, "My career prospects?")
    assert not other.get("chart_id")
    assert not other["calculated_data_used"]
    with factory() as db:
        charts = db.query(BirthChart).all()
        assert len(charts) == 1
        assert charts[0].owner_key == "g:intake-owner-000000001"


def test_invalid_date_and_ambiguous_time_are_not_guessed():
    fields, _ = parse_birth_fields("31-02-2004, 8:30, Lucknow")
    assert not fields.get("date_of_birth")
    assert not fields.get("time_of_birth")
    assert fields["ambiguous_time"] == "08:30"


def test_hindi_numerals_and_day_period():
    fields, _ = parse_birth_fields("जन्म २ मार्च २००४, शाम ८:३०, लखनऊ")
    assert fields["date_of_birth"] == "2004-03-02"
    assert fields["time_of_birth"] == "20:30"
    assert fields["place"] == "Lucknow"


def test_latest_question_replaces_an_older_marriage_topic(clients):
    a, _, _ = clients
    route = "/consultations/intake-test/stream"
    ask(a, route, "Meri shadi kab hogi?")
    ask(a, route, "Pehle career ke baare mein batao")
    answer = ask(a, route, "02/03/2004, 12 PM, Tirupati")
    assert answer["calculated_data_used"]
    assert "vivah" not in answer["content"].lower()
    assert "marriage" not in answer["content"].lower()


def test_ambiguous_locality_does_not_use_default_delhi_coordinates(clients):
    a, _, factory = clients
    route = "/consultations/intake-test/stream"
    ask(a, route, "Mera career kaisa hai?")
    answer = ask(a, route, "DOB 02-03-2004, time 12 PM, place Maharajganj")
    assert not answer.get("chart_id")
    assert "janm tareekh" not in answer["content"]
    resolved = ask(a, route, "Uttar Pradesh")
    assert resolved["chart_id"] and resolved["calculated_data_used"]
    with factory() as db:
        chart = db.query(BirthChart).one()
        assert chart.city == "Maharajganj, Uttar Pradesh"
        assert chart.latitude != 28.6139


def test_unknown_city_is_saved_and_can_be_completed_with_coordinates(clients):
    a, _, factory = clients
    route = "/consultations/intake-test/stream"
    ask(a, route, "Mere career ka vishleshan karein")
    answer = ask(a, route, "DOB 2004-03-02, birth time 12 PM, birthplace My Small Town")
    assert not answer.get("chart_id")
    assert "latitude" in answer["content"]
    assert "janm tareekh" not in answer["content"]
    final = ask(a, route, "lat 27.14, lon 83.56, UTC +5.5")
    assert final["chart_id"] and final["calculated_data_used"]
    with factory() as db:
        assert db.query(BirthChart).count() == 1


def test_birth_chart_label_does_not_replace_pending_career_question(clients):
    a, _, _ = clients
    route = "/consultations/intake-test/stream"
    ask(a, route, "Mera career kaisa rahega?")
    answer = ask(a, route, "My birth chart details: 02-03-2004, 12 PM, Tirupati")
    assert answer["calculated_data_used"]
    assert any(word in answer["content"].lower() for word in ("career", "professional", "karya", "dasham", "karm", "shani"))
    assert "marriage" not in answer["content"].lower()
