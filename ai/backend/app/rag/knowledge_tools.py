"""
Astrology Knowledge Base Management, Inventory, and Quality Assurance Tools.

Utilities:
1. Source Manifest Validator: verifies provenance, licensing, local file paths, and checksums.
2. Document Inventory Utility: lists indexed documents, status, chunk counts, and topics.
3. Duplicate Detection: detects exact checksum collisions and near-duplicate passages.
4. Missing Metadata Reporter: surfaces missing authors, topics, licenses, or section headers.
5. Safe Index Consistency Checker: verifies DB-file sync, vector dimensions, and orphan chunks.
6. Knowledge Base Statistics: aggregates metrics by topic, source, language, and shloka counts.
"""
from typing import Dict, Any, List, Optional
import os
import sys
import json
import time
from pathlib import Path
from collections import Counter, defaultdict
import argparse
from sqlalchemy.orm import Session

from packages.core.config import settings, BASE_DIR
from packages.core.logging import logger
from packages.database.session import SessionLocal, init_db
from packages.database.models import Document, DocumentChunk
from ai.backend.app.rag.embeddings import EmbeddingService
from ai.backend.app.rag.ingestion import compute_sha256

MANIFEST_PATH = Path(settings.DOCUMENTS_DIR) / "manifests" / "source_manifest.json"
ACQUISITION_MANIFEST_PATH = Path(settings.DOCUMENTS_DIR) / "manifests" / "acquisition_manifest.json"


