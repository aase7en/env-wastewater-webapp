"""ENV-PARITY-P3-003 C1 — D2 RED-first live contract battery for the
maintenance/calibration log (core.item_calibration + the guarded 11-row
`maintaining` seed — AppSheet parity Phase 3, lane P3.3, Track-Z GLM).

Queries ENV_DB (project gllqtbyofrcjzmbnfoeh, ap-southeast-1) through the
same Management-API access path as scripts/apply_migration_api.py
(scripts/_env.py; SUPABASE_ACCESS_TOKEN from Drive secrets — never
printed; A_WIKI_DRIVE_PATH points the resolver at the Drive root).

Assertion groups (WO §3/§4/§5/§7; every schema group must FAIL truthfully
while migration 20261118000005_parity_p3_003.sql is UNAPPLIED — the RED
record goes in the handoff — and pass GREEN after):

  SCHEMA     — core.item_calibration (the §3.30 `maintenance` translation:
                item_id NULL FK → core.item + tool_legacy_id verbatim
                lineage + item_name display text + calibration_date
                NOT NULL DEFAULT CURRENT_DATE (= the Cal_date Init TODAY()
                translation — the table's ONLY formula) + cal_method /
                cal_result verbatim + the maintaining-only calibrate_range /
                calibrate_unit carriers + source_provenance + legacy_id
                UNIQUE) + the public.item_calibration security_invoker
                façade. NO RPC, NO trigger, NO generated column (WO §3-2 —
                next-due is DISPLAY-TIME ONLY, D1-5).
  RLS        — the D1-6 ruled log/append posture (owner dispatch pin:
                staff SELECT+INSERT / admin UPDATE+DELETE): SELECT
                staff-or-admin / INSERT staff-or-admin WITH CHECK /
                UPDATE admin (USING + WITH CHECK) / DELETE admin; zero
                anon policies.
  SEED       — exactly 11 durable rows from the `maintaining` tab with the
                pinned census (tool_legacy_id 6 distinct / calibration_date
                5 distinct / calibrate_range 7 nonempty + 4 NULL /
                calibrate_unit 4 distinct / cal_result 2 distinct — the
                sheet-side compare_ref result class carried verbatim in
                cal_result per the WO §0 equivalence ผล) + verbatim
                spot-check of TWO rows re-read from the fetched XLSX bytes
                (/tmp snapshot; GET-only re-fetch when absent) + the
                พ.ศ.-year date translation (year − 543 → CE) + cal_method
                NULL everywhere (no source column — never fabricated) +
                item_id NULL everywhere (core.item stays 0 rows, D1-3) +
                the guarded re-send inserts ZERO rows (WHERE NOT EXISTS
                canary — BEGIN…ROLLBACK, zero net persistence). These
                fixtures are NEVER SENT while the table is absent
                pre-apply (canary-gated — zero durable writes).
  COUNTS     — baselines wastewater.reading 907 / core.personnel 9 /
                core.equipment_spec 4 / safety.emergency_light 48 /
                safety.fire_extinguisher 0 / safety.emergency_light_check
                332 / food.lab_test 0 / core.item 0 / core.vendor 0 /
                core.item_category 0 / core.distributor 6 /
                chemical.inventory_lot 0 identical pre/post battery (the
                RED canary + zero unanticipated durable writes).

Run:  A_WIKI_DRIVE_PATH=<drive root> python3 -m pytest \\
        scripts/test_parity_p3_003_calibration.py -q
"""

from __future__ import annotations

import sys
import unittest
from datetime import datetime
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent))

API_URL = (
    "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
)

MIGRATION = "20261118000005_parity_p3_003.sql"
MIGRATION_PATH = Path(__file__).resolve().parent.parent / "supabase/migrations" / MIGRATION

SEED_MARKER_START = "-- >>> SEED-BLOCK-START"
SEED_MARKER_END = "-- <<< SEED-BLOCK-END"

# The fetched source bytes (GET-only Drive export; re-fetched read-only when
# the /tmp snapshot is absent — never a Drive write).
SOURCE_XLSX = Path("/tmp/env-p3-003-maintaining.xlsx")
SOURCE_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "1QlG0vskH_uFWoc2BiKMdL2nFkOjhGXE3D_yW3BIHpsw/export?format=xlsx"
)

