"""Meta endpoints: current user info.

Gives the frontend a way to resolve the logged-in principal and its role
without decoding the JWT client-side.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import current_user
from app.schemas.auth import UserOut

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/me", response_model=UserOut)
async def me(user=Depends(current_user)) -> UserOut:
    """Return the authenticated principal's public profile."""
    return UserOut(
        email=user.email,
        role=user.role,
        display_name=user.display_name,
        app_user_id=user.app_user_id,
    )
