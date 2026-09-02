"""Public endpoints for shareable change orders.

Clients can view and approve/reject change orders via a secure token
without needing an account.
"""

from datetime import datetime, timezone

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/share", tags=["share"])


class ShareableChangeOrderOut(BaseModel):
    """Limited view of a change order for public sharing."""

    id: int
    title: str
    description: str
    hours: float
    rate: float
    amount: float
    status: str
    created_at: datetime
    decided_at: datetime | None
    project_title: str

    model_config = {"from_attributes": True}


def _get_shared_order(token: str, db: Session) -> tuple[models.ChangeOrder, models.Project]:
    order = (
        db.query(models.ChangeOrder)
        .options(joinedload(models.ChangeOrder.project))
        .filter(models.ChangeOrder.share_token == token)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Change order não encontrada")
    return order, order.project


@router.get("/{token}", response_model=ShareableChangeOrderOut)
def get_shared_change_order(token: str, db: Session = Depends(get_db)):
    """View a change order via its public share link."""
    order, project = _get_shared_order(token, db)
    return ShareableChangeOrderOut(
        id=order.id,
        title=order.title,
        description=order.description,
        hours=order.hours,
        rate=order.rate,
        amount=order.amount,
        status=order.status,
        created_at=order.created_at,
        decided_at=order.decided_at,
        project_title=project.title,
    )


class ClientDecision(BaseModel):
    decision: Literal["APPROVED", "REJECTED"]


@router.patch("/{token}", response_model=schemas.ChangeOrderOut)
def client_decide_change_order(
    token: str,
    data: ClientDecision,
    db: Session = Depends(get_db),
):
    """Client approves or rejects a change order via the share link.

    Only APPROVED and REJECTED are allowed from the public link.
    """
    order, _ = _get_shared_order(token, db)

    # Only SENT change orders can be decided by the client.
    if order.status != "SENT":
        raise HTTPException(
            status_code=400,
            detail=f"Esta change order está com status '{order.status}' e não pode ser respondida.",
        )

    order.status = data.decision
    order.decided_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    return order
