"""Loyalty points, referral, Premium membership and coupon preview."""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from packages.core.pricing import (
    EARN_PER_RUPEES, MAX_POINTS_SHARE, MEMBER_CONSULT_DISCOUNT, MEMBER_MALL_DISCOUNT, MEMBER_MONTHLY_BONUS, MEMBER_PLANS,
    POINT_VALUE_RUPEES, REFERRAL_BONUS_POINTS, REFERRAL_MILESTONES, active_membership, check_coupon, referral_count
)
from packages.core.wallet_pay import charge_wallet
from packages.database.models import Booking, ChadawaBooking, Coupon, LoyaltyEntry, MarketplaceOrder, Membership, User, WalletTransaction, generate_uuid, utc_now
from packages.database.session import get_db
from website.backend.app.api.auth import get_current_user_required

router = APIRouter(prefix="/rewards", tags=["Rewards & Membership"])

# Hindi text for the coupons we create ourselves; coupons an admin types are shown as written.
COUPON_TEXT_HI = {"WELCOME10": "पहले ऑर्डर पर 10% छूट (अधिकतम ₹200)"}


class ReferralRequest(BaseModel):
    code: str = Field(..., min_length=4, max_length=12)


class MembershipRequest(BaseModel):
    plan: str


class CouponCheck(BaseModel):
    code: str = Field(..., min_length=2, max_length=30)
    scope: str = "mall"
    amount: float = Field(..., gt=0)


def _ensure_code(db: Session, user: User) -> str:
    if not user.referral_code:
        while True:
            code = "AJ" + secrets.token_hex(3).upper()
            if not db.query(User.id).filter(User.referral_code == code).first():
                break
        user.referral_code = code
        db.commit()
    return user.referral_code


def _month_ref() -> str:
    return "MBONUS_" + datetime.now(timezone.utc).strftime("%Y%m")


def _benefits(db: Session, user: User, member) -> dict:
    """What membership has actually saved this user, plus whether this month's bonus can still be claimed."""
    if not member:
        return {"active": False}
    since = member.started_at
    saved_consult = sum(b.member_discount or 0 for b in db.query(Booking).filter(Booking.user_id == user.id, Booking.is_priority == True).all())  # noqa: E712
    claimed = db.query(WalletTransaction.id).filter(WalletTransaction.user_id == user.id, WalletTransaction.reference_id == _month_ref()).first()
    return {"active": True, "saved_consultations": round(saved_consult, 2), "bonus_claimed": bool(claimed), "bonus_amount": MEMBER_MONTHLY_BONUS,
            "member_since": since.isoformat() if since else None}


