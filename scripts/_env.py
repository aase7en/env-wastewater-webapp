#!/usr/bin/env python3
"""Drive-backed secrets resolution for repo scripts — stdlib only.

Ported from ``app/core/config.py`` when the FastAPI backend was removed
(WO-FASTAPI-removal, Approach C). The full original lives on the
``archive/fastapi-backend`` branch.

Resolution chain for the Drive root (same as A-Wiki's drive_path.py):
  1. ``A_WIKI_DRIVE_PATH`` env override
  2. sibling ``A-Wiki/.drive-path`` per-machine config file
  3. sibling ``A-Wiki/drive/`` link (resolves Windows junctions)
  4. direct candidates (Windows ``L:/``, macOS Google Drive, ``~/.a-wiki-data``)

The repo ``.env`` stub redirects to Drive when it contains
``__LOAD_FROM_DRIVE__=true`` — real values live in
``<drive>/secrets/env-wastewater-webapp.env``.

Two deliberate differences from the FastAPI-era original: the local stub
path is anchored to the repo root (not the process cwd), so scripts work
from any directory; and resolution happens lazily per call instead of at
import time, so importing this module never walks the filesystem.
"""
from __future__ import annotations

import os
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[1]
_A_WIKI_CANDIDATES = [
    _REPO_ROOT.parent / "A-Wiki",  # sibling dir (../A-Wiki)
    Path.home() / "A-Wiki",
]
_LOCAL_STUB = _REPO_ROOT / ".env"


def _resolve_drive_root() -> Path | None:
    """Return the A-Wiki-Data Drive root, or None if not found."""
    env = os.environ.get("A_WIKI_DRIVE_PATH")
    if env and Path(env).exists():
        return Path(env)
    for wiki in _A_WIKI_CANDIDATES:
        cfg = wiki / ".drive-path"
        if cfg.exists():
            p = cfg.read_text(encoding="utf-8", errors="ignore").strip()
            if p and Path(p).exists():
                return Path(p)
        link = wiki / "drive"
        if link.exists():
            try:
                return Path(os.path.realpath(str(link)))
            except OSError:
                return link
    direct = [
        Path("L:/My Drive/A-Wiki-Data"),
        Path.home() / "Google Drive/My Drive/A-Wiki-Data",
        Path.home() / ".a-wiki-data",
    ]
    for p in direct:
        if p.exists():
            return p
    return None


def resolve_env_file() -> str | None:
    """Return the .env path scripts should read (Drive-backed when stubbed).

    Same contract as the old ``app.core.config._resolve_env_file``: prefer
    ``<drive>/secrets/env-wastewater-webapp.env`` when the local stub opts
    in via ``__LOAD_FROM_DRIVE__``, else the local ``.env``, else None.
    """
    if _LOCAL_STUB.exists():
        text = _LOCAL_STUB.read_text(encoding="utf-8", errors="ignore")
        if "__LOAD_FROM_DRIVE__=true" in text or "__LOAD_FROM_DRIVE__=1" in text:
            drive = _resolve_drive_root()
            repo_env = drive / "secrets" / "env-wastewater-webapp.env" if drive else None
            if repo_env and repo_env.exists():
                return str(repo_env)
            # Stub says Drive but the repo file is missing — fall back to local.
        return str(_LOCAL_STUB)
    return None


def load_secret(name: str) -> str:
    """Read a secret: process env first, then the resolved env file.

    Returns "" when the key is nowhere to be found — callers decide how
    loud to fail. Never log or print the returned value.
    """
    val = os.environ.get(name, "")
    if val:
        return val
    p = resolve_env_file()
    if p:
        for line in Path(p).read_text(encoding="utf-8").splitlines():
            if line.startswith(f"{name}="):
                return line.split("=", 1)[1].strip()
    return ""
