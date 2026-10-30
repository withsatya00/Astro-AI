"""Gau Sewa donations: order validation, server-side payment verification, webhook idempotency, receipts and admin access."""
import hashlib
import hmac
import json
import uuid

import pytest
from fastapi.testclient import TestClient

from packages.database.models import Donation, Gaushala, User
from packages.database.session import SessionLocal, init_db
from website.backend.app.api import gau_sewa as gs
from website.backend.app.main import app

KEY_SECRET = "test_key_secret"
WEBHOOK_SECRET = "test_webhook_secret"


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app, headers={"X-Client-Id": "test-client-0123456789abcdef"}) as c:
        yield c


@pytest.fixture(autouse=True)
def razorpay_env(monkeypatch):
    monkeypatch.setattr(gs.settings, "RAZORPAY_KEY_ID", "rzp_test_x")
    monkeypatch.setattr(gs.settings, "RAZORPAY_KEY_SECRET", KEY_SECRET)
    monkeypatch.setattr(gs.settings, "RAZORPAY_WEBHOOK_SECRET", WEBHOOK_SECRET)
    monkeypatch.setattr(gs.settings, "SMTP_HOST", None)


class FakeRazorpay:
    """Stands in for the Razorpay HTTP API: remembers orders and serves whatever payment a test registers."""
    def __init__(self):
        self.payments = {}
        self.orders = []

    def __call__(self, method, path, **kw):
        if method == "POST" and path == "/orders":
            oid = "order_" + uuid.uuid4().hex[:12]
            self.orders.append({"id": oid, **kw["json"]})
            return {"id": oid}
        if method == "GET" and path.startswith("/payments/"):
            return self.payments[path.rsplit("/", 1)[1]]
        raise AssertionError(f"unexpected provider call {method} {path}")

    def pay(self, order_id, amount, status="captured", currency="INR", **extra):
        pid = "pay_" + uuid.uuid4().hex[:12]
        self.payments[pid] = {"id": pid, "order_id": order_id, "amount": amount, "currency": currency, "status": status, **extra}
        return pid


@pytest.fixture()
def rzp(monkeypatch):
    fake = FakeRazorpay()
    monkeypatch.setattr(gs, "_razorpay", fake)
    return fake


def _signature(order_id, payment_id, secret=KEY_SECRET):
    return hmac.new(secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()


def _register(client, prefix="donor"):
    email = f"{prefix}-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/v1/auth/register", json={"email": email, "password": "Passw0rd!x", "full_name": "Test Donor"})
    assert res.status_code in (200, 201), res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}, email


def _make_admin(email):
    with SessionLocal() as db:
        db.query(User).filter(User.email == email).update({"role": "admin"})
        db.commit()


@pytest.fixture()
def gaushala():
    """An enabled recipient; the previous test's one is replaced so each test starts from a known state."""
    with SessionLocal() as db:
        db.query(Gaushala).update({"donations_enabled": False})
        g = Gaushala(slug="g-" + uuid.uuid4().hex[:8], name="Test Gaushala", location="Test City", beneficiary_name="Test Trust",
                     donations_enabled=True, is_active=True, photos="[]")
        db.add(g)
        db.commit()
        return g.id


def _order(client, headers=None, **overrides):
    body = {"amount": 501, "purpose": "chaara", "donor_name": "Ram Kumar", "donor_email": "ram@example.com", "hide_name_public": False}
    body.update(overrides)
    return client.post("/api/v1/gau-sewa/donations/order", json=body, headers=headers or {})


def _pay(client, rzp, order, status="captured", amount=None):
    pid = rzp.pay(order["order_id"], order["amount"] if amount is None else amount, status=status)
    return pid, {"razorpay_order_id": order["order_id"], "razorpay_payment_id": pid, "razorpay_signature": _signature(order["order_id"], pid)}


