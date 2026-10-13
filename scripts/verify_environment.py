"""
Environment and dependency verification script for AstroAI Agent.
"""
import sys
import importlib
import subprocess
import shutil
import platform
import os

def check_modules():
    modules = [
        "fastapi", "uvicorn", "pydantic", "pydantic_settings",
        "sqlalchemy", "httpx", "pytest", "ruff",
        "reportlab", "pypdf", "fitz", "docx", "weasyprint",
        "redis", "pgvector", "google.genai", "google.generativeai",
        "pyswisseph", "swisseph", "flatlib", "skyfield", "ephem", "astropy"
    ]
    results = {}
    for mod in modules:
        try:
            m = importlib.import_module(mod)
            results[mod] = getattr(m, "__version__", "installed")
        except ImportError:
            results[mod] = "NOT_INSTALLED"
        except Exception as e:
            results[mod] = f"ERROR: {e}"
    return results

def check_tools():
    tools = ["git", "docker", "docker-compose"]
    res = {}
    for t in tools:
        path = shutil.which(t)
        res[t] = path if path else "NOT_FOUND"
    return res

def main():
    print(f"OS: {platform.system()} {platform.release()}")
    print(f"Python Executable: {sys.executable}")
    print(f"Python Version: {platform.python_version()}")
    print("\n--- CLI Tools ---")
    for k, v in check_tools().items():
        print(f"  {k}: {v}")
    print("\n--- Python Packages ---")
    for k, v in check_modules().items():
        print(f"  {k}: {v}")

if __name__ == "__main__":
    main()
