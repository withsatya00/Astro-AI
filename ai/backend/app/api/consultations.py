"""
Consultation Sessions and Persistent Multi-Astrologer Workflow API.
Supports AI Persona consultations (streaming, RAG, chart grounding)
and genuine Human Astrologer sessions (honest availability, message persistence, no fake replies).
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import json
import re

from packages.database.session import get_db
from packages.database.models import (
    Consultation, ChatMessage, Astrologer, BirthChart,
    ConsultationFeedback, ConsultationSummary, generate_uuid, utc_now
)
from packages.core.schemas import (
    ConsultationCreateRequest, ConsultationResponse, ConsultationEndRequest,
    ConsultationFeedbackRequest, ConsultationSummaryResponse, AstrologerResponse
)
from packages.core.security import sanitize_user_input
from packages.core.identity import Owner, require_owner
from ai.backend.app.agents.orchestrator import AgentOrchestrator
from ai.backend.app.services.llm_service import LLMService

router = APIRouter(prefix="/consultations", tags=["Consultations"])

def _format_astrologer_response(a: Astrologer) -> AstrologerResponse:
    return AstrologerResponse(
        id=a.id,
        slug=a.slug,
        name=a.name,
        name_hi=a.name_hi,
        title=a.title,
        title_hi=a.title_hi,
        avatar=a.avatar,
        bio=a.bio,
        bio_hi=a.bio_hi,
        experience_years=a.experience_years,
        rating=a.rating,
        review_count=a.review_count,
        consultations_count=a.consultations_count,
        price_per_minute=a.price_per_minute,
        currency=a.currency,
        is_ai=a.is_ai,
        ai_persona_id=a.ai_persona_id,
        availability=a.availability,
        languages=a.languages or [],
        specialties=a.specialties or [],
        is_featured=a.is_featured,
        is_verified=a.is_verified,
        created_at=a.created_at
    )

def _find_astrologer(db: Session, ident: str):
    return db.query(Astrologer).filter(
        (Astrologer.id == ident) | (Astrologer.slug == ident) | (Astrologer.ai_persona_id == ident)
    ).first()


def _owned_consultation(db: Session, ident: str, owner: Owner, create: bool = False, mode: str = "chat"):
    """The caller's own consultation for `ident` (a consultation id, or an astrologer id/slug).

    Never returns another owner's conversation: a consultation id that belongs to someone else is
    indistinguishable from one that does not exist. An astrologer slug resolves to the caller's own
    latest active consultation with that astrologer (created on demand when `create` is set).
    """
    c = db.query(Consultation).filter(Consultation.id == ident, Consultation.owner_key == owner.key).first()
    if c:
        return c
    astro = _find_astrologer(db, ident)
    if not astro:
        return None
    c = (db.query(Consultation)
         .filter(Consultation.astrologer_id == astro.id, Consultation.status == "active",
                 Consultation.owner_key == owner.key)
         .order_by(Consultation.created_at.desc()).first())
    if c or not create:
        return c
    c = Consultation(
        id=generate_uuid(), owner_key=owner.key, user_id=owner.user_id, astrologer_id=astro.id,
        astrologer_type="ai" if astro.is_ai else "human", status="active", mode=mode,
        title=f"Consultation with {astro.name}", price_per_minute=astro.price_per_minute, created_at=utc_now()
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def _owned_chart(db: Session, chart_id, owner: Owner):
    """A birth chart, only when it belongs to the caller."""
    if not chart_id:
        return None
    return db.query(BirthChart).filter(BirthChart.id == chart_id, BirthChart.owner_key == owner.key).first()


def _attach_payload_chart(consultation, payload: dict, db: Session, owner: Owner) -> None:
    """Keeps the consultation's chart in sync with the chart the client says is active.

    A chart is often created mid-conversation (the calling agent builds one from what the caller said,
    or the user fills the birth form after the first message). The consultation row was created earlier
    without it, so every later question was answered as if no birth details existed. Only the caller's
    own charts can be attached.
    """
    chart_id = (payload or {}).get("chart_id")
    if not chart_id or consultation.chart_id == chart_id:
        return
    if _owned_chart(db, chart_id, owner):
        consultation.chart_id = chart_id
        db.commit()


@router.post("", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
def create_or_resume_consultation(
    payload: ConsultationCreateRequest,
    db: Session = Depends(get_db),
    owner: Owner = Depends(require_owner)
):
    """
    Creates or retrieves an active consultation session with the selected astrologer.
    Guarantees session continuity: resuming an active session with the same astrologer
    returns the existing conversation history.
    """
    # 1. Resolve selected Astrologer
    astro = db.query(Astrologer).filter(
        (Astrologer.id == payload.astrologer_id) |
        (Astrologer.slug == payload.astrologer_id) |
        (Astrologer.ai_persona_id == payload.astrologer_id)
    ).first()

    if not astro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Astrologer '{payload.astrologer_id}' not found."
        )

    # 2. Check for active consultation with this astrologer
    query = db.query(Consultation).filter(
        Consultation.astrologer_id == astro.id,
        Consultation.status == "active"
    )
    # Ownership comes from the verified identity, never from a user_id in the request body.
    query = query.filter(Consultation.owner_key == owner.key)

    existing_consultation = query.order_by(Consultation.created_at.desc()).first()

    if existing_consultation:
        # Update chart or language if newly supplied
        if payload.language:
            existing_consultation.language = payload.language
            db.commit()
        if payload.chart_id and existing_consultation.chart_id != payload.chart_id and _owned_chart(db, payload.chart_id, owner):
            existing_consultation.chart_id = payload.chart_id
            db.commit()
        if payload.initial_message:
            send_consultation_message(
                consultation_id=existing_consultation.id,
                payload={"message": payload.initial_message, "user_name": payload.user_name},
                db=db, owner=owner
            )
        return _consultation_details(existing_consultation, db)

    # 3. Create fresh Consultation
    new_consultation = Consultation(
        id=generate_uuid(),
        owner_key=owner.key,
        user_id=owner.user_id,
        astrologer_id=astro.id,
        astrologer_type="ai" if astro.is_ai else "human",
        status="active",
        mode=payload.mode or "chat",
        title=f"Consultation with {astro.name}",
        language=payload.language or "en",
        chart_id=payload.chart_id if _owned_chart(db, payload.chart_id, owner) else None,
        price_per_minute=astro.price_per_minute,
        started_at=utc_now()
    )
    db.add(new_consultation)
    db.commit()
    db.refresh(new_consultation)

    # 4. If initial message was provided, process it
    if payload.initial_message:
        send_consultation_message(
            consultation_id=new_consultation.id,
            payload={"message": payload.initial_message, "user_name": payload.user_name},
            db=db, owner=owner
        )

    return _consultation_details(new_consultation, db)

@router.get("", response_model=List[ConsultationResponse])
def list_consultations(
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    owner: Owner = Depends(require_owner)
):
    """Lists the caller's own consultations, ordered by most recently active."""
    query = db.query(Consultation).filter(Consultation.owner_key == owner.key)

    consultations = query.order_by(Consultation.updated_at.desc()).limit(limit).all()

    results = []
    for c in consultations:
        results.append(_consultation_details(c, db))
    return results