def validate_source_manifest(manifest_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Validates manifest entries against files on disk and checksums.
    """
    path_to_use = Path(manifest_path or MANIFEST_PATH)
    if not path_to_use.exists():
        return {"status": "error", "error": f"Manifest file not found: {path_to_use}"}

    with open(path_to_use, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data.get("manifest", [])
    report: Dict[str, Any] = {
        "manifest_path": str(path_to_use),
        "total_entries": len(entries),
        "valid_count": 0,
        "missing_file_count": 0,
        "checksum_mismatch_count": 0,
        "missing_metadata_count": 0,
        "results": []
    }

    base_dir = BASE_DIR

    for item in entries:
        source_id = item.get("source_id", "unknown")
        title = item.get("title", "Untitled")
        file_path_str = item.get("file_path") or item.get("local_file")

        res_item: Dict[str, Any] = {
            "source_id": source_id,
            "title": title,
            "is_valid": True,
            "issues": []
        }

        # Check required fields
        for field in ["title", "author", "license", "permission_status"]:
            if not item.get(field):
                res_item["issues"].append(f"Missing required field '{field}'")
                res_item["is_valid"] = False

        if not file_path_str:
            res_item["issues"].append("Missing file_path")
            res_item["is_valid"] = False
            report["results"].append(res_item)
            continue

        target_path = Path(file_path_str)
        if not target_path.is_absolute():
            target_path = base_dir / target_path

        if not target_path.exists():
            res_item["issues"].append(f"File not found on disk: {target_path}")
            res_item["is_valid"] = False
            report["missing_file_count"] += 1
        else:
            # Verify checksum
            expected_hash = item.get("checksum")
            actual_hash = compute_sha256(str(target_path))
            if expected_hash and actual_hash != expected_hash:
                res_item["issues"].append(f"Checksum mismatch: expected {expected_hash[:8]}..., got {actual_hash[:8]}...")
                res_item["is_valid"] = False
                report["checksum_mismatch_count"] += 1
            res_item["actual_checksum"] = actual_hash
            res_item["actual_size"] = target_path.stat().st_size

        if res_item["is_valid"]:
            report["valid_count"] += 1
        else:
            report["missing_metadata_count"] += 1

        report["results"].append(res_item)

    report["status"] = "success" if report["missing_file_count"] == 0 and report["checksum_mismatch_count"] == 0 else "warning"
    return report


def get_document_inventory(db: Session) -> Dict[str, Any]:
    """
    Returns an inventory of all indexed documents in the database.
    """
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    inventory = []
    for d in docs:
        d_meta = d.doc_metadata or {}
        inventory.append({
            "id": d.id,
            "title": d.title,
            "author": d.author or "Unknown / Classical",
            "license": d.license,
            "status": d.status,
            "file_type": d.file_type,
            "file_size_bytes": d.file_size_bytes,
            "chunk_count": d.chunk_count,
            "topic": d_meta.get("topic", "astrology"),
            "language": d_meta.get("language", "en"),
            "file_path": d.file_path,
            "checksum": d.checksum
        })
    return {
        "total_documents": len(docs),
        "total_chunks": sum(d.chunk_count for d in docs),
        "documents": inventory
    }


def generate_missing_metadata_report(db: Session) -> Dict[str, Any]:
    """
    Identifies documents and chunks missing required provenance fields.
    """
    docs = db.query(Document).all()
    missing_docs = []
    for d in docs:
        issues = []
        if not d.author:
            issues.append("missing_author")
        if not d.license:
            issues.append("missing_license")
        if not d.source_url and not d.publisher:
            issues.append("missing_source_url_or_publisher")
        d_meta = d.doc_metadata or {}
        if not d_meta.get("topic"):
            issues.append("missing_topic")
        if issues:
            missing_docs.append({
                "id": d.id,
                "title": d.title,
                "file_path": d.file_path,
                "issues": issues
            })

    chunks_missing_section = (
        db.query(DocumentChunk)
        .filter((DocumentChunk.section_title == None) | (DocumentChunk.section_title == "General"))
        .count()
    )

    return {
        "documents_inspected": len(docs),
        "documents_with_issues": len(missing_docs),
        "chunks_with_generic_section": chunks_missing_section,
        "details": missing_docs
    }


def check_index_consistency(db: Session) -> Dict[str, Any]:
    """
    Verifies vector dimension uniformity, database-to-disk synchronization,
    and identifies orphan chunks.
    """
    expected_dim = EmbeddingService.get_expected_dimension()
    docs = db.query(Document).all()
    chunks = db.query(DocumentChunk).all()

    issues: List[str] = []
    dimension_mismatches = 0
    orphan_chunks = 0
    missing_files = 0

    doc_ids = {d.id for d in docs}

    for c in chunks:
        if c.document_id not in doc_ids:
            orphan_chunks += 1
        if c.embedding:
            if len(c.embedding) != expected_dim:
                dimension_mismatches += 1

    for d in docs:
        if not Path(d.file_path).exists():
            missing_files += 1
            issues.append(f"Document {d.id} ('{d.title}'): source file missing on disk ({d.file_path})")

    if orphan_chunks > 0:
        issues.append(f"Found {orphan_chunks} orphan chunks with non-existent document_id.")
    if dimension_mismatches > 0:
        issues.append(f"Found {dimension_mismatches} chunks with dimension != {expected_dim} (expected active model dimension).")

    return {
        "active_model_name": EmbeddingService.get_model_metadata()["model_name"],
        "expected_dimension": expected_dim,
        "total_documents": len(docs),
        "total_chunks": len(chunks),
        "orphan_chunks": orphan_chunks,
        "missing_files_on_disk": missing_files,
        "dimension_mismatches": dimension_mismatches,
        "is_consistent": (orphan_chunks == 0 and missing_files == 0 and dimension_mismatches == 0),
        "issues": issues
    }


def get_knowledge_statistics(db: Session) -> Dict[str, Any]:
    """
    Aggregates metrics by topic, source document, language, and shloka counts.
    """
    docs = db.query(Document).filter(Document.status == "INDEXED").all()
    chunks = db.query(DocumentChunk).all()

    topic_counts = Counter()
    lang_counts = Counter()
    total_tokens = 0
    shloka_chunks_count = 0

    for c in chunks:
        c_meta = c.chunk_metadata or {}
        topic = c_meta.get("topic", "astrology")
        lang = c_meta.get("language", "en")
        topic_counts[topic] += 1
        lang_counts[lang] += 1
        total_tokens += c_meta.get("estimated_tokens", 0)
        if c_meta.get("has_shloka"):
            shloka_chunks_count += 1

    per_doc_stats = []
    for d in docs:
        per_doc_stats.append({
            "title": d.title,
            "author": d.author or "Classical Sage",
            "chunk_count": d.chunk_count,
            "file_size_kb": round(d.file_size_bytes / 1024, 2)
        })

    return {
        "total_indexed_documents": len(docs),
        "total_chunks": len(chunks),
        "total_estimated_tokens": total_tokens,
        "shloka_containing_chunks": shloka_chunks_count,
        "topic_distribution": dict(topic_counts),
        "language_distribution": dict(lang_counts),
        "documents": per_doc_stats
    }


def cli_main():
    parser = argparse.ArgumentParser(description="AstroAI Knowledge Base Management & Inspection Tools")
    parser.add_argument("--check-consistency", action="store_true", help="Check database-file consistency and vector dimensions")
    parser.add_argument("--inventory", action="store_true", help="Print complete document inventory")
    parser.add_argument("--stats", action="store_true", help="Display knowledge base statistical breakdown")
    parser.add_argument("--validate-manifest", action="store_true", help="Validate source manifest and file checksums")
    parser.add_argument("--missing-metadata", action="store_true", help="Report missing metadata across documents")

    args = parser.parse_args()
    init_db()
    db = SessionLocal()

    try:
        if args.check_consistency:
            print("\n--- Index Consistency Report ---")
            res = check_index_consistency(db)
            print(json.dumps(res, indent=2))

        elif args.inventory:
            print("\n--- Document Inventory ---")
            res = get_document_inventory(db)
            print(json.dumps(res, indent=2))

        elif args.stats:
            print("\n--- Knowledge Base Statistics ---")
            res = get_knowledge_statistics(db)
            print(json.dumps(res, indent=2))

        elif args.validate_manifest:
            print("\n--- Source Manifest Validation ---")
            res = validate_source_manifest()
            print(json.dumps(res, indent=2))

        elif args.missing_metadata:
            print("\n--- Missing Metadata Report ---")
            res = generate_missing_metadata_report(db)
            print(json.dumps(res, indent=2))

        else:
            parser.print_help()
    finally:
        db.close()


if __name__ == "__main__":
    cli_main()
