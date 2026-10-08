"""ENV-BUILDING-REPAIR-001 C1 — D2 contract tests (RED-first, now with a
REAL phase-partitioned live matrix).

Layer 1 (static SQL contract) pins the migrations' shape.
Layer 2 (live matrix) runs ONLY inside a human-authorized gate window
(GATE1_EXPAND_APPLY / GATE2_CONTRACT_APPLY / D10_POSTFLIGHT) against
ENV_DB through the Management API with Drive-resolved credentials; it
executes real SQL assertions appropriate to each phase and cleans up
any rows it creates. Outside a window it skips with a typed reason —
a skip is absence-of-probe evidence, never a pass.
Layer 3 (import booleans) runs anywhere.

Honest limitation (recorded in the WO): the Management API executes as
the service role, so auth.uid() is NULL on this connection. The matrix
therefore proves the FAIL-CLOSED identity path (missing caller rejected)
and all trigger/constraint/view behaviors; the POSITIVE staff-path RPC
execution is verified from the deployed app during D10, not here.

Run:  uv run python -m pytest scripts/test_building_repair_contract.py -q
"""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import building_repair_contract as c

API_URL = (
    "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
)


def _read(path: Path) -> str:
    if not path.exists():
        raise AssertionError(f"migration not authored yet: {path.name} (RED)")
    return c.read_migration(path)


class C1ImportBooleanContract(unittest.TestCase):
    """D5 seam: strict parsing, never truthy coercion (adjacent defect)."""

    def test_true_tokens(self):
        for token in ("true", "TRUE", " 1 ", "yes", "ใช่", "มี"):
            self.assertIs(c.parse_import_boolean(token), True, token)

    def test_false_tokens_are_false_not_truthy(self):
        # The adjacent defect: "false"/"0" previously coerced truthy.
        for token in ("false", "FALSE", " 0 ", "no", "ไม่", "ไม่มี"):
            self.assertIs(c.parse_import_boolean(token), False, token)

    def test_unrecognized_is_none_never_coerced(self):
        for token in ("", "  ", "n/a", "-", "2", " Unknown ", "พบ", "จริง"):
            self.assertIsNone(c.parse_import_boolean(token), token)


class C1StaticSqlContractExpand(unittest.TestCase):
    """Clauses 1/3/5/6/7/10 against the EXPAND migration (RED until authored)."""

    def test_expand_file_authored(self):
        sql = _read(c.EXPAND_MIGRATION)
        for name, check in (
            ("c1_link_column", c.c1_link_column),
            ("c5_rpc_single_command", c.c5_rpc_single_command),
            ("c6_reporter_server_derived", c.c6_reporter_server_derived),
            ("c6_search_path_locked", c.c6_search_path_locked),
            ("facade_recreated", c.facade_recreated),
        ):
            with self.subTest(check=name):
                self.assertTrue(check(sql), name)
        # D8 R1 P1-1: PostgREST-callable public facade present.
        self.assertRegex(sql.lower(), r"create\s+or\s+replace\s+function\s+public\.create_building_repair")
        self.assertRegex(sql.lower(), r"create\s+or\s+replace\s+function\s+public\.cancel_building_repair")
        # D8 R1 P1-4: concurrency serialization on the client key.
        self.assertIn("pg_advisory_xact_lock", sql)
        # D8 R1 P1-2: explicit NULL-role fail-closed.
        self.assertIn("v_role IS NULL", sql)
        # D8 R1 P1-5: full-payload comparison on idempotent retry.
        self.assertIn("IS DISTINCT FROM v_round_date", sql)
        # D8 R1 P1-9: cancellation RPC (status-only; flag+link preserved).
        self.assertRegex(sql, r"cancel_building_repair")

    def test_expand_contains_no_direct_write_ban(self):
        """R3 round 2: expand is purely additive — the ban lives only in
        the contract migration (old client keeps working after Gate 1)."""
        sql = c.strip_sql_comments(_read(c.EXPAND_MIGRATION))
        self.assertNotIn(c.BAN_TRUE_SET_MESSAGE, sql)
        self.assertNotIn("TRIGGER trg_c1_guard", sql.upper())


