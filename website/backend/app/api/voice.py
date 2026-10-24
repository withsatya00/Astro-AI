"""
Neural Voice & Text-To-Speech (TTS) Service for Realistic Vedic Astrologer Calling Agents.
Powered by Microsoft Azure Neural Indian Voices via edge-tts (Zero External API Cost).
Provides authentic, lifelike Hindi Pandit (Male) and Vidushi (Female) voices.
"""
import re
import hashlib
import asyncio
from pathlib import Path
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Query, HTTPException, Response
from fastapi.responses import FileResponse, StreamingResponse
from packages.core.logging import logger

router = APIRouter(prefix="/voice", tags=["Voice & Calling Agent TTS"])

# Local disk cache for generated speech files
CACHE_DIR = Path(__file__).resolve().parent.parent.parent.parent / ".cache" / "tts"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# High-Fidelity Indian Neural Voices
VOICE_MAP = {
    "male": "hi-IN-MadhurNeural",       # Authentic Indian Male Pandit (Calm, Vedic, Natural Baritone)
    "female": "hi-IN-SwaraNeural",      # Authentic Indian Female Vidushi (Respectful, Warm Scholar)
    "male_alt": "en-IN-PrabhatNeural",  # Indian English/Hindi Bilingual Male
    "female_alt": "en-IN-NeerjaNeural"  # Indian English/Hindi Bilingual Female
}

def clean_speech_text(text: str) -> str:
    """Cleans text of markdown symbols, emojis, and formatting to deliver natural Hindi speech."""
    if not text:
        return ""
    # Remove markdown bold/italics/code/headers
    cleaned = re.sub(r'[*#_~`>]', ' ', text)
    # Remove emojis and special unicode symbols (like 🕉️, 🪐, 🔮, 📞, 💎)
    cleaned = re.sub(r'[\U00010000-\U0010ffff]', '', cleaned)
    cleaned = re.sub(r'[\u2600-\u27bf]', '', cleaned)
    cleaned = re.sub(r'[\u2300-\u23ff]', '', cleaned)
    cleaned = re.sub(r'[\ufe00-\ufe0f]', '', cleaned)
    # Replace multiple spaces and newlines
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

class TTSRequest(BaseModel):
    text: str
    gender: Optional[str] = "male"
    voice: Optional[str] = None
    language: str = "hi"
    rate: Optional[str] = "-4%"
    pitch: Optional[str] = "-2Hz"

@router.get("/voices")
def get_available_voices():
    """Lists available realistic Indian neural voices."""
    return {
        "status": "success",
        "voices": [
            {
                "id": "hi-IN-MadhurNeural",
                "name": "Pt. Madhur (Vedic Pandit)",
                "gender": "male",
                "language": "hi-IN",
                "description": "Authentic Indian Pandit Ji with calm, serene, respectful Vedic cadence"
            },
            {
                "id": "hi-IN-SwaraNeural",
                "name": "Vidushi Swara (Vedic Scholar)",
                "gender": "female",
                "language": "hi-IN",
                "description": "Authentic Indian Vidushi with serene, dignified, learned cadence"
            },
            {
                "id": "en-IN-PrabhatNeural", "name": "Prabhat (Indian English)",
                "gender": "male", "language": "en-IN"
            },
            {
                "id": "en-IN-NeerjaNeural", "name": "Neerja (Indian English)",
                "gender": "female", "language": "en-IN"
            }
        ]
    }

@router.get("/tts")
async def generate_speech_get(
    text: str = Query(..., description="Text in Hindi or Sanskritized Hindi to speak"),
    gender: str = Query("male", description="'male' for Pandit Ji or 'female' for Vidushi"),
    voice: Optional[str] = Query(None, description="Direct voice name override"),
    rate: str = Query("-4%", description="Speech rate adjustment"),
    pitch: str = Query("-2Hz", description="Voice pitch adjustment"),
    language: str = Query("hi", description="Language of the spoken response")
):
    """
    Real-time high-fidelity streaming & cached TTS audio endpoint.
    Returns audio/mpeg stream or cached mp3 directly playable by HTML5 Audio.
    """
    return await _process_tts(text=text, gender=gender, voice_override=voice, rate=rate, pitch=pitch, language=language)

@router.post("/tts")
async def generate_speech_post(payload: TTSRequest):
    """POST variant for longer text payloads."""
    return await _process_tts(
        text=payload.text,
        gender=payload.gender or "male",
        voice_override=payload.voice,
        rate=payload.rate or "-4%",
        pitch=payload.pitch or "-2Hz",
        language=payload.language
    )

async def _process_tts(text: str, gender: str, voice_override: Optional[str], rate: str, pitch: str, language: str = "hi"):
    cleaned = clean_speech_text(text)
    if not cleaned or len(cleaned) < 2:
        raise HTTPException(status_code=400, detail="Text payload too short or empty after sanitization")

    # Select voice
    voice_name = voice_override
    if not voice_name:
        is_female = gender.lower() in ("female", "f", "vidushi")
        family = "female" if is_female else "male"
        if language.lower().split('-')[0] == "en": family += "_alt"
        voice_name = VOICE_MAP[family]

    # Compute cache key
    cache_string = f"{voice_name}_{rate}_{pitch}_{cleaned}"
    cache_hash = hashlib.sha256(cache_string.encode("utf-8")).hexdigest()
    cache_file = CACHE_DIR / f"{cache_hash}.mp3"

    if cache_file.exists() and cache_file.stat().st_size > 1000:
        return FileResponse(
            path=str(cache_file),
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "public, max-age=604800",
                "Accept-Ranges": "bytes",
                "X-Speech-Voice": voice_name
            }
        )

    # Generate via edge-tts. The service sometimes rejects particular rate/pitch values with
    # "No audio was received", so fall back to simpler prosody instead of failing the whole call.
    attempts = [(rate, pitch), (rate, "+0Hz"), ("+0%", "+0Hz")]
    last_error: Optional[Exception] = None
    try:
        import edge_tts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis error: {str(e)}")
    for attempt_rate, attempt_pitch in attempts:
        try:
            communicate = edge_tts.Communicate(cleaned, voice=voice_name, rate=attempt_rate, pitch=attempt_pitch)
            await asyncio.wait_for(communicate.save(str(cache_file)), timeout=25)
            if cache_file.exists() and cache_file.stat().st_size > 500:
                return FileResponse(
                    path=str(cache_file),
                    media_type="audio/mpeg",
                    headers={
                        "Cache-Control": "public, max-age=604800",
                        "Accept-Ranges": "bytes",
                        "X-Speech-Voice": voice_name
                    }
                )
            last_error = RuntimeError("Failed to synthesize voice audio")
        except Exception as e:
            last_error = e
        if cache_file.exists():
            try:
                cache_file.unlink()
            except Exception:
                pass
    logger.error(f"Neural TTS generation error: {last_error}")
    raise HTTPException(status_code=500, detail=f"Speech synthesis error: {str(last_error)}")
