#!/usr/bin/env python3
"""Deterministic synthetic tests for the ENV autonomy runtime."""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))

import env_autonomy_runtime as runtime
import env_coordination_guard as guard


def claim(
    task_id: str,
    claim_id: str,
    status: str,
    scope: list[str],
    *,
    generation: int = 1,
    holder: str | None = None,
) -> dict:
    return {
        "task_id": task_id,
        "claim_id": claim_id,
        "claim_generation": generation,
        "status": status,
        "owner_role": "synthetic_test",
        "execution_holder_id": holder or f"holder-{task_id}",
        "worktree": f"C:/worktrees/{task_id}",
        "branch": f"test/{task_id}",
        "base_sha": "a" * 40,
        "mutable_scope": scope,
        "forbidden_scope": [".env", "data/**"],
        "work_order_path": f"docs/work-orders/{task_id}.md",
        "handoff_path": f"docs/ai/handoffs/{task_id}.md",
        "review_owner": "independent reviewer",
        "dependencies": [],
        "last_checkpoint_pointer": f"docs/ai/handoffs/{task_id}.md",
        "one_next_safe_action": "synthetic test action",
    }


def policy(*claims: dict) -> guard.TrustedPolicy:
    return guard.TrustedPolicy(
        policy_revision="1" * 40,
        registry_hash="2" * 64,
        enforcement_mode="BOOTSTRAP_CONTROL",
        expected_policy_revision="1" * 40,
        claims=tuple(claims),
        shared_exceptions=(),
        raw_registry={"version": 1, "claims": list(claims)},
        raw_block="synthetic",
    )


def binding_for(claim_record: dict, head: str = "3" * 40, scope: list[str] | None = None) -> dict:
    return {
        "repo": runtime.REPO_SLUG,
        "worktree": claim_record["worktree"],
        "branch": claim_record["branch"],
        "base_sha": claim_record["base_sha"],
        "head_sha": head,
        "task_id": claim_record["task_id"],
        "work_order_path": claim_record["work_order_path"],
        "claim_id": claim_record["claim_id"],
        "claim_generation": claim_record["claim_generation"],
        "execution_holder_id": claim_record["execution_holder_id"],
        "scope": scope or ["scripts/env_autonomy_runtime.py"],
        "dependencies": [],
        "lane_kind": "MUTATION",
        "provider": "Codex",
        "model": "GPT-6 Luna MAX",
        "variant": "max",
        "run_id": "run-001",
    }


def lifecycle_event(
    task: str, claim_id: str, event_type: str, seq: int, event_id: str,
    previous: str, goal_id: str = "goal-1", **kwargs,
) -> guard.LifecycleEvent:
    return guard.LifecycleEvent(
        task_id=task,
        claim_id=claim_id,
        claim_generation=1,
        goal_id=goal_id,
        event_type=event_type,
        event_seq=seq,
        event_id=event_id,
        previous_event_id=previous,
        **kwargs,
    )


