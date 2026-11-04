"""Bulk import of Astro Mall products from a CSV file (admin tool, run from scripts/import_products.py).

Rules that keep the catalogue honest:
  * nothing is invented: a blank original price means no "discount", a blank energization note means the item is not advertised as energized,
    and an imported product is never marked lab-certified (that is set only after a real certificate is verified in the seller/admin flow);
  * photos must be files you supply (or paths already on this site); they are checked, re-encoded as JPEG and capped at 1200px;
  * a run is a dry run unless asked to apply, and it applies nothing at all if any row has an error.
"""
import csv
import io
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from packages.database.models import MarketplaceProduct, generate_uuid
from website.backend.app.api.marketplace import CATEGORIES, DEFAULT_IMAGE, RETURN_WINDOWS, UPLOAD_DIR, UPLOAD_URL_PREFIX

REQUIRED = ("title", "category", "price", "description")
COLUMNS = REQUIRED + ("original_price", "stock", "material", "origin", "image", "extra_images", "seller_name", "energized_details", "return_days")
ALIASES = {"puja_essentials": "samagri", "puja essentials": "samagri", "puja-essentials": "samagri", "gemstones": "gemstone", "rudraksh": "rudraksha"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}


def parse_csv(text: str) -> List[Dict[str, str]]:
    """Reads CSV text (Excel's UTF-8 BOM is fine). Header names are matched ignoring case and spaces."""
    reader = csv.DictReader(io.StringIO(text.lstrip("﻿")))
    rows = []
    for raw in reader:
        row = {(k or "").strip().lower().replace(" ", "_"): (v or "").strip() for k, v in raw.items()}
        if any(row.values()):
            rows.append(row)
    return rows


def _money(value: str) -> Optional[float]:
    cleaned = re.sub(r"[₹,\s]|rs\.?|inr", "", value, flags=re.I)
    return float(cleaned) if cleaned else None


def _check_image(path: Path) -> Tuple[Any, Optional[str]]:
    try:
        from PIL import Image, ImageOps
        with Image.open(path) as probe:
            probe.verify()
        img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    except Exception:
        return None, f"'{path.name}' is not a valid JPG, PNG or WebP photo"
    if min(img.size) < 300:
        return None, f"'{path.name}' is too small (use at least 300 x 300 pixels)"
    return img, None


def _resolve_image(ref: str, images_dir: Optional[Path], save: bool) -> Tuple[Optional[str], Optional[str]]:
    """Returns (url, error). A path on this site is kept as is; anything else must be a file inside images_dir."""
    if ref.startswith(("/assets/", UPLOAD_URL_PREFIX)):
        return ref, None
    if re.match(r"^https?://", ref, re.I):
        return None, f"'{ref[:40]}...' is an external link; supply the photo file instead"
    if images_dir is None:
        return None, f"photo '{ref}' needs --images-dir"
    path = (images_dir / ref).resolve()
    if images_dir.resolve() not in path.parents and path != images_dir.resolve():
        return None, f"photo '{ref}' must be inside the images folder"
    if path.suffix.lower() not in IMAGE_EXT or not path.is_file():
        return None, f"photo '{ref}' was not found in the images folder"
    img, err = _check_image(path)
    if err:
        return None, err
    if not save:
        return f"{UPLOAD_URL_PREFIX}(dry-run){path.stem}.jpg", None
    img.thumbnail((1200, 1200))
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{generate_uuid()}.jpg"
    img.save(UPLOAD_DIR / name, "JPEG", quality=85, optimize=True)
    return f"{UPLOAD_URL_PREFIX}{name}", None


