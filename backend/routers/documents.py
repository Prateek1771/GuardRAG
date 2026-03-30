from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from db.database import get_db, Document
from services.docs import parse_document
from services.rag import ingest_document, get_namespace, delete_namespace
from services.auth import decode_token
from routers.auth import get_current_user, oauth2_scheme
from db.database import User
from typing import Optional

router = APIRouter(prefix="/api/documents", tags=["documents"])


def get_optional_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == int(payload.get("sub"))).first()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    project_id: Optional[int] = Form(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    content = await file.read()
    filename = file.filename

    # Determine namespace
    if project_id:
        namespace = f"project-{project_id}"
        company_id = current_user.company_id if current_user else None
        user_id = current_user.id if current_user else None
    elif session_id:
        namespace = get_namespace(session_id=session_id)
        company_id = None
        user_id = None
    elif current_user:
        namespace = get_namespace(company_id=current_user.company_id, user_id=current_user.id)
        company_id = current_user.company_id
        user_id = current_user.id
    else:
        raise HTTPException(status_code=400, detail="session_id or auth token required")

    # Parse document
    try:
        text = parse_document(content, filename)
    except Exception:
        raise HTTPException(status_code=422, detail="Could not parse document")

    if not text.strip():
        raise HTTPException(status_code=422, detail="Document appears to be empty")

    # Save to DB
    doc = Document(
        filename=filename,
        file_type=filename.rsplit(".", 1)[-1].lower(),
        pinecone_namespace=namespace,
        company_id=company_id,
        user_id=user_id,
        session_id=session_id,
        project_id=project_id,
    )
    db.add(doc)
    db.flush()

    # Ingest into Pinecone
    chunk_count = ingest_document(text, doc.id, filename, namespace)
    doc.chunk_count = chunk_count
    db.commit()

    return {"id": doc.id, "filename": filename, "chunks": chunk_count, "namespace": namespace}


@router.get("/list")
def list_documents(
    session_id: Optional[str] = None,
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if project_id:
        docs = db.query(Document).filter(Document.project_id == project_id).all()
    elif session_id:
        docs = db.query(Document).filter(Document.session_id == session_id).all()
    else:
        docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    return [{"id": d.id, "filename": d.filename, "chunks": d.chunk_count, "created_at": d.created_at} for d in docs]


@router.delete("/guest/{session_id}")
def cleanup_guest_session(session_id: str, db: Session = Depends(get_db)):
    namespace = get_namespace(session_id=session_id)
    delete_namespace(namespace)
    db.query(Document).filter(Document.session_id == session_id).delete()
    db.commit()
    return {"status": "cleaned"}