class ProviderAndRoutingTests(unittest.TestCase):
    def test_route_fit_enforces_model_task_boundaries(self):
        self.assertTrue(runtime.route_fit("GLM-5.3 MAX", "core_engineering", "MUTATION")["safe"])
        self.assertFalse(runtime.route_fit("GLM-5.3 Flash", "core_engineering", "MUTATION")["safe"])
        self.assertFalse(runtime.route_fit("JEV", "read_only_advisory", "MUTATION")["safe"])
        self.assertTrue(runtime.route_fit("JEV", "read_only_advisory", "READ_ONLY_ADVISORY")["safe"])
        self.assertFalse(runtime.route_fit("GPT-6 Sol", "independent_review", "MUTATION")["safe"])
        self.assertEqual(runtime.select_route("core_engineering")["dispatch_allowed"], False)
        self.assertEqual(runtime.select_route("core_engineering")["route_state"], "ADMISSION_REQUIRED")
        self.assertEqual(runtime.select_route("read_only_advisory")["route_state"], "UNAVAILABLE")

    def test_provider_quota_and_upstream_are_separate_fresh_gates(self):
        now = dt.datetime(2026, 9, 26, 4, 0, tzinfo=dt.timezone.utc)
        base = {
            "proxy_quota_status": "READY",
            "upstream_model_status": "READY",
            "proxy_quota_source": "synthetic-proxy-status",
            "upstream_source": "synthetic-model-probe",
            "provider": "cointh-glm",
            "model": "glm-5.3",
            "variant": "max",
            "checked_at_utc": "2026-09-26T03:59:00Z",
        }
        self.assertTrue(runtime.provider_admission(base, now=now)["safe"])
        flash = {**base, "variant": "flash"}
        self.assertTrue(runtime.provider_admission(flash, now=now)["safe"])
        same_source = {**base, "upstream_source": base["proxy_quota_source"]}
        self.assertEqual(runtime.provider_admission(same_source, now=now)["reason"], "PROVIDER_EVIDENCE_SOURCES_NOT_DISTINCT")
        wrong_model = {**base, "model": "glm-5.3-preview"}
        self.assertEqual(runtime.provider_admission(wrong_model, now=now)["reason"], "PROVIDER_ROUTE_UNSUPPORTED")
        unknown_quota = {**base, "proxy_quota_status": "UNKNOWN"}
        self.assertEqual(runtime.provider_admission(unknown_quota, now=now)["reason"], "PROXY_QUOTA_UNKNOWN")
        unknown_upstream = {**base, "upstream_model_status": "UNKNOWN"}
        self.assertEqual(runtime.provider_admission(unknown_upstream, now=now)["reason"], "UPSTREAM_MODEL_UNKNOWN")
        auth = {**base, "http_status": 403}
        self.assertEqual(runtime.provider_admission(auth, now=now)["reason"], "AUTH_OR_ENTITLEMENT")
        stale = {**base, "checked_at_utc": "2026-09-26T03:00:00Z"}
        self.assertEqual(runtime.provider_admission(stale, now=now)["reason"], "PROVIDER_EVIDENCE_STALE")
        upstream_down = {**base, "upstream_model_status": "UNAVAILABLE"}
        self.assertEqual(runtime.provider_admission(upstream_down, now=now)["reason"], "UPSTREAM_MODEL_NOT_READY")


