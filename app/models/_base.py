"""Shared mixins/columns for ORM models.

ENV_DB uses `id uuid default gen_random_uuid()` as the PK on every table, and
most have `created_at`/`updated_at`. Centralizing these keeps each model file
focused on its domain columns.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class UUIDPrimaryKey:
    """UUID PK defaulted by the DB (gen_random_uuid()), not by Python."""
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )


class Timestamps:
    """created_at only. ENV_DB tables have no updated_at (confirmed live, P5b.2)."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
