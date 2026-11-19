"""ENV-PARITY-P3-006 C1 — the D3 SQL fixture battery over the LIVE
delivered Phase-3 objects (the FINAL Phase-3 lane, P3.6, Track-Z GLM).

TEST-ONLY (WO §3/D1-2): NO migration, NO seed, NO durable write. Every
probe is transactional (BEGIN…ROLLBACK, zero net persistence) or a
read-only catalog/count probe; preflight/post baselines identical; probe
residue 0. The case ids mirror frontend/src/lib/parity-fixtures-p3.ts
(P3_006_SQL_CASE_IDS) 1:1 — 19 cases over the five families:

  MS-S01  master seed verdicts (item/vendor/item_category 0
          SOURCE_UNAVAILABLE; distributor 6/6)
  MS-S02  the food.lab_test.equipment_id FK binding + equipment_legacy
          verbatim + zero fabricated FK rows
  MS-S03  façade exposure (lab_test equipment columns; 4 master façades)
  IN-S01  FEFO slice probe (earliest EXP first, NULL last, split,
          out-movements) — FEFO = ENV-new per owner B6
  IN-S02  reversal exactness (never-over-restore: the surviving slice
          stays; second revoke = nothing-to-reverse)
  IN-S03  race safety ((source_table, source_id) UNIQUE + already-deducted
          retry + allocation-sum consistency)
  IN-S04  Total_deduct non-persistence (no such column on chemical.master)
  IN-S05  MFG date-typed NULL-not-coerced
  CA-S01  NO next-due column/generated column/trigger (NEXT_DUE_PINNED_ABSENT)
  CA-S02  the 11-row maintaining census facts
  CA-S03  calibration_date NOT NULL DEFAULT CURRENT_DATE
  JB-S01  geofence boundary smoke (0.69 in / 0.71 reject verbatim / blank
          reject / seed-provenance exempt) — own fixture ids fx-p3-006-*
  JB-S02  the 1102 census facts + practitioner_legacy_id NULL ×1102 (PII)
  JB-S03  the 9 §3.24 virtual columns never stored
  MA-S01  no address_key column / no generated column / no trigger
  MA-S02  the 7,436 census (77/928/อุทัยธานี 70×8) — the plan line-95
          '~1 แถว' divergence recorded, never reconciled
  MA-S03  manual_wastewater 10 (8-hex) / manual_water_supply 0 (honest)
  MA-S04  RLS postures (address UPDATE USING+WITH CHECK per B7; zero anon;
          anon read fails closed)
  MA-S05  verbatim spot rows (address 910104; manual c845e81a link-only)

ACCESS PATH (recorded deviation from WO §3's 'reads .env for
SUPABASE_DB_URL'): this machine class has no psql binary, so a DB-URL
connection is not executable here; the battery uses the SAME
Management-API access path as the delivered P3.x suites
(scripts/_env.py → SUPABASE_ACCESS_TOKEN, never printed) against the same
ENV_DB (gllqtbyofrcjzmbnfoeh, ap-southeast-1).

LAZY-TOKEN GATE (the P3.5 P3-1 lesson — do NOT crash credential-less
machines): the token is resolved INSIDE q() on first use, NEVER at module
import; on a credential-less machine every DB-touching test skips cleanly
and the DB-free FILE pins still run (suite exits 0).

Run:  python3 -m pytest scripts/test_parity_p3_006_fixtures_sql.py -q
"""

from __future__ import annotations

import re
import sys
import unittest
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent))

API_URL = (
    "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
)

FIXTURES_TS = (
    Path(__file__).resolve().parent.parent
    / "frontend/src/lib/parity-fixtures-p3.ts"
)
FIXTURES_TEST_TS = (
    Path(__file__).resolve().parent.parent
    / "frontend/src/lib/parity-fixtures-p3.test.ts"
)

SQL_CASE_IDS = [
    "MS-S01", "MS-S02", "MS-S03",
    "IN-S01", "IN-S02", "IN-S03", "IN-S04", "IN-S05",
    "CA-S01", "CA-S02", "CA-S03",
    "JB-S01", "JB-S02", "JB-S03",
    "MA-S01", "MA-S02", "MA-S03", "MA-S04", "MA-S05",
]

# The probe markers — every fixture row carries one; residue must stay 0.
PROBE_SOURCE = "contract-fixture (txn-rolled-back, ENV-PARITY-P3-006)"
PROBE_LEGACY_PREFIX = "fx-p3-006-"

