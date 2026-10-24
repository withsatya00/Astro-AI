"""
Production-Grade Document Ingestion Pipeline for AstroAI Knowledge Base.

Capabilities:
- Multi-format text extraction: Markdown (.md), Plain Text (.txt), PDF (.pdf), Word (.docx), JSON (.json/.jsonl).
- Metadata extraction: Title, author, publisher, license, source URL, relative path, language, topic.
- Recursive directory scanning and batching.
- SHA256 content-hash tracking for change detection and skip optimization.
- Safe atomic updates: replaces old chunks cleanly without orphaned duplicate records.
- Stale chunk cleanup and idempotency guarantees.
- Batched embedding generation and database writes.
- Dry-run simulation mode.
- Machine-readable JSON and human-readable Markdown ingestion reporting.
- CLI interface: `python -m ai.backend.app.rag.ingestion --source <path> [--dry-run] [--reindex]`
"""
from typing import List, Dict, Any, Tuple, Optional
import os
import sys
import time
import json
import hashlib
from pathlib import Path
from datetime import datetime, timezone
import argparse
from sqlalchemy.orm import Session

from packages.core.config import settings
from packages.core.logging import logger
from packages.database.session import SessionLocal, init_db
from packages.database.models import Document, DocumentChunk
from ai.backend.app.rag.chunking import chunk_document_text, clean_text, detect_language
from ai.backend.app.rag.embeddings import EmbeddingService

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".markdown", ".docx", ".json", ".jsonl"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB safety limit


def compute_sha256(file_path: str) -> str:
    """Computes SHA256 checksum of a file in binary chunks."""
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()


def extract_metadata_from_markdown(content: str) -> Dict[str, Any]:
    """Extracts frontmatter or top-level metadata from markdown documents."""
    meta: Dict[str, Any] = {}
    lines = content.split("\n")[:15]
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
        # Check Title
        if line_clean.startswith("# ") and "title" not in meta:
            meta["title"] = line_clean.lstrip("# ").strip()
        # Check key-value lines like Author: ..., License: ..., Source: ...
        for key in ["Author", "License", "Source", "Publisher", "Topic", "Language"]:
            prefix = f"{key}:"
            prefix_bold = f"**{key}:**"
            if line_clean.lower().startswith(prefix.lower()):
                val = line_clean[len(prefix):].strip().strip("*")
                meta[key.lower()] = val
            elif line_clean.lower().startswith(prefix_bold.lower()):
                val = line_clean[len(prefix_bold):].strip().strip("*")
                meta[key.lower()] = val
    if "source" in meta and "publisher" not in meta:
        meta["publisher"] = meta["source"]
    return meta


_MANIFEST_CACHE: Optional[Dict[str, Dict[str, Any]]] = None

def _get_manifest_entry(file_path: str) -> Optional[Dict[str, Any]]:
    """Looks up source_manifest.json to match file path by name or relative path."""
    global _MANIFEST_CACHE
    if _MANIFEST_CACHE is None:
        _MANIFEST_CACHE = {}
        manifest_p = Path(settings.DOCUMENTS_DIR) / "manifests" / "source_manifest.json"
        if manifest_p.exists():
            try:
                with open(manifest_p, "r", encoding="utf-8") as f:
                    m_data = json.load(f)
                for item in m_data.get("manifest", []):
                    rel = item.get("file_path", "").replace("\\", "/")
                    _MANIFEST_CACHE[rel] = item
                    _MANIFEST_CACHE[Path(rel).name] = item
            except Exception:
                pass

    p = Path(file_path)
    # Check exact filename
    if p.name in _MANIFEST_CACHE:
        return _MANIFEST_CACHE[p.name]
    # Check relative paths
    for k, v in _MANIFEST_CACHE.items():
        if k in file_path.replace("\\", "/"):
            return v
    return None


