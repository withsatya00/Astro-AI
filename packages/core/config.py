"""
Application configuration for AstroAI Agent using Pydantic Settings.
"""
import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "AstroAI Agent"
    APP_ENV: str = "development"
    DEBUG: bool = True
    VAPID_PUBLIC_KEY: str = ""
    VAPID_PRIVATE_KEY: str = ""
    VAPID_SUBJECT: str = "mailto:admin@example.com"
    AI_MODEL_PRICING_JSON: str = "{}"
    AI_PRICING_CURRENCY: str = "USD"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    FRONTEND_PORT: int = 3000

    SECRET_KEY: str = "astroai-development-super-secret-key-32bytes-min"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"

    # AI Configuration
    GEMINI_API_KEY: Optional[str] = Field(default=None, validation_alias="GEMINI_API_KEY")
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    EMBEDDING_MODEL: str = "gemini-embedding-001"
    EMBEDDING_PROVIDER: str = Field(default="local_dense", validation_alias="EMBEDDING_PROVIDER")  # local_dense, google_genai, sentence_transformers

    # Payments: when both are set, wallet top-ups go through Razorpay and the test-mode recharge is disabled.
    RAZORPAY_KEY_ID: Optional[str] = Field(default=None, validation_alias="RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET: Optional[str] = Field(default=None, validation_alias="RAZORPAY_KEY_SECRET")

    # Gau Sewa donations reuse the Razorpay keys above; the webhook needs its own signing secret
    # (set in the Razorpay dashboard -> Webhooks). Without it the webhook endpoint refuses every request.
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = Field(default=None, validation_alias="RAZORPAY_WEBHOOK_SECRET")

    # Optional receipt email (SMTP). Receipts are only emailed when SMTP_HOST and SMTP_FROM are both set.
    SMTP_HOST: Optional[str] = Field(default=None, validation_alias="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, validation_alias="SMTP_PORT")
    SMTP_USER: Optional[str] = Field(default=None, validation_alias="SMTP_USER")
    SMTP_PASSWORD: Optional[str] = Field(default=None, validation_alias="SMTP_PASSWORD")
    SMTP_FROM: Optional[str] = Field(default=None, validation_alias="SMTP_FROM")
    SITE_URL: Optional[str] = Field(default=None, validation_alias="SITE_URL")

    # Database & Storage
    DATABASE_URL: str = "sqlite:///./astro_ai.db"
    REDIS_URL: str = "redis://localhost:6379/0"

    STORAGE_DIR: str = "/tmp/storage" if (os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")) else str(BASE_DIR / "storage")
    DOCUMENTS_DIR: str = str(BASE_DIR / "documents")
    REPORTS_DIR: str = "/tmp/storage/reports" if (os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")) else str(BASE_DIR / "storage" / "reports")
    EPHEMERIS_PATH: str = str(BASE_DIR / "ephemeris")

    @property
    def razorpay_enabled(self) -> bool:
        return bool((self.RAZORPAY_KEY_ID or "").strip() and (self.RAZORPAY_KEY_SECRET or "").strip())

    @property
    def is_production(self) -> bool:
        return (self.APP_ENV or "").strip().lower() in ("production", "prod")

    @property
    def test_payments_allowed(self) -> bool:
        """Free test-mode wallet credit exists for development only; production needs real payments."""
        return not self.is_production

    @property
    def razorpay_webhook_enabled(self) -> bool:
        return bool((self.RAZORPAY_WEBHOOK_SECRET or "").strip())

    @property
    def smtp_enabled(self) -> bool:
        return bool((self.SMTP_HOST or "").strip() and (self.SMTP_FROM or "").strip())

    @property
    def is_demo_mode(self) -> bool:
        """Returns True if Gemini API key is missing or blank."""
        return not bool(self.GEMINI_API_KEY and self.GEMINI_API_KEY.strip())

settings = Settings()
