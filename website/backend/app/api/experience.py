"""Premium experience features: personalised daily brief, remedies tracker, gift cards and festival packs.

Everything here is computed from the signed-in user's own saved birth chart and today's panchang. Day-quality
indicators (Chandra Bala, Tara Bala) are the traditional Vedic rules and are shown as guidance, not predictions.
"""
import json
import re
import secrets
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import update
from sqlalchemy.orm import Session

from packages.astrology.horoscope import get_horoscope
from packages.astrology.panchang import calculate_panchang, calculate_sade_sati
from packages.core.notify import notify
from packages.core.remedies import LORD_REMEDY, SIGNS, SIGNS_HI, SIGN_LORDS, WEEKDAY_SEVA
from packages.core.wallet_pay import charge_wallet
from packages.database.models import (
    Astrologer, BirthChart, Consultation, FavouriteAstrologer, ConsultationSummary, Coupon, GiftCard, MarketplaceProduct, RemedyLog, RemedyTask,
    Temple, User, WalletTransaction, generate_uuid, utc_now
)
from packages.database.session import get_db
from website.backend.app.api.auth import get_current_user_required

router = APIRouter(prefix="/experience", tags=["Premium Experience"])

IST = timezone(timedelta(hours=5, minutes=30))
NAKSHATRAS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
              "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula",
              "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
              "Uttara Bhadrapada", "Revati"]
# Tara Bala: counting from the birth star, the 3rd, 5th and 7th tara are unfavourable (Vipat, Pratyak, Naidhana).
TARAS = ["Janma", "Sampat", "Vipat", "Kshema", "Pratyak", "Sadhaka", "Naidhana", "Mitra", "Parama Mitra"]
TARA_BAD = {2, 4, 6}
# Chandra Bala: transit Moon in these houses from the natal Moon is favourable.
CHANDRA_GOOD = {1, 3, 6, 7, 10, 11}
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _today() -> date:
    return datetime.now(IST).date()


def _sign_index(name: Optional[str]) -> Optional[int]:
    base = (name or "").split("(")[0].strip().title()
    return SIGNS.index(base) if base in SIGNS else None


def _nak_index(name: Optional[str]) -> Optional[int]:
    base = (name or "").split("(")[0].strip().lower()
    for i, n in enumerate(NAKSHATRAS):
        if n.lower() == base:
            return i
    return None


def _default_chart(db: Session, user: User) -> Optional[BirthChart]:
    q = db.query(BirthChart).filter(BirthChart.owner_key == f"u:{user.id}")
    return q.order_by(BirthChart.is_default.desc(), BirthChart.created_at.desc()).first()


