#!/usr/bin/env python3
"""ENV-PHASE5-READY-001 — Phase-5 parity count-comparison tool (READ-ONLY).

ONE command comparing the AppSheet side (public Google Drive workbooks,
fetched READ-ONLY via the established XLSX-export path) against ENV_DB
(read-only introspection via the Supabase Management API), per domain:
row counts, date-range coverage, per-month counts, missing-days lists
(calendar honesty) and coverage % with its denominator stated.

Honesty contract (WO §6 D1-3 — binding):
  - An unshared/unreachable source emits an explicit Thai
    «ยังไม่มีแหล่งข้อมูล» section — NEVER a 0-vs-0 parity row
    (unknown ≠ zero; ห้ามแทนค่าศูนย์).
  - A value that cannot be derived is rendered «ไม่ทราบ», never 0.
  - Missing days are LISTED, never filled.
  - Coverage % always states its denominator.
  - The report carries COUNTS ONLY — no sheet row content (PII-safe).
  - ZERO WRITES: no ENV_DB write, no Drive write; the only file the
    script may create is the local report file named by --out.

Read channels (WO §6 D1-2 — the ONLY two):
  1. Public XLSX exports: https://docs.google.com/spreadsheets/d/<id>/export?format=xlsx
     (the seed-suite precedent, scripts/test_parity_p3_003_calibration.py:81-82).
  2. ENV_DB Management-API read-only query:
     https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query
     (the introspection precedent, scripts/test_parity_p1_001_schema.py:112-144;
     token via scripts/_env.py load_secret("SUPABASE_ACCESS_TOKEN") — never
     printed). A missing token is an honest LIVE_CONNECTION_UNAVAILABLE,
     never a fabricated count.

Domain → source mapping (WO §6 D1-1 — explicit and cited; the citations
are the parity program's delivered records, re-verified live at D1 of
this lane, 2026-11-21):

  - Pond workbook ข้อมูลบ่อบำบัดประจำวัน 1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk
    (12 tabs; P2.4 WO §2.1 enumeration): tabs ข้อมูลคุณภาพน้ำ (→ wastewater.reading,
    ref-12 §3.2/§3.3), ข้อมูลผู้ปฏิบัติงาน (→ core.personnel), distributor
    (→ core.distributor, P3.1 seed receipt), คู่มือ (→ core.manual_wastewater,
    P3.5 seed receipt). The other pond tabs (dataQuery, หน้าหลัก, Filter_Water,
    last meter, menu*, Tool_Machine, tool_Calibrate) are form/menu/scratch
    surfaces, not sheet-parity data sources of the delivered table set.
  - markad workbook ข้อมูลหมากัด 1AUjAulq0-YvfJVhcBtJJfJhesAPArqn6BhjP3Gi8azQ
    (6 tabs): tab address (→ core.address, P3.5 seed receipt 7,436 rows).
  - งานสวน workbook 1Hluhfryn2uMdK8nQ2kRJyLI3q-ZbrwgBgveDbhJlerw (4 tabs;
    P3.4 receipt): tab job (→ core.job_log) + tab location_area (→
    core.location_area).
  - tool_maintainance workbook 1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw
    (1 tab; P3.3): tab maintaining (→ core.item_calibration).
  - fire_extinguisher workbook 15EjQ9Ze3LsbUlCxWsm5p2PB_a8KD6o-7_c21I7f3s_E
    (5 tabs; P2.1): tab ตรวจสอบถัง (→ safety.extinguisher_inspection).
  - ข้อมูลตรวจไฟฉุกเฉิน workbook 1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw
    (4 tabs; P2.1/P2.3): tab Emergency light (→ safety.emergency_light,
    the 48-row master; filename landmine disclosed in the P2.1 D5 record)
    + tab Check (→ safety.emergency_light_check).
  - UNSHARED (SOURCE_UNAVAILABLE per the parity program's records — the
    owner sheet-share obligation carried): คู่มือน้ำประปา (→
    core.manual_water_supply), ข้อมูลถังดับเพลิง master (→
    safety.fire_extinguisher), coliform bac. ×3 (→ food.lab_test),
    Items/Vendors/Categories (→ core.item + core.vendor +
    core.item_category), Inventory คลังเคมี (→ chemical.inventory_lot),
    the water-supply operational workbook (→ water_supply.daily_check).

Owner-gated boundary (WO §0.1): this script is a runnable TOOL, not a
running process. It never starts the dual-run, never backfills, never
retires AppSheet, never writes production data. Phase 5 execution stays
the owner's action.

Usage:
  python3 scripts/phase5_parity_check.py                 # console report
  python3 scripts/phase5_parity_check.py --out reports/phase5-parity-<date>.md
  python3 scripts/phase5_parity_check.py --skip-db       # ENV side honest ไม่ทราบ
  python3 scripts/phase5_parity_check.py --list-domains
"""

from __future__ import annotations

import argparse
import datetime as dt
import io
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol

sys.path.insert(0, str(Path(__file__).resolve().parent))

