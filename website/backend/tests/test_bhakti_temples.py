"""Mandir Darshan: seeded temples carry no invented timings, nearby logic, admin-only writes, URL and timings-source rules."""
import uuid

import pytest
from fastapi.testclient import TestClient

from packages.database.models import User
from packages.database.session import SessionLocal, init_db
from website.backend.app.api import bhakti_temples
from website.backend.app.main import app


@pytest.fixture(scope="module")
def client():
    init_db()
    with SessionLocal() as db:
        bhakti_temples.seed_temples_if_missing(db)
        bhakti_temples.seed_temples_if_missing(db)  # twice: must not duplicate
    with TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"}) as c:
        yield c


def _user(client, admin=False):
    email = f"tm-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!x", "full_name": "T"})
    if admin:
        with SessionLocal() as db:
            db.query(User).filter(User.email == email).update({"role": "admin"})
            db.commit()
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _body(**kw):
    base = {"slug": f"t-{uuid.uuid4().hex[:8]}", "name_en": "Test Mandir", "name_hi": "परीक्षण मंदिर", "city": "Testpur", "state": "Teststate",
            "summary": "A test temple.", "source": "Test fixture", "published": True}
    base.update(kw)
    return base


def test_seeded_temples_listed_once_without_timings(client):
    items = client.get("/api/v1/bhakti/temples").json()
    slugs = [t["slug"] for t in items]
    assert len(slugs) == len(set(slugs)) and {"kashi-vishwanath", "somnath", "tirumala-venkateswara"} <= set(slugs)
    for slug in slugs[:12]:
        d = client.get(f"/api/v1/bhakti/temples/{slug}").json()
        assert d["timings_note"] is None and d["is_verified"] is False and d["source"]


def test_official_urls_are_https_only_and_known(client):
    for t in client.get("/api/v1/bhakti/temples").json():
        d = client.get(f"/api/v1/bhakti/temples/{t['slug']}").json()
        assert d["official_url"] is None or d["official_url"].startswith("https://")


def test_filter_search_states_and_404(client):
    assert client.get("/api/v1/bhakti/temples/states").json() == sorted(set(client.get("/api/v1/bhakti/temples/states").json()))
    gujarat = client.get("/api/v1/bhakti/temples?state=Gujarat").json()
    assert gujarat and all(t["state"] == "Gujarat" for t in gujarat)
    assert any(t["slug"] == "kashi-vishwanath" for t in client.get("/api/v1/bhakti/temples?q=varanasi").json())
    assert any(t["slug"] == "kashi-vishwanath" for t in client.get("/api/v1/bhakti/temples?q=काशी").json())
    assert client.get("/api/v1/bhakti/temples/nope").status_code == 404


def test_nearby_prefers_same_city_then_same_state(client):
    admin = _user(client, admin=True)
    a, b, c = _body(), _body(), _body(city="Elsewhere")
    for p in (a, b, c):
        assert client.put("/api/v1/bhakti/temples/admin/temple", json=p, headers=admin).status_code == 200
    near = [n["slug"] for n in client.get(f"/api/v1/bhakti/temples/{a['slug']}").json()["nearby"]]
    assert near.index(b["slug"]) < near.index(c["slug"]) and a["slug"] not in near
    # a temple in another state is never offered as nearby
    ay = client.get("/api/v1/bhakti/temples/ram-mandir-ayodhya").json()["nearby"]
    assert all(n["state"] == "Uttar Pradesh" for n in ay)


def test_admin_only_and_publish_rules(client):
    user, admin = _user(client), _user(client, admin=True)
    assert client.put("/api/v1/bhakti/temples/admin/temple", json=_body(), headers={}).status_code == 403
    assert client.put("/api/v1/bhakti/temples/admin/temple", json=_body(), headers=user).status_code == 403
    assert client.put("/api/v1/bhakti/temples/admin/temple", json=_body(source=""), headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/temples/admin/temple", json=_body(official_url="http://insecure.example.com"), headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/temples/admin/temple", json=_body(official_url="javascript:alert(1)"), headers=admin).status_code == 422


def test_timings_need_a_source_link(client):
    admin = _user(client, admin=True)
    assert client.put("/api/v1/bhakti/temples/admin/temple", json=_body(timings_note="6 am - 9 pm"), headers=admin).status_code == 422
    ok = client.put("/api/v1/bhakti/temples/admin/temple", json=_body(timings_note="6 am - 9 pm", timings_source_url="https://example.org/timings"), headers=admin)
    assert ok.status_code == 200 and ok.json()["timings_note"] == "6 am - 9 pm"


def test_unpublished_hidden_and_delete_is_audited(client):
    admin = _user(client, admin=True)
    d = _body(published=False)
    client.put("/api/v1/bhakti/temples/admin/temple", json=d, headers=admin)
    assert client.get(f"/api/v1/bhakti/temples/{d['slug']}").status_code == 404
    assert all(t["slug"] != d["slug"] for t in client.get("/api/v1/bhakti/temples").json())
    assert client.delete(f"/api/v1/bhakti/temples/admin/temple/{d['slug']}", headers=admin).status_code == 200
    actions = {r["action"] for r in client.get("/api/v1/bhakti/admin/audit?limit=200", headers=admin).json() if r["entity"] == "temple" and r["entity_id"] == d["slug"]}
    assert actions == {"create", "delete"}
