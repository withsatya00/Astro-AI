"""
User Authentication, Account Management, and Saved Birth Profiles API.
Implements Bcrypt hashing, signed JWT sessions, and multiple saved birth charts.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
import re

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

@router.get("/profiles", response_model=List[Dict[str, Any]])
def list_saved_birth_profiles(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Lists saved birth chart profiles.
    Returns authenticated user's profiles if logged in, or recent active profiles.
    """
    query = db.query(BirthChart)
    if current_user:
        query = query.filter(BirthChart.user_id == current_user.id)
    else:
        query = query.limit(10)

    charts = query.order_by(desc(BirthChart.is_default), desc(BirthChart.created_at)).all()
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
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Sets a birth profile as the primary/default profile."""
    target = db.query(BirthChart).filter(BirthChart.id == profile_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Birth profile not found.")

    # Unset other defaults for this user
    if current_user:
        db.query(BirthChart).filter(BirthChart.user_id == current_user.id).update({"is_default": False})
    else:
        db.query(BirthChart).update({"is_default": False})

    target.is_default = True
    db.commit()
    return {"status": "success", "message": f"Profile '{target.name}' set as default."}

@router.delete("/profiles/{profile_id}")
def delete_saved_birth_profile(
    profile_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Deletes a saved birth chart profile."""
    target = db.query(BirthChart).filter(BirthChart.id == profile_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Birth profile not found.")

    if current_user and target.user_id and target.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to delete this profile.")

    db.delete(target)
    db.commit()
    return {"status": "success", "message": "Birth profile deleted."}
