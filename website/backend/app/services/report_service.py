"""
Report Service coordinating database tracking and PDF compilation.
"""
from typing import Dict, Any, Optional
import os
from pathlib import Path
from sqlalchemy.orm import Session
from packages.database.models import Report, BirthChart
from packages.core.schemas import ReportGenerateRequest
from packages.reports.pdf_generator import generate_astrology_pdf_report
from packages.core.logging import logger

class ReportService:
    @staticmethod
    def generate_report(
        db: Session,
        request: ReportGenerateRequest,
        user_id: Optional[str] = None,
        owner_key: Optional[str] = None
    ) -> Report:
        """Generates a PDF report for a birth chart and persists the record. The chart must belong to `owner_key`."""
        chart = (db.query(BirthChart).filter(BirthChart.id == request.chart_id, BirthChart.owner_key == owner_key).first()
                 if owner_key else None)
        if not chart:
            raise ValueError(f"Birth chart with ID '{request.chart_id}' not found.")

        # Create report record
        rep = Report(
            user_id=user_id,
            chart_id=chart.id,
            report_type=request.report_type,
            title=f"Kundali Report - {chart.name}",
            pdf_path="",
            status="GENERATING",
            report_metadata={"language": request.language}
        )
        db.add(rep)
        db.commit()
        db.refresh(rep)

        try:
            chart_info = {
                "name": chart.name,
                "date_of_birth": chart.date_of_birth,
                "time_of_birth": chart.time_of_birth,
                "is_time_approximate": chart.is_time_approximate,
                "city": chart.city,
                "country": chart.country,
                "chart_data": chart.chart_data
            }

            pdf_path = generate_astrology_pdf_report(
                report_id=rep.id,
                chart_info=chart_info,
                report_type=request.report_type,
                language=request.language
            )

            rep.pdf_path = pdf_path
            rep.status = "COMPLETED"
            db.commit()
            db.refresh(rep)
            return rep

        except Exception as e:
            rep.status = "FAILED"
            db.commit()
            logger.error(f"Failed to generate PDF report: {e}")
            raise e
