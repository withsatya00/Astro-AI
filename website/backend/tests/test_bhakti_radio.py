"""Bhajan Radio (YouTube embeds): URL parsing, embeddability gate, admin-only writes, filtering, favourites isolation, audit."""
import uuid

import pytest
from fastapi.testclient import TestClient

from packages.database.models import User
from packages.database.session import SessionLocal, init_db
from website.backend.app.api import bhakti_radio
from website.backend.app.main import app


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"}) as c:
        yield c


@pytest.fixture(autouse=True)
def embeddable(monkeypatch):
    monkeypatch.setattr(bhakti_radio, "check_embeddable", lambda vid: True)


def _user(client, prefix="radio", admin=False):
    email = f"{prefix}-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!x", "full_name": "T"})
    if admin:
        with SessionLocal() as db:
            db.query(User).filter(User.email == email).update({"role": "admin"})
            db.commit()
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _vid():
    return uuid.uuid4().hex[:11].replace("-", "a")


def _track(vid=None, **kw):
    base = {"url": f"https://www.youtube.com/watch?v={vid or _vid()}", "title": "Test Bhajan", "category": "krishna",
            "channel": "Test Channel", "rights_note": "Own upload; embedding enabled"}
    base.update(kw)
    return base


@pytest.mark.parametrize("value,expected", [
    ("dQw4w9WgXcQ", "dQw4w9WgXcQ"),
    ("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10", "dQw4w9WgXcQ"),
    ("https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"),
    ("https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
    ("https://m.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
    ("https://evil.example.com/watch?v=dQw4w9WgXcQ", None),
    ("https://www.youtube.com.evil.com/watch?v=dQw4w9WgXcQ", None),
    ("javascript:alert(1)", None),
    ("https://www.youtube.com/watch?v=short", None),
    ("", None),
])
def test_parse_youtube_id(value, expected):
    assert bhakti_radio.parse_youtube_id(value) == expected


def test_admin_only_writes(client):
    user = _user(client)
    for h in ({}, user):
        assert client.put("/api/v1/bhakti/radio/admin/tracks", json=_track(), headers=h).status_code == 403
        assert client.get("/api/v1/bhakti/radio/admin/tracks", headers=h).status_code == 403


def test_add_filter_and_hide_unpublished(client):
    admin = _user(client, admin=True)
    a, b = _track(category="shiva", title="Alpha Shiva"), _track(category="morning", title="Beta Morning", published=False)
    assert client.put("/api/v1/bhakti/radio/admin/tracks", json=a, headers=admin).status_code == 200
    assert client.put("/api/v1/bhakti/radio/admin/tracks", json=b, headers=admin).status_code == 200
    shiva = client.get("/api/v1/bhakti/radio/tracks?category=shiva").json()
    assert any(t["title"] == "Alpha Shiva" for t in shiva)
    assert all(t["title"] != "Beta Morning" for t in client.get("/api/v1/bhakti/radio/tracks?category=morning").json())
    assert any(t["title"] == "Alpha Shiva" for t in client.get("/api/v1/bhakti/radio/tracks?q=alpha").json())


def test_rejects_bad_link_unknown_category_and_missing_rights(client):
    admin = _user(client, admin=True)
    assert client.put("/api/v1/bhakti/radio/admin/tracks", json=_track(url="https://vimeo.com/123"), headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/radio/admin/tracks", json=_track(category="pop"), headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/radio/admin/tracks", json=_track(rights_note=""), headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/radio/admin/tracks", json=_track(channel=""), headers=admin).status_code == 422


def test_embedding_disabled_video_is_refused(client, monkeypatch):
    admin = _user(client, admin=True)
    monkeypatch.setattr(bhakti_radio, "check_embeddable", lambda vid: False)
    res = client.put("/api/v1/bhakti/radio/admin/tracks", json=_track(), headers=admin)
    assert res.status_code == 422 and "embedded" in res.json()["detail"]


def test_unreachable_youtube_still_saves_but_reports_unchecked(client, monkeypatch):
    admin = _user(client, admin=True)
    monkeypatch.setattr(bhakti_radio, "check_embeddable", lambda vid: None)
    res = client.put("/api/v1/bhakti/radio/admin/tracks", json=_track(), headers=admin)
    assert res.status_code == 200 and res.json()["embed_checked"] is False


def test_same_video_is_updated_not_duplicated(client):
    admin = _user(client, admin=True)
    vid = _vid()
    client.put("/api/v1/bhakti/radio/admin/tracks", json=_track(vid, title="One"), headers=admin)
    client.put("/api/v1/bhakti/radio/admin/tracks", json=_track(vid, title="Two"), headers=admin)
    assert [t["title"] for t in client.get("/api/v1/bhakti/radio/tracks").json() if t["youtube_id"] == vid] == ["Two"]


def test_favourites_private_and_audit(client):
    admin, alice, bob = _user(client, admin=True), _user(client, "alice"), _user(client, "bob")
    t = client.put("/api/v1/bhakti/radio/admin/tracks", json=_track(), headers=admin).json()
    assert client.put(f"/api/v1/bhakti/radio/favourites/{t['id']}").status_code == 401
    client.put(f"/api/v1/bhakti/radio/favourites/{t['id']}", headers=alice)
    client.put(f"/api/v1/bhakti/radio/favourites/{t['id']}", headers=alice)
    assert [f["id"] for f in client.get("/api/v1/bhakti/radio/favourites", headers=alice).json()] == [t["id"]]
    assert client.get("/api/v1/bhakti/radio/favourites", headers=bob).json() == []
    assert next(x for x in client.get("/api/v1/bhakti/radio/tracks", headers=alice).json() if x["id"] == t["id"])["is_favourite"] is True
    assert client.delete(f"/api/v1/bhakti/radio/admin/tracks/{t['id']}", headers=admin).status_code == 200
    assert client.get("/api/v1/bhakti/radio/favourites", headers=alice).json() == []
    actions = {r["action"] for r in client.get("/api/v1/bhakti/admin/audit?limit=200", headers=admin).json() if r["entity"] == "bhajan_track" and r["entity_id"] == t["youtube_id"]}
    assert actions == {"create", "delete"}