@router.post("/membership/claim-bonus")
def claim_monthly_bonus(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """Once per calendar month, an active member can move the monthly bonus into their wallet."""
    if not active_membership(db, user.id):
        raise HTTPException(status_code=403, detail="Monthly bonus is a Premium member benefit")
    ref = _month_ref()
    if db.query(WalletTransaction.id).filter(WalletTransaction.user_id == user.id, WalletTransaction.reference_id == ref).first():
        raise HTTPException(status_code=409, detail="You have already claimed this month's bonus")
    me = db.query(User).filter(User.id == user.id).with_for_update().first()
    me.wallet_balance = (me.wallet_balance or 0.0) + MEMBER_MONTHLY_BONUS
    db.add(WalletTransaction(user_id=user.id, amount=MEMBER_MONTHLY_BONUS, transaction_type="credit",
                             description="Premium monthly bonus", reference_id=ref, created_at=utc_now()))
    db.commit()
    return {"success": True, "amount": MEMBER_MONTHLY_BONUS, "balance": me.wallet_balance}


@router.get("/referrals")
def referral_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """Friends invited, how many completed a first order, points earned and milestone progress."""
    friends = db.query(User).filter(User.referred_by == user.id).order_by(User.created_at.desc()).limit(50).all()
    done_ids = {r[0] for r in db.query(LoyaltyEntry.user_id).filter(LoyaltyEntry.reason == "referral",
                                                                      LoyaltyEntry.user_id.in_([f.id for f in friends] or [""])).all()}
    earned = sum(e.points for e in db.query(LoyaltyEntry).filter(LoyaltyEntry.user_id == user.id, LoyaltyEntry.reason.like("referral%")).all())
    count = referral_count(db, user.id)
    def mask(name, email):
        n = (name or email.split("@")[0]).strip()
        return (n[:1].upper() + "*" * max(2, min(len(n) - 1, 5))) if n else "Friend"
    return {
        "joined": len(friends), "completed": count, "points_earned": earned,
        "friends": [{"name": mask(f.full_name, f.email), "completed": f.id in done_ids, "joined_at": f.created_at.isoformat() if f.created_at else None} for f in friends],
        "milestones": [{"need": need, "points": pts, "reached": count >= need} for need, pts in REFERRAL_MILESTONES.items()],
    }


@router.get("/summary")
def rewards_summary(lang: Optional[str] = None, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    member = active_membership(db, user.id)
    ledger = (db.query(LoyaltyEntry).filter(LoyaltyEntry.user_id == user.id)
              .order_by(LoyaltyEntry.created_at.desc()).limit(25).all())
    now = datetime.now(timezone.utc)
    coupons = [c for c in db.query(Coupon).filter(Coupon.is_active == True).all()  # noqa: E712
               if not c.valid_to or (c.valid_to if c.valid_to.tzinfo else c.valid_to.replace(tzinfo=timezone.utc)) > now]
    return {
        "points": user.loyalty_points or 0,
        "point_value": POINT_VALUE_RUPEES,
        "points_worth": round((user.loyalty_points or 0) * POINT_VALUE_RUPEES, 2),
        "referral_code": _ensure_code(db, user),
        "referred": bool(user.referred_by),
        "membership": {"plan": member.plan, "expires_at": member.expires_at.isoformat()} if member else None,
        "plans": [{"plan": k, "price": v["price"], "days": v["days"]} for k, v in MEMBER_PLANS.items()],
        "rules": {"earn_per_rupees": EARN_PER_RUPEES, "max_points_share": MAX_POINTS_SHARE, "member_mall_discount": MEMBER_MALL_DISCOUNT,
                  "referral_bonus": REFERRAL_BONUS_POINTS, "member_consult_discount": MEMBER_CONSULT_DISCOUNT,
                  "member_monthly_bonus": MEMBER_MONTHLY_BONUS},
        "benefits": _benefits(db, user, member),
        "ledger": [{"points": e.points, "reason": e.reason, "ref": e.ref, "time": e.created_at.isoformat() if e.created_at else None} for e in ledger],
        "coupons": [{"code": c.code, "description": COUPON_TEXT_HI.get(c.code, c.description) if (lang or "").lower().startswith("hi") else c.description, "applies_to": c.applies_to, "min_amount": c.min_amount} for c in coupons],
    }


@router.post("/referral")
def use_referral(req: ReferralRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """Links this account to the person who invited them; both get bonus points after the first completed order."""
    if user.referred_by:
        raise HTTPException(status_code=409, detail="A referral code is already applied to your account")
    if db.query(MarketplaceOrder.id).filter(MarketplaceOrder.user_id == user.id).first() or \
            db.query(ChadawaBooking.id).filter(ChadawaBooking.user_id == user.id).first():
        raise HTTPException(status_code=409, detail="Referral codes can only be added before your first order")
    referrer = db.query(User).filter(User.referral_code == req.code.strip().upper()).first()
    if not referrer or referrer.id == user.id:
        raise HTTPException(status_code=404, detail="Referral code is not valid")
    user.referred_by = referrer.id
    db.commit()
    return {"success": True, "bonus_points": REFERRAL_BONUS_POINTS}


@router.post("/membership")
def buy_membership(req: MembershipRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    plan = MEMBER_PLANS.get(req.plan)
    if not plan:
        raise HTTPException(status_code=400, detail="Plan must be monthly or yearly")
    try:
        charge_wallet(db, user.id, plan["price"], f"Premium membership ({req.plan})", "MEM")
        current = active_membership(db, user.id)
        start = current.expires_at if current and current.expires_at.tzinfo else (current.expires_at.replace(tzinfo=timezone.utc) if current else datetime.now(timezone.utc))
        db.add(Membership(user_id=user.id, plan=req.plan, amount_paid=plan["price"], expires_at=start + timedelta(days=plan["days"])))
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    member = active_membership(db, user.id)
    return {"success": True, "membership": {"plan": member.plan, "expires_at": member.expires_at.isoformat()}}


@router.post("/coupons/validate")
def validate_coupon(req: CouponCheck, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    if req.scope not in ("mall", "seva"):
        raise HTTPException(status_code=400, detail="Scope must be mall or seva")
    coupon, discount = check_coupon(db, req.code, user.id, req.scope, req.amount)
    return {"valid": True, "code": coupon.code, "discount": discount, "description": coupon.description}
