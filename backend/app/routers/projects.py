from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, get_project_or_404
from ..limits import can_create_project, project_limit_message

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _load_project(db: Session, project_id: int, user_id: int) -> models.Project:
    project = (
        db.query(models.Project)
        .options(
            joinedload(models.Project.scope_entries),
            joinedload(models.Project.requests),
            joinedload(models.Project.change_orders).joinedload(models.ChangeOrder.requests),
        )
        .filter(models.Project.id == project_id, models.Project.user_id == user_id)
        .first()
    )
    if project is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return project


@router.get("", response_model=list[schemas.ProjectOut])
def list_projects(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    projects = (
        db.query(models.Project)
        .options(
            joinedload(models.Project.scope_entries),
            joinedload(models.Project.requests),
            joinedload(models.Project.change_orders).joinedload(models.ChangeOrder.requests),
        )
        .filter(models.Project.user_id == current_user.id)
        .order_by(models.Project.updated_at.desc())
        .all()
    )
    return projects


@router.post("", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    data: schemas.ProjectIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Enforce plan limits.
    project_count = db.query(models.Project).filter(models.Project.user_id == current_user.id).count()
    if not can_create_project(current_user.plan, project_count):
        raise HTTPException(status_code=403, detail=project_limit_message(current_user.plan))

    project = models.Project(
        title=data.title.strip(),
        hourly_rate=data.hourly_rate,
        notes=data.notes.strip(),
        user_id=current_user.id,
    )
    for entry in data.scope_entries:
        project.scope_entries.append(models.ScopeEntry(text=entry.text.strip()))
    db.add(project)
    db.commit()
    return _load_project(db, project.id, current_user.id)


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(
    project_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _load_project(db, project_id, current_user.id)


@router.patch("/{project_id}", response_model=schemas.ProjectOut)
def update_project(
    project_id: int,
    data: schemas.ProjectUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_project_or_404(project_id, current_user, db)
    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(project, field, value)
    db.commit()
    return _load_project(db, project_id, current_user.id)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_project_or_404(project_id, current_user, db)
    db.delete(project)
    db.commit()
    return None


@router.get("/{project_id}/stats", response_model=schemas.ProjectStats)
def project_stats(
    project_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_project_or_404(project_id, current_user, db)  # 404 if not owner

    in_scope = (
        db.query(models.Request)
        .filter(models.Request.project_id == project_id, models.Request.classification == "IN_SCOPE")
        .count()
    )
    # Out-of-scope requests still OPEN (not yet converted to a change order).
    out_of_scope_open = (
        db.query(models.Request)
        .filter(
            models.Request.project_id == project_id,
            models.Request.classification == "OUT_OF_SCOPE",
            models.Request.status == "OPEN",
        )
        .count()
    )
    # Total out-of-scope requests (including resolved).
    out_of_scope_total = (
        db.query(models.Request)
        .filter(
            models.Request.project_id == project_id,
            models.Request.classification == "OUT_OF_SCOPE",
        )
        .count()
    )
    open_total = (
        db.query(models.Request)
        .filter(models.Request.project_id == project_id, models.Request.status == "OPEN")
        .count()
    )
    orders = (
        db.query(models.ChangeOrder)
        .filter(models.ChangeOrder.project_id == project_id)
        .all()
    )
    # Only sales/billable value on orders that are not rejected or draft.
    billable = sum(o.amount for o in orders if o.status in ("SENT", "APPROVED", "PAID"))
    approved = sum(o.amount for o in orders if o.status == "APPROVED")  # awaiting payment
    paid = sum(o.amount for o in orders if o.status == "PAID")
    # PENDING: real monetary value of SENT/APPROVED change orders not yet paid.
    pending = round(sum(o.amount for o in orders if o.status in ("SENT", "APPROVED")), 2)

    return schemas.ProjectStats(
        project_id=project_id,
        in_scope_count=in_scope,
        out_of_scope_count=out_of_scope_total,
        open_requests_count=open_total,
        change_orders_total=billable,
        approved_amount=approved,
        paid_amount=paid,
        pending_amount=pending,
    )