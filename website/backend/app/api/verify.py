"""Public verification of seva certificates and lab certificates (what the QR codes open)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from packages.database.models import ChadawaBooking, MarketplaceProduct
from packages.database.session import get_db
from website.backend.app import catalog_i18n
from website.backend.app.services.certificates import qr_svg

router = APIRouter(prefix="/verify", tags=["Certificate verification"])


def _mask(name: str) -> str:
    parts = (name or "").split()
    return " ".join([parts[0]] + [p[0] + "." for p in parts[1:]]) if parts else ""


@router.get("/{code}")
def verify_code(code: str, lang: Optional[str] = None, db: Session = Depends(get_db)):
    """SV-... is a completed seva certificate, PC-... is a verified lab certificate of a product."""
    code = code.strip().upper()
    if code.startswith("SV-"):
        b = db.query(ChadawaBooking).filter(ChadawaBooking.certificate_code == code).first()
        if not b or b.status != "COMPLETED":
            raise HTTPException(status_code=404, detail="Certificate not found")
        offering = b.offering
        temple = offering.temple if offering else None
        english = catalog_i18n.is_en(lang)
        en = catalog_i18n.temple_en(temple.slug) if (temple and english) else None
        off = catalog_i18n.offering_en(offering.title) if (offering and english) else None
        return {"kind": "seva", "valid": True, "code": code, "yajman": _mask(b.devotee_name), "gotra": b.gotra,
                "temple": (en["name"] if en else temple.name) if temple else None,
                "seva": (off[0] if off else offering.title) if offering else None,
                "date": b.scheduled_for or (b.completed_at.strftime("%d %B %Y") if b.completed_at else None),
                "booking_number": b.booking_number}
    if code.startswith("PC-"):
        p = db.query(MarketplaceProduct).filter(MarketplaceProduct.certificate_code == code, MarketplaceProduct.certificate_status == "VERIFIED").first()
        if not p:
            raise HTTPException(status_code=404, detail="Certificate not found")
        en = catalog_i18n.product_en(p.title) if catalog_i18n.is_en(lang) else None
        return {"kind": "product", "valid": True, "code": code, "product": en["title"] if en else p.title, "product_id": p.id,
                "lab": p.certificate_lab, "certificate_number": p.certificate_number, "file": p.certificate_file,
                "seller": catalog_i18n.SELLERS_EN.get(p.seller_name, p.seller_name) if catalog_i18n.is_en(lang) else p.seller_name,
                "image_url": p.image_url}
    raise HTTPException(status_code=404, detail="Certificate not found")


@router.get("/{code}/qr.svg")
def verify_qr(code: str, request: Request):
    """QR code image that opens the verification page for `code`."""
    code = code.strip().upper()
    if not (code.startswith("SV-") or code.startswith("PC-")):
        raise HTTPException(status_code=404, detail="Certificate not found")
    return Response(content=qr_svg(f"{str(request.base_url).rstrip('/')}/verify/{code}"), media_type="image/svg+xml")
