#!/usr/bin/env python3
"""ENV-COORD-002 — deterministic Coordination Guard core + registry parser.

Implements the pure decision core of
docs/ai/architecture/ENV-COORDINATION-GUARD.md (§3–§5, §7) for the
BOOTSTRAP_CONTROL slice ordered by docs/work-orders/ENV-COORD-002.md:

- parse/validate the canonical COORDINATION-REGISTRY v1 block from trusted
  origin/main text (§3 Tier B, §7.1);
- claim fencing: claim id / generation / single execution holder (§4.2,
  §4.2A) with every decision bound to policy_revision + registry_hash (§3.1);
- canonical cross-platform paths and the exact-file/subtree scope grammar
  with forbidden-scope precedence (§7.2);
- goal lifecycle ordering with GENESIS, stable event ids, monotonic
  sequences, idempotent replay (§5);
- admission gate + QUIESCING → QUIESCENCE_ATTESTATION → TRANSFER_READY
  barrier (§4.2B), where the current execution holder owns quiescence
  publication and the coordinator can validate but never fabricate it;
- fail-closed reason codes instead of ambiguous booleans (§7.1).

Bootstrap truth (§11.6): this core never reports ENFORCING. Enforcement
mode comes only from the trusted registry, and ENFORCING/HARDENED are
downgraded to ENFORCEMENT_NOT_ACTIVE unless the caller proves server-side
enforcement (a verification this slice does not perform).

No hooks, no GitHub ruleset changes, no network, no production mutation.
Git interrogation stays behind run_git() so every decision function here is
pure and deterministic. Python 3.11+, standard library only.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import subprocess
import sys
import threading
import unicodedata
from dataclasses import dataclass
from types import MappingProxyType
from typing import Any, Iterable, Optional

CURRENT_WORK_PATH = "docs/ai/CURRENT-WORK.md"

ADMISSION_IN_FLIGHT = "IN_FLIGHT"
ADMISSION_COMPLETE = "EFFECT_COMPLETE"
ADMISSION_FAILED = "EFFECT_FAILED"
ADMISSION_UNKNOWN = "EFFECT_UNKNOWN"
_TERMINAL_ADMISSIONS = (ADMISSION_COMPLETE, ADMISSION_FAILED, ADMISSION_UNKNOWN)

REGISTRY_VERSION = 1
ROLLBACK_MODES = ("BOOTSTRAP_CONTROL", "SHADOW")
VERIFIED_MODES = ("ENFORCING", "HARDENED")
ENFORCEMENT_MODES = ROLLBACK_MODES + VERIFIED_MODES
ENFORCEMENT_NOT_ACTIVE = "ENFORCEMENT_NOT_ACTIVE"

# Claim-state vocabulary = architecture §4.1 states ∪ protocol §18
# preferred lifecycle + compatibility labels ∪ the authoritative
# CURRENT-WORK allowed-statuses list (which adds IDLE, DESIGNING).
# §4.1: "Existing repository compatibility states remain valid until
# migrated" — a registry following the repository's still-valid lifecycle
# must stay readable; the guard must not silently drop allowed states.
#
# Mutation semantics (MUTABLE_CLAIM_STATUSES): §18 splits §4.1's ACTIVE
# working phase into IMPLEMENTING -> VERIFYING before the REVIEW_REQUESTED
# gate; the holder still writes implementation and verification evidence
# in both, so neither phase may self-fence (R6 review P1).
MUTABLE_CLAIM_STATUSES = ("CLAIMED", "ACTIVE", "IMPLEMENTING", "VERIFYING")
CLAIM_STATUSES = MUTABLE_CLAIM_STATUSES + (
    "READY",
    "READY_FOR_IMPLEMENTATION",
    "REVIEW_REQUESTED",
    "RE-REVIEW_REQUESTED",
    "CHANGES_REQUIRED",
    "APPROVED",
    "MERGE_READY",
    "MERGED",
    "POSTMERGE_VERIFY",
    "CLOSED",
    "BLOCKED",
    "DECISION_REQUIRED",
    "HUMAN_ACTION_REQUIRED",
    "IDLE",
    "DESIGNING",
    "STALE_CLAIM",
    "RECOVERY_HOLD",
    "OWNERSHIP_CONFLICT",
    "STATE_DRIFT",
)

# Scope locks derive from the §4.1 lifecycle: every state holds its
# mutable-scope lock EXCEPT READY (never claimed) and CLOSED (the explicit
# terminal release per §4.5 — release happens only through the authorized
# quiesce/drain + release transition). MERGED and POSTMERGE_VERIFY still
# HOLD their scope: merging the implementation PR is not the release
# transition, and the lane may write verification evidence until CLOSED.
# STALE_CLAIM / RECOVERY_HOLD / STATE_DRIFT hold locks per §4.5
# (inactivity or worker loss must not silently free scope).
#
# Compatibility-state derivations (R6; corrected R7; recorded for
# reviewer confirmation, none invented as a grant):
# - READY_FOR_IMPLEMENTATION — an ALLOCATED lane, not a released record:
#   WO-STAB-006/009 record "ACTIVE — READY_FOR_IMPLEMENTATION" with an
#   assigned owner and owned files, and WO-UX-AN-P001 permits parallel
#   work only because owned files do not overlap (R7 review). It HOLDS
#   its scope (overlap conflict) while remaining non-mutable until the
#   lane transitions to IMPLEMENTING.
# - RE-REVIEW_REQUESTED — §18 review gate re-entered after
#   CHANGES_REQUIRED -> IMPLEMENTING: same fence as REVIEW_REQUESTED
#   (not mutable, lock held).
# - IDLE / DESIGNING — accepted vocabulary only; conservatively
#   fail-closed: no mutation grant is derivable from current repo
#   authority, and §4.5 keeps the scope held (inactivity or a
#   non-canonical phase must not silently free scope).
RELEASED_CLAIM_STATUSES = ("READY", "CLOSED")
LOCK_HOLDING_CLAIM_STATUSES = tuple(
    status for status in CLAIM_STATUSES if status not in RELEASED_CLAIM_STATUSES
)

TERMINAL_GOAL_RESULTS = (
    "COMPLETED_VERIFIED",
    "COMPLETED_UNVERIFIED",
    "PARTIAL",
    "BLOCKED",
    "DECISION_REQUIRED",
    "FAILED",
    "PAUSED",
)
LIFECYCLE_EVENT_TYPES = (
    "GOAL_START",
    "CHECKPOINT",
    "OPERATION_INTENT",
    "OPERATION_OUTCOME",
    "OPERATION_RECONCILED",
    "GOAL_END",
)
OPERATION_OUTCOMES = ("SUCCEEDED", "FAILED", "UNKNOWN")
GENESIS = "GENESIS"

CHANGES_ADD = ("add", "untracked")
CHANGES_SRC_ONLY = ("modify", "delete")
CHANGES_BOTH = ("rename", "move")
CHANGE_KINDS = CHANGES_ADD + CHANGES_SRC_ONLY + CHANGES_BOTH + ("copy",)

_WILDCARD_CHARS = set("*?[]{}!")


class R:
    """Fail-closed reason codes (§7.1: reasons, not ambiguous booleans)."""

    # registry parsing / validation
    REGISTRY_NOT_FOUND = "REGISTRY_NOT_FOUND"
    AMBIGUOUS_REGISTRY = "AMBIGUOUS_REGISTRY"
    REGISTRY_MALFORMED_JSON = "REGISTRY_MALFORMED_JSON"
    UNSUPPORTED_REGISTRY_VERSION = "UNSUPPORTED_REGISTRY_VERSION"
    INVALID_ENFORCEMENT_MODE = "INVALID_ENFORCEMENT_MODE"
    CLAIMS_EMPTY = "CLAIMS_EMPTY"
    MISSING_CLAIM_FIELD = "MISSING_CLAIM_FIELD"
    INVALID_CLAIM_FIELD = "INVALID_CLAIM_FIELD"
    DUPLICATE_CLAIM = "DUPLICATE_CLAIM"
    OWNERSHIP_CONFLICT = "OWNERSHIP_CONFLICT"
    INVALID_SHARED_EXCEPTION = "INVALID_SHARED_EXCEPTION"

    # path / scope grammar
    INVALID_PATH = "INVALID_PATH"
    INVALID_SCOPE_EXPRESSION = "INVALID_SCOPE_EXPRESSION"
    UNKNOWN_CHANGE_KIND = "UNKNOWN_CHANGE_KIND"

    # preflight / fencing
    UNKNOWN_TASK = "UNKNOWN_TASK"
    WRONG_CLAIM = "WRONG_CLAIM"
    STALE_CLAIM_GENERATION = "STALE_CLAIM_GENERATION"
    WRONG_EXECUTION_HOLDER = "WRONG_EXECUTION_HOLDER"
    CLAIM_STATUS_NOT_MUTABLE = "CLAIM_STATUS_NOT_MUTABLE"
    WORKTREE_MISMATCH = "WORKTREE_MISMATCH"
    BRANCH_MISMATCH = "BRANCH_MISMATCH"
    BASE_NOT_ANCESTOR = "BASE_NOT_ANCESTOR"

    # mutation scope evaluation
    FORBIDDEN_PATH = "FORBIDDEN_PATH"
    OUTSIDE_MUTABLE_SCOPE = "OUTSIDE_MUTABLE_SCOPE"
    LINK_TARGET_OUTSIDE_ROOT = "LINK_TARGET_OUTSIDE_ROOT"
    LINK_CROSSES_LANE = "LINK_CROSSES_LANE"

    # authority precedence / control transitions
    POLICY_CONTRADICTION = "POLICY_CONTRADICTION"
    STALE_POLICY_REVISION = "STALE_POLICY_REVISION"
    STALE_REGISTRY_HASH = "STALE_REGISTRY_HASH"
    INVALID_GENERATION_TRANSITION = "INVALID_GENERATION_TRANSITION"

    # enforcement truth
    SERVER_ENFORCEMENT_UNVERIFIED = "SERVER_ENFORCEMENT_UNVERIFIED"

    # admissions / transfer
    ADMISSION_GATE_CLOSED = "ADMISSION_GATE_CLOSED"
    DUPLICATE_OPERATION = "DUPLICATE_OPERATION"
    UNKNOWN_OPERATION = "UNKNOWN_OPERATION"
    EFFECT_CONFLICT = "EFFECT_CONFLICT"
    INVALID_OPERATION_OUTCOME = "INVALID_OPERATION_OUTCOME"
    TRANSFER_BLOCKED_ACTIVE_ADMISSIONS = "TRANSFER_BLOCKED_ACTIVE_ADMISSIONS"
    TRANSFER_BLOCKED_UNRESOLVED_EFFECTS = "TRANSFER_BLOCKED_UNRESOLVED_EFFECTS"
    TRANSFER_BLOCKED_LIVE_CHILDREN = "TRANSFER_BLOCKED_LIVE_CHILDREN"
    QUIESCENCE_PRECONDITIONS_UNMET = "QUIESCENCE_PRECONDITIONS_UNMET"
    COORDINATOR_CANNOT_PUBLISH_QUIESCENCE = "COORDINATOR_CANNOT_PUBLISH_QUIESCENCE"
    TRANSFER_NOT_READY = "TRANSFER_NOT_READY"
    TRANSFER_AWAITING_AUTHORIZED_TRANSITION = "TRANSFER_AWAITING_AUTHORIZED_TRANSITION"
    TRANSFER_TUPLE_MISMATCH = "TRANSFER_TUPLE_MISMATCH"
    MISSING_ACTUAL_CONTEXT = "MISSING_ACTUAL_CONTEXT"
    SHARED_PATH_OWNER_REQUIRED = "SHARED_PATH_OWNER_REQUIRED"
    SHARED_OWNER_GENERATION_MISMATCH = "SHARED_OWNER_GENERATION_MISMATCH"

    # lifecycle ordering
    EVENT_CONFLICT = "EVENT_CONFLICT"
    EVENT_NOT_PUBLISHED = "EVENT_NOT_PUBLISHED"
    OUT_OF_ORDER_EVENT = "OUT_OF_ORDER_EVENT"
    UNTERMINATED_PREDECESSOR = "UNTERMINATED_PREDECESSOR"
    INVALID_GOAL_RESULT = "INVALID_GOAL_RESULT"
    GOAL_END_NOT_PUBLISHED = "GOAL_END_NOT_PUBLISHED"
    INVALID_EVENT_TYPE = "INVALID_EVENT_TYPE"

    # CLI plumbing
    GIT_UNAVAILABLE = "GIT_UNAVAILABLE"
    IO_ERROR = "IO_ERROR"


class GuardFailure(Exception):
    """Deterministic fail-closed rejection carrying a reason code."""

    def __init__(self, reason: str, detail: str = ""):
        super().__init__(f"{reason}: {detail}" if detail else reason)
        self.reason = reason
        self.detail = detail


# ═══════════════════════════════════════════════════════════════════════
# §7.2 canonical paths + scope grammar
# ═══════════════════════════════════════════════════════════════════════
def canonicalize_path(raw: str) -> str:
    """Repo-root-relative canonical path (§7.2 rules 1–4).

    Separators become '/', text is NFC-normalized, and absolute paths,
    drive prefixes, NUL, '.', '..', empty segments, and Win32-equivalent
    ambiguous segments (trailing '.' or trailing ASCII space) are
    rejected — on Windows "file.", "file " and "file" name the same
    file, so such aliases must never enter scope evaluation as distinct
    paths (R8). They fail closed; they are never trimmed into another
    accepted path.
    """
    if not isinstance(raw, str) or not raw:
        raise GuardFailure(R.INVALID_PATH, f"not a non-empty string: {raw!r}")
    if "\x00" in raw:
        raise GuardFailure(R.INVALID_PATH, "NUL byte in path")
    unified = raw.replace("\\", "/")
    if unified.startswith("/"):
        raise GuardFailure(R.INVALID_PATH, f"absolute path: {raw!r}")
    if len(unified) >= 2 and unified[1] == ":":
        raise GuardFailure(R.INVALID_PATH, f"drive prefix: {raw!r}")
    normalized = unicodedata.normalize("NFC", unified)
    segments = normalized.split("/")
    for segment in segments:
        if segment == "":
            raise GuardFailure(R.INVALID_PATH, f"empty path segment: {raw!r}")
        if segment in (".", ".."):
            raise GuardFailure(R.INVALID_PATH, f"relative segment: {raw!r}")
        if segment.endswith(".") or segment.endswith(" "):
            raise GuardFailure(
                R.INVALID_PATH,
                f"ambiguous Win32 alias segment {segment!r}: trailing"
                " dot/space names the same file as the trimmed spelling",
            )
    return normalized


def case_key(path: str) -> str:
    """Case-folded canonical key — the only key used for comparisons."""
    return canonicalize_path(path).casefold()


@dataclass(frozen=True)
class ScopeExpr:
    kind: str  # 'exact' | 'subtree'
    raw: str
    path: str  # canonical file path, or subtree directory prefix
    key: str  # casefold of path

    def contains(self, path: str) -> bool:
        target = case_key(path)
        if self.kind == "exact":
            return target == self.key
        return target.startswith(self.key + "/")


def parse_scope_expr(expr: str) -> ScopeExpr:
    """Only exact files and dir/** subtrees are grammar (§7.2)."""
    if not isinstance(expr, str) or not expr:
        raise GuardFailure(R.INVALID_SCOPE_EXPRESSION, f"empty expression: {expr!r}")
    if expr.endswith("/**"):
        prefix = expr[: -len("/**")]
        if prefix in ("", "/") or any(ch in _WILDCARD_CHARS for ch in prefix):
            raise GuardFailure(R.INVALID_SCOPE_EXPRESSION, f"bad subtree: {expr!r}")
        canonical = canonicalize_path(prefix)
        if any(ch in _WILDCARD_CHARS for ch in canonical):
            raise GuardFailure(R.INVALID_SCOPE_EXPRESSION, f"wildcard in subtree: {expr!r}")
        return ScopeExpr("subtree", expr, canonical, canonical.casefold())
    if any(ch in _WILDCARD_CHARS for ch in expr):
        raise GuardFailure(R.INVALID_SCOPE_EXPRESSION, f"wildcard not allowed: {expr!r}")
    canonical = canonicalize_path(expr)
    return ScopeExpr("exact", expr, canonical, canonical.casefold())


def scope_contains(expr: ScopeExpr, path: str) -> bool:
    return expr.contains(path)


def scopes_overlap(a: ScopeExpr, b: ScopeExpr) -> bool:
    """Deterministic overlap (§7.2): exact/exact equality, exact/subtree
    membership, subtree/subtree prefix containment either way."""
    if a.kind == "exact" and b.kind == "exact":
        return a.key == b.key
    if a.kind == "exact" and b.kind == "subtree":
        return b.contains(a.path)
    if a.kind == "subtree" and b.kind == "exact":
        return a.contains(b.path)
    return a.key == b.key or a.key.startswith(b.key + "/") or b.key.startswith(a.key + "/")


def _scope_set_contains(exprs: Iterable[ScopeExpr], path: str) -> bool:
    return any(expr.contains(path) for expr in exprs)


# ═══════════════════════════════════════════════════════════════════════
# §3 Tier B registry parsing + §3.1 trusted policy binding
# ═══════════════════════════════════════════════════════════════════════
REQUIRED_CLAIM_FIELDS = (
    "task_id",
    "claim_id",
    "claim_generation",
    "status",
    "owner_role",
    "execution_holder_id",
    "worktree",
    "branch",
    "base_sha",
    "mutable_scope",
    "forbidden_scope",
    "work_order_path",
    "handoff_path",
    "review_owner",
    "dependencies",
    "last_checkpoint_pointer",
    "one_next_safe_action",
)

REQUIRED_SHARED_EXCEPTION_FIELDS = (
    "shared_paths",
    "participating_claims",
    "integration_owner_claim_id",
    "merge_order",
    "release_condition",
)


def extract_registry_block(text: str) -> tuple[str, int]:
    """Find THE fenced json block that parses to a coordination registry.

    Other json fences in CURRENT-WORK.md are ignored; more than one
    registry block is ambiguous and fails closed.
    """
    candidates: list[tuple[str, int]] = []
    search_from = 0
    while True:
        start = text.find("```json", search_from)
        if start == -1:
            break
        content_start = start + len("```json")
        end = text.find("```", content_start)
        if end == -1:
            break
        block = text[content_start:end].strip()
        if "coordination_registry" in block:
            try:
                parsed = json.loads(block)
            except (json.JSONDecodeError, ValueError):
                raise GuardFailure(R.REGISTRY_MALFORMED_JSON, "registry fence is not valid JSON")
            if isinstance(parsed, dict) and "coordination_registry" in parsed:
                candidates.append((block, start))
        search_from = end + 3
    if not candidates:
        raise GuardFailure(R.REGISTRY_NOT_FOUND, "no coordination registry block")
    if len(candidates) > 1:
        raise GuardFailure(R.AMBIGUOUS_REGISTRY, f"{len(candidates)} registry blocks")
    return candidates[0]


def registry_hash(block: str) -> str:
    """SHA-256 of the exact canonical block text (§3.1 registry_hash)."""
    return hashlib.sha256(block.encode("utf-8")).hexdigest()


def _freeze(value: Any) -> Any:
    """Recursively convert parsed registry JSON to immutable equivalents.

    dicts become read-only mappings and lists become tuples, so a
    hash-bound TrustedPolicy cannot have its authorization data (claims,
    scopes, statuses, holders, shared exceptions, raw registry) mutated
    after construction while retaining the original registry_hash (R11).
    """
    if isinstance(value, dict):
        return MappingProxyType({k: _freeze(v) for k, v in value.items()})
    if isinstance(value, list):
        return tuple(_freeze(v) for v in value)
    return value


def _thaw(value: Any) -> Any:
    """Inverse of _freeze: plain mutable dict/list tree (re-entry helper)."""
    if isinstance(value, MappingProxyType):
        return {k: _thaw(v) for k, v in value.items()}
    if isinstance(value, tuple):
        return [_thaw(v) for v in value]
    return value


def _require_str(claim: dict, name: str) -> None:
    value = claim.get(name)
    if not isinstance(value, str) or not value:
        raise GuardFailure(R.INVALID_CLAIM_FIELD, f"{name} must be a non-empty string")


def validate_registry(registry: Any) -> dict:
    """Validate the parsed coordination_registry object; return an
    immutable snapshot (recursively frozen deep copy).

    Raises GuardFailure with a specific reason for every malformed,
    duplicated or ambiguous shape. Duplicate claim ids are duplicates; two
    claims on one task, or any mutable-scope overlap between active claims,
    is an ownership conflict. The returned mapping/list structure is
    recursively read-only: authorization data bound to a registry_hash
    cannot drift after validation (R11).
    """
    if not isinstance(registry, (dict, MappingProxyType)):
        raise GuardFailure(R.REGISTRY_MALFORMED_JSON, "registry must be an object")
    registry = copy.deepcopy(_thaw(registry))

    version = registry.get("version")
    # exact integer only: Python True == 1, so a bool masquerading as the
    # schema-integer version must not slip through an equality check.
    if isinstance(version, bool) or not isinstance(version, int) or version != REGISTRY_VERSION:
        raise GuardFailure(R.UNSUPPORTED_REGISTRY_VERSION, f"version {version!r}")
    mode = registry.get("enforcement_mode")
    if mode not in ENFORCEMENT_MODES:
        raise GuardFailure(R.INVALID_ENFORCEMENT_MODE, f"{mode!r}")
    if not isinstance(registry.get("expected_policy_revision"), str):
        raise GuardFailure(R.INVALID_CLAIM_FIELD, "expected_policy_revision must be a string")

    raw_claims = registry.get("claims")
    if not isinstance(raw_claims, (list, tuple)) or not raw_claims:
        raise GuardFailure(R.CLAIMS_EMPTY, "claims must be a non-empty list")

    seen_claim_ids: set[str] = set()
    seen_task_ids: set[str] = set()
    parsed_scopes: dict[str, tuple[list[ScopeExpr], list[ScopeExpr]]] = {}
    for claim in raw_claims:
        if not isinstance(claim, dict):
            raise GuardFailure(R.INVALID_CLAIM_FIELD, "claim must be an object")
        for required in REQUIRED_CLAIM_FIELDS:
            if required not in claim:
                raise GuardFailure(R.MISSING_CLAIM_FIELD, required)
        _require_str(claim, "task_id")
        _require_str(claim, "claim_id")
        _require_str(claim, "owner_role")
        _require_str(claim, "execution_holder_id")
        _require_str(claim, "worktree")
        _require_str(claim, "branch")
        _require_str(claim, "base_sha")
        _require_str(claim, "work_order_path")
        _require_str(claim, "handoff_path")
        _require_str(claim, "review_owner")
        _require_str(claim, "last_checkpoint_pointer")
        _require_str(claim, "one_next_safe_action")
        generation = claim.get("claim_generation")
        if isinstance(generation, bool) or not isinstance(generation, int) or generation < 1:
            raise GuardFailure(R.INVALID_CLAIM_FIELD, f"claim_generation must be int >= 1: {generation!r}")
        if claim.get("status") not in CLAIM_STATUSES:
            raise GuardFailure(R.INVALID_CLAIM_FIELD, f"unknown status {claim.get('status')!r}")
        if claim["claim_id"] in seen_claim_ids:
            raise GuardFailure(R.DUPLICATE_CLAIM, claim["claim_id"])
        if claim["task_id"] in seen_task_ids:
            raise GuardFailure(R.OWNERSHIP_CONFLICT, f"task claimed twice: {claim['task_id']}")
        seen_claim_ids.add(claim["claim_id"])
        seen_task_ids.add(claim["task_id"])
        mutable = _parse_scope_list(claim.get("mutable_scope"), "mutable_scope")
        forbidden = _parse_scope_list(claim.get("forbidden_scope"), "forbidden_scope")
        parsed_scopes[claim["claim_id"]] = (mutable, forbidden)

    # shared-file exceptions are validated against the parsed claims and
    # yield the only authorized mutable-scope overlap (§7.3)
    claims_by_id = {claim["claim_id"]: claim for claim in registry["claims"]}
    authorized = _validate_and_index_shared_exceptions(
        registry.get("shared_exceptions", []), claims_by_id
    )

    # mutable-scope overlap enforcement applies only to claims that still
    # HOLD a scope lock (§4.1/§4.5): released records (READY/CLOSED) must
    # not false-collide with new ownership, while MERGED/POSTMERGE_VERIFY
    # still hold until the authorized CLOSED release. Overlap is permitted
    # ONLY as the exact authorized shared paths of a §7.3 exception; a
    # subtree/subtree intersection is broader than any exact authorization
    # and always conflicts.
    lock_holding = [
        claim_id
        for claim_id in parsed_scopes
        if claims_by_id[claim_id]["status"] in LOCK_HOLDING_CLAIM_STATUSES
    ]
    for i, a in enumerate(lock_holding):
        for b in lock_holding[i + 1 :]:
            for expr_a in parsed_scopes[a][0]:
                for expr_b in parsed_scopes[b][0]:
                    if not scopes_overlap(expr_a, expr_b):
                        continue
                    if expr_a.kind == "subtree" and expr_b.kind == "subtree":
                        raise GuardFailure(
                            R.OWNERSHIP_CONFLICT,
                            f"{a} subtree {expr_a.raw!r} overlaps {b} subtree {expr_b.raw!r}"
                            " beyond any exact shared path",
                        )
                    exact = expr_a if expr_a.kind == "exact" else expr_b
                    if exact.key not in authorized.get(frozenset((a, b)), set()):
                        raise GuardFailure(
                            R.OWNERSHIP_CONFLICT,
                            f"{a} mutable {expr_a.raw!r} overlaps {b} mutable {expr_b.raw!r}"
                            " without an authorized shared exception",
                        )
    return _freeze(registry)


def _validate_and_index_shared_exceptions(exceptions: Any, claims_by_id: dict) -> dict:
    """Validate full §7.3 records and index the exact authorized overlap.

    Each exception requires: exact shared path(s) inside every
    participant's mutable scope; participating claims bound to their exact
    current generations (>= 2, no duplicates); a single temporary
    integration owner that participates; a merge order that is an exact
    permutation of the participants; and a non-empty release condition.

    Global invariant (§7.3/§13): at most ONE active exception record per
    canonical shared path — regardless of participant sets. Three
    participants on one path belong in ONE record with ONE owner and ONE
    merge order; pairwise records over the same path would mint multiple
    temporary owners and make authorization list-order dependent.
    Duplicates are rejected, not treated as idempotent.
    Returns {frozenset({claim_a, claim_b}): {casefold path keys}}.
    """
    if not isinstance(exceptions, (list, tuple)):
        raise GuardFailure(R.INVALID_SHARED_EXCEPTION, "shared_exceptions must be a list")
    authorized: dict[frozenset, set] = {}
    claimed_paths: set[str] = set()
    for exc in exceptions:
        if not isinstance(exc, dict):
            raise GuardFailure(R.INVALID_SHARED_EXCEPTION, "exception must be an object")
        for required in REQUIRED_SHARED_EXCEPTION_FIELDS:
            if required not in exc:
                raise GuardFailure(R.INVALID_SHARED_EXCEPTION, f"missing {required}")
        raw_paths = exc["shared_paths"]
        if not isinstance(raw_paths, (list, tuple)) or not raw_paths:
            raise GuardFailure(R.INVALID_SHARED_EXCEPTION, "shared_paths must be a non-empty list")
        keys: set[str] = set()
        for raw in raw_paths:
            expr = parse_scope_expr(raw)
            if expr.kind != "exact":
                raise GuardFailure(R.INVALID_SHARED_EXCEPTION, f"shared path must be exact: {raw!r}")
            keys.add(expr.key)
        participants = exc["participating_claims"]
        if not isinstance(participants, (list, tuple)) or len(participants) < 2:
            raise GuardFailure(R.INVALID_SHARED_EXCEPTION, "at least two participating claims required")
        participant_ids: list[str] = []
        for participant in participants:
            if not isinstance(participant, dict):
                raise GuardFailure(R.INVALID_SHARED_EXCEPTION, "participant must be an object")
            cid = participant.get("claim_id")
            if not isinstance(cid, str) or not cid:
                # non-string (e.g. an unhashable list) must fail closed —
                # a dict lookup would crash with TypeError instead
                raise GuardFailure(R.INVALID_SHARED_EXCEPTION, f"participant claim_id {cid!r}")
            generation = participant.get("claim_generation")
            claim = claims_by_id.get(cid)
            if claim is None:
                raise GuardFailure(R.INVALID_SHARED_EXCEPTION, f"unknown participant {cid!r}")
            if (
                isinstance(generation, bool)
                or not isinstance(generation, int)
                or generation != claim["claim_generation"]
            ):
                raise GuardFailure(
                    R.INVALID_SHARED_EXCEPTION,
                    f"participant {cid!r} generation {generation!r} != registry {claim['claim_generation']}",
                )
            participant_ids.append(cid)
        if len(set(participant_ids)) != len(participant_ids):
            raise GuardFailure(R.INVALID_SHARED_EXCEPTION, "duplicate participant")
        owner = exc["integration_owner_claim_id"]
        if owner not in participant_ids:
            raise GuardFailure(
                R.INVALID_SHARED_EXCEPTION, f"integration owner {owner!r} does not participate"
            )
        order = exc["merge_order"]
        if (
            not isinstance(order, (list, tuple))
            or len(order) != len(set(order))
            or sorted(order) != sorted(set(participant_ids))
        ):
            raise GuardFailure(
                R.INVALID_SHARED_EXCEPTION,
                "merge_order must be an exact permutation of the participants",
            )
        if not isinstance(exc["release_condition"], str) or not exc["release_condition"]:
            raise GuardFailure(R.INVALID_SHARED_EXCEPTION, "release_condition must be a non-empty string")
        for cid in participant_ids:
            mutable = _parse_scope_list(claims_by_id[cid]["mutable_scope"], "mutable_scope")
            for key in keys:
                if not any(
                    expr.key == key or (expr.kind == "subtree" and key.startswith(expr.key + "/"))
                    for expr in mutable
                ):
                    raise GuardFailure(
                        R.INVALID_SHARED_EXCEPTION,
                        f"shared path {key!r} not inside {cid} mutable scope",
                    )
        # deterministic global uniqueness: one canonical shared path may be
        # covered by at most ONE active exception record across the whole
        # registry — mixed participant sets must not mint extra temporary
        # owners (triangle/pairwise coverage is rejected; add participants
        # to the single record instead). Duplicates are NOT idempotent.
        for key in keys:
            if key in claimed_paths:
                raise GuardFailure(
                    R.INVALID_SHARED_EXCEPTION,
                    f"shared path {key!r} is already covered by another active"
                    " exception record — at most one record (one temporary"
                    " integration owner) per canonical shared path; put all"
                    " participants in that single record",
                )
            claimed_paths.add(key)
        for i in range(len(participant_ids)):
            for j in range(i + 1, len(participant_ids)):
                pair = frozenset((participant_ids[i], participant_ids[j]))
                authorized.setdefault(pair, set()).update(keys)
    return authorized


def _parse_scope_list(value: Any, field: str) -> list[ScopeExpr]:
    if not isinstance(value, (list, tuple)) or not value:
        raise GuardFailure(R.INVALID_CLAIM_FIELD, f"{field} must be a non-empty list")
    return [parse_scope_expr(expr) for expr in value]


@dataclass(frozen=True)
class TrustedPolicy:
    """Trusted authorization inputs, bound to one origin/main revision."""

    policy_revision: str
    registry_hash: str
    enforcement_mode: str
    expected_policy_revision: str
    claims: tuple[dict, ...]
    shared_exceptions: tuple[dict, ...]
    raw_registry: dict
    raw_block: str

    def claim_by_task(self, task_id: str) -> Optional[dict]:
        for claim in self.claims:
            if claim.get("task_id") == task_id:
                return claim
        return None

    def claim_by_id(self, claim_id: str) -> Optional[dict]:
        for claim in self.claims:
            if claim.get("claim_id") == claim_id:
                return claim
        return None

    def mutable_exprs(self, claim: dict) -> list[ScopeExpr]:
        return [parse_scope_expr(e) for e in claim["mutable_scope"]]

    def forbidden_exprs(self, claim: dict) -> list[ScopeExpr]:
        return [parse_scope_expr(e) for e in claim["forbidden_scope"]]


def load_trusted_policy(text: str, policy_revision: str) -> TrustedPolicy:
    """Parse + validate the registry inside trusted origin/main text."""
    if not isinstance(policy_revision, str) or not policy_revision:
        raise GuardFailure(R.INVALID_CLAIM_FIELD, "policy_revision must be a non-empty string")
    block, _ = extract_registry_block(text)
    parsed = json.loads(block)
    registry = validate_registry(parsed["coordination_registry"])
    return TrustedPolicy(
        policy_revision=policy_revision,
        registry_hash=registry_hash(block),
        enforcement_mode=registry["enforcement_mode"],
        expected_policy_revision=registry["expected_policy_revision"],
        claims=tuple(registry["claims"]),
        shared_exceptions=tuple(registry.get("shared_exceptions", [])),
        raw_registry=registry,
        raw_block=block,
    )


# ═══════════════════════════════════════════════════════════════════════
# §4.4 preflight + §7.2 mutation scope evaluation
# ═══════════════════════════════════════════════════════════════════════
@dataclass(frozen=True)
class Decision:
    safe_to_mutate: bool
    reason: Optional[str]
    policy_revision: str
    registry_hash: str
    claim_id: str
    claim_generation: int
    execution_holder_id: str
    details: tuple = ()

    def to_dict(self) -> dict:
        return {
            "safe_to_mutate": self.safe_to_mutate,
            "reason": self.reason,
            "policy_revision": self.policy_revision,
            "registry_hash": self.registry_hash,
            "claim_id": self.claim_id,
            "claim_generation": self.claim_generation,
            "execution_holder_id": self.execution_holder_id,
            "details": list(self.details),
        }


@dataclass(frozen=True)
class Change:
    kind: str
    source: str
    destination: Optional[str] = None


@dataclass(frozen=True)
class LinkRequest:
    link_path: str
    resolved_repo_path: Optional[str]  # None => resolves outside worktree root
    inside_root: bool


def _deny(policy: TrustedPolicy, claim: Optional[dict], reason: str, details=()) -> Decision:
    return Decision(
        safe_to_mutate=False,
        reason=reason,
        policy_revision=policy.policy_revision,
        registry_hash=policy.registry_hash,
        claim_id=claim.get("claim_id", "") if claim else "",
        claim_generation=claim.get("claim_generation", 0) if claim else 0,
        execution_holder_id=claim.get("execution_holder_id", "") if claim else "",
        details=tuple(details),
    )


def preflight(policy: TrustedPolicy, ctx: dict) -> Decision:
    """§4.4 claim activation checks over trusted policy + actual context."""
    claim = policy.claim_by_task(ctx.get("task_id", ""))
    if claim is None:
        return _deny(policy, None, R.UNKNOWN_TASK)
    if ctx.get("claim_id") != claim["claim_id"]:
        return _deny(policy, claim, R.WRONG_CLAIM)
    if claim["status"] not in MUTABLE_CLAIM_STATUSES:
        return _deny(policy, claim, R.CLAIM_STATUS_NOT_MUTABLE)
    ctx_generation = ctx.get("claim_generation")
    # exact int only (R10): Python True == 1, so a bool ctx generation
    # must not masquerade as the trusted generation through the equality
    # fence — the same masquerade class the registry parser rejects.
    if isinstance(ctx_generation, bool) or not isinstance(ctx_generation, int):
        return _deny(policy, claim, R.STALE_CLAIM_GENERATION)
    if ctx_generation != claim["claim_generation"]:
        return _deny(policy, claim, R.STALE_CLAIM_GENERATION)
    if ctx.get("execution_holder_id") != claim["execution_holder_id"]:
        return _deny(policy, claim, R.WRONG_EXECUTION_HOLDER)
    if _normalize_worktree(ctx.get("worktree", "")) != _normalize_worktree(claim["worktree"]):
        return _deny(policy, claim, R.WORKTREE_MISMATCH)
    if ctx.get("branch") != claim["branch"]:
        return _deny(policy, claim, R.BRANCH_MISMATCH)
    # ancestry is a verified boolean fact: only exact True authorizes
    # (R11) — truthy non-bool values ("false", "0", 1, 1.0) fail closed
    if ctx.get("base_ancestor_of_head") is not True:
        return _deny(policy, claim, R.BASE_NOT_ANCESTOR)
    return Decision(
        safe_to_mutate=True,
        reason=None,
        policy_revision=policy.policy_revision,
        registry_hash=policy.registry_hash,
        claim_id=claim["claim_id"],
        claim_generation=claim["claim_generation"],
        execution_holder_id=claim["execution_holder_id"],
    )


def _normalize_worktree(path: str) -> str:
    return path.replace("\\", "/").rstrip("/").casefold()


def evaluate_mutation(
    policy: TrustedPolicy,
    ctx: dict,
    changes: Iterable[Change],
    links: Iterable[LinkRequest] = (),
) -> Decision:
    """Preflight + deterministic changed-file/link scope evaluation.

    Forbidden scope wins over mutable scope in every ordering. Add checks
    the destination; delete the source; rename/move both endpoints; copy
    requires the destination mutable and the source not forbidden.
    """
    decision = preflight(policy, ctx)
    if not decision.safe_to_mutate:
        return decision
    claim = policy.claim_by_task(ctx["task_id"])
    mutable = policy.mutable_exprs(claim)
    forbidden = policy.forbidden_exprs(claim)

    change_list = list(changes)
    for change in change_list:
        if change.kind not in CHANGE_KINDS:
            raise GuardFailure(R.UNKNOWN_CHANGE_KIND, change.kind)

    # pass 1 — forbidden precedence across every evaluated endpoint
    for change in change_list:
        endpoints = _evaluated_endpoints(change)
        for path in endpoints:
            if _scope_set_contains(forbidden, path):
                return _deny(policy, claim, R.FORBIDDEN_PATH, (f"{change.kind}:{path}",))

    # pass 2 — every mutation-requiring endpoint must be inside mutable scope
    for change in change_list:
        required = _mutable_required_endpoints(change)
        for path in required:
            if not _scope_set_contains(mutable, path):
                return _deny(policy, claim, R.OUTSIDE_MUTABLE_SCOPE, (f"{change.kind}:{path}",))

    # pass 2.5 — §7.3 single temporary integration owner for shared paths
    for change in change_list:
        required = _mutable_required_endpoints(change)
        for path in required:
            violation = _shared_path_owner_violation(policy, claim, path)
            if violation is not None:
                return _deny(policy, claim, violation, (f"{change.kind}:{path}",))

    # pass 3 — symlink/junction re-authorization (§7.2)
    for link in links:
        result = _evaluate_link(policy, claim, mutable, forbidden, link)
        if result is not None:
            return _deny(policy, claim, result, (f"link:{link.link_path}",))

    return Decision(
        safe_to_mutate=True,
        reason=None,
        policy_revision=policy.policy_revision,
        registry_hash=policy.registry_hash,
        claim_id=claim["claim_id"],
        claim_generation=claim["claim_generation"],
        execution_holder_id=claim["execution_holder_id"],
        details=tuple(f"{c.kind}:{c.source}" for c in change_list),
    )


def _evaluated_endpoints(change: Change) -> list[str]:
    if change.kind in CHANGES_ADD:
        return [change.destination or change.source]
    if change.kind in CHANGES_SRC_ONLY:
        return [change.source]
    if change.kind in CHANGES_BOTH:
        return [change.source, change.destination or ""]
    # copy: source read policy + destination mutable policy
    return [change.source, change.destination or ""]


def _mutable_required_endpoints(change: Change) -> list[str]:
    if change.kind == "copy":
        return [change.destination or ""]
    return _evaluated_endpoints(change)


def _link_crossing_authorized(
    policy: TrustedPolicy, claim: dict, resolved: str
) -> Optional[str]:
    """Verdict for a link resolving into another lane's protected scope.

    None = authorized crossing (exact §7.3 exception covers the path AND
    this claim is the integration owner at its bound generation); a reason
    otherwise — SHARED_PATH_OWNER_REQUIRED for a covered non-owner, or
    LINK_CROSSES_LANE when no exception covers the crossing at all.
    """
    target = case_key(resolved)
    claim_id = claim["claim_id"]
    for exc in policy.shared_exceptions:
        shared_keys = {case_key(p) for p in exc["shared_paths"]}
        if target not in shared_keys:
            continue
        participants = exc["participating_claims"]
        if not any(p["claim_id"] == claim_id for p in participants):
            continue
        if exc["integration_owner_claim_id"] != claim_id:
            return R.SHARED_PATH_OWNER_REQUIRED
        owner_binding = next(p for p in participants if p["claim_id"] == claim_id)
        if owner_binding["claim_generation"] != claim["claim_generation"]:
            return R.SHARED_OWNER_GENERATION_MISMATCH
        return None  # temporary owner at the bound generation
    return R.LINK_CROSSES_LANE  # uncovered crossing stays denied


def _evaluate_link(
    policy: TrustedPolicy,
    claim: dict,
    mutable: list[ScopeExpr],
    forbidden: list[ScopeExpr],
    link: LinkRequest,
) -> Optional[str]:
    """§7.2 symlink re-authorization + §7.3 shared-file exception.

    Order: outside-root → own forbidden (always wins) → own mutable
    required → every other LOCK-HOLDING lane's protected (mutable ∪
    forbidden) scope, waived only for the exact shared paths of an
    exception that binds this claim id AND generation as a participant.
    Released records (READY/CLOSED) hold no scope lock and do not block
    crossings — consistent with registry and control-transition overlap
    semantics (§4.1/§4.5).
    """
    if not link.inside_root or link.resolved_repo_path is None:
        return R.LINK_TARGET_OUTSIDE_ROOT
    resolved = link.resolved_repo_path
    if _scope_set_contains(forbidden, resolved):
        return R.FORBIDDEN_PATH
    if not _scope_set_contains(mutable, resolved):
        return R.OUTSIDE_MUTABLE_SCOPE
    for other in policy.claims:
        if other["claim_id"] == claim["claim_id"]:
            continue
        if other["status"] not in LOCK_HOLDING_CLAIM_STATUSES:
            continue  # released records hold no scope lock (§4.1/§4.5)
        protected = policy.mutable_exprs(other) + policy.forbidden_exprs(other)
        if _scope_set_contains(protected, resolved):
            # exception-covered crossing still obeys the single-writer
            # owner contract (§7.3); only the temporary owner passes
            verdict = _link_crossing_authorized(policy, claim, resolved)
            if verdict is not None:
                return verdict
            continue  # exact authorized crossing for the temporary owner
    return None


def _shared_path_owner_violation(
    policy: TrustedPolicy, claim: dict, path: str
) -> Optional[str]:
    """§7.3 single temporary integration owner.

    For a path covered by an active shared-file exception that lists this
    claim as participant: only the exact `integration_owner_claim_id` at
    its bound generation may mutate. Non-owner participants fail
    SHARED_PATH_OWNER_REQUIRED; an owner-generation binding mismatch
    fails SHARED_OWNER_GENERATION_MISMATCH. Returns None when the path is
    not exception-covered for this claim (ordinary scope rules apply).
    """
    target = case_key(path)
    claim_id = claim["claim_id"]
    for exc in policy.shared_exceptions:
        shared_keys = {case_key(p) for p in exc["shared_paths"]}
        if target not in shared_keys:
            continue
        participants = exc["participating_claims"]
        if not any(p["claim_id"] == claim_id for p in participants):
            continue  # this claim is not part of this exception
        if exc["integration_owner_claim_id"] != claim_id:
            return R.SHARED_PATH_OWNER_REQUIRED
        owner_binding = next(
            (p for p in participants if p["claim_id"] == claim_id), None
        )
        if owner_binding is None or owner_binding["claim_generation"] != claim["claim_generation"]:
            return R.SHARED_OWNER_GENERATION_MISMATCH
        return None  # this claim IS the temporary owner at the bound generation
    return None


# ═══════════════════════════════════════════════════════════════════════
# §3.2 candidate Work Order precedence
# ═══════════════════════════════════════════════════════════════════════
@dataclass(frozen=True)
class CandidateScopeResult:
    allowed: bool
    reason: Optional[str]
    effective_scope: tuple


def evaluate_candidate_work_order(
    policy: TrustedPolicy, claim_id: str, candidate_scope: Iterable[str]
) -> CandidateScopeResult:
    """A worker-editable Work Order may document or narrow — never widen.

    The effective mutable scope is always the trusted claim record; a
    broader candidate declaration is a policy contradiction, not a grant.
    """
    claim = policy.claim_by_id(claim_id)
    if claim is None:
        return CandidateScopeResult(False, R.WRONG_CLAIM, ())
    trusted = policy.mutable_exprs(claim)
    effective = tuple(claim["mutable_scope"])
    for expr in candidate_scope:
        candidate = parse_scope_expr(expr)
        if candidate.kind == "exact":
            covered = any(t.contains(candidate.path) for t in trusted)
        else:
            # a candidate subtree is covered only by an equal-or-outer
            # trusted subtree — mere overlap would widen the lane
            covered = any(
                t.kind == "subtree" and (candidate.key == t.key or candidate.key.startswith(t.key + "/"))
                for t in trusted
            )
        if not covered:
            return CandidateScopeResult(False, R.POLICY_CONTRADICTION, effective)
    return CandidateScopeResult(True, None, effective)


# ═══════════════════════════════════════════════════════════════════════
# §4.3 serialized control transitions
# ═══════════════════════════════════════════════════════════════════════
@dataclass(frozen=True)
class TransitionValidation:
    valid: bool
    reason: Optional[str]


def evaluate_control_transition(policy: TrustedPolicy, proposal: dict) -> TransitionValidation:
    """Optimistic-concurrency validation of a control-transition proposal.

    The proposal must carry the expected policy revision/registry hash it
    was drafted against; a proposal from a stale revision fails closed
    instead of winning a second integration from the same revision.
    """
    if proposal.get("expected_policy_revision") != policy.policy_revision:
        return TransitionValidation(False, R.STALE_POLICY_REVISION)
    if proposal.get("expected_registry_hash") != policy.registry_hash:
        return TransitionValidation(False, R.STALE_REGISTRY_HASH)

    proposed_scope = [
        parse_scope_expr(expr) for expr in proposal.get("proposed_mutable_scope", [])
    ]
    task_id = proposal.get("task_id", "")
    existing = policy.claim_by_task(task_id)
    proposed_claim_id = proposal.get("proposed_claim_id")

    # a proposal may legalize scope overlap ONLY through §7.3 records that
    # bind its claim id + generation and an existing claim's exact path
    authorized_pairs: dict = {}
    if proposal.get("authorized_shared_exceptions") is not None:
        if not proposed_claim_id:
            raise GuardFailure(
                R.INVALID_SHARED_EXCEPTION, "authorized_shared_exceptions requires proposed_claim_id"
            )
        virtual_claims = {c["claim_id"]: dict(c) for c in policy.claims}
        virtual_claims[proposed_claim_id] = {
            "claim_id": proposed_claim_id,
            "claim_generation": proposal.get("proposed_claim_generation", 1),
            "mutable_scope": list(proposal.get("proposed_mutable_scope", [])),
        }
        authorized_pairs = _validate_and_index_shared_exceptions(
            proposal.get("authorized_shared_exceptions", []), virtual_claims
        )

    for other in policy.claims:
        if existing is not None and other["claim_id"] == existing["claim_id"]:
            continue  # a reassignment may keep its own lane
        if other["status"] not in LOCK_HOLDING_CLAIM_STATUSES:
            continue  # released records (READY/CLOSED) hold no scope lock (§4.1/§4.5)
        for candidate in proposed_scope:
            for other_expr in policy.mutable_exprs(other):
                if not scopes_overlap(candidate, other_expr):
                    continue
                if candidate.kind == "subtree" and other_expr.kind == "subtree":
                    return TransitionValidation(False, R.OWNERSHIP_CONFLICT)
                exact = candidate if candidate.kind == "exact" else other_expr
                pair = (
                    frozenset((proposed_claim_id, other["claim_id"]))
                    if proposed_claim_id
                    else None
                )
                if pair is None or exact.key not in authorized_pairs.get(pair, set()):
                    return TransitionValidation(False, R.OWNERSHIP_CONFLICT)

    proposed_generation = proposal.get("proposed_claim_generation")
    # exact-int fencing for both generation fields (R10): a bool True
    # equals 1 numerically and must not satisfy the §4.3 serialization
    # fence by masquerading as the expected/current generation.
    expected_generation = proposal.get("expected_claim_generation")

    def _is_int(value: Any) -> bool:
        return isinstance(value, int) and not isinstance(value, bool)

    if existing is None:
        if expected_generation is not None or not _is_int(proposed_generation) or proposed_generation != 1:
            return TransitionValidation(False, R.INVALID_GENERATION_TRANSITION)
    else:
        if not _is_int(expected_generation) or expected_generation != existing["claim_generation"]:
            return TransitionValidation(False, R.STALE_CLAIM_GENERATION)
        if not _is_int(proposed_generation) or proposed_generation != existing["claim_generation"] + 1:
            return TransitionValidation(False, R.INVALID_GENERATION_TRANSITION)
    return TransitionValidation(True, None)


# ═══════════════════════════════════════════════════════════════════════
# §11.6 enforcement truth
# ═══════════════════════════════════════════════════════════════════════
@dataclass(frozen=True)
class ModeDecision:
    mode: str
    reason: Optional[str]


def effective_enforcement_mode(registry_mode: str, server_enforcement_verified: bool) -> ModeDecision:
    """ENFORCING/HARDENED are claims about the server, not about code.

    Without verified server enforcement they downgrade to
    ENFORCEMENT_NOT_ACTIVE — the guard never reports ENFORCING on its own
    existence (§11.6, §12).
    """
    if registry_mode not in ENFORCEMENT_MODES:
        raise GuardFailure(R.INVALID_ENFORCEMENT_MODE, f"{registry_mode!r}")
    # only exact boolean True counts as verified server enforcement
    # (R11): truthy masquerades ("false", "0", 1) must never report
    # ENFORCING/HARDENED (§11.6).
    if registry_mode in VERIFIED_MODES and server_enforcement_verified is not True:
        return ModeDecision(ENFORCEMENT_NOT_ACTIVE, R.SERVER_ENFORCEMENT_UNVERIFIED)
    return ModeDecision(registry_mode, None)


# ═══════════════════════════════════════════════════════════════════════
# §5 goal lifecycle
# ═══════════════════════════════════════════════════════════════════════
@dataclass(frozen=True)
class LifecycleEvent:
    task_id: str
    claim_id: str
    claim_generation: int
    goal_id: str
    event_type: str
    event_seq: int
    event_id: str
    previous_event_id: str
    terminal_result: Optional[str] = None
    operation_id: Optional[str] = None
    operation_outcome: Optional[str] = None
    payload: Optional[dict] = None
    published: bool = True


class LifecycleLog:
    """Ordered, idempotent lifecycle replay for one claim generation.

    Validation order per event: type validity → claim/generation binding →
    duplicate event id (idempotent or conflict) → publication gate →
    strictly increasing sequence → exact previous-event link →
    type-specific semantics. An unpublished event (published=False) is
    rejected before any state mutation, so a later published retry applies
    cleanly; a GOAL_END only terminates when durably published. After the
    first goal, every new GOAL_START must directly reference the previous
    durable terminal GOAL_END event; a CHECKPOINT never replaces an active
    goal. Operation outcome/reconciliation events require an ACTIVE goal
    (R8): they never advance the durable head past a terminal GOAL_END, so
    recovery from an UNKNOWN after a terminal PARTIAL/BLOCKED result opens
    a legal recovery GoalStart first and reconciles under that goal.
    Every active-goal-scoped event (CHECKPOINT/INTENT/OUTCOME/RECONCILED)
    must carry the CURRENT active goal's identity (R9): a mismatched
    goal_id fails closed before any mutation — the recovery event names
    the active recovery goal, not the original intent's goal.

    §5.5 external-operation reconciliation: an UNKNOWN execution outcome
    blocks retries until external state is reconciled. Reconciliation is a
    distinct durable OPERATION_RECONCILED event carrying an explicit
    terminal observation — the original UNKNOWN execution outcome is never
    rewritten (audit history is retained); only the reconciliation record
    clears the unresolved state.
    """

    def __init__(self, claim_id: str, claim_generation: int):
        # the log's generation is an exact positive non-bool integer
        # (R11): no silent coercion, no bool masquerade of generation 1
        if (
            isinstance(claim_generation, bool)
            or not isinstance(claim_generation, int)
            or claim_generation < 1
        ):
            raise GuardFailure(
                R.STALE_CLAIM_GENERATION, f"log claim_generation {claim_generation!r}"
            )
        self.claim_id = claim_id
        self.claim_generation = claim_generation
        self.events: list[LifecycleEvent] = []
        self._by_id: dict[str, LifecycleEvent] = {}
        self._active_goal: Optional[str] = None
        self._terminated_goals: set[str] = set()
        self._last_goal_end_id: Optional[str] = None
        self._operations: dict[str, dict] = {}
        self.head_event_id: Optional[str] = None
        self._bound_task_id: Optional[str] = None

    # ── state ──
    @property
    def active_goal_id(self) -> Optional[str]:
        return self._active_goal

    @property
    def has_unresolved_external_operations(self) -> bool:
        """True while any OPERATION_INTENT lacks an outcome, or its UNKNOWN
        execution outcome has no durable reconciliation record yet."""
        return any(
            op["outcome"] is None
            or (op["outcome"] == "UNKNOWN" and op.get("reconciled_outcome") is None)
            for op in self._operations.values()
        )

    def operation_record(self, operation_id: str) -> dict:
        """Audit view of one external operation: the original execution
        outcome (UNKNOWN stays UNKNOWN after reconciliation) plus the
        reconciliation record that cleared it, if any."""
        record = self._operations.get(operation_id)
        if record is None:
            raise GuardFailure(R.UNKNOWN_OPERATION, str(operation_id))
        return {
            "operation_id": operation_id,
            "outcome": record["outcome"],
            "reconciled_outcome": record.get("reconciled_outcome"),
            "reconciled_event_id": record.get("reconciled_event_id"),
        }

    # ── replay ──
    def apply(self, event: LifecycleEvent) -> tuple[str, LifecycleEvent]:
        if event.event_type not in LIFECYCLE_EVENT_TYPES:
            raise GuardFailure(R.INVALID_EVENT_TYPE, event.event_type)
        # schema-int fencing before any comparison/mutation (R10): Python
        # bool is an int subclass and True == 1, so equality alone would
        # let True masquerade as generation 1; a str/float seq would crash
        # the monotonic comparison instead of failing closed.
        if isinstance(event.claim_generation, bool) or not isinstance(event.claim_generation, int):
            raise GuardFailure(R.STALE_CLAIM_GENERATION, f"claim_generation {event.claim_generation!r}")
        if isinstance(event.event_seq, bool) or not isinstance(event.event_seq, int):
            raise GuardFailure(R.OUT_OF_ORDER_EVENT, f"event_seq {event.event_seq!r}")
        # identity schema (R11): every lifecycle event carries exact
        # non-empty string identity; a malformed identity can never be
        # legally sequenced and must not create invisible state (e.g. a
        # GOAL_START with goal_id=None would set an invisible active goal)
        for field_name in ("event_id", "previous_event_id", "goal_id"):
            value = getattr(event, field_name)
            if not isinstance(value, str) or not value:
                raise GuardFailure(
                    R.OUT_OF_ORDER_EVENT,
                    f"{field_name} must be a non-empty string: {value!r}",
                )
        if not isinstance(event.task_id, str) or not event.task_id:
            raise GuardFailure(
                R.WRONG_CLAIM, f"task_id must be a non-empty string: {event.task_id!r}"
            )
        # one log = one task (claim_id <-> task is 1:1 in the registry);
        # the first applied event binds the log's task identity and every
        # subsequent event must carry the same one
        bound_task = self._bound_task_id if self._bound_task_id is not None else event.task_id
        if event.task_id != bound_task:
            raise GuardFailure(R.WRONG_CLAIM, f"task_id {event.task_id!r} != bound {bound_task!r}")
        if event.claim_id != self.claim_id:
            raise GuardFailure(R.WRONG_CLAIM, f"{event.claim_id} != {self.claim_id}")
        if event.claim_generation != self.claim_generation:
            raise GuardFailure(
                R.STALE_CLAIM_GENERATION,
                f"event generation {event.claim_generation} != log generation {self.claim_generation}",
            )

        existing = self._by_id.get(event.event_id)
        if existing is not None:
            if existing == event:
                return "idempotent_noop", existing
            raise GuardFailure(R.EVENT_CONFLICT, f"{event.event_id} replayed with different payload")

        # §5.2 durable publication: an unpublished event must never mutate
        # authoritative state or advance the durable head. `published` is
        # an exact boolean (R11): only True permits application; False is
        # unpublished and any non-bool masquerade fails closed before any
        # mutation, so a later published retry of the same semantic event
        # applies cleanly. GOAL_END keeps its specialized pinned reason.
        if not isinstance(event.published, bool) or not event.published:
            raise GuardFailure(
                R.GOAL_END_NOT_PUBLISHED
                if event.event_type == "GOAL_END"
                else R.EVENT_NOT_PUBLISHED,
                f"{event.event_type} requires durable publication (exact"
                f" boolean true); got {event.published!r}",
            )

        if self.events and event.event_seq <= self.events[-1].event_seq:
            raise GuardFailure(
                R.OUT_OF_ORDER_EVENT,
                f"seq {event.event_seq} not greater than {self.events[-1].event_seq}",
            )

        if not self.events:
            if event.previous_event_id != GENESIS:
                raise GuardFailure(R.OUT_OF_ORDER_EVENT, f"first event must reference {GENESIS}")
        elif event.previous_event_id != self.head_event_id:
            raise GuardFailure(
                R.OUT_OF_ORDER_EVENT,
                f"previous {event.previous_event_id!r} is not the durable head {self.head_event_id!r}",
            )

        if event.event_type == "GOAL_START":
            if self._active_goal is not None:
                raise GuardFailure(R.UNTERMINATED_PREDECESSOR, f"goal {self._active_goal} has no GOAL_END")
            if self._terminated_goals:
                # §5.1 strict predecessor: after the first goal, every new
                # GOAL_START must directly reference the previous durable
                # terminal GOAL_END event itself — not any later head event
                # that merely followed an inactive goal.
                if event.previous_event_id != self._last_goal_end_id:
                    raise GuardFailure(
                        R.OUT_OF_ORDER_EVENT,
                        f"GOAL_START must reference the previous terminal"
                        f" GOAL_END event {self._last_goal_end_id!r},"
                        f" not {event.previous_event_id!r}",
                    )
            self._active_goal = event.goal_id
        elif event.event_type == "GOAL_END":
            if event.terminal_result not in TERMINAL_GOAL_RESULTS:
                raise GuardFailure(R.INVALID_GOAL_RESULT, f"{event.terminal_result!r}")
            if self._active_goal != event.goal_id:
                raise GuardFailure(R.OUT_OF_ORDER_EVENT, f"no active goal {event.goal_id}")
            self._active_goal = None
            self._terminated_goals.add(event.goal_id)
            self._last_goal_end_id = event.event_id
        elif event.event_type == "CHECKPOINT":
            if self._active_goal is None:
                raise GuardFailure(R.OUT_OF_ORDER_EVENT, "checkpoint without an active goal")
            if event.goal_id != self._active_goal:
                raise GuardFailure(
                    R.OUT_OF_ORDER_EVENT,
                    f"checkpoint identifies goal {event.goal_id!r} but the"
                    f" active goal is {self._active_goal!r}",
                )
        elif event.event_type == "OPERATION_INTENT":
            if self._active_goal is None:
                raise GuardFailure(R.OUT_OF_ORDER_EVENT, "operation intent without an active goal")
            if event.goal_id != self._active_goal:
                raise GuardFailure(
                    R.OUT_OF_ORDER_EVENT,
                    f"operation intent identifies goal {event.goal_id!r} but"
                    f" the active goal is {self._active_goal!r}",
                )
            if event.operation_id in self._operations:
                raise GuardFailure(R.EVENT_CONFLICT, f"duplicate operation {event.operation_id}")
            self._operations[event.operation_id] = {"intent": event, "outcome": None}
        elif event.event_type == "OPERATION_OUTCOME":
            # R8: operation events never advance the durable head outside
            # an active goal — a post-terminal outcome would strand the
            # generation (the terminal GOAL_END must stay the head so a
            # future goal can legally reference it).
            if self._active_goal is None:
                raise GuardFailure(
                    R.OUT_OF_ORDER_EVENT, "operation outcome without an active goal"
                )
            if event.goal_id != self._active_goal:
                raise GuardFailure(
                    R.OUT_OF_ORDER_EVENT,
                    f"operation outcome identifies goal {event.goal_id!r}"
                    f" but the active goal is {self._active_goal!r}",
                )
            operation = self._operations.get(event.operation_id)
            if operation is None:
                raise GuardFailure(R.UNKNOWN_OPERATION, str(event.operation_id))
            if event.operation_outcome not in OPERATION_OUTCOMES:
                raise GuardFailure(R.INVALID_OPERATION_OUTCOME, str(event.operation_outcome))
            if operation["outcome"] is not None:
                raise GuardFailure(R.EVENT_CONFLICT, f"operation {event.operation_id} already terminal")
            operation["outcome"] = event.operation_outcome
        elif event.event_type == "OPERATION_RECONCILED":
            # §5.5 durable reconciliation: the explicit terminal external
            # observation clears the unresolved UNKNOWN without rewriting
            # the original execution outcome (audit retained above).
            # R8: reconciliation is journaled under an ACTIVE goal — after
            # a terminal PARTIAL/BLOCKED result, recovery first opens a
            # legal recovery GoalStart from the terminal GOAL_END, then
            # reconciles the UNKNOWN under that recovery goal.
            if self._active_goal is None:
                raise GuardFailure(
                    R.OUT_OF_ORDER_EVENT,
                    "reconciliation requires an active (recovery) goal",
                )
            if event.goal_id != self._active_goal:
                raise GuardFailure(
                    R.OUT_OF_ORDER_EVENT,
                    f"reconciliation identifies goal {event.goal_id!r} but"
                    f" the active (recovery) goal is {self._active_goal!r}",
                )
            operation = self._operations.get(event.operation_id)
            if operation is None:
                raise GuardFailure(R.UNKNOWN_OPERATION, str(event.operation_id))
            if event.operation_outcome not in ("SUCCEEDED", "FAILED"):
                raise GuardFailure(
                    R.INVALID_OPERATION_OUTCOME,
                    f"reconciled observation must be terminal: {event.operation_outcome!r}",
                )
            if operation["outcome"] != "UNKNOWN":
                raise GuardFailure(
                    R.EFFECT_CONFLICT,
                    f"operation {event.operation_id} outcome is"
                    f" {operation['outcome']!r}, only UNKNOWN can be reconciled",
                )
            if operation.get("reconciled_outcome") is not None:
                raise GuardFailure(
                    R.EFFECT_CONFLICT,
                    f"operation {event.operation_id} is already reconciled"
                    f" ({operation['reconciled_outcome']!r})",
                )
            operation["reconciled_outcome"] = event.operation_outcome
            operation["reconciled_event_id"] = event.event_id

        self.events.append(event)
        self._by_id[event.event_id] = event
        self.head_event_id = event.event_id
        if self._bound_task_id is None:
            self._bound_task_id = event.task_id
        return "applied", event


# ═══════════════════════════════════════════════════════════════════════
# §4.2A admission gate
# ═══════════════════════════════════════════════════════════════════════
class AdmissionGate:
    """Atomic per-context admission gate + active-admission set.

    admit()/close()/record_effect()/reconcile_effect() and every read
    (active_admissions, high-water, unresolved/undrained views) share one
    lock, so admission creation and gate closure have a deterministic
    serialization boundary: an admission either linearizes before close
    and is visible in the active set, or close linearizes first and the
    admission fails ADMISSION_GATE_CLOSED — there is no third ordering.

    This atomicity is PROCESS-LOCAL. Cross-process / cross-session
    serialization is a later adapter responsibility (ENV-COORD-005+);
    this core slice must never be presented as multi-process enforcement.

    Closing is one-way per generation: after begin_quiesce the gate stays
    closed until a transfer creates a new runtime.

    Undrained invariants (§4.2B):
    - unresolved effect  = any admission still EFFECT_UNKNOWN;
    - undrained child    = any admission record with child_alive=True,
      regardless of logical effect state. Transfer requires BOTH to be
      empty.
    """

    def __init__(self):
        self.state = "OPEN"
        self._lock = threading.RLock()
        self._admissions: dict[str, dict] = {}
        self._high_water = 0

    def admit(self, operation_id: str) -> dict:
        with self._lock:
            if self.state != "OPEN":
                raise GuardFailure(R.ADMISSION_GATE_CLOSED, str(operation_id))
            if operation_id in self._admissions:
                raise GuardFailure(R.DUPLICATE_OPERATION, str(operation_id))
            self._high_water += 1
            record = {
                "operation_id": operation_id,
                "state": ADMISSION_IN_FLIGHT,
                "child_alive": False,
            }
            self._admissions[operation_id] = record
            return dict(record)

    def close(self) -> None:
        with self._lock:
            self.state = "CLOSED"

    def record_effect(self, operation_id: str, outcome: str, child_alive: bool = False) -> None:
        """Record a terminal logical effect.

        `child_alive=True` keeps the admission undrained even in terminal
        states — a live child blocks transfer until explicitly reconciled
        dead.
        """
        with self._lock:
            record = self._require(operation_id)
            if outcome not in _TERMINAL_ADMISSIONS:
                raise GuardFailure(R.INVALID_OPERATION_OUTCOME, str(outcome))
            if record["state"] in _TERMINAL_ADMISSIONS:
                if record["state"] == outcome and record["child_alive"] == child_alive:
                    return  # identical terminal re-record is idempotent
                raise GuardFailure(R.EFFECT_CONFLICT, f"{operation_id}: {record['state']} → {outcome}")
            record["state"] = outcome
            record["child_alive"] = child_alive

    def reconcile_effect(
        self, operation_id: str, outcome: str, child_alive: Optional[bool] = None
    ) -> None:
        """Resolve an earlier UNKNOWN effect after external reconciliation.

        `child_alive=None` (default) preserves the recorded child state —
        reconciling the logical effect never silently clears a live child.
        Pass `child_alive=False` only when the child is demonstrably dead.
        """
        with self._lock:
            record = self._require(operation_id)
            if record["state"] != ADMISSION_UNKNOWN:
                raise GuardFailure(R.EFFECT_CONFLICT, f"{operation_id} is {record['state']}, not UNKNOWN")
            if outcome not in (ADMISSION_COMPLETE, ADMISSION_FAILED):
                raise GuardFailure(R.INVALID_OPERATION_OUTCOME, f"reconcile to {outcome}")
            record["state"] = outcome
            if child_alive is not None:
                record["child_alive"] = child_alive

    def reconcile_child_dead(self, operation_id: str) -> None:
        """Reconcile observed child/process termination (drain step)."""
        with self._lock:
            record = self._require(operation_id)
            record["child_alive"] = False

    def _require(self, operation_id: str) -> dict:
        record = self._admissions.get(operation_id)
        if record is None:
            raise GuardFailure(R.UNKNOWN_OPERATION, str(operation_id))
        return record

    @property
    def active_admissions(self) -> int:
        with self._lock:
            return sum(1 for r in self._admissions.values() if r["state"] == ADMISSION_IN_FLIGHT)

    @property
    def has_unresolved_effects(self) -> bool:
        """Every unreconciled EFFECT_UNKNOWN is unresolved — independently
        of whether a child process is still alive (§4.2B)."""
        with self._lock:
            return any(r["state"] == ADMISSION_UNKNOWN for r in self._admissions.values())

    @property
    def has_live_children(self) -> bool:
        """ANY admission record with child_alive=True is undrained,
        regardless of logical effect state (§4.2B transfer barrier)."""
        with self._lock:
            return any(r["child_alive"] for r in self._admissions.values())

    @property
    def unresolved_child_operations(self) -> tuple:
        with self._lock:
            return tuple(
                r["operation_id"] for r in self._admissions.values() if r["child_alive"]
            )

    @property
    def admissions_high_water(self) -> int:
        with self._lock:
            return self._high_water


class HolderRuntime:
    """The one live execution context for a claim generation (§4.2A).

    The current holder owns its admission gate and — during transfer — the
    publication of quiescence evidence. This type is the seam a real
    adapter (ZCode plugin, CI) binds to one process/session.
    """

    def __init__(self, holder_id: str):
        self.holder_id = holder_id
        self.gate = AdmissionGate()

    # mutation admissions go through the holder's own gate
    def admit(self, operation_id: str) -> dict:
        return self.gate.admit(operation_id)

    def record_effect(self, operation_id: str, outcome: str, child_alive: bool = False) -> None:
        self.gate.record_effect(operation_id, outcome, child_alive)

    def reconcile_effect(
        self, operation_id: str, outcome: str, child_alive: Optional[bool] = None
    ) -> None:
        self.gate.reconcile_effect(operation_id, outcome, child_alive)

    def reconcile_child_dead(self, operation_id: str) -> None:
        self.gate.reconcile_child_dead(operation_id)

    @property
    def active_admissions(self) -> int:
        return self.gate.active_admissions

    @property
    def has_unresolved_effects(self) -> bool:
        return self.gate.has_unresolved_effects

    @property
    def has_live_children(self) -> bool:
        return self.gate.has_live_children

    @property
    def admissions_high_water(self) -> int:
        return self.gate.admissions_high_water


# ═══════════════════════════════════════════════════════════════════════
# §4.2B quiesce/drain transfer barrier
# ═══════════════════════════════════════════════════════════════════════
class TransferBarrier:
    """ACTIVE → QUIESCING → TRANSFER_READY → ACTIVE(g+1, new holder).

    Astra refinement encoded: only the current execution holder can publish
    the QUIESCENCE_ATTESTATION, only while its gate is closed, only with
    active_admissions == 0 and no unresolved effects/operations. The
    coordinator validates attestations and interrupts; it can never
    manufacture them.

    Every state/generation/holder/attestation transition (begin_quiesce,
    holder_publish, complete_transfer, activation) and the status read are
    serialized behind one barrier-level lock: a single g attestation can
    yield at most ONE proposed g+1 handoff — a concurrent second transfer
    fails TRANSFER_NOT_READY against the established transition instead of
    advancing again. This atomicity is PROCESS-LOCAL; cross-process
    serialization stays an adapter/server responsibility.
    """

    def __init__(self, claim_id: str, claim_generation: int, holder_id: str):
        self.claim_id = claim_id
        self.claim_generation = claim_generation
        self.execution_holder_id = holder_id
        self.runtime = HolderRuntime(holder_id)
        self.state = "ACTIVE"
        self.transfer_block_reason: Optional[str] = None
        self._attestations: dict[str, dict] = {}
        self._lock = threading.RLock()

    # ── holder side ──
    def begin_quiesce(self) -> None:
        with self._lock:
            if self.state == "QUIESCING":
                return  # idempotent
            if self.state != "ACTIVE":
                raise GuardFailure(R.TRANSFER_NOT_READY, f"cannot quiesce from {self.state}")
            self.runtime.gate.close()
            self.state = "QUIESCING"
            self.transfer_block_reason = None

    def _publication_block_reason(
        self, replay: bool, unresolved_external_operations: bool
    ) -> Optional[str]:
        """Current safety facts gating BOTH fresh publication and replay.

        A fresh publish requires QUIESCING; a replay of an attestation the
        holder already published may also re-establish readiness from
        QUIESCING after an invalidated replay (see holder_publish).
        """
        allowed_states = ("QUIESCING", "TRANSFER_READY") if replay else ("QUIESCING",)
        if self.runtime.gate.state != "CLOSED" or self.state not in allowed_states:
            return R.QUIESCENCE_PRECONDITIONS_UNMET
        if self.runtime.active_admissions > 0:
            return R.TRANSFER_BLOCKED_ACTIVE_ADMISSIONS
        if self.runtime.has_unresolved_effects or unresolved_external_operations:
            return R.TRANSFER_BLOCKED_UNRESOLVED_EFFECTS
        if self.runtime.has_live_children:
            return R.TRANSFER_BLOCKED_LIVE_CHILDREN
        return None

    def holder_publish(
        self,
        publisher_id: str,
        attestation_id: str,
        latest_event_id: str,
        unresolved_external_operations: bool = False,
    ) -> Optional[dict]:
        """Publish (or idempotently replay) the quiescence attestation.

        Returns the attestation on success, None with transfer_block_reason
        set on fail-closed rejection; conflicting replays raise.

        A cached attestation is idempotent ONLY while current safety facts
        still support it (§4.2B): a replay reporting newly discovered
        external uncertainty invalidates readiness (TRANSFER_READY demotes
        to QUIESCING) and blocks transfer instead of returning cached
        success. A later replay with the facts supporting it again
        re-establishes TRANSFER_READY.

        R8: for the CURRENT holder, contrary current safety evidence
        invalidates an established TRANSFER_READY BEFORE any
        identity/replay/conflict handling — a fresh attestation id or a
        conflicting payload must not leave an unsafe READY state standing.
        Non-holder publishers still change nothing (identity rules first).
        """
        with self._lock:
            if publisher_id != self.execution_holder_id:
                self.transfer_block_reason = R.COORDINATOR_CANNOT_PUBLISH_QUIESCENCE
                return None

            # contrary safety evidence from the current holder demotes an
            # established readiness immediately, whatever attestation
            # identity the report arrives with (fresh, replayed, or
            # conflicting) — the stale proof must not survive to transfer.
            if unresolved_external_operations and self.state == "TRANSFER_READY":
                self.state = "QUIESCING"
                self.transfer_block_reason = R.TRANSFER_BLOCKED_UNRESOLVED_EFFECTS

            replay = self._attestations.get(attestation_id)
            payload = {
                "attestation_id": attestation_id,
                "claim_id": self.claim_id,
                "claim_generation": self.claim_generation,
                "execution_holder_id": self.execution_holder_id,
                "latest_lifecycle_event_id": latest_event_id,
                "admission_high_water": self.runtime.admissions_high_water,
                "active_admissions": 0,
            }
            if replay is not None and replay != payload:
                raise GuardFailure(
                    R.EVENT_CONFLICT, f"attestation {attestation_id} replayed differently"
                )

            block = self._publication_block_reason(replay is not None, unresolved_external_operations)
            if block is not None:
                if replay is not None and self.state == "TRANSFER_READY":
                    self.state = "QUIESCING"  # invalidate cached readiness
                self.transfer_block_reason = block
                return None

            if replay is not None:
                if self.state == "QUIESCING":
                    self.state = "TRANSFER_READY"  # facts support it again
                self.transfer_block_reason = None
                return dict(replay)

            self._attestations[attestation_id] = payload
            self.state = "TRANSFER_READY"
            self.transfer_block_reason = None
            return dict(payload)

    # ── coordinator side ──
    def coordinator_interrupt(self) -> dict:
        """Interruption before transfer changes nothing: generation and
        holder stay locked until the authorized transition completes."""
        with self._lock:
            return {
                "claim_id": self.claim_id,
                "claim_generation": self.claim_generation,
                "execution_holder_id": self.execution_holder_id,
                "state": self.state,
                "transfer_block_reason": self.transfer_block_reason,
            }

    def complete_transfer(
        self, new_holder_id: str, authorized_policy=None, actual_context: Optional[dict] = None
    ) -> Decision:
        """Execute the worker-side handoff; NEVER self-authorize g+1.

        §4.2B ordering is TRANSFER_READY(g) → authorized claim transition →
        ACTIVE(g+1). This method only proves the handoff: it records the
        proposed new generation/holder and returns a NON-authorizing
        result (TRANSFER_AWAITING_AUTHORIZED_TRANSITION) with the new
        holder's gate closed. Mutation authority for g+1 exists only after
        `activate_transferred_claim` runs the COMPLETE §4.4 preflight —
        trusted policy identity alone never authorizes; an
        `authorized_policy` without `actual_context` fails closed with
        MISSING_ACTUAL_CONTEXT.
        """
        with self._lock:
            if self.state == "QUIESCING" and not self._attestations:
                raise GuardFailure(R.QUIESCENCE_PRECONDITIONS_UNMET, "quiescing without an attestation")
            if self.state != "TRANSFER_READY":
                raise GuardFailure(R.TRANSFER_NOT_READY, f"state is {self.state}")
            attestation = next(
                (a for a in self._attestations.values() if a["claim_generation"] == self.claim_generation),
                None,
            )
            if attestation is None or attestation["execution_holder_id"] != self.execution_holder_id:
                raise GuardFailure(
                    R.QUIESCENCE_PRECONDITIONS_UNMET, "no valid attestation for this generation"
                )

            self.claim_generation += 1
            self.execution_holder_id = new_holder_id
            # construct the g+1 runtime privately and close its gate
            # BEFORE publishing it: the new runtime must never be
            # externally observable OPEN — g+1 cannot admit any operation
            # before the authorized transition + complete preflight (R8).
            new_runtime = HolderRuntime(new_holder_id)
            new_runtime.gate.close()
            self.runtime = new_runtime
            self.state = "AWAITING_AUTHORIZATION"
            self.transfer_block_reason = None

            if authorized_policy is not None:
                if actual_context is None:
                    raise GuardFailure(
                        R.MISSING_ACTUAL_CONTEXT,
                        "activation requires the actual execution context (§4.4)",
                    )
                return self.activate_transferred_claim(authorized_policy, actual_context)
            return Decision(
                safe_to_mutate=False,
                reason=R.TRANSFER_AWAITING_AUTHORIZED_TRANSITION,
                policy_revision="",
                registry_hash="",
                claim_id=self.claim_id,
                claim_generation=self.claim_generation,
                execution_holder_id=self.execution_holder_id,
                details=("transfer_executed", attestation["attestation_id"]),
            )

    def activate_transferred_claim(self, policy: "TrustedPolicy", actual_context: dict) -> Decision:
        """Activate g+1 only via the COMPLETE §4.4 preflight.

        The supplied policy must come from latest fetched origin/main.
        The full ordinary preflight runs over (task, claim, generation,
        holder, worktree, branch, base ancestry, trusted policy binding):
        on any mismatch the barrier stays AWAITING_AUTHORIZATION with the
        gate CLOSED and the deterministic preflight reason is raised — no
        partial activation, no authority from policy identity alone.

        Even a SUCCEEDING preflight only authorizes its own tuple: the
        decision's claim id / generation / holder must exactly equal the
        pending barrier tuple before any state change or gate open (a
        valid g1/A decision must never activate a pending g2/B runtime).
        """
        with self._lock:
            if self.state != "AWAITING_AUTHORIZATION":
                raise GuardFailure(R.TRANSFER_NOT_READY, f"state is {self.state}")
            decision = preflight(policy, actual_context)
            if not decision.safe_to_mutate:
                raise GuardFailure(
                    decision.reason or R.QUIESCENCE_PRECONDITIONS_UNMET,
                    "transferred-activation preflight failed",
                )
            if (
                decision.claim_id != self.claim_id
                or decision.claim_generation != self.claim_generation
                or decision.execution_holder_id != self.execution_holder_id
            ):
                raise GuardFailure(
                    R.TRANSFER_TUPLE_MISMATCH,
                    f"activation decision {decision.claim_id}/g{decision.claim_generation}"
                    f"/{decision.execution_holder_id} != pending barrier"
                    f" {self.claim_id}/g{self.claim_generation}/{self.execution_holder_id}",
                )
            self.state = "ACTIVE"
            self.runtime = HolderRuntime(self.execution_holder_id)  # gate opens
            return decision


# ═══════════════════════════════════════════════════════════════════════
# CLI — status / scope-check / validate-registry / validate-lifecycle
# ═══════════════════════════════════════════════════════════════════════
def run_git(args: list[str], cwd: Optional[str] = None) -> str:
    """The only place this module touches the outside world."""
    try:
        proc = subprocess.run(
            ["git", *args],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            cwd=cwd,
            check=True,
        )
        return proc.stdout.strip()
    except (OSError, subprocess.CalledProcessError) as exc:
        raise GuardFailure(R.GIT_UNAVAILABLE, str(exc))


def _emit(payload: dict, exit_code: int) -> int:
    print(json.dumps(payload, sort_keys=True, ensure_ascii=False))
    return exit_code


def _read_current_work(args) -> tuple[str, str]:
    if args.no_git or args.current_work_file:
        if not args.current_work_file or not args.policy_revision:
            raise GuardFailure(R.IO_ERROR, "--no-git/--current-work-file requires --policy-revision")
        with open(args.current_work_file, encoding="utf-8") as handle:
            return handle.read(), args.policy_revision
    # freeze the revision ONCE, then read the document from that exact
    # object (§3.1 exact policy binding): a second mutable-ref read could
    # tear the pair if origin/main advances between the two Git calls.
    revision = run_git(["rev-parse", "origin/main"])
    text = run_git(["show", f"{revision}:{CURRENT_WORK_PATH}"])
    return text, revision


def _cmd_status(args) -> int:
    text, revision = _read_current_work(args)
    policy = load_trusted_policy(text, revision)
    mode = effective_enforcement_mode(policy.enforcement_mode, server_enforcement_verified=False)
    return _emit(
        {
            "ok": True,
            "policy_revision": policy.policy_revision,
            "registry_hash": policy.registry_hash,
            "enforcement_mode": policy.enforcement_mode,
            "effective_enforcement_mode": mode.mode,
            "effective_mode_reason": mode.reason,
            "expected_policy_revision": policy.expected_policy_revision,
            "claims": [
                {
                    "task_id": c["task_id"],
                    "claim_id": c["claim_id"],
                    "claim_generation": c["claim_generation"],
                    "status": c["status"],
                    "execution_holder_id": c["execution_holder_id"],
                    "branch": c["branch"],
                    "worktree": c["worktree"],
                }
                for c in policy.claims
            ],
            "shared_exceptions": len(policy.shared_exceptions),
        },
        0,
    )


def _cmd_validate_registry(args) -> int:
    if args.file == "-":
        text = sys.stdin.read()
    else:
        with open(args.file, encoding="utf-8") as handle:
            text = handle.read()
    policy = load_trusted_policy(text, args.policy_revision or "unbound")
    return _emit(
        {
            "ok": True,
            "claims": len(policy.claims),
            "enforcement_mode": policy.enforcement_mode,
            "registry_hash": policy.registry_hash,
        },
        0,
    )


def _parse_changes(raw_changes) -> list[Change]:
    changes = []
    for parts in raw_changes or []:
        if len(parts) == 2:
            changes.append(Change(parts[0], parts[1]))
        elif len(parts) == 3:
            changes.append(Change(parts[0], parts[1], parts[2]))
        else:
            raise GuardFailure(R.UNKNOWN_CHANGE_KIND, " ".join(parts))
    return changes


def _cmd_scope_check(args) -> int:
    text, revision = _read_current_work(args)
    policy = load_trusted_policy(text, revision)
    claim = policy.claim_by_task(args.task)
    ctx = {
        "task_id": args.task,
        "claim_id": args.claim,
        "claim_generation": args.generation,
        "execution_holder_id": args.holder,
        "worktree": args.actual_worktree or (claim["worktree"] if claim else ""),
        "branch": args.actual_branch or (claim["branch"] if claim else ""),
        "base_ancestor_of_head": not args.base_not_ancestor,
    }
    decision = evaluate_mutation(policy, ctx, _parse_changes(args.change))
    return _emit(decision.to_dict(), 0 if decision.safe_to_mutate else 2)


def _cmd_validate_lifecycle(args) -> int:
    with open(args.file, encoding="utf-8") as handle:
        document = json.load(handle)
    # no silent coercion (R11): the core validates the exact value
    log = LifecycleLog(document["claim_id"], document["claim_generation"])
    applied = 0
    idempotent = 0
    try:
        for raw in document["events"]:
            event = LifecycleEvent(**raw)
            status, _ = log.apply(event)
            if status == "applied":
                applied += 1
            else:
                idempotent += 1
    except GuardFailure as failure:
        return _emit(
            {"ok": False, "reason": failure.reason, "detail": failure.detail, "event_id": raw.get("event_id")},
            2,
        )
    return _emit({"ok": True, "applied": applied, "idempotent": idempotent}, 0)


def main(argv: Optional[list[str]] = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(
        prog="env_coordination_guard",
        description="Deterministic ENV Coordination Guard core (BOOTSTRAP_CONTROL slice)",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--no-git", action="store_true", help="pure mode: do not shell out to git")
    common.add_argument("--current-work-file", help="path to a CURRENT-WORK.md text (default: git show origin/main)")
    common.add_argument("--policy-revision", help="exact origin/main SHA the text came from")

    p_status = sub.add_parser("status", parents=[common], help="trusted registry + claim summary")
    p_status.set_defaults(func=_cmd_status)

    p_validate = sub.add_parser("validate-registry", parents=[common], help="parse + validate registry JSON")
    p_validate.add_argument("--file", required=True, help="file path, or - for stdin")
    p_validate.set_defaults(func=_cmd_validate_registry)

    p_scope = sub.add_parser("scope-check", parents=[common], help="preflight + scope decision for changed paths")
    p_scope.add_argument("--task", required=True)
    p_scope.add_argument("--claim", required=True)
    p_scope.add_argument("--generation", type=int, required=True)
    p_scope.add_argument("--holder", required=True)
    p_scope.add_argument("--actual-worktree", help="override trusted worktree comparison")
    p_scope.add_argument("--actual-branch", help="override trusted branch comparison")
    p_scope.add_argument("--base-not-ancestor", action="store_true", help="declare base_sha is NOT an ancestor of HEAD")
    p_scope.add_argument(
        "--change",
        action="append",
        nargs="+",
        required=True,
        help="change as: KIND SRC [DST] with KIND in add|untracked|modify|delete|rename|move|copy",
    )
    p_scope.set_defaults(func=_cmd_scope_check)

    p_lifecycle = sub.add_parser("validate-lifecycle", help="replay a lifecycle event log")
    p_lifecycle.add_argument("--file", required=True)
    p_lifecycle.set_defaults(func=_cmd_validate_lifecycle)

    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except GuardFailure as failure:
        return _emit({"ok": False, "reason": failure.reason, "detail": failure.detail}, 2)
    except (TypeError, ValueError, KeyError) as exc:
        # malformed file inputs (bad JSON, missing/ill-typed document
        # fields, unexpected event shapes) fail closed with a reason
        # payload and exit 2 — never an uncaught traceback (R10).
        return _emit({"ok": False, "reason": R.IO_ERROR, "detail": str(exc)}, 2)
    except OSError as exc:
        return _emit({"ok": False, "reason": R.IO_ERROR, "detail": str(exc)}, 2)


if __name__ == "__main__":
    raise SystemExit(main())
