from typing import Literal, Any, Optional
from pydantic import BaseModel, Field


class AgentMessage(BaseModel):
    """Base class for all messages/events sent over websocket"""
    type: str = Field(..., description="Type of the event/message")
    timestamp: Optional[str] = None


class StatusMessage(AgentMessage):
    type: Literal["status"] = "status"
    content: str
    done: bool = False


class ThinkingMessage(AgentMessage):
    type: Literal["thinking"] = "thinking"
    content: str = "Thinking..."


class AssistantMessage(AgentMessage):
    type: Literal["assistant"] = "assistant"
    content: str


class ToolCallMessage(AgentMessage):
    type: Literal["tool_call"] = "tool_call"
    tool_name: str
    arguments: dict[str, Any]
    tool_call_id: Optional[str] = None


class ToolResultMessage(AgentMessage):
    type: Literal["tool_result"] = "tool_result"
    tool_name: str
    content: str
    success: bool = True
    error: Optional[str] = None


class ErrorMessage(AgentMessage):
    type: Literal["error"] = "error"
    content: str
    fatal: bool = False


# Union of all possible websocket messages
WebsocketEvent = (
    StatusMessage
    | ThinkingMessage
    | AssistantMessage
    | ToolCallMessage
    | ToolResultMessage
    | ErrorMessage
)