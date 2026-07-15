"""Dashboard + monthly summary reads.

Both read from DB views (wastewater.v_reading_detail,
wastewater.v_monthly_summary) — P4 recreated these when the discharge column
became boolean. We query them via raw SQL text() rather than ORM-mapping the
views; the column set is stable per MIGRATION.md but exact names are pending
P5b.2 introspection, so mapping now would be premature.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.dependencies import current_user
from app.core.auth import CurrentUser
from app.schemas.dashboard import DashboardRow, MonthlySummary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=list[DashboardRow])
async def dashboard(
    days: int = Query(default=14, ge=1, le=90),
    session: AsyncSession = Depends(get_session),
    _user: CurrentUser = Depends(current_user),
) -> list[DashboardRow]:
    """Last N days of per-day detail rows (the 14-day dashboard log)."""
    # The view already joins carbon + wastewater and exposes computed DO avg
    # + threshold flags. Column names pending P5b.2 confirmation; the ones
    # below are the documented headline columns.
    result = await session.execute(
        text(
            """
            SELECT *
            FROM wastewater.v_reading_detail
            WHERE reading_date >= current_date - (:days :: int)
            ORDER BY reading_date DESC
            """
        ),
        {"days": days},
    )
    rows = result.mappings().all()
    # Map defensively: only pick columns the schema knows about.
    out = []
    for r in rows:
        out.append(
            DashboardRow(
                reading_date=r.get("reading_date"),
                do_average=r.get("do_average"),
                ph=r.get("ph"),
                free_chlorine=r.get("free_chlorine"),
                tds_aeration=r.get("tds_aeration"),
                water_used_total=r.get("water_used_total"),
                wastewater_in=r.get("wastewater_in"),
                system_operating=r.get("system_operating"),
                wastewater_discharged=r.get("wastewater_discharged"),
                do_alert=r.get("do_alert"),
                chlorine_alert=r.get("chlorine_alert"),
                ph_alert=r.get("ph_alert"),
            )
        )
    return out


@router.get("/monthly", response_model=list[MonthlySummary])
async def monthly_summary(
    year: Optional[int] = Query(default=None, description="Defaults to current year"),
    session: AsyncSession = Depends(get_session),
    _user: CurrentUser = Depends(current_user),
) -> list[MonthlySummary]:
    """ทส.2 data source — monthly aggregates for the given year."""
    result = await session.execute(
        text(
            """
            SELECT *
            FROM wastewater.v_monthly_summary
            WHERE (:year :: int IS NULL OR extract(year from period) = :year)
            ORDER BY period DESC
            """
        ),
        {"year": year},
    )
    rows = result.mappings().all()
    out = []
    for r in rows:
        # period may be a date or text; normalize to 'YYYY-MM' string.
        p = r.get("period")
        period_str = p.strftime("%Y-%m") if hasattr(p, "strftime") else str(p)[:7]
        out.append(
            MonthlySummary(
                period=period_str,
                days_logged=r.get("days_logged", 0),
                avg_do=r.get("avg_do"),
                avg_ph=r.get("avg_ph"),
                avg_free_chlorine=r.get("avg_free_chlorine"),
                avg_tds_aeration=r.get("avg_tds_aeration"),
                total_water_used=r.get("total_water_used"),
                total_wastewater_in=r.get("total_wastewater_in"),
                total_electricity_kwh=r.get("total_electricity_kwh"),
                days_discharged=r.get("days_discharged"),
                abnormal_days=r.get("abnormal_days"),
            )
        )
    return out
