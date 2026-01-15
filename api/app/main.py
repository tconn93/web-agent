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
    ErrorMessage,
    TokenUsageMessage,
    FileChangeMessage
)
from app.tools import get_all_tools  # Make sure this exists!

app = FastAPI(
    title="Web Agent Hub",
    description="Web UI for autonomous coding agent powered by Grok",
    version="0.1.0"
)

# Include session routes for database persistence
try:
    from app.routes.session_routes import router as session_router
    app.include_router(session_router)
    print("✓ Session routes loaded successfully")
except ImportError as e:
    print(f"Warning: Session routes not available: {e}")

# Authentication routes disabled
# Uncomment below to re-enable authentication
# try:
#     from app.routes.auth_routes import router as auth_router
#     app.include_router(auth_router)
# except ImportError as e:
#     print(f"Warning: Auth routes not available: {e}")

# Allow frontend (Vite default port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173","http://10.0.158.82:5173","http://grok:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Models for HTTP requests ---
class StartSessionRequest(BaseModel):
    initial_prompt: str | None = None
    workspace: str | None = None
    agent_type: str = "building"  # "planning" or "building"


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


@app.get("/sessions/{session_id}/files")
async def list_session_files(session_id: str, path: str = ""):
    """List files in the session workspace"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    from pathlib import Path

    workspace = Path(sessions[session_id]["workspace"]).resolve()
    target = (workspace / path).resolve() if path else workspace

    # Security: ensure path is within workspace
    if not str(target).startswith(str(workspace)):
        raise HTTPException(status_code=403, detail="Path outside workspace")

    if not target.exists():
        raise HTTPException(status_code=404, detail="Path not found")

    if not target.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory")

    try:
        items = []
        for item in sorted(target.iterdir()):
            try:
                relative = item.relative_to(workspace)
                is_dir = item.is_dir()

                items.append({
                    "name": item.name,
                    "path": str(relative),
                    "type": "directory" if is_dir else "file",
                    "size": item.stat().st_size if not is_dir else None
                })
            except Exception:
                continue

        return {"files": items, "path": path}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sessions/{session_id}/changes")
async def get_session_changes(session_id: str):
    """Get file changes for a session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"changes": sessions[session_id].get("changes", [])}


@app.post("/sessions/{session_id}/changes")
async def add_session_change(session_id: str, change: dict):
    """Add a file change to the session (called by tools)"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    change["timestamp"] = datetime.utcnow().isoformat()
    sessions[session_id]["changes"].append(change)

    return {"success": True}


@app.post("/sessions")
async def create_session(req: StartSessionRequest):
    session_id = str(uuid.uuid4())

    workspace = req.workspace or settings.default_workspace
    # Make sure workspace exists
    from pathlib import Path
    Path(workspace).mkdir(parents=True, exist_ok=True)

    # Validate agent_type
    agent_type = req.agent_type if req.agent_type in ["planning", "building"] else "building"

    sessions[session_id] = {
        "history": [],
        "workspace": workspace,
        "agent_type": agent_type,
        "changes": [],  # Track file changes
        "created_at": datetime.utcnow().isoformat()
    }

    return {
        "session_id": session_id,
        "workspace": workspace,
        "agent_type": agent_type,
        "message": "Session created successfully"
    }


@app.post("/sessions/{session_id}/resume")
async def resume_session(session_id: str, workspace: str, agent_type: str):
    """Resume an existing session (for WebSocket to work)"""
    from pathlib import Path
    Path(workspace).mkdir(parents=True, exist_ok=True)

    sessions[session_id] = {
        "history": [],
        "workspace": workspace,
        "agent_type": agent_type,
        "changes": [],
        "created_at": datetime.utcnow().isoformat()
    }

    return {
        "session_id": session_id,
        "workspace": workspace,
        "agent_type": agent_type,
        "message": "Session resumed successfully"
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
    agent_type = session.get("agent_type", "building")

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
                    history=history.copy(),  # shallow copy - we append in place later
                    agent_type=agent_type
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
                    elif event_dict["type"] == "token_usage":
                        event = TokenUsageMessage(**event_dict)
                    elif event_dict["type"] == "file_change":
                        event = FileChangeMessage(**event_dict)
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

                    # Track file changes
                    if event.type == "file_change":
                        session["changes"].append(event.model_dump())

            except Exception as e:
                error_msg = f"Agent loop error: {str(e)}"
                print(error_msg)  # server log
                import traceback
                traceback.print_exc()
                try:
                    await websocket.send_json(ErrorMessage(
                        content=error_msg,
                        fatal=False
                    ).model_dump())
                except:
                    print(f"Could not send error message (connection may be closed)")

    except WebSocketDisconnect:
        print(f"Client disconnected from session {session_id}")
    except Exception as e:
        print(f"WebSocket error in session {session_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        # Don't try to send error message - connection is likely closed
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
