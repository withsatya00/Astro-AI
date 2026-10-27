"""
Pandit Marketplace & Astro-Mall API for Astro Jyotish.
Allows astrologers to list energized items (malas, rudraksha, yantras, gemstones)
and devotees to order energized products with custom name/gotra abhimantran.
"""
import io
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import random

from packages.database.session import get_db
from packages.database.models import (
    User, BirthChart, MarketplaceProduct, MarketplaceOrder, MarketplaceReview, SellerProfile, StatusEvent, generate_uuid, utc_now
)
from website.backend.app.api.auth import get_current_user_optional, get_current_user_required
from packages.core.identity import Owner, optional_owner
from packages.core.wallet_pay import charge_wallet, refund_wallet
from packages.core.notify import notify, record_event
from packages.core.pricing import (
    EARN_PER_RUPEES, active_membership, apply_totals, award_points, compute_totals, maybe_reward_referral, refund_points
)
from packages.core.tracking import order_tracking
from website.backend.app import catalog_i18n
from packages.core.remedies import normalize_sign, remedy_for_sign

router = APIRouter(prefix="/marketplace", tags=["Marketplace & Astro-Mall"])

INITIAL_PRODUCTS = [
    {
        "seller_name": "पं. रामेश्वर द्विवेदी (काशी)",
        "title": "प्राकृतिक 5-मुखी नेपाली रुद्राक्ष (Silver Capped)",
        "category": "rudraksha",
        "description": "प्राकृतिक एवं अप्रतिबंधित 5-मुखी नेपाली रुद्राक्ष। भगवान शिव का साक्षात स्वरूप जो मानसिक शांति, एकाग्रता, रक्तचाप नियंत्रण और आध्यात्मिक जागृति प्रदान करता है।",
        "material": "शुद्ध नेपाली रुद्राक्ष मनका, 925 स्टर्लिंग सिल्वर कैप",
        "origin": "नेपाल",
        "price": 499.0,
        "original_price": 999.0,
        "stock": 45,
        "rating": 0.0,
        "review_count": 0,
        "image_url": "/assets/img/products/rudraksha-5.jpg",
        "is_energized": True,
        "energized_details": "काशी विश्वनाथ में 108 महामृत्युंजय मंत्रों से अभिमंत्रित",
        "has_lab_certificate": True,
        "certificate_url": "https://example.com/certs/rudraksha-5m.pdf"
    },
    {
        "seller_name": "आचार्य विद्याधर शास्त्री",
        "title": "108 मणकों की प्राकृतिक स्फटिक माला (Diamond-Cut Crystal)",
        "category": "mala",
        "description": "अत्यंत शीतल एवं शुद्ध स्फटिक मणकों की सिद्ध माला। मां सरस्वती एवं मां लक्ष्मी की कृपा, क्रोध नियंत्रण, सकारात्मक ऊर्जा और ध्यान की गहराई के लिए सर्वोत्तम।",
        "material": "100% प्राकृतिक क्रिस्टल क्वार्ट्ज (Natural Quartz)",
        "origin": "हिमालय",
        "price": 650.0,
        "original_price": 1200.0,
        "stock": 30,
        "rating": 0.0,
        "review_count": 0,
        "image_url": "/assets/img/products/sphatik-mala.jpg",
        "is_energized": True,
        "energized_details": "गायत्री मंत्र एवं श्रीसूक्त के 1008 जप से प्राणप्रतिष्ठित",
        "has_lab_certificate": True,
        "certificate_url": "https://example.com/certs/sphatik-108.pdf"
    },
    {
        "seller_name": "पं. सत्येंद्र शास्त्री (उज्जैन)",
        "title": "सिद्ध सम्पूर्ण व्यापार वृद्धि महायंत्र (Gold Plated Copper)",
        "category": "yantra",
        "description": "शुद्ध तांबे के पत्र पर 24 कैरेट सोने की परत से निर्मित। दुकान, कार्यालय, फैक्ट्री या घर में स्थापना से धन आगमन, रुकी हुई पेमेंट्स की प्राप्ति और व्यापार में तीव्र प्रगति होती है।",
        "material": "तांबा (Copper) 24K गोल्ड पॉलिश",
        "origin": "उज्जैन",
        "price": 850.0,
        "original_price": 1600.0,
        "stock": 25,
        "rating": 0.0,
        "review_count": 0,
        "image_url": "/assets/img/products/vyapar-yantra.jpg",
        "is_energized": True,
        "energized_details": "कनकधारा स्तोत्र व कुबेर अष्टलक्ष्मी मंत्रों से सिद्ध",
        "has_lab_certificate": True,
        "certificate_url": "https://example.com/certs/vyapar-yantra.pdf"
    },
    {
        "seller_name": "डॉ. सुनीता शर्मा (वैदिक ज्योतिषाचार्य)",
        "title": "मूल जाम्बियन पन्ना रत्न (Natural Emerald 4.25 Ratti)",
        "category": "gemstone",
        "description": "बुध ग्रह का श्रेष्ठ रत्न। बुद्धि, वाणी, शेयर बाजार, परीक्षा, व्यापारिक निर्णय और त्वरित स्मरण शक्ति बढ़ाने हेतु प्रमाणित प्राकृतिक पन्ना।",
        "material": "प्राकृतिक अनहीटेड पन्ना (Natural Beryl Emerald)",
        "origin": "काफू, जाम्बिया",
        "price": 3200.0,
        "original_price": 5500.0,
        "stock": 10,
        "rating": 0.0,
        "review_count": 0,
        "image_url": "/assets/img/products/emerald.jpg",
        "is_energized": True,
        "energized_details": "बुधवार को बुध बीज मंत्र (ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः) से अभिमंत्रित",
        "has_lab_certificate": True,
        "certificate_url": "https://example.com/certs/emerald-gem-lab.pdf"
    },
    {
        "seller_name": "महाकाल वैदिक आश्रम (उज्जैन)",
        "title": "प्राकृतिक तुलसी कंठी माला (वृंदावन धाम प्रमाणित)",
        "category": "mala",
        "description": "भगवान विष्णु और श्री कृष्ण की अत्यंत प्रिय श्याम तुलसी की हस्तनिर्मित कंठी माला। नकारात्मक ऊर्जा, भय और बुरे सपनों से रक्षा करती है।",
        "material": "प्राकृतिक श्यामा तुलसी काष्ठ",
        "origin": "वृंदावन, मथुरा",
        "price": 299.0,
        "original_price": 599.0,
        "stock": 60,
        "rating": 0.0,
        "review_count": 0,
        "image_url": "/assets/img/products/tulsi-mala.jpg",
        "is_energized": True,
        "energized_details": "हरे कृष्ण महामंत्र एवं नारायण कवच से अभिमंत्रित",
        "has_lab_certificate": True,
        "certificate_url": "https://example.com/certs/tulsi-vrindavan.pdf"
    },
    {
        "seller_name": "पं. शिवचरण जोशी (हरिद्वार)",
        "title": "वैदिक नवग्रह शांति हवन किट (31 दिव्य औषधियां)",
        "category": "samagri",
        "description": "नवग्रह शांति, गृह प्रवेश और वास्तु दोष निवारण हेतु 31 दुर्लभ जड़ी-बूटियों, गूलर, पलाश, समिधा, शुद्ध घी एवं गुग्गल का शास्त्रोक्त मिश्रण।",
        "material": "100% प्राकृतिक जड़ी-बूटियां एवं शुष्क समिधा",
        "origin": "हरिद्वार, उत्तराखंड",
        "price": 450.0,
        "original_price": 750.0,
        "stock": 40,
        "rating": 0.0,
        "review_count": 0,
        "image_url": "/assets/img/products/hawan-kit.jpg",
        "is_energized": True,
        "energized_details": "गंगाजल प्रोक्षित एवं नवग्रह वेदी पर अभिमंत्रित",
        "has_lab_certificate": False,
        "certificate_url": None
    },
    {
        "seller_name": "आचार्य ब्रजेश शास्त्री (काशी)",
        "title": "सिद्ध पारद (रसराज) शिवलिंग (Pure Mercury Shivling 50g)",
        "category": "samagri",
        "description": "रसराज पारद से शास्त्रोक्त अष्टसंस्कार विधि द्वारा निर्मित अत्यंत दुर्लभ शिवलिंग। घर के मंदिर में रखने से समस्त वास्तु दोष व पितृ दोष स्वतः समाप्त होते हैं।",
        "material": "अष्टसंस्कारित शुद्ध पारद (Purified Solid Mercury)",
        "origin": "काशी, वाराणसी",
        "price": 1150.0,
        "original_price": 2100.0,
        "stock": 20,
        "rating": 0.0,
        "review_count": 0,
        "image_url": "/assets/img/products/parad-shivling.jpg",
        "is_energized": True,
        "energized_details": "महामृत्युंजय व रुद्र सूक्त से अभिमंत्रित",
        "has_lab_certificate": True,
        "certificate_url": "https://example.com/certs/parad-shivling.pdf"
    },
    {
        "seller_name": "पं. सत्येंद्र शास्त्री (उज्जैन)",
        "title": "सिद्ध कुबेर धनवर्षा यंत्र (Pure Brass Gold Tone)",
        "category": "yantra",
        "description": "धन के देवता यक्षराज कुबेर का सिद्ध महायंत्र। तिजोरी, गल्ले या कार्यालय में रखने से धन संचय, अप्रत्याशित धन लाभ व व्यापारिक रुकावटें दूर होती हैं।",
        "material": "ठोस पीतल (Heavy Brass) 24K गोल्ड फिनिश",
        "origin": "उज्जैन",
        "price": 599.0,
        "original_price": 1199.0,
        "stock": 35,
        "rating": 0.0,
        "review_count": 0,
        "image_url": "/assets/img/products/kuber-yantra.jpg",
        "is_energized": True,
        "energized_details": "कुबेर बीज मंत्र (ॐ यक्षाय कुबेराय वैश्रवणाय धनधान्याधिपतये नमः) से सिद्ध",
        "has_lab_certificate": True,
        "certificate_url": "https://example.com/certs/kuber-yantra.pdf"
    },
    {
        "seller_name": "पं. रामेश्वर द्विवेदी (काशी)",
        "title": "मूल 7-मुखी नेपाली रुद्राक्ष (Silver Capped Pendant)",
        "category": "rudraksha",
        "description": "देवी महालक्ष्मी का साक्षात स्वरूप। शनि की साढ़ेसाती, नौकरी में पदोन्नति, आर्थिक संकट से मुक्ति व यश प्राप्ति हेतु अत्यंत प्रभावशाली।",
        "material": "नेपाली 7-मुखी रुद्राक्ष, 925 स्टर्लिंग चांदी",
        "origin": "नेपाल",
        "price": 899.0,
        "original_price": 1599.0,
        "stock": 25,
        "rating": 0.0,
        "review_count": 0,
        "image_url": "/assets/img/products/rudraksha-7.jpg",
        "is_energized": True,
        "energized_details": "श्रीसूक्त व कनकधारा मंत्रों से 108 बार अभिमंत्रित",
        "has_lab_certificate": True,
        "certificate_url": "https://example.com/certs/rudraksha-7m.pdf"
    },
    {
        "seller_name": "आचार्य विद्याधर शास्त्री",
        "title": "सिद्ध प्राकृतिक दक्षिणवर्ती शंख (Natural Dakshinavarti Shankh)",
        "category": "samagri",
        "description": "समुद्र मंथन से उत्पन्न माता लक्ष्मी का सहोदर भ्राता। घर में जल भरकर रखने व छिड़कने से स्थिर लक्ष्मी, शांति व सकारात्मक ऊर्जा का वास होता है।",
        "material": "100% प्राकृतिक दुर्लभ दक्षिणवर्ती शंख",
        "origin": "रामेश्वरम तट",
        "price": 1450.0,
        "original_price": 2800.0,
        "stock": 15,
        "rating": 0.0,
        "review_count": 0,
        "image_url": "/assets/img/products/shankh.jpg",
        "is_energized": True,
        "energized_details": "लक्ष्मी गायत्री मंत्र व गंगाजल से प्राण-प्रतिष्ठित",
        "has_lab_certificate": True,
        "certificate_url": "https://example.com/certs/shankh.pdf"
    },
    {
        "seller_name": "महाकाल वैदिक आश्रम (उज्जैन)",
        "title": "प्राकृतिक 108 मणकों की कमलगट्टा माला (Lotus Seed Mala)",
        "category": "mala",
        "description": "कमल के बीज से बनी अत्यंत पवित्र माला। मां महालक्ष्मी की प्रसन्नता, कर्ज से मुक्ति व दीपावली पूजन में विशेष जप हेतु शास्त्रसम्मत।",
        "material": "100% प्राकृतिक कमलगट्टा दाने",
        "origin": "मध्य प्रदेश",
        "price": 399.0,
        "original_price": 799.0,
        "stock": 50,
        "rating": 0.0,
        "review_count": 0,
        "image_url": "/assets/img/products/kamalgatta-mala.jpg",
        "is_energized": True,
        "energized_details": "ॐ श्रीं ह्रीं क्लीं कमले कमलालये प्रसीद प्रसीद मंत्र से सिद्ध",
        "has_lab_certificate": True,
        "certificate_url": "https://example.com/certs/kamalgatta.pdf"
    },
    {
        "seller_name": "पं. शिवचरण जोशी (हरिद्वार)",
        "title": "सर्वकष्ट निवारक पंचमुखी हनुमान लॉकेट (Pure Silver)",
        "category": "yantra",
        "description": "पंचमुखी हनुमान जी का सिद्ध रक्षा कवच। भूत-प्रेत बाधा, शत्रु भय, दुर्घटनाओं से रक्षा एवं आत्मविश्वास में वृद्धि हेतु अत्यंत चमत्कारी।",
        "material": "92.5% शुद्ध स्टर्लिंग चांदी",
        "origin": "हरिद्वार",
        "price": 750.0,
        "original_price": 1400.0,
        "stock": 35,
        "rating": 0.0,
        "review_count": 0,
        "image_url": "/assets/img/products/hanuman-locket.jpg",
        "is_energized": True,
        "energized_details": "हनुमान बाहुक एवं 108 हनुमान चालीसा पाठ से सिद्ध",
        "has_lab_certificate": True,
        "certificate_url": "https://example.com/certs/hanuman-silver.pdf"
    }
]


