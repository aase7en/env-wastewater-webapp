#!/usr/bin/env python3
"""Deterministic synthetic tests for the ENV autonomy runtime."""
from __future__ import annotations

import argparse
import datetime as dt
import json
import subprocess
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

    def test_canonical_frontier_skips_registry_json_and_reads_human_ready_line(self):
        roadmap = "### ENV-OPS-001A - Operations board\nP2 — SAFE / READY candidate\n"
        current_work = '''
```json
{"coordination_registry":{"claims":[{"task_id":"ENV-OPS-001A","status":"READY"}]}}
```
- **ENV-OPS-001A / READY** - bounded operations board work.
'''
        work_order = "# ENV-OPS-001A - Operations board\nStatus: READY\n"
        state = runtime.canonical_candidate_state(
            roadmap, current_work, work_order, "ENV-OPS-001A"
        )
        self.assertTrue(state["safe_ready"])
        self.assertIsNone(state["reason"])

    def test_refill_inputs_keep_dispatch_paused_without_verified_server_mode(self):
        ready = claim("ENV-OPS-001A", "ENV-OPS-001A-C1", "READY", ["frontend/src/pages/Operations/**"])
        trusted = policy(ready)
        roadmap = "### ENV-OPS-001A - Operations board\nP2 — SAFE / READY candidate\n"
        current_work = (
            '{"claims":[{"task_id":"ENV-OPS-001A","status":"READY"}]}\n'
            "- **ENV-OPS-001A / READY** - bounded operations board work.\n"
        )
        work_order = "# ENV-OPS-001A - Operations board\nStatus: READY\n"

        def fake_git(args, _root, **_kwargs):
            ref = args[-1]
            if ref.endswith(runtime.ROADMAP):
                return roadmap
            if ref.endswith(ready["work_order_path"]):
                return work_order
            raise AssertionError(f"unexpected Git read: {ref}")

        with patch.object(runtime, "_run_git", side_effect=fake_git):
            with patch.object(runtime, "dependencies_satisfied", return_value=True):
                candidates, _ = runtime._refill_inputs(Path.cwd(), trusted, current_work)
        self.assertEqual(len(candidates), 1)
        self.assertFalse(candidates[0]["production_dispatch_authorized"])
        decision = runtime.safe_refill_decision(trusted, candidates, {})
        self.assertFalse(decision["auto_refill_required"])
        self.assertEqual(decision["safe_ready"], 0)

    def test_production_dispatch_requires_verified_enforcement(self):
        self.assertFalse(runtime._server_allows_production_dispatch("BOOTSTRAP_CONTROL", False))
        self.assertFalse(runtime._server_allows_production_dispatch("ENFORCING", False))
        self.assertFalse(runtime._server_allows_production_dispatch("ENFORCING", 1))
        self.assertFalse(runtime._server_allows_production_dispatch("SHADOW", True))
        self.assertTrue(runtime._server_allows_production_dispatch("ENFORCING", True))
        self.assertTrue(runtime._server_allows_production_dispatch("HARDENED", True))


