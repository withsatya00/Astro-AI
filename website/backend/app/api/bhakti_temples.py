"""Mandir Darshan: temple pages. Timings are never invented; only an admin-entered note with a source link is shown."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import or_
from sqlalchemy.orm import Session

from packages.database.bhakti import BhaktiAuditLog, BhaktiTemple
from packages.database.models import User
from packages.database.session import get_db
from website.backend.app import bhakti_seed
from website.backend.app.api.mandir import require_admin

router = APIRouter(prefix="/bhakti/temples", tags=["Mandir Darshan"])
SLUG_RE = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


def seed_temples_if_missing(db: Session) -> None:
    """Adds starter temples that are absent; existing rows (possibly edited by an admin) are left alone."""
    have = {s for (s,) in db.query(BhaktiTemple.slug).all()}
    for slug, en, hi, city, state, deity, summary, signif, festivals, url in bhakti_seed.TEMPLES:
        if slug not in have:
            db.add(BhaktiTemple(slug=slug, name_en=en, name_hi=hi, city=city, state=state, deity=deity, summary=summary, significance=signif,
                                festivals=festivals, official_url=url, source=bhakti_seed.TEMPLE_SOURCE, is_verified=False, published=True))
    db.commit()


def _https_or_none(v: Optional[str]) -> Optional[str]:
    v = (v or "").strip()
    if not v:
        return None
    if not v.lower().startswith("https://"):
        raise ValueError("Links must start with https://")
    return v


class TempleIn(BaseModel):
    slug: str = Field(..., max_length=100, pattern=SLUG_RE)
    name_en: str = Field(..., min_length=1, max_length=200)
    name_hi: str = Field(..., min_length=1, max_length=200)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    deity: str = Field("", max_length=200)
    summary: str = Field("", max_length=8000)
    significance: str = Field("", max_length=4000)
    festivals: List[str] = Field(default_factory=list, max_length=20)
    official_url: Optional[str] = Field(None, max_length=300)
    virtual_darshan_url: Optional[str] = Field(None, max_length=300)
    image_url: Optional[str] = Field(None, max_length=300)
    image_credit: Optional[str] = Field(None, max_length=300)
    timings_note: Optional[str] = Field(None, max_length=500)
    timings_source_url: Optional[str] = Field(None, max_length=300)
    source: str = Field("", max_length=300)
    is_verified: bool = False
    published: bool = False

    _urls = field_validator("official_url", "virtual_darshan_url", "image_url", "timings_source_url")(lambda v: _https_or_none(v))


def _brief(t: BhaktiTemple) -> dict:
    return {"slug": t.slug, "name_en": t.name_en, "name_hi": t.name_hi, "city": t.city, "state": t.state, "deity": t.deity, "image_url": t.image_url, "is_verified": t.is_verified}


def _full(t: BhaktiTemple, nearby: list) -> dict:
    return {**_brief(t), "summary": t.summary, "significance": t.significance, "festivals": t.festivals or [], "official_url": t.official_url,
            "virtual_darshan_url": t.virtual_darshan_url, "image_credit": t.image_credit, "timings_note": t.timings_note, "timings_source_url": t.timings_source_url,
            "source": t.source, "published": t.published, "nearby": [_brief(n) for n in nearby]}


def _nearby(db: Session, t: BhaktiTemple, limit: int = 4) -> list:
    """Other published temples in the same city first, then the same state. Distance is not guessed beyond that."""
    base = db.query(BhaktiTemple).filter(BhaktiTemple.published == True, BhaktiTemple.id != t.id)  # noqa: E712
    same_city = base.filter(BhaktiTemple.city == t.city).order_by(BhaktiTemple.name_en).limit(limit).all()
    if len(same_city) >= limit:
        return same_city
    ids = {x.id for x in same_city}
    more = [x for x in base.filter(BhaktiTemple.state == t.state).order_by(BhaktiTemple.name_en).all() if x.id not in ids]
    return same_city + more[: limit - len(same_city)]


@router.get("")
def list_temples(state: Optional[str] = Query(None, max_length=100), q: Optional[str] = Query(None, max_length=80), db: Session = Depends(get_db)):
    query = db.query(BhaktiTemple).filter(BhaktiTemple.published == True)  # noqa: E712
    if state:
        query = query.filter(BhaktiTemple.state == state)
    if q and q.strip():
        like = f"%{q.strip()}%"
        query = query.filter(or_(BhaktiTemple.name_en.ilike(like), BhaktiTemple.name_hi.ilike(like), BhaktiTemple.city.ilike(like), BhaktiTemple.deity.ilike(like)))
    return [_brief(t) for t in query.order_by(BhaktiTemple.name_en).limit(200).all()]


@router.get("/states")
def states(db: Session = Depends(get_db)):
    return sorted({s for (s,) in db.query(BhaktiTemple.state).filter(BhaktiTemple.published == True).distinct().all()})  # noqa: E712


@router.get("/admin/list")
def admin_list(db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    """Every temple including drafts, with the full record, so the admin editor can open any of them."""
    return [_full(t, []) for t in db.query(BhaktiTemple).order_by(BhaktiTemple.name_en).all()]


@router.get("/{slug}")
def get_temple(slug: str, db: Session = Depends(get_db)):
    t = db.query(BhaktiTemple).filter(BhaktiTemple.slug == slug, BhaktiTemple.published == True).first()  # noqa: E712
    if not t:
        raise HTTPException(status_code=404, detail="Temple not found")
    return _full(t, _nearby(db, t))


@router.put("/admin/temple")
def admin_upsert(payload: TempleIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if payload.published and (not payload.summary.strip() or not payload.source.strip()):
        raise HTTPException(status_code=422, detail="To publish, the history text and its source are required")
    if payload.timings_note and not payload.timings_source_url:
        raise HTTPException(status_code=422, detail="Timings need a source link (the temple's official page)")
    t = db.query(BhaktiTemple).filter(BhaktiTemple.slug == payload.slug).first()
    created = t is None
    if created:
        t = BhaktiTemple(slug=payload.slug)
        db.add(t)
    for f in ("name_en", "name_hi", "city", "state", "deity", "summary", "significance", "festivals", "official_url", "virtual_darshan_url", "image_url",
              "image_credit", "timings_note", "timings_source_url", "source", "is_verified", "published"):
        setattr(t, f, getattr(payload, f))
    db.flush()
    db.add(BhaktiAuditLog(actor_id=admin.id, action="create" if created else "update", entity="temple", entity_id=t.slug, detail={"published": t.published}))
    db.commit()
    return _full(t, _nearby(db, t))


@router.delete("/admin/temple/{slug}")
def admin_delete(slug: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    t = db.query(BhaktiTemple).filter(BhaktiTemple.slug == slug).first()
    if not t:
        raise HTTPException(status_code=404, detail="Temple not found")
    db.delete(t)
    db.add(BhaktiAuditLog(actor_id=admin.id, action="delete", entity="temple", entity_id=slug))
    db.commit()
    return {"deleted": slug}
