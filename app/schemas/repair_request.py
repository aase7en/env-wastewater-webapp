"""Repair request schemas (created by staff when system_operating=False)."""
from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class RepairRequestCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    equipment_id: Optional[str] = None
    reading_id: Optional[str] = None
    cause: str = Field(..., min_length=1, description="Required — what is wrong")
    reported_date: Optional[date] = None
    note: Optional[str] = None


class RepairRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    equipment_id: Optional[str] = None
    reading_id: Optional[str] = None
    reported_by: Optional[str] = None
    cause: str
    status: str
    reported_date: Optional[date] = None
    resolved_date: Optional[date] = None
    note: Optional[str] = None