catalog_i18n.register_products(INITIAL_PRODUCTS)

SEED_SELLER_ID = "seller-seed-1"
COMMISSION_RATE = 0.10          # share of each delivered order kept by the platform
RETURN_WINDOWS = {"gemstone": 2, "default": 7}   # days after delivery in which a return can be requested

# Variants for starter items (key = Hindi title as stored). Price deltas are relative to the listed price.
SEED_OPTIONS = {
    "मूल जाम्बियन पन्ना रत्न (Natural Emerald 4.25 Ratti)": [
        {"key": "ratti", "label_en": "Weight (ratti)", "label_hi": "वज़न (रत्ती)", "values": [
            {"value": "3.25", "label_en": "3.25 ratti", "label_hi": "3.25 रत्ती", "price_delta": -800},
            {"value": "4.25", "label_en": "4.25 ratti", "label_hi": "4.25 रत्ती", "price_delta": 0},
            {"value": "5.25", "label_en": "5.25 ratti", "label_hi": "5.25 रत्ती", "price_delta": 1200},
            {"value": "6.25", "label_en": "6.25 ratti", "label_hi": "6.25 रत्ती", "price_delta": 2400}]},
        {"key": "metal", "label_en": "Ring metal", "label_hi": "अंगूठी की धातु", "values": [
            {"value": "silver", "label_en": "Silver", "label_hi": "चांदी", "price_delta": 0},
            {"value": "panchdhatu", "label_en": "Panchdhatu", "label_hi": "पंचधातु", "price_delta": 400},
            {"value": "gold18", "label_en": "Gold 18K", "label_hi": "सोना 18K", "price_delta": 3500}]},
    ],
}

