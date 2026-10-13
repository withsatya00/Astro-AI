"""
Structured logging module for AstroAI Agent with sensitive credential redaction.
"""
import logging
import re
import sys
from typing import Any

# Patterns to mask sensitive tokens, keys, passwords
SENSITIVE_PATTERNS = [
    re.compile(r"(?i)(api[_-]?key|secret|token|password|bearer\s+)([=:\s]+)([\"']?)([a-zA-Z0-9_\-\.]{6,})(\3)"),
    re.compile(r"(AIzaSy[a-zA-Z0-9_\-]{33})"),
]

class RedactingFormatter(logging.Formatter):
    """Formatter that redacts API keys and secrets from log lines."""
    def format(self, record: logging.LogRecord) -> str:
        orig = super().format(record)
        redacted = orig
        # Redact generic key/token patterns
        redacted = re.sub(
            r"(?i)(api[_-]?key|secret|token|password|bearer\s+)([=:\s]+)([\"']?)([a-zA-Z0-9_\-\.]{6,})(\3)",
            r"\1\2\3[REDACTED]\3",
            redacted
        )
        # Redact Google API key patterns
        redacted = re.sub(r"(AIzaSy[a-zA-Z0-9_\-]{33})", "[REDACTED_API_KEY]", redacted)
        return redacted

def setup_logging(level: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger("astroai")
    logger.setLevel(level)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)
        formatter = RedactingFormatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s.%(module)s]: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger

logger = setup_logging()
