"""
Controlled AI Agent Orchestrator for AstroAI Agent.
Coordinates multi-step tool execution, bounds enforcement, and grounded synthesis.
"""
from typing import Dict, Any, List, Optional
import time
from sqlalchemy.orm import Session
from backend.app.agents.tools import TOOL_REGISTRY, AgentTools
from backend.app.agents.policies import validate_tool_execution_policy
from backend.app.services.llm_service import LLMService
from backend.app.core.logging import logger

class AgentOrchestrator:
    @staticmethod
    def execute_tool(
        tool_name: str,
        arguments: Dict[str, Any],
        db: Optional[Session] = None,
        call_count: int = 0,
        start_time: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Executes an authorized agent tool with policy enforcement, timeout tracking,
        and latency measurement.
        """
        exec_start = start_time or time.time()
        t0 = time.time()

        # Enforce security and execution policies
        allowed, policy_error = validate_tool_execution_policy(
            tool_name=tool_name,
            arguments=arguments,
            call_count=call_count,
            start_time=exec_start
        )

        if not allowed:
            logger.warning(f"Tool execution blocked by policy: {policy_error}")
            return {
                "tool_name": tool_name,
                "status": "blocked",
                "duration_ms": round((time.time() - t0) * 1000, 2),
                "result": None,
                "safety_notes": policy_error
            }

        tool_meta = TOOL_REGISTRY.get(tool_name)
        if not tool_meta:
            return {
                "tool_name": tool_name,
                "status": "error",
                "duration_ms": round((time.time() - t0) * 1000, 2),
                "result": None,
                "safety_notes": f"Tool '{tool_name}' not registered."
            }

        func = tool_meta["func"]
        try:
            result = func(arguments, db=db)
            dur_ms = round((time.time() - t0) * 1000, 2)
            logger.info(f"Agent executed tool '{tool_name}' in {dur_ms}ms")
            return {
                "tool_name": tool_name,
                "status": "success",
                "duration_ms": dur_ms,
                "result": result,
                "safety_notes": "Execution completed within authorized policies."
            }
        except Exception as e:
            dur_ms = round((time.time() - t0) * 1000, 2)
            logger.error(f"Error executing agent tool '{tool_name}': {e}")
            return {
                "tool_name": tool_name,
                "status": "error",
                "duration_ms": dur_ms,
                "result": None,
                "safety_notes": f"Tool execution failed: {str(e)}"
            }

    @staticmethod
    def process_consultation_turn(
        db: Session,
        user_message: str,
        chart_data: Optional[Dict[str, Any]] = None,
        chart_record: Optional[Any] = None,
        chart_context: Optional[Any] = None,
        history: Optional[List[Dict[str, str]]] = None,
        language: str = "en",
        astrologer_id: str = "acharya_shastri",
        force_demo_mode: bool = False,
        image_base64: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Orchestrates an end-to-end chat turn:
        1. Retrieves relevant classical references from knowledge base.
        2. Validates chart context provenance and astronomical boundaries.
        3. Formulates response using LLMService with guardrails & multimodal palmistry.
        """
        from backend.app.astrology.chart_context import validate_and_build_chart_context

        # Resolve chart context safely
        ctx = chart_context
        if ctx is None:
            if chart_record is not None:
                ctx = validate_and_build_chart_context(chart_record)
            elif chart_data is not None and isinstance(chart_data, dict):
                class TempRecord:
                    def __init__(self, d):
                        self.id = d.get("id", "temp")
                        self.name = d.get("name", "User")
                        self.date_of_birth = d.get("date_of_birth", "")
                        self.time_of_birth = d.get("time_of_birth", "")
                        self.is_time_approximate = d.get("is_time_approximate", False)
                        self.city = d.get("city", "")
                        self.country = d.get("country", "")
                        self.latitude = d.get("latitude", 0.0)
                        self.longitude = d.get("longitude", 0.0)
                        self.timezone_offset = d.get("timezone_offset", 5.5)
                        self.system = d.get("system", "Vedic")
                        self.ayanamsa = d.get("ayanamsa", "Lahiri")
                        self.chart_data = d
                ctx = validate_and_build_chart_context(TempRecord(chart_data))
            else:
                ctx = validate_and_build_chart_context(None)

        # Step 0: Dynamic domain check - block off-topic queries immediately
        from backend.app.services.llm_service import is_in_astrology_domain
        in_domain, refusal = is_in_astrology_domain(user_message)
        if not in_domain and refusal:
            return {
                "content": refusal,
                "astrologer_id": astrologer_id,
                "citations": [],
                "calculated_data_used": False,
                "is_demo_mode": False,
                "chart_svg": None,
                "is_palm_analysis": False,
                "tool_trace": [
                    {
                        "tool": "domain_guardrail_check",
                        "status": "blocked",
                        "reason": "Off-topic non-astrological inquiry rejected."
                    }
                ]
            }

        # Sub-15ms Semantic Cache Fast-Path for general queries
        c_data = chart_data or getattr(chart_record, "chart_data", None)
        if not c_data and not image_base64:
            from backend.app.services.semantic_cache import semantic_cache
            cached = semantic_cache.get(user_message, language, astrologer_id)
            if cached:
                cached["astrologer_id"] = astrologer_id
                cached["tool_trace"] = [
                    {
                        "tool": "semantic_response_cache",
                        "status": "hit",
                        "reason": "Retrieved authenticated classical response from sub-15ms semantic cache."
                    }
                ]
                return cached

        # Step 1: Knowledge base retrieval (for non-greetings)
        from backend.app.rag.retrieval import RetrievalService
        from backend.app.astrology.yoga_detection import analyze_all_chart_yogas
        citations = []
        clean_query = user_message.strip().lower()
        skip_retrieval_set = {
            "hi", "hello", "hii", "hiii", "hey", "namaste", "pranam", "kese ho", "kaise ho",
            "ok", "okay", "theek hai", "thik hai", "achha", "acha", "shukriya", "thanks", "thank you", "dhanyawad"
        }
        if clean_query not in skip_retrieval_set:
            citations = RetrievalService.retrieve_relevant_chunks(
                db=db,
                query=user_message,
                top_k=2
            )

            # Chart-to-RAG feature augmentation: if chart data is present, retrieve matching classical evidence
            c_data = chart_data or getattr(chart_record, "chart_data", None)
            if c_data and isinstance(c_data, dict):
                try:
                    yoga_info = analyze_all_chart_yogas(c_data)
                    chart_queries = yoga_info.get("targeted_rag_queries", [])
                    trigger_keywords = (
                        "yoga", "yog", "dasha", "dasa", "sade sati", "saade saati",
                        "mangal", "manglik", "career", "shani", "guru", "rahu", "ketu",
                        "kundli", "kundali", "chart", "future", "reading", "marriage"
                    )
                    if any(kw in clean_query for kw in trigger_keywords) and chart_queries:
                        top_chart_q = chart_queries[0]
                        extra_hits = RetrievalService.retrieve_relevant_chunks(
                            db=db,
                            query=top_chart_q,
                            top_k=1
                        )
                        existing_ids = {c.get("chunk_id") for c in citations}
                        for eh in extra_hits:
                            if eh.get("chunk_id") not in existing_ids:
                                citations.append(eh)
                except Exception as ex:
                    logger.warning(f"Chart-to-RAG query augmentation skipped: {ex}")

        # Step 2: Synthesis through LLMService
        llm_output = LLMService.generate_chat_response(
            user_message=user_message,
            conversation_history=history or [],
            chart_context=ctx,
            chart_data=chart_data,
            citations=citations,
            language=language,
            astrologer_id=astrologer_id,
            force_demo_mode=force_demo_mode,
            image_base64=image_base64
        )

        # Step 3: Grounding Critic & Astronomical Fact Verification
        final_content = llm_output["content"]
        tool_traces = [
            {
                "tool": "retrieve_astrology_knowledge",
                "status": "success",
                "retrieved_count": len(citations)
            }
        ]
        try:
            from backend.app.astrology.grounding_critic import GroundingCritic
            final_content, audit_flags = GroundingCritic.audit_and_correct_response(
                response_text=final_content,
                chart_context=ctx
            )
            if audit_flags:
                tool_traces.append({
                    "tool": "grounding_critic_audit",
                    "status": "verified_and_corrected",
                    "corrections_count": len(audit_flags),
                    "details": audit_flags
                })
        except Exception as e:
            logger.warning(f"Grounding Critic check skipped: {e}")

        return {
            "content": final_content,
            "astrologer_id": llm_output.get("astrologer_id", astrologer_id),
            "citations": citations,
            "calculated_data_used": llm_output["calculated_data_used"],
            "is_demo_mode": llm_output["is_demo_mode"],
            "chart_svg": llm_output.get("chart_svg"),
            "is_palm_analysis": llm_output.get("is_palm_analysis", False),
            "tool_trace": tool_traces
        }

