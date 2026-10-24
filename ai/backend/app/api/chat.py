"""
Chat consultation endpoints supporting multi-lingual conversation, chart awareness,
knowledge retrieval, and session history tracking.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from packages.database.session import get_db
from packages.core.schemas import (
    ChatMessageRequest, ChatMessageResponse, ChatSessionResponse, Citation
)
from packages.database.models import ChatSession, ChatMessage, BirthChart
from ai.backend.app.agents.orchestrator import AgentOrchestrator
import re
import json
from packages.core.security import sanitize_user_input

router = APIRouter(prefix="/chat", tags=["Consultation Chat"])

@router.post("", response_model=ChatMessageResponse)
def send_chat_message(
    payload: ChatMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Submits a user question to AstroAI Agent.
    Retrieves grounded chart data and classical references, then produces an authentic response.
    """
    clean_msg = sanitize_user_input(payload.message)
    if not clean_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # 1. Resolve or create ChatSession
    session = None
    if payload.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == payload.session_id).first()

    if not session:
        session = ChatSession(
            title=clean_msg[:40] + ("..." if len(clean_msg) > 40 else ""),
            language=payload.language,
            chart_id=payload.chart_id
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    elif payload.chart_id != session.chart_id:
        # Dynamically switch or update active birth chart profile on this session
        session.chart_id = payload.chart_id
        db.commit()

    # 2. Record user message
    user_msg_record = ChatMessage(
        session_id=session.id,
        role="user",
        content=clean_msg
    )
    db.add(user_msg_record)
    db.commit()

    # 3. Retrieve chart record if associated
    chart_record = None
    chart_data = None
    if session.chart_id:
        chart_record = db.query(BirthChart).filter(BirthChart.id == session.chart_id).first()
        if chart_record:
            chart_data = dict(chart_record.chart_data or {})
            chart_data["name"] = chart_record.name
            chart_data["id"] = chart_record.id
            chart_data["city"] = chart_record.city
            chart_data["date_of_birth"] = chart_record.date_of_birth
            chart_data["time_of_birth"] = chart_record.time_of_birth

    if getattr(payload, "user_name", None):
        if chart_data is None:
            chart_data = {"name": payload.user_name}
        else:
            chart_data["name"] = payload.user_name

    # 4. Fetch past messages for history (excluding the one just inserted)
    past_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(10)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in past_messages]

    # 5. Process turn with Agent Orchestrator
    turn_result = AgentOrchestrator.process_consultation_turn(
        db=db,
        user_message=clean_msg,
        chart_data=chart_data,
        chart_record=chart_record,
        history=history,
        language=payload.language,
        astrologer_id=payload.astrologer_id or "acharya_shastri",
        force_demo_mode=payload.force_demo_mode,
        image_base64=payload.image_base64
    )

    # 6. Save assistant message
    asst_msg_record = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=turn_result["content"],
        msg_metadata={
            "citations": turn_result["citations"],
            "calculated_data_used": turn_result["calculated_data_used"],
            "is_demo_mode": turn_result["is_demo_mode"],
            "tool_trace": turn_result.get("tool_trace"),
            "chart_svg": turn_result.get("chart_svg"),
            "is_palm_analysis": turn_result.get("is_palm_analysis", False),
            "astrologer_id": turn_result.get("astrologer_id", payload.astrologer_id or "acharya_shastri")
        }
    )
    db.add(asst_msg_record)
    db.commit()
    db.refresh(asst_msg_record)

    # Format citations
    citations_output = [
        Citation(
            source_title=c["source_title"],
            author=c.get("author"),
            page_number=c.get("page_number"),
            excerpt=c["excerpt"]
        )
        for c in turn_result["citations"]
    ]

    return ChatMessageResponse(
        id=asst_msg_record.id,
        session_id=session.id,
        role="assistant",
        content=asst_msg_record.content,
        astrologer_id=turn_result.get("astrologer_id", payload.astrologer_id or "acharya_shastri"),
        citations=citations_output,
        calculated_data_used=turn_result["calculated_data_used"],
        is_demo_mode=turn_result["is_demo_mode"],
        tool_trace=turn_result.get("tool_trace"),
        chart_svg=turn_result.get("chart_svg"),
        is_palm_analysis=turn_result.get("is_palm_analysis", False),
        created_at=asst_msg_record.created_at
    )

@router.get("/astrologers")
def list_astrologer_personas():
    """Returns available expert astrologer personas with bios, specialties, and tones."""
    from ai.backend.app.agents.personas import get_all_personas
    return get_all_personas()

