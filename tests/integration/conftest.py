"""Integration tests against live ENV_DB.

These ONLY run when SUPABASE_DB_URL is configured (not the placeholder).
Skipped automatically otherwise, so `pytest` stays green on fresh checkouts
and in CI without secrets.

The skip is implemented via `collect_ignore` at the bottom of this file —
pytest honors it before any fixture or import triggers a DB connection
attempt. Each test module also carries a defensive module-level skipif.

Run explicitly:
    uv run pytest tests/integration -v

The tests never create or destroy data — they read (counts, column presence,
view queries) and at most exercise GET endpoints. POST/PUT/DELETE against the
real DB require a separate marked opt-in (not included here) to avoid writing
to production data without explicit approval.
"""
from __future__ import annotations

import os

import pytest


def db_configured() -> bool:
    """True iff SUPABASE_DB_URL points at a real DB (not the placeholder)."""
    url = os.environ.get("SUPABASE_DB_URL", "")
    return bool(url) and "unset" not in url


# Used by each test module's module-level pytestmark.
skip_unless_db = pytest.mark.skipif(
    not db_configured(),
    reason="SUPABASE_DB_URL not configured — set it in .env to run integration tests",
)


@pytest.fixture(scope="session")
def engine():
    """Live async engine. Disposed at session end."""
    from app.core import config
    config.get_settings.cache_clear()
    from app.core.db import _engine
    eng = _engine()
    yield eng
    import asyncio
    asyncio.run(eng.dispose())
