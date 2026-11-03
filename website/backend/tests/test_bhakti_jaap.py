"""Bhakti naam-jaap: auth, idempotent events, offline batch replay, clamping, data isolation, analytics and report."""
import uuid

import pytest
from fastapi.testclient import TestClient

from packages.database.session import SessionLocal, init_db
from website.backend.app.api import bhakti
from website.backend.app.main import app


@pytest.fixture(scope="module")
def client():
    init_db()
    with SessionLocal() as db:
        bhakti.seed_bhakti_if_empty(db)
    with TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"}) as c:
        yield c


def _register(client, prefix="jaap"):
    email = f"{prefix}-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!x", "full_name": "Test"})
    assert res.status_code in (200, 201), res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _mantra_id(client, slug="radhe-radhe"):
    return next(m["id"] for m in client.get("/api/v1/bhakti/mantras").json() if m["slug"] == slug)


def _start(client, h, mode="manual", target=108):
    res = client.post("/api/v1/bhakti/jaap/sessions", json={"mantra_id": _mantra_id(client), "mode": mode, "target": target}, headers=h)
    assert res.status_code == 201, res.text
    return res.json()


def _ev(n=1, source="manual"):
    return {"event_id": f"ev-{uuid.uuid4().hex}", "delta": n, "source": source}


def test_catalogue_is_public_and_seeded(client):
    assert any(d["slug"] == "krishna" for d in client.get("/api/v1/bhakti/deities").json())
    slugs = {m["slug"] for m in client.get("/api/v1/bhakti/mantras").json()}
    assert {"radhe-radhe", "jai-shri-ram", "om-namah-shivaya", "jai-mata-di", "jai-hanuman", "hare-krishna", "shri-ram"} <= slugs


def test_jaap_requires_login(client):
    assert client.get("/api/v1/bhakti/jaap/analytics").status_code == 401
    assert client.post("/api/v1/bhakti/jaap/sessions", json={"mantra_id": "x"}).status_code == 401


def test_event_is_idempotent(client):
    h = _register(client)
    s = _start(client, h)
    ev = _ev(1, "voice")
    first = client.post(f"/api/v1/bhakti/jaap/sessions/{s['id']}/events", json=ev, headers=h).json()
    again = client.post(f"/api/v1/bhakti/jaap/sessions/{s['id']}/events", json=ev, headers=h).json()
    assert first["results"][0]["status"] == "applied" and again["results"][0]["status"] == "duplicate"
    assert again["session"]["count"] == 1


def test_batch_replay_counts_each_event_once(client):
    h = _register(client)
    s = _start(client, h)
    events = [_ev(1) for _ in range(5)]
    r1 = client.post(f"/api/v1/bhakti/jaap/sessions/{s['id']}/events/batch", json={"events": events}, headers=h).json()
    r2 = client.post(f"/api/v1/bhakti/jaap/sessions/{s['id']}/events/batch", json={"events": events + [_ev(2)]}, headers=h).json()
    assert r1["session"]["count"] == 5
    assert [x["status"] for x in r2["results"]] == ["duplicate"] * 5 + ["applied"]
    assert r2["session"]["count"] == 7


def test_decrement_never_goes_below_zero(client):
    h = _register(client)
    s = _start(client, h)
    client.post(f"/api/v1/bhakti/jaap/sessions/{s['id']}/events", json=_ev(2), headers=h)
    out = client.post(f"/api/v1/bhakti/jaap/sessions/{s['id']}/events", json=_ev(-10), headers=h).json()
    assert out["session"]["count"] == 0
    assert client.get("/api/v1/bhakti/jaap/analytics", headers=h).json()["today"] == 0


def test_session_completes_at_target_and_rejects_more(client):
    h = _register(client)
    s = _start(client, h, target=3)
    out = client.post(f"/api/v1/bhakti/jaap/sessions/{s['id']}/events", json=_ev(3), headers=h).json()
    assert out["session"]["status"] == "completed"
    assert client.post(f"/api/v1/bhakti/jaap/sessions/{s['id']}/events", json=_ev(1), headers=h).status_code == 409


