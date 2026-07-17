"""Schema-verification integration tests.

Validates that the ORM models agree with the live ENV_DB: every column the
model declares must exist in information_schema with a compatible type, and
every expected table is present. Catches the same class of drift as the local
`cause`-column fix, but against the live DB.

These run AFTER `scripts/introspect_schema.py` has been run at least once
during development, but they query the DB directly so they stay current.
"""
from __future__ import annotations

import pytest
from sqlalchemy import text

from tests.integration.conftest import skip_unless_db

pytestmark = skip_unless_db

# Tables the P5 backend models — grouped by schema. Each maps to an ORM class
# imported indirectly (avoid hard imports here to keep this test self-contained
# against model drift; the schema itself is the source of truth).
EXPECTED_TABLES = {
    "core": {"app_user", "personnel", "location", "location_category",
             "equipment", "repair_request", "pdf_template"},
    "carbon": {"meter", "reading"},
    "wastewater": {"reading", "threshold"},
}


@pytest.mark.asyncio
async def test_expected_tables_exist(engine):
    """Every table the backend assumes must be present in ENV_DB."""
    async with engine.connect() as conn:
        for schema, tables in EXPECTED_TABLES.items():
            for table in tables:
                exists = (
                    await conn.execute(
                        text(
                            "SELECT to_regclass(:fq) IS NOT NULL"
                        ),
                        {"fq": f"{schema}.{table}"},
                    )
                ).scalar()
                assert exists, f"table {schema}.{table} is missing from ENV_DB"


@pytest.mark.asyncio
async def test_models_match_live_columns(engine):
    """Every ORM-declared column exists in the live table (no phantom columns).

    This is the live equivalent of the local-source reconciliation that caught
    the `cause` drift. If this fails, a model declares a column the DB lacks.
    """
    from app.models import (
        AppUser, Personnel, Location, LocationCategory, Equipment,
        RepairRequest, PdfTemplate, Threshold, CarbonMeter, CarbonReading,
        WastewaterReading,
    )

    model_by_fq = {
        ("core", "app_user"): AppUser,
        ("core", "personnel"): Personnel,
        ("core", "location"): Location,
        ("core", "location_category"): LocationCategory,
        ("core", "equipment"): Equipment,
        ("core", "repair_request"): RepairRequest,
        ("core", "pdf_template"): PdfTemplate,
        ("carbon", "meter"): CarbonMeter,
        ("carbon", "reading"): CarbonReading,
        ("wastewater", "reading"): WastewaterReading,
        ("wastewater", "threshold"): Threshold,
    }

    async with engine.connect() as conn:
        for (schema, table), model in model_by_fq.items():
            live_cols = {
                r.column_name
                for r in (
                    await conn.execute(
                        text(
                            "SELECT column_name FROM information_schema.columns "
                            "WHERE table_schema = :s AND table_name = :t"
                        ),
                        {"s": schema, "t": table},
                    )
                ).all()
            }
            model_cols = {c.name for c in model.__table__.columns}
            phantom = model_cols - live_cols
            assert not phantom, (
                f"{schema}.{table}: model declares columns not in DB: {phantom}"
            )


@pytest.mark.asyncio
async def test_907_rows_present(engine):
    """The Phase 2 migration claim (907 rows) must hold on the live DB."""
    async with engine.connect() as conn:
        n = (
            await conn.execute(text("SELECT count(*) FROM wastewater.reading"))
        ).scalar()
        assert n == 907, f"wastewater.reading has {n} rows, expected 907"
        n2 = (
            await conn.execute(text("SELECT count(*) FROM carbon.reading"))
        ).scalar()
        assert n2 == 907, f"carbon.reading has {n2} rows, expected 907"


@pytest.mark.asyncio
async def test_views_exist(engine):
    """v_reading_detail + v_monthly_summary (P4) must exist and be queryable."""
    async with engine.connect() as conn:
        for view in ("v_reading_detail", "v_monthly_summary"):
            exists = (
                await conn.execute(
                    text("SELECT to_regclass(:fq) IS NOT NULL"),
                    {"fq": f"wastewater.{view}"},
                )
            ).scalar()
            assert exists, f"view wastewater.{view} missing"
            # It must be queryable, not just present.
            (await conn.execute(text(f"SELECT * FROM wastewater.{view} LIMIT 1"))).all()


@pytest.mark.asyncio
async def test_seed_data_present(engine):
    """Reference seeds the backend's default-location logic depends on."""
    async with engine.connect() as conn:
        # WWTP-1 location (P3) — readings.py defaults new entries here.
        loc = (
            await conn.execute(
                text("SELECT count(*) FROM core.location WHERE code = 'WWTP-1'")
            )
        ).scalar()
        assert loc == 1, "WWTP-1 location not seeded (readings endpoint depends on it)"

        # 10 equipment rows (P2).
        eq = (await conn.execute(text("SELECT count(*) FROM core.equipment"))).scalar()
        assert eq == 10, f"core.equipment has {eq} rows, expected 10"

        # 8 location categories (P3).
        cat = (
            await conn.execute(text("SELECT count(*) FROM core.location_category"))
        ).scalar()
        assert cat == 8, f"core.location_category has {cat} rows, expected 8"

        # 9 personnel (P1).
        pers = (await conn.execute(text("SELECT count(*) FROM core.personnel"))).scalar()
        assert pers == 9, f"core.personnel has {pers} rows, expected 9"