API_URL = "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
EXPORT_URL = "https://docs.google.com/spreadsheets/d/{wid}/export?format=xlsx"

UNSHARED_NOTE = "ยังไม่มีแหล่งข้อมูล (แหล่ง AppSheet ยังไม่ถูกแชร์ — ปลายทางรอการแชร์จากเจ้าของ)"

THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

# workbook_id -> Thai name (citation: the P2.4 WO §2.1 / P2.1 / P3.4 / P3.5 receipts)
WORKBOOK_NAMES = {
    "1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk": "ข้อมูลบ่อบำบัดประจำวัน",
    "1AUjAulq0-YvfJVhcBtJJfJhesAPArqn6BhjP3Gi8azQ": "ข้อมูลหมากัด",
    "1Hluhfryn2uMdK8nQ2kRJyLI3q-ZbrwgBgveDbhJlerw": "งานสวน",
    "1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw": "tool_maintainance",
    "15EjQ9Ze3LsbUlCxWsm5p2PB_a8KD6o-7_c21I7f3s_E": "fire_extinguisher",
    "1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw": "ข้อมูลตรวจไฟฉุกเฉิน",
}


def _d(key, name_th, *, source, env_tables, citation, workbook_id=None, tab=None,
       date_column=None, date_type=None, note=None, sheet_date_column=None):
    spec = {
        "key": key,
        "name_th": name_th,
        "source": source,  # 'public' | 'unshared'
        "env_tables": env_tables,  # [(schema, table), ...]
        "date_column": date_column,
        "date_type": date_type,  # 'date' | 'timestamp' | None
        "citation": citation,
        "note": note,
    }
    if workbook_id is not None:
        spec["workbook_id"] = workbook_id
    if tab is not None:
        spec["tab"] = tab
    if sheet_date_column is not None:
        # the VERBATIM AppSheet-side date column name where a record pins it
        # (ref-12 §3.2/§3.3 formulas etc.) — the ENV column name is a
        # translation, not the sheet's header
        spec["sheet_date_column"] = sheet_date_column
    return spec


