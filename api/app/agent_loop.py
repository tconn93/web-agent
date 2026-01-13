from typing import AsyncGenerator
from pathlib import Path
import json
from app.grok_client import chat_completion
from app.tools import get_all_tools  # returns list of Tool instances
from app.config import settings

async def run_agent(
    user_message: str,
    workspace: str,
    history: list = None
) -> AsyncGenerator[dict, None]:
    if history is None:
        history = []

    messages = history + [{"role": "user", "content": user_message}]

    tools = get_all_tools()
    tool_schemas = [t.schema for t in tools]
    tool_map = {t.schema["function"]["name"]: t for t in tools}

    workspace_path = Path(workspace).resolve()

    for iteration in range(settings.max_iterations):
        yield {"type": "status", "content": f"Thinking... (iteration {iteration + 1})"}

        response = await chat_completion(messages, tools=tool_schemas)

        msg = response["choices"][0]["message"]
        messages.append(msg)

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

                yield {
                    "type": "tool_result",
                    "tool_name": func_name,
                    "content": result,
                    "success": True
                }

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "name": func_name,
                    "content": result
                })
        else:
            # Final assistant response
            yield {"type": "assistant", "content": msg["content"]}
            break

    else:
        yield {"type": "error", "content": "Max iterations reached — stopping for safety"}