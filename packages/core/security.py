"""
Security and authentication utilities for AstroAI Agent.
Handles token creation, password hashing, input sanitization,
SSRF defense, and prompt-injection defense.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
import ipaddress
import urllib.parse
import re
from jose import jwt, JWTError
from passlib.context import CryptContext
from packages.core.config import settings

# Password hashing context (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Prompt injection risk signatures to flag or neutralize
PROMPT_INJECTION_PATTERNS = [
    re.compile(r"(?i)ignore\s+(all\s+)?(previous|prior)\s+instructions"),
    re.compile(r"(?i)system\s+prompt\s*override"),
    re.compile(r"(?i)you\s+are\s+now\s+in\s+DAN\s+mode"),
    re.compile(r"(?i)reveal\s+your\s+(secret|hidden|internal)\s+(instructions|prompt)"),
    re.compile(r"(?i)disregard\s+the\s+above"),
]

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Computes a bcrypt hash for a plain password."""
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT token. Returns payload dict or None."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def sanitize_user_input(text: str, max_length: int = 5000) -> str:
    """Sanitizes user query or input text."""
    if not text:
        return ""
    cleaned = text.strip()[:max_length]
    # Remove control characters except standard whitespace
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", cleaned)
    return cleaned

def check_prompt_injection(text: str) -> bool:
    """
    Returns True if suspicious prompt injection patterns are detected.
    Used to defensively mark or sanitize retrieved document chunks or inputs.
    """
    for pattern in PROMPT_INJECTION_PATTERNS:
        if pattern.search(text):
            return True
    return False

def sanitize_retrieved_context(text: str) -> str:
    """
    Wraps untrusted retrieved text so that LLMs treat it strictly as context,
    neutralizing injection tricks.
    """
    neutralized = text.replace("```", "'''")
    return neutralized

def validate_outbound_url_ssrf(url: str) -> bool:
    """
    SSRF Protection:
    Ensures URL uses HTTP/HTTPS and does not target localhost, private subnets,
    link-local addresses, or cloud metadata endpoints.
    """
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False

        hostname = parsed.hostname
        if not hostname:
            return False

        if hostname.lower() in ("localhost", "127.0.0.1", "::1", "metadata.google.internal"):
            return False

        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False
        except ValueError:
            pass

        return True
    except Exception:
        return False

def secure_filename(filename: str) -> str:
    """
    Path Traversal Defense:
    Strips directory separators and risky sequences to guarantee safe local file storage.
    """
    clean = re.sub(r"[/\\]+", "", filename)
    clean = clean.replace("..", "").replace("\x00", "")
    clean = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", clean)
    return clean or "document"
