"""
Security policies and permission boundaries for AI Agent tool execution.
Prevents unconstrained execution, prompt escape, and destructive actions.
"""
from typing import Dict, Any, Tuple, Optional
import time

MAX_TOOL_CALLS_PER_INVOCATION = 5
MAX_EXECUTION_TIME_SECONDS = 15.0

# Registered safe tools allowed for autonomous execution
AUTHORIZED_TOOLS = {
    "calculate_birth_chart",
    "validate_birth_details",
    "retrieve_astrology_knowledge",
    "explain_planetary_positions",
    "evaluate_compatibility_rules",
    "generate_horoscope",
    "summarize_consultation"
}

# Tools that require explicit user confirmation
CONFIRMATION_REQUIRED_TOOLS = {
    "delete_document",
    "delete_consultation_history",
    "purchase_paid_remedy"
}

def validate_tool_execution_policy(
    tool_name: str,
    arguments: Dict[str, Any],
    call_count: int,
    start_time: float
) -> Tuple[bool, Optional[str]]:
    """
    Enforces strict security checks before executing any agent tool:
    1. Checks if tool is authorized.
    2. Validates execution frequency / recursion limits.
    3. Validates execution timeout.
    4. Guards against destructive unconfirmed tools.
    """
    if call_count >= MAX_TOOL_CALLS_PER_INVOCATION:
        return False, f"Execution limit exceeded (maximum {MAX_TOOL_CALLS_PER_INVOCATION} tool calls allowed per run)."

    elapsed = time.time() - start_time
    if elapsed > MAX_EXECUTION_TIME_SECONDS:
        return False, f"Tool execution timed out ({elapsed:.1f}s exceeded limit of {MAX_EXECUTION_TIME_SECONDS}s)."

    if tool_name in CONFIRMATION_REQUIRED_TOOLS:
        return False, f"Action '{tool_name}' requires explicit user confirmation before execution."

    if tool_name not in AUTHORIZED_TOOLS:
        return False, f"Tool '{tool_name}' is not in the authorized agent registry."

    return True, None
