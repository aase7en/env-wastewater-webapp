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