GEMSTONE_FINGER = {"en": "Traditionally worn on the little finger (kanishtha) of the right hand on a Wednesday morning.",
                   "hi": "परंपरा के अनुसार बुधवार प्रातः दाहिने हाथ की कनिष्ठा उंगली में धारण किया जाता है।"}


def seed_products_if_empty(db: Session):
    """Seeds the starter catalog; existing starter items only get their photo refreshed."""
    try:
        for p_data in INITIAL_PRODUCTS:
            existing = db.query(MarketplaceProduct).filter(MarketplaceProduct.title == p_data["title"]).first()
            if existing:
                # Starter items from older releases have no seller id; bring them in line with the current catalog.
                if existing.seller_id in (None, SEED_SELLER_ID):
                    existing.seller_id = SEED_SELLER_ID
                    existing.image_url = p_data.get("image_url")
                    if existing.review_count and not db.query(MarketplaceReview.id).filter(MarketplaceReview.product_id == existing.id).first():
                        existing.rating, existing.review_count = 0.0, 0  # invented starter ratings
                    if existing.certificate_url and "example.com" in existing.certificate_url:
                        existing.has_lab_certificate, existing.certificate_url = False, None
                    if not existing.option_groups and p_data["title"] in SEED_OPTIONS:
                        existing.option_groups = json.dumps(SEED_OPTIONS[p_data["title"]], ensure_ascii=False)
                    if not existing.return_days:
                        existing.return_days = RETURN_WINDOWS.get(existing.category, RETURN_WINDOWS["default"])
                continue
            db.add(MarketplaceProduct(
                seller_id=SEED_SELLER_ID,
                seller_name=p_data["seller_name"],
                title=p_data["title"],
                category=p_data["category"],
                description=p_data["description"],
                material=p_data.get("material"),
                origin=p_data.get("origin"),
                price=p_data["price"],
                original_price=p_data.get("original_price", p_data["price"] * 1.5),
                stock=p_data.get("stock", 20),
                rating=0.0,
                review_count=0,
                image_url=p_data.get("image_url"),
                is_energized=p_data.get("is_energized", True),
                energized_details=p_data.get("energized_details"),
                has_lab_certificate=False,  # flipped on only once a real certificate is verified
                certificate_url=None,
                option_groups=json.dumps(SEED_OPTIONS[p_data["title"]], ensure_ascii=False) if p_data["title"] in SEED_OPTIONS else None,
                return_days=RETURN_WINDOWS.get(p_data["category"], RETURN_WINDOWS["default"]),
                is_active=True,
            ))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Seed Products Notice] {e}")


# ----------------- Schemas -----------------
CATEGORIES = {"rudraksha", "mala", "yantra", "gemstone", "samagri"}
ORDER_FLOW = ["PLACED", "PAID", "ENERGIZING", "DISPATCHED", "DELIVERED"]
DEFAULT_IMAGE = "/assets/img/products/rudraksha-5.jpg"
UPLOAD_DIR = Path(__file__).resolve().parents[4] / "storage" / "uploads" / "products"
CERT_DIR = Path(__file__).resolve().parents[4] / "storage" / "uploads" / "certificates"
UPLOAD_URL_PREFIX = "/uploads/products/"
MAX_IMAGE_BYTES = 6 * 1024 * 1024


class CartItem(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1, le=10)
    options: Dict[str, str] = Field(default_factory=dict)


class BuyerDetails(BaseModel):
    buyer_name: str = Field(..., min_length=2, max_length=100)
    buyer_phone: str = Field(..., min_length=10, max_length=20)
    buyer_gotra: Optional[str] = Field("कश्यप", max_length=100)
    shipping_address: str = Field(..., min_length=5, max_length=500)
    payment_method: Optional[str] = "COD"  # COD or WALLET
    coupon_code: Optional[str] = Field(None, max_length=30)
    use_points: int = Field(0, ge=0, le=100000)
    gemstone_ack: bool = False


class CreateOrderRequest(BuyerDetails):
    product_id: str
    quantity: int = Field(default=1, ge=1, le=10)
    options: Dict[str, str] = Field(default_factory=dict)


class CheckoutRequest(BuyerDetails):
    items: List[CartItem] = Field(..., min_length=1, max_length=20)


