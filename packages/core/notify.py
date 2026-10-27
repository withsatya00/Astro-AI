"""In-app notifications shown in the site's notification bell.

A notification stores a ``kind`` and its ``params``; the text is produced when it is read, so each visitor sees it in
the language their site is set to (English or Hindi), whoever triggered it.
"""
import json
from typing import Any, Dict, Optional, Tuple

from sqlalchemy.orm import Session

from packages.database.models import Notification, StatusEvent, User

TEMPLATES: Dict[str, Dict[str, Tuple[str, str]]] = {
    "booking_confirmed": {
        "en": ("Sankalp booking confirmed", "{ref}: {title}. The video proof will appear in My Bookings once the sankalp is done."),
        "hi": ("संकल्प बुकिंग पुष्ट हुई", "{ref}: {title}। संकल्प पूर्ण होने पर वीडियो प्रमाण 'मेरी बुकिंग' में दिखेगा।")},
    "booking_scheduled": {
        "en": ("Sankalp scheduled", "{ref} is scheduled{when_en}."),
        "hi": ("संकल्प का समय तय हुआ", "{ref} का संकल्प{when_hi} होगा।")},
    "booking_video": {
        "en": ("Sankalp video is ready", "Watch the video proof for {ref} in My Bookings."),
        "hi": ("संकल्प का वीडियो तैयार है", "{ref} का वीडियो प्रमाण 'मेरी बुकिंग' में देखें।")},
    "booking_completed": {
        "en": ("Seva completed", "{ref} has been completed. Prasad, if booked, is on its way."),
        "hi": ("सेवा संपन्न हुई", "{ref} संपन्न हो गई। प्रसाद बुक किया है तो वह भेजा जा रहा है।")},
    "booking_cancelled": {
        "en": ("Booking cancelled", "{ref} was cancelled and any payment refunded."),
        "hi": ("बुकिंग रद्द हुई", "{ref} रद्द कर दी गई और भुगतान (यदि किया था) लौटा दिया गया।")},
    "order_placed": {
        "en": ("Order placed", "{count} item(s), total ₹{total}. We will energize them in your name and gotra before dispatch."),
        "hi": ("ऑर्डर दर्ज हुआ", "{count} सामग्री, कुल ₹{total}। भेजने से पहले इन्हें आपके नाम व गोत्र से अभिमंत्रित किया जाएगा।")},
    "order_cancelled": {
        "en": ("Order cancelled", "{ref} was cancelled and any payment refunded."),
        "hi": ("ऑर्डर रद्द हुआ", "{ref} रद्द कर दिया गया और भुगतान (यदि किया था) लौटा दिया गया।")},
    "order_energizing": {
        "en": ("Energization started", "{ref} is being energized in your name and gotra."),
        "hi": ("अभिमंत्रण शुरू हुआ", "{ref} को आपके नाम व गोत्र से अभिमंत्रित किया जा रहा है।")},
    "order_dispatched": {
        "en": ("Order dispatched", "{ref} is on its way. Tracking ID: {tracking}."),
        "hi": ("ऑर्डर भेज दिया गया", "{ref} रवाना हो चुका है। ट्रैकिंग आईडी: {tracking}।")},
    "order_delivered": {
        "en": ("Order delivered", "{ref} was delivered. You can now rate the item."),
        "hi": ("ऑर्डर पहुँच गया", "{ref} डिलीवर हो गया। अब आप सामग्री को रेटिंग दे सकते हैं।")},
    "reminder_due": {
        "en": ("Upcoming {occasion}", "{name}'s {occasion} is on {when}. Book a seva in their name?"),
        "hi": ("आने वाला {occasion_hi}", "{name} का {occasion_hi} {when} को है। उनके नाम से सेवा बुक करें?")},
    "package_confirmed": {
        "en": ("Seva package booked", "{title}: {count} sessions are scheduled."),
        "hi": ("सेवा पैकेज बुक हुआ", "{title}: {count} सत्र निर्धारित हो गए हैं।")},
    "payout_paid": {
        "en": ("Payout sent", "₹{amount} was paid to your UPI. Reference: {reference}."),
        "hi": ("भुगतान भेज दिया गया", "₹{amount} आपके UPI पर भेजा गया। संदर्भ: {reference}।")},
    "kyc_approved": {
        "en": ("Seller account approved", "Your KYC is approved. You can now list products."),
        "hi": ("विक्रेता खाता स्वीकृत", "आपका KYC स्वीकृत हो गया। अब आप सामग्री लिस्ट कर सकते हैं।")},
    "kyc_rejected": {
        "en": ("Seller KYC needs attention", "Your KYC was not approved: {note}"),
        "hi": ("KYC पर ध्यान दें", "आपका KYC स्वीकृत नहीं हुआ: {note}")},
    "certificate_verified": {
        "en": ("Certificate verified", "The lab certificate for '{title}' is verified and now shown on the product page."),
        "hi": ("प्रमाणपत्र सत्यापित", "'{title}' का लैब प्रमाणपत्र सत्यापित हो गया और अब सामग्री पेज पर दिखेगा।")},
    "certificate_rejected": {
        "en": ("Certificate not accepted", "The certificate for '{title}' was not accepted: {note}"),
        "hi": ("प्रमाणपत्र स्वीकार नहीं हुआ", "'{title}' का प्रमाणपत्र स्वीकार नहीं हुआ: {note}")},
    "seller_order": {
        "en": ("New order for your item", "{ref}: {title} x {qty}. Please energize and dispatch it."),
        "hi": ("आपकी सामग्री का नया ऑर्डर", "{ref}: {title} x {qty}। कृपया अभिमंत्रित करके भेजें।")},
    "order_return": {
        "en": ("Return requested", "{ref}: your return request was received. We will contact you."),
        "hi": ("वापसी का अनुरोध", "{ref}: आपका वापसी अनुरोध मिल गया। हम आपसे संपर्क करेंगे।")},
    "product_submitted": {
        "en": ("Product submitted", "'{title}' is under review. We will notify you once it is live."),
        "hi": ("सामग्री समीक्षा हेतु भेजी गई", "'{title}' की समीक्षा चल रही है। लाइव होते ही आपको सूचना मिलेगी।")},
    "product_approved": {
        "en": ("Product approved", "'{title}' is now live on Astro Mall."),
        "hi": ("सामग्री स्वीकृत हुई", "'{title}' अब एस्ट्रो मॉल पर लाइव है।")},
    "product_rejected": {
        "en": ("Product not approved", "'{title}' was not approved."),
        "hi": ("सामग्री स्वीकृत नहीं हुई", "'{title}' स्वीकृत नहीं हो सकी।")},
}


