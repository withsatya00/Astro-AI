"""
Wallet & Bookings API for Astro Jyotish.
Handles client wallet balance, simulated test-mode recharges,
transaction ledger, and certified astrologer appointment bookings.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from packages.database.session import get_db
from packages.database.models import (
    User, Astrologer, WalletTransaction, Booking, generate_uuid, utc_now
)
from website.backend.app.api.auth import get_current_user_optional
from packages.core.identity import Owner, optional_owner

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

# ----------------- Wallet Endpoints -----------------

@router.get("")
def get_wallet_status(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Retrieves current wallet balance and recent transactions.
    If authenticated, fetches user balance; otherwise returns demo test balance.
    """
    if current_user:
        user = db.query(User).filter(User.id == current_user.id).first()
        balance = user.wallet_balance if user else 250.0
        txs = db.query(WalletTransaction).filter(
            WalletTransaction.user_id == current_user.id
        ).order_by(WalletTransaction.created_at.desc()).limit(20).all()
    else:
        balance = 250.0  # Initial complementary test credits for guests
        txs = []  # a guest has no ledger; never show other people's transactions

    return {
        "currency": "INR",
        "symbol": "₹",
        "balance": round(balance, 2),
        "is_test_mode": True,
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "type": t.transaction_type,
                "description": t.description,
                "created_at": t.created_at.isoformat() if t.created_at else None
            }
            for t in txs
        ]
    }

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
    db.commit()

    new_balance = current_user.wallet_balance if current_user else (250.0 + amount)
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
    # Lookup astrologer by id or slug
    astro = db.query(Astrologer).filter(
        (Astrologer.id == payload.astrologer_id) | (Astrologer.slug == payload.astrologer_id)
    ).first()
    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")

    rate_per_min = astro.price_per_minute or 0.0
    total_amount = round(rate_per_min * payload.duration_minutes, 2)

    # Check wallet balance if authenticated
    if current_user and total_amount > 0:
        if (current_user.wallet_balance or 0.0) < total_amount:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient wallet balance (₹{current_user.wallet_balance:.2f}). Please recharge ₹{total_amount - current_user.wallet_balance:.2f}."
            )
        current_user.wallet_balance -= total_amount
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
        concern=payload.concern,
        notes=payload.notes,
        created_at=utc_now()
    )
    db.add(booking)
    db.commit()

    return {
        "status": "confirmed",
        "booking_id": booking.id,
        "astrologer_name": astro.name,
        "scheduled_at": booking.scheduled_at,
        "duration_minutes": booking.duration_minutes,
        "mode": booking.mode,
        "total_amount": booking.total_amount,
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
            "created_at": b.created_at.isoformat() if b.created_at else None
        })
    return results

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

    db.commit()
    return {
        "status": "cancelled",
        "booking_id": booking.id,
        "message": "Booking has been cancelled and full refund credited to your wallet."
    }
