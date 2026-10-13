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
        history: Optional[List[Dict[str, str]]] = None,
        language: str = "en",
        force_demo_mode: bool = False
    ) -> Dict[str, Any]:
        """
        Orchestrates an end-to-end chat turn:
        1. Retrieves relevant classical references from knowledge base.
        2. Gathers verified calculations from active chart.
        3. Formulates response using LLMService.
        """
        # Step 1: Knowledge base retrieval
        from backend.app.rag.retrieval import RetrievalService
        citations = RetrievalService.retrieve_relevant_chunks(
            db=db,
            query=user_message,
            top_k=3
        )

        # Step 2: Synthesis through LLMService
        llm_output = LLMService.generate_chat_response(
            user_message=user_message,
            conversation_history=history or [],
            chart_data=chart_data,
            citations=citations,
            language=language,
            force_demo_mode=force_demo_mode
        )

        return {
            "content": llm_output["content"],
            "citations": citations,
            "calculated_data_used": llm_output["calculated_data_used"],
            "is_demo_mode": llm_output["is_demo_mode"],
            "tool_trace": [
                {
                    "tool": "retrieve_astrology_knowledge",
                    "status": "success",
                    "retrieved_count": len(citations)
                }
            ]
        }
