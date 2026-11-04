"""Shankaracharya & Vedanta: sourced articles and Q&A, the four Peethas (traditional associations only), and the admin tools."""
import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from packages.database.bhakti import BhaktiAuditLog
from packages.database.bhakti_articles import BhaktiArticle
from packages.database.models import User
from packages.database.session import get_db
from website.backend.app import bhakti_seed_vedanta as seed
from website.backend.app.api.mandir import require_admin

router = APIRouter(prefix="/bhakti/vedanta", tags=["Shankaracharya & Vedanta"])
SLUG_RE = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def seed_articles_if_missing(db: Session) -> None:
    """Adds starter articles that are absent; existing rows (possibly edited by an admin) are left alone."""
    have = {s for (s,) in db.query(BhaktiArticle.slug).all()}
    for slug, section, kind, en, hi, order, summary, body, sources in seed.ARTICLES:
        if slug not in have:
            db.add(BhaktiArticle(slug=slug, section=section, kind=kind, title_en=en, title_hi=hi, sort_order=order, summary=summary, body=body,
                                 sources=sources, reviewed_on=seed.REVIEWED_ON, is_verified=False, published=True))
    db.commit()


class SourceIn(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    url: Optional[str] = Field(None, max_length=300)
    note: Optional[str] = Field(None, max_length=300)

    @field_validator("url")
    @classmethod
    def _https(cls, v):
        v = (v or "").strip()
        if v and not v.lower().startswith("https://"):
            raise ValueError("Source links must start with https://")
        return v or None


class ArticleIn(BaseModel):
    slug: str = Field(..., max_length=100, pattern=SLUG_RE)
    section: str = Field(..., pattern="^(shankaracharya|vedanta)$")
    kind: str = Field("article", pattern="^(article|qa)$")
    title_en: str = Field(..., min_length=1, max_length=200)
    title_hi: str = Field("", max_length=200)
    summary: str = Field("", max_length=500)
    body: str = Field("", max_length=40000)
    sources: List[SourceIn] = Field(default_factory=list, max_length=20)
    reviewed_on: str = Field("", max_length=10)
    sort_order: int = Field(0, ge=0, le=100000)
    is_verified: bool = False
    published: bool = False

    @field_validator("reviewed_on")
    @classmethod
    def _date(cls, v):
        if v and not DATE_RE.match(v):
            raise ValueError("reviewed_on must be YYYY-MM-DD")
        return v


def _out(a: BhaktiArticle, full: bool = True) -> dict:
    d = {"slug": a.slug, "section": a.section, "kind": a.kind, "title_en": a.title_en, "title_hi": a.title_hi, "summary": a.summary,
         "reviewed_on": a.reviewed_on, "is_verified": a.is_verified, "sort_order": a.sort_order}
    if full:
        d.update({"body": a.body, "sources": a.sources or [], "published": a.published})
    return d


@router.get("/peethas")
def peethas():
    return {"peethas": seed.PEETHAS, "note": seed.PEETHA_NOTE}


@router.get("/articles")
def articles(section: str = Query(..., pattern="^(shankaracharya|vedanta)$"), kind: Optional[str] = Query(None, pattern="^(article|qa)$"),
             db: Session = Depends(get_db)):
    q = db.query(BhaktiArticle).filter(BhaktiArticle.published == True, BhaktiArticle.section == section)  # noqa: E712
    if kind:
        q = q.filter(BhaktiArticle.kind == kind)
    return [_out(a) for a in q.order_by(BhaktiArticle.sort_order, BhaktiArticle.title_en).all()]


@router.get("/admin/articles")
def admin_articles(db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    return [_out(a) for a in db.query(BhaktiArticle).order_by(BhaktiArticle.section, BhaktiArticle.sort_order, BhaktiArticle.title_en).all()]


@router.put("/admin/article")
def admin_upsert(payload: ArticleIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if payload.published and (not payload.body.strip() or not payload.sources or not payload.reviewed_on):
        raise HTTPException(status_code=422, detail="To publish, the text, at least one source and the review date are required")
    a = db.query(BhaktiArticle).filter(BhaktiArticle.slug == payload.slug).first()
    created = a is None
    if created:
        a = BhaktiArticle(slug=payload.slug)
        db.add(a)
    for f in ("section", "kind", "title_en", "title_hi", "summary", "body", "reviewed_on", "sort_order", "is_verified", "published"):
        setattr(a, f, getattr(payload, f))
    a.sources = [s.model_dump() for s in payload.sources]
    db.flush()
    db.add(BhaktiAuditLog(actor_id=admin.id, action="create" if created else "update", entity="article", entity_id=a.slug, detail={"published": a.published}))
    db.commit()
    return _out(a)


@router.delete("/admin/article/{slug}")
def admin_delete(slug: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    a = db.query(BhaktiArticle).filter(BhaktiArticle.slug == slug).first()
    if not a:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(a)
    db.add(BhaktiAuditLog(actor_id=admin.id, action="delete", entity="article", entity_id=slug))
    db.commit()
    return {"deleted": slug}