class QuoteRequest(BaseModel):
    items: List[CartItem] = Field(..., min_length=1, max_length=20)
    coupon_code: Optional[str] = Field(None, max_length=30)
    use_points: int = Field(0, ge=0, le=100000)


class AddProductRequest(BaseModel):
    seller_name: str = Field(..., min_length=2, max_length=255)
    title: str = Field(..., min_length=3, max_length=255)
    category: str
    description: str = Field(..., min_length=10)
    price: float = Field(..., gt=0)
    original_price: Optional[float] = Field(None, gt=0)
    stock: int = Field(10, ge=1, le=10000)
    image_url: Optional[str] = Field(None, max_length=1024)
    extra_images: List[str] = Field(default_factory=list, max_length=5)
    material: Optional[str] = Field(None, max_length=100)
    origin: Optional[str] = Field(None, max_length=100)
    energized_details: Optional[str] = Field(None, max_length=255)


class OrderStatusUpdate(BaseModel):
    status: str
    tracking_id: Optional[str] = Field(None, max_length=100)


class ReviewRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)


class ReturnRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=300)


def _is_hi(lang: Optional[str]) -> bool:
    return (lang or "").lower().startswith("hi")


def _hi_clean(text: Optional[str], lang: Optional[str]) -> Optional[str]:
    """Hindi mode: drop trailing English brackets such as '(Natural Beryl Emerald)' from stored Hindi text."""
    if not text or not _is_hi(lang):
        return text
    import re
    return re.sub(r"\s*\([A-Za-z0-9 .,\-/&']+\)\s*$", "", text)


def _jload(text: Optional[str], default):
    try:
        return json.loads(text) if text else default
    except ValueError:
        return default


def _review_stats(db: Session, product_ids: List[str]) -> Dict[str, tuple]:
    if not product_ids:
        return {}
    rows = (db.query(MarketplaceReview.product_id, func.avg(MarketplaceReview.rating), func.count(MarketplaceReview.id))
            .filter(MarketplaceReview.product_id.in_(product_ids)).group_by(MarketplaceReview.product_id).all())
    return {pid: (round(float(avg), 1), int(cnt)) for pid, avg, cnt in rows}


def _options_for(p: MarketplaceProduct, lang: Optional[str]) -> List[Dict[str, Any]]:
    hindi = _is_hi(lang)
    groups = []
    for g in _jload(p.option_groups, []):
        groups.append({
            "key": g["key"], "label": g["label_hi"] if hindi else g["label_en"],
            "values": [{"value": v["value"], "label": v["label_hi"] if hindi else v["label_en"], "price_delta": v.get("price_delta", 0)}
                       for v in g["values"]],
        })
    return groups


def _return_policy(p: MarketplaceProduct, lang: Optional[str]) -> Dict[str, Any]:
    days = p.return_days if p.return_days is not None else RETURN_WINDOWS.get(p.category, RETURN_WINDOWS["default"])
    hindi = _is_hi(lang)
    if p.category == "gemstone":
        text = ("रत्न व्यक्तिगत रूप से अभिमंत्रित व कस्टम-फिट होते हैं, इसलिए वापसी केवल क्षतिग्रस्त, गलत या प्रमाणपत्र से भिन्न रत्न पर और डिलीवरी के "
                f"{days} दिन के भीतर मान्य है। धारण से पहले अपने ज्योतिषी से परामर्श करें।") if hindi else (
            "Gemstones are energized and fitted for you, so returns are accepted only for a damaged, wrong or certificate-mismatched stone, "
            f"within {days} days of delivery. Please consult your astrologer before wearing a gemstone.")
    else:
        text = (f"अभिमंत्रित सामग्री की वापसी केवल क्षतिग्रस्त या गलत सामग्री पर, डिलीवरी के {days} दिन के भीतर मान्य है।") if hindi else (
            f"As items are energized for you, returns are accepted only for damaged or wrong items, within {days} days of delivery.")
    return {"days": days, "text": text, "gemstone_notice": p.category == "gemstone"}


def _certificate_info(p: MarketplaceProduct) -> Optional[Dict[str, Any]]:
    if p.certificate_status != "VERIFIED" or not p.certificate_code:
        return None
    return {"code": p.certificate_code, "lab": p.certificate_lab, "number": p.certificate_number, "file": p.certificate_file}


def _product_dict(p: MarketplaceProduct, stats: Optional[Dict[str, tuple]] = None, lang: Optional[str] = None,
                  detail: bool = False) -> Dict[str, Any]:
    en = catalog_i18n.product_en(p.title) if catalog_i18n.is_en(lang) else None
    disc = 0
    if p.original_price and p.original_price > p.price:
        disc = int(round((p.original_price - p.price) / p.original_price * 100))
    avg, count = (stats or {}).get(p.id, (None, 0))
    cert = _certificate_info(p)
    data = {
        "id": p.id,
        "seller_name": catalog_i18n.SELLERS_EN.get(p.seller_name, p.seller_name) if catalog_i18n.is_en(lang) else p.seller_name,
        "title": en["title"] if en else (catalog_i18n.hi_title(p.title) if _is_hi(lang) else p.title),
        "category": p.category,
        "description": en["description"] if en else p.description,
        "material": en["material"] if en else _hi_clean(p.material, lang),
        "origin": en["origin"] if en else _hi_clean(p.origin, lang),
        "price": p.price,
        "original_price": p.original_price,
        "discount_percent": disc,
        "stock": p.stock,
        "in_stock": (p.stock or 0) > 0,
        "rating": avg,
        "review_count": count,
        "image_url": p.image_url or DEFAULT_IMAGE,
        "is_energized": p.is_energized,
        "energized_details": en["energized"] if en else _hi_clean(p.energized_details, lang),
        "has_lab_certificate": cert is not None,
        "certificate_url": (cert or {}).get("file"),
        "has_options": bool(p.option_groups),
    }
    if detail:
        data.update({
            "images": [p.image_url or DEFAULT_IMAGE] + [u for u in _jload(p.extra_images, []) if u],
            "options": _options_for(p, lang),
            "certificate": cert,
            "return_policy": _return_policy(p, lang),
            "finger_note": GEMSTONE_FINGER["hi" if _is_hi(lang) else "en"] if p.category == "gemstone" and en else None,
            "seller_id": p.seller_id,
        })
    return data


