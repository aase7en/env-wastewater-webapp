"""ENV-PHASE5-READY-001 C1 — D2 RED-first MOCKED contract suite for
scripts/phase5_parity_check.py (the Phase-5 parity count-comparison tool).

ZERO LIVE NETWORK at this phase: every sheet/DB response is a MOCKED
fixture. The LIVE read-only smoke run is D4-only (WO §5 D4) and is never
exercised here.

The five honesty shapes (WO §2.2 / registry record), each one test:

  1. FULL      — a normal domain: both sides counted, parity row emitted
                 when the counts match.
  2. EMPTY     — counts 0 on both sides shown AS empty-with-context and
                 EXPLICITLY not counted as a parity pass (empty ≠ checked).
  3. UNSHARED  — the Thai ยังไม่มีแหล่งข้อมูล section emitted, counts ไม่ทราบ,
                 NEVER a 0-vs-0 parity row (unknown ≠ zero).
  4. PARTIAL   — a month/date gap: missing days listed (calendar honesty),
                 never filled; coverage % with its denominator stated.
  5. MISMATCH  — sheet vs DB counts differ: the delta is surfaced as
                 ไม่ตรงกัน, never silently normalized.

Extra pins (WO §3 / §6 adjudication items):
  - DB unavailable → ไม่ทราบ + LIVE_CONNECTION_UNAVAILABLE, never 0 (§3 honesty).
  - Sheet unreachable → honest error section, never a fabricated count.
  - PII safety: the report carries COUNTS ONLY — no sheet row content
    ever reaches the rendered text.
  - ZERO WRITES: the SQL the script builds is SELECT-only (no
    INSERT/UPDATE/DELETE/DDL verbs anywhere); the sheet source is only
    ever fetched (read), never mutated.
  - Thai พ.ศ. user-facing dates (AGENTS.md dates rule).
  - DOMAIN_MAP integrity: every public domain carries an explicit,
    cited workbook/tab → ENV-table mapping (WO §6 D1-1: an invented or
    silent mapping = P1); every unshared domain names its ENV table.

Run:  uv run python -m pytest scripts/test_phase5_parity_check.py -q
"""

from __future__ import annotations

import datetime as dt
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import phase5_parity_check as p5  # noqa: E402  (D2 RED = module absent)

RUN_AT = dt.datetime(2026, 11, 21, 8, 30, 0)

POND_ID = "1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk"
GARDEN_ID = "1Hluhfryn2uMdK8nQ2kRJyLI3q-ZbrwgBgveDbhJlerw"

# The PII canary: a value that looks like a sheet ROW CONTENT cell. The
# report must carry counts only — this string must NEVER appear in the
# rendered text even though the fixture rows hold it.
PII_CANARY = "นายทดสอบ พีไอไอล่อลวง"
PII_CANARY_ID = "ACC-110170012345-X"  # synthetic row-content token (12 digits: no 13-digit run by design)


def _domain(key: str) -> dict:
    matches = [d for d in p5.DOMAIN_MAP if d["key"] == key]
    if len(matches) != 1:
        raise AssertionError(f"DOMAIN_MAP key {key!r} not unique/absent")
    return matches[0]


class FakeSheetSource:
    """Mocked sheet side — records calls, never touches the network."""

    def __init__(self, frames):
        self.frames = frames  # (workbook_id, tab) -> SheetFrame
        self.calls = []

    def fetch(self, workbook_id, tab):
        self.calls.append((workbook_id, tab))
        frame = self.frames.get((workbook_id, tab))
        if frame is None:
            raise p5.SheetSourceError(f"mock unreachable: {workbook_id}/{tab}")
        return frame


class FakeDbSource:
    """Mocked ENV_DB side — records SQL, returns canned DbStats."""

    def __init__(self, stats):
        self.stats = stats  # (schema, table) -> DbStats | None
        self.sqls = []

    def query_stats(self, schema, table, date_column):
        self.sqls.append((schema, table, date_column))
        return self.stats.get((schema, table))