def _donation(order_id):
    with SessionLocal() as db:
        d = db.query(Donation).filter(Donation.provider_order_id == order_id).first()
        db.expunge(d)
        return d


def _webhook(client, event, secret=WEBHOOK_SECRET, event_id=None):
    body = json.dumps(event).encode()
    headers = {"X-Razorpay-Signature": hmac.new(secret.encode(), body, hashlib.sha256).hexdigest(), "Content-Type": "application/json"}
    if event_id:
        headers["X-Razorpay-Event-Id"] = event_id
    return client.post("/api/v1/gau-sewa/webhook", content=body, headers=headers)


# ------------------------------------------------------------------ availability
def test_donations_are_closed_without_payment_config_or_recipient(client, rzp, monkeypatch):
    with SessionLocal() as db:
        db.query(Gaushala).update({"donations_enabled": False})
        db.commit()
    cfg = client.get("/api/v1/gau-sewa/config").json()
    assert cfg["available"] is False and cfg["reason"] == "recipient_not_configured"
    assert _order(client).status_code == 503
    assert rzp.orders == []

    monkeypatch.setattr(gs.settings, "RAZORPAY_KEY_SECRET", None)
    assert client.get("/api/v1/gau-sewa/config").json()["reason"] == "payments_not_configured"
    assert _order(client).status_code == 503


def test_recipient_cannot_be_enabled_without_beneficiary(client):
    headers, email = _register(client)
    _make_admin(email)
    res = client.post("/api/v1/gau-sewa/admin/gaushalas", headers=headers, json={"name": "No Beneficiary", "donations_enabled": True})
    assert res.status_code == 422


# ------------------------------------------------------------------ order creation
def test_order_validates_amount_purpose_and_stores_integer_paise(client, rzp, gaushala):
    assert client.get("/api/v1/gau-sewa/config").json()["available"] is True
    ok = _order(client, amount=1100, purpose="chikitsa")
    assert ok.status_code == 200, ok.text
    body = ok.json()
    assert body["amount"] == 110000 and body["currency"] == "INR"
    assert rzp.orders[-1]["amount"] == 110000 and isinstance(rzp.orders[-1]["amount"], int)
    d = _donation(body["order_id"])
    assert d.amount_paise == 110000 and d.status == "PENDING" and d.user_id is None and d.recipient_name == "Test Trust"

    for bad in ({"amount": 5}, {"amount": 100001}, {"amount": 501.5}, {"amount": "501"}, {"amount": True},
                {"purpose": "tax"}, {"donor_name": " "}, {"donor_email": "not-an-email"}):
        assert _order(client, **bad).status_code == 422, bad
    count_before = len(rzp.orders)
    assert _order(client, gaushala_id="does-not-exist").status_code == 422
    assert len(rzp.orders) == count_before  # nothing was sent to the provider for rejected requests


def test_donation_never_touches_wallet(client, rzp, gaushala):
    headers, _ = _register(client)
    before = client.get("/api/v1/wallet", headers=headers).json()["balance"]
    order = _order(client, headers).json()
    _, verify = _pay(client, rzp, order)
    assert client.post("/api/v1/gau-sewa/donations/verify", json=verify).json()["status"] == "SUCCESS"
    wallet = client.get("/api/v1/wallet", headers=headers).json()
    assert wallet["balance"] == before
    assert all("gau" not in (t.get("description") or "").lower() for t in wallet["transactions"])


# ------------------------------------------------------------------ verification
def test_verify_succeeds_only_after_provider_confirms_and_is_idempotent(client, rzp, gaushala):
    order = _order(client).json()
    pid, verify = _pay(client, rzp, order)
    res = client.post("/api/v1/gau-sewa/donations/verify", json=verify)
    assert res.status_code == 200 and res.json()["status"] == "SUCCESS" and res.json()["verified"] is True
    assert res.json()["receipt_token"]
    again = client.post("/api/v1/gau-sewa/donations/verify", json=verify).json()
    assert again["status"] == "SUCCESS" and again["duplicate"] is True
    with SessionLocal() as db:
        assert db.query(Donation).filter(Donation.provider_order_id == order["order_id"]).count() == 1
    assert _donation(order["order_id"]).provider_payment_id == pid


