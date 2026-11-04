"""Library fixes: an aarti exists, Roman texts line up with the originals and backfill safely, and YouTube videos can be attached to a text."""
import uuid

import pytest
from fastapi.testclient import TestClient

from packages.database.bhakti import BhaktiContent
from packages.database.models import User
from packages.database.session import SessionLocal, init_db
from website.backend.app.api import bhakti, bhakti_gita, bhakti_radio
from website.backend.app.main import app


@pytest.fixture(scope="module")
def client():
    init_db()
    with SessionLocal() as db:
        bhakti.seed_bhakti_if_empty(db)
        bhakti_gita.seed_gita_and_library_if_missing(db)
    with TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"}) as c:
        yield c


@pytest.fixture(autouse=True)
def embeddable(monkeypatch):
    monkeypatch.setattr(bhakti_radio, "check_embeddable", lambda vid: True)


def _user(client, admin=False):
    email = f"lf-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!x", "full_name": "T"})
    if admin:
        with SessionLocal() as db:
            db.query(User).filter(User.email == email).update({"role": "admin"})
            db.commit()
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _lines(text):
    return [l for l in (text or "").split("\n") if l.strip()]


def test_an_aarti_exists_and_the_aarti_filter_finds_it(client):
    items = client.get("/api/v1/bhakti/content?kind=aarti").json()
    assert items["total"] >= 1 and any(i["slug"] == "om-jai-jagdish-hare" for i in items["items"])
    d = client.get("/api/v1/bhakti/content/om-jai-jagdish-hare").json()
    assert d["kind"] == "aarti" and d["is_verified"] is False
    assert d["source"] and d["license"] and d["meaning_hi"] and d["meaning_en"] and d["body_roman"]
    assert d["deity"]["slug"] == "vishnu"


@pytest.mark.parametrize("slug", ["hanuman-chalisa", "om-jai-jagdish-hare"])
def test_roman_text_has_the_same_shape_as_the_original(client, slug):
    d = client.get(f"/api/v1/bhakti/content/{slug}").json()
    assert d["body_roman"].strip()
    hi, ro = d["body_hi"].split("\n\n"), d["body_roman"].split("\n\n")
    assert len(hi) == len(ro), "different number of sections"
    assert [len(_lines(h)) for h in hi] == [len(_lines(r)) for r in ro], "a section has a different number of lines"


def test_chalisa_has_the_full_traditional_structure(client):
    body = client.get("/api/v1/bhakti/content/hanuman-chalisa").json()["body_hi"]
    sections = body.split("\n\n")
    assert [len(_lines(s)) - 1 for s in sections] == [4, 40, 2]  # minus each section's heading line


def test_backfill_fills_a_missing_roman_text_but_never_overwrites_an_edit(client):
    with SessionLocal() as db:
        row = db.query(BhaktiContent).filter(BhaktiContent.slug == "hanuman-chalisa").first()
        original = row.body_roman
        row.body_roman = ""
        db.commit()
        bhakti_gita.seed_gita_and_library_if_missing(db)
        db.refresh(row)
        assert row.body_roman == original  # empty -> filled
        row.body_roman = "EDITED BY AN ADMIN"
        db.commit()
        bhakti_gita.seed_gita_and_library_if_missing(db)
        db.refresh(row)
        assert row.body_roman == "EDITED BY AN ADMIN"  # edit preserved
        row.body_roman = original
        db.commit()


def test_seeding_twice_does_not_duplicate(client):
    with SessionLocal() as db:
        bhakti_gita.seed_gita_and_library_if_missing(db)
        slugs = [s for (s,) in db.query(BhaktiContent.slug).all()]
    assert slugs.count("hanuman-chalisa") == 1 and slugs.count("om-jai-jagdish-hare") == 1


def _embed(slug="hanuman-chalisa", vid=None, **kw):
    base = {"content_slug": slug, "url": f"https://www.youtube.com/watch?v={vid or uuid.uuid4().hex[:11].replace('-', 'a')}",
            "title": "Official video", "channel": "Test Channel", "rights_note": "Official channel; embedding enabled"}
    base.update(kw)
    return base


def test_embed_admin_only_and_validated(client, monkeypatch):
    user, admin = _user(client), _user(client, admin=True)
    for h in ({}, user):
        assert client.put("/api/v1/bhakti/admin/embed", json=_embed(), headers=h).status_code == 403
    assert client.put("/api/v1/bhakti/admin/embed", json=_embed(url="https://vimeo.com/123456789"), headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/admin/embed", json=_embed(rights_note=""), headers=admin).status_code == 422
    assert client.put("/api/v1/bhakti/admin/embed", json=_embed(slug="nope"), headers=admin).status_code == 404
    monkeypatch.setattr(bhakti_radio, "check_embeddable", lambda vid: False)
    r = client.put("/api/v1/bhakti/admin/embed", json=_embed(), headers=admin)
    assert r.status_code == 422 and "embedded" in r.json()["detail"]


def test_embed_appears_publicly_only_when_published_and_can_be_removed(client):
    admin = _user(client, admin=True)
    vid = "Zz9Yy8Xx7Ww"
    ok = client.put("/api/v1/bhakti/admin/embed", json=_embed(vid=vid), headers=admin)
    assert ok.status_code == 200
    public = client.get("/api/v1/bhakti/content/hanuman-chalisa").json()["embeds"]
    assert [e["youtube_id"] for e in public if e["youtube_id"] == vid] == [vid]
    # hidden from visitors when unpublished, still listed for the admin
    client.put("/api/v1/bhakti/admin/embed", json=_embed(vid=vid, published=False), headers=admin)
    assert all(e["youtube_id"] != vid for e in client.get("/api/v1/bhakti/content/hanuman-chalisa").json()["embeds"])
    assert any(e["youtube_id"] == vid for e in client.get("/api/v1/bhakti/admin/content/hanuman-chalisa", headers=admin).json()["embeds"])
    # the same video is updated, not duplicated
    assert len([e for e in client.get("/api/v1/bhakti/admin/content/hanuman-chalisa", headers=admin).json()["embeds"] if e["youtube_id"] == vid]) == 1
    eid = ok.json()["id"]
    assert client.delete(f"/api/v1/bhakti/admin/embed/{eid}", headers=admin).status_code == 200
    assert all(e["youtube_id"] != vid for e in client.get("/api/v1/bhakti/admin/content/hanuman-chalisa", headers=admin).json()["embeds"])
    actions = {r["action"] for r in client.get("/api/v1/bhakti/admin/audit?limit=200", headers=admin).json() if r["entity"] == "embed" and r["entity_id"] == vid}
    assert {"create", "delete"} <= actions
