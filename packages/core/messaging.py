"""WhatsApp / SMS alerts for orders and sevas (Twilio).

Nothing is sent unless these environment variables are set:
  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
  TWILIO_WHATSAPP_FROM  e.g. "whatsapp:+14155238886"   (WhatsApp messages)
  TWILIO_SMS_FROM       e.g. "+15005550006"            (SMS fallback)
Messages are queued on the database session and sent in a background thread only after the transaction commits.
"""
import logging
import os
import re
import threading
from typing import List, Optional, Tuple

import requests
from sqlalchemy import event
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# notification kinds worth a message outside the site
ALERT_KINDS = {"booking_video", "booking_completed", "order_dispatched", "order_delivered", "booking_scheduled"}


def is_configured() -> bool:
    return bool(os.getenv("TWILIO_ACCOUNT_SID") and os.getenv("TWILIO_AUTH_TOKEN")
                and (os.getenv("TWILIO_WHATSAPP_FROM") or os.getenv("TWILIO_SMS_FROM")))


def normalize_phone(phone: Optional[str]) -> Optional[str]:
    """Indian mobile numbers to E.164 (+91...). Returns None when the number is not usable."""
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 10:
        return "+91" + digits
    if len(digits) == 12 and digits.startswith("91"):
        return "+" + digits
    if 11 <= len(digits) <= 15 and (phone or "").strip().startswith("+"):
        return "+" + digits
    return None


def _post(url: str, data: dict, auth: Tuple[str, str]) -> int:
    return requests.post(url, data=data, auth=auth, timeout=10).status_code


def send_message(phone: str, text: str) -> bool:
    """Sends one message; WhatsApp first, SMS if WhatsApp is not configured. Returns True when accepted."""
    to = normalize_phone(phone)
    sid, token = os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN")
    if not (to and sid and token):
        return False
    url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    wa_from, sms_from = os.getenv("TWILIO_WHATSAPP_FROM"), os.getenv("TWILIO_SMS_FROM")
    try:
        if wa_from:
            status = _post(url, {"From": wa_from, "To": f"whatsapp:{to}", "Body": text}, (sid, token))
            if status < 300:
                return True
        if sms_from:
            return _post(url, {"From": sms_from, "To": to, "Body": text}, (sid, token)) < 300
    except Exception as exc:  # alerts must never break an order
        logger.warning("Message to %s failed: %s", to, exc)
    return False


def queue_message(db: Session, phone: Optional[str], text: str) -> None:
    """Queues a message on the session; it is sent after the surrounding transaction commits."""
    if phone and is_configured():
        db.info.setdefault("pending_messages", []).append((phone, text))


@event.listens_for(Session, "after_commit")
def _flush_pending(session: Session) -> None:
    pending: List[Tuple[str, str]] = session.info.pop("pending_messages", [])
    for phone, text in pending:
        threading.Thread(target=send_message, args=(phone, text), daemon=True).start()


@event.listens_for(Session, "after_rollback")
def _drop_pending(session: Session) -> None:
    session.info.pop("pending_messages", None)
