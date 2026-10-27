"""Seller dashboard: KYC, listings, order fulfilment, lab certificates, earnings and payouts."""
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from packages.core.notify import notify
from packages.database.models import MarketplaceOrder, MarketplaceProduct, Payout, SellerProfile, User, generate_uuid
from packages.database.session import get_db
from website.backend.app.api.auth import get_current_user_required
from website.backend.app.api.marketplace import CERT_DIR, _order_dict, _product_dict, _review_stats, advance_order

router = APIRouter(prefix="/seller", tags=["Seller dashboard"])

PRIVATE_DIR = Path(__file__).resolve().parents[4] / "storage" / "private" / "kyc"
MIN_PAYOUT = 500.0
MAX_DOC_BYTES = 5 * 1024 * 1024
DOC_TYPES = {".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}


class SellerRegister(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=200)
    phone: Optional[str] = Field(None, max_length=30)
    upi_id: Optional[str] = Field(None, max_length=120)
    pan_number: Optional[str] = Field(None, max_length=20)


class ProductEdit(BaseModel):
    price: Optional[float] = Field(None, gt=0)
    original_price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0, le=10000)
    paused: Optional[bool] = None


class SellerOrderUpdate(BaseModel):
    status: str
    tracking_id: Optional[str] = Field(None, max_length=100)


class PayoutRequest(BaseModel):
    amount: float = Field(..., gt=0)


def _profile(db: Session, user: User) -> Optional[SellerProfile]:
    return db.query(SellerProfile).filter(SellerProfile.user_id == user.id).first()


def _need_profile(db: Session, user: User) -> SellerProfile:
    p = _profile(db, user)
    if not p:
        raise HTTPException(status_code=403, detail="Register as a seller first")
    return p


def _earnings(db: Session, user: User) -> dict:
    gross, net = db.query(func.coalesce(func.sum(MarketplaceOrder.total_price), 0.0), func.coalesce(func.sum(MarketplaceOrder.seller_amount), 0.0)) \
        .filter(MarketplaceOrder.seller_id == user.id, MarketplaceOrder.order_status == "DELIVERED").one()
    paid = db.query(func.coalesce(func.sum(Payout.amount), 0.0)).filter(Payout.seller_user_id == user.id, Payout.status == "PAID").scalar()
    pending = db.query(func.coalesce(func.sum(Payout.amount), 0.0)).filter(Payout.seller_user_id == user.id, Payout.status == "REQUESTED").scalar()
    return {"gross": round(gross, 2), "net": round(net, 2), "commission": round(gross - net, 2), "paid_out": round(paid, 2),
            "pending_payout": round(pending, 2), "available": round(max(0.0, net - paid - pending), 2), "min_payout": MIN_PAYOUT}


def _profile_dict(p: SellerProfile) -> dict:
    pan = p.pan_number or ""
    return {"business_name": p.business_name, "phone": p.phone, "upi_id": p.upi_id, "pan_masked": ("XXXXXX" + pan[-4:]) if len(pan) >= 4 else None,
            "kyc_status": p.kyc_status, "kyc_note": p.kyc_note, "has_document": bool(p.kyc_doc_url)}