def test_verify_rejects_bad_signature_and_unknown_order(client, rzp, gaushala):
    order = _order(client).json()
    pid, verify = _pay(client, rzp, order)
    forged = {**verify, "razorpay_signature": _signature(order["order_id"], pid, secret="wrong")}
    assert client.post("/api/v1/gau-sewa/donations/verify", json=forged).status_code == 400
    assert _donation(order["order_id"]).status == "PENDING"
    missing = {**verify, "razorpay_order_id": "order_unknown"}
    assert client.post("/api/v1/gau-sewa/donations/verify", json=missing).status_code == 404


def test_verify_rejects_wrong_amount_currency_or_order_even_with_valid_signature(client, rzp, gaushala):
    order = _order(client, amount=501).json()
    # Valid signature, but the provider says a smaller amount was captured.
    _, short = _pay(client, rzp, order, amount=10100)
    assert client.post("/api/v1/gau-sewa/donations/verify", json=short).status_code == 400
    # Wrong currency.
    pid = rzp.pay(order["order_id"], order["amount"], currency="USD")
    usd = {"razorpay_order_id": order["order_id"], "razorpay_payment_id": pid, "razorpay_signature": _signature(order["order_id"], pid)}
    assert client.post("/api/v1/gau-sewa/donations/verify", json=usd).status_code == 400
    # Payment belongs to a different order.
    other = _order(client, amount=501).json()
    pid = rzp.pay(other["order_id"], 50100)
    swapped = {"razorpay_order_id": order["order_id"], "razorpay_payment_id": pid, "razorpay_signature": _signature(order["order_id"], pid)}
    assert client.post("/api/v1/gau-sewa/donations/verify", json=swapped).status_code == 400
    assert _donation(order["order_id"]).status == "PENDING"


def test_verify_does_not_accept_authorized_but_uncaptured_payment(client, rzp, gaushala):
    order = _order(client).json()
    _, verify = _pay(client, rzp, order, status="authorized")
    res = client.post("/api/v1/gau-sewa/donations/verify", json=verify)
    assert res.status_code == 200 and res.json()["status"] == "PENDING" and res.json()["verified"] is False
    assert _donation(order["order_id"]).status == "PENDING"


def test_verify_unavailable_when_payments_not_configured(client, rzp, gaushala, monkeypatch):
    order = _order(client).json()
    _, verify = _pay(client, rzp, order)
    monkeypatch.setattr(gs.settings, "RAZORPAY_KEY_ID", None)
    assert client.post("/api/v1/gau-sewa/donations/verify", json=verify).status_code == 503


# ------------------------------------------------------------------ webhook
def _captured_event(order, pid, amount=None):
    return {"event": "payment.captured", "payload": {"payment": {"entity": {
        "id": pid, "order_id": order["order_id"], "amount": order["amount"] if amount is None else amount, "currency": "INR", "status": "captured"}}}}


def test_webhook_rejects_bad_signature_and_missing_secret(client, rzp, gaushala, monkeypatch):
    order = _order(client).json()
    event = _captured_event(order, "pay_x")
    assert _webhook(client, event, secret="wrong").status_code == 400
    assert _donation(order["order_id"]).status == "PENDING"
    monkeypatch.setattr(gs.settings, "RAZORPAY_WEBHOOK_SECRET", None)
    assert _webhook(client, event).status_code == 503


