"""ENV-PARITY-P2-003 C1 — D2 RED-first live contract test for the
emergency-light check flow (AppSheet parity Phase 2, lane P2.3).

Queries ENV_DB (project gllqtbyofrcjzmbnfoeh, ap-southeast-1) through the
same Management-API access path as scripts/apply_migration_api.py
(SUPABASE_ACCESS_TOKEN from process env or the Drive-backed loader).

Assertion groups (WO §7 D2; every group must FAIL truthfully while migration
20261117000001_parity_p2_003.sql is UNAPPLIED — the RED record goes in the
handoff — and pass GREEN after it):

  SCHEMA   — safety.emergency_light_check exists with the pinned
             columns/types/nullability (WO §3.1): id TEXT PK (ENV 8-hex),
             legacy_id UNIQUE (the AppSheet row_ID verbatim), check_date
             DATE NOT NULL (date-only at source — D1-4; NO default, the
             AppSheet =now() init is form-only), erl_payload TEXT NOT NULL
             (the scanned/typed code verbatim — 40 distinct observed incl.
             the non-padded '31'), light_id TEXT NULL FK ->
             safety.emergency_light(erl_id) (the FK TARGET erl_id is the
             master TEXT PK — the WO §8 D1-2 "UUID" wording is
             unsatisfiable against the live master, which has no UUID
             column; recorded deviation in the handoff/PR), location_snapshot
             TEXT NULL (auto-fill COPY; the '31' row's blank => NULL),
             persistency/position/test_result TEXT NOT NULL (documented
             enums verbatim, NO hard CHECK — D1-2/P1.001 lesson), auditor_id
             UUID NULL FK -> core.personnel(id) + auditor_legacy_id TEXT
             NULL (PII pin D1-3 CLOSED — VALUES carry ONLY the resolved
             UUID or NULL), broken_detail TEXT NULL free text (NO CHECK),
             pic_path TEXT NULL (AppSheet legacy refs verbatim),
             status TEXT NULL (3-value documented enum, blank => NULL, NO
             CHECK), source_provenance NOT NULL DEFAULT, created_at NOT
             NULL DEFAULT now(). RLS enabled + the four pinned policy
             shapes (SELECT staff-or-admin; INSERT staff-or-admin —
             operational log; UPDATE/DELETE admin-only). public.
             emergency_light_check + public.emergency_light
             security_invoker façade views (the master façade is NEW — the
             manual pick list needs REST reachability; P2.2 precedent).
  RPC      — safety.fn_resolve_emergency_light_qr(text) + the public façade
             wrapper exist; SECURITY INVOKER (RLS respected — P2.2 §11.2
             coordinator binding carried); search_path pinned; EXECUTE
             revoked from PUBLIC/anon, granted to authenticated; blank/
             unknown id fail-closed with the honest Thai error; known-id
             resolve returns master + prior-check summary (staff-context
             smoke inside a ROLLED-BACK transaction — zero net persistence);
             anon is fail-closed.
  SEED     — 332/332 rows; the §2.2 distribution table verbatim
             (Date_time years 2568x144 / 2569x188 => 2025/2026; Persistency
             มี315/ไม่มี17; Position เหมาะสม329/ไม่เหมาะสม3; test_result
             ผ่าน316/ไม่ผ่าน16; Status blank300/ขอติดตั้ง16/แจ้งซ่อม14/
             แจ้งย้ายตำแหน่ง2; Broken_detail 16 nonempty; Pic 31 nonempty;
             Auditor 77 nonempty at source => auditor_id 0 + auditor_
             legacy_id 0 committed — the single distinct 13-digit account
             had NO deterministic core.personnel match, D1-3 CLOSED);
             light_id resolved 331/332 (exact erl_id match) + the ONE
             non-padded '31' row NULL/verbatim (D1-1 — never normalized to
             '031'); legacy_id 332 distinct; guarded idempotency (re-seed
             is a no-op — proven by count stability inside a rolled-back
             re-INSERT); source_provenance pin (workbook + gid).
  HONESTY  — the '31' row: erl_payload verbatim '31', light_id NULL,
             location_snapshot NULL, never matched to '031'; blanks stay
             NULL (status 300 NULLs; location 1 NULL); no 13-digit string
             anywhere in the migration file (grep-test of the SQL text);
             baselines intact: wastewater.reading 907, core.personnel 9,
             core.equipment_spec 4, safety.emergency_light 48,
             safety.fire_extinguisher 0, safety.extinguisher_inspection 0.
  FILE     — the pinned migration file exists with documented rollback SQL
             and carries the source lineage (workbook + gid + fetch date).

Run:  python3 -m pytest scripts/test_parity_p2_003_emergency_light_check.py -q
(or:  python3 scripts/test_parity_p2_003_emergency_light_check.py )
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

MIGRATION = "20261117000001_parity_p2_003.sql"
MIGRATION_PATH = Path(__file__).resolve().parent.parent / "supabase/migrations" / MIGRATION

# Honest Thai fail-closed error — the §3.13-family QR Valid If error
# ('ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ', double space verbatim). Reference 12 §3.33
# pins NO Check-specific error text (D1-5 spirit) — the house reuses the
# safety-flow verbatim for the resolve RPC.
ERR_QR_NOT_FOUND = "ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ"

# Pinned column shapes (WO §3.1 + the light_id TEXT deviation):
# (column, data_type, is_nullable, column_default_nonnull)
EXPECTED_COLUMNS = [
    ("id", "text", "NO", False),
    ("legacy_id", "text", "YES", False),
    ("check_date", "date", "NO", False),
    ("erl_payload", "text", "NO", False),
    ("light_id", "text", "YES", False),
    ("location_snapshot", "text", "YES", False),
    ("persistency", "text", "NO", False),
    ("position", "text", "NO", False),
    ("test_result", "text", "NO", False),
    ("auditor_id", "uuid", "YES", False),
    ("auditor_legacy_id", "text", "YES", False),
    ("broken_detail", "text", "YES", False),
    ("pic_path", "text", "YES", False),
    ("status", "text", "YES", False),
    ("source_provenance", "text", "NO", True),
    ("created_at", "timestamp with time zone", "NO", True),
]

# Documented enum columns must carry NO hard CHECK (D1-2 / P1.001 lesson;
# broken_detail free text — 'น๊อตหลุด'/'ถอดปลั๊กออก' observed beyond the
# 5-value enum).
ENUM_COLUMNS = ("persistency", "position", "test_result", "status", "broken_detail")

# Pinned policy shapes (WO §3.1 RLS — the log is staff-writable).
EXPECTED_POLICIES = {
    "emergency_light_check_read": ("SELECT", "core.fn_is_staff_or_admin()"),
    "emergency_light_check_insert_staff": ("INSERT", "core.fn_is_staff_or_admin()"),
    "emergency_light_check_update_admin": ("UPDATE", "core.fn_is_admin()"),
    "emergency_light_check_delete_admin": ("DELETE", "core.fn_is_admin()"),
}

SOURCE_PROVENANCE = (
    "AppSheet Sheets export Check 2026-11-17 "
    "(workbook 1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw gid 1164639452)"
)

# §2.2 distribution pins (byte-verified against /tmp CSV 2026-11-17).
DIST_PINS = {
    "total": 332,
    "year_2025": 144,   # พ.ศ. 2568
    "year_2026": 188,   # พ.ศ. 2569
    "persistency_มี": 315,
    "persistency_ไม่มี": 17,
    "position_เหมาะสม": 329,
    "position_ไม่เหมาะสม": 3,
    "result_ผ่าน": 316,
    "result_ไม่ผ่าน": 16,
    "status_null": 300,
    "status_ขอติดตั้ง": 16,
    "status_แจ้งซ่อม": 14,
    "status_แจ้งย้ายตำแหน่ง": 2,
    "broken_nonnull": 16,
    "pic_nonnull": 31,
    "auditor_id_nonnull": 0,        # D1-3 CLOSED: no deterministic match
    "auditor_legacy_nonnull": 0,    #   => UUID-or-NULL both NULL + disclosure
    "light_id_null": 1,             # the '31' row only
    "location_null": 1,             # the same '31' row
    "legacy_distinct": 332,
}

# Spot-check rows (CSV bytes vs seeded values; non-PII columns only — the
# Auditor column is suppressed repo-wide per D1-3).
SPOT_ROWS = [
    {   # joined-enum Broken_detail + พ.ศ. 2568 date
        "legacy_id": "c33588cf", "check_date": "2025-06-06", "erl_payload": "001",
        "light_id": "001", "location_snapshot": "ในห้องควบคุมโรค เบอร์1",
        "persistency": "มี", "position": "ไม่เหมาะสม", "test_result": "ผ่าน",
        "broken_detail": "ไม่มีหัตถการ , มีแสงสว่างจากธรรมชาติ , ไม่มีเวรดึก",
        "pic_path": None, "status": "แจ้งย้ายตำแหน่ง",
    },
    {   # free-text Broken_detail token + legacy Pic ref
        "legacy_id": "430671f5", "check_date": "2025-06-17", "erl_payload": "031",
        "light_id": "031", "location_snapshot": "ห้องยา",
        "persistency": "มี", "position": "เหมาะสม", "test_result": "ไม่ผ่าน",
        "broken_detail": "น๊อตหลุด",
        "pic_path": "Check_Images/430671f5.Pic.074443.jpg", "status": "แจ้งซ่อม",
    },
    {   # THE unresolved '31' row — verbatim payload, NULL light/location
        "legacy_id": "305cd644", "check_date": "2025-08-19", "erl_payload": "31",
        "light_id": None, "location_snapshot": None,
        "persistency": "มี", "position": "เหมาะสม", "test_result": "ไม่ผ่าน",
        "broken_detail": "น๊อตหลุด", "pic_path": None, "status": "แจ้งซ่อม",
    },
]


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
    DB error on failure — a RED must show the true reason (e.g.
    relation "safety.emergency_light_check" does not exist). Retries
    Management-API throttling (429) with backoff."""
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


