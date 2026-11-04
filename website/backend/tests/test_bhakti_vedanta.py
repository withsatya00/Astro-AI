"""Shankaracharya & Vedanta: seeded content is sourced and unverified, officeholders are never listed, publish rules, admin-only."""
import uuid

import pytest
from fastapi.testclient import TestClient

from packages.database.models import User
from packages.database.session import SessionLocal, init_db
from website.backend.app.api import bhakti_vedanta
from website.backend.app.main import app


@pytest.fixture(scope="module")
def client():
    init_db()
    with SessionLocal() as db:
        bhakti_vedanta.seed_articles_if_missing(db)
        bhakti_vedanta.seed_articles_if_missing(db)  # twice: must not duplicate
    with TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"}) as c:
        yield c


def _user(client, admin=False):
    email = f"vd-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!x", "full_name": "T"})
    if admin:
        with SessionLocal() as db:
            db.query(User).filter(User.email == email).update({"role": "admin"})
            db.commit()
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _body(**kw):
    base = {"slug": f"a-{uuid.uuid4().hex[:8]}", "section": "vedanta", "title_en": "Test article", "body": "Some text.",
            "sources": [{"title": "A real source"}], "reviewed_on": "2026-01-01", "published": True}
    base.update(kw)
    return base


def test_every_seeded_item_has_sources_and_is_unverified(client):
    for section in ("shankaracharya", "vedanta"):
        items = client.get(f"/api/v1/bhakti/vedanta/articles?section={section}").json()
        assert items
        for a in items:
            assert a["sources"] and a["body"] and a["reviewed_on"] and a["is_verified"] is False
    slugs = [a["slug"] for s in ("shankaracharya", "vedanta") for a in client.get(f"/api/v1/bhakti/vedanta/articles?section={s}").json()]
    assert len(slugs) == len(set(slugs))


def test_four_peethas_with_note_and_no_officeholder_names(client):
    d = client.get("/api/v1/bhakti/vedanta/peethas").json()
    assert [p["direction"] for p in d["peethas"]] == ["South", "West", "North", "East"]
    assert {p["veda"] for p in d["peethas"]} == {"Rigveda", "Yajurveda", "Samaveda", "Atharvaveda"}
    assert "not listed here" in d["note"]
    assert all(set(p) == {"name", "place", "state", "direction", "veda", "mahavakya", "mahavakya_source"} for p in d["peethas"])  # no officeholder field


def test_filters_and_validation(client):
    qa = client.get("/api/v1/bhakti/vedanta/articles?section=vedanta&kind=qa").json()
    assert qa and all(a["kind"] == "qa" for a in qa)
    assert client.get("/api/v1/bhakti/vedanta/articles?section=other").status_code == 422
    assert client.get("/api/v1/bhakti/vedanta/articles").status_code == 422


def test_admin_only_and_publish_requires_sources_and_date(client):
    user, admin = _user(client), _user(client, admin=True)
    assert client.put("/api/v1/bhakti/vedanta/admin/article", json=_body(), headers={}).status_code == 403
    assert client.put("/api/v1/bhakti/vedanta/admin/article", json=_body(), headers=user).status_code == 403
    assert client.put("/api/v1/bhakti/vedanta/admin/article", json=_body(sources=[]), headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/vedanta/admin/article", json=_body(reviewed_on=""), headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/vedanta/admin/article", json=_body(reviewed_on="03-11-2026"), headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/vedanta/admin/article", json=_body(sources=[{"title": "x", "url": "http://insecure.example.com"}]), headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/vedanta/admin/article", json=_body(), headers=admin).status_code == 200


def test_unpublished_hidden_and_changes_audited(client):
    admin = _user(client, admin=True)
    d = _body(published=False, sources=[], reviewed_on="")
    assert client.put("/api/v1/bhakti/vedanta/admin/article", json=d, headers=admin).status_code == 200
    assert all(a["slug"] != d["slug"] for a in client.get("/api/v1/bhakti/vedanta/articles?section=vedanta").json())
    client.delete(f"/api/v1/bhakti/vedanta/admin/article/{d['slug']}", headers=admin)
    actions = {r["action"] for r in client.get("/api/v1/bhakti/admin/audit?limit=200", headers=admin).json() if r["entity"] == "article" and r["entity_id"] == d["slug"]}
    assert actions == {"create", "delete"}