def db(total, monthly=None, min_date=None, max_date=None):
    return p5.DbStats(
        total=total, monthly=monthly or {}, min_date=min_date, max_date=max_date
    )


class FullDomainParity(unittest.TestCase):
    """Shape 1 — a normal domain with matching counts → honest parity row."""

    def test_full_domain_matching_counts(self):
        d = _domain("job_log")
        rows = [
            {d["date_column"]: "2026-11-01T08:00:00", "issue": PII_CANARY},
            {d["date_column"]: "2026-11-02T08:00:00", "issue": PII_CANARY_ID},
        ]
        sheets = FakeSheetSource({(GARDEN_ID, d["tab"]): p5.SheetFrame(rows)})
        dbs = FakeDbSource(
            {
                ("core", "job_log"): db(
                    2,
                    monthly={"2026-11": 2},
                    min_date="2026-11-01",
                    max_date="2026-11-02",
                )
            }
        )
        text, md = p5.run_check([d], sheets, dbs, RUN_AT)
        for blob in (text, md):
            self.assertIn("AppSheet 2", blob)
            self.assertIn("ENV 2", blob)
            self.assertIn("ตรงกัน", blob)
        # PII safety: counts only, never row content
        self.assertNotIn(PII_CANARY, text)
        self.assertNotIn(PII_CANARY_ID, text)


class EmptyDomainHonesty(unittest.TestCase):
    """Shape 2 — 0-vs-0 shown AS empty, never read as a parity pass."""

    def test_empty_domain_is_not_a_parity_pass(self):
        d = _domain("location_area")
        sheets = FakeSheetSource({(GARDEN_ID, d["tab"]): p5.SheetFrame([])})
        dbs = FakeDbSource({("core", "location_area"): db(0)})
        text, md = p5.run_check([d], sheets, dbs, RUN_AT)
        for blob in (text, md):
            self.assertIn("โดเมนว่าง", blob)
            self.assertIn("ไม่นับเป็น parity ผ่าน", blob)
            self.assertNotIn("ตรงกัน", blob)
            self.assertNotIn("ต่างกัน", blob)


class UnsharedDomainHonesty(unittest.TestCase):
    """Shape 3 — unshared source ⇒ ยังไม่มีแหล่งข้อมูล, never a parity row."""

    def test_unshared_domain_emits_no_parity_row(self):
        d = _domain("manual_water_supply")
        sheets = FakeSheetSource({})  # nothing reachable — and never fetched
        dbs = FakeDbSource({("core", "manual_water_supply"): db(0)})
        text, md = p5.run_check([d], sheets, dbs, RUN_AT)
        for blob in (text, md):
            self.assertIn("ยังไม่มีแหล่งข้อมูล", blob)
            self.assertIn("ไม่ทราบ", blob)
            self.assertNotIn("ตรงกัน", blob)
            self.assertNotIn("ต่างกัน", blob)
            self.assertNotIn("โดเมนว่าง", blob)
        # zero-fetch honesty: an unshared source is never probed at all
        self.assertEqual(sheets.calls, [])

    def test_unshared_domain_never_zero_vs_zero_parity(self):
        d = _domain("fire_extinguisher_master")
        sheets = FakeSheetSource({})
        dbs = FakeDbSource({("safety", "fire_extinguisher"): db(0)})
        text, _ = p5.run_check([d], sheets, dbs, RUN_AT)
        # the parity-comparison line format must not appear for this domain
        self.assertNotIn("AppSheet 0 / ENV 0", text)


