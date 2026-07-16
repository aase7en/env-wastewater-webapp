"""Application settings.

Loaded from environment variables (.env in dev). All secrets live here and are
never logged or returned by any endpoint. See `.env.example` for documentation.

Secret storage strategy (see CONTRIBUTING.md): the canonical .env lives in
Google Drive at A-Wiki-Data/secrets/env-wastewater-webapp.env so it syncs
across devices. The local .env is a stub containing __LOAD_FROM_DRIVE__=true;
this loader reads the real values from Drive when that flag is set. Falls back
to the local .env if Drive is unavailable (other machines, CI).
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Candidate Drive locations, checked in order. Adjust if Drive mounts elsewhere.
_DRIVE_CANDIDATES = [
    Path("L:/My Drive/A-Wiki-Data/secrets/env-wastewater-webapp.env"),
    # macOS Google Drive: ~/Google Drive/My Drive/A-Wiki-Data/secrets/...
    Path.home() / "Google Drive/My Drive/A-Wiki-Data/secrets/env-wastewater-webapp.env",
]
_LOCAL_STUB = Path(".env")


def _resolve_env_file() -> str | None:
    """Return the .env path to load: Drive canonical if stub points there, else local."""
    if _LOCAL_STUB.exists():
        text = _LOCAL_STUB.read_text(encoding="utf-8", errors="ignore")
        if "__LOAD_FROM_DRIVE__=true" in text or "__LOAD_FROM_DRIVE__=1" in text:
            for cand in _DRIVE_CANDIDATES:
                if cand.exists():
                    return str(cand)
            # Stub says load from Drive but Drive not mounted — fall through to
            # local (which has no real values, so settings will fail loudly).
    return ".env" if _LOCAL_STUB.exists() else None


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_resolve_env_file(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Database -----------------------------------------------------------
    # Pooler (transaction mode, port 6543) — required for serverless / async
    # connection pooling against Supabase Postgres. The default is a clearly
    # invalid placeholder so the app can boot for health checks in CI / fresh
    # clones without .env; any endpoint that actually queries will fail loudly.
    supabase_db_url: str = Field(
        default="postgresql://unset:unset@localhost:5432/unset",
        description="Postgres connection string for ENV_DB",
    )

    # --- Auth ---------------------------------------------------------------
    supabase_jwt_secret: str = Field(
        default="",
        description="Supabase JWT secret for verifying user access tokens. Blank = dev mode only.",
    )
    auth_mode: Literal["jwt", "stub"] = Field(
        default="stub",
        description="'jwt' verifies real Supabase tokens; 'stub' returns a fixed mock user.",
    )
    stub_user_email: str = "staff@example.local"
    stub_user_role: Literal["admin", "staff"] = "staff"

    # --- App ----------------------------------------------------------------
    app_env: Literal["dev", "test", "prod"] = "dev"
    app_host: str = "127.0.0.1"
    app_port: int = 8000

    @property
    def is_dev(self) -> bool:
        return self.app_env == "dev"


@lru_cache
def get_settings() -> Settings:
    """Cached settings — read .env once per process."""
    return Settings()  # type: ignore[call-arg]
