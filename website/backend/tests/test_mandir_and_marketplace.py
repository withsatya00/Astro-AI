"""
Mandir Seva (E-Chadawa) and Astro Mall: sign-in rules, pricing (coupon / points / membership), variants, cart,
tracking, seller KYC + certificates + payouts, priests, packages, certificates, reminders, alerts and the
English / Hindi catalog.
"""
import re
import uuid
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from website.backend.app.main import app
from packages.core.security import create_access_token
from packages.database.models import Coupon, MarketplaceProduct, User
from packages.database.session import SessionLocal, init_db

GUEST = {"X-Client-Id": "test-devotee-123456789abcdef"}


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app, headers=GUEST) as c:
        yield c


def _make_user(role="client", balance=50000.0, phone=None):
    db = SessionLocal()
    try:
        user = User(email=f"{uuid.uuid4().hex[:10]}@test.in", full_name="Test User", hashed_password="x", role=role,
                    wallet_balance=balance, is_active=True, phone=phone)
        db.add(user)
        db.commit()
        uid = user.id
    finally:
        db.close()
    return uid, {"Authorization": f"Bearer {create_access_token(data={'sub': uid, 'role': role})}"}


def _user_row(uid):
    db = SessionLocal()
    try:
        u = db.query(User).filter(User.id == uid).first()
        return {"wallet": u.wallet_balance, "points": u.loyalty_points or 0}
    finally:
        db.close()


def _balance(uid):
    return _user_row(uid)["wallet"]


def _has_devanagari(value):
    return bool(re.search(r"[ऀ-ॿ]", str(value or "")))


def _booking_payload(offering_id, **over):
    data = {"offering_id": offering_id, "devotee_name": "राहुल शर्मा", "devotee_phone": "9876543210",
            "gotra": "भारद्वाज (Bharadwaj)", "rashi": "मेष", "sankalp_purpose": "स्वास्थ्य एवं दीर्घायु लाभ", "include_prasad": False}
    data.update(over)
    return data


def _offering(client, idx=0, slug="mahakaleshwar-ujjain"):
    return client.get(f"/api/v1/mandir/temples/{slug}").json()["offerings"][idx]


def _product(client, **kw):
    prods = client.get("/api/v1/marketplace/products").json()["products"]
    return next(p for p in prods if p["stock"] > 5 and not p["has_options"] and (kw.get("max_price") is None or p["price"] <= kw["max_price"]))


def _emerald(client):
    return next(p for p in client.get("/api/v1/marketplace/products").json()["products"] if p["has_options"])


def _set_stock(product_id, stock):
    db = SessionLocal()
    try:
        db.query(MarketplaceProduct).filter(MarketplaceProduct.id == product_id).update({"stock": stock})
        db.commit()
    finally:
        db.close()


ORDER = {"buyer_name": "आदित्य वर्मा", "buyer_phone": "9812345678", "buyer_gotra": "शांडिल्य",
         "shipping_address": "402, शांति कुंज अपार्टमेंट्स, साकेत, नई दिल्ली - 110017"}


def _order_body(product, qty=1, **over):
    body = dict(ORDER, items=[{"product_id": product["id"], "quantity": qty}])
    body.update(over)
    return body


def _approved_seller(client, admin):
    uid, auth = _make_user(role="client")
    assert client.post("/api/v1/seller/register", headers=auth, json={"business_name": "Test Ashram", "phone": "9876500000",
                                                                       "upi_id": "ashram@upi", "pan_number": "ABCDE1234F"}).status_code == 200
    doc = client.post("/api/v1/seller/kyc-document", headers=auth, files={"file": ("pan.pdf", b"%PDF-1.4 test", "application/pdf")})
    assert doc.status_code == 200, doc.text
    assert client.patch(f"/api/v1/shop-admin/sellers/{uid}", headers=admin, json={"approve": True}).status_code == 200
    return uid, auth


def _png(size=(400, 400)):
    import io
    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", size, (200, 120, 40)).save(buf, "PNG")
    return buf.getvalue()


def _live_product(client, seller_auth, admin, **over):
    up = client.post("/api/v1/marketplace/seller/upload-image", headers=seller_auth, files={"file": ("p.png", _png(), "image/png")})
    assert up.status_code == 200, up.text
    payload = {"seller_name": "Pt. Test", "title": "Hand strung Rudraksha Mala " + uuid.uuid4().hex[:5], "category": "mala",
               "description": "Hand strung rudraksha mala energized by chanting.", "price": 1000, "stock": 20, "image_url": up.json()["url"]}
    payload.update(over)
    res = client.post("/api/v1/marketplace/seller/add-product", headers=seller_auth, json=payload)
    assert res.status_code == 200, res.text
    pid = res.json()["product_id"]
    assert client.patch(f"/api/v1/marketplace/admin/products/{pid}/approve", headers=admin).status_code == 200
    return pid


@pytest.fixture(scope="module")
def admin():
    return _make_user(role="admin")[1]


# ------------------------------------------------------------------ catalog
def test_temples_and_detail(client):
    data = client.get("/api/v1/mandir/temples").json()
    assert data["total"] >= 5 and len(data["temples"][0]["offerings"]) > 0
    detail = client.get("/api/v1/mandir/temples/mahakaleshwar-ujjain").json()
    assert len(detail["offerings"]) >= 3 and "priests" in detail and "aarti_timings" in detail and "packages" in detail
    assert client.get("/api/v1/mandir/temples/nope").status_code == 404


def test_products_and_detail_fields(client):
    products = client.get("/api/v1/marketplace/products").json()["products"]
    assert len(products) >= 12
    p = _product(client)
    detail = client.get(f"/api/v1/marketplace/products/{p['id']}").json()
    for key in ("images", "options", "return_policy", "seller", "rating_breakdown"):
        assert key in detail
    assert detail["rating"] is None and detail["review_count"] == 0
    assert client.get(f"/api/v1/marketplace/products/{p['id']}/related").json()["products"] is not None
    assert client.get("/api/v1/marketplace/products?category=rudraksha").json()["products"]