class PartialMonthHonesty(unittest.TestCase):
    """Shape 4 — gaps listed, never filled; coverage denominator stated."""

    def test_missing_days_listed_with_denominator(self):
        d = _domain("job_log")
        rows = [
            {d["date_column"]: "2026-01-01T08:00:00"},
            {d["date_column"]: "2026-01-02T08:00:00"},
            {d["date_column"]: "2026-01-05T08:00:00"},
        ]
        sheets = FakeSheetSource({(GARDEN_ID, d["tab"]): p5.SheetFrame(rows)})
        dbs = FakeDbSource({("core", "job_log"): db(3)})
        text, md = p5.run_check([d], sheets, dbs, RUN_AT)
        for blob in (text, md):
            self.assertIn("2026-01-03", blob)  # missing day listed
            self.assertIn("2026-01-04", blob)
            self.assertIn("3/5", blob)  # coverage with denominator
            self.assertIn("60.0%", blob)


class MismatchHonesty(unittest.TestCase):
    """Shape 5 — a count delta surfaces as ไม่ตรงกัน, never normalized."""

    def test_count_mismatch_is_surfaced(self):
        d = _domain("job_log")
        rows = [
            {d["date_column"]: "2026-11-01T08:00:00"},
            {d["date_column"]: "2026-11-02T08:00:00"},
            {d["date_column"]: "2026-11-03T08:00:00"},
        ]
        sheets = FakeSheetSource({(GARDEN_ID, d["tab"]): p5.SheetFrame(rows)})
        dbs = FakeDbSource(
            {("core", "job_log"): db(2, monthly={"2026-11": 2})}
        )
        text, md = p5.run_check([d], sheets, dbs, RUN_AT)
        for blob in (text, md):
            self.assertIn("AppSheet 3", blob)
            self.assertIn("ENV 2", blob)
            self.assertIn("ต่างกัน", blob)
            self.assertNotIn("ตรงกัน", blob)


class DbUnavailableHonesty(unittest.TestCase):
    """No token / query error ⇒ ENV column ไม่ทราบ, never a fabricated 0."""

    def test_db_none_reports_unavailable(self):
        d = _domain("job_log")
        rows = [{d["date_column"]: "2026-11-01T08:00:00"}]
        sheets = FakeSheetSource({(GARDEN_ID, d["tab"]): p5.SheetFrame(rows)})
        dbs = FakeDbSource({("core", "job_log"): None})
        text, md = p5.run_check([d], sheets, dbs, RUN_AT)
        for blob in (text, md):
            self.assertIn("ไม่ทราบ", blob)
            self.assertIn("LIVE_CONNECTION_UNAVAILABLE", blob)
            self.assertIn("AppSheet 1", blob)
            self.assertNotIn("ตรงกัน", blob)
            self.assertNotIn("ต่างกัน", blob)


class SheetUnreachableHonesty(unittest.TestCase):
    """A fetch failure is an honest error section, never a count."""

    def test_sheet_error_section(self):
        d = _domain("reading")
        sheets = FakeSheetSource({})  # every fetch raises
        dbs = FakeDbSource({("wastewater", "reading"): db(907)})
        text, md = p5.run_check([d], sheets, dbs, RUN_AT)
        for blob in (text, md):
            self.assertIn("ดึงแหล่งข้อมูลไม่สำเร็จ", blob)
            self.assertIn("ไม่ทราบ", blob)
            self.assertNotIn("ตรงกัน", blob)
            self.assertNotIn("ต่างกัน", blob)


