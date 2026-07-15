"""wastewater.reading — the daily water-quality log (core entity, 907 rows migrated).

Column list and types are reconstructed from phase2_generate_sql.py
(WR_COLS) and the Phase 2 batch SQL — that generator emits the authoritative
INSERT contract, so it is the most reliable local source short of live DB
introspection (deferred to P5b.2).

Layout mirrors the form sections (SPEC.md §ขอบเขต v1):
  - water-quality numerics (DO×3, TDS×2, pH, SV30, free_chlorine, temperature)
  - equipment checklist booleans ×10 + system_operating
  - meter readings (pump1/pump2 cumulative)
  - flow + discharge
  - chlorine (used + mix ratio + excess sludge)
  - qualitative (color/smell/note)
  - provenance (legacy_id, reported_by*, location_id, carbon_reading_id, input_source)
"""
from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._base import Timestamps, UUIDPrimaryKey


class WastewaterReading(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "reading"
    __table_args__ = (
        UniqueConstraint(
            "reading_date", "location_id", name="uq_wastewater_reading_date_location"
        ),
        {"schema": "wastewater"},
    )

    # --- Date -----------------------------------------------------------------
    reading_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # --- Water-quality numerics (mg/L unless noted) ---------------------------
    # DO at 3 sampling points (aeration / sedimentation / before discharge).
    do_aeration: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    do_sedimentation: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    do_before_discharge: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    # TDS at 2 points.
    tds_aeration: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 2))
    tds_before_discharge: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 2))
    ph: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 2))
    temp_aeration: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))  # °C
    sv30: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 1))            # mL/L
    free_chlorine: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))

    # --- Equipment checklist (booleans) --------------------------------------
    # 'running' suffix = ok/เสีย; 'cleaned' suffix = ล้าง/ไม่ล้าง. See phase1_analysis.
    screen_cleaned_coarse: Mapped[Optional[bool]] = mapped_column(Boolean)
    screen_cleaned_fine: Mapped[Optional[bool]] = mapped_column(Boolean)
    pump1_running: Mapped[Optional[bool]] = mapped_column(Boolean)
    pump2_running: Mapped[Optional[bool]] = mapped_column(Boolean)
    aerator1_running: Mapped[Optional[bool]] = mapped_column(Boolean)
    aerator2_running: Mapped[Optional[bool]] = mapped_column(Boolean)
    sludge_pump1_running: Mapped[Optional[bool]] = mapped_column(Boolean)
    sludge_pump2_running: Mapped[Optional[bool]] = mapped_column(Boolean)
    chlorine_pump1_running: Mapped[Optional[bool]] = mapped_column(Boolean)
    chlorine_pump2_running: Mapped[Optional[bool]] = mapped_column(Boolean)
    # Overall system status (manual, overrides equipment-derived default).
    system_operating: Mapped[Optional[bool]] = mapped_column(Boolean)

    # --- Meter (cumulative kWh) ----------------------------------------------
    pump1_meter: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    pump2_meter: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))

    # --- Flow -----------------------------------------------------------------
    water_used_total: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    wastewater_in: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    # P4: changed numeric → boolean. All migrated rows are NULL.
    wastewater_discharged: Mapped[Optional[bool]] = mapped_column(Boolean)

    # --- Chlorine -------------------------------------------------------------
    chlorine_used: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 3))
    chlorine_mix_ratio: Mapped[Optional[str]] = mapped_column(String(32))
    excess_sludge_removed: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))

    # --- Qualitative ----------------------------------------------------------
    color_desc: Mapped[Optional[str]] = mapped_column(String(100))
    smell_desc: Mapped[Optional[str]] = mapped_column(String(100))
    note: Mapped[Optional[str]] = mapped_column(Text)
    # NOTE: SPEC §6 requires a mandatory "cause" when system_operating=False.
    # That column does NOT exist on wastewater.reading today (not in WR_COLS,
    # the authoritative INSERT contract from phase2_generate_sql.py). The cause
    # lives on core.repair_request.cause, which the form raises when abnormal.
    # Adding cause to this table needs a real migration — tracked in MIGRATION.md
    # as a P5b.2 follow-up. Do not re-add it here as an unverified column.

    # --- Provenance ----------------------------------------------------------
    legacy_id: Mapped[Optional[str]] = mapped_column(String(64))
    reported_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("core.app_user.id")
    )
    reported_by_name_legacy: Mapped[Optional[str]] = mapped_column(String(200))
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("core.location.id"), index=True
    )
    carbon_reading_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("carbon.reading.id")
    )
    input_source: Mapped[str] = mapped_column(
        String(16), nullable=False, default="manual", server_default=text("'manual'")
    )
