"""core.app_user — 1:1 link to auth.users with role + display name.

Auth lives in Supabase (auth.users, email+password). This table maps each
auth.users.id to an application role ('admin' | 'staff') and a Thai display
name. See SPEC.md §3.
"""
from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._base import Timestamps, UUIDPrimaryKey


class AppUser(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "app_user"
    __table_args__ = {"schema": "core"}

    # 1:1 with auth.users.id. FK declared but not enforced across schemas by
    # default in Supabase (auth is a separate schema managed by GoTrue).
    auth_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    # Role check constraint lives in the DB; the Python side just reads it.
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="staff")
    display_name: Mapped[Optional[str]] = mapped_column(String(200))
    is_active: Mapped[bool] = mapped_column(
        nullable=False, default=True, server_default=text("true")
    )
