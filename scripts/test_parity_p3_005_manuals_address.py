"""ENV-PARITY-P3-005 C1 — D2 RED-first live contract test for the two
manual-shelf tables (คู่มือ ×2) + the address report-header reference
(AppSheet parity Phase 3, lane P3.5).

Queries ENV_DB (project gllqtbyofrcjzmbnfoeh, ap-southeast-1) through the
same Management-API access path as scripts/apply_migration_api.py
(SUPABASE_ACCESS_TOKEN from process env or scripts/_env.py resolution).

Assertion groups (WO §7 D2; the absent-schema groups must FAIL truthfully
while migration 20261118000007_parity_p3_005.sql is UNAPPLIED — the RED
record goes in the handoff — and pass GREEN after it):

  SCHEMA   — core.manual_wastewater + core.manual_water_supply carry the
             8-column house shape (id uuid PK default; legacy_id text
             UNIQUE nullable; title text NOT NULL; image_ref/file_ref text
             NULLABLE link-only metadata; source_provenance NOT NULL;
             recorded_by uuid NULL; created_at timestamptz NOT NULL) and
             core.address the 10-column shape (id uuid PK default;
             tambon_id bigint NOT NULL UNIQUE — the verbatim §3.6
             TambonID key; tambon_thai/district_thai/province_thai NOT
             NULL; district_id/province_id bigint NOT NULL; provenance/
             recorded_by/created_at per house) + indexes on
             address(district_id) and address(province_id).
  VIRTUAL  — D1-5/D1-9: NO address_key column exists on core.address (the
             §3.6 App formula =[TambonThai]&"-"&[DistrictThai]&"-"&
             [ProvinceThai] is display-time ONLY); NO generated column
             anywhere (information_schema.columns.is_generated = NEVER for
             all three tables); NO trigger on any of the three tables (no
             trigger writes derived values).
  RLS      — RLS enabled + exactly 4 policies per table (SELECT
             core.fn_is_staff_or_admin(); INSERT/UPDATE/DELETE
             core.fn_is_admin(); UPDATE carries USING + WITH CHECK —
             address admin-editable per owner B7); zero anon policies
             (fail closed); security_invoker façades
             public.manual_wastewater / public.manual_water_supply /
             public.address flow every column through.
  FLOW     — transactional rollback-smoke, zero net persistence: admin
             insert OK + legacy_id UNIQUE enforced + NULL legacy_ids
             allowed; staff INSERT denied (RLS); staff UPDATE/DELETE
             denied; admin UPDATE/DELETE OK (address per B7 ตารางแก้ไขได้);
             anon read fails closed on all three.
  SEED     — manual_wastewater 10/10 (pond tab คู่มือ census; 10 unique
             8-hex ids); manual_water_supply 0 (SOURCE_UNAVAILABLE marker,
             never fabricated); address 7,436/7,436 full census (77
             provinces; DistrictID 928 distinct; อุทัยธานี 70 rows / 8
             districts); verbatim spot rows: คู่มือ c845e81a +
             cb424d42 (the Thai-suffixed สมพงษ.pdf link ref) + address
             910104/610101/100101 vs the fetched XLSX bytes.
  CANARY   — guarded-seed idempotency: re-sending the migration's own
             manual seed statements + the first address batch inserts 0
             (extracted from the migration file — the real guarded
             statements, not test-embedded fixtures).
  BASELINE — the 15 §3-6 baselines identical (RED canary + zero
             unanticipated durable writes).
  FILE     — the pinned migration file exists; documents its rollback SQL;
             carries the house `notify pgrst, 'reload schema'` trailer;
             the §3.22/§3.26/§3.6 lineage is in the header; NO binary
             storage anywhere (no bytea column, no decode(/base64 in the
             seed SQL — link-only metadata D1-4); 13-digit digit-run grep
             of the file = 0 (filename timestamp scrubbed — PII pin).

Run:  python3 -m pytest scripts/test_parity_p3_005_manuals_address.py -q
(or:  python3 scripts/test_parity_p3_005_manuals_address.py )
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

MIGRATION = "20261118000007_parity_p3_005.sql"
MIGRATION_PATH = Path(__file__).resolve().parent.parent / "supabase/migrations" / MIGRATION

# ── Pinned column shapes (WO §3) ─────────────────────────────────────────
# (column, data_type, is_nullable, has_default)
MANUAL_COLUMNS = [
    ("id", "uuid", "NO", True),
    ("legacy_id", "text", "YES", False),
    ("title", "text", "NO", False),
    ("image_ref", "text", "YES", False),
    ("file_ref", "text", "YES", False),
    ("source_provenance", "text", "NO", True),
    ("recorded_by", "uuid", "YES", False),
    ("created_at", "timestamp with time zone", "NO", True),
]

ADDRESS_COLUMNS = [
    ("id", "uuid", "NO", True),
    ("tambon_id", "bigint", "NO", False),
    ("tambon_thai", "text", "NO", False),
    ("district_id", "bigint", "NO", False),
    ("district_thai", "text", "NO", False),
    ("province_id", "bigint", "NO", False),
    ("province_thai", "text", "NO", False),
    ("source_provenance", "text", "NO", True),
    ("recorded_by", "uuid", "YES", False),
    ("created_at", "timestamp with time zone", "NO", True),
]

# The house policy shape (D1-6): 4 policies per table, UPDATE carrying
# USING + WITH CHECK (address admin-editable per owner B7).
POLICY_GATE_SELECT = "core.fn_is_staff_or_admin()"
POLICY_GATE_ADMIN = "core.fn_is_admin()"

# Verbatim census spot rows (R2 receipt + live re-fetch 2026-11-19 —
# public manuals + public national geography, no PII).
MANUAL_SPOTS = [
    (
        "c845e81a",
        "ควบคุมและบำรุงรักษาระบบบำบัดน้ำเสีย",
        "คู่มือ_Images/c845e81a.รูป.062513.jpg",
        "คู่มือ_Files_/c845e81a.link.062513.pdf",
    ),
    (
        "cb424d42",
        "คู่มือคำนวณอัตราการไหล",
        "คู่มือ_Images/cb424d42.รูป.044324.jpg",
        "คู่มือ_Files_/cb424d42.link.044324.สมพงษ.pdf",
    ),
]

ADDRESS_SPOTS = [
    (910104, "บ้านควน", 9101, "อำเภอเมืองสตูล", 91, "สตูล"),
    (610101, "อุทัยใหม่", 6101, "อำเภอเมืองอุทัยธานี", 61, "อุทัยธานี"),
    (100101, "แขวงพระบรมมหาราชวัง", 1001, "เขตพระนคร", 10, "กรุงเทพมหานคร"),
]

# The 15 §3-6 baselines (identical pre/post — zero unanticipated writes).
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
}

# PII digit-run pin: 13-digit digit-runs are national-ID-class data.
DIGIT_RUN = re.compile(r"\d{13}")


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
        raise unittest.SkipTest("SUPABASE_ACCESS_TOKEN not resolvable")
    return tok


_TOKEN = _token()


def q(sql: str):
    """One Management-API query. Raises AssertionError carrying the real
    DB error on failure — a RED must show the true reason (e.g. relation
    "core.manual_wastewater" does not exist). Retries Management-API
    throttling (429) with backoff."""
    import time

    last = None
    for attempt in range(6):
        r = httpx.post(
            API_URL,
            headers={"Authorization": f"Bearer {_TOKEN}", "Content-Type": "application/json"},
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


def _ctx(user_id: str, role: str) -> str:
    return (
        "SET LOCAL role authenticated;"
        f" SET LOCAL request.jwt.claims = '{{\"sub\":\"{user_id}\",\"role\":\"authenticated\"}}';"
        f" ASSERT (SELECT core.fn_is_admin() = ({role == 'admin'})), 'ctx role probe failed';"
    )


def _tx(sql: str) -> str:
    return "BEGIN;\n" + sql + "\nROLLBACK;"


def _migration_seed_statements() -> tuple[list[str], list[str]]:
    """Extract the REAL guarded seed statements from the migration file:
    the 10 manual_wastewater INSERTs + the FIRST address batch INSERT.
    Each seed statement is one physical line terminated by ';'
    (generated programmatically, never hand-typed)."""
    text = MIGRATION_PATH.read_text(encoding="utf-8")
    manual = [
        ln.rstrip()
        for ln in text.splitlines()
        if ln.startswith("INSERT INTO core.manual_wastewater")
    ]
    address = [
        ln.rstrip()
        for ln in text.splitlines()
        if ln.startswith("INSERT INTO core.address")
    ]
    if not manual or not address:
        raise unittest.SkipTest("migration seed statements not present yet (RED mode)")
    return manual, address[:1]


class P3ManualsAddressContract(unittest.TestCase):
    """Live contract for the P3.5 manuals ×2 + address census lane."""

    # ─────────────────────────── SCHEMA ────────────────────────────

    def _assert_shape(self, schema_table: str, expected: list[tuple[str, str, str, bool]]):
        rows = q(
            "SELECT column_name, data_type, is_nullable, column_default,"
            " is_generated FROM information_schema.columns"
            f" WHERE table_schema||'.'||table_name = '{schema_table}'"
            " ORDER BY ordinal_position"
        )
        by_name = {r["column_name"]: r for r in rows}
        for name, dtype, nullable, has_default in expected:
            col = by_name.get(name)
            self.assertIsNotNone(col, f"{schema_table}.{name} missing (RED pre-apply)")
            self.assertEqual(col["data_type"], dtype, f"{schema_table}.{name} type mismatch")
            self.assertEqual(col["is_nullable"], nullable, f"{schema_table}.{name} nullability mismatch")
            self.assertEqual(
                bool(col["column_default"]), has_default,
                f"{schema_table}.{name} default drifted",
            )
        self.assertEqual(len(rows), len(expected), f"{schema_table} column count drifted: {len(rows)}")

    def test_01_manual_wastewater_shape(self):
        self._assert_shape("core.manual_wastewater", MANUAL_COLUMNS)

    def test_02_manual_water_supply_shape(self):
        self._assert_shape("core.manual_water_supply", MANUAL_COLUMNS)

    def test_03_address_shape(self):
        self._assert_shape("core.address", ADDRESS_COLUMNS)

    def test_04_no_address_key_stored_anywhere(self):
        # D1-5/D1-9: the §3.6 Address_Key virtual is NEVER stored — no
        # real column, no generated column on core.address.
        cols = q(
            "SELECT column_name FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name IN"
            " ('manual_wastewater','manual_water_supply','address')"
        )
        names = {r["column_name"].lower() for r in cols}
        self.assertNotIn("address_key", names, "Address_Key stored — D1-5 violated")

    def test_05_no_generated_columns(self):
        rows = q(
            "SELECT table_name, column_name, is_generated FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name IN"
            " ('manual_wastewater','manual_water_supply','address')"
        )
        bad = [r for r in rows if r["is_generated"] != "NEVER"]
        self.assertEqual(bad, [], f"generated column found — display-time-only pin violated: {bad}")

    def test_06_address_unique_and_indexes(self):
        uq = q(
            "SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint"
            " WHERE conrelid = 'core.address'::regclass AND contype = 'u'"
        )
        self.assertTrue(any("tambon_id" in r["def"] for r in uq), "address tambon_id UNIQUE missing")
        idx = q(
            "SELECT indexdef FROM pg_indexes"
            " WHERE schemaname='core' AND tablename='address'"
        )
        defs = " ".join(r["indexdef"] for r in idx)
        self.assertIn("district_id", defs, "address district_id index missing (header/picker lookups)")
        self.assertIn("province_id", defs, "address province_id index missing")

    def test_07_no_triggers_write_derived_values(self):
        # D1-5: no trigger may write the derived Address_Key (or anything)
        # on any of the three tables.
        trg = q(
            "SELECT tgname FROM pg_trigger WHERE tgrelid IN ("
            " 'core.manual_wastewater'::regclass,'core.manual_water_supply'::regclass,"
            " 'core.address'::regclass) AND NOT tgisinternal"
        )
        self.assertEqual(trg, [], f"triggers exist on P3.5 tables — D1-5 violated: {trg}")

    def test_08_legacy_id_unique_both_manuals(self):
        for t in ("manual_wastewater", "manual_water_supply"):
            uq = q(
                "SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint"
                f" WHERE conrelid = 'core.{t}'::regclass AND contype = 'u'"
            )
            self.assertTrue(
                any("legacy_id" in r["def"] for r in uq),
                f"core.{t}.legacy_id UNIQUE missing (verbatim 8-hex lineage; the deferred "
                "คู่มือน้ำประปา seed needs NO second migration)",
            )

    # ──────────────────────────── RLS ─────────────────────────────

    def _assert_rls(self, table: str):
        rls = q(
            "SELECT relrowsecurity FROM pg_class WHERE oid = 'core.%s'::regclass" % table
        )[0]["relrowsecurity"]
        self.assertTrue(rls, f"RLS not enabled on core.{table}")
        pol = q(
            "SELECT policyname, cmd, roles, qual, with_check FROM pg_policies"
            " WHERE schemaname='core' AND tablename='%s'" % table
        )
        self.assertEqual(len(pol), 4, f"core.{table} policy count drifted (D1-6: exactly 4), got {len(pol)}")
        by_cmd = {p["cmd"]: p for p in pol}
        self.assertIn("SELECT", by_cmd, f"core.{table} SELECT policy missing")
        self.assertIn(POLICY_GATE_SELECT, by_cmd["SELECT"]["qual"] or "", f"core.{table} SELECT gate drifted")
        for cmd in ("INSERT", "UPDATE", "DELETE"):
            self.assertIn(cmd, by_cmd, f"core.{table} {cmd} policy missing")
            # INSERT's gate lives in WITH CHECK; DELETE's in USING; UPDATE
            # must carry BOTH (B7 admin-editable with re-check).
            if cmd in ("UPDATE", "DELETE"):
                self.assertIn(POLICY_GATE_ADMIN, by_cmd[cmd]["qual"] or "", f"core.{table} {cmd} USING gate drifted")
            if cmd in ("INSERT", "UPDATE"):
                self.assertIn(POLICY_GATE_ADMIN, by_cmd[cmd]["with_check"] or "", f"core.{table} {cmd} WITH CHECK gate drifted")
        # zero anon policies on the table
        anon = q(
            "SELECT count(*) AS n FROM pg_policies"
            " WHERE schemaname='core' AND tablename='%s'"
            " AND 'anon'::name = ANY(roles)" % table
        )[0]["n"]
        self.assertEqual(anon, 0, f"anon policy exists on core.{table} — fail-closed violated")

    def test_10_rls_manual_wastewater(self):
        self._assert_rls("manual_wastewater")

    def test_11_rls_manual_water_supply(self):
        self._assert_rls("manual_water_supply")

    def test_12_rls_address(self):
        self._assert_rls("address")

    def test_13_facades_security_invoker_flow_all_columns(self):
        for t, expected in (
            ("manual_wastewater", MANUAL_COLUMNS),
            ("manual_water_supply", MANUAL_COLUMNS),
            ("address", ADDRESS_COLUMNS),
        ):
            reg = q(f"SELECT to_regclass('public.{t}') AS reg")[0]["reg"]
            self.assertIsNotNone(reg, f"public.{t} façade missing")
            inv = q(
                "SELECT c.reloptions @> ARRAY['security_invoker=on'] AS inv FROM pg_class c"
                f" WHERE c.oid = 'public.{t}'::regclass"
            )[0]["inv"]
            self.assertTrue(inv, f"public.{t} façade must be security_invoker=on")
            cols = {
                r["column_name"]
                for r in q(
                    "SELECT column_name FROM information_schema.columns"
                    f" WHERE table_schema='public' AND table_name='{t}'"
                )
            }
            for name, _, _, _ in expected:
                self.assertIn(name, cols, f"façade public.{t} does not expose {name}")

    # ──────────────────────────── FLOW ────────────────────────────

    def _one_user(self, role: str) -> str:
        return q(
            "SELECT id FROM core.app_user WHERE role = '%s' ORDER BY created_at LIMIT 1" % role
        )[0]["id"]

    def test_20_manual_flow_admin_write_staff_denied(self):
        admin = self._one_user("admin")
        staff = self._one_user("staff")
        sql = f"""
        DO $probe$
        DECLARE
          v_id uuid;
        BEGIN
          -- ADMIN writes (insert/update/delete all admin per D1-6)
          {_ctx(admin, 'admin')}
          INSERT INTO core.manual_wastewater (legacy_id, title, image_ref, file_ref, source_provenance)
          VALUES ('p3-005-probe', 'ทดสอบระบบ (สังเคราะห์)', NULL, NULL, 'D2 rollback-smoke probe (never persisted)')
          RETURNING id INTO v_id;
          UPDATE core.manual_wastewater SET title = 'ทดสอบแก้ไข' WHERE id = v_id;
          -- legacy_id UNIQUE enforced
          BEGIN
            INSERT INTO core.manual_wastewater (legacy_id, title, source_provenance)
            VALUES ('p3-005-probe', 'ซ้ำ', 'probe');
            RAISE EXCEPTION 'legacy_id UNIQUE not enforced';
          EXCEPTION WHEN unique_violation THEN NULL; END;
          -- NULL legacy_ids still allowed (house shape)
          INSERT INTO core.manual_wastewater (title, source_provenance) VALUES ('x1', 'probe');
          INSERT INTO core.manual_wastewater (title, source_provenance) VALUES ('x2', 'probe');
          DELETE FROM core.manual_wastewater WHERE id = v_id;
          -- STAFF denied on INSERT (admin-only write posture)
          {_ctx(staff, 'staff')}
          BEGIN
            INSERT INTO core.manual_wastewater (title, source_provenance) VALUES ('x3', 'probe');
            RAISE EXCEPTION 'staff INSERT was NOT denied on core.manual_wastewater';
          EXCEPTION WHEN insufficient_privilege THEN NULL; END;
          -- STAFF can SELECT (staff-or-admin read posture)
          IF NOT EXISTS (SELECT 1 FROM core.manual_wastewater) THEN
            RAISE EXCEPTION 'staff SELECT returned nothing (read posture broken)';
          END IF;
          -- STAFF denied on UPDATE/DELETE — RLS USING filters the rows
          -- (0 rows touched, FOUND false) rather than raising; the write
          -- never lands either way.
          UPDATE core.manual_wastewater SET title = 'hacked' WHERE true;
          IF FOUND THEN
            RAISE EXCEPTION 'staff UPDATE was NOT denied (rows updated)';
          END IF;
        END $probe$;
        """
        q(_tx(sql))
        n = q("SELECT count(*) AS n FROM core.manual_wastewater")[0]["n"]
        self.assertEqual(n, 10, f"rollback-smoke leaked rows: {n}")

    def test_21_address_flow_admin_editable_staff_readonly(self):
        admin = self._one_user("admin")
        staff = self._one_user("staff")
        sql = f"""
        DO $probe$
        DECLARE
          v_id uuid;
        BEGIN
          {_ctx(admin, 'admin')}
          -- B7: address is the admin-EDITABLE reference (INSERT/UPDATE/DELETE admin)
          INSERT INTO core.address (tambon_id, tambon_thai, district_id, district_thai, province_id, province_thai, source_provenance)
          VALUES (999999, 'ตำบลทดสอบ', 9999, 'อำเภอทดสอบ', 99, 'จังหวัดทดสอบ', 'D2 rollback-smoke probe (never persisted)')
          RETURNING id INTO v_id;
          UPDATE core.address SET tambon_thai = 'ตำบลทดสอบแก้ไข' WHERE id = v_id;
          DELETE FROM core.address WHERE id = v_id;
          {_ctx(staff, 'staff')}
          BEGIN
            INSERT INTO core.address (tambon_id, tambon_thai, district_id, district_thai, province_id, province_thai, source_provenance)
            VALUES (999998, 'x', 9999, 'x', 99, 'x', 'probe');
            RAISE EXCEPTION 'staff INSERT was NOT denied on core.address';
          EXCEPTION WHEN insufficient_privilege THEN NULL; END;
          -- RLS USING filters: the staff UPDATE touches 0 rows (FOUND
          -- false) rather than raising — the write never lands either way.
          UPDATE core.address SET tambon_thai = 'hacked' WHERE true;
          IF FOUND THEN
            RAISE EXCEPTION 'staff UPDATE was NOT denied on core.address (rows updated)';
          END IF;
        END $probe$;
        """
        q(_tx(sql))
        n = q("SELECT count(*) AS n FROM core.address")[0]["n"]
        self.assertEqual(n, 7436, f"rollback-smoke leaked rows: {n}")

    def test_22_anon_fail_closed_all_three(self):
        for t in ("manual_wastewater", "manual_water_supply", "address"):
            sql = f"""
            DO $$
            BEGIN
              SET LOCAL role anon;
              BEGIN
                IF EXISTS (SELECT 1 FROM core.{t}) THEN
                  RAISE EXCEPTION 'anon read did NOT fail closed — rows returned ({t})';
                END IF;
              EXCEPTION WHEN OTHERS THEN
                NULL;  -- any deny is fail-closed too (grant-level deny)
              END;
            END $$;
            """
            q(_tx(sql))

    # ──────────────────────────── SEED ────────────────────────────

    def test_30_counts_10_0_7436(self):
        ww = q("SELECT count(*) AS n FROM core.manual_wastewater")[0]["n"]
        ws = q("SELECT count(*) AS n FROM core.manual_water_supply")[0]["n"]
        addr = q("SELECT count(*) AS n FROM core.address")[0]["n"]
        self.assertEqual(ww, 10, f"manual_wastewater seed must be 10/10 (pond tab คู่มือ), got {ww}")
        self.assertEqual(ws, 0, f"manual_water_supply must carry 0 rows (SOURCE_UNAVAILABLE — never fabricated), got {ws}")
        self.assertEqual(addr, 7436, f"address census must be 7,436/7,436 (D1-3 full census), got {addr}")

    def test_31_manual_ids_unique_all_8hex(self):
        rows = q(
            "SELECT count(*) AS n, count(DISTINCT legacy_id) AS d FROM core.manual_wastewater"
        )[0]
        self.assertEqual(rows["n"], 10)
        self.assertEqual(rows["d"], 10, "manual_wastewater legacy_id duplicates")
        hexish = q(
            "SELECT count(*) AS n FROM core.manual_wastewater WHERE legacy_id !~ '^[0-9a-f]{8}$'"
        )[0]["n"]
        self.assertEqual(hexish, 0, "manual ids are not the verbatim 8-hex UNIQUEID() lineage")

    def test_32_address_census_shape(self):
        row = q(
            "SELECT (SELECT count(DISTINCT tambon_id) FROM core.address) AS tambons,"
            " (SELECT count(DISTINCT province_id) FROM core.address) AS provinces,"
            " (SELECT count(DISTINCT district_id) FROM core.address) AS districts,"
            " (SELECT count(*) FROM core.address WHERE province_thai = 'อุทัยธานี') AS uthai_rows,"
            " (SELECT count(DISTINCT district_thai) FROM core.address WHERE province_thai = 'อุทัยธานี') AS uthai_districts"
        )[0]
        self.assertEqual(row["tambons"], 7436, "TambonID uniqueness drifted")
        self.assertEqual(row["provinces"], 77, "province count drifted (full 77-province census)")
        self.assertEqual(row["districts"], 928, "DistrictID distinct count drifted (receipt: 928)")
        self.assertEqual(row["uthai_rows"], 70, "อุทัยธานี row count drifted (receipt: 70)")
        self.assertEqual(row["uthai_districts"], 8, "อุทัยธานี district count drifted (receipt: 8)")

    def test_33_manual_spot_rows_verbatim(self):
        for legacy_id, title, image_ref, file_ref in MANUAL_SPOTS:
            row = q(
                "SELECT title, image_ref, file_ref FROM core.manual_wastewater WHERE legacy_id = '%s'" % legacy_id
            )
            self.assertEqual(len(row), 1, f"manual spot row {legacy_id} missing")
            self.assertEqual(row[0]["title"], title, f"{legacy_id} title drifted (verbatim pin)")
            self.assertEqual(row[0]["image_ref"], image_ref, f"{legacy_id} image_ref drifted (verbatim pin)")
            self.assertEqual(row[0]["file_ref"], file_ref, f"{legacy_id} file_ref drifted (verbatim pin)")

    def test_34_address_spot_rows_verbatim(self):
        for tambon, tambon_thai, district, district_thai, province, province_thai in ADDRESS_SPOTS:
            row = q(
                "SELECT tambon_thai, district_id, district_thai, province_id, province_thai"
                " FROM core.address WHERE tambon_id = %d" % tambon
            )
            self.assertEqual(len(row), 1, f"address spot row {tambon} missing")
            self.assertEqual(row[0]["tambon_thai"], tambon_thai, f"{tambon} tambon_thai drifted")
            self.assertEqual(row[0]["district_id"], district, f"{tambon} district_id drifted")
            self.assertEqual(row[0]["district_thai"], district_thai, f"{tambon} district_thai drifted")
            self.assertEqual(row[0]["province_id"], province, f"{tambon} province_id drifted")
            self.assertEqual(row[0]["province_thai"], province_thai, f"{tambon} province_thai drifted")

    def test_35_water_supply_zero_no_appsheet_rows(self):
        # The honest zero: not even one fabricated/reconstructed row.
        n = q("SELECT count(*) AS n FROM core.manual_water_supply")[0]["n"]
        self.assertEqual(n, 0, "คู่มือน้ำประปา must stay 0 rows until the owner sheet-share arrives")

    # ────────────────────────── CANARY ────────────────────────────

    def test_40_guarded_seed_resend_inserts_zero(self):
        manual_stmts, first_address_batch = _migration_seed_statements()
        before = q(
            "SELECT (SELECT count(*) FROM core.manual_wastewater) AS ww,"
            " (SELECT count(*) FROM core.address) AS addr"
        )[0]
        for stmt in manual_stmts:
            q(stmt)  # guarded WHERE NOT EXISTS → 0 rows
        q(first_address_batch[0])
        after = q(
            "SELECT (SELECT count(*) FROM core.manual_wastewater) AS ww,"
            " (SELECT count(*) FROM core.address) AS addr"
        )[0]
        self.assertEqual(after["ww"], before["ww"], "manual seed re-send inserted rows (canary broken)")
        self.assertEqual(after["addr"], before["addr"], "address seed re-send inserted rows (canary broken)")

    # ───────────────────────── BASELINE ───────────────────────────

    def test_50_baselines_intact(self):
        sql = "SELECT " + ", ".join(
            f"(SELECT count(*) FROM {table}) AS {key}" for key, (table, _) in BASELINES.items()
        )
        counts = q(sql)[0]
        for key, (table, expected) in BASELINES.items():
            self.assertEqual(counts[key], expected, f"{table} baseline moved")

    # ─────────────────────────── FILE ────────────────────────────

    def test_60_migration_file_contract(self):
        self.assertTrue(MIGRATION_PATH.exists(), f"{MIGRATION} not written yet")
        text = MIGRATION_PATH.read_text(encoding="utf-8")
        lowered = text.lower()
        for marker in (
            "rollback",
            "drop table if exists",
            "drop view if exists",
            "notify pgrst, 'reload schema'",
        ):
            self.assertIn(marker, lowered, f"rollback/pgrst-trailer documentation missing: {marker}")
        for ref in ("3.22", "3.26", "3.6"):
            self.assertIn(f"§{ref}" if f"§{ref}" in text else ref, text,
                          f"reference-12 §{ref} lineage missing from migration header")
        # D1-4 no-binary invariant: link-only metadata — no bytea columns,
        # no base64/decode() anywhere in the seed SQL.
        self.assertNotIn("bytea", lowered, "bytea found in migration — binary storage forbidden (D1-4)")
        self.assertNotIn("decode(", lowered, "decode( found in migration — binary storage forbidden (D1-4)")
        self.assertNotIn("from_base64", lowered, "base64 found in migration — binary storage forbidden (D1-4)")
        # no absolute Drive fetch URLs for the FILES (link-only; the zxing
        # precedent does not apply — the manual refs are legacy refs verbatim)
        self.assertNotIn("drive.google.com/uc?export=download", lowered,
                         "Drive download URL embedded — files must stay link-only metadata (D1-4)")

    def test_61_no_13_digit_digit_runs_in_migration(self):
        self.assertTrue(MIGRATION_PATH.exists(), f"{MIGRATION} not written yet")
        text = MIGRATION_PATH.read_text(encoding="utf-8")
        # Filename timestamp tokens (the 14-digit YYYYMMDDHHMMSS name) are
        # documentation, not data — scrubbed before the grep; anything else
        # 13+ digits is national-ID-class data and is a violation.
        scrubbed = text.replace(MIGRATION, "")
        m = DIGIT_RUN.search(scrubbed)
        self.assertIsNone(m, f"13-digit digit-run found in migration at {m.start() if m else ''} — PII pin violated")


if __name__ == "__main__":
    unittest.main(verbosity=2)
