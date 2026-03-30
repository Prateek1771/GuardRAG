from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from db.database import ChatMessage, Alert, User, Document, Approval
from datetime import datetime, timedelta
from typing import Optional


def get_messages_per_day(db: Session, company_id: Optional[int], days: int = 7,
                         since: Optional[datetime] = None, until: Optional[datetime] = None):
    if since is None:
        since = datetime.utcnow() - timedelta(days=days)
    if until is None:
        until = datetime.utcnow()
    query = db.query(
        func.date(ChatMessage.created_at).label("date"),
        func.count(ChatMessage.id).label("count")
    ).filter(ChatMessage.created_at >= since, ChatMessage.created_at <= until, ChatMessage.role == "user")

    if company_id:
        query = query.filter(ChatMessage.company_id == company_id)

    rows = query.group_by(func.date(ChatMessage.created_at)).all()
    return [{"date": str(r.date), "count": r.count} for r in rows]


def get_rule_triggers_by_action(db: Session, company_id: Optional[int],
                                since: Optional[datetime] = None, until: Optional[datetime] = None):
    query = db.query(
        Alert.action,
        func.count(Alert.id).label("count")
    )
    if company_id:
        query = query.filter(Alert.company_id == company_id)
    if since:
        query = query.filter(Alert.created_at >= since)
    if until:
        query = query.filter(Alert.created_at <= until)

    rows = query.group_by(Alert.action).all()
    return [{"action": r.action, "count": r.count} for r in rows]


def get_top_triggered_rules(db: Session, company_id: Optional[int], limit: int = 5,
                            since: Optional[datetime] = None, until: Optional[datetime] = None):
    query = db.query(
        Alert.rule_name,
        func.count(Alert.id).label("count")
    )
    if company_id:
        query = query.filter(Alert.company_id == company_id)
    if since:
        query = query.filter(Alert.created_at >= since)
    if until:
        query = query.filter(Alert.created_at <= until)

    rows = query.group_by(Alert.rule_name).order_by(func.count(Alert.id).desc()).limit(limit).all()
    return [{"rule": r.rule_name, "count": r.count} for r in rows]


def get_users_by_department(db: Session, company_id: Optional[int]):
    query = db.query(
        User.department,
        func.count(User.id).label("count")
    ).filter(User.role == "member")

    if company_id:
        query = query.filter(User.company_id == company_id)

    rows = query.group_by(User.department).all()
    return [{"department": r.department or "Unknown", "count": r.count} for r in rows]


def get_summary_stats(db: Session, company_id: Optional[int],
                      since: Optional[datetime] = None, until: Optional[datetime] = None):
    user_q = db.query(func.count(User.id)).filter(User.role == "member")
    doc_q = db.query(func.count(Document.id))
    msg_q = db.query(func.count(ChatMessage.id)).filter(ChatMessage.role == "user")
    alert_q = db.query(func.count(Alert.id))
    pending_q = db.query(func.count(Approval.id)).filter(Approval.status == "pending")

    if company_id:
        user_q = user_q.filter(User.company_id == company_id)
        doc_q = doc_q.filter(Document.company_id == company_id)
        msg_q = msg_q.filter(ChatMessage.company_id == company_id)
        alert_q = alert_q.filter(Alert.company_id == company_id)
        pending_q = pending_q.filter(Approval.company_id == company_id)

    if since:
        msg_q = msg_q.filter(ChatMessage.created_at >= since)
        alert_q = alert_q.filter(Alert.created_at >= since)
    if until:
        msg_q = msg_q.filter(ChatMessage.created_at <= until)
        alert_q = alert_q.filter(Alert.created_at <= until)

    return {
        "total_users": user_q.scalar() or 0,
        "total_documents": doc_q.scalar() or 0,
        "total_messages": msg_q.scalar() or 0,
        "total_alerts": alert_q.scalar() or 0,
        "pending_approvals": pending_q.scalar() or 0,
    }