# ------------------------------------------------------------------ sign-in is mandatory
def test_everything_that_spends_money_needs_sign_in(client):
    off = _offering(client, 0)
    p = _product(client)
    assert client.post("/api/v1/mandir/chadawa/book", json=_booking_payload(off["id"])).status_code == 401
    assert client.post("/api/v1/mandir/chadawa/quote", json={"offering_id": off["id"]}).status_code == 401
    assert client.post("/api/v1/marketplace/checkout", json=_order_body(p)).status_code == 401
    assert client.post("/api/v1/marketplace/order", json=dict(ORDER, product_id=p["id"])).status_code == 401
    assert client.post(f"/api/v1/marketplace/products/{p['id']}/reviews", json={"rating": 5}).status_code == 401
    assert client.get("/api/v1/cart").status_code == 401
    assert client.get("/api/v1/rewards/summary").status_code == 401
    # reading is open, and a guest simply has nothing yet
    assert client.get("/api/v1/mandir/chadawa/my-bookings").json()["total"] == 0
    assert client.get("/api/v1/marketplace/my-orders").json()["total"] == 0


# ------------------------------------------------------------------ Mandir Seva booking
def test_booking_wallet_flow_cancel_and_privacy(client):
    uid, auth = _make_user(balance=300.0)
    off = _offering(client, 1)  # 251
    res = client.post("/api/v1/mandir/chadawa/book", json=_booking_payload(off["id"]), headers=auth)
    assert res.status_code == 200, res.text
    booking = res.json()["booking"]
    assert booking["booking_number"].startswith("SANKALP-") and booking["status"] == "PAID" and booking["payment_method"] == "WALLET"
    assert booking["video_proof_url"] is None and booking["certificate_available"] is False
    assert _balance(uid) == pytest.approx(300.0 - off["price"])
    assert client.post("/api/v1/mandir/chadawa/book", json=_booking_payload(off["id"]), headers=auth).status_code == 402

    mine = client.get("/api/v1/mandir/chadawa/my-bookings", headers=auth).json()
    assert any(b["id"] == booking["id"] for b in mine["bookings"])
    _, other = _make_user()
    assert client.get("/api/v1/mandir/chadawa/my-bookings", headers=other).json()["total"] == 0
    assert client.post(f"/api/v1/mandir/chadawa/{booking['id']}/cancel", headers=other).status_code == 404

    assert client.post(f"/api/v1/mandir/chadawa/{booking['id']}/cancel", headers=auth).status_code == 200
    assert _balance(uid) == pytest.approx(300.0)
    assert client.post(f"/api/v1/mandir/chadawa/{booking['id']}/cancel", headers=auth).status_code == 409


def test_booking_validation(client):
    _, auth = _make_user()
    assert client.post("/api/v1/mandir/chadawa/book", json=_booking_payload("no-such-id"), headers=auth).status_code == 404
    off = _offering(client, 0)  # no prasad delivery
    assert client.post("/api/v1/mandir/chadawa/book", json=_booking_payload(off["id"], include_prasad=True, delivery_address="long enough address"),
                       headers=auth).status_code == 400
    off2 = _offering(client, 1)
    assert client.post("/api/v1/mandir/chadawa/book", json=_booking_payload(off2["id"], include_prasad=True), headers=auth).status_code == 400
    ok = client.post("/api/v1/mandir/chadawa/book", headers=auth,
                     json=_booking_payload(off2["id"], include_prasad=True, delivery_address="12 Malviya Nagar, Jaipur 302017",
                                           family_members="Sunita Sharma (Bharadwaj), Aarav Sharma"))
    assert ok.status_code == 200
    b = ok.json()["booking"]
    assert b["amount_paid"] == off2["price"] + off2["delivery_fee"] and b["family_members"].startswith("Sunita")