DOMAIN_MAP = [
    # ── PUBLIC (6 workbooks, re-verified live 2026-11-21) ──
    _d("reading", "บ่อบำบัด — บันทึกคุณภาพน้ำรายวัน", source="public",
       workbook_id="1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk", tab="ข้อมูลคุณภาพน้ำ",
       env_tables=[("wastewater", "reading")], date_column="reading_date", date_type="date",
       sheet_date_column="วันที่ บันทึก",
       citation="ref-12 §3.2/§3.3; P2.4 WO §2.1 tab enumeration; P1.002 meter-chain record",
       note="การย้ายประวัติปักขอบเขต 907 แถว (ถึง 2026-07-04 ณ เวลาอ่าน); "
            "แถวที่ชีตมีเพิ่มจาก ENV คือข้อมูลที่ยังบันทึกเฉพาะ AppSheet (dual-run ยังไม่เริ่ม)"),
    _d("personnel", "ผู้ปฏิบัติงาน", source="public",
       workbook_id="1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk", tab="ข้อมูลผู้ปฏิบัติงาน",
       env_tables=[("core", "personnel")], date_column=None, date_type=None,
       citation="P2.3 receipt (Drive-sourced tab of the pond workbook); C8 personnel lane",
       note="baseline การย้ายปักไว้ 9 แถว (P3.1 receipt); ชีตเก็บทั้ง roster รวมสถานะ "
            "ย้ายกลุ่มงาน/ลาออก/ลาศึกษาต่อ (enum C8) — ความต่างต้องตีความตามทะเบียน ไม่ใช่ parity อัตโนมัติ"),
    _d("distributor", "ตัวแทนจำหน่าย", source="public",
       workbook_id="1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk", tab="distributor",
       env_tables=[("core", "distributor")], date_column=None, date_type=None,
       citation="P3.1 seed receipt (tab distributor sheetId 11, 6 rows)"),
    _d("manual_wastewater", "คู่มือระบบบ่อบำบัด", source="public",
       workbook_id="1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk", tab="คู่มือ",
       env_tables=[("core", "manual_wastewater")], date_column=None, date_type=None,
       citation="P3.5 seed receipt (tab คู่มือ, 10 rows)"),
    _d("item_calibration", "เทียบมาตรฐานเครื่องมือ", source="public",
       workbook_id="1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw", tab="maintaining",
       env_tables=[("core", "item_calibration")], date_column="calibration_date", date_type="date",
       sheet_date_column="Cal_date",
       citation="P3.3 receipt (tab maintaining, 11 rows; Cal_date → calibration_date per migration 20261118000005)"),
    _d("job_log", "งานสวน — บันทึกการทำงาน", source="public",
       workbook_id="1Hluhfryn2uMdK8nQ2kRJyLI3q-ZbrwgBgveDbhJlerw", tab="job",
       env_tables=[("core", "job_log")], date_column="scanned_at", date_type="timestamp",
       sheet_date_column="Date_time",
       citation="P3.4 receipt (tab job, 1102 rows; Date_time → scanned_at)"),
    _d("location_area", "งานสวน — พื้นที่", source="public",
       workbook_id="1Hluhfryn2uMdK8nQ2kRJyLI3q-ZbrwgBgveDbhJlerw", tab="location_area",
       env_tables=[("core", "location_area")], date_column=None, date_type=None,
       citation="P3.4 receipt (tab location_area, 15 rows)"),
    _d("address", "ที่อยู่ (ตำบล/อำเภอ/จังหวัด)", source="public",
       workbook_id="1AUjAulq0-YvfJVhcBtJJfJhesAPArqn6BhjP3Gi8azQ", tab="address",
       env_tables=[("core", "address")], date_column=None, date_type=None,
       citation="P3.5 receipt (markad tab address, 7,436 rows)"),
    _d("extinguisher_inspection", "ตรวจสอบถังดับเพลิง", source="public",
       workbook_id="15EjQ9Ze3LsbUlCxWsm5p2PB_a8KD6o-7_c21I7f3s_E", tab="ตรวจสอบถัง",
       env_tables=[("safety", "extinguisher_inspection")], date_column="inspection_date",
       date_type="timestamp",
       citation="P2.1/P2.2 receipts (tab ตรวจสอบถัง gid 0; 858 rows SHAPE-ONLY era)",
       note="P2.2 ยืนยัน seed NOTHING — ประวัติการตรวจ 858+ แถวยังไม่ถูกย้ายเข้า ENV "
            "(การย้ายประวัติ = backfill ตามทะเบียน §5 ของเช็กลิสต์ เป็นการตัดสินใจของเจ้าของ)"),
    _d("emergency_light", "ไฟฉุกเฉิน (master)", source="public",
       workbook_id="1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw", tab="Emergency light",
       env_tables=[("safety", "emergency_light")], date_column=None, date_type=None,
       citation="P2.1 receipt (tab Emergency light gid 0, 48 rows; filename landmine disclosed)"),
    _d("emergency_light_check", "ตรวจไฟฉุกเฉิน", source="public",
       workbook_id="1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw", tab="Check",
       env_tables=[("safety", "emergency_light_check")], date_column="check_date", date_type="date",
       citation="P2.1/P2.3 receipts (tab Check gid 1164639452; seeded 332 rows at P2.3)",
       note="seed ณ P2.3 = 332 แถว; delta จากชีต = แถวที่บันทึกเพิ่มหลัง seed (dual-run ยังไม่เริ่ม)"),
    # ── UNSHARED (SOURCE_UNAVAILABLE — the owner sheet-share obligation) ──
    _d("manual_water_supply", "คู่มือน้ำประปา", source="unshared",
       env_tables=[("core", "manual_water_supply")],
       citation="P3.5 D1-3 SOURCE_UNAVAILABLE (absent from all 6 public workbooks)"),
    _d("fire_extinguisher_master", "ถังดับเพลิง (master)", source="unshared",
       env_tables=[("safety", "fire_extinguisher")],
       citation="P2.1 D1-1 SOURCE_UNAVAILABLE (master absent from the public folder)"),
    _d("coliform", "Coliform ×3 (น้ำ/อาหาร/พนักงาน)", source="unshared",
       env_tables=[("food", "lab_test")],
       citation="P2.4 §2.1 SOURCE_UNAVAILABLE (coliform bac. ×4 tables, no shared workbook)"),
    _d("items_masters", "Items / Vendors / Categories", source="unshared",
       env_tables=[("core", "item"), ("core", "vendor"), ("core", "item_category")],
       citation="P3.1 SOURCE_UNAVAILABLE (the Items-Vendors-Categories workbook never shared)"),
    _d("chemical_inventory", "คลังเคมี (Inventory)", source="unshared",
       env_tables=[("chemical", "inventory_lot")],
       citation="P3.2 (ref-12 §3.28 Inventory; sheet outside the 6 public workbooks)"),
    _d("water_supply_daily", "น้ำประปา — ตรวจรายวัน", source="unshared",
       env_tables=[("water_supply", "daily_check")],
       citation="P4.005 frontier (the water-supply workbook never publicly shared)"),
]

UNSHARED_KEYS = {d["key"] for d in DOMAIN_MAP if d["source"] == "unshared"}

# (schema, table) -> date_type — the live DB source reads the domain map
# instead of guessing the cast from the column name.
TABLE_DATE_TYPE = {
    (schema, table): d["date_type"]
    for d in DOMAIN_MAP
    for schema, table in d["env_tables"]
}


# ────────────────────────── data shapes ──────────────────────────


class SheetSourceError(Exception):
    """The sheet source is unreachable (network/permission/absent)."""


class DbUnavailableError(Exception):
    """ENV_DB side unavailable (no token / query failure) — honest ไม่ทราบ."""


@dataclass
class SheetFrame:
    rows: list
    columns: list = field(default_factory=list)


@dataclass
class DbStats:
    total: int | None
    monthly: dict | None = None
    min_date: str | None = None
    max_date: str | None = None


