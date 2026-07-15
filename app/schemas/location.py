"""Location + category schemas."""
from __future__ import annotations

from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class LocationCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    is_active: bool


class LocationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str
    category_id: Optional[str] = None
    lat: Optional[Decimal] = None
    lng: Optional[Decimal] = None
    is_active: bool
