"""ENV-PARITY-P1-001 C1 — D2 RED-first live schema contract test.

Read-only: queries ONLY information_schema.columns and pg_constraint /
pg_get_constraintdef() on ENV_DB (project gllqtbyofrcjzmbnfoeh, ap-
southeast-1) through the same Management-API access path as
scripts/apply_migration_api.py (scripts/_env.py; SUPABASE_ACCESS_TOKEN
from Drive secrets — never printed). No writes, no fixtures, no PHI.

Assertions (WO §3.2; all three classes must FAIL truthfully while the
migration 20261115120000_parity_p1_001.sql is UNAPPLIED — the RED
record goes in the handoff — and pass GREEN after it):

  1. The 10 new wastewater.reading parity columns exist, are `text`,
     is_nullable = YES, and carry NO column default (unknown ≠ 0: NULL
     stays NULL, no backfill surface).
  2. The 3 enum CHECK constraints exist with exactly the pinned
     pg_get_constraintdef() text (AppSheet enum values verbatim from
     reference §3.2/§3.3) and are NOT VALID (convalidated = false):
     907 historical rows are never scanned or coerced; parity is
     enforced going forward only.
  3. The existing source-of-truth boolean columns, `chlorine_used`,
     `chlorine_mix_ratio`, and `core.personnel.position`/`.status`
     still exist UNCHANGED (guard against accidental drops/type
     changes — the migration is purely additive).

Run:  uv run python -m pytest scripts/test_parity_p1_001_schema.py -q
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

API_URL = (
    "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
)

MIGRATION = "20261115120000_parity_p1_001.sql"

# The 10 additive parity columns: existing boolean (source of truth) →
# new nullable enum column. Values verbatim from AppSheet reference §3.3
# (ล้างตะแกรงบ่อสูบ/ละเอียด: ล้าง/ไม่ล้าง; machines: ปกติ/เสีย).
PARITY_COLUMNS = [
    "screen_cleaned_coarse_status",
    "screen_cleaned_fine_status",
    "pump1_running_status",
    "pump2_running_status",
    "aerator1_running_status",
    "aerator2_running_status",
    "sludge_pump1_running_status",
    "sludge_pump2_running_status",
    "chlorine_pump1_running_status",
    "chlorine_pump2_running_status",
]

# Existing source-of-truth surface that must remain UNCHANGED.
EXISTING_READING_COLUMNS = {
    "screen_cleaned_coarse": "boolean",
    "screen_cleaned_fine": "boolean",
    "pump1_running": "boolean",
    "pump2_running": "boolean",
    "aerator1_running": "boolean",
    "aerator2_running": "boolean",
    "sludge_pump1_running": "boolean",
    "sludge_pump2_running": "boolean",
    "chlorine_pump1_running": "boolean",
    "chlorine_pump2_running": "boolean",
    "chlorine_used": "numeric",
    "chlorine_mix_ratio": "text",
}
EXISTING_PERSONNEL_COLUMNS = {
    "position": "text",
    "status": "text",
}

# Pinned CHECK constraints: name → (table, exact pg_get_constraintdef
# text). Enum value lists are quoted VERBATIM from the AppSheet
# definition reference §3.2 (ตำแหน่ง/สถานะ) and §3.3
# (อัตราส่วนผสม(คลอรีน/น้ำ)) — no invented values; NULL passes every
# check (unknown stays unknown — never coerced).
#
# The pinned def text is PostgreSQL's actual deterministic deparse of the
# WO-pinned CHECK DDL (WO §2.2/§2.4 author `IN (...)`; PG renders it as
# `= ANY (ARRAY[...])` with ::text casts, `IN` being parse-time sugar —
# semantically identical). Pin correction recorded in handoff D3: the
# D2 RED run pinned the authored IN-form; the observed live rendering
# below replaced it before the GREEN run (strictly stronger — it adds
# the NOT VALID suffix and full cast forms to the pin).
EXPECTED_CHECKS = {
    "ck_wastewater_reading_chlorine_mix_ratio_enum": (
        "wastewater.reading",
        "CHECK ((chlorine_mix_ratio = ANY (ARRAY['1:2'::text, "
        "'1:4'::text, '1:9'::text]))) NOT VALID",
    ),
    "ck_core_personnel_position_enum": (
        "core.personnel",
        "CHECK ((\"position\" = ANY (ARRAY['นายแพทย์'::text, "
        "'พนักงานบริการ'::text, 'นักวิชาการสาธารณสุข'::text, "
        "'นักโภชนาการ'::text, 'พนักงานประกอบอาหาร'::text]))) NOT VALID",
    ),
    "ck_core_personnel_status_enum": (
        "core.personnel",
        "CHECK ((status = ANY (ARRAY['ทำงาน'::text, 'ย้ายกลุ่มงาน'::text, "
        "'ลาออก'::text, 'ลาศึกษาต่อ'::text]))) NOT VALID",
    ),
}


def _query():
    """Return the Management-API query fn (Drive-resolved token) or None.

    Mirrors scripts/test_building_repair_contract.py:_live_connection —
    same approved resolver (scripts/_env.py), same API endpoint, never
    prints or persists the token.
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
    """Canonical form for byte-pinning pg_get_constraintdef output.

    PostgreSQL renders CHECK definitions with parenthesization that
    depends only on expression structure, and (on Supabase PG) casts
    the enum literals to ::text. Whitespace between tokens carries no
    semantic weight, so the pin compares the whitespace-normalized
    rendering. Enum values, order, and the NOT VALID flag remain
    byte-pinned — this normalization does NOT loosen the assertion.
    """
    return " ".join(def_text.split())