@dataclass
class SheetDates:
    total: int
    unparsable: int
    iso_dates: list  # unique sorted ISO days with ≥1 row
    monthly: dict  # 'YYYY-MM' -> row count


# ────────────────────────── date parsing ──────────────────────────

_ISO_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})")
_SLASH_RE = re.compile(r"^(\d{1,2})/(\d{1,2})/(\d{2,4})$")
_EXCEL_EPOCH = dt.date(1899, 12, 30)


def _to_iso_date(value):
    """Parse one sheet date cell → ISO CE string, or None (honest unparsable).

    Handles datetime/date objects (openpyxl), Excel serial numbers, ISO
    strings, and Thai พ.ศ. d/m/yyyy strings (year ≥ 2400 ⇒ CE = year−543).
    """
    if value is None or (isinstance(value, str) and not value.strip()):
        return None
    if isinstance(value, dt.datetime):
        y = value.year
        if y >= 2400:  # the recorded seed precedent: sheet พ.ศ. years → CE −543
            value = value.replace(year=y - 543)
        return value.date().isoformat()
    if isinstance(value, dt.date):
        y = value.year
        if y >= 2400:  # Excel date cells whose year number is พ.ศ. (P2.3 precedent)
            value = value.replace(year=y - 543)
        return value.isoformat()
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        try:
            return (_EXCEL_EPOCH + dt.timedelta(days=int(value))).isoformat()
        except (OverflowError, ValueError):
            return None
    text = str(value).strip()
    m = _ISO_RE.match(text)
    if m:
        y, mo, d = (int(g) for g in m.groups())
        if y >= 2400:  # Thai พ.ศ. typed in ISO shape — same rule as the slash form
            y -= 543
        try:
            return dt.date(y, mo, d).isoformat()
        except ValueError:
            return None
    m = _SLASH_RE.match(text)
    if m:
        d_, mo, y = (int(g) for g in m.groups())
        if y < 100:
            y += 2500
        if y >= 2400:  # Thai พ.ศ. → CE
            y -= 543
        try:
            return dt.date(y, mo, d_).isoformat()
        except ValueError:
            return None
    return None


def parse_sheet_dates(rows, date_column) -> SheetDates:
    """Aggregate sheet rows into date stats (calendar honesty inputs).

    Rows are counted in TOTAL even when the date cell is unparsable —
    a bad date never silently drops a row; the unparsable count is
    disclosed instead.
    """
    days: set = set()
    monthly: dict = {}
    unparsable = 0
    for row in rows:
        iso = _to_iso_date(row.get(date_column)) if date_column else None
        if iso is None:
            unparsable += 1
            continue
        days.add(iso)
        ym = iso[:7]
        monthly[ym] = monthly.get(ym, 0) + 1
    return SheetDates(
        total=len(rows),
        unparsable=unparsable,
        iso_dates=sorted(days),
        monthly=monthly,
    )


def resolve_sheet_date_column(frame: SheetFrame, d) -> tuple:
    """Return (sheet_date_column_or_None, how_it_was_resolved).

    Order: the domain's verbatim `sheet_date_column` when it exists in
    the frame header → else auto-detect the column with the most
    parseable date values (the AppSheet header names are Thai/verbatim
    translations are NOT assumed — D1-1 honesty). No parseable column
    at all → (None, reason) and the sheet-side date stats stay ไม่ทราบ
    while row counts stay honest.
    """
    declared = d.get("sheet_date_column")
    if declared and frame.columns and declared in frame.columns:
        return declared, f"คอลัมน์วันที่ (ชีต): «{declared}» — ตามที่บันทึกไว้ในแผนที่โดเมน"
    if not frame.rows:
        return (declared or None), (
            f"คอลัมน์วันที่ (ชีต): «{declared}» — ชีตว่าง (สถิติวันที่ไม่มีให้ตรวจ)"
        ) if declared else (None, "ชีตว่าง (ไม่มีคอลัมน์ให้ตรวจ)")
    best, best_hits = None, 0
    candidates = frame.columns or (list(frame.rows[0].keys()) if frame.rows else [])
    for col in candidates:
        hits = sum(1 for r in frame.rows if _to_iso_date(r.get(col)) is not None)
        if hits > best_hits:
            best, best_hits = col, hits
    if best_hits > 0:
        tag = "ตามที่บันทึกไว้ในแผนที่โดเมน" if best == declared else "ตรวจพบอัตโนมัติจากหัวตาราง"
        return best, f"คอลัมน์วันที่ (ชีต): «{best}» — {tag} (อ่านได้ {best_hits}/{len(frame.rows)} แถว)"
    return None, "ไม่พบคอลัมน์วันที่ที่อ่านได้ในชีต — สถิติวันที่ฝั่ง AppSheet: ไม่ทราบ (จำนวนแถวยังถูกนับครบ)"


