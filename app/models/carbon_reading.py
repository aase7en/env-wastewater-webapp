"""carbon.reading — daily electricity + consumption record.

Joined 1:1 to wastewater.reading via wastewater.reading.carbon_reading_id.
The daily form creates one carbon.reading + one wastewater.reading in a single
transaction (matching the Phase 2 batch SQL pattern).
"""
from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._base import Timestamps, UUIDPrimaryKey


class CarbonReading(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "reading"
    __table_args__ = (
        UniqueConstraint("meter_id", "reading_date", name="uq_carbon_reading_meter_date"),
        {"schema": "carbon"},
    )

    meter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("carbon.meter.id"), nullable=False, index=True
    )
    reading_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    meter_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    consumption: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("core.location.id")
    )
    # input_source enum: manual | iot (all 907 migrated rows are 'manual')
    input_source: Mapped[str] = mapped_column(
        String(16), nullable=False, default="manual", server_default=text("'manual'")
    )
