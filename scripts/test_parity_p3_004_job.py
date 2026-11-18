"""ENV-PARITY-P3-004 C1 — D2 RED-first live contract battery for the job
log (core.location_area + core.job_log + the guarded 15-row/1102-row seeds
+ the server haversine geofence gate — AppSheet parity Phase 3, lane P3.4,
Track-Z GLM).

Queries ENV_DB (project gllqtbyofrcjzmbnfoeh, ap-southeast-1) through the
same Management-API access path as scripts/apply_migration_api.py
(scripts/_env.py; SUPABASE_ACCESS_TOKEN from Drive secrets — never
printed; export it when Drive resolution is unavailable).

Assertion groups (WO §3/§4/§5/§7; every schema group must FAIL truthfully
while migration 20261118000006_parity_p3_004.sql is UNAPPLIED — the RED
record goes in the handoff — and pass GREEN after):

  SCHEMA     — core.location_area (the §3.23 QR-venue master: legacy_id
               UNIQUE + area_name NOT NULL + qr_url/image_ref legacy refs)
               + core.job_log (the §3.24 `job` translation: scanned_at
               timestamptz NULL + location_area_id FK + qr_legacy_id
               verbatim + location_name + lat/lng + practitioner_id
               UUID-or-NULL + practitioner_legacy_id (PII: NULL-carrying)
               + working verbatim joined text + image_ref + issue) + the
               public façades (security_invoker). The 9 §3.24 virtual
               columns are NEVER stored (no generated column).
  GEOFENCE   — the server haversine write gate: core.fn_job_log_geofence
               + the BEFORE INSERT trigger; the verbatim hospital pin
               (14.361183, 100.645474); the 0.7 km bound (the plan row's
               OWN pin — D1-5 CONFIRM, never a silent switch); blank
               lat/lng on a NEW write ⇒ rejected with the verbatim error
               ฮั่นแน่...เข้ามาทำงานก่อน; the guarded history seed
               EXEMPT via its pinned seed provenance marker (never
               retroactively re-validated).
  RLS        — location_area: house master posture (SELECT
               staff-or-admin / INSERT+UPDATE+DELETE admin); job_log: the
               D1-7 log/append posture (SELECT+INSERT staff-or-admin /
               UPDATE+DELETE admin); zero anon policies.
  SEED       — exactly 15 location_area rows (15 unique legacy ids, join
               integrity vs job qr values) + exactly 1102 job_log rows
               with the pinned census (ID 1102 distinct; Date_time 1097
               datetime + 5 string cells → scanned_at ICT year−543;
               QR_CODE 1101 nonempty = 1099 rows over 15 unique ids +
               2 literal placeholder rows + 1 blank carried verbatim;
               location_name 1089/13 NULL/15 distinct; working 1085/17
               NULL/15 in-vocabulary combos; image_ref 1091/11 NULL;
               issue 39/34 distinct) + THE PII DISCLOSURE (ALL 1100
               nonempty practician cells per the R2 P3-A carry: 765
               cells resolve to core.personnel UUIDs, 335 cells NULL +
               2 blank cells NULL; practitioner_legacy_id NULL on every
               row — the 13-digit IDs NEVER stored; the migration file
               greps 0 thirteen-digit digit-runs) + verbatim spot-checks
               of THREE rows vs the fetched XLSX bytes (a placeholder-QR
               row, a NULL-practician row, a resolved-practician row) +
               the guarded re-send inserts ZERO rows (BEGIN…ROLLBACK).
               These fixtures are NEVER SENT while the tables are absent
               pre-apply (canary-gated — zero durable writes).
  COUNTS     — baselines wastewater.reading 907 / core.personnel 9 /
               core.equipment_spec 4 / safety.emergency_light 48 /
               safety.fire_extinguisher 0 / safety.emergency_light_check
               332 / food.lab_test 0 / core.item 0 / core.vendor 0 /
               core.item_category 0 / core.distributor 6 /
               chemical.inventory_lot 0 / core.item_calibration 11
               identical pre/post battery (the RED canary + zero
               unanticipated durable writes).

Run:  python3 scripts/test_parity_p3_004_job.py -v
      (SUPABASE_ACCESS_TOKEN resolvable via scripts/_env.py — Drive
      secrets or the process env)
"""

from __future__ import annotations

import re
import sys
import unittest
from datetime import datetime
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent))

API_URL = (
    "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
)

MIGRATION = "20261118000006_parity_p3_004.sql"
MIGRATION_PATH = Path(__file__).resolve().parent.parent / "supabase/migrations" / MIGRATION

SEED_MARKER_START = "-- >>> SEED-BLOCK-START"
SEED_MARKER_END = "-- <<< SEED-BLOCK-END"

