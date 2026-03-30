from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db, Rule
from routers.auth import get_current_user, require_role
from db.database import User
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/rules", tags=["rules"])


class RuleCreate(BaseModel):
    name: str
    keywords: List[str] = []
    description: str
    action: str  # BLOCKED | ALERT | APPROVAL | REDACTED
    scope: str = "BOTH"  # INPUT | OUTPUT | BOTH


class RuleOut(BaseModel):
    id: int
    name: str
    keywords: List[str]
    description: str
    action: str
    scope: str
    is_global: bool
    company_id: Optional[int]


@router.get("", response_model=List[RuleOut])
def list_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rules = db.query(Rule).filter(
        (Rule.company_id == current_user.company_id) | (Rule.is_global == True)
    ).all()
    return rules


@router.get("/public/{company_id}", response_model=List[RuleOut])
def list_rules_public(company_id: int, db: Session = Depends(get_db)):
    rules = db.query(Rule).filter(
        (Rule.company_id == company_id) | (Rule.is_global == True)
    ).all()
    return rules


@router.post("", response_model=RuleOut)
def create_rule(
    body: RuleCreate,
    current_user: User = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    if body.action not in ("BLOCKED", "ALERT", "APPROVAL", "REDACTED"):
        raise HTTPException(status_code=400, detail="Invalid action")
    if body.scope not in ("INPUT", "OUTPUT", "BOTH"):
        raise HTTPException(status_code=400, detail="Invalid scope")

    rule = Rule(
        name=body.name,
        keywords=body.keywords,
        description=body.description,
        action=body.action,
        scope=body.scope,
        company_id=current_user.company_id,
        is_global=(current_user.role == "superadmin"),
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.put("/{rule_id}", response_model=RuleOut)
def update_rule(
    rule_id: int,
    body: RuleCreate,
    current_user: User = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    if current_user.role != "superadmin" and rule.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not your rule")

    rule.name = body.name
    rule.keywords = body.keywords
    rule.description = body.description
    rule.action = body.action
    rule.scope = body.scope
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}")
def delete_rule(
    rule_id: int,
    current_user: User = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    if current_user.role != "superadmin" and rule.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not your rule")
    db.delete(rule)
    db.commit()
    return {"status": "deleted"}
