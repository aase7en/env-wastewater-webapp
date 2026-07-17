"""wastewater.threshold — abnormal-value thresholds (out-of-v1 scope, table exists).

SPEC.md lists threshold alerts as out-of-v1; the table is provisioned for when
that feature is turned on. Kept here so the model layer is complete and the
threshold check stub (app.core.alert) can later read live values from here
instead of hardcoded constants.

Live schema (P5b.2-live reconciliation, 2026-07-16): the DB columns differ
from the initial guess — uses parameter_code + effective_from + note, not
parameter/unit/message_th.
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from decimal import Decimal

from sqlalchemy import Date, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._base import Timestamps, UUIDPrimaryKey


class Threshold(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "threshold"
    __table_args__ = {"schema": "wastewater"}

    parameter_code: Mapped[str] = mapped_column(String(64), nullable=False)
    min_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 3))
    max_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 3))
    effective_from: Mapped[Optional[date]] = mapped_column(Date)
    note: Mapped[Optional[str]] = mapped_column(Text)
