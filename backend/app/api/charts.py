"""
Birth chart calculation and retrieval endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db.session import get_db
from backend.app.schemas.schemas import (
    BirthChartRequest, BirthChartResponse,
    KundaliMilanRequest, KundaliMilanResponse,
    SadeSatiRequest
)
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

@router.post("/milan", response_model=KundaliMilanResponse)
def compute_kundali_milan(
    payload: KundaliMilanRequest,
    db: Session = Depends(get_db)
):
    """
    Computes authentic Vedic Kundali Milan (36 Gunas Ashtakoota)
    and Manglik Dosha compatibility between Boy (Groom) and Girl (Bride).
    """
    from backend.app.astrology.calculations import calculate_chart
    from backend.app.astrology.kundali_milan import perform_kundali_milan

    # 1. Resolve Boy chart
    boy_chart_data = None
    if payload.boy.chart_id:
        c_record = AstrologyService.get_chart_by_id(db, payload.boy.chart_id)
        if c_record:
            boy_chart_data = c_record.chart_data

    if not boy_chart_data:
        if not payload.boy.date_of_birth:
            raise HTTPException(status_code=400, detail="Boy birth date is required.")
        boy_chart_data = calculate_chart(
            date_of_birth=payload.boy.date_of_birth,
            time_of_birth=payload.boy.time_of_birth or "12:00:00",
            is_time_approximate=payload.boy.is_time_approximate,
            latitude=payload.boy.latitude,
            longitude=payload.boy.longitude,
            timezone_offset=payload.boy.timezone_offset,
            system="Vedic",
            ayanamsa="Lahiri"
        )

    # 2. Resolve Girl chart
    girl_chart_data = None
    if payload.girl.chart_id:
        c_record = AstrologyService.get_chart_by_id(db, payload.girl.chart_id)
        if c_record:
            girl_chart_data = c_record.chart_data

    if not girl_chart_data:
        if not payload.girl.date_of_birth:
            raise HTTPException(status_code=400, detail="Girl birth date is required.")
        girl_chart_data = calculate_chart(
            date_of_birth=payload.girl.date_of_birth,
            time_of_birth=payload.girl.time_of_birth or "12:00:00",
            is_time_approximate=payload.girl.is_time_approximate,
            latitude=payload.girl.latitude,
            longitude=payload.girl.longitude,
            timezone_offset=payload.girl.timezone_offset,
            system="Vedic",
            ayanamsa="Lahiri"
        )

    milan_result = perform_kundali_milan(
        boy_chart_data=boy_chart_data,
        girl_chart_data=girl_chart_data,
        boy_name=payload.boy.name or "Groom (वर)",
        girl_name=payload.girl.name or "Bride (वधू)"
    )

    return milan_result

@router.get("/panchang")
def get_daily_panchang(
    date: Optional[str] = None,
    latitude: float = 28.6139,
    longitude: float = 77.2090,
    timezone_offset: float = 5.5
):
    """
    Computes authentic Vedic Aaj Ka Panchang (Tithi, Nakshatra, Yog, Karan,
    Abhijit Muhurat, Rahu Kaal, Sunrise/Sunset).
    """
    from backend.app.astrology.panchang import calculate_panchang
    return calculate_panchang(
        dt_str=date,
        latitude=latitude,
        longitude=longitude,
        timezone_offset=timezone_offset
    )

@router.post("/sade-sati")
def get_shani_sade_sati(
    payload: SadeSatiRequest,
    db: Session = Depends(get_db)
):
    """
    Computes Shani Sade Sati phase (Rising, Peak, Setting, Dhaiya, Free)
    and Rahu-Ketu transit prabhav for given Moon sign or birth chart.
    """
    from backend.app.astrology.panchang import calculate_sade_sati

    moon_sign = payload.moon_sign
    if not moon_sign and payload.chart_id:
        chart = AstrologyService.get_chart_by_id(db, payload.chart_id)
        if chart and chart.chart_data:
            moon_sign = chart.chart_data.get("moon_sign")

    if not moon_sign:
        moon_sign = "Aries"

    return calculate_sade_sati(moon_sign=moon_sign)

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


@router.get("/{chart_id}/grounded-report")
def get_chart_grounded_report(
    chart_id: str,
    language: str = "en",
    db: Session = Depends(get_db)
):
    """
    Generates a full Chart-to-RAG grounded analysis report for an existing birth chart.
    Detects classical yogas (Pancha Mahapurusha, Gajakesari, etc.), Kuja Dosha,
    Sade Sati, and current Dasha, then retrieves matching classical citations from
    the knowledge base.
    """
    from backend.app.astrology.chart_rag_fusion import ChartRAGFusion

    chart = AstrologyService.get_chart_by_id(db=db, chart_id=chart_id)
    if not chart:
        raise HTTPException(status_code=404, detail="Birth chart not found.")

    report = ChartRAGFusion.generate_grounded_chart_report(
        db=db,
        chart_data=chart.chart_data,
        language=language
    )
    report["chart_id"] = chart.id
    report["name"] = chart.name
    return report


@router.post("/grounded-report")
def calculate_and_generate_grounded_report(
    payload: BirthChartRequest,
    language: str = "en",
    db: Session = Depends(get_db)
):
    """
    Calculates a new birth chart using Swiss Ephemeris and immediately
    generates a grounded classical report with authentic RAG citations.
    """
    from backend.app.astrology.chart_rag_fusion import ChartRAGFusion

    try:
        chart_record = AstrologyService.calculate_and_save_chart(db=db, request=payload)
        report = ChartRAGFusion.generate_grounded_chart_report(
            db=db,
            chart_data=chart_record["chart_data"],
            language=language
        )
        report["chart_id"] = chart_record["id"]
        report["name"] = chart_record["name"]
        return report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grounded chart report generation failed: {str(e)}")
