"""Ratings, review counts and consultation counts come only from real records, and re-seeding never resets them."""
import uuid

import pytest
from fastapi.testclient import TestClient

from packages.database.models import Astrologer, AstrologerReview
from packages.database.seed_astrologers import seed_astrologers
from packages.database.session import SessionLocal, init_db
from website.backend.app.main import app


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app, headers={"X-Client-Id": "ratings-client-0123456789abcdef"}) as c:
        yield c


def _signed_in():
    c = TestClient(app, headers={"X-Client-Id": f"guest-{uuid.uuid4().hex}"})
    r = c.post("/api/v1/auth/register", json={
        "email": f"rate_{uuid.uuid4().hex[:8]}@example.com", "password": "Password123!", "full_name": "Rater"})
    assert r.status_code == 201, r.text
    c.headers["Authorization"] = "Bearer " + r.json()["access_token"]
    return c


def test_sample_reviews_without_a_user_are_removed_and_counts_follow_reviews(client):
    with SessionLocal() as db:
        astro = db.query(Astrologer).filter(Astrologer.slug == "acharya-shastri").first()
        db.add(AstrologerReview(id=uuid.uuid4().hex, astrologer_id=astro.id, user_id=None, user_name="Sample",
                                rating=5.0, comment="invented sample text", is_verified=True))
        astro.rating, astro.review_count = 5.0, 99
        db.commit()
        seed_astrologers(db)
        db.refresh(astro)
        assert db.query(AstrologerReview).filter(AstrologerReview.astrologer_id == astro.id,
                                                 AstrologerReview.user_id.is_(None)).count() == 0
        real = db.query(AstrologerReview).filter(AstrologerReview.astrologer_id == astro.id).all()
        assert astro.review_count == len(real)
        assert astro.rating == (round(sum(r.rating for r in real) / len(real), 2) if real else 0.0)


def test_review_needs_a_consultation_and_updates_the_rating(client):
    slug = "dr-meenakshi-sharma"
    astro_id = client.get(f"/api/v1/astrologers/{slug}").json()["id"]
    user = _signed_in()
    assert TestClient(app).post(f"/api/v1/astrologers/{astro_id}/reviews", json={"rating": 5, "comment": "great"}).status_code == 401
    assert user.post(f"/api/v1/astrologers/{astro_id}/reviews", json={"rating": 5, "comment": "great"}).status_code == 403
    c = user.post("/api/v1/consultations", json={"astrologer_id": slug, "mode": "chat", "language": "en"})
    assert c.status_code == 201, c.text
    assert user.post(f"/api/v1/consultations/{c.json()['id']}/messages", json={"message": "Namaste", "language": "en"}).status_code == 200
    assert user.post(f"/api/v1/astrologers/{astro_id}/reviews", json={"rating": 4, "comment": "calm and clear"}).status_code == 200
    assert user.post(f"/api/v1/astrologers/{astro_id}/reviews", json={"rating": 1, "comment": "again"}).status_code == 409
    profile = client.get(f"/api/v1/astrologers/{slug}").json()
    assert (profile["rating"], profile["review_count"]) == (4.0, 1)
    # the seeder runs on every start and must keep what real activity produced
    with SessionLocal() as db:
        seed_astrologers(db)
    profile = client.get(f"/api/v1/astrologers/{slug}").json()
    assert (profile["rating"], profile["review_count"]) == (4.0, 1)