def _missing_days(iso_dates, cap=30):
    """Calendar days inside [min, max] with zero rows — LISTED, never filled."""
    if not iso_dates:
        return [], 0
    first = dt.date.fromisoformat(iso_dates[0])
    last = dt.date.fromisoformat(iso_dates[-1])
    present = set(iso_dates)
    missing = []
    cursor = first
    while cursor <= last:
        key = cursor.isoformat()
        if key not in present:
            missing.append(key)
        cursor += dt.timedelta(days=1)
    shown = missing[:cap]
    return shown, len(missing)


def _coverage(iso_dates):
    """(covered, denominator, pct) — the denominator is the calendar span."""
    if not iso_dates:
        return None
    first = dt.date.fromisoformat(iso_dates[0])
    last = dt.date.fromisoformat(iso_dates[-1])
    span = (last - first).days + 1
    covered = len(iso_dates)
    pct = covered * 100.0 / span
    return covered, span, pct


def _thai_date(value: dt.datetime) -> str:
    return f"{value.day} {THAI_MONTHS[value.month - 1]} พ.ศ. {value.year + 543}"


# ────────────────────────── SQL builders (SELECT-only) ──────────────────────────


def _col_expr(d, cast_date=False):
    col = d["date_column"]
    if d["date_type"] == "timestamp":
        return f'("{col}")::date'
    return f'"{col}"'


def build_db_sql(d):
    """The read-only SQL the live DB source runs for one domain.

    SELECT-only by construction (WO §3-2: the P5.1 «SQL สำเร็จรูป» stays
    the owner-gated execution lane — these reads live INSIDE this script).
    """
    sqls = []
    for schema, table in d["env_tables"]:
        target = f'"{schema}"."{table}"'
        if d.get("date_column"):
            col = _col_expr(d)
            sqls.append(
                f"select count(*) as total, min({col})::text as min_d, "
                f"max({col})::text as max_d from {target}"
            )
            sqls.append(
                f"select to_char({col}, 'YYYY-MM') as ym, count(*) as n "
                f"from {target} group by 1 order by 1"
            )
        else:
            sqls.append(f"select count(*) as total from {target}")
    return sqls


class SheetSource(Protocol):
    def fetch(self, workbook_id: str, tab: str) -> SheetFrame: ...


class DbSource(Protocol):
    def query_stats(self, schema: str, table: str, date_column: str | None) -> DbStats: ...


class LiveSheetSource:
    """Public-workbook XLSX export reader — GET-only, zero Drive writes."""

    def __init__(self, timeout=60.0):
        self.timeout = timeout

    def fetch(self, workbook_id: str, tab: str) -> SheetFrame:
        import httpx
        import openpyxl

        url = EXPORT_URL.format(wid=workbook_id)
        r = httpx.get(url, timeout=self.timeout, follow_redirects=True)
        if r.status_code >= 400:
            raise SheetSourceError(f"XLSX export HTTP {r.status_code} for {workbook_id}")
        wb = openpyxl.load_workbook(io.BytesIO(r.content), data_only=True, read_only=True)
        if tab not in wb.sheetnames:
            raise SheetSourceError(f"tab {tab!r} absent from workbook {workbook_id}")
        ws = wb[tab]
        it = ws.iter_rows(values_only=True)
        header = next(it, None)
        if header is None:
            return SheetFrame(rows=[], columns=[])
        columns = [str(c) if c is not None else f"col{i}" for i, c in enumerate(header)]
        rows = []
        for raw in it:
            if all(c is None for c in raw):
                continue
            rows.append(dict(zip(columns, raw)))
        wb.close()
        return SheetFrame(rows=rows, columns=columns)


class LiveDbSource:
    """ENV_DB read-only introspection via the Management API."""

    def __init__(self):
        self._query = None

    def _ensure_query(self):
        if self._query is not None:
            return self._query
        from _env import load_secret

        token = load_secret("SUPABASE_ACCESS_TOKEN")
        if not token:
            raise DbUnavailableError(
                "LIVE_CONNECTION_UNAVAILABLE: SUPABASE_ACCESS_TOKEN not resolvable "
                "via the approved resolver (scripts/_env.py); a skip is "
                "absence-of-probe evidence, never a pass"
            )
        import httpx

        def query(sql: str):
            r = httpx.post(
                API_URL,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={"query": sql},
                timeout=60,
            )
            if r.status_code >= 400:
                try:
                    msg = r.json().get("message") or r.text
                except Exception:
                    msg = r.text
                raise DbUnavailableError(f"[{r.status_code}] {msg}")
            return r.json()

        self._query = query
        return query

    def query_stats(self, schema: str, table: str, date_column: str | None) -> DbStats:
        query = self._ensure_query()
        d = {
            "date_column": date_column,
            "date_type": TABLE_DATE_TYPE.get((schema, table), "date"),
        }
        sqls = build_db_sql({**d, "env_tables": [(schema, table)]})
        total = None
        monthly = {}
        min_d = max_d = None
        for sql in sqls:
            data = query(sql)
            row0 = data[0] if isinstance(data, list) and data else {}
            if "ym" in row0:
                monthly = {r["ym"]: r["n"] for r in data}
            else:
                total = row0.get("total", 0)
                min_d = row0.get("min_d")
                max_d = row0.get("max_d")
        if total is None:
            total = 0
        return DbStats(total=total, monthly=monthly, min_date=min_d, max_date=max_d)


