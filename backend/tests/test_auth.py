import pytest


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_register_and_login(client):
    r = client.post(
        "/api/auth/register",
        json={"email": "a@b.com", "password": "password123", "name": "Alice"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["access_token"]
    assert body["user"]["email"] == "a@b.com"
    assert "password" not in body["user"]

    r = client.post("/api/auth/login", json={"email": "a@b.com", "password": "password123"})
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_register_duplicate_email_conflict(client):
    register_ok = client.post(
        "/api/auth/register",
        json={"email": "dup@x.com", "password": "password123", "name": "X"},
    )
    assert register_ok.status_code == 201
    r = client.post(
        "/api/auth/register",
        json={"email": "dup@x.com", "password": "password123", "name": "Y"},
    )
    assert r.status_code == 409

    # Case-insensitive duplicate also rejected.
    r = client.post(
        "/api/auth/register",
        json={"email": "DUP@x.com", "password": "password123", "name": "Y"},
    )
    assert r.status_code == 409


def test_register_uppercase_email_normalized(client):
    r = client.post(
        "/api/auth/register",
        json={"email": "  Mixed@X.COM ", "password": "password123", "name": "M"},
    )
    assert r.status_code == 201
    assert r.json()["user"]["email"] == "mixed@x.com"


def test_login_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={"email": "w@x.com", "password": "password123", "name": "W"},
    )
    r = client.post("/api/auth/login", json={"email": "w@x.com", "password": "wrongwrong"})
    assert r.status_code == 401


def test_login_unknown_email(client):
    r = client.post("/api/auth/login", json={"email": "ghost@x.com", "password": "password123"})
    assert r.status_code == 401


def test_register_short_password(client):
    r = client.post(
        "/api/auth/register",
        json={"email": "s@x.com", "password": "short", "name": "S"},
    )
    assert r.status_code == 422


def test_register_invalid_email(client):
    r = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "password123", "name": "S"},
    )
    assert r.status_code == 422


def test_password_not_stored_in_plaintext(client):
    client.post(
        "/api/auth/register",
        json={"email": "plain@x.com", "password": "password123", "name": "P"},
    )
    from app.database import SessionLocal
    from app.models import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "plain@x.com").first()
        assert user is not None
        assert user.password_hash != "password123"
        assert user.password_hash.startswith("$2")
    finally:
        db.close()


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_invalid_token(client):
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer not.a.jwt"})
    assert r.status_code == 401


def test_me_with_valid_token(client):
    reg = client.post(
        "/api/auth/register",
        json={"email": "me@x.com", "password": "password123", "name": "Me"},
    )
    token = reg.json()["access_token"]
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "me@x.com"