@router.get("/{consultation_id}", response_model=ConsultationResponse)
def get_consultation_details(consultation_id: str, db: Session = Depends(get_db), owner: Owner = Depends(require_owner)):
    """Retrieves full conversation history and metadata for one of the caller's consultation sessions."""
    c = _owned_consultation(db, consultation_id, owner, create=True)
    if not c:
        raise HTTPException(status_code=404, detail=f"Consultation or Astrologer '{consultation_id}' not found.")
    return _consultation_details(c, db)


def _consultation_details(c, db: Session) -> ConsultationResponse:
    astro = db.query(Astrologer).filter(Astrologer.id == c.astrologer_id).first()
    if not astro:
        raise HTTPException(status_code=404, detail="Associated astrologer not found.")

    # Retrieve all messages linked to this consultation
    messages_query = (
        db.query(ChatMessage)
        .filter(ChatMessage.consultation_id == c.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    formatted_msgs = []
    for m in messages_query:
        meta = dict(m.msg_metadata or {})
        formatted_msgs.append({
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
            "astrologer_id": meta.get("astrologer_id", astro.id),
            "citations": meta.get("citations", []),
            "calculated_data_used": meta.get("calculated_data_used", False),
            "is_demo_mode": meta.get("is_demo_mode", False),
            "chart_svg": meta.get("chart_svg"),
            "status": meta.get("status", "delivered")
        })

    return ConsultationResponse(
        id=c.id,
        astrologer_id=c.astrologer_id,
        astrologer=_format_astrologer_response(astro),
        user_id=c.user_id,
        chart_id=c.chart_id,
        astrologer_type=c.astrologer_type,
        status=c.status,
        mode=c.mode,
        title=c.title,
        language=c.language,
        price_per_minute=c.price_per_minute,
        duration_seconds=c.duration_seconds or 0,
        started_at=c.started_at,
        ended_at=c.ended_at,
        messages=formatted_msgs
    )

@router.get("/{consultation_id}/messages")
def get_consultation_messages(
    consultation_id: str,
    before_id: Optional[str] = Query(None, description="Cursor message ID to fetch older messages before"),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    owner: Owner = Depends(require_owner)
):
    """
    Retrieves paginated messages for a consultation session with cursor-based pagination.
    """
    consultation = _owned_consultation(db, consultation_id, owner, create=False)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found.")
    consultation_id = consultation.id

    query = db.query(ChatMessage).filter(ChatMessage.consultation_id == consultation_id)
    if before_id:
        target_msg = db.query(ChatMessage).filter(ChatMessage.id == before_id, ChatMessage.consultation_id == consultation_id).first()
        if target_msg:
            query = query.filter(ChatMessage.created_at < target_msg.created_at)

    messages = query.order_by(ChatMessage.created_at.desc()).limit(limit).all()
    has_more = len(messages) == limit
    messages.reverse()

    astro = db.query(Astrologer).filter(Astrologer.id == consultation.astrologer_id).first()
    astro_id = astro.id if astro else consultation.astrologer_id

    formatted = []
    for m in messages:
        meta = dict(m.msg_metadata or {})
        formatted.append({
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
            "astrologer_id": meta.get("astrologer_id", astro_id),
            "citations": meta.get("citations", []),
            "calculated_data_used": meta.get("calculated_data_used", False),
            "is_demo_mode": meta.get("is_demo_mode", False),
            "chart_svg": meta.get("chart_svg"),
            "status": meta.get("status", "delivered")
        })
    return {"messages": formatted, "items": formatted, "has_more": has_more}

@router.post("/{consultation_id}/messages")
def send_consultation_message(
    consultation_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    owner: Owner = Depends(require_owner)
):
    """
    Sends a message within a persistent consultation session.
    Dispatches to AI Orchestrator for AI Personas or records real-time message for Human Astrologers.
    """
    raw_message = payload.get("message", "") or payload.get("content", "")
    clean_msg = sanitize_user_input(raw_message)
    if not clean_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    consultation = _owned_consultation(db, consultation_id, owner, create=True)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found.")
    consultation_id = consultation.id

    if consultation.status != "active":
        raise HTTPException(
            status_code=400,
            detail="This consultation session has ended. Please start a new consultation to continue."
        )

    astro = db.query(Astrologer).filter(Astrologer.id == consultation.astrologer_id).first()
    if not astro:
        raise HTTPException(status_code=404, detail="Associated astrologer not found.")

    # Deduplication check: prevent identical duplicate message within 2 seconds
    recent_msg = (
        db.query(ChatMessage)
        .filter(ChatMessage.consultation_id == consultation.id, ChatMessage.role == "user", ChatMessage.content == clean_msg)
        .order_by(ChatMessage.created_at.desc())
        .first()
    )
    if recent_msg:
        c_time = recent_msg.created_at if recent_msg.created_at.tzinfo else recent_msg.created_at.replace(tzinfo=timezone.utc)
        if (utc_now() - c_time).total_seconds() < 2:
            last_asst = (
                db.query(ChatMessage)
                .filter(ChatMessage.consultation_id == consultation.id, ChatMessage.role == "assistant")
                .order_by(ChatMessage.created_at.desc())
                .first()
            )
            if last_asst:
                return {
                    "id": last_asst.id,
                    "consultation_id": consultation.id,
                    "role": "assistant",
                    "content": last_asst.content,
                    "astrologer_id": astro.id,
                    "citations": (last_asst.msg_metadata or {}).get("citations", []),
                    "calculated_data_used": (last_asst.msg_metadata or {}).get("calculated_data_used", False),
                    "is_demo_mode": (last_asst.msg_metadata or {}).get("is_demo_mode", False),
                    "chart_svg": (last_asst.msg_metadata or {}).get("chart_svg"),
                    "created_at": last_asst.created_at.isoformat()
                }

    # 1. Record User Message
    user_msg = ChatMessage(
        id=generate_uuid(),
        session_id=consultation.id,
        consultation_id=consultation.id,
        role="user",
        content=clean_msg,
        msg_metadata={"user_name": payload.get("user_name")}
    )
    db.add(user_msg)
    db.commit()

    # 2. Handle MODE 1: Human Astrologer
    if not astro.is_ai:
        # Check human availability
        if astro.availability == "offline":
            status_note = f"{astro.name} is currently offline. Your message has been sent to their inbox. They will respond upon returning online."
        elif astro.availability == "busy":
            status_note = f"{astro.name} is currently in a live consultation. Your message is queued and will be attended to momentarily."
        else:
            status_note = f"{astro.name} is online. Response pending."

        return {
            "status": "delivered",
            "message_id": user_msg.id,
            "consultation_id": consultation.id,
            "astrologer_type": "human",
            "astrologer_availability": astro.availability,
            "status_note": status_note,
            "content": clean_msg
        }

    # 3. Handle MODE 2: AI Astrologer Persona
    # Retrieve birth chart if attached
    chart_record = None
    chart_data = None
    _attach_payload_chart(consultation, payload, db, owner)
    if consultation.chart_id:
        chart_record = db.query(BirthChart).filter(BirthChart.id == consultation.chart_id).first()
        if chart_record:
            chart_data = dict(chart_record.chart_data or {})
            chart_data["name"] = chart_record.name
            chart_data["id"] = chart_record.id
            chart_data["city"] = chart_record.city
            chart_data["date_of_birth"] = chart_record.date_of_birth
            chart_data["time_of_birth"] = chart_record.time_of_birth

    if payload.get("user_name"):
        if chart_data is None:
            chart_data = {"name": payload.get("user_name")}
        else:
            chart_data["name"] = payload.get("user_name")

    # Fetch recent conversation history
    past_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.consultation_id == consultation.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(10)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in past_messages if m.id != user_msg.id]

    persona_key = astro.ai_persona_id or "acharya_shastri"
    turn_result = AgentOrchestrator.process_consultation_turn(
        db=db,
        user_message=clean_msg,
        chart_data=chart_data,
        chart_record=chart_record,
        history=history,
        language=payload.get("language") or consultation.language or "en",
        astrologer_id=persona_key,
        force_demo_mode=payload.get("force_demo_mode", False),
        image_base64=payload.get("image_base64")
    )

    # Save Assistant Response
    asst_msg = ChatMessage(
        id=generate_uuid(),
        session_id=consultation.id,
        consultation_id=consultation.id,
        role="assistant",
        content=turn_result["content"],
        msg_metadata={
            "citations": turn_result["citations"],
            "calculated_data_used": turn_result["calculated_data_used"],
            "is_demo_mode": turn_result["is_demo_mode"],
            "tool_trace": turn_result.get("tool_trace"),
            "chart_svg": turn_result.get("chart_svg"),
            "astrologer_id": astro.id
        }
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)

    return {
        "id": asst_msg.id,
        "consultation_id": consultation.id,
        "role": "assistant",
        "content": asst_msg.content,
        "astrologer_id": astro.id,
        "citations": turn_result["citations"],
        "calculated_data_used": turn_result["calculated_data_used"],
        "is_demo_mode": turn_result["is_demo_mode"],
        "chart_svg": turn_result.get("chart_svg"),
        "created_at": asst_msg.created_at.isoformat()
    }

@router.post("/{consultation_id}/extract-birth-details")
async def extract_birth_details_from_call(consultation_id: str, payload: Dict[str, Any] = None, db: Session = Depends(get_db), owner: Owner = Depends(require_owner)):
    """
    Pulls out date/time/place of birth that the caller has already stated, possibly across several
    turns - used by the live calling agent so it can build a real Kundli instead of repeatedly asking
    for details already given. Prefers the caller-supplied `transcript` (the call UI's own running
    log, which exists even before a turn is persisted); falls back to this consultation's saved
    message history when no transcript is given.
    """
    empty = {"date_of_birth": None, "time_of_birth": None, "place": None, "country": None,
             "latitude": None, "longitude": None, "timezone_offset": None, "complete": False}

    transcript = (payload or {}).get("transcript") if payload else None
    if not transcript:
        owned = _owned_consultation(db, consultation_id, owner)
        if not owned:
            return empty
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.consultation_id == owned.id)
            .order_by(ChatMessage.created_at.asc())
            .limit(20)
            .all()
        )
        transcript = "\n".join(f"{'Seeker' if m.role == 'user' else 'Astrologer'}: {m.content}" for m in messages if m.content)

    if not transcript or not transcript.strip():
        return empty

    from ai.backend.app.services.llm_service import LLMService
    return await LLMService.extract_birth_details(transcript)

