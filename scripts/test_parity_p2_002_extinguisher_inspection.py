"""ENV-PARITY-P2-002 C1 — D2 RED-first live contract test for the
extinguisher per-unit inspection flow (AppSheet parity Phase 2, lane P2.2).

Queries ENV_DB (project gllqtbyofrcjzmbnfoeh, ap-southeast-1) through the
same Management-API access path as scripts/apply_migration_api.py
(scripts/_env.py; SUPABASE_ACCESS_TOKEN from Drive secrets — never printed).

Assertion groups (WO §8 D2; every group must FAIL truthfully while migration
20261116000005_parity_p2_002.sql is UNAPPLIED — the RED record goes in the
handoff — and pass GREEN after it):

  SCHEMA   — safety.extinguisher_inspection exists with the pinned
             columns/types/nullability (WO §3.1): id TEXT PK, legacy_id
             UNIQUE, inspection_date TIMESTAMPTZ NOT NULL (NO default —
             AppSheet =now() is form-only), extinguisher_id TEXT NOT NULL
             FK -> safety.fire_extinguisher(legacy_row_id), the five
             snapshot columns, pipe/handle/tank/pressure_gauge/barrier as
             TEXT with NO hard CHECK (documented enums only — D1-2 /
             P1.001 lesson), breakdown_details/cause_of_damaged TEXT NULL,
             inspector_id UUID NULL FK -> core.personnel(id) (P3-1
             correction — core.personnel EXISTS; C8 enum approval pending;
             no auth<->personnel linkage column), NO defect_photo column
             (defect photos link via core.attachment entity_type/
             entity_id — house pattern, D1-8), source_provenance NOT NULL
             DEFAULT, created_at NOT NULL DEFAULT now(). RLS enabled +
             the four pinned policy shapes (SELECT staff-or-admin; INSERT
             staff-or-admin — operational log, unlike the P2.1 masters;
             UPDATE/DELETE admin-only). Both public security_invoker
             façade views exist (extinguisher_inspection +
             fire_extinguisher — the master façade is NEW in this lane;
             P2.1 shipped none because "P2.2 decides façades").
  RPC      — safety.fn_resolve_extinguisher_qr(text) + the public façade
             wrapper exist; SECURITY INVOKER (RLS respected — coordinator
             instruction superseding the WO §4.3 definer wording);
             search_path pinned; EXECUTE revoked from PUBLIC/anon and
             granted to authenticated; blank/unknown id fail-closed with
             the verbatim AppSheet error; known-id resolve returns the
             master + latest-inspection + expiry-status payload (staff-
             context smoke inside a ROLLED-BACK transaction with a fixture
             master row — zero net persistence); anon is fail-closed.
   TRIGGER  — trg_extinguisher_update_expdate AFTER INSERT exists;
             trg_fn_extinguisher_update_expdate is SECURITY DEFINER with
             a pinned search_path; semantics transcribed VERBATIM from the
             AppSheet Update_ExpDate bot (staff-context smoke inside a
             ROLLED-BACK transaction): bump-later-only (chem_exp <= a
             non-NULL master expiry no-op); NULL master expiry + non-NULL
             chem_exp_snapshot ⇒ SET (P2 fix 20261116000006 — AppSheet's
             blank master date behaves as the spreadsheet-serial zero-date
             1899-12-30, so the verbatim bot fires; coordinator ruling
             recorded verbatim in the handoff repair section); master
             expiry becomes the chem_exp of the MAX(inspection_date)
             inspection (latest-wins, incl. the backdated-insert
             recompute); deterministic tiebreak inspection_date DESC,
             created_at DESC, id DESC; NULL chem_exp_snapshot insert is a
             no-op; the definer path works as staff (staff have the SQL
             grant but no RLS policy for master UPDATE — the definer
             trigger is the ONLY staff path).
  HONESTY  — blank id / unknown id raise the verbatim Thai error; anon
             denied on RPC + table; empty-master fail-closed (no fixture
             residue: counts pre/post smoke equal); inspection table has
             ZERO rows (this migration seeds NOTHING).
  COUNTS   — baselines intact: wastewater.reading 907, core.personnel 9,
             core.equipment_spec 4, safety.emergency_light 48,
             safety.fire_extinguisher 0 (SOURCE_UNAVAILABLE), and the new
             inspection table 0.

Run:  uv run --with httpx python -m pytest scripts/test_parity_p2_002_extinguisher_inspection.py -q
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

MIGRATION = "20261116000005_parity_p2_002.sql"
MIGRATION_PATH = Path(__file__).resolve().parent.parent / "supabase/migrations" / MIGRATION

# Verbatim AppSheet QR_CODE Valid If error (ref 12 §3.13, ref 3158-3166;
# double space after "!!" is verbatim).
ERR_QR_NOT_FOUND = "ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ"

# Pinned column shapes (WO §3.1 + P3-1 correction):
# (column, data_type, is_nullable, column_default_nonnull)
EXPECTED_COLUMNS = [
    ("id", "text", "NO", False),
    ("legacy_id", "text", "YES", False),
    ("inspection_date", "timestamp with time zone", "NO", False),
    ("extinguisher_id", "text", "NO", False),
    ("location_snapshot", "text", "YES", False),
    ("type_snapshot", "text", "YES", False),
    ("packed_date_snapshot", "date", "YES", False),
    ("chem_exp_snapshot", "date", "YES", False),
    ("size_snapshot", "text", "YES", False),
    ("pipe", "text", "YES", False),
    ("handle", "text", "YES", False),
    ("tank", "text", "YES", False),
    ("pressure_gauge", "text", "YES", False),
    ("barrier", "text", "YES", False),
    ("breakdown_details", "text", "YES", False),
    ("cause_of_damaged", "text", "YES", False),
    ("inspector_id", "uuid", "YES", False),
    ("source_provenance", "text", "NO", True),
    ("created_at", "timestamp with time zone", "NO", True),
]

# Documented enum columns must carry NO hard CHECK (D1-2 / P1.001 lesson).
ENUM_COLUMNS = ("pipe", "handle", "tank", "pressure_gauge", "barrier", "cause_of_damaged", "type_snapshot")

# Pinned policy shapes (WO §3.1 RLS — the log is staff-writable).
EXPECTED_POLICIES = {
    "extinguisher_inspection_read": ("SELECT", "core.fn_is_staff_or_admin()"),
    "extinguisher_inspection_insert_staff": ("INSERT", "core.fn_is_staff_or_admin()"),
    "extinguisher_inspection_update_admin": ("UPDATE", "core.fn_is_admin()"),
    "extinguisher_inspection_delete_admin": ("DELETE", "core.fn_is_admin()"),
}

# Fixture master row used ONLY inside ROLLED-BACK transactions.
FIXTURE_EXT_ID = "vtiHJw6wpw4c6f4553dms5"  # the real PackedUUID shape observed in the ตรวจสอบถัง sheet
FIXTURE_MASTER_SQL = (
    "INSERT INTO safety.fire_extinguisher "
    "(legacy_row_id, location, extinguisher_type, packed_date, expiry_date, size_label, source_provenance, legacy_id) "
    f"VALUES ('{FIXTURE_EXT_ID}', 'ห้องเคาะปอด', 'เคมีแห้ง (Dry Chemical Extinguishers)', "
    "DATE '2025-09-13', DATE '2026-09-13', '15 ปอนด์', 'fixture (rolled back)', 'fixture-001')"
)


def _token() -> str:
    import os

    tok = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    if not tok:
        from _env import load_secret

        tok = load_secret("SUPABASE_ACCESS_TOKEN")
    if not tok:
        raise unittest.SkipTest("SUPABASE_ACCESS_TOKEN not resolvable (Drive secrets offline)")
    return tok


_TOKEN = _token()


def q(sql: str):
    """One Management-API query. Raises AssertionError carrying the real
    DB error on failure — a RED must show the true reason (e.g.
    relation "safety.extinguisher_inspection" does not exist). Retries
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