def _order_dict(o: MarketplaceOrder, lang: Optional[str] = None) -> Dict[str, Any]:
    en = catalog_i18n.product_en(o.product.title) if (o.product and catalog_i18n.is_en(lang)) else None
    title = (en["title"] if en else (catalog_i18n.hi_title(o.product.title) if _is_hi(lang) else o.product.title)) if o.product else "Energized item"
    return {
        "id": o.id,
        "order_number": o.order_number,
        "product_id": o.product_id,
        "product_title": title,
        "product_image": (o.product.image_url if o.product else None) or DEFAULT_IMAGE,
        "quantity": o.quantity,
        "unit_price": o.unit_price,
        "total_price": o.total_price,
        "discount_amount": o.discount_amount or 0.0,
        "options": _jload(o.options, {}),
        "options_label": _option_label(o.product, _jload(o.options, {}), lang) if o.product else "",
        "buyer_name": o.buyer_name,
        "buyer_gotra": o.buyer_gotra,
        "payment_method": o.payment_method,
        "status": o.order_status,
        "energization_status": o.energization_status,
        "tracking_id": o.tracking_id,
        "created_at": str(o.created_at),
    }


def _option_label(p: MarketplaceProduct, chosen: Dict[str, str], lang: Optional[str]) -> str:
    if not chosen:
        return ""
    bits = []
    for g in _options_for(p, lang):
        val = chosen.get(g["key"])
        match = next((v["label"] for v in g["values"] if v["value"] == val), None)
        if match:
            bits.append(f"{g['label']}: {match}")
    return ", ".join(bits)


def require_admin(user: Optional[User] = Depends(get_current_user_optional)) -> User:
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def approved_seller(db: Session, user: User) -> SellerProfile:
    profile = db.query(SellerProfile).filter(SellerProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=403, detail="Register as a seller and complete KYC before listing products")
    if profile.kyc_status != "APPROVED":
        raise HTTPException(status_code=403, detail="Your seller KYC is not approved yet")
    return profile


# ----------------- Catalog -----------------

@router.get("/products")
def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "popular",
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    in_stock: bool = False,
    lang: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lists approved items with filters and live stock; rating is the real average of verified reviews."""
    seed_products_if_empty(db)
    query = db.query(MarketplaceProduct).filter(MarketplaceProduct.is_active == True)  # noqa: E712
    if category and category != "all":
        query = query.filter(MarketplaceProduct.category == category)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter((MarketplaceProduct.title.ilike(like)) | (MarketplaceProduct.description.ilike(like))
                             | (MarketplaceProduct.seller_name.ilike(like)))
    if min_price is not None:
        query = query.filter(MarketplaceProduct.price >= min_price)
    if max_price is not None:
        query = query.filter(MarketplaceProduct.price <= max_price)
    if in_stock:
        query = query.filter(MarketplaceProduct.stock > 0)

    prods = query.all()
    stats = _review_stats(db, [p.id for p in prods])
    if sort_by == "price_asc":
        prods.sort(key=lambda p: p.price)
    elif sort_by == "price_desc":
        prods.sort(key=lambda p: -p.price)
    elif sort_by == "newest":
        prods.sort(key=lambda p: p.created_at or 0, reverse=True)
    else:  # popular: best reviewed first, then most reviewed, then in-stock
        prods.sort(key=lambda p: (-(stats.get(p.id, (0, 0))[0] or 0), -stats.get(p.id, (0, 0))[1], -(p.stock or 0)))
    results = [_product_dict(p, stats, lang) for p in prods]
    return {"products": results, "total": len(results)}


@router.get("/products/{product_id}")
def get_product(product_id: str, lang: Optional[str] = None, db: Session = Depends(get_db)):
    """Everything the product page needs: gallery, variants, certificate, return policy, seller."""
    prod = db.query(MarketplaceProduct).filter(
        MarketplaceProduct.id == product_id, MarketplaceProduct.is_active == True  # noqa: E712
    ).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    data = _product_dict(prod, _review_stats(db, [prod.id]), lang, detail=True)
    profile = db.query(SellerProfile).filter(SellerProfile.user_id == prod.seller_id).first() if prod.seller_id else None
    data["seller"] = {"name": data["seller_name"], "verified": bool(profile and profile.kyc_status == "APPROVED")}
    rows = (db.query(MarketplaceReview.rating, func.count()).filter(MarketplaceReview.product_id == prod.id)
            .group_by(MarketplaceReview.rating).all())
    data["rating_breakdown"] = {str(r): c for r, c in rows}
    return data


@router.get("/products/{product_id}/related")
def related_products(product_id: str, lang: Optional[str] = None, db: Session = Depends(get_db)):
    prod = db.query(MarketplaceProduct).filter(MarketplaceProduct.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    rows = (db.query(MarketplaceProduct).filter(MarketplaceProduct.category == prod.category, MarketplaceProduct.id != prod.id,
                                                MarketplaceProduct.is_active == True).limit(4).all())  # noqa: E712
    stats = _review_stats(db, [p.id for p in rows])
    return {"products": [_product_dict(p, stats, lang) for p in rows]}


@router.get("/products/{product_id}/reviews")
def list_reviews(product_id: str, db: Session = Depends(get_db)):
    rows = (db.query(MarketplaceReview).filter(MarketplaceReview.product_id == product_id)
            .order_by(MarketplaceReview.created_at.desc()).limit(50).all())
    return {"reviews": [{"id": r.id, "reviewer_name": r.reviewer_name, "rating": r.rating, "comment": r.comment,
                         "created_at": str(r.created_at)} for r in rows], "total": len(rows)}


@router.post("/products/{product_id}/reviews")
def add_review(
    product_id: str,
    req: ReviewRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Only a buyer whose order for this item was delivered can review it (one review per buyer)."""
    order = (db.query(MarketplaceOrder).filter(
        MarketplaceOrder.product_id == product_id, MarketplaceOrder.owner_key == f"u:{user.id}",
        MarketplaceOrder.order_status == "DELIVERED").order_by(MarketplaceOrder.created_at.desc()).first())
    if not order:
        raise HTTPException(status_code=403, detail="You can review an item once your order for it has been delivered")
    review = db.query(MarketplaceReview).filter(
        MarketplaceReview.product_id == product_id, MarketplaceReview.owner_key == f"u:{user.id}").first()
    if review:
        review.rating, review.comment = req.rating, (req.comment or "").strip() or None
    else:
        db.add(MarketplaceReview(product_id=product_id, order_id=order.id, user_id=user.id, owner_key=f"u:{user.id}",
                                 reviewer_name=order.buyer_name, rating=req.rating, comment=(req.comment or "").strip() or None))
    db.commit()
    stats = _review_stats(db, [product_id]).get(product_id, (None, 0))
    return {"success": True, "rating": stats[0], "review_count": stats[1]}


# ----------------- Pricing, quote & checkout -----------------