def _staff_ctx_assign(staff_id: str) -> str:
    return (
        "SET LOCAL role authenticated;"
        f" SET LOCAL request.jwt.claims = '{{\"sub\":\"{staff_id}\",\"role\":\"authenticated\"}}';"
    )


def _tx(sql: str) -> str:
    return "BEGIN;\n" + sql + "\nROLLBACK;"


class P2EmergencyLightCheckContract(unittest.TestCase):
    """Live contract for the P2.3 emergency-light check flow."""

    # ─────────────────────────── SCHEMA ────────────────────────────

    def test_01_table_exists(self):
        reg = q("SELECT to_regclass('safety.emergency_light_check') AS reg")[0]["reg"]
        self.assertIsNotNone(reg, "safety.emergency_light_check does not exist")

    def test_02_columns_types_nullability_defaults(self):
        rows = q(
            "SELECT column_name, data_type, is_nullable,"
            " (column_default IS NOT NULL) AS has_default"
            " FROM information_schema.columns"
            " WHERE table_schema='safety' AND table_name='emergency_light_check'"
            " ORDER BY ordinal_position"
        )
        actual = {r["column_name"]: (r["data_type"], r["is_nullable"], r["has_default"]) for r in rows}
        for col, dtype, nullable, has_default in EXPECTED_COLUMNS:
            self.assertIn(col, actual, f"column {col} missing")
            self.assertEqual(
                actual[col],
                (dtype, nullable, has_default),
                f"column {col} shape mismatch: {actual[col]} != {(dtype, nullable, has_default)}",
            )

    def test_03_primary_unique_and_foreign_keys(self):
        pk = q(
            "SELECT a.attname FROM pg_index i"
            " JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)"
            " WHERE i.indrelid = 'safety.emergency_light_check'::regclass AND i.indisprimary"
        )
        self.assertEqual([r["attname"] for r in pk], ["id"], "PK must be (id)")
        fk = q(
            "SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint"
            " WHERE conrelid = 'safety.emergency_light_check'::regclass AND contype = 'f'"
        )
        defs = {r["conname"]: r["def"] for r in fk}
        self.assertTrue(
            any("safety.emergency_light" in d and "light_id" in d for d in defs.values()),
            f"FK -> safety.emergency_light(erl_id) missing, got: {defs}",
        )
        self.assertTrue(
            any("core.personnel" in d and "auditor_id" in d for d in defs.values()),
            f"FK -> core.personnel(id) missing (PII pin), got: {defs}",
        )
        uq = q(
            "SELECT conname FROM pg_constraint"
            " WHERE conrelid = 'safety.emergency_light_check'::regclass AND contype = 'u'"
        )
        self.assertIn("emergency_light_check_legacy_id_key", [r["conname"] for r in uq], "legacy_id UNIQUE missing")

    def test_04_documented_enums_have_no_check(self):
        rows = q(
            "SELECT count(*) AS n FROM pg_constraint"
            " WHERE conrelid = 'safety.emergency_light_check'::regclass AND contype = 'c'"
        )
        # persistency/position/test_result/status are DOCUMENTED enums verbatim,
        # broken_detail is free-text-capable — NO hard CHECK on this table
        # (D1-2/P1.001 lesson; the WO §3.1 pin governs over the instruction's
        # loose "CHECK" shorthand — recorded in the handoff).
        self.assertEqual(rows[0]["n"], 0, "unexpected CHECK constraint(s) on documented-enum columns")

    def test_05_rls_enabled_and_policy_shapes(self):
        rls = q(
            "SELECT relrowsecurity FROM pg_class WHERE oid = 'safety.emergency_light_check'::regclass"
        )[0]["relrowsecurity"]
        self.assertTrue(rls, "RLS not enabled")
        pol = q(
            "SELECT policyname AS policy_name, cmd, qual, with_check FROM pg_policies"
            " WHERE schemaname='safety' AND tablename='emergency_light_check'"
        )
        actual = {r["policy_name"]: (r["cmd"], r["qual"] or r["with_check"]) for r in pol}
        self.assertEqual(len(pol), 4, f"expected exactly 4 policies, got {sorted(actual)}")
        for name, (cmd, gate) in EXPECTED_POLICIES.items():
            self.assertIn(name, actual, f"policy {name} missing")
            self.assertEqual(actual[name][0], cmd, f"policy {name} cmd mismatch")
            self.assertIn(gate, actual[name][1], f"policy {name} gate mismatch: {actual[name][1]}")

    def test_06_public_facade_views(self):
        reg = q(
            "SELECT (SELECT to_regclass('public.emergency_light_check')) AS chk,"
            " (SELECT to_regclass('public.emergency_light')) AS el"
        )[0]
        self.assertIsNotNone(reg["chk"], "public.emergency_light_check façade missing")
        self.assertIsNotNone(reg["el"], "public.emergency_light façade missing (manual pick needs it)")
        inv = q(
            "SELECT c.reloptions @> ARRAY['security_invoker=on'] AS inv"
            " FROM pg_class c WHERE c.oid IN ('public.emergency_light_check'::regclass,"
            " 'public.emergency_light'::regclass)"
        )
        self.assertEqual(len(inv), 2, "expected both façade views")
        for r in inv:
            self.assertTrue(r["inv"], "façade views must be security_invoker=on")

    # ─────────────────────────── RPC ────────────────────────────

    def test_10_rpc_functions_exist_invoker_search_path(self):
        fns = q(
            "SELECT n.nspname, p.prosecdef, p.proconfig"
            " FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace"
            " WHERE p.proname = 'fn_resolve_emergency_light_qr'"
        )
        schemas = {r["nspname"]: r for r in fns}
        self.assertIn("safety", schemas, "safety.fn_resolve_emergency_light_qr missing")
        self.assertIn("public", schemas, "public.fn_resolve_emergency_light_qr façade missing")
        for schema, row in schemas.items():
            self.assertFalse(row["prosecdef"], f"{schema}.fn_resolve_emergency_light_qr must be SECURITY INVOKER")
            self.assertIsNotNone(row["proconfig"], f"{schema}.fn_resolve_emergency_light_qr search_path unpinned")
            self.assertTrue(
                any(c.startswith("search_path=") for c in row["proconfig"]),
                f"{schema}.fn_resolve_emergency_light_qr search_path not pinned",
            )

    def test_11_rpc_execute_grants(self):
        acl = q(
            "SELECT (aclexplode(p.proacl)).grantee AS grantee_oid, (aclexplode(p.proacl)).privilege_type AS priv"
            " FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace"
            " WHERE p.proname = 'fn_resolve_emergency_light_qr' AND n.nspname = 'public'"
        )
        roles = q(
            "SELECT (SELECT oid FROM pg_roles WHERE rolname='anon') AS anon_oid,"
            " (SELECT oid FROM pg_roles WHERE rolname='authenticated') AS auth_oid"
        )[0]
        exec_grantees = {r["grantee_oid"] for r in acl if r["priv"] == "EXECUTE"}
        self.assertIn(roles["auth_oid"], exec_grantees, "EXECUTE not granted to authenticated")
        self.assertNotIn(roles["anon_oid"], exec_grantees, "EXECUTE must not be granted to anon")
        self.assertNotIn(0, exec_grantees, "EXECUTE must be revoked from PUBLIC (grantee oid 0)")

    def test_12_rpc_blank_and_unknown_fail_closed(self):
        staff_id = q(
            "SELECT id FROM core.app_user WHERE role = 'staff' ORDER BY created_at LIMIT 1"
        )[0]["id"]
        self.assertTrue(staff_id, "live staff app_user not found")
        sql = f"""
        DO $$
        DECLARE
          v_err text;
        BEGIN
          {_staff_ctx_assign(staff_id)}
          BEGIN
            PERFORM safety.fn_resolve_emergency_light_qr('');
            RAISE EXCEPTION 'blank qr did NOT fail closed';
          EXCEPTION WHEN OTHERS THEN
            v_err := SQLERRM;
            IF v_err NOT LIKE '%ไม่พบข้อมูล!!%' THEN
              RAISE EXCEPTION 'blank qr wrong error: %', v_err;
            END IF;
          END;
          BEGIN
            PERFORM safety.fn_resolve_emergency_light_qr('   ');
            RAISE EXCEPTION 'whitespace qr did NOT fail closed';
          EXCEPTION WHEN OTHERS THEN
            v_err := SQLERRM;
            IF v_err NOT LIKE '%ไม่พบข้อมูล!!%' THEN
              RAISE EXCEPTION 'whitespace qr wrong error: %', v_err;
            END IF;
          END;
          BEGIN
            PERFORM safety.fn_resolve_emergency_light_qr('zzz-unknown-erl');
            RAISE EXCEPTION 'unknown qr did NOT fail closed';
          EXCEPTION WHEN OTHERS THEN
            v_err := SQLERRM;
            IF v_err NOT LIKE '%ไม่พบข้อมูล!!%' THEN
              RAISE EXCEPTION 'unknown qr wrong error: %', v_err;
            END IF;
          END;
          -- the non-padded historical payload '31' has NO master row — the
          -- resolve path must fail closed for NEW entries too (the seeded
          -- check row keeps its verbatim payload honestly; resolution at
          -- write time stays exact-match)
          BEGIN
            PERFORM safety.fn_resolve_emergency_light_qr('31');
            RAISE EXCEPTION 'non-padded 31 did NOT fail closed';
          EXCEPTION WHEN OTHERS THEN
            v_err := SQLERRM;
            IF v_err NOT LIKE '%ไม่พบข้อมูล!!%' THEN
              RAISE EXCEPTION '31 wrong error: %', v_err;
            END IF;
          END;
        END $$;
        """
        q(_tx(sql))

    def test_13_rpc_known_id_payload_shape_staff_smoke(self):
        staff_id = q(
            "SELECT id FROM core.app_user WHERE role = 'staff' ORDER BY created_at LIMIT 1"
        )[0]["id"]
        sql = f"""
        DO $$
        DECLARE
          v jsonb;
          v_count bigint;
        BEGIN
          {_staff_ctx_assign(staff_id)}
          -- resolve a REAL master row (no writes)
          v := safety.fn_resolve_emergency_light_qr('001');
          IF (v->'master'->>'erl_id') IS DISTINCT FROM '001' THEN
            RAISE EXCEPTION 'master payload wrong: %', v;
          END IF;
          IF (v->'master'->>'location') IS NULL THEN
            RAISE EXCEPTION 'master location missing: %', v;
          END IF;
          IF (v->'prior'->>'check_count') IS NULL THEN
            RAISE EXCEPTION 'prior check_count missing: %', v;
          END IF;
          v_count := (v->'prior'->>'check_count')::bigint;
          IF v_count < 1 THEN
            RAISE EXCEPTION 'light 001 must carry seeded checks (joined row c33588cf et al.)';
          END IF;
          IF (v->'prior'->>'latest_check_date') IS NULL OR (v->'prior'->>'latest_test_result') IS NULL THEN
            RAISE EXCEPTION 'prior summary incomplete: %', v;
          END IF;
          -- a fixture check (inserted as staff) is the prior latest: its
          -- date must postdate ALL seeded rows (seeded 2569 rows run to
          -- 2026-09-16) — 2027-06-15 qualifies.
          INSERT INTO safety.emergency_light_check
            (id, check_date, erl_payload, light_id, persistency, position, test_result, source_provenance)
          VALUES ('deadbeef', DATE '2027-06-15', '001', '001', 'มี', 'เหมาะสม', 'ไม่ผ่าน', 'fixture (rolled back)');
          v := safety.fn_resolve_emergency_light_qr('001');
          IF (v->'prior'->>'latest_test_result') IS DISTINCT FROM 'ไม่ผ่าน' THEN
            RAISE EXCEPTION 'prior latest must be the fixture row: %', v;
          END IF;
          IF (v->'prior'->>'check_count')::bigint <> v_count + 1 THEN
            RAISE EXCEPTION 'check_count must advance: %', v;
          END IF;
        END $$;
        """
        q(_tx(sql))

    def test_14_anon_fail_closed(self):
        sql = """
        DO $$
        BEGIN
          SET LOCAL role anon;
          BEGIN
            PERFORM public.fn_resolve_emergency_light_qr('001');
            RAISE EXCEPTION 'anon rpc did NOT fail closed — payload returned';
          EXCEPTION WHEN OTHERS THEN
            NULL;  -- any deny is fail-closed
          END;
          BEGIN
            BEGIN
              PERFORM 1 FROM public.emergency_light_check LIMIT 1;
              RAISE EXCEPTION 'anon table read did NOT fail closed — rows returned';
            EXCEPTION WHEN insufficient_privilege THEN
              NULL;
            END;
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;
        END $$;
        """
        q(_tx(sql))

    # ─────────────────────────── SEED / DISTRIBUTIONS ────────────────────

    def _seeded(self) -> bool:
        reg = q("SELECT to_regclass('safety.emergency_light_check') AS reg")[0]["reg"]
        return reg is not None

    def test_20_seed_count_332(self):
        self.assertTrue(self._seeded(), "table absent — seed not applied")
        n = q("SELECT count(*) AS n FROM safety.emergency_light_check")[0]["n"]
        self.assertEqual(n, DIST_PINS["total"], "seed count mismatch")

    def test_21_seed_distribution_pins(self):
        counts = q(f"""
        SELECT
          (SELECT count(*) FROM safety.emergency_light_check WHERE check_date >= DATE '2025-01-01' AND check_date < DATE '2026-01-01') AS year_2025,
          (SELECT count(*) FROM safety.emergency_light_check WHERE check_date >= DATE '2026-01-01' AND check_date < DATE '2027-01-01') AS year_2026,
          (SELECT count(*) FROM safety.emergency_light_check WHERE persistency = 'มี') AS persistency_มี,
          (SELECT count(*) FROM safety.emergency_light_check WHERE persistency = 'ไม่มี') AS persistency_ไม่มี,
          (SELECT count(*) FROM safety.emergency_light_check WHERE position = 'เหมาะสม') AS position_เหมาะสม,
          (SELECT count(*) FROM safety.emergency_light_check WHERE position = 'ไม่เหมาะสม') AS position_ไม่เหมาะสม,
          (SELECT count(*) FROM safety.emergency_light_check WHERE test_result = 'ผ่าน') AS result_ผ่าน,
          (SELECT count(*) FROM safety.emergency_light_check WHERE test_result = 'ไม่ผ่าน') AS result_ไม่ผ่าน,
          (SELECT count(*) FROM safety.emergency_light_check WHERE status IS NULL) AS status_null,
          (SELECT count(*) FROM safety.emergency_light_check WHERE status = 'ขอติดตั้ง') AS status_ขอติดตั้ง,
          (SELECT count(*) FROM safety.emergency_light_check WHERE status = 'แจ้งซ่อม') AS status_แจ้งซ่อม,
          (SELECT count(*) FROM safety.emergency_light_check WHERE status = 'แจ้งย้ายตำแหน่ง') AS status_แจ้งย้ายตำแหน่ง,
          (SELECT count(*) FROM safety.emergency_light_check WHERE broken_detail IS NOT NULL) AS broken_nonnull,
          (SELECT count(*) FROM safety.emergency_light_check WHERE pic_path IS NOT NULL) AS pic_nonnull,
          (SELECT count(*) FROM safety.emergency_light_check WHERE auditor_id IS NOT NULL) AS auditor_id_nonnull,
          (SELECT count(*) FROM safety.emergency_light_check WHERE auditor_legacy_id IS NOT NULL) AS auditor_legacy_nonnull,
          (SELECT count(*) FROM safety.emergency_light_check WHERE light_id IS NULL) AS light_id_null,
          (SELECT count(*) FROM safety.emergency_light_check WHERE location_snapshot IS NULL) AS location_null,
          (SELECT count(DISTINCT legacy_id) FROM safety.emergency_light_check) AS legacy_distinct
        """)[0]
        for k, want in DIST_PINS.items():
            if k == "total":
                continue  # covered by test_20 (seed count)
            self.assertEqual(counts[k], want, f"pin {k}: got {counts[k]}, want {want}")

    def test_22_unresolved_31_row_verbatim(self):
        rows = q("""
        SELECT legacy_id, check_date, erl_payload, light_id, location_snapshot,
               persistency, position, test_result, broken_detail, status
          FROM safety.emergency_light_check WHERE erl_payload = '31'
        """)
        self.assertEqual(len(rows), 1, "exactly one '31' payload row")
        r = rows[0]
        self.assertEqual(r["legacy_id"], "305cd644")
        self.assertEqual(str(r["check_date"]), "2025-08-19")
        self.assertIsNone(r["light_id"], "the '31' row must stay unresolved (never '031')")
        self.assertIsNone(r["location_snapshot"], "AppSheet's own auto-fill failed at source — stays NULL")
        self.assertEqual(r["broken_detail"], "น๊อตหลุด")
        self.assertEqual(r["status"], "แจ้งซ่อม")
        # never normalized: no seeded row carries light_id '031' while payload '31'
        n = q("SELECT count(*) AS n FROM safety.emergency_light_check WHERE erl_payload = '31' AND light_id IS NOT NULL")[0]["n"]
        self.assertEqual(n, 0, "'31' must never be normalized to '031'")

    def test_23_light_references_resolve_331(self):
        counts = q("""
        SELECT count(*) AS total,
               count(light_id) AS resolved
          FROM safety.emergency_light_check
        """)[0]
        self.assertEqual(counts["total"], 332)
        self.assertEqual(counts["resolved"], 331, "331/332 exact-reference (the '31' row unresolved)")
        orphan = q("""
        SELECT count(*) AS n FROM safety.emergency_light_check c
         WHERE c.light_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM safety.emergency_light m WHERE m.erl_id = c.light_id)
        """)[0]["n"]
        self.assertEqual(orphan, 0, "every non-NULL light_id must hit the 48-row master")

    def test_24_spot_rows_match_csv_bytes(self):
        for want in SPOT_ROWS:
            rows = q(
                "SELECT legacy_id, check_date, erl_payload, light_id, location_snapshot,"
                " persistency, position, test_result, broken_detail, pic_path, status"
                " FROM safety.emergency_light_check WHERE legacy_id = '%s'" % want["legacy_id"]
            )
            self.assertEqual(len(rows), 1, f"row {want['legacy_id']} missing")
            r = rows[0]
            self.assertEqual(str(r["check_date"]), want["check_date"], f"{want['legacy_id']} date")
            for col in ("erl_payload", "location_snapshot", "persistency", "position",
                        "test_result", "broken_detail", "pic_path", "status"):
                self.assertEqual(r[col], want[col], f"{want['legacy_id']}.{col}")
            self.assertEqual(r["light_id"], want["light_id"], f"{want['legacy_id']}.light_id")
            # traceability + lineage pins
            prov = q(
                "SELECT source_provenance FROM safety.emergency_light_check WHERE legacy_id = '%s'"
                % want["legacy_id"]
            )[0]["source_provenance"]
            self.assertEqual(prov, SOURCE_PROVENANCE, f"{want['legacy_id']} source_provenance")
            # the seed's 8-hex id == legacy_id (AppSheet row_ID verbatim, both)
            rid = q(
                "SELECT id FROM safety.emergency_light_check WHERE legacy_id = '%s'" % want["legacy_id"]
            )[0]["id"]
            self.assertEqual(rid, want["legacy_id"], "seed id must be the row_ID verbatim (8-hex both)")

    def test_25_guarded_reseed_is_noop(self):
        n_before = q("SELECT count(*) AS n FROM safety.emergency_light_check")[0]["n"]
        # re-run the migration's seed block inside a ROLLED-BACK transaction:
        # the WHERE NOT EXISTS guards must leave the count untouched.
        sql_text = MIGRATION_PATH.read_text(encoding="utf-8")
        inserts = [ln.strip() for ln in sql_text.splitlines() if ln.strip().startswith("INSERT INTO safety.emergency_light_check")]
        self.assertGreater(len(inserts), 0, "migration carries no seed INSERTs (file test)")
        probe = "BEGIN;\n" + "\n".join(inserts[:5]) + f"\nROLLBACK;"
        q(probe)
        n_after = q("SELECT count(*) AS n FROM safety.emergency_light_check")[0]["n"]
        self.assertEqual(n_before, n_after, "guarded reseed must be a no-op")

    # ─────────────────────────── HONESTY / COUNTS ────────────────────

    def test_30_no_13_digit_strings_in_migration_file(self):
        self.assertTrue(MIGRATION_PATH.exists(), f"{MIGRATION} not written yet")
        text = MIGRATION_PATH.read_text(encoding="utf-8")
        m = re.search(r"\d{13}", text)
        self.assertIsNone(m, f"13-digit digit-run found in migration at {m.start() if m else ''} — PII pin violated")
        # the suppression is also structural: auditor columns appear only in
        # the DDL, never with a value
        for ln in text.splitlines():
            if "auditor_legacy_id" in ln and "INSERT" in ln.upper():
                self.assertIn("NULL", ln, "auditor_legacy_id seeded non-NULL in migration VALUES")

    def test_31_migration_carries_documented_rollback(self):
        self.assertTrue(MIGRATION_PATH.exists(), f"{MIGRATION} not written yet")
        text = MIGRATION_PATH.read_text(encoding="utf-8")
        lowered = text.lower()
        for marker in ("rollback", "drop function if exists", "drop view if exists", "drop table if exists"):
            self.assertIn(marker, lowered, f"rollback documentation missing: {marker}")
        self.assertIn("1164639452", text, "source lineage (tab gid) missing from migration header")

    def test_32_baselines_intact(self):
        counts = q(
            "SELECT (SELECT count(*) FROM wastewater.reading) AS reading,"
            " (SELECT count(*) FROM core.personnel) AS personnel,"
            " (SELECT count(*) FROM core.equipment_spec) AS spec,"
            " (SELECT count(*) FROM safety.emergency_light) AS light,"
            " (SELECT count(*) FROM safety.fire_extinguisher) AS ext,"
            " (SELECT count(*) FROM safety.extinguisher_inspection) AS insp"
        )[0]
        self.assertEqual(counts["reading"], 907, "wastewater.reading baseline moved")
        self.assertEqual(counts["personnel"], 9, "core.personnel baseline moved")
        self.assertEqual(counts["spec"], 4, "core.equipment_spec baseline moved")
        self.assertEqual(counts["light"], 48, "safety.emergency_light baseline moved")
        self.assertEqual(counts["ext"], 0, "fire_extinguisher must stay UNSEEDED")
        self.assertEqual(counts["insp"], 0, "extinguisher_inspection baseline moved")


if __name__ == "__main__":
    unittest.main(verbosity=2)
