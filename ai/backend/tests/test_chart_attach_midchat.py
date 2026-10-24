"""A chart created after the consultation started (e.g. built from a phone call) must be used afterwards."""
from fastapi.testclient import TestClient

from packages.database.models import Consultation
from packages.database.session import SessionLocal
from website.backend.app.main import app

client = TestClient(app)


def _chart_id():
    r = client.post("/api/v1/charts/calculate", json={
        "name": "Mid Chat", "date_of_birth": "2004-03-02", "time_of_birth": "12:00", "city": "Maharajganj",
        "country": "India", "latitude": 27.14, "longitude": 83.56, "timezone_offset": 5.5,
    })
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]


def _consultation_chart_id(consultation_id):
    db = SessionLocal()
    try:
        return db.query(Consultation).filter(Consultation.id == consultation_id).first().chart_id
    finally:
        db.close()


def _stream(chart_id, call_mode):
    body = {"consultation_id": "acharya-kn-rao", "message": "mera career kaisa rahega", "language": "hinglish",
            "call_mode": call_mode, "astrologer_id": "acharya-kn-rao", "force_demo_mode": True}
    if chart_id:
        body["chart_id"] = chart_id
    r = client.post("/api/v1/consultations/acharya-kn-rao/stream", json=body)
    assert r.status_code == 200, r.text
    for line in r.text.splitlines():
        if line.startswith("data: ") and '"event": "session"' in line:
            return line.split('"consultation_id": "')[1].split('"')[0]
    raise AssertionError("no session event")


def test_chart_sent_with_a_later_message_is_attached_to_the_consultation():
    first = _stream(None, call_mode=True)          # started with no chart, like a fresh call
    chart_id = _chart_id()
    second = _stream(chart_id, call_mode=True)     # chart built mid-call, sent with the next turn
    assert first == second
    assert _consultation_chart_id(second) == chart_id
    # chat mode (non-call) behaves the same
    third = _stream(chart_id, call_mode=False)
    assert _consultation_chart_id(third) == chart_id
