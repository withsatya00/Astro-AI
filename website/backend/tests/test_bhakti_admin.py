"""Admin CMS support: the admin-only lists include drafts, are closed to everyone else, and the page stays out of crawlers."""
import uuid

import pytest
from fastapi.testclient import TestClient

from packages.database.models import User
from packages.database.session import SessionLocal, init_db
from website.backend.app.api import bhakti, bhakti_gita, bhakti_temples, bhakti_vedanta
from website.backend.app.main import app


@pytest.fixture(scope="module")
def client():
    init_db()
    with SessionLocal() as db:
        bhakti.seed_bhakti_if_empty(db)
        bhakti_gita.seed_gita_and_library_if_missing(db)
        bhakti_temples.seed_temples_if_missing(db)
        bhakti_vedanta.seed_articles_if_missing(db)
    with TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"}) as c:
        yield c


def _user(client, admin=False):
    email = f"adm-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!x", "full_name": "T"})
    if admin:
        with SessionLocal() as db:
            db.query(User).filter(User.email == email).update({"role": "admin"})
            db.commit()
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


ADMIN_LISTS = ["/api/v1/bhakti/temples/admin/list", "/api/v1/bhakti/vedanta/admin/articles", "/api/v1/bhakti/gita/admin/verses",
               "/api/v1/bhakti/admin/content", "/api/v1/bhakti/radio/admin/tracks", "/api/v1/bhakti/admin/audit"]


@pytest.mark.parametrize("url", ADMIN_LISTS)
def test_admin_lists_closed_to_guests_and_normal_users(client, url):
    assert client.get(url).status_code == 403
    assert client.get(url, headers=_user(client)).status_code == 403
    assert client.get(url, headers=_user(client, admin=True)).status_code == 200


def test_admin_lists_include_drafts_that_public_endpoints_hide(client):
    admin = _user(client, admin=True)
    slug = f"draft-{uuid.uuid4().hex[:8]}"
    t = {"slug": slug, "name_en": "Draft Mandir", "name_hi": "मंदिर", "city": "C", "state": "S", "published": False}
    assert client.put("/api/v1/bhakti/temples/admin/temple", json=t, headers=admin).status_code == 200
    assert any(x["slug"] == slug and x["published"] is False for x in client.get("/api/v1/bhakti/temples/admin/list", headers=admin).json())
    assert all(x["slug"] != slug for x in client.get("/api/v1/bhakti/temples").json())

    a = {"slug": slug, "section": "vedanta", "title_en": "Draft", "published": False}
    assert client.put("/api/v1/bhakti/vedanta/admin/article", json=a, headers=admin).status_code == 200
    assert any(x["slug"] == slug and x["sort_order"] == 0 for x in client.get("/api/v1/bhakti/vedanta/admin/articles", headers=admin).json())

    v = {"chapter": 3, "verse": 30, "text_sa": "draft verse", "published": False}
    assert client.put("/api/v1/bhakti/gita/admin/verse", json=v, headers=admin).status_code == 200
    mine = [x for x in client.get("/api/v1/bhakti/gita/admin/verses?chapter=3", headers=admin).json() if x["verse"] == 30]
    assert mine and mine[0]["published"] is False
    assert all(x["verse"] != 30 for x in client.get("/api/v1/bhakti/gita/chapters/3").json()["verses"])
    assert client.get("/api/v1/bhakti/gita/admin/verses?chapter=19", headers=admin).status_code == 422


def test_unpublishing_removes_from_public_and_keeps_in_admin(client):
    admin = _user(client, admin=True)
    slug = f"flip-{uuid.uuid4().hex[:8]}"
    t = {"slug": slug, "name_en": "Flip", "name_hi": "फ्लिप", "city": "C", "state": "S", "summary": "text", "source": "src", "published": True}
    client.put("/api/v1/bhakti/temples/admin/temple", json=t, headers=admin)
    assert client.get(f"/api/v1/bhakti/temples/{slug}").status_code == 200
    client.put("/api/v1/bhakti/temples/admin/temple", json={**t, "published": False}, headers=admin)
    assert client.get(f"/api/v1/bhakti/temples/{slug}").status_code == 404
    assert any(x["slug"] == slug for x in client.get("/api/v1/bhakti/temples/admin/list", headers=admin).json())


def test_admin_page_is_disallowed_for_crawlers(client):
    assert "Disallow: /bhakti/admin" in client.get("/robots.txt").text