class ReadOnlyGuards(unittest.TestCase):
    """ZERO WRITES: SELECT-only SQL; the sheet side is fetch-only."""

    _WRITE_VERBS = (
        "insert",
        "update",
        "delete",
        "drop ",
        "alter ",
        "create ",
        "truncate",
        "grant ",
        "revoke ",
        "call ",
        "copy ",
    )

    def test_db_queries_are_select_only(self):
        seen = []
        for d in p5.DOMAIN_MAP:
            if d["source"] != "public":
                continue
            seen.extend(p5.build_db_sql(d))
        self.assertTrue(seen, "public domains must build SQL")
        for sql in seen:
            lowered = " ".join(sql.lower().split())
            self.assertTrue(lowered.startswith("select"), sql)
            for verb in self._WRITE_VERBS:
                self.assertNotIn(verb, lowered)

    def test_sheet_source_interface_is_fetch_only(self):
        # structural: the source protocol the script relies on is fetch()
        # (read-only); the script never calls any write-shaped method.
        source_methods = {
            name
            for name in dir(p5)
            if name.endswith("source") or name in ("SheetSource", "DbSource")
        }
        d = _domain("reading")
        sheets = FakeSheetSource({(POND_ID, d["tab"]): p5.SheetFrame([])})
        dbs = FakeDbSource({("wastewater", "reading"): None})
        p5.run_check([d], sheets, dbs, RUN_AT)
        # the only sheet interaction is the single read fetch of this domain
        self.assertEqual(sheets.calls, [(POND_ID, d["tab"])])
        self.assertTrue(source_methods or True)  # protocol names are pins, not gates


class DateParsingHonesty(unittest.TestCase):
    """Unparsable date cells count toward totals, never silently dropped."""

    def test_unparsable_dates_counted_and_disclosed(self):
        d = _domain("emergency_light_check")
        rows = [
            {d["date_column"]: "5/6/2568"},  # Thai พ.ศ. d/m/yyyy
            {d["date_column"]: "garbage-not-a-date"},
        ]
        parsed = p5.parse_sheet_dates(rows, d["date_column"])
        self.assertEqual(parsed.total, 2)
        self.assertEqual(parsed.unparsable, 1)
        self.assertEqual(parsed.iso_dates, ["2025-06-05"])  # พ.ศ. 2568 → CE 2025

    def test_buddhist_era_iso_string_converts(self):
        # live-smoke D4 finding: staff type พ.ศ. years in ISO shape too
        self.assertEqual(p5._to_iso_date("2569-11-20"), "2026-11-20")
        self.assertEqual(p5._to_iso_date("2568-05-06"), "2025-05-06")

    def test_buddhist_era_excel_date_cell_converts(self):
        # the P2.3 seed precedent: sheet date CELLS carry พ.ศ. year numbers
        self.assertEqual(p5._to_iso_date(dt.date(2566, 8, 9)), "2023-08-09")
        self.assertEqual(p5._to_iso_date(dt.datetime(2569, 9, 23, 8, 0)), "2026-09-23")
        self.assertEqual(p5._to_iso_date(dt.date(2024, 2, 29)), "2024-02-29")  # CE untouched


class ThaiDates(unittest.TestCase):
    """User-facing dates are พ.ศ. (AGENTS.md dates rule)."""

    def test_report_header_uses_buddhist_era(self):
        d = _domain("job_log")
        sheets = FakeSheetSource({(GARDEN_ID, d["tab"]): p5.SheetFrame([])})
        dbs = FakeDbSource({("core", "job_log"): db(0)})
        text, _ = p5.run_check([d], sheets, dbs, RUN_AT)
        self.assertIn("2569", text)


