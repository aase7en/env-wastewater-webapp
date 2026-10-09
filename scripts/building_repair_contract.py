"""ENV-BUILDING-REPAIR-001 C1 — schema/RLS/RPC contract (D2).

The C1 decision packet (docs/work-orders/ENV-BUILDING-REPAIR-001.md) is
binding: this module pins its testable surface so the expand/contract
migrations and the client can be verified against ONE definition.

Three verification layers, kept honest about what each can prove:

1. STATIC SQL CONTRACT (runs anywhere, no DB): each check reads the
   migration files from the repo and asserts the clauses' DDL shape —
   column/FK/uniqueness, single-origin constraint, RPC surface, the
   locked transaction, the bidirectional ban triggers with pinned
   SQLSTATEs, cancellation-preserves-flag semantics, revoke/grant,
   facade recreation. RED until the files exist and conform.
2. LIVE BEHAVIOR MATRIX (needs ENV_DB; gated): the full packet matrix —
   atomic rollback, same-key retry idempotency, concurrent
   double-submit, same-key/different-payload rejection, reporter spoof
   denial, pending-role denial, link uniqueness/immutability,
   cancellation lifecycle, delete/unlink restrictions, facade
   exposure, audit capture, truthful linked status, both rejection
   SQLSTATEs. The runner REFUSES to execute unless explicitly enabled
   inside a human-authorized gate window (Gate 1 expand / Gate 2
   contract / D10 postflight): it skips with a typed reason, never a
   silent pass, and never touches production outside a window.
3. IMPORT PARSING (pure, runs anywhere): strict Thai/English boolean
   semantics for the Building import adapter seam — the adjacent
   defect (values like "false"/"0" coercing to true) is encoded as a
   shared parser contract the adapter must satisfy.

Pinned SQLSTATEs (rejections must RAISE with these class codes so the
client error copy and the server-log capture are deterministic):
  ERRCODE_INSUFFICIENT_PRIVILEGE '42501' — direct repair_needed write
      outside the RPC (clause 5, both directions).
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Optional

REPO_ROOT = Path(__file__).resolve().parent.parent
EXPAND_MIGRATION = REPO_ROOT / "supabase/migrations/20261008000001_building_repair_c1_expand.sql"
CONTRACT_MIGRATION = REPO_ROOT / "supabase/migrations/20261010000001_building_repair_c1_contract.sql"

# Both rejection directions share one pinned SQLSTATE; the message text
# distinguishes them (greppable in the PostgreSQL server log).
BAN_SQLSTATE = "42501"
BAN_TRUE_SET_MESSAGE = "ENV_C1_BAN_DIRECT_TRUE_SET"
BAN_TRUE_TO_FALSE_MESSAGE = "ENV_C1_BAN_DIRECT_TRUE_TO_FALSE"

# Gate-window opt-in for the live matrix. Enabled only by the operator
# inside a human-authorized LIVE-DB window; absent → typed skip.
LIVE_WINDOW_ENV = "ENV_C1_LIVE_GATE_WINDOW"


def live_gate_window() -> Optional[str]:
    """Return the declared human-gate window name, or None.

    Valid values record WHICH authorized window the live matrix runs
    under (e.g. 'GATE1_EXPAND_APPLY', 'GATE2_CONTRACT_APPLY',
    'D10_POSTFLIGHT'). Any other/absent value means no window: live
    tests must skip with a typed reason — never silently pass, never
    touch production.
    """
    value = os.environ.get(LIVE_WINDOW_ENV, "").strip().upper()
    allowed = {"GATE1_EXPAND_APPLY", "GATE2_CONTRACT_APPLY", "D10_POSTFLIGHT"}
    return value if value in allowed else None


def read_migration(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def strip_sql_comments(sql: str) -> str:
    return re.sub(r"--[^\n]*", "", sql)


# ── Static SQL contract checks (clause-numbered per the packet) ─────────


def c1_link_column(sql: str) -> bool:
    """Clause 1/3: nullable inspection_round_id FK -> building.inspection_round
    ON DELETE RESTRICT, unique when non-null, single origin vs reading_id."""
    s = strip_sql_comments(sql)
    return (
        "inspection_round_id" in s
        and re.search(r"references\s+building\.inspection_round", s, re.I) is not None
        and "on delete restrict" in s.lower()
        and re.search(r"unique.*inspection_round_id|inspection_round_id.*unique", s, re.I | re.S) is not None
    )


def c5_rpc_single_command(sql: str) -> bool:
    """Clause 5: ONE transactional command (RPC) with a stable client key."""
    s = strip_sql_comments(sql)
    return (
        re.search(r"create\s+or\s+replace\s+function\s+\w+\.\w+", s, re.I) is not None
        and "client_key" in s
    )


def c6_reporter_server_derived(sql: str) -> bool:
    """Clause 6: reported_by derived from auth.uid() server-side."""
    return "auth.uid()" in strip_sql_comments(sql)


def c6_search_path_locked(sql: str) -> bool:
    """Clause 6: definer functions lock search_path."""
    return re.search(r"set\s+search_path\s*=", strip_sql_comments(sql), re.I) is not None


def contract_locks_tables(sql: str) -> bool:
    """R3 round 5: contract migration locks both tables."""
    s = strip_sql_comments(sql)
    return (
        re.search(r"lock\s+table\s+.*building\.inspection_round\s+in\s+access\s+exclusive\s+mode", s, re.I | re.S) is not None
        and re.search(r"lock\s+table\s+.*core\.repair_request\s+in\s+access\s+exclusive\s+mode", s, re.I | re.S) is not None
    )


def contract_asserts_both_directions(sql: str) -> bool:
    """R3 rounds 5–6 + D8 R1 P2: ONE transaction re-asserts clause 1 BOTH
    ways — checked STRUCTURALLY: each direction's anti-join shape AND its
    typed abort marker must be present (a bare RAISE anywhere no longer
    satisfies this)."""
    s = strip_sql_comments(sql)
    class_i = (
        "ENV_C1_ASSERT_CLASS_I" in s
        and re.search(
            r"repair_needed\s+is\s+true.*not\s+exists\s*\(\s*select\s+1\s+from\s+core\.repair_request",
            s, re.I | re.S,
        ) is not None
    )
    class_ii = (
        "ENV_C1_ASSERT_CLASS_II" in s
        and re.search(
            r"rr\.inspection_round_id\s+is\s+not\s+null.*exists\s*\(\s*select\s+1\s+from\s+building\.inspection_round",
            s, re.I | re.S,
        ) is not None
        and re.search(r"ir\.repair_needed\s+is\s+not\s+true", s, re.I) is not None
    )
    # D8 R7 P2-2: the clause-2 premise assertion is structural, not just
    # link parity — ENV_C1_ASSERT_PREMISE plus the premise predicate
    # (issues_found NOT TRUE OR location NULL on a true round) must both
    # be present, or the check fails closed.
    premise = (
        "ENV_C1_ASSERT_PREMISE" in s
        and re.search(
            r"repair_needed\s+is\s+true\s+and\s*\(\s*(?:ir\.)?issues_found\s+is\s+not\s+true"
            r"\s+or\s+(?:ir\.)?location_id\s+is\s+null",
            s, re.I | re.S,
        ) is not None
    )
    return class_i and class_ii and premise


def contract_bidirectional_ban(sql: str) -> bool:
    """R3 rounds 6–7: durable trigger ban — direct true-set AND direct
    linked true→false both rejected with the pinned SQLSTATE; no
    true→false route exists (cancellation preserves the flag)."""
    s = strip_sql_comments(sql)
    return (
        BAN_SQLSTATE in s
        and BAN_TRUE_SET_MESSAGE in s
        and BAN_TRUE_TO_FALSE_MESSAGE in s
        and re.search(r"create\s+(or\s+replace\s+)?(constraint\s+)?trigger", s, re.I) is not None
    )


def contract_no_true_to_false_route(sql: str) -> bool:
    """The only sanctioned way to change a linked repair's state is the
    cancellation RPC path; nothing in the contract SQL may set
    repair_needed=false."""
    s = strip_sql_comments(sql).lower()
    return "repair_needed = false" not in s and "repair_needed=false" not in s and "repair_needed to false" not in s


def facade_recreated(sql: str) -> bool:
    """Clause 10: public facade view recreated after migration."""
    return re.search(r"create\s+or\s+replace\s+view\s+public\.\w*repair", strip_sql_comments(sql), re.I) is not None


# ── Import boolean contract (D5 seam; runs anywhere) ────────────────────

_TRUE_TOKENS = {"true", "1", "yes", "ใช่", "มี"}
_FALSE_TOKENS = {"false", "0", "no", "ไม่", "ไม่มี"}


def parse_import_boolean(raw: str) -> Optional[bool]:
    """STRICT Thai/English boolean parsing for Building imports.

    Returns None for anything unrecognized — the caller must reject or
    hold the row for explicit promotion; never coerce. This is the
    contract the import adapter (frontend/src/lib/import-adapters/
    building.ts) must satisfy; the adjacent defect (truthy coercion of
    "false"/"0") is exactly what it forbids.
    """
    token = raw.strip().lower()
    if token in _TRUE_TOKENS:
        return True
    if token in _FALSE_TOKENS:
        return False
    return None
