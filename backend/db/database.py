from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'app.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    users = relationship("User", back_populates="company")
    rules = relationship("Rule", back_populates="company")
    documents = relationship("Document", back_populates="company")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # superadmin | admin | member | guest
    department = Column(String, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    company = relationship("Company", back_populates="users")
    messages = relationship("ChatMessage", back_populates="user")


class Rule(Base):
    __tablename__ = "rules"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    keywords = Column(JSON, default=list)  # list of strings
    description = Column(Text, nullable=False)
    action = Column(String, nullable=False)  # BLOCKED | ALERT | APPROVAL | REDACTED
    scope = Column(String, nullable=False, default="BOTH")  # INPUT | OUTPUT | BOTH
    is_global = Column(Boolean, default=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    company = relationship("Company", back_populates="rules")


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    documents = relationship("Document", back_populates="project")
    sessions = relationship("ChatSession", back_populates="project")


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False, default="New Chat")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")
    project = relationship("Project", back_populates="sessions")


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    pinecone_namespace = Column(String, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    user_id = Column(Integer, nullable=True)
    session_id = Column(String, nullable=True)  # for guest sessions
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    chunk_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    company = relationship("Company", back_populates="documents")
    project = relationship("Project", back_populates="documents")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    session_id = Column(String, nullable=True)  # for guest sessions
    chat_session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=True)
    company_id = Column(Integer, nullable=True)
    role = Column(String, nullable=False)  # user | assistant
    content = Column(Text, nullable=False)
    guardrail_action = Column(String, nullable=True)  # BLOCKED | ALERT | APPROVAL | REDACTED | None
    rule_triggered = Column(String, nullable=True)
    is_redacted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="messages")
    session = relationship("ChatSession", back_populates="messages")


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=True)
    session_id = Column(String, nullable=True)
    rule_name = Column(String, nullable=False)
    action = Column(String, nullable=False)
    message_snippet = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Approval(Base):
    __tablename__ = "approvals"
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=True)
    session_id = Column(String, nullable=True)
    original_message = Column(Text, nullable=False)
    rule_name = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending | approved | rejected
    response = Column(Text, nullable=True)  # filled after approval
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
