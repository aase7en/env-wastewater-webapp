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
from app.api.readings import router as readings_router  # noqa: E402
from app.api.dashboard import router as dashboard_router  # noqa: E402
from app.api.reference import router as reference_router  # noqa: E402
from app.api.repair_requests import router as repair_router  # noqa: E402
from app.api.pdf_templates import router as pdf_templates_router  # noqa: E402

app.include_router(meta_router)
app.include_router(readings_router)
app.include_router(dashboard_router)
app.include_router(reference_router)
app.include_router(repair_router)
app.include_router(pdf_templates_router)
