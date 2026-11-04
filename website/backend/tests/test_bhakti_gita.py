"""Bhagavad Gita: seeded chapters and starter verses, publish rules, search, daily verse, bookmarks and progress isolation."""
import uuid

import pytest
from fastapi.testclient import TestClient

from packages.database.models import User
from packages.database.session import SessionLocal, init_db
from website.backend.app.api import bhakti, bhakti_gita
from website.backend.app.main import app


@pytest.fixture(scope="module")
def client():
    init_db()
    with SessionLocal() as db:
        bhakti.seed_bhakti_if_empty(db)
        bhakti_gita.seed_gita_and_library_if_missing(db)
        bhakti_gita.seed_gita_and_library_if_missing(db)  # seeding twice must not duplicate anything
    with TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"}) as c:
        yield c


def _user(client, prefix="gita", admin=False):
    email = f"{prefix}-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!x", "full_name": "T"})
    if admin:
        with SessionLocal() as db:
            db.query(User).filter(User.email == email).update({"role": "admin"})
            db.commit()
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_eighteen_chapters_and_700_verses(client):
    chs = client.get("/api/v1/bhakti/gita/chapters").json()
    assert [c["number"] for c in chs] == list(range(1, 19))
    assert sum(c["verse_count"] for c in chs) == 700
    assert all(c["available"] <= c["verse_count"] for c in chs)


def test_starter_verses_are_flagged_unverified_with_attribution(client):
    ch = client.get("/api/v1/bhakti/gita/chapters/2").json()
    v247 = next(v for v in ch["verses"] if v["verse"] == 47)
    assert v247["text_sa"].startswith("कर्मण्येवाधिकारस्ते") and v247["is_verified"] is False
    assert v247["source"] and v247["license"] and v247["meaning_en"] and v247["meaning_hi"]
    assert client.get("/api/v1/bhakti/gita/chapters/19").status_code == 404


def test_seeded_chalisa_is_in_library_and_unverified(client):
    c = client.get("/api/v1/bhakti/content/hanuman-chalisa").json()
    assert c["is_verified"] is False and c["license"] and c["meaning_hi"] and c["meaning_en"]
    assert c["body_hi"].count("॥") >= 4 and "जय हनुमान ज्ञान गुन सागर" in c["body_hi"]


def test_search_and_daily(client):
    assert any(v["chapter"] == 2 and v["verse"] == 47 for v in client.get("/api/v1/bhakti/gita/search?q=कर्मण्येव").json())
    assert client.get("/api/v1/bhakti/gita/search?q=a").status_code == 422
    d = client.get("/api/v1/bhakti/gita/daily").json()["verse"]
    assert d and d["text_sa"] == client.get("/api/v1/bhakti/gita/daily").json()["verse"]["text_sa"]


def test_admin_publish_rules(client):
    admin, user = _user(client, admin=True), _user(client)
    body = {"chapter": 3, "verse": 35, "text_sa": "श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात् ।", "source": "", "license": "", "published": True}
    assert client.put("/api/v1/bhakti/gita/admin/verse", json=body, headers=user).status_code == 403
    assert client.put("/api/v1/bhakti/gita/admin/verse", json=body, headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/gita/admin/verse", json={**body, "verse": 99, "source": "s", "license": "l"}, headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/gita/admin/verse", json={**body, "source": "Wikisource", "license": "Public domain"}, headers=admin).status_code == 200
    assert any(v["verse"] == 35 for v in client.get("/api/v1/bhakti/gita/chapters/3").json()["verses"])
    draft = {**body, "verse": 36, "published": False}
    client.put("/api/v1/bhakti/gita/admin/verse", json=draft, headers=admin)
    assert all(v["verse"] != 36 for v in client.get("/api/v1/bhakti/gita/chapters/3").json()["verses"])


def test_bookmarks_and_progress_are_private(client):
    alice, bob = _user(client, "alice"), _user(client, "bob")
    vid = next(v["id"] for v in client.get("/api/v1/bhakti/gita/chapters/2").json()["verses"] if v["verse"] == 47)
    assert client.put(f"/api/v1/bhakti/gita/bookmarks/{vid}").status_code == 401
    client.put(f"/api/v1/bhakti/gita/bookmarks/{vid}", headers=alice)
    client.put(f"/api/v1/bhakti/gita/bookmarks/{vid}", headers=alice)  # idempotent
    client.put(f"/api/v1/bhakti/gita/read/{vid}", headers=alice)
    assert len(client.get("/api/v1/bhakti/gita/bookmarks", headers=alice).json()) == 1
    assert client.get("/api/v1/bhakti/gita/bookmarks", headers=bob).json() == []
    mine = client.get("/api/v1/bhakti/gita/chapters/2", headers=alice).json()["verses"]
    theirs = client.get("/api/v1/bhakti/gita/chapters/2", headers=bob).json()["verses"]
    assert next(v for v in mine if v["id"] == vid)["read"] is True and next(v for v in theirs if v["id"] == vid)["read"] is False
    assert next(c for c in client.get("/api/v1/bhakti/gita/chapters", headers=alice).json() if c["number"] == 2)["read"] == 1
    assert client.put("/api/v1/bhakti/gita/bookmarks/not-a-verse", headers=alice).status_code == 404
