"""First-party analytics: fixed event names, short scalar props, admin-only summary, and server-side money events."""
import uuid

import pytest
from fastapi.testclient import TestClient

from packages.core.security import create_access_token
from packages.database.analytics import SiteEvent
from packages.database.models import User
from packages.database.session import SessionLocal, init_db
from website.backend.app.api import events as events_api
from website.backend.app.main import app


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"}) as c:
        yield c


def _user(role="client", balance=0.0):
    with SessionLocal() as db:
        u = User(email=f"ev-{uuid.uuid4().hex}@test.in", hashed_password="x", full_name="Ev", role=role, wallet_balance=balance)
        db.add(u)
        db.commit()
        return {"Authorization": f"Bearer {create_access_token({'sub': u.id})}"}


def _count(name, **props):
    with SessionLocal() as db:
        rows = db.query(SiteEvent).filter(SiteEvent.name == name).all()
        return len([r for r in rows if all(r.props.get(k) == v for k, v in props.items())])


def test_collects_a_known_event_and_stores_no_identity(client):
    sid = "s" + uuid.uuid4().hex[:12]
    res = client.post("/api/v1/events", json={"name": "page_view", "path": "/bhakti", "session_id": sid, "props": {"lang": "hi"}})
    assert res.status_code == 204
    with SessionLocal() as db:
        row = db.query(SiteEvent).filter(SiteEvent.session_id == sid).one()
        assert row.path == "/bhakti" and row.props == {"lang": "hi"}
        assert not hasattr(row, "ip") and not hasattr(row, "user_id")


@pytest.mark.parametrize("body", [
    {"name": "made_up_event"},
    {"name": "wallet_recharged"},  # money events cannot be reported by the browser
    {"name": "page_view", "props": {"a": {"nested": 1}}},
    {"name": "page_view", "props": {"text": "x" * 200}},
    {"name": "page_view", "props": {f"k{i}": i for i in range(9)}},
    {"name": "page_view", "props": {"bad key!": 1}},
    {"name": "page_view", "session_id": "has spaces"},
])
def test_rejects_unknown_server_only_or_oversized_events(client, body):
    assert client.post("/api/v1/events", json=body).status_code == 422


def test_rate_limit_blocks_a_flood(client, monkeypatch):
    monkeypatch.setattr(events_api, "LIMIT_PER_MINUTE", 3)
    events_api._hits.clear()
    codes = [client.post("/api/v1/events", json={"name": "page_view"}).status_code for _ in range(5)]
    assert codes[:3] == [204, 204, 204] and codes[3:] == [429, 429]
    events_api._hits.clear()


def test_summary_is_admin_only_and_counts_events(client):
    events_api._hits.clear()
    assert client.get("/api/v1/events/admin/summary").status_code == 403
    assert client.get("/api/v1/events/admin/summary", headers=_user()).status_code == 403
    client.post("/api/v1/events", json={"name": "page_view", "path": "/summary-test", "session_id": "ssum1"})
    data = client.get("/api/v1/events/admin/summary", headers=_user(role="admin")).json()
    assert data["by_name"]["page_view"] >= 1
    assert any(p["path"] == "/summary-test" for p in data["top_pages"])
    assert data["sessions"] >= 1 and data["daily"]


def test_registration_and_booking_record_server_side_events(client):
    before = _count("sign_up")
    r = client.post("/api/v1/auth/register", json={"email": f"reg-{uuid.uuid4().hex}@test.in", "password": "Passw0rd!x1", "full_name": "Reg"})
    assert r.status_code == 201, r.text
    assert _count("sign_up") == before + 1


def test_test_mode_recharge_records_an_event(client):
    headers = _user()
    before = _count("wallet_recharged", method="test")
    res = client.post("/api/v1/wallet/recharge", headers=headers, json={"amount": 250})
    assert res.status_code == 200, res.text
    assert _count("wallet_recharged", method="test") == before + 1