def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """Extracts text page-by-page from PDF using PyMuPDF (fitz) or pypdf fallback."""
    pages = []
    # Primary: PyMuPDF
    try:
        import fitz
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            if text and text.strip():
                pages.append({
                    "page_number": page_num + 1,
                    "text": text,
                    "section": f"Page {page_num + 1}"
                })
        doc.close()
        if pages:
            return pages
    except Exception as e:
        logger.warning(f"PyMuPDF failed on {file_path} ({e}), trying pypdf fallback.")

    # Fallback: pypdf
    try:
        import pypdf
        reader = pypdf.PdfReader(file_path)
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                pages.append({
                    "page_number": idx + 1,
                    "text": text,
                    "section": f"Page {idx + 1}"
                })
        return pages
    except Exception as e:
        logger.error(f"Failed to extract PDF text from {file_path}: {e}")
        raise ValueError(f"Unable to parse PDF: {e}")


def extract_text_from_docx(file_path: str) -> List[Dict[str, Any]]:
    """Extracts paragraphs and headings from DOCX file."""
    try:
        import docx
        doc = docx.Document(file_path)
        full_text = []
        for p in doc.paragraphs:
            if p.text.strip():
                full_text.append(p.text)
        combined = "\n\n".join(full_text)
        return [{"page_number": 1, "text": combined, "section": "Document Content"}]
    except Exception as e:
        raise ValueError(f"Unable to parse DOCX: {e}")


def extract_text_from_plain_text(file_path: str) -> List[Dict[str, Any]]:
    """Extracts plain text or markdown file, splitting sections on top-level headers."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        if not content.strip():
            return []

        # Split on chapter/section headers to give distinct section names
        import re
        sections = re.split(r"\n(?=#{1,2}\s+)", content)
        pages = []
        for idx, sec in enumerate(sections):
            sec_clean = sec.strip()
            if not sec_clean:
                continue
            first_line = sec_clean.split("\n")[0].strip("# ")
            pages.append({
                "page_number": idx + 1,
                "text": sec_clean,
                "section": first_line[:80] if first_line else f"Section {idx + 1}"
            })

        return pages if pages else [{"page_number": 1, "text": content, "section": "Document Content"}]
    except Exception as e:
        raise ValueError(f"Unable to read text file: {e}")


def extract_text_from_json(file_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text from JSON or JSONL knowledge files.
    Supports list of entries, chapter dictionaries, or shloka records.
    """
    try:
        pages = []
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            raw = f.read().strip()

        if not raw:
            return []

        # Try standard JSON
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            # Try JSON Lines
            data = [json.loads(line) for line in raw.split("\n") if line.strip()]

        if isinstance(data, list):
            for idx, item in enumerate(data):
                if isinstance(item, dict):
                    # Extract common text fields
                    title = item.get("title") or item.get("name") or item.get("chapter") or f"Record {idx + 1}"
                    text_parts = []
                    for k, v in item.items():
                        if isinstance(v, str) and len(v.strip()) > 0:
                            text_parts.append(f"{k.capitalize()}: {v}")
                    combined = "\n\n".join(text_parts)
                    pages.append({
                        "page_number": idx + 1,
                        "text": combined,
                        "section": str(title)[:80]
                    })
                elif isinstance(item, str) and item.strip():
                    pages.append({
                        "page_number": idx + 1,
                        "text": item.strip(),
                        "section": f"Entry {idx + 1}"
                    })
        elif isinstance(data, dict):
            # Dict with keys as sections
            idx = 1
            for k, v in data.items():
                if isinstance(v, str):
                    pages.append({"page_number": idx, "text": f"{k}:\n{v}", "section": str(k)[:80]})
                    idx += 1
                elif isinstance(v, (dict, list)):
                    dumped = json.dumps(v, ensure_ascii=False, indent=2)
                    pages.append({"page_number": idx, "text": f"{k}:\n{dumped}", "section": str(k)[:80]})
                    idx += 1

        return pages
    except Exception as e:
        raise ValueError(f"Unable to parse JSON file {file_path}: {e}")