@router.post("/stream")
async def stream_chat_message(
    payload: ChatMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Streams consultation chat response word-by-word via Server-Sent Events (SSE).
    Provides zero-waiting live typing experience with full persona and chart grounding.
    """
    import json
    from fastapi.responses import StreamingResponse
    from ai.backend.app.services.llm_service import LLMService

    clean_msg = sanitize_user_input(payload.message)
    if not clean_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # 1. Resolve or create ChatSession
    session = None
    if payload.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == payload.session_id).first()

    if not session:
        session = ChatSession(
            title=clean_msg[:40] + ("..." if len(clean_msg) > 40 else ""),
            language=payload.language,
            chart_id=payload.chart_id
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    elif payload.chart_id != session.chart_id:
        session.chart_id = payload.chart_id
        db.commit()

    # 2. Record user message
    user_msg_record = ChatMessage(
        session_id=session.id,
        role="user",
        content=clean_msg
    )
    db.add(user_msg_record)
    db.commit()

    # 3. Retrieve chart record if associated
    chart_record = None
    chart_data = None
    if session.chart_id:
        chart_record = db.query(BirthChart).filter(BirthChart.id == session.chart_id).first()
        if chart_record:
            chart_data = dict(chart_record.chart_data or {})
            chart_data["name"] = chart_record.name
            chart_data["id"] = chart_record.id
            chart_data["city"] = chart_record.city
            chart_data["date_of_birth"] = chart_record.date_of_birth
            chart_data["time_of_birth"] = chart_record.time_of_birth

    if getattr(payload, "user_name", None):
        if chart_data is None:
            chart_data = {"name": payload.user_name}
        else:
            chart_data["name"] = payload.user_name

    # 4. Fetch past messages for history
    past_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(10)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in past_messages if m.id != user_msg_record.id]

    # Step 1: Knowledge retrieval for citations
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

    session_id_val = session.id
    astrologer_choice = payload.astrologer_id or "acharya_shastri"

    # Step 0: Scope enforcement before streaming
    from ai.backend.app.services.scope_guard import AstrologyScopeGuard
    in_scope, refusal_text, refusal_reason = AstrologyScopeGuard.check_scope(clean_msg, history)
    if not in_scope and refusal_text:
        async def refusal_stream():
            yield f"data: {json.dumps({'event': 'session', 'session_id': session_id_val, 'astrologer_id': astrologer_choice})}\n\n"
            words = re.findall(r'\S+\s*', refusal_text)
            for i in range(0, len(words), 2):
                yield f"data: {json.dumps({'event': 'delta', 'text': ''.join(words[i:i+2])})}\n\n"
                import asyncio
                await asyncio.sleep(0.01)
            # Record refusal
            ref_msg = ChatMessage(
                session_id=session_id_val,
                role="assistant",
                content=refusal_text,
                msg_metadata={"scope_status": "declined", "reason": refusal_reason}
            )
            db.add(ref_msg)
            db.commit()
            db.refresh(ref_msg)
            yield f"data: {json.dumps({'event': 'done', 'message_id': ref_msg.id, 'session_id': session_id_val, 'content': refusal_text, 'scope_status': 'declined', 'is_demo_mode': False, 'astrologer_id': astrologer_choice})}\n\n"

        return StreamingResponse(
            refusal_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
        )

    async def sse_event_generator():
        # Yield metadata start event
        yield f"data: {json.dumps({'event': 'session', 'session_id': session_id_val, 'astrologer_id': astrologer_choice})}\n\n"

        full_collected = ""
        final_meta = {}

        async for chunk in LLMService.stream_chat_response(
            user_message=clean_msg,
            conversation_history=history,
            chart_data=chart_data,
            citations=citations,
            language=payload.language,
            astrologer_id=astrologer_choice,
            force_demo_mode=payload.force_demo_mode,
            image_base64=payload.image_base64
        ):
            if chunk["type"] == "delta":
                full_collected += chunk["text"]
                yield f"data: {json.dumps({'event': 'delta', 'text': chunk['text']})}\n\n"
            elif chunk["type"] == "done":
                final_meta = chunk

        # Persist assistant response to DB
        asst_msg_record = ChatMessage(
            session_id=session_id_val,
            role="assistant",
            content=full_collected.strip(),
            msg_metadata={
                "citations": citations,
                "calculated_data_used": final_meta.get("calculated_data_used", False),
                "is_demo_mode": final_meta.get("is_demo_mode", False),
                "chart_svg": final_meta.get("chart_svg"),
                "astrologer_id": astrologer_choice
            }
        )
        db.add(asst_msg_record)
        db.commit()
        db.refresh(asst_msg_record)

        # Final done event
        done_payload = {
            "event": "done",
            "message_id": asst_msg_record.id,
            "session_id": session_id_val,
            "content": full_collected.strip(),
            "chart_svg": final_meta.get("chart_svg"),
            "citations": citations,
            "is_demo_mode": final_meta.get("is_demo_mode", False),
            "calculated_data_used": final_meta.get("calculated_data_used", False),
            "astrologer_id": astrologer_choice
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


@router.get("/sessions", response_model=List[ChatSessionResponse])
def list_sessions(db: Session = Depends(get_db)):
    """Lists recent consultation sessions."""
    sessions = db.query(ChatSession).order_by(ChatSession.updated_at.desc()).limit(20).all()
    return [
        ChatSessionResponse(
            id=s.id,
            title=s.title,
            language=s.language,
            chart_id=s.chart_id,
            created_at=s.created_at,
            messages=[]
        )
        for s in sessions
    ]

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_session_history(session_id: str, db: Session = Depends(get_db)):
    """Retrieves full conversation history for a consultation session."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    messages_out = []
    for m in session.messages:
        c_list = []
        if m.msg_metadata and "citations" in m.msg_metadata:
            for c in m.msg_metadata["citations"]:
                c_list.append(Citation(
                    source_title=c["source_title"],
                    author=c.get("author"),
                    page_number=c.get("page_number"),
                    excerpt=c["excerpt"]
                ))
        messages_out.append(ChatMessageResponse(
            id=m.id,
            session_id=session.id,
            role=m.role,
            content=m.content,
            citations=c_list,
            calculated_data_used=m.msg_metadata.get("calculated_data_used", False) if m.msg_metadata else False,
            is_demo_mode=m.msg_metadata.get("is_demo_mode", False) if m.msg_metadata else False,
            tool_trace=m.msg_metadata.get("tool_trace") if m.msg_metadata else None,
            created_at=m.created_at
        ))

    return ChatSessionResponse(
        id=session.id,
        title=session.title,
        language=session.language,
        chart_id=session.chart_id,
        created_at=session.created_at,
        messages=messages_out
    )

@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    """Deletes or clears a consultation session and its history."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    # Delete associated messages
    db.query(ChatMessage).filter(ChatMessage.session_id == session.id).delete()
    db.delete(session)
    db.commit()
    return {"status": "success", "message": f"Session {session_id} deleted."}

