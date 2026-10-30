"""
Wallet & Bookings API for Astro Jyotish.
Handles client wallet balance, simulated test-mode recharges,
transaction ledger, and certified astrologer appointment bookings.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone

from packages.database.session import get_db
from packages.database.models import (
    User, Astrologer, WalletTransaction, Booking, generate_uuid, utc_now
)
from website.backend.app.api.auth import get_current_user_optional
from packages.core.identity import Owner, optional_owner
from packages.core.notify import notify
from packages.core.config import settings
from packages.core.pricing import MEMBER_CONSULT_DISCOUNT, active_membership

router = APIRouter(prefix="/wallet", tags=["Wallet & Bookings"])

# ----------------- Request Schemas -----------------
class RechargeRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in INR (e.g., 100, 250, 500, 1000)")
    payment_method: Optional[str] = "UPI (Test Mode)"

class BookingCreateRequest(BaseModel):
    astrologer_id: str
    user_name: str
    user_phone: Optional[str] = None
    scheduled_at: str = Field(..., description="ISO datetime string or YYYY-MM-DD HH:MM")
    duration_minutes: int = Field(15, ge=10, le=60)
    mode: str = Field("chat", description="chat, call, video")
    concern: Optional[str] = "General Guidance"
    notes: Optional[str] = None

import hashlib
import hmac

RAZORPAY_API = "https://api.razorpay.com/v1"


def _razorpay(method: str, path: str, **kwargs) -> Dict[str, Any]:
    """Single place that talks to Razorpay (replaced in tests)."""
    import httpx
    try:
        res = httpx.request(method, RAZORPAY_API + path, auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET), timeout=15, **kwargs)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Payment service is unreachable. Please try again.")
    if res.status_code >= 400:
        raise HTTPException(status_code=502, detail="Payment service rejected the request.")
    return res.json()


BOOKING_MODES = ("chat", "call", "video")
IST = timezone(timedelta(hours=5, minutes=30))  # slots are offered in Indian Standard Time; naive input is read as IST


def _start_time(value: str) -> Optional[datetime]:
    """Parses a stored/submitted slot time into an aware UTC datetime (None if unreadable)."""
    try:
        dt = datetime.fromisoformat(str(value).strip())
    except ValueError:
        return None
    return (dt if dt.tzinfo else dt.replace(tzinfo=IST)).astimezone(timezone.utc)


def _busy_intervals(db: Session, astrologer_id: str):
    """(start, end) of every active appointment the astrologer already has."""
    rows = db.query(Booking).filter(Booking.astrologer_id == astrologer_id, Booking.status == "confirmed").all()
    for b in rows:
        start = _start_time(b.scheduled_at)
        if start:
            yield start, start + timedelta(minutes=b.duration_minutes or 15)


def _can_cancel(b: Booking) -> bool:
    start = _start_time(b.scheduled_at)
    return b.status == "confirmed" and start is not None and start > datetime.now(timezone.utc)


# ----------------- Wallet Endpoints -----------------

@router.get("")
def get_wallet_status(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Retrieves current wallet balance and recent transactions.
    Returns the account's balance and ledger; guests have no funds or ledger.
    """
    if current_user:
        user = db.query(User).filter(User.id == current_user.id).first()
        balance = (user.wallet_balance or 0.0) if user else 0.0
        txs = db.query(WalletTransaction).filter(
            WalletTransaction.user_id == current_user.id
        ).order_by(WalletTransaction.created_at.desc()).all()
    else:
        balance = 0.0
        txs = []  # a guest has no ledger; never show other people's transactions

    return {
        "currency": "INR",
        "symbol": "₹",
        "balance": round(balance, 2),
        "is_test_mode": not settings.razorpay_enabled and settings.test_payments_allowed,
        "payments_available": settings.razorpay_enabled or settings.test_payments_allowed,
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "type": t.transaction_type,
                "description": t.description,
                "reference_id": t.reference_id,
                "created_at": (t.created_at.replace(tzinfo=timezone.utc) if t.created_at.tzinfo is None else t.created_at).isoformat() if t.created_at else None
            }
            for t in txs
        ]
    }

