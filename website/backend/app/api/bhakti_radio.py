"""Bhajan Radio: bhajans played through YouTube's embedded player. We store only the video id plus who published it and
why it may be shown; nothing is downloaded. Admins add tracks, and each link is checked against YouTube's oEmbed service."""
import re
from typing import Optional
from urllib.parse import parse_qs, urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from packages.core.logging import logger
from packages.database.bhakti import BhajanFavourite, BhajanTrack, BhaktiAuditLog
from packages.database.models import User
from packages.database.session import get_db
from website.backend.app.api.auth import get_current_user_optional, get_current_user_required
from website.backend.app.api.mandir import require_admin

router = APIRouter(prefix="/bhakti/radio", tags=["Bhajan Radio"])

CATEGORIES = ["krishna", "shiva", "hanuman", "ram", "durga", "morning", "evening-aarti", "meditation", "instrumental"]
CATEGORY_LABELS = {"krishna": "Krishna Bhajan", "shiva": "Shiva Bhajan", "hanuman": "Hanuman Bhajan", "ram": "Ram Bhajan", "durga": "Durga Bhajan",
                   "morning": "Morning Bhajan", "evening-aarti": "Evening Aarti", "meditation": "Meditation Music", "instrumental": "Instrumental Devotional"}
ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
YT_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be"}


def parse_youtube_id(value: str) -> Optional[str]:
    """Accepts a bare 11-character id or a watch / youtu.be / embed / shorts URL on a YouTube host; anything else is rejected."""
    value = (value or "").strip()
    if ID_RE.match(value):
        return value
    try:
        u = urlparse(value)
    except ValueError:
        return None
    if u.scheme not in ("http", "https") or (u.hostname or "").lower() not in YT_HOSTS:
        return None
    if u.hostname.lower() == "youtu.be":
        cand = u.path.lstrip("/").split("/")[0]
    elif u.path == "/watch":
        cand = (parse_qs(u.query).get("v") or [""])[0]
    else:
        m = re.match(r"^/(?:embed|shorts|live|v)/([^/?]+)", u.path)
        cand = m.group(1) if m else ""
    return cand if ID_RE.match(cand) else None


def check_embeddable(video_id: str) -> Optional[bool]:
    """True/False when YouTube says so, None when it cannot be checked (network down). Embedding-disabled videos answer 401/403."""
    try:
        r = httpx.get("https://www.youtube.com/oembed", params={"url": f"https://www.youtube.com/watch?v={video_id}", "format": "json"}, timeout=5.0)
    except httpx.HTTPError:
        return None
    if r.status_code == 200:
        return True
    if r.status_code in (401, 403, 404):
        return False
    return None


class TrackIn(BaseModel):
    url: str = Field(..., min_length=11, max_length=300)
    title: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., pattern="^(" + "|".join(CATEGORIES) + ")$")
    channel: str = Field(..., min_length=1, max_length=200)
    rights_note: str = Field(..., min_length=3, max_length=300)
    published: bool = True


def _out(t: BhajanTrack, fav: bool = False) -> dict:
    return {"id": t.id, "youtube_id": t.youtube_id, "title": t.title, "category": t.category, "channel": t.channel, "is_favourite": fav}


@router.get("/categories")
def categories():
    return [{"slug": c, "label": CATEGORY_LABELS[c]} for c in CATEGORIES]


@router.get("/tracks")
def tracks(category: Optional[str] = Query(None, max_length=30), q: Optional[str] = Query(None, max_length=80), page_size: int = Query(100, ge=1, le=200),
           db: Session = Depends(get_db), user: Optional[User] = Depends(get_current_user_optional)):
    query = db.query(BhajanTrack).filter(BhajanTrack.published == True)  # noqa: E712
    if category:
        query = query.filter(BhajanTrack.category == category)
    if q and q.strip():
        query = query.filter(BhajanTrack.title.ilike(f"%{q.strip()}%"))
    rows = query.order_by(BhajanTrack.created_at.desc()).limit(page_size).all()
    favs = set()
    if user and rows:
        favs = {r[0] for r in db.query(BhajanFavourite.track_id).filter(BhajanFavourite.user_id == user.id, BhajanFavourite.track_id.in_([t.id for t in rows])).all()}
    return [_out(t, t.id in favs) for t in rows]


@router.get("/favourites")
def favourites(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    rows = (db.query(BhajanTrack).join(BhajanFavourite, BhajanFavourite.track_id == BhajanTrack.id)
            .filter(BhajanFavourite.user_id == user.id, BhajanTrack.published == True).order_by(BhajanFavourite.created_at.desc()).all())  # noqa: E712
    return [_out(t, True) for t in rows]


@router.put("/favourites/{track_id}")
def add_favourite(track_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    if not db.query(BhajanTrack.id).filter(BhajanTrack.id == track_id, BhajanTrack.published == True).first():  # noqa: E712
        raise HTTPException(status_code=404, detail="Track not found")
    if not db.query(BhajanFavourite.id).filter(BhajanFavourite.user_id == user.id, BhajanFavourite.track_id == track_id).first():
        db.add(BhajanFavourite(user_id=user.id, track_id=track_id))
        db.commit()
    return {"is_favourite": True}


@router.delete("/favourites/{track_id}")
def remove_favourite(track_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    db.query(BhajanFavourite).filter(BhajanFavourite.user_id == user.id, BhajanFavourite.track_id == track_id).delete()
    db.commit()
    return {"is_favourite": False}


@router.get("/admin/tracks")
def admin_tracks(db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    return [{**_out(t), "published": t.published, "rights_note": t.rights_note} for t in db.query(BhajanTrack).order_by(BhajanTrack.created_at.desc()).limit(500).all()]


@router.put("/admin/tracks")
def admin_add_track(payload: TrackIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    vid = parse_youtube_id(payload.url)
    if not vid:
        raise HTTPException(status_code=422, detail="That is not a valid YouTube link or video id")
    embeddable = check_embeddable(vid)
    if embeddable is False:
        raise HTTPException(status_code=422, detail="YouTube does not allow this video to be embedded (or it is private or removed)")
    t = db.query(BhajanTrack).filter(BhajanTrack.youtube_id == vid).first()
    created = t is None
    if created:
        t = BhajanTrack(youtube_id=vid, created_by=admin.id)
        db.add(t)
    t.title, t.category, t.channel, t.rights_note, t.published = payload.title.strip(), payload.category, payload.channel.strip(), payload.rights_note.strip(), payload.published
    db.flush()
    db.add(BhaktiAuditLog(actor_id=admin.id, action="create" if created else "update", entity="bhajan_track", entity_id=vid, detail={"category": t.category, "published": t.published}))
    db.commit()
    if embeddable is None:
        logger.warning(f"bhajan {vid} saved without an embeddability check (YouTube unreachable)")
    return {**_out(t), "published": t.published, "embed_checked": embeddable is True}


@router.delete("/admin/tracks/{track_id}")
def admin_delete_track(track_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    t = db.query(BhajanTrack).filter(BhajanTrack.id == track_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Track not found")
    db.query(BhajanFavourite).filter(BhajanFavourite.track_id == t.id).delete()
    db.add(BhaktiAuditLog(actor_id=admin.id, action="delete", entity="bhajan_track", entity_id=t.youtube_id))
    db.delete(t)
    db.commit()
    return {"deleted": track_id}