class IngestionPipeline:
    @staticmethod
    def discover_files(source_path: str, recursive: bool = True) -> List[Path]:
        """Discovers all supported document files in a path or directory."""
        p = Path(source_path).resolve()
        if not p.exists():
            raise FileNotFoundError(f"Source path not found: {source_path}")

        if p.is_file():
            if p.suffix.lower() in ALLOWED_EXTENSIONS:
                return [p]
            raise ValueError(f"File {p.name} has unsupported extension: {p.suffix}")

        files: List[Path] = []
        pattern = "**/*" if recursive else "*"
        for f in p.glob(pattern):
            if f.is_file() and f.suffix.lower() in ALLOWED_EXTENSIONS:
                # Skip hidden files or files in __pycache__
                if not any(part.startswith(".") or part == "__pycache__" for part in f.parts):
                    files.append(f)

        files.sort(key=lambda x: str(x))
        return files

    @staticmethod
    def process_and_index_file(
        db: Session,
        file_path: str,
        title: Optional[str] = None,
        author: Optional[str] = None,
        publisher: Optional[str] = None,
        license_str: str = "Public Domain / CC",
        source_url: Optional[str] = None,
        permission_status: str = "PERMITTED",
        document_topic: Optional[str] = None,
        chunk_size: int = 650,
        chunk_overlap: int = 120,
        force_reindex: bool = False,
        dry_run: bool = False
    ) -> Tuple[Optional[Document], Dict[str, Any]]:
        """
        Validates, extracts, chunks, generates embeddings in batches, and indexes a file.
        Idempotent: skips unchanged files. Safely replaces modified files without orphan chunks.
        """
        path_obj = Path(file_path).resolve()
        if not path_obj.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        file_size = path_obj.stat().st_size
        if file_size == 0:
            return None, {"status": "skipped", "reason": "empty_file", "file_path": str(path_obj)}

        if file_size > MAX_FILE_SIZE_BYTES:
            raise ValueError(f"File size ({file_size} bytes) exceeds limit ({MAX_FILE_SIZE_BYTES} bytes).")

        ext = path_obj.suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported file format: {ext}. Allowed: {ALLOWED_EXTENSIONS}")

        checksum = compute_sha256(str(path_obj))

        # Check existing document by file_path or checksum
        existing_by_path = db.query(Document).filter(Document.file_path == str(path_obj)).first()
        existing_by_hash = db.query(Document).filter(Document.checksum == checksum).first()

        # If identical file is already indexed and not forcing reindex, skip!
        if existing_by_hash and existing_by_hash.status == "INDEXED" and not force_reindex:
            return existing_by_hash, {
                "status": "skipped",
                "reason": "already_indexed",
                "document_id": existing_by_hash.id,
                "title": existing_by_hash.title,
                "chunk_count": existing_by_hash.chunk_count
            }

        # Look up manifest metadata if available
        manifest_meta = _get_manifest_entry(str(path_obj))
        if manifest_meta:
            if not title and manifest_meta.get("title"):
                title = manifest_meta["title"]
            if not author and manifest_meta.get("author"):
                author = manifest_meta["author"]
            if not publisher and manifest_meta.get("publisher"):
                publisher = manifest_meta["publisher"]
            if not document_topic and manifest_meta.get("topic"):
                document_topic = manifest_meta["topic"]
            if manifest_meta.get("license"):
                license_str = manifest_meta["license"]

        # Determine metadata defaults
        doc_title = title or path_obj.stem.replace("_", " ").title()
        doc_author = author
        doc_pub = publisher
        doc_lic = license_str
        doc_topic = document_topic or "vedic_astrology"

        # 1. Extract text
        if ext == ".pdf":
            pages = extract_text_from_pdf(str(path_obj))
        elif ext == ".docx":
            pages = extract_text_from_docx(str(path_obj))
        elif ext in (".json", ".jsonl"):
            pages = extract_text_from_json(str(path_obj))
        else:
            pages = extract_text_from_plain_text(str(path_obj))
            if ext in (".md", ".markdown") and pages:
                # Parse markdown frontmatter if not explicitly provided
                full_raw = "\n".join(p["text"] for p in pages[:2])
                md_meta = extract_metadata_from_markdown(full_raw)
                if not title and md_meta.get("title"):
                    doc_title = md_meta["title"]
                if not author and md_meta.get("author"):
                    doc_author = md_meta["author"]
                if not publisher and md_meta.get("publisher"):
                    doc_pub = md_meta["publisher"]
                if md_meta.get("license"):
                    doc_lic = md_meta["license"]
                if md_meta.get("topic"):
                    doc_topic = md_meta["topic"]

        if not pages:
            return None, {"status": "skipped", "reason": "no_text_extracted", "file_path": str(path_obj)}

        # 2. Chunk text using Astrology-Aware chunker
        temp_doc_id = existing_by_path.id if existing_by_path else checksum[:16]
        chunks_data = chunk_document_text(
            pages,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            doc_id=temp_doc_id,
            document_topic=doc_topic
        )

        if not chunks_data:
            return None, {"status": "skipped", "reason": "no_chunks_produced", "file_path": str(path_obj)}

        # If dry-run mode, report inspection without database modification
        if dry_run:
            total_tokens = sum(c.get("estimated_tokens", 0) for c in chunks_data)
            shloka_chunks = sum(1 for c in chunks_data if c.get("has_shloka"))
            return None, {
                "status": "dry_run_success",
                "file_path": str(path_obj),
                "title": doc_title,
                "checksum": checksum,
                "file_size": file_size,
                "page_count": len(pages),
                "chunk_count": len(chunks_data),
                "shloka_chunks": shloka_chunks,
                "estimated_tokens": total_tokens
            }

        # 3. Handle document record in database atomically
        target_doc = existing_by_path
        action = "updated" if target_doc else "created"

        if not target_doc:
            target_doc = Document(
                title=doc_title,
                author=doc_author,
                publisher=doc_pub,
                source_url=source_url,
                license=doc_lic,
                permission_status=permission_status,
                file_path=str(path_obj),
                file_type=ext.lstrip("."),
                file_size_bytes=file_size,
                checksum=checksum,
                status="PROCESSING",
                doc_metadata={
                    "topic": doc_topic,
                    "language": detect_language(pages[0]["text"] if pages else ""),
                    "ingested_at": datetime.now(timezone.utc).isoformat()
                }
            )
            db.add(target_doc)
            db.commit()
            db.refresh(target_doc)
        else:
            # Update existing document and wipe old chunks cleanly
            target_doc.title = doc_title
            target_doc.author = doc_author or target_doc.author
            target_doc.publisher = doc_pub or target_doc.publisher
            target_doc.license = doc_lic or target_doc.license
            target_doc.checksum = checksum
            target_doc.file_size_bytes = file_size
            target_doc.status = "PROCESSING"
            target_doc.error_details = None
            target_doc.doc_metadata = {
                "topic": doc_topic,
                "language": detect_language(pages[0]["text"] if pages else ""),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            db.commit()

            # Remove previous chunks to avoid duplicate / orphaned chunks
            db.query(DocumentChunk).filter(DocumentChunk.document_id == target_doc.id).delete()
            db.commit()

        # 4. Batched embedding generation
        try:
            chunk_texts = [item["content"] for item in chunks_data]
            embeddings = EmbeddingService.get_embeddings_batch(chunk_texts, batch_size=32)

            chunk_records = []
            for item, vec in zip(chunks_data, embeddings):
                chunk_obj = DocumentChunk(
                    id=item["chunk_id"],
                    document_id=target_doc.id,
                    chunk_index=item["chunk_index"],
                    content=item["content"],
                    page_number=item.get("page_number", 1),
                    section_title=item.get("section_title"),
                    embedding=vec,
                    chunk_metadata={
                        "topic": item.get("topic", doc_topic),
                        "language": item.get("language", "en"),
                        "hierarchy": item.get("hierarchy", []),
                        "has_shloka": item.get("has_shloka", False),
                        "char_count": item.get("char_count", len(item["content"])),
                        "estimated_tokens": item.get("estimated_tokens", 0)
                    }
                )
                chunk_records.append(chunk_obj)

            db.bulk_save_objects(chunk_records)
            target_doc.status = "INDEXED"
            target_doc.chunk_count = len(chunk_records)
            db.commit()
            db.refresh(target_doc)

            logger.info(f"Indexed '{doc_title}' ({target_doc.id}) with {len(chunk_records)} chunks [{action}].")
            return target_doc, {
                "status": "success",
                "action": action,
                "document_id": target_doc.id,
                "title": doc_title,
                "chunks": len(chunk_records)
            }

        except Exception as e:
            db.rollback()
            target_doc.status = "FAILED"
            target_doc.error_details = str(e)
            db.commit()
            logger.error(f"Failed embedding/indexing for '{doc_title}': {e}")
            raise e

    @staticmethod
    def ingest_source(
        source_path: str,
        recursive: bool = True,
        force_reindex: bool = False,
        dry_run: bool = False,
        chunk_size: int = 650,
        chunk_overlap: int = 120
    ) -> Dict[str, Any]:
        """
        Discovers and ingests all documents from a file or directory.
        Generates comprehensive execution statistics and audit reporting.
        """
        t0 = time.time()
        init_db()
        db = SessionLocal()

        discovered = IngestionPipeline.discover_files(source_path, recursive=recursive)
        report: Dict[str, Any] = {
            "source_path": str(source_path),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "dry_run": dry_run,
            "force_reindex": force_reindex,
            "discovered_files_count": len(discovered),
            "processed_count": 0,
            "skipped_count": 0,
            "failed_count": 0,
            "chunks_created": 0,
            "chunks_updated": 0,
            "details": []
        }

        try:
            for file_p in discovered:
                try:
                    doc, result = IngestionPipeline.process_and_index_file(
                        db=db,
                        file_path=str(file_p),
                        chunk_size=chunk_size,
                        chunk_overlap=chunk_overlap,
                        force_reindex=force_reindex,
                        dry_run=dry_run
                    )

                    status = result.get("status")
                    if status == "success":
                        report["processed_count"] += 1
                        if result.get("action") == "updated":
                            report["chunks_updated"] += result.get("chunks", 0)
                        else:
                            report["chunks_created"] += result.get("chunks", 0)
                    elif status == "dry_run_success":
                        report["processed_count"] += 1
                        report["chunks_created"] += result.get("chunk_count", 0)
                    elif status == "skipped":
                        report["skipped_count"] += 1

                    report["details"].append(result)

                except Exception as file_err:
                    report["failed_count"] += 1
                    report["details"].append({
                        "status": "failed",
                        "file_path": str(file_p),
                        "error": str(file_err)
                    })

            report["elapsed_seconds"] = round(time.time() - t0, 3)
            return report

        finally:
            db.close()

    @staticmethod
    def generate_report_files(report_data: Dict[str, Any], output_dir: Optional[str] = None) -> Tuple[str, str]:
        """Writes machine-readable JSON and human-readable Markdown reports to disk."""
        target_dir = Path(output_dir or Path(settings.STORAGE_DIR) / "reports")
        target_dir.mkdir(parents=True, exist_ok=True)
        ts = int(time.time())

        json_path = target_dir / f"ingestion_report_{ts}.json"
        md_path = target_dir / f"ingestion_report_{ts}.md"

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)

        md_content = [
            f"# AstroAI Document Ingestion Audit Report",
            f"- **Execution Timestamp:** {report_data.get('timestamp')}",
            f"- **Source Path:** `{report_data.get('source_path')}`",
            f"- **Dry-Run Mode:** {'Enabled (Simulation)' if report_data.get('dry_run') else 'Disabled (Committed)'}",
            f"- **Force Reindex:** {report_data.get('force_reindex')}",
            f"- **Total Discovered Files:** {report_data.get('discovered_files_count')}",
            f"- **Processed Files:** {report_data.get('processed_count')}",
            f"- **Skipped Files:** {report_data.get('skipped_count')}",
            f"- **Failed Files:** {report_data.get('failed_count')}",
            f"- **Chunks Created:** {report_data.get('chunks_created')}",
            f"- **Chunks Updated:** {report_data.get('chunks_updated')}",
            f"- **Elapsed Time:** {report_data.get('elapsed_seconds')}s\n",
            f"## File-by-File Breakdown",
            f"| Status | Title / File | Chunks / Reason | Details |",
            f"|:---|:---|:---|:---|"
        ]

        for item in report_data.get("details", []):
            st = item.get("status", "unknown")
            name = item.get("title") or Path(item.get("file_path", "")).name or "N/A"
            chunks = item.get("chunks") or item.get("chunk_count") or item.get("reason") or "N/A"
            err = item.get("error") or item.get("action") or ""
            md_content.append(f"| {st.upper()} | {name} | {chunks} | {err} |")

        with open(md_path, "w", encoding="utf-8") as f:
            f.write("\n".join(md_content))

        return str(json_path), str(md_path)

    @staticmethod
    def delete_document(db: Session, doc_id: str) -> bool:
        """Deletes a document and cascades deletion of all its associated indexed chunks."""
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            return False
        db.delete(doc)
        db.commit()
        logger.info(f"Deleted document {doc_id} and its associated chunks.")
        return True