BASELINES = {
    ("wastewater", "reading"): 907,
    ("core", "personnel"): 9,
    ("core", "equipment_spec"): 4,
    ("safety", "emergency_light"): 48,
    ("safety", "fire_extinguisher"): 0,
    ("safety", "emergency_light_check"): 332,
    ("food", "lab_test"): 0,
    ("core", "item"): 0,
    ("core", "vendor"): 0,
    ("core", "item_category"): 0,
    ("core", "distributor"): 6,
    ("chemical", "inventory_lot"): 0,
}


def _token() -> str:
    from _env import load_secret

    tok = load_secret("SUPABASE_ACCESS_TOKEN")
    if not tok:
        raise unittest.SkipTest("SUPABASE_ACCESS_TOKEN not resolvable (Drive secrets offline)")
    return tok


_TOKEN = _token()


def q(sql: str):
    """One Management-API query. Raises AssertionError carrying the real
    DB error on failure — a RED must show the true reason (e.g.
    relation "core.item_calibration" does not exist)."""
    r = httpx.post(
        API_URL,
        headers={"Authorization": f"Bearer {_TOKEN}", "Content-Type": "application/json"},
        json={"query": sql},
        timeout=60,
    )
    if r.status_code >= 400:
        try:
            msg = r.json().get("message") or r.text
        except Exception:
            msg = r.text
        raise AssertionError(f"DB query failed ({r.status_code}): {msg}")
    return r.json()


def _objects_present() -> bool:
    try:
        rows = q("SELECT to_regclass('core.item_calibration') AS t")
        return rows[0]["t"] is not None
    except AssertionError:
        return False


_OBJECTS_PRESENT = _objects_present()


def _baseline_counts_sql() -> str:
    """Baselines over PRE-EXISTING objects only — runnable (and passing)
    at RED so the durable-write canary is observable before the migration
    exists; the disclosed RED legacy pass."""
    parts = [
        f"(SELECT count(*) FROM {s}.{t}) AS {s.replace('_', '')}_{t.replace('_', '')}"
        for (s, t) in BASELINES
    ]
    return "SELECT " + ", ".join(parts)


def _counts_sql() -> str:
    """Post-apply snapshot: baselines + the new table's durable shape."""
    parts = [
        f"(SELECT count(*) FROM {s}.{t}) AS {s.replace('_', '')}_{t.replace('_', '')}"
        for (s, t) in BASELINES
    ]
    parts.append("(SELECT count(*) FROM core.item_calibration) AS core_itemcalibration")
    parts.append(
        "(SELECT count(*) FROM core.item_calibration"
        " WHERE source_provenance LIKE 'contract-fixture%') AS core_fxleaks"
    )
    return "SELECT " + ", ".join(parts)


class CountsProbe(unittest.TestCase):
    """Baseline snapshot used by the canary + zero-net-persistence checks."""

    def test_baseline_counts_intact(self):
        rows = q(_baseline_counts_sql())
        row = rows[0]
        for (s, t), expected in BASELINES.items():
            key = s.replace("_", "") + "_" + t.replace("_", "")
            self.assertEqual(
                row[key], expected, f"baseline {s}.{t} = {row[key]}, expected {expected}"
            )

    def test_zero_net_persistence_after_fixtures(self):
        rows = q(_counts_sql())
        row = rows[0]
        self.assertEqual(row["core_fxleaks"], 0, "fixture rows leaked (must stay 0)")
        self.assertEqual(
            row["core_itemcalibration"],
            11,
            "durable seed must hold exactly the 11 maintaining rows",
        )