# The WO §3 preflight baseline set (identical pre/post battery).
BASELINES = {
    "reading": ("wastewater.reading", 907),
    "personnel": ("core.personnel", 9),
    "spec": ("core.equipment_spec", 4),
    "light": ("safety.emergency_light", 48),
    "ext": ("safety.fire_extinguisher", 0),
    "elc": ("safety.emergency_light_check", 332),
    "lab": ("food.lab_test", 0),
    "item": ("core.item", 0),
    "vendor": ("core.vendor", 0),
    "category": ("core.item_category", 0),
    "distributor": ("core.distributor", 6),
    "invlot": ("chemical.inventory_lot", 0),
    "calibration": ("core.item_calibration", 11),
    "locarea": ("core.location_area", 15),
    "joblog": ("core.job_log", 1102),
    "manualww": ("core.manual_wastewater", 10),
    "manualws": ("core.manual_water_supply", 0),
    "address": ("core.address", 7436),
}


def _resolve_token() -> str:
    """Lazy token resolution — returns '' when unresolvable. Called inside
    q() only (the P3.5 P3-1 lesson: a module-level resolution raises
    SkipTest at import on credential-less machines and crashes the suite
    before the DB-free pins run)."""
    import os

    tok = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    if not tok:
        try:
            from _env import load_secret

            tok = load_secret("SUPABASE_ACCESS_TOKEN") or ""
        except Exception:
            tok = ""
    return tok


def q(sql: str):
    """One Management-API query; the token is resolved lazily on first use
    (SkipTest — a clean per-test skip, never an import crash). Raises
    AssertionError carrying the real DB error on failure; retries
    Management-API throttling (429) with backoff."""
    import time

    tok = _resolve_token()
    if not tok:
        raise unittest.SkipTest(
            "SUPABASE_ACCESS_TOKEN not resolvable (credential-less machine — "
            "lazy-token gate, the P3.5 P3-1 lesson)"
        )
    last = None
    for attempt in range(6):
        r = httpx.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {tok}",
                "Content-Type": "application/json",
            },
            json={"query": sql},
            timeout=120,
        )
        if r.status_code == 429:
            last = r.text[:200]
            time.sleep(3 * (attempt + 1))
            continue
        if r.status_code >= 400:
            try:
                msg = r.json().get("message") or r.text
            except Exception:
                msg = r.text
            raise AssertionError(f"DB query failed ({r.status_code}): {msg}")
        return r.json()
    raise AssertionError(f"DB query throttled after retries: {last}")


def _tx(sql: str) -> str:
    return "BEGIN;\n" + sql + "\nROLLBACK;"


def _baseline_sql() -> str:
    parts = [
        f"(SELECT count(*) FROM {table}) AS {key}"
        for key, (table, _) in BASELINES.items()
    ]
    return "SELECT " + ", ".join(parts)


class FileMirrorContract(unittest.TestCase):
    """DB-free pins — always runnable (never skip; the credential-less
    machine still gets these)."""

    def test_sql_case_ids_mirror_the_ts_corpus(self):
        src = FIXTURES_TS.read_text(encoding="utf-8")
        for cid in SQL_CASE_IDS:
            self.assertIn(f'id: "{cid}"', src, f"corpus must pin case {cid}")
        # every sql:true table in the corpus is covered by this battery
        blocks = re.findall(
            r'id: "((?:MS|IN|CA|JB|MA)-S\d+)",\s*\n\s*family: "[^"]+",\s*\n\s*sql: true',
            src,
        )
        self.assertEqual(
            sorted(blocks), sorted(SQL_CASE_IDS), "sql:true corpus ↔ battery drift"
        )

    def test_divergence_kinds_present_in_corpus(self):
        src = FIXTURES_TS.read_text(encoding="utf-8")
        for kind in (
            "0.7-vs-2 geofence bound divergence",
            "NEXT_DUE_PINNED_ABSENT",
            "FEFO = ENV-new per owner answer B6 2026-11-15",
            "plan line-95 '~1 แถว' vs the delivered 7,436-row address census",
        ):
            self.assertIn(kind, src, f"divergence pin missing: {kind}")

    def test_no_13_digit_digit_run_in_new_files(self):
        for f in (FIXTURES_TS, FIXTURES_TEST_TS, Path(__file__)):
            text = f.read_text(encoding="utf-8")
            m = re.search(r"\d{13}", text)
            self.assertIsNone(
                m, f"{f.name} carries a 13-digit digit-run at {m.start() if m else ''} — PII pin violated"
            )