def _staff_and_personnel() -> tuple[str, str]:
    """(staff app_user uuid, an eligible personnel uuid) — read-only lookup,
    values stay inside the test process (never printed)."""
    rows = q(
        "SELECT (SELECT id FROM core.app_user WHERE role = 'staff' ORDER BY created_at LIMIT 1) AS staff_id,"
        " (SELECT id FROM core.personnel WHERE position IN ('นักวิชาการสาธารณสุข','พนักงานบริการ')"
        "   AND (status IS DISTINCT FROM 'ลาออก') ORDER BY full_name LIMIT 1) AS personnel_id"
    )[0]
    assert rows["staff_id"] and rows["personnel_id"], "live staff app_user / eligible personnel not found"
    return rows["staff_id"], rows["personnel_id"]


def _staff_ctx_assign(staff_id: str) -> str:
    """SQL that switches a single-request transaction into an
    authenticated-staff context (the Management API connects as postgres;
    auth.uid() reads request.jwt.claims — live-verified)."""
    return (
        "SET LOCAL role authenticated;"
        f" SET LOCAL request.jwt.claims = '{{\"sub\":\"{staff_id}\",\"role\":\"authenticated\"}}';"
    )


def _tx(sql: str) -> str:
    """Wrap a smoke script in an explicit single-request BEGIN…ROLLBACK so
    NOTHING persists even on success (zero-net-persistence contract; the
    Management API auto-commits a bare statement). On an assertion RAISE
    the server-side aborted transaction rolls itself back."""
    return "BEGIN;\n" + sql + "\nROLLBACK;"


