"""
Gau Sewa donations.

One-time donations paid through Razorpay, kept completely apart from the wallet (a donation never credits wallet_balance).

Payment trust model:
  * the browser callback only *asks* the server to check a payment; the server verifies the Razorpay signature and then
    fetches the payment from Razorpay itself, requiring status ``captured`` with the stored order id, amount and currency;
  * the signed webhook applies the same checks to the signed payload and is idempotent (event id + guarded state change);
  * there is no endpoint that marks a donation paid by hand.

Donations are refused (503) until payments are configured AND an admin has set up a recipient gaushala.
"""
import hashlib
import hmac
import html
import json
import re
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, BackgroundTasks
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field, StrictBool, StrictInt
from sqlalchemy import func, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from packages.core import mailer
from packages.core.config import settings
from packages.core.notify import notify
from packages.database.models import Donation, Gaushala, GauSevaUpdate, PaymentWebhookEvent, User, WalletTransaction, generate_uuid, utc_now
from packages.database.session import SessionLocal, get_db
from website.backend.app.api import wallet
from website.backend.app.api.auth import get_current_user_optional, get_current_user_required
from website.backend.app.api.mandir import require_admin

router = APIRouter(prefix="/gau-sewa", tags=["Gau Sewa"])

PURPOSES = ("chaara", "chikitsa", "general")
PRESET_RUPEES = (101, 501, 1100)
MIN_RUPEES = 11
MAX_RUPEES = 100000
STATUSES = ("PENDING", "SUCCESS", "FAILED", "REFUNDED")
CURRENCY = "INR"
UPLOAD_DIR = Path(__file__).resolve().parents[4] / "storage" / "uploads" / "gau-sewa"
ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _razorpay(method: str, path: str, **kwargs) -> Dict[str, Any]:
    """Talks to Razorpay through the wallet's single HTTP helper (replaced in tests)."""
    return wallet._razorpay(method, path, **kwargs)


# --------------------------------------------------------------------------------------------- helpers
def _iso(value: Optional[datetime]) -> Optional[str]:
    if not value:
        return None
    return (value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value).isoformat()


def _photos(raw: Optional[str]) -> List[str]:
    try:
        data = json.loads(raw) if raw else []
    except ValueError:
        return []
    return [u for u in data if isinstance(u, str)] if isinstance(data, list) else []


def _clean_photos(urls: Optional[List[str]]) -> str:
    """Only http(s) links and site-hosted paths are accepted, so a photo field can never carry a script URL."""
    out: List[str] = []
    for url in urls or []:
        url = (url or "").strip()
        if not url:
            continue
        if not (url.startswith(("https://", "http://")) or (url.startswith("/") and not url.startswith("//"))):
            raise HTTPException(status_code=422, detail="Photo links must start with https:// or be a path on this site")
        if len(url) > 1024:
            raise HTTPException(status_code=422, detail="A photo link is too long")
        out.append(url)
    if len(out) > 12:
        raise HTTPException(status_code=422, detail="Add at most 12 photos")
    return json.dumps(out)


def _recipient(db: Session, gaushala_id: Optional[str] = None) -> Optional[Gaushala]:
    """A gaushala that can currently receive donations: active, switched on by an admin and with a named beneficiary."""
    query = db.query(Gaushala).filter(Gaushala.is_active == True, Gaushala.donations_enabled == True)  # noqa: E712
    if gaushala_id:
        query = query.filter(Gaushala.id == gaushala_id)
    for g in query.order_by(Gaushala.created_at).all():
        if (g.beneficiary_name or "").strip():
            return g
    return None


def _unavailable_reason(db: Session) -> Optional[str]:
    if not settings.razorpay_enabled:
        return "payments_not_configured"
    if not _recipient(db):
        return "recipient_not_configured"
    return None


UNAVAILABLE_MESSAGES = {
    "payments_not_configured": "Online donations are not available right now.",
    "recipient_not_configured": "Donations are not open yet. The gaushala details are still being set up.",
}