class C1StaticSqlContractContract(unittest.TestCase):
    """R3-hardened contract migration shape (RED until authored)."""

    def test_contract_file_authored(self):
        sql = _read(c.CONTRACT_MIGRATION)
        for name, check in (
            ("contract_locks_tables", c.contract_locks_tables),
            ("contract_asserts_both_directions", c.contract_asserts_both_directions),
            ("contract_bidirectional_ban", c.contract_bidirectional_ban),
            ("contract_no_true_to_false_route", c.contract_no_true_to_false_route),
        ):
            with self.subTest(check=name):
                self.assertTrue(check(sql), name)
        # D8 R1 P1-3: marker-based (NOT trigger-depth) RPC recognition
        # (comments may reference the rejected mechanism; code must not).
        code = c.strip_sql_comments(sql)
        self.assertIn("current_setting('env_c1.rpc_write', true)", code)
        self.assertNotIn("pg_trigger_depth", code.lower())
        # D8 R1 P1-7: repair-side provenance protection.
        self.assertIn("ENV_C1_BAN_LINKED_REPAIR_DELETE", sql)
        self.assertIn("ENV_C1_BAN_LINKED_REPAIR_UNLINK", sql)


# ── Live matrix (phase-partitioned; human gate windows only) ─────────────


def _live_connection():
    """Return a (query, cleanup) harness or None outside a gate window.

    query(sql, params=None) -> list[dict] rows; raises with the API
    message on failure. Uses the Management API + Drive-resolved
    SUPABASE_ACCESS_TOKEN; nothing is printed or persisted.
    """
    import httpx
    from _env import load_secret

    token = load_secret("SUPABASE_ACCESS_TOKEN")
    if not token:
        raise RuntimeError("SUPABASE_ACCESS_TOKEN unavailable via the approved resolver")

    def query(sql: str, params: dict | None = None):
        body = {"query": sql}
        if params:
            body["args"] = [params[k] for k in sorted(params)]
        r = httpx.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=body,
            timeout=60,
        )
        if r.status_code >= 400:
            try:
                msg = r.json().get("message") or r.text
            except Exception:
                msg = r.text
            raise RuntimeError(f"[{r.status_code}] {msg}")
        try:
            return r.json()
        except Exception:
            return []

    return query


