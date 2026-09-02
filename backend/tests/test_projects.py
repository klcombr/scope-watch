import pytest

from conftest import register


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _register_and_project(client):
    reg = client.post(
        "/api/auth/register",
        json={"email": "owner@x.com", "password": "password123", "name": "Owner"},
    )
    token = reg.json()["access_token"]
    r = client.post(
        "/api/projects",
        headers=_auth(token),
        json={
            "title": "Site redesign",
            "hourly_rate": 150,
            "notes": "",
            "scope_entries": [{"text": "Home"}, {"text": "5 pages"}],
        },
    )
    assert r.status_code == 201
    return token, r.json()


def test_create_and_get_project(client):
    token, project = _register_and_project(client)
    assert project["title"] == "Site redesign"
    assert len(project["scope_entries"]) == 2
    assert project["hourly_rate"] == 150


def test_create_project_validation(client):
    reg = register(client)
    token = reg.json()["access_token"]
    r = client.post(
        "/api/projects",
        headers=_auth(token),
        json={"title": "", "hourly_rate": 150, "notes": "", "scope_entries": []},
    )
    assert r.status_code == 422
    r = client.post(
        "/api/projects",
        headers=_auth(token),
        json={"title": "X", "hourly_rate": -5, "notes": "", "scope_entries": []},
    )
    assert r.status_code == 422


def test_unauth_cannot_access_projects(client):
    assert client.get("/api/projects").status_code == 401
    assert client.post("/api/projects", json={}).status_code == 401


def test_horizontal_isolation(client):
    """User B must NEVER see/alter user A's projects."""
    token_a, project_a = _register_and_project(client)

    reg_b = client.post(
        "/api/auth/register",
        json={"email": "other@x.com", "password": "password123", "name": "Other"},
    )
    token_b = reg_b.json()["access_token"]

    # B cannot list A's projects
    api_b_projects = client.get("/api/projects", headers=_auth(token_b))
    assert all(p["id"] != project_a["id"] for p in api_b_projects.json())

    # B cannot GET A's project
    assert client.get(f"/api/projects/{project_a['id']}", headers=_auth(token_b)).status_code == 404

    # B cannot PATCH A's project
    r = client.patch(
        f"/api/projects/{project_a['id']}",
        headers=_auth(token_b),
        json={"title": "Hacked"},
    )
    assert r.status_code == 404

    # B cannot DELETE A's project
    assert (
        client.delete(f"/api/projects/{project_a['id']}", headers=_auth(token_b)).status_code
        == 404
    )

    # B cannot read A's stats
    assert (
        client.get(f"/api/projects/{project_a['id']}/stats", headers=_auth(token_b)).status_code
        == 404
    )

    # A's project intact
    assert client.get(f"/api/projects/{project_a['id']}", headers=_auth(token_a)).json()[
        "title"
    ] == "Site redesign"


def test_requests_lifecycle(client):
    token, project = _register_and_project(client)
    pid = project["id"]

    r = client.post(f"/api/projects/{pid}/requests", headers=_auth(token), json={"text": "Add booking widget"})
    assert r.status_code == 201
    rid = r.json()["id"]
    assert r.json()["classification"] == "DISCUSS"
    assert r.json()["status"] == "OPEN"

    # classify as out of scope
    r = client.patch(
        f"/api/projects/{pid}/requests/{rid}",
        headers=_auth(token),
        json={"classification": "OUT_OF_SCOPE"},
    )
    assert r.status_code == 200
    assert r.json()["classification"] == "OUT_OF_SCOPE"

    # list
    r = client.get(f"/api/projects/{pid}/requests", headers=_auth(token))
    assert len(r.json()) == 1


def test_request_invalid_classification_rejected(client):
    token, project = _register_and_project(client)
    pid = project["id"]
    r = client.post(f"/api/projects/{pid}/requests", headers=_auth(token), json={"text": "x"})
    rid = r.json()["id"]
    r = client.patch(
        f"/api/projects/{pid}/requests/{rid}",
        headers=_auth(token),
        json={"classification": "HACK"},
    )
    assert r.status_code == 422


def test_request_text_too_long(client):
    token, project = _register_and_project(client)
    r = client.post(
        f"/api/projects/{project['id']}/requests",
        headers=_auth(token),
        json={"text": "x" * 5000},
    )
    assert r.status_code == 422


def test_change_order_creation_with_project_rate(client):
    token, project = _register_and_project(client)
    pid = project["id"]
    r = client.post(f"/api/projects/{pid}/requests", headers=_auth(token), json={"text": "Extra feature"})
    rid = r.json()["id"]

    r = client.post(
        f"/api/projects/{pid}/change-orders",
        headers=_auth(token),
        json={"title": "Extra feature", "description": "", "hours": 10, "rate": 0, "request_ids": [rid]},
    )
    assert r.status_code == 201
    order = r.json()
    assert order["amount"] == 1500  # 10h * project rate 150
    assert order["status"] == "DRAFT"

    # linked request is now resolved
    req = client.get(f"/api/projects/{pid}/requests", headers=_auth(token)).json()[0]
    assert req["status"] == "RESOLVED"
    assert req["classification"] == "OUT_OF_SCOPE"
    assert req["change_order_id"] == order["id"]


