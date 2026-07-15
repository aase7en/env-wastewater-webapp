"""Personnel schema (reference)."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict


class PersonnelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    employee_code: str
    full_name: str
    position: Optional[str] = None
    department: Optional[str] = None
    status: str
