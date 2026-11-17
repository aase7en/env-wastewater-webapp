"""ENV-PARITY-P2-004 C1 — D2 RED-first live contract test for the coliform
×3 two-step testing flow (AppSheet parity Phase 2, lane P2.4).

Queries ENV_DB (project gllqtbyofrcjzmbnfoeh, ap-southeast-1) through the
same Management-API access path as scripts/apply_migration_api.py
(SUPABACE_ACCESS_TOKEN from process env or scripts/_env.py resolution).

Assertion groups (WO §7 D2; the absent-schema groups must FAIL truthfully
while migration 20261117000003_parity_p2_004.sql is UNAPPLIED — the RED
record goes in the handoff — and pass GREEN after it):

  SCHEMA   — food.lab_test carries the 9 additive columns (sample_source,
             collect_point, sample_person_id, collected_by_id,
             collected_by_legacy, reporter_id, reporter_legacy,
             equipment_legacy, result_image) + legacy_id TEXT NULL UNIQUE +
             source_provenance TEXT NULL, each NULLable with NO default
             (WO §3.1); the pre-existing 15 columns byte-identical
             (types/nullability/defaults); FK constraints
             sample_person_id/collected_by_id/reporter_id ->
             core.personnel(id) (PII pin D1-5); legacy_id UNIQUE enforced
             (NULL duplicates still allowed); the two FOOD-CORE-001
             canonical CHECKs remain and NO new CHECK is added on the
             documented-enum columns (D1-8/P1.001 — enums are UI-restricted
             verbatim lists, never hard CHECKs).
  RLS      — RLS enabled + the ONE policy lab_test_authenticated_rw
             (FOR ALL TO authenticated, USING/WITH CHECK
             core.fn_is_staff_or_admin()) untouched (D1-6); audit trigger
             trg_audit_log + dormant trg_decrement_reagent intact; the
             public.lab_test security_invoker façade exposes the new
             columns automatically (select * — no façade change).
  FLOW     — the two-step semantics live (transactional rollback-smoke,
             zero net persistence): a collect-only INSERT as staff gets
             sample_date DEFAULT CURRENT_DATE with ALL result-side columns
             NULL (result/mpn_value/reported_date/reporter_id carry NO DB
             defaults — D1-7 app-supplied step-2); the later result UPDATE
             succeeds; duplicate legacy_id is rejected (unique_violation);
             NULL legacy_id duplicates allowed; anon read fails closed
             (RLS default-deny, no anon policy).
  HONESTY  — 0 seed rows (SOURCE_UNAVAILABLE disclosure D1-3; the migration
             carries NO INSERT block); baselines intact: wastewater.reading
             907, core.personnel 9, core.equipment_spec 4,
             safety.emergency_light 48, safety.fire_extinguisher 0,
             safety.extinguisher_inspection 0, safety.emergency_light_check
             332, food.lab_test 0; no 13-digit digit-run anywhere in the
             migration file (PII pin — filename timestamp tokens scrubbed
             before the grep, they are documentation not data).
  FILE     — the pinned migration file exists; documents its rollback SQL;
             carries the house `notify pgrst, 'reload schema'` trailer; the
             source lineage (reference 12 §3.11/§3.16/§3.17/§3.19) is in
             the header; ZERO INSERT statements (0-seed).

Run:  python3 -m pytest scripts/test_parity_p2_004_coliform_lab_test.py -q
(or:  python3 scripts/test_parity_p2_004_coliform_lab_test.py )
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

MIGRATION = "20261117000003_parity_p2_004.sql"
MIGRATION_PATH = Path(__file__).resolve().parent.parent / "supabase/migrations" / MIGRATION

# The 9 additive columns + the 2 traceability columns (WO §3.1):
# (column, data_type, is_nullable, has_default) — ALL NULLable, NO default
# (D1-7: result-side values are app-supplied step-2 writes; even
# sample_source/collect_point stay NULLable — unknown stays unknown).
EXPECTED_NEW_COLUMNS = [
    ("sample_source", "text", "YES", False),
    ("collect_point", "text", "YES", False),
    ("sample_person_id", "uuid", "YES", False),
    ("collected_by_id", "uuid", "YES", False),
    ("collected_by_legacy", "text", "YES", False),
    ("reporter_id", "uuid", "YES", False),
    ("reporter_legacy", "text", "YES", False),
    ("equipment_legacy", "text", "YES", False),
    ("result_image", "text", "YES", False),
    ("legacy_id", "text", "YES", False),
    ("source_provenance", "text", "YES", False),
]

# The pre-existing 15 columns must stay byte-identical (WO §2.2 shape of
# record at base e2e845f/d22c993).
EXPECTED_BASE_COLUMNS = [
    ("id", "uuid", "NO", True),
    ("sample_date", "date", "NO", True),
    ("sample_type", "text", "YES", False),
    ("test_type", "text", "YES", False),
    ("result", "text", "YES", False),
    ("reported_date", "date", "YES", False),
    ("technician", "text", "YES", False),
    ("recorded_by", "uuid", "YES", False),
    ("note", "text", "YES", False),
    ("created_at", "timestamp with time zone", "NO", True),
    ("sample_point", "text", "YES", False),
    ("mpn_value", "numeric", "YES", False),
    ("reagent_used", "jsonb", "YES", False),
    ("reported_by_lab_tech", "text", "YES", False),
    ("follow_up_action", "text", "YES", False),
]

# Result-side columns — the AppSheet Result_date/Result_bac./ผู้รายงาน
# step-2 writes: NO DB default may exist on any of them (D1-7; the
# AppSheet TODAY() inits are form-only).
RESULT_SIDE_COLUMNS = ("result", "mpn_value", "reported_date", "reporter_id")

# Documented-enum / free-text new columns — NO hard CHECK (D1-8).
ENUM_COLUMNS = (
    "sample_source",
    "collect_point",
    "equipment_legacy",
    "result_image",
    "collected_by_legacy",
    "reporter_legacy",
    "result",
)

# Pinned policy shape (D1-6 — the existing policy is UNTOUCHED).
EXPECTED_POLICY = ("lab_test_authenticated_rw", "ALL", "core.fn_is_staff_or_admin()")

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
    DB error on failure — a RED must show the true reason (e.g. column
    "sample_source" does not exist). Retries Management-API throttling
    (429) with backoff."""
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


