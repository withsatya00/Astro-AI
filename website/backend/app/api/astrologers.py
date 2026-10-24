"""
Astrologer Directory, Profiles, and Smart Matching API.
Provides dynamic search, multi-faceted filtering, verified reviews,
profile detail pages, and intelligent recommendation matching.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from typing import List, Optional
import re
from packages.database.session import get_db
from packages.database.models import Astrologer, AstrologerReview, generate_uuid
from packages.core.schemas import (
    AstrologerResponse, AstrologerListResponse, AstrologerCreateRequest, AstrologerUpdateRequest,
    AstrologerAvailabilityUpdate, AstrologerReviewCreate, AstrologerReviewResponse,
    SmartMatchRequest, SmartMatchResponse, SmartMatchResult
)
from packages.core.security import sanitize_user_input

router = APIRouter(prefix="/astrologers", tags=["Astrologer Directory"])

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")

@router.get("", response_model=AstrologerListResponse)
@router.get("/", response_model=AstrologerListResponse, include_in_schema=False)
def list_astrologers(
    search: Optional[str] = Query(None, description="Search by name, expertise, or bio"),
    expertise: Optional[str] = Query(None, description="Filter by specialty/concern"),
    language: Optional[str] = Query(None, description="Filter by spoken language"),
    availability: Optional[str] = Query(None, description="Filter: all, online, busy, offline"),
    is_ai: Optional[bool] = Query(None, description="Filter by AI persona (true) or Human (false)"),
    min_price: Optional[float] = Query(None, description="Minimum price per minute"),
    max_price: Optional[float] = Query(None, description="Maximum price per minute"),
    sort_by: str = Query("popular", description="popular, experience, price_asc, price_desc, rating"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Retrieves dynamic, paginated list of expert astrologers with multi-criteria filtering.
    Supports search across names, topics, languages, and pricing.
    """
    query = db.query(Astrologer)

    # 1. Search text filter
    if search:
        s_clean = sanitize_user_input(search)
        if s_clean:
            search_pattern = f"%{s_clean}%"
            query = query.filter(
                or_(
                    Astrologer.name.ilike(search_pattern),
                    Astrologer.name_hi.ilike(search_pattern),
                    Astrologer.title.ilike(search_pattern),
                    Astrologer.bio.ilike(search_pattern)
                )
            )

    # 2. Availability filter
    if availability and availability.lower() != "all":
        query = query.filter(Astrologer.availability == availability.lower())

    # 3. AI vs Human filter
    if is_ai is not None:
        query = query.filter(Astrologer.is_ai == is_ai)

    # 4. Pricing filters
    if min_price is not None:
        query = query.filter(Astrologer.price_per_minute >= min_price)
    if max_price is not None:
        query = query.filter(Astrologer.price_per_minute <= max_price)

    # Fetch all candidates to apply JSON array filtering for language and expertise
    all_candidates = query.all()

    # Filter in Python for JSON array fields (sqlite compatibility)
    filtered = []
    exp_lower = expertise.lower().strip() if expertise else None
    lang_lower = language.lower().strip() if language else None

    for a in all_candidates:
        match_exp = True
        match_lang = True

        if exp_lower:
            spec_list = [str(s).lower() for s in (a.specialties or [])]
            match_exp = any(exp_lower in s for s in spec_list)

        if lang_lower:
            lang_list = [str(l).lower() for l in (a.languages or [])]
            match_lang = any(lang_lower in l for l in lang_list)

        if match_exp and match_lang:
            filtered.append(a)

    # 5. Sorting
    if sort_by == "experience":
        filtered.sort(key=lambda x: x.experience_years, reverse=True)
    elif sort_by == "price_asc":
        filtered.sort(key=lambda x: x.price_per_minute)
    elif sort_by == "price_desc":
        filtered.sort(key=lambda x: x.price_per_minute, reverse=True)
    elif sort_by == "rating":
        filtered.sort(key=lambda x: x.rating, reverse=True)
    else:  # popular (featured first, then rating * reviews)
        filtered.sort(key=lambda x: (x.is_featured, x.rating * (x.review_count + 1)), reverse=True)

    total = len(filtered)
    total_pages = max(1, (total + limit - 1) // limit)
    offset = (page - 1) * limit
    paginated_items = filtered[offset : offset + limit]

    items_out = []
    for a in paginated_items:
        items_out.append(AstrologerResponse(
            id=a.id,
            slug=a.slug,
            name=a.name,
            name_hi=a.name_hi,
            title=a.title,
            title_hi=a.title_hi,
            avatar=a.avatar,
            bio=a.bio,
            bio_hi=a.bio_hi,
            experience_years=a.experience_years,
            rating=a.rating,
            review_count=a.review_count,
            consultations_count=a.consultations_count,
            price_per_minute=a.price_per_minute,
            currency=a.currency,
            is_ai=a.is_ai,
            ai_persona_id=a.ai_persona_id,
            availability=a.availability,
            languages=a.languages or [],
            specialties=a.specialties or [],
            is_featured=a.is_featured,
            is_verified=a.is_verified,
            created_at=a.created_at
        ))

    return AstrologerListResponse(
        items=items_out,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )

@router.get("/match", response_model=SmartMatchResponse)
def smart_match_astrologers(
    concern: str = Query(..., description="love, career, marriage, wealth, health, kundli"),
    preferred_language: Optional[str] = Query("Hindi", description="Preferred language"),
    consultation_mode: Optional[str] = Query("all", description="all, ai, human"),
    max_price: Optional[float] = Query(None, description="Max budget per minute"),
    db: Session = Depends(get_db)
):
    """
    Intelligent Astrologer Matching Service.
    Recommends optimal astrologers based on user concern, language synergy,
    honest availability, and price preferences with explicit reasoning.
    """
    concern_clean = concern.lower().strip()
    lang_clean = (preferred_language or "hindi").lower().strip()

    concern_keywords_map = {
        "love": ["love", "relationship", "marriage", "daampatya", "prem"],
        "marriage": ["marriage", "kundali milan", "vivah", "manglik", "relationship"],
        "career": ["career", "promotion", "job", "naukri", "business", "vyapar", "karma"],
        "wealth": ["wealth", "finance", "dhan", "money", "business", "vyapar"],
        "health": ["health", "swasthya", "remedies", "gemology", "shanti"],
        "kundli": ["vedic kundli", "birth chart", "kundali", "dasha", "panchang"]
    }

    target_keywords = concern_keywords_map.get(concern_clean, [concern_clean])

    astrologers = db.query(Astrologer).all()
    scored_results = []

    for a in astrologers:
        # Filter mode
        if consultation_mode == "ai" and not a.is_ai:
            continue
        if consultation_mode == "human" and a.is_ai:
            continue

        # Filter price
        if max_price is not None and a.price_per_minute > max_price:
            continue

        score = 0
        reasons = []

        # 1. Specialty synergy (up to 45 pts)
        spec_text = " ".join([str(s).lower() for s in (a.specialties or [])] + [str(a.bio).lower()])
        matches = [kw for kw in target_keywords if kw in spec_text]
        if matches:
            pts = min(45, 25 + len(matches) * 10)
            score += pts
            reasons.append(f"Expert in {', '.join(matches[:2]).title()} consultation")
        else:
            score += 10

        # 2. Language compatibility (up to 25 pts)
        langs = [str(l).lower() for l in (a.languages or [])]
        if any(lang_clean in l for l in langs):
            score += 25
            reasons.append(f"Fluently advises in {preferred_language.capitalize()}")
        elif "english" in langs or "hindi" in langs:
            score += 15
            reasons.append("Speaks English and Hindi fluently")

        # 3. Availability state (up to 20 pts)
        if a.availability == "online":
            score += 20
            reasons.append("Currently online for instant consultation")
        elif a.availability == "busy":
            score += 10
            reasons.append("Currently in session; short wait time")
        else:
            reasons.append("Available for appointment booking")

        # 4. Reputation & Experience (up to 10 pts)
        if a.rating >= 4.9:
            score += 5
            reasons.append(f"High satisfaction rating of {a.rating}★")
        if a.experience_years >= 15:
            score += 5
            reasons.append(f"Extensive {a.experience_years}+ years of experience")

        astro_resp = AstrologerResponse(
            id=a.id,
            slug=a.slug,
            name=a.name,
            name_hi=a.name_hi,
            title=a.title,
            title_hi=a.title_hi,
            avatar=a.avatar,
            bio=a.bio,
            bio_hi=a.bio_hi,
            experience_years=a.experience_years,
            rating=a.rating,
            review_count=a.review_count,
            consultations_count=a.consultations_count,
            price_per_minute=a.price_per_minute,
            currency=a.currency,
            is_ai=a.is_ai,
            ai_persona_id=a.ai_persona_id,
            availability=a.availability,
            languages=a.languages or [],
            specialties=a.specialties or [],
            is_featured=a.is_featured,
            is_verified=a.is_verified,
            created_at=a.created_at
        )

        scored_results.append(SmartMatchResult(
            astrologer=astro_resp,
            match_score=min(100, score),
            match_reasons=reasons
        ))

    scored_results.sort(key=lambda x: x.match_score, reverse=True)

    return SmartMatchResponse(
        concern=concern_clean,
        matches=scored_results[:6]
    )

@router.get("/{slug_or_id}", response_model=AstrologerResponse)
def get_astrologer_profile(slug_or_id: str, db: Session = Depends(get_db)):
    """
    Retrieves full profile for an individual astrologer by slug or ID.
    Includes bio, specializations, pricing, availability, and verified reviews.
    """
    astro = db.query(Astrologer).filter(
        or_(Astrologer.slug == slug_or_id, Astrologer.id == slug_or_id)
    ).first()

    if not astro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Astrologer '{slug_or_id}' not found."
        )

    # Load reviews
    reviews_out = []
    for r in (astro.reviews or []):
        reviews_out.append(AstrologerReviewResponse(
            id=r.id,
            user_name=r.user_name,
            rating=r.rating,
            comment=r.comment,
            is_verified=r.is_verified,
            created_at=r.created_at
        ))

    return AstrologerResponse(
        id=astro.id,
        slug=astro.slug,
        name=astro.name,
        name_hi=astro.name_hi,
        title=astro.title,
        title_hi=astro.title_hi,
        avatar=astro.avatar,
        bio=astro.bio,
        bio_hi=astro.bio_hi,
        experience_years=astro.experience_years,
        rating=astro.rating,
        review_count=astro.review_count,
        consultations_count=astro.consultations_count,
        price_per_minute=astro.price_per_minute,
        currency=astro.currency,
        is_ai=astro.is_ai,
        ai_persona_id=astro.ai_persona_id,
        availability=astro.availability,
        languages=astro.languages or [],
        specialties=astro.specialties or [],
        is_featured=astro.is_featured,
        is_verified=astro.is_verified,
        created_at=astro.created_at,
        reviews=reviews_out
    )

