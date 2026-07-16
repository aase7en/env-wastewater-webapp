"""core.pdf_template — layout JSON for the generic template-builder (P2).

Stores user-composed printable layouts: data source, placed fields, paper
size, orientation. ทส.1/ทส.2/repair-request ship as built-in starter
templates (is_builtin=true). See docs/adr/0001-pdf-template-builder-in-v1.md.
"""
from __future__ import annotations

from typing import Optional
import uuid

from sqlalchemy import Boolean, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._base import Timestamps, UUIDPrimaryKey


class PdfTemplate(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "pdf_template"
    __table_args__ = {"schema": "core"}

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    # data source: a table or view name the template pulls from.
    data_source: Mapped[str] = mapped_column(String(100), nullable=False)
    # paper_size enum: a4 | a5
    paper_size: Mapped[str] = mapped_column(
        String(16), nullable=False, default="a4", server_default=text("'a4'")
    )
    # orientation enum: portrait | landscape
    orientation: Mapped[str] = mapped_column(
        String(16), nullable=False, default="portrait", server_default=text("'portrait'")
    )
    layout: Mapped[Optional[dict]] = mapped_column(JSONB)
    is_builtin: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("core.app_user.id")
    )