def cli_main():
    """Command Line Interface for Document Ingestion."""
    parser = argparse.ArgumentParser(description="AstroAI Document Ingestion CLI")
    parser.add_argument("--source", "-s", type=str, default=str(settings.DOCUMENTS_DIR), help="Path to file or directory to ingest")
    parser.add_argument("--dry-run", action="store_true", help="Inspect and validate without modifying database")
    parser.add_argument("--reindex", action="store_true", help="Force reindexing of already indexed files")
    parser.add_argument("--provider", type=str, choices=["google_genai", "local_dense"], default=None, help="Embedding provider override (default: from settings)")
    parser.add_argument("--chunk-size", type=int, default=650, help="Chunk size in characters (default: 650)")
    parser.add_argument("--chunk-overlap", type=int, default=120, help="Chunk overlap in characters (default: 120)")
    parser.add_argument("--output-dir", type=str, default=None, help="Directory to save JSON/MD ingestion reports")

    args = parser.parse_args()

    if args.provider:
        EmbeddingService.set_provider(args.provider)

    print(f"\n=======================================================")
    print(f"  AstroAI Knowledge Ingestion Pipeline")
    print(f"  Source: {args.source}")
    print(f"  Provider: {EmbeddingService.get_model_metadata()['provider']} ({EmbeddingService.get_model_metadata()['dimension']}d)")
    print(f"  Dry-Run: {args.dry_run} | Force Reindex: {args.reindex}")
    print(f"=======================================================\n")

    report = IngestionPipeline.ingest_source(
        source_path=args.source,
        force_reindex=args.reindex,
        dry_run=args.dry_run,
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap
    )

    json_p, md_p = IngestionPipeline.generate_report_files(report, output_dir=args.output_dir)

    print(f"[+] Ingestion Finished in {report['elapsed_seconds']}s")
    print(f"    - Discovered: {report['discovered_files_count']}")
    print(f"    - Processed:  {report['processed_count']}")
    print(f"    - Skipped:    {report['skipped_count']}")
    print(f"    - Failed:     {report['failed_count']}")
    print(f"    - Chunks:     {report['chunks_created']} created, {report['chunks_updated']} updated")
    print(f"\n[+] Audit Reports Saved:")
    print(f"    - JSON: {json_p}")
    print(f"    - Markdown: {md_p}\n")


if __name__ == "__main__":
    cli_main()