class SkipDbSource:
    """--skip-db: the ENV side is honestly unavailable, never fabricated."""

    def query_stats(self, schema, table, date_column):
        raise DbUnavailableError(
            "LIVE_CONNECTION_UNAVAILABLE: --skip-db requested by the operator"
        )


# ────────────────────────── report assembly ──────────────────────────

MAX_MISSING_SHOW = 30


@dataclass
class DomainResult:
    key: str
    name_th: str
    status: str  # 'match' | 'mismatch' | 'empty' | 'unshared' | 'sheet_error' | 'db_unavailable'
    lines: list = field(default_factory=list)
    _stats: object | None = None


def _fmt_monthly(sheet_monthly, db_monthly):
    lines = []
    months = sorted(set(sheet_monthly or {}) | set(db_monthly or {}))
    if not months:
        return ["  ไม่มีข้อมูลรายเดือน (ไม่ทราบช่วงวันที่)"]
    lines.append("  นับรายเดือน (เดือน: AppSheet / ENV):")
    for ym in months:
        s = sheet_monthly.get(ym)
        e = (db_monthly or {}).get(ym)
        s_txt = str(s) if s is not None else "ไม่ทราบ"
        e_txt = str(e) if e is not None else "ไม่ทราบ"
        lines.append(f"    {ym} (พ.ศ. {int(ym[:4]) + 543}): {s_txt} / {e_txt}")
    return lines


def _sheet_section(sd: SheetDates | None, date_domain: bool):
    lines = []
    if sd is None:
        lines.append("  ฝั่ง AppSheet: ไม่ทราบ (ดึงแหล่งข้อมูลไม่สำเร็จ)")
        return lines
    lines.append(f"  จำนวนแถวรวม (AppSheet): {sd.total}")
    if date_domain:
        if sd.iso_dates:
            cov = _coverage(sd.iso_dates)
            lines.append(f"  ช่วงวันที่ (AppSheet): {sd.iso_dates[0]} → {sd.iso_dates[-1]}")
            if cov[1] > 365 * 20:
                lines.append(
                    "  ⚠ ช่วงวันที่กว้างผิดปกติ (>20 ปี) — อาจมีเซลล์วันที่พิมพ์ผิดในแหล่งข้อมูล; "
                    "รายงานคงค่าตามแหล่ง (ไม่เดาแทน)"
                )
            lines.append(
                f"  ครอบคลุม (AppSheet): {cov[0]}/{cov[1]} วัน ({cov[2]:.1f}%) "
                f"— ตัวหารคือจำนวนวันปฏิทินในช่วงข้อมูล"
            )
            shown, total_missing = _missing_days(sd.iso_dates)
            if total_missing:
                lines.append(
                    f"  วันที่ขาด (missing days — ระบุไว้ ไม่เติมค่า): {total_missing} วัน"
                )
                if shown:
                    lines.append(f"    {', '.join(shown)}")
                    if total_missing > len(shown):
                        lines.append(f"    … และอีก {total_missing - len(shown)} วัน")
            else:
                lines.append("  วันที่ขาด: ไม่มี (ทุกวันในช่วงมีข้อมูล)")
        if sd.unparsable:
            lines.append(
                f"  แถวที่อ่านวันที่ไม่ได้: {sd.unparsable} (นับในจำนวนรวมแล้ว — ไม่ตัดทิ้ง)"
            )
    return lines