def _price_items(db: Session, items: List[CartItem]) -> List[Dict[str, Any]]:
    """Validates products, options and stock; returns priced lines. Identical items are merged."""
    merged: Dict[tuple, Dict[str, Any]] = {}
    for it in items:
        key = (it.product_id, json.dumps(it.options, sort_keys=True))
        if key in merged:
            merged[key]["qty"] = min(10, merged[key]["qty"] + it.quantity)
        else:
            merged[key] = {"product_id": it.product_id, "qty": it.quantity, "options": dict(it.options)}
    products = {p.id: p for p in db.query(MarketplaceProduct).filter(
        MarketplaceProduct.id.in_({k[0] for k in merged}), MarketplaceProduct.is_active == True).all()}  # noqa: E712
    lines = []
    for line in merged.values():
        prod = products.get(line["product_id"])
        if not prod:
            raise HTTPException(status_code=404, detail="One of the items is no longer available")
        unit, chosen = prod.price, {}
        for g in _jload(prod.option_groups, []):
            selected = line["options"].get(g["key"])
            value = next((v for v in g["values"] if v["value"] == selected), None)
            if not value:
                raise HTTPException(status_code=400, detail=f"Please choose {g['label_en'].lower()} for '{prod.title}'")
            unit += value.get("price_delta", 0)
            chosen[g["key"]] = value["value"]
        lines.append({"product": prod, "qty": line["qty"], "options": chosen, "unit": round(unit, 2), "total": round(unit * line["qty"], 2)})
    return lines


def _public_totals(t: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in t.items() if k != "coupon"}


