"""Bhakti library: published aarti/chalisa/stotra, favourites, and the admin tools (content upsert, audio upload, audit)."""
import re
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from packages.core.logging import logger
from packages.database.bhakti import BhaktiAudio, BhaktiAuditLog, BhaktiContent, BhaktiDeity, BhaktiFavourite
from packages.database.models import User, generate_uuid
from packages.database.session import get_db
from website.backend.app.api.auth import get_current_user_optional, get_current_user_required
from website.backend.app.api.mandir import require_admin

router = APIRouter(prefix="/bhakti", tags=["Bhakti Library"])

AUDIO_DIR = Path(__file__).resolve().parents[4] / "storage" / "uploads" / "bhakti-audio"
MAX_AUDIO_BYTES = 25 * 1024 * 1024
KINDS = ("aarti", "chalisa", "stotra")
SLUG_RE = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


def _audio_kind(head: bytes) -> Optional[str]:
    """Identifies the real container from its first bytes, so a renamed file cannot slip through on its extension."""
    if head[:3] == b"ID3" or (len(head) > 1 and head[0] == 0xFF and (head[1] & 0xE0) == 0xE0):
        return "mp3"
    if head[:4] == b"OggS":
        return "ogg"
    if head[4:8] == b"ftyp":
        return "m4a"
    if head[:4] == b"RIFF" and head[8:12] == b"WAVE":
        return "wav"
    return None


class ContentIn(BaseModel):
    slug: str = Field(..., max_length=100, pattern=SLUG_RE)
    kind: str = Field(..., pattern="^(aarti|chalisa|stotra)$")
    deity: Optional[str] = Field(None, max_length=60)
    title_hi: str = Field(..., min_length=1, max_length=200)
    title_en: str = Field(..., min_length=1, max_length=200)
    body_hi: str = Field("", max_length=60000)
    body_roman: str = Field("", max_length=60000)
    meaning_hi: str = Field("", max_length=60000)
    meaning_en: str = Field("", max_length=60000)
    source: str = Field("", max_length=300)
    license: str = Field("", max_length=120)
    is_verified: bool = False
    published: bool = False


def _audit(db: Session, actor: User, action: str, entity: str, entity_id: str, detail: Optional[dict] = None) -> None:
    db.add(BhaktiAuditLog(actor_id=actor.id, action=action, entity=entity, entity_id=entity_id, detail=detail))


def _deity_map(db: Session) -> dict:
    return {d.id: d for d in db.query(BhaktiDeity).all()}


def _brief(c: BhaktiContent, deities: dict) -> dict:
    d = deities.get(c.deity_id)
    return {"id": c.id, "slug": c.slug, "kind": c.kind, "title_hi": c.title_hi, "title_en": c.title_en, "is_verified": c.is_verified,
            "deity": {"slug": d.slug, "name_en": d.name_en, "name_hi": d.name_hi} if d else None}


def _full(db: Session, c: BhaktiContent, user: Optional[User], admin: bool = False) -> dict:
    audio_q = db.query(BhaktiAudio).filter(BhaktiAudio.content_id == c.id)
    if not admin:
        audio_q = audio_q.filter(BhaktiAudio.published == True)  # noqa: E712
    fav = bool(user and db.query(BhaktiFavourite.id).filter(BhaktiFavourite.user_id == user.id, BhaktiFavourite.content_id == c.id).first())
    return {**_brief(c, _deity_map(db)), "body_hi": c.body_hi, "body_roman": c.body_roman, "meaning_hi": c.meaning_hi, "meaning_en": c.meaning_en,
            "source": c.source, "license": c.license, "published": c.published,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None, "is_favourite": fav,
            "audio": [{"id": a.id, "title": a.title, "url": a.url, "source": a.source, "license": a.license} for a in audio_q.all()]}


@router.get("/content")
def list_content(kind: Optional[str] = Query(None, pattern="^(aarti|chalisa|stotra)$"), deity: Optional[str] = Query(None, max_length=60),
                 q: Optional[str] = Query(None, max_length=80), page: int = Query(1, ge=1), page_size: int = Query(24, ge=1, le=100),
                 db: Session = Depends(get_db)):
    query = db.query(BhaktiContent).filter(BhaktiContent.published == True)  # noqa: E712
    if kind:
        query = query.filter(BhaktiContent.kind == kind)
    if deity:
        d = db.query(BhaktiDeity).filter(BhaktiDeity.slug == deity).first()
        query = query.filter(BhaktiContent.deity_id == (d.id if d else "-"))
    if q and q.strip():
        like = f"%{q.strip()}%"
        query = query.filter(or_(BhaktiContent.title_hi.ilike(like), BhaktiContent.title_en.ilike(like), BhaktiContent.body_hi.ilike(like), BhaktiContent.body_roman.ilike(like)))
    total = query.count()
    rows = query.order_by(BhaktiContent.title_en).offset((page - 1) * page_size).limit(page_size).all()
    deities = _deity_map(db)
    return {"total": total, "page": page, "page_size": page_size, "items": [_brief(c, deities) for c in rows]}


@router.get("/content/{slug}")
def get_content(slug: str, db: Session = Depends(get_db), user: Optional[User] = Depends(get_current_user_optional)):
    c = db.query(BhaktiContent).filter(BhaktiContent.slug == slug, BhaktiContent.published == True).first()  # noqa: E712
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
    return _full(db, c, user)


