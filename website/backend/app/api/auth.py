"""
User Authentication, Account Management, and Saved Birth Profiles API.
Implements Bcrypt hashing, signed JWT sessions, and multiple saved birth charts.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
import re
from pydantic import BaseModel

from packages.database.session import get_db
from packages.database.models import User, BirthChart, Consultation, generate_uuid, utc_now
from packages.core.schemas import (
    UserRegisterRequest, UserLoginRequest, AuthTokenResponse,
    UserProfileResponse, BirthChartResponse
)
from packages.core.security import (
    verify_password, get_password_hash, create_access_token,
    decode_access_token, sanitize_user_input
)
from packages.core.config import settings
from packages.core.identity import Owner, optional_owner, CLIENT_ID_RE
from packages.database.models import ChatSession

router = APIRouter(prefix="/auth", tags=["Authentication & Profiles"])

def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Helper dependency to extract authenticated user from Bearer JWT token if provided."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    user_id = payload["sub"]
    return db.query(User).filter(User.id == user_id, User.is_active == True).first()

def get_current_user_required(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Dependency enforcing that an authenticated user token is present."""
    user = get_current_user_optional(authorization=authorization, db=db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in or provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user

@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user account with secure password hashing."""
    email_clean = payload.email.lower().strip()
    if not re.match(r"^[^@]+@[^@]+\.[^@]+$", email_clean):
        raise HTTPException(status_code=400, detail="Invalid email address format.")

    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    hashed_pw = get_password_hash(payload.password)
    user = User(
        id=generate_uuid(),
        email=email_clean,
        hashed_password=hashed_pw,
        full_name=sanitize_user_input(payload.full_name or ""),
        phone=sanitize_user_input(payload.phone or ""),
        role="client",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return AuthTokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    )

@router.post("/login", response_model=AuthTokenResponse)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticates credentials and returns a signed JWT access token."""
    email_clean = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive. Please contact support.")

    token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return AuthTokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    )

@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Retrieves profile and activity counts for the authenticated user."""
    charts_count = db.query(BirthChart).filter(BirthChart.user_id == current_user.id).count()
    consultations_count = db.query(Consultation).filter(Consultation.user_id == current_user.id).count()

    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role,
        created_at=current_user.created_at,
        saved_profiles_count=charts_count,
        consultations_count=consultations_count
    )

def _row(obj) -> Dict[str, Any]:
    return {col.name: (val.isoformat() if hasattr(val, "isoformat") else val)
            for col in obj.__table__.columns for val in [getattr(obj, col.name)]}


@router.get("/me/export")
def export_my_data(current_user: User = Depends(get_current_user_required), db: Session = Depends(get_db)):
    """Everything we hold about the signed-in account, as JSON (password hash excluded)."""
    from packages.database.models import (Booking, ChadawaBooking, Notification, Reminder, WalletTransaction, WishlistItem, MarketplaceOrder)
    from packages.database.chadhava import ChadhavaOrder
    key = f"u:{current_user.id}"
    account = _row(current_user)
    account.pop("hashed_password", None)
    mine = lambda model, col="user_id": [_row(r) for r in db.query(model).filter(getattr(model, col) == current_user.id).all()]
    return {
        "exported_at": utc_now().isoformat(),
        "account": account,
        "birth_profiles": mine(BirthChart),
        "wallet_transactions": mine(WalletTransaction),
        "appointments": mine(Booking),
        "puja_bookings": [_row(r) for r in db.query(ChadawaBooking).filter(ChadawaBooking.owner_key == key).all()],
        "chadhava_orders": mine(ChadhavaOrder),
        "orders": [_row(r) for r in db.query(MarketplaceOrder).filter(MarketplaceOrder.owner_key == key).all()],
        "wishlist": mine(WishlistItem),
        "reminders": mine(Reminder),
        "notifications": [_row(r) for r in db.query(Notification).filter(Notification.owner_key == key).all()],
    }


class DeleteAccountRequest(BaseModel):
    password: str
    confirm_forfeit_balance: bool = False


@router.post("/me/delete")
def delete_my_account(payload: DeleteAccountRequest, current_user: User = Depends(get_current_user_required), db: Session = Depends(get_db)):
    """Removes personal data and closes the account. Payment, order and booking records are kept without personal details."""
    from packages.database.models import Booking, ChadawaBooking, Notification, Reminder, WishlistItem
    if current_user.role == "admin":
        raise HTTPException(status_code=403, detail="Admin accounts cannot be deleted here.")
    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(status_code=403, detail="Password is incorrect.")
    if (current_user.wallet_balance or 0) > 0 and not payload.confirm_forfeit_balance:
        raise HTTPException(status_code=409, detail=f"Your wallet still holds ₹{current_user.wallet_balance:.2f}. Confirm to forfeit it, or spend it first.")
    key = f"u:{current_user.id}"
    for model in (WishlistItem, Reminder):
        db.query(model).filter(model.user_id == current_user.id).delete(synchronize_session=False)
    db.query(Notification).filter(Notification.owner_key == key).delete(synchronize_session=False)
    for rel in (current_user.charts, current_user.sessions, current_user.reports, current_user.consultations):
        for row in list(rel):
            db.delete(row)
    db.query(Booking).filter(Booking.user_id == current_user.id).update({Booking.user_name: "Deleted user", Booking.user_phone: None, Booking.notes: None}, synchronize_session=False)
    db.query(ChadawaBooking).filter(ChadawaBooking.owner_key == key).update(
        {ChadawaBooking.devotee_phone: None, ChadawaBooking.family_members: None}, synchronize_session=False)
    from packages.database.chadhava import ChadhavaOrder, TempleStaff
    from pathlib import Path
    private_root = (Path(__file__).resolve().parents[4] / "storage" / "private" / "chadhava").resolve()
    private_files = []
    for order in db.query(ChadhavaOrder).filter_by(user_id=current_user.id).all():
        snapshot = dict(order.snapshot)
        filename = snapshot.get("video_filename", "")
        if filename and Path(filename).name == filename:
            private_file = (private_root / order.id / filename).resolve()
            if private_file.is_relative_to(private_root):
                private_files.append(private_file)
        snapshot.update(devotee_name="Deleted user", phone="", gotra="", family_members="", purpose="")
        snapshot.pop("video_filename", None)
        order.snapshot = snapshot
        order.video_url = None
        if order.booking_id:
            linked_booking = db.get(ChadawaBooking, order.booking_id)
            if linked_booking:
                linked_booking.devotee_name = "Deleted user"
                linked_booking.gotra = None
                linked_booking.sankalp_purpose = None
    db.query(TempleStaff).filter_by(user_id=current_user.id).delete()
    current_user.email = f"deleted-{current_user.id}@deleted.invalid"
    current_user.full_name = None
    current_user.phone = None
    current_user.wallet_balance = 0.0
    current_user.hashed_password = "!" + generate_uuid()
    current_user.is_active = False
    db.commit()
    for private_file in private_files:
        try:
            private_file.unlink(missing_ok=True)
        except OSError:
            from packages.core.logging import logger
            logger.warning("Private chadhava video cleanup needs operator attention")
    return {"success": True}


@router.get("/profiles", response_model=List[Dict[str, Any]])
def list_saved_birth_profiles(
    owner: Optional[Owner] = Depends(optional_owner),
    db: Session = Depends(get_db)
):
    """Lists the caller's own saved birth chart profiles (a signed-in user's, or this visitor's)."""
    if not owner:
        return []
    charts = (db.query(BirthChart).filter(BirthChart.owner_key == owner.key)
              .order_by(desc(BirthChart.is_default), desc(BirthChart.created_at)).limit(50).all())
    out = []
    for c in charts:
        out.append({
            "id": c.id,
            "name": c.name,
            "date_of_birth": c.date_of_birth,
            "time_of_birth": c.time_of_birth,
            "is_time_approximate": c.is_time_approximate,
            "city": c.city,
            "country": c.country,
            "is_default": bool(c.is_default),
            "chart_data": c.chart_data,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })
    return out

