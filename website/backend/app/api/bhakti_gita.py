"""Bhagavad Gita: chapters, published verses, search, daily verse, bookmarks, reading progress, and the admin upsert."""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from packages.database.bhakti import BhaktiAuditLog, BhaktiContent, BhaktiDeity, GitaBookmark, GitaChapter, GitaRead, GitaVerse
from packages.database.models import User
from packages.database.session import get_db
from website.backend.app import bhakti_seed, bhakti_seed_library
from website.backend.app.api.auth import get_current_user_optional, get_current_user_required
from website.backend.app.api.mandir import require_admin

router = APIRouter(prefix="/bhakti/gita", tags=["Bhagavad Gita"])


def seed_gita_and_library_if_missing(db: Session) -> None:
    """Adds starter chapters, verses and the Hanuman Chalisa when absent; existing (possibly admin-edited) rows are left alone."""
    have = {c.number for c in db.query(GitaChapter.number).all()}
    for n, sa, hi, en, count, summary in bhakti_seed.GITA_CHAPTERS:
        if n not in have:
            db.add(GitaChapter(number=n, name_sa=sa, name_hi=hi, name_en=en, verse_count=count, summary_en=summary))
    db.flush()
    have_v = {(v.chapter, v.verse) for v in db.query(GitaVerse.chapter, GitaVerse.verse).all()}
    for ch, vs, sa, tr, mhi, men in bhakti_seed.GITA_VERSES:
        if (ch, vs) not in have_v:
            db.add(GitaVerse(chapter=ch, verse=vs, text_sa=sa, transliteration=tr, meaning_hi=mhi, meaning_en=men, source=bhakti_seed.GITA_SOURCE,
                             license="Public domain (original Sanskrit); meaning is our own wording", is_verified=False, published=True))
    chalisa = dict(bhakti_seed.HANUMAN_CHALISA, body_roman=bhakti_seed_library.CHALISA_ROMAN)
    for seed in (chalisa, bhakti_seed_library.JAGDISH_AARTI):
        row = db.query(BhaktiContent).filter(BhaktiContent.slug == seed["slug"]).first()
        if not row:
            d = db.query(BhaktiDeity).filter(BhaktiDeity.slug == seed["deity"]).first()
            db.add(BhaktiContent(slug=seed["slug"], kind=seed["kind"], deity_id=d.id if d else None, title_hi=seed["title_hi"], title_en=seed["title_en"],
                                 body_hi=seed["body_hi"], body_roman=seed.get("body_roman", ""), meaning_hi=seed["meaning_hi"], meaning_en=seed["meaning_en"],
                                 source=seed["source"], license=seed["license"], is_verified=False, published=True))
        elif not (row.body_roman or "").strip() and seed.get("body_roman"):
            row.body_roman = seed["body_roman"]  # fill a missing Roman text; anything an admin has already written is left alone
    db.commit()


class VerseIn(BaseModel):
    chapter: int = Field(..., ge=1, le=18)
    verse: int = Field(..., ge=1, le=100)
    text_sa: str = Field(..., min_length=1, max_length=4000)
    transliteration: str = Field("", max_length=4000)
    meaning_hi: str = Field("", max_length=8000)
    meaning_en: str = Field("", max_length=8000)
    source: str = Field("", max_length=300)
    license: str = Field("", max_length=160)
    is_verified: bool = False
    published: bool = False


def _verse(v: GitaVerse, extra: Optional[dict] = None) -> dict:
    out = {"id": v.id, "chapter": v.chapter, "verse": v.verse, "text_sa": v.text_sa, "transliteration": v.transliteration, "meaning_hi": v.meaning_hi,
           "meaning_en": v.meaning_en, "source": v.source, "license": v.license, "is_verified": v.is_verified}
    out.update(extra or {})
    return out


def _flags(db: Session, user: Optional[User], verse_ids: list) -> tuple:
    if not user or not verse_ids:
        return set(), set()
    b = {r[0] for r in db.query(GitaBookmark.verse_id).filter(GitaBookmark.user_id == user.id, GitaBookmark.verse_id.in_(verse_ids)).all()}
    r = {r[0] for r in db.query(GitaRead.verse_id).filter(GitaRead.user_id == user.id, GitaRead.verse_id.in_(verse_ids)).all()}
    return b, r


@router.get("/chapters")
def chapters(db: Session = Depends(get_db), user: Optional[User] = Depends(get_current_user_optional)):
    avail = dict(db.query(GitaVerse.chapter, func.count(GitaVerse.id)).filter(GitaVerse.published == True).group_by(GitaVerse.chapter).all())  # noqa: E712
    read = {}
    if user:
        read = dict(db.query(GitaVerse.chapter, func.count(GitaRead.id)).join(GitaRead, GitaRead.verse_id == GitaVerse.id)
                    .filter(GitaRead.user_id == user.id, GitaVerse.published == True).group_by(GitaVerse.chapter).all())  # noqa: E712
    return [{"number": c.number, "name_sa": c.name_sa, "name_hi": c.name_hi, "name_en": c.name_en, "verse_count": c.verse_count, "summary_en": c.summary_en,
             "available": avail.get(c.number, 0), "read": read.get(c.number, 0)} for c in db.query(GitaChapter).order_by(GitaChapter.number).all()]