def test_resume_active_session(client):
    h = _register(client)
    assert client.get("/api/v1/bhakti/jaap/sessions/active", headers=h).json()["session"] is None
    s = _start(client, h)
    client.post(f"/api/v1/bhakti/jaap/sessions/{s['id']}/events", json=_ev(4), headers=h)
    got = client.get("/api/v1/bhakti/jaap/sessions/active", headers=h).json()["session"]
    assert got["id"] == s["id"] and got["count"] == 4


def test_users_cannot_touch_each_others_sessions(client):
    alice, bob = _register(client, "alice"), _register(client, "bob")
    s = _start(client, alice)
    assert client.post(f"/api/v1/bhakti/jaap/sessions/{s['id']}/events", json=_ev(1), headers=bob).status_code == 404
    assert client.patch(f"/api/v1/bhakti/jaap/sessions/{s['id']}", json={"status": "paused"}, headers=bob).status_code == 404
    client.post(f"/api/v1/bhakti/jaap/sessions/{s['id']}/events", json=_ev(5), headers=alice)
    assert client.get("/api/v1/bhakti/jaap/analytics", headers=bob).json()["lifetime"] == 0
    assert client.get("/api/v1/bhakti/jaap/history", headers=bob).json()["total"] == 0


def test_event_ids_are_scoped_per_user(client):
    alice, bob = _register(client, "alice"), _register(client, "bob")
    sa, sb = _start(client, alice), _start(client, bob)
    ev = _ev(1)
    client.post(f"/api/v1/bhakti/jaap/sessions/{sa['id']}/events", json=ev, headers=alice)
    out = client.post(f"/api/v1/bhakti/jaap/sessions/{sb['id']}/events", json=ev, headers=bob).json()
    assert out["results"][0]["status"] == "applied"


def test_validation_rejects_bad_input(client):
    h = _register(client)
    s = _start(client, h)
    bad = {"event_id": "short", "delta": 1}
    assert client.post(f"/api/v1/bhakti/jaap/sessions/{s['id']}/events", json=bad, headers=h).status_code == 422
    assert client.post(f"/api/v1/bhakti/jaap/sessions/{s['id']}/events", json=_ev(5000), headers=h).status_code == 422
    assert client.post("/api/v1/bhakti/jaap/sessions", json={"mantra_id": _mantra_id(client), "mode": "x"}, headers=h).status_code == 422


def test_analytics_history_and_report(client):
    h = _register(client)
    s = _start(client, h, target=1000)
    client.post(f"/api/v1/bhakti/jaap/sessions/{s['id']}/events", json=_ev(108), headers=h)
    a = client.get("/api/v1/bhakti/jaap/analytics", headers=h).json()
    assert a["today"] == 108 and a["lifetime"] == 108 and a["malas"] == 1 and a["streak"] == 1
    assert a["by_mantra"][0]["mantra"] == "Radhe Radhe" and a["milestones"][0]["reached"] is True
    hist = client.get("/api/v1/bhakti/jaap/history?page_size=5", headers=h).json()
    assert hist["total"] == 1 and hist["items"][0]["count"] == 108
    csv_body = client.get("/api/v1/bhakti/jaap/report.csv", headers=h)
    assert csv_body.headers["content-type"].startswith("text/csv") and "Radhe Radhe,108" in csv_body.text


def test_custom_mantra_is_private_to_owner(client):
    alice, bob = _register(client, "alice"), _register(client, "bob")
    m = client.post("/api/v1/bhakti/mantras/custom", json={"text": "Jai Shri Shyam"}, headers=alice).json()
    assert m["is_custom"] is True
    assert all(x["id"] != m["id"] for x in client.get("/api/v1/bhakti/mantras", headers=bob).json())
    assert any(x["id"] == m["id"] for x in client.get("/api/v1/bhakti/mantras", headers=alice).json())
    assert client.post("/api/v1/bhakti/jaap/sessions", json={"mantra_id": m["id"]}, headers=bob).status_code == 404
