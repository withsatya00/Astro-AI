"""Bhakti library: publish rules, admin-only writes, audio validation and attribution, favourites isolation, audit log."""
import uuid

import pytest
from fastapi.testclient import TestClient

from packages.database.models import User
from packages.database.session import SessionLocal, init_db
from website.backend.app.api import bhakti, bhakti_content
from website.backend.app.main import app


@pytest.fixture(scope="module")
def client():
    init_db()
    with SessionLocal() as db:
        bhakti.seed_bhakti_if_empty(db)
    with TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"}) as c:
        yield c


@pytest.fixture(autouse=True)
def audio_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(bhakti_content, "AUDIO_DIR", tmp_path / "audio")


def _user(client, prefix="lib", admin=False):
    email = f"{prefix}-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!x", "full_name": "T"})
    assert res.status_code in (200, 201), res.text
    if admin:
        with SessionLocal() as db:
            db.query(User).filter(User.email == email).update({"role": "admin"})
            db.commit()
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _body(slug=None, **kw):
    base = {"slug": slug or f"test-{uuid.uuid4().hex[:8]}", "kind": "aarti", "deity": "ganesh", "title_hi": "परीक्षण आरती", "title_en": "Test Aarti",
            "body_hi": "परीक्षण पाठ", "body_roman": "parikshan path", "source": "Test fixture", "license": "Public domain", "published": True}
    base.update(kw)
    return base


def test_public_list_hides_unpublished(client):
    admin = _user(client, admin=True)
    pub, draft = _body(), _body(published=False)
    assert client.put("/api/v1/bhakti/admin/content", json=pub, headers=admin).status_code == 200
    assert client.put("/api/v1/bhakti/admin/content", json=draft, headers=admin).status_code == 200
    slugs = {i["slug"] for i in client.get("/api/v1/bhakti/content?page_size=100").json()["items"]}
    assert pub["slug"] in slugs and draft["slug"] not in slugs
    assert client.get(f"/api/v1/bhakti/content/{draft['slug']}").status_code == 404
    assert client.get(f"/api/v1/bhakti/content/{pub['slug']}").json()["title_en"] == "Test Aarti"


def test_admin_endpoints_reject_normal_users_and_guests(client):
    user = _user(client)
    for headers in ({}, user):
        assert client.put("/api/v1/bhakti/admin/content", json=_body(), headers=headers).status_code == 403
        assert client.get("/api/v1/bhakti/admin/audit", headers=headers).status_code == 403
        assert client.post("/api/v1/bhakti/admin/audio", data={"content_slug": "x", "title": "t", "source": "s", "license": "l"},
                           files={"file": ("a.mp3", b"ID3....")}, headers=headers).status_code == 403


def test_cannot_publish_without_source_and_licence(client):
    admin = _user(client, admin=True)
    assert client.put("/api/v1/bhakti/admin/content", json=_body(source="", license=""), headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/admin/content", json=_body(source="", license="", published=False), headers=admin).status_code == 200


def test_filters_and_search(client):
    admin = _user(client, admin=True)
    tag = uuid.uuid4().hex[:6]
    a = _body(title_en=f"Alpha {tag}", kind="aarti", deity="ganesh")
    b = _body(title_en=f"Beta {tag}", kind="chalisa", deity="hanuman")
    for p in (a, b):
        client.put("/api/v1/bhakti/admin/content", json=p, headers=admin)
    got = client.get(f"/api/v1/bhakti/content?q={tag}").json()
    assert got["total"] == 2
    assert [i["slug"] for i in client.get(f"/api/v1/bhakti/content?q={tag}&kind=chalisa").json()["items"]] == [b["slug"]]
    assert [i["slug"] for i in client.get(f"/api/v1/bhakti/content?q={tag}&deity=ganesh").json()["items"]] == [a["slug"]]
    assert client.get("/api/v1/bhakti/content?kind=bogus").status_code == 422


def test_invalid_slug_and_unknown_deity_rejected(client):
    admin = _user(client, admin=True)
    assert client.put("/api/v1/bhakti/admin/content", json=_body(slug="Bad Slug!"), headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/admin/content", json=_body(deity="nobody"), headers=admin).status_code == 422


def test_audio_upload_needs_attribution_and_real_audio(client):
    admin = _user(client, admin=True)
    c = _body()
    client.put("/api/v1/bhakti/admin/content", json=c, headers=admin)
    form = {"content_slug": c["slug"], "title": "Recording", "source": "Own recording", "license": "Own recording"}
    # a text file renamed .mp3 is refused
    assert client.post("/api/v1/bhakti/admin/audio", data=form, files={"file": ("fake.mp3", b"hello this is text")}, headers=admin).status_code == 400
    # licence is mandatory
    assert client.post("/api/v1/bhakti/admin/audio", data={**form, "license": " "}, files={"file": ("a.ogg", b"OggS" + b"\0" * 40)}, headers=admin).status_code == 422
    ok = client.post("/api/v1/bhakti/admin/audio", data=form, files={"file": ("a.ogg", b"OggS" + b"\0" * 40)}, headers=admin)
    assert ok.status_code == 201 and ok.json()["url"].endswith(".ogg")
    audio = client.get(f"/api/v1/bhakti/content/{c['slug']}").json()["audio"]
    assert audio[0]["license"] == "Own recording" and audio[0]["source"] == "Own recording"


def test_favourites_are_private_per_user(client):
    admin, alice, bob = _user(client, admin=True), _user(client, "alice"), _user(client, "bob")
    c = _body()
    cid = client.put("/api/v1/bhakti/admin/content", json=c, headers=admin).json()["id"]
    assert client.put(f"/api/v1/bhakti/favourites/{cid}", headers=alice).json()["is_favourite"] is True
    client.put(f"/api/v1/bhakti/favourites/{cid}", headers=alice)  # idempotent
    assert [f["slug"] for f in client.get("/api/v1/bhakti/favourites", headers=alice).json()] == [c["slug"]]
    assert client.get("/api/v1/bhakti/favourites", headers=bob).json() == []
    assert client.get(f"/api/v1/bhakti/content/{c['slug']}", headers=alice).json()["is_favourite"] is True
    assert client.get(f"/api/v1/bhakti/content/{c['slug']}", headers=bob).json()["is_favourite"] is False
    assert client.put(f"/api/v1/bhakti/favourites/{cid}").status_code == 401


def test_admin_actions_are_audited(client):
    admin = _user(client, admin=True)
    c = _body()
    client.put("/api/v1/bhakti/admin/content", json=c, headers=admin)
    client.put("/api/v1/bhakti/admin/content", json={**c, "title_en": "Renamed"}, headers=admin)
    client.delete(f"/api/v1/bhakti/admin/content/{c['slug']}", headers=admin)
    log = [r for r in client.get("/api/v1/bhakti/admin/audit?limit=20", headers=admin).json() if r["entity_id"] == c["slug"]]
    assert {r["action"] for r in log} == {"create", "update", "delete"}
    assert client.get(f"/api/v1/bhakti/content/{c['slug']}").status_code == 404
