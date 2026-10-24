"""
Vercel Serverless Function Entrypoint for AstroAI Agent API.
"""
import sys
from pathlib import Path

# Ensure project root is available in sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from website.backend.app.main import app

# Export ASGI app instance for Vercel Python runtime
handler = app
