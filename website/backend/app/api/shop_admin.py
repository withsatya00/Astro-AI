"""Admin tools for Mandir Seva / Astro Mall: priests, live darshan & aarti, coupons, seller KYC, certificates, payouts, packages."""
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from packages.core.notify import notify
from packages.database.models import Coupon, MarketplaceProduct, Payout, Priest, SellerProfile, SevaPackage, Temple, User, generate_uuid
from packages.database.session import get_db
from website.backend.app.api.mandir import _priest_dict, require_admin
from website.backend.app.api.seller import PRIVATE_DIR

router = APIRouter(prefix="/shop-admin", tags=["Shop admin"])

PHOTO_DIR = Path(__file__).resolve().parents[4] / "storage" / "uploads" / "priests"


class PriestIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    temple_slug: Optional[str] = None
    photo_url: Optional[str] = Field(None, max_length=500)
    years_experience: int = Field(0, ge=0, le=80)
    languages: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = None
    bio_en: Optional[str] = None
    verified: bool = False
    is_active: bool = True


class TemplePatch(BaseModel):
    live_url: Optional[str] = Field(None, max_length=500)
    live_status: Optional[str] = Field(None, max_length=100)
    aarti_timings: Optional[List[dict]] = None


class CouponIn(BaseModel):
    code: str = Field(..., min_length=3, max_length=30)
    kind: str = "percent"
    value: float = Field(..., gt=0)
    min_amount: float = 0
    max_discount: Optional[float] = None
    applies_to: str = "all"
    first_order_only: bool = False
    valid_to: Optional[str] = None
    usage_limit: Optional[int] = None
    per_user_limit: int = 1
    description: Optional[str] = None
    is_active: bool = True


class Decision(BaseModel):
    approve: bool
    note: Optional[str] = Field(None, max_length=300)


class PayoutDecision(BaseModel):
    reference: str = Field(..., min_length=3, max_length=120)


def _temple(db: Session, slug: Optional[str]) -> Optional[Temple]:
    if not slug:
        return None
    t = db.query(Temple).filter(Temple.slug == slug).first()
    if not t:
        raise HTTPException(status_code=404, detail="Temple not found")
    return t


def _safe_embed(url: Optional[str]) -> Optional[str]:
    """Only https URLs, and YouTube watch/live links are converted to their embeddable form."""
    if not url:
        return None
    url = url.strip()
    if not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="Live darshan link must start with https://")
    for marker in ("youtube.com/watch?v=", "youtu.be/", "youtube.com/live/"):
        if marker in url:
            vid = url.split(marker, 1)[1].split("&")[0].split("?")[0]
            return f"https://www.youtube.com/embed/{vid}"
    return url


