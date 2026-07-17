"""Auth response schema — what endpoints return about the current user."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class UserOut(BaseModel):
    email: str
    role: str
    display_name: Optional[str] = None
    app_user_id: Optional[str] = None