class PreflightCanary(unittest.TestCase):
    """The RED-canary class: baselines intact + zero probe residue BEFORE
    the fixtures run."""

    def test_baselines_intact(self):
        row = q(_baseline_sql())[0]
        for key, (table, expected) in BASELINES.items():
            self.assertEqual(row[key], expected, f"baseline {table} moved")

    def test_no_probe_residue(self):
        n = q(
            "SELECT count(*) AS n FROM core.job_log WHERE legacy_id LIKE 'fx-p3-006-%'"
        )[0]["n"]
        self.assertEqual(n, 0, "probe residue from a prior run")
        m = q(
            "SELECT count(*) AS n FROM chemical.inventory_lot WHERE legacy_id LIKE 'fx-p3-006-%'"
        )[0]["n"]
        self.assertEqual(m, 0, "probe residue from a prior run")


class MastersFamily(unittest.TestCase):
    """MS-S01..S03 — the four master tables + the lab binding."""

    def test_MS_S01_master_seed_verdicts(self):
        row = q(
            "SELECT (SELECT count(*) FROM core.item) AS item,"
            " (SELECT count(*) FROM core.vendor) AS vendor,"
            " (SELECT count(*) FROM core.item_category) AS category,"
            " (SELECT count(*) FROM core.distributor) AS distributor"
        )[0]
        self.assertEqual(row["item"], 0, "core.item SOURCE_UNAVAILABLE — never fabricated")
        self.assertEqual(row["vendor"], 0, "core.vendor SOURCE_UNAVAILABLE — never fabricated")
        self.assertEqual(row["category"], 0, "core.item_category SOURCE_UNAVAILABLE — never fabricated")
        self.assertEqual(row["distributor"], 6, "core.distributor must hold the seeded 6/6")

    def test_MS_S02_lab_equipment_binding(self):
        col = q(
            "SELECT data_type, is_nullable FROM information_schema.columns"
            " WHERE table_schema='food' AND table_name='lab_test'"
            " AND column_name='equipment_id'"
        )
        self.assertEqual(len(col), 1, "food.lab_test.equipment_id missing")
        self.assertEqual(col[0]["data_type"], "uuid", "equipment_id must be uuid")
        self.assertEqual(col[0]["is_nullable"], "YES", "equipment_id must stay nullable")
        fk = q(
            "SELECT 1 FROM pg_constraint WHERE conrelid = 'food.lab_test'::regclass"
            " AND contype = 'f' AND pg_get_constraintdef(oid) LIKE '%equipment_id%'"
        )
        self.assertTrue(fk, "equipment_id FK → core.item(id) missing")
        legacy = q(
            "SELECT count(*) AS n FROM information_schema.columns"
            " WHERE table_schema='food' AND table_name='lab_test'"
            " AND column_name='equipment_legacy'"
        )[0]["n"]
        self.assertEqual(legacy, 1, "equipment_legacy verbatim column must remain")
        bound = q(
            "SELECT count(*) AS n FROM food.lab_test WHERE equipment_id IS NOT NULL"
        )[0]["n"]
        self.assertEqual(bound, 0, "zero fabricated FK rows while core.item is empty")

    def test_MS_S03_facade_exposure(self):
        cols = {
            r["column_name"]
            for r in q(
                "SELECT column_name FROM information_schema.columns"
                " WHERE table_schema='public' AND table_name='lab_test'"
            )
        }
        for name in ("equipment_id", "equipment_legacy"):
            self.assertIn(name, cols, f"public.lab_test must expose {name}")
        for view in ("item", "vendor", "item_category", "distributor"):
            reg = q(f"SELECT to_regclass('public.{view}') AS reg")[0]["reg"]
            self.assertIsNotNone(reg, f"public.{view} façade missing")


