"""FastAPI application entrypoint.

Run locally:  uvicorn app.main:app --reload
"""
from __future__ import annotations

import logging

from fastapi import FastAPI

from app import __version__
from app.core.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

settings = get_settings()

app = FastAPI(
    title="ENV Wastewater API",
    description=(
        "Backend for โรงพยาบาลอุทัย wastewater-treatment monitoring. "
        "Replaces the legacy AppSheet daily-entry workflow."
    ),
    version=__version__,
)


@app.get("/api/health", tags=["meta"])
async def health() -> dict[str, str]:
    """Liveness/readiness probe. Does not touch the database."""
    return {
        "status": "ok",
        "version": __version__,
        "env": settings.app_env,
        "auth_mode": settings.auth_mode,
    }


# Routers are registered in sub-chunks as endpoints land.
from app.api.meta import router as meta_router  # noqa: E402

app.include_router(meta_router)
#   P5d: app.api.readings, app.api.dashboard, app.api.equipment, ...
