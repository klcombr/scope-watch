from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from . import models
from .database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Não autenticado",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    if not token:
        raise CREDENTIALS_ERROR

    from .security import decode_access_token

    sub = decode_access_token(token)
    if sub is None:
        raise CREDENTIALS_ERROR

    try:
        user_id = int(sub)
    except (TypeError, ValueError):
        raise CREDENTIALS_ERROR

    user = db.get(models.User, user_id)
    if user is None or not user.is_active:
        raise CREDENTIALS_ERROR
    return user


def get_project_or_404(project_id: int, user: models.User, db: Session) -> models.Project:
    """Fetch a project ensuring it belongs to the requesting user (horizontal isolation)."""
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.user_id == user.id)
        .first()
    )
    if project is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return project