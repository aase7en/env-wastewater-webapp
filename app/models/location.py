"""core.location — physical sites the hospital tracks (P3).

Scope is broader than just the wastewater pond: โรงครัว, ซักฟอก, OPD, IPD,
ห้องฟัน, ห้องยา, การเงิน, สิ่งแวดล้อม. Only WWTP-1 is seeded so far — see
CONTEXT.md §Location. Coordinates are plain numeric, NOT PostGIS (no spatial
query need exists yet).
"""
from __future__ import annotations

import uuid
from typing import Optional

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._base import Timestamps, UUIDPrimaryKey


class Location(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "location"
    __table_args__ = {"schema": "core"}

    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("core.location_category.id"),
        index=True,
    )
    lat: Mapped[Optional[Decimal]] = mapped_column(Numeric(9, 6))
    lng: Mapped[Optional[Decimal]] = mapped_column(Numeric(9, 6))
    is_active: Mapped[bool] = mapped_column(
        nullable=False, default=True, server_default=text("true")
    )
