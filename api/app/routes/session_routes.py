"""
Session management routes for saving messages, tool calls, file changes, and token usage
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.db_models import (
    Session as DBSession,
    Message as DBMessage,
    ToolCall as DBToolCall,
    FileChange as DBFileChange,
    TokenUsage as DBTokenUsage
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


# Pydantic models for requests
class SessionCreate(BaseModel):
    workspace: str
    agent_type: str = "building"


class MessageCreate(BaseModel):
    role: str
    content: str
    message_type: str = "text"


class ToolCallCreate(BaseModel):
    tool_name: str
    arguments: dict
    result: Optional[str] = None
    success: bool = True
    error: Optional[str] = None


class FileChangeCreate(BaseModel):
    file_path: str
    action: str
    tool_name: str
    content_before: Optional[str] = None
    content_after: Optional[str] = None


class TokenUsageCreate(BaseModel):
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost: float


# Session endpoints
@router.post("/{session_id}/init")
async def initialize_session(session_id: str, data: SessionCreate, db: Session = Depends(get_db)):
    """Initialize or update a session in the database"""
    # Check if session already exists
    existing_session = db.query(DBSession).filter(DBSession.id == session_id).first()

    if existing_session:
        # Update existing session
        existing_session.workspace = data.workspace
        existing_session.agent_type = data.agent_type
        db.commit()
        return {"status": "updated", "session_id": session_id}

    # Create new session
    new_session = DBSession(
        id=session_id,
        workspace=data.workspace,
        agent_type=data.agent_type
    )
    db.add(new_session)
    db.commit()

    return {"status": "created", "session_id": session_id}


@router.post("/{session_id}/messages")
async def save_message(session_id: str, message: MessageCreate, db: Session = Depends(get_db)):
    """Save a message to the database"""
    # Verify session exists
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db_message = DBMessage(
        session_id=session_id,
        role=message.role,
        content=message.content,
        message_type=message.message_type
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    return {"id": db_message.id, "created_at": db_message.created_at}


@router.post("/{session_id}/tool-calls")
async def save_tool_call(session_id: str, tool_call: ToolCallCreate, db: Session = Depends(get_db)):
    """Save a tool call to the database"""
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db_tool_call = DBToolCall(
        session_id=session_id,
        tool_name=tool_call.tool_name,
        arguments=tool_call.arguments,
        result=tool_call.result,
        success=tool_call.success,
        error=tool_call.error
    )
    db.add(db_tool_call)
    db.commit()
    db.refresh(db_tool_call)

    return {"id": db_tool_call.id, "created_at": db_tool_call.created_at}


@router.post("/{session_id}/file-changes")
async def save_file_change(session_id: str, file_change: FileChangeCreate, db: Session = Depends(get_db)):
    """Save a file change to the database"""
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db_file_change = DBFileChange(
        session_id=session_id,
        file_path=file_change.file_path,
        action=file_change.action,
        tool_name=file_change.tool_name,
        content_before=file_change.content_before,
        content_after=file_change.content_after
    )
    db.add(db_file_change)
    db.commit()
    db.refresh(db_file_change)

    return {"id": db_file_change.id, "created_at": db_file_change.created_at}


@router.post("/{session_id}/token-usage")
async def save_token_usage(session_id: str, token_usage: TokenUsageCreate, db: Session = Depends(get_db)):
    """Save or update token usage for a session"""
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db_token_usage = DBTokenUsage(
        session_id=session_id,
        input_tokens=token_usage.input_tokens,
        output_tokens=token_usage.output_tokens,
        total_tokens=token_usage.total_tokens,
        estimated_cost=token_usage.estimated_cost
    )
    db.add(db_token_usage)
    db.commit()
    db.refresh(db_token_usage)

    return {"id": db_token_usage.id, "created_at": db_token_usage.created_at}


@router.get("/{session_id}/messages")
async def get_messages(session_id: str, db: Session = Depends(get_db)):
    """Get all messages for a session"""
    messages = db.query(DBMessage).filter(DBMessage.session_id == session_id).order_by(DBMessage.created_at).all()
    return {
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "message_type": msg.message_type,
                "created_at": msg.created_at
            }
            for msg in messages
        ]
    }


@router.get("/{session_id}/token-usage/latest")
async def get_latest_token_usage(session_id: str, db: Session = Depends(get_db)):
    """Get the latest token usage for a session"""
    token_usage = (
        db.query(DBTokenUsage)
        .filter(DBTokenUsage.session_id == session_id)
        .order_by(DBTokenUsage.created_at.desc())
        .first()
    )

    if not token_usage:
        return None

    return {
        "input_tokens": token_usage.input_tokens,
        "output_tokens": token_usage.output_tokens,
        "total_tokens": token_usage.total_tokens,
        "estimated_cost": token_usage.estimated_cost,
        "created_at": token_usage.created_at
    }


@router.get("/{session_id}")
async def get_session(session_id: str, db: Session = Depends(get_db)):
    """Get session details with all related data"""
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": session.id,
        "workspace": session.workspace,
        "agent_type": session.agent_type,
        "created_at": session.created_at,
        "updated_at": session.updated_at
    }


@router.get("/")
async def list_recent_sessions(limit: int = 20, db: Session = Depends(get_db)):
    """Get list of recent sessions, most recent first"""
    sessions = (
        db.query(DBSession)
        .order_by(DBSession.created_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "sessions": [
            {
                "id": session.id,
                "workspace": session.workspace,
                "agent_type": session.agent_type,
                "created_at": session.created_at,
                "updated_at": session.updated_at
            }
            for session in sessions
        ]
    }