# ---------- priests ----------
@router.get("/priests")
def list_priests(db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    return {"priests": [dict(_priest_dict(p, "hi"), is_active=p.is_active, temple_slug=(db.query(Temple.slug).filter(Temple.id == p.temple_id).scalar() if p.temple_id else None))
                        for p in db.query(Priest).order_by(Priest.created_at.desc()).all()]}


@router.post("/priests")
def create_priest(req: PriestIn, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    t = _temple(db, req.temple_slug)
    p = Priest(name=req.name.strip(), temple_id=t.id if t else None, photo_url=req.photo_url, years_experience=req.years_experience,
               languages=req.languages, bio=req.bio, bio_en=req.bio_en, verified=req.verified, is_active=req.is_active)
    db.add(p)
    db.commit()
    return {"success": True, "id": p.id}


@router.patch("/priests/{priest_id}")
def update_priest(priest_id: str, req: PriestIn, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    p = db.query(Priest).filter(Priest.id == priest_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Priest not found")
    t = _temple(db, req.temple_slug)
    p.name, p.temple_id, p.photo_url = req.name.strip(), (t.id if t else None), req.photo_url
    p.years_experience, p.languages, p.bio, p.bio_en = req.years_experience, req.languages, req.bio, req.bio_en
    p.verified, p.is_active = req.verified, req.is_active
    db.commit()
    return {"success": True}


@router.delete("/priests/{priest_id}")
def delete_priest(priest_id: str, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    p = db.query(Priest).filter(Priest.id == priest_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Priest not found")
    p.is_active = False   # kept so past bookings still show who performed them
    db.commit()
    return {"success": True}


@router.post("/priests/photo")
async def upload_priest_photo(file: UploadFile = File(...), _a: User = Depends(require_admin)):
    import io
    from PIL import Image, ImageOps
    data = await file.read(5 * 1024 * 1024 + 1)
    try:
        img = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Upload a valid JPG, PNG or WebP photo")
    img = ImageOps.fit(img, (480, 480))
    PHOTO_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{generate_uuid()}.jpg"
    img.save(PHOTO_DIR / name, "JPEG", quality=85)
    return {"url": f"/uploads/priests/{name}"}


# ---------- temples: live darshan & aarti ----------
@router.get("/temples")
def list_temples(db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    out = []
    for t in db.query(Temple).order_by(Temple.name).all():
        try:
            aarti = json.loads(t.aarti_timings or "[]")
        except ValueError:
            aarti = []
        out.append({"slug": t.slug, "name": t.name, "live_url": t.live_url, "live_status": t.live_status, "aarti_timings": aarti})
    return {"temples": out}


@router.patch("/temples/{slug}")
def update_temple(slug: str, req: TemplePatch, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    t = _temple(db, slug)
    fields = req.model_dump(exclude_unset=True)
    if "live_url" in fields:
        t.live_url = _safe_embed(fields["live_url"])
    if "live_status" in fields:
        t.live_status = fields["live_status"]
    if "aarti_timings" in fields:
        t.aarti_timings = json.dumps([{"name": str(a.get("name", ""))[:80], "time": str(a.get("time", ""))[:40]} for a in (fields["aarti_timings"] or [])
                                      if a.get("name") and a.get("time")], ensure_ascii=False)
    db.commit()
    return {"success": True}


# ---------- coupons ----------
def _coupon_dict(c: Coupon) -> dict:
    return {"code": c.code, "kind": c.kind, "value": c.value, "min_amount": c.min_amount, "max_discount": c.max_discount, "applies_to": c.applies_to,
            "first_order_only": c.first_order_only, "valid_to": c.valid_to.isoformat() if c.valid_to else None, "usage_limit": c.usage_limit,
            "per_user_limit": c.per_user_limit, "description": c.description, "is_active": c.is_active}


@router.get("/coupons")
def list_coupons(db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    return {"coupons": [_coupon_dict(c) for c in db.query(Coupon).order_by(Coupon.code).all()]}


def _apply_coupon(c: Coupon, req: CouponIn) -> None:
    if req.kind not in ("percent", "flat") or req.applies_to not in ("all", "mall", "seva"):
        raise HTTPException(status_code=400, detail="Invalid coupon kind or scope")
    if req.kind == "percent" and req.value > 100:
        raise HTTPException(status_code=400, detail="Percent discount cannot exceed 100")
    c.kind, c.value, c.min_amount, c.max_discount, c.applies_to = req.kind, req.value, req.min_amount, req.max_discount, req.applies_to
    c.first_order_only, c.usage_limit, c.per_user_limit, c.description, c.is_active = req.first_order_only, req.usage_limit, req.per_user_limit, req.description, req.is_active
    c.valid_to = datetime.fromisoformat(req.valid_to).replace(tzinfo=timezone.utc) if req.valid_to else None


@router.post("/coupons")
def create_coupon(req: CouponIn, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    code = req.code.strip().upper()
    if db.query(Coupon).filter(Coupon.code == code).first():
        raise HTTPException(status_code=409, detail="A coupon with this code already exists")
    c = Coupon(code=code, value=req.value)
    _apply_coupon(c, req)
    db.add(c)
    db.commit()
    return {"success": True}


@router.patch("/coupons/{code}")
def update_coupon(code: str, req: CouponIn, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    c = db.query(Coupon).filter(Coupon.code == code.upper()).first()
    if not c:
        raise HTTPException(status_code=404, detail="Coupon not found")
    _apply_coupon(c, req)
    db.commit()
    return {"success": True}


# ---------- seller KYC ----------
@router.get("/sellers")
def list_sellers(status: Optional[str] = None, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    q = db.query(SellerProfile)
    if status:
        q = q.filter(SellerProfile.kyc_status == status.upper())
    out = []
    for p in q.order_by(SellerProfile.created_at.desc()).all():
        u = db.query(User).filter(User.id == p.user_id).first()
        out.append({"user_id": p.user_id, "email": u.email if u else None, "business_name": p.business_name, "phone": p.phone, "upi_id": p.upi_id,
                    "pan_number": p.pan_number, "kyc_status": p.kyc_status, "kyc_note": p.kyc_note, "has_document": bool(p.kyc_doc_url)})
    return {"sellers": out}


@router.patch("/sellers/{user_id}")
def decide_seller(user_id: str, req: Decision, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    p = db.query(SellerProfile).filter(SellerProfile.user_id == user_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Seller not found")
    if req.approve and not p.kyc_doc_url:
        raise HTTPException(status_code=400, detail="The seller has not uploaded a KYC document")
    p.kyc_status, p.kyc_note = ("APPROVED" if req.approve else "REJECTED"), req.note
    notify(db, f"u:{user_id}", "kyc_approved" if req.approve else "kyc_rejected", "/seller", note=req.note or "")
    db.commit()
    return {"success": True}


@router.get("/sellers/{user_id}/document")
def seller_document(user_id: str, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    p = db.query(SellerProfile).filter(SellerProfile.user_id == user_id).first()
    if not p or not p.kyc_doc_url:
        raise HTTPException(status_code=404, detail="No document uploaded")
    path = PRIVATE_DIR / Path(p.kyc_doc_url).name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Document file is missing")
    return FileResponse(path)


# ---------- lab certificates ----------
@router.get("/certificates")
def pending_certificates(db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    rows = db.query(MarketplaceProduct).filter(MarketplaceProduct.certificate_status == "PENDING").all()
    return {"certificates": [{"product_id": p.id, "title": p.title, "seller": p.seller_name, "lab": p.certificate_lab, "number": p.certificate_number,
                              "file": p.certificate_file} for p in rows]}


@router.patch("/certificates/{product_id}")
def decide_certificate(product_id: str, req: Decision, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    p = db.query(MarketplaceProduct).filter(MarketplaceProduct.id == product_id, MarketplaceProduct.certificate_status == "PENDING").first()
    if not p:
        raise HTTPException(status_code=404, detail="No pending certificate for this product")
    if req.approve:
        p.certificate_status, p.has_lab_certificate = "VERIFIED", True
        p.certificate_code = "PC-" + generate_uuid().replace("-", "")[:8].upper()
    else:
        p.certificate_status, p.has_lab_certificate, p.certificate_code = "REJECTED", False, None
    if p.seller_id:
        notify(db, f"u:{p.seller_id}", "certificate_verified" if req.approve else "certificate_rejected", "/seller", title=p.title, note=req.note or "")
    db.commit()
    return {"success": True, "certificate_code": p.certificate_code}


# ---------- payouts ----------
@router.get("/payouts")
def list_payouts(status: Optional[str] = None, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    q = db.query(Payout)
    if status:
        q = q.filter(Payout.status == status.upper())
    out = []
    for x in q.order_by(Payout.requested_at.desc()).limit(200).all():
        profile = db.query(SellerProfile).filter(SellerProfile.user_id == x.seller_user_id).first()
        out.append({"id": x.id, "seller": profile.business_name if profile else x.seller_user_id, "amount": x.amount, "upi_id": x.upi_id,
                    "status": x.status, "reference": x.reference, "requested_at": x.requested_at.isoformat() if x.requested_at else None})
    return {"payouts": out}


@router.patch("/payouts/{payout_id}")
def mark_payout_paid(payout_id: str, req: PayoutDecision, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    x = db.query(Payout).filter(Payout.id == payout_id).first()
    if not x:
        raise HTTPException(status_code=404, detail="Payout not found")
    if x.status != "REQUESTED":
        raise HTTPException(status_code=409, detail="This payout is already settled")
    x.status, x.reference, x.paid_at = "PAID", req.reference.strip(), datetime.now(timezone.utc)
    notify(db, f"u:{x.seller_user_id}", "payout_paid", "/seller", amount=f"{x.amount:.0f}", reference=x.reference)
    db.commit()
    return {"success": True}


# ---------- packages ----------
@router.get("/packages")
def list_packages(db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    return {"packages": [{"slug": p.slug, "title": p.title_en, "sessions": p.sessions, "cadence": p.cadence, "discount_percent": p.discount_percent,
                          "is_active": p.is_active} for p in db.query(SevaPackage).all()]}


@router.patch("/packages/{slug}")
def toggle_package(slug: str, is_active: bool, discount_percent: Optional[int] = None, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    p = db.query(SevaPackage).filter(SevaPackage.slug == slug).first()
    if not p:
        raise HTTPException(status_code=404, detail="Package not found")
    p.is_active = is_active
    if discount_percent is not None:
        if not 0 <= discount_percent <= 60:
            raise HTTPException(status_code=400, detail="Discount must be between 0 and 60")
        p.discount_percent = discount_percent
    db.commit()
    return {"success": True}