class ReviewAndLifecycleTests(unittest.TestCase):
    def test_unknown_posttool_receipt_is_journaled_and_reconciled_in_same_handoff(self):
        with tempfile.TemporaryDirectory(prefix="env-hook-observation-") as temp_dir:
            root = Path(temp_dir)
            handoff_rel = "docs/ai/handoffs/ENV-AUTONOMY-001.md"
            handoff_path = root / handoff_rel
            handoff_path.parent.mkdir(parents=True)
            changed_path = root / "docs/changed.md"
            changed_path.parent.mkdir(parents=True, exist_ok=True)
            changed_path.write_text("after tool mutation\n", encoding="utf-8")
            test_claim = claim(
                "ENV-AUTONOMY-001", "ENV-AUTONOMY-001-C1", "CLAIMED", ["docs/changed.md"]
            )
            test_claim.update({"worktree": str(root), "branch": "test/hook-observation", "handoff_path": handoff_rel})
            lifecycle = {
                "version": 1, "task_id": test_claim["task_id"],
                "claim_id": test_claim["claim_id"], "claim_generation": 1,
                "goal_id": "goal-hook-1", "codex_hook_observations": [],
                "events": [{
                    "task_id": test_claim["task_id"], "claim_id": test_claim["claim_id"],
                    "claim_generation": 1, "goal_id": "goal-hook-1",
                    "event_type": "GOAL_START", "event_seq": 1,
                    "event_id": "hook-goal-start", "previous_event_id": guard.GENESIS,
                    "terminal_result": None, "operation_id": None,
                    "operation_outcome": None, "payload": None, "published": True,
                }],
            }
            handoff_path.write_text(
                "# Hook observation fixture\n\n" + runtime.LIFECYCLE_START + "\n```json\n"
                + json.dumps(lifecycle, indent=2) + "\n```\n" + runtime.LIFECYCLE_END + "\n",
                encoding="utf-8",
            )
            actual = {
                "repo": runtime.REPO_SLUG, "worktree": str(root),
                "branch": test_claim["branch"], "head_sha": "b" * 40,
                "claim_base_ancestor": True, "current_policy_ancestor": True,
            }
            trusted = policy(test_claim)
            with patch.object(runtime, "_actual_context", return_value=actual), \
                 patch.object(runtime, "validate_lane_binding"), \
                 patch.object(runtime.guard, "evaluate_mutation", return_value=SimpleNamespace(safe_to_mutate=True, reason=None)), \
                 patch.object(runtime, "_mutation_links", return_value=[]):
                recorded = []
                for index, response in enumerate((None, {"isError": True}), start=1):
                    observation = runtime.record_hook_observation(root, trusted, {
                        "tool_name": "Edit", "tool_input": {"file_path": str(changed_path)},
                        "tool_response": response, "session_id": "session-hook",
                        "turn_id": f"turn-{index}", "tool_use_id": f"tool-{index}",
                        "model": "GPT-6 Luna MAX", "hook_event_name": "PostToolUse",
                    })
                    self.assertEqual(observation["effect_state"], "UNKNOWN")
                    recorded.append(observation)

                text = handoff_path.read_text(encoding="utf-8")
                document, log = runtime._read_lifecycle_log(text, test_claim)
                self.assertTrue(log.has_unresolved_external_operations)
                self.assertTrue(runtime._has_unresolved_hook_observations(document, log))
                with patch.object(runtime, "load_trusted_policy", return_value=(trusted, "")), \
                     patch.object(runtime, "_run_git", return_value=str(root)):
                    blocked = runtime.hook_pretool({
                        "tool_name": "Edit", "tool_input": {"file_path": str(changed_path)},
                        "session_id": "session-hook", "turn_id": "turn-retry", "tool_use_id": "tool-retry",
                        "model": "GPT-6 Luna MAX",
                    }, root)
                self.assertEqual(blocked["permissionDecision"], "deny")
                self.assertEqual(blocked["reason"], "UNRESOLVED_EXTERNAL_EFFECT")
                for observation in recorded:
                    latest = log.events[-1]
                    runtime._append_lifecycle_event_to_document(document, {
                        "task_id": test_claim["task_id"], "claim_id": test_claim["claim_id"],
                        "claim_generation": 1, "goal_id": log.active_goal_id,
                        "event_type": "OPERATION_RECONCILED", "event_seq": latest.event_seq + 1,
                        "event_id": f"reconcile-{observation['tool_use_id']}",
                        "previous_event_id": log.head_event_id, "terminal_result": None,
                        "operation_id": observation["operation_id"],
                        "operation_outcome": "SUCCEEDED",
                        "payload": {"evidence_sha256": "e" * 64, "observed_at_utc": "2026-09-26T00:00:01Z"},
                        "published": False,
                    })
                    text = runtime._replace_lifecycle_block(text, document)
                    _, log = runtime._read_lifecycle_log(text, test_claim)
                self.assertFalse(log.has_unresolved_external_operations)
                self.assertFalse(runtime._has_unresolved_hook_observations(document, log))
                handoff_path.write_text(runtime._replace_lifecycle_block(text, document), encoding="utf-8")
                with patch.object(runtime, "load_trusted_policy", return_value=(trusted, "")), \
                     patch.object(runtime, "_run_git", return_value=str(root)):
                    allowed = runtime.hook_pretool({
                        "tool_name": "Edit", "tool_input": {"file_path": str(changed_path)},
                        "session_id": "session-hook", "turn_id": "turn-retry", "tool_use_id": "tool-retry",
                        "model": "GPT-6 Luna MAX",
                    }, root)
                self.assertEqual(allowed["permissionDecision"], "allow")

    def test_published_checkpoint_verifies_handoff_with_final_newline(self):
        with tempfile.TemporaryDirectory(prefix="env-autonomy-git-") as temp_dir:
            root = Path(temp_dir) / "work"
            remote = Path(temp_dir) / "origin.git"
            branch = "test/autonomy-checkpoint"

            def git(*args: str) -> str:
                result = subprocess.run(
                    ["git", *args], cwd=root, check=True, capture_output=True,
                    text=True, encoding="utf-8",
                )
                return result.stdout.strip()

            subprocess.run(
                ["git", "init", "--bare", str(remote)], check=True,
                capture_output=True, text=True,
            )
            root.mkdir()
            subprocess.run(
                ["git", "init", str(root)], check=True, capture_output=True, text=True
            )
            git("branch", "-M", branch)
            git("config", "user.name", "ENV autonomy test")
            git("config", "user.email", "env-autonomy-test@example.invalid")
            (root / "README.md").write_text("synthetic checkpoint fixture\n", encoding="utf-8")
            git("add", "README.md")
            git("commit", "-m", "fixture base")
            git("remote", "add", "origin", str(remote))
            git("push", "--set-upstream", "origin", branch)
            parent_sha = git("rev-parse", "HEAD")

            test_claim = claim("fixture-task", "fixture-claim", "PARKED", ["docs/**"])
            test_claim["branch"] = branch
            handoff_path = "docs/ai/handoffs/fixture-task.md"
            test_claim["handoff_path"] = handoff_path
            events = [
                {
                    "task_id": "fixture-task", "claim_id": "fixture-claim",
                    "claim_generation": 1, "goal_id": "goal-1",
                    "event_type": "GOAL_START", "event_seq": 1,
                    "event_id": "start-1", "previous_event_id": "GENESIS",
                    "terminal_result": None, "operation_id": None,
                    "operation_outcome": None, "payload": None, "published": True,
                },
                {
                    "task_id": "fixture-task", "claim_id": "fixture-claim",
                    "claim_generation": 1, "goal_id": "goal-1",
                    "event_type": "CHECKPOINT", "event_seq": 2,
                    "event_id": "checkpoint-1", "previous_event_id": "start-1",
                    "terminal_result": None, "operation_id": None,
                    "operation_outcome": None,
                    "payload": {
                        "lane_status": "PARKED", "recorded_at_utc": "2026-09-26T00:00:00Z",
                        "source_head_sha": parent_sha,
                    },
                    "published": True,
                },
            ]
            lifecycle = {
                "version": 1, "task_id": "fixture-task", "claim_id": "fixture-claim",
                "claim_generation": 1, "goal_id": "goal-1", "events": events,
                "codex_hook_observations": [],
            }
            handoff = (
                "# Synthetic handoff\n\n" + runtime.LIFECYCLE_START + "\n```json\n"
                + json.dumps(lifecycle, indent=2) + "\n```\n"
                + runtime.LIFECYCLE_END + "\n"
            )
            path = root / handoff_path
            path.parent.mkdir(parents=True)
            path.write_text(handoff, encoding="utf-8")
            git("add", handoff_path)
            git("commit", "-m", "fixture published checkpoint")
            git("push", "origin", branch)

            result = runtime.verify_published_checkpoint(root, policy(test_claim), test_claim)
            self.assertTrue(result["ok"], result)
            self.assertEqual(result["checkpoint_state"], "PUBLISHED")
            self.assertEqual(result["latest_event_id"], "checkpoint-1")
            self.assertIsNotNone(runtime.read_published_lane_checkpoint(root, test_claim))

            operation_id = "codex-hook-fixture-unknown"
            document, _ = runtime._lifecycle_document(path.read_text(encoding="utf-8"))
            document["codex_hook_observations"].append({
                "tool_use_id": "tool-unknown", "operation_id": operation_id,
                "effect_state": "UNKNOWN",
            })

            def append_event(event_type, event_id, *, outcome=None, payload=None):
                text = runtime._replace_lifecycle_block(path.read_text(encoding="utf-8"), document)
                _, log = runtime._read_lifecycle_log(text, test_claim)
                latest = log.events[-1]
                return runtime._append_lifecycle_event_to_document(document, {
                    "task_id": test_claim["task_id"], "claim_id": test_claim["claim_id"],
                    "claim_generation": test_claim["claim_generation"], "goal_id": log.active_goal_id,
                    "event_type": event_type, "event_seq": latest.event_seq + 1,
                    "event_id": event_id, "previous_event_id": log.head_event_id,
                    "terminal_result": None,
                    "operation_id": operation_id if event_type.startswith("OPERATION_") else None,
                    "operation_outcome": outcome, "payload": payload, "published": False,
                })

            append_event("OPERATION_INTENT", "intent-unknown", payload={
                "provider": "codex-cli", "model": "GPT-6 Sol", "variant": "post-tool-hook",
                "run_id": "codex:session:turn:tool-unknown",
                "admission_evidence_sha256": "e" * 64, "starting_head_sha": git("rev-parse", "HEAD"),
            })
            append_event("OPERATION_OUTCOME", "outcome-unknown", outcome="UNKNOWN", payload={
                "evidence_sha256": "f" * 64, "observed_at_utc": "2026-09-26T00:01:00Z",
            })
            parent_sha = git("rev-parse", "HEAD")
            append_event("CHECKPOINT", "checkpoint-after-unknown", payload={
                "lane_status": "PARKED", "recorded_at_utc": "2026-09-26T00:02:00Z",
                "source_head_sha": parent_sha,
            })
            path.write_text(runtime._replace_lifecycle_block(path.read_text(encoding="utf-8"), document), encoding="utf-8")
            git("add", handoff_path)
            git("commit", "-m", "fixture unresolved hook effect")
            git("push", "origin", branch)
            blocked = runtime.verify_published_checkpoint(root, policy(test_claim), test_claim)
            self.assertFalse(blocked["ok"])
            self.assertEqual(blocked["reason"], "UNRESOLVED_HOOK_OBSERVATION")
            self.assertIsNone(runtime.read_published_lane_checkpoint(root, test_claim))

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

    def test_kilo_receipt_is_persisted_from_trusted_published_handoff(self):
        with tempfile.TemporaryDirectory(prefix="env-kilo-receipt-") as temp_dir:
            root = Path(temp_dir) / "work"
            remote = Path(temp_dir) / "origin.git"
            branch = "test/kilo-receipt"

            def git(*args: str) -> str:
                result = subprocess.run(
                    ["git", *args], cwd=root, check=True, capture_output=True,
                    text=True, encoding="utf-8",
                )
                return result.stdout.strip()

            subprocess.run(["git", "init", "--bare", str(remote)], check=True, capture_output=True)
            root.mkdir()
            subprocess.run(["git", "init", str(root)], check=True, capture_output=True)
            git("branch", "-M", branch)
            git("config", "user.name", "ENV receipt test")
            git("config", "user.email", "env-receipt-test@example.invalid")
            (root / "README.md").write_text("synthetic receipt fixture\n", encoding="utf-8")
            git("add", "README.md")
            git("commit", "-m", "receipt fixture base")
            test_claim = claim(
                "ENV-AUTONOMY-001", "ENV-AUTONOMY-001-C1", "CLAIMED",
                ["docs/ai/handoffs/ENV-AUTONOMY-001.md"],
            )
            test_claim.update({
                "worktree": str(root), "branch": branch, "base_sha": git("rev-parse", "HEAD"),
                "handoff_path": "docs/ai/handoffs/ENV-AUTONOMY-001.md",
            })
            git("remote", "add", "origin", str(remote))
            git("push", "--set-upstream", "origin", branch)
            base_sha = test_claim["base_sha"]
            lifecycle = {
                "version": 1,
                "task_id": test_claim["task_id"],
                "claim_id": test_claim["claim_id"],
                "claim_generation": test_claim["claim_generation"],
                "goal_id": "goal-kilo-1",
                "events": [
                    {
                        "task_id": test_claim["task_id"], "claim_id": test_claim["claim_id"],
                        "claim_generation": 1, "goal_id": "goal-kilo-1",
                        "event_type": "GOAL_START", "event_seq": 1,
                        "event_id": "kilo-goal-start", "previous_event_id": guard.GENESIS,
                        "terminal_result": None, "operation_id": None,
                        "operation_outcome": None, "payload": None, "published": True,
                    },
                    {
                        "task_id": test_claim["task_id"], "claim_id": test_claim["claim_id"],
                        "claim_generation": 1, "goal_id": "goal-kilo-1",
                        "event_type": "CHECKPOINT", "event_seq": 2,
                        "event_id": "kilo-checkpoint-1", "previous_event_id": "kilo-goal-start",
                        "terminal_result": None, "operation_id": None,
                        "operation_outcome": None,
                        "payload": {"lane_status": "ACTIVE", "source_head_sha": base_sha,
                                    "recorded_at_utc": "2026-09-26T00:00:00Z"},
                        "published": True,
                    },
                ],
                "codex_hook_observations": [],
                "kilo_receipts": [],
            }
            handoff_path = root / test_claim["handoff_path"]
            handoff_path.parent.mkdir(parents=True)
            handoff_path.write_text(
                "# Kilo receipt fixture\n\n" + runtime.LIFECYCLE_START + "\n```json\n"
                + json.dumps(lifecycle, indent=2) + "\n```\n" + runtime.LIFECYCLE_END + "\n",
                encoding="utf-8",
            )
            git("add", test_claim["handoff_path"])
            git("commit", "-m", "publish initial receipt checkpoint")
            git("push", "origin", branch)
            trusted = policy(test_claim)

            def actual_context(_root, _claim):
                return {
                    "repo": runtime.REPO_SLUG, "worktree": str(root), "branch": branch,
                    "head_sha": git("rev-parse", "HEAD"),
                    "claim_base_ancestor": True, "current_policy_ancestor": True,
                }

            def publish(message):
                git("add", test_claim["handoff_path"])
                git("commit", "-m", message)
                git("push", "origin", branch)

            def pretool(command: str, turn_id: str):
                with patch.object(runtime, "load_trusted_policy", return_value=(trusted, "")), \
                     patch.object(runtime, "_actual_context", side_effect=actual_context), \
                     patch.object(runtime, "validate_lane_binding"), \
                     patch.object(runtime.guard, "evaluate_mutation", return_value=SimpleNamespace(
                         safe_to_mutate=True, reason=None
                     )), \
                     patch.object(runtime, "_mutation_links", return_value=[]):
                    return runtime.hook_pretool({
                        "tool_name": "Bash", "tool_input": {"command": command},
                        "session_id": "session-kilo", "turn_id": turn_id,
                        "tool_use_id": f"tool-{turn_id}", "model": "GPT-6 Luna MAX",
                    }, root)

            run_id = "kilo-run-001"

            def ready_preflight(_root, model, variant):
                digest = "a" * 64 if variant == "max" else "b" * 64
                return {
                    "verified": True, "adapter_status": "READY",
                    "proxy_quota_status": "READY", "upstream_model_status": "READY",
                    "external_call_started": False, "provider": "cointh-glm",
                    "model": model, "variant": variant, "evidence_sha256": digest,
                    "observed_at_utc": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
                }

            def append_event(event_type, event_id, *, operation_id=None, outcome=None, payload=None):
                text = handoff_path.read_text(encoding="utf-8")
                document, log = runtime._read_lifecycle_log(text, test_claim)
                latest = log.events[-1]
                runtime._append_lifecycle_event_to_document(document, {
                    "task_id": test_claim["task_id"], "claim_id": test_claim["claim_id"],
                    "claim_generation": 1, "goal_id": log.active_goal_id,
                    "event_type": event_type, "event_seq": latest.event_seq + 1,
                    "event_id": event_id, "previous_event_id": log.head_event_id,
                    "terminal_result": None, "operation_id": operation_id,
                    "operation_outcome": outcome, "payload": payload, "published": False,
                })
                handoff_path.write_text(runtime._replace_lifecycle_block(text, document), encoding="utf-8")

            with patch.object(runtime, "_actual_context", side_effect=actual_context):
                with self.assertRaisesRegex(runtime.AutonomyFailure, "KILO_OPERATION_EVIDENCE_INVALID"):
                    runtime.transition_kilo_receipt(root, trusted, "caller-claimed-run", "REQUESTED")

                append_event("OPERATION_INTENT", "kilo-intent-1", operation_id=run_id, payload={
                    "provider": "cointh-glm", "model": "glm-5.3", "variant": "max",
                    "run_id": run_id, "admission_evidence_sha256": "a" * 64,
                    "starting_head_sha": base_sha,
                    "work_order_path": test_claim["work_order_path"],
                    "scope": list(test_claim["mutable_scope"]),
                    "dependencies": list(test_claim["dependencies"]),
                    "lane_kind": "MUTATION",
                })
                publish("publish operation intent")
                request_command = (
                    "python scripts/env_autonomy_runtime.py kilo-receipt-transition "
                    f"--run-id {run_id} --next-state REQUESTED"
                )
                self.assertEqual(pretool(request_command, "request")["permissionDecision"], "allow")
                with self.assertRaisesRegex(runtime.AutonomyFailure, "KILO_ADMISSION_UNVERIFIED"):
                    runtime.transition_kilo_receipt(root, trusted, run_id, "REQUESTED")
                with patch.object(runtime, "_kilo_preflight_snapshot", side_effect=ready_preflight):
                    requested = runtime.transition_kilo_receipt(root, trusted, run_id, "REQUESTED")
                self.assertEqual(requested["state"], "REQUESTED")
                publish("persist requested receipt")
                outcome_command = (
                    "python scripts/env_autonomy_runtime.py append-event --event-type OPERATION_OUTCOME "
                    f"--operation-id {run_id} --operation-outcome SUCCEEDED --evidence-sha256 {'d' * 64}"
                )
                self.assertEqual(pretool(outcome_command, "outcome")["permissionDecision"], "allow")
                self.assertEqual(
                    pretool(outcome_command.replace(run_id, "different-run"), "wrong-outcome")["permissionDecision"],
                    "deny",
                )
                with patch.object(
                    runtime, "_kilo_preflight_snapshot",
                    side_effect=AssertionError("historical receipt verification must not re-probe admission"),
                ):
                    recovered = runtime.verify_kilo_receipt(root, trusted, run_id)
                self.assertEqual(recovered["state"], "REQUESTED")
                self.assertEqual(recovered["admission_evidence_state"], "VERIFIED_AT_REQUEST_TIME")
                self.assertEqual(recovered["admission_evidence_sha256"], "a" * 64)
                request_doc, request_log = runtime._read_lifecycle_log(
                    handoff_path.read_text(encoding="utf-8"), test_claim
                )
                request_intent, request_outcome = runtime._kilo_operation_events(request_log, run_id)
                request_binding = runtime._trusted_kilo_binding(
                    root, test_claim, actual_context(root, test_claim), run_id, request_intent
                )
                persisted_admission = request_doc["kilo_receipts"][0]["last_evidence"]["admission"]
                self.assertEqual(persisted_admission["proxy_quota_status"], "READY")
                self.assertEqual(persisted_admission["upstream_model_status"], "READY")
                self.assertEqual(persisted_admission["evidence_sha256"], "a" * 64)
                self.assertEqual(request_binding["work_order_path"], test_claim["work_order_path"])
                self.assertEqual(request_binding["scope"], test_claim["mutable_scope"])
                self.assertEqual(request_binding["dependencies"], test_claim["dependencies"])
                self.assertEqual(request_binding["lane_kind"], "MUTATION")
                request_intent.payload["scope"] = ["docs/**"]
                with self.assertRaisesRegex(runtime.AutonomyFailure, "KILO_RECEIPT_IDENTITY_MISMATCH"):
                    runtime._trusted_kilo_binding(
                        root, test_claim, actual_context(root, test_claim), run_id, request_intent
                    )
                request_intent.payload["scope"] = list(test_claim["mutable_scope"])
                forged_request = json.loads(json.dumps(request_doc["kilo_receipts"][0]))
                forged_request["last_evidence"]["operation_intent_event_id"] = "caller-invented-event"
                with self.assertRaisesRegex(runtime.AutonomyFailure, "KILO_RECEIPT_RECORD_INVALID"):
                    runtime._validate_persisted_kilo_receipt(
                        forged_request, request_binding, request_intent, request_outcome, request_log
                    )
                forged_admission = json.loads(json.dumps(request_doc["kilo_receipts"][0]))
                forged_admission["last_evidence"]["admission"]["evidence_sha256"] = "c" * 64
                with self.assertRaisesRegex(runtime.AutonomyFailure, "KILO_RECEIPT_RECORD_INVALID"):
                    runtime._validate_persisted_kilo_receipt(
                        forged_admission, request_binding, request_intent, request_outcome, request_log
                    )

                digest = "d" * 64
                append_event("OPERATION_OUTCOME", "kilo-outcome-1", operation_id=run_id,
                             outcome="SUCCEEDED", payload={"evidence_sha256": digest,
                                                           "observed_at_utc": "2026-09-26T00:01:00Z"})
                publish("publish operation result")
                with self.assertRaisesRegex(runtime.AutonomyFailure, "KILO_RESULT_NOT_IN_HANDOFF"):
                    runtime.transition_kilo_receipt(
                        root, trusted, run_id, "RESULT_WRITTEN", result_sha256="f" * 64,
                        result_status="SUCCEEDED",
                    )
                written = runtime.transition_kilo_receipt(
                    root, trusted, run_id, "RESULT_WRITTEN", result_sha256=digest,
                    result_status="SUCCEEDED",
                )
                self.assertEqual(written["state"], "RESULT_WRITTEN")
                publish("persist result receipt")
                ingested = runtime.transition_kilo_receipt(root, trusted, run_id, "INGESTED_TO_SSOT")
                self.assertEqual(ingested["state"], "INGESTED_TO_SSOT")
                publish("persist ingested receipt")
                self.assertEqual(runtime.verify_kilo_receipt(root, trusted, run_id)["state"], "INGESTED_TO_SSOT")

                archived = runtime.transition_kilo_receipt(root, trusted, run_id, "ARCHIVED/CLEARED")
                self.assertEqual(archived["publication_state"], "PENDING_PUBLICATION")
                publish("publish archived receipt checkpoint")
                verified = runtime.verify_kilo_receipt(root, trusted, run_id)
                self.assertTrue(verified["ok"], verified)
                self.assertEqual(verified["state"], "ARCHIVED/CLEARED")
                archive_doc, archive_log = runtime._read_lifecycle_log(
                    handoff_path.read_text(encoding="utf-8"), test_claim
                )
                archive_intent, archive_outcome = runtime._kilo_operation_events(archive_log, run_id)
                archive_binding = runtime._trusted_kilo_binding(
                    root, test_claim, actual_context(root, test_claim), run_id, archive_intent
                )
                forged_archive = json.loads(json.dumps(archive_doc["kilo_receipts"][0]))
                forged_archive["last_evidence"]["archive_checkpoint_source_sha"] = "f" * 40
                with self.assertRaisesRegex(runtime.AutonomyFailure, "KILO_RECEIPT_NOT_DURABLE"):
                    runtime._validate_persisted_kilo_receipt(
                        forged_archive, archive_binding, archive_intent, archive_outcome, archive_log
                    )
                stored = json.loads(json.dumps(runtime._lifecycle_document(
                    handoff_path.read_text(encoding="utf-8")
                )[0]))
                self.assertNotIn("raw_output", json.dumps(stored))
                with self.assertRaises(TypeError):
                    runtime.transition_kilo_receipt(
                        root, trusted, run_id, "ARCHIVED/CLEARED", verified_in_handoff=True
                    )

                unknown_run = "kilo-run-unknown"
                append_event("OPERATION_INTENT", "kilo-intent-unknown", operation_id=unknown_run, payload={
                    "provider": "cointh-glm", "model": "glm-5.3", "variant": "flash",
                    "run_id": unknown_run, "admission_evidence_sha256": "b" * 64,
                    "starting_head_sha": git("rev-parse", "HEAD"),
                    "work_order_path": test_claim["work_order_path"],
                    "scope": list(test_claim["mutable_scope"]),
                    "dependencies": list(test_claim["dependencies"]),
                    "lane_kind": "MUTATION",
                })
                publish("publish second operation intent")
                with patch.object(runtime, "_kilo_preflight_snapshot", side_effect=ready_preflight):
                    runtime.transition_kilo_receipt(root, trusted, unknown_run, "REQUESTED")
                publish("persist second requested receipt")
                unknown_digest = "e" * 64
                append_event("OPERATION_OUTCOME", "kilo-outcome-unknown", operation_id=unknown_run,
                             outcome="UNKNOWN", payload={"evidence_sha256": unknown_digest,
                                                           "observed_at_utc": "2026-09-26T00:02:00Z"})
                publish("publish unknown operation result")
                runtime.transition_kilo_receipt(
                    root, trusted, unknown_run, "RESULT_WRITTEN",
                    result_sha256=unknown_digest, result_status="UNKNOWN",
                )
                publish("persist unknown result receipt")
                unresolved = runtime.verify_kilo_receipt(root, trusted, unknown_run)
                self.assertFalse(unresolved["ok"])
                self.assertEqual(unresolved["reason"], "UNRESOLVED_EXTERNAL_OPERATION")
                with self.assertRaisesRegex(runtime.AutonomyFailure, "UNRESOLVED_EXTERNAL_OPERATION"):
                    runtime.transition_kilo_receipt(root, trusted, unknown_run, "INGESTED_TO_SSOT")

                append_event("OPERATION_RECONCILED", "kilo-reconciled-unknown", operation_id=unknown_run,
                             outcome="SUCCEEDED", payload={"evidence_sha256": "c" * 64,
                                                            "observed_at_utc": "2026-09-26T00:03:00Z"})
                publish("publish operation reconciliation")
                runtime.transition_kilo_receipt(root, trusted, unknown_run, "INGESTED_TO_SSOT")
                publish("persist reconciled result receipt")
                runtime.transition_kilo_receipt(root, trusted, unknown_run, "ARCHIVED/CLEARED")
                publish("publish reconciled archived receipt")
                reconciled = runtime.verify_kilo_receipt(root, trusted, unknown_run)
                self.assertTrue(reconciled["ok"], reconciled)
                self.assertEqual(reconciled["state"], "ARCHIVED/CLEARED")


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
        self.assertEqual(runtime.classify_shell_command("git branch --show-current")["kind"], "READ_ONLY")
        self.assertEqual(runtime.classify_shell_command("git show HEAD:README.md")["kind"], "READ_ONLY")
        self.assertNotEqual(runtime.classify_shell_command("git diff")["kind"], "READ_ONLY")
        self.assertNotEqual(runtime.classify_shell_command("git show HEAD")["kind"], "READ_ONLY")
        self.assertNotEqual(runtime.classify_shell_command("git show HEAD:../README.md")["kind"], "READ_ONLY")
        self.assertNotEqual(runtime.classify_shell_command("git log --oneline")["kind"], "READ_ONLY")
        self.assertEqual(runtime.classify_shell_command("git fetch origin main")["kind"], "GIT_FETCH")
        self.assertEqual(
            runtime.classify_shell_command(
                "python scripts/env_autonomy_runtime.py kilo-receipt-transition --run-id run-1 --next-state REQUESTED"
            )["kind"],
            "AUTONOMY_EVENT",
        )
        self.assertEqual(
            runtime.classify_shell_command(
                "python scripts/env_autonomy_runtime.py kilo-receipt-verify --run-id run-1"
            )["kind"],
            "READ_ONLY",
        )

    def test_mutating_git_read_subcommands_are_denied_before_preflight_bypass(self):
        commands = (
            "git branch -D codex/other-lane",
            "git branch --delete codex/other-lane",
            "git diff --output=docs/ai/CURRENT-WORK.md",
            "git diff -o docs/ai/CURRENT-WORK.md",
            "git show --output=docs/ai/CURRENT-WORK.md HEAD",
            "git show HEAD --output docs/ai/CURRENT-WORK.md",
            "git log --output=docs/ai/CURRENT-WORK.md",
            "git show HEAD",
            "git status --output=docs/ai/CURRENT-WORK.md",
            "git fetch origin",
            "rg --pre touch pattern .",
            "rg --pre=touch pattern .",
        )
        for command in commands:
            with self.subTest(command=command):
                classified = runtime.classify_shell_command(command)
                self.assertNotEqual(classified["kind"], "READ_ONLY")
                decision = runtime.hook_pretool(
                    {"tool_name": "Bash", "tool_input": {"command": command}}, Path.cwd()
                )
                self.assertEqual(decision["permissionDecision"], "deny")

    def test_protected_path_wildcards_are_denied_before_read_only_hook_bypass(self):
        commands = (
            "Get-Content .e??",
            "Select-String -Path .e?? -Pattern x",
            "Get-Content data/r??/*",
        )
        for command in commands:
            with self.subTest(command=command):
                self.assertNotEqual(runtime.classify_shell_command(command)["kind"], "READ_ONLY")
                decision = runtime.hook_pretool(
                    {"tool_name": "Bash", "tool_input": {"command": command}}, Path.cwd()
                )
                self.assertEqual(decision["permissionDecision"], "deny")

    def test_literal_shell_reads_must_resolve_inside_unprotected_repo_paths(self):
        with tempfile.TemporaryDirectory(prefix="env-autonomy-shell-read-") as temp_dir:
            root = Path(temp_dir)
            (root / "docs").mkdir()
            (root / "docs" / "note.md").write_text("synthetic fixture", encoding="utf-8")
            safe_commands = (
                "Get-Content docs/note.md",
                "Select-String -Path docs/note.md -Pattern synthetic",
            )
            for command in safe_commands:
                with self.subTest(command=command):
                    decision = runtime.hook_pretool(
                        {"tool_name": "Bash", "tool_input": {"command": command}}, root
                    )
                    self.assertEqual(decision["permissionDecision"], "allow")

            unsafe_commands = (
                "Get-Content ../outside.txt",
                "Get-Content C:outside.txt",
                f"Get-Content {root / 'outside.txt'}",
            )
            for command in unsafe_commands:
                with self.subTest(command=command):
                    decision = runtime.hook_pretool(
                        {"tool_name": "Bash", "tool_input": {"command": command}}, root
                    )
                    self.assertEqual(decision["permissionDecision"], "deny")


if __name__ == "__main__":
    unittest.main(verbosity=2)
