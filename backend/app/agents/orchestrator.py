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
                ctx = validate_and_build_chart_context(type("TempRecord", (), {
                    "id": chart_data.get("id", "temp"),
                    "name": chart_data.get("name", "User"),
                    "date_of_birth": chart_data.get("date_of_birth", ""),
                    "time_of_birth": chart_data.get("time_of_birth", ""),
                    "is_time_approximate": chart_data.get("is_time_approximate", False),
                    "city": chart_data.get("city", ""),
                    "country": chart_data.get("country", ""),
                    "latitude": chart_data.get("latitude", 0.0),
                    "longitude": chart_data.get("longitude", 0.0),
                    "timezone_offset": chart_data.get("timezone_offset", 5.5),
                    "system": chart_data.get("system", "Vedic"),
                    "ayanamsa": chart_data.get("ayanamsa", "Lahiri"),
                    "chart_data": chart_data
                })())
            else:
                ctx = validate_and_build_chart_context(None)

        # Step 1: Knowledge base retrieval (for non-greetings)
        from backend.app.rag.retrieval import RetrievalService
        citations = []
        clean_query = user_message.strip().lower()
        is_simple_greet = clean_query in ("hi", "hello", "hii", "hey", "namaste", "pranam")
        if not is_simple_greet:
            citations = RetrievalService.retrieve_relevant_chunks(
                db=db,
                query=user_message,
                top_k=2
            )

        # Step 2: Synthesis through LLMService
        llm_output = LLMService.generate_chat_response(
            user_message=user_message,
            conversation_history=history or [],
            chart_context=ctx,
            chart_data=chart_data,
            citations=citations,
            language=language,
            force_demo_mode=force_demo_mode,
            image_base64=image_base64
        )

        return {
            "content": llm_output["content"],
            "citations": citations,
            "calculated_data_used": llm_output["calculated_data_used"],
            "is_demo_mode": llm_output["is_demo_mode"],
            "chart_svg": llm_output.get("chart_svg"),
            "is_palm_analysis": llm_output.get("is_palm_analysis", False),
            "tool_trace": [
                {
                    "tool": "retrieve_astrology_knowledge",
                    "status": "success",
                    "retrieved_count": len(citations)
                }
            ]
        }