def _current_dasha(chart_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    today = _today().isoformat()
    for d in chart_data.get("dashas") or []:
        if d.get("start_date", "") <= today < d.get("end_date", ""):
            return {"planet": d["planet"], "start": d["start_date"], "end": d["end_date"]}
    return None


# --------------------------------------------------------------------------------------------- daily brief
@router.get("/daily-brief")
def daily_brief(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """Today's guidance built from the user's default birth chart and today's panchang."""
    chart = _default_chart(db, user)
    panchang = calculate_panchang()
    today = _today()
    weekday = WEEKDAYS[today.weekday()]
    deity_hi, deity_en, temple_slug = WEEKDAY_SEVA[weekday]
    out: Dict[str, Any] = {
        "date": today.isoformat(), "weekday": weekday,
        "panchang": {
            "tithi": panchang["tithi"]["name"], "paksha": panchang["tithi"]["paksha"],
            "nakshatra": panchang["nakshatra"]["name"], "yog": panchang["yog"]["name"], "yog_auspicious": panchang["yog"]["is_auspicious"],
            "moon_sign": panchang["moon_sign"], "sunrise": panchang["timings"]["sunrise"], "sunset": panchang["timings"]["sunset"],
            "rahu_kaal": panchang["timings"]["rahu_kaal"], "abhijit": panchang["timings"]["abhijit_muhurat"],
        },
        "deity": {"en": deity_en, "hi": deity_hi, "temple_slug": temple_slug},
        "has_profile": bool(chart),
    }
    due = 0
    for t in db.query(RemedyTask).filter(RemedyTask.user_id == user.id, RemedyTask.status == "active").all():
        due += 1 if _is_due(t, today) and not _done_on(db, t.id, today) else 0
    out["remedies_due"] = due
    if not chart:
        return out

    cd = chart.chart_data or {}
    moon_sign = (cd.get("moon_sign") or "Aries").split("(")[0].strip().title()
    moon_i, nak_i = _sign_index(moon_sign), _nak_index(cd.get("moon_nakshatra"))
    horo = get_horoscope(moon_sign, "daily")
    score, notes = 55, []

    transit_moon_i = _sign_index(panchang.get("moon_sign"))
    chandra = None
    if moon_i is not None and transit_moon_i is not None:
        house = (transit_moon_i - moon_i) % 12 + 1
        good = house in CHANDRA_GOOD
        chandra = {"house": house, "favourable": good}
        score += 15 if good else -10
    tara = None
    transit_nak_i = _nak_index(panchang["nakshatra"]["name"])
    if nak_i is not None and transit_nak_i is not None:
        idx = (transit_nak_i - nak_i) % 27 % 9
        good = idx not in TARA_BAD
        tara = {"name": TARAS[idx], "favourable": good}
        score += 12 if good else -12
    score += 8 if panchang["yog"]["is_auspicious"] else -5
    score = max(20, min(96, score))

    sade = calculate_sade_sati(moon_sign)
    if sade.get("is_sade_sati"):
        score = max(20, score - 6)
    lord = SIGN_LORDS[moon_i] if moon_i is not None else "Sun"
    out.update({
        "profile": {"name": chart.name, "moon_sign": moon_sign, "moon_sign_hi": SIGNS_HI[moon_i] if moon_i is not None else moon_sign,
                    "ascendant": cd.get("ascendant_sign"), "nakshatra": cd.get("moon_nakshatra"), "lord": lord},
        "dasha": _current_dasha(cd),
        "chandra_bala": chandra, "tara_bala": tara,
        "sade_sati": {"active": bool(sade.get("is_sade_sati")), "dhaiya": bool(sade.get("is_dhaiya")), "title": sade.get("phase_title")},
        "score": score,
        "lucky": {"color": horo["lucky_color"], "number": horo["lucky_number"], "time": horo["lucky_time"]},
        "focus": {"career": horo["career"], "love": horo["love"], "finance": horo["finance"], "health": horo["health"]},
        "remedy": {"gem": LORD_REMEDY[lord]["gem_en"], "deity": LORD_REMEDY[lord]["deity_en"], "deity_hi": LORD_REMEDY[lord]["deity"],
                   "temple_slug": LORD_REMEDY[lord]["temple"], "day": LORD_REMEDY[lord]["day"]},
    })
    return out


# --------------------------------------------------------------------------------------------- remedies tracker
class RemedyIn(BaseModel):
    title: str = Field(..., min_length=2, max_length=160)
    kind: str = "mantra"
    detail: Optional[str] = Field(None, max_length=600)
    frequency: str = "daily"
    weekday: Optional[int] = Field(None, ge=0, le=6)
    target_days: Optional[int] = Field(None, ge=1, le=365)
    source: str = "self"
    astrologer_name: Optional[str] = Field(None, max_length=255)
    link_type: Optional[str] = None
    link_ref: Optional[str] = Field(None, max_length=120)


KINDS = {"mantra", "fast", "donation", "gemstone", "puja", "other"}


def _done_on(db: Session, task_id: str, day: date) -> bool:
    return db.query(RemedyLog.id).filter(RemedyLog.task_id == task_id, RemedyLog.done_on == day.isoformat()).first() is not None


def _is_due(t: RemedyTask, day: date) -> bool:
    if t.frequency == "weekly":
        return t.weekday is None or t.weekday == day.weekday()
    return True


def _streak(days: List[str], frequency: str, today: date) -> int:
    """Consecutive days (daily) or weeks (weekly) ending today or the previous period."""
    done = {date.fromisoformat(d) for d in days}
    if not done:
        return 0
    if frequency == "weekly":
        weeks = {d.isocalendar()[:2] for d in done}
        cur = today
        if cur.isocalendar()[:2] not in weeks:
            cur -= timedelta(days=7)
        n = 0
        while cur.isocalendar()[:2] in weeks:
            n += 1
            cur -= timedelta(days=7)
        return n
    cur = today if today in done else today - timedelta(days=1)
    n = 0
    while cur in done:
        n += 1
        cur -= timedelta(days=1)
    return n


def _task_out(db: Session, t: RemedyTask, today: date) -> Dict[str, Any]:
    days = [r.done_on for r in db.query(RemedyLog).filter(RemedyLog.task_id == t.id).all()]
    return {
        "id": t.id, "title": t.title, "kind": t.kind, "detail": t.detail, "frequency": t.frequency, "weekday": t.weekday,
        "source": t.source, "astrologer_name": t.astrologer_name, "target_days": t.target_days, "status": t.status,
        "link_type": t.link_type, "link_ref": t.link_ref,
        "done_count": len(days), "streak": _streak(days, t.frequency, today),
        "done_today": today.isoformat() in days, "due_today": t.status == "active" and _is_due(t, today),
        "last7": [(today - timedelta(days=i)).isoformat() in days for i in range(6, -1, -1)],
    }


def _suggestions(db: Session, user: User, existing_titles: set) -> List[Dict[str, Any]]:
    chart = _default_chart(db, user)
    moon_i = _sign_index(((chart.chart_data or {}).get("moon_sign") if chart else None))
    lord = SIGN_LORDS[moon_i] if moon_i is not None else None
    items: List[Dict[str, Any]] = []
    if lord:
        r = LORD_REMEDY[lord]
        items.append({"title": f"{lord} mantra - 108 japa", "kind": "mantra", "frequency": "daily", "target_days": 40,
                      "detail": f"Chant the {lord} beej mantra 108 times at sunrise.", "why": f"Lord of your Moon sign {SIGNS[moon_i]}"})
        items.append({"title": f"{r['day']} fast and {r['deity_en']} darshan", "kind": "fast", "frequency": "weekly", "weekday": WEEKDAYS.index(r["day"]),
                      "target_days": 11, "detail": f"Observe a light fast on {r['day']}s and offer prayers to {r['deity_en']}.",
                      "why": f"Day of {lord}", "link_type": "seva", "link_ref": r["temple"]})
        items.append({"title": f"Wear {r['gem_en']} (after expert advice)", "kind": "gemstone", "frequency": "once",
                      "detail": "Gemstones should be worn only after consulting an astrologer.", "why": f"Gem of {lord}", "link_type": "mall", "link_ref": r["gem_en"]})
    items.append({"title": "Morning Surya arghya", "kind": "mantra", "frequency": "daily", "detail": "Offer water to the rising Sun with Om Suryaya Namah.", "why": "Universal daily practice"})
    items.append({"title": "Donate food on Saturday", "kind": "donation", "frequency": "weekly", "weekday": 5, "detail": "Share food with someone in need.", "why": "Traditional Shani remedy"})
    return [s for s in items if s["title"] not in existing_titles]


@router.get("/remedies")
def list_remedies(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    today = _today()
    rows = db.query(RemedyTask).filter(RemedyTask.user_id == user.id).order_by(RemedyTask.created_at.desc()).all()
    tasks = [_task_out(db, t, today) for t in rows]
    return {"tasks": tasks, "suggestions": _suggestions(db, user, {t.title for t in rows}),
            "today": today.isoformat(), "best_streak": max([t["streak"] for t in tasks], default=0)}


@router.post("/remedies")
def add_remedy(req: RemedyIn, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    if req.kind not in KINDS or req.frequency not in ("daily", "weekly", "once") or req.source not in ("self", "astrologer", "suggested"):
        raise HTTPException(status_code=422, detail="Invalid remedy details")
    if req.link_type not in (None, "mall", "seva"):
        raise HTTPException(status_code=422, detail="Invalid link")
    if db.query(RemedyTask).filter(RemedyTask.user_id == user.id).count() >= 40:
        raise HTTPException(status_code=409, detail="You can follow up to 40 remedies at a time")
    if db.query(RemedyTask.id).filter(RemedyTask.user_id == user.id, RemedyTask.title == req.title.strip(), RemedyTask.status != "completed").first():
        raise HTTPException(status_code=409, detail="You are already following this remedy")
    task = RemedyTask(user_id=user.id, title=req.title.strip(), kind=req.kind, detail=req.detail, frequency=req.frequency,
                      weekday=req.weekday if req.frequency == "weekly" else None, target_days=req.target_days, source=req.source,
                      astrologer_name=req.astrologer_name, link_type=req.link_type, link_ref=req.link_ref)
    db.add(task)
    db.commit()
    return _task_out(db, task, _today())


def _own_task(db: Session, task_id: str, user: User) -> RemedyTask:
    t = db.query(RemedyTask).filter(RemedyTask.id == task_id, RemedyTask.user_id == user.id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Remedy not found")
    return t


@router.post("/remedies/{task_id}/checkin")
def checkin_remedy(task_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    t = _own_task(db, task_id, user)
    today = _today()
    if t.status == "completed":
        raise HTTPException(status_code=409, detail="This remedy is already completed")
    if not _done_on(db, t.id, today):
        db.add(RemedyLog(task_id=t.id, done_on=today.isoformat()))
        db.flush()
        done = db.query(RemedyLog).filter(RemedyLog.task_id == t.id).count()
        if t.frequency == "once" or (t.target_days and done >= t.target_days):
            t.status = "completed"
        db.commit()
    return _task_out(db, t, today)


@router.delete("/remedies/{task_id}/checkin")
def undo_checkin(task_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    t = _own_task(db, task_id, user)
    today = _today()
    db.query(RemedyLog).filter(RemedyLog.task_id == t.id, RemedyLog.done_on == today.isoformat()).delete()
    if t.status == "completed":
        t.status = "active"
    db.commit()
    return _task_out(db, t, today)


@router.delete("/remedies/{task_id}")
def delete_remedy(task_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    t = _own_task(db, task_id, user)
    db.query(RemedyLog).filter(RemedyLog.task_id == t.id).delete()
    db.delete(t)
    db.commit()
    return {"success": True}


@router.post("/remedies/import/{consultation_id}")
def import_consultation_remedies(consultation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """Turns the remedies from a completed consultation's summary into trackable tasks."""
    c = db.query(Consultation).filter(Consultation.id == consultation_id, Consultation.user_id == user.id).first()
    summary = db.query(ConsultationSummary).filter(ConsultationSummary.consultation_id == consultation_id).first() if c else None
    if not c or not summary or not summary.remedies:
        raise HTTPException(status_code=404, detail="No remedies found for this consultation")
    have = {t.title for t in db.query(RemedyTask).filter(RemedyTask.user_id == user.id).all()}
    added = 0
    for text in summary.remedies[:8]:
        title = str(text).strip()
        short = (title[:157] + "...") if len(title) > 160 else title
        if not short or short in have or db.query(RemedyTask).filter(RemedyTask.user_id == user.id).count() >= 40:
            continue
        db.add(RemedyTask(user_id=user.id, title=short, kind="other", detail=title if short != title else None, frequency="daily",
                          source="astrologer", astrologer_name=c.astrologer.name if c.astrologer else None))
        have.add(short)
        added += 1
    db.commit()
    return {"added": added}


# --------------------------------------------------------------------------------------------- gift cards
GIFT_AMOUNTS = [251, 501, 1100, 2100, 5100]
GIFT_THEMES = ["diwali", "blessing", "birthday", "wedding"]
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


class GiftBuy(BaseModel):
    amount: float
    recipient_name: Optional[str] = Field(None, max_length=120)
    message: Optional[str] = Field(None, max_length=300)
    theme: str = "blessing"


class GiftRedeem(BaseModel):
    code: str = Field(..., min_length=6, max_length=24)


def _new_code(db: Session) -> str:
    while True:
        raw = "".join(secrets.choice(CODE_ALPHABET) for _ in range(12))
        code = f"AJ-{raw[:4]}-{raw[4:8]}-{raw[8:]}"
        if not db.query(GiftCard.id).filter(GiftCard.code == code).first():
            return code


def _gift_out(g: GiftCard, show_code: bool = True) -> Dict[str, Any]:
    return {"id": g.id, "code": g.code if show_code else None, "amount": g.amount, "recipient_name": g.recipient_name, "message": g.message,
            "theme": g.theme, "status": g.status, "created_at": g.created_at.isoformat() if g.created_at else None,
            "redeemed_at": g.redeemed_at.isoformat() if g.redeemed_at else None}


@router.get("/gifts")
def my_gifts(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    sent = db.query(GiftCard).filter(GiftCard.buyer_id == user.id).order_by(GiftCard.created_at.desc()).limit(30).all()
    got = db.query(GiftCard).filter(GiftCard.redeemed_by == user.id).order_by(GiftCard.redeemed_at.desc()).limit(30).all()
    return {"amounts": GIFT_AMOUNTS, "themes": GIFT_THEMES, "sent": [_gift_out(g) for g in sent], "received": [_gift_out(g, False) for g in got]}


@router.post("/gifts/buy")
def buy_gift(req: GiftBuy, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    if req.amount not in GIFT_AMOUNTS or req.theme not in GIFT_THEMES:
        raise HTTPException(status_code=422, detail="Choose one of the listed gift amounts and themes")
    try:
        charge_wallet(db, user.id, req.amount, "Gift card purchase", "GFT")
        card = GiftCard(code=_new_code(db), amount=req.amount, buyer_id=user.id, recipient_name=(req.recipient_name or "").strip() or None,
                        message=(req.message or "").strip() or None, theme=req.theme)
        db.add(card)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    return _gift_out(card)


@router.post("/gifts/redeem")
def redeem_gift(req: GiftRedeem, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    code = re.sub(r"[^A-Z0-9-]", "", req.code.strip().upper())
    card = db.query(GiftCard).filter(GiftCard.code == code).first()
    if not card:
        raise HTTPException(status_code=404, detail="Gift card code is not valid")
    if card.status == "REDEEMED":
        raise HTTPException(status_code=409, detail="This gift card has already been used")
    # The conditional update makes sure two simultaneous attempts cannot both credit the wallet.
    claimed = db.execute(update(GiftCard).where(GiftCard.id == card.id, GiftCard.status == "ISSUED")
                         .values(status="REDEEMED", redeemed_by=user.id, redeemed_at=utc_now()))
    if claimed.rowcount != 1:
        db.rollback()
        raise HTTPException(status_code=409, detail="This gift card has already been used")
    me = db.query(User).filter(User.id == user.id).with_for_update().first()
    me.wallet_balance = (me.wallet_balance or 0.0) + card.amount
    db.add(WalletTransaction(user_id=user.id, amount=card.amount, transaction_type="credit", description="Gift card redeemed",
                             reference_id=f"GFT_{card.id[:8].upper()}", created_at=utc_now()))
    notify(db, f"u:{user.id}", "wallet_recharged", "/dashboard", amount=f"{card.amount:.0f}", ref=f"GFT_{card.id[:8].upper()}")
    db.commit()
    return {"success": True, "amount": card.amount, "balance": me.wallet_balance, "message": card.message}


# --------------------------------------------------------------------------------------------- festival packs
# Dates are the published festival dates; a pack is shown with a countdown only while its date is ahead.
FESTIVAL_PACKS = [
    {"id": "dhanteras-diwali", "date": "2026-11-08", "coupon": "DIWALI15", "pct": 15, "temple": "vaishno-devi-katra",
     "title": ["Diwali Lakshmi Pack", "दीवाली लक्ष्मी पैक"], "blurb": ["Lakshmi puja essentials plus a sankalp seva for prosperity.", "लक्ष्मी पूजन सामग्री और समृद्धि के लिए संकल्प सेवा।"],
     "keywords": ["lakshmi", "laxmi", "लक्ष्मी", "कमलगट्टा", "shree yantra", "श्री यंत्र", "sphatik", "स्फटिक"], "emoji": "🪔"},
    {"id": "maha-shivratri", "date": "2027-03-06", "coupon": "SHIVRATRI15", "pct": 15, "temple": "kashi-vishwanath-varanasi",
     "title": ["Maha Shivratri Pack", "महाशिवरात्रि पैक"], "blurb": ["Rudraksha and abhishek essentials with a Shiva sankalp puja.", "रुद्राक्ष, अभिषेक सामग्री और शिव संकल्प पूजा।"],
     "keywords": ["rudraksha", "रुद्राक्ष", "shiv", "शिव", "bel", "बेल"], "emoji": "🔱"},
    {"id": "navratri-shakti", "date": None, "coupon": "SHAKTI10", "pct": 10, "temple": "vaishno-devi-katra",
     "title": ["Shakti Sadhana Pack", "शक्ति साधना पैक"], "blurb": ["Devi worship samagri and a Shaktipeeth sankalp.", "देवी पूजन सामग्री और शक्तिपीठ संकल्प।"],
     "keywords": ["durga", "दुर्गा", "devi", "देवी", "yantra", "यंत्र", "kumkum", "कुमकुम"], "emoji": "🌺"},
    {"id": "graha-shanti", "date": None, "coupon": "GRAHA10", "pct": 10, "temple": "shani-shingnapur",
     "title": ["Graha Shanti Pack", "ग्रह शांति पैक"], "blurb": ["Planetary remedy items with a Shani temple seva.", "ग्रह उपाय सामग्री और शनि मंदिर सेवा।"],
     "keywords": ["shani", "शनि", "nilam", "नीलम", "navgrah", "नवग्रह", "mala", "माला"], "emoji": "🪐"},
]


def _title(p: MarketplaceProduct, lang: Optional[str]) -> str:
    """Product name in the visitor's language, using the same catalog translations as Astro Mall."""
    from website.backend.app import catalog_i18n
    if catalog_i18n.is_en(lang):
        en = catalog_i18n.product_en(p.title)
        return en["title"] if en else p.title
    return catalog_i18n.hi_title(p.title) if (lang or "").lower().startswith("hi") else p.title


def _groups(p: MarketplaceProduct) -> list:
    try:
        return json.loads(p.option_groups) if p.option_groups else []
    except (TypeError, ValueError):
        return []


def _default_options(p: MarketplaceProduct) -> Dict[str, str]:
    """First choice of every option group, so a pack can go straight into the cart (the shopper can change it there)."""
    return {g["key"]: g["values"][0]["value"] for g in _groups(p) if g.get("values")}


def _default_delta(p: MarketplaceProduct) -> float:
    return sum(g["values"][0].get("price_delta", 0) for g in _groups(p) if g.get("values"))


def ensure_pack_coupons(db: Session) -> None:
    """Creates the pack discount coupons once; admins can edit or pause them from the coupon list afterwards."""
    for p in FESTIVAL_PACKS:
        if db.query(Coupon.id).filter(Coupon.code == p["coupon"]).first():
            continue
        valid_to = datetime.fromisoformat(p["date"]).replace(tzinfo=timezone.utc) + timedelta(days=3) if p["date"] else None
        db.add(Coupon(code=p["coupon"], kind="percent", value=p["pct"], min_amount=499, max_discount=500, applies_to="mall",
                      valid_to=valid_to, per_user_limit=1, description=f"{p['pct']}% off festival pack items (max ₹500)"))
    db.commit()


@router.get("/festival-packs")
def festival_packs(lang: Optional[str] = None, db: Session = Depends(get_db)):
    hi = (lang or "").lower().startswith("hi")
    products = (db.query(MarketplaceProduct).filter(MarketplaceProduct.is_active == True, MarketplaceProduct.listing_status == "APPROVED",  # noqa: E712
                                                    MarketplaceProduct.stock > 0).all())
    today = _today()
    out = []
    for p in FESTIVAL_PACKS:
        when = date.fromisoformat(p["date"]) if p["date"] else None
        if when and when < today:
            continue
        matched = [m for m in products if any(k in f"{m.title} {m.category} {m.description}".lower() for k in p["keywords"])][:4]
        temple = db.query(Temple).filter(Temple.slug == p["temple"], Temple.is_active == True).first()  # noqa: E712
        if not matched:
            continue
        total = sum(m.price + _default_delta(m) for m in matched)
        out.append({
            "id": p["id"], "emoji": p["emoji"], "title": p["title"][1 if hi else 0], "blurb": p["blurb"][1 if hi else 0],
            "date": p["date"], "days_left": (when - today).days if when else None,
            "coupon": p["coupon"], "discount_pct": p["pct"], "total": round(total, 2), "save": round(min(total * p["pct"] / 100, 500), 2),
            "products": [{"id": m.id, "title": _title(m, lang), "price": m.price + _default_delta(m), "image_url": m.image_url, "options": _default_options(m)}
                         for m in matched],
            "temple": {"slug": temple.slug, "name": temple.name, "image_url": temple.image_url} if temple else None,
        })
    out.sort(key=lambda x: (x["days_left"] is None, x["days_left"] or 0))
    return {"packs": out}


# --------------------------------------------------------------------------------------------- saved astrologers
@router.get("/favourites")
def list_favourites(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    rows = db.query(FavouriteAstrologer.astrologer_id).filter(FavouriteAstrologer.user_id == user.id).all()
    return {"ids": [r[0] for r in rows]}


def _astrologer_or_404(db: Session, key: str) -> Astrologer:
    a = db.query(Astrologer).filter((Astrologer.id == key) | (Astrologer.slug == key)).first()
    if not a:
        raise HTTPException(status_code=404, detail="Astrologer not found")
    return a


@router.put("/favourites/{astrologer_id}")
def save_favourite(astrologer_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    a = _astrologer_or_404(db, astrologer_id)
    if not db.query(FavouriteAstrologer.id).filter(FavouriteAstrologer.user_id == user.id, FavouriteAstrologer.astrologer_id == a.id).first():
        db.add(FavouriteAstrologer(user_id=user.id, astrologer_id=a.id))
        db.commit()
    return {"saved": True, "astrologer_id": a.id}


@router.delete("/favourites/{astrologer_id}")
def remove_favourite(astrologer_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    a = _astrologer_or_404(db, astrologer_id)
    db.query(FavouriteAstrologer).filter(FavouriteAstrologer.user_id == user.id, FavouriteAstrologer.astrologer_id == a.id).delete()
    db.commit()
    return {"saved": False, "astrologer_id": a.id}
