"""
Astrology Service coordinating chart calculations, storage, and retrieval.
"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from packages.database.models import BirthChart
from packages.core.schemas import BirthChartRequest
from packages.astrology.calculations import calculate_chart
from packages.astrology.chart_validation import validate_birth_coordinates, validate_birth_datetime
from packages.astrology.interpretations import generate_interpretations
from packages.core.logging import logger

class AstrologyService:
    @staticmethod
    def calculate_and_save_chart(
        db: Session,
        request: BirthChartRequest,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validates input, computes planetary and house positions using Swiss Ephemeris,
        generates interpretations, and persists the chart to the database.
        """
        # Validate coordinates
        valid_coords, coord_err = validate_birth_coordinates(request.latitude, request.longitude)
        if not valid_coords:
            raise ValueError(coord_err)

        # Validate date and time
        valid_dt, dt_err = validate_birth_datetime(request.date_of_birth, request.time_of_birth)
        if not valid_dt:
            raise ValueError(dt_err)

        # Compute astronomical chart
        chart_data = calculate_chart(
            date_of_birth=request.date_of_birth,
            time_of_birth=request.time_of_birth,
            is_time_approximate=request.is_time_approximate,
            latitude=request.latitude,
            longitude=request.longitude,
            timezone_offset=request.timezone_offset,
            system=request.system,
            ayanamsa=request.ayanamsa
        )

        # Add interpretation synthesis
        interpretations = generate_interpretations(chart_data)
        chart_data["interpretations"] = interpretations

        # Persist to database
        db_chart = BirthChart(
            user_id=user_id,
            name=request.name,
            date_of_birth=request.date_of_birth,
            time_of_birth=request.time_of_birth,
            is_time_approximate=request.is_time_approximate,
            latitude=request.latitude,
            longitude=request.longitude,
            timezone_offset=request.timezone_offset,
            city=request.city,
            country=request.country,
            system=request.system,
            ayanamsa=request.ayanamsa,
            chart_data=chart_data
        )
        db.add(db_chart)
        db.commit()
        db.refresh(db_chart)

        logger.info(f"Calculated and saved birth chart id={db_chart.id} for name={request.name}")

        return {
            "id": db_chart.id,
            "name": db_chart.name,
            "date_of_birth": db_chart.date_of_birth,
            "time_of_birth": db_chart.time_of_birth,
            "is_time_approximate": db_chart.is_time_approximate,
            "city": db_chart.city,
            "country": db_chart.country,
            "chart_data": chart_data,
            "created_at": db_chart.created_at
        }

    @staticmethod
    def get_chart_by_id(db: Session, chart_id: str) -> Optional[BirthChart]:
        """Fetches a saved chart by primary key ID."""
        return db.query(BirthChart).filter(BirthChart.id == chart_id).first()