def test_change_order_rejects_foreign_request(client):
    token_a, project_a = _register_and_project(client)
    reg_b = register(client, email="b@x.com", name="B")
    token_b = reg_b.json()["access_token"]
    r = client.post("/api/projects", headers=_auth(token_b), json={"title": "B proj", "hourly_rate": 100})
    project_b = r.json()

    # A tries to attach B's project id to A's change order request_ids -> rejected
    r = client.post(
        f"/api/projects/{project_a['id']}/change-orders",
        headers=_auth(token_a),
        json={
            "title": "X",
            "description": "",
            "hours": 1,
            "rate": 100,
            "request_ids": [99999],  # nonexistent
        },
    )
    assert r.status_code == 400

    # request from B's project used as request_id in A's order -> 400
    r = client.post(f"/api/projects/{project_b['id']}/requests", headers=_auth(token_b), json={"text": "b req"})
    foreign_rid = r.json()["id"]
    r = client.post(
        f"/api/projects/{project_a['id']}/change-orders",
        headers=_auth(token_a),
        json={
            "title": "X",
            "description": "",
            "hours": 1,
            "rate": 100,
            "request_ids": [foreign_rid],
        },
    )
    assert r.status_code == 400


def test_change_order_status_flow(client):
    token, project = _register_and_project(client)
    pid = project["id"]
    r = client.post(f"/api/projects/{pid}/change-orders", headers=_auth(token), json={
        "title": "CO", "description": "", "hours": 2, "rate": 100, "request_ids": []})
    oid = r.json()["id"]

    # DRAFT -> APPROVED is not allowed (must go through SENT)
    r = client.patch(f"/api/projects/{pid}/change-orders/{oid}", headers=_auth(token), json={"status": "APPROVED"})
    assert r.status_code == 400

    # DRAFT -> SENT -> APPROVED
    r = client.patch(f"/api/projects/{pid}/change-orders/{oid}", headers=_auth(token), json={"status": "SENT"})
    assert r.status_code == 200
    r = client.patch(f"/api/projects/{pid}/change-orders/{oid}", headers=_auth(token), json={"status": "APPROVED"})
    assert r.status_code == 200
    assert r.json()["decided_at"] is not None
    assert r.json()["amount"] == 200

    # APPROVED -> PAID
    r = client.patch(f"/api/projects/{pid}/change-orders/{oid}", headers=_auth(token), json={"status": "PAID"})
    assert r.status_code == 200

    # PAID -> DRAFT is not allowed (terminal state)
    r = client.patch(f"/api/projects/{pid}/change-orders/{oid}", headers=_auth(token), json={"status": "DRAFT"})
    assert r.status_code == 400


def test_change_order_invalid_status_rejected(client):
    token, project = _register_and_project(client)
    oid = client.post(
        f"/api/projects/{project['id']}/change-orders",
        headers=_auth(token),
        json={"title": "CO", "description": "", "hours": 1, "rate": 100, "request_ids": []},
    ).json()["id"]
    r = client.patch(
        f"/api/projects/{project['id']}/change-orders/{oid}",
        headers=_auth(token),
        json={"status": "HACKED"},
    )
    assert r.status_code == 422