class SchemaContract(unittest.TestCase):
    """SCHEMA + RLS shape contract (fails truthfully while the migration is
    unapplied — the honest RED)."""

    def test_table_exists_with_pinned_columns(self):
        expected = [
            ("id", "uuid", "NO"),
            ("item_id", "uuid", "YES"),
            ("tool_legacy_id", "text", "YES"),
            ("item_name", "text", "YES"),
            ("calibration_date", "date", "NO"),
            ("cal_method", "text", "YES"),
            ("cal_result", "text", "YES"),
            ("calibrate_range", "text", "YES"),
            ("calibrate_unit", "text", "YES"),
            ("source_provenance", "text", "NO"),
            ("legacy_id", "text", "YES"),
            ("note", "text", "YES"),
            ("recorded_by", "uuid", "YES"),
            ("created_at", "timestamp with time zone", "NO"),
        ]
        cols = q(
            "SELECT column_name, data_type, is_nullable"
            " FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name='item_calibration'"
        )
        actual = {c["column_name"]: (c["data_type"], c["is_nullable"]) for c in cols}
        self.assertTrue(actual, "core.item_calibration missing (unapplied migration?)")
        for column, dtype, nullable in expected:
            self.assertIn(column, actual, f"core.item_calibration.{column} missing")
            self.assertEqual(
                actual[column][0], dtype, f"{column} type {actual[column][0]} != {dtype}"
            )
            self.assertEqual(
                actual[column][1],
                nullable,
                f"{column} nullable {actual[column][1]} != {nullable}",
            )

    def test_calibration_date_default_is_current_date(self):
        """The Cal_date Init TODAY() translation — the table's ONLY formula
        (§3.30 ref 4864-4884), carried as the column DEFAULT (no trigger,
        no generated column — WO §3-2)."""
        rows = q(
            "SELECT column_default FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name='item_calibration'"
            " AND column_name='calibration_date'"
        )
        self.assertTrue(rows, "calibration_date column missing")
        self.assertIn(
            "CURRENT_DATE",
            (rows[0]["column_default"] or "").upper(),
            f"calibration_date DEFAULT must be CURRENT_DATE, got {rows[0]['column_default']}",
        )

    def test_legacy_id_unique_index(self):
        rows = q(
            "SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid"
            " WHERE c.oid = 'core.item_calibration'::regclass AND i.indisunique"
            " AND pg_get_indexdef(i.indexrelid) LIKE '%legacy_id%'"
        )
        self.assertTrue(rows, "core.item_calibration.legacy_id UNIQUE index missing")

    def test_facade_view_security_invoker(self):
        rows = q("SELECT reloptions FROM pg_class WHERE oid = 'public.item_calibration'::regclass")
        self.assertTrue(rows, "public.item_calibration view missing")
        opts = rows[0]["reloptions"] or []
        self.assertIn("security_invoker=on", opts)

    def test_no_rpc_no_trigger_no_generated_column(self):
        """WO §3-2 — a plain log table: next-due is DISPLAY-TIME ONLY
        (D1-5), so no stored/generated derivation may exist."""
        rpc = q(
            "SELECT count(*) AS c FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace"
            " WHERE n.nspname = 'core' AND p.proname LIKE '%calibrat%'"
        )
        self.assertEqual(rpc[0]["c"], 0, "no calibration RPC may exist in core (WO §3-2)")
        trg = q(
            "SELECT count(*) AS c FROM pg_trigger"
            " WHERE tgrelid = 'core.item_calibration'::regclass AND NOT tgisinternal"
        )
        self.assertEqual(trg[0]["c"], 0, "no trigger may exist on core.item_calibration (WO §3-2)")
        gen = q(
            "SELECT count(*) AS c FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name='item_calibration'"
            " AND is_generated <> 'NEVER'"
        )
        self.assertEqual(gen[0]["c"], 0, "no generated column may exist (WO §3-2)")

    def test_rls_enabled_and_pinned_policies(self):
        rows = q("SELECT relrowsecurity FROM pg_class WHERE oid = 'core.item_calibration'::regclass")
        self.assertTrue(rows[0]["relrowsecurity"], "RLS not enabled on core.item_calibration")
        # D1-6 ruled posture (owner dispatch pin): staff SELECT+INSERT /
        # admin UPDATE+DELETE — the log/append pattern.
        expected = {
            "calibration_select": ("SELECT", "fn_is_staff_or_admin"),
            "calibration_insert_staff": ("INSERT", "fn_is_staff_or_admin"),
            "calibration_update_admin": ("UPDATE", "fn_is_admin"),
            "calibration_delete_admin": ("DELETE", "fn_is_admin"),
        }
        rows = q(
            "SELECT polname, polcmd::text AS cmd,"
            " pg_get_expr(polqual, polrelid) AS using_expr,"
            " pg_get_expr(polwithcheck, polrelid) AS check_expr"
            " FROM pg_policy WHERE polrelid = 'core.item_calibration'::regclass"
        )
        byname = {r["polname"]: r for r in rows}
        polcmd_map = {"SELECT": "r", "INSERT": "a", "UPDATE": "w", "DELETE": "d"}
        for policy, (cmd, fn) in expected.items():
            self.assertIn(policy, byname, f"policy {policy} missing on core.item_calibration")
            self.assertEqual(
                byname[policy]["cmd"], polcmd_map[cmd], f"policy {policy} cmd mismatch"
            )
            haystack = (byname[policy]["using_expr"] or "") + " " + (byname[policy]["check_expr"] or "")
            self.assertIn(fn, haystack, f"policy {policy} must gate on {fn}")
        anon = q(
            "SELECT count(*) AS c FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid"
            " WHERE c.relname = 'item_calibration'"
            " AND c.relnamespace = 'core'::regnamespace"
            " AND NOT EXISTS (SELECT 1 FROM pg_roles r WHERE r.oid = ANY (p.polroles) AND r.rolname = 'authenticated')"
        )
        self.assertEqual(anon[0]["c"], 0, "anon-visible policy found on core.item_calibration")


