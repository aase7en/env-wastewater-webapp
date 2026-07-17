"""FastAPI dependencies for auth and authorization.

Endpoints depend on `current_user` (any authenticated principal) and
`require_admin` (admin role only). The underlying resolver (stub vs JWT) is
selected by settings.auth_mode in app.core.auth.
"""
from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status

from app.core.auth import AuthError, CurrentUser, resolve_jwt_user, resolve_stub_user
from app.core.config import get_settings
from app.core.db import get_session
from sqlalchemy.ext.asyncio import AsyncSession


async def current_user(
    authorization: str | None = Header(default=None),
    session: AsyncSession | None = Depends(get_session),
) -> CurrentUser:
    s = get_settings()
    if s.auth_mode == "stub":
        return await resolve_stub_user()
    # JWT mode — needs a real session to look up core.app_user.
    if session is None:  # pragma: no cover - defensive
        raise HTTPException(status_code=503, detail="db session unavailable")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ", 1)[1].strip()
    try:
        return await resolve_jwt_user(token, session)
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def require_admin(user: CurrentUser = Depends(current_user)) -> CurrentUser:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="admin role required",
        )
    return user
