from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid


class Session(Base):
    """Agent session model"""
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace = Column(String, nullable=False)
    agent_type = Column(String, default="building")  # "planning" or "building"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    tool_calls = relationship("ToolCall", back_populates="session", cascade="all, delete-orphan")
    file_changes = relationship("FileChange", back_populates="session", cascade="all, delete-orphan")
    token_usage = relationship("TokenUsage", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Session {self.id} - {self.agent_type}>"


class Message(Base):
    """Message/conversation history model"""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # "user", "assistant", "system", "tool"
    content = Column(Text, nullable=False)
    message_type = Column(String, default="text")  # "text", "status", "thinking", "error"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("Session", back_populates="messages")

    def __repr__(self):
        return f"<Message {self.id} - {self.role}>"


class ToolCall(Base):
    """Tool call execution history"""
    __tablename__ = "tool_calls"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    tool_name = Column(String, nullable=False)
    arguments = Column(JSON, nullable=False)
    result = Column(Text)
    success = Column(Boolean, default=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    execution_time_ms = Column(Integer, nullable=True)  # Execution time in milliseconds

    # Relationships
    session = relationship("Session", back_populates="tool_calls")

    def __repr__(self):
        return f"<ToolCall {self.id} - {self.tool_name}>"


class FileChange(Base):
    """File modification tracking"""
    __tablename__ = "file_changes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String, nullable=False)
    action = Column(String, nullable=False)  # "write", "delete", "read"
    tool_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("Session", back_populates="file_changes")

    def __repr__(self):
        return f"<FileChange {self.id} - {self.action} {self.file_path}>"


class TokenUsage(Base):
    """Token usage and cost tracking"""
    __tablename__ = "token_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    input_tokens = Column(Integer, nullable=False)
    output_tokens = Column(Integer, nullable=False)
    total_tokens = Column(Integer, nullable=False)
    estimated_cost = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("Session", back_populates="token_usage")

    def __repr__(self):
        return f"<TokenUsage {self.id} - {self.total_tokens} tokens>"


# Optional: User model for future authentication
class User(Base):
    """User model for authentication"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User {self.username}>"