@router.post("/register")
def register_seller(req: SellerRegister, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """Creates (or updates) the seller profile. KYC must be approved by our team before listing products."""
    p = _profile(db, user)
    pan = (req.pan_number or "").strip().upper() or None
    if pan and not (len(pan) == 10 and pan[:5].isalpha() and pan[5:9].isdigit() and pan[9].isalpha()):
        raise HTTPException(status_code=400, detail="PAN must look like ABCDE1234F")
    if p is None:
        p = SellerProfile(user_id=user.id, business_name=req.business_name.strip())
        db.add(p)
    p.business_name = req.business_name.strip()
    p.phone, p.upi_id = req.phone, req.upi_id
    if pan:
        p.pan_number = pan
    if p.kyc_status == "REJECTED":
        p.kyc_status, p.kyc_note = "PENDING", None
    db.commit()
    return {"success": True, "profile": _profile_dict(p)}


@router.post("/kyc-document")
async def upload_kyc_document(file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """PAN/ID proof for KYC. Stored privately; only admins can open it."""
    p = _need_profile(db, user)
    ext = Path(file.filename or "").suffix.lower()
    if ext not in DOC_TYPES:
        raise HTTPException(status_code=400, detail="Upload a PDF, JPG or PNG document")
    data = await file.read(MAX_DOC_BYTES + 1)
    if len(data) > MAX_DOC_BYTES:
        raise HTTPException(status_code=413, detail="Document must be 5 MB or smaller")
    PRIVATE_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{generate_uuid()}{ext}"
    (PRIVATE_DIR / name).write_bytes(data)
    p.kyc_doc_url = name
    if p.kyc_status == "REJECTED":
        p.kyc_status, p.kyc_note = "PENDING", None
    db.commit()
    return {"success": True, "profile": _profile_dict(p)}


@router.get("/me")
def seller_me(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    p = _profile(db, user)
    if not p:
        return {"registered": False}
    open_orders = db.query(MarketplaceOrder).filter(MarketplaceOrder.seller_id == user.id,
                                                    MarketplaceOrder.order_status.in_(["PLACED", "PAID", "ENERGIZING"])).count()
    return {"registered": True, "profile": _profile_dict(p), "earnings": _earnings(db, user), "open_orders": open_orders,
            "products": db.query(MarketplaceProduct).filter(MarketplaceProduct.seller_id == user.id).count()}


@router.get("/orders")
def seller_orders(lang: Optional[str] = None, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    _need_profile(db, user)
    rows = db.query(MarketplaceOrder).filter(MarketplaceOrder.seller_id == user.id).order_by(MarketplaceOrder.created_at.desc()).limit(200).all()
    return {"orders": [dict(_order_dict(o, lang), buyer_phone=o.buyer_phone, shipping_address=o.shipping_address,
                            seller_amount=o.seller_amount, commission_amount=o.commission_amount) for o in rows]}


@router.patch("/orders/{order_id}")
def seller_update_order(order_id: str, req: SellerOrderUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """Sellers energize and dispatch their own orders; delivery is confirmed by our team or the courier."""
    _need_profile(db, user)
    order = db.query(MarketplaceOrder).filter(MarketplaceOrder.id == order_id, MarketplaceOrder.seller_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    status = req.status.upper()
    if status not in ("ENERGIZING", "DISPATCHED"):
        raise HTTPException(status_code=400, detail="You can mark an order as ENERGIZING or DISPATCHED")
    if order.order_status == "PLACED" and order.payment_method == "COD":
        pass  # cash on delivery orders are confirmed by shipping
    advance_order(db, order, status, req.tracking_id)
    db.commit()
    return {"success": True, "order": _order_dict(order)}


@router.patch("/products/{product_id}")
def edit_product(product_id: str, req: ProductEdit, lang: Optional[str] = None, db: Session = Depends(get_db),
                 user: User = Depends(get_current_user_required)):
    """Price, stock and pause/resume. Other changes need a new listing so our team can review them."""
    prod = db.query(MarketplaceProduct).filter(MarketplaceProduct.id == product_id, MarketplaceProduct.seller_id == user.id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    if req.price is not None:
        prod.price = req.price
    if req.original_price is not None:
        prod.original_price = req.original_price
    if prod.original_price and prod.original_price < prod.price:
        raise HTTPException(status_code=400, detail="MRP cannot be lower than the selling price")
    if req.stock is not None:
        prod.stock = req.stock
    if req.paused is not None:
        if prod.listing_status != "APPROVED":
            raise HTTPException(status_code=409, detail="Only an approved listing can be paused or resumed")
        prod.is_active = not req.paused
    db.commit()
    return {"success": True, "product": dict(_product_dict(prod, _review_stats(db, [prod.id]), lang), is_active=prod.is_active,
                                             listing_status=prod.listing_status, certificate_status=prod.certificate_status)}


@router.post("/products/{product_id}/certificate")
async def upload_certificate(product_id: str, lab: str = Form(..., min_length=2, max_length=120), number: str = Form(..., min_length=2, max_length=80),
                             file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """Lab certificate for a product. The 'Certificate' badge appears only after our team verifies it."""
    prod = db.query(MarketplaceProduct).filter(MarketplaceProduct.id == product_id, MarketplaceProduct.seller_id == user.id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    ext = Path(file.filename or "").suffix.lower()
    if ext not in DOC_TYPES:
        raise HTTPException(status_code=400, detail="Upload a PDF, JPG or PNG certificate")
    data = await file.read(MAX_DOC_BYTES + 1)
    if len(data) > MAX_DOC_BYTES:
        raise HTTPException(status_code=413, detail="Certificate must be 5 MB or smaller")
    CERT_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{generate_uuid()}{ext}"
    (CERT_DIR / name).write_bytes(data)
    prod.certificate_file, prod.certificate_lab, prod.certificate_number = f"/uploads/certificates/{name}", lab.strip(), number.strip()
    prod.certificate_status, prod.certificate_code = "PENDING", None
    db.commit()
    return {"success": True, "certificate_status": prod.certificate_status}


@router.get("/earnings")
def earnings(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    _need_profile(db, user)
    payouts = db.query(Payout).filter(Payout.seller_user_id == user.id).order_by(Payout.requested_at.desc()).limit(50).all()
    return {"earnings": _earnings(db, user),
            "payouts": [{"id": x.id, "amount": x.amount, "status": x.status, "reference": x.reference,
                         "requested_at": x.requested_at.isoformat() if x.requested_at else None,
                         "paid_at": x.paid_at.isoformat() if x.paid_at else None} for x in payouts]}


@router.post("/payouts")
def request_payout(req: PayoutRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    p = _need_profile(db, user)
    if p.kyc_status != "APPROVED":
        raise HTTPException(status_code=403, detail="Your seller KYC is not approved yet")
    if not p.upi_id:
        raise HTTPException(status_code=400, detail="Add your UPI ID in the seller profile first")
    e = _earnings(db, user)
    if req.amount < MIN_PAYOUT:
        raise HTTPException(status_code=400, detail=f"Minimum payout is ₹{MIN_PAYOUT:.0f}")
    if req.amount > e["available"] + 0.001:
        raise HTTPException(status_code=400, detail=f"You can withdraw up to ₹{e['available']:.2f}")
    payout = Payout(seller_user_id=user.id, amount=round(req.amount, 2), upi_id=p.upi_id)
    db.add(payout)
    db.commit()
    return {"success": True, "payout_id": payout.id, "earnings": _earnings(db, user)}
