"""ENV-PARITY-P2-001 C1 — D2 RED-first live contract test for the safety
asset-master tables (AppSheet parity Phase 2, lane P2.1).

Queries ENV_DB (project gllqtbyofrcjzmbnfoeh, ap-southeast-1) through the
same Management-API access path as scripts/apply_migration_api.py
(scripts/_env.py; SUPABASE_ACCESS_TOKEN from Drive secrets — never printed).

Assertion groups (WO §7; every group must FAIL truthfully while migration
20261116000004_parity_p2_001.sql is UNAPPLIED — the RED record goes in the
handoff — and pass GREEN after it):

  SCHEMA     — safety.emergency_light / safety.fire_extinguisher exist with
               the pinned columns/types/nullability (WO §3.1/§3.2), PKs,
               legacy_id UNIQUE, RLS enabled, the four pinned policy shapes
               per table (SELECT staff-or-admin; INSERT/UPDATE/DELETE
               admin-only via core.fn_is_admin() — P1.4 binding precedent),
               extinguisher_type TEXT with NO hard CHECK (documented enum
               only, D1-2), no location_floor DEFAULT (D1-6), no date
               DEFAULTs (TODAY() is form-only).
  SEED       — the 48 emergency-light rows match EXPECTED_LIGHT_ROWS
               exactly (generated programmatically from the saved source
               CSV /tmp/env-p2-001-sources/sheet-fire-inspection.csv,
               tab 'Emergency light'): ids 001–049 with source gap 044,
               receive_date 2025-06-05 (พ.ศ. 5/6/2568 − 543), floors
               {1:28, 2:18, 3:2}, 38 NULL providers, 8 NULL pic paths,
               row 032 trailing space verbatim, legacy_id = erl_id.
  IDEMPOTENCY— re-sending the migration's guarded seed block inserts ZERO
               new rows (WHERE NOT EXISTS guard) — single-request
               BEGIN…SELECT…ROLLBACK smoke, canary-gated so the batch is
               never sent while the tables are absent; zero durable writes
               asserted by pre/post count equality.
  HONESTY    — blanks are NULL not ''/0 (providers 38 NULL / pic 8 NULL /
               zero empty-string cells / zero floor 0); fire_extinguisher
               row count = 0 (SOURCE_UNAVAILABLE — nothing reconstructed
               from the inspection table, WO §2.1); row 032 whitespace
               verbatim.
  COUNTS     — count reconciliation per WO §5: emergency_light 48 = sheet
               48 = seeded 48, skipped 0; fire_extinguisher 0/0 with the
               SOURCE_UNAVAILABLE reconciliation; the P2.2/P2.3
               SHAPE-ONLY sheets seeded 0 by construction (only two tables
               exist in the safety domain beyond the pre-existing
               monthly_check); baseline registers (wastewater.reading 907,
               core.personnel 9, core.equipment_spec 4,
               safety.monthly_check) untouched.

Run:  uv run python -m pytest scripts/test_parity_p2_001_asset_masters.py -q
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent))

API_URL = (
    "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
)

MIGRATION = "20261116000004_parity_p2_001.sql"
MIGRATION_PATH = Path(__file__).resolve().parent.parent / "supabase/migrations" / MIGRATION

SEED_MARKER_START = "-- >>> SEED-BLOCK-START"
SEED_MARKER_END = "-- <<< SEED-BLOCK-END"

# Generated programmatically from the saved source CSV
# /tmp/env-p2-001-sources/sheet-fire-inspection.csv (tab 'Emergency light', 2026-11-16).
# erl_id -> (location, pic_path, receive_date, location_floor, providers)
EXPECTED_LIGHT_ROWS = {
    '001': ('ในห้องควบคุมโรค เบอร์1', None, '2025-06-05', 2, None),
    '002': ('หน้าห้องควบคุมโรค เบอร์1', 'Emergency light_Images/002.Pic.063439.jpg', '2025-06-05', 2, 'MAX BRIGHT by C.E.E'),
    '003': ('ปฐมภูมิ เบอร์8', None, '2025-06-05', 2, None),
    '004': ('ปฐมภูมิ เบอร์7', 'Emergency light_Images/004.Pic.064047.jpg', '2025-06-05', 2, 'MAX BRIGHT by C.E.E'),
    '005': ('ปฐมภูมิ หน้าห้องเบอร์ 4', 'Emergency light_Images/005.Pic.080112.jpg', '2025-06-05', 2, 'MAX'),
    '006': ('ปฐมภูมิ ในห้องเบอร์ 4', 'Emergency light_Images/006.Pic.063640.jpg', '2025-06-05', 2, 'MAX BRIGHT by C.E.E'),
    '007': ('ปฐมภูมิ เบอร์6', 'Emergency light_Images/007.Pic.064500.jpg', '2025-06-05', 2, None),
    '008': ('ปฐมภูมิ เบอร์5', None, '2025-06-05', 2, None),
    '009': ('หน้าห้องฟัน', 'Emergency light_Images/009.Pic.064909.jpg', '2025-06-05', 2, None),
    '010': ('ทางเดินในห้องฟัน', 'Emergency light_Images/010.Pic.065639.jpg', '2025-06-05', 2, None),
    '011': ('ในห้องเก็บของห้องฟัน', 'Emergency light_Images/011.Pic.065739.jpg', '2025-06-05', 2, None),
    '012': ('ทางเดินข้างห้องฟันด้านนอก', 'Emergency light_Images/012.Pic.065426.jpg', '2025-06-05', 2, None),
    '013': ('กลุ่มงานการพยาบาล', 'Emergency light_Images/013.Pic.065910.jpg', '2025-06-05', 2, None),
    '014': ('ห้องประชุมโรจนะ', 'Emergency light_Images/014.Pic.075154.jpg', '2025-06-05', 2, 'MAX'),
    '015': ('ปฐมภูมิ ห้องน้ำ ญ.', 'Emergency light_Images/015.Pic.070409.jpg', '2025-06-05', 2, None),
    '016': ('ปฐมภูมิ ห้องน้ำ ช.', 'Emergency light_Images/016.Pic.070345.jpg', '2025-06-05', 2, None),
    '017': ('ปฐมภูมิ ห้องน้ำพิการ', 'Emergency light_Images/017.Pic.070558.jpg', '2025-06-05', 2, None),
    '018': ('ดาดฟ้า', None, '2025-06-05', 3, None),
    '019': ('หน้าลฟต์ 3', None, '2025-06-05', 3, None),
    '020': ('หน้าลิฟต์ 2', 'Emergency light_Images/020.Pic.070707.jpg', '2025-06-05', 2, None),
    '021': ('หน้าลิฟต์ 1', 'Emergency light_Images/021.Pic.071005.jpg', '2025-06-05', 1, None),
    '022': ('คลินิกแผนไทย', 'Emergency light_Images/022.Pic.071434.jpg', '2025-06-05', 1, None),
    '023': ('หน้าห้องประชุม มงคลบพิตร', 'Emergency light_Images/023.Pic.080701.jpg', '2025-06-05', 1, None),
    '024': ('Word หน้าหอหญิง', None, '2025-06-05', 1, None),
    '025': ('Word ในหอหญิง', 'Emergency light_Images/025.Pic.082015.jpg', '2025-06-05', 1, None),
    '026': ('Word ห้องพยาบาล', 'Emergency light_Images/026.Pic.081440.jpg', '2025-06-05', 1, None),
    '027': ('Word ห้อง Trethment', 'Emergency light_Images/027.Pic.081904.jpg', '2025-06-05', 1, None),
    '028': ('Word ในหอชาย', 'Emergency light_Images/028.Pic.082220.jpg', '2025-06-05', 1, None),
    '029': ('Word หน้าหอชาย', 'Emergency light_Images/029.Pic.081052.jpg', '2025-06-05', 1, None),
    '030': ('ห้องเก็บ O2', 'Emergency light_Images/030.Pic.082536.jpg', '2025-06-05', 1, None),
    '031': ('ห้องยา', 'Emergency light_Images/031.Pic.074348.jpg', '2025-06-05', 1, 'MAX'),
    '032': ('OPD หัตการ เบอร์7 ', 'Emergency light_Images/032.Pic.074009.jpg', '2025-06-05', 1, 'Sunny MODEL SN 206 DH 1'),
    '033': ('OPD โถงหน้าห้อง6 พยาบาล', None, '2025-06-05', 1, None),
    '034': ('หน้าห้องแลป', 'Emergency light_Images/034.Pic.073614.jpg', '2025-06-05', 1, None),
    '035': ('OPD หน้าห้องน้ำ หลังแลป', None, '2025-06-05', 1, None),
    '036': ('OPD ห้องน้ำ ช.', 'Emergency light_Images/036.Pic.073259.jpg', '2025-06-05', 1, None),
    '037': ('OPD ห้องน้ำ ญ.', 'Emergency light_Images/037.Pic.073317.jpg', '2025-06-05', 1, None),
    '038': ('OPD ห้องน้ำคนพิการ', 'Emergency light_Images/038.Pic.073329.jpg', '2025-06-05', 1, None),
    '039': ('หน้าห้องเคาะปอด', 'Emergency light_Images/039.Pic.072001.jpg', '2025-06-05', 1, None),
    '040': ('ในห้องกายภาพ', 'Emergency light_Images/040.Pic.072711.jpg', '2025-06-05', 1, None),
    '041': ('ในห้อง LAB', 'Emergency light_Images/041.Pic.072935.jpg', '2025-06-05', 1, None),
    '042': ('ในห้อง X-ray', 'Emergency light_Images/042.Pic.074845.jpg', '2025-06-05', 1, None),
    '043': ('LR ห้องทำคลอด', 'Emergency light_Images/043.Pic.075422.jpg', '2025-06-05', 1, 'SUNNY'),
    '045': ('ห้อง OR', 'Emergency light_Images/045.Pic.075647.jpg', '2025-06-05', 1, None),
    '046': ('LR พักรอคลอด', 'Emergency light_Images/046.Pic.075238.jpg', '2025-06-05', 1, 'SUNNY'),
    '047': ('ER เสาโต๊ะคอม', 'Emergency light_Images/047.Pic.080249.jpg', '2025-06-05', 1, 'SUNNY'),
    '048': ('ER หน้าห้อง Pressure', 'Emergency light_Images/048.Pic.080103.jpg', '2025-06-05', 1, None),
    '049': ('ER จุดเตรียมอุปกรณ์ด้านหน้า', 'Emergency light_Images/049.Pic.080409.jpg', '2025-06-05', 1, None),
}

EXPECTED_IDS = [f"{i:03d}" for i in range(1, 50) if i != 44]

# Pinned column shapes (WO §3.1/§3.2): (table, column, data_type, nullable)
EXPECTED_COLUMNS = [
    # safety.emergency_light
    ("emergency_light", "erl_id", "text", "NO"),
    ("emergency_light", "location", "text", "NO"),
    ("emergency_light", "pic_path", "text", "YES"),
    ("emergency_light", "receive_date", "date", "YES"),
    ("emergency_light", "location_floor", "smallint", "YES"),
    ("emergency_light", "providers", "text", "YES"),
    ("emergency_light", "source_provenance", "text", "NO"),
    ("emergency_light", "legacy_id", "text", "YES"),
    # safety.fire_extinguisher
    ("fire_extinguisher", "legacy_row_id", "text", "NO"),
    ("fire_extinguisher", "location", "text", "YES"),
    ("fire_extinguisher", "extinguisher_type", "text", "YES"),
    ("fire_extinguisher", "photo_path", "text", "YES"),
    ("fire_extinguisher", "packed_date", "date", "YES"),
    ("fire_extinguisher", "expiry_date", "date", "YES"),
    ("fire_extinguisher", "size_label", "text", "YES"),
    ("fire_extinguisher", "source_provenance", "text", "NO"),
    ("fire_extinguisher", "legacy_id", "text", "YES"),
]

PRIMARY_KEYS = {
    "emergency_light": ["erl_id"],
    "fire_extinguisher": ["legacy_row_id"],
}

# Pinned policy shapes per table (WO §4 — P1.4 binding precedent shapes).
POLICY_TABLES = ("emergency_light", "fire_extinguisher")
EXPECTED_POLICIES = {
    ("emergency_light", "emergency_light_read"): ("SELECT", "core.fn_is_staff_or_admin()"),
    ("emergency_light", "emergency_light_insert_admin"): ("INSERT", "core.fn_is_admin()"),
    ("emergency_light", "emergency_light_update_admin"): ("UPDATE", "core.fn_is_admin()"),
    ("emergency_light", "emergency_light_delete_admin"): ("DELETE", "core.fn_is_admin()"),
    ("fire_extinguisher", "fire_extinguisher_read"): ("SELECT", "core.fn_is_staff_or_admin()"),
    ("fire_extinguisher", "fire_extinguisher_insert_admin"): ("INSERT", "core.fn_is_admin()"),
    ("fire_extinguisher", "fire_extinguisher_update_admin"): ("UPDATE", "core.fn_is_admin()"),
    ("fire_extinguisher", "fire_extinguisher_delete_admin"): ("DELETE", "core.fn_is_admin()"),
}

PROVENANCE = "AppSheet Sheets export 2026-11-16"


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
    relation "safety.emergency_light" does not exist)."""
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


