"""Pytest runs against a throwaway copy of astro_ai.db so tests never write into the real database."""
import os
import shutil
import tempfile
from pathlib import Path

_REAL_DB = Path(__file__).resolve().parent / "astro_ai.db"
_TEST_DB = Path(tempfile.mkdtemp(prefix="astro_test_")) / "astro_ai_test.db"
if _REAL_DB.exists():
    shutil.copyfile(_REAL_DB, _TEST_DB)
os.environ["DATABASE_URL"] = "sqlite:///" + _TEST_DB.as_posix()


import pytest


@pytest.fixture(autouse=True)
def _fresh_gemini_client():
    """The LLM service caches one shared client; tests that patch google.genai.Client need a fresh lookup."""
    try:
        from ai.backend.app.services import llm_service
        llm_service._GEMINI_CLIENT = None
    except Exception:  # noqa: BLE001 - modules unavailable in some test subsets
        pass
    yield
