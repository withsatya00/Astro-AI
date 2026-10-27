"""Loyalty points, referral, Premium membership and coupon preview."""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from packages.core.pricing import (
    EARN_PER_RUPEES, MAX_POINTS_SHARE, MEMBER_MALL_DISCOUNT, MEMBER_PLANS, POINT_VALUE_RUPEES, REFERRAL_BONUS_POINTS,
    active_membership, check_coupon
)
from packages.core.wallet_pay import charge_wallet
from packages.database.models import ChadawaBooking, Coupon, LoyaltyEntry, MarketplaceOrder, Membership, User
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
                  "referral_bonus": REFERRAL_BONUS_POINTS},
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
