"""Notification bell: booking, order and listing updates for the current visitor or account."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from packages.core.identity import Owner, optional_owner
from packages.core.notify import render
from packages.database.models import Notification
from packages.database.session import get_db

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _dict(n: Notification, lang: Optional[str]):
    title, body = render(n, lang)
    return {"id": n.id, "title": title, "body": body, "link": n.link, "is_read": bool(n.is_read),
            "created_at": n.created_at.isoformat() if n.created_at else None}


@router.get("")
def list_notifications(lang: Optional[str] = None, db: Session = Depends(get_db), owner: Optional[Owner] = Depends(optional_owner)):
    if owner is None:
        return {"notifications": [], "unread": 0}
    rows = (db.query(Notification).filter(Notification.owner_key == owner.key)
            .order_by(Notification.created_at.desc()).limit(30).all())
    unread = db.query(Notification).filter(Notification.owner_key == owner.key, Notification.is_read == False).count()  # noqa: E712
    return {"notifications": [_dict(n, lang) for n in rows], "unread": unread}


@router.post("/read-all")
def read_all(db: Session = Depends(get_db), owner: Optional[Owner] = Depends(optional_owner)):
    if owner is not None:
        db.query(Notification).filter(Notification.owner_key == owner.key, Notification.is_read == False  # noqa: E712
                                      ).update({Notification.is_read: True}, synchronize_session=False)
        db.commit()
    return {"success": True}


@router.post("/{notification_id}/read")
def read_one(notification_id: str, db: Session = Depends(get_db), owner: Optional[Owner] = Depends(optional_owner)):
    n = None
    if owner is not None:
        n = db.query(Notification).filter(Notification.id == notification_id, Notification.owner_key == owner.key).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"success": True}
