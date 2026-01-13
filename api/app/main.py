# backend/app/main.py
import uuid
import asyncio
from datetime import datetime
from typing import Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.grok_client import chat_completion
from app.agent_loop import run_agent
from app.models import (
    WebsocketEvent,
    StatusMessage,
    ThinkingMessage,
    AssistantMessage,
    ToolCallMessage,
    ToolResultMessage,
    ErrorMessage
)
from app.tools import get_all_tools  # Make sure this exists!

app = FastAPI(
    title="Web Agent Hub",
    description="Web UI for autonomous coding agent powered by Grok",
    version="0.1.0"
)

# Allow frontend (Vite default port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Models for HTTP requests ---
class StartSessionRequest(BaseModel):
    initial_prompt: str | None = None
    workspace: str | None = None


class MessageRequest(BaseModel):
    message: str
    session_id: str


# In-memory session storage (for development)
# In production → redis / postgres + session expiration
sessions: Dict[str, Dict[str, Any]] = {}  # session_id → {"history": list, "workspace": Path}


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "grok_model": settings.grok_model,
        "max_iterations": settings.max_iterations
    }


@app.post("/sessions")
async def create_session(req: StartSessionRequest):
    session_id = str(uuid.uuid4())
    
    workspace = req.workspace or settings.default_workspace
    # Make sure workspace exists
    from pathlib import Path
    Path(workspace).mkdir(parents=True, exist_ok=True)

    sessions[session_id] = {
        "history": [],
        "workspace": workspace,
        "created_at": datetime.utcnow().isoformat()
    }

    return {
        "session_id": session_id,
        "workspace": workspace,
        "message": "Session created successfully"
    }


@app.websocket("/ws/{session_id}")
async def agent_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()

    if session_id not in sessions:
        await websocket.send_json(ErrorMessage(
            type="error",
            content="Session not found. Please create a new session first.",
            fatal=True
        ).model_dump())
        await websocket.close()
        return

    session = sessions[session_id]
    history = session["history"]
    workspace = session["workspace"]

    try:
        while True:
            data = await websocket.receive_json()
            user_message = data.get("message", "").strip()

            if not user_message:
                continue

            # Send immediate feedback
            await websocket.send_json(ThinkingMessage().model_dump())
            await websocket.send_json(StatusMessage(
                content=f"Processing your request...",
                done=False
            ).model_dump())

            try:
                # Run the full agent loop with streaming
                async for event_dict in run_agent(
                    user_message=user_message,
                    workspace=workspace,
                    history=history.copy()  # shallow copy - we append in place later
                ):
                    # Convert dict → proper model (for validation & serialization)
                    if event_dict["type"] == "status":
                        event = StatusMessage(**event_dict)
                    elif event_dict["type"] == "thinking":
                        event = ThinkingMessage(**event_dict)
                    elif event_dict["type"] == "assistant":
                        event = AssistantMessage(**event_dict)
                    elif event_dict["type"] == "tool_call":
                        event = ToolCallMessage(**event_dict)
                    elif event_dict["type"] == "tool_result":
                        event = ToolResultMessage(**event_dict)
                    elif event_dict["type"] == "error":
                        event = ErrorMessage(**event_dict)
                    else:
                        event = StatusMessage(type="status", content=str(event_dict))

                    # Send to frontend
                    await websocket.send_json(event.model_dump())

                    # Keep history updated (especially assistant messages & tool results)
                    if event.type in ("assistant", "tool_result"):
                        history.append({
                            "role": event.type,
                            "content": event.content
                        })

            except Exception as e:
                error_msg = f"Agent loop error: {str(e)}"
                print(error_msg)  # server log
                await websocket.send_json(ErrorMessage(
                    content=error_msg,
                    fatal=False
                ).model_dump())

    except WebSocketDisconnect:
        print(f"Client disconnected from session {session_id}")
    except Exception as e:
        print(f"WebSocket error in session {session_id}: {str(e)}")
        try:
            await websocket.send_json(ErrorMessage(
                content="Connection error occurred",
                fatal=True
            ).model_dump())
        except:
            pass
    finally:
        try:
            await websocket.close()
        except:
            pass  # Already closed


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )