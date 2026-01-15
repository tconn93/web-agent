from typing import AsyncGenerator
from pathlib import Path
import json
from app.grok_client import chat_completion
from app.tools import get_all_tools  # returns list of Tool instances
from app.config import settings

AGENT_PROMPTS = {
    "planning": """You are a Planning Agent. Your role is to:
- Analyze requirements and ask clarifying questions
- Break down complex tasks into manageable steps
- Design system architecture and data flows
- Create detailed implementation plans
- Identify potential challenges and trade-offs
- Focus on the "what" and "why" before the "how"

You should NOT write implementation code. Instead, focus on understanding, planning, and designing.""",

    "building": """You are a Building Agent. Your role is to:
- Implement code based on specifications and plans
- Write clean, efficient, and well-tested code
- Fix bugs and refactor existing code
- Execute development tasks with precision
- Use the available tools to read, write, and test code
- Focus on getting things done

You should write working code and execute implementation tasks."""
}

async def run_agent(
    user_message: str,
    workspace: str,
    history: list = None,
    agent_type: str = "building"
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

    # Track token usage
    total_input_tokens = 0
    total_output_tokens = 0

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

            # Calculate cost (prices are per million tokens)
            input_cost = (input_tokens / 1_000_000) * settings.input_price
            output_cost = (output_tokens / 1_000_000) * settings.output_price
            total_cost = input_cost + output_cost

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

                # Track file changes
                if func_name == "write_file":
                    yield {
                        "type": "file_change",
                        "action": "write",
                        "file_path": args.get("file_path", ""),
                        "tool_name": func_name
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