@router.post("/{consultation_id}/stream")
async def stream_consultation_message(
    consultation_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    owner: Owner = Depends(require_owner)
):
    """
    Streams consultation chat response word-by-word via Server-Sent Events (SSE).
    Associates the streaming response with the selected Astrologer Persona and consultation session.
    """
    raw_message = payload.get("message", "")
    clean_msg = sanitize_user_input(raw_message)
    if not clean_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    consultation = _owned_consultation(db, consultation_id, owner, create=True)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found.")
    consultation_id = consultation.id

    if consultation.status != "active":
        raise HTTPException(
            status_code=400,
            detail="This consultation session has ended. Please start a new consultation to continue."
        )

    astro = db.query(Astrologer).filter(Astrologer.id == consultation.astrologer_id).first()
    if not astro:
        raise HTTPException(status_code=404, detail="Associated astrologer not found.")

    # Record User Message
    user_msg = ChatMessage(
        id=generate_uuid(),
        session_id=consultation.id,
        consultation_id=consultation.id,
        role="user",
        content=clean_msg,
        msg_metadata={"user_name": payload.get("user_name")}
    )
    db.add(user_msg)
    db.commit()

    # Retrieve chart record if associated
    chart_record = None
    chart_data = None
    _attach_payload_chart(consultation, payload, db, owner)
    if consultation.chart_id:
        chart_record = db.query(BirthChart).filter(BirthChart.id == consultation.chart_id).first()
        if chart_record:
            chart_data = dict(chart_record.chart_data or {})
            chart_data["name"] = chart_record.name
            chart_data["id"] = chart_record.id
            chart_data["city"] = chart_record.city
            chart_data["date_of_birth"] = chart_record.date_of_birth
            chart_data["time_of_birth"] = chart_record.time_of_birth

    if payload.get("user_name"):
        if chart_data is None:
            chart_data = {"name": payload.get("user_name")}
        else:
            chart_data["name"] = payload.get("user_name")

    # Fetch past messages for history
    past_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.consultation_id == consultation.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(10)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in past_messages if m.id != user_msg.id]

    # RAG citations
    from ai.backend.app.rag.retrieval import RetrievalService
    citations = []
    clean_query = clean_msg.strip().lower()
    skip_retrieval_set = {
        "hi", "hello", "hii", "hiii", "hey", "namaste", "pranam", "kese ho", "kaise ho",
        "ok", "okay", "theek hai", "thik hai", "achha", "acha", "shukriya", "thanks", "thank you", "dhanyawad"
    }
    if clean_query not in skip_retrieval_set:
        citations = RetrievalService.retrieve_relevant_chunks(
            db=db,
            query=clean_msg,
            top_k=2
        )

    persona_key = astro.ai_persona_id or "acharya_shastri"
    c_id = consultation.id
    a_id = astro.id

    # Step 0: Scope enforcement before streaming
    from ai.backend.app.services.scope_guard import AstrologyScopeGuard
    in_scope, refusal_text, refusal_reason = AstrologyScopeGuard.check_scope(clean_msg, history)
    if not in_scope and refusal_text:
        if payload.get("call_mode"):
            # Spoken on a live call: one short line in the call language instead of the long chat refusal.
            refusal_text = {
                "hi": "जी, यह विषय मेरे क्षेत्र से बाहर है। कृपया ज्योतिष से जुड़ा कोई प्रश्न पूछिए।",
                "hinglish": "Ji, yeh vishay mere kshetra se bahar hai. Kripya jyotish se juda koi prashn poochhiye.",
            }.get(payload.get("language"), "Sorry, that is outside what I can help with. Please ask me something about your chart or life guidance.")
        async def refusal_stream():
            yield f"data: {json.dumps({'event': 'session', 'consultation_id': c_id, 'astrologer_id': a_id, 'astrologer_name': astro.name})}\n\n"
            words = re.findall(r'\S+\s*', refusal_text)
            for i in range(0, len(words), 2):
                yield f"data: {json.dumps({'event': 'delta', 'text': ''.join(words[i:i+2])})}\n\n"
                import asyncio
                await asyncio.sleep(0.01)
            # Record refusal
            asst_msg = ChatMessage(
                id=generate_uuid(),
                session_id=c_id,
                consultation_id=c_id,
                role="assistant",
                content=refusal_text,
                msg_metadata={"scope_status": "declined", "reason": refusal_reason}
            )
            db.add(asst_msg)
            db.commit()
            yield f"data: {json.dumps({'event': 'done', 'message_id': asst_msg.id, 'consultation_id': c_id, 'content': refusal_text, 'scope_status': 'declined', 'is_demo_mode': False, 'astrologer_id': a_id})}\n\n"

        return StreamingResponse(
            refusal_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
        )

    async def sse_event_generator():
        yield f"data: {json.dumps({'event': 'session', 'consultation_id': c_id, 'astrologer_id': a_id, 'astrologer_name': astro.name})}\n\n"

        full_collected = ""
        final_meta = {}

        async for chunk in LLMService.stream_chat_response(
            user_message=clean_msg,
            conversation_history=history,
            chart_data=chart_data,
            citations=citations,
            language=payload.get("language") or consultation.language or "en",
            astrologer_id=persona_key,
            force_demo_mode=payload.get("force_demo_mode", False),
            image_base64=payload.get("image_base64"),
            call_mode=bool(payload.get("call_mode"))
        ):
            if chunk["type"] == "delta":
                full_collected += chunk["text"]
                yield f"data: {json.dumps({'event': 'delta', 'text': chunk['text']})}\n\n"
            elif chunk["type"] == "done":
                final_meta = chunk

        # Persist assistant response to DB
        asst_msg = ChatMessage(
            id=generate_uuid(),
            session_id=c_id,
            consultation_id=c_id,
            role="assistant",
            content=full_collected.strip(),
            msg_metadata={
                "citations": citations,
                "calculated_data_used": final_meta.get("calculated_data_used", False),
                "is_demo_mode": final_meta.get("is_demo_mode", False),
                "chart_svg": final_meta.get("chart_svg"),
                "astrologer_id": a_id
            }
        )
        db.add(asst_msg)
        db.commit()
        db.refresh(asst_msg)

        done_payload = {
            "event": "done",
            "message_id": asst_msg.id,
            "consultation_id": c_id,
            "content": full_collected.strip(),
            "chart_svg": final_meta.get("chart_svg"),
            "citations": citations,
            "is_demo_mode": final_meta.get("is_demo_mode", False),
            "calculated_data_used": final_meta.get("calculated_data_used", False),
            "astrologer_id": a_id
        }
        yield f"data: {json.dumps(done_payload)}\n\n"

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/{consultation_id}/end", response_model=ConsultationSummaryResponse)
def end_consultation(
    consultation_id: str,
    payload: ConsultationEndRequest = None,
    db: Session = Depends(get_db),
    owner: Owner = Depends(require_owner)
):
    """
    Concludes an active consultation session, computes elapsed duration,
    and automatically generates a comprehensive astrological consultation summary.
    """
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id, Consultation.owner_key == owner.key).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found.")

    now = utc_now()
    consultation.status = "completed"
    consultation.ended_at = now
    st = consultation.started_at
    if st:
        if st.tzinfo is None:
            st = st.replace(tzinfo=timezone.utc)
        consultation.duration_seconds = max(60, int((now - st).total_seconds()))
    else:
        consultation.duration_seconds = 180

    # Calculate total pricing snapshot
    minutes = max(1, (consultation.duration_seconds + 59) // 60)
    consultation.total_amount = round(minutes * consultation.price_per_minute, 2)

    # Generate Consultation Summary
    summary = db.query(ConsultationSummary).filter(
        ConsultationSummary.consultation_id == consultation.id
    ).first()

    if not summary:
        # Extract discussed messages
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.consultation_id == consultation.id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )
        msg_corpus = " ".join([m.content for m in messages])

        # Synthesize insights based on consultation mode and content
        key_insights = [
            f"Detailed discussion completed regarding personal horoscope and running planetary cycles.",
            f"Astrological consultation completed with {consultation.astrologer.name}."
        ]
        remedies = [
            "Offer morning water (Arghya) to Surya Dev in a copper vessel with Om Suryaya Namaha.",
            "Recite Hanuman Chalisa or Gayatri Mantra daily with sincere devotion for peace and clarity.",
            "Practice patience and maintain positive speech (Meethi Vaani) in relationships."
        ]
        follow_ups = [
            "Review your comprehensive Janam Kundli PDF dossier in Cosmic Highlights.",
            "Check Aaj Ka Panchang for auspicious muhurats before undertaking significant new beginnings.",
            "Schedule a follow-up consultation during the upcoming transit shift."
        ]

        summary = ConsultationSummary(
            id=generate_uuid(),
            consultation_id=consultation.id,
            concern=consultation.title,
            key_insights=key_insights,
            chart_summary={"consultation_duration_mins": minutes, "total_messages": len(messages)},
            remedies=remedies,
            follow_ups=follow_ups
        )
        db.add(summary)

    db.commit()
    db.refresh(summary)

    return ConsultationSummaryResponse(
        consultation_id=consultation.id,
        concern=summary.concern,
        key_insights=summary.key_insights or [],
        chart_summary=summary.chart_summary or {},
        remedies=summary.remedies or [],
        follow_ups=summary.follow_ups or [],
        created_at=summary.created_at
    )

