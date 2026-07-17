"""Computed water-quality values.

Mirrors the formulas documented in the A-Wiki schema design doc
(env-webapp-schema-wastewater.md §Computed Values) — these are NOT stored in
the database, only calculated on read. Kept as pure functions so they can be
unit-tested without a DB and reused by both Pydantic validators and the
threshold alert logic.
"""
from __future__ import annotations

from datetime import date
from typing import Optional


def do_average(
    do_aeration: Optional[float],
    do_sedimentation: Optional[float],
    do_before_discharge: Optional[float],
) -> Optional[float]:
    """Mean of the 3 DO sampling points (mg/L). None if any point is missing."""
    points = [v for v in (do_aeration, do_sedimentation, do_before_discharge) if v is not None]
    if len(points) != 3:
        return None
    return round(sum(points) / 3, 2)


def energy_kwh(
    meter_start: Optional[float],
    meter_end: Optional[float],
) -> Optional[float]:
    """Net energy consumed between two meter readings (kWh)."""
    if meter_start is None or meter_end is None:
        return None
    return round(meter_end - meter_start, 2)


def sv30_percent(sv30_ml: Optional[float]) -> Optional[float]:
    """Sludge volume as percent (SV30 mL/L ÷ 10). Schema doc says ml/1000*100 = /10."""
    if sv30_ml is None:
        return None
    return round(sv30_ml / 10, 1)


def energy_per_m3(
    energy: Optional[float],
    flow_rate_m3: Optional[float],
) -> Optional[float]:
    """Energy intensity (kWh per m³ of water treated)."""
    if energy is None or flow_rate_m3 in (None, 0):
        return None
    return round(energy / flow_rate_m3, 3)


def date_thai_be(d: Optional[date]) -> Optional[int]:
    """Gregorian → Buddhist Era year (year + 543)."""
    if d is None:
        return None
    return d.year + 543