class RazorpayOrderRequest(BaseModel):
    amount: float = Field(..., ge=10, le=100000, description="Amount in INR")


class RazorpayVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.get("/payment-config")
def payment_config():
    """Tells the site whether real payments are on (never exposes the secret)."""
    if settings.razorpay_enabled:
        return {"provider": "razorpay", "key_id": settings.RAZORPAY_KEY_ID}
    if not settings.test_payments_allowed:
        return {"provider": "unavailable", "key_id": None}
    return {"provider": "test", "key_id": None}


@router.post("/razorpay/order")
def create_razorpay_order(payload: RazorpayOrderRequest, current_user: Optional[User] = Depends(get_current_user_optional)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Please sign in to recharge your wallet")
    if not settings.razorpay_enabled:
        raise HTTPException(status_code=409, detail="Online payments are not enabled.")
    paise = int(round(payload.amount * 100))
    order = _razorpay("POST", "/orders", json={"amount": paise, "currency": "INR", "receipt": f"w-{generate_uuid()[:12]}", "notes": {"user_id": current_user.id}})
    return {"order_id": order["id"], "amount": paise, "currency": "INR", "key_id": settings.RAZORPAY_KEY_ID}


@router.post("/razorpay/verify")
def verify_razorpay_payment(payload: RazorpayVerifyRequest, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    """Credits the wallet only after the signature matches AND Razorpay confirms this order was paid by this user. Idempotent per payment."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Please sign in to recharge your wallet")
    if not settings.razorpay_enabled:
        raise HTTPException(status_code=409, detail="Online payments are not enabled.")
    expected = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment could not be verified.")
    ref = f"RZP_{payload.razorpay_payment_id}"
    already = db.query(WalletTransaction).filter(WalletTransaction.reference_id == ref).first()
    if already:
        return {"status": "success", "duplicate": True, "new_balance": round(current_user.wallet_balance or 0.0, 2)}
    order = _razorpay("GET", f"/orders/{payload.razorpay_order_id}")
    if order.get("status") != "paid" or (order.get("notes") or {}).get("user_id") != current_user.id:
        raise HTTPException(status_code=400, detail="This payment does not belong to your account or is not complete.")
    amount = round(int(order.get("amount_paid", 0)) / 100, 2)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount is invalid.")
    current_user.wallet_balance = (current_user.wallet_balance or 0.0) + amount
    db.add(current_user)
    db.add(WalletTransaction(id=generate_uuid(), user_id=current_user.id, amount=amount, transaction_type="credit",
                             description="Wallet recharge via Razorpay", reference_id=ref, created_at=utc_now()))
    notify(db, f"u:{current_user.id}", "wallet_recharged", "/dashboard", amount=f"{amount:.2f}", ref=ref)
    db.commit()
    return {"status": "success", "amount_added": amount, "new_balance": round(current_user.wallet_balance, 2)}


@router.post("/recharge")
def recharge_wallet(
    payload: RechargeRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Simulates a secure instant wallet recharge in test mode.
    Adds funds to the user's wallet ledger with a verified transaction receipt.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Please sign in to recharge your wallet")
    if settings.razorpay_enabled:
        raise HTTPException(status_code=409, detail="Test recharge is disabled; please pay online.")
    if not settings.test_payments_allowed:
        raise HTTPException(status_code=409, detail="Online payments are not available right now.")
    amount = payload.amount
    user_id = current_user.id if current_user else None

    if current_user:
        current_user.wallet_balance = (current_user.wallet_balance or 0.0) + amount
        db.add(current_user)

    tx = WalletTransaction(
        id=generate_uuid(),
        user_id=user_id,
        amount=amount,
        transaction_type="credit",
        description=f"Wallet Recharge via {payload.payment_method}",
        reference_id=f"TXN_{generate_uuid()[:8].upper()}",
        created_at=utc_now()
    )
    db.add(tx)
    notify(db, f"u:{current_user.id}", "wallet_recharged", "/dashboard", amount=f"{amount:.2f}", ref=tx.reference_id)
    db.commit()

    new_balance = current_user.wallet_balance
    return {
        "status": "success",
        "message": f"Successfully recharged ₹{amount:.2f} to your Astro Jyotish wallet!",
        "transaction_id": tx.reference_id,
        "amount_added": amount,
        "new_balance": round(new_balance, 2)
    }

# ----------------- Booking Endpoints -----------------

@router.post("/bookings")
def create_booking(
    payload: BookingCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    owner: Optional[Owner] = Depends(optional_owner)
):
    """
    Creates an appointment booking with a certified astrologer.
    Calculates cost based on astrologer rate and locks in the appointment.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Please sign in to book a consultation")
    mode = (payload.mode or "").lower()
    if mode not in BOOKING_MODES:
        raise HTTPException(status_code=422, detail="Choose chat, call or video")
    payload.mode = mode

    # Lookup astrologer by id or slug
    astro = db.query(Astrologer).filter(
        (Astrologer.id == payload.astrologer_id) | (Astrologer.slug == payload.astrologer_id)
    ).first()
    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")
    if astro.is_ai:
        raise HTTPException(status_code=422, detail="Scheduled appointments are only available with verified astrologers. Instant guidance is available in chat at any time.")

    start = _start_time(payload.scheduled_at)
    if start is None:
        raise HTTPException(status_code=422, detail="Choose a valid date and time")
    if start <= datetime.now(timezone.utc):
        raise HTTPException(status_code=422, detail="Choose a future date and time")
    end = start + timedelta(minutes=payload.duration_minutes)
    if any(start < b_end and b_start < end for b_start, b_end in _busy_intervals(db, astro.id)):
        raise HTTPException(status_code=409, detail=f"{astro.name} is already booked at that time. Please pick another slot.")

    rate_per_min = astro.price_per_minute or 0.0
    list_amount = round(rate_per_min * payload.duration_minutes, 2)
    member = active_membership(db, current_user.id)
    member_discount = round(list_amount * MEMBER_CONSULT_DISCOUNT, 2) if member else 0.0
    total_amount = round(list_amount - member_discount, 2)

    if total_amount > 0:
        balance = current_user.wallet_balance or 0.0
        if balance < total_amount:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient wallet balance (₹{balance:.2f}). Please recharge ₹{total_amount - balance:.2f}."
            )
        current_user.wallet_balance = balance - total_amount
        db.add(current_user)

        # Debit transaction
        tx = WalletTransaction(
            id=generate_uuid(),
            user_id=current_user.id,
            amount=-total_amount,
            transaction_type="debit",
            description=f"Appointment with {astro.name} ({payload.duration_minutes}m {payload.mode.upper()})",
            reference_id=f"BKG_{generate_uuid()[:8].upper()}",
            created_at=utc_now()
        )
        db.add(tx)

    booking = Booking(
        id=generate_uuid(),
        user_id=current_user.id if current_user else None,
        owner_key=owner.key if owner else None,
        astrologer_id=astro.id,
        user_name=payload.user_name,
        user_phone=payload.user_phone,
        scheduled_at=payload.scheduled_at,
        duration_minutes=payload.duration_minutes,
        mode=payload.mode,
        status="confirmed",
        total_amount=total_amount,
        is_priority=bool(member),
        member_discount=member_discount,
        concern=payload.concern,
        notes=payload.notes,
        created_at=utc_now()
    )
    db.add(booking)
    notify(db, f"u:{current_user.id}", "consultation_booked", "/dashboard", name=astro.name,
           when=start.astimezone(IST).strftime("%d %b, %I:%M %p IST"))
    db.commit()

    return {
        "status": "confirmed",
        "booking_id": booking.id,
        "astrologer_name": astro.name,
        "scheduled_at": booking.scheduled_at,
        "duration_minutes": booking.duration_minutes,
        "mode": booking.mode,
        "total_amount": booking.total_amount,
        "member_discount": member_discount,
        "priority": bool(member),
        "message": f"Appointment successfully confirmed with {astro.name} for {booking.scheduled_at}!"
    }

@router.get("/bookings")
def list_bookings(
    db: Session = Depends(get_db),
    owner: Optional[Owner] = Depends(optional_owner)
):
    """Lists the caller's own bookings (a signed-in user's, or this visitor's)."""
    if not owner:
        return []
    bookings = (db.query(Booking).filter(Booking.owner_key == owner.key)
                .order_by(Booking.created_at.desc()).limit(15).all())

    results = []
    for b in bookings:
        astro = db.query(Astrologer).filter(Astrologer.id == b.astrologer_id).first()
        results.append({
            "id": b.id,
            "astrologer_name": astro.name if astro else "Astrologer",
            "astrologer_avatar": astro.avatar if astro else None,
            "scheduled_at": b.scheduled_at,
            "duration_minutes": b.duration_minutes,
            "mode": b.mode,
            "status": b.status,
            "total_amount": b.total_amount,
            "concern": b.concern,
            "can_cancel": _can_cancel(b),
            "priority": bool(b.is_priority),
            "member_discount": b.member_discount or 0.0,
            "created_at": b.created_at.isoformat() if b.created_at else None
        })
    return results


@router.get("/bookings/busy")
def busy_slots(astrologer_id: str, db: Session = Depends(get_db)):
    """Appointment windows (UTC ISO) already taken for an astrologer, so the picker can disable them. No personal data."""
    astro = db.query(Astrologer).filter((Astrologer.id == astrologer_id) | (Astrologer.slug == astrologer_id)).first()
    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")
    now = datetime.now(timezone.utc)
    return {"busy": [{"start": a.isoformat(), "end": b.isoformat()} for a, b in _busy_intervals(db, astro.id) if b > now]}

@router.post("/bookings/{booking_id}/cancel")
def cancel_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    owner: Optional[Owner] = Depends(optional_owner)
):
    """Cancels an existing booking and refunds the amount to the user's wallet."""
    booking = (db.query(Booking).filter(Booking.id == booking_id, Booking.owner_key == owner.key).first()
               if owner else None)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")   # missing, or someone else's

    if booking.status == "cancelled":
        return {"status": "already_cancelled", "message": "Booking is already cancelled."}

    if not _can_cancel(booking):
        raise HTTPException(status_code=409, detail="This appointment has already started or finished, so it can no longer be cancelled.")

    booking.status = "cancelled"
    booking.updated_at = utc_now()

    # Refund if there was a payment
    if booking.total_amount > 0 and booking.user_id:
        user = db.query(User).filter(User.id == booking.user_id).first()
        if user:
            user.wallet_balance = (user.wallet_balance or 0.0) + booking.total_amount
            db.add(user)
            tx = WalletTransaction(
                id=generate_uuid(),
                user_id=user.id,
                amount=booking.total_amount,
                transaction_type="refund",
                description=f"Refund for cancelled booking #{booking.id[:8]}",
                reference_id=f"RFD_{generate_uuid()[:8].upper()}",
                created_at=utc_now()
            )
            db.add(tx)
    astro = db.query(Astrologer).filter(Astrologer.id == booking.astrologer_id).first()
    notify(db, booking.owner_key, "consultation_cancelled", "/dashboard", name=astro.name if astro else "the astrologer",
           amount=f"{booking.total_amount:.2f}")

    db.commit()
    return {
        "status": "cancelled",
        "booking_id": booking.id,
        "message": "Booking has been cancelled and full refund credited to your wallet."
    }