def test_stats(client):
    token, project = _register_and_project(client)
    pid = project["id"]
    r = client.post(f"/api/projects/{pid}/requests", headers=_auth(token), json={"text": "in scope thing"})
    rid1 = r.json()["id"]
    r = client.patch(f"/api/projects/{pid}/requests/{rid1}", headers=_auth(token), json={"classification": "IN_SCOPE"})
    r = client.post(f"/api/projects/{pid}/requests", headers=_auth(token), json={"text": "out of scope thing"})
    rid2 = r.json()["id"]
    client.patch(f"/api/projects/{pid}/requests/{rid2}", headers=_auth(token), json={"classification": "OUT_OF_SCOPE"})

    stats = client.get(f"/api/projects/{pid}/stats", headers=_auth(token)).json()
    assert stats["in_scope_count"] == 1
    assert stats["out_of_scope_count"] == 1  # total out-of-scope (open + resolved)
    assert stats["pending_amount"] == 0  # no change orders yet

    # Create a change order (DRAFT) — should NOT count in pending
    r = client.post(
        f"/api/projects/{pid}/change-orders",
        headers=_auth(token),
        json={"title": "CO draft", "description": "", "hours": 3, "rate": 150, "request_ids": [rid2]},
    )
    co_id = r.json()["id"]
    stats = client.get(f"/api/projects/{pid}/stats", headers=_auth(token)).json()
    assert stats["pending_amount"] == 0  # DRAFT doesn't count

    # Send to client — SENT counts
    client.patch(f"/api/projects/{pid}/change-orders/{co_id}", headers=_auth(token), json={"status": "SENT"})
    stats = client.get(f"/api/projects/{pid}/stats", headers=_auth(token)).json()
    assert stats["pending_amount"] == 450.0  # 3h × R$150

    # Approve — APPROVED counts
    client.patch(f"/api/projects/{pid}/change-orders/{co_id}", headers=_auth(token), json={"status": "APPROVED"})
    stats = client.get(f"/api/projects/{pid}/stats", headers=_auth(token)).json()
    assert stats["pending_amount"] == 450.0  # still counts

    # Pay — PAID does NOT count
    client.patch(f"/api/projects/{pid}/change-orders/{co_id}", headers=_auth(token), json={"status": "PAID"})
    stats = client.get(f"/api/projects/{pid}/stats", headers=_auth(token)).json()
    assert stats["pending_amount"] == 0  # paid is no longer pending

    # Create a second change order and reject it — REJECTED does not count
    r = client.post(
        f"/api/projects/{pid}/change-orders",
        headers=_auth(token),
        json={"title": "CO rejected", "description": "", "hours": 2, "rate": 200, "request_ids": []},
    )
    co2_id = r.json()["id"]
    client.patch(f"/api/projects/{pid}/change-orders/{co2_id}", headers=_auth(token), json={"status": "SENT"})
    client.patch(f"/api/projects/{pid}/change-orders/{co2_id}", headers=_auth(token), json={"status": "REJECTED"})
    stats = client.get(f"/api/projects/{pid}/stats", headers=_auth(token)).json()
    assert stats["pending_amount"] == 0  # rejected doesn't count

    # Create a third change order — multiple pending orders should sum
    r = client.post(
        f"/api/projects/{pid}/change-orders",
        headers=_auth(token),
        json={"title": "CO pending", "description": "", "hours": 5, "rate": 100, "request_ids": []},
    )
    co3_id = r.json()["id"]
    client.patch(f"/api/projects/{pid}/change-orders/{co3_id}", headers=_auth(token), json={"status": "SENT"})
    r = client.post(
        f"/api/projects/{pid}/change-orders",
        headers=_auth(token),
        json={"title": "CO pending 2", "description": "", "hours": 1, "rate": 300, "request_ids": []},
    )
    co4_id = r.json()["id"]
    client.patch(f"/api/projects/{pid}/change-orders/{co4_id}", headers=_auth(token), json={"status": "SENT"})
    client.patch(f"/api/projects/{pid}/change-orders/{co4_id}", headers=_auth(token), json={"status": "APPROVED"})
    stats = client.get(f"/api/projects/{pid}/stats", headers=_auth(token)).json()
    assert stats["pending_amount"] == 800.0  # 500 + 300


def test_delete_project_cascades(client):
    token, project = _register_and_project(client)
    pid = project["id"]
    r = client.post(f"/api/projects/{pid}/requests", headers=_auth(token), json={"text": "req"})
    rid = r.json()["id"]
    client.post(
        f"/api/projects/{pid}/change-orders",
        headers=_auth(token),
        json={"title": "CO", "description": "", "hours": 1, "rate": 100, "request_ids": [rid]},
    )

    assert client.delete(f"/api/projects/{pid}", headers=_auth(token)).status_code == 204
    assert client.get(f"/api/projects/{pid}", headers=_auth(token)).status_code == 404

    # Orphan rows gone
    from app.database import SessionLocal
    from app.models import Request

    db = SessionLocal()
    try:
        assert db.query(Request).filter(Request.project_id == pid).count() == 0
    finally:
        db.close()


def test_delete_project_nonexistent(client):
    token = register(client).json()["access_token"]
    assert client.delete("/api/projects/9999", headers=_auth(token)).status_code == 404


def test_many_requests_pagination_not_needed_but_list_sorted(client):
    token, project = _register_and_project(client)
    for i in range(5):
        client.post(
            f"/api/projects/{project['id']}/requests",
            headers=_auth(token),
            json={"text": f"req {i}"},
        )
    r = client.get(f"/api/projects/{project['id']}/requests", headers=_auth(token))
    assert len(r.json()) == 5


def test_project_update(client):
    token, project = _register_and_project(client)
    pid = project["id"]
    r = client.patch(f"/api/projects/{pid}", headers=_auth(token), json={"hourly_rate": 200})
    assert r.status_code == 200
    assert r.json()["hourly_rate"] == 200
    assert r.json()["title"] == "Site redesign"  # unchanged fields preserved

    r = client.patch(f"/api/projects/{pid}", headers=_auth(token), json={"status": "bogus"})
    assert r.status_code == 422


def test_free_plan_project_limit(client):
    """Free plan allows up to 3 projects. 4th should be rejected."""
    reg = client.post(
        "/api/auth/register",
        json={"email": "limit@test.com", "password": "password123", "name": "Limit"},
    )
    token = reg.json()["access_token"]
    h = _auth(token)

    for i in range(3):
        r = client.post(
            "/api/projects",
            headers=h,
            json={"title": f"P{i}", "hourly_rate": 100, "scope_entries": []},
        )
        assert r.status_code == 201

    # 4th project should be blocked
    r = client.post(
        "/api/projects",
        headers=h,
        json={"title": "P3-too-many", "hourly_rate": 100, "scope_entries": []},
    )
    assert r.status_code == 403
    assert "até 3" in r.json()["detail"]