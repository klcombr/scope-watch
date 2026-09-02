"""Tests for shareable change orders."""

from conftest import register


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _register_and_project(client):
    reg = client.post(
        "/api/auth/register",
        json={"email": "share@test.com", "password": "password123", "name": "Share"},
    )
    token = reg.json()["access_token"]
    r = client.post(
        "/api/projects",
        headers=_auth(token),
        json={
            "title": "Share test",
            "hourly_rate": 200,
            "scope_entries": [{"text": "Scope"}],
        },
    )
    return token, r.json()


def test_share_flow(client):
    """Full share flow: create CO, get share link, client views, client approves."""
    token, project = _register_and_project(client)
    pid = project["id"]

    # Create an out-of-scope request
    r = client.post(f"/api/projects/{pid}/requests", headers=_auth(token), json={"text": "Extra work"})
    rid = r.json()["id"]
    client.patch(f"/api/projects/{pid}/requests/{rid}", headers=_auth(token), json={"classification": "OUT_OF_SCOPE"})

    # Create change order
    r = client.post(
        f"/api/projects/{pid}/change-orders",
        headers=_auth(token),
        json={"title": "CO to share", "description": "Extra work description", "hours": 5, "rate": 200, "request_ids": [rid]},
    )
    co = r.json()
    token_share = co["share_token"]
    assert co["status"] == "DRAFT"

    # Get share link - should work
    r = client.get(f"/api/share/{token_share}")
    assert r.status_code == 200
    shared = r.json()
    assert shared["title"] == "CO to share"
    assert shared["amount"] == 1000.0
    assert shared["project_title"] == "Share test"
    assert shared["status"] == "DRAFT"

    # Client cannot decide DRAFT
    r = client.patch(f"/api/share/{token_share}", json={"decision": "APPROVED"})
    assert r.status_code == 400
    assert "DRAFT" in r.json()["detail"]

    # Freelancer sends to client
    client.patch(f"/api/projects/{pid}/change-orders/{co['id']}", headers=_auth(token), json={"status": "SENT"})

    # Client views again
    r = client.get(f"/api/share/{token_share}")
    assert r.json()["status"] == "SENT"

    # Client approves
    r = client.patch(f"/api/share/{token_share}", json={"decision": "APPROVED"})
    assert r.status_code == 200
    assert r.json()["status"] == "APPROVED"
    assert r.json()["decided_at"] is not None

    # Cannot decide again
    r = client.patch(f"/api/share/{token_share}", json={"decision": "REJECTED"})
    assert r.status_code == 400
    assert "APPROVED" in r.json()["detail"]


def test_share_reject_flow(client):
    """Client rejects a change order."""
    token, project = _register_and_project(client)
    pid = project["id"]

    r = client.post(
        f"/api/projects/{pid}/change-orders",
        headers=_auth(token),
        json={"title": "Reject me", "description": "", "hours": 2, "rate": 100, "request_ids": []},
    )
    co = r.json()
    token_share = co["share_token"]

    # Send to client
    client.patch(f"/api/projects/{pid}/change-orders/{co['id']}", headers=_auth(token), json={"status": "SENT"})

    # Client rejects
    r = client.patch(f"/api/share/{token_share}", json={"decision": "REJECTED"})
    assert r.status_code == 200
    assert r.json()["status"] == "REJECTED"
    assert r.json()["decided_at"] is not None


def test_share_invalid_token(client):
    """Non-existent share token returns 404."""
    r = client.get("/api/share/invalid-token-123")
    assert r.status_code == 404


def test_share_invalid_decision(client):
    """Invalid decision value returns 400."""
    token, project = _register_and_project(client)
    pid = project["id"]

    r = client.post(
        f"/api/projects/{pid}/change-orders",
        headers=_auth(token),
        json={"title": "CO", "description": "", "hours": 1, "rate": 100, "request_ids": []},
    )
    token_share = r.json()["share_token"]
    client.patch(f"/api/projects/{pid}/change-orders/{r.json()['id']}", headers=_auth(token), json={"status": "SENT"})

    r = client.patch(f"/api/share/{token_share}", json={"decision": "INVALID"})
    assert r.status_code == 422  # Pydantic Literal validation returns 422


def test_share_isolation(client):
    """Share link does not expose project details or other data."""
    token, project = _register_and_project(client)
    pid = project["id"]

    r = client.post(
        f"/api/projects/{pid}/change-orders",
        headers=_auth(token),
        json={"title": "Isolated CO", "description": "secret", "hours": 1, "rate": 100, "request_ids": []},
    )
    co = r.json()
    token_share = co["share_token"]

    r = client.get(f"/api/share/{token_share}")
    shared = r.json()

    # Should NOT contain project_id, user_id, or other internal data
    assert "project_id" not in shared
    assert "user_id" not in shared
    assert shared["title"] == "Isolated CO"


def test_empty_project_stats(client):
    """Stats for a project with no requests or change orders."""
    reg = client.post(
        "/api/auth/register",
        json={"email": "empty@test.com", "password": "password123", "name": "Empty"},
    )
    token = reg.json()["access_token"]
    r = client.post(
        "/api/projects",
        headers=_auth(token),
        json={"title": "Empty", "hourly_rate": 100, "scope_entries": []},
    )
    pid = r.json()["id"]
    stats = client.get(f"/api/projects/{pid}/stats", headers=_auth(token)).json()
    assert stats["in_scope_count"] == 0
    assert stats["out_of_scope_count"] == 0
    assert stats["open_requests_count"] == 0
    assert stats["change_orders_total"] == 0
    assert stats["approved_amount"] == 0
    assert stats["paid_amount"] == 0
    assert stats["pending_amount"] == 0
