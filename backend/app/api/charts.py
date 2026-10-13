"""
Birth chart calculation and retrieval endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.db.session import get_db
from backend.app.schemas.schemas import BirthChartRequest, BirthChartResponse
from backend.app.services.astrology_service import AstrologyService
from backend.app.models.models import BirthChart

router = APIRouter(prefix="/charts", tags=["Birth Charts"])

@router.post("/calculate", response_model=BirthChartResponse)
def calculate_and_create_chart(
    payload: BirthChartRequest,
    db: Session = Depends(get_db)
):
    """
    Calculates full astronomical chart using Swiss Ephemeris, synthesizes
    interpretations, and stores the chart record.
    """
    try:
        chart_result = AstrologyService.calculate_and_save_chart(db=db, request=payload)
        return chart_result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chart calculation failed: {str(e)}")

@router.get("/{chart_id}", response_model=BirthChartResponse)
def get_chart(
    chart_id: str,
    db: Session = Depends(get_db)
):
    """Retrieves a previously calculated birth chart by ID."""
    chart = AstrologyService.get_chart_by_id(db=db, chart_id=chart_id)
    if not chart:
        raise HTTPException(status_code=404, detail="Birth chart not found.")
    return {
        "id": chart.id,
        "name": chart.name,
        "date_of_birth": chart.date_of_birth,
        "time_of_birth": chart.time_of_birth,
        "is_time_approximate": chart.is_time_approximate,
        "city": chart.city,
        "country": chart.country,
        "chart_data": chart.chart_data,
        "created_at": chart.created_at
    }

@router.get("", response_model=List[BirthChartResponse])
def list_recent_charts(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Lists recent calculated birth charts."""
    charts = db.query(BirthChart).order_by(BirthChart.created_at.desc()).limit(limit).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "date_of_birth": c.date_of_birth,
            "time_of_birth": c.time_of_birth,
            "is_time_approximate": c.is_time_approximate,
            "city": c.city,
            "country": c.country,
            "chart_data": c.chart_data,
            "created_at": c.created_at
        }
        for c in charts
    ]
