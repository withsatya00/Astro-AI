"""Product analytics: a small public endpoint the site calls, plus an admin summary.

Nothing here identifies a person: no IP address, no account id, no free text. Event names come from a fixed list and property values are
short scalars, so the table cannot be used to store anything else. Money events (recharge, booking) are recorded by the server itself."""
import time
from collections import defaultdict, deque
from datetime import timedelta
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from packages.database.analytics import SiteEvent, record_event
from packages.database.models import utc_now
from packages.database.session import get_db
from website.backend.app.api.mandir import require_admin

router = APIRouter(prefix="/events", tags=["Analytics"])

EVENT_NAMES = {
    "page_view", "cta_click", "bhakti_ritual_step", "bhakti_text_open",
    "wallet_recharged", "consultation_booked", "sign_up",
}
SERVER_ONLY = {"wallet_recharged", "consultation_booked", "sign_up"}  # the browser may not report these; they are recorded where the money moves
MAX_PROPS, MAX_VALUE = 6, 80
LIMIT_PER_MINUTE = 120
_hits: Dict[str, deque] = defaultdict(deque)


class EventIn(BaseModel):
    name: str = Field(..., max_length=40)
    path: str = Field("", max_length=200)
    session_id: str = Field("", max_length=40, pattern=r"^[A-Za-z0-9_-]*$")
    props: Dict[str, Any] = Field(default_factory=dict)


def _clean_props(props: Dict[str, Any]) -> Dict[str, Any]:
    if len(props) > MAX_PROPS:
        raise HTTPException(status_code=422, detail="Too many properties")
    out = {}
    for k, v in props.items():
        if not (isinstance(k, str) and 0 < len(k) <= 30 and k.replace("_", "").isalnum()):
            raise HTTPException(status_code=422, detail="Invalid property name")
        if isinstance(v, bool) or isinstance(v, (int, float)):
            out[k] = v
        elif isinstance(v, str) and len(v) <= MAX_VALUE:
            out[k] = v
        else:
            raise HTTPException(status_code=422, detail="Property values must be short text or numbers")
    return out


def _allowed(client: str) -> bool:
    now = time.time()
    q = _hits[client]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= LIMIT_PER_MINUTE:
        return False
    q.append(now)
    return True


@router.post("", status_code=204)
def collect(payload: EventIn, request: Request, db: Session = Depends(get_db)):
    if payload.name not in EVENT_NAMES or payload.name in SERVER_ONLY:
        raise HTTPException(status_code=422, detail="Unknown event")
    if not _allowed(request.client.host if request.client else "unknown"):
        raise HTTPException(status_code=429, detail="Too many events")
    record_event(db, payload.name, _clean_props(payload.props), payload.path, payload.session_id)
    db.commit()
    return Response(status_code=204)


@router.get("/admin/summary")
def summary(days: int = Query(30, ge=1, le=365), db: Session = Depends(get_db), _admin=Depends(require_admin)):
    since = utc_now() - timedelta(days=days)
    base = db.query(SiteEvent).filter(SiteEvent.created_at >= since)
    by_name = dict(base.with_entities(SiteEvent.name, func.count(SiteEvent.id)).group_by(SiteEvent.name).all())
    top_pages = (base.filter(SiteEvent.name == "page_view").with_entities(SiteEvent.path, func.count(SiteEvent.id))
                 .group_by(SiteEvent.path).order_by(func.count(SiteEvent.id).desc()).limit(15).all())
    visitors = base.with_entities(func.count(func.distinct(SiteEvent.session_id))).filter(SiteEvent.session_id != "").scalar() or 0
    daily = (base.with_entities(func.date(SiteEvent.created_at), func.count(SiteEvent.id)).group_by(func.date(SiteEvent.created_at))
             .order_by(func.date(SiteEvent.created_at)).all())
    return {"days": days, "sessions": visitors, "by_name": by_name, "top_pages": [{"path": p, "views": n} for p, n in top_pages],
            "daily": [{"date": str(d), "events": n} for d, n in daily]}