@router.get("/favourites")
def list_favourites(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    rows = (db.query(BhaktiContent).join(BhaktiFavourite, BhaktiFavourite.content_id == BhaktiContent.id)
            .filter(BhaktiFavourite.user_id == user.id, BhaktiContent.published == True).order_by(BhaktiFavourite.created_at.desc()).all())  # noqa: E712
    deities = _deity_map(db)
    return [_brief(c, deities) for c in rows]


@router.put("/favourites/{content_id}")
def add_favourite(content_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    if not db.query(BhaktiContent.id).filter(BhaktiContent.id == content_id, BhaktiContent.published == True).first():  # noqa: E712
        raise HTTPException(status_code=404, detail="Content not found")
    if not db.query(BhaktiFavourite.id).filter(BhaktiFavourite.user_id == user.id, BhaktiFavourite.content_id == content_id).first():
        db.add(BhaktiFavourite(user_id=user.id, content_id=content_id))
        db.commit()
    return {"is_favourite": True}


@router.delete("/favourites/{content_id}")
def remove_favourite(content_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    db.query(BhaktiFavourite).filter(BhaktiFavourite.user_id == user.id, BhaktiFavourite.content_id == content_id).delete()
    db.commit()
    return {"is_favourite": False}


# ---------------- admin ----------------
@router.get("/admin/content")
def admin_list_content(q: Optional[str] = Query(None, max_length=80), db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    query = db.query(BhaktiContent)
    if q and q.strip():
        query = query.filter(or_(BhaktiContent.title_en.ilike(f"%{q.strip()}%"), BhaktiContent.slug.ilike(f"%{q.strip()}%")))
    deities = _deity_map(db)
    return [{**_brief(c, deities), "published": c.published, "source": c.source, "license": c.license} for c in query.order_by(BhaktiContent.updated_at.desc()).limit(200).all()]


@router.get("/admin/content/{slug}")
def admin_get_content(slug: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    c = db.query(BhaktiContent).filter(BhaktiContent.slug == slug).first()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
    return _full(db, c, admin, admin=True)


@router.put("/admin/content")
def admin_upsert_content(payload: ContentIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Create or update by slug. Publishing needs a source and licence on record, so nothing unattributed goes live."""
    if payload.published and (not payload.source.strip() or not payload.license.strip() or not payload.body_hi.strip()):
        raise HTTPException(status_code=422, detail="To publish, the text, its source and its licence are required")
    deity_id = None
    if payload.deity:
        d = db.query(BhaktiDeity).filter(BhaktiDeity.slug == payload.deity).first()
        if not d:
            raise HTTPException(status_code=422, detail="Unknown deity")
        deity_id = d.id
    c = db.query(BhaktiContent).filter(BhaktiContent.slug == payload.slug).first()
    created = c is None
    if created:
        c = BhaktiContent(slug=payload.slug)
        db.add(c)
    for f in ("kind", "title_hi", "title_en", "body_hi", "body_roman", "meaning_hi", "meaning_en", "source", "license", "is_verified", "published"):
        setattr(c, f, getattr(payload, f))
    c.deity_id = deity_id
    db.flush()
    _audit(db, admin, "create" if created else "update", "content", c.slug, {"published": c.published, "is_verified": c.is_verified})
    db.commit()
    return _full(db, c, admin, admin=True)


@router.delete("/admin/content/{slug}")
def admin_delete_content(slug: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    c = db.query(BhaktiContent).filter(BhaktiContent.slug == slug).first()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
    db.query(BhaktiFavourite).filter(BhaktiFavourite.content_id == c.id).delete()
    db.query(BhaktiAudio).filter(BhaktiAudio.content_id == c.id).delete()
    db.delete(c)
    _audit(db, admin, "delete", "content", slug)
    db.commit()
    return {"deleted": slug}


@router.post("/admin/audio", status_code=201)
async def admin_upload_audio(content_slug: str = Form(...), title: str = Form(..., max_length=200), source: str = Form(..., max_length=300),
                             license: str = Form(..., max_length=120), file: UploadFile = File(...),
                             db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Stores an audio file only when the uploader states its source and licence; the real file type is checked, not the name."""
    if not source.strip() or not license.strip() or not title.strip():
        raise HTTPException(status_code=422, detail="Title, source and licence are required")
    c = db.query(BhaktiContent).filter(BhaktiContent.slug == content_slug).first()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
    data = await file.read(MAX_AUDIO_BYTES + 1)
    if len(data) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio must be 25 MB or smaller")
    kind = _audio_kind(data[:16])
    if not kind:
        raise HTTPException(status_code=400, detail="Upload an MP3, OGG, M4A or WAV file")
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{generate_uuid()}.{kind}"
    (AUDIO_DIR / name).write_bytes(data)
    a = BhaktiAudio(content_id=c.id, title=title.strip(), url=f"/uploads/bhakti-audio/{name}", source=source.strip(), license=license.strip(), uploaded_by=admin.id)
    db.add(a)
    db.flush()
    _audit(db, admin, "upload", "audio", a.id, {"content": c.slug, "license": a.license})
    db.commit()
    logger.info(f"bhakti audio uploaded for {c.slug} by {admin.id}")
    return {"id": a.id, "url": a.url}


@router.delete("/admin/audio/{audio_id}")
def admin_delete_audio(audio_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    a = db.query(BhaktiAudio).filter(BhaktiAudio.id == audio_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Audio not found")
    (AUDIO_DIR / Path(a.url).name).unlink(missing_ok=True)
    db.delete(a)
    _audit(db, admin, "delete", "audio", audio_id)
    db.commit()
    return {"deleted": audio_id}


@router.get("/admin/audit")
def admin_audit(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    rows = db.query(BhaktiAuditLog).order_by(BhaktiAuditLog.created_at.desc()).limit(limit).all()
    return [{"at": r.created_at.isoformat(), "actor_id": r.actor_id, "action": r.action, "entity": r.entity, "entity_id": r.entity_id, "detail": r.detail} for r in rows]