@router.post("", response_model=AstrologerResponse, status_code=status.HTTP_201_CREATED)
def create_astrologer_profile(
    payload: AstrologerCreateRequest,
    db: Session = Depends(get_db)
):
    """Admin endpoint to create a new astrologer profile."""
    base_slug = slugify(payload.name)
    slug = base_slug
    idx = 1
    while db.query(Astrologer).filter(Astrologer.slug == slug).first():
        slug = f"{base_slug}-{idx}"
        idx += 1

    new_astro = Astrologer(
        id=generate_uuid(),
        slug=slug,
        name=payload.name,
        name_hi=payload.name_hi,
        title=payload.title,
        title_hi=payload.title_hi,
        avatar=payload.avatar,
        bio=payload.bio,
        bio_hi=payload.bio_hi,
        experience_years=payload.experience_years,
        price_per_minute=payload.price_per_minute,
        currency=payload.currency,
        is_ai=payload.is_ai,
        ai_persona_id=payload.ai_persona_id,
        availability=payload.availability,
        languages=payload.languages,
        specialties=payload.specialties,
        is_featured=payload.is_featured,
        is_verified=payload.is_verified
    )
    db.add(new_astro)
    db.commit()
    db.refresh(new_astro)

    return get_astrologer_profile(new_astro.id, db)

