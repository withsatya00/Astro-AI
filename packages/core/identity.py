"""Who is making this request, for per-user data isolation.

Private data (consultations, chats, birth charts, reports) belongs to exactly one owner:

* a signed-in user                      -> owner key ``u:<user id>`` (from the Bearer JWT)
* a visitor who is not signed in        -> owner key ``g:<client id>`` (random id the browser keeps and
                                           sends as ``X-Client-Id``)

A client-supplied ``user_id`` in a request body is never trusted. Requests with no usable identity
cannot read or create private data. Someone else's id behaves exactly like a missing one (404), so ids
cannot be probed.
"""
import re
from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from packages.core.security import decode_access_token
from packages.database.models import User
from packages.database.session import get_db

CLIENT_ID_RE = re.compile(r"^[A-Za-z0-9_-]{16,64}$")


@dataclass(frozen=True)
class Owner:
    key: str
    user_id: Optional[str] = None

    @property
    def is_guest(self) -> bool:
        return self.user_id is None


def optional_owner(
    authorization: Optional[str] = Header(None),
    x_client_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[Owner]:
    if authorization and authorization.startswith("Bearer "):
        payload = decode_access_token(authorization.split(" ", 1)[1].strip())
        user_id = payload.get("sub") if payload else None
        active = user_id and db.query(User.id).filter(User.id == user_id, User.is_active == True).first()  # noqa: E712
        if not active:
            # An expired or forged token must not silently downgrade to somebody else's guest identity.
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired. Please sign in again.",
                                headers={"WWW-Authenticate": "Bearer"})
        return Owner(key=f"u:{user_id}", user_id=user_id)
    if x_client_id and CLIENT_ID_RE.match(x_client_id.strip()):
        return Owner(key=f"g:{x_client_id.strip()}")
    return None


def require_owner(owner: Optional[Owner] = Depends(optional_owner)) -> Owner:
    if owner is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Missing client identity. Reload the page and try again.")
    return owner