def test_admin_booking_flow_certificate_and_verify(client, admin):
    uid, auth = _make_user()
    off = _offering(client, 0)
    b = client.post("/api/v1/mandir/chadawa/book", json=_booking_payload(off["id"]), headers=auth).json()["booking"]
    url = f"/api/v1/mandir/admin/bookings/{b['id']}"
    assert client.patch(url, json={"status": "COMPLETED"}).status_code == 403
    assert client.patch(url, json={"status": "VIDEO_UPLOADED"}, headers=admin).status_code == 400
    ok = client.patch(url, json={"status": "VIDEO_UPLOADED", "video_proof_url": "https://cdn.test/v.mp4"}, headers=admin)
    assert ok.status_code == 200 and ok.json()["booking"]["video_proof_url"] == "https://cdn.test/v.mp4"

    # certificate only after completion
    assert client.get(f"/api/v1/mandir/chadawa/{b['id']}/certificate", headers=auth).status_code == 409
    before = _user_row(uid)["points"]
    assert client.patch(url, json={"status": "COMPLETED"}, headers=admin).status_code == 200
    assert _user_row(uid)["points"] == before + int(off["price"] // 20)  # points are earned on completion
    for lang in ("en", "hi"):
        pdf = client.get(f"/api/v1/mandir/chadawa/{b['id']}/certificate?lang={lang}", headers=auth)
        assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF") and len(pdf.content) > 5000
    _, other = _make_user()
    assert client.get(f"/api/v1/mandir/chadawa/{b['id']}/certificate", headers=other).status_code == 404

    code = client.get("/api/v1/mandir/chadawa/my-bookings", headers=auth).json()["bookings"][0]["certificate_code"]
    assert code.startswith("SV-")
    v = client.get(f"/api/v1/verify/{code}").json()
    assert v["valid"] and v["kind"] == "seva" and v["booking_number"] == b["booking_number"]
    assert client.get(f"/api/v1/verify/{code}/qr.svg").text.lstrip().startswith("<svg")
    assert client.get("/api/v1/verify/SV-NOPE0000").status_code == 404
    events = client.get(f"/api/v1/mandir/chadawa/{b['id']}/timeline", headers=auth).json()["events"]
    assert [e["status"] for e in events][:1] == ["PAID"] and events[-1]["status"] == "COMPLETED"


# ------------------------------------------------------------------ pricing: coupon, points, membership
def test_coupon_first_order_only_and_limits(client):
    uid, auth = _make_user()
    off = _offering(client, 2)  # 1100
    quote = client.post("/api/v1/mandir/chadawa/quote", json={"offering_id": off["id"], "coupon_code": "welcome10"}, headers=auth).json()
    assert quote["coupon_discount"] == 110.0 and quote["total"] == 990.0
    assert client.post("/api/v1/mandir/chadawa/quote", json={"offering_id": off["id"], "coupon_code": "NOPE"}, headers=auth).status_code == 404
    book = client.post("/api/v1/mandir/chadawa/book", json=_booking_payload(off["id"], coupon_code="WELCOME10"), headers=auth)
    assert book.status_code == 200 and book.json()["booking"]["amount_paid"] == 990.0
    assert _balance(uid) == pytest.approx(50000.0 - 990.0)
    again = client.post("/api/v1/mandir/chadawa/quote", json={"offering_id": off["id"], "coupon_code": "WELCOME10"}, headers=auth)
    assert again.status_code == 400  # per-user limit / first-order only
    # minimum amount
    _, fresh = _make_user()
    cheap = _offering(client, 0)  # 51
    assert client.post("/api/v1/mandir/chadawa/quote", json={"offering_id": cheap["id"], "coupon_code": "WELCOME10"}, headers=fresh).status_code == 400


def test_points_cap_membership_and_free_prasad(client):
    uid, auth = _make_user()
    db = SessionLocal()
    try:
        db.query(User).filter(User.id == uid).update({"loyalty_points": 5000})
        db.commit()
    finally:
        db.close()
    off = _offering(client, 1)  # 251, prasad fee 99
    q = client.post("/api/v1/mandir/chadawa/quote", json={"offering_id": off["id"], "use_points": 5000, "include_prasad": True}, headers=auth).json()
    cap_points = int((251 * 0.20) / 0.5)
    assert q["points_used"] == cap_points and q["points_value"] == pytest.approx(cap_points * 0.5)
    assert q["delivery_fee"] == 99.0 and not q["is_member"]

    assert client.post("/api/v1/rewards/membership", json={"plan": "weekly"}, headers=auth).status_code == 400
    assert client.post("/api/v1/rewards/membership", json={"plan": "monthly"}, headers=auth).status_code == 200
    assert _balance(uid) == pytest.approx(50000.0 - 149.0)
    q2 = client.post("/api/v1/mandir/chadawa/quote", json={"offering_id": off["id"], "include_prasad": True}, headers=auth).json()
    assert q2["is_member"] and q2["delivery_fee"] == 0.0 and q2["delivery_waived"] and q2["total"] == 251.0
    summary = client.get("/api/v1/rewards/summary", headers=auth).json()
    assert summary["membership"]["plan"] == "monthly" and summary["referral_code"].startswith("AJ") and summary["coupons"]

    # points actually leave the balance when booking
    book = client.post("/api/v1/mandir/chadawa/book", json=_booking_payload(off["id"], use_points=100), headers=auth)
    assert book.status_code == 200 and book.json()["booking"]["points_used"] == 100
    assert _user_row(uid)["points"] == 4900


def test_referral_rewards_both_after_first_completed_order(client, admin):
    ref_id, ref_auth = _make_user()
    code = client.get("/api/v1/rewards/summary", headers=ref_auth).json()["referral_code"]
    new_id, new_auth = _make_user()
    assert client.post("/api/v1/rewards/referral", json={"code": "AJZZZZZZ"}, headers=new_auth).status_code == 404
    own = client.get("/api/v1/rewards/summary", headers=new_auth).json()["referral_code"]
    assert client.post("/api/v1/rewards/referral", json={"code": own}, headers=new_auth).status_code == 404
    assert client.post("/api/v1/rewards/referral", json={"code": code}, headers=new_auth).status_code == 200
    assert client.post("/api/v1/rewards/referral", json={"code": code}, headers=new_auth).status_code == 409

    off = _offering(client, 0)
    b = client.post("/api/v1/mandir/chadawa/book", json=_booking_payload(off["id"]), headers=new_auth).json()["booking"]
    client.patch(f"/api/v1/mandir/admin/bookings/{b['id']}", json={"status": "COMPLETED"}, headers=admin)
    assert _user_row(ref_id)["points"] == 100 and _user_row(new_id)["points"] >= 100
    assert client.post("/api/v1/rewards/referral", json={"code": code}, headers=new_auth).status_code == 409


# ------------------------------------------------------------------ Astro Mall orders
def test_checkout_cod_stock_privacy_and_cancel(client):
    uid, auth = _make_user()
    p = _product(client)
    stock0 = p["stock"]
    res = client.post("/api/v1/marketplace/checkout", json=_order_body(p, qty=2), headers=auth)
    assert res.status_code == 200, res.text
    order = res.json()["orders"][0]
    assert order["order_number"].startswith("ASTRO-MALL-") and order["status"] == "PLACED" and order["total_price"] == p["price"] * 2
    assert client.get(f"/api/v1/marketplace/products/{p['id']}").json()["stock"] == stock0 - 2
    assert any(o["order_number"] == order["order_number"] for o in client.get("/api/v1/marketplace/my-orders", headers=auth).json()["orders"])
    _, other = _make_user()
    assert client.get("/api/v1/marketplace/my-orders", headers=other).json()["total"] == 0
    assert client.post(f"/api/v1/marketplace/orders/{order['id']}/cancel", headers=other).status_code == 404
    assert client.post(f"/api/v1/marketplace/orders/{order['id']}/cancel", headers=auth).status_code == 200
    assert client.get(f"/api/v1/marketplace/products/{p['id']}").json()["stock"] == stock0


def test_checkout_validation_and_atomic_cart(client):
    uid, auth = _make_user()
    p = _product(client)
    assert client.post("/api/v1/marketplace/checkout", json=_order_body(p, payment_method="CRYPTO"), headers=auth).status_code == 400
    bad = _order_body(p)
    bad["items"].append({"product_id": "missing", "quantity": 1})
    before = _balance(uid)
    assert client.post("/api/v1/marketplace/checkout", json=dict(bad, payment_method="WALLET"), headers=auth).status_code == 404
    assert _balance(uid) == before
    _set_stock(p["id"], 1)
    assert client.post("/api/v1/marketplace/checkout", json=_order_body(p, qty=2), headers=auth).status_code == 409
    _set_stock(p["id"], 50)
    two = [pr for pr in client.get("/api/v1/marketplace/products").json()["products"] if not pr["has_options"] and pr["stock"] > 5][:2]
    body = dict(ORDER, payment_method="WALLET", items=[{"product_id": x["id"], "quantity": 2} for x in two])
    ok = client.post("/api/v1/marketplace/checkout", json=body, headers=auth)
    assert ok.status_code == 200 and len(ok.json()["orders"]) == 2
    assert _balance(uid) == pytest.approx(before - sum(x["price"] * 2 for x in two))


def test_wallet_order_with_coupon_and_refund(client):
    uid, auth = _make_user()
    p = next(pr for pr in client.get("/api/v1/marketplace/products").json()["products"] if not pr["has_options"] and pr["price"] >= 450 and pr["stock"] > 5)
    res = client.post("/api/v1/marketplace/checkout", json=_order_body(p, payment_method="WALLET", coupon_code="WELCOME10"), headers=auth)
    assert res.status_code == 200, res.text
    order = res.json()["orders"][0]
    expected = round(p["price"] - min(p["price"] * 0.10, 200), 2)
    assert order["total_price"] == pytest.approx(expected) and order["discount_amount"] == pytest.approx(p["price"] - expected)
    assert _balance(uid) == pytest.approx(50000.0 - expected)
    assert client.post(f"/api/v1/marketplace/orders/{order['id']}/cancel", headers=auth).status_code == 200
    assert _balance(uid) == pytest.approx(50000.0)


def test_gemstone_options_ack_and_price(client):
    uid, auth = _make_user()
    gem = _emerald(client)
    detail = client.get(f"/api/v1/marketplace/products/{gem['id']}").json()
    assert [g["key"] for g in detail["options"]] == ["ratti", "metal"] and detail["return_policy"]["gemstone_notice"]
    _set_stock(gem["id"], 20)
    line = {"product_id": gem["id"], "quantity": 1, "options": {"ratti": "5.25", "metal": "gold18"}}
    quote = client.post("/api/v1/marketplace/quote", json={"items": [line]}).json()
    assert quote["totals"]["subtotal"] == gem["price"] + 1200 + 3500 and quote["has_gemstone"]
    assert "5.25" in quote["lines"][0]["options_label"]
    # missing / wrong option
    assert client.post("/api/v1/marketplace/quote", json={"items": [{"product_id": gem["id"]}]}).status_code == 400
    assert client.post("/api/v1/marketplace/quote", json={"items": [dict(line, options={"ratti": "9", "metal": "gold18"})]}).status_code == 400
    body = dict(ORDER, items=[line], payment_method="WALLET")
    assert client.post("/api/v1/marketplace/checkout", json=body, headers=auth).status_code == 400  # advice not acknowledged
    ok = client.post("/api/v1/marketplace/checkout", json=dict(body, gemstone_ack=True), headers=auth)
    assert ok.status_code == 200, ok.text
    assert ok.json()["orders"][0]["unit_price"] == gem["price"] + 4700 and "Gold" in ok.json()["orders"][0]["options_label"]


def test_cart_and_wishlist_follow_the_account(client):
    uid, auth = _make_user()
    prods = [x for x in client.get("/api/v1/marketplace/products").json()["products"] if not x["has_options"]][:3]
    assert client.get("/api/v1/cart", headers=auth).json()["items"] == []
    put = client.put("/api/v1/cart", headers=auth, json={"items": [{"product_id": prods[0]["id"], "quantity": 2}, {"product_id": "ghost", "quantity": 1}]})
    assert [i["quantity"] for i in put.json()["items"]] == [2]
    merged = client.post("/api/v1/cart/merge", headers=auth, json={"items": [{"product_id": prods[0]["id"], "quantity": 9}, {"product_id": prods[1]["id"], "quantity": 1}]})
    qty = {i["product_id"]: i["quantity"] for i in merged.json()["items"]}
    assert qty[prods[0]["id"]] == 10 and qty[prods[1]["id"]] == 1  # capped at 10
    _, other = _make_user()
    assert client.get("/api/v1/cart", headers=other).json()["items"] == []
    client.put("/api/v1/wishlist", headers=auth, json={"product_ids": [prods[0]["id"], prods[0]["id"], prods[2]["id"]]})
    assert sorted(client.get("/api/v1/wishlist", headers=auth).json()["product_ids"]) == sorted([prods[0]["id"], prods[2]["id"]])
    assert client.post("/api/v1/wishlist/merge", headers=auth, json={"product_ids": [prods[1]["id"]]}).json()["product_ids"].count(prods[1]["id"]) == 1


def test_order_tracking_return_review_and_points(client, admin):
    uid, auth = _make_user()
    p = _product(client)
    order = client.post("/api/v1/marketplace/checkout", json=_order_body(p, payment_method="WALLET"), headers=auth).json()["orders"][0]
    url = f"/api/v1/marketplace/admin/orders/{order['id']}"
    assert client.patch(url, json={"status": "DISPATCHED"}, headers=admin).status_code == 400
    client.patch(url, json={"status": "ENERGIZING"}, headers=admin)
    client.patch(url, json={"status": "DISPATCHED", "tracking_id": "EE123456789IN"}, headers=admin)
    track = client.get(f"/api/v1/marketplace/orders/{order['id']}/tracking", headers=auth).json()
    statuses = [s["status"] for s in track["steps"]]
    assert statuses[:3] == ["PLACED", "PAID", "ENERGIZING"] and "DISPATCHED" in statuses
    assert track["tracking_id"] == "EE123456789IN" and "indiapost" in (track["external_url"] or "")
    _, other = _make_user()
    assert client.get(f"/api/v1/marketplace/orders/{order['id']}/tracking", headers=other).status_code == 404

    assert client.post(f"/api/v1/marketplace/products/{p['id']}/reviews", json={"rating": 5}, headers=auth).status_code == 403
    assert client.post(f"/api/v1/marketplace/orders/{order['id']}/return", json={"reason": "arrived broken"}, headers=auth).status_code == 409
    client.patch(url, json={"status": "DELIVERED"}, headers=admin)
    assert _user_row(uid)["points"] == int(order["total_price"] // 20)
    assert client.post(f"/api/v1/marketplace/products/{p['id']}/reviews", json={"rating": 4, "comment": "good"}, headers=auth).json()["rating"] == 4.0
    ret = client.post(f"/api/v1/marketplace/orders/{order['id']}/return", json={"reason": "arrived broken"}, headers=auth)
    assert ret.status_code == 200 and ret.json()["order"]["status"] == "RETURN_REQUESTED"


# ------------------------------------------------------------------ seller dashboard
def test_seller_needs_kyc_then_lists_edits_and_gets_orders(client, admin):
    # not a seller yet
    uid, auth = _make_user()
    payload = {"seller_name": "Pt. Test", "title": "Siddh Rudraksha Mala", "category": "mala",
               "description": "Hand strung rudraksha mala energized by chanting.", "price": 999, "stock": 5}
    assert client.post("/api/v1/marketplace/seller/add-product", json=payload).status_code == 401
    assert client.post("/api/v1/marketplace/seller/add-product", json=payload, headers=auth).status_code == 403
    assert client.post("/api/v1/seller/register", headers=auth, json={"business_name": "X", "pan_number": "BAD"}).status_code in (400, 422)
    client.post("/api/v1/seller/register", headers=auth, json={"business_name": "Test Ashram", "upi_id": "a@upi", "pan_number": "ABCDE1234F"})
    assert client.post("/api/v1/marketplace/seller/add-product", json=payload, headers=auth).status_code == 403  # KYC pending
    assert client.patch(f"/api/v1/shop-admin/sellers/{uid}", headers=admin, json={"approve": True}).status_code == 400  # no document
    assert client.post("/api/v1/seller/kyc-document", headers=auth, files={"file": ("x.exe", b"MZ", "application/octet-stream")}).status_code == 400
    client.post("/api/v1/seller/kyc-document", headers=auth, files={"file": ("pan.pdf", b"%PDF-1.4", "application/pdf")})
    me = client.get("/api/v1/seller/me", headers=auth).json()
    assert me["profile"]["kyc_status"] == "PENDING" and me["profile"]["pan_masked"] == "XXXXXX234F"
    sellers = client.get("/api/v1/shop-admin/sellers?status=PENDING", headers=admin).json()["sellers"]
    assert any(s["user_id"] == uid for s in sellers)
    assert client.get(f"/api/v1/shop-admin/sellers/{uid}/document", headers=admin).status_code == 200
    assert client.get(f"/api/v1/shop-admin/sellers/{uid}/document", headers=auth).status_code == 403
    client.patch(f"/api/v1/shop-admin/sellers/{uid}", headers=admin, json={"approve": True})

    assert client.post("/api/v1/marketplace/seller/add-product", headers=auth, json=dict(payload, image_url="https://evil.test/x.jpg")).status_code == 400
    pid = _live_product(client, auth, admin, price=1000, stock=20)
    detail = client.get(f"/api/v1/marketplace/products/{pid}")
    assert detail.status_code == 200 and detail.json()["has_lab_certificate"] is False and detail.json()["seller"]["verified"]

    # seller edits stock / price and can pause an approved listing
    ed = client.patch(f"/api/v1/seller/products/{pid}", headers=auth, json={"stock": 7, "price": 900})
    assert ed.status_code == 200 and ed.json()["product"]["stock"] == 7 and ed.json()["product"]["price"] == 900
    assert client.patch(f"/api/v1/seller/products/{pid}", headers=auth, json={"price": 5000, "original_price": 100}).status_code == 400
    assert client.patch(f"/api/v1/seller/products/{pid}", headers=auth, json={"paused": True}).status_code == 200
    assert client.get(f"/api/v1/marketplace/products/{pid}").status_code == 404
    client.patch(f"/api/v1/seller/products/{pid}", headers=auth, json={"paused": False})
    _, other_seller = _make_user()
    assert client.patch(f"/api/v1/seller/products/{pid}", headers=other_seller, json={"stock": 1}).status_code == 404
    client.patch(f"/api/v1/seller/products/{pid}", headers=auth, json={"stock": 20, "price": 1000})

    # a buyer orders; the seller sees it, dispatches it; delivery settles earnings
    buyer_id, buyer = _make_user()
    order = client.post("/api/v1/marketplace/checkout", headers=buyer, json=dict(ORDER, payment_method="WALLET", items=[{"product_id": pid, "quantity": 2}])).json()["orders"][0]
    seller_orders = client.get("/api/v1/seller/orders", headers=auth).json()["orders"]
    assert [o["id"] for o in seller_orders] == [order["id"]] and "shipping_address" in seller_orders[0]
    assert client.patch(f"/api/v1/seller/orders/{order['id']}", headers=auth, json={"status": "DELIVERED"}).status_code == 400
    assert client.patch(f"/api/v1/seller/orders/{order['id']}", headers=auth, json={"status": "DISPATCHED"}).status_code == 400  # needs tracking
    assert client.patch(f"/api/v1/seller/orders/{order['id']}", headers=auth, json={"status": "DISPATCHED", "tracking_id": "EE999IN"}).status_code == 200
    assert client.patch(f"/api/v1/seller/orders/{order['id']}", headers=other_seller, json={"status": "ENERGIZING"}).status_code in (403, 404)
    client.patch(f"/api/v1/marketplace/admin/orders/{order['id']}", headers=admin, json={"status": "DELIVERED"})
    earn = client.get("/api/v1/seller/earnings", headers=auth).json()["earnings"]
    assert earn["gross"] == 2000 and earn["commission"] == 200 and earn["net"] == 1800 and earn["available"] == 1800

    assert client.post("/api/v1/seller/payouts", headers=auth, json={"amount": 100}).status_code == 400  # below minimum
    assert client.post("/api/v1/seller/payouts", headers=auth, json={"amount": 5000}).status_code == 400  # above balance
    ok = client.post("/api/v1/seller/payouts", headers=auth, json={"amount": 1000})
    assert ok.status_code == 200 and ok.json()["earnings"]["available"] == 800
    payouts = client.get("/api/v1/shop-admin/payouts?status=REQUESTED", headers=admin).json()["payouts"]
    pay = next(x for x in payouts if x["amount"] == 1000)
    assert client.patch(f"/api/v1/shop-admin/payouts/{pay['id']}", headers=admin, json={"reference": "UTR123456"}).status_code == 200
    assert client.patch(f"/api/v1/shop-admin/payouts/{pay['id']}", headers=admin, json={"reference": "UTR123456"}).status_code == 409
    assert client.get("/api/v1/seller/earnings", headers=auth).json()["earnings"]["paid_out"] == 1000
    titles = [n["title"] for n in client.get("/api/v1/notifications?lang=en", headers=auth).json()["notifications"]]
    assert "Payout sent" in titles and "New order for your item" in titles


def test_lab_certificate_badge_only_after_admin_verifies(client, admin):
    _, seller = _approved_seller(client, admin)
    pid = _live_product(client, seller, admin)
    f = {"file": ("lab.pdf", b"%PDF-1.4 cert", "application/pdf")}
    assert client.post(f"/api/v1/seller/products/{pid}/certificate", headers=seller, data={"lab": "GII", "number": "GII-123"}, files=f).status_code == 200
    assert client.get(f"/api/v1/marketplace/products/{pid}").json()["has_lab_certificate"] is False  # still pending
    pending = client.get("/api/v1/shop-admin/certificates", headers=admin).json()["certificates"]
    assert any(c["product_id"] == pid for c in pending)
    ok = client.patch(f"/api/v1/shop-admin/certificates/{pid}", headers=admin, json={"approve": True})
    code = ok.json()["certificate_code"]
    assert code.startswith("PC-")
    detail = client.get(f"/api/v1/marketplace/products/{pid}").json()
    assert detail["has_lab_certificate"] and detail["certificate"]["lab"] == "GII" and detail["certificate"]["code"] == code
    v = client.get(f"/api/v1/verify/{code}").json()
    assert v["kind"] == "product" and v["lab"] == "GII" and v["certificate_number"] == "GII-123"
    # a rejected upload removes the badge
    client.post(f"/api/v1/seller/products/{pid}/certificate", headers=seller, data={"lab": "GII", "number": "GII-124"}, files=f)
    assert client.get(f"/api/v1/marketplace/products/{pid}").json()["has_lab_certificate"] is False
    client.patch(f"/api/v1/shop-admin/certificates/{pid}", headers=admin, json={"approve": False, "note": "unreadable"})
    assert client.get(f"/api/v1/verify/{code}").status_code == 404


# ------------------------------------------------------------------ priests, live darshan, packages
def test_priests_live_darshan_and_aarti(client, admin):
    slug = "kashi-vishwanath-varanasi"
    assert client.get("/api/v1/mandir/temples/" + slug).json()["priests"] == []  # nothing invented
    _, plain = _make_user()
    assert client.post("/api/v1/shop-admin/priests", headers=plain, json={"name": "Pt. Test"}).status_code == 403
    made = client.post("/api/v1/shop-admin/priests", headers=admin, json={
        "name": "Pt. Ramesh Mishra", "temple_slug": slug, "years_experience": 22, "languages": "Hindi, Sanskrit",
        "bio": "काशी में 22 वर्षों से पूजन।", "bio_en": "Performing pujas in Kashi for 22 years.", "verified": True})
    assert made.status_code == 200
    detail = client.get(f"/api/v1/mandir/temples/{slug}?lang=en").json()
    assert detail["priests"][0]["name"] == "Pt. Ramesh Mishra" and detail["priests"][0]["verified"] and "Kashi" in detail["priests"][0]["bio"]
    priest_id = detail["priests"][0]["id"]

    assert client.patch(f"/api/v1/shop-admin/temples/{slug}", headers=admin, json={"live_url": "http://insecure.test/live"}).status_code == 400
    ok = client.patch(f"/api/v1/shop-admin/temples/{slug}", headers=admin, json={
        "live_url": "https://www.youtube.com/watch?v=abc123XYZ&t=5", "aarti_timings": [{"name": "Mangala Aarti", "time": "03:00"}, {"name": "", "time": "x"}]})
    assert ok.status_code == 200
    detail = client.get(f"/api/v1/mandir/temples/{slug}").json()
    assert detail["live_url"] == "https://www.youtube.com/embed/abc123XYZ"
    assert detail["aarti_timings"] == [{"name": "Mangala Aarti", "time": "03:00"}]
    assert any(t["has_live"] for t in client.get("/api/v1/mandir/temples").json()["temples"])

    # a booking can name a priest of that temple, but not one from another temple
    uid, auth = _make_user()
    off = _offering(client, 0, slug)
    b = client.post("/api/v1/mandir/chadawa/book", headers=auth, json=_booking_payload(off["id"], priest_id=priest_id)).json()["booking"]
    assert b["priest"]["name"] == "Pt. Ramesh Mishra"
    other_off = _offering(client, 0, "mahakaleshwar-ujjain")
    assert client.post("/api/v1/mandir/chadawa/book", headers=auth, json=_booking_payload(other_off["id"], priest_id=priest_id)).status_code == 404


def test_packages_buy_schedule_and_discount(client):
    pkgs = client.get("/api/v1/mandir/packages?lang=en").json()["packages"]
    assert len(pkgs) >= 5
    monday = next(p for p in pkgs if p["slug"] == "kashi-somvar-rudrabhishek")
    assert monday["sessions"] == 4 and monday["price"] == pytest.approx(monday["list_price"] * 0.9)
    uid, auth = _make_user()
    start = (date.today() + timedelta(days=2)).isoformat()
    body = {"devotee_name": "राहुल शर्मा", "gotra": "कश्यप", "start_date": start, "family_members": "Sunita"}
    res = client.post(f"/api/v1/mandir/packages/{monday['slug']}/buy", json=body, headers=auth)
    assert res.status_code == 200, res.text
    bookings = res.json()["bookings"]
    assert len(bookings) == 4 and all(date.fromisoformat(b["scheduled_for"]).weekday() == 0 for b in bookings)
    assert all(b["status"] == "SANKALP_SCHEDULED" for b in bookings)
    assert [date.fromisoformat(b["scheduled_for"]) for b in bookings] == sorted(date.fromisoformat(b["scheduled_for"]) for b in bookings)
    assert sum(b["amount_paid"] for b in bookings) == pytest.approx(monday["price"])
    assert _balance(uid) == pytest.approx(50000.0 - monday["price"])
    nav = client.post("/api/v1/mandir/packages/vaishno-navratri-nav-din/buy", json=body, headers=auth).json()["bookings"]
    assert len(nav) == 9 and (date.fromisoformat(nav[-1]["scheduled_for"]) - date.fromisoformat(nav[0]["scheduled_for"])).days == 8
    assert client.post(f"/api/v1/mandir/packages/{monday['slug']}/buy", json=dict(body, start_date="2020-01-01"), headers=auth).status_code == 400
    assert client.post(f"/api/v1/mandir/packages/{monday['slug']}/buy", json=body).status_code == 401
    assert client.post("/api/v1/mandir/packages/nope/buy", json=body, headers=auth).status_code == 404


# ------------------------------------------------------------------ reminders, alerts, notifications
def test_reminders_and_due_notification(client):
    uid, auth = _make_user()
    assert client.post("/api/v1/mandir/reminders", headers=auth, json={"person_name": "Mom", "kind": "birthday", "month": 2, "day": 31}).status_code == 400
    soon = date.today() + timedelta(days=3)
    rid = client.post("/api/v1/mandir/reminders", headers=auth, json={"person_name": "Sunita", "kind": "birthday", "month": soon.month, "day": soon.day}).json()["id"]
    far = date.today() + timedelta(days=100)
    client.post("/api/v1/mandir/reminders", headers=auth, json={"person_name": "Far", "kind": "anniversary", "month": far.month, "day": far.day})
    from website.backend.app.api.mandir import send_due_reminders
    db = SessionLocal()
    try:
        assert send_due_reminders(db) >= 1
        assert send_due_reminders(db) == 0  # once per year
    finally:
        db.close()
    en = client.get("/api/v1/notifications?lang=en", headers=auth).json()["notifications"]
    hi = client.get("/api/v1/notifications?lang=hi", headers=auth).json()["notifications"]
    assert any("Sunita" in n["body"] for n in en) and any("जन्मदिन" in n["title"] for n in hi)
    assert not any("Far" in n["body"] for n in en)
    assert len(client.get("/api/v1/mandir/reminders", headers=auth).json()["reminders"]) == 2
    assert client.delete(f"/api/v1/mandir/reminders/{rid}", headers=auth).status_code == 200
    _, other = _make_user()
    assert client.delete(f"/api/v1/mandir/reminders/{rid}", headers=other).status_code == 404


def test_whatsapp_alert_sent_only_when_configured(client, admin, monkeypatch):
    from packages.core import messaging
    sent = []

    class _Now:
        def __init__(self, target, args=(), daemon=None):
            self.target, self.args = target, args

        def start(self):
            self.target(*self.args)

    monkeypatch.setattr(messaging.threading, "Thread", _Now)
    monkeypatch.setattr(messaging, "_post", lambda url, data, auth: sent.append(data) or 201)
    uid, auth = _make_user(phone="9876512345")
    p = _product(client)
    order = client.post("/api/v1/marketplace/checkout", json=_order_body(p, payment_method="WALLET"), headers=auth).json()["orders"][0]

    # not configured: nothing is sent
    client.patch(f"/api/v1/marketplace/admin/orders/{order['id']}", headers=admin, json={"status": "DISPATCHED", "tracking_id": "EE1IN"})
    assert sent == []

    monkeypatch.setenv("TWILIO_ACCOUNT_SID", "ACtest")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "token")
    monkeypatch.setenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
    client.patch(f"/api/v1/marketplace/admin/orders/{order['id']}", headers=admin, json={"status": "DELIVERED"})
    assert len(sent) == 1 and sent[0]["To"] == "whatsapp:+919876512345" and order["order_number"] in sent[0]["Body"]
    assert messaging.normalize_phone("98765 12345") == "+919876512345" and messaging.normalize_phone("123") is None


def test_notifications_in_both_languages(client, admin):
    uid, auth = _make_user()
    off = _offering(client, 1)
    booking = client.post("/api/v1/mandir/chadawa/book?lang=en", json=_booking_payload(off["id"]), headers=auth).json()["booking"]
    client.patch(f"/api/v1/mandir/admin/bookings/{booking['id']}", json={"status": "SANKALP_SCHEDULED", "scheduled_for": "2026-11-02 06:00"}, headers=admin)
    en = client.get("/api/v1/notifications?lang=en", headers=auth).json()
    assert "Sankalp booking confirmed" in [n["title"] for n in en["notifications"]] and en["unread"] >= 2
    hi = client.get("/api/v1/notifications?lang=hi", headers=auth).json()["notifications"]
    assert "संकल्प का समय तय हुआ" in [n["title"] for n in hi]
    nid = en["notifications"][0]["id"]
    assert client.post(f"/api/v1/notifications/{nid}/read", headers=auth).status_code == 200
    assert client.post("/api/v1/notifications/read-all", headers=auth).status_code == 200
    assert client.get("/api/v1/notifications", headers=auth).json()["unread"] == 0
    assert client.post(f"/api/v1/notifications/{nid}/read").status_code == 404


# ------------------------------------------------------------------ admin, upload, language
def test_admin_endpoints_need_admin(client):
    for url in ("/api/v1/mandir/admin/bookings", "/api/v1/marketplace/admin/orders", "/api/v1/marketplace/admin/products?pending=true",
                "/api/v1/shop-admin/priests", "/api/v1/shop-admin/coupons", "/api/v1/shop-admin/sellers", "/api/v1/shop-admin/payouts"):
        assert client.get(url).status_code == 403
        assert client.get(url, headers=_make_user()[1]).status_code == 403


def test_admin_video_upload_and_coupons(client, admin):
    files = {"file": ("proof.mp4", b"\x00\x00\x00\x18ftypmp42" + b"0" * 64, "video/mp4")}
    assert client.post("/api/v1/mandir/admin/upload-video", files=files).status_code == 403
    assert client.post("/api/v1/mandir/admin/upload-video", headers=admin, files={"file": ("x.exe", b"MZ", "application/octet-stream")}).status_code == 400
    ok = client.post("/api/v1/mandir/admin/upload-video", headers=admin, files=files)
    assert ok.status_code == 200 and ok.json()["url"].endswith(".mp4") and client.get(ok.json()["url"]).status_code == 200

    code = "T" + uuid.uuid4().hex[:6].upper()
    assert client.post("/api/v1/shop-admin/coupons", headers=admin, json={"code": code, "kind": "flat", "value": 50, "min_amount": 100, "applies_to": "mall"}).status_code == 200
    assert client.post("/api/v1/shop-admin/coupons", headers=admin, json={"code": code, "kind": "flat", "value": 50}).status_code == 409
    assert client.post("/api/v1/shop-admin/coupons", headers=admin, json={"code": "BAD1", "kind": "percent", "value": 500}).status_code == 400
    _, auth = _make_user()
    r = client.post("/api/v1/rewards/coupons/validate", headers=auth, json={"code": code, "scope": "mall", "amount": 500}).json()
    assert r["valid"] and r["discount"] == 50
    assert client.post("/api/v1/rewards/coupons/validate", headers=auth, json={"code": code, "scope": "seva", "amount": 500}).status_code == 400
    client.patch(f"/api/v1/shop-admin/coupons/{code}", headers=admin, json={"code": code, "kind": "flat", "value": 50, "is_active": False})
    assert client.post("/api/v1/rewards/coupons/validate", headers=auth, json={"code": code, "scope": "mall", "amount": 500}).status_code == 404


def test_seller_photo_upload_rules(client):
    files = {"file": ("photo.png", _png(), "image/png")}
    assert client.post("/api/v1/marketplace/seller/upload-image", files=files).status_code == 401
    _, auth = _make_user()
    assert client.post("/api/v1/marketplace/seller/upload-image", headers=auth, files={"file": ("x.png", b"not an image", "image/png")}).status_code == 400
    assert client.post("/api/v1/marketplace/seller/upload-image", headers=auth, files={"file": ("t.png", _png((50, 50)), "image/png")}).status_code == 400
    up = client.post("/api/v1/marketplace/seller/upload-image", headers=auth, files=files)
    assert up.status_code == 200 and client.get(up.json()["url"]).status_code == 200


def test_english_and_hindi_catalog_are_clean(client):
    temples = client.get("/api/v1/mandir/temples?lang=en").json()["temples"]
    for t in temples:
        for field in ("name", "deity", "city", "state", "description"):
            assert not _has_devanagari(t[field]), (t["slug"], field)
        for o in t["offerings"]:
            assert not _has_devanagari(o["title"]) and not _has_devanagari(o["description"])
    from website.backend.app.catalog_i18n import PRODUCTS_EN, SELLERS_EN
    english_titles = {x["title"] for x in PRODUCTS_EN}
    products = [p for p in client.get("/api/v1/marketplace/products?lang=en").json()["products"] if p["title"] in english_titles]
    assert len(products) == 12
    for p in products:
        for field in ("title", "description", "seller_name", "material", "origin", "energized_details"):
            assert not _has_devanagari(p[field]), (p["title"], field)
    hindi = [p for p in client.get("/api/v1/marketplace/products?lang=hi").json()["products"] if p["seller_name"] in SELLERS_EN]
    assert len(hindi) == 12 and not any(re.search(r"[A-Za-z]{3,}", p["title"]) for p in hindi)
    assert _has_devanagari(client.get("/api/v1/mandir/temples?lang=hi").json()["temples"][0]["name"])
    gem = client.get(f"/api/v1/marketplace/products/{_emerald(client)['id']}?lang=hi").json()
    assert all(_has_devanagari(g["label"]) for g in gem["options"]) and _has_devanagari(gem["return_policy"]["text"])


def test_today_suggestions_and_remedies(client):
    assert client.get("/api/v1/marketplace/suggestions").json()["has_chart"] is False
    today = client.get("/api/v1/mandir/today?lang=en").json()
    assert not _has_devanagari(today["weekday_deity"]) and today["weekday_temple"]["slug"]
    from packages.core.remedies import normalize_sign, remedy_for_sign
    assert normalize_sign("मिथुन") == "Gemini" and remedy_for_sign("Gemini")["gem_en"] == "Emerald"
    from packages.database.models import BirthChart
    uid, auth = _make_user()
    db = SessionLocal()
    try:
        db.add(BirthChart(user_id=uid, owner_key=f"u:{uid}", name="Test", date_of_birth="1990-01-01", latitude=28.6, longitude=77.2,
                          timezone_offset=5.5, chart_data={"moon_sign": "Gemini"}, is_default=True))
        db.commit()
    finally:
        db.close()
    shop = client.get("/api/v1/marketplace/suggestions", headers=auth).json()
    assert shop["suggestion"]["lord"] == "Mercury" and any("पन्ना" in p["title"] for p in shop["products"])
    assert client.get("/api/v1/mandir/suggestions", headers=auth).json()["temple"]["slug"] == "siddhivinayak-mumbai"