@router.get("/chapters/{number}")
def chapter(number: int, db: Session = Depends(get_db), user: Optional[User] = Depends(get_current_user_optional)):
    c = db.query(GitaChapter).filter(GitaChapter.number == number).first()
    if not c:
        raise HTTPException(status_code=404, detail="Chapter not found")
    rows = db.query(GitaVerse).filter(GitaVerse.chapter == number, GitaVerse.published == True).order_by(GitaVerse.verse).all()  # noqa: E712
    marked, read = _flags(db, user, [v.id for v in rows])
    return {"number": c.number, "name_sa": c.name_sa, "name_hi": c.name_hi, "name_en": c.name_en, "verse_count": c.verse_count, "summary_en": c.summary_en,
            "verses": [_verse(v, {"bookmarked": v.id in marked, "read": v.id in read}) for v in rows]}


@router.get("/search")
def search(q: str = Query(..., min_length=2, max_length=80), db: Session = Depends(get_db)):
    like = f"%{q.strip()}%"
    rows = (db.query(GitaVerse).filter(GitaVerse.published == True, or_(GitaVerse.text_sa.ilike(like), GitaVerse.transliteration.ilike(like),  # noqa: E712
                                                                        GitaVerse.meaning_hi.ilike(like), GitaVerse.meaning_en.ilike(like)))
            .order_by(GitaVerse.chapter, GitaVerse.verse).limit(50).all())
    return [_verse(v) for v in rows]


@router.get("/daily")
def daily(db: Session = Depends(get_db)):
    """One published verse per calendar day (IST-independent: UTC date), the same for everyone."""
    rows = db.query(GitaVerse).filter(GitaVerse.published == True).order_by(GitaVerse.chapter, GitaVerse.verse).all()  # noqa: E712
    if not rows:
        return {"verse": None}
    return {"verse": _verse(rows[datetime.now(timezone.utc).toordinal() % len(rows)])}


@router.get("/bookmarks")
def bookmarks(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    rows = (db.query(GitaVerse).join(GitaBookmark, GitaBookmark.verse_id == GitaVerse.id)
            .filter(GitaBookmark.user_id == user.id, GitaVerse.published == True).order_by(GitaBookmark.created_at.desc()).all())  # noqa: E712
    return [_verse(v, {"bookmarked": True}) for v in rows]


def _published_verse(db: Session, verse_id: str) -> GitaVerse:
    v = db.query(GitaVerse).filter(GitaVerse.id == verse_id, GitaVerse.published == True).first()  # noqa: E712
    if not v:
        raise HTTPException(status_code=404, detail="Verse not found")
    return v


@router.put("/bookmarks/{verse_id}")
def add_bookmark(verse_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    _published_verse(db, verse_id)
    if not db.query(GitaBookmark.id).filter(GitaBookmark.user_id == user.id, GitaBookmark.verse_id == verse_id).first():
        db.add(GitaBookmark(user_id=user.id, verse_id=verse_id))
        db.commit()
    return {"bookmarked": True}


@router.delete("/bookmarks/{verse_id}")
def remove_bookmark(verse_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    db.query(GitaBookmark).filter(GitaBookmark.user_id == user.id, GitaBookmark.verse_id == verse_id).delete()
    db.commit()
    return {"bookmarked": False}


@router.put("/read/{verse_id}")
def mark_read(verse_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    v = _published_verse(db, verse_id)
    if not db.query(GitaRead.id).filter(GitaRead.user_id == user.id, GitaRead.verse_id == v.id).first():
        db.add(GitaRead(user_id=user.id, verse_id=v.id))
        db.commit()
    return {"read": True}


@router.delete("/read/{verse_id}")
def unmark_read(verse_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    db.query(GitaRead).filter(GitaRead.user_id == user.id, GitaRead.verse_id == verse_id).delete()
    db.commit()
    return {"read": False}


@router.get("/admin/verses")
def admin_verses(chapter: Optional[int] = Query(None, ge=1, le=18), db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    q = db.query(GitaVerse)
    if chapter:
        q = q.filter(GitaVerse.chapter == chapter)
    return [_verse(v, {"published": v.published}) for v in q.order_by(GitaVerse.chapter, GitaVerse.verse).all()]


@router.put("/admin/verse")
def admin_upsert_verse(payload: VerseIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if payload.published and (not payload.source.strip() or not payload.license.strip()):
        raise HTTPException(status_code=422, detail="To publish, the source and licence are required")
    ch = db.query(GitaChapter).filter(GitaChapter.number == payload.chapter).first()
    if not ch or payload.verse > ch.verse_count:
        raise HTTPException(status_code=422, detail="That verse does not exist in this chapter")
    v = db.query(GitaVerse).filter(GitaVerse.chapter == payload.chapter, GitaVerse.verse == payload.verse).first()
    created = v is None
    if created:
        v = GitaVerse(chapter=payload.chapter, verse=payload.verse)
        db.add(v)
    for f in ("text_sa", "transliteration", "meaning_hi", "meaning_en", "source", "license", "is_verified", "published"):
        setattr(v, f, getattr(payload, f))
    db.flush()
    db.add(BhaktiAuditLog(actor_id=admin.id, action="create" if created else "update", entity="gita_verse", entity_id=f"{v.chapter}.{v.verse}",
                          detail={"published": v.published, "is_verified": v.is_verified}))
    db.commit()
    return _verse(v)