def _seed_block() -> str:
    """Extract the guarded seed block from the migration file (between the
    SEED-BLOCK markers) for the idempotency re-send."""
    text = MIGRATION_PATH.read_text(encoding="utf-8")
    start = text.index(SEED_MARKER_START)
    end = text.index(SEED_MARKER_END)
    return text[start:end]


def _seed_statements() -> list[str]:
    from apply_migration_api import split_sql

    return [s for s in split_sql(_seed_block()) if s.strip()]


def _counts_sql() -> str:
    return (
        "SELECT (SELECT count(*) FROM safety.emergency_light) AS light,"
        " (SELECT count(*) FROM safety.fire_extinguisher) AS ext"
    )


class P2AssetMastersContract(unittest.TestCase):
    """Live contract for the P2.1 safety asset masters."""

    # ─────────────────────────── SCHEMA ────────────────────────────

    def test_tables_exist(self):
        for t in POLICY_TABLES:
            reg = q(f"SELECT to_regclass('safety.{t}') AS reg")[0]["reg"]
            self.assertIsNotNone(reg, f"safety.{t} does not exist")

    def test_table_owner_is_postgres(self):
        for t in POLICY_TABLES:
            rows = q(
                "SELECT tableowner FROM pg_tables"
                " WHERE schemaname='safety' AND tablename='" + t + "'"
            )
            self.assertEqual(rows[0]["tableowner"], "postgres", f"safety.{t} owner")

    def test_column_shapes(self):
        rows = q(
            "SELECT table_name, column_name, data_type, is_nullable"
            " FROM information_schema.columns"
            " WHERE table_schema='safety'"
            " AND table_name IN ('emergency_light','fire_extinguisher')"
            " ORDER BY table_name, ordinal_position"
        )
        actual = {(r["table_name"], r["column_name"]): (r["data_type"], r["is_nullable"]) for r in rows}
        for table, column, dtype, nullable in EXPECTED_COLUMNS:
            key = (table, column)
            self.assertIn(key, actual, f"missing column safety.{table}.{column}")
            self.assertEqual(
                actual[key],
                (dtype, nullable),
                f"safety.{table}.{column} shape (type/nullability)",
            )
        extra = set(actual) - {(t, c) for t, c, _, _ in EXPECTED_COLUMNS}
        self.assertEqual(extra, set(), f"unexpected extra columns in safety tables: {sorted(extra)}")

    def test_primary_keys(self):
        rows = q(
            "SELECT tc.table_name, kcu.column_name"
            " FROM information_schema.table_constraints tc"
            " JOIN information_schema.key_column_usage kcu"
            " ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema"
            " WHERE tc.table_schema='safety' AND tc.constraint_type='PRIMARY KEY'"
            " AND tc.table_name IN ('emergency_light','fire_extinguisher')"
            " ORDER BY tc.table_name, kcu.ordinal_position"
        )
        pks: dict[str, list[str]] = {}
        for r in rows:
            pks.setdefault(r["table_name"], []).append(r["column_name"])
        self.assertEqual(pks, PRIMARY_KEYS)

    def test_legacy_id_unique(self):
        rows = q(
            "SELECT tc.table_name"
            " FROM information_schema.table_constraints tc"
            " WHERE tc.table_schema='safety' AND tc.constraint_type='UNIQUE'"
            " AND tc.table_name IN ('emergency_light','fire_extinguisher')"
        )
        names = {r["table_name"] for r in rows}
        self.assertEqual(names, set(POLICY_TABLES), "legacy_id UNIQUE must exist on both tables")

    def test_rls_enabled(self):
        for t in POLICY_TABLES:
            rows = q(
                "SELECT relrowsecurity, relforcerowsecurity FROM pg_class"
                " WHERE oid = 'safety.%s'::regclass" % t
            )
            self.assertTrue(rows[0]["relrowsecurity"], f"RLS not enabled on safety.{t}")

    def test_policy_shapes(self):
        rows = q(
            "SELECT tablename, policyname, cmd, roles, qual, with_check"
            " FROM pg_policies WHERE schemaname='safety'"
            " AND tablename IN ('emergency_light','fire_extinguisher')"
        )
        actual = {(r["tablename"], r["policyname"]): r for r in rows}
        for (table, name), (cmd, predicate) in EXPECTED_POLICIES.items():
            key = (table, name)
            self.assertIn(key, actual, f"missing policy {name} on safety.{table}")
            pol = actual[key]
            self.assertEqual(pol["cmd"], cmd, f"policy {name} cmd")
            self.assertEqual(pol["roles"], "{authenticated}", f"policy {name} roles")
            body = (pol["qual"] or "") + " " + (pol["with_check"] or "")
            self.assertIn(predicate, body, f"policy {name} predicate must use {predicate}")
            if cmd == "UPDATE":
                self.assertTrue(pol["qual"] and pol["with_check"], f"policy {name} needs both USING and WITH CHECK")
        self.assertEqual(
            set(actual),
            set(EXPECTED_POLICIES),
            f"unexpected/missing policies in safety schema: {sorted(set(actual) ^ set(EXPECTED_POLICIES))}",
        )

    def test_no_anon_policies(self):
        rows = q(
            "SELECT tablename, policyname FROM pg_policies"
            " WHERE schemaname='safety' AND 'anon' = ANY (roles::name[])"
        )
        self.assertEqual(rows, [], "no policy may target anon (fail-closed by default)")

    def test_extinguisher_type_no_hard_check(self):
        rows = q(
            "SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint"
            " WHERE conrelid = 'safety.fire_extinguisher'::regclass AND contype='c'"
        )
        offenders = [r for r in rows if "extinguisher_type" in (r["def"] or "")]
        self.assertEqual(offenders, [], "extinguisher_type must carry NO hard CHECK (D1-2)")

    def test_no_defaults_on_floor_and_dates(self):
        rows = q(
            "SELECT table_name, column_name, column_default"
            " FROM information_schema.columns"
            " WHERE table_schema='safety'"
            " AND table_name IN ('emergency_light','fire_extinguisher')"
            " AND column_name IN ('location_floor','receive_date','packed_date','expiry_date')"
        )
        offenders = [r for r in rows if r["column_default"] is not None]
        self.assertEqual(offenders, [], "location_floor / date columns must have NO DEFAULT (D1-6, TODAY() is form-only)")

    def test_source_provenance_default(self):
        rows = q(
            "SELECT table_name, column_default FROM information_schema.columns"
            " WHERE table_schema='safety' AND column_name='source_provenance'"
            " ORDER BY table_name"
        )
        self.assertEqual(len(rows), 2, "source_provenance on both tables")
        for r in rows:
            self.assertIn(PROVENANCE, r["column_default"] or "", f"provenance default on {r['table_name']}")

    # ──────────────────────────── SEED ─────────────────────────────

    def test_seed_ids_exact(self):
        rows = q("SELECT erl_id FROM safety.emergency_light ORDER BY erl_id")
        self.assertEqual([r["erl_id"] for r in rows], EXPECTED_IDS,
                         "ids must be exactly 001–049 minus source gap 044, zero-padded TEXT")

    def test_seed_rows_exact(self):
        rows = q(
            "SELECT erl_id, location, pic_path, receive_date::text AS receive_date,"
            " location_floor, providers FROM safety.emergency_light ORDER BY erl_id"
        )
        self.assertEqual(len(rows), 48, f"expected 48 seeded rows, got {len(rows)}")
        for r in rows:
            erl = r["erl_id"]
            self.assertIn(erl, EXPECTED_LIGHT_ROWS, f"unexpected id {erl}")
            exp = EXPECTED_LIGHT_ROWS[erl]
            act = (r["location"], r["pic_path"], r["receive_date"], r["location_floor"], r["providers"])
            self.assertEqual(act, exp, f"row {erl} mismatch (location/pic/date/floor/providers)")

    def test_seed_traceability(self):
        rows = q(
            "SELECT erl_id, legacy_id, source_provenance FROM safety.emergency_light"
            " WHERE legacy_id IS DISTINCT FROM erl_id OR source_provenance <> %s"
            % ("'" + PROVENANCE + "'")
        )
        self.assertEqual(rows, [], "legacy_id must equal erl_id and provenance must be pinned")

    # ──────────────────────── IDEMPOTENCY ──────────────────────────

    def test_seed_block_reapply_is_noop(self):
        """Canary-gated single-request rollback smoke: re-send the guarded
        seed block; ZERO rows may be inserted; durable state unchanged."""
        reg = q("SELECT to_regclass('safety.emergency_light') AS reg")[0]["reg"]
        if reg is None:
            self.fail("canary: safety.emergency_light absent — seed block NOT sent (truthful RED)")
        before = q(_counts_sql())[0]
        stmts = _seed_statements()
        self.assertEqual(len(stmts), 48, f"seed block must carry 48 statements, got {len(stmts)}")
        batch = "BEGIN;\n" + "\n".join(stmts) + f"\n{_counts_sql()};\nROLLBACK;"
        r = httpx.post(
            API_URL,
            headers={"Authorization": f"Bearer {_TOKEN}", "Content-Type": "application/json"},
            json={"query": batch},
            timeout=120,
        )
        self.assertLess(r.status_code, 400, f"seed re-send failed: {r.text[:300]}")
        during = r.json()
        self.assertEqual(during[0]["light"], 48, "re-send inserted rows — WHERE NOT EXISTS guard broken")
        self.assertEqual(during[0]["ext"], 0, "re-send touched fire_extinguisher")
        after = q(_counts_sql())[0]
        self.assertEqual((after["light"], after["ext"]), (before["light"], before["ext"]),
                         "durable counts changed across the rollback smoke — zero-write contract broken")

    # ─────────────────────────── HONESTY ───────────────────────────

    def test_blanks_are_null_not_empty(self):
        rows = q(
            "SELECT"
            " count(*) FILTER (WHERE providers IS NULL) AS prov_null,"
            " count(*) FILTER (WHERE providers = '') AS prov_empty,"
            " count(*) FILTER (WHERE pic_path IS NULL) AS pic_null,"
            " count(*) FILTER (WHERE pic_path = '') AS pic_empty,"
            " count(*) FILTER (WHERE location_floor = 0) AS floor_zero"
            " FROM safety.emergency_light"
        )[0]
        self.assertEqual(rows["prov_null"], 38, "38 blank Providers must be NULL")
        self.assertEqual(rows["prov_empty"], 0, "no empty-string providers allowed")
        self.assertEqual(rows["pic_null"], 8, "8 blank Pic must be NULL")
        self.assertEqual(rows["pic_empty"], 0, "no empty-string pic_path allowed")
        self.assertEqual(rows["floor_zero"], 0, "no zero-coerced floors allowed")

    def test_row_032_trailing_space_verbatim(self):
        rows = q(
            "SELECT location, char_length(location) AS n FROM safety.emergency_light"
            " WHERE erl_id='032'"
        )
        self.assertEqual(rows[0]["location"], "OPD หัตการ เบอร์7 ",
                         "row 032 location must keep the trailing space verbatim")
        self.assertTrue(rows[0]["location"].endswith(" "), "trailing space missing")

    def test_extinguisher_zero_rows_source_unavailable(self):
        n = q("SELECT count(*) AS n FROM safety.fire_extinguisher")[0]["n"]
        self.assertEqual(n, 0, "fire_extinguisher must hold ZERO rows — master sheet SOURCE_UNAVAILABLE; "
                               "reconstruction from the inspection table is FORBIDDEN (WO §2.1)")

    # ───────────────────── COUNT-RECONCILIATION ────────────────────

    def test_count_reconciliation(self):
        rows = q(
            "SELECT"
            " (SELECT count(*) FROM safety.emergency_light) AS light,"
            " (SELECT count(*) FROM safety.fire_extinguisher) AS ext,"
            " (SELECT count(*) FROM wastewater.reading) AS reading,"
            " (SELECT count(*) FROM core.personnel) AS personnel,"
            " (SELECT count(*) FROM core.equipment_spec) AS equipment_spec"
        )[0]
        self.assertEqual(rows["light"], 48, "WO §5: sheet 48 → seeded 48, skipped 0")
        self.assertEqual(rows["ext"], 0, "WO §5: master SOURCE_UNAVAILABLE → 0 rows")
        self.assertEqual(rows["reading"], 907, "wastewater.reading baseline untouched")
        self.assertEqual(rows["personnel"], 9, "core.personnel baseline untouched")
        self.assertEqual(rows["equipment_spec"], 4, "core.equipment_spec baseline untouched")

    def test_preexisting_safety_table_untouched(self):
        rows = q(
            "SELECT relrowsecurity FROM pg_class WHERE oid='safety.monthly_check'::regclass"
        )
        self.assertEqual(len(rows), 1, "pre-existing safety.monthly_check must remain")
        self.assertTrue(rows[0]["relrowsecurity"], "monthly_check RLS must remain enabled")
        pol = q(
            "SELECT count(*) AS n FROM pg_policies"
            " WHERE schemaname='safety' AND tablename='monthly_check'"
        )[0]["n"]
        self.assertEqual(pol, 1, "monthly_check's own policy must remain untouched")


if __name__ == "__main__":
    unittest.main(verbosity=2)