@router.post("/quote")
def quote_cart(
    req: QuoteRequest,
    lang: Optional[str] = None,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    """Prices a cart. Coupons and points need a signed-in user; the plain subtotal does not."""
    lines = _price_items(db, req.items)
    subtotal = sum(l["total"] for l in lines)
    if user:
        totals = _public_totals(compute_totals(db, user, "mall", subtotal, req.coupon_code, req.use_points))
    else:
        if req.coupon_code:
            raise HTTPException(status_code=401, detail="Please sign in to use a coupon")
        totals = {"subtotal": subtotal, "member_discount": 0.0, "coupon_code": None, "coupon_discount": 0.0, "points_used": 0,
                  "points_value": 0.0, "delivery_fee": 0.0, "delivery_waived": False, "total": subtotal, "is_member": False, "earn_points": 0}
    return {"lines": [{"product_id": l["product"].id, "title": _product_dict(l["product"], None, lang)["title"], "quantity": l["qty"],
                       "options": l["options"], "options_label": _option_label(l["product"], l["options"], lang),
                       "unit_price": l["unit"], "line_total": l["total"], "image_url": l["product"].image_url,
                       "in_stock": l["product"].stock >= l["qty"]} for l in lines],
            "totals": totals, "has_gemstone": any(l["product"].category == "gemstone" for l in lines)}


def _split(total: float, weights: List[float], digits: int = 2) -> List[float]:
    """Splits `total` proportionally to `weights`; the last share absorbs rounding."""
    if not weights or sum(weights) == 0:
        return [0.0] * len(weights)
    shares = [round(total * w / sum(weights), digits) for w in weights]
    shares[-1] = round(total - sum(shares[:-1]), digits)
    return shares


def _place_orders(db: Session, user: User, items: List[CartItem], buyer: BuyerDetails) -> tuple:
    """Reserves stock for every item, charges the wallet once and creates one order per item (all or nothing)."""
    method = (buyer.payment_method or "COD").upper()
    if method not in ("COD", "WALLET"):
        raise HTTPException(status_code=400, detail="Payment method must be COD or WALLET")
    lines = _price_items(db, items)
    if any(l["product"].category == "gemstone" for l in lines) and not buyer.gemstone_ack:
        raise HTTPException(status_code=400, detail="Please confirm the gemstone advice and return policy before ordering")

    subtotal = round(sum(l["total"] for l in lines), 2)
    totals = compute_totals(db, user, "mall", subtotal, buyer.coupon_code, buyer.use_points)
    group = f"CART-{generate_uuid()[:8].upper()}"
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")

    for l in lines:
        reserved = db.query(MarketplaceProduct).filter(
            MarketplaceProduct.id == l["product"].id, MarketplaceProduct.stock >= l["qty"]
        ).update({MarketplaceProduct.stock: MarketplaceProduct.stock - l["qty"]}, synchronize_session=False)
        if not reserved:
            raise HTTPException(status_code=409, detail=f"'{l['product'].title}' is out of stock or has fewer pieces than requested")

    pay_ref = None
    if method == "WALLET" and totals["total"] > 0:
        method, pay_ref = charge_wallet(db, user.id, totals["total"], f"Astro Mall order ({len(lines)} item(s))", "MALL")
    status = "PAID" if method in ("WALLET", "TEST") else "PLACED"

    discount_pool = round(subtotal - totals["total"], 2)
    discounts = _split(discount_pool, [l["total"] for l in lines])
    points = [int(x) for x in _split(totals["points_used"], [l["total"] for l in lines], 0)]
    orders = []
    for l, disc, pts in zip(lines, discounts, points):
        prod = l["product"]
        order = MarketplaceOrder(
            product_id=prod.id, user_id=user.id, owner_key=f"u:{user.id}",
            order_number=f"ASTRO-MALL-{stamp}-{random.randint(100000, 999999)}",
            buyer_name=buyer.buyer_name.strip(), buyer_phone=buyer.buyer_phone.strip(),
            buyer_gotra=(buyer.buyer_gotra or "कश्यप").strip(), shipping_address=buyer.shipping_address.strip(),
            quantity=l["qty"], unit_price=l["unit"], total_price=round(l["total"] - disc, 2), group_ref=group,
            options=json.dumps(l["options"], ensure_ascii=False) if l["options"] else None,
            discount_amount=disc, points_used=pts, coupon_code=totals["coupon_code"],
            seller_id=prod.seller_id if prod.seller_id != SEED_SELLER_ID else None,
            payment_method=method, payment_ref=pay_ref, order_status=status, energization_status="UNDER_PROCESS",
        )
        db.add(order)
        db.flush()
        orders.append(order)
        record_event(db, "order", order.id, "PLACED", f"{prod.title} x {l['qty']}")
        if status == "PAID":
            record_event(db, "order", order.id, "PAID", f"{method} ₹{order.total_price:.0f}")
        if order.seller_id:
            notify(db, f"u:{order.seller_id}", "seller_order", "/seller", ref=order.order_number, title=prod.title, qty=l["qty"])
    apply_totals(db, user, totals, group, "mall")
    notify(db, f"u:{user.id}", "order_placed", "/astro-mall", count=len(orders), total=f"{totals['total']:.0f}")
    return orders, totals


def _commit_orders(db: Session, user: User, items: List[CartItem], buyer: BuyerDetails):
    try:
        orders, totals = _place_orders(db, user, items, buyer)
        db.commit()
        for o in orders:
            db.refresh(o)
        return orders, totals
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Order could not be saved: {e}")


@router.post("/order")
def create_order(
    req: CreateOrderRequest,
    lang: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Single-item order (Buy Now). Requires sign-in."""
    orders, totals = _commit_orders(db, user, [CartItem(product_id=req.product_id, quantity=req.quantity, options=req.options)], req)
    order = orders[0]
    return {"success": True, "order": _order_dict(order, lang), "totals": _public_totals(totals)}


@router.post("/checkout")
def checkout_cart(
    req: CheckoutRequest,
    lang: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Cart checkout: every item ordered together, paid once. Requires sign-in."""
    orders, totals = _commit_orders(db, user, req.items, req)
    return {"success": True, "total": totals["total"], "totals": _public_totals(totals), "orders": [_order_dict(o, lang) for o in orders]}


# ----------------- My orders, tracking, cancel, return -----------------

@router.get("/my-orders")
def get_my_orders(
    lang: Optional[str] = None,
    db: Session = Depends(get_db),
    owner: Optional[Owner] = Depends(optional_owner)
):
    """The signed-in user's orders (empty list when not signed in)."""
    if owner is None or owner.is_guest:
        return {"orders": [], "total": 0}
    orders = (db.query(MarketplaceOrder).filter(MarketplaceOrder.owner_key == owner.key)
              .order_by(MarketplaceOrder.created_at.desc()).limit(100).all())
    reviewed = {r.product_id for r in db.query(MarketplaceReview.product_id).filter(MarketplaceReview.owner_key == owner.key)}
    results = [dict(_order_dict(o, lang), reviewed=o.product_id in reviewed) for o in orders]
    return {"orders": results, "total": len(results)}


def _order_for(db: Session, order_id: str, user: User) -> MarketplaceOrder:
    order = db.query(MarketplaceOrder).filter(MarketplaceOrder.id == order_id).first()
    if not order or (user.role != "admin" and order.owner_key != f"u:{user.id}" and order.seller_id != user.id):
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/orders/{order_id}/tracking")
def order_tracking_view(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    return order_tracking(db, _order_for(db, order_id, user))


@router.post("/orders/{order_id}/cancel")
def cancel_my_order(
    order_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Cancels an order that has not started energization; restores stock and refunds the wallet and points."""
    order = db.query(MarketplaceOrder).filter(MarketplaceOrder.id == order_id, MarketplaceOrder.owner_key == f"u:{user.id}").first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.order_status not in ("PLACED", "PAID"):
        raise HTTPException(status_code=409, detail="Order can no longer be cancelled")
    order.order_status = "CANCELLED"
    db.query(MarketplaceProduct).filter(MarketplaceProduct.id == order.product_id).update(
        {MarketplaceProduct.stock: MarketplaceProduct.stock + order.quantity}, synchronize_session=False)
    if order.payment_method == "WALLET" and order.total_price:
        refund_wallet(db, order.user_id, order.total_price, f"Refund {order.order_number}")
    refund_points(db, order.user_id, order.points_used or 0, order.order_number)
    record_event(db, "order", order.id, "CANCELLED", "Cancelled by the buyer")
    notify(db, order.owner_key, "order_cancelled", "/astro-mall", ref=order.order_number)
    db.commit()
    return {"success": True, "order": _order_dict(order)}


@router.post("/orders/{order_id}/return")
def request_return(
    order_id: str,
    req: ReturnRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Asks for a return of a delivered order inside the product's return window (damaged / wrong item)."""
    order = db.query(MarketplaceOrder).filter(MarketplaceOrder.id == order_id, MarketplaceOrder.owner_key == f"u:{user.id}").first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.order_status != "DELIVERED":
        raise HTTPException(status_code=409, detail="Only a delivered order can be returned")
    days = (order.product.return_days if order.product and order.product.return_days is not None else RETURN_WINDOWS["default"])
    delivered = db.query(StatusEvent).filter(StatusEvent.kind == "order", StatusEvent.ref_id == order.id, StatusEvent.status == "DELIVERED").first()
    since = (delivered.created_at if delivered else order.created_at)
    since = since if since.tzinfo else since.replace(tzinfo=timezone.utc)
    if (datetime.now(timezone.utc) - since).days > days:
        raise HTTPException(status_code=409, detail=f"The {days}-day return window for this item has passed")
    order.order_status = "RETURN_REQUESTED"
    record_event(db, "order", order.id, "RETURN_REQUESTED", req.reason.strip())
    notify(db, order.owner_key, "order_return", "/astro-mall", ref=order.order_number)
    db.commit()
    return {"success": True, "order": _order_dict(order)}


# ----------------- Order progress shared by admin and sellers -----------------

def advance_order(db: Session, order: MarketplaceOrder, status: str, tracking_id: Optional[str] = None) -> None:
    """Moves an order forward, writes the timeline, notifies the buyer and settles seller earnings on delivery."""
    if status not in ORDER_FLOW:
        raise HTTPException(status_code=400, detail=f"Status must be one of {ORDER_FLOW}")
    if order.order_status in ("CANCELLED", "RETURN_REQUESTED"):
        raise HTTPException(status_code=409, detail="Order is cancelled or under return")
    if status == "DISPATCHED" and not (tracking_id or order.tracking_id):
        raise HTTPException(status_code=400, detail="tracking_id is required to dispatch")
    was_delivered = order.order_status == "DELIVERED"
    order.order_status = status
    if status in ("DISPATCHED", "DELIVERED"):
        order.energization_status = "ENERGIZED"
    if tracking_id:
        order.tracking_id = tracking_id
    record_event(db, "order", order.id, status, order.tracking_id or "")
    kinds = {"ENERGIZING": "order_energizing", "DISPATCHED": "order_dispatched", "DELIVERED": "order_delivered"}
    if status in kinds:
        notify(db, order.owner_key, kinds[status], "/astro-mall", ref=order.order_number, tracking=order.tracking_id or "")
    if status == "DELIVERED" and not was_delivered:
        commission = round((order.total_price or 0) * COMMISSION_RATE, 2) if order.seller_id else 0.0
        order.commission_amount = commission
        order.seller_amount = round((order.total_price or 0) - commission, 2) if order.seller_id else 0.0
        member = active_membership(db, order.user_id)
        award_points(db, order.user_id, int((order.total_price or 0) // EARN_PER_RUPEES) * (2 if member else 1), "order", order.order_number)
        user = db.query(User).filter(User.id == order.user_id).first() if order.user_id else None
        if user:
            maybe_reward_referral(db, user, order.order_number)


# ----------------- Seller portal: photos & listing -----------------

@router.post("/seller/upload-image")
async def seller_upload_image(
    file: UploadFile = File(...),
    user: Optional[User] = Depends(get_current_user_optional)
):
    """A signed-in seller uploads a product photo. It is verified, re-encoded as JPEG and capped at 1200px."""
    if not user:
        raise HTTPException(status_code=401, detail="Please sign in to upload photos")
    data = await file.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Photo must be 6 MB or smaller")
    try:
        from PIL import Image, ImageOps
        img = Image.open(io.BytesIO(data))
        img.verify()
        img = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Upload a valid JPG, PNG or WebP photo")
    if min(img.size) < 300:
        raise HTTPException(status_code=400, detail="Photo is too small - use at least 300 x 300 pixels")
    img.thumbnail((1200, 1200))
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{generate_uuid()}.jpg"
    img.save(UPLOAD_DIR / name, "JPEG", quality=85, optimize=True)
    return {"url": f"{UPLOAD_URL_PREFIX}{name}"}


def _own_upload(url: Optional[str]) -> bool:
    return bool(url and url.startswith(UPLOAD_URL_PREFIX) and (UPLOAD_DIR / Path(url).name).is_file())


@router.post("/seller/add-product")
def seller_add_product(
    req: AddProductRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    """An approved (KYC) seller lists an item; it goes live only after admin approval."""
    if not user:
        raise HTTPException(status_code=401, detail="Please sign in to list products")
    approved_seller(db, user)
    category = req.category.strip().lower()
    if category not in CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Category must be one of {sorted(CATEGORIES)}")
    if req.original_price is not None and req.original_price < req.price:
        raise HTTPException(status_code=400, detail="original_price cannot be lower than price")
    if req.image_url and not _own_upload(req.image_url):
        raise HTTPException(status_code=400, detail="Upload the photo first, then submit the product")
    if any(not _own_upload(u) for u in req.extra_images):
        raise HTTPException(status_code=400, detail="Upload the photo first, then submit the product")

    prod = MarketplaceProduct(
        seller_id=user.id,
        seller_name=req.seller_name.strip(),
        title=req.title.strip(),
        category=category,
        description=req.description.strip(),
        material=req.material,
        origin=req.origin,
        price=req.price,
        original_price=req.original_price or round(req.price * 1.5),
        stock=req.stock,
        rating=0.0,
        review_count=0,
        image_url=req.image_url or DEFAULT_IMAGE,
        extra_images=json.dumps(req.extra_images) if req.extra_images else None,
        is_energized=True,
        energized_details=req.energized_details or "शास्त्रीय विधि से अभिमंत्रित",
        has_lab_certificate=False,
        return_days=RETURN_WINDOWS.get(category, RETURN_WINDOWS["default"]),
        listing_status="PENDING",
        is_active=False,
    )
    db.add(prod)
    notify(db, f"u:{user.id}", "product_submitted", "/seller", title=prod.title)
    db.commit()
    db.refresh(prod)
    return {"success": True, "product_id": prod.id, "status": "PENDING_APPROVAL"}


@router.get("/seller/my-products")
def seller_my_products(
    lang: Optional[str] = None,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    if not user:
        raise HTTPException(status_code=401, detail="Please sign in")
    prods = (db.query(MarketplaceProduct).filter(MarketplaceProduct.seller_id == user.id)
             .order_by(MarketplaceProduct.created_at.desc()).all())
    stats = _review_stats(db, [p.id for p in prods])
    return {"products": [dict(_product_dict(p, stats, lang), is_active=p.is_active, listing_status=p.listing_status,
                            certificate_status=p.certificate_status) for p in prods], "total": len(prods)}


# ----------------- Kundli based suggestions -----------------

@router.get("/suggestions")
def kundli_suggestions(
    lang: Optional[str] = None,
    db: Session = Depends(get_db),
    owner: Optional[Owner] = Depends(optional_owner)
):
    """Catalog items matching the rashi lord of the visitor's saved kundli (traditional guidance)."""
    chart = None
    if owner is not None:
        chart = (db.query(BirthChart).filter(BirthChart.owner_key == owner.key)
                 .order_by(BirthChart.is_default.desc(), BirthChart.created_at.desc()).first())
    sign = normalize_sign((chart.chart_data or {}).get("moon_sign")) if chart else None
    if not sign:
        return {"has_chart": False, "suggestion": None, "products": []}
    remedy = remedy_for_sign(sign)
    prods = db.query(MarketplaceProduct).filter(MarketplaceProduct.is_active == True, MarketplaceProduct.stock > 0).all()  # noqa: E712
    wanted = [m.lower() for m in remedy["match"]]
    matched = [p for p in prods if any(w in f"{p.title} {p.description}".lower() for w in wanted)][:4]
    stats = _review_stats(db, [p.id for p in matched])
    return {"has_chart": True, "chart_name": chart.name, "suggestion": remedy,
            "products": [_product_dict(p, stats, lang) for p in matched]}


# ----------------- Admin -----------------

@router.patch("/admin/products/{product_id}/approve")
def admin_approve_product(
    product_id: str,
    approve: bool = True,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
):
    prod = db.query(MarketplaceProduct).filter(MarketplaceProduct.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    prod.is_active = approve
    prod.listing_status = "APPROVED" if approve else "REJECTED"
    if prod.seller_id and prod.seller_id != SEED_SELLER_ID:
        notify(db, f"u:{prod.seller_id}", "product_approved" if approve else "product_rejected", "/seller", title=prod.title)
    db.commit()
    return {"success": True, "product": dict(_product_dict(prod), is_active=prod.is_active)}


@router.patch("/admin/orders/{order_id}")
def admin_update_order(
    order_id: str,
    req: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
):
    order = db.query(MarketplaceOrder).filter(MarketplaceOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    advance_order(db, order, req.status.upper(), req.tracking_id)
    db.commit()
    return {"success": True, "order": _order_dict(order)}


@router.get("/admin/orders")
def admin_list_orders(
    status: Optional[str] = None,
    lang: Optional[str] = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
):
    """All orders (newest first) with buyer contact and shipping address."""
    query = db.query(MarketplaceOrder)
    if status and status.upper() != "ALL":
        query = query.filter(MarketplaceOrder.order_status == status.upper())
    rows = []
    for o in query.order_by(MarketplaceOrder.created_at.desc()).limit(200).all():
        rows.append(dict(_order_dict(o, lang), buyer_phone=o.buyer_phone, shipping_address=o.shipping_address,
                         payment_ref=o.payment_ref, group_ref=o.group_ref, seller_id=o.seller_id))
    return {"orders": rows, "total": len(rows)}


@router.get("/admin/products")
def admin_list_products(
    pending: bool = False,
    lang: Optional[str] = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
):
    """Every product including unapproved ones; pending=true shows only those awaiting approval."""
    query = db.query(MarketplaceProduct)
    if pending:
        query = query.filter(MarketplaceProduct.listing_status == "PENDING")
    prods = query.order_by(MarketplaceProduct.created_at.desc()).limit(200).all()
    return {"products": [dict(_product_dict(p, None, lang), is_active=p.is_active, seller_id=p.seller_id, listing_status=p.listing_status,
                              certificate_status=p.certificate_status) for p in prods],
            "total": len(prods)}
