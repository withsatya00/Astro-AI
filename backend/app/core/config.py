"""
Application configuration for AstroAI Agent using Pydantic Settings.
"""
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "AstroAI Agent"
    APP_ENV: str = "development"
    DEBUG: bool = True
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

    # Database & Storage
    DATABASE_URL: str = "sqlite:///./astro_ai.db"
    REDIS_URL: str = "redis://localhost:6379/0"

    STORAGE_DIR: str = str(BASE_DIR / "storage")
    DOCUMENTS_DIR: str = str(BASE_DIR / "documents")
    REPORTS_DIR: str = str(BASE_DIR / "storage" / "reports")
    EPHEMERIS_PATH: str = str(BASE_DIR / "ephemeris")

    @property
    def is_demo_mode(self) -> bool:
        """Returns True if Gemini API key is missing or blank."""
        return not bool(self.GEMINI_API_KEY and self.GEMINI_API_KEY.strip())

settings = Settings()