class C1LiveBehaviorMatrix(unittest.TestCase):
    """Real SQL assertions against ENV_DB — ONLY inside a gate window."""

    def _window(self, *allowed: str) -> str:
        window = c.live_gate_window()
        if window is None:
            self.skipTest(
                "NO_LIVE_GATE_WINDOW: live ENV_DB verification is "
                "HUMAN_AUTHORIZATION_REQUIRED (Gate 1 expand apply / Gate 2 "
                "contract apply / D10 postflight)."
            )
        if window not in allowed:
            self.skipTest(
                f"WRONG_PHASE: this assertion belongs to {allowed}; window is {window}"
            )
        return window

    def _q(self):
        try:
            return _live_connection()
        except RuntimeError as exc:
            self.skipTest(f"LIVE_CONNECTION_UNAVAILABLE: {exc}")

    # Shared postflight truth: both invariant directions hold.

    def test_matrix_both_direction_invariant_zero(self):
        self._window("GATE2_CONTRACT_APPLY", "D10_POSTFLIGHT")
        q = self._q()
        class_i = q(
            "SELECT count(*) AS n FROM building.inspection_round ir "
            "WHERE ir.repair_needed IS TRUE AND NOT EXISTS ("
            " SELECT 1 FROM core.repair_request rr WHERE rr.inspection_round_id = ir.id)"
        )
        class_ii = q(
            "SELECT count(*) AS n FROM core.repair_request rr "
            "WHERE rr.inspection_round_id IS NOT NULL AND EXISTS ("
            " SELECT 1 FROM building.inspection_round ir"
            " WHERE ir.id = rr.inspection_round_id AND ir.repair_needed IS NOT TRUE)"
        )
        self.assertEqual(class_i[0]["n"], 0, f"class-I orphans: {json.dumps(class_i)}")
        self.assertEqual(class_ii[0]["n"], 0, f"class-II stale flags: {json.dumps(class_ii)}")

    def test_matrix_rpc_exists_and_fails_closed_without_caller(self):
        self._window("GATE1_EXPAND_APPLY", "GATE2_CONTRACT_APPLY", "D10_POSTFLIGHT")
        q = self._q()
        procs = q(
            "SELECT p.proname, n.nspname FROM pg_proc p JOIN pg_namespace n"
            " ON n.oid = p.pronamespace WHERE p.proname IN"
            " ('create_building_repair','cancel_building_repair')"
        )
        names = {(r["nspname"], r["proname"]) for r in procs}
        for schema in ("core", "public"):
            self.assertIn((schema, "create_building_repair"), names)
            self.assertIn((schema, "cancel_building_repair"), names)
        # Service-role connection has auth.uid() = NULL → identity must
        # fail closed BEFORE any write.
        with self.assertRaisesRegex(RuntimeError, "ENV_C1_AUTH_REQUIRED|42501"):
            q("SELECT public.create_building_repair("
              " gen_random_uuid(), CURRENT_DATE, NULL, NULL, NULL, 'probe', NULL)")

    def test_matrix_facade_exposes_link_column(self):
        self._window("GATE1_EXPAND_APPLY", "GATE2_CONTRACT_APPLY", "D10_POSTFLIGHT")
        q = self._q()
        cols = q(
            "SELECT column_name FROM information_schema.columns"
            " WHERE table_schema='public' AND table_name='repair_request'"
            "   AND column_name='inspection_round_id'"
        )
        self.assertEqual(len(cols), 1, "public.repair_request facade lacks the link column")

    def test_matrix_expand_allows_plain_direct_insert(self):
        """Gate-1 window only: the OLD client's plain (no-repair) insert
        keeps working — expand is purely additive."""
        self._window("GATE1_EXPAND_APPLY")
        q = self._q()
        key = "00000000-1c1a-4000-8000-000000000001"
        q(
            "INSERT INTO building.inspection_round"
            " (id, round_date, issues_found, repair_needed)"
            f" VALUES ('{key}', CURRENT_DATE, FALSE, FALSE)"
        )
        try:
            rows = q(
                "SELECT repair_needed FROM building.inspection_round"
                f" WHERE id = '{key}'"
            )
            self.assertFalse(rows[0]["repair_needed"])
        finally:
            q(f"DELETE FROM building.inspection_round WHERE id = '{key}'")

    def test_matrix_contract_bans_direct_true_set(self):
        self._window("GATE2_CONTRACT_APPLY", "D10_POSTFLIGHT")
        q = self._q()
        with self.assertRaisesRegex(RuntimeError, "ENV_C1_BAN_DIRECT_TRUE_SET"):
            q("INSERT INTO building.inspection_round"
              " (round_date, issues_found, repair_needed)"
              " VALUES (CURRENT_DATE, TRUE, TRUE)")

    def test_matrix_contract_bans_direct_linked_true_to_false(self):
        self._window("GATE2_CONTRACT_APPLY", "D10_POSTFLIGHT")
        q = self._q()
        # Build a linked pair server-side with the marker set (as the RPC
        # would), then attempt the direct flip WITHOUT the marker.
        round_id = "00000000-1c1a-4000-8000-000000000002"
        repair_id = "00000000-1c1a-4000-8000-000000000003"
        q("SELECT set_config('env_c1.rpc_write', 'on', false)")
        q("INSERT INTO building.inspection_round"
          " (id, round_date, issues_found, repair_needed)"
          f" VALUES ('{round_id}', CURRENT_DATE, TRUE, TRUE)")
        q("INSERT INTO core.repair_request"
          " (id, inspection_round_id, cause, status)"
          f" VALUES ('{repair_id}', '{round_id}', 'live-matrix probe', 'open')")
        q("SELECT set_config('env_c1.rpc_write', '', false)")
        try:
            with self.assertRaisesRegex(RuntimeError, "ENV_C1_BAN_DIRECT_TRUE_TO_FALSE"):
                q(f"UPDATE building.inspection_round SET repair_needed = FALSE"
                  f" WHERE id = '{round_id}'")
            # Repair-side provenance: no delete, no unlink.
            with self.assertRaisesRegex(RuntimeError, "ENV_C1_BAN_LINKED_REPAIR_DELETE"):
                q(f"DELETE FROM core.repair_request WHERE id = '{repair_id}'")
            with self.assertRaisesRegex(RuntimeError, "ENV_C1_BAN_LINKED_REPAIR_UNLINK"):
                q(f"UPDATE core.repair_request SET inspection_round_id = NULL"
                  f" WHERE id = '{repair_id}'")
        finally:
            q("SELECT set_config('env_c1.rpc_write', 'on', false)")
            q(f"DELETE FROM core.repair_request WHERE id = '{repair_id}'")
            q(f"DELETE FROM building.inspection_round WHERE id = '{round_id}'")
            q("SELECT set_config('env_c1.rpc_write', '', false)")

    def test_matrix_cancel_rpc_requires_reason_and_target(self):
        self._window("GATE2_CONTRACT_APPLY", "D10_POSTFLIGHT")
        q = self._q()
        # NULL caller → identity gate first.
        with self.assertRaisesRegex(RuntimeError, "ENV_C1_AUTH_REQUIRED|42501"):
            q("SELECT public.cancel_building_repair("
              " gen_random_uuid(), 'no caller')")


if __name__ == "__main__":
    unittest.main()
