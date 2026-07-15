"""SQLAlchemy 2.0 ORM models for ENV_DB.

Schemas reflect the migrated Supabase Postgres in ENV_DB
(gllqtbyofrcjzmbnfoeh), as established by phases P1–P4. Column names and types
are reconstructed from the Phase 2 batch SQL generator's column list (which is
the authoritative INSERT contract) plus the per-phase notes in MIGRATION.md.

IMPORTANT: these models are read/mapped against EXISTING tables — they do not
create or alter schema. `Base.metadata.create_all()` is never called against
ENV_DB. The DB is the source of truth; if a column type here disagrees with
the live DB, the DB wins (pending P5b.2 introspection verification).
"""
from app.models.app_user import AppUser
from app.models.personnel import Personnel
from app.models.location_category import LocationCategory
from app.models.location import Location
from app.models.equipment import Equipment
from app.models.repair_request import RepairRequest
from app.models.pdf_template import PdfTemplate
from app.models.threshold import Threshold
from app.models.carbon_meter import CarbonMeter
from app.models.carbon_reading import CarbonReading
from app.models.wastewater_reading import WastewaterReading

__all__ = [
    "AppUser",
    "Personnel",
    "LocationCategory",
    "Location",
    "Equipment",
    "RepairRequest",
    "PdfTemplate",
    "Threshold",
    "CarbonMeter",
    "CarbonReading",
    "WastewaterReading",
]
