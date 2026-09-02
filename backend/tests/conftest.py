import os
import tempfile

# MUST be set before importing app modules (settings are cached).
_db_path = tempfile.mktemp(suffix=".db")
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path}"
os.environ["SECRET_KEY"] = "test-secret-only"
os.environ["RATE_LIMIT_ENABLED"] = "false"
os.environ["APP_ENV"] = "test"

import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.database import Base, engine
from app.main import app


@pytest.fixture()
def client():
    get_settings.cache_clear()
    # Fresh tables per test run.
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c


def register(client, email="user@example.com", password="password123", name="Test User"):
    return client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": name},
    )