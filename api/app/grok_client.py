import httpx
import json
from app.config import settings

BASE_URL = "https://api.x.ai/v1"


def validate_messages(messages):
    """
    Validate and sanitize messages before sending to API.
    Returns cleaned messages or raises ValueError.
    """
    cleaned = []
    for i, msg in enumerate(messages):
        if not isinstance(msg, dict):
            raise ValueError(f"Message {i} is not a dict: {type(msg)}")

        role = msg.get("role")
        if role not in ["system", "user", "assistant", "tool"]:
            raise ValueError(f"Message {i} has invalid role: {role}")

        # Ensure content is a string (not None)
        if "content" in msg:
            if msg["content"] is None:
                msg["content"] = ""
            elif not isinstance(msg["content"], str):
                msg["content"] = str(msg["content"])

        # Validate assistant messages with tool calls
        if role == "assistant" and msg.get("tool_calls"):
            # Content must be present (can be empty string)
            if "content" not in msg:
                msg["content"] = ""

        # Validate tool messages
        if role == "tool":
            if "tool_call_id" not in msg:
                raise ValueError(f"Tool message {i} missing tool_call_id")
            if "content" not in msg or not msg["content"]:
                msg["content"] = "(no output)"

        cleaned.append(msg)

    return cleaned


async def chat_completion(messages, tools=None, tool_choice="auto"):
    # Validate and sanitize messages before sending
    try:
        messages = validate_messages(messages)
    except ValueError as e:
        print(f"⚠️  Message validation error: {e}")
        raise

    async with httpx.AsyncClient() as client:
        payload = {
            "model": settings.grok_model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 4096,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = tool_choice

        response = await client.post(
            f"{BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {settings.grok_api_key}"},
            json=payload,
            timeout=120.0,
        )

        # If request fails, log the error details before raising
        if response.status_code != 200:
            error_body = response.text
            print(f"❌ Grok API Error {response.status_code}")
            print(f"Response body: {error_body}")
            print(f"Request payload (last 3 messages): {payload['messages'][-3:]}")

        response.raise_for_status()
        return response.json()