def test_webhook_settles_once_and_duplicates_are_ignored(client, rzp, gaushala):
    order = _order(client).json()
    event = _captured_event(order, "pay_hook1")
    eid = "evt_" + uuid.uuid4().hex
    first = _webhook(client, event, event_id=eid)
    assert first.status_code == 200 and first.json()["status"] == "ok"
    assert _donation(order["order_id"]).status == "SUCCESS"
    dup = _webhook(client, event, event_id=eid)
    assert dup.json()["status"] == "duplicate"
    # Same payment redelivered under a new event id: the guarded transition keeps it a single donation.
    _webhook(client, event, event_id="evt_" + uuid.uuid4().hex)
    with SessionLocal() as db:
        assert db.query(Donation).filter(Donation.provider_order_id == order["order_id"]).count() == 1
    # Verify afterwards is a no-op duplicate, not a second donation.
    verify = {"razorpay_order_id": order["order_id"], "razorpay_payment_id": "pay_hook1", "razorpay_signature": _signature(order["order_id"], "pay_hook1")}
    assert client.post("/api/v1/gau-sewa/donations/verify", json=verify).json()["duplicate"] is True


def test_webhook_with_wrong_amount_never_changes_donation(client, rzp, gaushala):
    order = _order(client, amount=501).json()
    res = _webhook(client, _captured_event(order, "pay_short", amount=100), event_id="evt_" + uuid.uuid4().hex)
    assert res.status_code == 200 and res.json()["status"] == "mismatch"
    assert _donation(order["order_id"]).status == "PENDING"


def test_webhook_ignores_orders_that_are_not_donations(client, rzp, gaushala):
    event = {"event": "payment.captured", "payload": {"payment": {"entity": {"id": "pay_w", "order_id": "order_wallet", "amount": 100, "currency": "INR", "status": "captured"}}}}
    assert _webhook(client, event, event_id="evt_" + uuid.uuid4().hex).json()["status"] == "ignored"


def test_failed_then_captured_and_refund_states(client, rzp, gaushala):
    order = _order(client).json()
    failed = {"event": "payment.failed", "payload": {"payment": {"entity": {
        "id": "pay_f1", "order_id": order["order_id"], "amount": order["amount"], "currency": "INR", "status": "failed", "error_description": "Card declined"}}}}
    _webhook(client, failed, event_id="evt_" + uuid.uuid4().hex)
    d = _donation(order["order_id"])
    assert d.status == "FAILED" and d.failure_reason == "Card declined"
    # The donor retries on the same order and it is captured: FAILED may become SUCCESS.
    _webhook(client, _captured_event(order, "pay_f2"), event_id="evt_" + uuid.uuid4().hex)
    assert _donation(order["order_id"]).status == "SUCCESS"
    # A late "failed" webhook must not downgrade a successful donation.
    _webhook(client, failed, event_id="evt_" + uuid.uuid4().hex)
    assert _donation(order["order_id"]).status == "SUCCESS"
    # Partial refund keeps SUCCESS; full refund becomes REFUNDED.
    def refund(amount, status):
        return {"event": "refund.processed", "payload": {
            "refund": {"entity": {"id": "rfnd_1", "payment_id": "pay_f2", "amount": amount}},
            "payment": {"entity": {"id": "pay_f2", "order_id": order["order_id"], "amount": order["amount"], "currency": "INR", "status": status, "amount_refunded": amount}}}}
    _webhook(client, refund(10000, "captured"), event_id="evt_" + uuid.uuid4().hex)
    d = _donation(order["order_id"])
    assert d.status == "SUCCESS" and d.refunded_paise == 10000
    _webhook(client, refund(order["amount"], "refunded"), event_id="evt_" + uuid.uuid4().hex)
    d = _donation(order["order_id"])
    assert d.status == "REFUNDED" and d.refunded_paise == order["amount"] and d.refunded_at is not None


