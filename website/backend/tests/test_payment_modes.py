"""Test-mode wallet credit must never exist in production; development keeps working."""
import uuid

import pytest
from fastapi.testclient import TestClient

from packages.core.config import settings
from packages.core.security import create_access_token
from packages.database.models import User
from packages.database.session import SessionLocal, init_db
from website.backend.app.main import app


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"}) as c:
        yield c


def _headers(balance=0.0):
    with SessionLocal() as db:
        user = User(email=f"pm-{uuid.uuid4().hex}@test.in", hashed_password="x", full_name="Pay Mode", wallet_balance=balance)
        db.add(user)
        db.commit()
        return {"Authorization": f"Bearer {create_access_token({'sub': user.id})}"}, user.id


def _balance(user_id):
    with SessionLocal() as db:
        return db.query(User).filter(User.id == user_id).first().wallet_balance


@pytest.fixture()
def no_razorpay(monkeypatch):
    monkeypatch.setattr(settings, "RAZORPAY_KEY_ID", None)
    monkeypatch.setattr(settings, "RAZORPAY_KEY_SECRET", None)


def test_production_without_razorpay_refuses_free_test_credit(client, no_razorpay, monkeypatch):
    monkeypatch.setattr(settings, "APP_ENV", "production")
    headers, user_id = _headers(0.0)
    res = client.post("/api/v1/wallet/recharge", headers=headers, json={"amount": 500})
    assert res.status_code == 409
    assert _balance(user_id) == 0.0
    assert not (settings.RAZORPAY_KEY_ID or settings.RAZORPAY_KEY_SECRET)


def test_production_reports_payments_unavailable_not_test_mode(client, no_razorpay, monkeypatch):
    monkeypatch.setattr(settings, "APP_ENV", "production")
    headers, _ = _headers(0.0)
    assert client.get("/api/v1/wallet/payment-config").json()["provider"] == "unavailable"
    wallet = client.get("/api/v1/wallet", headers=headers).json()
    assert wallet["is_test_mode"] is False and wallet["payments_available"] is False


def test_razorpay_order_endpoint_still_refuses_when_not_configured(client, no_razorpay, monkeypatch):
    monkeypatch.setattr(settings, "APP_ENV", "production")
    headers, _ = _headers(0.0)
    assert client.post("/api/v1/wallet/razorpay/order", headers=headers, json={"amount": 500}).status_code == 409


def test_development_keeps_test_mode(client, no_razorpay, monkeypatch):
    monkeypatch.setattr(settings, "APP_ENV", "development")
    headers, user_id = _headers(0.0)
    assert client.get("/api/v1/wallet/payment-config").json()["provider"] == "test"
    wallet = client.get("/api/v1/wallet", headers=headers).json()
    assert wallet["is_test_mode"] is True and wallet["payments_available"] is True
    assert client.post("/api/v1/wallet/recharge", headers=headers, json={"amount": 500}).status_code == 200
    assert _balance(user_id) == 500.0


def test_app_env_spellings_count_as_production(monkeypatch):
    for value in ("production", "Production", "PROD", " prod "):
        monkeypatch.setattr(settings, "APP_ENV", value)
        assert settings.is_production is True
    for value in ("development", "test", "staging-local"):
        monkeypatch.setattr(settings, "APP_ENV", value)
        assert settings.is_production is False


def test_new_accounts_start_with_empty_wallet(client):
    email = f"fresh-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!x", "full_name": "Fresh"})
    assert res.status_code in (200, 201)
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}
    assert client.get("/api/v1/wallet", headers=headers).json()["balance"] == 0
