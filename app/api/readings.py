"""Daily-form endpoints — the core write path.

POST creates wastewater.reading + its companion carbon.reading in ONE
transaction, mirroring the Phase 2 batch SQL insert pattern (insert carbon
first, take its id, insert wastewater with carbon_reading_id). reported_by is
filled from the authenticated principal; location_id defaults to WWTP-1 until
multi-location entry is built.
"""
from __future__ import annotations

import logging
from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.alert import check_thresholds
from app.core.computed import do_average
from app.core.db import get_session
from app.core.dependencies import current_user, require_admin
from app.core.auth import CurrentUser
from app.models.carbon_reading import CarbonReading
from app.models.location import Location
from app.models.wastewater_reading import WastewaterReading
from app.schemas.reading import (
    ReadingCreate,
    ReadingDetail,
    ReadingList,
    ReadingListItem,
    ReadingUpdate,
)

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/readings", tags=["readings"])

# WWTP-1 is the only seeded location today (MIGRATION.md P3). Used as the
# default for new entries until multi-location entry is added.
WWTP_DEFAULT_LOCATION_CODE = "WWTP-1"


async def _resolve_default_location_id(session: AsyncSession) -> UUID:
    """Look up WWTP-1's id. Cached lookups are not worth it for a single row."""
    row = (
        await session.execute(
            select(Location.id).where(Location.code == WWTP_DEFAULT_LOCATION_CODE)
        )
    ).first()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"default location {WWTP_DEFAULT_LOCATION_CODE} not seeded",
        )
    return row[0]


@router.post("", response_model=ReadingDetail, status_code=status.HTTP_201_CREATED)
async def create_reading(
    payload: ReadingCreate,
    session: AsyncSession = Depends(get_session),
    user: CurrentUser = Depends(current_user),
) -> ReadingDetail:
    """Create a daily reading + companion carbon row in one transaction."""
    location_id = await _resolve_default_location_id(session)

    carbon = None
    if payload.electricity_meter_value is not None or payload.electricity_consumption is not None:
        carbon = CarbonReading(
            meter_id=await _resolve_default_meter_id(session),
            reading_date=payload.reading_date,
            meter_value=payload.electricity_meter_value,
            consumption=payload.electricity_consumption,
            location_id=location_id,
            input_source="manual",
        )
        session.add(carbon)
        await session.flush()  # populate carbon.id

    reading = WastewaterReading(
        **payload.model_dump(exclude={"electricity_consumption", "electricity_meter_value"}),
        location_id=location_id,
        carbon_reading_id=carbon.id if carbon else None,
        # reported_by needs a real app_user id; in stub mode leave NULL and
        # rely on reported_by_name_legacy for traceability.
        reported_by=UUID(user.app_user_id) if user.app_user_id else None,
        reported_by_name_legacy=user.display_name or user.email,
        input_source="manual",
    )
    session.add(reading)
    try:
        await session.commit()
    except IntegrityError as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"reading already exists for {payload.reading_date} (unique per location)",
        ) from e

    # Threshold check (stub — logs only, no Telegram). Computed from DO points.
    do_avg = do_average(
        float(reading.do_aeration) if reading.do_aeration is not None else None,
        float(reading.do_sedimentation) if reading.do_sedimentation is not None else None,
        float(reading.do_before_discharge) if reading.do_before_discharge is not None else None,
    )
    alerts = check_thresholds(
        do_average=do_avg,
        free_chlorine=float(reading.free_chlorine) if reading.free_chlorine is not None else None,
        ph=float(reading.ph) if reading.ph is not None else None,
    )
    if alerts:
        log.warning("%d threshold alert(s) on reading %s", len(alerts), reading.id)

    return ReadingDetail.from_orm_with_computed(reading)


async def _resolve_default_meter_id(session: AsyncSession) -> UUID:
    """The single WWTP carbon meter. Code matches the migration seeding."""
    from app.models.carbon_meter import CarbonMeter
    # The Phase 2 fixed meter_id (METER_ID in phase2_generate_sql.py). Code
    # lookup would be cleaner, but no code was documented — fall back to the
    # known UUID.
    return UUID("b6be4c99-c83a-43f7-b765-72286cc78bd0")


@router.get("", response_model=ReadingList)
async def list_readings(
    from_date: Optional[date] = Query(default=None, alias="from"),
    to_date: Optional[date] = Query(default=None, alias="to"),
    location_id: Optional[UUID] = Query(default=None),
    limit: int = Query(default=30, ge=1, le=365),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
    _user: CurrentUser = Depends(current_user),
) -> ReadingList:
    """List readings, newest first. Default window = last 30 days."""
    q = select(WastewaterReading).order_by(WastewaterReading.reading_date.desc())
    if from_date:
        q = q.where(WastewaterReading.reading_date >= from_date)
    if to_date:
        q = q.where(WastewaterReading.reading_date <= to_date)
    if location_id:
        q = q.where(WastewaterReading.location_id == location_id)
    q = q.limit(limit).offset(offset)

    rows = (await session.execute(q)).scalars().all()
    items = [
        ReadingListItem(
            id=str(r.id),
            reading_date=r.reading_date,
            do_average=do_average(
                float(r.do_aeration) if r.do_aeration is not None else None,
                float(r.do_sedimentation) if r.do_sedimentation is not None else None,
                float(r.do_before_discharge) if r.do_before_discharge is not None else None,
            ),
            ph=r.ph,
            free_chlorine=r.free_chlorine,
            system_operating=r.system_operating,
            date_thai_be=r.reading_date.year + 543,
        )
        for r in rows
    ]
    return ReadingList(items=items, total=len(items))


@router.get("/{reading_id}", response_model=ReadingDetail)
async def get_reading(
    reading_id: UUID,
    session: AsyncSession = Depends(get_session),
    _user: CurrentUser = Depends(current_user),
) -> ReadingDetail:
    row = await session.get(WastewaterReading, reading_id)
    if row is None:
        raise HTTPException(status_code=404, detail="reading not found")
    return ReadingDetail.from_orm_with_computed(row)


@router.put("/{reading_id}", response_model=ReadingDetail)
async def update_reading(
    reading_id: UUID,
    payload: ReadingUpdate,
    session: AsyncSession = Depends(get_session),
    _user: CurrentUser = Depends(current_user),
) -> ReadingDetail:
    row = await session.get(WastewaterReading, reading_id)
    if row is None:
        raise HTTPException(status_code=404, detail="reading not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(row, k, v)
    await session.commit()
    return ReadingDetail.from_orm_with_computed(row)


@router.delete("/{reading_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reading(
    reading_id: UUID,
    session: AsyncSession = Depends(get_session),
    _admin: CurrentUser = Depends(require_admin),
) -> None:
    row = await session.get(WastewaterReading, reading_id)
    if row is None:
        raise HTTPException(status_code=404, detail="reading not found")
    await session.delete(row)
    await session.commit()
