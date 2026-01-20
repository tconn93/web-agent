from typing import AsyncGenerator
from pathlib import Path
import json
import aiofiles
from app.grok_client import chat_completion
from app.tools import get_all_tools  # returns list of Tool instances
from app.config import settings

AGENT_PROMPTS = {
"planning": """You are the Principal Enterprise Architect. Your role is to define the high-level structure, tech stack, and governance for mission-critical software. You do not write boilerplate code; you design systems.
Primary Responsibilities: 
- Architectural Guardrails: Define the system decomposition (Microservices, Hexagonal, or Layered).
- Decision Records: Document Architectural Decision Records (ADRs) explaining the "Why" behind technology choices.
- Cross-Cutting Concerns: Establish standards for Security (OAuth2/OIDC), Observability (OpenTelemetry), and Data Consistency (Saga patterns, ACID compliance).
- Risk Mitigation: Identify bottlenecks, single points of failure, and technical debt before implementation begins.
Operational Protocol:
 1) Analyze requirements for scalability, availability, and maintainability.
 2) Produce a Technical Blueprint including data models and API specifications (OpenAPI).
 3) Create Lead Developer plans to ensure they align with the blueprint. Write a high-level overview in a PLAN.md file. Break down complex tasks into manageable steps listed out in the TODO.md file.
Tone & Style:
  Abstract, high-level, authoritative, and focused on the "big picture." You prioritize stability and compliance over "shiny" new libraries."""
  ,    
  "building": """You are the Lead Software Engineer. Your role is to translate architectural blueprints into production-ready, high-quality codebases. You manage the "how" of the implementation.
Primary Responsibilities:
- Code Excellence: Enforce SOLID principles, Dry/WET balance, and Clean Code standards.
- Implementation Strategy: Break down Architect blueprints into actionable modules, components, and services.
- Testing Strategy: Implement a testing pyramid (Unit, Integration, and E2E) ensuring 80%+ coverage for business logic.
- Performance: Optimize algorithms, database queries (indexing/caching), and memory management.
Operational Protocol:
1) Review the Architect’s Blueprint.
2) Execute the build, ensuring every function is typed, documented, and error-handled.
Tone & Style:
  Practical, technical, and detail-oriented. You are obbessed with type safety, edge cases, and making the code readable for other humans."""
}

async def run_agent(
    user_message: str,
    workspace: str,
    history: list = None,
    agent_type: str = "building",
    cumulative_tokens: dict = None
) -> AsyncGenerator[dict, None]:
    if history is None:
        history = []

    # Add system prompt based on agent type
    system_prompt = AGENT_PROMPTS.get(agent_type, AGENT_PROMPTS["building"])

    # Insert system message at the beginning if not already present
    if not history or history[0].get("role") != "system":
        messages = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": user_message}]
    else:
        messages = history + [{"role": "user", "content": user_message}]

    tools = get_all_tools()
    tool_schemas = [t.schema for t in tools]
    tool_map = {t.schema["function"]["name"]: t for t in tools}

    workspace_path = Path(workspace).resolve()

    # Track token usage - start from cumulative values if provided
    if cumulative_tokens is None:
        cumulative_tokens = {}
    total_input_tokens = cumulative_tokens.get("input_tokens", 0)
    total_output_tokens = cumulative_tokens.get("output_tokens", 0)
    total_cost = cumulative_tokens.get("estimated_cost", 0.0)

    for iteration in range(settings.max_iterations):
        yield {"type": "status", "content": f"Thinking... (iteration {iteration + 1})"}

        response = await chat_completion(messages, tools=tool_schemas)

        # Track token usage
        if "usage" in response:
            usage = response["usage"]
            input_tokens = usage.get("prompt_tokens", 0)
            output_tokens = usage.get("completion_tokens", 0)
            total_input_tokens += input_tokens
            total_output_tokens += output_tokens

            # Calculate cost (prices are per million tokens) - add to cumulative
            input_cost = (input_tokens / 1_000_000) * settings.input_price
            output_cost = (output_tokens / 1_000_000) * settings.output_price
            total_cost += input_cost + output_cost

            yield {
                "type": "token_usage",
                "input_tokens": total_input_tokens,
                "output_tokens": total_output_tokens,
                "total_tokens": total_input_tokens + total_output_tokens,
                "estimated_cost": round(total_cost, 6)
            }

        msg = response["choices"][0]["message"]

        # Sanitize the assistant message before adding to history
        # The API response format may differ from what's expected in requests
        sanitized_msg = {
            "role": "assistant",
        }

        # Handle content - if null/None when tool_calls exist, set to empty string
        if msg.get("tool_calls"):
            sanitized_msg["tool_calls"] = msg["tool_calls"]
            # Some APIs require content to be a string, not null
            sanitized_msg["content"] = msg.get("content") or ""
        else:
            # Regular text response
            sanitized_msg["content"] = msg.get("content", "")

        messages.append(sanitized_msg)

        if msg.get("tool_calls"):
            for tool_call in msg["tool_calls"]:
                func_name = tool_call["function"]["name"]
                args = json.loads(tool_call["function"]["arguments"])

                yield {
                    "type": "tool_call",
                    "tool_name": func_name,
                    "arguments": args
                }

                # Capture file content BEFORE write operations (non-blocking)
                content_before = None
                if func_name == "write_file":
                    file_path = args.get("path", "")
                    if file_path:
                        full_path = (workspace_path / file_path).resolve()
                        if full_path.exists() and full_path.is_file():
                            try:
                                async with aiofiles.open(full_path, mode='r', encoding='utf-8') as f:
                                    content_before = await f.read()
                            except Exception:
                                content_before = None  # File exists but couldn't read

                tool = tool_map[func_name]
                result = await tool.execute(args, workspace=workspace_path)

                # Ensure result is always a string (never None)
                if result is None:
                    result = "(no output)"
                elif not isinstance(result, str):
                    result = str(result)

                yield {
                    "type": "tool_result",
                    "tool_name": func_name,
                    "content": result,
                    "success": True
                }

                # Track file changes with before/after content
                if func_name == "write_file":
                    content_after = args.get("content", "")
                    yield {
                        "type": "file_change",
                        "action": "write",
                        "file_path": args.get("path", ""),
                        "tool_name": func_name,
                        "content_before": content_before,
                        "content_after": content_after
                    }

                # Add tool result to conversation history
                # Note: Grok API uses "tool" role (OpenAI format)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "content": result  # Must be a non-empty string
                })
        else:
            # Final assistant response
            yield {"type": "assistant", "content": msg["content"]}
            break

    else:
        yield {"type": "error", "content": "Max iterations reached — stopping for safety"}