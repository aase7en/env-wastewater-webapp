"""PDF template schemas (template-builder module)."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class PdfTemplateCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str
    data_source: str
    paper_size: str = "a4"
    orientation: str = "portrait"
    layout: Optional[dict[str, Any]] = None
    is_builtin: bool = False


class PdfTemplateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    data_source: str
    paper_size: str
    orientation: str
    layout: Optional[dict[str, Any]] = None
    is_builtin: bool
