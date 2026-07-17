"""Reference-data endpoints: equipment, locations, personnel, categories.

These power the daily-form dropdowns and checklist seeds. Read-only in v1.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.dependencies import current_user
from app.core.auth import CurrentUser
from app.models.equipment import Equipment
from app.models.location import Location
from app.models.location_category import LocationCategory
from app.models.personnel import Personnel
from app.schemas.equipment import EquipmentOut
from app.schemas.location import LocationCategoryOut, LocationOut
from app.schemas.personnel import PersonnelOut

router = APIRouter(prefix="/api", tags=["reference"])


@router.get("/equipment", response_model=list[EquipmentOut])
async def list_equipment(
    session: AsyncSession = Depends(get_session),
    _user: CurrentUser = Depends(current_user),
) -> list[Equipment]:
    rows = (await session.execute(select(Equipment).order_by(Equipment.code))).scalars().all()
    return rows


@router.get("/locations", response_model=list[LocationOut])
async def list_locations(
    session: AsyncSession = Depends(get_session),
    _user: CurrentUser = Depends(current_user),
) -> list[Location]:
    rows = (await session.execute(select(Location).order_by(Location.code))).scalars().all()
    return rows


@router.get("/location-categories", response_model=list[LocationCategoryOut])
async def list_location_categories(
    session: AsyncSession = Depends(get_session),
    _user: CurrentUser = Depends(current_user),
) -> list[LocationCategory]:
    rows = (
        await session.execute(select(LocationCategory).order_by(LocationCategory.name))
    ).scalars().all()
    return rows


@router.get("/personnel", response_model=list[PersonnelOut])
async def list_personnel(
    session: AsyncSession = Depends(get_session),
    _user: CurrentUser = Depends(current_user),
) -> list[Personnel]:
    rows = (
        await session.execute(select(Personnel).order_by(Personnel.full_name))
    ).scalars().all()
    return rows
