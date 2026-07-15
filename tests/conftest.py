"""Shared pytest fixtures.

The test suite uses stub auth and a DB-free TestClient where possible.
Tests that need the DB are marked and skipped if SUPABASE_DB_URL is unreachable
(or absent in CI). This keeps `pytest` green on a fresh checkout with no .env.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Make `app` importable when running pytest from repo root.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def env_test_mode(monkeypatch_session):  # noqa: ANN001
    """Force stub auth + test env for the whole session."""
    os.environ["AUTH_MODE"] = "stub"
    os.environ["APP_ENV"] = "test"
    # DB URL may be a placeholder in CI — tests that need it skip themselves.
    os.environ.setdefault(
        "SUPABASE_DB_URL",
        "postgresql://nobody:nobody@localhost:5432/nobody",
    )


@pytest.fixture()
def client(env_test_mode) -> TestClient:
    """FastAPI test client with stub auth. Import is deferred so env vars apply."""
    # Bust the lru_cache so settings re-read the patched env.
    from app.core import config
    config.get_settings.cache_clear()
    from app.main import app
    return TestClient(app)


# ---- session-scoped monkeypatch (pytest's monkeypatch is function-scoped) ----
import contextlib


@pytest.fixture(scope="session")
def monkeypatch_session():
    from _pytest.monkeypatch import MonkeyPatch
    mp = MonkeyPatch()
    yield mp
    mp.undo()
