from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db, Company, User
from routers.auth import get_current_user, require_role
from db.database import User as UserModel
from services import analytics as svc
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _parse_dates(start_date: Optional[str], end_date: Optional[str]):
    since = datetime.fromisoformat(start_date) if start_date else None
    until = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59) if end_date else None
    return since, until


@router.get("/summary")
def summary(
    company_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: UserModel = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    cid = company_id if current_user.role == "superadmin" else current_user.company_id
    since, until = _parse_dates(start_date, end_date)
    return svc.get_summary_stats(db, cid, since, until)


@router.get("/messages-per-day")
def messages_per_day(
    company_id: Optional[int] = None,
    days: int = 7,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: UserModel = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    cid = company_id if current_user.role == "superadmin" else current_user.company_id
    since, until = _parse_dates(start_date, end_date)
    return svc.get_messages_per_day(db, cid, days, since, until)


@router.get("/rule-triggers")
def rule_triggers(
    company_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: UserModel = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    cid = company_id if current_user.role == "superadmin" else current_user.company_id
    since, until = _parse_dates(start_date, end_date)
    return svc.get_rule_triggers_by_action(db, cid, since, until)


@router.get("/top-rules")
def top_rules(
    company_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: UserModel = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    cid = company_id if current_user.role == "superadmin" else current_user.company_id
    since, until = _parse_dates(start_date, end_date)
    return svc.get_top_triggered_rules(db, cid, since=since, until=until)


@router.get("/users-by-department")
def users_by_department(
    company_id: Optional[int] = None,
    current_user: UserModel = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    cid = company_id if current_user.role == "superadmin" else current_user.company_id
    return svc.get_users_by_department(db, cid)


@router.get("/companies")
def list_companies(
    current_user: UserModel = Depends(require_role("superadmin")),
    db: Session = Depends(get_db),
):
    companies = db.query(Company).all()
    return [{"id": c.id, "name": c.name, "created_at": c.created_at.isoformat()} for c in companies]


@router.post("/companies")
def create_company(
    name: str,
    current_user: UserModel = Depends(require_role("superadmin")),
    db: Session = Depends(get_db),
):
    company = Company(name=name)
    db.add(company)
    db.commit()
    db.refresh(company)
    return {"id": company.id, "name": company.name}
