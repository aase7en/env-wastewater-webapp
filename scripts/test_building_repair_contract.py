"""ENV-BUILDING-REPAIR-001 C1 — D2 contract tests (RED-first).

Layer 1 (static SQL contract) is RED until the expand/contract
migrations exist and conform. Layer 2 (live behavior matrix) skips
with a typed reason outside a human-authorized LIVE-DB gate window.
Layer 3 (import booleans) runs anywhere and is green against the
contract parser (the adapter seam turns green in D5).

Run:  uv run python -m pytest scripts/test_building_repair_contract.py -q
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import building_repair_contract as c


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
    """Clauses 1/3/5/6/10 against the EXPAND migration (RED until authored)."""

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

    def test_expand_contains_no_direct_write_ban(self):
        """R3 round 2: expand is purely additive — the ban lives only in
        the contract migration (old client keeps working after Gate 1)."""
        sql = c.strip_sql_comments(_read(c.EXPAND_MIGRATION))
        self.assertNotIn(c.BAN_TRUE_SET_MESSAGE, sql)


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


class C1LiveBehaviorMatrix(unittest.TestCase):
    """Full packet matrix against ENV_DB — ONLY inside a human-gate window.

    Outside a window these tests SKIP with a typed reason. A skip is
    evidence that no live probe ran — never a pass.
    """

    def _require_window(self) -> str:
        window = c.live_gate_window()
        if window is None:
            self.skipTest(
                "NO_LIVE_GATE_WINDOW: live ENV_DB verification is "
                "HUMAN_AUTHORIZATION_REQUIRED (Gate 1 expand apply / Gate 2 "
                "contract apply / D10 postflight). Set "
                f"{c.LIVE_WINDOW_ENV}=<window> only inside an authorized "
                "window."
            )
        return window

    def test_matrix_atomic_rollback(self):
        self._require_window()
        self.fail("LIVE MATRIX NOT IMPLEMENTED FOR THIS WINDOW: D2 pins the harness; the behavioral assertions execute in the authorized gate window per the WO.")

    def test_matrix_same_key_retry_idempotent(self):
        self._require_window()
        self.fail("LIVE MATRIX NOT IMPLEMENTED FOR THIS WINDOW")

    def test_matrix_concurrent_double_submit_single_repair(self):
        self._require_window()
        self.fail("LIVE MATRIX NOT IMPLEMENTED FOR THIS WINDOW")

    def test_matrix_same_key_different_payload_rejected(self):
        self._require_window()
        self.fail("LIVE MATRIX NOT IMPLEMENTED FOR THIS WINDOW")

    def test_matrix_reporter_spoof_denied(self):
        self._require_window()
        self.fail("LIVE MATRIX NOT IMPLEMENTED FOR THIS WINDOW")

    def test_matrix_pending_role_denied(self):
        self._require_window()
        self.fail("LIVE MATRIX NOT IMPLEMENTED FOR THIS WINDOW")

    def test_matrix_link_unique_and_immutable(self):
        self._require_window()
        self.fail("LIVE MATRIX NOT IMPLEMENTED FOR THIS WINDOW")

    def test_matrix_cancellation_preserves_flag_and_link(self):
        self._require_window()
        self.fail("LIVE MATRIX NOT IMPLEMENTED FOR THIS WINDOW")

    def test_matrix_delete_unlink_restricted(self):
        self._require_window()
        self.fail("LIVE MATRIX NOT IMPLEMENTED FOR THIS WINDOW")

    def test_matrix_direct_true_set_rejected_pinned_sqlstate(self):
        self._require_window()
        self.fail("LIVE MATRIX NOT IMPLEMENTED FOR THIS WINDOW")

    def test_matrix_direct_linked_true_to_false_rejected_pinned_sqlstate(self):
        self._require_window()
        self.fail("LIVE MATRIX NOT IMPLEMENTED FOR THIS WINDOW")

    def test_matrix_facade_exposure(self):
        self._require_window()
        self.fail("LIVE MATRIX NOT IMPLEMENTED FOR THIS WINDOW")

    def test_matrix_audit_captured_for_committed_rpc_ops(self):
        self._require_window()
        self.fail("LIVE MATRIX NOT IMPLEMENTED FOR THIS WINDOW")

    def test_matrix_truthful_linked_status(self):
        self._require_window()
        self.fail("LIVE MATRIX NOT IMPLEMENTED FOR THIS WINDOW")


if __name__ == "__main__":
    unittest.main()