class P2ColiformLabTestContract(unittest.TestCase):
    """Live contract for the P2.4 coliform ×3 food.lab_test extension."""

    # ─────────────────────────── SCHEMA ────────────────────────────

    def test_01_columns_types_nullability_defaults(self):
        rows = q(
            "SELECT column_name, data_type, is_nullable, column_default"
            " FROM information_schema.columns"
            " WHERE table_schema='food' AND table_name='lab_test'"
            " ORDER BY ordinal_position"
        )
        by_name = {r["column_name"]: r for r in rows}
        for name, dtype, nullable, has_default in EXPECTED_NEW_COLUMNS:
            col = by_name.get(name)
            self.assertIsNotNone(col, f"additive column {name} missing (RED pre-apply)")
            self.assertEqual(col["data_type"], dtype, f"{name} type mismatch")
            self.assertEqual(col["is_nullable"], nullable, f"{name} nullability mismatch")
            self.assertEqual(
                bool(col["column_default"]), has_default,
                f"{name} must carry NO default (D1-7 app-supplied semantics)",
            )
        for name, dtype, nullable, has_default in EXPECTED_BASE_COLUMNS:
            col = by_name.get(name)
            self.assertIsNotNone(col, f"pre-existing column {name} vanished")
            self.assertEqual(col["data_type"], dtype, f"{name} type drifted")
            self.assertEqual(col["is_nullable"], nullable, f"{name} nullability drifted")
            self.assertEqual(
                bool(col["column_default"]), has_default,
                f"{name} default drifted (existing columns untouched)",
            )
        self.assertEqual(len(rows), 26, f"expected exactly 26 columns total, got {len(rows)}")
        # mpn_value numeric(10,2) precision pins (existing shape intact).
        mpn = q(
            "SELECT numeric_precision AS p, numeric_scale AS s FROM information_schema.columns"
            " WHERE table_schema='food' AND table_name='lab_test' AND column_name='mpn_value'"
        )[0]
        self.assertEqual((mpn["p"], mpn["s"]), (10, 2), "mpn_value numeric(10,2) drifted")

    def test_02_sample_date_default_is_current_date(self):
        d = q(
            "SELECT column_default FROM information_schema.columns"
            " WHERE table_schema='food' AND table_name='lab_test' AND column_name='sample_date'"
        )[0]["column_default"]
        self.assertIsNotNone(d, "sample_date NOT NULL DEFAULT CURRENT_DATE lost")
        self.assertIn("CURRENT_DATE", (d or "").upper(), f"sample_date default drifted: {d}")

    def test_03_result_side_columns_carry_no_defaults(self):
        rows = q(
            "SELECT column_name, column_default FROM information_schema.columns"
            " WHERE table_schema='food' AND table_name='lab_test'"
            f" AND column_name IN {RESULT_SIDE_COLUMNS}"
        )
        got = {r["column_name"]: r["column_default"] for r in rows}
        self.assertEqual(len(got), len(RESULT_SIDE_COLUMNS), "result-side column set drifted")
        for name, d in got.items():
            self.assertIsNone(d, f"result-side column {name} gained a DB default (D1-7 violated)")

    def test_04_foreign_keys_to_personnel(self):
        fk = q(
            "SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint"
            " WHERE conrelid = 'food.lab_test'::regclass AND contype = 'f'"
        )
        defs = {r["conname"]: r["def"] for r in fk}
        for col in ("sample_person_id", "collected_by_id", "reporter_id"):
            self.assertTrue(
                any(col in d and "core.personnel" in d for d in defs.values()),
                f"FK {col} -> core.personnel(id) missing (PII pin D1-5), got: {defs}",
            )

    def test_05_legacy_id_unique(self):
        uq = q(
            "SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint"
            " WHERE conrelid = 'food.lab_test'::regclass AND contype = 'u'"
        )
        self.assertTrue(
            any("legacy_id" in r["def"] for r in uq),
            f"legacy_id UNIQUE missing (deferred-seed traceability), got: {[r['def'] for r in uq]}",
        )

    def test_06_documented_enums_have_no_new_check(self):
        rows = q(
            "SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint"
            " WHERE conrelid = 'food.lab_test'::regclass AND contype = 'c'"
        )
        names = {r["conname"] for r in rows}
        # FOOD-CORE-001's canonical pair must survive; NOTHING else is added.
        self.assertEqual(
            names, {"lab_test_sample_type_check", "lab_test_test_type_check"},
            f"CHECK constraint set drifted (D1-8: no hard CHECK on documented enums), got: {names}",
        )
        text = " ".join(r["def"] for r in rows)
        for col in ENUM_COLUMNS:
            self.assertNotIn(col, text, f"new CHECK mentions {col} — D1-8 violated")

    # ──────────────────────────── RLS ─────────────────────────────

    def test_10_rls_enabled_and_policy_untouched(self):
        rls = q(
            "SELECT relrowsecurity FROM pg_class WHERE oid = 'food.lab_test'::regclass"
        )[0]["relrowsecurity"]
        self.assertTrue(rls, "RLS not enabled on food.lab_test")
        pol = q(
            "SELECT policyname, cmd, roles, qual, with_check FROM pg_policies"
            " WHERE schemaname='food' AND tablename='lab_test'"
        )
        self.assertEqual(len(pol), 1, f"policy count drifted (D1-6: exactly 1), got {len(pol)}")
        p = pol[0]
        name, cmd, gate = EXPECTED_POLICY
        self.assertEqual(p["policyname"], name, "policy renamed — D1-6 violated")
        self.assertEqual(p["cmd"], cmd, "policy cmd changed — D1-6 violated")
        self.assertIn("authenticated", str(p["roles"] or ""), "policy roles changed")
        self.assertIn(gate, p["qual"] or "", "policy USING gate changed — D1-6 violated")
        self.assertIn(gate, p["with_check"] or "", "policy WITH CHECK gate changed — D1-6 violated")

    def test_11_triggers_intact(self):
        trg = q(
            "SELECT tgname FROM pg_trigger"
            " WHERE tgrelid = 'food.lab_test'::regclass AND NOT tgisinternal"
        )
        names = {r["tgname"] for r in trg}
        self.assertIn("trg_audit_log", names, "audit trigger lost")
        self.assertIn("trg_decrement_reagent", names, "dormant reagent trigger lost (must stay UNTOUCHED)")

    def test_12_facade_exposes_new_columns(self):
        reg = q("SELECT to_regclass('public.lab_test') AS reg")[0]["reg"]
        self.assertIsNotNone(reg, "public.lab_test façade missing")
        inv = q(
            "SELECT c.reloptions @> ARRAY['security_invoker=on'] AS inv FROM pg_class c"
            " WHERE c.oid = 'public.lab_test'::regclass"
        )[0]["inv"]
        self.assertTrue(inv, "façade must be security_invoker=on")
        cols = {
            r["column_name"]
            for r in q(
                "SELECT column_name FROM information_schema.columns"
                " WHERE table_schema='public' AND table_name='lab_test'"
            )
        }
        for name, _, _, _ in EXPECTED_NEW_COLUMNS:
            self.assertIn(name, cols, f"façade does not expose {name} (select * must flow through)")

    def test_13_anon_fail_closed(self):
        sql = """
        DO $$
        BEGIN
          SET LOCAL role anon;
          BEGIN
            IF EXISTS (SELECT 1 FROM food.lab_test) THEN
              RAISE EXCEPTION 'anon read did NOT fail closed — rows returned';
            END IF;
          EXCEPTION WHEN OTHERS THEN
            NULL;  -- any deny is fail-closed too (grant-level deny)
          END;
        END $$;
        """
        q(_tx(sql))

    # ──────────────────────────── FLOW ────────────────────────────

    def test_20_two_step_flow_live_rollback_smoke(self):
        staff_id = q(
            "SELECT id FROM core.app_user WHERE role IN ('staff','admin')"
            " ORDER BY created_at LIMIT 1"
        )[0]["id"]
        person_id = q("SELECT id FROM core.personnel ORDER BY full_name LIMIT 1")[0]["id"]
        sql = f"""
        DO $probe$
        DECLARE
          v_id uuid;
          v_pid uuid;
        BEGIN
          {_staff_ctx_assign(staff_id)}
          v_pid := '{person_id}'::uuid;
          -- STEP 1 — collect-only insert (result fields omitted entirely):
          -- the row lands as รอผล with sample_date defaulted to today and
          -- EVERY result-side column NULL (no DB default may fill them).
          INSERT INTO food.lab_test (sample_source, collect_point, test_type, collected_by_id, source_provenance)
          VALUES ('น้ำ', 'โรงครัว', 'total_coliform', v_pid, 'D2 rollback-smoke probe (never persisted)')
          RETURNING id INTO v_id;
          IF (SELECT sample_date FROM food.lab_test WHERE id = v_id) IS DISTINCT FROM CURRENT_DATE THEN
            RAISE EXCEPTION 'step-1 sample_date must default to CURRENT_DATE';
          END IF;
          IF (SELECT result FROM food.lab_test WHERE id = v_id) IS NOT NULL
             OR (SELECT reported_date FROM food.lab_test WHERE id = v_id) IS NOT NULL
             OR (SELECT reporter_id FROM food.lab_test WHERE id = v_id) IS NOT NULL THEN
            RAISE EXCEPTION 'step-1 row must be pending: result-side columns NULL (รอผล)';
          END IF;
          -- STEP 2 — enter the result later (app-supplied, D1-7).
          UPDATE food.lab_test
             SET result = 'Positive', reported_date = CURRENT_DATE, reporter_id = v_pid
           WHERE id = v_id;
          IF (SELECT result FROM food.lab_test WHERE id = v_id) IS DISTINCT FROM 'Positive' THEN
            RAISE EXCEPTION 'step-2 result write failed';
          END IF;
          -- legacy_id UNIQUE enforced; NULL duplicates still allowed.
          BEGIN
            INSERT INTO food.lab_test (legacy_id) VALUES ('p2-004-probe');
            INSERT INTO food.lab_test (legacy_id) VALUES ('p2-004-probe');
            RAISE EXCEPTION 'legacy_id UNIQUE not enforced';
          EXCEPTION WHEN unique_violation THEN
            NULL;  -- expected
          END;
          INSERT INTO food.lab_test (legacy_id) VALUES (NULL);
          INSERT INTO food.lab_test (legacy_id) VALUES (NULL);
        END $probe$;
        """
        q(_tx(sql))
        # zero net persistence (the ROLLBACK held)
        n = q("SELECT count(*) AS n FROM food.lab_test")[0]["n"]
        self.assertEqual(n, 0, f"rollback-smoke leaked rows: {n}")

    # ─────────────────────────── HONESTY ──────────────────────────

    def test_30_zero_seed_source_unavailable(self):
        n = q("SELECT count(*) AS n FROM food.lab_test")[0]["n"]
        self.assertEqual(n, 0, f"food.lab_test must carry 0 rows (SOURCE_UNAVAILABLE D1-3), got {n}")
        # Post-apply pin: no AppSheet-sourced rows may exist (nothing
        # reconstructed). Column-guarded so the 0-count pin above stays
        # independently assertable pre-apply.
        has_col = q(
            "SELECT count(*) AS n FROM information_schema.columns"
            " WHERE table_schema='food' AND table_name='lab_test'"
            " AND column_name='source_provenance'"
        )[0]["n"]
        if has_col:
            seeded = q(
                "SELECT count(*) AS n FROM food.lab_test WHERE source_provenance LIKE 'AppSheet%'"
            )[0]["n"]
            self.assertEqual(seeded, 0, "no AppSheet-sourced coliform rows may exist (nothing reconstructed)")

    def test_31_baselines_intact(self):
        counts = q(
            "SELECT (SELECT count(*) FROM wastewater.reading) AS reading,"
            " (SELECT count(*) FROM core.personnel) AS personnel,"
            " (SELECT count(*) FROM core.equipment_spec) AS spec,"
            " (SELECT count(*) FROM safety.emergency_light) AS light,"
            " (SELECT count(*) FROM safety.fire_extinguisher) AS ext,"
            " (SELECT count(*) FROM safety.extinguisher_inspection) AS insp,"
            " (SELECT count(*) FROM safety.emergency_light_check) AS elc,"
            " (SELECT count(*) FROM food.lab_test) AS lt"
        )[0]
        self.assertEqual(counts["reading"], 907, "wastewater.reading baseline moved")
        self.assertEqual(counts["personnel"], 9, "core.personnel baseline moved")
        self.assertEqual(counts["spec"], 4, "core.equipment_spec baseline moved")
        self.assertEqual(counts["light"], 48, "safety.emergency_light baseline moved")
        self.assertEqual(counts["ext"], 0, "fire_extinguisher must stay UNSEEDED")
        self.assertEqual(counts["insp"], 0, "extinguisher_inspection baseline moved")
        self.assertEqual(counts["elc"], 332, "emergency_light_check baseline moved (P2.3 — read-only here)")
        self.assertEqual(counts["lt"], 0, "food.lab_test 0-seed moved")

    def test_32_no_13_digit_digit_runs_in_migration(self):
        self.assertTrue(MIGRATION_PATH.exists(), f"{MIGRATION} not written yet")
        text = MIGRATION_PATH.read_text(encoding="utf-8")
        # Filename timestamp tokens (the 14-digit YYYYMMDDHHMMSS name) are
        # documentation, not data — scrubbed before the grep; anything else
        # 13+ digits is national-ID-class data and is a violation.
        scrubbed = text.replace(MIGRATION, "")
        m = DIGIT_RUN.search(scrubbed)
        self.assertIsNone(m, f"13-digit digit-run found in migration at {m.start() if m else ''} — PII pin violated")

    # ──────────────────────────── FILE ────────────────────────────

    def test_40_migration_file_contract(self):
        self.assertTrue(MIGRATION_PATH.exists(), f"{MIGRATION} not written yet")
        text = MIGRATION_PATH.read_text(encoding="utf-8")
        lowered = text.lower()
        for marker in (
            "rollback",
            "drop index if exists",
            "drop column if exists",
            "notify pgrst, 'reload schema'",
        ):
            self.assertIn(marker, lowered, f"rollback/pgrst-trailer documentation missing: {marker}")
        # 0-seed: the migration must carry ZERO INSERT statements
        insert_lines = [
            ln for ln in text.splitlines() if ln.strip().lower().startswith("insert into")
        ]
        self.assertEqual(insert_lines, [], "migration must NOT seed rows (SOURCE_UNAVAILABLE D1-3)")
        # source lineage: the four AppSheet tables transcribed here
        for ref in ("3.11", "3.16", "3.17", "3.19"):
            self.assertIn(ref, text, f"reference-12 §{ref} lineage missing from migration header")


if __name__ == "__main__":
    unittest.main(verbosity=2)
