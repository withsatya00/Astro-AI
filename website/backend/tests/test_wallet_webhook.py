"""A wallet recharge must be credited exactly once even if the browser never calls /verify (closed tab), and only for wallet orders."""
import hashlib
import hmac
import json
import uuid

import pytest
from fastapi.testclient import TestClient

from packages.database.session import init_db
from website.backend.app.api import wallet as wallet_api
from website.backend.app.main import app

SECRET = "whsec_test"


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"}) as c:
        yield c


def _user(balance=0):
    from packages.core.security import create_access_token
    from packages.database.models import User
    from packages.database.session import SessionLocal
    with SessionLocal() as db:
        user = User(email=f"wh-{uuid.uuid4().hex}@test.in", hashed_password="test", full_name="Webhook User", wallet_balance=balance)
        db.add(user)
        db.commit()
        return user.id, {"Authorization": f"Bearer {create_access_token({'sub': user.id})}"}


def _post(client, body, secret=SECRET, event_id=None):
    raw = json.dumps(body).encode()
    headers = {"X-Razorpay-Signature": hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest(), "Content-Type": "application/json"}
    if event_id:
        headers["X-Razorpay-Event-Id"] = event_id
    return client.post("/api/v1/wallet/razorpay/webhook", content=raw, headers=headers)


def _event(order_id, payment_id, etype="payment.captured"):
    return {"event": etype, "payload": {"payment": {"entity": {"id": payment_id, "order_id": order_id}}}}


@pytest.fixture
def live(monkeypatch):
    monkeypatch.setattr(wallet_api.settings, "RAZORPAY_KEY_ID", "rzp_test_x")
    monkeypatch.setattr(wallet_api.settings, "RAZORPAY_KEY_SECRET", "secret")
    monkeypatch.setattr(wallet_api.settings, "RAZORPAY_WEBHOOK_SECRET", SECRET)


def _fake_order(monkeypatch, order_id, user_id, receipt="w-abc123", status="paid", paid=50000):
    monkeypatch.setattr(wallet_api, "_razorpay", lambda m, p, **kw: {"id": order_id, "status": status, "amount_paid": paid, "receipt": receipt, "notes": {"user_id": user_id}})


def test_webhook_refuses_without_secret_or_with_bad_signature(client, monkeypatch):
    monkeypatch.setattr(wallet_api.settings, "RAZORPAY_WEBHOOK_SECRET", None)
    assert _post(client, _event("order_a1", "pay_a1")).status_code == 503
    monkeypatch.setattr(wallet_api.settings, "RAZORPAY_WEBHOOK_SECRET", SECRET)
    assert _post(client, _event("order_a1", "pay_a1"), secret="wrong").status_code == 400


def test_webhook_credits_an_unconfirmed_recharge_once(client, live, monkeypatch):
    uid, headers = _user()
    oid = f"order_{uuid.uuid4().hex[:12]}"
    _fake_order(monkeypatch, oid, uid)
    assert _post(client, _event(oid, "pay_w1")).json()["status"] == "ok"
    assert client.get("/api/v1/wallet", headers=headers).json()["balance"] == 500
    # redelivery (same event) and a second event for the same order are both no-ops
    assert _post(client, _event(oid, "pay_w1")).json()["status"] == "duplicate"
    assert _post(client, _event(oid, "pay_w1", "order.paid"), event_id="evt-other").json()["status"] == "duplicate"
    assert client.get("/api/v1/wallet", headers=headers).json()["balance"] == 500


def test_webhook_then_browser_verify_does_not_double_credit(client, live, monkeypatch):
    uid, headers = _user()
    oid = f"order_{uuid.uuid4().hex[:12]}"
    _fake_order(monkeypatch, oid, uid)
    assert _post(client, _event(oid, "pay_w2")).json()["status"] == "ok"
    sign = hmac.new(b"secret", f"{oid}|pay_w2".encode(), hashlib.sha256).hexdigest()
    res = client.post("/api/v1/wallet/razorpay/verify", headers=headers, json={"razorpay_order_id": oid, "razorpay_payment_id": "pay_w2", "razorpay_signature": sign})
    assert res.json().get("duplicate") is True
    assert client.get("/api/v1/wallet", headers=headers).json()["balance"] == 500


def test_browser_verify_then_webhook_does_not_double_credit(client, live, monkeypatch):
    uid, headers = _user()
    oid = f"order_{uuid.uuid4().hex[:12]}"
    _fake_order(monkeypatch, oid, uid)
    sign = hmac.new(b"secret", f"{oid}|pay_w3".encode(), hashlib.sha256).hexdigest()
    assert client.post("/api/v1/wallet/razorpay/verify", headers=headers, json={"razorpay_order_id": oid, "razorpay_payment_id": "pay_w3", "razorpay_signature": sign}).json()["new_balance"] == 500
    assert _post(client, _event(oid, "pay_w3")).json()["status"] == "duplicate"
    assert client.get("/api/v1/wallet", headers=headers).json()["balance"] == 500


@pytest.mark.parametrize("kw", [{"receipt": "chadhava-123"}, {"status": "created"}])
def test_webhook_ignores_non_wallet_or_unpaid_orders(client, live, monkeypatch, kw):
    uid, headers = _user()
    oid = f"order_{uuid.uuid4().hex[:12]}"
    _fake_order(monkeypatch, oid, uid, **kw)
    assert _post(client, _event(oid, "pay_w4")).json()["status"] == "ignored"
    assert client.get("/api/v1/wallet", headers=headers).json()["balance"] == 0


def test_webhook_ignores_other_events_and_malformed_ids(client, live, monkeypatch):
    uid, headers = _user()
    assert _post(client, {"event": "payment.failed", "payload": {}}).json()["status"] == "ignored"
    assert _post(client, _event("not-an-order", "pay_w5")).json()["status"] == "ignored"
    assert client.get("/api/v1/wallet", headers=headers).json()["balance"] == 0