@router.patch("/profiles/{profile_id}/default")
def set_default_birth_profile(
    profile_id: str,
    owner: Optional[Owner] = Depends(optional_owner),
    db: Session = Depends(get_db)
):
    """Sets one of the caller's birth profiles as the primary/default profile."""
    target = db.query(BirthChart).filter(BirthChart.id == profile_id, BirthChart.owner_key == owner.key).first() if owner else None
    if not target:
        raise HTTPException(status_code=404, detail="Birth profile not found.")

    # Unset the caller's other defaults (never anyone else's)
    db.query(BirthChart).filter(BirthChart.owner_key == owner.key).update({"is_default": False})

    target.is_default = True
    db.commit()
    return {"status": "success", "message": f"Profile '{target.name}' set as default."}

@router.delete("/profiles/{profile_id}")
def delete_saved_birth_profile(
    profile_id: str,
    owner: Optional[Owner] = Depends(optional_owner),
    db: Session = Depends(get_db)
):
    """Deletes one of the caller's saved birth chart profiles."""
    target = db.query(BirthChart).filter(BirthChart.id == profile_id, BirthChart.owner_key == owner.key).first() if owner else None
    if not target:
        raise HTTPException(status_code=404, detail="Birth profile not found.")

    from packages.database.advanced import AdvancedRecord
    db.query(AdvancedRecord).filter(AdvancedRecord.user_id == target.user_id,
        AdvancedRecord.subject_id == target.id, AdvancedRecord.kind.in_(["memory", "family"])).delete(synchronize_session=False)
    db.delete(target)
    db.commit()
    return {"status": "success", "message": "Birth profile deleted."}


@router.post("/claim-guest")
def claim_guest_data(
    x_client_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """After signing in, moves what this browser did as a guest (charts, chats) into the account.

    Only data created under this browser's own client id moves, and only into the account that is
    signed in right now. Nothing belonging to another user or another browser is touched.
    """
    if not x_client_id or not CLIENT_ID_RE.match(x_client_id.strip()):
        return {"claimed": {}}
    guest_key, user_key = f"g:{x_client_id.strip()}", f"u:{current_user.id}"
    claimed = {}
    for label, model in (("charts", BirthChart), ("consultations", Consultation), ("sessions", ChatSession)):
        claimed[label] = db.query(model).filter(model.owner_key == guest_key).update(
            {"owner_key": user_key, "user_id": current_user.id}, synchronize_session=False)
    db.commit()
    return {"claimed": claimed}
