"""core.repair_request — ใบแจ้งซ่อม (P2).

Raised when system_operating=ผิดปกติ or an equipment item is flagged. Empty
on creation — rows come from the webapp. See CONTEXT.md §ใบแจ้งซ่อม.
"""
from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._base import Timestamps, UUIDPrimaryKey


class RepairRequest(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "repair_request"
    __table_args__ = {"schema": "core"}

    equipment_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("core.equipment.id")
    )
    reading_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wastewater.reading.id")
    )
    reported_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("core.app_user.id")
    )
    # Required — the cause is the whole point of the document.
    cause: Mapped[str] = mapped_column(Text, nullable=False)
    # status enum: open | in_progress | resolved | cancelled
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="open", server_default=text("'open'")
    )
    resolved_at: Mapped[Optional[date]] = mapped_column(Date)
