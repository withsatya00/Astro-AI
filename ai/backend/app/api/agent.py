"""
Agent console endpoints for inspecting and testing registered agent tools.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from packages.database.session import get_db
from ai.backend.app.agents.tools import TOOL_REGISTRY
from ai.backend.app.agents.orchestrator import AgentOrchestrator
from packages.core.schemas import (
    AgentToolDefinition, ToolParameter, AgentExecuteRequest, AgentExecuteResponse
)

router = APIRouter(prefix="/agent", tags=["AI Agent Console"])

@router.get("/tools", response_model=List[AgentToolDefinition])
def get_available_tools():
    """Lists all registered tools and their validated parameter schemas."""
    definitions = []
    for tool_name, data in TOOL_REGISTRY.items():
        params = [
            ToolParameter(
                name=p["name"],
                type=p["type"],
                description=p["description"],
                required=p["required"]
            )
            for p in data["parameters"]
        ]
        definitions.append(
            AgentToolDefinition(
                name=tool_name,
                description=data["description"],
                parameters=params
            )
        )
    return definitions

@router.post("/execute", response_model=AgentExecuteResponse)
def execute_agent_tool(
    payload: AgentExecuteRequest,
    db: Session = Depends(get_db)
):
    """
    Executes a registered agent tool directly through the controlled orchestrator.
    Enforces security policies, bounds, and latency metrics.
    """
    trace = AgentOrchestrator.execute_tool(
        tool_name=payload.tool_name,
        arguments=payload.arguments,
        db=db
    )
    return AgentExecuteResponse(
        tool_name=trace["tool_name"],
        status=trace["status"],
        duration_ms=trace["duration_ms"],
        result=trace["result"],
        safety_notes=trace.get("safety_notes")
    )