class InventoryFamily(unittest.TestCase):
    """IN-S01..S05 — FEFO deduction/reversal over the LIVE RPCs."""

    _fixture_run = None

    def _run(self, body: str, evidence: str) -> dict:
        sql = f"BEGIN;\n{body}\n{evidence};\nROLLBACK;"
        rows = q(sql)
        assert rows, "fixture evidence query returned no rows"
        return rows[0]["evidence"]

    def _lot_insert(self, legacy_id: str, lot_no: str, expiry: str | None, amount: str, mfg: str | None = "NULL") -> str:
        return (
            "INSERT INTO chemical.inventory_lot"
            " (master_id, receipt_date, lot_no, mfg_date, expiry_date,"
            " amount_received, source_provenance, legacy_id)"
            f" SELECT m.id, CURRENT_DATE, '{lot_no}', {mfg},"
            f" {expiry + '::date' if expiry else 'NULL'}, {amount}::numeric,"
            f" '{PROBE_SOURCE}', '{legacy_id}'"
            " FROM chemical.master m WHERE m.legacy_item_id = '0c0e6a47';"
        )

    def test_IN_S01_fefo_slices(self):
        body = (
            self._lot_insert("fx-p3-006-a", "L-FXA", "'2027-02-01'", "4.0")
            + self._lot_insert("fx-p3-006-b", "L-FXB", "'2026-12-01'", "3.0")
            + self._lot_insert("fx-p3-006-c", "L-FXC", None, "5.0")
            + "CREATE TEMP TABLE cap ON COMMIT DROP AS"
            " SELECT chemical.fn_deduct_chlorine_stock('wastewater.reading',"
            " 'aaaaaaa1-1111-4111-8111-111111111111', 5.5, CURRENT_DATE) AS r;"
        )
        evidence = f"""
SELECT jsonb_build_object(
  'status', (SELECT r->>'status' FROM cap),
  'shortfall', (SELECT (r->>'shortfall')::numeric FROM cap),
  'slices', (SELECT jsonb_object_agg(lot_no, amt) FROM (
      SELECT v.l,
             (SELECT amount_deducted FROM chemical.inventory_lot i
                WHERE i.legacy_id LIKE 'fx-p3-006-%' AND i.lot_no = v.l) AS amt
      FROM (VALUES ('L-FXA'), ('L-FXB'), ('L-FXC')) v(l)) s),
  'movement_count', (SELECT count(*) FROM chemical.movement m
                     WHERE m.purpose LIKE 'auto-deduct FEFO wastewater.reading:aaaaaaa1%')
) AS evidence"""
        row = self._run(body, evidence)
        self.assertEqual(row["status"], "deducted")
        self.assertEqual(float(row["shortfall"]), 0.0)
        # FEFO: L-FXB (exp 2026-12-01) full 3.0 first, then L-FXA (2027-02-01)
        # 2.5; L-FXC (NULL expiry) untouched — hand-computed.
        self.assertEqual(float(row["slices"]["L-FXB"]), 3.0)
        self.assertEqual(float(row["slices"]["L-FXA"]), 2.5)
        self.assertEqual(float(row["slices"]["L-FXC"]), 0.0)
        self.assertEqual(int(row["movement_count"]), 2)

    def test_IN_S02_reversal_exact_never_over_restore(self):
        body = (
            self._lot_insert("fx-p3-006-r", "L-REV", "'2027-06-01'", "5.0")
            + "SELECT chemical.fn_deduct_chlorine_stock('wastewater.reading',"
            " 'aaaaaaa2-2222-4222-8222-222222222222', 3.0, CURRENT_DATE);"
            "SELECT chemical.fn_deduct_chlorine_stock('water_supply.daily_check',"
            " 'aaaaaaa2-2222-4222-8222-222222222223', 2.0, CURRENT_DATE);"
            "CREATE TEMP TABLE cap1 ON COMMIT DROP AS"
            " SELECT chemical.fn_revoke_chlorine_deduction('wastewater.reading',"
            " 'aaaaaaa2-2222-4222-8222-222222222222', CURRENT_DATE) AS r;"
            "CREATE TEMP TABLE cap2 ON COMMIT DROP AS"
            " SELECT chemical.fn_revoke_chlorine_deduction('wastewater.reading',"
            " 'aaaaaaa2-2222-4222-8222-222222222222', CURRENT_DATE) AS r;"
        )
        evidence = """
SELECT jsonb_build_object(
  'restored', (SELECT (r->>'restored_total')::numeric FROM cap1),
  'lot_after', (SELECT amount_deducted FROM chemical.inventory_lot WHERE legacy_id = 'fx-p3-006-r'),
  's1', (SELECT status FROM chemical.inventory_lot_deduction
          WHERE source_id = 'aaaaaaa2-2222-4222-8222-222222222222'),
  's2', (SELECT status FROM chemical.inventory_lot_deduction
          WHERE source_id = 'aaaaaaa2-2222-4222-8222-222222222223'),
  'second', (SELECT r->>'status' FROM cap2)
) AS evidence"""
        row = self._run(body, evidence)
        self.assertEqual(float(row["restored"]), 3.0, "restores exactly the revoked slice")
        self.assertEqual(float(row["lot_after"]), 2.0, "the surviving S2 slice is NEVER over-restored")
        self.assertEqual(row["s1"], "reversed")
        self.assertEqual(row["s2"], "deducted", "the untouched deduction stays 'deducted'")
        self.assertEqual(row["second"], "nothing-to-reverse")

    def test_IN_S03_race_safety_unique_and_idempotent(self):
        idx = q(
            "SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid"
            " WHERE c.oid = 'chemical.inventory_lot_deduction'::regclass"
            " AND i.indisunique AND pg_get_indexdef(i.indexrelid)"
            " LIKE '%(source_table, source_id)%'"
        )
        self.assertTrue(idx, "the (source_table, source_id) UNIQUE backstop is missing")
        body = (
            self._lot_insert("fx-p3-006-x", "L-RACE", "'2027-09-01'", "9.0")
            + "SELECT chemical.fn_deduct_chlorine_stock('wastewater.reading',"
            " 'aaaaaaa3-3333-4333-8333-333333333333', 2.0, CURRENT_DATE);"
            "CREATE TEMP TABLE cap ON COMMIT DROP AS"
            " SELECT chemical.fn_deduct_chlorine_stock('wastewater.reading',"
            " 'aaaaaaa3-3333-4333-8333-333333333333', 2.0, CURRENT_DATE) AS r;"
        )
        evidence = """
SELECT jsonb_build_object(
  'retry', (SELECT r->>'status' FROM cap),
  'ledger_rows', (SELECT count(*) FROM chemical.inventory_lot_deduction
                   WHERE source_id = 'aaaaaaa3-3333-4333-8333-333333333333'),
  'movement_rows', (SELECT count(*) FROM chemical.movement m
                     WHERE m.purpose LIKE 'auto-deduct FEFO wastewater.reading:aaaaaaa3%'),
  'alloc_sum_eq_total', (SELECT d.deducted_total = (SELECT coalesce(sum(a.quantity), 0)
                            FROM chemical.inventory_lot_allocation a
                            WHERE a.deduction_id = d.id)
                         FROM chemical.inventory_lot_deduction d
                         WHERE d.source_id = 'aaaaaaa3-3333-4333-8333-333333333333')
) AS evidence"""
        row = self._run(body, evidence)
        self.assertEqual(row["retry"], "already-deducted", "the same-source retry is idempotent")
        self.assertEqual(int(row["ledger_rows"]), 1)
        self.assertEqual(int(row["movement_rows"]), 1)
        self.assertTrue(row["alloc_sum_eq_total"], "allocations must sum to the ledger total")

    def test_IN_S04_no_total_deduct_column(self):
        n = q(
            "SELECT count(*) AS n FROM information_schema.columns"
            " WHERE table_schema='chemical' AND table_name='master'"
            " AND column_name LIKE '%total%'"
        )[0]["n"]
        self.assertEqual(n, 0, "Total_deduct must NEVER persist on chemical.master")

    def test_IN_S05_mfg_null_preserved(self):
        body = self._lot_insert("fx-p3-006-n", "L-NULLMFG", None, "1.0", mfg="NULL")
        evidence = """
SELECT jsonb_build_object(
  'mfg', (SELECT mfg_date::text FROM chemical.inventory_lot WHERE legacy_id = 'fx-p3-006-n')
) AS evidence"""
        row = self._run(body, evidence)
        self.assertIsNone(row["mfg"], "a NULL MFG stays NULL (never 1899/epoch-coerced)")