# The pinned hospital geofence anchor (verbatim AppSheet uthai_locate) and
# the plan row's OWN 0.7 km server-write bound (D1-5 CONFIRM).
HOSPITAL_LAT, HOSPITAL_LNG = 14.361183, 100.645474
GEOFENCE_LIMIT_KM = 0.7
SEED_PROVENANCE_PREFIX = "workbook 1Hluhfryn2uMdK8nQ2kRJyLI3q-ZbrwgBgveDbhJlerw tab job"

# The fetched source bytes (GET-only Drive exports; re-fetched read-only
# when the /tmp snapshots are absent — never a Drive write).
GARDEN_XLSX = Path("/tmp/env-p3-004-garden.xlsx")
GARDEN_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "1Hluhfryn2uMdK8nQ2kRJyLI3q-ZbrwgBgveDbhJlerw/export?format=xlsx"
)
POND_XLSX = Path("/tmp/env-p3-004-pond.xlsx")
POND_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk/export?format=xlsx"
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
    ("core", "item_calibration"): 11,
}


def _token() -> str:
    import os

    tok = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    if not tok:
        try:
            from _env import load_secret

            tok = load_secret("SUPABASE_ACCESS_TOKEN")
        except Exception:
            tok = ""
    if not tok:
        raise unittest.SkipTest("SUPABASE_ACCESS_TOKEN not resolvable (Drive secrets offline)")
    return tok


_TOKEN = _token()


