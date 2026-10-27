"""Cart and wishlist saved to the account, so they follow the user across devices."""
import json
from typing import Dict, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from packages.database.models import MarketplaceProduct, SavedCartItem, User, WishlistItem
from packages.database.session import get_db
from website.backend.app.api.auth import get_current_user_required

router = APIRouter(tags=["Cart & Wishlist"])


class CartLine(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1, le=10)
    options: Dict[str, str] = Field(default_factory=dict)


class CartPayload(BaseModel):
    items: List[CartLine] = Field(default_factory=list, max_length=40)


class WishlistPayload(BaseModel):
    product_ids: List[str] = Field(default_factory=list, max_length=200)


def _key(options: Dict[str, str]) -> str:
    return json.dumps(options, sort_keys=True, ensure_ascii=False)[:200]


def _valid_ids(db: Session, ids: List[str]) -> set:
    return {r[0] for r in db.query(MarketplaceProduct.id).filter(MarketplaceProduct.id.in_(ids), MarketplaceProduct.is_active == True).all()} if ids else set()  # noqa: E712


def _cart(db: Session, user: User) -> List[dict]:
    rows = db.query(SavedCartItem).filter(SavedCartItem.user_id == user.id).all()
    return [{"product_id": r.product_id, "quantity": r.quantity, "options": json.loads(r.options) if r.options else {}} for r in rows]


@router.get("/cart")
def get_cart(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    return {"items": _cart(db, user)}


@router.put("/cart")
def replace_cart(payload: CartPayload, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """Replaces the saved cart with exactly these lines."""
    valid = _valid_ids(db, [l.product_id for l in payload.items])
    db.query(SavedCartItem).filter(SavedCartItem.user_id == user.id).delete()
    seen = set()
    for l in payload.items:
        k = (l.product_id, _key(l.options))
        if l.product_id in valid and k not in seen:
            seen.add(k)
            db.add(SavedCartItem(user_id=user.id, product_id=l.product_id, options_key=k[1], options=json.dumps(l.options) if l.options else None,
                                 quantity=l.quantity))
    db.commit()
    return {"items": _cart(db, user)}


@router.post("/cart/merge")
def merge_cart(payload: CartPayload, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """Adds a guest's local cart to the saved one after sign-in (quantities add up, capped at 10)."""
    valid = _valid_ids(db, [l.product_id for l in payload.items])
    for l in payload.items:
        if l.product_id not in valid:
            continue
        row = db.query(SavedCartItem).filter(SavedCartItem.user_id == user.id, SavedCartItem.product_id == l.product_id,
                                             SavedCartItem.options_key == _key(l.options)).first()
        if row:
            row.quantity = min(10, row.quantity + l.quantity)
        else:
            db.add(SavedCartItem(user_id=user.id, product_id=l.product_id, options_key=_key(l.options),
                                 options=json.dumps(l.options) if l.options else None, quantity=l.quantity))
    db.commit()
    return {"items": _cart(db, user)}


@router.get("/wishlist")
def get_wishlist(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    return {"product_ids": [r.product_id for r in db.query(WishlistItem).filter(WishlistItem.user_id == user.id).all()]}


@router.put("/wishlist")
def replace_wishlist(payload: WishlistPayload, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    valid = _valid_ids(db, payload.product_ids)
    db.query(WishlistItem).filter(WishlistItem.user_id == user.id).delete()
    for pid in dict.fromkeys(payload.product_ids):
        if pid in valid:
            db.add(WishlistItem(user_id=user.id, product_id=pid))
    db.commit()
    return get_wishlist(db, user)


@router.post("/wishlist/merge")
def merge_wishlist(payload: WishlistPayload, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    have = {r.product_id for r in db.query(WishlistItem).filter(WishlistItem.user_id == user.id).all()}
    for pid in _valid_ids(db, payload.product_ids) - have:
        db.add(WishlistItem(user_id=user.id, product_id=pid))
    db.commit()
    return get_wishlist(db, user)
