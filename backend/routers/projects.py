from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db, Project, Document
from routers.auth import get_current_user
from db.database import User
from pydantic import BaseModel
from typing import Optional
from services.rag import delete_namespace

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


@router.get("")
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "superadmin":
        projects = db.query(Project).order_by(Project.created_at.desc()).all()
    else:
        projects = db.query(Project).filter(
            Project.company_id == current_user.company_id
        ).order_by(Project.created_at.desc()).all()

    result = []
    for p in projects:
        doc_count = db.query(func.count(Document.id)).filter(Document.project_id == p.id).scalar()
        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "company_id": p.company_id,
            "created_by_user_id": p.created_by_user_id,
            "doc_count": doc_count,
            "created_at": p.created_at.isoformat(),
        })
    return result


@router.post("")
def create_project(
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = Project(
        name=body.name,
        description=body.description,
        company_id=current_user.company_id,
        created_by_user_id=current_user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "company_id": project.company_id,
        "created_by_user_id": project.created_by_user_id,
        "doc_count": 0,
        "created_at": project.created_at.isoformat(),
    }


@router.put("/{project_id}")
def update_project(
    project_id: int,
    body: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Only creator or admin+ can update
    if project.created_by_user_id != current_user.id and current_user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Not authorized")

    if body.name is not None:
        project.name = body.name
    if body.description is not None:
        project.description = body.description
    db.commit()
    db.refresh(project)
    return {"id": project.id, "name": project.name, "description": project.description}


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.created_by_user_id != current_user.id and current_user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Delete Pinecone namespace
    namespace = f"project-{project_id}"
    delete_namespace(namespace)

    db.delete(project)
    db.commit()
    return {"status": "deleted"}
