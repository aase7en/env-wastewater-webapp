"""Health endpoint — the P5a failing-test-first anchor."""
from __future__ import annotations


def test_health_returns_ok(client):
    """GET /api/health → 200 with status, version, env, auth_mode."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "version" in body
    assert body["env"] == "test"
    assert body["auth_mode"] == "stub"