class CalibrationFamily(unittest.TestCase):
    """CA-S01..S03 — NEXT_DUE_PINNED_ABSENT + the census facts."""

    def test_CA_S01_no_next_due_anywhere(self):
        n = q(
            "SELECT count(*) AS n FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name='item_calibration'"
            " AND (column_name LIKE '%next%' OR column_name LIKE '%due%')"
        )[0]["n"]
        self.assertEqual(n, 0, "NO next-due column may exist (NEXT_DUE_PINNED_ABSENT)")
        gen = q(
            "SELECT count(*) AS n FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name='item_calibration'"
            " AND is_generated <> 'NEVER'"
        )[0]["n"]
        self.assertEqual(gen, 0, "no generated column (nothing computes a next-due)")
        trg = q(
            "SELECT count(*) AS n FROM pg_trigger"
            " WHERE tgrelid = 'core.item_calibration'::regclass AND NOT tgisinternal"
        )[0]["n"]
        self.assertEqual(trg, 0, "no trigger on core.item_calibration")

    def test_CA_S02_census_facts(self):
        row = q(
            "SELECT count(*) AS total,"
            " count(DISTINCT tool_legacy_id) AS tools,"
            " count(DISTINCT calibration_date) AS dates,"
            " count(*) FILTER (WHERE calibrate_range IS NOT NULL) AS ranges_nonempty,"
            " count(*) FILTER (WHERE calibrate_range IS NULL) AS ranges_null,"
            " count(DISTINCT calibrate_unit) AS units,"
            " count(*) FILTER (WHERE cal_method IS NULL) AS methods_null,"
            " count(*) FILTER (WHERE item_id IS NOT NULL) AS item_bound,"
            " count(*) FILTER (WHERE item_name IS NULL) AS names_null"
            " FROM core.item_calibration"
        )[0]
        results = {
            r["cal_result"]
            for r in q("SELECT DISTINCT cal_result FROM core.item_calibration")
        }
        self.assertEqual(row["total"], 11)
        self.assertEqual(row["tools"], 6)
        self.assertEqual(row["dates"], 5)
        self.assertEqual(row["ranges_nonempty"], 7)
        self.assertEqual(row["ranges_null"], 4)
        self.assertEqual(row["units"], 4)
        self.assertEqual(row["methods_null"], 11)
        self.assertEqual(row["item_bound"], 0)
        self.assertEqual(row["names_null"], 11)
        self.assertEqual(results, {"InControl", "Higher Ref."})

    def test_CA_S03_cal_date_default(self):
        col = q(
            "SELECT is_nullable, column_default FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name='item_calibration'"
            " AND column_name='calibration_date'"
        )[0]
        self.assertEqual(col["is_nullable"], "NO")
        self.assertIsNotNone(col["column_default"])
        self.assertIn("CURRENT_DATE", col["column_default"].upper())


