from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, get_project_or_404

router = APIRouter(prefix="/api/projects/{project_id}/change-orders", tags=["change-orders"])


def _load_order(db: Session, order_id: int, project_id: int) -> models.ChangeOrder:
    order = (
        db.query(models.ChangeOrder)
        .filter(models.ChangeOrder.id == order_id, models.ChangeOrder.project_id == project_id)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Change order não encontrada")
    return order


def _verify_requests_belong_to_project(db: Session, project_id: int, request_ids: list[int]) -> None:
    """Reject any request_ids that don't belong to this project (authorization)."""
    if not request_ids:
        return
    count = (
        db.query(models.Request)
        .filter(models.Request.id.in_(request_ids), models.Request.project_id == project_id)
        .count()
    )
    if count != len(request_ids):
        raise HTTPException(status_code=400, detail="Uma ou mais requisições não pertencem a este projeto")


@router.get("", response_model=list[schemas.ChangeOrderOut])
def list_change_orders(
    project_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_project_or_404(project_id, current_user, db)
    return (
        db.query(models.ChangeOrder)
        .filter(models.ChangeOrder.project_id == project_id)
        .order_by(models.ChangeOrder.created_at.desc())
        .all()
    )


@router.post("", response_model=schemas.ChangeOrderOut, status_code=status.HTTP_201_CREATED)
def create_change_order(
    project_id: int,
    data: schemas.ChangeOrderIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_project_or_404(project_id, current_user, db)
    _verify_requests_belong_to_project(db, project_id, data.request_ids)

    rate = data.rate if data.rate > 0 else project.hourly_rate
    order = models.ChangeOrder(
        project_id=project_id,
        title=data.title.strip(),
        description=data.description.strip(),
        hours=data.hours,
        rate=rate,
        status="DRAFT",
    )
    db.add(order)
    db.flush()

    for rid in data.request_ids:
        req = db.get(models.Request, rid)
        if req:
            req.change_order_id = order.id
            req.status = "RESOLVED"
            req.classification = "OUT_OF_SCOPE"

    db.commit()
    return _load_order(db, order.id, project_id)


@router.patch("/{order_id}", response_model=schemas.ChangeOrderOut)
def update_change_order(
    project_id: int,
    order_id: int,
    data: schemas.ChangeOrderUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_project_or_404(project_id, current_user, db)
    order = _load_order(db, order_id, project_id)

    changes = data.model_dump(exclude_unset=True)
    status_change = changes.get("status")
    if status_change:
        # Enforce valid state transitions.
        valid_transitions = {
            "DRAFT": {"SENT"},
            "SENT": {"APPROVED", "REJECTED"},
            "APPROVED": {"PAID"},
            "REJECTED": set(),
            "PAID": set(),
        }
        allowed = valid_transitions.get(order.status, set())
        if status_change not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Transição de '{order.status}' para '{status_change}' não é permitida.",
            )
        order.status = status_change
        if status_change in ("APPROVED", "REJECTED"):
            order.decided_at = datetime.now(timezone.utc)
        elif status_change in ("DRAFT", "SENT", "PAID"):
            order.decided_at = None

    for field, value in changes.items():
        if field == "status":
            continue
        setattr(order, field, value)
    db.commit()
    return _load_order(db, order_id, project_id)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_change_order(
    project_id: int,
    order_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_project_or_404(project_id, current_user, db)
    order = _load_order(db, order_id, project_id)
    for req in order.requests:
        req.change_order_id = None
        req.status = "OPEN"
        req.classification = "OUT_OF_SCOPE"
    db.delete(order)
    db.commit()
    return None