def run_check(domains, sheet_source: SheetSource, db_source: DbSource, run_at: dt.datetime):
    """Compare every domain honestly; returns (console_text, markdown_text)."""
    results: list[DomainResult] = []
    for d in domains:
        results.append(_check_domain(d, sheet_source, db_source))

    head = (
        "รายงานตรวจความสอดคล้องข้อมูล AppSheet ↔ ENV_DB (Phase 5 — เตรียมคัทโอเวอร์)\n"
        f"รันเมื่อ: {_thai_date(run_at)} เวลา {run_at.strftime('%H:%M')} ICT\n"
        "โหมด: อ่านอย่างเดียว (read-only) — ไม่มีการเขียนฐานข้อมูล ไม่มีการเขียน Drive\n"
        "หลักความจริงใจ: ไม่ทราบ ≠ ศูนย์ · วันที่ขาดถูกระบุ ไม่ถูกเติม · "
        "ตัวเลขครอบคลุมระบุตัวหารทุกครั้ง\n"
    )
    body_parts = []
    counts = {"match": 0, "mismatch": 0, "empty": 0, "unshared": 0,
              "sheet_error": 0, "db_unavailable": 0}
    for i, res in enumerate(results, 1):
        counts[res.status] += 1
        body_parts.append(f"\n{'=' * 72}\nโดเมนที่ {i}: {res.name_th} ({res.key})\n{'=' * 72}")
        body_parts.extend(res.lines)

    summary = [
        "",
        "=" * 72,
        "สรุปรวม",
        "=" * 72,
    ]
    if counts["match"]:
        summary.append(f"ตรงกัน: {counts['match']} โดเมน")
    if counts["mismatch"]:
        summary.append(f"ต่างกัน: {counts['mismatch']} โดเมน")
    if counts["unshared"]:
        summary.append(
            f"ยังไม่มีแหล่งข้อมูล: {counts['unshared']} โดเมน (ไม่ประเมิน parity — ไม่ใช่ 0-vs-0)"
        )
    if counts["empty"]:
        summary.append(f"โดเมนว่าง: {counts['empty']} โดเมน (ไม่นับเป็น parity ผ่าน)")
    if counts["sheet_error"]:
        summary.append(f"ดึงแหล่งไม่สำเร็จ: {counts['sheet_error']} โดเมน")
    if counts["db_unavailable"]:
        summary.append(f"ENV_DB ไม่พร้อมใช้: {counts['db_unavailable']} โดเมน")
    summary.extend([
        "",
        "ข้อจำกัด (ความจริงใจ): รายงานนี้เป็น EVIDENCE สำหรับการยอมรับวันที่ 14 ของเจ้าของ",
        "— ไม่ใช่การแทนการยืนยันด้วยลายลักษณ์อักษรของเจ้าของ (เงื่อนไข DoD ข้อ 4)",
        "ค่าที่อ่านเป็นค่า ณ เวลาอ่าน (point-in-time) ไม่ใช่ live telemetry",
        "เอกสารโปรโตคอล: docs/ai/PHASE5-CUTOVER-CHECKLIST.md",
    ])
    text = head + "\n".join(body_parts) + "\n" + "\n".join(summary) + "\n"
    md_title = (
        f"# รายงานตรวจความสอดคล้อง AppSheet ↔ ENV_DB — Phase 5\n\n"
        f"รันเมื่อ: {_thai_date(run_at)} เวลา {run_at.strftime('%H:%M')} ICT · "
        "อ่านอย่างเดียว · PII-safe (เฉพาะจำนวน)\n\n"
    )
    md = md_title + "```\n" + text + "```\n"
    return text, md


def _check_domain(d, sheet_source, db_source) -> DomainResult:
    res = DomainResult(key=d["key"], name_th=d["name_th"], status="empty")
    res.lines.append(f"  การอ้างอิงแหล่ง (citation): {d['citation']}")
    tables_txt = ", ".join(f"{s}.{t}" for s, t in d["env_tables"])
    res.lines.append(f"  ตาราง ENV_DB: {tables_txt}")

    # ── unshared: the honest ยังไม่มีแหล่งข้อมูล section, never a parity row ──
    if d["source"] == "unshared":
        res.status = "unshared"
        res.lines.append(f"  สถานะแหล่ง AppSheet: {UNSHARED_NOTE}")
        res.lines.append("  ฝั่ง AppSheet: ไม่ทราบ (ยังไม่มีแหล่ง — ไม่ประเมิน parity)")
        res.lines.append("  — ไม่มีแถว parity สำหรับโดเมนนี้ (ห้าม 0-vs-0: unknown ≠ zero)")
        for schema, table in d["env_tables"]:
            try:
                stats = db_source.query_stats(schema, table, d.get("date_column"))
            except DbUnavailableError:
                res.lines.append(f"  ฝั่ง ENV_DB ({schema}.{table}): ไม่ทราบ "
                                 "(LIVE_CONNECTION_UNAVAILABLE — ไม่อ้างสถานะใด ๆ)")
                continue
            if stats is None:
                res.lines.append(f"  ฝั่ง ENV_DB ({schema}.{table}): ไม่ทราบ "
                                 "(LIVE_CONNECTION_UNAVAILABLE — ไม่อ้างสถานะใด ๆ)")
                continue
            res.lines.append(
                f"  ฝั่ง ENV_DB ({schema}.{table}): {stats.total} แถว (ค่าจริง ณ เวลาอ่าน)"
            )
        if d.get("note"):
            res.lines.append(f"  หมายเหตุ: {d['note']}")
        return res

    # ── sheet side ──
    date_domain = bool(d.get("date_column"))
    try:
        frame = sheet_source.fetch(d["workbook_id"], d["tab"])
    except SheetSourceError as exc:
        res.status = "sheet_error"
        res.lines.append(f"  ดึงแหล่งข้อมูลไม่สำเร็จ (อ่านอย่างเดียว): {exc}")
        res.lines.append("  ฝั่ง AppSheet: ไม่ทราบ — ไม่มีการสร้างตัวเลขแทน")
        _db_section(res, d, db_source)
        return res
    sd = None
    sheet_date_note = None
    if date_domain:
        col, sheet_date_note = resolve_sheet_date_column(frame, d)
        if col is not None:
            sd = parse_sheet_dates(frame.rows, col)
        else:
            sd = SheetDates(total=len(frame.rows), unparsable=0, iso_dates=[], monthly={})
    if not date_domain:
        sd = SheetDates(total=len(frame.rows), unparsable=0, iso_dates=[], monthly={})
    res.lines.append(
        f"  แหล่ง AppSheet: workbook {WORKBOOK_NAMES.get(d['workbook_id'], d['workbook_id'])} "
        f"({d['workbook_id']}) tab «{d['tab']}» — อ่านอย่างเดียว"
    )
    if sheet_date_note:
        res.lines.append(f"  {sheet_date_note}")
    res.lines.extend(_sheet_section(sd, date_domain))

    # ── DB side ──
    db_ok = _db_section(res, d, db_source)
    stats = res._stats
    res._stats = None
    if not db_ok:
        res.status = "db_unavailable"
        res.lines.append(
            f"  สรุปจำนวนแถว: AppSheet {sd.total} / ENV ไม่ทราบ "
            "(LIVE_CONNECTION_UNAVAILABLE — ไม่อ้างสถานะ parity ใด ๆ)"
        )
        return res

    # ── verdict (parity row ONLY when both sides are really known) ──
    s_total, e_total = sd.total, stats.total
    res.lines.append(f"  สรุปจำนวนแถว: AppSheet {s_total} / ENV {e_total}")
    if s_total == 0 and e_total == 0:
        res.status = "empty"
        res.lines.append(
            "  โดเมนว่าง (0 แถวทั้งสองฝั่ง) — ไม่นับเป็น parity ผ่าน (ว่าง ≠ ตรวจแล้วตรง)"
        )
        return res
    if s_total == e_total:
        res.status = "match"
        res.lines.append("  ผล: ตรงกัน")
        if date_domain:
            res.lines.extend(_fmt_monthly(sd.monthly, stats.monthly))
    else:
        res.status = "mismatch"
        res.lines.append(f"  ผล: ต่างกัน (ต่าง {abs(s_total - e_total)} แถว)")
        if date_domain:
            res.lines.extend(_fmt_monthly(sd.monthly, stats.monthly))
    return res