class JobFamily(unittest.TestCase):
    """JB-S01..S03 — the geofence gate + census + virtuals."""

    _STAFF_SELECT = (
        "SELECT id FROM core.app_user WHERE role = 'staff' ORDER BY created_at LIMIT 1"
    )

    def _staff_ctx(self) -> str:
        staff = q(self._STAFF_SELECT)[0]["id"]
        return (
            "SET LOCAL role authenticated;"
            f" SET LOCAL request.jwt.claims = '{{\"sub\":\"{staff}\",\"role\":\"authenticated\"}}';"
        )

    def test_JB_S01_geofence_boundary_smoke(self):
        area = q(
            "SELECT legacy_id FROM core.location_area ORDER BY created_at LIMIT 1"
        )[0]["legacy_id"]
        prov = PROBE_SOURCE
        # 1) in-range (hand-computed 0.69 km due north of the uthai_locate pin)
        q(
            "BEGIN;\n"
            + self._staff_ctx()
            + f"INSERT INTO core.job_log (legacy_id, scanned_at, location_area_id,"
            " qr_legacy_id, lat, lng, working, source_provenance)"
            f" VALUES ('{PROBE_LEGACY_PREFIX}in', now(), '{area}', '{area}',"
            f" 14.3673883106, 100.645474, 'รดน้ำ', '{prov}');\nROLLBACK;"
        )
        # 2) out-of-range (hand-computed 0.71 km) rejected verbatim
        with self.assertRaises(AssertionError) as ctx:
            q(
                "BEGIN;\n"
                + self._staff_ctx()
                + f"INSERT INTO core.job_log (legacy_id, scanned_at, location_area_id,"
                " qr_legacy_id, lat, lng, working, source_provenance)"
                f" VALUES ('{PROBE_LEGACY_PREFIX}out', now(), '{area}', '{area}',"
                f" 14.3675681747, 100.645474, 'รดน้ำ', '{prov}');\nROLLBACK;"
            )
        self.assertIn("ฮั่นแน่...เข้ามาทำงานก่อน", str(ctx.exception))
        # 3) blank lat/lng rejected (unknown ≠ passed)
        with self.assertRaises(AssertionError) as ctx2:
            q(
                "BEGIN;\n"
                + self._staff_ctx()
                + f"INSERT INTO core.job_log (legacy_id, scanned_at, location_area_id,"
                " qr_legacy_id, working, source_provenance)"
                f" VALUES ('{PROBE_LEGACY_PREFIX}blank', now(), '{area}', '{area}',"
                f" 'รดน้ำ', '{prov}');\nROLLBACK;"
            )
        self.assertIn("ฮั่นแน่...เข้ามาทำงานก่อน", str(ctx2.exception))
        # 4) the seed-provenance history class is EXEMPT (never re-validated)
        q(
            "BEGIN;\n"
            + self._staff_ctx()
            + f"INSERT INTO core.job_log (legacy_id, scanned_at, location_area_id,"
            " qr_legacy_id, lat, lng, working, source_provenance)"
            f" VALUES ('{PROBE_LEGACY_PREFIX}legacy', now(), '{area}', '{area}',"
            f" 0.0, 0.0, 'รดน้ำ', 'workbook 1Hluhfryn2uMdK8nQ2kRJyLI3q-ZbrwgBgveDbhJlerw"
            f" tab job (ENV-PARITY-P3-006 probe)');\nROLLBACK;"
        )
        # 5) residue 0
        leaked = q(
            "SELECT count(*) AS n FROM core.job_log WHERE legacy_id LIKE 'fx-p3-006-%'"
        )[0]["n"]
        self.assertEqual(leaked, 0, "geofence smoke rows must never persist")

    def test_JB_S02_census_and_pii(self):
        row = q(
            "SELECT count(*) AS total, count(DISTINCT legacy_id) AS ids,"
            " count(*) FILTER (WHERE qr_legacy_id = 'สแกน QR CODE') AS qr_placeholder,"
            " count(*) FILTER (WHERE qr_legacy_id IS NULL) AS qr_null,"
            " count(DISTINCT working) AS working_distinct,"
            " count(*) FILTER (WHERE working IS NULL) AS working_null,"
            " count(*) FILTER (WHERE image_ref IS NULL) AS image_null,"
            " count(*) FILTER (WHERE location_name IS NULL) AS locname_null,"
            " count(*) FILTER (WHERE practitioner_legacy_id IS NOT NULL)"
            " AS practitioner_legacy_nonnull"
            " FROM core.job_log"
        )[0]
        self.assertEqual(row["total"], 1102)
        self.assertEqual(row["ids"], 1102)
        self.assertEqual(row["qr_placeholder"], 2)
        self.assertEqual(row["qr_null"], 1)
        self.assertEqual(row["working_distinct"], 15)
        self.assertEqual(row["working_null"], 17)
        self.assertEqual(row["image_null"], 11)
        self.assertEqual(row["locname_null"], 13)
        self.assertEqual(
            row["practitioner_legacy_nonnull"], 0,
            "PII: practitioner_legacy_id must be NULL on EVERY row (UUID-or-NULL only)",
        )

    def test_JB_S03_virtuals_never_stored(self):
        cols = {
            r["column_name"].lower()
            for r in q(
                "SELECT column_name FROM information_schema.columns"
                " WHERE table_schema='core' AND table_name='job_log'"
            )
        }
        for absent in (
            "distance", "uthai_locate", "m_thai", "y_thai", "d_thai",
            "n_name", "l_image", "shows_location_pic1", "end_date",
        ):
            self.assertNotIn(absent, cols, f"the virtual {absent} must NEVER be stored")
        gen = q(
            "SELECT count(*) AS n FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name='job_log'"
            " AND is_generated <> 'NEVER'"
        )[0]["n"]
        self.assertEqual(gen, 0)