class BindingAndSelectionTests(unittest.TestCase):
    def test_status_never_reports_server_enforcement_from_local_preflight(self):
        active = claim("ENV-AUTONOMY-001", "ENV-AUTONOMY-001-C1", "CLAIMED", ["scripts/**"])
        trusted = policy(active)
        actual = {
            "worktree": active["worktree"], "branch": active["branch"],
            "head_sha": "3" * 40, "claim_base_ancestor": True,
            "current_policy_ancestor": True,
        }
        with patch.object(runtime, "load_trusted_policy", return_value=(trusted, "synthetic")), \
             patch.object(runtime, "_actual_context", return_value=actual), \
             patch.object(runtime.guard, "preflight", return_value=SimpleNamespace(safe_to_mutate=True, reason=None)), \
             patch.object(runtime, "_emit", side_effect=lambda payload, exit_code=0: payload):
            result = runtime._cmd_status(argparse.Namespace(task=active["task_id"], root="."))
        self.assertEqual(result["server_enforcement_state"], runtime.guard.ENFORCEMENT_NOT_ACTIVE)
        self.assertEqual(result["autonomy_status"], "AUTONOMY_NOT_READY")

    def test_refill_command_reports_current_policy_identity(self):
        active = claim("ENV-AUTONOMY-001", "ENV-AUTONOMY-001-C1", "CLAIMED", ["scripts/**"])
        trusted = policy(active)
        with patch.object(runtime, "load_trusted_policy", return_value=(trusted, "synthetic current work")), \
             patch.object(runtime, "_refill_inputs", return_value=([], {})), \
             patch.object(runtime, "_emit", side_effect=lambda payload, exit_code=0: payload) as emit:
            result = runtime._cmd_refill(argparse.Namespace(root=".", active_reviews=0))
        self.assertEqual(result["policy_revision"], trusted.policy_revision)
        self.assertEqual(result["registry_hash"], trusted.registry_hash)
        emit.assert_called_once()

    def test_exact_identity_and_narrowed_scope_are_required(self):
        active = claim("ENV-AUTONOMY-001", "ENV-AUTONOMY-001-C1", "CLAIMED", ["scripts/**"])
        trusted = policy(active)
        actual = {
            "repo": runtime.REPO_SLUG,
            "worktree": active["worktree"],
            "branch": active["branch"],
            "head_sha": "3" * 40,
            "claim_base_ancestor": True,
            "current_policy_ancestor": True,
        }
        result = runtime.validate_lane_binding(trusted, binding_for(active), actual)
        self.assertEqual(result["claim_id"], active["claim_id"])

        stale = binding_for(active, head="4" * 40)
        with self.assertRaisesRegex(runtime.AutonomyFailure, "HEAD_MISMATCH"):
            runtime.validate_lane_binding(trusted, stale, actual)

        widened = binding_for(active, scope=["frontend/**"])
        with self.assertRaisesRegex(runtime.AutonomyFailure, "POLICY_CONTRADICTION"):
            runtime.validate_lane_binding(trusted, widened, actual)

        drifted = {**actual, "current_policy_ancestor": False}
        with self.assertRaisesRegex(runtime.AutonomyFailure, "CONTEXT_DRIFT"):
            runtime.validate_lane_binding(trusted, binding_for(active), drifted)

    def test_refill_requires_canonical_safe_ready_and_free_capacity(self):
        active = claim("ENV-AUTONOMY-001", "ENV-AUTONOMY-001-C1", "CLAIMED", ["scripts/**"])
        ready = claim("ENV-OPS-001A", "ENV-OPS-001A-C1", "READY", ["frontend/src/pages/Operations/**"])
        trusted = policy(active, ready)
        candidate = {
            "task_id": ready["task_id"],
            "work_order_path": ready["work_order_path"],
            "safe_ready": True,
            "source_refs": [runtime.ROADMAP, runtime.CURRENT_WORK, ready["work_order_path"]],
            "dependencies_satisfied": True,
            "production_dispatch_authorized": True,
            "scope": ready["mutable_scope"],
            "lane_kind": "MUTATION",
        }
        chosen = runtime.safe_refill_decision(trusted, [candidate], {})
        self.assertTrue(chosen["auto_refill_required"])
        self.assertEqual(chosen["selected_task_id"], ready["task_id"])
        self.assertIn("DO_NOT_CREATE_A_CLAIM", chosen["next_action"])

        paused = runtime.safe_refill_decision(trusted, [{**candidate, "production_dispatch_authorized": False}], {})
        self.assertFalse(paused["auto_refill_required"])

        full_policy = policy(
            active,
            claim("lane-2", "lane-2-c1", "IMPLEMENTING", ["docs/lane-2/**"]),
            claim("lane-3", "lane-3-c1", "VERIFYING", ["docs/lane-3/**"]),
            ready,
        )
        full = runtime.safe_refill_decision(full_policy, [candidate], {})
        self.assertEqual(full["reason"], "ACTIVE_WIP_FULL")

    def test_only_published_identity_bound_wait_releases_wip(self):
        active = claim("ENV-AUTONOMY-001", "ENV-AUTONOMY-001-C1", "WAITING_EXTERNAL", ["scripts/**"])
        active_2 = claim("lane-2", "lane-2-c1", "IMPLEMENTING", ["docs/lane-2/**"])
        active_3 = claim("lane-3", "lane-3-c1", "VERIFYING", ["docs/lane-3/**"])
        ready = claim("ENV-OPS-001A", "ENV-OPS-001A-C1", "READY", ["frontend/src/pages/Operations/**"])
        trusted = policy(active, active_2, active_3, ready)
        candidate = {
            "task_id": ready["task_id"], "work_order_path": ready["work_order_path"],
            "safe_ready": True, "source_refs": [runtime.ROADMAP, runtime.CURRENT_WORK, ready["work_order_path"]],
            "dependencies_satisfied": True, "production_dispatch_authorized": True,
            "scope": ready["mutable_scope"], "lane_kind": "MUTATION",
        }
        checkpoint = {
            "status": "WAITING_EXTERNAL", "published": True,
            "remote_head_sha": "5" * 40, "observed_remote_head_sha": "5" * 40,
            "claim_id": active["claim_id"], "claim_generation": 1,
            "execution_holder_id": active["execution_holder_id"],
        }
        result = runtime.safe_refill_decision(trusted, [candidate], {active["task_id"]: checkpoint})
        self.assertEqual(result["active_mutable_lanes"], 2)
        self.assertTrue(result["auto_refill_required"])
        self.assertEqual(result["waiting_external"], 1)
        self.assertEqual(result["safe_ready"], 1)
        self.assertEqual(result["unused_safe_capacity"], 1)

        unverified = {**checkpoint, "observed_remote_head_sha": "6" * 40}
        result = runtime.safe_refill_decision(trusted, [candidate], {active["task_id"]: unverified})
        self.assertEqual(result["active_mutable_lanes"], 3)
        self.assertFalse(runtime.safe_refill_decision(trusted, [candidate], {})["auto_refill_required"])

    def test_refill_uses_priority_order_and_reports_safe_ready_when_full(self):
        active = claim("active", "active-c1", "IMPLEMENTING", ["docs/active/**"])
        occupied = [
            active,
            claim("active-2", "active-2-c1", "CLAIMED", ["docs/active-2/**"]),
            claim("active-3", "active-3-c1", "VERIFYING", ["docs/active-3/**"]),
        ]
        p0 = claim("ENV-P0", "ENV-P0-C1", "READY", ["docs/p0/**"])
        p2 = claim("ENV-P2", "ENV-P2-C1", "READY", ["docs/p2/**"])
        trusted = policy(*occupied, p2, p0)

        def candidate(record, priority):
            return {
                "task_id": record["task_id"], "work_order_path": record["work_order_path"],
                "safe_ready": True, "source_refs": [runtime.ROADMAP, runtime.CURRENT_WORK, record["work_order_path"]],
                "dependencies_satisfied": True, "production_dispatch_authorized": True,
                "scope": record["mutable_scope"], "lane_kind": "MUTATION", "priority_rank": priority,
            }

        result = runtime.safe_refill_decision(trusted, [candidate(p2, 2), candidate(p0, 0)], {})
        self.assertFalse(result["auto_refill_required"])
        self.assertEqual(result["reason"], "ACTIVE_WIP_FULL")
        self.assertEqual(result["safe_ready"], 2)
        self.assertEqual(result["unused_safe_capacity"], 0)

    def test_canonical_frontier_rejects_dispatch_paused_task(self):
        state = runtime.canonical_candidate_state(
            "### ENV-OPS-001A - Operations board\n",
            "- **ENV-OPS-001A / READY BUT DISPATCH-PAUSED** - wait for coordination gates.\n",
            "# ENV-OPS-001A - Operations board\nStatus: READY\n",
            "ENV-OPS-001A",
        )
        self.assertFalse(state["safe_ready"])
        self.assertEqual(state["reason"], "CANONICAL_FRONTIER_BLOCKED")

    def test_canonical_frontier_requires_explicit_ready_status(self):
        roadmap = "### ENV-OPS-001A - Operations board\nP2 — SAFE / READY candidate\n"
        ready_order = "# ENV-OPS-001A - Operations board\nStatus: READY\n"
        ready_frontier = "- **ENV-OPS-001A / READY** - bounded task.\n"
        self.assertTrue(runtime.canonical_candidate_state(roadmap, ready_frontier, ready_order, "ENV-OPS-001A")["safe_ready"])
        prose_only = "- **ENV-OPS-001A / REVIEWING** - next READY task may follow.\n"
        result = runtime.canonical_candidate_state(roadmap, prose_only, ready_order, "ENV-OPS-001A")
        self.assertFalse(result["safe_ready"])
        self.assertEqual(result["reason"], "CANONICAL_FRONTIER_NOT_READY")


