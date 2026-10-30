"""Discounts, loyalty points and membership shared by Mandir Seva and Astro Mall.

Order of application: member discount (mall only) -> coupon -> points. Business numbers live in the constants
below so they can be changed in one place.
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from packages.database.models import Coupon, CouponUse, LoyaltyEntry, Membership, User, utc_now

POINT_VALUE_RUPEES = 0.5          # 1 point is worth this much when redeemed
EARN_PER_RUPEES = 20              # 1 point earned per this many rupees paid (double for members)
MAX_POINTS_SHARE = 0.20           # points can pay for at most this share of an order
MEMBER_MALL_DISCOUNT = 0.05       # extra discount on Astro Mall for members
REFERRAL_BONUS_POINTS = 100       # given to both people when the referred person completes a first paid order

MEMBER_CONSULT_DISCOUNT = 0.10    # members pay this much less for scheduled astrologer appointments
MEMBER_MONTHLY_BONUS = 100.0      # wallet credit a member can claim once every calendar month
REFERRAL_MILESTONES = {3: 150, 5: 300, 10: 750}   # friends who completed a first order -> extra points (once each)

MEMBER_PLANS: Dict[str, Dict[str, Any]] = {
    "monthly": {"price": 149.0, "days": 30},
    "yearly": {"price": 999.0, "days": 365},
}


def active_membership(db: Session, user_id: Optional[str]) -> Optional[Membership]:
    if not user_id:
        return None
    now = datetime.now(timezone.utc)
    rows = db.query(Membership).filter(Membership.user_id == user_id).order_by(Membership.expires_at.desc()).all()
    for m in rows:
        exp = m.expires_at if m.expires_at.tzinfo else m.expires_at.replace(tzinfo=timezone.utc)
        if exp > now:
            return m
    return None


def _aware(dt: Optional[datetime]) -> Optional[datetime]:
    return dt if dt is None or dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def check_coupon(db: Session, code: str, user_id: str, scope: str, amount: float) -> tuple:
    """Returns (coupon, discount_amount) or raises HTTPException with a readable reason."""
    coupon = db.query(Coupon).filter(Coupon.code == (code or "").strip().upper(), Coupon.is_active == True).first()  # noqa: E712
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon code is not valid")
    now = datetime.now(timezone.utc)
    if (_aware(coupon.valid_from) and _aware(coupon.valid_from) > now) or (_aware(coupon.valid_to) and _aware(coupon.valid_to) < now):
        raise HTTPException(status_code=400, detail="This coupon has expired or is not active yet")
    if coupon.applies_to not in ("all", scope):
        raise HTTPException(status_code=400, detail=f"This coupon is valid only for {'Astro Mall' if coupon.applies_to == 'mall' else 'Mandir Seva'}")
    if amount < (coupon.min_amount or 0):
        raise HTTPException(status_code=400, detail=f"Add items worth ₹{coupon.min_amount:.0f} or more to use this coupon")
    uses = db.query(CouponUse).filter(CouponUse.coupon_id == coupon.id)
    if coupon.usage_limit is not None and uses.count() >= coupon.usage_limit:
        raise HTTPException(status_code=400, detail="This coupon has reached its usage limit")
    if uses.filter(CouponUse.user_id == user_id).count() >= (coupon.per_user_limit or 1):
        raise HTTPException(status_code=400, detail="You have already used this coupon")
    if coupon.first_order_only:
        from packages.database.models import ChadawaBooking, MarketplaceOrder
        had = (db.query(MarketplaceOrder.id).filter(MarketplaceOrder.user_id == user_id, MarketplaceOrder.order_status != "CANCELLED").first()
               or db.query(ChadawaBooking.id).filter(ChadawaBooking.user_id == user_id, ChadawaBooking.status != "CANCELLED").first())
        if had:
            raise HTTPException(status_code=400, detail="This coupon is only for your first order")
    discount = amount * coupon.value / 100.0 if coupon.kind == "percent" else coupon.value
    if coupon.max_discount:
        discount = min(discount, coupon.max_discount)
    return coupon, round(min(discount, amount), 2)


def compute_totals(db: Session, user: User, scope: str, subtotal: float, coupon_code: Optional[str] = None,
                   use_points: int = 0, delivery_fee: float = 0.0) -> Dict[str, Any]:
    """Prices an order for `user`. `scope` is 'mall' or 'seva'. Raises HTTPException for an invalid coupon."""
    member = active_membership(db, user.id)
    remaining = round(subtotal, 2)
    member_discount = round(remaining * MEMBER_MALL_DISCOUNT, 2) if (member and scope == "mall") else 0.0
    remaining -= member_discount

    coupon, coupon_discount = (None, 0.0)
    if coupon_code:
        coupon, coupon_discount = check_coupon(db, coupon_code, user.id, scope, remaining)
        remaining -= coupon_discount

    balance = max(0, user.loyalty_points or 0)
    want = max(0, int(use_points or 0))
    cap = int((remaining * MAX_POINTS_SHARE) / POINT_VALUE_RUPEES)
    points_used = min(want, balance, cap)
    points_value = round(points_used * POINT_VALUE_RUPEES, 2)
    remaining -= points_value

    fee_waived = bool(member and delivery_fee)
    fee = 0.0 if fee_waived else delivery_fee
    total = round(max(0.0, remaining) + fee, 2)
    multiplier = 2 if member else 1
    return {
        "subtotal": round(subtotal, 2), "member_discount": member_discount, "coupon_code": coupon.code if coupon else None,
        "coupon_discount": coupon_discount, "points_used": points_used, "points_value": points_value,
        "delivery_fee": fee, "delivery_waived": fee_waived, "total": total, "is_member": bool(member),
        "earn_points": int((total - fee) // EARN_PER_RUPEES) * multiplier, "coupon": coupon,
    }


def apply_totals(db: Session, user: User, totals: Dict[str, Any], ref: str, reason: str) -> None:
    """Records coupon use and spends points after a successful charge (inside the caller's transaction)."""
    if totals["coupon"]:
        db.add(CouponUse(coupon_id=totals["coupon"].id, user_id=user.id, ref=ref, amount=totals["coupon_discount"]))
    if totals["points_used"]:
        user.loyalty_points = (user.loyalty_points or 0) - totals["points_used"]
        db.add(LoyaltyEntry(user_id=user.id, points=-totals["points_used"], reason="redeem", ref=ref))


def award_points(db: Session, user_id: str, points: int, reason: str, ref: str) -> None:
    if points <= 0:
        return
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return
    user.loyalty_points = (user.loyalty_points or 0) + points
    db.add(LoyaltyEntry(user_id=user_id, points=points, reason=reason, ref=ref))


def refund_points(db: Session, user_id: Optional[str], points: int, ref: str) -> None:
    if user_id and points:
        award_points(db, user_id, points, "refund", ref)


def maybe_reward_referral(db: Session, user: User, ref: str) -> bool:
    """Gives both sides the referral bonus once, when the referred user pays for their first order."""
    if not user.referred_by:
        return False
    already = db.query(LoyaltyEntry.id).filter(LoyaltyEntry.user_id == user.id, LoyaltyEntry.reason == "referral").first()
    if already:
        return False
    award_points(db, user.id, REFERRAL_BONUS_POINTS, "referral", ref)
    award_points(db, user.referred_by, REFERRAL_BONUS_POINTS, "referral", ref)
    award_referral_milestones(db, user.referred_by, ref)
    return True


def referral_count(db: Session, referrer_id: str) -> int:
    """Friends this user invited who have completed a first paid order."""
    return (db.query(User.id).join(LoyaltyEntry, LoyaltyEntry.user_id == User.id)
            .filter(User.referred_by == referrer_id, LoyaltyEntry.reason == "referral").distinct().count())


def award_referral_milestones(db: Session, referrer_id: str, ref: str) -> None:
    """Extra points the first time a referrer reaches 3, 5 and 10 successful invites (flush first so the new bonus counts)."""
    db.flush()
    count = referral_count(db, referrer_id)
    for need, points in REFERRAL_MILESTONES.items():
        reason = f"referral_milestone_{need}"
        if count >= need and not db.query(LoyaltyEntry.id).filter(LoyaltyEntry.user_id == referrer_id, LoyaltyEntry.reason == reason).first():
            award_points(db, referrer_id, points, reason, ref)