# ------------------------------------------------------------------ receipts & history
def test_receipt_requires_unguessable_token_and_confirmed_payment(client, rzp, gaushala):
    order = _order(client).json()
    token = order["receipt_token"]
    assert len(token) >= 32
    info = client.get(f"/api/v1/gau-sewa/donations/receipt/{token}").json()
    assert info["status"] == "PENDING" and info["receipt_available"] is False
    assert client.get(f"/api/v1/gau-sewa/donations/receipt/{token}/download").status_code == 409
    _, verify = _pay(client, rzp, order)
    client.post("/api/v1/gau-sewa/donations/verify", json=verify)
    done = client.get(f"/api/v1/gau-sewa/donations/receipt/{token}").json()
    assert done["status"] == "SUCCESS" and done["receipt_available"] and done["amount"] == 501 and done["reference"].startswith("GS-")
    dl = client.get(f"/api/v1/gau-sewa/donations/receipt/{token}/download")
    assert dl.status_code == 200 and "attachment" in dl.headers["content-disposition"]
    assert done["reference"] in dl.text and "not a tax exemption certificate" in dl.text
    # Wrong, truncated and enumerable-looking tokens never resolve.
    for bad in (token[:-1] + ("a" if token[-1] != "a" else "b"), token[:10], done["reference"], done["id"], "x" * 43):
        assert client.get(f"/api/v1/gau-sewa/donations/receipt/{bad}").status_code == 404


def test_receipt_escapes_donor_name(client, rzp, gaushala):
    order = _order(client, donor_name='<script>alert(1)</script>').json()
    _, verify = _pay(client, rzp, order)
    client.post("/api/v1/gau-sewa/donations/verify", json=verify)
    html = client.get(f"/api/v1/gau-sewa/donations/receipt/{order['receipt_token']}/download").text
    assert "<script>alert(1)</script>" not in html and "&lt;script&gt;" in html


def test_history_is_private_to_the_signed_in_user(client, rzp, gaushala):
    alice, _ = _register(client, "alice")
    bob, _ = _register(client, "bob")
    a_order = _order(client, alice).json()
    _order(client).json()  # guest donation: belongs to nobody's history
    assert client.get("/api/v1/gau-sewa/donations/mine").status_code == 401
    mine = client.get("/api/v1/gau-sewa/donations/mine", headers=alice).json()["donations"]
    assert [d["reference"] for d in mine] == [a_order["reference"]]
    assert client.get("/api/v1/gau-sewa/donations/mine", headers=bob).json()["donations"] == []
    assert "donor_email" not in mine[0] and "donor_name" not in mine[0]


def test_public_endpoints_never_expose_donor_details(client, rzp, gaushala):
    order = _order(client, donor_name="Private Person", donor_email="private@example.com").json()
    _, verify = _pay(client, rzp, order)
    client.post("/api/v1/gau-sewa/donations/verify", json=verify)
    for url in ("/api/v1/gau-sewa/config", "/api/v1/gau-sewa/gaushalas", "/api/v1/gau-sewa/updates"):
        text = client.get(url).text
        assert "Private Person" not in text and "private@example.com" not in text


# ------------------------------------------------------------------ admin
def test_admin_endpoints_require_admin_and_show_totals(client, rzp, gaushala):
    user, _ = _register(client, "plain")
    admin, admin_email = _register(client, "admin")
    _make_admin(admin_email)
    for method, url in (("get", "/admin/donations"), ("get", "/admin/gaushalas"), ("get", "/admin/updates")):
        assert getattr(client, method)("/api/v1/gau-sewa" + url).status_code == 403
        assert getattr(client, method)("/api/v1/gau-sewa" + url, headers=user).status_code == 403
    assert client.post("/api/v1/gau-sewa/admin/updates", headers=user, json={"title": "Hello"}).status_code == 403

    paid = _order(client, amount=1100, purpose="chikitsa", donor_name="Paid Donor").json()
    _, verify = _pay(client, rzp, paid)
    client.post("/api/v1/gau-sewa/donations/verify", json=verify)
    _order(client, amount=101, donor_name="Pending Donor")

    res = client.get("/api/v1/gau-sewa/admin/donations?q=Paid Donor", headers=admin).json()
    assert res["total"] == 1 and res["donations"][0]["donor_name"] == "Paid Donor" and res["donations"][0]["donor_email"]
    assert res["totals"]["collected_paise"] == 110000 and res["totals"]["by_purpose_paise"]["chikitsa"] == 110000
    pending = client.get("/api/v1/gau-sewa/admin/donations?status=PENDING&q=Pending Donor", headers=admin).json()
    assert pending["totals"]["collected_paise"] == 0 and pending["total"] == 1  # pending money is never counted as collected
    assert client.get("/api/v1/gau-sewa/admin/donations?status=BOGUS", headers=admin).status_code == 422