class P2ExtinguisherInspectionContract(unittest.TestCase):
    """Live contract for the P2.2 extinguisher inspection flow."""

    # ─────────────────────────── SCHEMA ────────────────────────────

    def test_01_table_exists(self):
        reg = q("SELECT to_regclass('safety.extinguisher_inspection') AS reg")[0]["reg"]
        self.assertIsNotNone(reg, "safety.extinguisher_inspection does not exist")

    def test_02_columns_types_nullability_defaults(self):
        rows = q(
            "SELECT column_name, data_type, is_nullable,"
            " (column_default IS NOT NULL) AS has_default"
            " FROM information_schema.columns"
            " WHERE table_schema='safety' AND table_name='extinguisher_inspection'"
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
        # defect_photo is NOT a column (house attachment-link pattern, D1-8)
        self.assertNotIn("defect_photo", actual, "defect_photo must be a core.attachment link, not a column")

    def test_03_primary_and_foreign_keys(self):
        pk = q(
            "SELECT a.attname FROM pg_index i"
            " JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)"
            " WHERE i.indrelid = 'safety.extinguisher_inspection'::regclass AND i.indisprimary"
        )
        self.assertEqual([r["attname"] for r in pk], ["id"], "PK must be (id)")
        fk = q(
            "SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint"
            " WHERE conrelid = 'safety.extinguisher_inspection'::regclass AND contype = 'f'"
        )
        defs = {r["conname"]: r["def"] for r in fk}
        self.assertTrue(
            any("safety.fire_extinguisher" in d and "extinguisher_id" in d for d in defs.values()),
            f"FK -> safety.fire_extinguisher(legacy_row_id) missing, got: {defs}",
        )
        self.assertTrue(
            any("core.personnel" in d and "inspector_id" in d for d in defs.values()),
            f"FK -> core.personnel(id) missing (P3-1 correction), got: {defs}",
        )
        uq = q(
            "SELECT conname FROM pg_constraint"
            " WHERE conrelid = 'safety.extinguisher_inspection'::regclass AND contype = 'u'"
        )
        self.assertIn("extinguisher_inspection_legacy_id_key", [r["conname"] for r in uq], "legacy_id UNIQUE missing")

    def test_04_documented_enums_have_no_check(self):
        rows = q(
            "SELECT count(*) AS n FROM pg_constraint"
            " WHERE conrelid = 'safety.extinguisher_inspection'::regclass AND contype = 'c'"
            " AND conname NOT LIKE '%not_null%'"
        )
        # The table pins documented enums verbatim; NO hard CHECK constraints
        # on pipe/handle/tank/pressure_gauge/barrier/cause_of_damaged/
        # type_snapshot (D1-2 — unknown ≠ rejected, P1.001 lesson).
        self.assertEqual(rows[0]["n"], 0, "unexpected CHECK constraint(s) on documented-enum columns")

    def test_05_rls_enabled_and_policy_shapes(self):
        rls = q(
            "SELECT relrowsecurity FROM pg_class WHERE oid = 'safety.extinguisher_inspection'::regclass"
        )[0]["relrowsecurity"]
        self.assertTrue(rls, "RLS not enabled")
        pol = q(
            "SELECT policyname AS policy_name, cmd, qual, with_check FROM pg_policies"
            " WHERE schemaname='safety' AND tablename='extinguisher_inspection'"
        )
        actual = {r["policy_name"]: (r["cmd"], r["qual"] or r["with_check"]) for r in pol}
        self.assertEqual(len(pol), 4, f"expected exactly 4 policies, got {sorted(actual)}")
        for name, (cmd, gate) in EXPECTED_POLICIES.items():
            self.assertIn(name, actual, f"policy {name} missing")
            self.assertEqual(actual[name][0], cmd, f"policy {name} cmd mismatch")
            self.assertIn(gate, actual[name][1], f"policy {name} gate mismatch: {actual[name][1]}")

    def test_06_public_facade_views(self):
        reg = q(
            "SELECT (SELECT to_regclass('public.extinguisher_inspection')) AS insp,"
            " (SELECT to_regclass('public.fire_extinguisher')) AS fe"
        )[0]
        self.assertIsNotNone(reg["insp"], "public.extinguisher_inspection façade missing")
        self.assertIsNotNone(reg["fe"], "public.fire_extinguisher façade missing (manual pick + admin entry need it)")
        inv = q(
            "SELECT c.reloptions @> ARRAY['security_invoker=on'] AS inv"
            " FROM pg_class c WHERE c.oid = 'public.extinguisher_inspection'::regclass"
        )[0]["inv"]
        self.assertTrue(inv, "public.extinguisher_inspection must be security_invoker=on")
        inv2 = q(
            "SELECT c.reloptions @> ARRAY['security_invoker=on'] AS inv"
            " FROM pg_class c WHERE c.oid = 'public.fire_extinguisher'::regclass"
        )[0]["inv"]
        self.assertTrue(inv2, "public.fire_extinguisher must be security_invoker=on")

    # ─────────────────────────── RPC ────────────────────────────

    def test_10_rpc_functions_exist_invoker_search_path(self):
        fns = q(
            "SELECT n.nspname, p.prosecdef, p.proconfig"
            " FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace"
            " WHERE p.proname = 'fn_resolve_extinguisher_qr'"
        )
        schemas = {r["nspname"]: r for r in fns}
        self.assertIn("safety", schemas, "safety.fn_resolve_extinguisher_qr missing")
        self.assertIn("public", schemas, "public.fn_resolve_extinguisher_qr façade missing")
        for schema, row in schemas.items():
            self.assertFalse(row["prosecdef"], f"{schema}.fn_resolve_extinguisher_qr must be SECURITY INVOKER")
            self.assertIsNotNone(row["proconfig"], f"{schema}.fn_resolve_extinguisher_qr search_path unpinned")
            self.assertTrue(
                any(c.startswith("search_path=") for c in row["proconfig"]),
                f"{schema}.fn_resolve_extinguisher_qr search_path not pinned",
            )

    def test_11_rpc_execute_grants(self):
        acl = q(
            "SELECT (aclexplode(p.proacl)).grantee AS grantee_oid, (aclexplode(p.proacl)).privilege_type AS priv"
            " FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace"
            " WHERE p.proname = 'fn_resolve_extinguisher_qr' AND n.nspname = 'safety'"
        )
        roles = q(
            "SELECT (SELECT oid FROM pg_roles WHERE rolname='anon') AS anon_oid,"
            " (SELECT oid FROM pg_roles WHERE rolname='authenticated') AS auth_oid"
        )[0]
        exec_grantees = {r["grantee_oid"] for r in acl if r["priv"] == "EXECUTE"}
        self.assertIn(roles["auth_oid"], exec_grantees, "EXECUTE not granted to authenticated")
        self.assertNotIn(roles["anon_oid"], exec_grantees, "EXECUTE must not be granted to anon")
        self.assertNotIn(0, exec_grantees, "EXECUTE must be revoked from PUBLIC (grantee oid 0)")

    def test_12_rpc_blank_and_unknown_fail_closed_verbatim(self):
        staff_id, _ = _staff_and_personnel()
        # Single-request rolled-back transaction; the SQL itself asserts via
        # RAISE on mismatch so pass == no exception, fail == real message.
        sql = f"""
        DO $$
        DECLARE
          v_err text;
        BEGIN
          {_staff_ctx_assign(staff_id)}
          -- blank / whitespace-only must fail with the verbatim error
          BEGIN
            PERFORM safety.fn_resolve_extinguisher_qr('');
            RAISE EXCEPTION 'blank qr did NOT fail closed';
          EXCEPTION WHEN OTHERS THEN
            v_err := SQLERRM;
            IF v_err NOT LIKE '%ไม่พบข้อมูล!!%' THEN
              RAISE EXCEPTION 'blank qr wrong error: %', v_err;
            END IF;
          END;
          BEGIN
            PERFORM safety.fn_resolve_extinguisher_qr('   ');
            RAISE EXCEPTION 'whitespace qr did NOT fail closed';
          EXCEPTION WHEN OTHERS THEN
            v_err := SQLERRM;
            IF v_err NOT LIKE '%ไม่พบข้อมูล!!%' THEN
              RAISE EXCEPTION 'whitespace qr wrong error: %', v_err;
            END IF;
          END;
          -- unknown id must fail with the verbatim error
          BEGIN
            PERFORM safety.fn_resolve_extinguisher_qr('zzzzunknownzzzzzzzzzzzzz');
            RAISE EXCEPTION 'unknown qr did NOT fail closed';
          EXCEPTION WHEN OTHERS THEN
            v_err := SQLERRM;
            IF v_err NOT LIKE '%ไม่พบข้อมูล!!%' THEN
              RAISE EXCEPTION 'unknown qr wrong error: %', v_err;
            END IF;
          END;
        END $$;
        """
        q(_tx(sql))

    def test_13_rpc_known_id_payload_shape_staff_smoke(self):
        staff_id, personnel_id = _staff_and_personnel()
        sql = f"""
        DO $$
        DECLARE
          v jsonb;
        BEGIN
          -- fixture master + prior inspection are seeded OUTSIDE the staff
          -- context (master INSERT is admin-only per the P2.1 policy);
          -- everything after the SET LOCAL runs as the staff user.
          {FIXTURE_MASTER_SQL};
          {_staff_ctx_assign(staff_id)}
          INSERT INTO safety.extinguisher_inspection
            (id, legacy_id, inspection_date, extinguisher_id, location_snapshot, type_snapshot,
             packed_date_snapshot, chem_exp_snapshot, size_snapshot, pipe, handle, tank,
             pressure_gauge, barrier, breakdown_details, cause_of_damaged, inspector_id,
             source_provenance)
          VALUES ('deadbeef', 'insp-0001', '2026-01-15T10:00:00+07', '{FIXTURE_EXT_ID}',
                  'ห้องเคาะปอด', 'เคมีแห้ง (Dry Chemical Extinguishers)', '2025-09-13',
                  '2026-01-15', '15 ปอนด์', 'ปกติ', 'ปกติ', 'ปกติ', 'ปกติ', 'ไม่มี',
                  'ไม่หมดอายุ', NULL, '{personnel_id}', 'fixture (rolled back)');
          v := safety.fn_resolve_extinguisher_qr('{FIXTURE_EXT_ID}');
          IF (v->'master'->>'legacy_row_id') IS DISTINCT FROM '{FIXTURE_EXT_ID}' THEN
            RAISE EXCEPTION 'master payload wrong: %', v;
          END IF;
          IF (v->'master'->>'location') IS DISTINCT FROM 'ห้องเคาะปอด' THEN
            RAISE EXCEPTION 'master location wrong: %', v;
          END IF;
          IF (v->'latest_inspection'->>'id') IS DISTINCT FROM 'deadbeef' THEN
            RAISE EXCEPTION 'latest_inspection wrong: %', v;
          END IF;
          -- master expiry 2026-09-13 <= today (2026-11) → หมดอายุ
          IF (v->>'expiry_status') IS DISTINCT FROM 'หมดอายุ' THEN
            RAISE EXCEPTION 'expiry_status wrong (expected หมดอายุ): %', v->>'expiry_status';
          END IF;
          -- both id FORMS resolve identically: raw legacy_row_id and the
          -- 22-char PackedUUID ARE the same string here; a padded variant
          -- must also resolve (the RPC btrims)
          v := safety.fn_resolve_extinguisher_qr('  {FIXTURE_EXT_ID} ');
          IF (v->'master'->>'legacy_row_id') IS DISTINCT FROM '{FIXTURE_EXT_ID}' THEN
            RAISE EXCEPTION 'padded qr did not resolve: %', v;
          END IF;
        END $$;
        """
        q(_tx(sql))

    def test_14_anon_fail_closed(self):
        # Fail-closed contract: an anon caller gets NO payload — either the
        # verbatim unknown-id error (EXECUTE granted path, RLS hides the
        # master) or a permission denial (EXECUTE revoked path). A returned
        # jsonb is the failure.
        sql = """
        DO $$
        BEGIN
          SET LOCAL role anon;
          BEGIN
            PERFORM public.fn_resolve_extinguisher_qr('whatever');
            RAISE EXCEPTION 'anon rpc did NOT fail closed — payload returned';
          EXCEPTION WHEN OTHERS THEN
            NULL;  -- any deny is fail-closed
          END;
          BEGIN
            PERFORM safety.fn_resolve_extinguisher_qr('whatever');
            RAISE EXCEPTION 'anon rpc (safety) did NOT fail closed — payload returned';
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;
        END $$;
        """
        q(_tx(sql))

    # ─────────────────────────── TRIGGER ───────────────────────────

    def test_20_trigger_and_function_shape(self):
        trg = q(
            "SELECT tgtype, tgfoid::regproc AS fn, pg_get_triggerdef(oid) AS def"
            " FROM pg_trigger WHERE tgrelid = 'safety.extinguisher_inspection'::regclass"
            " AND NOT tgisinternal"
        )
        self.assertEqual(len(trg), 1, f"expected exactly 1 trigger, got {len(trg)}")
        self.assertIn("INSERT", trg[0]["def"], "trigger must fire on INSERT")
        self.assertIn("AFTER", trg[0]["def"], "trigger must be AFTER INSERT")
        self.assertTrue(trg[0]["fn"].endswith("trg_fn_extinguisher_update_expdate"), "trigger function name mismatch")
        fn = q(
            "SELECT prosecdef, proconfig FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace"
            " WHERE p.proname = 'trg_fn_extinguisher_update_expdate' AND n.nspname = 'safety'"
        )[0]
        self.assertTrue(fn["prosecdef"], "trigger function must be SECURITY DEFINER")
        self.assertTrue(
            any(c.startswith("search_path=") for c in fn["proconfig"] or []),
            "trigger function search_path not pinned",
        )

    def test_21_trigger_bump_later_only_and_latest_wins(self):
        staff_id, _ = _staff_and_personnel()
        sql = f"""
        DO $$
        DECLARE
          v_exp date;
        BEGIN
          -- fixture master is seeded OUTSIDE the staff context (admin-only
          -- INSERT policy); inspections + asserts run as the staff user.
          {FIXTURE_MASTER_SQL};  -- expiry 2026-09-13
          {_staff_ctx_assign(staff_id)}
          -- (1) insert with chem_exp <= expiry → NO bump
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, source_provenance)
          VALUES ('a0000001', '2026-10-01T09:00:00+07', '{FIXTURE_EXT_ID}', '2026-09-01', 'fixture (rolled back)');
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
          IF v_exp IS DISTINCT FROM DATE '2026-09-13' THEN
            RAISE EXCEPTION 'bump-later-only violated: earlier chem_exp bumped master to %', v_exp;
          END IF;
          -- (2) insert with chem_exp > expiry → bump to THAT value (latest = NEW)
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, source_provenance)
          VALUES ('a0000002', '2026-11-01T09:00:00+07', '{FIXTURE_EXT_ID}', '2029-01-01', 'fixture (rolled back)');
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
          IF v_exp IS DISTINCT FROM DATE '2029-01-01' THEN
            RAISE EXCEPTION 'latest-wins violated: expected 2029-01-01, got %', v_exp;
          END IF;
          -- (3) backdated insert (older inspection_date) whose chem_exp
          --     STILL passes the bump guard (2029-06-01 > 2029-01-01):
          --     SET recomputes from MAX(inspection_date) → a0000002
          --     (2026-11-01) remains latest → master stays 2029-01-01,
          --     NOT the backdated row's larger chem_exp — the verbatim
          --     latest-wins SET semantics.
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, source_provenance)
          VALUES ('a0000003', '2026-10-15T09:00:00+07', '{FIXTURE_EXT_ID}', '2029-06-01', 'fixture (rolled back)');
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
          IF v_exp IS DISTINCT FROM DATE '2029-01-01' THEN
            RAISE EXCEPTION 'latest-wins SET must ignore backdated larger chem_exp; got %', v_exp;
          END IF;
        END $$;
        """
        q(_tx(sql))

    def test_22_trigger_null_master_expiry_sets_then_null_chem_noops(self):
        staff_id, _ = _staff_and_personnel()
        sql = f"""
        DO $$
        DECLARE
          v_exp date;
        BEGIN
          -- NULL master expiry + non-NULL chem_exp ⇒ SET (P2 fix
          -- 20261116000006; D5 finding issuecomment-6930206052): AppSheet's
          -- blank master date behaves as the spreadsheet-serial zero-date
          -- (1899-12-30), so the verbatim bot condition
          -- [_THISROW].[chem_exp] > ANY(...) FIRES and the real recorded
          -- chem_exp propagates — a real value is SET, never fabricated.
          -- Decision receipt: coordinator ruling (delegated decision,
          -- standing owner instruction 2026-11-15) recorded VERBATIM in
          -- docs/ai/handoffs/ENV-PARITY-P2-002-GLM.md §7 (repair section).
          -- Fixture masters are seeded OUTSIDE the staff context.
          INSERT INTO safety.fire_extinguisher
            (legacy_row_id, location, expiry_date, source_provenance, legacy_id)
          VALUES ('nullxppackuuid22ch', 'ทดสอบ', NULL, 'fixture (rolled back)', 'fixture-002');
          INSERT INTO safety.fire_extinguisher
            (legacy_row_id, location, expiry_date, source_provenance, legacy_id)
          VALUES ('nullchepackuuid22ch', 'ทดสอบ', DATE '2026-09-13', 'fixture (rolled back)', 'fixture-003');
          {_staff_ctx_assign(staff_id)}
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, source_provenance)
          VALUES ('b0000001', '2026-11-01T09:00:00+07', 'nullxppackuuid22ch', '2030-01-01', 'fixture (rolled back)');
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = 'nullxppackuuid22ch';
          IF v_exp IS DISTINCT FROM DATE '2030-01-01' THEN
            RAISE EXCEPTION 'NULL master expiry + non-NULL chem_exp must SET per ruling 20261116000006; got %', v_exp;
          END IF;
          -- NULL chem_exp_snapshot insert → no-op (guard IS NOT NULL;
          -- blank ≈ blank is not strictly greater — bot never fires)
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, source_provenance)
          VALUES ('b0000002', '2026-11-01T09:00:00+07', 'nullchepackuuid22ch', NULL, 'fixture (rolled back)');
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = 'nullchepackuuid22ch';
          IF v_exp IS DISTINCT FROM DATE '2026-09-13' THEN
            RAISE EXCEPTION 'NULL chem_exp insert must be a no-op; got %', v_exp;
          END IF;
        END $$;
        """
        q(_tx(sql))

    def test_23_trigger_deterministic_tiebreak(self):
        staff_id, _ = _staff_and_personnel()
        sql = f"""
        DO $$
        DECLARE
          v_exp date;
        BEGIN
          {FIXTURE_MASTER_SQL};  -- expiry 2026-09-13
          {_staff_ctx_assign(staff_id)}
          -- existing row with THE SAME inspection_date as the incoming NEW
          -- row but an id that sorts AFTER the NEW id → tiebreak must pick
          -- NEW via created_at DESC. NOTE: created_at defaults to now()
          -- (transaction-stable), so within ONE transaction both rows
          -- would tie on created_at; real saves are one transaction per
          -- HTTP request, which the explicit created_at values here model.
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, created_at, source_provenance)
          VALUES ('zzzz9999', '2026-11-05T09:00:00+07', '{FIXTURE_EXT_ID}', '2031-06-01', '2026-11-05T09:00:01+07', 'fixture (rolled back)');
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, created_at, source_provenance)
          VALUES ('aaaa0001', '2026-11-05T09:00:00+07', '{FIXTURE_EXT_ID}', '2032-01-01', '2026-11-05T09:00:02+07', 'fixture (rolled back)');
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
          IF v_exp IS DISTINCT FROM DATE '2032-01-01' THEN
            RAISE EXCEPTION 'tiebreak must pick the later-created row (2032-01-01); got %', v_exp;
          END IF;
          -- determinism: id DESC is the FINAL fallback — equal
          -- inspection_date AND equal created_at → lexicographically
          -- greater id wins (pinned rule)
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, created_at, source_provenance)
          VALUES ('bbbb0002', '2026-11-05T09:00:00+07', '{FIXTURE_EXT_ID}', '2033-07-01', '2026-11-05T09:00:02+07', 'fixture (rolled back)');
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
          IF v_exp IS DISTINCT FROM DATE '2033-07-01' THEN
            RAISE EXCEPTION 'id-DESC tiebreak must pick bbbb0002; got %', v_exp;
          END IF;
        END $$;
        """
        q(_tx(sql))

    def test_24_trigger_definer_path_needed_for_staff(self):
        # staff have the SQL-level grant (P2.1 blanket grant) but NO RLS
        # policy allows a staff UPDATE on the master → a direct UPDATE
        # silently affects 0 rows; the SECURITY DEFINER trigger is the
        # ONLY staff path that can bump expiry. Pins the RLS reality the
        # definer design depends on.
        staff_id, _ = _staff_and_personnel()
        grant = q(
            "SELECT has_table_privilege('authenticated', 'safety.fire_extinguisher', 'UPDATE') AS can"
        )[0]["can"]
        self.assertTrue(grant, "precondition: authenticated holds the SQL UPDATE grant (P2.1)")
        sql = f"""
        DO $$
        DECLARE
          v_exp date;
        BEGIN
          {FIXTURE_MASTER_SQL};
          {_staff_ctx_assign(staff_id)}
          BEGIN
            UPDATE safety.fire_extinguisher SET expiry_date = DATE '2035-01-01'
             WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
          EXCEPTION WHEN insufficient_privilege THEN
            RAISE EXCEPTION 'unexpected insufficient_privilege — RLS should silently filter, not error';
          END;
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
          IF v_exp IS DISTINCT FROM DATE '2026-09-13' THEN
            RAISE EXCEPTION 'staff direct UPDATE must be RLS-denied (0 rows); master changed to %', v_exp;
          END IF;
          -- yet the staff INSERT path bumps through the definer trigger:
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, source_provenance)
          VALUES ('c0000001', '2026-11-01T09:00:00+07', '{FIXTURE_EXT_ID}', '2033-03-01', 'fixture (rolled back)');
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
          IF v_exp IS DISTINCT FROM DATE '2033-03-01' THEN
            RAISE EXCEPTION 'SECURITY DEFINER staff path failed; got %', v_exp;
          END IF;
        END $$;
        """
        q(_tx(sql))

    # ─────────────────────────── HONESTY / COUNTS ────────────────────

    def test_30_no_seed_zero_rows_and_baselines(self):
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
        self.assertEqual(counts["ext"], 0, "fire_extinguisher must stay UNSEEDED (SOURCE_UNAVAILABLE)")
        self.assertEqual(counts["insp"], 0, "this migration seeds NOTHING — inspection table must be empty")

    def test_31_migration_carries_documented_rollback(self):
        self.assertTrue(MIGRATION_PATH.exists(), f"{MIGRATION} not written yet")
        text = MIGRATION_PATH.read_text(encoding="utf-8")
        lowered = text.lower()
        for marker in ("rollback", "drop trigger if exists", "drop function if exists", "drop table if exists"):
            self.assertIn(marker, lowered, f"rollback documentation missing: {marker}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
