"""wastewater.threshold — abnormal-value thresholds (out-of-v1 scope, table exists).

SPEC.md lists threshold alerts as out-of-v1; the table is provisioned for when
that feature is turned on. Kept here so the model layer is complete and the
threshold check stub (app.core.alert) can later read live values from here
instead of hardcoded constants.
"""
from __future__ import annotations

from typing import Optional

from decimal import Decimal

from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._base import Timestamps, UUIDPrimaryKey


class Threshold(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "threshold"
    __table_args__ = {"schema": "wastewater"}

    parameter: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    min_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 3))
    max_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 3))
    unit: Mapped[Optional[str]] = mapped_column(String(32))
    message_th: Mapped[Optional[str]] = mapped_column(String(500))
