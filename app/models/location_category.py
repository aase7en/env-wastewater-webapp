"""core.location_category — lookup (8 seeded categories, see MIGRATION.md P3).

Chosen as a table rather than an enum so new categories can be added without a
migration — see docs/adr/0002-location-category-lookup-table.md.
"""
from __future__ import annotations

from sqlalchemy import String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._base import Timestamps, UUIDPrimaryKey


class LocationCategory(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "location_category"
    __table_args__ = {"schema": "core"}

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
