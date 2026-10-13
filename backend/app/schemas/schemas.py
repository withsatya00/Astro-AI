"""
Pydantic v2 schemas for request and response validation in AstroAI Agent.
"""
from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, field_validator

# ----------------- Health & Status -----------------
class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    app_name: str
    environment: str
    demo_mode: bool
    timestamp: datetime

class ReadinessComponentStatus(BaseModel):
    status: str
    details: Optional[str] = None

class ReadinessResponse(BaseModel):
    status: str
    components: Dict[str, ReadinessComponentStatus]
    timestamp: datetime

# ----------------- Birth Chart Schemas -----------------
class BirthChartRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Name of the person")
    date_of_birth: str = Field(..., description="Date of birth in YYYY-MM-DD format")
    time_of_birth: Optional[str] = Field("12:00:00", description="Time of birth in HH:MM:SS or HH:MM format")
    is_time_approximate: bool = Field(False, description="Whether the exact birth time is unknown/approximate")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Birthplace latitude (-90 to +90)")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Birthplace longitude (-180 to +180)")
    timezone_offset: float = Field(..., ge=-12.0, le=14.0, description="UTC offset in hours, e.g. 5.5 for IST")
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    system: str = Field("Vedic", description="Astrology system: 'Vedic' or 'Western'")
    ayanamsa: str = Field("Lahiri", description="Ayanamsa for sidereal calculations: Lahiri, Raman, Krishnamurti")

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: str) -> str:
        try:
            parts = v.split("-")
            if len(parts) != 3:
                raise ValueError
            year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
            if not (1800 <= year <= 2100 and 1 <= month <= 12 and 1 <= day <= 31):
                raise ValueError
        except Exception:
            raise ValueError("date_of_birth must be a valid date in YYYY-MM-DD format between 1800 and 2100")
        return v

class PlanetPosition(BaseModel):
    name: str
    longitude: float
    sign: str
    sign_lord: str
    degree_in_sign: float
    house: int
    nakshatra: str
    nakshatra_lord: str
    pada: int
    is_retrograde: bool

class HousePosition(BaseModel):
    house_number: int
    sign: str
    sign_lord: str
    degree: float

class DashaPeriod(BaseModel):
    planet: str
    start_date: str
    end_date: str
    duration_years: float

class ChartData(BaseModel):
    ascendant: float
    ascendant_sign: str
    ascendant_nakshatra: str
    ascendant_pada: int
    sun_sign: str
    moon_sign: str
    moon_nakshatra: str
    moon_pada: int
    planets: List[PlanetPosition]
    houses: List[HousePosition]
    dashas: List[DashaPeriod]
    navamsha_lagna: Optional[str] = None
    system: str
    ayanamsa: str
    julian_day: float
    calculation_engine: str = "Swiss Ephemeris (pyswisseph)"

class BirthChartResponse(BaseModel):
    id: Optional[str] = None
    name: str
    date_of_birth: str
    time_of_birth: Optional[str]
    is_time_approximate: bool
    city: Optional[str]
    country: Optional[str]
    chart_data: ChartData
    created_at: Optional[datetime] = None

# ----------------- Chat Schemas -----------------
class Citation(BaseModel):
    source_title: str
    author: Optional[str] = None
    page_number: Optional[int] = None
    excerpt: str

class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = None
    chart_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=4000)
    language: str = Field("en", description="Language: 'en', 'hi', or 'hinglish'")
    force_demo_mode: bool = False

class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    citations: List[Citation] = []
    calculated_data_used: bool = False
    is_demo_mode: bool = False
    tool_trace: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

class ChatSessionResponse(BaseModel):
    id: str
    title: str
    language: str
    chart_id: Optional[str] = None
    created_at: datetime
    messages: List[ChatMessageResponse] = []

# ----------------- Document & RAG Schemas -----------------
class DocumentResponse(BaseModel):
    id: str
    title: str
    author: Optional[str]
    publisher: Optional[str]
    source_url: Optional[str]
    license: str
    permission_status: str
    file_type: str
    file_size_bytes: int
    status: str
    chunk_count: int
    error_details: Optional[str]
    created_at: datetime

class DocumentImportRequest(BaseModel):
    url: str = Field(..., description="Legally accessible public astrology document URL")
    title: str = Field(..., min_length=2, max_length=255)
    author: Optional[str] = None
    license_declaration: str = Field("Public Domain / Creative Commons", description="License justification")

class DocumentUploadResponse(BaseModel):
    id: str
    title: str
    status: str
    message: str

# ----------------- Report Schemas -----------------
class ReportGenerateRequest(BaseModel):
    chart_id: str
    report_type: str = Field("comprehensive_kundali", description="comprehensive_kundali, career_focus, marriage_compatibility")
    language: str = Field("en", description="'en' or 'hi'")

class ReportResponse(BaseModel):
    id: str
    chart_id: str
    title: str
    report_type: str
    status: str
    download_url: str
    created_at: datetime

# ----------------- Agent Testing Console Schemas -----------------
class ToolParameter(BaseModel):
    name: str
    type: str
    description: str
    required: bool

class AgentToolDefinition(BaseModel):
    name: str
    description: str
    parameters: List[ToolParameter]

class AgentExecuteRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    force_demo_mode: bool = False

class AgentExecuteResponse(BaseModel):
    tool_name: str
    status: str  # success, error, blocked
    duration_ms: float
    result: Any
    safety_notes: Optional[str] = None
