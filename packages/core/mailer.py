"""Optional transactional email over SMTP.

Nothing is sent unless SMTP_HOST and SMTP_FROM are set (plus SMTP_USER / SMTP_PASSWORD / SMTP_PORT as the provider needs).
Callers check ``is_configured()`` first and treat a failed send as non-fatal: the site always offers the receipt as a download.
"""
import logging
import smtplib
from email.message import EmailMessage

from packages.core.config import settings

logger = logging.getLogger(__name__)


def is_configured() -> bool:
    return settings.smtp_enabled


def send_email(to: str, subject: str, body: str) -> bool:
    """Sends a plain-text email. Returns True on success; never raises (secrets are never logged)."""
    if not is_configured() or not to:
        return False
    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
            try:
                smtp.starttls()
            except smtplib.SMTPException:
                pass  # server without STARTTLS (e.g. a local relay)
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
        return True
    except Exception as exc:  # network, auth or recipient errors must not break a payment flow
        logger.warning("Receipt email failed: %s", type(exc).__name__)
        return False
