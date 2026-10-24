"""Two people on the platform must never see each other's chats, charts, reports or bookings."""
import json
import uuid

import pytest
from fastapi.testclient import TestClient

from website.backend.app.main import app

BIRTH = {
    "name": "Private Person", "date_of_birth": "2004-03-02", "time_of_birth": "12:00", "city": "Maharajganj",
    "country": "India", "latitude": 27.14, "longitude": 83.56, "timezone_offset": 5.5,
}
SLUG = "acharya-kn-rao"


def _guest():
    return TestClient(app, headers={"X-Client-Id": f"guest-{uuid.uuid4().hex}"})


def _user(name):
    c = TestClient(app, headers={"X-Client-Id": f"guest-{uuid.uuid4().hex}"})
    r = c.post("/api/v1/auth/register", json={
        "email": f"{name}_{uuid.uuid4().hex[:8]}@example.com", "password": "Password123!", "full_name": name})
    assert r.status_code == 201, r.text
    c.headers["Authorization"] = "Bearer " + r.json()["access_token"]
    return c


def _ask(c, text, chart_id=None, ident=SLUG):
    body = {"consultation_id": ident, "message": text, "language": "hinglish", "force_demo_mode": True}
    if chart_id:
        body["chart_id"] = chart_id
    r = c.post(f"/api/v1/consultations/{ident}/stream", json=body)
    assert r.status_code == 200, r.text
    for line in r.text.splitlines():
        if line.startswith("data: ") and '"event": "session"' in line:
            return json.loads(line[6:])["consultation_id"]
    raise AssertionError("no session event")


@pytest.fixture(params=["guests", "users"])
def pair(request):
    return (_guest(), _guest()) if request.param == "guests" else (_user("alice"), _user("bob"))


def test_consultation_is_private(pair):
    a, b = pair
    cid = _ask(a, "my secret question about divorce")
    secret_chart = a.post("/api/v1/charts/calculate", json=BIRTH).json()["id"]
    _ask(a, "career?", chart_id=secret_chart)

    # b cannot read, list, write to, end, summarise or rate a's consultation by id
    assert b.get(f"/api/v1/consultations/{cid}/messages").status_code == 404
    assert b.post(f"/api/v1/consultations/{cid}/messages", json={"message": "hi"}).status_code == 404
    assert b.post(f"/api/v1/consultations/{cid}/end", json={}).status_code == 404
    assert b.get(f"/api/v1/consultations/{cid}/summary").status_code == 404
    assert b.post(f"/api/v1/consultations/{cid}/feedback", json={"rating": 1, "feedback_text": "x"}).status_code == 404
    assert cid not in [c["id"] for c in b.get("/api/v1/consultations").json()]
    assert cid in [c["id"] for c in a.get("/api/v1/consultations").json()]

    # b opening the same astrologer gets b's OWN conversation, not a's history
    detail = b.get(f"/api/v1/consultations/{SLUG}").json()
    assert detail["id"] != cid
    assert all("secret question about divorce" not in m["content"] for m in detail["messages"])
    assert b.get(f"/api/v1/consultations/{SLUG}/messages").json()["items"] == []

    # b streaming to the astrologer slug never lands in a's consultation
    b_cid = _ask(b, "b's own question")
    assert b_cid != cid
    a_texts = [m["content"] for m in a.get(f"/api/v1/consultations/{cid}/messages?limit=100").json()["items"]]
    assert "b's own question" not in a_texts

    # a user_id in the body is ignored (it used to decide ownership)
    r = b.post("/api/v1/consultations", json={"astrologer_id": SLUG, "user_id": "someone-else"})
    assert r.status_code == 201 and r.json()["id"] == b_cid


def test_birth_charts_are_private(pair):
    a, b = pair
    chart_id = a.post("/api/v1/charts/calculate", json=BIRTH).json()["id"]
    assert chart_id in [c["id"] for c in a.get("/api/v1/charts").json()]
    assert chart_id not in [c["id"] for c in b.get("/api/v1/charts").json()]
    assert b.get(f"/api/v1/charts/{chart_id}").status_code == 404
    assert b.get(f"/api/v1/charts/{chart_id}/grounded-report").status_code == 404
    assert b.get(f"/api/v1/horoscope/personalized/{chart_id}").status_code == 404
    assert b.post("/api/v1/reports/generate", json={"chart_id": chart_id, "report_type": "full"}).status_code in (404, 422)
    assert chart_id not in [p["id"] for p in b.get("/api/v1/auth/profiles").json()]
    assert b.patch(f"/api/v1/auth/profiles/{chart_id}/default").status_code == 404
    assert b.delete(f"/api/v1/auth/profiles/{chart_id}").status_code == 404
    assert a.get(f"/api/v1/charts/{chart_id}").status_code == 200   # still there for the owner

    # attaching someone else's chart to my consultation is ignored, so it cannot be used to read it
    b_cid = _ask(b, "hello", chart_id=chart_id)
    from packages.database.models import Consultation
    from packages.database.session import SessionLocal
    db = SessionLocal()
    try:
        assert db.query(Consultation).filter(Consultation.id == b_cid).first().chart_id is None
    finally:
        db.close()


