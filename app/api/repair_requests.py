"""Repair-request endpoints (ใบแจ้งซ่อม).

Staff can list and create; admin can update status. The cause flows in from
the daily form (system_operating=False) or a direct manual raise.
"""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.core.db import get_session
from app.core.dependencies import current_user
from app.models.repair_request import RepairRequest
from app.schemas.repair_request import RepairRequestCreate, RepairRequestOut
from pydantic import BaseModel

router = APIRouter(prefix="/api/repair-requests", tags=["repair-requests"])


class RepairStatusUpdate(BaseModel):
    status: str  # open | in_progress | resolved | cancelled
    resolved_date: Optional[str] = None


@router.get("", response_model=list[RepairRequestOut])
async def list_repair_requests(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    session: AsyncSession = Depends(get_session),
    _user: CurrentUser = Depends(current_user),
) -> list[RepairRequest]:
    q = select(RepairRequest).order_by(RepairRequest.created_at.desc())
    if status_filter:
        q = q.where(RepairRequest.status == status_filter)
    rows = (await session.execute(q)).scalars().all()
    return rows


@router.post("", response_model=RepairRequestOut, status_code=status.HTTP_201_CREATED)
async def create_repair_request(
    payload: RepairRequestCreate,
    session: AsyncSession = Depends(get_session),
    user: CurrentUser = Depends(current_user),
) -> RepairRequest:
    req = RepairRequest(
        equipment_id=UUID(payload.equipment_id) if payload.equipment_id else None,
        reading_id=UUID(payload.reading_id) if payload.reading_id else None,
        reported_by=UUID(user.app_user_id) if user.app_user_id else None,
        cause=payload.cause,
        status="open",
        reported_date=payload.reported_date,
        note=payload.note,
    )
    session.add(req)
    await session.commit()
    await session.refresh(req)
    return req


@router.patch("/{request_id}/status", response_model=RepairRequestOut)
async def update_repair_status(
    request_id: UUID,
    payload: RepairStatusUpdate,
    session: AsyncSession = Depends(get_session),
    _user: CurrentUser = Depends(current_user),
) -> RepairRequest:
    """Update status (e.g. open → in_progress → resolved). Staff can do this."""
    row = await session.get(RepairRequest, request_id)
    if row is None:
        raise HTTPException(status_code=404, detail="repair request not found")
    row.status = payload.status
    if payload.status == "resolved" and payload.resolved_date:
        row.resolved_date = payload.resolved_date
    await session.commit()
    await session.refresh(row)
    return row
