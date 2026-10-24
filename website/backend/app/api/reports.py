"""
Report generation and download endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path
from packages.database.session import get_db
from packages.core.schemas import ReportGenerateRequest, ReportResponse
from website.backend.app.services.report_service import ReportService
from packages.database.models import Report, BirthChart
from packages.core.identity import Owner, require_owner


def _owned_report(db: Session, report_id: str, owner: Owner):
    """A report, only when its chart belongs to the caller."""
    return (db.query(Report).join(BirthChart, Report.chart_id == BirthChart.id)
            .filter(Report.id == report_id, BirthChart.owner_key == owner.key).first())

router = APIRouter(prefix="/reports", tags=["Astrology Reports"])

@router.post("/generate", response_model=ReportResponse)
def generate_report(
    payload: ReportGenerateRequest,
    db: Session = Depends(get_db),
    owner: Owner = Depends(require_owner)
):
    """Generates a PDF report for a birth chart."""
    try:
        rep = ReportService.generate_report(db=db, request=payload, user_id=owner.user_id, owner_key=owner.key)
        return ReportResponse(
            id=rep.id,
            chart_id=rep.chart_id,
            title=rep.title,
            report_type=rep.report_type,
            status=rep.status,
            download_url=f"/api/v1/reports/{rep.id}/download",
            created_at=rep.created_at
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db), owner: Owner = Depends(require_owner)):
    """Retrieves report status and metadata."""
    rep = _owned_report(db, report_id, owner)
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found.")
    return ReportResponse(
        id=rep.id,
        chart_id=rep.chart_id,
        title=rep.title,
        report_type=rep.report_type,
        status=rep.status,
        download_url=f"/api/v1/reports/{rep.id}/download",
        created_at=rep.created_at
    )

@router.get("/{report_id}/download")
def download_report_pdf(report_id: str, db: Session = Depends(get_db), owner: Owner = Depends(require_owner)):
    """Downloads the compiled PDF report file."""
    rep = _owned_report(db, report_id, owner)
    if not rep or not rep.pdf_path:
        raise HTTPException(status_code=404, detail="Report PDF not found.")

    pdf_p = Path(rep.pdf_path)
    if not pdf_p.exists():
        raise HTTPException(status_code=404, detail="Report file not found on storage disk.")

    return FileResponse(
        path=str(pdf_p),
        filename=f"AstroAI_Kundali_Report_{report_id[:8]}.pdf",
        media_type="application/pdf"
    )

@router.get("", response_model=List[ReportResponse])
def list_reports(db: Session = Depends(get_db), owner: Owner = Depends(require_owner)):
    """Lists the caller's own recent reports."""
    reps = (db.query(Report).join(BirthChart, Report.chart_id == BirthChart.id)
            .filter(BirthChart.owner_key == owner.key).order_by(Report.created_at.desc()).limit(20).all())
    return [
        ReportResponse(
            id=r.id,
            chart_id=r.chart_id,
            title=r.title,
            report_type=r.report_type,
            status=r.status,
            download_url=f"/api/v1/reports/{r.id}/download",
            created_at=r.created_at
        )
        for r in reps
    ]
