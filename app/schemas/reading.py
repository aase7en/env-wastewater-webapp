"""Schemas for wastewater.reading (the daily form + reads).

Create/Update accept raw measured values only. Detail responses add computed
fields (do_average, energy_kwh, ...) via the pure functions in app.core.computed,
matching the A-Wiki schema design doc §Computed Values.
"""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.computed import (
    date_thai_be,
    do_average,
    energy_kwh,
    energy_per_m3,
    sv30_percent,
)


class _ReadingBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)

    reading_date: date
    # Water quality
    do_aeration: Optional[Decimal] = None
    do_sedimentation: Optional[Decimal] = None
    do_before_discharge: Optional[Decimal] = None
    tds_aeration: Optional[Decimal] = None
    tds_before_discharge: Optional[Decimal] = None
    ph: Optional[Decimal] = None
    temp_aeration: Optional[Decimal] = None
    sv30: Optional[Decimal] = None
    free_chlorine: Optional[Decimal] = None
    # Equipment checklist
    screen_cleaned_coarse: Optional[bool] = None
    screen_cleaned_fine: Optional[bool] = None
    pump1_running: Optional[bool] = None
    pump2_running: Optional[bool] = None
    aerator1_running: Optional[bool] = None
    aerator2_running: Optional[bool] = None
    sludge_pump1_running: Optional[bool] = None
    sludge_pump2_running: Optional[bool] = None
    chlorine_pump1_running: Optional[bool] = None
    chlorine_pump2_running: Optional[bool] = None
    system_operating: Optional[bool] = None
    # Meters + flow
    pump1_meter: Optional[Decimal] = None
    pump2_meter: Optional[Decimal] = None
    water_used_total: Optional[Decimal] = None
    wastewater_in: Optional[Decimal] = None
    wastewater_discharged: Optional[bool] = None
    # Chlorine
    chlorine_used: Optional[Decimal] = None
    chlorine_mix_ratio: Optional[str] = None
    excess_sludge_removed: Optional[Decimal] = None
    # Qualitative
    color_desc: Optional[str] = None
    smell_desc: Optional[str] = None
    note: Optional[str] = None
    # NOTE: 'cause' is intentionally NOT a column on wastewater.reading (it is
    # not in WR_COLS, the authoritative INSERT contract). SPEC §6 makes it a
    # mandatory form input when system_operating=False; it seeds a
    # core.repair_request row instead. See ReadingCreate.abnormal_cause below.


class ReadingCreate(_ReadingBase):
    """Payload for POST /api/readings.

    `reported_by` and `location_id` are filled server-side from the current
    user and the default WWTP-1 (for now), not by the client. The companion
    carbon.reading row is created in the same transaction from the meter +
    consumption derived from pump1_meter/pump2_meter deltas.

    SPEC §6: when system_operating=False the client MUST send `abnormal_cause`.
    That value does NOT get stored on wastewater.reading (no such column) —
    the endpoint uses it to create a core.repair_request row in the same
    transaction.
    """
    # Electricity consumed today (kWh) — written to carbon.reading.consumption.
    # Optional; if omitted, no carbon row is linked.
    electricity_consumption: Optional[Decimal] = None
    # The meter reading itself (kWh cumulative) — carbon.reading.meter_value.
    electricity_meter_value: Optional[Decimal] = None
    # Required iff system_operating is False. Seeds core.repair_request.cause.
    abnormal_cause: Optional[str] = None

    @model_validator(mode="after")
    def cause_required_when_abnormal(self) -> "ReadingCreate":
        if self.system_operating is False and not (
            self.abnormal_cause and self.abnormal_cause.strip()
        ):
            raise ValueError("abnormal_cause is required when system_operating is False")
        return self


