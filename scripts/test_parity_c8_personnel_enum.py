"""ENV-PERSONNEL-C8-001 C1 — D2 RED-first live personnel-enum contract test.

Read-only: queries ONLY core.personnel (employee_code / position / status
— the three synthetic-safe columns; NEVER name, national-ID, phone, or
photo columns) plus pg_constraint / pg_get_constraintdef() on ENV_DB
(project gllqtbyofrcjzmbnfoeh, ap-southeast-1) through the same
Management-API access path as scripts/apply_migration_api.py
(scripts/_env.py; SUPABASE_ACCESS_TOKEN from Drive secrets — never
printed). No writes, no fixtures, no PHI — zero names by construction.

Authorization: owner approval 2026-11-21 "อนุมัติทั้งหมด" = option ① of
the C8 proposal presented 2026-11-20 (receipt: docs/ai/handoffs/
ENV-PERSONNEL-C8-001-GLM.md Appendix A; original /tmp-only). WO:
docs/work-orders/ENV-PERSONNEL-C8-001.md.

Assertions — the POST-fix contract (WO §2 item inventory; all failing
classes must FAIL truthfully while migration
20261121100000_parity_c8_personnel_enum.sql is UNAPPLIED — the RED
record goes in the handoff — and pass GREEN after it):

  A. The status delta: exactly 0 rows with status='active', exactly 6
     rows with status='ทำงาน' keyed on EXACTLY the authorized synthetic
     code set STAFF-001/002/003/006/008/009, and exactly 3 rows with
     status='ลาออก' (STAFF-004/005/007) — real history, byte-untouched.
  B. The position-enum extension: ck_core_personnel_position_enum's
     pg_get_constraintdef() carries ALL 8 values (the 5 original
     verbatim + exactly the 3 new real-role values) and, post-VALIDATE,
     no `NOT VALID` suffix. Pre-fix this FAILS (the live def holds only
     the 5 values + NOT VALID).
  C. Both CHECKs VALIDATED: convalidated = true ×2 (the P1.001
     owner-gated follow-up, un-gated by the approval). Pre-fix: false ×2.
  D. The delivered P1.4 recorder-gate shape (position ∈
     {นักวิชาการสาธารณสุข, พนักงานบริการ} ∧ status = 'ทำงาน'):
     STAFF-001 (ผู้บันทึกหลัก) and STAFF-008 PASS post-fix — the
     recorder-gate dropout repaired WITHOUT widening the gate — while
     the three ลาออก rows FAIL exactly as AppSheet intends (standing
     pass both pre- and post-fix, disclosed verbatim per the P2.4 P3-1
     convention).

Standing pins (pass in BOTH the RED and GREEN runs, disclosed verbatim):
  - the 9-row total (no row added or removed by the lane);
  - positions byte-stable row-by-row against the §0 pinned map — ZERO
    position cells are rewritten (option ②'s rename was rejected by the
    owner); STAFF-002/003/009's positions are legal data made legal by
    the extension only;
  - the 3 position values outside the OLD 5-value enum (STAFF-002/003/
    009) — true before and after (the extension, not the data, changed);
  - the status CHECK's value set stays exactly the 4 AppSheet values
    ทำงาน/ย้ายกลุ่มงาน/ลาออก/ลาศึกษาต่อ (never dropped in the forward
    path — only VALIDATEd); only convalidated changes (asserted in C).

Run:  uv run python -m pytest scripts/test_parity_c8_personnel_enum.py -q
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

API_URL = (
    "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
)

MIGRATION = "20261121100000_parity_c8_personnel_enum.sql"

# The ONLY authorized row-target: this synthetic code set + the
# status='active' conjunction (WO §6 D1-1). Names/IDs are never queried.
GATE6_CODES = ["STAFF-001", "STAFF-002", "STAFF-003", "STAFF-006",
               "STAFF-008", "STAFF-009"]
EXITED3_CODES = ["STAFF-004", "STAFF-005", "STAFF-007"]

# Position enum values — the 5 originals VERBATIM from
# 20261115120000_parity_p1_001.sql:140-141 (AppSheet ref §3.2) + exactly
# the 3 new real-role values approved 2026-11-21 (option ①). Order here
# is the authored migration order; the def pin below is the PostgreSQL
# deparse of that authored IN-list.
POSITION_ENUM_5 = [
    "นายแพทย์", "พนักงานบริการ", "นักวิชาการสาธารณสุข",
    "นักโภชนาการ", "พนักงานประกอบอาหาร",
]
POSITION_NEW_3 = ["ผู้ช่วยช่างทั่วไป", "พนักงานเปล", "พนักงานช่วยเหลือคนไข้"]
POSITION_ENUM_8 = POSITION_ENUM_5 + POSITION_NEW_3

STATUS_ENUM_4 = ["ทำงาน", "ย้ายกลุ่มงาน", "ลาออก", "ลาศึกษาต่อ"]

# The §0 ground-truth row map (synthetic codes only): code → position.
# Post-fix statuses: the 6 gate codes → ทำงาน, the 3 exited codes → ลาออก.
ROWS_POSITION_PIN = {
    "STAFF-001": "พนักงานบริการ",
    "STAFF-002": "ผู้ช่วยช่างทั่วไป",
    "STAFF-003": "พนักงานเปล",
    "STAFF-004": "พนักงานบริการ",
    "STAFF-005": "พนักงานบริการ",
    "STAFF-006": "พนักงานบริการ",
    "STAFF-007": "พนักงานบริการ",
    "STAFF-008": "นักวิชาการสาธารณสุข",
    "STAFF-009": "พนักงานช่วยเหลือคนไข้",
}
ROWS_STATUS_POST = {c: "ทำงาน" for c in GATE6_CODES} | {
    c: "ลาออก" for c in EXITED3_CODES
}

# Pinned constraint defs: PostgreSQL's deterministic deparse of the
# authored CHECK DDL (IN-list sugar renders as = ANY (ARRAY[...]) with
# ::text casts — semantically identical, the P1.001 precedent). After
# VALIDATE CONSTRAINT the ` NOT VALID` suffix disappears (convalidated =
# true). Whitespace-normalized comparison only (P1.001 _canon); values,
# order, and the validated posture stay byte-pinned.
EXPECTED_CHECKS_POST = {
    "ck_core_personnel_position_enum": (
        "core.personnel",
        'CHECK (("position" = ANY (ARRAY['
        + ", ".join(f"'{v}'::text" for v in POSITION_ENUM_8)
        + "])))",
    ),
    "ck_core_personnel_status_enum": (
        "core.personnel",
        "CHECK ((status = ANY (ARRAY["
        + ", ".join(f"'{v}'::text" for v in STATUS_ENUM_4)
        + "])))",
    ),
}


def _query():
    """Return the Management-API query fn (Drive-resolved token) or None.

    Mirrors scripts/test_parity_p1_001_schema.py:_query — the same
    approved resolver (scripts/_env.py), same API endpoint, never prints
    or persists the token.
    """
    import httpx
    from _env import load_secret

    token = load_secret("SUPABASE_ACCESS_TOKEN")
    if not token:
        return None

    def query(sql: str):
        r = httpx.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={"query": sql},
            timeout=60,
        )
        if r.status_code >= 400:
            try:
                msg = r.json().get("message") or r.text
            except Exception:
                msg = r.text
            raise RuntimeError(f"[{r.status_code}] {msg}")
        return r.json()

    return query


def _canon(def_text: str) -> str:
    """Whitespace-normalized form for byte-pinning constraint defs."""
    return " ".join(def_text.split())


class C1PersonnelEnumLiveContract(unittest.TestCase):
    """Live ENV_DB personnel-enum contract (read-only, zero PII columns)."""

    @classmethod
    def setUpClass(cls):
        q = _query()
        if q is None:
            raise unittest.SkipTest(
                "LIVE_CONNECTION_UNAVAILABLE: SUPABASE_ACCESS_TOKEN not "
                "resolvable via the approved resolver (scripts/_env.py); "
                "a skip is absence-of-probe evidence, never a pass"
            )
        cls.q = staticmethod(q)

    # ── Standing pin: the 9-row total ──

    def test_total_rows_is_nine(self):
        rows = self.q("SELECT employee_code FROM core.personnel")
        self.assertEqual(len(rows), 9, "core.personnel row count changed")
        self.assertEqual(
            {r["employee_code"] for r in rows},
            set(ROWS_POSITION_PIN),
            "the employee_code set changed — drift, pivot via coordinator",
        )

    # ── A. the status delta ──

    def test_no_active_rows_remain(self):
        n = self.q(
            "SELECT count(*) AS c FROM core.personnel WHERE status='active'"
        )[0]["c"]
        self.assertEqual(n, 0, "status='active' rows remain")

    def test_six_thamngaan_rows_on_the_exact_authorized_code_set(self):
        n = self.q(
            "SELECT count(*) AS c FROM core.personnel WHERE status='ทำงาน'"
        )[0]["c"]
        self.assertEqual(n, 6, "status='ทำงาน' count must be exactly 6")
        rows = self.q(
            "SELECT employee_code FROM core.personnel WHERE status='ทำงาน'"
        )
        self.assertEqual(
            {r["employee_code"] for r in rows},
            set(GATE6_CODES),
            "the ทำงาน set must be EXACTLY the authorized code set",
        )

    def test_three_exited_rows_untouched(self):
        rows = self.q(
            "SELECT employee_code, status FROM core.personnel "
            "WHERE status='ลาออก'"
        )
        self.assertEqual(
            {r["employee_code"] for r in rows},
            set(EXITED3_CODES),
            "the ลาออก set must be exactly STAFF-004/005/007",
        )

    def test_post_fix_status_map_row_by_row(self):
        rows = self.q("SELECT employee_code, status FROM core.personnel")
        for r in rows:
            with self.subTest(code=r["employee_code"]):
                self.assertEqual(
                    r["status"], ROWS_STATUS_POST[r["employee_code"]],
                    "post-fix status map drifted",
                )

    # ── Standing pin: positions byte-stable + the 3-outside-old-enum ──

    def test_positions_byte_stable_row_by_row(self):
        rows = self.q("SELECT employee_code, position FROM core.personnel")
        for r in rows:
            with self.subTest(code=r["employee_code"]):
                self.assertEqual(
                    r["position"], ROWS_POSITION_PIN[r["employee_code"]],
                    "position cell rewritten — FORBIDDEN (WO §3.1)",
                )

    def test_three_positions_outside_the_old_5_enum(self):
        """Standing pass: true pre- and post-fix (data never changes; the
        extension — not the data — legalizes them)."""
        for code in ("STAFF-002", "STAFF-003", "STAFF-009"):
            with self.subTest(code=code):
                self.assertNotIn(
                    ROWS_POSITION_PIN[code], POSITION_ENUM_5,
                    f"{code}'s position unexpectedly inside the OLD enum",
                )

    # ── B. the position-enum extension (fails RED: 5 values + NOT VALID) ──

    def test_position_constraint_carries_all_eight_values_validated(self):
        rows = self.q(
            "SELECT n.nspname || '.' || c.relname AS table, "
            "con.contype, con.convalidated AS validated, "
            "pg_get_constraintdef(con.oid) AS def"
            " FROM pg_constraint con"
            " JOIN pg_class c ON con.conrelid = c.oid"
            " JOIN pg_namespace n ON c.relnamespace = n.oid"
            " WHERE con.conname = 'ck_core_personnel_position_enum'"
        )
        self.assertEqual(len(rows), 1, "position CHECK missing")
        r = rows[0]
        self.assertEqual(r["table"], "core.personnel")
        self.assertEqual(r["contype"], "c")
        def_canon = _canon(r["def"])
        for value in POSITION_ENUM_8:
            with self.subTest(value=value):
                self.assertIn(f"'{value}'::text", def_canon,
                              "position enum value missing from CHECK def")
        self.assertNotIn("NOT VALID", def_canon,
                         "position CHECK still NOT VALID")
        self.assertEqual(
            def_canon,
            _canon(EXPECTED_CHECKS_POST["ck_core_personnel_position_enum"][1]),
            "position CHECK def drifted from the pinned 8-value deparse",
        )

    def test_all_nine_positions_inside_the_new_8_enum(self):
        for code, pos in ROWS_POSITION_PIN.items():
            with self.subTest(code=code):
                self.assertIn(pos, POSITION_ENUM_8)

    # ── C. both CHECKs VALIDATED (fails RED ×2) ──

    def test_both_checks_convalidated_true(self):
        for name, (table, _) in EXPECTED_CHECKS_POST.items():
            with self.subTest(constraint=name):
                rows = self.q(
                    "SELECT con.convalidated AS validated"
                    " FROM pg_constraint con"
                    " JOIN pg_class c ON con.conrelid = c.oid"
                    " JOIN pg_namespace n ON c.relnamespace = n.oid"
                    f" WHERE con.conname = '{name}'"
                )
                self.assertEqual(len(rows), 1, f"{name} missing on {table}")
                self.assertTrue(rows[0]["validated"],
                                f"{name} must be VALIDATED (convalidated=true)")

    # ── Standing pin: the status CHECK value set never changes ──

    def test_status_constraint_keeps_exactly_the_4_values(self):
        rows = self.q(
            "SELECT pg_get_constraintdef(oid) AS def"
            " FROM pg_constraint WHERE conname = 'ck_core_personnel_status_enum'"
        )
        self.assertEqual(len(rows), 1, "status CHECK missing")
        def_canon = _canon(rows[0]["def"])
        for value in STATUS_ENUM_4:
            self.assertIn(f"'{value}'::text", def_canon)
        self.assertNotIn("'active'", def_canon)

    # ── D. the P1.4 recorder-gate shape ──

    def test_recorder_gate_admits_staff001_and_staff008_post_fix(self):
        rows = self.q(
            "SELECT employee_code FROM core.personnel WHERE position IN "
            "('นักวิชาการสาธารณสุข','พนักงานบริการ') AND status='ทำงาน'"
        )
        admitted = {r["employee_code"] for r in rows}
        for code in ("STAFF-001", "STAFF-008"):
            with self.subTest(code=code):
                self.assertIn(code, admitted,
                              f"{code} still dropped by the recorder gate")
        # Pin-correction record (P1.001 precedent; disclosed in the
        # handoff): the D2 RED run pinned the admitted set as exactly
        # {STAFF-001, STAFF-008}; the GREEN run's live probe replaced it
        # with the §0-table-derived set {STAFF-001, STAFF-006, STAFF-008}
        # — STAFF-006 (พนักงานบริการ) passes the UNCHANGED P1.4 predicate
        # post-fix and failed pre-fix only via status='active'. The gate
        # did NOT widen; the original pin was narrower than the predicate.
        self.assertEqual(
            admitted, {"STAFF-001", "STAFF-006", "STAFF-008"},
            "admitted set drifted from the §0-table-derived P1.4 result",
        )

    def test_recorder_gate_still_rejects_the_three_exited_rows(self):
        """Standing pass: AppSheet semantics — ลาออก rows fail the gate
        both pre- and post-fix; that is correct, not a defect."""
        for code in EXITED3_CODES:
            with self.subTest(code=code):
                self.assertNotEqual(ROWS_STATUS_POST[code], "ทำงาน")


if __name__ == "__main__":
    unittest.main()