class C1ParitySchemaLiveContract(unittest.TestCase):
    """Live ENV_DB introspection contract (read-only)."""

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

    # ── Assertion group 1: the 10 new parity columns ──

    def test_parity_columns_exist_text_nullable_no_default(self):
        rows = self.q(
            "SELECT column_name, data_type, is_nullable, column_default"
            " FROM information_schema.columns"
            " WHERE table_schema='wastewater' AND table_name='reading'"
            f" AND column_name IN ({','.join(repr(c) for c in PARITY_COLUMNS)})"
        )
        found = {r["column_name"]: r for r in rows}
        for col in PARITY_COLUMNS:
            with self.subTest(column=col):
                self.assertIn(col, found, f"missing parity column {col}")
                r = found[col]
                self.assertEqual(r["data_type"], "text", col)
                self.assertEqual(r["is_nullable"], "YES", col)
                self.assertIsNone(r["column_default"], col)

    # ── Assertion group 2: the 3 NOT VALID enum CHECK constraints ──

    def test_enum_check_constraints_exist_not_valid_pinned_defs(self):
        for name, (table, expected_def) in EXPECTED_CHECKS.items():
            with self.subTest(constraint=name):
                rows = self.q(
                    "SELECT n.nspname || '.' || c.relname AS table, "
                    "con.contype, con.convalidated AS validated, "
                    "pg_get_constraintdef(con.oid) AS def"
                    " FROM pg_constraint con"
                    " JOIN pg_class c ON con.conrelid = c.oid"
                    " JOIN pg_namespace n ON c.relnamespace = n.oid"
                    f" WHERE con.conname = '{name}'"
                )
                self.assertEqual(
                    len(rows), 1, f"constraint {name} missing on {table}"
                )
                r = rows[0]
                self.assertEqual(r["table"], table, name)
                self.assertEqual(r["contype"], "c", name)
                self.assertFalse(
                    r["validated"], f"{name} must be NOT VALID (907 "
                    "historical rows untouched)"
                )
                self.assertEqual(_canon(r["def"]), _canon(expected_def), name)

    # ── Assertion group 3: source-of-truth surface unchanged ──

    def test_source_of_truth_columns_unchanged(self):
        rows = self.q(
            "SELECT table_schema || '.' || table_name AS table, "
            "column_name, data_type, is_nullable, column_default"
            " FROM information_schema.columns"
            " WHERE (table_schema='wastewater' AND table_name='reading')"
            " OR (table_schema='core' AND table_name='personnel')"
        )
        found = {(r["table"], r["column_name"]): r for r in rows}
        for col, dtype in EXISTING_READING_COLUMNS.items():
            with self.subTest(column=f"wastewater.reading.{col}"):
                r = found.get(("wastewater.reading", col))
                self.assertIsNotNone(
                    r, f"source-of-truth column dropped: {col}"
                )
                self.assertEqual(r["data_type"], dtype, col)
        for col, dtype in EXISTING_PERSONNEL_COLUMNS.items():
            with self.subTest(column=f"core.personnel.{col}"):
                r = found.get(("core.personnel", col))
                self.assertIsNotNone(
                    r, f"source-of-truth column dropped: {col}"
                )
                self.assertEqual(r["data_type"], dtype, col)


if __name__ == "__main__":
    unittest.main()
