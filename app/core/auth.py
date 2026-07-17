"""Auth: resolve the current user from a Supabase access token.

Two modes (settings.auth_mode):
  - "stub": return a fixed mock user. For local dev before real auth.users
    rows exist. No token verification happens.
  - "jwt" : decode and verify the Supabase-issued JWT using
    settings.supabase_jwt_secret, then look up core.app_user by auth.users.id.

Endpoints never call these functions directly — they depend on
`current_user` / `require_admin` from app.core.dependencies, which wrap this.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class CurrentUser:
    """Authenticated principal — what endpoints see."""
    app_user_id: Optional[str]   # core.app_user.id (uuid); None for stub/dev
    auth_user_id: Optional[str]  # auth.users.id (uuid); None for stub
    email: str
    role: str                    # 'admin' | 'staff'
    display_name: Optional[str] = None


class AuthError(Exception):
    """Raised when a token is missing, malformed, expired, or the user is unknown."""


async def resolve_stub_user() -> CurrentUser:
    s = get_settings()
    return CurrentUser(
        app_user_id=None,
        auth_user_id=None,
        email=s.stub_user_email,
        role=s.stub_user_role,
        display_name=s.stub_user_email.split("@", 1)[0],
    )


async def resolve_jwt_user(
    token: str,
    session: AsyncSession,
) -> CurrentUser:  # pragma: no cover - exercised once real JWTs exist
    """Verify a Supabase access token and load the matching core.app_user.

    Imports jose lazily so the dependency is optional in stub mode.
    """
    from jose import JWTError, jwt  # type: ignore[import-untyped]

    s = get_settings()
    if not s.supabase_jwt_secret:
        raise AuthError("SUPABASE_JWT_SECRET not configured — cannot verify tokens")

    try:
        payload = jwt.decode(
            token,
            s.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as e:
        raise AuthError(f"invalid token: {e}") from e

    auth_user_id = payload.get("sub")
    if not auth_user_id:
        raise AuthError("token has no 'sub' claim")

    email = payload.get("email", "")
    # core.app_user is 1:1 with auth.users on its auth_user_id column. We avoid
    # importing the ORM model here to dodge a circular import; select by text.
    from sqlalchemy import text
    row = (
        await session.execute(
            text(
                "SELECT id, role, display_name FROM core.app_user "
                "WHERE auth_user_id = :uid"
            ),
            {"uid": auth_user_id},
        )
    ).first()
    if row is None:
        raise AuthError(f"no core.app_user row for auth.users.id={auth_user_id}")

    return CurrentUser(
        app_user_id=str(row.id),
        auth_user_id=auth_user_id,
        email=email,
        role=row.role,
        display_name=row.display_name,
    )