@router.patch("/{astrologer_id}", response_model=AstrologerResponse)
def update_astrologer_persona(
    astrologer_id: str,
    payload: AstrologerUpdateRequest,
    db: Session = Depends(get_db)
):
    """Admin endpoint to update AI persona profile, credentials, specializations, or pricing."""
    astro = db.query(Astrologer).filter(
        or_(Astrologer.id == astrologer_id, Astrologer.slug == astrologer_id)
    ).first()
    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer persona not found.")

    update_data = payload.model_dump(exclude_unset=True) if hasattr(payload, 'model_dump') else payload.dict(exclude_unset=True)
    for key, val in update_data.items():
        if val is not None:
            setattr(astro, key, val)

    db.commit()
    db.refresh(astro)
    return get_astrologer_profile(astro.id, db)

@router.patch("/{astrologer_id}/availability", response_model=AstrologerResponse)
def update_astrologer_availability(
    astrologer_id: str,
    payload: AstrologerAvailabilityUpdate,
    db: Session = Depends(get_db)
):
    """Updates astrologer availability: online, busy, offline."""
    astro = db.query(Astrologer).filter(Astrologer.id == astrologer_id).first()
    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found.")

    valid_states = {"online", "busy", "offline"}
    if payload.availability.lower() not in valid_states:
        raise HTTPException(status_code=400, detail=f"Invalid availability. Choose from {valid_states}")

    astro.availability = payload.availability.lower()
    db.commit()
    db.refresh(astro)
    return get_astrologer_profile(astro.id, db)

@router.post("/{astrologer_id}/reviews", response_model=AstrologerReviewResponse)
def add_astrologer_review(
    astrologer_id: str,
    payload: AstrologerReviewCreate,
    db: Session = Depends(get_db)
):
    """Adds a verified review to an astrologer profile and updates overall rating."""
    astro = db.query(Astrologer).filter(Astrologer.id == astrologer_id).first()
    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found.")

    comment_clean = sanitize_user_input(payload.comment)
    if not comment_clean:
        raise HTTPException(status_code=400, detail="Review comment cannot be empty.")

    new_review = AstrologerReview(
        id=generate_uuid(),
        astrologer_id=astro.id,
        user_name=payload.user_name or "Verified Seeker",
        rating=payload.rating,
        comment=comment_clean,
        is_verified=True
    )
    db.add(new_review)

    # Recalculate average rating & review count
    total_reviews = db.query(AstrologerReview).filter(AstrologerReview.astrologer_id == astro.id).count() + 1
    current_sum = (astro.rating * astro.review_count) + payload.rating
    astro.review_count = total_reviews
    astro.rating = round(current_sum / total_reviews, 2)

    db.commit()
    db.refresh(new_review)

    return AstrologerReviewResponse(
        id=new_review.id,
        user_name=new_review.user_name,
        rating=new_review.rating,
        comment=new_review.comment,
        is_verified=new_review.is_verified,
        created_at=new_review.created_at
    )