def _load_source_rows():
    """The maintaining tab rows re-read from the fetched XLSX bytes (the
    seed truth); GET-only re-fetch when the /tmp snapshot is absent."""
    import openpyxl

    if not SOURCE_XLSX.exists():
        resp = httpx.get(SOURCE_URL, timeout=60, follow_redirects=True)
        resp.raise_for_status()
        SOURCE_XLSX.write_bytes(resp.content)
    wb = openpyxl.load_workbook(SOURCE_XLSX, data_only=True)
    ws = wb["maintaining"]
    rows = list(ws.iter_rows(values_only=True))
    data = [r for r in rows[1:] if any(v is not None and str(v).strip() != "" for v in r)]
    return data


def _be_to_ce(dt: datetime) -> str:
    """Sheet `date` values carry พ.ศ. (BE) years; ENV stores CE (year − 543)
    — the house พ.ศ.-parse rule (P3.2 MFG precedent), documented in the
    migration and rendered back to พ.ศ. by the UI."""
    return f"{dt.year - 543:04d}-{dt.month:02d}-{dt.day:02d}"


@unittest.skipUnless(
    _OBJECTS_PRESENT,
    "canary: migration 20261118000005 unapplied — the seed fixtures are NEVER SENT pre-apply (zero durable writes)",
)
class SeedFixtures(unittest.TestCase):
    """Seed census + verbatim spot-checks + the guarded-idempotency canary."""

    def test_seed_census_matches_the_pinned_maintaining_census(self):
        row = q(
            "SELECT count(*) AS total,"
            " count(DISTINCT tool_legacy_id) AS tools,"
            " count(DISTINCT calibration_date) AS dates,"
            " count(calibrate_range) AS ranges_nonempty,"
            " count(*) FILTER (WHERE calibrate_range IS NULL) AS ranges_null,"
            " count(DISTINCT calibrate_unit) AS units,"
            " count(DISTINCT cal_result) AS results,"
            " count(*) FILTER (WHERE cal_method IS NULL) AS methods_null,"
            " count(*) FILTER (WHERE item_id IS NOT NULL) AS item_bound,"
            " count(*) FILTER (WHERE item_name IS NOT NULL) AS names_set"
            " FROM core.item_calibration"
        )[0]
        self.assertEqual(row["total"], 11, "seed must hold exactly 11 rows (11/11 reconciliation)")
        self.assertEqual(row["tools"], 6, "tool_legacy_id must hold 6 distinct values")
        self.assertEqual(row["dates"], 5, "calibration_date must hold 5 distinct values")
        self.assertEqual(row["ranges_nonempty"], 7, "calibrate_range nonempty must be 7")
        self.assertEqual(row["ranges_null"], 4, "calibrate_range blanks must be NULL (4)")
        self.assertEqual(row["units"], 4, "calibrate_unit must hold 4 distinct values")
        self.assertEqual(row["results"], 2, "cal_result (compare_ref lineage) must hold 2 distinct values")
        self.assertEqual(row["methods_null"], 11, "cal_method has no source column — NULL everywhere, never fabricated")
        self.assertEqual(row["item_bound"], 0, "item_id stays NULL (core.item is 0 rows — D1-3)")
        self.assertEqual(row["names_set"], 0, "item_name has no maintaining column — NULL (never fabricated)")

    def test_verbatim_values_and_result_classes(self):
        rows = q("SELECT DISTINCT cal_result FROM core.item_calibration ORDER BY cal_result")
        self.assertEqual(
            {r["cal_result"] for r in rows}, {"InControl", "Higher Ref."},
            "cal_result must carry the sheet-side compare_ref result classes verbatim",
        )
        rows = q("SELECT DISTINCT calibrate_unit FROM core.item_calibration ORDER BY calibrate_unit")
        self.assertEqual(
            {r["calibrate_unit"] for r in rows}, {"%", "mg/L", "pH", "ppm"},
            "calibrate_unit must carry the sheet units verbatim",
        )

    def test_two_rows_spot_checked_against_the_source_bytes(self):
        """Spot-check TWO seeded rows field-by-field against the fetched
        XLSX bytes (1d5ce050 = first maintaining row, 664d0c36 = last)."""
        data = _load_source_rows()
        by_id = {str(r[0]).strip(): r for r in data}
        for legacy in ("1d5ce050", "664d0c36"):
            src = by_id[legacy]
            row = q(
                "SELECT tool_legacy_id, calibration_date::text AS d, calibrate_range,"
                " calibrate_unit, cal_result, cal_method, item_id"
                " FROM core.item_calibration WHERE legacy_id = '" + legacy + "'"
            )
            self.assertEqual(len(row), 1, f"seeded row {legacy} missing")
            r = row[0]
            self.assertEqual(r["tool_legacy_id"], str(src[1]).strip())
            self.assertEqual(r["d"], _be_to_ce(src[2]), f"{legacy} date must be the พ.ศ.→CE translation")
            expected_range = None if src[3] is None or str(src[3]).strip() == "" else str(src[3]).strip()
            self.assertEqual(r["calibrate_range"], expected_range)
            self.assertEqual(r["calibrate_unit"], str(src[4]).strip())
            self.assertEqual(r["cal_result"], str(src[5]).strip())
            self.assertIsNone(r["cal_method"])
            self.assertIsNone(r["item_id"])

    def test_all_date_years_translated_to_ce(self):
        rows = q("SELECT DISTINCT calibration_date::text AS d FROM core.item_calibration ORDER BY d")
        for r in rows:
            year = int(r["d"][:4])
            self.assertLess(year, 2100, f"year {year} looks un-translated พ.ศ. (must be CE)")
            self.assertGreater(year, 2000, f"year {year} out of plausible CE range")

    def test_seed_block_resend_inserts_zero_rows(self):
        text = MIGRATION_PATH.read_text(encoding="utf-8")
        start = text.index(SEED_MARKER_START)
        end = text.index(SEED_MARKER_END)
        block = text[start:end]
        from apply_migration_api import split_sql

        stmts = [s for s in split_sql(block) if s.strip()]
        self.assertGreaterEqual(len(stmts), 1)
        before = q("SELECT count(*) AS c FROM core.item_calibration")[0]["c"]
        sql = "BEGIN;\n" + "\n".join(stmts) + "\nROLLBACK;"
        q(sql)
        after = q("SELECT count(*) AS c FROM core.item_calibration")[0]["c"]
        self.assertEqual(before, after, "guarded seed re-send must insert ZERO rows")


if __name__ == "__main__":
    unittest.main()
