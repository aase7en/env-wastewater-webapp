"""Application settings.

Loaded from environment variables (.env in dev). All secrets live here and are
never logged or returned by any endpoint. See `.env.example` for documentation.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
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
