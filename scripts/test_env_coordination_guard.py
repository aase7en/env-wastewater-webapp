#!/usr/bin/env python3
"""ENV-COORD-002 — deterministic regression suite for the Coordination Guard core.

Written RED-first against docs/work-orders/ENV-COORD-002.md and
docs/ai/architecture/ENV-COORDINATION-GUARD.md (§3–§5, §7, §11.6, §13).
Every test class docstring names the Work Order bullet / architecture clause
it pins. The guard core is pure and stdlib-only; Git interrogation stays
behind injectable seams, so no test shells out except the explicit CLI tests
(which run the script in pure `--no-git` mode).

Run standalone (as CI does for script suites):

    python scripts/test_env_coordination_guard.py

or via pytest. Both must stay equivalent.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from env_coordination_guard import (  # noqa: E402
    ADMISSION_COMPLETE,
    ADMISSION_FAILED,
    ADMISSION_UNKNOWN,
    AdmissionGate,
    Change,
    Decision,
    GuardFailure,
    HolderRuntime,
    LifecycleEvent,
    LifecycleLog,
    LinkRequest,
    R,
    TransferBarrier,
    canonicalize_path,
    case_key,
    effective_enforcement_mode,
    evaluate_candidate_work_order,
    evaluate_control_transition,
    evaluate_mutation,
    extract_registry_block,
    load_trusted_policy,
    parse_scope_expr,
    preflight,
    registry_hash,
    scope_contains,
    scopes_overlap,
    validate_registry,
)

HERE = os.path.dirname(os.path.abspath(__file__))
GUARD = os.path.join(HERE, "env_coordination_guard.py")

POLICY_REV = "7d4e6b52c616ff15f86e399a085ef16477d38ef8"
BASE_SHA = "6360e149f42c419a8d7f878f28fc439e0ef1f6cc"

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


def base_claim(**overrides) -> dict:
    """The authoritative ENV-COORD-002-C1 claim record, as merged on main."""
    claim = {
        "task_id": "ENV-COORD-002",
        "claim_id": "ENV-COORD-002-C1",
        "claim_generation": 1,
        "status": "CLAIMED",
        "owner_role": "core_implementation",
        "agent_model": "GLM-5.3 MAX",
        "execution_holder_id": "zcode-env-coord-002-g1-primary",
        "worktree": "A:/GitHub/envww-coord-002",
        "branch": "feat/env-coord-002",
        "base_sha": BASE_SHA,
        "mutable_scope": [
            "scripts/env_coordination_guard.py",
            "scripts/test_env_coordination_guard.py",
            "docs/work-orders/ENV-COORD-002.md",
            "docs/ai/handoffs/ENV-COORD-002-GLM.md",
        ],
        "forbidden_scope": [
            "docs/ai/CURRENT-WORK.md",
            "docs/ai/HANDOFF.md",
            "docs/ai/architecture/ENV-COORDINATION-GUARD.md",
            "AGENTS.md",
            ".github/**",
            ".claude/**",
            "frontend/**",
            "supabase/**",
            "data/**",
        ],
        "work_order_path": "docs/work-orders/ENV-COORD-002.md",
        "handoff_path": "docs/ai/handoffs/ENV-COORD-002-GLM.md",
        "review_owner": "GPT-5.6 Sol + fresh independent reviewer",
        "dependencies": ["ENV-COORD-001 APPROVED and merged"],
        "last_checkpoint_pointer": "docs/ai/handoffs/ENV-COORD-002-GLM.md",
        "one_next_safe_action": "run RED tests first",
    }
    claim.update(overrides)
    return claim


def other_lane_claim(**overrides) -> dict:
    """A second, disjoint active claim for collision tests.

    Its scope is deliberately NOT inside ENV-COORD-002's forbidden scope,
    so link-target and lane-collision semantics are testable independently
    of forbidden-path precedence.
    """
    claim = base_claim(
        task_id="ENV-INT-GISTDA-CORE-001",
        claim_id="ENV-INT-GISTDA-CORE-001-C1",
        execution_holder_id="zcode-gistda-g1-primary",
        worktree="A:/GitHub/envww-env-int-gistda-core-001",
        branch="feat/env-int-gistda-core-001",
        mutable_scope=["reports/gistda/**"],
        forbidden_scope=["scripts/**", "docs/**"],
        work_order_path="docs/work-orders/ENV-INT-GISTDA-CORE-001.md",
        handoff_path="docs/ai/handoffs/ENV-INT-GISTDA-CORE-001-GLM.md",
    )
    claim.update(overrides)
    return claim


def make_registry_text(
    claims,
    mode: str = "BOOTSTRAP_CONTROL",
    expected_rev: str = POLICY_REV,
    decoy_fence: bool = True,
    shared_exceptions=(),
) -> str:
    """Build a CURRENT-WORK.md-shaped document around the registry block."""
    registry = {
        "coordination_registry": {
            "version": 1,
            "enforcement_mode": mode,
            "expected_policy_revision": expected_rev,
            "claims": claims,
            "shared_exceptions": list(shared_exceptions),
        }
    }
    block = json.dumps(registry, indent=2, sort_keys=True, ensure_ascii=False)
    parts = ["# CURRENT WORK", "", "Status: CLAIMED", ""]
    if decoy_fence:
        # CURRENT-WORK.md may legitimately contain other json fences; the
        # parser must only accept the fence that parses to a
        # coordination_registry object (§3 Tier B).
        parts += ["```json", '{"unrelated": {"note": "not a registry"}}', "```", ""]
    parts += ["```json", block, "```", ""]
    return "\n".join(parts)


def load_policy(claims=None, **kw) -> object:
    """load_trusted_policy over a synthesized CURRENT-WORK.md text."""
    if claims is None:
        claims = [base_claim()]
    return load_trusted_policy(make_registry_text(claims, **kw), POLICY_REV)


def ok_ctx(**overrides) -> dict:
    """A preflight context that matches the trusted ENV-COORD-002-C1 claim."""
    ctx = {
        "task_id": "ENV-COORD-002",
        "claim_id": "ENV-COORD-002-C1",
        "claim_generation": 1,
        "execution_holder_id": "zcode-env-coord-002-g1-primary",
        "worktree": "A:/GitHub/envww-coord-002",
        "branch": "feat/env-coord-002",
        "base_ancestor_of_head": True,
    }
    ctx.update(overrides)
    return ctx


# ─────────────────────────────────────────────────────────────────────────
# §7.2 canonical path + scope grammar
# ─────────────────────────────────────────────────────────────────────────
class TestPathCanonicalization(unittest.TestCase):
    """§7.2 rule 1–4: separators, NFC, and rejected path shapes."""

    def test_backslash_becomes_slash(self):
        self.assertEqual(
            canonicalize_path("scripts\\env_coordination_guard.py"),
            "scripts/env_coordination_guard.py",
        )

    def test_nfc_normalization(self):
        decomposed = "docs/cafe\u0301.md"  # e + combining acute
        composed = "docs/caf\u00e9.md"
        self.assertEqual(canonicalize_path(decomposed), composed)

    def test_reject_absolute_unix_path(self):
        with self.assertRaises(GuardFailure) as cm:
            canonicalize_path("/etc/passwd")
        self.assertEqual(cm.exception.reason, R.INVALID_PATH)

    def test_reject_windows_drive_prefix(self):
        for raw in ("A:/GitHub/x", "a:\\github\\x", "C:x/y"):
            with self.assertRaises(GuardFailure) as cm:
                canonicalize_path(raw)
            self.assertEqual(cm.exception.reason, R.INVALID_PATH)

    def test_reject_dot_dot_and_dot_segments(self):
        for raw in ("../outside", "a/../b", "a/./b", ".."):
            with self.assertRaises(GuardFailure) as cm:
                canonicalize_path(raw)
            self.assertEqual(cm.exception.reason, R.INVALID_PATH)

    def test_reject_empty_and_double_segments_and_trailing_slash(self):
        for raw in ("", "a//b", "a/b/"):
            with self.assertRaises(GuardFailure) as cm:
                canonicalize_path(raw)
            self.assertEqual(cm.exception.reason, R.INVALID_PATH)

    def test_reject_nul_byte(self):
        with self.assertRaises(GuardFailure) as cm:
            canonicalize_path("a\u0000b")
        self.assertEqual(cm.exception.reason, R.INVALID_PATH)

    def test_case_key_is_casefolded_not_lowercase_ascii_only(self):
        # Unicode casefold (not ASCII lower) — 'İ'.casefold() != 'İ'.lower()
        self.assertEqual(case_key("Scripts/ENV_GUARD.MD"), case_key("scripts/env_guard.md"))
        self.assertNotEqual(case_key("a/b"), case_key("a/c"))


class TestScopeGrammar(unittest.TestCase):
    """§7.2 allowed scope expressions and deterministic overlap."""

    def test_exact_scope_contains_only_that_file(self):
        expr = parse_scope_expr("scripts/env_coordination_guard.py")
        self.assertTrue(scope_contains(expr, "scripts/env_coordination_guard.py"))
        self.assertFalse(scope_contains(expr, "scripts/other.py"))
        self.assertFalse(scope_contains(expr, "scripts/env_coordination_guard.py.bak"))

    def test_subtree_scope_contains_descendants_not_the_dir_itself(self):
        expr = parse_scope_expr("frontend/src/lib/env-int/gistda/**")
        self.assertTrue(scope_contains(expr, "frontend/src/lib/env-int/gistda/core.ts"))
        self.assertTrue(scope_contains(expr, "frontend/src/lib/env-int/gistda/a/b/c.ts"))
        self.assertFalse(scope_contains(expr, "frontend/src/lib/env-int/gistda"))
        self.assertFalse(scope_contains(expr, "frontend/src/lib/env-int/other/x.ts"))

    def test_subtree_contains_its_own_wildcard_shaped_path_prefix_only(self):
        expr = parse_scope_expr("docs/**")
        self.assertTrue(scope_contains(expr, "docs/ai/x.md"))
        self.assertFalse(scope_contains(expr, "docsx/y.md"))

    def test_reject_non_grammar_expressions(self):
        for bad in ("a/*", "a/**b", "**/x", "a/**/b", "!a", "a/{b,c}", "a/[bc]", "/**", "**", "a/**/**"):
            with self.assertRaises(GuardFailure, msg=bad) as cm:
                parse_scope_expr(bad)
            self.assertEqual(cm.exception.reason, R.INVALID_SCOPE_EXPRESSION, bad)

    def test_reject_scope_over_invalid_path(self):
        with self.assertRaises(GuardFailure) as cm:
            parse_scope_expr("../evil/**")
        self.assertEqual(cm.exception.reason, R.INVALID_PATH)

    def test_overlap_exact_exact(self):
        a = parse_scope_expr("scripts/x.py")
        b = parse_scope_expr("scripts\\X.PY")  # case alias of the same file
        self.assertTrue(scopes_overlap(a, b))
        self.assertFalse(scopes_overlap(a, parse_scope_expr("scripts/y.py")))

    def test_overlap_exact_subtree(self):
        exact = parse_scope_expr("scripts/x.py")
        sub = parse_scope_expr("scripts/**")
        self.assertTrue(scopes_overlap(exact, sub))
        self.assertTrue(scopes_overlap(sub, exact))
        self.assertFalse(scopes_overlap(parse_scope_expr("docs/x.md"), sub))

    def test_overlap_subtree_subtree_nested_and_disjoint(self):
        outer = parse_scope_expr("frontend/**")
        inner = parse_scope_expr("frontend/src/**")
        self.assertTrue(scopes_overlap(outer, inner))
        self.assertTrue(scopes_overlap(inner, outer))
        self.assertFalse(scopes_overlap(outer, parse_scope_expr("supabase/**")))


# ─────────────────────────────────────────────────────────────────────────
# §3 Tier B registry parsing + §7.1 trusted inputs
# ─────────────────────────────────────────────────────────────────────────
class TestRegistryParsing(unittest.TestCase):
    """WO RED bullet: malformed/duplicate registry must fail closed."""

    def test_parses_authoritative_registry_and_binds_hash(self):
        text = make_registry_text([base_claim()])
        policy = load_trusted_policy(text, POLICY_REV)
        self.assertEqual(policy.policy_revision, POLICY_REV)
        self.assertEqual(policy.enforcement_mode, "BOOTSTRAP_CONTROL")
        self.assertEqual(len(policy.claims), 1)
        self.assertEqual(policy.claims[0]["claim_id"], "ENV-COORD-002-C1")
        block, _ = extract_registry_block(text)
        self.assertEqual(policy.registry_hash, registry_hash(block))
        # deterministic: same text → same hash, every parse
        again = load_trusted_policy(text, POLICY_REV)
        self.assertEqual(policy.registry_hash, again.registry_hash)

    def test_hash_changes_when_block_changes(self):
        t1 = make_registry_text([base_claim()])
        t2 = make_registry_text([base_claim(status="ACTIVE")])
        self.assertNotEqual(
            load_trusted_policy(t1, POLICY_REV).registry_hash,
            load_trusted_policy(t2, POLICY_REV).registry_hash,
        )

    def test_ignores_decoy_json_fences(self):
        # decoy fence enabled by default in make_registry_text
        policy = load_policy()
        self.assertEqual(policy.claims[0]["claim_id"], "ENV-COORD-002-C1")

    def test_missing_registry_block(self):
        with self.assertRaises(GuardFailure) as cm:
            load_trusted_policy("# nothing here\n", POLICY_REV)
        self.assertEqual(cm.exception.reason, R.REGISTRY_NOT_FOUND)

    def test_two_registry_blocks_are_ambiguous(self):
        text = make_registry_text([base_claim()]) + make_registry_text([base_claim()], decoy_fence=False)
        with self.assertRaises(GuardFailure) as cm:
            load_trusted_policy(text, POLICY_REV)
        self.assertEqual(cm.exception.reason, R.AMBIGUOUS_REGISTRY)

    def test_malformed_json(self):
        text = "# CURRENT WORK\n\n```json\n{\"coordination_registry\": {not json\n```\n"
        with self.assertRaises(GuardFailure) as cm:
            load_trusted_policy(text, POLICY_REV)
        self.assertEqual(cm.exception.reason, R.REGISTRY_MALFORMED_JSON)

    def test_unsupported_version(self):
        text = make_registry_text([base_claim()])
        text = text.replace('"version": 1', '"version": 2')
        with self.assertRaises(GuardFailure) as cm:
            load_trusted_policy(text, POLICY_REV)
        self.assertEqual(cm.exception.reason, R.UNSUPPORTED_REGISTRY_VERSION)

    def test_invalid_enforcement_mode(self):
        text = make_registry_text([base_claim()], mode="SUPER_ENFORCING")
        with self.assertRaises(GuardFailure) as cm:
            load_trusted_policy(text, POLICY_REV)
        self.assertEqual(cm.exception.reason, R.INVALID_ENFORCEMENT_MODE)

    def test_missing_required_claim_field(self):
        claim = base_claim()
        del claim["execution_holder_id"]
        with self.assertRaises(GuardFailure) as cm:
            load_policy([claim])
        self.assertEqual(cm.exception.reason, R.MISSING_CLAIM_FIELD)
        self.assertIn("execution_holder_id", cm.exception.detail)

    def test_all_required_fields_accepted(self):
        # pin the exact Tier B field list so silent schema drift fails here
        claim = base_claim()
        for field in REQUIRED_CLAIM_FIELDS:
            self.assertIn(field, claim)
        policy = load_policy([claim])
        validate_registry(policy.raw_registry)
        self.assertEqual(len(policy.claims), 1)

    def test_duplicate_claim_id_rejected(self):
        with self.assertRaises(GuardFailure) as cm:
            load_policy([base_claim(), base_claim()])
        self.assertEqual(cm.exception.reason, R.DUPLICATE_CLAIM)

    def test_same_task_double_claim_is_ownership_conflict(self):
        second = base_claim(claim_id="ENV-COORD-002-C2", claim_generation=2)
        with self.assertRaises(GuardFailure) as cm:
            load_policy([base_claim(), second])
        self.assertEqual(cm.exception.reason, R.OWNERSHIP_CONFLICT)

    def test_two_claims_same_task_id_different_status_still_conflict(self):
        second = base_claim(claim_id="ENV-COORD-002-C9", status="STALE_CLAIM")
        with self.assertRaises(GuardFailure) as cm:
            load_policy([base_claim(), second])
        self.assertEqual(cm.exception.reason, R.OWNERSHIP_CONFLICT)

    def test_invalid_scope_expression_inside_claim(self):
        with self.assertRaises(GuardFailure) as cm:
            load_policy([base_claim(mutable_scope=["frontend/*"])])
        self.assertEqual(cm.exception.reason, R.INVALID_SCOPE_EXPRESSION)

    def test_generation_must_be_positive_int(self):
        for bad in (0, -1, "1", 1.5, None):
            with self.assertRaises(GuardFailure, msg=repr(bad)) as cm:
                load_policy([base_claim(claim_generation=bad)])
            self.assertEqual(cm.exception.reason, R.INVALID_CLAIM_FIELD)

    def test_status_must_be_known_state(self):
        with self.assertRaises(GuardFailure) as cm:
            load_policy([base_claim(status="HAPPY")])
        self.assertEqual(cm.exception.reason, R.INVALID_CLAIM_FIELD)


# ─────────────────────────────────────────────────────────────────────────
# §3.1/§3.2/§4.2/§4.4 preflight, fencing, holder identity
# ─────────────────────────────────────────────────────────────────────────
class TestPreflightFencing(unittest.TestCase):
    """§4.4 claim activation checks; §4.2 generation/holder fencing."""

    def test_happy_path_safe_to_mutate_yes(self):
        policy = load_policy()
        decision = preflight(policy, ok_ctx())
        self.assertTrue(decision.safe_to_mutate)
        self.assertIsNone(decision.reason)
        self.assertEqual(decision.policy_revision, POLICY_REV)
        self.assertEqual(decision.claim_id, "ENV-COORD-002-C1")
        self.assertEqual(decision.claim_generation, 1)
        self.assertEqual(decision.execution_holder_id, "zcode-env-coord-002-g1-primary")

    def test_unknown_task(self):
        policy = load_policy()
        d = preflight(policy, ok_ctx(task_id="ENV-NOPE"))
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.UNKNOWN_TASK)

    def test_wrong_claim_id(self):
        policy = load_policy()
        d = preflight(policy, ok_ctx(claim_id="ENV-COORD-002-C2"))
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.WRONG_CLAIM)

    def test_stale_claim_generation(self):
        # WO RED bullet: stale claim generation rejected.
        policy = load_policy()
        d = preflight(policy, ok_ctx(claim_generation=0))
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.STALE_CLAIM_GENERATION)

    def test_generation_raised_on_main_fences_old_worker(self):
        # §13.6: old worker resumes after reassignment → STALE_CLAIM_GENERATION
        policy_g2 = load_policy(
            [base_claim(claim_generation=2, execution_holder_id="zcode-env-coord-002-g2-primary")]
        )
        d = preflight(policy_g2, ok_ctx())  # old g1 holder/context
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.STALE_CLAIM_GENERATION)

    def test_wrong_execution_holder_same_generation(self):
        # WO RED bullet + §13.35: second execution holder rejected for same
        # generation; a second live context must not reuse the generation.
        policy = load_policy()
        d = preflight(policy, ok_ctx(execution_holder_id="zcode-env-coord-002-g1-rogue"))
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.WRONG_EXECUTION_HOLDER)

    def test_claim_status_not_mutable(self):
        for status in ("READY", "REVIEW_REQUESTED", "MERGED", "CLOSED", "STALE_CLAIM"):
            with self.subTest(status=status):
                policy = load_policy([base_claim(status=status)])
                d = preflight(policy, ok_ctx())
                self.assertFalse(d.safe_to_mutate)
                self.assertEqual(d.reason, R.CLAIM_STATUS_NOT_MUTABLE)

    def test_worktree_mismatch(self):
        policy = load_policy()
        d = preflight(policy, ok_ctx(worktree="A:/GitHub/somewhere-else"))
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.WORKTREE_MISMATCH)

    def test_worktree_slash_and_case_aliases_do_not_mismatch(self):
        # Windows writes the same path with backslashes / different case;
        # comparison is canonical, not literal.
        policy = load_policy()
        d = preflight(policy, ok_ctx(worktree="a:\\github\\ENVWW-COORD-002"))
        self.assertTrue(d.safe_to_mutate)

    def test_branch_mismatch(self):
        policy = load_policy()
        d = preflight(policy, ok_ctx(branch="docs/env-coord-002-claim"))
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.BRANCH_MISMATCH)

    def test_base_not_ancestor_of_head(self):
        policy = load_policy()
        d = preflight(policy, ok_ctx(base_ancestor_of_head=False))
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.BASE_NOT_ANCESTOR)

    def test_decision_is_bound_to_policy_tuple(self):
        # §3.1: every decision carries policy_revision + registry_hash
        policy = load_policy()
        d = preflight(policy, ok_ctx())
        self.assertEqual(d.policy_revision, POLICY_REV)
        self.assertEqual(d.registry_hash, policy.registry_hash)
        self.assertEqual(d.claim_id, "ENV-COORD-002-C1")
        self.assertEqual(d.claim_generation, 1)


# ─────────────────────────────────────────────────────────────────────────
# §7.2 scope evaluation: forbidden precedence, case, rename, copy, links
# ─────────────────────────────────────────────────────────────────────────
class TestMutationScopeEvaluation(unittest.TestCase):
    """evaluate_mutation = preflight + deterministic changed-file scope."""

    def test_in_scope_add_allowed(self):
        policy = load_policy()
        d = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("add", "scripts/env_coordination_guard.py")],
        )
        self.assertTrue(d.safe_to_mutate)

    def test_forbidden_scope_overrides_allowed_scope(self):
        # WO RED bullet: forbidden scope overrides allowed scope. The claim's
        # mutable scope does not include CURRENT-WORK.md, but the override
        # must be proven even if mutable were (hypothetically) widened:
        # a scope entry cannot whitelist a forbidden path.
        claim = base_claim(
            mutable_scope=[
                "scripts/env_coordination_guard.py",
                "docs/ai/CURRENT-WORK.md",  # candidate-style widening
            ]
        )
        policy = load_policy([claim])
        d = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("modify", "docs/ai/CURRENT-WORK.md")],
        )
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.FORBIDDEN_PATH)

    def test_forbidden_subtree_denied(self):
        policy = load_policy()
        d = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("add", ".github/workflows/evil.yml")],
        )
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.FORBIDDEN_PATH)

    def test_outside_mutable_scope_denied(self):
        policy = load_policy()
        d = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("add", "scripts/unrelated.py")],
        )
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.OUTSIDE_MUTABLE_SCOPE)

    def test_identity_failure_beats_scope_evaluation(self):
        policy = load_policy()
        d = evaluate_mutation(
            policy,
            ok_ctx(claim_generation=0),
            changes=[Change("add", ".github/workflows/evil.yml")],
        )
        self.assertEqual(d.reason, R.STALE_CLAIM_GENERATION)

    def test_windows_case_alias_cannot_bypass_forbidden(self):
        # WO RED bullet: Windows case alias cannot bypass scope.
        policy = load_policy()
        d = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("modify", "AGENTS.md".lower().upper())],  # "AGENTS.MD"
        )
        # AGENTS.MD is the same file as the forbidden AGENTS.md
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.FORBIDDEN_PATH)

    def test_windows_case_alias_cannot_bypass_mutable_either(self):
        policy = load_policy()
        d = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("add", "SCRIPTS/UNRELATED.PY")],
        )
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.OUTSIDE_MUTABLE_SCOPE)

    def test_case_alias_cannot_create_false_independent_lane(self):
        # §13.10: a case variant of a scoped path overlaps the real scope —
        # it must collide, not pass as a disjoint lane.
        a = parse_scope_expr("scripts/env_coordination_guard.py")
        b = parse_scope_expr("Scripts\\Env_Coordination_Guard.py")
        self.assertTrue(scopes_overlap(a, b))

    def test_rename_evaluates_source_and_destination(self):
        # WO RED bullet: rename evaluates source and destination.
        policy = load_policy()
        # source in scope, destination outside mutable (but not forbidden) → denied
        d = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[
                Change(
                    "rename",
                    "scripts/env_coordination_guard.py",
                    "scripts/unrelated.py",
                )
            ],
        )
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.OUTSIDE_MUTABLE_SCOPE)
        # source outside, destination in scope → also denied
        d2 = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("rename", "scripts/unrelated.py", "docs/work-orders/ENV-COORD-002.md")],
        )
        self.assertFalse(d2.safe_to_mutate)
        self.assertEqual(d2.reason, R.OUTSIDE_MUTABLE_SCOPE)
        # both endpoints in scope → allowed
        d3 = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[
                Change(
                    "rename",
                    "scripts/env_coordination_guard.py",
                    "scripts/test_env_coordination_guard.py",
                )
            ],
        )
        self.assertTrue(d3.safe_to_mutate)

    def test_rename_into_forbidden_denied_even_from_scope(self):
        policy = load_policy()
        d = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("rename", "docs/work-orders/ENV-COORD-002.md", "AGENTS.md")],
        )
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.FORBIDDEN_PATH)

    def test_delete_checks_source_only(self):
        policy = load_policy()
        d = evaluate_mutation(
            policy, ok_ctx(), changes=[Change("delete", "docs/ai/handoffs/ENV-COORD-002-GLM.md")]
        )
        self.assertTrue(d.safe_to_mutate)
        d2 = evaluate_mutation(policy, ok_ctx(), changes=[Change("delete", "AGENTS.md")])
        self.assertEqual(d2.reason, R.FORBIDDEN_PATH)

    def test_copy_checks_destination_mutable_and_source_not_forbidden(self):
        # §7.2: copy = source read policy + destination mutable policy.
        policy = load_policy()
        ok = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("copy", "docs/work-orders/ENV-COORD-002.md", "scripts/env_coordination_guard.py")],
        )
        self.assertTrue(ok.safe_to_mutate)
        # copying FROM a forbidden path is denied even when dest is in scope
        bad = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("copy", "data/raw/secret.csv", "scripts/env_coordination_guard.py")],
        )
        self.assertFalse(bad.safe_to_mutate)
        self.assertEqual(bad.reason, R.FORBIDDEN_PATH)
        # copying INTO an out-of-scope (but not forbidden) destination is denied
        bad2 = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("copy", "scripts/env_coordination_guard.py", "scripts/unrelated.py")],
        )
        self.assertFalse(bad2.safe_to_mutate)
        self.assertEqual(bad2.reason, R.OUTSIDE_MUTABLE_SCOPE)

    def test_unknown_change_kind_rejected(self):
        policy = load_policy()
        with self.assertRaises(GuardFailure) as cm:
            evaluate_mutation(policy, ok_ctx(), changes=[Change("explode", "a")])
        self.assertEqual(cm.exception.reason, R.UNKNOWN_CHANGE_KIND)

    def test_mixed_batch_fails_closed_on_worst_path(self):
        policy = load_policy()
        d = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[
                Change("add", "scripts/env_coordination_guard.py"),
                Change("add", ".github/workflows/evil.yml"),
                Change("add", "scripts/unrelated.py"),
            ],
        )
        # forbidden wins over merely-outside-scope in reporting order
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.FORBIDDEN_PATH)


class TestSymlinkPolicy(unittest.TestCase):
    """§7.2 symlink/junction rules; §13.11/36; WO link bullets."""

    def test_outside_root_link_target_denied(self):
        # WO RED bullet: outside-root link target denied.
        policy = load_policy()
        d = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("add", "scripts/env_coordination_guard.py")],
            links=[LinkRequest("scripts/env_coordination_guard.py", None, inside_root=False)],
        )
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.LINK_TARGET_OUTSIDE_ROOT)

    def test_in_root_target_in_same_claim_scope_allowed(self):
        policy = load_policy()
        d = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("add", "scripts/env_coordination_guard.py")],
            links=[LinkRequest("scripts/env_coordination_guard.py", "scripts/test_env_coordination_guard.py", True)],
        )
        self.assertTrue(d.safe_to_mutate)

    def test_in_root_target_in_own_forbidden_denied(self):
        policy = load_policy()
        d = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("add", "scripts/env_coordination_guard.py")],
            links=[LinkRequest("scripts/env_coordination_guard.py", "AGENTS.md", True)],
        )
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.FORBIDDEN_PATH)

    def test_in_root_target_inside_another_lane_denied(self):
        # WO RED bullet: in-root symlink/junction resolved target in another
        # lane is unauthorized (§13.36). The target is inside OUR mutable
        # scope but inside the other lane's protected (forbidden) scope.
        policy = load_policy([base_claim(), other_lane_claim()])
        d = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("add", "scripts/env_coordination_guard.py")],
            links=[
                LinkRequest(
                    "scripts/env_coordination_guard.py",
                    "docs/work-orders/ENV-COORD-002.md",
                    True,
                )
            ],
        )
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.LINK_CROSSES_LANE)

    def test_shared_file_exception_exact_path_participants_only(self):
        # §13.36 negative kept here: a target inside another lane's
        # protected scope with NO exception covering it stays denied.
        # The full §7.3 contract is covered by TestSharedFileException.
        policy = load_policy([base_claim(), other_lane_claim()])
        d = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("add", "scripts/env_coordination_guard.py")],
            links=[
                LinkRequest(
                    "scripts/env_coordination_guard.py",
                    "docs/work-orders/ENV-COORD-002.md",
                    True,
                )
            ],
        )
        # target is in our own mutable scope but inside the other lane's
        # protected (forbidden) scope and no exception covers it
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.LINK_CROSSES_LANE)


def sharing_claims():
    """Two lanes whose mutable scopes overlap on exactly reports/shared.txt."""
    claim_a = base_claim(
        mutable_scope=[
            "scripts/env_coordination_guard.py",
            "scripts/test_env_coordination_guard.py",
            "docs/work-orders/ENV-COORD-002.md",
            "docs/ai/handoffs/ENV-COORD-002-GLM.md",
            "reports/shared.txt",
        ]
    )
    claim_b = other_lane_claim(
        mutable_scope=["reports/gistda/**", "reports/shared.txt"],
    )
    return claim_a, claim_b


def full_shared_exception(**overrides):
    """A complete paragraph-7.3 record: exact paths, participants bound to
    generations, single temporary integration owner, dependency/merge
    order, release condition."""
    exc = {
        "shared_paths": ["reports/shared.txt"],
        "participating_claims": [
            {"claim_id": "ENV-COORD-002-C1", "claim_generation": 1},
            {"claim_id": "ENV-INT-GISTDA-CORE-001-C1", "claim_generation": 1},
        ],
        "integration_owner_claim_id": "ENV-INT-GISTDA-CORE-001-C1",
        "merge_order": ["ENV-COORD-002-C1", "ENV-INT-GISTDA-CORE-001-C1"],
        "release_condition": "owner merges shared change; exception removed by next control transition",
    }
    exc.update(overrides)
    return exc


class TestSharedFileException(unittest.TestCase):
    """PR #84 P1-3: the shared-file exception contract.

    Exact paths only; participants bound to claim generations; single
    temporary integration owner; dependency/merge order; release
    condition; and only the exact authorized overlap is legalized.
    """

    def _load(self, exceptions, claims=None):
        if claims is None:
            claims = list(sharing_claims())
        return load_policy(claims, shared_exceptions=list(exceptions))

    def _gistda_ctx(self):
        return ok_ctx(
            task_id="ENV-INT-GISTDA-CORE-001",
            claim_id="ENV-INT-GISTDA-CORE-001-C1",
            execution_holder_id="zcode-gistda-g1-primary",
            worktree="A:/GitHub/envww-env-int-gistda-core-001",
            branch="feat/env-int-gistda-core-001",
        )

    def test_exact_shared_overlap_is_authorized(self):
        # reviewer reproducer: this raised OWNERSHIP_CONFLICT before repair
        policy = self._load([full_shared_exception()])
        self.assertEqual(len(policy.claims), 2)
        self.assertEqual(len(policy.shared_exceptions), 1)

    def test_both_participants_may_mutate_the_shared_path(self):
        policy = self._load([full_shared_exception()])
        d1 = evaluate_mutation(
            policy, ok_ctx(), changes=[Change("modify", "reports/shared.txt")]
        )
        self.assertTrue(d1.safe_to_mutate)
        d2 = evaluate_mutation(
            policy,
            self._gistda_ctx(),
            changes=[Change("modify", "reports/shared.txt")],
        )
        self.assertTrue(d2.safe_to_mutate)

    def test_participant_link_to_shared_path_allowed(self):
        policy = self._load([full_shared_exception()])
        # resolved target sits in BOTH mutable scopes; the exception makes
        # the overlap legal, so re-authorization passes
        d = evaluate_mutation(
            policy,
            ok_ctx(),
            changes=[Change("modify", "reports/shared.txt")],
            links=[LinkRequest("reports/shared.txt", "reports/shared.txt", True)],
        )
        self.assertTrue(d.safe_to_mutate)

    def test_second_overlapping_file_without_exception_still_conflicts(self):
        claim_a, claim_b = sharing_claims()
        claim_a = base_claim(
            mutable_scope=list(claim_a["mutable_scope"]) + ["reports/secret2.txt"]
        )
        claim_b = other_lane_claim(
            mutable_scope=["reports/gistda/**", "reports/shared.txt", "reports/secret2.txt"]
        )
        with self.assertRaises(GuardFailure) as cm:
            self._load([full_shared_exception()], claims=[claim_a, claim_b])
        self.assertEqual(cm.exception.reason, R.OWNERSHIP_CONFLICT)

    def test_subtree_overlap_is_broader_than_exact_and_conflicts(self):
        # a subtree/subtree intersection can never be an exact authorized
        # shared path, so it stays an ownership conflict
        claim_a = base_claim(
            mutable_scope=["scripts/env_coordination_guard.py", "reports/**"]
        )
        claim_b = other_lane_claim(mutable_scope=["reports/**"])
        with self.assertRaises(GuardFailure) as cm:
            self._load([full_shared_exception()], claims=[claim_a, claim_b])
        self.assertEqual(cm.exception.reason, R.OWNERSHIP_CONFLICT)

    def test_overlapping_claims_without_any_exception_conflict(self):
        with self.assertRaises(GuardFailure) as cm:
            self._load([])
        self.assertEqual(cm.exception.reason, R.OWNERSHIP_CONFLICT)

    def test_non_participant_lane_still_denied_via_link(self):
        # exception authorizes only its participants; a third lane probing
        # another lane's file is denied — the target is outside its own
        # mutable scope, so the exception cannot widen it into authority
        claim_a, claim_b = sharing_claims()
        third = base_claim(
            task_id="ENV-THIRD",
            claim_id="ENV-THIRD-C1",
            execution_holder_id="holder-third",
            worktree="A:/GitHub/envww-third",
            branch="feat/third",
            mutable_scope=["third/**"],
            forbidden_scope=["scripts/**"],
        )
        policy = self._load(
            [full_shared_exception()], claims=[claim_a, claim_b, third]
        )
        d = evaluate_mutation(
            policy,
            ok_ctx(
                task_id="ENV-THIRD",
                claim_id="ENV-THIRD-C1",
                execution_holder_id="holder-third",
                worktree="A:/GitHub/envww-third",
                branch="feat/third",
            ),
            changes=[Change("add", "third/x.ts")],
            links=[LinkRequest("third/x.ts", "reports/gistda/core.ts", True)],
        )
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.OUTSIDE_MUTABLE_SCOPE)

    def test_missing_release_condition_rejected(self):
        exc = full_shared_exception()
        del exc["release_condition"]
        with self.assertRaises(GuardFailure) as cm:
            self._load([exc])
        self.assertEqual(cm.exception.reason, R.INVALID_SHARED_EXCEPTION)

    def test_missing_merge_order_rejected(self):
        exc = full_shared_exception()
        del exc["merge_order"]
        with self.assertRaises(GuardFailure) as cm:
            self._load([exc])
        self.assertEqual(cm.exception.reason, R.INVALID_SHARED_EXCEPTION)

    def test_merge_order_must_be_exact_permutation_of_participants(self):
        bad = full_shared_exception(merge_order=["ENV-COORD-002-C1"])
        with self.assertRaises(GuardFailure) as cm:
            self._load([bad])
        self.assertEqual(cm.exception.reason, R.INVALID_SHARED_EXCEPTION)
        bad2 = full_shared_exception(
            merge_order=["ENV-COORD-002-C1", "ENV-COORD-002-C1"]
        )
        with self.assertRaises(GuardFailure) as cm:
            self._load([bad2])
        self.assertEqual(cm.exception.reason, R.INVALID_SHARED_EXCEPTION)

    def test_integration_owner_must_participate(self):
        bad = full_shared_exception(integration_owner_claim_id="ENV-COORD-999-C1")
        with self.assertRaises(GuardFailure) as cm:
            self._load([bad])
        self.assertEqual(cm.exception.reason, R.INVALID_SHARED_EXCEPTION)

    def test_participant_generation_binding(self):
        # participants are bound to exact claim generations - a stale
        # generation listing is invalid
        bad = full_shared_exception(
            participating_claims=[
                {"claim_id": "ENV-COORD-002-C1", "claim_generation": 2},
                {"claim_id": "ENV-INT-GISTDA-CORE-001-C1", "claim_generation": 1},
            ]
        )
        with self.assertRaises(GuardFailure) as cm:
            self._load([bad])
        self.assertEqual(cm.exception.reason, R.INVALID_SHARED_EXCEPTION)

    def test_shared_path_must_be_inside_every_participant_mutable_scope(self):
        bad = full_shared_exception(
            shared_paths=["reports/shared.txt", "scripts/env_coordination_guard.py"]
        )
        # scripts/env_coordination_guard.py is in claim A's scope but not
        # in the GISTDA claim's scope
        with self.assertRaises(GuardFailure) as cm:
            self._load([bad])
        self.assertEqual(cm.exception.reason, R.INVALID_SHARED_EXCEPTION)

    def test_single_participant_rejected(self):
        bad = full_shared_exception(
            participating_claims=[
                {"claim_id": "ENV-COORD-002-C1", "claim_generation": 1}
            ],
            integration_owner_claim_id="ENV-COORD-002-C1",
            merge_order=["ENV-COORD-002-C1"],
        )
        with self.assertRaises(GuardFailure) as cm:
            self._load([bad])
        self.assertEqual(cm.exception.reason, R.INVALID_SHARED_EXCEPTION)

    def test_subtree_shared_path_rejected(self):
        bad = full_shared_exception(shared_paths=["reports/**"])
        with self.assertRaises(GuardFailure) as cm:
            self._load([bad])
        self.assertEqual(cm.exception.reason, R.INVALID_SHARED_EXCEPTION)

    def test_unknown_participant_rejected(self):
        bad = full_shared_exception(
            participating_claims=[
                {"claim_id": "ENV-COORD-002-C1", "claim_generation": 1},
                {"claim_id": "GHOST-C1", "claim_generation": 1},
            ],
            merge_order=["ENV-COORD-002-C1", "GHOST-C1"],
        )
        with self.assertRaises(GuardFailure) as cm:
            self._load([bad])
        self.assertEqual(cm.exception.reason, R.INVALID_SHARED_EXCEPTION)


class TestDisjointLanes(unittest.TestCase):
    """WO RED bullet: independent disjoint scopes do not false-collide."""

    def test_two_lanes_both_evaluate_clean(self):
        policy = load_policy([base_claim(), other_lane_claim()])
        d1 = evaluate_mutation(
            policy, ok_ctx(), changes=[Change("modify", "scripts/env_coordination_guard.py")]
        )
        d2 = evaluate_mutation(
            policy,
            ok_ctx(
                task_id="ENV-INT-GISTDA-CORE-001",
                claim_id="ENV-INT-GISTDA-CORE-001-C1",
                execution_holder_id="zcode-gistda-g1-primary",
                worktree="A:/GitHub/envww-env-int-gistda-core-001",
                branch="feat/env-int-gistda-core-001",
            ),
            changes=[Change("add", "reports/gistda/core.ts")],
        )
        self.assertTrue(d1.safe_to_mutate)
        self.assertTrue(d2.safe_to_mutate)

    def test_actually_overlapping_claims_are_detected(self):
        overlapping = other_lane_claim(mutable_scope=["scripts/**"])
        with self.assertRaises(GuardFailure) as cm:
            load_policy([base_claim(), overlapping])
        self.assertEqual(cm.exception.reason, R.OWNERSHIP_CONFLICT)


# ─────────────────────────────────────────────────────────────────────────
# §3.2 field precedence: candidate Work Order cannot widen authority
# ─────────────────────────────────────────────────────────────────────────
class TestCandidateWorkOrderPrecedence(unittest.TestCase):
    """WO RED bullet: candidate WO cannot widen trusted claim scope."""

    def test_equal_scope_ok(self):
        policy = load_policy()
        result = evaluate_candidate_work_order(
            policy, "ENV-COORD-002-C1", list(base_claim()["mutable_scope"])
        )
        self.assertTrue(result.allowed)
        self.assertEqual(result.effective_scope, tuple(base_claim()["mutable_scope"]))

    def test_narrower_scope_ok_effective_stays_trusted(self):
        policy = load_policy()
        narrower = ["scripts/env_coordination_guard.py"]
        result = evaluate_candidate_work_order(policy, "ENV-COORD-002-C1", narrower)
        self.assertTrue(result.allowed)
        # effective scope is the trusted record, not the narrower candidate
        self.assertEqual(result.effective_scope, tuple(base_claim()["mutable_scope"]))

    def test_broader_scope_is_policy_contradiction(self):
        policy = load_policy()
        broader = list(base_claim()["mutable_scope"]) + ["docs/ai/CURRENT-WORK.md"]
        result = evaluate_candidate_work_order(policy, "ENV-COORD-002-C1", broader)
        self.assertFalse(result.allowed)
        self.assertEqual(result.reason, R.POLICY_CONTRADICTION)

    def test_unknown_claim_rejected(self):
        policy = load_policy()
        result = evaluate_candidate_work_order(policy, "ENV-COORD-002-C99", [])
        self.assertFalse(result.allowed)
        self.assertEqual(result.reason, R.WRONG_CLAIM)


# ─────────────────────────────────────────────────────────────────────────
# §4.3 serialized control transitions
# ─────────────────────────────────────────────────────────────────────────
class TestControlTransition(unittest.TestCase):
    """§4.3/§13.5: expected-revision serialization + ownership collision."""

    @classmethod
    def setUpClass(cls):
        cls.policy = load_policy([base_claim(), other_lane_claim()])

    def _proposal(self, **over):
        p = {
            "expected_policy_revision": POLICY_REV,
            "expected_registry_hash": self.policy.registry_hash,
            "task_id": "ENV-OPS-001B",
            "expected_claim_generation": None,
            "proposed_claim_generation": 1,
            "proposed_mutable_scope": ["frontend/src/ops/**"],
        }
        p.update(over)
        return p

    def test_valid_proposal_accepted(self):
        result = evaluate_control_transition(self.policy, self._proposal())
        self.assertTrue(result.valid)

    def test_stale_policy_revision_rejected(self):
        # §13.5: after the first transition wins and main advances, the
        # second proposal from the same old revision fails.
        result = evaluate_control_transition(
            self.policy, self._proposal(expected_policy_revision=BASE_SHA)
        )
        self.assertFalse(result.valid)
        self.assertEqual(result.reason, R.STALE_POLICY_REVISION)

    def test_stale_registry_hash_rejected(self):
        result = evaluate_control_transition(
            self.policy, self._proposal(expected_registry_hash="0" * 64)
        )
        self.assertFalse(result.valid)
        self.assertEqual(result.reason, R.STALE_REGISTRY_HASH)

    def test_scope_collision_with_existing_claim(self):
        # §13.1: same-file double claim → OWNERSHIP_CONFLICT
        result = evaluate_control_transition(
            self.policy, self._proposal(proposed_mutable_scope=["scripts/env_coordination_guard.py"])
        )
        self.assertFalse(result.valid)
        self.assertEqual(result.reason, R.OWNERSHIP_CONFLICT)

    def test_reassignment_must_increment_generation(self):
        result = evaluate_control_transition(
            self.policy,
            self._proposal(
                task_id="ENV-COORD-002",
                expected_claim_generation=1,
                proposed_claim_generation=1,
                proposed_mutable_scope=["scripts/x/**"],
            ),
        )
        self.assertFalse(result.valid)
        self.assertEqual(result.reason, R.INVALID_GENERATION_TRANSITION)

    def test_exception_authorized_exact_overlap_transition_valid(self):
        # PR #84 P1-3: a proposal whose scope overlaps an existing claim is
        # legal only when an authorized shared exception covers the exact
        # overlap for this proposal's claim id + generation.
        proposal = self._proposal(
            proposed_claim_id="ENV-OPS-001B-C1",
            proposed_mutable_scope=["frontend/src/ops/**", "reports/shared.txt"],
            authorized_shared_exceptions=[
                {
                    "shared_paths": ["reports/shared.txt"],
                    "participating_claims": [
                        {"claim_id": "ENV-OPS-001B-C1", "claim_generation": 1},
                        {"claim_id": "ENV-COORD-002-C1", "claim_generation": 1},
                    ],
                    "integration_owner_claim_id": "ENV-OPS-001B-C1",
                    "merge_order": ["ENV-COORD-002-C1", "ENV-OPS-001B-C1"],
                    "release_condition": "owner merges shared change",
                }
            ],
        )
        # existing ENV-COORD-002 claim must actually contain the shared path
        # for the exception to be well-formed; give it the overlap via scope
        claim_with_share = base_claim(
            mutable_scope=list(base_claim()["mutable_scope"]) + ["reports/shared.txt"]
        )
        policy = load_policy([claim_with_share, other_lane_claim()])
        proposal["expected_registry_hash"] = policy.registry_hash
        result = evaluate_control_transition(policy, proposal)
        self.assertTrue(result.valid)

    def test_exception_cannot_authorize_broader_transition_overlap(self):
        # broader overlap than the exact shared path stays a conflict
        proposal = self._proposal(
            proposed_claim_id="ENV-OPS-001B-C1",
            proposed_mutable_scope=["frontend/src/ops/**", "reports/shared.txt", "reports/other.txt"],
            authorized_shared_exceptions=[
                {
                    "shared_paths": ["reports/shared.txt"],
                    "participating_claims": [
                        {"claim_id": "ENV-OPS-001B-C1", "claim_generation": 1},
                        {"claim_id": "ENV-COORD-002-C1", "claim_generation": 1},
                    ],
                    "integration_owner_claim_id": "ENV-OPS-001B-C1",
                    "merge_order": ["ENV-COORD-002-C1", "ENV-OPS-001B-C1"],
                    "release_condition": "owner merges shared change",
                }
            ],
        )
        claim_with_share = base_claim(
            mutable_scope=list(base_claim()["mutable_scope"])
            + ["reports/shared.txt", "reports/other.txt"]
        )
        policy = load_policy([claim_with_share, other_lane_claim()])
        proposal["expected_registry_hash"] = policy.registry_hash
        result = evaluate_control_transition(policy, proposal)
        self.assertFalse(result.valid)
        self.assertEqual(result.reason, R.OWNERSHIP_CONFLICT)


# ─────────────────────────────────────────────────────────────────────────
# §5 goal lifecycle
# ─────────────────────────────────────────────────────────────────────────
def goal_start(seq=1, event_id="e1", prev="GENESIS", goal="g1"):
    return LifecycleEvent(
        task_id="ENV-COORD-002",
        claim_id="ENV-COORD-002-C1",
        claim_generation=1,
        goal_id=goal,
        event_type="GOAL_START",
        event_seq=seq,
        event_id=event_id,
        previous_event_id=prev,
    )


def goal_end(seq=2, event_id="e2", prev="e1", goal="g1", result="COMPLETED_VERIFIED", published=True):
    return LifecycleEvent(
        task_id="ENV-COORD-002",
        claim_id="ENV-COORD-002-C1",
        claim_generation=1,
        goal_id=goal,
        event_type="GOAL_END",
        event_seq=seq,
        event_id=event_id,
        previous_event_id=prev,
        terminal_result=result,
        published=published,
    )


class TestGoalLifecycle(unittest.TestCase):
    """§5.1/§5.3/§5.6 + §13.12/14/15/37; WO lifecycle RED bullets."""

    def test_first_goal_start_accepts_genesis(self):
        # WO RED bullet: first GoalStart accepts GENESIS.
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        status, _ = log.apply(goal_start())
        self.assertEqual(status, "applied")
        self.assertEqual(log.active_goal_id, "g1")

    def test_genesis_rejected_when_events_exist(self):
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        log.apply(goal_start())
        log.apply(goal_end())
        with self.assertRaises(GuardFailure) as cm:
            log.apply(goal_start(seq=3, event_id="e3", prev="GENESIS", goal="g2"))
        self.assertEqual(cm.exception.reason, R.OUT_OF_ORDER_EVENT)

    def test_non_genesis_first_start_rejected(self):
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        with self.assertRaises(GuardFailure) as cm:
            log.apply(goal_start(prev="e0"))
        self.assertEqual(cm.exception.reason, R.OUT_OF_ORDER_EVENT)

    def test_second_goal_start_rejects_unterminated_predecessor(self):
        # WO RED bullet + §13.12: Goal 2 blocked while Goal 1 lacks a
        # terminal GOAL_END.
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        log.apply(goal_start())
        with self.assertRaises(GuardFailure) as cm:
            log.apply(goal_start(seq=2, event_id="e2", prev="e1", goal="g2"))
        self.assertEqual(cm.exception.reason, R.UNTERMINATED_PREDECESSOR)

    def test_goal_start_after_terminal_goal_end_ok(self):
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        log.apply(goal_start())
        log.apply(goal_end())
        status, _ = log.apply(goal_start(seq=3, event_id="e3", prev="e2", goal="g2"))
        self.assertEqual(status, "applied")
        self.assertEqual(log.active_goal_id, "g2")

    def test_checkpoint_cannot_replace_active_goal(self):
        # §5.1: a normal checkpoint is not a goal terminator.
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        log.apply(goal_start())
        ck = LifecycleEvent(
            task_id="ENV-COORD-002",
            claim_id="ENV-COORD-002-C1",
            claim_generation=1,
            goal_id="g1",
            event_type="CHECKPOINT",
            event_seq=2,
            event_id="e2",
            previous_event_id="e1",
        )
        log.apply(ck)
        with self.assertRaises(GuardFailure) as cm:
            log.apply(goal_start(seq=3, event_id="e3", prev="e2", goal="g2"))
        self.assertEqual(cm.exception.reason, R.UNTERMINATED_PREDECESSOR)

    def test_done_is_not_a_valid_goal_result(self):
        # §5.6: DONE alone is invalid.
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        log.apply(goal_start())
        with self.assertRaises(GuardFailure) as cm:
            log.apply(goal_end(result="DONE"))
        self.assertEqual(cm.exception.reason, R.INVALID_GOAL_RESULT)

    def test_valid_terminal_results(self):
        for i, result in enumerate(
            ["COMPLETED_VERIFIED", "COMPLETED_UNVERIFIED", "PARTIAL", "BLOCKED", "DECISION_REQUIRED", "FAILED", "PAUSED"]
        ):
            with self.subTest(result=result):
                log = LifecycleLog("ENV-COORD-002-C1", 1)
                log.apply(goal_start())
                log.apply(goal_end(result=result))
                self.assertIsNone(log.active_goal_id)

    def test_goal_end_requires_publication(self):
        # §5.6: Goal-End is complete only when durably published.
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        log.apply(goal_start())
        with self.assertRaises(GuardFailure) as cm:
            log.apply(goal_end(published=False))
        self.assertEqual(cm.exception.reason, R.GOAL_END_NOT_PUBLISHED)
        # goal remains active
        self.assertEqual(log.active_goal_id, "g1")

    def test_duplicate_event_id_identical_payload_is_noop(self):
        # WO RED bullet + §13.14: identical event_id + payload is idempotent.
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        log.apply(goal_start())
        status, _ = log.apply(goal_start())
        self.assertEqual(status, "idempotent_noop")
        self.assertEqual(len(log.events), 1)

    def test_duplicate_event_id_different_payload_is_conflict(self):
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        log.apply(goal_start())
        with self.assertRaises(GuardFailure) as cm:
            log.apply(goal_start(goal="g2"))  # same id, different goal
        self.assertEqual(cm.exception.reason, R.EVENT_CONFLICT)

    def test_lower_or_duplicate_sequence_rejected(self):
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        log.apply(goal_start(seq=5, event_id="a"))
        with self.assertRaises(GuardFailure) as cm:
            log.apply(goal_start(seq=5, event_id="b", prev="a"))
        self.assertEqual(cm.exception.reason, R.OUT_OF_ORDER_EVENT)
        with self.assertRaises(GuardFailure):
            log.apply(goal_start(seq=4, event_id="c", prev="a"))

    def test_wrong_previous_event_id_rejected(self):
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        log.apply(goal_start(event_id="a"))
        with self.assertRaises(GuardFailure) as cm:
            log.apply(goal_end(event_id="b", prev="not-a"))
        self.assertEqual(cm.exception.reason, R.OUT_OF_ORDER_EVENT)

    def test_event_from_old_claim_generation_rejected(self):
        # WO bullet: delayed event from an old claim generation is rejected.
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        stale = goal_start()
        stale = LifecycleEvent(**{**stale.__dict__, "claim_generation": 1})
        log.apply(stale)
        old_gen = LifecycleEvent(**{**goal_end().__dict__, "claim_generation": 0})
        with self.assertRaises(GuardFailure) as cm:
            log.apply(old_gen)
        self.assertEqual(cm.exception.reason, R.STALE_CLAIM_GENERATION)

    def test_invalid_event_type_rejected(self):
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        bad = LifecycleEvent(
            task_id="ENV-COORD-002",
            claim_id="ENV-COORD-002-C1",
            claim_generation=1,
            goal_id="g1",
            event_type="PARTY",
            event_seq=1,
            event_id="x",
            previous_event_id="GENESIS",
        )
        with self.assertRaises(GuardFailure) as cm:
            log.apply(bad)
        self.assertEqual(cm.exception.reason, R.INVALID_EVENT_TYPE)

    def test_operation_outcome_requires_intent(self):
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        log.apply(goal_start())
        outcome = LifecycleEvent(
            task_id="ENV-COORD-002",
            claim_id="ENV-COORD-002-C1",
            claim_generation=1,
            goal_id="g1",
            event_type="OPERATION_OUTCOME",
            event_seq=2,
            event_id="o1",
            previous_event_id="e1",
            operation_id="op-1",
            operation_outcome="SUCCEEDED",
        )
        with self.assertRaises(GuardFailure) as cm:
            log.apply(outcome)
        self.assertEqual(cm.exception.reason, R.UNKNOWN_OPERATION)

    def test_unknown_outcome_blocks_until_reconciled(self):
        # §5.5/§13.17: UNKNOWN outcome → unresolved external operation.
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        log.apply(goal_start())
        log.apply(
            LifecycleEvent(
                task_id="ENV-COORD-002",
                claim_id="ENV-COORD-002-C1",
                claim_generation=1,
                goal_id="g1",
                event_type="OPERATION_INTENT",
                event_seq=2,
                event_id="o1",
                previous_event_id="e1",
                operation_id="op-1",
            )
        )
        log.apply(
            LifecycleEvent(
                task_id="ENV-COORD-002",
                claim_id="ENV-COORD-002-C1",
                claim_generation=1,
                goal_id="g1",
                event_type="OPERATION_OUTCOME",
                event_seq=3,
                event_id="o2",
                previous_event_id="o1",
                operation_id="op-1",
                operation_outcome="UNKNOWN",
            )
        )
        self.assertTrue(log.has_unresolved_external_operations)
        # duplicate terminal outcome for the same operation is a conflict
        with self.assertRaises(GuardFailure) as cm:
            log.apply(
                LifecycleEvent(
                    task_id="ENV-COORD-002",
                    claim_id="ENV-COORD-002-C1",
                    claim_generation=1,
                    goal_id="g1",
                    event_type="OPERATION_OUTCOME",
                    event_seq=4,
                    event_id="o3",
                    previous_event_id="o2",
                    operation_id="op-1",
                    operation_outcome="SUCCEEDED",
                )
            )
        self.assertEqual(cm.exception.reason, R.EVENT_CONFLICT)

    def test_succeeded_outcome_clears_unresolved(self):
        log = LifecycleLog("ENV-COORD-002-C1", 1)
        log.apply(goal_start())
        log.apply(
            LifecycleEvent(
                task_id="ENV-COORD-002",
                claim_id="ENV-COORD-002-C1",
                claim_generation=1,
                goal_id="g1",
                event_type="OPERATION_INTENT",
                event_seq=2,
                event_id="o1",
                previous_event_id="e1",
                operation_id="op-1",
            )
        )
        log.apply(
            LifecycleEvent(
                task_id="ENV-COORD-002",
                claim_id="ENV-COORD-002-C1",
                claim_generation=1,
                goal_id="g1",
                event_type="OPERATION_OUTCOME",
                event_seq=3,
                event_id="o2",
                previous_event_id="o1",
                operation_id="op-1",
                operation_outcome="SUCCEEDED",
            )
        )
        self.assertFalse(log.has_unresolved_external_operations)


# ─────────────────────────────────────────────────────────────────────────
# §4.2A admission gate
# ─────────────────────────────────────────────────────────────────────────
class TestAdmissionGate(unittest.TestCase):
    """§4.2A admissions; WO racing/refinement bullets."""

    def test_admit_and_complete(self):
        gate = AdmissionGate()
        self.assertEqual(gate.state, "OPEN")
        rec = gate.admit("op-1")
        self.assertEqual(rec["state"], "IN_FLIGHT")
        self.assertEqual(gate.active_admissions, 1)
        gate.record_effect("op-1", ADMISSION_COMPLETE)
        self.assertEqual(gate.active_admissions, 0)

    def test_duplicate_operation_rejected(self):
        gate = AdmissionGate()
        gate.admit("op-1")
        with self.assertRaises(GuardFailure) as cm:
            gate.admit("op-1")
        self.assertEqual(cm.exception.reason, R.DUPLICATE_OPERATION)

    def test_effect_for_unknown_operation(self):
        gate = AdmissionGate()
        with self.assertRaises(GuardFailure) as cm:
            gate.record_effect("nope", ADMISSION_COMPLETE)
        self.assertEqual(cm.exception.reason, R.UNKNOWN_OPERATION)

    def test_racing_admission_vs_gate_close_admitted_first_remains_tracked(self):
        # WO RED bullet: admitted-before-close remains tracked.
        gate = AdmissionGate()
        gate.admit("op-1")
        gate.close()
        self.assertEqual(gate.state, "CLOSED")
        self.assertEqual(gate.active_admissions, 1)  # still tracked
        # draining completes it; only then is the set empty
        gate.record_effect("op-1", ADMISSION_COMPLETE)
        self.assertEqual(gate.active_admissions, 0)

    def test_racing_admission_vs_gate_close_close_wins(self):
        # WO RED bullet: close wins → admission fails closed.
        gate = AdmissionGate()
        gate.close()
        with self.assertRaises(GuardFailure) as cm:
            gate.admit("op-1")
        self.assertEqual(cm.exception.reason, R.ADMISSION_GATE_CLOSED)
        self.assertEqual(gate.active_admissions, 0)

    def test_terminal_effect_is_idempotent_conflicting(self):
        gate = AdmissionGate()
        gate.admit("op-1")
        gate.record_effect("op-1", ADMISSION_FAILED)
        # identical re-record is a no-op
        gate.record_effect("op-1", ADMISSION_FAILED)
        # different outcome for the same admission is a conflict
        with self.assertRaises(GuardFailure) as cm:
            gate.record_effect("op-1", ADMISSION_COMPLETE)
        self.assertEqual(cm.exception.reason, R.EFFECT_CONFLICT)

    def test_effect_unknown_with_live_child_is_unresolved(self):
        # WO RED bullet: timed-out parent with live child remains undrained.
        gate = AdmissionGate()
        gate.admit("op-1")
        gate.record_effect("op-1", ADMISSION_UNKNOWN, child_alive=True)
        self.assertEqual(gate.active_admissions, 0)  # parent invocation ended
        self.assertTrue(gate.has_unresolved_effects)  # child still mutating
        self.assertEqual(gate.unresolved_child_operations, ("op-1",))

    def test_effect_unknown_without_live_child_is_still_unresolved(self):
        # PR #84 P1-1: every unreconciled EFFECT_UNKNOWN blocks — a live
        # child is an additional undrained condition, not the definition
        # of unresolved unknown.
        gate = AdmissionGate()
        gate.admit("op-1")
        gate.record_effect("op-1", ADMISSION_UNKNOWN, child_alive=False)
        self.assertTrue(gate.has_unresolved_effects)
        self.assertEqual(gate.unresolved_child_operations, ())  # no live child
        gate.reconcile_effect("op-1", ADMISSION_COMPLETE)
        self.assertFalse(gate.has_unresolved_effects)

    def test_effect_unknown_reconciled_child_dead(self):
        gate = AdmissionGate()
        gate.admit("op-1")
        gate.record_effect("op-1", ADMISSION_UNKNOWN, child_alive=True)
        gate.reconcile_effect("op-1", ADMISSION_COMPLETE, child_alive=False)
        self.assertFalse(gate.has_unresolved_effects)

    def test_admission_high_water_is_monotonic(self):
        gate = AdmissionGate()
        gate.admit("op-1")
        gate.admit("op-2")
        gate.record_effect("op-1", ADMISSION_COMPLETE)
        gate.record_effect("op-2", ADMISSION_COMPLETE)
        self.assertEqual(gate.active_admissions, 0)
        self.assertEqual(gate.admissions_high_water, 2)


# ─────────────────────────────────────────────────────────────────────────
# §4.2B quiesce/drain transfer barrier + Astra refinements
# ─────────────────────────────────────────────────────────────────────────
class TestTransferBarrier(unittest.TestCase):
    """§4.2B + WO Astra-refinement RED bullets."""

    def _barrier(self):
        barrier = TransferBarrier(
            claim_id="ENV-COORD-002-C1",
            claim_generation=1,
            holder_id="holder-A",
        )
        barrier.runtime.admit("op-x")
        barrier.runtime.record_effect("op-x", ADMISSION_COMPLETE)
        return barrier

    def test_begin_quiesce_closes_gate(self):
        b = self._barrier()
        self.assertEqual(b.state, "ACTIVE")
        b.begin_quiesce()
        self.assertEqual(b.state, "QUIESCING")
        self.assertEqual(b.runtime.gate.state, "CLOSED")

    def test_transfer_blocked_while_active_admissions(self):
        # WO RED bullet: transfer rejected while active_admissions > 0.
        b = TransferBarrier(claim_id="ENV-COORD-002-C1", claim_generation=1, holder_id="holder-A")
        b.runtime.admit("op-1")  # in flight
        b.begin_quiesce()
        att = b.holder_publish("holder-A", "att-1", latest_event_id="e9")
        self.assertIsNone(att)
        self.assertEqual(b.transfer_block_reason, R.TRANSFER_BLOCKED_ACTIVE_ADMISSIONS)
        self.assertEqual(b.state, "QUIESCING")

    def test_transfer_blocked_while_unresolved_child_alive(self):
        # WO RED bullet: timed-out parent with live child remains undrained
        # → transfer stays blocked.
        b = TransferBarrier(claim_id="ENV-COORD-002-C1", claim_generation=1, holder_id="holder-A")
        b.runtime.admit("op-1")
        b.runtime.record_effect("op-1", ADMISSION_UNKNOWN, child_alive=True)
        b.begin_quiesce()
        att = b.holder_publish("holder-A", "att-1", latest_event_id="e9")
        self.assertIsNone(att)
        self.assertEqual(b.transfer_block_reason, R.TRANSFER_BLOCKED_UNRESOLVED_EFFECTS)

    def test_transfer_blocked_while_unknown_without_live_child(self):
        # PR #84 P1-1 reproducer: UNKNOWN_NO_CHILD_ATTESTATION must not
        # reach TRANSFER_READY.
        b = TransferBarrier(claim_id="ENV-COORD-002-C1", claim_generation=1, holder_id="holder-A")
        b.runtime.admit("op-1")
        b.runtime.record_effect("op-1", ADMISSION_UNKNOWN, child_alive=False)
        b.begin_quiesce()
        att = b.holder_publish("holder-A", "att-1", latest_event_id="e9")
        self.assertIsNone(att)
        self.assertEqual(b.transfer_block_reason, R.TRANSFER_BLOCKED_UNRESOLVED_EFFECTS)
        self.assertEqual(b.state, "QUIESCING")
        # reconciliation clears the block and publication then succeeds
        b.runtime.reconcile_effect("op-1", ADMISSION_COMPLETE)
        att2 = b.holder_publish("holder-A", "att-1", latest_event_id="e9")
        self.assertIsNotNone(att2)
        self.assertEqual(b.state, "TRANSFER_READY")

    def test_holder_publishes_attestation_when_drained(self):
        b = self._barrier()
        b.begin_quiesce()
        att = b.holder_publish("holder-A", "att-1", latest_event_id="e9")
        self.assertIsNotNone(att)
        self.assertEqual(att["claim_id"], "ENV-COORD-002-C1")
        self.assertEqual(att["claim_generation"], 1)
        self.assertEqual(att["execution_holder_id"], "holder-A")
        self.assertEqual(att["latest_lifecycle_event_id"], "e9")
        self.assertEqual(att["admission_high_water"], 1)
        self.assertEqual(att["active_admissions"], 0)
        self.assertEqual(b.state, "TRANSFER_READY")

    def test_publish_requires_gate_closed(self):
        b = self._barrier()
        att = b.holder_publish("holder-A", "att-1", latest_event_id="e9")
        self.assertIsNone(att)
        self.assertEqual(b.transfer_block_reason, R.QUIESCENCE_PRECONDITIONS_UNMET)

    def test_non_holder_cannot_publish_quiescence(self):
        # WO acceptance #9: coordinator cannot fabricate quiescence when
        # holder evidence is missing.
        b = self._barrier()
        b.begin_quiesce()
        att = b.holder_publish("coordinator-B", "att-1", latest_event_id="e9")
        self.assertIsNone(att)
        self.assertEqual(b.transfer_block_reason, R.COORDINATOR_CANNOT_PUBLISH_QUIESCENCE)
        self.assertEqual(b.state, "QUIESCING")  # no fake TRANSFER_READY

    def test_lost_quiescence_publication_replay_is_idempotent(self):
        # WO RED bullet: lost/replayed quiescence evidence is idempotent or
        # rejected by event identity.
        b = self._barrier()
        b.begin_quiesce()
        att1 = b.holder_publish("holder-A", "att-1", latest_event_id="e9")
        self.assertIsNotNone(att1)
        # publication "lost"; holder republishes identical attestation
        att2 = b.holder_publish("holder-A", "att-1", latest_event_id="e9")
        self.assertEqual(att1, att2)
        self.assertEqual(b.state, "TRANSFER_READY")
        # replayed id with different payload is a conflict
        with self.assertRaises(GuardFailure) as cm:
            b.holder_publish("holder-A", "att-1", latest_event_id="e8")
        self.assertEqual(cm.exception.reason, R.EVENT_CONFLICT)

    def test_coordinator_interrupt_before_transfer_keeps_generation(self):
        # WO RED bullet: coordinator interruption before transfer leaves
        # generation unchanged.
        b = self._barrier()
        b.begin_quiesce()
        b.holder_publish("holder-A", "att-1", latest_event_id="e9")
        snap = b.coordinator_interrupt()
        self.assertEqual(snap["claim_generation"], 1)
        self.assertEqual(snap["execution_holder_id"], "holder-A")
        self.assertEqual(snap["state"], "TRANSFER_READY")
        # scope stays locked to holder A until an authorized transition
        d = b.complete_transfer(new_holder_id="holder-B")
        # PR #84 P1-2: TRANSFER_READY is not authority — the barrier must
        # not self-activate generation 2 as mutable.
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.TRANSFER_AWAITING_AUTHORIZED_TRANSITION)
        self.assertEqual(d.claim_generation, 2)  # proposed handoff bookkeeping
        self.assertEqual(b.state, "AWAITING_AUTHORIZATION")

    def test_complete_transfer_without_policy_never_grants_authority(self):
        # PR #84 P1-2 reproducer: LOCAL_TRANSFER_SAFE=True with empty
        # policy tuple must be impossible.
        b = self._barrier()
        b.begin_quiesce()
        b.holder_publish("holder-A", "att-1", latest_event_id="e9")
        d = b.complete_transfer(new_holder_id="holder-B")
        self.assertFalse(d.safe_to_mutate)
        self.assertEqual(d.reason, R.TRANSFER_AWAITING_AUTHORIZED_TRANSITION)
        # until authoritative activation, the new holder's gate stays closed
        self.assertEqual(b.state, "AWAITING_AUTHORIZATION")
        with self.assertRaises(GuardFailure) as cm:
            b.runtime.admit("op-new")
        self.assertEqual(cm.exception.reason, R.ADMISSION_GATE_CLOSED)

    def test_activation_with_trusted_policy_authorizes_new_generation(self):
        # §4.2B/§4.4: mutation under g+1 starts only when the authorized
        # claim transition exists on (trusted) main and revalidates.
        b = self._barrier()
        b.begin_quiesce()
        b.holder_publish("holder-A", "att-1", latest_event_id="e9")
        gen2_policy = load_policy(
            [base_claim(claim_generation=2, execution_holder_id="holder-B")]
        )
        d = b.complete_transfer(new_holder_id="holder-B", authorized_policy=gen2_policy)
        self.assertTrue(d.safe_to_mutate)
        self.assertIsNone(d.reason)
        self.assertEqual(d.claim_generation, 2)
        self.assertEqual(d.execution_holder_id, "holder-B")
        self.assertEqual(d.policy_revision, POLICY_REV)  # real tuple, not empty
        self.assertEqual(d.registry_hash, gen2_policy.registry_hash)
        self.assertEqual(b.state, "ACTIVE")
        rec = b.runtime.admit("op-new")  # activated holder may admit
        self.assertEqual(rec["state"], "IN_FLIGHT")

    def test_activation_rejects_policy_without_new_generation(self):
        b = self._barrier()
        b.begin_quiesce()
        b.holder_publish("holder-A", "att-1", latest_event_id="e9")
        stale_policy = load_policy()  # registry still at generation 1 / holder A
        with self.assertRaises(GuardFailure) as cm:
            b.complete_transfer(new_holder_id="holder-B", authorized_policy=stale_policy)
        self.assertEqual(cm.exception.reason, R.STALE_CLAIM_GENERATION)
        self.assertEqual(b.state, "AWAITING_AUTHORIZATION")

    def test_activation_rejects_wrong_holder_in_policy(self):
        b = self._barrier()
        b.begin_quiesce()
        b.holder_publish("holder-A", "att-1", latest_event_id="e9")
        wrong_holder_policy = load_policy(
            [base_claim(claim_generation=2, execution_holder_id="holder-C")]
        )
        with self.assertRaises(GuardFailure) as cm:
            b.complete_transfer(new_holder_id="holder-B", authorized_policy=wrong_holder_policy)
        self.assertEqual(cm.exception.reason, R.WRONG_EXECUTION_HOLDER)
        self.assertEqual(b.state, "AWAITING_AUTHORIZATION")

    def test_activate_transferred_claim_retries_after_failed_activation(self):
        b = self._barrier()
        b.begin_quiesce()
        b.holder_publish("holder-A", "att-1", latest_event_id="e9")
        d = b.complete_transfer(new_holder_id="holder-B")  # no policy yet
        self.assertFalse(d.safe_to_mutate)
        # coordinator refreshes policy after the authorized transition lands
        gen2_policy = load_policy(
            [base_claim(claim_generation=2, execution_holder_id="holder-B")]
        )
        activated = b.activate_transferred_claim(gen2_policy)
        self.assertTrue(activated.safe_to_mutate)
        self.assertEqual(b.state, "ACTIVE")
        with self.assertRaises(GuardFailure) as cm:
            b.activate_transferred_claim(gen2_policy)
        self.assertEqual(cm.exception.reason, R.TRANSFER_NOT_READY)

    def test_complete_transfer_requires_transfer_ready(self):
        b = self._barrier()  # still ACTIVE
        with self.assertRaises(GuardFailure) as cm:
            b.complete_transfer(new_holder_id="holder-B")
        self.assertEqual(cm.exception.reason, R.TRANSFER_NOT_READY)

    def test_complete_transfer_fenced_without_attestation(self):
        b = self._barrier()
        b.begin_quiesce()
        # no attestation published
        with self.assertRaises(GuardFailure) as cm:
            b.complete_transfer(new_holder_id="holder-B")
        self.assertEqual(cm.exception.reason, R.QUIESCENCE_PRECONDITIONS_UNMET)

    def test_second_holder_cannot_reuse_generation_after_transfer(self):
        # After transfer the generation is 2; the OLD holder's g1 context is
        # fenced by preflight (STALE_CLAIM_GENERATION) — covered elsewhere —
        # and the barrier itself refuses a second transfer from this state.
        b = self._barrier()
        b.begin_quiesce()
        b.holder_publish("holder-A", "att-1", latest_event_id="e9")
        gen2_policy = load_policy(
            [base_claim(claim_generation=2, execution_holder_id="holder-B")]
        )
        b.complete_transfer(new_holder_id="holder-B", authorized_policy=gen2_policy)
        self.assertEqual(b.state, "ACTIVE")
        self.assertEqual(b.claim_generation, 2)
        self.assertEqual(b.execution_holder_id, "holder-B")
        with self.assertRaises(GuardFailure) as cm:
            b.complete_transfer(new_holder_id="holder-C")
        self.assertEqual(cm.exception.reason, R.TRANSFER_NOT_READY)


class TestHolderRuntime(unittest.TestCase):
    """HolderRuntime = the one execution context that owns quiescence."""

    def test_runtime_holds_gate_and_identity(self):
        rt = HolderRuntime("holder-A")
        self.assertEqual(rt.holder_id, "holder-A")
        self.assertEqual(rt.gate.state, "OPEN")
        self.assertEqual(rt.active_admissions, 0)
        self.assertFalse(rt.has_unresolved_effects)


# ─────────────────────────────────────────────────────────────────────────
# §11.6 bootstrap truth: never claim ENFORCING
# ─────────────────────────────────────────────────────────────────────────
class TestEnforcementTruth(unittest.TestCase):
    """WO acceptance #8: core never reports ENFORCING while unverified."""

    def test_bootstrap_mode_passes_through(self):
        mode = effective_enforcement_mode("BOOTSTRAP_CONTROL", server_enforcement_verified=False)
        self.assertEqual(mode.mode, "BOOTSTRAP_CONTROL")
        self.assertIsNone(mode.reason)

    def test_shadow_mode_passes_through(self):
        mode = effective_enforcement_mode("SHADOW", server_enforcement_verified=False)
        self.assertEqual(mode.mode, "SHADOW")

    def test_enforcing_requires_server_verification(self):
        mode = effective_enforcement_mode("ENFORCING", server_enforcement_verified=False)
        self.assertEqual(mode.mode, "ENFORCEMENT_NOT_ACTIVE")
        self.assertEqual(mode.reason, R.SERVER_ENFORCEMENT_UNVERIFIED)

    def test_enforcing_with_verified_server_ok(self):
        mode = effective_enforcement_mode("ENFORCING", server_enforcement_verified=True)
        self.assertEqual(mode.mode, "ENFORCING")
        self.assertIsNone(mode.reason)

    def test_hardened_requires_verification_too(self):
        mode = effective_enforcement_mode("HARDENED", server_enforcement_verified=False)
        self.assertEqual(mode.mode, "ENFORCEMENT_NOT_ACTIVE")

    def test_unknown_mode_fails_closed(self):
        with self.assertRaises(GuardFailure) as cm:
            effective_enforcement_mode("ENFORCED_TRUST_ME", server_enforcement_verified=True)
        self.assertEqual(cm.exception.reason, R.INVALID_ENFORCEMENT_MODE)


