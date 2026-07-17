"""core.personnel — staff master (9 seeded rows, see MIGRATION.md P1).

Holds name/position/department/status only — no PII like national ID or bank
details. reported_by on wastewater.reading eventually points here (or to
core.app_user.id, the AUTH-linked principal). Kept nullable-friendly because
legacy rows do not have this FK backfilled.
"""
from __future__ import annotations

from typing import Optional

from sqlalchemy import String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._base import Timestamps, UUIDPrimaryKey


class Personnel(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "personnel"
    __table_args__ = {"schema": "core"}

    # Synthesized code (HR export had no usable position number, and national
    # ID was deliberately not used — see MIGRATION.md §Personnel reconciliation).
    employee_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    position: Mapped[Optional[str]] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="active", server_default=text("'active'")
    )
    nickname: Mapped[Optional[str]] = mapped_column(String(50))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    photo_path: Mapped[Optional[str]] = mapped_column(String(500))
