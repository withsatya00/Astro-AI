"""
Input validation rules and coordinate checks for birth chart requests.
"""
from typing import Tuple, Optional
import datetime

def validate_birth_coordinates(lat: float, lon: float) -> Tuple[bool, Optional[str]]:
    """Validates geographic latitude (-90 to +90) and longitude (-180 to +180)."""
    if not (-90.0 <= lat <= 90.0):
        return False, f"Latitude {lat} is out of valid range (-90.0 to +90.0)."
    if not (-180.0 <= lon <= 180.0):
        return False, f"Longitude {lon} is out of valid range (-180.0 to +180.0)."
    return True, None

def validate_birth_datetime(
    dob_str: str,
    tob_str: Optional[str]
) -> Tuple[bool, Optional[str]]:
    """Validates date format and time format."""
    try:
        dt = datetime.datetime.strptime(dob_str, "%Y-%m-%d")
        if dt.year < 1800 or dt.year > 2100:
            return False, "Birth year must be between 1800 and 2100."
    except ValueError:
        return False, "Invalid date format. Expected YYYY-MM-DD."

    if tob_str:
        valid_time = False
        for fmt in ("%H:%M:%S", "%H:%M"):
            try:
                datetime.datetime.strptime(tob_str, fmt)
                valid_time = True
                break
            except ValueError:
                pass
        if not valid_time:
            return False, "Invalid time format. Expected HH:MM or HH:MM:SS."

    return True, None
