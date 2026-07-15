"""Endpoint contract tests.

These validate the HTTP contract (status codes, response shape, auth gating)
without touching a real DB. The DB session dependency is overridden to return
a stub session whose methods return canned data. This catches wiring errors
(router registration, schema serialization, auth guards) that unit tests on
the service layer would miss.

Full integration tests against live ENV_DB live in tests/integration/ and run
only when SUPABASE_DB_URL resolves (P5b.2 follow-up).
"""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Optional
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient


# ---- A stub async session that returns canned query results ------------------

class StubSession:
    """Minimal AsyncSession stand-in. Methods are async MagicMock factories."""

    def __init__(self):
        self.add = MagicMock()
        self.delete = MagicMock()
        self.rollback = AsyncMock()
        self.refresh = AsyncMock()
        self.execute = AsyncMock()
        self.get = AsyncMock()
        # flush + commit in a real session populate server-defaulted columns
        # (id); mimic that by assigning a uuid to anything add()ed.
        added: list = []
        self.add.side_effect = lambda obj: added.append(obj)

        async def _populate_ids(*a, **kw):
            import uuid as _uuid
            for obj in added:
                if getattr(obj, "id", None) is None:
                    obj.id = _uuid.uuid4()
        self.flush = AsyncMock(side_effect=_populate_ids)
        self.commit = AsyncMock(side_effect=_populate_ids)
        # configurable canned rows
        self._list_rows: list = []
        self._get_row: object = None

    def set_list_rows(self, rows: list):
        self._list_rows = rows
        # Make execute().scalars().all() return these rows.
        result = MagicMock()
        result.scalars.return_value.all.return_value = rows
        result.mappings.return_value.all.return_value = rows
        self.execute.return_value = result

    def set_get_row(self, row):
        self._get_row = row
        self.get.return_value = row


@pytest.fixture()
def stub_session():
    return StubSession()


@pytest.fixture()
def app_client(stub_session, env_test_mode):
    """Client with get_session overridden to return our StubSession."""
    from app.core import config
    config.get_settings.cache_clear()
    from app.main import app
    from app.core.db import get_session

    async def _override():
        yield stub_session

    app.dependency_overrides[get_session] = _override
    yield TestClient(app)
    app.dependency_overrides.clear()


# ---- /api/readings ----------------------------------------------------------

class TestCreateReading:
    def test_rejects_abnormal_without_cause(self, app_client):
        """SPEC §6: system_operating=False without cause → 422."""
        resp = app_client.post(
            "/api/readings",
            json={"reading_date": "2026-07-16", "system_operating": False},
        )
        assert resp.status_code == 422
        assert "cause" in resp.text

    def test_accepts_normal_reading(self, app_client, stub_session):
        """A valid normal reading returns 201 with computed fields populated."""
        # _resolve_default_location_id calls session.execute(...).first()[0].
        loc_result = MagicMock()
        loc_result.first.return_value = ["loc-uuid-1234"]
        stub_session.execute.return_value = loc_result
        # StubSession.flush already assigns a uuid to added objects — no extra
        # setup needed here.

        resp = app_client.post(
            "/api/readings",
            json={
                "reading_date": "2026-07-16",
                "ph": "7.2",
                "system_operating": True,
                "do_aeration": "4.0",
                "do_sedimentation": "3.0",
                "do_before_discharge": "5.0",
            },
        )
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["reading_date"] == "2026-07-16"
        # Computed: avg of 4,3,5 = 4.0
        assert body["do_average"] == 4.0
        assert body["date_thai_be"] == 2569


class TestListReadings:
    def test_returns_empty_list(self, app_client, stub_session):
        stub_session.set_list_rows([])
        resp = app_client.get("/api/readings")
        assert resp.status_code == 200
        body = resp.json()
        assert body == {"items": [], "total": 0}

    def test_returns_rows(self, app_client, stub_session):
        # A fake ORM-like row object.
        class FakeReading:
            id = "11111111-1111-1111-1111-111111111111"
            reading_date = date(2026, 7, 16)
            do_aeration = Decimal("4.0")
            do_sedimentation = Decimal("3.0")
            do_before_discharge = Decimal("5.0")
            ph = Decimal("7.2")
            free_chlorine = Decimal("0.8")
            system_operating = True

        stub_session.set_list_rows([FakeReading()])
        resp = app_client.get("/api/readings?from=2026-07-01&to=2026-07-31")
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        item = body["items"][0]
        assert item["reading_date"] == "2026-07-16"
        assert item["do_average"] == 4.0
        assert item["date_thai_be"] == 2569


# ---- /api/dashboard (raw SQL path) ------------------------------------------

class TestDashboard:
    def test_returns_rows_from_view(self, app_client, stub_session):
        """Dashboard reads the DB view via raw SQL; stub returns mapping rows."""
        view_row = {
            "reading_date": date(2026, 7, 16),
            "do_average": Decimal("3.5"),
            "ph": Decimal("7.1"),
            "free_chlorine": Decimal("0.9"),
            "tds_aeration": Decimal("450"),
            "water_used_total": Decimal("40"),
            "wastewater_in": Decimal("40"),
            "system_operating": True,
            "wastewater_discharged": None,
            "do_alert": False,
            "chlorine_alert": False,
            "ph_alert": False,
        }
        result = MagicMock()
        result.mappings.return_value.all.return_value = [view_row]
        stub_session.execute.return_value = result

        resp = app_client.get("/api/dashboard?days=14")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body) == 1
        assert body[0]["reading_date"] == "2026-07-16"


# ---- /api/me ----------------------------------------------------------------

class TestMe:
    def test_returns_stub_user(self, app_client):
        resp = app_client.get("/api/me")
        assert resp.status_code == 200
        body = resp.json()
        assert body["role"] in ("admin", "staff")
        assert "@" in body["email"]


# ---- /api/pdf-templates (admin delete) --------------------------------------

class TestPdfTemplateDelete:
    def test_delete_requires_admin(self, app_client, monkeypatch):
        """In stub mode default role is 'staff' → delete must 403."""
        # Force stub role to staff for this test.
        from app.core import config
        config.get_settings.cache_clear()
        monkeypatch.setenv("STUB_USER_ROLE", "staff")
        config.get_settings.cache_clear()

        resp = app_client.delete("/api/pdf-templates/11111111-1111-1111-1111-111111111111")
        assert resp.status_code in (403,)