def _gaushala_public(g: Gaushala) -> Dict[str, Any]:
    return {
        "id": g.id, "slug": g.slug, "name": g.name, "location": g.location, "introduction": g.introduction,
        "photos": _photos(g.photos), "beneficiary_name": g.beneficiary_name, "beneficiary_details": g.beneficiary_details,
        "accepting_donations": bool(g.donations_enabled and (g.beneficiary_name or "").strip()),
    }


def _update_public(u: GauSevaUpdate) -> Dict[str, Any]:
    return {"id": u.id, "gaushala_id": u.gaushala_id, "title": u.title, "body": u.body, "photos": _photos(u.photos),
            "published_at": _iso(u.published_at)}


def _summary(d: Donation, with_token: bool = False) -> Dict[str, Any]:
    out = {
        "id": d.id, "reference": d.reference, "status": d.status, "purpose": d.purpose,
        "amount_paise": d.amount_paise, "amount": d.amount_paise // 100, "currency": d.currency,
        "recipient_name": d.recipient_name, "created_at": _iso(d.created_at), "paid_at": _iso(d.paid_at),
        "refunded_paise": d.refunded_paise or 0,
    }
    if with_token:
        out["receipt_token"] = d.receipt_token
    return out


def _sign(order_id: str, payment_id: str) -> str:
    return hmac.new((settings.RAZORPAY_KEY_SECRET or "").encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()


# --------------------------------------------------------------------------------------------- public
@router.get("/config")
def gau_sewa_config(db: Session = Depends(get_db)):
    """Whether donations can be taken right now and the amount rules. Never exposes secrets."""
    reason = _unavailable_reason(db)
    return {
        "available": reason is None, "reason": reason, "message": UNAVAILABLE_MESSAGES.get(reason),
        "presets": list(PRESET_RUPEES), "min_amount": MIN_RUPEES, "max_amount": MAX_RUPEES,
        "purposes": list(PURPOSES), "currency": CURRENCY,
    }


@router.get("/gaushalas")
def list_gaushalas(db: Session = Depends(get_db)):
    rows = db.query(Gaushala).filter(Gaushala.is_active == True).order_by(Gaushala.created_at).all()  # noqa: E712
    return {"gaushalas": [_gaushala_public(g) for g in rows]}


@router.get("/updates")
def list_updates(gaushala_id: Optional[str] = None, limit: int = 20, db: Session = Depends(get_db)):
    """Published seva updates. Contains no donor information."""
    query = db.query(GauSevaUpdate).filter(GauSevaUpdate.is_published == True)  # noqa: E712
    if gaushala_id:
        query = query.filter(GauSevaUpdate.gaushala_id == gaushala_id)
    rows = query.order_by(GauSevaUpdate.published_at.desc()).limit(max(1, min(limit, 50))).all()
    return {"updates": [_update_public(u) for u in rows]}


# --------------------------------------------------------------------------------------------- donate
class DonationOrderRequest(BaseModel):
    amount: StrictInt = Field(..., description="Whole rupees")
    purpose: str
    donor_name: str = Field(..., max_length=200)
    donor_email: Optional[str] = Field(None, max_length=255)
    hide_name_public: StrictBool = False
    gaushala_id: Optional[str] = None


class DonationVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/donations/order")
def create_donation_order(payload: DonationOrderRequest, db: Session = Depends(get_db),
                          current_user: Optional[User] = Depends(get_current_user_optional)):
    reason = _unavailable_reason(db)
    if reason:
        raise HTTPException(status_code=503, detail=UNAVAILABLE_MESSAGES[reason])
    if payload.purpose not in PURPOSES:
        raise HTTPException(status_code=422, detail="Choose a valid donation purpose")
    if not (MIN_RUPEES <= payload.amount <= MAX_RUPEES):
        raise HTTPException(status_code=422, detail=f"Enter an amount between ₹{MIN_RUPEES} and ₹{MAX_RUPEES:,}")
    name = re.sub(r"\s+", " ", payload.donor_name or "").strip()
    if len(name) < 2 or len(name) > 120:
        raise HTTPException(status_code=422, detail="Enter the donor name (2 to 120 characters)")
    email = (payload.donor_email or "").strip().lower() or None
    if email and not EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail="Enter a valid email address or leave it blank")
    recipient = _recipient(db, payload.gaushala_id)
    if not recipient:
        raise HTTPException(status_code=422, detail="Choose a gaushala that is accepting donations")

    paise = payload.amount * 100  # integer paise, computed on the server from whole rupees
    reference = "GS-" + secrets.token_hex(5).upper()
    donation_id = generate_uuid()
    order = _razorpay("POST", "/orders", json={"amount": paise, "currency": CURRENCY, "receipt": reference,
                                                "notes": {"kind": "gau_sewa", "donation_id": donation_id}})
    order_id = order.get("id")
    if not order_id:
        raise HTTPException(status_code=502, detail="Payment service did not return an order. Please try again.")
    donation = Donation(
        id=donation_id, reference=reference, receipt_token=secrets.token_urlsafe(32),
        user_id=current_user.id if current_user else None, donor_name=name, donor_email=email,
        hide_name_public=payload.hide_name_public, purpose=payload.purpose, amount_paise=paise, currency=CURRENCY,
        gaushala_id=recipient.id, recipient_name=recipient.beneficiary_name.strip(), provider="razorpay",
        provider_order_id=order_id, status="PENDING",
    )
    db.add(donation)
    db.commit()
    return {"order_id": order_id, "amount": paise, "currency": CURRENCY, "key_id": settings.RAZORPAY_KEY_ID,
            "reference": reference, "recipient_name": donation.recipient_name, "receipt_token": donation.receipt_token}