def test_admin_has_no_way_to_mark_a_donation_paid(client, gaushala):
    admin, admin_email = _register(client, "admin2")
    _make_admin(admin_email)
    order = None
    paths = {r.path for r in app.routes if hasattr(r, "path") and "gau-sewa" in r.path}
    assert not any(any(word in p for word in ("mark", "paid", "success", "settle")) for p in paths)
    assert client.patch("/api/v1/gau-sewa/admin/donations/x", headers=admin, json={"status": "SUCCESS"}).status_code in (404, 405)
    assert order is None


def test_admin_manages_gaushala_and_updates_and_public_sees_only_published(client):
    admin, email = _register(client, "content")
    _make_admin(email)
    g = client.post("/api/v1/gau-sewa/admin/gaushalas", headers=admin, json={
        "name": "Sample Gaushala", "location": "Somewhere", "photos": ["https://example.com/a.jpg"],
        "beneficiary_name": "Sample Trust", "donations_enabled": False}).json()
    assert g["slug"] and g["photos"] == ["https://example.com/a.jpg"]
    assert client.post("/api/v1/gau-sewa/admin/gaushalas", headers=admin, json={"name": "Bad", "photos": ["javascript:alert(1)"]}).status_code == 422
    draft = client.post("/api/v1/gau-sewa/admin/updates", headers=admin, json={"title": "Draft update", "gaushala_id": g["id"]}).json()
    live = client.post("/api/v1/gau-sewa/admin/updates", headers=admin, json={"title": "Live update", "is_published": True}).json()
    titles = [u["title"] for u in client.get("/api/v1/gau-sewa/updates").json()["updates"]]
    assert "Live update" in titles and "Draft update" not in titles
    publish = client.put(f"/api/v1/gau-sewa/admin/updates/{draft['id']}", headers=admin, json={"title": "Draft update", "is_published": True}).json()
    assert publish["published_at"]
    assert client.delete(f"/api/v1/gau-sewa/admin/updates/{live['id']}", headers=admin).json()["deleted"] is True
    assert "Live update" not in [u["title"] for u in client.get("/api/v1/gau-sewa/updates").json()["updates"]]


def test_receipt_email_only_sent_when_smtp_configured(client, rzp, gaushala, monkeypatch):
    sent = []
    monkeypatch.setattr(gs.mailer, "send_email", lambda to, subject, body: sent.append((to, subject, body)) or True)
    order = _order(client, donor_email="mail@example.com").json()
    _, verify = _pay(client, rzp, order)
    client.post("/api/v1/gau-sewa/donations/verify", json=verify)
    assert sent == []  # SMTP not configured: no email attempted, receipt stays downloadable
    monkeypatch.setattr(gs.settings, "SMTP_HOST", "smtp.example.com")
    monkeypatch.setattr(gs.settings, "SMTP_FROM", "noreply@example.com")
    order2 = _order(client, donor_email="mail2@example.com").json()
    _, verify2 = _pay(client, rzp, order2)
    client.post("/api/v1/gau-sewa/donations/verify", json=verify2)
    assert len(sent) == 1 and sent[0][0] == "mail2@example.com" and "tax exemption" in sent[0][2]
    client.post("/api/v1/gau-sewa/donations/verify", json=verify2)  # duplicate callback must not email again
    assert len(sent) == 1