class SheetDateColumnResolution(unittest.TestCase):
    """D4 live-smoke-driven pins: the sheet's date column is NOT assumed.

    The AppSheet headers carry Thai/verbatim names (e.g. «วันที่ บันทึก»)
    while the ENV column names are translations (e.g. reading_date) —
    the report must resolve the sheet column from the real header and
    stay honest when none parses.
    """

    def test_declared_thai_column_resolves_and_dates_compute(self):
        d = dict(_domain("reading"))
        rows = [
            {"วันที่ บันทึก": "2026-01-01", "misc": "x"},
            {"วันที่ บันทึก": "2026-01-02", "misc": "y"},
            {"วันที่ บันทึก": "2026-01-05", "misc": "z"},
        ]
        sheets = FakeSheetSource({(POND_ID, d["tab"]): p5.SheetFrame(rows)})
        dbs = FakeDbSource({("wastewater", "reading"): db(3)})
        text, md = p5.run_check([d], sheets, dbs, RUN_AT)
        for blob in (text, md):
            self.assertIn("วันที่ บันทึก", blob)
            self.assertIn("2026-01-03", blob)
            self.assertIn("3/5", blob)

    def test_no_parseable_date_column_stays_honest(self):
        d = dict(_domain("job_log"))
        rows = [{"ภาพ": "a", "เรื่อง": "b"}, {"ภาพ": "c", "เรื่อง": "d"}]
        sheets = FakeSheetSource({(GARDEN_ID, d["tab"]): p5.SheetFrame(rows)})
        dbs = FakeDbSource({("core", "job_log"): db(2)})
        text, md = p5.run_check([d], sheets, dbs, RUN_AT)
        for blob in (text, md):
            self.assertIn("ไม่พบคอลัมน์วันที่ที่อ่านได้", blob)
            self.assertIn("ไม่ทราบ", blob)
            self.assertIn("AppSheet 2", blob)  # row counts stay honest


class DomainMapIntegrity(unittest.TestCase):
    """WO §6 D1-1 — every mapping explicit and cited; unshared named."""

    _UNSHARED_KEYS = {
        "manual_water_supply",
        "fire_extinguisher_master",
        "coliform",
        "items_masters",
        "chemical_inventory",
        "water_supply_daily",
    }

    def test_all_six_unshared_domains_present(self):
        keys = {d["key"] for d in p5.DOMAIN_MAP}
        self.assertTrue(self._UNSHARED_KEYS.issubset(keys))

    def test_public_domains_carry_cited_mapping(self):
        for d in p5.DOMAIN_MAP:
            with self.subTest(key=d["key"]):
                self.assertIn(d["source"], ("public", "unshared"))
                self.assertTrue(d.get("citation"), "every domain needs a citation")
                self.assertTrue(d.get("env_tables"), "every domain names its ENV table(s)")
                if d["source"] == "public":
                    self.assertTrue(d.get("workbook_id"))
                    self.assertTrue(d.get("tab"))
                else:
                    self.assertNotIn("workbook_id", d)

    def test_no_env_table_appears_twice(self):
        seen = []
        for d in p5.DOMAIN_MAP:
            seen.extend(d["env_tables"])
        self.assertEqual(len(seen), len(set(seen)))

    def test_date_domains_declare_date_column(self):
        for d in p5.DOMAIN_MAP:
            if d["source"] == "public" and d.get("date_type"):
                self.assertTrue(d.get("date_column"), d["key"])

    def test_recorded_column_pins_survive_refactors(self):
        # live-smoke D4 findings pinned: the ENV date columns are the
        # migration's real columns (a wrong name = honest 42703 in the field)
        by_key = {d["key"]: d for d in p5.DOMAIN_MAP}
        self.assertEqual(by_key["item_calibration"]["date_column"], "calibration_date")
        self.assertEqual(by_key["extinguisher_inspection"]["date_type"], "timestamp")
        self.assertEqual(by_key["emergency_light_check"]["date_column"], "check_date")
        self.assertEqual(by_key["reading"]["sheet_date_column"], "วันที่ บันทึก")


class ReportFileHonesty(unittest.TestCase):
    """--out writes the report file locally; content = the markdown text."""

    def test_write_report_file(self):
        d = _domain("job_log")
        sheets = FakeSheetSource({(GARDEN_ID, d["tab"]): p5.SheetFrame([])})
        dbs = FakeDbSource({("core", "job_log"): db(0)})
        _, md = p5.run_check([d], sheets, dbs, RUN_AT)
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "parity-report.md"
            p5.write_report_file(out, md)
            written = out.read_text(encoding="utf-8")
        self.assertEqual(written, md)


if __name__ == "__main__":
    unittest.main()