class ReviewAndLifecycleTests(unittest.TestCase):
    def test_published_checkpoint_must_describe_its_handoff_commit_parent(self):
        parent = "a" * 40
        self.assertTrue(runtime.checkpoint_source_matches_parent({"source_head_sha": parent}, parent))
        self.assertFalse(runtime.checkpoint_source_matches_parent({"source_head_sha": "b" * 40}, parent))
        self.assertFalse(runtime.checkpoint_source_matches_parent({"source_head_sha": parent}, "unknown"))

    def test_author_cannot_satisfy_independent_review(self):
        claim_record = claim("ENV-AUTONOMY-001", "ENV-AUTONOMY-001-C1", "CLAIMED", ["scripts/**"])
        author = {"run_id": "author-run", "session_id": "author-session"}
        review = {
            "verdict": "APPROVED", "reviewer_role": "independent_reviewer",
            "reviewed_head_sha": "7" * 40, "reviewer_run_id": "author-run",
            "reviewer_session_id": "author-session", "task_id": claim_record["task_id"],
            "claim_id": claim_record["claim_id"], "claim_generation": 1,
        }
        self.assertEqual(runtime.independent_review_gate(claim_record, author, review, "7" * 40)["reason"], "AUTHOR_CANNOT_SELF_REVIEW")
        independent = {**review, "reviewer_run_id": "review-run", "reviewer_session_id": "review-session"}
        self.assertTrue(runtime.independent_review_gate(claim_record, author, independent, "7" * 40)["approved"])
        self.assertEqual(runtime.independent_review_gate(claim_record, author, independent, "8" * 40)["reason"], "REVIEW_HEAD_MISMATCH")

    def test_existing_guard_lifecycle_unknown_effect_blocks_retry_until_reconciled(self):
        log = guard.LifecycleLog("ENV-AUTONOMY-001-C1", 1)
        events = [
            lifecycle_event("ENV-AUTONOMY-001", log.claim_id, "GOAL_START", 1, "e1", guard.GENESIS),
            lifecycle_event("ENV-AUTONOMY-001", log.claim_id, "OPERATION_INTENT", 2, "e2", "e1", operation_id="kilo-run-1"),
            lifecycle_event("ENV-AUTONOMY-001", log.claim_id, "OPERATION_OUTCOME", 3, "e3", "e2", operation_id="kilo-run-1", operation_outcome="UNKNOWN"),
        ]
        for event in events:
            log.apply(event)
        self.assertTrue(log.has_unresolved_external_operations)
        duplicate, _ = log.apply(events[-1])
        self.assertEqual(duplicate, "idempotent_noop")
        reconcile = lifecycle_event(
            "ENV-AUTONOMY-001", log.claim_id, "OPERATION_RECONCILED", 4, "e4", "e3",
            operation_id="kilo-run-1", operation_outcome="SUCCEEDED",
        )
        log.apply(reconcile)
        self.assertFalse(log.has_unresolved_external_operations)
        self.assertEqual(log.operation_record("kilo-run-1")["outcome"], "UNKNOWN")

    def test_handoff_event_write_is_pending_until_remote_publication(self):
        text = (
            "# Handoff\n\n"
            + runtime.LIFECYCLE_START
            + "\n```json\n"
            + json.dumps({"version": 1, "claim_id": "claim", "claim_generation": 1, "events": []})
            + "\n```\n"
            + runtime.LIFECYCLE_END
            + "\n"
        )
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "handoff.md"
            path.write_text(text, encoding="utf-8")
            event = guard.LifecycleEvent(
                task_id="task", claim_id="claim", claim_generation=1, goal_id="goal",
                event_type="GOAL_START", event_seq=1, event_id="start", previous_event_id=guard.GENESIS,
            )
            result = runtime.append_lifecycle_event(path, event.__dict__)
            self.assertEqual(result["checkpoint_state"], "PENDING_PUBLICATION")
            parsed, _ = runtime._lifecycle_document(path.read_text(encoding="utf-8"))
            self.assertEqual(parsed["events"][0]["event_id"], "start")

    def test_kilo_receipt_is_ordered_identity_bound_and_redacted(self):
        binding = {key: value for key, value in {
            "task_id": "task", "claim_id": "claim", "claim_generation": 1,
            "execution_holder_id": "holder", "worktree": "C:/work", "branch": "task",
            "base_sha": "a" * 40, "head_sha": "b" * 40, "provider": "cointh-glm",
            "model": "glm-5.3", "variant": "max", "run_id": "run-1",
        }.items()}
        receipt = {"binding": binding}
        digest = "d" * 64
        wrong_route = {"binding": {**binding, "provider": "other-provider"}}
        with self.assertRaisesRegex(runtime.AutonomyFailure, "KILO_ROUTE_UNSUPPORTED"):
            runtime.transition_kilo_receipt(wrong_route, "REQUESTED", {})
        bad_sha = {"binding": {**binding, "head_sha": "short"}}
        with self.assertRaisesRegex(runtime.AutonomyFailure, "KILO_RECEIPT_INVALID"):
            runtime.transition_kilo_receipt(bad_sha, "REQUESTED", {})
        receipt = runtime.transition_kilo_receipt(receipt, "REQUESTED", {})
        receipt = runtime.transition_kilo_receipt(receipt, "RESULT_WRITTEN", {"result_sha256": digest, "result_status": "SUCCEEDED"})
        self.assertNotIn("raw_output", receipt)
        with self.assertRaisesRegex(runtime.AutonomyFailure, "KILO_RAW_OUTPUT_FORBIDDEN"):
            runtime.transition_kilo_receipt(receipt, "INGESTED_TO_SSOT", {"verified_in_handoff": True, "nested": {"output": "private"}})
        with self.assertRaisesRegex(runtime.AutonomyFailure, "KILO_RECEIPT_NOT_INGESTED"):
            runtime.transition_kilo_receipt(receipt, "INGESTED_TO_SSOT", {"verified_in_handoff": True})
        ingested = runtime.transition_kilo_receipt(receipt, "INGESTED_TO_SSOT", {
            "verified_in_handoff": True, "handoff_event_id": "env-operation-outcome-1",
            "result_sha256": digest,
        })
        with self.assertRaisesRegex(runtime.AutonomyFailure, "KILO_RECEIPT_NOT_DURABLE"):
            runtime.transition_kilo_receipt(ingested, "ARCHIVED/CLEARED", {"published_checkpoint_sha": "not-a-sha"})
        archived = runtime.transition_kilo_receipt(ingested, "ARCHIVED/CLEARED", {"published_checkpoint_sha": "c" * 40})
        self.assertEqual(archived["state"], "ARCHIVED/CLEARED")