def validate_row(row: Dict[str, str], images_dir: Optional[Path], save_images: bool, default_seller: str) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    errors: List[str] = []
    for col in REQUIRED:
        if not row.get(col):
            errors.append(f"'{col}' is required")
    title, desc = row.get("title", ""), row.get("description", "")
    if title and not 3 <= len(title) <= 255:
        errors.append("title must be 3 to 255 characters")
    if desc and len(desc) < 10:
        errors.append("description must be at least 10 characters")
    cat = ALIASES.get(row.get("category", "").lower(), row.get("category", "").lower())
    if cat and cat not in CATEGORIES:
        errors.append(f"category '{row.get('category')}' must be one of {sorted(CATEGORIES)}")

    price = original = None
    try:
        price = _money(row.get("price", ""))
        original = _money(row.get("original_price", ""))
    except ValueError:
        errors.append("price and original_price must be numbers")
    if price is not None and price <= 0:
        errors.append("price must be more than 0")
    if price and original is not None and original < price:
        errors.append("original_price cannot be lower than price")

    stock = 10
    if row.get("stock"):
        try:
            stock = int(float(row["stock"]))
            if not 0 <= stock <= 10000:
                raise ValueError
        except ValueError:
            errors.append("stock must be a whole number from 0 to 10000")
    return_days = RETURN_WINDOWS.get(cat, RETURN_WINDOWS["default"])
    if row.get("return_days"):
        try:
            return_days = int(row["return_days"])
            if not 0 <= return_days <= 60:
                raise ValueError
        except ValueError:
            errors.append("return_days must be a whole number from 0 to 60")

    image, extras = DEFAULT_IMAGE, []
    if row.get("image"):
        image, err = _resolve_image(row["image"], images_dir, save_images)
        if err:
            errors.append(err)
    for ref in [r.strip() for r in row.get("extra_images", "").split("|") if r.strip()][:5]:
        url, err = _resolve_image(ref, images_dir, save_images)
        if err:
            errors.append(err)
        elif url:
            extras.append(url)

    if errors:
        return None, errors
    note = row.get("energized_details", "")
    return {
        "seller_name": row.get("seller_name") or default_seller, "title": title, "category": cat, "description": desc,
        "material": row.get("material") or None, "origin": row.get("origin") or None, "price": price,
        "original_price": original if original is not None else price, "stock": stock, "image_url": image,
        "extra_images": json.dumps(extras) if extras else None, "is_energized": bool(note), "energized_details": note,  # "" (not None): the column default would otherwise add a claim nobody made
        "return_days": return_days,
    }, []


def import_products(db: Session, rows: List[Dict[str, str]], images_dir: Optional[Path] = None, apply: bool = False,
                    default_seller: str = "Astro Jyotish") -> Dict[str, Any]:
    """Validates every row and, only with apply=True and no errors, adds the products (live immediately, no reviews, not lab-certified)."""
    report: Dict[str, Any] = {"created": [], "skipped": [], "errors": [], "applied": False}
    existing = {(p.title.strip().lower(), (p.seller_name or "").strip().lower()) for p in db.query(MarketplaceProduct.title, MarketplaceProduct.seller_name).all()}
    seen = set()
    staged: List[Dict[str, Any]] = []
    for n, row in enumerate(rows, start=2):  # line 1 of the file is the header
        clean, errs = validate_row(row, images_dir, False, default_seller)
        if errs:
            report["errors"].append({"line": n, "title": row.get("title", ""), "problems": errs})
            continue
        key = (clean["title"].lower(), clean["seller_name"].strip().lower())
        if key in existing or key in seen:
            report["skipped"].append({"line": n, "title": clean["title"], "reason": "a product with this title already exists for this seller"})
            continue
        seen.add(key)
        staged.append({"line": n, "row": row})
        report["created"].append({"line": n, "title": clean["title"], "category": clean["category"], "price": clean["price"], "stock": clean["stock"]})
    if apply and not report["errors"] and staged:
        for item in staged:  # photos are saved only now, after every row passed
            clean, errs = validate_row(item["row"], images_dir, True, default_seller)
            db.add(MarketplaceProduct(seller_id=None, rating=0.0, review_count=0, has_lab_certificate=False, certificate_url=None,
                                      listing_status="APPROVED", is_active=True, **clean))
        db.commit()
        report["applied"] = True
    return report
