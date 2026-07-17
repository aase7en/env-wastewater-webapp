"""core.equipment — master list of 10 plant devices (P2).

`code` matches the boolean column names on wastewater.reading
(pump1, pump2, aerator1, aerator2, sludge_pump1, sludge_pump2,
chlorine_pump1, chlorine_pump2, screen_coarse, screen_fine) so the daily form
checklist and the equipment reference stay in lockstep.
"""
from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._base import Timestamps, UUIDPrimaryKey


class Equipment(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "equipment"
    __table_args__ = {"schema": "core"}

    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name_th: Mapped[str] = mapped_column(String(200), nullable=False)
    name_en: Mapped[Optional[str]] = mapped_column(String(200))
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("core.location.id")
    )
    is_active: Mapped[bool] = mapped_column(
        nullable=False, default=True, server_default=text("true")
    )