class HookClassifierTests(unittest.TestCase):
    def test_patch_path_parser_and_shell_classifier_fail_closed(self):
        patch_paths = runtime._parse_patch_paths("*** Begin Patch\n*** Update File: scripts/example.py\n*** End Patch")
        self.assertEqual(patch_paths, [("modify", "scripts/example.py", None)])
        self.assertEqual(runtime.classify_shell_command("git status --short")["kind"], "READ_ONLY")
        self.assertEqual(runtime.classify_shell_command("Set-Content docs/file.txt 'x'")["kind"], "UNKNOWN")
        self.assertEqual(runtime.classify_shell_command("git push origin branch --force")["reason"], "FORCE_PUSH_FORBIDDEN")
        self.assertEqual(runtime.classify_shell_command("git add -A")["action"], "add")
        self.assertEqual(runtime.classify_shell_command("Get-Content .env")["reason"], "PROTECTED_LOCAL_DATA_PATH")
        self.assertEqual(runtime.classify_shell_command("python -c 'print(1)' ; git status")["kind"], "UNKNOWN")
        self.assertEqual(runtime.classify_shell_command("Get-Content $(git status)")["reason"], "COMPOUND_SHELL_COMMAND_FORBIDDEN")
        self.assertEqual(runtime.classify_shell_command("rg token --no-ignore")["kind"], "UNKNOWN")
        self.assertEqual(runtime.classify_shell_command("rg token data --no-ignore-vcs")["kind"], "UNKNOWN")
        self.assertEqual(runtime.classify_shell_command("uv run python scripts/test_split_sql.py")["kind"], "READ_ONLY")
        self.assertEqual(runtime.classify_shell_command("git diff --check")["kind"], "READ_ONLY")


if __name__ == "__main__":
    unittest.main(verbosity=2)
