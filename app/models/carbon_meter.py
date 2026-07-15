"""carbon.meter — electricity meter master (1 row: the WWTP meter).

Phase 2 inserts reference a fixed meter_id (b6be4c99-c83a-43f7-b765-72286cc78bd0)
when inserting carbon.reading rows.
"""
from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._base import Timestamps, UUIDPrimaryKey


class CarbonMeter(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "meter"
    __table_args__ = {"schema": "carbon"}

    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("core.location.id")
    )
    is_active: Mapped[bool] = mapped_column(
        nullable=False, default=True, server_default=text("true")
    )