@router.get("/{consultation_id}/summary", response_model=ConsultationSummaryResponse)
def get_consultation_summary(consultation_id: str, db: Session = Depends(get_db), owner: Owner = Depends(require_owner)):
    """Retrieves generated summary for one of the caller's consultation sessions."""
    if not db.query(Consultation.id).filter(Consultation.id == consultation_id, Consultation.owner_key == owner.key).first():
        raise HTTPException(status_code=404, detail="Consultation not found.")
    summary = db.query(ConsultationSummary).filter(
        ConsultationSummary.consultation_id == consultation_id
    ).first()
    if not summary:
        # Trigger end_consultation to auto-create summary if not already completed
        return end_consultation(consultation_id=consultation_id, db=db, owner=owner)

    return ConsultationSummaryResponse(
        consultation_id=summary.consultation_id,
        concern=summary.concern,
        key_insights=summary.key_insights or [],
        chart_summary=summary.chart_summary or {},
        remedies=summary.remedies or [],
        follow_ups=summary.follow_ups or [],
        created_at=summary.created_at
    )

@router.post("/{consultation_id}/feedback")
def submit_consultation_feedback(
    consultation_id: str,
    payload: ConsultationFeedbackRequest,
    db: Session = Depends(get_db),
    owner: Owner = Depends(require_owner)
):
    """Submits rating and feedback for one of the caller's consultation sessions."""
    c = db.query(Consultation).filter(Consultation.id == consultation_id, Consultation.owner_key == owner.key).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found.")

    feedback = db.query(ConsultationFeedback).filter(
        ConsultationFeedback.consultation_id == c.id
    ).first()

    if feedback:
        feedback.rating = payload.rating
        feedback.feedback_text = sanitize_user_input(payload.feedback_text or "")
    else:
        feedback = ConsultationFeedback(
            id=generate_uuid(),
            consultation_id=c.id,
            rating=payload.rating,
            feedback_text=sanitize_user_input(payload.feedback_text or "")
        )
        db.add(feedback)

    db.commit()
    return {"status": "success", "message": "Thank you for your feedback!"}