# ─────────────────────────────────────────────────────────────────────────
# End-to-end: trusted text → preflight → scope decision
# ─────────────────────────────────────────────────────────────────────────
class TestEndToEnd(unittest.TestCase):
    """Full pipeline over a CURRENT-WORK.md-shaped trusted text."""

    def test_authoritative_claim_allows_only_its_four_paths(self):
        policy = load_policy()
        for path in base_claim()["mutable_scope"]:
            d = evaluate_mutation(policy, ok_ctx(), changes=[Change("modify", path)])
            self.assertTrue(d.safe_to_mutate, path)
        # every forbidden path is denied with FORBIDDEN_PATH
        for path in ("docs/ai/CURRENT-WORK.md", "AGENTS.md", ".github/workflows/x.yml", "data/raw/x.csv"):
            d = evaluate_mutation(policy, ok_ctx(), changes=[Change("modify", path)])
            self.assertFalse(d.safe_to_mutate, path)
            self.assertEqual(d.reason, R.FORBIDDEN_PATH, path)

    def test_decision_object_is_explicit_not_boolean_only(self):
        # capability #12: fail-closed reason codes, not ambiguous booleans.
        policy = load_policy()
        bad = evaluate_mutation(policy, ok_ctx(), changes=[Change("modify", "AGENTS.md")])
        self.assertIsInstance(bad, Decision)
        self.assertFalse(bad.safe_to_mutate)
        self.assertTrue(bad.reason)


