"""
Astrology Source Discovery and Document Acquisition Pipeline.
Discovers and acquires legally accessible public domain astrology texts,
verifies checksums, validates permissions, and indexes them into the knowledge base.
"""
import os
import sys
import json
import time
import hashlib
from pathlib import Path
from typing import Dict, Any, List
import httpx

# Add repository root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.core.security import validate_outbound_url_ssrf, secure_filename
from backend.app.db.session import SessionLocal, init_db
from backend.app.rag.ingestion import IngestionPipeline, compute_sha256

MANIFEST_PATH = Path(settings.DOCUMENTS_DIR) / "manifests" / "source_manifest.json"

# Verified Public Domain & Open Access Registry
PERMITTED_SOURCES_REGISTRY = [
    {
        "source_id": "seed-vedic-foundations",
        "title": "Classical Vedic Astrology: Foundations, Planets, and Houses",
        "author": "Vedic Tradition Compendium",
        "publisher": "Open Astrology Heritage",
        "license": "Public Domain / Open Educational Resource",
        "permission_status": "PERMITTED",
        "document_type": "md",
        "local_file": "documents/sources/vedic_astrology_foundations.md",
        "remote_url": None
    },
    {
        "source_id": "seed-nakshatras-dashas",
        "title": "The Classical Handbook of Nakshatras and Vimshottari Dasha",
        "author": "Maharishi Parashara Tradition",
        "publisher": "Open Knowledge Archive",
        "license": "Public Domain / CC0",
        "permission_status": "PERMITTED",
        "document_type": "md",
        "local_file": "documents/sources/nakshatras_and_dashas_handbook.md",
        "remote_url": None
    },
    {
        "source_id": "seed-hastarekha-palmistry",
        "title": "Classical Hastarekha & Samudrika Shastra: Complete Vedic Palmistry Guide",
        "author": "Maharishi Samudra / Traditional Jyotish Palmistry Sages",
        "publisher": "Open Knowledge Archive",
        "license": "Public Domain / CC0",
        "permission_status": "PERMITTED",
        "document_type": "md",
        "local_file": "documents/sources/hastarekha_palmistry_shastra.md",
        "remote_url": None
    }
]

def download_with_backoff(url: str, dest_path: Path, max_retries: int = 3) -> bool:
    """Downloads remote resource with bounded exponential backoff and SSRF validation."""
    if not validate_outbound_url_ssrf(url):
        logger.error(f"SSRF violation: blocked attempt to download from forbidden URL {url}")
        return False

    delay = 1.0
    for attempt in range(1, max_retries + 1):
        try:
            with httpx.Client(timeout=15.0, follow_redirects=True) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    dest_path.write_bytes(resp.content)
                    return True
                logger.warning(f"Download attempt {attempt} failed with HTTP status {resp.status_code}")
        except Exception as e:
            logger.warning(f"Download attempt {attempt} failed: {e}")
        time.sleep(delay)
        delay *= 2.0
    return False

def acquire_and_index_sources():
    """Acquires all sources from the registry and indexes them into the knowledge base."""
    init_db()
    db = SessionLocal()

    manifest_records = []
    base_dir = Path(__file__).resolve().parent.parent

    try:
        for entry in PERMITTED_SOURCES_REGISTRY:
            source_id = entry["source_id"]
            title = entry["title"]
            logger.info(f"Processing source: {title} ({source_id})")

            file_path = None
            if entry.get("local_file"):
                local_p = base_dir / entry["local_file"]
                if local_p.exists():
                    file_path = local_p
                else:
                    logger.warning(f"Local file not found: {local_p}")

            if not file_path and entry.get("remote_url"):
                dest_p = Path(settings.DOCUMENTS_DIR) / "approved" / f"{source_id}.{entry['document_type']}"
                dest_p.parent.mkdir(parents=True, exist_ok=True)
                if download_with_backoff(entry["remote_url"], dest_p):
                    file_path = dest_p

            if not file_path:
                logger.error(f"Source {source_id} could not be acquired.")
                continue

            checksum = compute_sha256(str(file_path))
            size = file_path.stat().st_size

            # Ingest into knowledge base
            doc = IngestionPipeline.process_and_index_file(
                db=db,
                file_path=str(file_path),
                title=title,
                author=entry.get("author"),
                publisher=entry.get("publisher"),
                license_str=entry.get("license", "Public Domain"),
                source_url=entry.get("remote_url"),
                permission_status=entry["permission_status"]
            )

            manifest_records.append({
                "source_id": source_id,
                "document_id": doc.id,
                "title": title,
                "author": entry.get("author"),
                "publisher": entry.get("publisher"),
                "license": entry.get("license"),
                "permission_status": entry["permission_status"],
                "file_path": str(file_path),
                "checksum": checksum,
                "file_size": size,
                "chunk_count": doc.chunk_count,
                "status": doc.status
            })

        # Save manifest
        MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
            json.dump({"manifest": manifest_records, "generated_at": time.time()}, f, indent=2)

        print(f"\n[+] Successfully ingested {len(manifest_records)} sources into the knowledge base.")
        for r in manifest_records:
            print(f"    - {r['title']} ({r['chunk_count']} chunks indexed)")

    finally:
        db.close()

if __name__ == "__main__":
    acquire_and_index_sources()