class ReadingUpdate(BaseModel):
    """Partial update for PUT /api/readings/{id}. All fields optional."""
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)

    do_aeration: Optional[Decimal] = None
    do_sedimentation: Optional[Decimal] = None
    do_before_discharge: Optional[Decimal] = None
    tds_aeration: Optional[Decimal] = None
    tds_before_discharge: Optional[Decimal] = None
    ph: Optional[Decimal] = None
    temp_aeration: Optional[Decimal] = None
    sv30: Optional[Decimal] = None
    free_chlorine: Optional[Decimal] = None
    screen_cleaned_coarse: Optional[bool] = None
    screen_cleaned_fine: Optional[bool] = None
    pump1_running: Optional[bool] = None
    pump2_running: Optional[bool] = None
    aerator1_running: Optional[bool] = None
    aerator2_running: Optional[bool] = None
    sludge_pump1_running: Optional[bool] = None
    sludge_pump2_running: Optional[bool] = None
    chlorine_pump1_running: Optional[bool] = None
    chlorine_pump2_running: Optional[bool] = None
    system_operating: Optional[bool] = None
    pump1_meter: Optional[Decimal] = None
    pump2_meter: Optional[Decimal] = None
    water_used_total: Optional[Decimal] = None
    wastewater_in: Optional[Decimal] = None
    wastewater_discharged: Optional[bool] = None
    chlorine_used: Optional[Decimal] = None
    chlorine_mix_ratio: Optional[str] = None
    excess_sludge_removed: Optional[Decimal] = None
    color_desc: Optional[str] = None
    smell_desc: Optional[str] = None
    note: Optional[str] = None
    # See ReadingCreate: abnormal_cause seeds a repair_request, not a column.
    abnormal_cause: Optional[str] = None

    @model_validator(mode="after")
    def cause_required_when_abnormal(self) -> "ReadingUpdate":
        if self.system_operating is False and not (
            self.abnormal_cause and self.abnormal_cause.strip()
        ):
            raise ValueError("abnormal_cause is required when system_operating is False")
        return self


class ReadingDetail(_ReadingBase):
    """Full record + computed fields + provenance."""
    id: str
    location_id: Optional[str] = None
    carbon_reading_id: Optional[str] = None
    input_source: str
    reported_by_name_legacy: Optional[str] = None

    # Computed (not stored) — populated by the endpoint using app.core.computed.
    do_average: Optional[float] = None
    energy_kwh: Optional[float] = None
    sv30_percent: Optional[float] = None
    energy_per_m3: Optional[float] = None
    date_thai_be: Optional[int] = None

    @field_validator("id", "location_id", "carbon_reading_id", mode="before")
    @classmethod
    def _coerce_uuid_to_str(cls, v):
        return str(v) if isinstance(v, UUID) else v

    @classmethod
    def from_orm_with_computed(cls, obj) -> "ReadingDetail":
        """Build from an ORM row, attaching computed values."""
        data = {field: getattr(obj, field) for field in cls.model_fields if hasattr(obj, field)}
        do_avg = do_average(
            float(obj.do_aeration) if obj.do_aeration is not None else None,
            float(obj.do_sedimentation) if obj.do_sedimentation is not None else None,
            float(obj.do_before_discharge) if obj.do_before_discharge is not None else None,
        )
        # energy_kwh derived from the day's two pump meters (treated as start/end).
        e_kwh = energy_kwh(
            float(obj.pump1_meter) if obj.pump1_meter is not None else None,
            float(obj.pump2_meter) if obj.pump2_meter is not None else None,
        )
        data.update(
            do_average=do_avg,
            energy_kwh=e_kwh,
            sv30_percent=sv30_percent(
                float(obj.sv30) if obj.sv30 is not None else None
            ),
            energy_per_m3=energy_per_m3(
                e_kwh,
                float(obj.wastewater_in) if obj.wastewater_in is not None else None,
            ),
            date_thai_be=date_thai_be(obj.reading_date),
        )
        return cls(**data)


class ReadingListItem(BaseModel):
    """Compact row for list views (dashboard 14-day log)."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    reading_date: date
    do_average: Optional[float] = None
    ph: Optional[Decimal] = None
    free_chlorine: Optional[Decimal] = None
    system_operating: Optional[bool] = None
    date_thai_be: Optional[int] = None


class ReadingList(BaseModel):
    items: list[ReadingListItem]
    total: int
