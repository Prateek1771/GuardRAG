import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session
from db.database import get_db, ChatMessage, ChatSession, User
from services.rag import retrieve_context, get_namespace
from services.guardrails import run_input_guardrails, run_output_guardrails
from routers.auth import get_current_user, oauth2_scheme
from services.auth import decode_token
from pydantic import BaseModel
from typing import Optional, List
from openai import OpenAI
import json

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _get_client():
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None      # guest session UUID
    company_id: Optional[int] = None
    chat_session_id: Optional[int] = None  # authenticated chat session
    project_id: Optional[int] = None       # project-scoped knowledge base
    direct_mode: bool = False              # skip RAG, answer directly from LLM


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    guardrail_action: Optional[str]
    rule_triggered: Optional[str]
    created_at: str


def get_optional_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == int(payload.get("sub"))).first()


@router.post("/message")
async def send_message(
    req: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id if current_user else None
    company_id = current_user.company_id if current_user else req.company_id
    session_id = req.session_id

    # Determine namespace
    if req.project_id:
        namespace = f"project-{req.project_id}"
    elif session_id:
        namespace = get_namespace(session_id=session_id)
    elif current_user:
        namespace = get_namespace(company_id=company_id, user_id=user_id)
    else:
        namespace = None

    # Resolve or create chat session for authenticated users
    chat_session_id = None
    if current_user:
        if req.chat_session_id:
            chat_session_id = req.chat_session_id
        else:
            title = req.message[:60].strip()
            new_session = ChatSession(
                title=title,
                user_id=user_id,
                company_id=company_id,
                project_id=req.project_id,
            )
            db.add(new_session)
            db.commit()
            db.refresh(new_session)
            chat_session_id = new_session.id

    # Run input guardrails
    guard_result = run_input_guardrails(
        text=req.message,
        db=db,
        company_id=company_id,
        user_id=user_id,
        session_id=session_id,
    )

    # Save user message
    if current_user:
        user_msg = ChatMessage(
            user_id=user_id,
            company_id=company_id,
            chat_session_id=chat_session_id,
            role="user",
            content=req.message,
            guardrail_action=guard_result.action if guard_result.action != "PASS" else None,
            rule_triggered=guard_result.rule_name,
        )
        db.add(user_msg)
        db.commit()

    if guard_result.action == "BLOCKED":
        return {"role": "assistant", "content": guard_result.message,
                "guardrail_action": "BLOCKED", "rule_triggered": guard_result.rule_name,
                "chat_session_id": chat_session_id}

    if guard_result.action == "APPROVAL":
        return {"role": "assistant", "content": guard_result.message,
                "guardrail_action": "APPROVAL", "approval_id": guard_result.approval_id,
                "rule_triggered": guard_result.rule_name, "chat_session_id": chat_session_id}

    # Use (potentially redacted) text for RAG
    query_text = guard_result.modified_text or req.message

    # Build system prompt — skip RAG in direct mode
    if req.direct_mode:
        system_prompt = "You are a helpful AI assistant. Answer questions clearly and directly using your knowledge."
    else:
        context_chunks = retrieve_context(query_text, namespace) if namespace else []
        context_str = "\n\n---\n\n".join(context_chunks) if context_chunks else "No documents uploaded yet."
        system_prompt = f"""You are an enterprise assistant. Answer based on the provided documents.
If the answer is not in the documents, say so clearly.

Relevant document context:
{context_str}"""

    # Get chat history (scoped to current session if available)
    history = []
    if current_user:
        q = db.query(ChatMessage).filter(
            or_(
                ChatMessage.guardrail_action.is_(None),
                ChatMessage.guardrail_action.notin_(["BLOCKED", "APPROVAL"]),
            )
        )
        if chat_session_id:
            q = q.filter(ChatMessage.chat_session_id == chat_session_id)
        else:
            q = q.filter(ChatMessage.user_id == user_id)
        past = q.order_by(ChatMessage.created_at.desc()).limit(10).all()
        for m in reversed(past):
            history.append({"role": m.role, "content": m.content})

    messages = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": query_text}]

    # Stream response
    def generate():
        from datetime import datetime as dt
        full_response = ""
        # Send session id first so frontend knows which session was created/used
        yield f"data: {json.dumps({'chat_session_id': chat_session_id})}\n\n"

        # Emit input guardrail info for ALERT so frontend can show the card inline
        if guard_result.action == "ALERT":
            yield f"data: {json.dumps({'input_guardrail': guard_result.action, 'rule_triggered': guard_result.rule_name})}\n\n"

        stream = _get_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            stream=True,
            max_tokens=1000,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            full_response += delta
            yield f"data: {json.dumps({'content': delta})}\n\n"

        # Run output guardrails
        out_result = run_output_guardrails(
            response_text=full_response,
            db=db,
            company_id=company_id,
            user_id=user_id,
            session_id=session_id,
            original_input=req.message,
        )
        final_text = out_result.modified_text or full_response

        # Save assistant message and touch session updated_at
        if current_user:
            ai_msg = ChatMessage(
                user_id=user_id,
                company_id=company_id,
                chat_session_id=chat_session_id,
                role="assistant",
                content=final_text,
                guardrail_action=out_result.action if out_result.action != "PASS" else None,
                is_redacted=(out_result.action == "REDACTED"),
            )
            db.add(ai_msg)
            if chat_session_id:
                db.query(ChatSession).filter(ChatSession.id == chat_session_id).update(
                    {"updated_at": dt.utcnow()}
                )
            db.commit()

        if out_result.action == "REDACTED" and final_text != full_response:
            yield f"data: {json.dumps({'replace_all': final_text, 'guardrail_action': 'REDACTED'})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/history")
def get_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.asc()).limit(limit).all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "guardrail_action": m.guardrail_action,
            "rule_triggered": m.rule_triggered,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]


@router.get("/audit")
def get_audit_logs(
    company_id: Optional[int] = None,
    limit: int = 100,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import datetime
    if current_user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admins only")

    cid = company_id if current_user.role == "superadmin" else current_user.company_id
    q = db.query(ChatMessage).filter(ChatMessage.company_id == cid)

    if start_date:
        q = q.filter(ChatMessage.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        until = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59)
        q = q.filter(ChatMessage.created_at <= until)

    messages = q.order_by(ChatMessage.created_at.desc()).limit(limit).all()

    # Build user lookup for this company
    user_map = {u.id: u.username for u in db.query(User).filter(User.company_id == cid).all()}  # noqa

    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "username": user_map.get(m.user_id, f"User #{m.user_id}") if m.user_id else None,
            "role": m.role,
            "content": m.content,
            "guardrail_action": m.guardrail_action,
            "rule_triggered": m.rule_triggered,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]