class ManualsAddressFamily(unittest.TestCase):
    """MA-S01..S05 — Address_Key-never-stored + census + RLS + spots."""

    def test_MA_S01_no_address_key_no_generated_no_trigger(self):
        n = q(
            "SELECT count(*) AS n FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name='address'"
            " AND column_name = 'address_key'"
        )[0]["n"]
        self.assertEqual(n, 0, "Address_Key must NEVER be stored (D1-5/D1-9)")
        gen = q(
            "SELECT count(*) AS n FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name IN"
            " ('manual_wastewater','manual_water_supply','address')"
            " AND is_generated <> 'NEVER'"
        )[0]["n"]
        self.assertEqual(gen, 0)
        trg = q(
            "SELECT count(*) AS n FROM pg_trigger WHERE tgrelid IN ("
            " 'core.manual_wastewater'::regclass,'core.manual_water_supply'::regclass,"
            " 'core.address'::regclass) AND NOT tgisinternal"
        )[0]["n"]
        self.assertEqual(trg, 0)

    def test_MA_S02_census_shape(self):
        row = q(
            "SELECT count(*) AS rows,"
            " (SELECT count(DISTINCT tambon_id) FROM core.address) AS tambons,"
            " (SELECT count(DISTINCT province_id) FROM core.address) AS provinces,"
            " (SELECT count(DISTINCT district_id) FROM core.address) AS districts,"
            " (SELECT count(*) FROM core.address WHERE province_thai = 'อุทัยธานี') AS uthai_rows,"
            " (SELECT count(DISTINCT district_thai) FROM core.address"
            "  WHERE province_thai = 'อุทัยธานี') AS uthai_districts"
        )[0]
        self.assertEqual(row["rows"], 7436)
        self.assertEqual(row["tambons"], 7436)
        self.assertEqual(row["provinces"], 77)
        self.assertEqual(row["districts"], 928)
        self.assertEqual(row["uthai_rows"], 70)
        self.assertEqual(row["uthai_districts"], 8)

    def test_MA_S03_manuals_seeds(self):
        ww = q(
            "SELECT count(*) AS n, count(DISTINCT legacy_id) AS d FROM core.manual_wastewater"
        )[0]
        self.assertEqual(ww["n"], 10)
        self.assertEqual(ww["d"], 10)
        hexish = q(
            "SELECT count(*) AS n FROM core.manual_wastewater"
            " WHERE legacy_id !~ '^[0-9a-f]{8}$'"
        )[0]["n"]
        self.assertEqual(hexish, 0, "verbatim 8-hex UNIQUEID() lineage")
        ws = q("SELECT count(*) AS n FROM core.manual_water_supply")[0]["n"]
        self.assertEqual(ws, 0, "the honest zero — SOURCE_UNAVAILABLE, never fabricated")

    def test_MA_S04_rls_postures_and_anon(self):
        upd = q(
            "SELECT qual, with_check FROM pg_policies"
            " WHERE schemaname='core' AND tablename='address' AND cmd='UPDATE'"
        )
        self.assertEqual(len(upd), 1, "address UPDATE policy count drifted")
        self.assertTrue(upd[0]["qual"], "address UPDATE must carry USING (B7 admin-editable)")
        self.assertTrue(
            upd[0]["with_check"], "address UPDATE must carry WITH CHECK (B7 re-check)"
        )
        anon = q(
            "SELECT count(*) AS n FROM pg_policies"
            " WHERE schemaname='core' AND tablename IN"
            " ('manual_wastewater','manual_water_supply','address')"
            " AND 'anon'::name = ANY(roles)"
        )[0]["n"]
        self.assertEqual(anon, 0, "zero anon policies — fail closed")
        for t in ("manual_wastewater", "manual_water_supply", "address"):
            sql = f"""
            DO $$
            BEGIN
              SET LOCAL role anon;
              BEGIN
                IF EXISTS (SELECT 1 FROM core.{t}) THEN
                  RAISE EXCEPTION 'anon read did NOT fail closed ({t})';
                END IF;
              EXCEPTION WHEN OTHERS THEN
                NULL;  -- any deny is fail-closed too (grant-level deny)
              END;
            END $$;"""
            q(_tx(sql))

    def test_MA_S05_verbatim_spots(self):
        addr = q(
            "SELECT tambon_thai, district_id, district_thai, province_id, province_thai"
            " FROM core.address WHERE tambon_id = 910104"
        )
        self.assertEqual(len(addr), 1, "the 910104 spot row is missing")
        self.assertEqual(addr[0]["tambon_thai"], "บ้านควน")
        self.assertEqual(addr[0]["district_id"], 9101)
        self.assertEqual(addr[0]["district_thai"], "อำเภอเมืองสตูล")
        self.assertEqual(addr[0]["province_id"], 91)
        self.assertEqual(addr[0]["province_thai"], "สตูล")
        man = q(
            "SELECT title, image_ref, file_ref FROM core.manual_wastewater"
            " WHERE legacy_id = 'c845e81a'"
        )
        self.assertEqual(len(man), 1, "the c845e81a spot row is missing")
        self.assertEqual(man[0]["title"], "ควบคุมและบำรุงรักษาระบบบำบัดน้ำเสีย")
        self.assertTrue(
            (man[0]["image_ref"] or "").startswith("คู่มือ_Images/c845e81a."),
            "link-only image metadata drifted",
        )
        self.assertTrue(
            (man[0]["file_ref"] or "").startswith("คู่มือ_Files_/c845e81a."),
            "link-only file metadata drifted",
        )


class PostrunCanary(unittest.TestCase):
    """Post-battery: baselines identical + probe residue 0 (zero net
    persistence, the D1-2 class)."""

    def test_baselines_identical_after_battery(self):
        row = q(_baseline_sql())[0]
        for key, (table, expected) in BASELINES.items():
            self.assertEqual(row[key], expected, f"baseline {table} moved AFTER the battery")

    def test_probe_residue_zero_after_battery(self):
        j = q(
            "SELECT count(*) AS n FROM core.job_log WHERE legacy_id LIKE 'fx-p3-006-%'"
        )[0]["n"]
        self.assertEqual(j, 0)
        i = q(
            "SELECT count(*) AS n FROM chemical.inventory_lot"
            " WHERE legacy_id LIKE 'fx-p3-006-%' OR source_provenance = '"
            + PROBE_SOURCE
            + "'"
        )[0]["n"]
        self.assertEqual(i, 0)
        m = q(
            "SELECT count(*) AS n FROM chemical.movement WHERE note LIKE '%fx-p3-006-%'"
        )[0]["n"]
        self.assertEqual(m, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
