"""Pydantic v2 schemas — API request/response models."""
from app.schemas.reading import (
    ReadingCreate,
    ReadingDetail,
    ReadingList,
    ReadingListItem,
    ReadingUpdate,
)
from app.schemas.dashboard import DashboardRow, MonthlySummary
from app.schemas.equipment import EquipmentOut
from app.schemas.location import LocationCategoryOut, LocationOut
from app.schemas.personnel import PersonnelOut
from app.schemas.repair_request import RepairRequestCreate, RepairRequestOut
from app.schemas.pdf_template import PdfTemplateOut, PdfTemplateCreate
from app.schemas.auth import UserOut
