"""Auth dependency tests.

In stub mode (default for tests/CI) every authenticated endpoint returns the
stub user. In JWT mode we'd need a real Supabase token — that path is covered
by integration tests, not here.
"""
from __future__ import annotations


def test_stub_user_returned_from_dependency(client):
    """The /api/health endpoint reflects the auth_mode in effect."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["auth_mode"] == "stub"


def test_stub_user_fields():
    """Directly exercise the stub resolver without going through FastAPI."""
    import asyncio
    from app.core.auth import resolve_stub_user
    user = asyncio.run(resolve_stub_user())
    assert user.role in ("admin", "staff")
    assert "@" in user.email
    assert user.app_user_id is None  # stub has no DB row
    assert user.auth_user_id is None


def test_me_endpoint_returns_stub_user(client):
    """/api/me returns the stub principal in stub mode."""
    resp = client.get("/api/me")
    assert resp.status_code == 200
    body = resp.json()
    assert body["role"] in ("admin", "staff")
    assert "@" in body["email"]
    # In stub mode there is no real app_user row.
    assert body["app_user_id"] is None


def test_admin_required_endpoint_in_stub_mode():
    """In stub mode role defaults to 'staff'; an admin-only path should 403.

    We exercise require_admin via a temporary route to avoid coupling the
    auth test to a specific business endpoint.
    """
    import asyncio
    from app.core.dependencies import require_admin
    from app.core.auth import CurrentUser

    # Simulate staff user → require_admin should raise HTTPException 403.
    staff = CurrentUser(
        app_user_id=None, auth_user_id=None, email="s@x.local", role="staff"
    )
    try:
        asyncio.run(require_admin(user=staff))
        assert False, "expected HTTPException"
    except Exception as e:
        # FastAPI's HTTPException carries 403.
        assert getattr(e, "status_code", None) == 403

    admin = CurrentUser(
        app_user_id=None, auth_user_id=None, email="a@x.local", role="admin"
    )
    result = asyncio.run(require_admin(user=admin))
    assert result.role == "admin"
