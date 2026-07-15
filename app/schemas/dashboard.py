"""Dashboard + monthly-summary schemas.

These read from the DB views wastewater.v_reading_detail and
wastewater.v_monthly_summary (P4 recreated them when the discharge column
became boolean). Field names mirror the view columns; exact set to be
confirmed at P5b.2 introspection, but the headline columns are stable.
"""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DashboardRow(BaseModel):
    """A row from wastewater.v_reading_detail — used by the 14-day dashboard."""
    model_config = ConfigDict(from_attributes=True)

    reading_date: date
    do_average: Optional[Decimal] = None
    ph: Optional[Decimal] = None
    free_chlorine: Optional[Decimal] = None
    tds_aeration: Optional[Decimal] = None
    water_used_total: Optional[Decimal] = None
    wastewater_in: Optional[Decimal] = None
    system_operating: Optional[bool] = None
    wastewater_discharged: Optional[bool] = None
    # Threshold flags exposed by the view (dashboard LED panel).
    do_alert: Optional[bool] = None
    chlorine_alert: Optional[bool] = None
    ph_alert: Optional[bool] = None


class MonthlySummary(BaseModel):
    """A row from wastewater.v_monthly_summary — the ทส.2 data source."""
    model_config = ConfigDict(from_attributes=True)

    period: str  # 'YYYY-MM'
    days_logged: int
    avg_do: Optional[Decimal] = None
    avg_ph: Optional[Decimal] = None
    avg_free_chlorine: Optional[Decimal] = None
    avg_tds_aeration: Optional[Decimal] = None
    total_water_used: Optional[Decimal] = None
    total_wastewater_in: Optional[Decimal] = None
    total_electricity_kwh: Optional[Decimal] = None
    # P4: was sum(wastewater_discharged); now count of days discharged.
    days_discharged: Optional[int] = None
    abnormal_days: Optional[int] = None
