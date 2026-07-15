"""Equipment list schema (reference data for the daily form checklist)."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict


class EquipmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name_th: str
    name_en: Optional[str] = None
    location_id: Optional[str] = None
    is_active: bool