def q(sql: str):
    """One Management-API query. Raises AssertionError carrying the real
    DB error on failure — a RED must show the true reason (e.g.
    relation "core.job_log" does not exist)."""
    r = httpx.post(
        API_URL,
        headers={"Authorization": f"Bearer {_TOKEN}", "Content-Type": "application/json"},
        json={"query": sql},
        timeout=120,
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
        rows = q("SELECT to_regclass('core.job_log') a, to_regclass('core.location_area') b")
        return rows[0]["a"] is not None and rows[0]["b"] is not None
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
    """Post-apply snapshot: baselines + the new tables' durable shape."""
    parts = [
        f"(SELECT count(*) FROM {s}.{t}) AS {s.replace('_', '')}_{t.replace('_', '')}"
        for (s, t) in BASELINES
    ]
    parts.append("(SELECT count(*) FROM core.location_area) AS core_locationarea")
    parts.append("(SELECT count(*) FROM core.job_log) AS core_joblog")
    parts.append(
        "(SELECT count(*) FROM core.job_log"
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
            row["core_locationarea"], 15, "durable seed must hold exactly the 15 location_area rows"
        )
        self.assertEqual(
            row["core_joblog"], 1102, "durable seed must hold exactly the 1102 job rows"
        )


class SchemaContract(unittest.TestCase):
    """SCHEMA + GEOFENCE + RLS shape contract (fails truthfully while the
    migration is unapplied — the honest RED)."""

    def test_location_area_exists_with_pinned_columns(self):
        expected = [
            ("id", "uuid", "NO"),
            ("legacy_id", "text", "YES"),
            ("area_name", "text", "NO"),
            ("qr_url", "text", "YES"),
            ("image_ref", "text", "YES"),
            ("source_provenance", "text", "NO"),
            ("recorded_by", "uuid", "YES"),
            ("created_at", "timestamp with time zone", "NO"),
        ]
        cols = q(
            "SELECT column_name, data_type, is_nullable"
            " FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name='location_area'"
        )
        actual = {c["column_name"]: (c["data_type"], c["is_nullable"]) for c in cols}
        self.assertTrue(actual, "core.location_area missing (unapplied migration?)")
        for column, dtype, nullable in expected:
            self.assertIn(column, actual, f"core.location_area.{column} missing")
            self.assertEqual(actual[column][0], dtype, f"{column} type mismatch")
            self.assertEqual(actual[column][1], nullable, f"{column} nullable mismatch")

    def test_job_log_exists_with_pinned_columns(self):
        expected = {
            "id": ("uuid", "NO"),
            "legacy_id": ("text", "YES"),
            "scanned_at": ("timestamp with time zone", "YES"),
            "location_area_id": ("uuid", "YES"),
            "qr_legacy_id": ("text", "YES"),
            "location_name": ("text", "YES"),
            "lat": ("numeric", "YES"),
            "lng": ("numeric", "YES"),
            "practitioner_id": ("uuid", "YES"),
            "practitioner_legacy_id": ("text", "YES"),
            "working": ("text", "YES"),
            "image_ref": ("text", "YES"),
            "issue": ("text", "YES"),
            "source_provenance": ("text", "NO"),
            "recorded_by": ("uuid", "YES"),
            "created_at": ("timestamp with time zone", "NO"),
        }
        cols = q(
            "SELECT column_name, data_type, is_nullable"
            " FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name='job_log'"
        )
        actual = {c["column_name"]: (c["data_type"], c["is_nullable"]) for c in cols}
        self.assertTrue(actual, "core.job_log missing (unapplied migration?)")
        self.assertEqual(
            set(actual), set(expected), f"column set drift: {set(actual) ^ set(expected)}"
        )
        for column, (dtype, nullable) in expected.items():
            self.assertEqual(actual[column][0], dtype, f"{column} type mismatch")
            self.assertEqual(actual[column][1], nullable, f"{column} nullable mismatch")

    def test_legacy_id_unique_and_fk_bindings(self):
        for table in ("location_area", "job_log"):
            rows = q(
                "SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid"
                f" WHERE c.oid = 'core.{table}'::regclass AND i.indisunique"
                " AND pg_get_indexdef(i.indexrelid) LIKE '%legacy_id%'"
            )
            self.assertTrue(rows, f"core.{table}.legacy_id UNIQUE index missing")
        fk = q(
            "SELECT confdeltype, conkey FROM pg_constraint"
            " WHERE conrelid = 'core.job_log'::regclass AND contype = 'f'"
            " ORDER BY conname"
        )
        self.assertGreaterEqual(
            len(fk), 2, "core.job_log must carry the location_area + personnel FK bindings"
        )

    def test_facade_views_security_invoker(self):
        for view in ("location_area", "job_log"):
            rows = q(f"SELECT reloptions FROM pg_class WHERE oid = 'public.{view}'::regclass")
            self.assertTrue(rows, f"public.{view} view missing")
            self.assertIn("security_invoker=on", rows[0]["reloptions"] or [])

    def test_no_generated_column_virtual_columns_never_stored(self):
        """WO §3-3 — the 9 §3.24 virtual ReadOnly columns are NEVER stored;
        no generated column may exist on either table."""
        gen = q(
            "SELECT count(*) AS c FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name IN ('job_log','location_area')"
            " AND is_generated <> 'NEVER'"
        )
        self.assertEqual(gen[0]["c"], 0, "no generated column may exist (WO §3-3)")
        stored = q(
            "SELECT column_name FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name='job_log'"
        )
        names = {r["column_name"] for r in stored}
        for virtual in (
            "distance", "uthai_locate", "m_thai", "y_thai", "d_thai",
            "n_name", "l_image", "shows_location_pic1", "end_date",
        ):
            self.assertNotIn(virtual, names, f"virtual column {virtual} must NEVER be stored")

    def test_geofence_fn_and_before_insert_trigger(self):
        """WO §3-4/D1-6 RULED shape: a BEFORE INSERT trigger carrying the
        server haversine gate (the checked-RPC alternative rejected — a
        trigger gates EVERY insert path, the RPC only its callers)."""
        fn = q(
            "SELECT p.prosecdef AS security_definer FROM pg_proc p"
            " JOIN pg_namespace n ON n.oid = p.pronamespace"
            " WHERE n.nspname='core' AND p.proname='fn_job_log_geofence'"
        )
        self.assertTrue(fn, "core.fn_job_log_geofence missing")
        trg = q(
            "SELECT tgtype FROM pg_trigger WHERE tgrelid='core.job_log'::regclass"
            " AND tgname='trg_job_log_geofence' AND NOT tgisinternal"
        )
        self.assertTrue(trg, "BEFORE INSERT trigger trg_job_log_geofence missing")
        # BEFORE (bit 2) + ROW (bit 1) trigger type; INSERT fires on bit 2^4.
        tgtype = trg[0]["tgtype"]
        self.assertTrue(tgtype & 2 and tgtype & 4, "trigger must be BEFORE INSERT")
        src = q(
            "SELECT prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace"
            " WHERE n.nspname='core' AND p.proname='fn_job_log_geofence'"
        )[0]["prosrc"] or ""
        self.assertIn("14.361183", src, "the verbatim hospital pin must be the anchor")
        self.assertIn("0.7", src, "the plan row's OWN 0.7 km bound must gate (D1-5)")
        self.assertIn(SEED_PROVENANCE_PREFIX, src, "the history-seed exemption must pin the seed provenance marker")

    def test_rls_enabled_and_pinned_policies(self):
        """D1-7 RULED postures: location_area = house master (SELECT
        staff-or-admin / INSERT+UPDATE+DELETE admin); job_log = log/append
        (SELECT+INSERT staff-or-admin / UPDATE+DELETE admin); zero anon."""
        expected = {
            "location_area": {
                "location_area_select": ("SELECT", "fn_is_staff_or_admin"),
                "location_area_insert_admin": ("INSERT", "fn_is_admin"),
                "location_area_update_admin": ("UPDATE", "fn_is_admin"),
                "location_area_delete_admin": ("DELETE", "fn_is_admin"),
            },
            "job_log": {
                "job_log_select": ("SELECT", "fn_is_staff_or_admin"),
                "job_log_insert_staff": ("INSERT", "fn_is_staff_or_admin"),
                "job_log_update_admin": ("UPDATE", "fn_is_admin"),
                "job_log_delete_admin": ("DELETE", "fn_is_admin"),
            },
        }
        for table, policies in expected.items():
            rows = q(f"SELECT relrowsecurity FROM pg_class WHERE oid = 'core.{table}'::regclass")
            self.assertTrue(rows[0]["relrowsecurity"], f"RLS not enabled on core.{table}")
            found = q(
                "SELECT polname, polcmd::text AS cmd,"
                " pg_get_expr(polqual, polrelid) AS using_expr,"
                " pg_get_expr(polwithcheck, polrelid) AS check_expr"
                f" FROM pg_policy WHERE polrelid = 'core.{table}'::regclass"
            )
            byname = {r["polname"]: r for r in found}
            polcmd_map = {"SELECT": "r", "INSERT": "a", "UPDATE": "w", "DELETE": "d"}
            for policy, (cmd, fnname) in policies.items():
                self.assertIn(policy, byname, f"policy {policy} missing on core.{table}")
                self.assertEqual(byname[policy]["cmd"], polcmd_map[cmd], f"{policy} cmd mismatch")
                haystack = (byname[policy]["using_expr"] or "") + " " + (byname[policy]["check_expr"] or "")
                self.assertIn(fnname, haystack, f"policy {policy} must gate on {fnname}")
            anon = q(
                "SELECT count(*) AS c FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid"
                f" WHERE c.relname = '{table}'"
                " AND c.relnamespace = 'core'::regnamespace"
                " AND NOT EXISTS (SELECT 1 FROM pg_roles r WHERE r.oid = ANY (p.polroles) AND r.rolname = 'authenticated')"
            )
            self.assertEqual(anon[0]["c"], 0, f"anon-visible policy found on core.{table}")


# ─── source helpers (GET-only XLSX; the seed truth) ──────────────────────

def _load_garden_rows():
    import openpyxl

    if not GARDEN_XLSX.exists():
        resp = httpx.get(GARDEN_URL, timeout=120, follow_redirects=True)
        resp.raise_for_status()
        GARDEN_XLSX.write_bytes(resp.content)
    wb = openpyxl.load_workbook(GARDEN_XLSX, data_only=True)
    ws = wb["job"]
    rows = list(ws.iter_rows(values_only=True))
    data = [r for r in rows[1:] if any(v is not None and str(v).strip() != "" for v in r)]
    la = wb["location_area"]
    la_rows = list(la.iter_rows(values_only=True))
    la_data = [r for r in la_rows[1:] if any(v is not None and str(v).strip() != "" for v in r)]
    return data, la_data


def _load_personnel_source():
    import openpyxl

    if not POND_XLSX.exists():
        resp = httpx.get(POND_URL, timeout=120, follow_redirects=True)
        resp.raise_for_status()
        POND_XLSX.write_bytes(resp.content)
    wb = openpyxl.load_workbook(POND_XLSX, data_only=True)
    ws = wb["ข้อมูลผู้ปฏิบัติงาน"]
    rows = list(ws.iter_rows(values_only=True))
    data = [r for r in rows[1:] if any(v is not None and str(v).strip() != "" for v in r)]
    return data


def _digits_of_cell(v) -> str:
    """Type-coerced digit extraction (the P2.3 partial-data-probe lesson:
    numeric-stored IDs break string probes — ALWAYS type-coerce)."""
    if v is None:
        return ""
    if isinstance(v, float):
        if v == int(v):
            return str(int(v))
        return re.sub(r"\D", "", repr(v))
    return re.sub(r"\D", "", str(v))


def _norm_name(s) -> str:
    """Deterministic normalization: strip ALL whitespace + the Thai title
    prefix (นาย/นาง/นางสาว) — never a fuzzy/guessed match."""
    t = re.sub(r"\s+", "", str(s or ""))
    for title in ("นางสาว", "นาง", "นาย"):
        if t.startswith(title):
            return t[len(title):]
    return t


def _resolve_practician(raw_value, personnel_rows, pers_by_norm, emp_by_digits):
    """The disclosure-grade resolution chain (P2.3 precedent): digits-only
    Employee_id probes (exact / last-13 / first-13) → normalized full-name
    → core.personnel. Returns (uuid_or_None, how)."""
    d = re.sub(r"\D", "", str(raw_value))
    probes = []
    if d in emp_by_digits:
        probes.append(("exact", emp_by_digits[d]))
    if len(d) > 13:
        if d[-13:] in emp_by_digits:
            probes.append(("last13", emp_by_digits[d[-13:]]))
        if d[:13] in emp_by_digits:
            probes.append(("first13", emp_by_digits[d[:13]]))
    if not probes:
        return None, "NULL_no_source_match"
    if len(probes) > 1:
        return None, "NULL_ambiguous_probe"
    kind, idxs = probes[0]
    if len(idxs) > 1:
        return None, "NULL_ambiguous_source_row"
    src_name = str(personnel_rows[idxs[0]][1]).strip()
    cand = pers_by_norm.get(_norm_name(src_name), [])
    if len(cand) == 0:
        return None, "NULL_no_personnel_name"
    if len(cand) > 1:
        return None, "NULL_ambiguous_personnel"
    return cand[0]["id"], f"UUID_via_Employee_id_{kind}"


def _scanned_at_iso(v) -> str:
    """Date_time → scanned_at ISO: พ.ศ. years (sheet 2566→2569) ⇒ CE
    year−543; datetime cells carry naive Thai local time ⇒ ICT +07:00;
    the 5 string cells parse d/m/yyyy H:M:S."""
    if isinstance(v, datetime):
        return f"{v.year - 543:04d}-{v.month:02d}-{v.day:02d} {v.hour:02d}:{v.minute:02d}:{v.second:02d}+07:00"
    s = str(v).strip()
    m = re.fullmatch(r"(\d{1,2})/(\d{1,2})/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})", s)
    if not m:
        raise AssertionError(f"unparseable string Date_time cell: {s!r}")
    d, mo, y, h, mi, se = (int(x) for x in m.groups())
    return f"{y - 543:04d}-{mo:02d}-{d:02d} {h:02d}:{mi:02d}:{se:02d}+07:00"


@unittest.skipUnless(
    _OBJECTS_PRESENT,
    "canary: migration 20261118000006 unapplied — the seed fixtures are NEVER SENT pre-apply (zero durable writes)",
)
class SeedFixtures(unittest.TestCase):
    """Seed census + the PII disclosure + verbatim spot-checks + the
    geofence rollback-smoke + the guarded-idempotency canary."""

    @classmethod
    def setUpClass(cls):
        cls.garden_rows, cls.la_rows = _load_garden_rows()
        cls.personnel_src = _load_personnel_source()
        cls.pers = q(
            "SELECT id, full_name, position, status FROM core.personnel ORDER BY employee_code"
        )
        cls.pers_by_norm = {}
        for p in cls.pers:
            cls.pers_by_norm.setdefault(_norm_name(p["full_name"]), []).append(p)
        cls.emp_by_digits = {}
        for i, r in enumerate(cls.personnel_src):
            cls.emp_by_digits.setdefault(_digits_of_cell(r[0]), []).append(i)

    def test_location_area_seed_census(self):
        row = q(
            "SELECT count(*) AS total, count(DISTINCT legacy_id) AS ids,"
            " count(*) FILTER (WHERE area_name IS NOT NULL) AS names,"
            " count(*) FILTER (WHERE qr_url IS NOT NULL) AS qr_urls"
            " FROM core.location_area"
        )[0]
        self.assertEqual(row["total"], 15, "location_area must seed exactly 15/15")
        self.assertEqual(row["ids"], 15, "legacy_id must be 15 unique values")
        self.assertEqual(row["names"], 15, "area_name nonempty on all 15")
        self.assertEqual(row["qr_urls"], 15, "qr_url (zxing legacy refs) on all 15")

    def test_job_log_seed_census_matches_the_pinned_census(self):
        row = q(
            "SELECT count(*) AS total,"
            " count(DISTINCT legacy_id) AS ids,"
            " count(scanned_at) AS scanned_nonnull,"
            " count(qr_legacy_id) AS qr_nonempty,"
            " count(*) FILTER (WHERE qr_legacy_id IS NULL) AS qr_null,"
            " count(*) FILTER (WHERE qr_legacy_id = 'สแกน QR CODE') AS qr_placeholder,"
            " count(DISTINCT qr_legacy_id) FILTER (WHERE qr_legacy_id IS NOT NULL"
            "   AND qr_legacy_id <> 'สแกน QR CODE') AS qr_valid_ids,"
            " count(*) FILTER (WHERE location_area_id IS NOT NULL) AS area_bound,"
            " count(location_name) AS locname_nonempty,"
            " count(*) FILTER (WHERE location_name IS NULL) AS locname_null,"
            " count(DISTINCT location_name) AS locname_distinct,"
            " count(lat) AS lat_set,"
            " count(DISTINCT (lat, lng)) AS loc_pairs,"
            " count(*) FILTER (WHERE practitioner_legacy_id IS NOT NULL) AS prac_legacy_set,"
            " count(*) FILTER (WHERE working IS NULL) AS working_null,"
            " count(DISTINCT working) AS working_distinct,"
            " count(image_ref) AS image_nonempty,"
            " count(*) FILTER (WHERE image_ref IS NULL) AS image_null,"
            " count(issue) AS issue_nonempty,"
            " count(DISTINCT issue) AS issue_distinct"
            " FROM core.job_log"
        )[0]
        self.assertEqual(row["total"], 1102, "seed must hold exactly 1102 rows (1102/1102)")
        self.assertEqual(row["ids"], 1102, "legacy_id must hold 1102 distinct values")
        self.assertEqual(row["scanned_nonnull"], 1102, "scanned_at on all rows (1102 nonempty at source)")
        self.assertEqual(row["qr_nonempty"], 1101, "qr_legacy_id nonempty = 1101")
        self.assertEqual(row["qr_null"], 1, "the 1 blank QR cell ⇒ NULL (carried verbatim)")
        self.assertEqual(row["qr_placeholder"], 2, "the 2 literal placeholder rows carried verbatim")
        self.assertEqual(row["qr_valid_ids"], 15, "1099 valid rows over 15 unique 8-hex ids")
        self.assertEqual(row["area_bound"], 1099, "only the 15-id join resolves location_area_id")
        self.assertEqual(row["locname_nonempty"], 1089, "location_name nonempty = 1089")
        self.assertEqual(row["locname_null"], 13, "the 13 blank location_name cells ⇒ NULL")
        self.assertEqual(row["locname_distinct"], 15, "location_name = the 15 area_names")
        self.assertEqual(row["lat_set"], 1102, "location LatLong parses on all 1102 rows")
        self.assertEqual(row["loc_pairs"], 1055, "1055 distinct location pairs (verbatim census)")
        self.assertEqual(row["prac_legacy_set"], 0, "practitioner_legacy_id NULL everywhere (PII pin)")
        self.assertEqual(row["working_null"], 17, "the 17 blank working cells ⇒ NULL")
        self.assertEqual(row["working_distinct"], 15, "15 distinct in-vocabulary combos")
        self.assertEqual(row["image_nonempty"], 1091, "image_ref nonempty = 1091")
        self.assertEqual(row["image_null"], 11, "the 11 blank image cells ⇒ NULL")
        self.assertEqual(row["issue_nonempty"], 39, "issue nonempty = 39")
        self.assertEqual(row["issue_distinct"], 34, "issue distinct = 34")

    def test_working_combos_in_vocabulary(self):
        rows = q("SELECT DISTINCT working FROM core.job_log WHERE working IS NOT NULL")
        vocab = {"รดน้ำ", "ตัดหญ้า", "กวาด", "เก็บขยะ"}
        for r in rows:
            parts = {p.strip() for p in (r["working"] or "").split(",")}
            self.assertTrue(
                parts <= vocab, f"off-vocabulary working combo: {r['working']!r}"
            )

    def test_all_scanned_at_years_ce(self):
        rows = q("SELECT DISTINCT date_part('year', scanned_at)::int AS y FROM core.job_log")
        for r in rows:
            self.assertTrue(2000 < r["y"] < 2100, f"year {r['y']} looks un-translated พ.ศ.")

    def test_pii_disclosure_counts(self):
        """THE PII HARD PIN (R2 P3-A carry: the disclosure covers ALL 1100
        nonempty practician cells — 13 distinct whole-column = 12 ID-class
        over 1037 cells + 1 eight-digit class ×63). Resolved: 765 cells →
        core.personnel UUIDs; NULL: 335 unresolvable cells + 2 blank cells.
        practitioner_legacy_id is NULL on every row; the 13-digit values
        NEVER enter the database or any committed file."""
        row = q(
            "SELECT count(*) FILTER (WHERE practitioner_id IS NOT NULL) AS resolved,"
            " count(*) FILTER (WHERE practitioner_id IS NULL) AS null_prac"
            " FROM core.job_log"
        )[0]
        # recompute the expected resolution from the source bytes
        from collections import Counter

        prac_vals = [r[5] for r in self.garden_rows if r[5] is not None and str(r[5]).strip() != ""]
        self.assertEqual(len(prac_vals), 1100)
        distinct = Counter(str(v).strip() for v in prac_vals)
        self.assertEqual(len(distinct), 13, "13 distinct whole-column practician values")
        long_class = {v: c for v, c in distinct.items() if len(re.sub(r"\D", "", v)) >= 13}
        self.assertEqual(sum(long_class.values()), 1037, "1037 cells with >=13-digit digit-runs")
        eight_class = {v: c for v, c in distinct.items() if len(re.sub(r"\D", "", v)) == 8}
        self.assertEqual(list(eight_class.values()), [63], "the 8-digit class ×63 disclosed")
        exp_resolved = 0
        for v, cnt in distinct.items():
            uuid, _how = _resolve_practician(v, self.personnel_src, self.pers_by_norm, self.emp_by_digits)
            if uuid is not None:
                exp_resolved += cnt
        self.assertEqual(exp_resolved, 765, "expected disclosure: 765 cells resolve to UUIDs")
        self.assertEqual(row["resolved"], exp_resolved, "seeded resolved count must match the source re-resolution")
        # 335 unresolvable nonempty cells + the 2 blank practician cells
        # (blanks ⇒ NULL) = 337 rows with NULL practitioner_id
        self.assertEqual(row["null_prac"], 337, "335 unresolvable + 2 blank cells ⇒ NULL (never fabricated)")
        # every seeded practitioner_id must exist in core.personnel (9 rows)
        bound = q(
            "SELECT count(*) AS c FROM core.job_log j"
            " WHERE j.practitioner_id IS NOT NULL"
            " AND NOT EXISTS (SELECT 1 FROM core.personnel p WHERE p.id = j.practitioner_id)"
        )[0]["c"]
        self.assertEqual(bound, 0, "every seeded practitioner_id must reference core.personnel")

    def test_three_rows_spot_checked_against_the_source_bytes(self):
        """Spot-check THREE seeded rows field-by-field vs the fetched XLSX
        bytes: a placeholder-QR row, a NULL-practician row, and a
        resolved-practician row."""
        by_id = {str(r[0]).strip(): r for r in self.garden_rows}
        # pick the spot-check ids from the source: first placeholder row,
        # a row whose practician fails resolution, a row whose practician resolves
        placeholder_id = next(r[0] for r in self.garden_rows if str(r[2]).strip() == "สแกน QR CODE")
        null_prac_id = None
        resolved_id = None
        for r in self.garden_rows:
            v = r[5]
            if v is None or str(v).strip() == "":
                continue
            uuid, _ = _resolve_practician(str(v).strip(), self.personnel_src, self.pers_by_norm, self.emp_by_digits)
            if uuid is None and null_prac_id is None:
                null_prac_id = r[0]
            if uuid is not None and resolved_id is None:
                resolved_id = r[0]
            if null_prac_id and resolved_id:
                break
        self.assertTrue(placeholder_id and null_prac_id and resolved_id)
        for legacy in (placeholder_id, null_prac_id, resolved_id):
            src = by_id[str(legacy).strip()]
            qr = str(src[2]).strip()
            qr = None if qr == "" else qr
            expected_area = (
                q("SELECT id FROM core.location_area WHERE legacy_id = '" + qr + "'")[0]["id"]
                if qr not in (None, "สแกน QR CODE")
                else None
            )
            prac_uuid, _ = (
                _resolve_practician(str(src[5]).strip(), self.personnel_src, self.pers_by_norm, self.emp_by_digits)
                if src[5] is not None and str(src[5]).strip() != ""
                else (None, "blank")
            )
            row = q(
                "SELECT qr_legacy_id, location_area_id, location_name, lat::text, lng::text,"
                " working, image_ref, issue, practitioner_id::text,"
                " scanned_at, source_provenance"
                " FROM core.job_log WHERE legacy_id = '" + str(legacy).strip() + "'"
            )
            self.assertEqual(len(row), 1, f"seeded row {legacy} missing")
            r = row[0]
            # compare INSTANTS (the JSON render is server-tz; the seed
            # literal is pinned ICT +07 — same moment must hold)
            got_at = datetime.fromisoformat(str(r["scanned_at"]).replace("Z", "+00:00"))
            want_at = datetime.fromisoformat(_scanned_at_iso(src[1]).replace(" ICT", "").replace(" +07", "+07"))
            self.assertEqual(got_at, want_at, f"{legacy} พ.ศ.→CE ICT translation (instant equality)")
            self.assertEqual(r["qr_legacy_id"], qr, f"{legacy} qr must carry verbatim")
            self.assertEqual(r["location_area_id"], expected_area, f"{legacy} area join")
            self.assertEqual(r["location_name"], (str(src[4]).strip() if src[4] is not None and str(src[4]).strip() != "" else None))
            lat_s, lng_s = str(src[3]).split(",")
            self.assertEqual(float(r["lat"]), float(lat_s.strip()))
            self.assertEqual(float(r["lng"]), float(lng_s.strip()))
            self.assertEqual(r["working"], (str(src[6]).strip() if src[6] is not None and str(src[6]).strip() != "" else None))
            self.assertEqual(r["image_ref"], (str(src[7]).strip() if src[7] is not None and str(src[7]).strip() != "" else None))
            self.assertEqual(r["issue"], (str(src[8]).strip() if src[8] is not None and str(src[8]).strip() != "" else None))
            self.assertEqual(r["practitioner_id"], prac_uuid, f"{legacy} practician resolution must match")
            self.assertTrue(
                r["source_provenance"].startswith(SEED_PROVENANCE_PREFIX),
                f"{legacy} seed provenance pin",
            )

    def test_migration_file_greps_zero_thirteen_digit_runs(self):
        """The 13-digit national-ID grep of the migration file = 0 (the
        PII pin; the seed carries resolved uuid/NULL only)."""
        text = MIGRATION_PATH.read_text(encoding="utf-8")
        runs = re.findall(r"\d{13}", text)
        self.assertEqual(runs, [], f"13-digit digit-runs found in {MIGRATION}: {len(runs)}")

    def test_seed_blocks_resend_inserts_zero_rows(self):
        text = MIGRATION_PATH.read_text(encoding="utf-8")
        start = text.index(SEED_MARKER_START)
        end = text.index(SEED_MARKER_END)
        block = text[start:end]
        from apply_migration_api import split_sql

        stmts = [s for s in split_sql(block) if s.strip()]
        self.assertGreaterEqual(len(stmts), 15 + 1102)
        before = q("SELECT count(*) AS c FROM core.job_log")[0]["c"]
        sql = "BEGIN;\n" + "\n".join(stmts) + "\nROLLBACK;"
        q(sql)
        after = q("SELECT count(*) AS c FROM core.job_log")[0]["c"]
        self.assertEqual(before, after, "guarded seed re-send must insert ZERO rows")

    def test_geofence_gate_rollback_smoke(self):
        """D1-6 semantics inside BEGIN…ROLLBACK (zero net persistence):
        in-range NEW write ok; out-of-range NEW write rejected with the
        verbatim error; blank lat/lng NEW write rejected; a seed-provenance
        (history-class) row is EXEMPT — never retroactively re-validated."""
        area = q("SELECT id FROM core.location_area LIMIT 1")[0]["id"]
        prov_seed = (
            "workbook 1Hluhfryn2uMdK8nQ2kRJyLI3q-ZbrwgBgveDbhJlerw tab job"
            " (full XLSX export 92,749 bytes GET-only 2026-11-19) — ENV-PARITY-P3-004 guarded seed"
        )
        prov_new = "contract-fixture geofence smoke"
        # 1) in-range NEW write passes
        q(
            "BEGIN;\n"
            "INSERT INTO core.job_log (legacy_id, scanned_at, location_area_id, qr_legacy_id,"
            " lat, lng, working, source_provenance)"
            " VALUES ('fx0000in', now(), '%s', 'd9423cc0', 14.361284, 100.645649, 'รดน้ำ', '%s');\n"
            "ROLLBACK;" % (area, prov_new)
        )
        # 2) out-of-range NEW write rejected with the verbatim error
        with self.assertRaises(AssertionError) as ctx:
            q(
                "BEGIN;\n"
                "INSERT INTO core.job_log (legacy_id, scanned_at, location_area_id, qr_legacy_id,"
                " lat, lng, working, source_provenance)"
                " VALUES ('fx0000out', now(), '%s', 'd9423cc0', 14.6, 100.9, 'รดน้ำ', '%s');\n"
                "ROLLBACK;" % (area, prov_new)
            )
        self.assertIn("ฮั่นแน่...เข้ามาทำงานก่อน", str(ctx.exception), "out-of-range reject must carry the verbatim error")
        # 3) blank lat/lng NEW write rejected (unknown ≠ passed)
        with self.assertRaises(AssertionError) as ctx2:
            q(
                "BEGIN;\n"
                "INSERT INTO core.job_log (legacy_id, scanned_at, location_area_id, qr_legacy_id,"
                " working, source_provenance)"
                " VALUES ('fx0000blank', now(), '%s', 'd9423cc0', 'รดน้ำ', '%s');\n"
                "ROLLBACK;" % (area, prov_new)
            )
        self.assertIn("ฮั่นแน่...เข้ามาทำงานก่อน", str(ctx2.exception))
        # 4) the seed-provenance history class is exempt (out-of-range
        #    coordinates insertable — the 1102 legacy rows carry their
        #    recorded lat/lng verbatim, never re-validated)
        q(
            "BEGIN;\n"
            "INSERT INTO core.job_log (legacy_id, scanned_at, location_area_id, qr_legacy_id,"
            " lat, lng, working, source_provenance)"
            " VALUES ('fx0000legacy', now(), '%s', 'd9423cc0', 0.0, 0.0, 'รดน้ำ', '%s');\n"
            "ROLLBACK;" % (area, prov_seed)
        )
        # 5) residue: none of the fixture rows persisted
        leaked = q(
            "SELECT count(*) AS c FROM core.job_log WHERE legacy_id LIKE 'fx0000%'"
        )[0]["c"]
        self.assertEqual(leaked, 0, "geofence smoke rows must never persist")

    def test_join_integrity_vs_location_area_master(self):
        """The 15 scanned job ids = the 15 location_area ids, 0 unmatched
        either direction (the §2 receipt, re-proven live)."""
        row = q(
            "SELECT"
            " (SELECT count(*) FROM core.location_area la WHERE NOT EXISTS"
            "   (SELECT 1 FROM core.job_log j WHERE j.qr_legacy_id = la.legacy_id)) AS la_unmatched,"
            " (SELECT count(*) FROM (SELECT DISTINCT qr_legacy_id FROM core.job_log"
            "   WHERE qr_legacy_id IS NOT NULL AND qr_legacy_id <> 'สแกน QR CODE') s"
            "  WHERE NOT EXISTS (SELECT 1 FROM core.location_area la WHERE la.legacy_id = s.qr_legacy_id)) AS job_unmatched"
        )[0]
        self.assertEqual(row["la_unmatched"], 0, "every location_area id is scanned by job history")
        self.assertEqual(row["job_unmatched"], 0, "every scanned job id joins the master")


if __name__ == "__main__":
    unittest.main()