# ─────────────────────────────────────────────────────────────────────────
# CLI — status / scope-check / validate-registry / validate-lifecycle
# ─────────────────────────────────────────────────────────────────────────
class TestCLI(unittest.TestCase):
    """§7 commands for this slice, exercised in pure no-git mode."""

    def run_cli(self, *args, stdin_text=None):
        proc = subprocess.run(
            [sys.executable, GUARD, *args],
            capture_output=True,
            text=True,
            env={**os.environ, "PYTHONIOENCODING": "utf-8"},
            input=stdin_text,
        )
        return proc

    def test_validate_registry_ok(self):
        with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as f:
            f.write(make_registry_text([base_claim()]))
            path = f.name
        try:
            proc = self.run_cli("validate-registry", "--file", path)
            self.assertEqual(proc.returncode, 0, proc.stderr)
            payload = json.loads(proc.stdout)
            self.assertTrue(payload["ok"])
            self.assertEqual(payload["claims"], 1)
            self.assertEqual(payload["enforcement_mode"], "BOOTSTRAP_CONTROL")
        finally:
            os.unlink(path)

    def test_validate_registry_malformed(self):
        with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as f:
            f.write("no registry here")
            path = f.name
        try:
            proc = self.run_cli("validate-registry", "--file", path)
            self.assertEqual(proc.returncode, 2)
            payload = json.loads(proc.stdout)
            self.assertFalse(payload["ok"])
            self.assertEqual(payload["reason"], R.REGISTRY_NOT_FOUND)
        finally:
            os.unlink(path)

    def test_scope_check_in_scope_exit_zero(self):
        with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as f:
            f.write(make_registry_text([base_claim()]))
            path = f.name
        try:
            proc = self.run_cli(
                "scope-check",
                "--task", "ENV-COORD-002",
                "--claim", "ENV-COORD-002-C1",
                "--generation", "1",
                "--holder", "zcode-env-coord-002-g1-primary",
                "--policy-revision", POLICY_REV,
                "--current-work-file", path,
                "--change", "modify", "scripts/env_coordination_guard.py",
            )
            self.assertEqual(proc.returncode, 0, proc.stderr)
            payload = json.loads(proc.stdout)
            self.assertTrue(payload["safe_to_mutate"])
            self.assertEqual(payload["reason"], None)
        finally:
            os.unlink(path)

    def test_scope_check_forbidden_exit_two(self):
        with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as f:
            f.write(make_registry_text([base_claim()]))
            path = f.name
        try:
            proc = self.run_cli(
                "scope-check",
                "--task", "ENV-COORD-002",
                "--claim", "ENV-COORD-002-C1",
                "--generation", "1",
                "--holder", "zcode-env-coord-002-g1-primary",
                "--policy-revision", POLICY_REV,
                "--current-work-file", path,
                "--change", "modify", "AGENTS.md",
            )
            self.assertEqual(proc.returncode, 2)
            payload = json.loads(proc.stdout)
            self.assertFalse(payload["safe_to_mutate"])
            self.assertEqual(payload["reason"], R.FORBIDDEN_PATH)
        finally:
            os.unlink(path)

    def test_scope_check_stale_generation(self):
        with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as f:
            f.write(make_registry_text([base_claim()]))
            path = f.name
        try:
            proc = self.run_cli(
                "scope-check",
                "--task", "ENV-COORD-002",
                "--claim", "ENV-COORD-002-C1",
                "--generation", "0",
                "--holder", "zcode-env-coord-002-g1-primary",
                "--policy-revision", POLICY_REV,
                "--current-work-file", path,
                "--change", "modify", "scripts/env_coordination_guard.py",
            )
            self.assertEqual(proc.returncode, 2)
            payload = json.loads(proc.stdout)
            self.assertEqual(payload["reason"], R.STALE_CLAIM_GENERATION)
        finally:
            os.unlink(path)

    def test_status_pure_mode(self):
        with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as f:
            f.write(make_registry_text([base_claim(), other_lane_claim()]))
            path = f.name
        try:
            proc = self.run_cli(
                "status", "--no-git", "--current-work-file", path, "--policy-revision", POLICY_REV
            )
            self.assertEqual(proc.returncode, 0, proc.stderr)
            payload = json.loads(proc.stdout)
            self.assertEqual(payload["policy_revision"], POLICY_REV)
            self.assertEqual(payload["enforcement_mode"], "BOOTSTRAP_CONTROL")
            self.assertEqual(payload["effective_enforcement_mode"], "BOOTSTRAP_CONTROL")
            self.assertEqual(len(payload["claims"]), 2)
            self.assertIn("ENV-COORD-002-C1", [c["claim_id"] for c in payload["claims"]])
        finally:
            os.unlink(path)

    def test_validate_lifecycle_happy_and_reject(self):
        events = [
            {
                "task_id": "ENV-COORD-002", "claim_id": "ENV-COORD-002-C1",
                "claim_generation": 1, "goal_id": "g1", "event_type": "GOAL_START",
                "event_seq": 1, "event_id": "e1", "previous_event_id": "GENESIS",
            },
            {
                "task_id": "ENV-COORD-002", "claim_id": "ENV-COORD-002-C1",
                "claim_generation": 1, "goal_id": "g1", "event_type": "GOAL_END",
                "event_seq": 2, "event_id": "e2", "previous_event_id": "e1",
                "terminal_result": "COMPLETED_VERIFIED", "published": True,
            },
        ]
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
            json.dump({"claim_id": "ENV-COORD-002-C1", "claim_generation": 1, "events": events}, f)
            ok_path = f.name
        bad_events = [dict(events[0]), dict(events[0], event_id="e1b", goal_id="g2", previous_event_id="e1", event_seq=2)]
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
            json.dump({"claim_id": "ENV-COORD-002-C1", "claim_generation": 1, "events": bad_events}, f)
            bad_path = f.name
        try:
            proc = self.run_cli("validate-lifecycle", "--file", ok_path)
            self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
            payload = json.loads(proc.stdout)
            self.assertTrue(payload["ok"])
            self.assertEqual(payload["applied"], 2)

            proc2 = self.run_cli("validate-lifecycle", "--file", bad_path)
            self.assertEqual(proc2.returncode, 2)
            payload2 = json.loads(proc2.stdout)
            self.assertFalse(payload2["ok"])
            self.assertEqual(payload2["reason"], R.UNTERMINATED_PREDECESSOR)
        finally:
            os.unlink(ok_path)
            os.unlink(bad_path)


if __name__ == "__main__":
    unittest.main(verbosity=2)