def _db_section(res: DomainResult, d, db_source) -> bool:
    """Render the ENV_DB side honestly; returns True when stats are known."""
    ok = True
    for schema, table in d["env_tables"]:
        try:
            stats = db_source.query_stats(schema, table, d.get("date_column"))
        except DbUnavailableError as exc:
            res.lines.append(f"  ฝั่ง ENV_DB ({schema}.{table}): ไม่ทราบ ({exc})")
            ok = False
            continue
        if stats is None:  # defensive honesty: an absent answer is ไม่ทราบ, never 0
            res.lines.append(
                f"  ฝั่ง ENV_DB ({schema}.{table}): ไม่ทราบ "
                "(LIVE_CONNECTION_UNAVAILABLE — ไม่อ้างสถานะใด ๆ)"
            )
            ok = False
            continue
        res.lines.append(f"  จำนวนแถวรวม (ENV {schema}.{table}): {stats.total}")
        if d.get("date_column"):
            if stats.min_date and stats.max_date:
                res.lines.append(f"  ช่วงวันที่ (ENV): {stats.min_date} → {stats.max_date}")
                if stats.monthly:
                    shown = ", ".join(f"{ym}:{n}" for ym, n in sorted(stats.monthly.items()))
                    res.lines.append(f"  นับรายเดือน (ENV): {shown}")
            else:
                res.lines.append("  ช่วงวันที่ (ENV): ไม่ทราบ (ฐานไม่ส่งช่วงวันที่)")
        res._stats = stats
    return ok


def write_report_file(path: Path, markdown_text: str) -> None:
    """The ONLY file this script ever writes — the operator-named report."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(markdown_text, encoding="utf-8")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(
        description="Phase-5 parity count comparison (READ-ONLY — zero writes)"
    )
    ap.add_argument("--out", help="เขียนรายงาน .md ลงไฟล์ท้องถิ่นที่ระบุ (ไฟล์เดียวที่สคริปต์เขียนได้)")
    ap.add_argument("--skip-db", action="store_true",
                    help="ข้ามฝั่ง ENV_DB (ฝั่ง ENV จะแสดง ไม่ทราบ อย่างซื่อสัตย์)")
    ap.add_argument("--list-domains", action="store_true", help="แสดงรายการโดเมนแล้วจบ")
    args = ap.parse_args(argv)

    if args.list_domains:
        for d in DOMAIN_MAP:
            tag = d["source"]
            extra = f"{d.get('workbook_id', '')}/{d.get('tab', '')}" if tag == "public" else "UNSHARED"
            print(f"{d['key']:26s} {d['name_th']:32s} [{tag}] {extra}")
        return 0

    run_at = dt.datetime.now()
    sheet_source = LiveSheetSource()
    db_source = SkipDbSource() if args.skip_db else LiveDbSource()
    text, md = run_check(DOMAIN_MAP, sheet_source, db_source, run_at)
    print(text)
    if args.out:
        write_report_file(Path(args.out), md)
        print(f"[บันทึกรายงานแล้ว: {args.out}]")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
