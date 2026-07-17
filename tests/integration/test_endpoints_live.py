"""Live endpoint smoke tests — exercise the read paths against ENV_DB.

Read-only: GETs only. No data is created or modified. This validates the full
stack end-to-end (auth stub → SQLAlchemy → ENV_DB → response) for the queries
the frontend will actually issue.

POST/PUT/DELETE live tests are intentionally NOT here — those write to
production data and need a separate, explicitly-opt-in mark + a disposable
test schema. See MIGRATION.md P5b.2 follow-up.
"""
from __future__ import annotations

import pytest

from tests.integration.conftest import skip_unless_db

pytestmark = skip_unless_db


@pytest.fixture()
def live_client(monkeypatch):
    """TestClient with a real DB engine (no get_session override)."""
    from app.core import config
    config.get_settings.cache_clear()
    from app.core.db import _engine, SessionLocal
    _engine.cache_clear()
    SessionLocal.cache_clear()
    from app.main import app
    from fastapi.testclient import TestClient
    yield TestClient(app)


def test_list_readings_returns_migrated_rows(live_client):
    """GET /api/readings must return rows from the 907 migrated."""
    resp = live_client.get("/api/readings?limit=5")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] > 0, "no readings returned — DB query or wiring broken"
    item = body["items"][0]
    assert "reading_date" in item
    assert "do_average" in item
    assert "date_thai_be" in item


def test_dashboard_returns_14_days(live_client):
    """GET /api/dashboard reads the v_reading_detail view end-to-end."""
    resp = live_client.get("/api/dashboard?days=14")
    assert resp.status_code == 200
    # The view must return a list (possibly empty if no rows in the last 14d,
    # but the query must succeed and the columns must match the schema).
    assert isinstance(resp.json(), list)


def test_reference_endpoints_seeded(live_client):
    """Equipment/locations/personnel endpoints return the seeded rows."""
    for path, min_count in [
        ("/api/equipment", 10),
        ("/api/locations", 1),       # only WWTP-1 seeded
        ("/api/location-categories", 8),
        ("/api/personnel", 9),
    ]:
        resp = live_client.get(path)
        assert resp.status_code == 200, f"{path} → {resp.status_code}: {resp.text}"
        assert len(resp.json()) >= min_count, (
            f"{path} returned {len(resp.json())} rows, expected ≥ {min_count}"
        )