def notify(db: Session, owner_key: Optional[str], kind: str, link: str = "", **params: Any) -> None:
    """Queues a notification inside the caller's transaction (caller commits)."""
    if not owner_key:
        return
    title, body = _format(kind, params, "en")
    db.add(Notification(owner_key=owner_key, kind=kind, params=json.dumps(params, ensure_ascii=False),
                        title=title[:200], body=body[:500], link=link[:200]))
    # Important updates also go out as a WhatsApp/SMS message when messaging is configured and the user has a phone.
    from packages.core import messaging
    if kind in messaging.ALERT_KINDS and owner_key.startswith("u:") and messaging.is_configured():
        user = db.query(User).filter(User.id == owner_key[2:]).first()
        if user and user.phone:
            hi_title, hi_body = _format(kind, params, "hi")
            messaging.queue_message(db, user.phone, f"Astro Jyotish: {title}. {body}\n{hi_title}। {hi_body}")


def record_event(db: Session, kind: str, ref_id: str, status: str, note: str = "") -> None:
    """Adds a tracking-timeline entry for an order or booking (inside the caller's transaction)."""
    db.add(StatusEvent(kind=kind, ref_id=ref_id, status=status, note=(note or "")[:300]))


def _format(kind: str, params: Dict[str, Any], lang: str) -> Tuple[str, str]:
    tpl = TEMPLATES.get(kind, {}).get(lang) or TEMPLATES.get(kind, {}).get("en")
    if not tpl:
        return kind, ""
    values = dict(params)
    # Catalog names (seva / product titles) are stored in Hindi; show their English form in English.
    if lang == "en":
        from website.backend.app.catalog_i18n import en_text
        for k in ("title",):
            if isinstance(values.get(k), str):
                values[k] = en_text(values[k])
    if values.get("occasion"):
        values["occasion_hi"] = "जन्मदिन" if values["occasion"] == "birthday" else "वर्षगांठ"
    when = values.get("when") or ""
    values["when_en"] = f" for {when}" if when else ""
    values["when_hi"] = f" {when} को" if when else ""
    try:
        return tpl[0].format(**values), tpl[1].format(**values)
    except (KeyError, IndexError):
        return tpl[0], tpl[1]


def render(n: Notification, lang: Optional[str]) -> Tuple[str, str]:
    """Title and body of a stored notification in the requested language ('hi' or anything else for English)."""
    if not n.kind:
        return n.title, n.body or ""
    try:
        params = json.loads(n.params or "{}")
    except ValueError:
        params = {}
    return _format(n.kind, params, "hi" if (lang or "").lower().startswith("hi") else "en")