def test_chat_sessions_are_private(pair):
    a, b = pair
    r = a.post("/api/v1/chat", json={"message": "private chat text", "language": "en", "force_demo_mode": True})
    assert r.status_code == 200, r.text
    sid = r.json()["session_id"]
    assert sid in [s["id"] for s in a.get("/api/v1/chat/sessions").json()]
    assert sid not in [s["id"] for s in b.get("/api/v1/chat/sessions").json()]
    assert b.get(f"/api/v1/chat/sessions/{sid}").status_code == 404
    assert b.delete(f"/api/v1/chat/sessions/{sid}").status_code == 404
    # posting with someone else's session id starts b's own session instead of joining a's
    r2 = b.post("/api/v1/chat", json={"message": "hello", "language": "en", "session_id": sid, "force_demo_mode": True})
    assert r2.status_code == 200 and r2.json()["session_id"] != sid
    assert a.get(f"/api/v1/chat/sessions/{sid}").status_code == 200


def test_bookings_and_wallet_are_private():
    a, b = _user("carol"), _user("dave")
    r = a.post("/api/v1/wallet/bookings", json={
        "astrologer_id": SLUG, "user_name": "Carol", "scheduled_at": "2030-01-01 10:00", "duration_minutes": 10})
    assert r.status_code == 200, r.text
    bid = r.json()["booking_id"]
    assert bid in [x["id"] for x in a.get("/api/v1/wallet/bookings").json()]
    assert bid not in [x["id"] for x in b.get("/api/v1/wallet/bookings").json()]
    assert b.post(f"/api/v1/wallet/bookings/{bid}/cancel").status_code == 404
    assert _guest().post(f"/api/v1/wallet/bookings/{bid}/cancel").status_code == 404
    guest = _guest()
    assert guest.get("/api/v1/wallet").json()["transactions"] == []
    assert guest.get("/api/v1/wallet/bookings").json() == []
    assert a.post(f"/api/v1/wallet/bookings/{bid}/cancel").status_code == 200


def test_no_identity_means_no_access():
    anon = TestClient(app)   # no X-Client-Id, no token
    assert anon.get("/api/v1/consultations").status_code == 400
    assert anon.post("/api/v1/consultations/x/stream", json={"message": "hi"}).status_code == 400
    assert anon.get("/api/v1/charts").status_code == 400
    assert anon.get("/api/v1/chat/sessions").status_code == 400
    assert anon.get("/api/v1/auth/profiles").json() == []
    # short / odd client ids are not identities either
    assert TestClient(app, headers={"X-Client-Id": "short"}).get("/api/v1/consultations").status_code == 400


def test_bad_token_is_rejected_not_downgraded_to_guest():
    c = TestClient(app, headers={"X-Client-Id": f"guest-{uuid.uuid4().hex}", "Authorization": "Bearer not-a-real-token"})
    assert c.get("/api/v1/consultations").status_code == 401


def test_login_claims_the_browsers_guest_data_only():
    cid = f"guest-{uuid.uuid4().hex}"
    guest = TestClient(app, headers={"X-Client-Id": cid})
    other_guest = _guest()
    mine = guest.post("/api/v1/charts/calculate", json=BIRTH).json()["id"]
    not_mine = other_guest.post("/api/v1/charts/calculate", json=BIRTH).json()["id"]
    consult = _ask(guest, "asked before logging in")

    email = f"erin_{uuid.uuid4().hex[:8]}@example.com"
    reg = guest.post("/api/v1/auth/register", json={"email": email, "password": "Password123!", "full_name": "Erin"})
    token = reg.json()["access_token"]
    user = TestClient(app, headers={"X-Client-Id": cid, "Authorization": "Bearer " + token})
    assert user.post("/api/v1/auth/claim-guest").json()["claimed"]["charts"] >= 1

    assert mine in [c["id"] for c in user.get("/api/v1/charts").json()]
    assert consult in [c["id"] for c in user.get("/api/v1/consultations").json()]
    assert not_mine not in [c["id"] for c in user.get("/api/v1/charts").json()]
    # after signing out the visitor is a fresh guest: the account's data is not visible to them
    assert mine not in [c["id"] for c in guest.get("/api/v1/charts").json()]
