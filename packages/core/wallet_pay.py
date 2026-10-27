"""Wallet debit/refund shared by Mandir Seva and Astro Mall.

Signed-in users pay from their wallet ledger. Guests have no ledger, so their payment is recorded
as test-mode ("TEST") exactly like the simulated wallet recharge.
"""
from typing import Optional, Tuple

from fastapi import HTTPException
from sqlalchemy.orm import Session

from packages.database.models import User, WalletTransaction, generate_uuid, utc_now


def charge_wallet(db: Session, user_id: Optional[str], amount: float, description: str, prefix: str) -> Tuple[str, str]:
    """Debits the wallet inside the caller's transaction (caller commits). Returns (method, reference)."""
    ref = f"{prefix}_{generate_uuid()[:8].upper()}"
    if not user_id:
        return "TEST", ref
    user = db.query(User).filter(User.id == user_id).with_for_update().first()
    if not user:
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")
    balance = user.wallet_balance or 0.0
    if balance < amount:
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient wallet balance (₹{balance:.2f}). Please recharge ₹{amount - balance:.2f}.",
        )
    user.wallet_balance = balance - amount
    db.add(WalletTransaction(user_id=user_id, amount=-amount, transaction_type="debit",
                             description=description[:255], reference_id=ref, created_at=utc_now()))
    return "WALLET", ref


def refund_wallet(db: Session, user_id: Optional[str], amount: float, description: str, prefix: str = "RFD") -> None:
    if not user_id or amount <= 0:
        return
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return
    user.wallet_balance = (user.wallet_balance or 0.0) + amount
    db.add(WalletTransaction(user_id=user_id, amount=amount, transaction_type="refund",
                             description=description[:255], reference_id=f"{prefix}_{generate_uuid()[:8].upper()}",
                             created_at=utc_now()))
