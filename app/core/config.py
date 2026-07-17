"""Application settings.

Loaded from environment variables (.env in dev). All secrets live here and are
never logged or returned by any endpoint. See `.env.example` for documentation.

Secret storage strategy (P6.5 — hybrid global + per-repo, see
docs/protocols/secrets-global-env.md in the A-Wiki repo):
  - secrets/global.env             universal AI keys / shared tokens
  - secrets/env-wastewater-webapp.env  this repo's DB URL, PAT, etc.
Both live on Google Drive (A-Wiki-Data/secrets/) and sync across machines.
The local .env is a stub (__LOAD_FROM_DRIVE__=true); this loader reads the
real values from Drive when that flag is set, merging global first then
repo-specific overrides. Falls back to local .env if Drive is unavailable.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Cross-platform Drive root resolution. Same chain as A-Wiki's drive_path.py:
# env override → sibling A-Wiki/drive link → A-Wiki/.drive-path → candidates.
_REPO_ROOT = Path(__file__).resolve().parents[2]
_A_WIKI_CANDIDATES = [
    _REPO_ROOT.parent / "A-Wiki",           # sibling dir (../A-Wiki)
    Path.home() / "A-Wiki",
]


def _resolve_drive_root() -> Path | None:
    """Return the A-Wiki-Data Drive root, or None if not found."""
    # 1. env override
    import os
    env = os.environ.get("A_WIKI_DRIVE_PATH")
    if env and Path(env).exists():
        return Path(env)
    # 2. A-Wiki/.drive-path file (per-machine config)
    for wiki in _A_WIKI_CANDIDATES:
        cfg = wiki / ".drive-path"
        if cfg.exists():
            p = cfg.read_text(encoding="utf-8", errors="ignore").strip()
            if p and Path(p).exists():
                return Path(p)
        # 3. A-Wiki/drive/ link (resolves through Windows junctions too)
        link = wiki / "drive"
        if link.exists():
            import os as _os
            try:
                return Path(_os.path.realpath(str(link)))
            except OSError:
                return link
    # 4. Direct candidates (Windows L:/, macOS ~/Google Drive/...)
    direct = [
        Path("L:/My Drive/A-Wiki-Data"),
        Path.home() / "Google Drive/My Drive/A-Wiki-Data",
        Path.home() / ".a-wiki-data",
    ]
    for p in direct:
        if p.exists():
            return p
    return None


_DRIVE_ROOT = _resolve_drive_root()
_SECRETS_DIR = _DRIVE_ROOT / "secrets" if _DRIVE_ROOT else None
_REPO_ENV = _SECRETS_DIR / "env-wastewater-webapp.env" if _SECRETS_DIR else None
_GLOBAL_ENV = _SECRETS_DIR / "global.env" if _SECRETS_DIR else None
_LOCAL_STUB = Path(".env")


def _resolve_env_file() -> str | None:
    """Return the repo-specific .env path to load (pydantic-settings reads one file).

    The repo-specific file is preferred because it holds the DB URL + PAT.
    pydantic-settings merges it on top of whatever os.environ already has, so
    callers that want global keys too should source load-global-env.sh first
    (the IDE hook from P6.4 does this automatically in dev terminals).
    """
    if _LOCAL_STUB.exists():
        text = _LOCAL_STUB.read_text(encoding="utf-8", errors="ignore")
        if "__LOAD_FROM_DRIVE__=true" in text or "__LOAD_FROM_DRIVE__=1" in text:
            if _REPO_ENV and _REPO_ENV.exists():
                return str(_REPO_ENV)
            # Stub says Drive but repo file missing — fall back to local.
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
