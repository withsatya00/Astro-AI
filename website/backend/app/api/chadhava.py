"""Event-based chadhava: selection → verified payment → temple fulfilment → evidence.

Client input never sets prices, paid status, partner confirmation or fulfilment status.
"""
import csv
import hashlib
import hmac
import io
import json
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile, File
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import or_, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from packages.database.session import get_db
from packages.database.models import (User, Temple, TempleOffering, ChadawaBooking, WalletTransaction,
    PaymentWebhookEvent, StatusEvent, generate_uuid, utc_now)
from packages.database.chadhava import ChadhavaEvent, ChadhavaOrder, TempleStaff, PujaInterest
from packages.core.config import settings
from packages.core.notify import notify, record_event
from website.backend.app.api.auth import get_current_user_required
from website.backend.app.api.mandir import _temple_fields, _offering_dict, require_admin, _complete_booking
from website.backend.app.api.wallet import _razorpay

router = APIRouter(prefix="/mandir/chadhava", tags=["Chadhava events"])
STAGES = ["CONFIRMED", "SCHEDULED", "PERFORMED", "VIDEO_AVAILABLE", "COMPLETED"]
MAX_QTY = 99


def utc(value):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def iso(value):
    return utc(value).isoformat() if value else None


def paise(value):
    return int((Decimal(str(value)) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


class EventInput(BaseModel):
    temple_id: str
    title: str = Field(min_length=3, max_length=180)
    title_hi: str = Field("", max_length=180)
    description: str = Field(min_length=10, max_length=2000)
    description_hi: str = Field("", max_length=2000)
    starts_at: datetime
    deadline: datetime
    cancellation_deadline: datetime
    capacity: int = Field(100, ge=1, le=100000)
    mode: Literal["individual", "collective"] = "collective"
    kind: Literal["chadhava", "puja"] = "chadhava"
    benefits_en: list[str] = Field(default_factory=list, max_length=8)
    benefits_hi: list[str] = Field(default_factory=list, max_length=8)
    # Puja: the tiers (and any bundles). Chadhava: optional extra bundles; the temple's single items are always included.
    offering_ids: list[str] = Field(default_factory=list, max_length=60)
    video_hours: int = Field(72, ge=1, le=336)
    unknown_gotra_allowed: bool = False
    partner_confirmed: bool = False
    published: bool = False

    @field_validator("starts_at", "deadline", "cancellation_deadline")
    @classmethod
    def aware(cls, value):
        if value.tzinfo is None:
            raise ValueError("Include the event timezone offset")
        return utc(value)

    @model_validator(mode="after")
    def dates(self):
        if not utc_now() < self.deadline <= self.starts_at:
            raise ValueError("Booking deadline must be in the future and on/before the seva")
        if not utc_now() < self.cancellation_deadline <= self.starts_at:
            raise ValueError("Cancellation deadline must be in the future and on/before the seva")
        if self.published and not self.partner_confirmed:
            raise ValueError("Confirm the temple partnership before publishing")
        if len(set(self.offering_ids)) != len(self.offering_ids):
            raise ValueError("Duplicate offerings")
        return self


class ItemInput(BaseModel):
    offering_id: str
    quantity: int = Field(1, ge=1, le=MAX_QTY)


class Selection(BaseModel):
    event_id: str
    items: list[ItemInput] = Field(min_length=1, max_length=40)


class CheckoutInput(Selection):
    expected_amount_paise: int = Field(gt=0, le=100000000)
    devotee_name: str = Field(min_length=2, max_length=100)
    gotra: str = Field("", max_length=100)
    gotra_unknown: bool = False
    phone: str = Field(min_length=7, max_length=20, pattern=r"^[+\d\s()-]+$")
    family_members: str = Field("", max_length=500)
    purpose: str = Field("", max_length=255)
    payment_method: Literal["wallet", "razorpay"] = "wallet"
    idempotency_key: str = Field(min_length=12, max_length=100, pattern=r"^[A-Za-z0-9_-]+$")

    @field_validator("devotee_name")
    @classmethod
    def name_not_blank(cls, value):
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Enter the devotee's name")
        return value


def expire_holds(db):
    rows = db.query(ChadhavaOrder).filter(ChadhavaOrder.payment_status == "PENDING", ChadhavaOrder.expires_at < utc_now()).all()
    for order in rows:
        claimed = db.query(ChadhavaOrder).filter_by(id=order.id, payment_status="PENDING", capacity_held=True).update(
            {"payment_status": "EXPIRED", "capacity_held": False}, synchronize_session=False)
        if claimed:
            db.query(ChadhavaEvent).filter_by(id=order.event_id).update({"reserved": ChadhavaEvent.reserved - 1})
    db.flush()


def event_offerings(db, event):
    """What an event sells: its listed offerings plus the temple's single items (the chadhava catalogue, or puja add-ons).

    A chadhava event never sells puja tiers; a puja event sells only the tiers listed on it.
    """
    listed = list(event.offering_ids or [])
    rows = db.query(TempleOffering).filter(TempleOffering.temple_id == event.temple_id, TempleOffering.is_active == True,  # noqa
        or_(TempleOffering.id.in_(listed), TempleOffering.category == "item")).all()
    if event.kind != "puja":
        rows = [o for o in rows if o.category != "puja_tier"]
    group = lambda o: 0 if o.category == "puja_tier" else 2 if o.category == "item" else 1
    rows.sort(key=lambda o: (group(o), listed.index(o.id) if o.id in listed else 0, not o.popular, o.sort_order or 0, o.price))
    return rows


def event_json(db, event, lang=None):
    temple = db.get(Temple, event.temple_id)
    offerings = event_offerings(db, event)
    hi = (lang or "").startswith("hi")
    benefits = (event.benefits or {}).get("hi" if hi else "en") or (event.benefits or {}).get("en") or []
    sellable = any(o.category == "puja_tier" for o in offerings) if event.kind == "puja" else bool(offerings)
    return dict(id=event.id, temple_id=event.temple_id, temple_slug=temple.slug, kind=event.kind, benefits=benefits, joined=event.reserved,
        temple=_temple_fields(temple, lang), image_url=temple.image_url,
        title=event.title_hi if hi and event.title_hi else event.title,
        description=event.description_hi if hi and event.description_hi else event.description,
        starts_at=iso(event.starts_at), deadline=iso(event.deadline), cancellation_deadline=iso(event.cancellation_deadline),
        mode=event.mode, capacity=event.capacity, remaining=max(0, event.capacity-event.reserved),
        offerings=[_offering_dict(o, lang) for o in offerings], video_hours=event.video_hours,
        unknown_gotra_allowed=event.unknown_gotra_allowed, published=event.published, partner_confirmed=event.partner_confirmed,
        bookable=sellable and event.published and event.partner_confirmed and temple.is_active and utc(event.deadline)>utc_now() and event.reserved<event.capacity)


def selection_quote(db, selection, lang=None):
    event = db.get(ChadhavaEvent, selection.event_id)
    if not event or not event.published or not event.partner_confirmed:
        raise HTTPException(404, "Chadhava event not found")
    temple = db.get(Temple, event.temple_id)
    if not temple or not temple.is_active or utc(event.deadline) <= utc_now():
        raise HTTPException(409, "Booking has closed for this event")
    ids = [item.offering_id for item in selection.items]
    if len(set(ids)) != len(ids):
        raise HTTPException(422, "Choose each offering once and use its quantity field")
    available = {o.id: o for o in event_offerings(db, event)}
    lines, members_max = [], 1
    for item in selection.items:
        offering = available.get(item.offering_id)
        if not offering:
            raise HTTPException(422, "Selected offering is not available at this event")
        unit = paise(offering.price)
        if unit <= 0:
            raise HTTPException(409, "Offering price needs administrator review")
        if offering.category == "puja_tier":
            members_max = offering.max_members or 1
        text = _offering_dict(offering, lang)
        lines.append(dict(offering_id=offering.id, title=text["title"], description=text["description"], quantity=item.quantity,
                          unit_paise=unit, total_paise=unit*item.quantity, category=offering.category, emoji=offering.emoji))
    tiers = [l for l in lines if l["category"] == "puja_tier"]
    if event.kind == "puja" and (len(tiers) != 1 or tiers[0]["quantity"] != 1):
        raise HTTPException(422, "Choose one puja package")
    if event.kind == "puja":  # the package comes first on receipts and in the temple team's list
        lines.sort(key=lambda l: l["category"] != "puja_tier")
    puja = event.kind == "puja"
    return event, dict(event_id=event.id, kind=event.kind, title=event.title, temple_name=_temple_fields(temple, lang)["name"], temple_slug=temple.slug,
        starts_at=iso(event.starts_at), mode=event.mode, video_hours=event.video_hours, members_max=members_max,
        cancellation_deadline=iso(event.cancellation_deadline), unknown_gotra_allowed=event.unknown_gotra_allowed,
        items=lines, amount_paise=sum(line["total_paise"] for line in lines), currency="INR",
        policy="Full refund before the cancellation deadline while unscheduled. After scheduling, contact support. "
               f"Prasad delivery is not included in this {'puja' if puja else 'chadhava'} event.")


@router.get("/events")
def events(temple_id: str | None = None, lang: str | None = None, db: Session = Depends(get_db)):
    expire_holds(db)
    q = db.query(ChadhavaEvent).join(Temple, Temple.id == ChadhavaEvent.temple_id).filter(
        ChadhavaEvent.published == True, ChadhavaEvent.partner_confirmed == True, Temple.is_active == True, ChadhavaEvent.starts_at > utc_now())  # noqa
    if temple_id:
        q = q.filter(ChadhavaEvent.temple_id == temple_id)
    rows = q.order_by(ChadhavaEvent.starts_at).limit(100).all()
    result = [event_json(db, e, lang) for e in rows]
    db.commit()
    return {"events": result, "razorpay_available": settings.razorpay_enabled}


@router.post("/quote")
def quote(payload: Selection, lang: str | None = None, db: Session = Depends(get_db)):
    return selection_quote(db, payload, lang)[1]


def order_json(db, order):
    booking = db.get(ChadawaBooking, order.booking_id) if order.booking_id else None
    return dict(id=order.id, event_id=order.event_id, snapshot=order.snapshot, amount_paise=order.amount_paise,
        payment_status=order.payment_status, service_status=order.service_status, payment_method=order.payment_method,
        booking_id=order.booking_id, booking_number=booking.booking_number if booking else None,
        provider_order_id=order.provider_order_id, video_url=order.video_url, refund_reference=order.refund_reference,
        expires_at=iso(order.expires_at), created_at=iso(order.created_at), performed_at=iso(order.performed_at),
        video_due_at=(utc(datetime.fromisoformat(order.snapshot["starts_at"])) + timedelta(hours=order.snapshot["video_hours"])).isoformat(),
        razorpay_key_id=settings.RAZORPAY_KEY_ID if order.payment_method == "razorpay" else None,
        can_cancel=order.payment_status == "PAID" and order.service_status == "CONFIRMED" and utc_now()<utc(datetime.fromisoformat(order.snapshot["cancellation_deadline"])))


def fulfil_paid(db, order, payment_ref):
    """Caller locks/claims the pending order. Unique booking_id and CAS prevent duplicates."""
    if order.booking_id:
        return
    if not order.capacity_held or utc(order.expires_at) < utc_now() or order.service_status == "CANCELLED":
        release_capacity(db, order)
        order.service_status = "PAYMENT_REVIEW"
        record_event(db, "chadhava", order.id, "PAYMENT_REVIEW", "Payment arrived after the reservation ended; support must arrange a refund")
        return
    s = order.snapshot
    booking = ChadawaBooking(user_id=order.user_id, owner_key="u:"+order.user_id, offering_id=s["items"][0]["offering_id"],
        booking_number="CH-"+order.id.replace("-", "")[:16].upper(), devotee_name=s["devotee_name"],
        devotee_phone=s["phone"], gotra=s["gotra"], family_members=s["family_members"], sankalp_purpose=s["purpose"],
        amount_paid=order.amount_paise/100, payment_method=order.payment_method.upper(), payment_ref=payment_ref,
        status="PAID", scheduled_for=s["starts_at"], include_prasad=False, certificate_code="SV-"+generate_uuid().replace("-", "")[:8].upper())
    db.add(booking); db.flush()
    order.booking_id = booking.id
    order.service_status = "CONFIRMED"
    record_event(db, "booking", booking.id, "PAID", "Chadhava payment verified; awaiting temple scheduling")
    record_event(db, "chadhava", order.id, "CONFIRMED", "Payment verified")
    notify(db, "u:"+order.user_id, "booking_confirmed", "/mandir-seva", ref=booking.booking_number, title=s["title"])


@router.post("/orders")
def checkout(payload: CheckoutInput, lang: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    digest = hashlib.sha256(json.dumps(payload.model_dump(exclude={"idempotency_key"}), sort_keys=True).encode()).hexdigest()
    existing = db.query(ChadhavaOrder).filter_by(user_id=user.id, idempotency_key=payload.idempotency_key).first()
    if existing:
        if existing.request_hash != digest:
            raise HTTPException(409, "This checkout key was already used for a different selection")
        return order_json(db, existing)
    expire_holds(db)
    event, snapshot = selection_quote(db, payload, lang)
    if snapshot["amount_paise"] != payload.expected_amount_paise:
        raise HTTPException(409, "Offering prices changed. Go back and review the updated total before paying")
    if db.query(ChadhavaOrder).filter_by(user_id=user.id,payment_status="PENDING").count() >= 5:
        raise HTTPException(409,"You already have five pending reservations. Complete or cancel one before booking again")
    if event.kind == "puja":
        names = [n for n in payload.family_members.splitlines() if n.strip()]
        if len(names) > snapshot["members_max"] - 1:
            raise HTTPException(422, f"This package covers {snapshot['members_max']} devotee(s) in total")
    if payload.gotra_unknown and not event.unknown_gotra_allowed:
        raise HTTPException(422, "This temple requires a known gotra; contact support")
    if not payload.gotra_unknown and not payload.gotra.strip():
        raise HTTPException(422, "Enter a gotra or select the temple-approved unknown-gotra option")
    if payload.payment_method == "razorpay" and not settings.razorpay_enabled:
        raise HTTPException(503, "Online payments are not configured; use your funded wallet")
    held = db.query(ChadhavaEvent).filter(ChadhavaEvent.id == event.id, ChadhavaEvent.reserved < ChadhavaEvent.capacity,
        ChadhavaEvent.published == True, ChadhavaEvent.deadline > utc_now()).update({"reserved": ChadhavaEvent.reserved + 1}, synchronize_session=False)  # noqa
    if not held:
        db.rollback(); raise HTTPException(409, "This event is full or booking has closed")
    snapshot.update(devotee_name=payload.devotee_name, phone=payload.phone, gotra="Unknown (temple-approved)" if payload.gotra_unknown else payload.gotra.strip(),
                    family_members=payload.family_members.strip(), purpose=payload.purpose.strip())
    order = ChadhavaOrder(id=generate_uuid(), user_id=user.id, event_id=event.id, idempotency_key=payload.idempotency_key,
        request_hash=digest, snapshot=snapshot, amount_paise=snapshot["amount_paise"], payment_method=payload.payment_method,
        expires_at=min(utc_now()+timedelta(minutes=15), utc(event.deadline)))
    try:
        db.add(order); db.flush()
        if payload.payment_method == "wallet":
            amount = order.amount_paise/100
            debited = db.query(User).filter(User.id == user.id, User.wallet_balance >= amount).update({"wallet_balance": User.wallet_balance-amount}, synchronize_session=False)
            if not debited:
                raise HTTPException(402, "Insufficient wallet balance. Recharge your wallet and try again")
            ref = "CH_"+order.id
            db.add(WalletTransaction(user_id=user.id, amount=-amount, transaction_type="debit", description="Chadhava: "+event.title, reference_id=ref))
            order.payment_status = "PAID"
            fulfil_paid(db, order, ref)
        else:
            provider = _razorpay("POST", "/orders", json={"amount": order.amount_paise, "currency": "INR", "receipt": order.id,
                "notes": {"chadhava_order_id": order.id}})
            order.provider_order_id = provider["id"]
        db.commit(); db.refresh(order)
    except IntegrityError:
        db.rollback()
        existing = db.query(ChadhavaOrder).filter_by(user_id=user.id, idempotency_key=payload.idempotency_key).first()
        if existing and existing.request_hash == digest:
            return order_json(db, existing)
        raise HTTPException(409, "Checkout conflict; refresh and retry")
    except Exception:
        db.rollback(); raise
    return order_json(db, order)


def own_order(db, user, order_id):
    order = db.query(ChadhavaOrder).filter_by(id=order_id, user_id=user.id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    return order


@router.get("/orders")
def my_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    expire_holds(db)
    result = [order_json(db, o) for o in db.query(ChadhavaOrder).filter_by(user_id=user.id).order_by(ChadhavaOrder.created_at.desc()).limit(100).all()]
    db.commit()
    return {"orders": result}


@router.get("/orders/{order_id}")
def get_order(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    return order_json(db, own_order(db, user, order_id))


def apply_payment(db, order, payment):
    if payment.get("order_id") != order.provider_order_id or payment.get("currency") != "INR" or payment.get("amount") != order.amount_paise:
        raise HTTPException(400, "Provider payment does not match this order")
    if payment.get("status") != "captured":
        raise HTTPException(409, "Payment is not captured yet; verification can be retried")
    if order.payment_status in ("PAID", "REFUND_PENDING", "REFUNDED"):
        if order.provider_payment_id != payment.get("id"):
            raise HTTPException(409, "Order already settled with another payment")
        return
    claimed = db.query(ChadhavaOrder).filter(ChadhavaOrder.id == order.id, ChadhavaOrder.payment_status.in_(["PENDING", "EXPIRED", "FAILED", "CANCELLED"])).update(
        {"payment_status": "PAID", "provider_payment_id": payment["id"]}, synchronize_session=False)
    if claimed:
        db.refresh(order)
        fulfil_paid(db, order, payment["id"])


class VerifyInput(BaseModel):
    razorpay_order_id: str = Field(pattern=r"^order_[A-Za-z0-9]+$")
    razorpay_payment_id: str = Field(pattern=r"^pay_[A-Za-z0-9]+$")
    razorpay_signature: str = Field(min_length=64, max_length=64)


@router.post("/orders/{order_id}/verify")
def verify(order_id: str, payload: VerifyInput, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    order = own_order(db, user, order_id)
    expected = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode(), hashlib.sha256).hexdigest()
    if not settings.razorpay_enabled or payload.razorpay_order_id != order.provider_order_id or not hmac.compare_digest(expected, payload.razorpay_signature):
        raise HTTPException(400, "Invalid payment signature")
    apply_payment(db, order, _razorpay("GET", "/payments/"+payload.razorpay_payment_id))
    db.commit(); db.refresh(order)
    return order_json(db, order)


def release_capacity(db, order):
    released = db.query(ChadhavaOrder).filter_by(id=order.id, capacity_held=True).update({"capacity_held": False}, synchronize_session=False)
    if released:
        db.query(ChadhavaEvent).filter_by(id=order.event_id).update({"reserved": ChadhavaEvent.reserved-1})


def cancel_order(db, order):
    old_payment = order.payment_status
    claimed = db.query(ChadhavaOrder).filter(ChadhavaOrder.id == order.id, ChadhavaOrder.payment_status == old_payment,
        ChadhavaOrder.service_status == order.service_status).update({"service_status": "CANCELLED",
        "payment_status": "REFUNDED" if old_payment == "PAID" and order.payment_method == "wallet" else "REFUND_PENDING" if old_payment == "PAID" else "CANCELLED"}, synchronize_session=False)
    if not claimed:
        raise HTTPException(409, "Order changed; refresh and try again")
    if old_payment == "PAID" and order.payment_method == "wallet":
        db.query(User).filter_by(id=order.user_id).update({"wallet_balance": User.wallet_balance+order.amount_paise/100}, synchronize_session=False)
        db.add(WalletTransaction(user_id=order.user_id, amount=order.amount_paise/100, transaction_type="refund", description="Chadhava refund", reference_id="RFD_"+order.id))
    release_capacity(db, order)
    if order.booking_id:
        booking = db.get(ChadawaBooking, order.booking_id); booking.status = "CANCELLED"
        record_event(db, "booking", booking.id, "CANCELLED", "Chadhava cancelled; see payment refund status")
    record_event(db, "chadhava", order.id, "CANCELLED", "Refund status is tracked separately")
    notify(db, "u:"+order.user_id, "chadhava_cancelled", "/mandir-seva", ref=order.id)
    db.flush(); db.refresh(order)


@router.post("/orders/{order_id}/cancel")
def cancel(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    order = own_order(db, user, order_id)
    if order.service_status == "CANCELLED":
        return order_json(db, order)
    if order.service_status not in ("AWAITING_PAYMENT", "CONFIRMED") or (order.payment_status == "PAID" and utc_now() >= utc(datetime.fromisoformat(order.snapshot["cancellation_deadline"]))):
        raise HTTPException(409, "Self-cancellation is closed. Please contact support")
    cancel_order(db, order); db.commit(); db.refresh(order)
    if order.payment_status == "REFUND_PENDING":
        request_refund(db, order)
    return order_json(db, order)


def reconcile_refund(db, order, payment):
    if payment.get("id") != order.provider_payment_id or payment.get("order_id") != order.provider_order_id or payment.get("amount") != order.amount_paise or payment.get("currency") != "INR":
        raise HTTPException(400, "Refund payment does not match the order")
    if int(payment.get("amount_refunded") or 0) >= order.amount_paise and order.payment_status != "REFUNDED":
        order.payment_status = "REFUNDED"
        order.service_status = "CANCELLED"
        release_capacity(db,order)
        if order.booking_id:
            db.get(ChadawaBooking,order.booking_id).status="CANCELLED"
        record_event(db,"chadhava",order.id,"REFUNDED","Full refund confirmed by the payment provider")
        notify(db,"u:"+order.user_id,"chadhava_refunded","/mandir-seva",ref=order.id)


def request_refund(db, order):
    """Claim before the remote call. Ambiguous network failures are reconciled, never blindly retried."""
    if order.payment_method != "razorpay" or order.payment_status != "REFUND_PENDING" or not order.provider_payment_id:
        return
    claimed=db.query(ChadhavaOrder).filter_by(id=order.id,refund_reference=None,payment_status="REFUND_PENDING").update(
        {"refund_reference":"REQUESTED_"+order.id},synchronize_session=False)
    db.commit();db.refresh(order)
    try:
        if claimed:
            refund=_razorpay("POST",f"/payments/{order.provider_payment_id}/refund",json={"amount":order.amount_paise,"notes":{"chadhava_order_id":order.id}})
            order.refund_reference=refund["id"]
            db.commit()
        payment=_razorpay("GET","/payments/"+order.provider_payment_id)
        reconcile_refund(db,order,payment)
        db.commit()
    except HTTPException:
        db.rollback()  # pending status is durable; webhook/provider reconciliation will settle it
    db.refresh(order)


class RefundInput(BaseModel):
    reason: str = Field(min_length=10,max_length=300)


@router.post("/admin/orders/{order_id}/refund")
def admin_refund(order_id: str,payload: RefundInput,db: Session=Depends(get_db),admin: User=Depends(require_admin)):
    order=db.get(ChadhavaOrder,order_id)
    if not order:raise HTTPException(404,"Order not found")
    if order.payment_status=="REFUNDED":return order_json(db,order)
    if order.payment_status=="PAID":
        if order.service_status in ("PERFORMED", "VIDEO_AVAILABLE", "COMPLETED"):
            raise HTTPException(409,"This seva was already performed; post-service disputes require manual review")
        cancel_order(db,order)
        record_event(db,"chadhava",order.id,"REFUND_REQUESTED",payload.reason)
        db.commit();db.refresh(order)
    elif order.payment_status!="REFUND_PENDING":
        raise HTTPException(409,"No captured payment is available to refund")
    request_refund(db,order)
    return order_json(db,order)


@router.post("/webhook")
async def webhook(request: Request,db: Session=Depends(get_db)):
    from starlette.concurrency import run_in_threadpool
    if not settings.razorpay_webhook_enabled:
        raise HTTPException(503,"Webhook secret is not configured")
    raw=await request.body()
    if len(raw)>2*1024*1024:raise HTTPException(413,"Payload too large")
    expected=hmac.new(settings.RAZORPAY_WEBHOOK_SECRET.encode(),raw,hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected,request.headers.get("X-Razorpay-Signature","")):
        raise HTTPException(400,"Invalid webhook signature")
    try:
        event=json.loads(raw)
        if not isinstance(event,dict):raise ValueError()
    except ValueError:raise HTTPException(400,"Invalid webhook payload")
    event_id=request.headers.get("X-Razorpay-Event-Id") or hashlib.sha256(raw).hexdigest()
    return await run_in_threadpool(process_webhook,db,event,event_id)


def process_webhook(db,event,event_id):
    etype=str(event.get("event", ""))
    try:
        db.add(PaymentWebhookEvent(provider="razorpay-chadhava",event_id=event_id,event_type=etype[:60]));db.flush()
    except IntegrityError:
        db.rollback();return {"status":"duplicate"}
    entity=((event.get("payload") or {}).get("payment") or {}).get("entity") or {}
    refund=((event.get("payload") or {}).get("refund") or {}).get("entity") or {}
    if etype in ("payment.captured","order.paid"):
        order=db.query(ChadhavaOrder).filter_by(provider_order_id=entity.get("order_id")).first() if entity.get("order_id") else None
        if order:
            payment_id=entity.get("id","")
            if not payment_id.startswith("pay_") or not payment_id.replace("_","").isalnum():raise HTTPException(400,"Invalid payment identifier")
            apply_payment(db,order,_razorpay("GET","/payments/"+payment_id))
    elif etype.startswith("refund."):
        payment_id=refund.get("payment_id")
        order=db.query(ChadhavaOrder).filter_by(provider_payment_id=payment_id).first() if payment_id else None
        if order:
            reconcile_refund(db,order,_razorpay("GET","/payments/"+payment_id))
    elif etype=="payment.failed":
        order=db.query(ChadhavaOrder).filter_by(provider_order_id=entity.get("order_id"),payment_status="PENDING").first() if entity.get("order_id") else None
        if order:record_event(db,"chadhava",order.id,"PAYMENT_ATTEMPT_FAILED","No booking confirmed; retry while the reservation is valid")
    db.commit()
    return {"status":"ok"}


@router.get("/orders/{order_id}/timeline")
def timeline(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    own_order(db, user, order_id)
    rows = db.query(StatusEvent).filter_by(kind="chadhava", ref_id=order_id).order_by(StatusEvent.created_at).all()
    return {"events": [dict(status=r.status, note=r.note, time=iso(r.created_at)) for r in rows]}


@router.get("/orders/{order_id}/receipt")
def receipt(order_id:str,db:Session=Depends(get_db),user:User=Depends(get_current_user_required)):
    order=own_order(db,user,order_id)
    if order.payment_status not in ("PAID","REFUND_PENDING","REFUNDED"):
        raise HTTPException(409,"A receipt is available after verified payment")
    data=dict(reference=order.id,booking_id=order.booking_id,payment_status=order.payment_status,
        payment_method=order.payment_method,provider_payment_id=order.provider_payment_id,
        amount_paise=order.amount_paise,currency="INR",created_at=iso(order.created_at),
        devotee=order.snapshot["devotee_name"],event=order.snapshot["title"],temple=order.snapshot["temple_name"],items=order.snapshot["items"])
    return Response(json.dumps(data,ensure_ascii=False,indent=2),media_type="application/json",headers={
        "Content-Disposition":f'attachment; filename="chadhava-{order.id}-receipt.json"',"Cache-Control":"private, no-store"})


def staff_ids(db, user):
    return [r.temple_id for r in db.query(TempleStaff).filter_by(user_id=user.id).all()]


def staff_order(db, user, order_id):
    order = db.get(ChadhavaOrder, order_id)
    event = db.get(ChadhavaEvent, order.event_id) if order else None
    if not event or (user.role != "admin" and event.temple_id not in staff_ids(db, user)):
        raise HTTPException(404, "Assigned order not found")
    return order


@router.get("/access")
def access(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    return {"admin": user.role == "admin", "temple_ids": staff_ids(db, user)}


@router.get("/staff/orders")
def staff_orders(event_id: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    q = db.query(ChadhavaOrder).join(ChadhavaEvent, ChadhavaEvent.id == ChadhavaOrder.event_id)
    if user.role != "admin":
        ids = staff_ids(db, user)
        if not ids:
            raise HTTPException(403, "Temple-team access required")
        q = q.filter(ChadhavaEvent.temple_id.in_(ids), ChadhavaOrder.payment_status == "PAID")
    if event_id:
        q = q.filter(ChadhavaOrder.event_id == event_id)
    return {"orders": [order_json(db, o) for o in q.order_by(ChadhavaOrder.created_at.desc()).limit(300).all()]}


@router.get("/staff/events")
def staff_events(db: Session=Depends(get_db),user: User=Depends(get_current_user_required)):
    q=db.query(ChadhavaEvent)
    if user.role!="admin":
        ids=staff_ids(db,user)
        if not ids:raise HTTPException(403,"Temple-team access required")
        q=q.filter(ChadhavaEvent.temple_id.in_(ids))
    return {"events":[event_json(db,e,"en") for e in q.order_by(ChadhavaEvent.starts_at.desc()).limit(200).all()]}


class FulfilmentInput(BaseModel):
    status: Literal["SCHEDULED", "PERFORMED", "VIDEO_AVAILABLE", "COMPLETED"]


@router.patch("/staff/orders/{order_id}")
def fulfil(order_id: str, payload: FulfilmentInput, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    order = staff_order(db, user, order_id)
    if order.payment_status != "PAID" or order.service_status not in STAGES:
        raise HTTPException(409, "Only confirmed, paid orders can be fulfilled")
    current, target = STAGES.index(order.service_status), STAGES.index(payload.status)
    if target == current:
        return order_json(db, order)
    if target != current+1:
        raise HTTPException(409, "Complete the next fulfilment step; skipping/backtracking is not allowed")
    if payload.status in ("PERFORMED", "VIDEO_AVAILABLE", "COMPLETED") and utc_now() < utc(datetime.fromisoformat(order.snapshot["starts_at"])):
        raise HTTPException(409, "The seva cannot be marked performed before its scheduled time")
    if payload.status == "VIDEO_AVAILABLE" and not order.video_url:
        raise HTTPException(422, "Upload this booking's video first")
    changed = db.query(ChadhavaOrder).filter_by(id=order.id, service_status=order.service_status, payment_status="PAID").update({"service_status": payload.status}, synchronize_session=False)
    if not changed:
        raise HTTPException(409, "Order changed; refresh")
    db.refresh(order)
    if payload.status == "PERFORMED":
        order.performed_at = utc_now()
        notify(db,"u:"+order.user_id,"chadhava_performed","/mandir-seva",ref=order.id)
    booking = db.get(ChadawaBooking, order.booking_id)
    booking.status = {"SCHEDULED":"SANKALP_SCHEDULED", "PERFORMED":"PERFORMED", "VIDEO_AVAILABLE":"VIDEO_UPLOADED", "COMPLETED":"COMPLETED"}[payload.status]
    if payload.status == "COMPLETED":
        _complete_booking(db, booking)
    record_event(db, "booking", booking.id, booking.status, "Updated by assigned temple team")
    record_event(db, "chadhava", order.id, payload.status, "Updated by assigned temple team")
    kind = {"SCHEDULED":"booking_scheduled", "VIDEO_AVAILABLE":"booking_video", "COMPLETED":"booking_completed"}.get(payload.status)
    if kind:
        notify(db, "u:"+order.user_id, kind, "/mandir-seva", ref=booking.booking_number, when=order.snapshot["starts_at"])
    db.commit()
    return order_json(db, order)


@router.post("/staff/orders/{order_id}/video")
async def upload_video(order_id: str, file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    order = staff_order(db, user, order_id)
    if order.payment_status != "PAID" or order.service_status != "PERFORMED":
        raise HTTPException(409, "Only a performed, paid seva can receive video evidence")
    ext = Path(file.filename or "").suffix.lower()
    if ext not in (".mp4", ".webm", ".mov") or not (file.content_type or "").startswith("video/"):
        raise HTTPException(422, "Use MP4, WebM or MOV video")
    data = await file.read(50*1024*1024+1)
    valid = (len(data)>12 and data[4:8] == b"ftyp") if ext in (".mp4", ".mov") else data.startswith(b"\x1a\x45\xdf\xa3")
    if not data or len(data)>50*1024*1024 or not valid:
        raise HTTPException(422, "Video is invalid or exceeds 50 MB")
    directory = Path(__file__).resolve().parents[4] / "storage" / "private" / "chadhava" / order.id
    directory.mkdir(parents=True, exist_ok=True)
    filename = generate_uuid()+ext
    (directory/filename).write_bytes(data)
    url = f"/api/v1/mandir/chadhava/orders/{order.id}/video"
    s = dict(order.snapshot); s["video_filename"] = filename; order.snapshot = s
    changed = db.query(ChadhavaOrder).filter_by(id=order.id, payment_status="PAID", service_status="PERFORMED").update(
        {"video_url":url,"snapshot":s,"video_uploaded_at":utc_now()},synchronize_session=False)
    if not changed:
        db.rollback()
        (directory/filename).unlink(missing_ok=True)
        raise HTTPException(409,"Order changed while the video was uploading; refresh")
    db.refresh(order)
    record_event(db, "chadhava", order.id, "VIDEO_UPLOADED", "Evidence attached to this order; awaiting publication")
    db.commit()
    return {"uploaded": True, "url": order.video_url}


@router.get("/orders/{order_id}/video")
def video(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    from fastapi.responses import FileResponse
    order = db.get(ChadhavaOrder, order_id)
    if not order or (order.user_id != user.id and user.role != "admin" and db.get(ChadhavaEvent, order.event_id).temple_id not in staff_ids(db,user)):
        raise HTTPException(404, "Video not found")
    if order.user_id == user.id and order.service_status not in ("VIDEO_AVAILABLE", "COMPLETED"):
        raise HTTPException(404, "Video is not published yet")
    filename = order.snapshot.get("video_filename", "")
    if not filename or Path(filename).name != filename:
        raise HTTPException(404, "Video not found")
    path = Path(__file__).resolve().parents[4] / "storage" / "private" / "chadhava" / order.id / filename
    if not path.is_file():
        raise HTTPException(404, "Video not found")
    return FileResponse(path, headers={"Cache-Control":"private, no-store"})


IST = timedelta(hours=5, minutes=30)


def notify_puja_interest(db: Session, event: ChadhavaEvent) -> int:
    """Tells devotees who asked about this calendar date that a puja is now bookable (caller commits)."""
    if event.kind != "puja" or not event.published:
        return 0
    day = (utc(event.starts_at) + IST).date().isoformat()
    rows = db.query(PujaInterest).filter(PujaInterest.calendar_date == day, PujaInterest.notified == False).all()  # noqa
    for row in rows:
        notify(db, "u:" + row.user_id, "puja_booking_open", link="/mandir-seva/puja", title=event.title, date=day)
        row.notified = True
    return len(rows)


class InterestInput(BaseModel):
    calendar_id: str = Field(min_length=3, max_length=60, pattern=r"^[\w-]+$")
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    title: str = Field(min_length=2, max_length=180)


@router.get("/interest")
def my_interest(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    rows = db.query(PujaInterest).filter(PujaInterest.user_id == user.id, PujaInterest.notified == False).all()  # noqa
    return {"calendar_ids": [r.calendar_id for r in rows]}


@router.post("/interest", status_code=201)
def add_interest(payload: InterestInput, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    try:
        datetime.strptime(payload.date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(422, "That date does not exist")
    if not db.query(PujaInterest).filter_by(user_id=user.id, calendar_id=payload.calendar_id).first():
        if db.query(PujaInterest).filter_by(user_id=user.id, notified=False).count() >= 50:
            raise HTTPException(400, "You can follow up to 50 pujas at a time")
        db.add(PujaInterest(user_id=user.id, calendar_id=payload.calendar_id, calendar_date=payload.date, title=payload.title.strip()))
        db.commit()
    return {"following": True}


@router.delete("/interest/{calendar_id}")
def remove_interest(calendar_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    db.query(PujaInterest).filter_by(user_id=user.id, calendar_id=calendar_id).delete()
    db.commit()
    return {"following": False}


@router.get("/admin/events")
def admin_events(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return {"events": [event_json(db,e,"en") for e in db.query(ChadhavaEvent).order_by(ChadhavaEvent.starts_at.desc()).limit(200).all()]}


@router.post("/admin/events", status_code=201)
def create_event(payload: EventInput, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    temple = db.query(Temple).filter_by(id=payload.temple_id, is_active=True).first()
    listed = db.query(TempleOffering).filter(TempleOffering.id.in_(payload.offering_ids), TempleOffering.temple_id == payload.temple_id, TempleOffering.is_active == True).all()  # noqa
    if not temple or len(listed) != len(payload.offering_ids):
        raise HTTPException(422, "Select active offerings from this temple")
    if payload.kind == "puja" and not any(o.category == "puja_tier" for o in listed):
        raise HTTPException(422, "A puja needs at least one puja package")
    if payload.kind == "chadhava" and (not listed and not db.query(TempleOffering).filter_by(temple_id=temple.id, category="item", is_active=True).count()):
        raise HTTPException(422, "This temple has no chadhava items yet")
    data = payload.model_dump(exclude={"benefits_en", "benefits_hi"})
    benefits = {"en": [b.strip() for b in payload.benefits_en if b.strip()], "hi": [b.strip() for b in payload.benefits_hi if b.strip()]}
    event = ChadhavaEvent(**data, benefits=benefits)
    db.add(event);db.flush();notify_puja_interest(db,event);db.commit();db.refresh(event)
    return event_json(db,event,"en")


class PublishInput(BaseModel):
    published: bool


@router.patch("/admin/events/{event_id}")
def publish_event(event_id: str, payload: PublishInput, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    event = db.get(ChadhavaEvent,event_id)
    if not event:
        raise HTTPException(404,"Event not found")
    if payload.published and (not event.partner_confirmed or utc(event.deadline)<=utc_now()):
        raise HTTPException(409,"Confirm the partnership and a future booking deadline before publishing")
    event.published=payload.published;notify_puja_interest(db,event);db.commit()
    return event_json(db,event,"en")


class AssignmentInput(BaseModel):
    user_id: str
    temple_id: str


@router.put("/admin/staff")
def assign(payload: AssignmentInput, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if not db.get(User,payload.user_id) or not db.get(Temple,payload.temple_id):
        raise HTTPException(404,"Account or temple not found")
    if not db.query(TempleStaff).filter_by(**payload.model_dump()).first():
        db.add(TempleStaff(**payload.model_dump()));db.commit()
    return {"assigned":True}


@router.delete("/admin/staff")
def revoke(payload: AssignmentInput, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    db.query(TempleStaff).filter_by(**payload.model_dump()).delete();db.commit()
    return {"assigned":False}


@router.get("/staff/export.csv")
def export(event_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    data=staff_orders(event_id,db,user)["orders"]
    output=io.StringIO();writer=csv.writer(output)
    writer.writerow(["Order","Seva date","Name","Gotra","Family","Offerings","Status"])
    def safe(value):
        value=str(value or "")
        return "'"+value if value.lstrip().startswith(("=","+","-","@")) else value
    for o in data:
        if o["payment_status"]!="PAID":continue
        s=o["snapshot"]
        writer.writerow([safe(v) for v in [o["id"],s["starts_at"],s["devotee_name"],s["gotra"],s["family_members"],
            "; ".join(f"{i['title']} x{i['quantity']}" for i in s["items"]),o["service_status"]]])
    return Response(output.getvalue(),media_type="text/csv",headers={"Content-Disposition":"attachment; filename=chadhava-fulfilment.csv","Cache-Control":"no-store"})
