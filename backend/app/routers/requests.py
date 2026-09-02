from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, get_project_or_404

router = APIRouter(prefix="/api/projects/{project_id}/requests", tags=["requests"])


@router.get("", response_model=list[schemas.RequestOut])
def list_requests(
    project_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_project_or_404(project_id, current_user, db)
    return (
        db.query(models.Request)
        .filter(models.Request.project_id == project_id)
        .order_by(models.Request.created_at.desc())
        .all()
    )


@router.post("", response_model=schemas.RequestOut, status_code=status.HTTP_201_CREATED)
def create_request(
    project_id: int,
    data: schemas.RequestIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_project_or_404(project_id, current_user, db)
    req = models.Request(project_id=project_id, text=data.text.strip(), classification="DISCUSS")
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.patch("/{request_id}", response_model=schemas.RequestOut)
def update_request(
    project_id: int,
    request_id: int,
    data: schemas.RequestUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_project_or_404(project_id, current_user, db)
    req = (
        db.query(models.Request)
        .filter(models.Request.id == request_id, models.Request.project_id == project_id)
        .first()
    )
    if req is None:
        raise HTTPException(status_code=404, detail="Requisição não encontrada")
    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(req, field, value)
    db.commit()
    db.refresh(req)
    return req


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(
    project_id: int,
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_project_or_404(project_id, current_user, db)
    req = (
        db.query(models.Request)
        .filter(models.Request.id == request_id, models.Request.project_id == project_id)
        .first()
    )
    if req is None:
        raise HTTPException(status_code=404, detail="Requisição não encontrada")
    db.delete(req)
    db.commit()
    return None