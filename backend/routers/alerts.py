from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db, Alert, Approval
from routers.auth import get_current_user, require_role
from db.database import User
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
def get_alerts(
    current_user: User = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    cid = current_user.company_id
    q = db.query(Alert)
    if current_user.role != "superadmin":
        q = q.filter(Alert.company_id == cid)
    alerts = q.order_by(Alert.created_at.desc()).limit(100).all()
    return [
        {
            "id": a.id,
            "rule_name": a.rule_name,
            "action": a.action,
            "message_snippet": a.message_snippet,
            "is_read": a.is_read,
            "created_at": a.created_at.isoformat(),
        }
        for a in alerts
    ]


@router.get("/unread/count")
def get_unread_count(
    current_user: User = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    q = db.query(Alert).filter(Alert.is_read == False)
    if current_user.role != "superadmin":
        q = q.filter(Alert.company_id == current_user.company_id)
    return {"count": q.count()}


@router.post("/{alert_id}/read")
def mark_read(
    alert_id: int,
    current_user: User = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        if current_user.role != "superadmin" and alert.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Access denied")
        alert.is_read = True
        db.commit()
    return {"status": "ok"}


# Approvals
@router.get("/approvals")
def get_approvals(
    current_user: User = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    q = db.query(Approval)
    if current_user.role != "superadmin":
        q = q.filter(Approval.company_id == current_user.company_id)
    approvals = q.order_by(Approval.created_at.desc()).limit(100).all()
    return [
        {
            "id": a.id,
            "original_message": a.original_message,
            "rule_name": a.rule_name,
            "status": a.status,
            "created_at": a.created_at.isoformat(),
        }
        for a in approvals
    ]


@router.get("/approvals/pending/count")
def get_pending_count(
    current_user: User = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    q = db.query(Approval).filter(Approval.status == "pending")
    if current_user.role != "superadmin":
        q = q.filter(Approval.company_id == current_user.company_id)
    return {"count": q.count()}


@router.post("/approvals/{approval_id}/approve")
def approve_message(
    approval_id: int,
    current_user: User = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        return {"error": "Not found"}
    approval.status = "approved"
    approval.resolved_at = datetime.utcnow()
    db.commit()
    return {"status": "approved", "message": approval.original_message}


@router.post("/approvals/{approval_id}/reject")
def reject_message(
    approval_id: int,
    current_user: User = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        return {"error": "Not found"}
    approval.status = "rejected"
    approval.resolved_at = datetime.utcnow()
    db.commit()
    return {"status": "rejected"}
