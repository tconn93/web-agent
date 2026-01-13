import httpx
from app.config import settings

BASE_URL = "https://api.x.ai/v1"

async def chat_completion(messages, tools=None, tool_choice="auto"):
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
        response.raise_for_status()
        return response.json()