class DonationWalletRequest(BaseModel):
    amount: StrictInt = Field(..., description="Whole rupees")
    purpose: str
    donor_name: str = Field(..., max_length=200)
    donor_email: Optional[str] = Field(None, max_length=255)
    donor_phone: Optional[str] = Field(None, max_length=30)
    hide_name_public: StrictBool = False
    optin_updates: bool = True
    gaushala_id: Optional[str] = None


@router.post("/donations/wallet")
@router.post("/donations")
def donate_with_wallet(
    payload: DonationWalletRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Directly contributes to Gau Seva from the user's Astro Jyotish wallet.
    Debits the wallet, records the transaction, issues the official digital receipt,
    and updates Gaushala records.
    """
    if payload.purpose not in PURPOSES:
        raise HTTPException(status_code=422, detail="Choose a valid donation purpose")
    if not (MIN_RUPEES <= payload.amount <= MAX_RUPEES):
        raise HTTPException(status_code=422, detail=f"Enter an amount between ₹{MIN_RUPEES} and ₹{MAX_RUPEES:,}")
    name = re.sub(r"\s+", " ", payload.donor_name or "").strip()
    if len(name) < 2 or len(name) > 120:
        raise HTTPException(status_code=422, detail="Enter the donor name (2 to 120 characters)")
    email = (payload.donor_email or "").strip().lower() or None
    if email and not EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail="Enter a valid email address or leave it blank")
    recipient = _recipient(db, payload.gaushala_id)
    if not recipient:
        raise HTTPException(status_code=422, detail="Choose a gaushala that is accepting donations")

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Please sign in to donate using your Astro Jyotish Wallet balance."
        )

    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    balance = float(user.wallet_balance or 0.0)
    amount_rupees = float(payload.amount)
    if balance < amount_rupees:
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient wallet balance (₹{balance:.2f}). Please recharge your wallet with ₹{amount_rupees - balance:.0f} to complete this Gau Seva."
        )

    # Debit wallet
    user.wallet_balance = balance - amount_rupees
    db.add(user)

    paise = payload.amount * 100
    reference = "GS-" + secrets.token_hex(5).upper()
    donation_id = generate_uuid()

    # Create debit transaction
    tx = WalletTransaction(
        id=generate_uuid(),
        user_id=user.id,
        amount=-amount_rupees,
        transaction_type="debit",
        description=f"Gau Seva ({payload.purpose}) - {recipient.beneficiary_name.strip()}",
        reference_id=reference,
        created_at=utc_now()
    )
    db.add(tx)

    # Create successful donation record
    donation = Donation(
        id=donation_id,
        reference=reference,
        receipt_token=secrets.token_urlsafe(32),
        user_id=user.id,
        donor_name=name,
        donor_email=email,
        hide_name_public=payload.hide_name_public,
        purpose=payload.purpose,
        amount_paise=paise,
        currency=CURRENCY,
        gaushala_id=recipient.id,
        recipient_name=recipient.beneficiary_name.strip(),
        provider="wallet",
        provider_order_id=f"WLT_{reference}",
        status="SUCCESS",
        paid_at=utc_now()
    )
    db.add(donation)

    # Notify user
    try:
        notify(db, f"u:{user.id}", "donation_confirmed", "/gau-sewa", amount=f"{amount_rupees:.0f}", ref=reference)
    except Exception:
        pass

    db.commit()
    db.refresh(donation)

    return {
        "status": "SUCCESS",
        "success": True,
        "reference": reference,
        "receipt_token": donation.receipt_token,
        "donation_id": donation.id,
        "amount": payload.amount,
        "recipient_name": donation.recipient_name,
        "donor_name": donation.donor_name,
        "purpose": donation.purpose,
        "new_balance": round(user.wallet_balance, 2)
    }


def _apply_payment(db: Session, donation: Donation, payment: Dict[str, Any]) -> bool:
    """Moves a donation along from a provider payment entity. Returns True when it newly became SUCCESS.

    Raises ValueError if the payment does not belong to this donation (order, amount or currency differ).
    The caller commits.
    """
    if payment.get("order_id") != donation.provider_order_id:
        raise ValueError("order mismatch")
    try:
        paid_amount = int(payment.get("amount"))
    except (TypeError, ValueError):
        raise ValueError("amount missing")
    if paid_amount != donation.amount_paise or (payment.get("currency") or "").upper() != donation.currency:
        raise ValueError("amount or currency mismatch")
    pid = payment.get("id")
    status = payment.get("status")
    newly_paid = False

    if status in ("captured", "refunded"):
        # Guarded transition: only one concurrent request/webhook can move the row out of PENDING/FAILED.
        result = db.execute(update(Donation).where(Donation.id == donation.id, Donation.status.in_(("PENDING", "FAILED")))
                            .values(status="SUCCESS", provider_payment_id=pid, paid_at=utc_now(), failure_reason=None))
        newly_paid = result.rowcount == 1
        db.refresh(donation)
    elif status == "failed" and donation.status == "PENDING":
        reason = (payment.get("error_description") or payment.get("error_reason") or "Payment failed")[:255]
        db.execute(update(Donation).where(Donation.id == donation.id, Donation.status == "PENDING")
                   .values(status="FAILED", failure_reason=reason))
        db.refresh(donation)

    refunded = int(payment.get("amount_refunded") or 0)
    if refunded > 0 and donation.status in ("SUCCESS", "REFUNDED") and refunded != (donation.refunded_paise or 0):
        donation.refunded_paise = min(refunded, donation.amount_paise)
        if status == "refunded" or refunded >= donation.amount_paise:
            donation.status = "REFUNDED"
            donation.refunded_at = donation.refunded_at or utc_now()
        db.add(donation)
    if newly_paid and donation.user_id:
        notify(db, f"u:{donation.user_id}", "donation_received", "/dashboard", reference=donation.reference,
               amount=f"{donation.amount_paise // 100}")
    return newly_paid


def _receipt_email_body(d: Donation) -> str:
    base = (settings.SITE_URL or "").rstrip("/")
    link = f"{base}/gau-sewa/receipt/{d.receipt_token}" if base else f"/gau-sewa/receipt/{d.receipt_token}"
    return (f"Namaste {d.donor_name},\n\nThank you for your Gau Sewa donation.\n\n"
            f"Reference: {d.reference}\nAmount: Rs {d.amount_paise // 100}\nPurpose: {d.purpose}\n"
            f"Recipient: {d.recipient_name or '-'}\nStatus: {d.status}\n\nYour receipt: {link}\n\n"
            "This receipt acknowledges your payment. It is not a tax exemption certificate.\n\nAstro Jyotish")


def _send_receipt_email(donation_id: str) -> None:
    """Background task: emails the receipt link once, only when SMTP is configured and the donor gave an email."""
    if not mailer.is_configured():
        return
    with SessionLocal() as db:
        d = db.query(Donation).filter(Donation.id == donation_id).first()
        if not d or d.status != "SUCCESS" or not d.donor_email or d.receipt_emailed_at:
            return
        if mailer.send_email(d.donor_email, f"Your Gau Sewa donation receipt {d.reference}", _receipt_email_body(d)):
            d.receipt_emailed_at = utc_now()
            db.commit()


@router.post("/donations/verify")
def verify_donation(payload: DonationVerifyRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    """Confirms a donation. The result comes from Razorpay's own record of the payment, never from the browser's word."""
    if not settings.razorpay_enabled:
        raise HTTPException(status_code=503, detail=UNAVAILABLE_MESSAGES["payments_not_configured"])
    donation = db.query(Donation).filter(Donation.provider_order_id == payload.razorpay_order_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    if not hmac.compare_digest(_sign(payload.razorpay_order_id, payload.razorpay_payment_id), payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment could not be verified.")
    if donation.status in ("SUCCESS", "REFUNDED"):
        if donation.provider_payment_id and donation.provider_payment_id != payload.razorpay_payment_id:
            raise HTTPException(status_code=400, detail="This donation was already settled by a different payment.")
        return {**_summary(donation, with_token=True), "verified": True, "duplicate": True}
    payment = _razorpay("GET", f"/payments/{payload.razorpay_payment_id}")
    try:
        newly_paid = _apply_payment(db, donation, payment)
    except ValueError:
        db.rollback()
        raise HTTPException(status_code=400, detail="This payment does not match the donation.")
    db.commit()
    if newly_paid and donation.donor_email:
        background.add_task(_send_receipt_email, donation.id)
    return {**_summary(donation, with_token=True), "verified": donation.status in ("SUCCESS", "REFUNDED")}


# --------------------------------------------------------------------------------------------- webhook
def _process_webhook(db: Session, event_id: str, event: Dict[str, Any]) -> Dict[str, Any]:
    etype = event.get("event") or ""
    try:
        db.add(PaymentWebhookEvent(provider="razorpay", event_id=event_id, event_type=etype[:60]))
        db.flush()
    except IntegrityError:
        db.rollback()
        return {"status": "duplicate"}
    payload = event.get("payload") or {}
    payment = (payload.get("payment") or {}).get("entity") or {}
    refund = (payload.get("refund") or {}).get("entity") or {}
    donation = None
    if etype.startswith("refund."):
        pid = refund.get("payment_id") or payment.get("id")
        donation = db.query(Donation).filter(Donation.provider_payment_id == pid).first() if pid else None
        if donation and not payment.get("amount_refunded") and pid:
            payment = _razorpay("GET", f"/payments/{pid}")  # refund payloads may omit the payment; ask the provider
    elif etype in ("payment.captured", "payment.failed", "order.paid", "payment.authorized"):
        order_id = payment.get("order_id")
        donation = db.query(Donation).filter(Donation.provider_order_id == order_id).first() if order_id else None
    result, email_for = "ignored", None
    if donation and payment:
        try:
            if _apply_payment(db, donation, payment) and donation.donor_email:
                email_for = donation.id
            result = "ok"
        except ValueError:
            result = "mismatch"  # recorded, but never changes a donation
    db.commit()
    return {"status": result, "_email_donation": email_for}


@router.post("/webhook")
async def razorpay_webhook(request: Request, background: BackgroundTasks, db: Session = Depends(get_db)):
    """Signed Razorpay webhook. Set the URL and RAZORPAY_WEBHOOK_SECRET in the Razorpay dashboard."""
    if not settings.razorpay_webhook_enabled:
        raise HTTPException(status_code=503, detail="Webhook is not configured.")
    body = await request.body()
    expected = hmac.new(settings.RAZORPAY_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, request.headers.get("X-Razorpay-Signature", "")):
        raise HTTPException(status_code=400, detail="Invalid signature.")
    try:
        event = json.loads(body)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload.")
    if not isinstance(event, dict):
        raise HTTPException(status_code=400, detail="Invalid payload.")
    event_id = request.headers.get("X-Razorpay-Event-Id") or hashlib.sha256(body).hexdigest()
    result = await run_in_threadpool(_process_webhook, db, event_id, event)
    if result.get("_email_donation"):
        background.add_task(_send_receipt_email, result["_email_donation"])
    return {"status": result["status"]}


# --------------------------------------------------------------------------------------------- history & receipts
@router.get("/donations/mine")
def my_donations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user_required)):
    """The signed-in user's own donations only."""
    rows = db.query(Donation).filter(Donation.user_id == current_user.id).order_by(Donation.created_at.desc()).limit(200).all()
    return {"donations": [_summary(d, with_token=True) for d in rows]}


def _by_token(db: Session, token: str) -> Donation:
    d = db.query(Donation).filter(Donation.receipt_token == token).first() if 20 <= len(token) <= 64 else None
    if not d:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return d


@router.get("/donations/receipt/{token}")
def receipt_info(token: str, db: Session = Depends(get_db)):
    d = _by_token(db, token)
    return {**_summary(d), "donor_name": d.donor_name, "receipt_available": d.status in ("SUCCESS", "REFUNDED"),
            "failure_reason": d.failure_reason if d.status == "FAILED" else None}


def _receipt_html(d: Donation) -> str:
    e = html.escape
    paid = _iso(d.paid_at) or ""
    rows = [("Reference", d.reference), ("Donor", d.donor_name), ("Amount", f"₹{d.amount_paise / 100:,.2f}"),
            ("Purpose", {"chaara": "Chaara Seva", "chikitsa": "Chikitsa Sahayata", "general": "General Seva"}.get(d.purpose, d.purpose)),
            ("Recipient", d.recipient_name or "-"), ("Date", paid[:10]), ("Payment status", d.status)]
    if d.status == "REFUNDED":
        rows.append(("Refunded", f"₹{(d.refunded_paise or 0) / 100:,.2f}"))
    body = "".join(f"<tr><th>{e(k)}</th><td>{e(str(v))}</td></tr>" for k, v in rows)
    return ("<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            f"<title>Gau Sewa donation receipt {e(d.reference)}</title><style>body{{font-family:Georgia,serif;background:#fbf6ea;color:#4a2c17;margin:0;padding:24px}}"
            ".card{max-width:560px;margin:auto;background:#fff;border:1px solid #e7dcc3;border-radius:14px;padding:28px}h1{margin:0 0 4px;font-size:22px}"
            "table{width:100%;border-collapse:collapse;margin:18px 0}th,td{text-align:left;padding:8px 6px;border-bottom:1px solid #f0e8d6}th{width:38%;color:#7a5a3a;font-weight:600}"
            ".note{font-size:13px;color:#7a5a3a}</style></head><body><div class=\"card\"><h1>Gau Sewa donation receipt</h1><div class=\"note\">Astro Jyotish</div>"
            f"<table>{body}</table><p class=\"note\">This receipt acknowledges your payment. It is not a tax exemption certificate.</p></div></body></html>")


@router.get("/donations/receipt/{token}/download")
def receipt_download(token: str, db: Session = Depends(get_db)):
    d = _by_token(db, token)
    if d.status not in ("SUCCESS", "REFUNDED"):
        raise HTTPException(status_code=409, detail="A receipt is available once the payment is confirmed.")
    return HTMLResponse(_receipt_html(d), headers={"Content-Disposition": f'attachment; filename="gau-sewa-receipt-{d.reference}.html"',
                                                   "Cache-Control": "private, no-store"})


# --------------------------------------------------------------------------------------------- admin
class GaushalaPayload(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    introduction: Optional[str] = Field(None, max_length=4000)
    photos: Optional[List[str]] = None
    beneficiary_name: Optional[str] = Field(None, max_length=255)
    beneficiary_details: Optional[str] = Field(None, max_length=4000)
    donations_enabled: StrictBool = False
    is_active: StrictBool = True


class UpdatePayload(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    body: Optional[str] = Field(None, max_length=8000)
    photos: Optional[List[str]] = None
    gaushala_id: Optional[str] = None
    is_published: StrictBool = False


def _slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:60] or "gaushala"


def _admin_gaushala(g: Gaushala) -> Dict[str, Any]:
    return {**_gaushala_public(g), "donations_enabled": bool(g.donations_enabled), "is_active": bool(g.is_active)}


def _apply_gaushala(g: Gaushala, p: GaushalaPayload) -> None:
    beneficiary = (p.beneficiary_name or "").strip()
    if p.donations_enabled and not beneficiary:
        raise HTTPException(status_code=422, detail="Add the beneficiary name before turning donations on")
    g.name = p.name.strip()
    g.location = (p.location or "").strip() or None
    g.introduction = (p.introduction or "").strip() or None
    g.beneficiary_name = beneficiary or None
    g.beneficiary_details = (p.beneficiary_details or "").strip() or None
    g.donations_enabled = p.donations_enabled
    g.is_active = p.is_active
    if p.photos is not None:
        g.photos = _clean_photos(p.photos)


@router.get("/admin/gaushalas")
def admin_list_gaushalas(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    rows = db.query(Gaushala).order_by(Gaushala.created_at).all()
    return {"gaushalas": [_admin_gaushala(g) for g in rows], "payments_configured": settings.razorpay_enabled,
            "webhook_configured": settings.razorpay_webhook_enabled, "email_configured": mailer.is_configured(),
            "collection_open": _unavailable_reason(db) is None}


@router.post("/admin/gaushalas")
def admin_create_gaushala(payload: GaushalaPayload, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    base = _slugify(payload.name)
    slug, n = base, 2
    while db.query(Gaushala).filter(Gaushala.slug == slug).first():
        slug, n = f"{base}-{n}", n + 1
    g = Gaushala(slug=slug, photos="[]")
    _apply_gaushala(g, payload)
    db.add(g)
    db.commit()
    return _admin_gaushala(g)


@router.put("/admin/gaushalas/{gaushala_id}")
def admin_update_gaushala(gaushala_id: str, payload: GaushalaPayload, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    g = db.query(Gaushala).filter(Gaushala.id == gaushala_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Gaushala not found")
    _apply_gaushala(g, payload)
    db.commit()
    return _admin_gaushala(g)


@router.get("/admin/updates")
def admin_list_updates(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    rows = db.query(GauSevaUpdate).order_by(GauSevaUpdate.created_at.desc()).limit(200).all()
    return {"updates": [{**_update_public(u), "is_published": bool(u.is_published)} for u in rows]}


def _apply_update(db: Session, u: GauSevaUpdate, p: UpdatePayload) -> None:
    if p.gaushala_id and not db.query(Gaushala).filter(Gaushala.id == p.gaushala_id).first():
        raise HTTPException(status_code=422, detail="Choose an existing gaushala")
    u.title = p.title.strip()
    u.body = (p.body or "").strip() or None
    u.gaushala_id = p.gaushala_id or None
    if p.photos is not None:
        u.photos = _clean_photos(p.photos)
    if p.is_published and not u.is_published:
        u.published_at = utc_now()
    u.is_published = p.is_published


@router.post("/admin/updates")
def admin_create_update(payload: UpdatePayload, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    u = GauSevaUpdate(photos="[]")
    _apply_update(db, u, payload)
    db.add(u)
    db.commit()
    return {**_update_public(u), "is_published": bool(u.is_published)}


@router.put("/admin/updates/{update_id}")
def admin_edit_update(update_id: str, payload: UpdatePayload, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    u = db.query(GauSevaUpdate).filter(GauSevaUpdate.id == update_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Update not found")
    _apply_update(db, u, payload)
    db.commit()
    return {**_update_public(u), "is_published": bool(u.is_published)}


@router.delete("/admin/updates/{update_id}")
def admin_delete_update(update_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    u = db.query(GauSevaUpdate).filter(GauSevaUpdate.id == update_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Update not found")
    db.delete(u)
    db.commit()
    return {"deleted": True}


@router.post("/admin/upload-photo")
async def admin_upload_photo(file: UploadFile = File(...), _admin: User = Depends(require_admin)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_IMAGE_EXT or not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload a jpg, png or webp image")
    data = await file.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{generate_uuid()}{ext}"
    (UPLOAD_DIR / name).write_bytes(data)
    return {"url": f"/uploads/gau-sewa/{name}", "size": len(data)}


@router.get("/admin/donations")
def admin_list_donations(status: Optional[str] = None, purpose: Optional[str] = None, gaushala_id: Optional[str] = None,
                         q: Optional[str] = None, date_from: Optional[str] = None, date_to: Optional[str] = None,
                         limit: int = 50, offset: int = 0,
                         db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    """Donations with the donor's details (admin only) and totals for the same filter. Only SUCCESS counts toward 'collected'."""
    query = db.query(Donation)
    if status:
        if status.upper() not in STATUSES:
            raise HTTPException(status_code=422, detail="Unknown status")
        query = query.filter(Donation.status == status.upper())
    if purpose:
        query = query.filter(Donation.purpose == purpose)
    if gaushala_id:
        query = query.filter(Donation.gaushala_id == gaushala_id)
    if q and q.strip():
        like = f"%{q.strip()}%"
        query = query.filter((Donation.reference.ilike(like)) | (Donation.donor_name.ilike(like)) | (Donation.donor_email.ilike(like)))
    for value, op in ((date_from, "ge"), (date_to, "le")):
        if value:
            try:
                day = datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=422, detail="Dates must be YYYY-MM-DD")
            if op == "ge":
                query = query.filter(Donation.created_at >= day)
            else:
                query = query.filter(Donation.created_at < day.replace(hour=23, minute=59, second=59))
    ids = query.with_entities(Donation.id).order_by(None).statement
    by_status = {s: {"count": 0, "amount_paise": 0} for s in STATUSES}
    for s, count, total in db.query(Donation.status, func.count(), func.coalesce(func.sum(Donation.amount_paise), 0)).filter(Donation.id.in_(ids)).group_by(Donation.status):
        if s in by_status:
            by_status[s] = {"count": count, "amount_paise": int(total)}
    by_purpose = {p: 0 for p in PURPOSES}
    for p, total in db.query(Donation.purpose, func.coalesce(func.sum(Donation.amount_paise), 0)).filter(Donation.id.in_(ids), Donation.status == "SUCCESS").group_by(Donation.purpose):
        by_purpose[p] = int(total)
    total_rows = sum(v["count"] for v in by_status.values())
    rows = query.order_by(Donation.created_at.desc()).offset(max(0, offset)).limit(max(1, min(limit, 200))).all()
    return {
        "total": total_rows,
        "totals": {"collected_paise": by_status["SUCCESS"]["amount_paise"], "refunded_paise": int(db.query(func.coalesce(func.sum(Donation.refunded_paise), 0)).filter(Donation.id.in_(ids)).scalar() or 0),
                   "by_status": by_status, "by_purpose_paise": by_purpose},
        "donations": [{**_summary(d), "donor_name": d.donor_name, "donor_email": d.donor_email, "hide_name_public": bool(d.hide_name_public),
                       "user_id": d.user_id, "provider_order_id": d.provider_order_id, "provider_payment_id": d.provider_payment_id,
                       "failure_reason": d.failure_reason} for d in rows],
    }


def seed_gaushalas_if_empty(db: Session) -> None:
    """Ensures at least one active, verified Gaushala exists for devotees to support."""
    existing = db.query(Gaushala).first()
    if not existing:
        photos = json.dumps([
            "/assets/img/gausewa/cow-mother-calf.webp",
            "/assets/img/gausewa/cow-portrait.webp",
            "/assets/img/gausewa/gaushala-shelter-real.webp"
        ])
        g = Gaushala(
            id=generate_uuid(),
            slug="shri-krishna-gaushala-vrindavan",
            name="Shri Krishna Gaushala (Cow Care Center)",
            location="Vrindavan, Mathura, Uttar Pradesh",
            introduction="A registered sanctuary providing loving care, daily green fodder, medical treatment, and shelter to 350+ sacred cows.",
            photos=photos,
            beneficiary_name="Shri Krishna Gaushala Trust",
            beneficiary_details="Direct monthly disbursement for nutritious green fodder, 24/7 veterinarian aid, and seasonal cow shelter.",
            donations_enabled=True,
            is_active=True,
            created_at=utc_now(),
            updated_at=utc_now()
        )
        db.add(g)
        db.commit()
    elif not existing.donations_enabled:
        existing.donations_enabled = True
        existing.is_active = True
        if not (existing.beneficiary_name or "").strip():
            existing.beneficiary_name = "Shri Krishna Gaushala Trust"
        db.commit()
