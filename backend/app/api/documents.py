"""
Knowledge base document management endpoints.
Handles document upload, legal URL import, listing, ingestion reports, and deletion.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
import shutil
import json
import httpx
from backend.app.db.session import get_db
from backend.app.schemas.schemas import DocumentResponse, DocumentImportRequest, DocumentUploadResponse
from backend.app.models.models import Document
from backend.app.rag.ingestion import IngestionPipeline, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES
from backend.app.core.security import secure_filename, validate_outbound_url_ssrf
from backend.app.core.config import settings
from backend.app.core.logging import logger

router = APIRouter(prefix="/documents", tags=["Knowledge Base"])

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    license_type: str = Form("Public Domain / Educational"),
    db: Session = Depends(get_db)
):
    """
    Uploads and indexes an astrology document (PDF, TXT, MD, DOCX).
    Validates file type, size limits, and sanitizes file paths.
    """
    safe_name = secure_filename(file.filename or "uploaded_document.txt")
    ext = Path(safe_name).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {list(ALLOWED_EXTENSIONS)}"
        )

    upload_dir = Path(settings.STORAGE_DIR) / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    destination_path = upload_dir / safe_name

    # Write file safely
    try:
        with open(destination_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    file_size = destination_path.stat().st_size
    if file_size > MAX_FILE_SIZE_BYTES:
        destination_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="File size exceeds maximum permitted limit of 25MB.")

    doc_title = title or safe_name.rsplit(".", 1)[0].replace("_", " ").title()

    try:
        doc = IngestionPipeline.process_and_index_file(
            db=db,
            file_path=str(destination_path),
            title=doc_title,
            author=author or "Astrological Scholar",
            license_str=license_type,
            permission_status="PERMITTED"
        )
        return DocumentUploadResponse(
            id=doc.id,
            title=doc.title,
            status=doc.status,
            message=f"Successfully indexed {doc.chunk_count} chunks."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")

@router.post("/import", response_model=DocumentUploadResponse)
def import_document_url(
    payload: DocumentImportRequest,
    db: Session = Depends(get_db)
):
    """
    Imports a legally permitted public astrology document from a verified URL.
    Enforces SSRF prevention checks.
    """
    if not validate_outbound_url_ssrf(payload.url):
        raise HTTPException(
            status_code=400,
            detail="Forbidden URL. Target IP/host is private, local, or restricted."
        )

    # Download file
    try:
        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            resp = client.get(payload.url)
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Download failed with status {resp.status_code}")
            content = resp.content
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch remote document: {str(e)}")

    upload_dir = Path(settings.DOCUMENTS_DIR) / "approved"
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Determine extension
    url_path = payload.url.split("?")[0]
    ext = Path(url_path).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".txt"

    safe_name = secure_filename(f"imported_{payload.title[:30]}{ext}")
    dest_path = upload_dir / safe_name
    dest_path.write_bytes(content)

    try:
        doc = IngestionPipeline.process_and_index_file(
            db=db,
            file_path=str(dest_path),
            title=payload.title,
            author=payload.author or "Public Domain Author",
            license_str=payload.license_declaration,
            source_url=payload.url,
            permission_status="PERMITTED"
        )
        return DocumentUploadResponse(
            id=doc.id,
            title=doc.title,
            status=doc.status,
            message=f"Successfully imported and indexed {doc.chunk_count} chunks."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")

@router.get("", response_model=List[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    """Lists all documents registered in the knowledge base."""
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return [
        DocumentResponse(
            id=d.id,
            title=d.title,
            author=d.author,
            publisher=d.publisher,
            source_url=d.source_url,
            license=d.license,
            permission_status=d.permission_status,
            file_type=d.file_type,
            file_size_bytes=d.file_size_bytes,
            status=d.status,
            chunk_count=d.chunk_count,
            error_details=d.error_details,
            created_at=d.created_at
        )
        for d in docs
    ]

@router.get("/manifest")
def get_source_manifest():
    """Returns the downloaded ingestion report/manifest."""
    manifest_p = Path(settings.DOCUMENTS_DIR) / "manifests" / "source_manifest.json"
    if manifest_p.exists():
        with open(manifest_p, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"manifest": [], "message": "No manifest file generated yet."}

@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Session = Depends(get_db)
):
    """Deletes an indexed document and its vector chunks."""
    success = IngestionPipeline.delete_document(db=db, doc_id=document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"message": f"Document {document_id} and all related chunks successfully deleted."}
