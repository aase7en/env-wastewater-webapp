#!/usr/bin/env python3
"""ENV-local orchestration helpers over the canonical coordination authority.

This module deliberately owns no task registry, claim allocator, scheduler,
provider credential, or second lifecycle journal.  It composes the existing
ENV Coordination Guard and reads Roadmap/Work Order evidence as inputs.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import shlex
import stat
import subprocess
import sys
import uuid
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import Any, Iterable, Optional

import env_coordination_guard as guard

REPO_SLUG = "aase7en/env-wastewater-webapp"
CURRENT_WORK = "docs/ai/CURRENT-WORK.md"
ROADMAP = "docs/ai/ROADMAP.md"
WORK_ORDER = "docs/work-orders/ENV-AUTONOMY-001.md"
HANDOFF = "docs/ai/handoffs/ENV-AUTONOMY-001.md"
LIFECYCLE_START = "<!-- ENV-AUTONOMY-LIFECYCLE:START -->"
LIFECYCLE_END = "<!-- ENV-AUTONOMY-LIFECYCLE:END -->"
MAX_ACTIVE_MUTABLE_LANES = 3
MAX_INDEPENDENT_REVIEW_LANES = 1
PROVIDER_EVIDENCE_MAX_AGE_SECONDS = 300

ACTIVE_WIP_STATUSES = frozenset(("CLAIMED", "ACTIVE", "IMPLEMENTING", "VERIFYING"))
PARKED_STATES = frozenset(("WAITING_EXTERNAL", "PARKED"))
ACTIVE_REVIEW_STATUSES = frozenset(("REVIEWING", "REVIEW_REQUESTED", "RE-REVIEW_REQUESTED"))
SUPPORTED_MODELS = {
    "gpt-6 luna max": {"orchestration", "routine_integration", "low_risk_analysis"},
    "gpt-6 sol": {"independent_review"},
    "glm-5.3 max": {"core_engineering", "security", "data_contract", "bounded_implementation"},
    "glm-5.3 flash": {"read_only_analysis", "low_risk_analysis"},
    "jev": {"read_only_advisory"},
}
ROUTE_DEFAULTS = {
    "orchestration": ("GPT-6 Luna MAX", "CONTROL"),
    "routine_integration": ("GPT-6 Luna MAX", "CONTROL"),
    "core_engineering": ("GLM-5.3 MAX", "MUTATION"),
    "security": ("GLM-5.3 MAX", "MUTATION"),
    "data_contract": ("GLM-5.3 MAX", "MUTATION"),
    "bounded_implementation": ("GLM-5.3 MAX", "MUTATION"),
    "read_only_analysis": ("GLM-5.3 Flash", "READ_ONLY_ANALYSIS"),
    "low_risk_analysis": ("GLM-5.3 Flash", "LOW_RISK"),
    "independent_review": ("GPT-6 Sol", "INDEPENDENT_REVIEW"),
    "read_only_advisory": ("JEV", "READ_ONLY_ADVISORY"),
}


class AutonomyFailure(Exception):
    """Typed fail-closed runtime error."""

    def __init__(self, reason: str, detail: str = ""):
        super().__init__(f"{reason}: {detail}" if detail else reason)
        self.reason = reason
        self.detail = detail


def _nonempty(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise AutonomyFailure("INVALID_BINDING", f"{field} must be a non-empty string")
    return value


def _exact_int(value: Any, field: str, minimum: int = 0) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < minimum:
        raise AutonomyFailure("INVALID_BINDING", f"{field} must be an integer >= {minimum}")
    return value


def _run_git(
    args: list[str], cwd: Path, *, check: bool = True, preserve_output: bool = False
) -> str:
    """Run Git without ever echoing remote URLs or credential-bearing errors."""
    try:
        proc = subprocess.run(
            ["git", *args], cwd=cwd, capture_output=True, text=True,
            encoding="utf-8", errors="replace", check=False,
            env={**os.environ, "GIT_TERMINAL_PROMPT": "0"},
        )
    except OSError as exc:
        raise AutonomyFailure("GIT_UNAVAILABLE", type(exc).__name__) from None
    if check and proc.returncode != 0:
        reason = "GIT_COMMAND_FAILED"
        if "merge-base" in args:
            reason = "BASE_NOT_ANCESTOR"
        raise AutonomyFailure(reason, f"git {args[0]} exited {proc.returncode}")
    return proc.stdout if preserve_output else proc.stdout.strip()


def _repo_slug(remote: str) -> Optional[str]:
    """Extract only owner/repo; never return credentials or a full URL."""
    if not isinstance(remote, str):
        return None
    match = re.search(r"(?:github\.com[:/])([^/]+)/([^/#?]+?)(?:\.git)?$", remote, re.I)
    return f"{match.group(1)}/{match.group(2)}" if match else None


def _norm_worktree(path: str) -> str:
    return path.replace("\\", "/").rstrip("/").casefold()


def _is_ancestor(root: Path, ancestor: str, descendant: str) -> bool:
    result = subprocess.run(
        ["git", "merge-base", "--is-ancestor", ancestor, descendant],
        cwd=root, capture_output=True, check=False,
    )
    return result.returncode == 0


def _actual_context(root: Path, claim: dict) -> dict:
    actual_root = Path(_run_git(["rev-parse", "--show-toplevel"], root)).resolve()
    branch = _run_git(["rev-parse", "--abbrev-ref", "HEAD"], actual_root)
    head = _run_git(["rev-parse", "HEAD"], actual_root)
    remote = _run_git(["remote", "get-url", "origin"], actual_root)
    actual_slug = _repo_slug(remote)
    policy_base = _run_git(["rev-parse", "origin/main"], actual_root)
    claim_base_ok = _is_ancestor(actual_root, claim["base_sha"], head)
    policy_base_ok = _is_ancestor(actual_root, policy_base, head)
    return {
        "repo": actual_slug,
        "worktree": str(actual_root),
        "branch": branch,
        "head_sha": head,
        "claim_base_ancestor": claim_base_ok,
        "current_policy_ancestor": policy_base_ok,
    }


def load_trusted_policy(root: Path, *, refresh: bool = True) -> tuple[guard.TrustedPolicy, str]:
    """Refresh origin/main, then read CURRENT-WORK from that exact revision."""
    root = root.resolve()
    if refresh:
        _run_git(["fetch", "origin", "main"], root)
    revision = _run_git(["rev-parse", "origin/main"], root)
    text = _run_git(["show", f"{revision}:{CURRENT_WORK}"], root)
    try:
        policy = guard.load_trusted_policy(text, revision)
    except guard.GuardFailure as exc:
        raise AutonomyFailure(exc.reason, exc.detail) from None
    return policy, text


def validate_lane_binding(
    policy: guard.TrustedPolicy,
    binding: dict,
    actual: dict,
) -> dict:
    """Bind a run to the claim, exact worktree/head, dependencies and scope."""
    required = (
        "repo", "worktree", "branch", "base_sha", "head_sha", "task_id",
        "work_order_path", "claim_id", "claim_generation", "execution_holder_id",
        "scope", "dependencies", "lane_kind", "provider", "model", "variant", "run_id",
    )
    if not isinstance(binding, dict):
        raise AutonomyFailure("INVALID_BINDING", "binding must be an object")
    for name in required:
        if name not in binding:
            raise AutonomyFailure("INVALID_BINDING", f"missing {name}")
    for name in ("repo", "worktree", "branch", "base_sha", "head_sha", "task_id",
                 "work_order_path", "claim_id", "execution_holder_id", "lane_kind",
                 "provider", "model", "variant", "run_id"):
        _nonempty(binding[name], name)
    generation = _exact_int(binding["claim_generation"], "claim_generation", 1)
    claim = policy.claim_by_task(binding["task_id"])
    if claim is None or claim["claim_id"] != binding["claim_id"]:
        raise AutonomyFailure("WRONG_CLAIM", "task/claim not present in trusted CURRENT-WORK")
    if binding["work_order_path"] != claim["work_order_path"]:
        raise AutonomyFailure("WRONG_WORK_ORDER", "work order differs from trusted claim")
    if (
        not isinstance(binding["dependencies"], list)
        or binding["dependencies"] != list(claim["dependencies"])
    ):
        raise AutonomyFailure("DEPENDENCY_MISMATCH", "dependencies differ from trusted claim")
    if binding["scope"] == [] or not isinstance(binding["scope"], list):
        raise AutonomyFailure("INVALID_SCOPE", "scope must be a non-empty list")
    if not all(isinstance(item, str) and item for item in binding["scope"]):
        raise AutonomyFailure("INVALID_SCOPE", "every scope expression must be a non-empty string")
    actual_repo = actual.get("repo")
    if not isinstance(actual_repo, str) or binding["repo"].casefold() != REPO_SLUG.casefold() or actual_repo.casefold() != REPO_SLUG.casefold():
        raise AutonomyFailure("REPOSITORY_MISMATCH", "repository identity is not the ENV repository")
    if _norm_worktree(binding["worktree"]) != _norm_worktree(claim["worktree"]):
        raise AutonomyFailure("WORKTREE_MISMATCH", "binding worktree differs from trusted claim")
    if _norm_worktree(actual.get("worktree", "")) != _norm_worktree(claim["worktree"]):
        raise AutonomyFailure("WORKTREE_MISMATCH", "actual worktree differs from trusted claim")
    if binding["branch"] != claim["branch"] or actual.get("branch") != claim["branch"]:
        raise AutonomyFailure("BRANCH_MISMATCH", "branch differs from trusted claim")
    if binding["base_sha"] != claim["base_sha"]:
        raise AutonomyFailure("BASE_MISMATCH", "base differs from trusted claim")
    if binding["head_sha"] != actual.get("head_sha"):
        raise AutonomyFailure("HEAD_MISMATCH", "binding head differs from actual HEAD")
    if actual.get("claim_base_ancestor") is not True or actual.get("current_policy_ancestor") is not True:
        raise AutonomyFailure("CONTEXT_DRIFT", "claim base and current origin/main must both be ancestors of HEAD")

    ctx = {
        "task_id": binding["task_id"],
        "claim_id": binding["claim_id"],
        "claim_generation": generation,
        "execution_holder_id": binding["execution_holder_id"],
        "worktree": actual["worktree"],
        "branch": actual["branch"],
        "base_ancestor_of_head": True,
    }
    decision = guard.preflight(policy, ctx)
    if not decision.safe_to_mutate:
        raise AutonomyFailure(decision.reason or "PREFLIGHT_DENIED")
    narrowed = guard.evaluate_candidate_work_order(policy, binding["claim_id"], binding["scope"])
    if not narrowed.allowed:
        raise AutonomyFailure(narrowed.reason or "POLICY_CONTRADICTION")
    return {
        "ok": True,
        "task_id": claim["task_id"],
        "claim_id": claim["claim_id"],
        "claim_generation": claim["claim_generation"],
        "execution_holder_id": claim["execution_holder_id"],
        "policy_revision": policy.policy_revision,
        "registry_hash": policy.registry_hash,
        "head_sha": actual["head_sha"],
        "scope": list(binding["scope"]),
        "run_id": binding["run_id"],
    }


def route_fit(model: str, task_category: str, lane_kind: str) -> dict:
    """Enforce task-fit boundaries; model labels do not authenticate a route."""
    model_key = _nonempty(model, "model").casefold()
    category = _nonempty(task_category, "task_category").casefold()
    _nonempty(lane_kind, "lane_kind")
    if model_key not in SUPPORTED_MODELS or category not in SUPPORTED_MODELS[model_key]:
        return {"safe": False, "reason": "TASK_FIT_MISMATCH"}
    if model_key == "jev" and lane_kind != "READ_ONLY_ADVISORY":
        return {"safe": False, "reason": "JEV_READ_ONLY_ONLY"}
    if model_key == "gpt-6 sol" and lane_kind != "INDEPENDENT_REVIEW":
        return {"safe": False, "reason": "REVIEWER_ROLE_ONLY"}
    if model_key == "glm-5.3 flash" and lane_kind not in ("READ_ONLY_ANALYSIS", "LOW_RISK"):
        return {"safe": False, "reason": "FLASH_READ_ONLY_OR_LOW_RISK_ONLY"}
    return {"safe": True, "reason": None}


def select_route(task_category: str, lane_kind: Optional[str] = None, *, jev_available: bool = False) -> dict:
    """Choose the default task-fit model without treating a label as live admission."""
    category = _nonempty(task_category, "task_category").casefold()
    selected = ROUTE_DEFAULTS.get(category)
    if selected is None:
        return {"selected": False, "reason": "TASK_CATEGORY_UNSUPPORTED"}
    model, default_lane = selected
    effective_lane = lane_kind or default_lane
    fit = route_fit(model, category, effective_lane)
    if not fit["safe"]:
        return {"selected": False, "model": model, "lane_kind": effective_lane, "reason": fit["reason"]}
    if model == "JEV" and not jev_available:
        return {
            "selected": True, "model": model, "lane_kind": effective_lane,
            "route_state": "UNAVAILABLE", "dispatch_allowed": False,
            "reason": "NO_SUPPORTED_LIVE_JEV_ROUTE",
        }
    requires_external_admission = model.startswith("GLM-") or model == "JEV"
    return {
        "selected": True,
        "model": model,
        "provider_candidate": "cointh-glm" if model.startswith("GLM-") else None,
        "lane_kind": effective_lane,
        "route_state": "ADMISSION_REQUIRED" if requires_external_admission else "SELECTION_ONLY",
        "dispatch_allowed": False,
        "reason": "LIVE_PROVIDER_ADMISSION_REQUIRED" if requires_external_admission else "DISPATCH_ADAPTER_NOT_CONFIGURED",
    }


def provider_admission(
    evidence: dict,
    *,
    now: Optional[dt.datetime] = None,
    max_age_seconds: int = PROVIDER_EVIDENCE_MAX_AGE_SECONDS,
) -> dict:
    """Require distinct, fresh proxy-quota and upstream-readiness evidence."""
    if not isinstance(evidence, dict):
        return {"safe": False, "reason": "PROVIDER_EVIDENCE_UNKNOWN"}
    status = evidence.get("http_status")
    if isinstance(status, int) and not isinstance(status, bool) and status in (401, 403):
        return {"safe": False, "reason": "AUTH_OR_ENTITLEMENT", "quota": "UNKNOWN", "upstream": "UNKNOWN"}
    quota = evidence.get("proxy_quota_status")
    upstream = evidence.get("upstream_model_status")
    if quota != "READY" or upstream != "READY":
        if quota != "READY":
            reason = "PROXY_QUOTA_UNKNOWN" if quota in (None, "UNKNOWN") else "PROXY_QUOTA_NOT_READY"
        else:
            reason = "UPSTREAM_MODEL_UNKNOWN" if upstream in (None, "UNKNOWN") else "UPSTREAM_MODEL_NOT_READY"
        return {"safe": False, "reason": reason, "quota": quota or "UNKNOWN", "upstream": upstream or "UNKNOWN"}
    for field in ("proxy_quota_source", "upstream_source", "provider", "model", "variant", "checked_at_utc"):
        if not isinstance(evidence.get(field), str) or not evidence[field].strip():
            return {"safe": False, "reason": "PROVIDER_EVIDENCE_INCOMPLETE", "quota": quota, "upstream": upstream}
    if evidence["proxy_quota_source"] == evidence["upstream_source"]:
        return {"safe": False, "reason": "PROVIDER_EVIDENCE_SOURCES_NOT_DISTINCT", "quota": quota, "upstream": upstream}
    provider = evidence["provider"].casefold()
    model = evidence["model"].casefold()
    variant = evidence["variant"].casefold()
    if provider != "cointh-glm" or (model, variant) not in (("glm-5.3", "max"), ("glm-5.3", "flash")):
        return {"safe": False, "reason": "PROVIDER_ROUTE_UNSUPPORTED", "quota": quota, "upstream": upstream}
    try:
        checked = dt.datetime.fromisoformat(evidence["checked_at_utc"].replace("Z", "+00:00"))
    except ValueError:
        return {"safe": False, "reason": "PROVIDER_EVIDENCE_INVALID_TIME", "quota": quota, "upstream": upstream}
    if checked.tzinfo is None:
        return {"safe": False, "reason": "PROVIDER_EVIDENCE_INVALID_TIME", "quota": quota, "upstream": upstream}
    current = now or dt.datetime.now(dt.timezone.utc)
    if current.tzinfo is None:
        return {"safe": False, "reason": "PROVIDER_EVIDENCE_INVALID_TIME", "quota": quota, "upstream": upstream}
    age = (current - checked.astimezone(dt.timezone.utc)).total_seconds()
    if age < 0 or age > max_age_seconds:
        return {"safe": False, "reason": "PROVIDER_EVIDENCE_STALE", "quota": quota, "upstream": upstream}
    return {"safe": True, "reason": None, "quota": quota, "upstream": upstream, "age_seconds": int(age)}


def _checkpoint_is_published(claim: dict, checkpoint: Any) -> bool:
    return bool(
        isinstance(checkpoint, dict)
        and claim.get("status") in PARKED_STATES
        and checkpoint.get("status") == claim.get("status")
        and checkpoint.get("published") is True
        and isinstance(checkpoint.get("remote_head_sha"), str)
        and checkpoint.get("remote_head_sha") == checkpoint.get("observed_remote_head_sha")
        and checkpoint.get("claim_id") == claim["claim_id"]
        and checkpoint.get("claim_generation") == claim["claim_generation"]
        and checkpoint.get("execution_holder_id") == claim["execution_holder_id"]
    )


def safe_refill_decision(
    policy: guard.TrustedPolicy,
    candidates: list[dict],
    checkpoints: dict[str, dict],
    *,
    active_review_count: int = 0,
) -> dict:
    """Choose only a canonical READY claim; never allocate or dispatch it."""
    active_review_count = _exact_int(active_review_count, "active_review_count")
    active = []
    waiting_external = 0
    parked = 0
    active_reviews = active_review_count
    for claim in policy.claims:
        status = claim["status"]
        if status in ACTIVE_REVIEW_STATUSES:
            active_reviews += 1
            continue
        if status == "WAITING_EXTERNAL":
            waiting_external += 1
        elif status == "PARKED":
            parked += 1
        if status not in ACTIVE_WIP_STATUSES and status not in PARKED_STATES:
            continue
        if status in PARKED_STATES and _checkpoint_is_published(
            claim, checkpoints.get(claim["task_id"])
        ):
            continue
        active.append(claim)
    free_wip = MAX_ACTIVE_MUTABLE_LANES - len(active)
    free_reviews = MAX_INDEPENDENT_REVIEW_LANES - active_reviews
    if not isinstance(candidates, list):
        return {
            "auto_refill_required": False, "reason": "CANDIDATE_SET_INVALID",
            "selected_task_id": None, "active_mutable_lanes": len(active),
            "active_review_lanes": active_reviews, "waiting_external": waiting_external,
            "parked": parked, "safe_ready": 0, "unused_safe_capacity": max(0, free_wip),
        }
    eligible = []
    dispatchable = []
    for order, candidate in enumerate(candidates):
        if not isinstance(candidate, dict) or candidate.get("safe_ready") is not True:
            continue
        task_id = candidate.get("task_id")
        claim = policy.claim_by_task(task_id) if isinstance(task_id, str) else None
        if claim is None or claim["status"] != "READY":
            continue
        if candidate.get("work_order_path") != claim["work_order_path"]:
            continue
        source_refs = candidate.get("source_refs")
        if not isinstance(source_refs, list) or not all(
            source in (ROADMAP, CURRENT_WORK, claim["work_order_path"]) for source in source_refs
        ) or set(source_refs) != {ROADMAP, CURRENT_WORK, claim["work_order_path"]}:
            continue
        if candidate.get("dependencies_satisfied") is not True:
            continue
        if candidate.get("production_dispatch_authorized") is not True:
            continue
        scope = candidate.get("scope")
        if not isinstance(scope, list) or not scope:
            continue
        narrowed = guard.evaluate_candidate_work_order(policy, claim["claim_id"], scope)
        if not narrowed.allowed:
            continue
        ranked = (candidate.get("priority_rank", 99), order, task_id)
        eligible.append(ranked)
        if candidate.get("lane_kind") == "INDEPENDENT_REVIEW":
            if free_reviews > 0:
                dispatchable.append(ranked)
        elif free_wip > 0:
            dispatchable.append(ranked)
    eligible.sort(key=lambda item: (item[0], item[1], item[2]))
    dispatchable.sort(key=lambda item: (item[0], item[1], item[2]))
    selected = dispatchable[0][2] if dispatchable else None
    counts = {
        "active_mutable_lanes": len(active),
        "active_review_lanes": active_reviews,
        "waiting_external": waiting_external,
        "parked": parked,
        "safe_ready": len(eligible),
        "unused_safe_capacity": max(0, free_wip),
    }
    if selected is not None:
        return {
            "auto_refill_required": True,
            "reason": "SAFE_READY_LANE_AND_CAPACITY_AVAILABLE",
            "selected_task_id": selected,
            "next_action": "REQUEST_EXISTING_CONTROL_TRANSITION; DO_NOT_CREATE_A_CLAIM",
            "free_mutable_capacity": max(0, free_wip),
            **counts,
        }
    if free_wip <= 0:
        reason = "ACTIVE_WIP_FULL"
    elif free_reviews < 0:
        reason = "REVIEW_WIP_OVER_LIMIT"
    elif eligible:
        reason = "SAFE_READY_LANE_HAS_NO_CAPACITY"
    else:
        reason = "NO_CANONICAL_SAFE_READY_LANE"
    return {
        "auto_refill_required": False,
        "reason": reason,
        "selected_task_id": None,
        "free_mutable_capacity": max(0, free_wip),
        **counts,
    }


def canonical_candidate_state(roadmap_text: str, current_work_text: str, work_order_text: str, task_id: str) -> dict:
    """Conservatively detect a Roadmap item currently marked SAFE and READY."""
    task_id = _nonempty(task_id, "task_id")
    headline = re.search(rf"^###\s+{re.escape(task_id)}(?:\s|$).*?$", roadmap_text, re.M)
    frontier_line = re.compile(
        rf"^\s*-\s+\*\*`?{re.escape(task_id)}`?\s*(?:/|[-—:])",
        re.I,
    )
    frontier = next(
        (line for line in current_work_text.splitlines() if frontier_line.search(line)),
        "",
    )
    wo_heading = re.search(rf"^#\s+{re.escape(task_id)}\b.*$", work_order_text, re.M)
    wo_status = re.search(r"^Status:\s*([^\r\n]+)", work_order_text, re.M)
    if not headline or not frontier or not wo_heading or not wo_status:
        return {"safe_ready": False, "reason": "CANONICAL_EVIDENCE_INCOMPLETE"}
    frontier_status = re.search(
        rf"{re.escape(task_id)}\s*(?:/|[-—:])\s*READY\b", frontier, re.I
    )
    work_order_status = wo_status.group(1).strip()
    blocked = ("paused", "blocked", "decision_required", "human_action_required", "recovery_hold", "dispatch-paused")
    status_text = (frontier + " " + work_order_status).casefold()
    if any(token in status_text for token in blocked):
        return {"safe_ready": False, "reason": "CANONICAL_FRONTIER_BLOCKED"}
    if not frontier_status or not re.match(r"(?i)^READY(?:\b|\s|/)", work_order_status):
        return {"safe_ready": False, "reason": "CANONICAL_FRONTIER_NOT_READY"}
    block_end = re.search(r"^###\s+", roadmap_text[headline.end():], re.M)
    roadmap_block = roadmap_text[
        headline.start(): headline.end() + block_end.start() if block_end else len(roadmap_text)
    ]
    priority_match = re.search(r"\bP([0-3])\b", roadmap_block + " " + frontier, re.I)
    return {
        "safe_ready": True,
        "reason": None,
        "priority_rank": int(priority_match.group(1)) if priority_match else 99,
    }


def independent_review_gate(claim: dict, author: dict, review: dict, exact_head: str) -> dict:
    """Reject author/self review and review against a different exact SHA."""
    if not isinstance(author, dict) or not isinstance(review, dict):
        return {"approved": False, "reason": "REVIEW_EVIDENCE_INVALID"}
    if review.get("verdict") != "APPROVED":
        return {"approved": False, "reason": "REVIEW_NOT_APPROVED"}
    if review.get("reviewer_role") != "independent_reviewer":
        return {"approved": False, "reason": "REVIEWER_ROLE_NOT_INDEPENDENT"}
    if review.get("reviewed_head_sha") != exact_head:
        return {"approved": False, "reason": "REVIEW_HEAD_MISMATCH"}
    author_run = author.get("run_id")
    reviewer_run = review.get("reviewer_run_id")
    author_session = author.get("session_id")
    reviewer_session = review.get("reviewer_session_id")
    if not all(isinstance(x, str) and x for x in (author_run, reviewer_run, author_session, reviewer_session)):
        return {"approved": False, "reason": "REVIEW_IDENTITY_INCOMPLETE"}
    if author_run == reviewer_run or author_session == reviewer_session:
        return {"approved": False, "reason": "AUTHOR_CANNOT_SELF_REVIEW"}
    if review.get("task_id") != claim.get("task_id") or review.get("claim_id") != claim.get("claim_id"):
        return {"approved": False, "reason": "REVIEW_CLAIM_MISMATCH"}
    if review.get("claim_generation") != claim.get("claim_generation"):
        return {"approved": False, "reason": "REVIEW_GENERATION_MISMATCH"}
    return {"approved": True, "reason": None, "reviewer_run_id": reviewer_run}


def _lifecycle_document(handoff_text: str) -> tuple[dict, tuple[int, int]]:
    start = handoff_text.find(LIFECYCLE_START)
    end = handoff_text.find(LIFECYCLE_END)
    if start < 0 or end < 0 or end <= start:
        raise AutonomyFailure("LIFECYCLE_BLOCK_MISSING")
    payload_start = handoff_text.find("```json", start)
    payload_end = handoff_text.find("```", payload_start + 7) if payload_start >= 0 else -1
    if payload_start < 0 or payload_end < 0 or payload_end > end:
        raise AutonomyFailure("LIFECYCLE_BLOCK_MALFORMED")
    raw = handoff_text[payload_start + len("```json"):payload_end].strip()
    try:
        document = json.loads(raw)
    except json.JSONDecodeError:
        raise AutonomyFailure("LIFECYCLE_BLOCK_MALFORMED") from None
    if not isinstance(document, dict) or document.get("version") != 1:
        raise AutonomyFailure("LIFECYCLE_BLOCK_MALFORMED")
    return document, (payload_start, payload_end + 3)


def _replace_lifecycle_block(handoff_text: str, document: dict) -> str:
    _, (start, end) = _lifecycle_document(handoff_text)
    encoded = "```json\n" + json.dumps(document, indent=2, sort_keys=True, ensure_ascii=False) + "\n```"
    return handoff_text[:start] + encoded + handoff_text[end:]


def append_lifecycle_event(handoff_path: Path, event_data: dict) -> dict:
    """Stage one ordered event in the existing handoff; it is not durable yet."""
    handoff_text = handoff_path.read_text(encoding="utf-8")
    document, _ = _lifecycle_document(handoff_text)
    expected = (document.get("claim_id"), document.get("claim_generation"))
    if (event_data.get("claim_id"), event_data.get("claim_generation")) != expected:
        raise AutonomyFailure("STALE_CLAIM_GENERATION")
    events = document.get("events")
    if not isinstance(events, list):
        raise AutonomyFailure("LIFECYCLE_BLOCK_MALFORMED")
    log = guard.LifecycleLog(document["claim_id"], document["claim_generation"])
    try:
        for raw in events:
            log.apply(guard.LifecycleEvent(**{**raw, "published": True}))
        event = guard.LifecycleEvent(**{**event_data, "published": True})
        result, _ = log.apply(event)
    except (TypeError, KeyError, guard.GuardFailure) as exc:
        if isinstance(exc, guard.GuardFailure):
            raise AutonomyFailure(exc.reason, exc.detail) from None
        raise AutonomyFailure("LIFECYCLE_EVENT_INVALID", type(exc).__name__) from None
    events.append({**event.__dict__, "published": False})
    updated = _replace_lifecycle_block(handoff_text, document)
    handoff_path.write_text(updated, encoding="utf-8", newline="\n")
    return {
        "ok": True, "event_status": result, "event_id": event.event_id,
        "checkpoint_state": "PENDING_PUBLICATION",
    }


def _append_lifecycle_event_to_document(document: dict, event_data: dict) -> guard.LifecycleEvent:
    """Validate and append one pending event to an already parsed handoff block."""
    events = document.get("events")
    if not isinstance(events, list):
        raise AutonomyFailure("LIFECYCLE_BLOCK_MALFORMED")
    log = guard.LifecycleLog(document.get("claim_id"), document.get("claim_generation"))
    try:
        for raw in events:
            if not isinstance(raw, dict):
                raise AutonomyFailure("LIFECYCLE_BLOCK_MALFORMED")
            log.apply(guard.LifecycleEvent(**{**raw, "published": True}))
        event = guard.LifecycleEvent(**{**event_data, "published": True})
        log.apply(event)
    except TypeError as exc:
        raise AutonomyFailure("LIFECYCLE_EVENT_INVALID", type(exc).__name__) from None
    except guard.GuardFailure as exc:
        raise AutonomyFailure(exc.reason, exc.detail) from None
    events.append({**event.__dict__, "published": False})
    return event


def _has_unresolved_hook_observations(document: dict, log: guard.LifecycleLog) -> bool:
    """UNKNOWN post-tool receipts remain blocking until their lifecycle run is reconciled."""
    observations = document.get("codex_hook_observations", [])
    if not isinstance(observations, list):
        raise AutonomyFailure("LIFECYCLE_BLOCK_MALFORMED", "hook observations must be a list")
    for observation in observations:
        if not isinstance(observation, dict):
            raise AutonomyFailure("LIFECYCLE_BLOCK_MALFORMED", "hook observation must be an object")
        state = observation.get("effect_state")
        if state not in ("OBSERVED", "FAILED", "UNKNOWN"):
            raise AutonomyFailure("LIFECYCLE_BLOCK_MALFORMED", "unknown hook effect state")
        if state != "UNKNOWN":
            continue
        operation_id = observation.get("operation_id")
        if not isinstance(operation_id, str) or not operation_id:
            return True
        try:
            operation = log.operation_record(operation_id)
        except guard.GuardFailure:
            return True
        if operation.get("outcome") != "UNKNOWN" or operation.get("reconciled_outcome") not in ("SUCCEEDED", "FAILED"):
            return True
    return False


def _safe_repository_read_paths(root: Path, paths: Any) -> bool:
    """Allow only literal reads that resolve inside the repo and outside protected data."""
    if not isinstance(paths, list) or not paths:
        return False
    resolved_root = Path(root).resolve()
    for raw_path in paths:
        if not isinstance(raw_path, str) or not raw_path.strip():
            return False
        if raw_path.startswith("~") or any(character in raw_path for character in "*?[]{}"):
            return False
        portable_path = raw_path.replace("\\", "/")
        candidate = Path(portable_path)
        windows_candidate = PureWindowsPath(raw_path)
        portable_parts = PurePosixPath(portable_path).parts
        if (
            candidate.is_absolute() or candidate.drive or candidate.root
            or windows_candidate.drive or windows_candidate.root
            or any(part == ".." for part in portable_parts)
        ):
            return False
        try:
            resolved = (resolved_root / candidate).resolve(strict=False)
            relative = resolved.relative_to(resolved_root).as_posix().casefold()
        except (OSError, RuntimeError, ValueError):
            return False
        parts = relative.split("/")
        if ".env" in relative or parts[:2] == ["data", "raw"]:
            return False
    return True


def _parse_literal_shell_read_paths(tokens: list[str]) -> Optional[list[str]]:
    """Accept only narrow literal-path forms for shell file-reading commands."""
    if not tokens:
        return None
    command = tokens[0].casefold()
    path = None
    if command == "get-content":
        if len(tokens) == 2:
            path = tokens[1]
        elif len(tokens) == 3 and tokens[1].casefold() in ("-path", "-literalpath"):
            path = tokens[2]
    elif command == "select-string":
        if (
            len(tokens) == 5
            and tokens[1].casefold() in ("-path", "-literalpath")
            and tokens[3].casefold() == "-pattern"
        ):
            path = tokens[2]
    if not isinstance(path, str) or not path.strip() or path.startswith("-"):
        return None
    if any(character in path for character in "*?[]") or "," in path:
        return None
    return [path]


def _parse_literal_ripgrep_read_paths(tokens: list[str]) -> Optional[list[str]]:
    """Return the explicit ripgrep path, defaulting to the current repo root."""
    if not tokens or tokens[0].casefold() != "rg":
        return None
    flag_options = {
        "-n", "--line-number", "-i", "--ignore-case", "-F", "--fixed-strings",
        "-s", "--case-sensitive", "-S", "--smart-case", "-l", "--files-with-matches",
        "-c", "--count", "--heading", "--no-heading", "--no-messages", "--trim", "--text",
    }
    operands = []
    after_options = False
    index = 1
    while index < len(tokens):
        token = tokens[index]
        if not after_options and token == "--":
            after_options = True
            index += 1
            continue
        if not after_options and token in flag_options:
            index += 1
            continue
        if not after_options and token == "--color":
            if index + 1 >= len(tokens) or tokens[index + 1] not in ("never", "auto", "always"):
                return None
            index += 2
            continue
        if not after_options and token.startswith("-"):
            return None
        operands.append(token)
        index += 1
    if len(operands) == 1:
        return ["."]
    if len(operands) == 2 and operands[1] != "-":
        return [operands[1]]
    return None


def _is_reconciliation_command(tool_name: str, tool_input: dict) -> bool:
    """Permit only the typed lifecycle reconciliation command through an UNKNOWN gate."""
    if tool_name != "Bash" or not isinstance(tool_input.get("command"), str):
        return False
    try:
        tokens = shlex.split(tool_input["command"], posix=True)
    except ValueError:
        return False
    if tokens and tokens[0] in ("python", "python3", "py"):
        tokens = tokens[1:]
        if tokens[:1] == ["-3"]:
            tokens = tokens[1:]
    if len(tokens) < 2 or tokens[0].replace("\\", "/") != "scripts/env_autonomy_runtime.py":
        return False
    if tokens[1] != "append-event":
        return False
    values = [tokens[i + 1] for i, token in enumerate(tokens[:-1]) if token == "--event-type"]
    return values == ["OPERATION_RECONCILED"]


def _runtime_event_cli_args(tool_name: str, tool_input: dict) -> Optional[tuple[str, list[str]]]:
    if tool_name != "Bash" or not isinstance(tool_input.get("command"), str):
        return None
    try:
        tokens = shlex.split(tool_input["command"], posix=True)
    except ValueError:
        return None
    if tokens and tokens[0] in ("python", "python3", "py"):
        tokens = tokens[1:]
        if tokens[:1] == ["-3"]:
            tokens = tokens[1:]
    if (
        len(tokens) < 3
        or tokens[0].replace("\\", "/") != "scripts/env_autonomy_runtime.py"
        or tokens[1] not in ("append-event", "kilo-receipt-transition")
        or "--root" in tokens[2:]
        or any(token.startswith("--root=") for token in tokens[2:])
    ):
        return None
    return tokens[1], tokens[2:]


def _parse_strict_cli_options(args: list[str], allowed: set[str]) -> Optional[dict[str, str]]:
    if not args or len(args) % 2:
        return None
    parsed: dict[str, str] = {}
    for index in range(0, len(args), 2):
        option, value = args[index], args[index + 1]
        if (
            option not in allowed or option in parsed
            or not value or value.startswith("--")
        ):
            return None
        parsed[option] = value
    return parsed


def _pending_operation_intent(log: guard.LifecycleLog, operation_id: str) -> Optional[guard.LifecycleEvent]:
    try:
        record = log.operation_record(operation_id)
    except guard.GuardFailure:
        return None
    if record.get("outcome") is not None:
        return None
    intents = [
        event for event in log.events
        if event.event_type == "OPERATION_INTENT" and event.operation_id == operation_id
    ]
    return intents[0] if len(intents) == 1 else None


def _is_pending_operation_progress_command(
    tool_name: str, tool_input: dict, log: guard.LifecycleLog
) -> bool:
    """Allow only the matching request receipt or typed outcome for an open intent."""
    parsed = _runtime_event_cli_args(tool_name, tool_input)
    if parsed is None:
        return False
    subcommand, args = parsed
    if subcommand == "kilo-receipt-transition":
        options = _parse_strict_cli_options(args, {"--run-id", "--next-state"})
        if options is None or set(options) != {"--run-id", "--next-state"}:
            return False
        if options["--next-state"] != "REQUESTED":
            return False
        intent = _pending_operation_intent(log, options["--run-id"])
        payload = intent.payload if intent is not None and isinstance(intent.payload, dict) else {}
        provider = payload.get("provider")
        return (
            payload.get("run_id") == options["--run-id"]
            and isinstance(provider, str)
            and provider.casefold() == "cointh-glm"
        )
    if subcommand == "append-event":
        allowed = {"--event-type", "--operation-id", "--operation-outcome", "--evidence-sha256", "--goal-id"}
        options = _parse_strict_cli_options(args, allowed)
        required = {"--event-type", "--operation-id", "--operation-outcome", "--evidence-sha256"}
        if options is None or not required.issubset(options):
            return False
        digest = options["--evidence-sha256"]
        if (
            options["--event-type"] != "OPERATION_OUTCOME"
            or options["--operation-outcome"] not in guard.OPERATION_OUTCOMES
            or not re.fullmatch(r"[0-9a-f]{64}", digest)
        ):
            return False
        return _pending_operation_intent(log, options["--operation-id"]) is not None
    return False


def record_hook_observation(root: Path, policy: guard.TrustedPolicy, event: dict) -> dict:
    """Append hash-only local mutation receipts to the lane handoff."""
    claim = policy.claim_by_task("ENV-AUTONOMY-001")
    if claim is None:
        raise AutonomyFailure("UNKNOWN_TASK")
    tool_name = event.get("tool_name")
    tool_input = event.get("tool_input")
    if not isinstance(tool_name, str) or not isinstance(tool_input, dict):
        raise AutonomyFailure("INVALID_HOOK_INPUT")
    if tool_name == "Bash":
        classified = classify_shell_command(tool_input.get("command"))
        if classified["kind"] in ("GIT_STAGE_OR_COMMIT", "GIT_PUSH"):
            return {"recorded": False, "reason": "GIT_PUBLICATION_IS_VERIFIED_FROM_REMOTE"}
        if classified["kind"] != "AUTONOMY_EVENT":
            reason = "READ_ONLY" if classified["kind"] == "READ_ONLY" else "NOT_A_MUTATION_RECEIPT"
            return {"recorded": False, "reason": reason}
        changes = list(classified.get("changes", []))
    else:
        changes = _tool_changes(tool_name, tool_input)
    if not changes:
        raise AutonomyFailure("UNCLASSIFIED_PATCH_SCOPE")
    actual = _actual_context(root, claim)
    root = Path(actual["worktree"]).resolve()
    session_id, turn_id, tool_use_id = (event.get(key) for key in ("session_id", "turn_id", "tool_use_id"))
    if not all(isinstance(value, str) and value for value in (session_id, turn_id, tool_use_id)):
        raise AutonomyFailure("RUN_IDENTITY_MISSING")
    binding = {
        "repo": REPO_SLUG, "worktree": actual["worktree"], "branch": actual["branch"],
        "base_sha": claim["base_sha"], "head_sha": actual["head_sha"],
        "task_id": claim["task_id"], "work_order_path": claim["work_order_path"],
        "claim_id": claim["claim_id"], "claim_generation": claim["claim_generation"],
        "execution_holder_id": claim["execution_holder_id"],
        "scope": list(claim["mutable_scope"]), "dependencies": list(claim["dependencies"]),
        "lane_kind": "MUTATION", "provider": "codex-cli",
        "model": _nonempty(event.get("model"), "model"), "variant": "local-hook",
        "run_id": f"codex:{session_id}:{turn_id}:{tool_use_id}",
    }
    validate_lane_binding(policy, binding, actual)
    normalized = []
    for kind, source, destination in changes:
        normalized_source = _to_repo_path(root, source)
        normalized_destination = _to_repo_path(root, destination) if destination else None
        normalized.append((kind, normalized_source, normalized_destination))
    context = {
        "task_id": claim["task_id"], "claim_id": claim["claim_id"],
        "claim_generation": claim["claim_generation"],
        "execution_holder_id": claim["execution_holder_id"],
        "worktree": actual["worktree"], "branch": actual["branch"],
        "base_ancestor_of_head": actual["claim_base_ancestor"],
    }
    decision = guard.evaluate_mutation(
        policy, context,
        [guard.Change(kind, source, destination) for kind, source, destination in normalized],
        _mutation_links(root, normalized),
    )
    if not decision.safe_to_mutate:
        raise AutonomyFailure(decision.reason or "SCOPE_DENIED")
    paths = sorted({path for _, source, destination in normalized for path in (source, destination) if path})
    content_hashes = {}
    for path in paths:
        target = root / Path(path)
        try:
            metadata = target.lstat()
            if stat.S_ISREG(metadata.st_mode):
                content_hashes[path] = hashlib.sha256(target.read_bytes()).hexdigest()
            else:
                content_hashes[path] = None
        except OSError:
            content_hashes[path] = None
    response = event.get("tool_response")
    serialized_input = json.dumps(tool_input, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    serialized_response = json.dumps(response, sort_keys=True, ensure_ascii=False, default=str, separators=(",", ":"))
    observation_run_id = f"codex:{session_id}:{turn_id}:{tool_use_id}"
    effect_unknown = response is None or (
        isinstance(response, dict) and response.get("isError") is True
    )
    operation_id = (
        "codex-hook-" + hashlib.sha256(observation_run_id.encode("utf-8")).hexdigest()
        if effect_unknown else None
    )
    observation = {
        "hook_event_name": event.get("hook_event_name", "PostToolUse"),
        "tool_name": tool_name,
        "tool_use_id": tool_use_id,
        "session_id": session_id,
        "turn_id": turn_id,
        "run_id": observation_run_id,
        "operation_id": operation_id,
        "task_id": claim["task_id"],
        "claim_id": claim["claim_id"],
        "claim_generation": claim["claim_generation"],
        "execution_holder_id": claim["execution_holder_id"],
        "repo": actual["repo"],
        "worktree": actual["worktree"],
        "branch": actual["branch"],
        "codex_model": event.get("model"),
        "base_sha": claim["base_sha"],
        "head_sha": actual["head_sha"],
        "changed_paths": paths,
        "content_sha256": content_hashes,
        "input_sha256": hashlib.sha256(serialized_input.encode("utf-8")).hexdigest(),
        "result_sha256": hashlib.sha256(serialized_response.encode("utf-8")).hexdigest(),
        "effect_state": (
            "UNKNOWN" if effect_unknown else "OBSERVED"
        ),
        "publication_state": "PENDING_PUBLICATION",
    }
    handoff_path = root / claim["handoff_path"]
    handoff_text = handoff_path.read_text(encoding="utf-8")
    document, _ = _lifecycle_document(handoff_text)
    observations = document.setdefault("codex_hook_observations", [])
    if not isinstance(observations, list):
        raise AutonomyFailure("LIFECYCLE_BLOCK_MALFORMED")
    if any(isinstance(item, dict) and item.get("tool_use_id") == tool_use_id for item in observations):
        return {"recorded": True, "idempotent": True, "tool_use_id": tool_use_id}
    observations.append(observation)
    if operation_id is not None:
        _, log = _read_lifecycle_log(handoff_text, claim)
        if log.active_goal_id is None:
            raise AutonomyFailure("ACTIVE_GOAL_REQUIRED")
        now = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
        intent_id = f"env-codex-hook-intent-{uuid.uuid4().hex}"
        common = {
            "task_id": claim["task_id"], "claim_id": claim["claim_id"],
            "claim_generation": claim["claim_generation"], "goal_id": log.active_goal_id,
            "event_seq": log.events[-1].event_seq + 1, "previous_event_id": log.head_event_id,
            "terminal_result": None, "operation_id": operation_id,
            "operation_outcome": None, "published": False,
        }
        _append_lifecycle_event_to_document(document, {
            **common, "event_type": "OPERATION_INTENT", "event_id": intent_id,
            "payload": {
                "provider": "codex-cli", "model": observation["codex_model"],
                "variant": "post-tool-hook", "run_id": observation_run_id,
                "admission_evidence_sha256": observation["input_sha256"],
                "starting_head_sha": observation["head_sha"],
            },
        })
        _, pending_log = _read_lifecycle_log(
            _replace_lifecycle_block(handoff_text, document), claim
        )
        _append_lifecycle_event_to_document(document, {
            **common, "event_type": "OPERATION_OUTCOME",
            "event_seq": pending_log.events[-1].event_seq + 1,
            "event_id": f"env-codex-hook-outcome-{uuid.uuid4().hex}",
            "previous_event_id": pending_log.head_event_id,
            "operation_outcome": "UNKNOWN",
            "payload": {
                "evidence_sha256": observation["result_sha256"],
                "observed_at_utc": now,
            },
        })
    updated = _replace_lifecycle_block(handoff_text, document)
    handoff_path.write_text(updated, encoding="utf-8", newline="\n")
    return observation
def verify_published_event(root: Path, policy: guard.TrustedPolicy, claim: dict) -> dict:
    """Prove the lane handoff event log is the clean current remote head."""
    root = Path(_run_git(["rev-parse", "--show-toplevel"], root.resolve())).resolve()
    branch = claim["branch"]
    _run_git(["fetch", "origin", branch], root)
    local_head = _run_git(["rev-parse", "HEAD"], root)
    remote_head = _run_git(["rev-parse", f"origin/{branch}"], root)
    if local_head != remote_head:
        return {"ok": False, "publication_state": "PENDING_PUBLICATION", "reason": "REMOTE_HEAD_MISMATCH"}
    if _run_git(["status", "--porcelain"], root):
        return {"ok": False, "publication_state": "PENDING_PUBLICATION", "reason": "WORKTREE_DIRTY"}
    handoff_commit = _run_git(
        ["log", "-1", "--format=%H", "HEAD", "--", claim["handoff_path"]], root,
        check=False,
    )
    if not handoff_commit:
        return {"ok": False, "publication_state": "PENDING_PUBLICATION", "reason": "HANDOFF_COMMIT_MISSING"}
    handoff_tree = _run_git(["rev-parse", f"{handoff_commit}^{{tree}}"], root)
    head_tree = _run_git(["rev-parse", f"{local_head}^{{tree}}"], root)
    if handoff_tree != head_tree:
        return {"ok": False, "publication_state": "PENDING_PUBLICATION", "reason": "HANDOFF_NOT_AT_HEAD"}
    remote_handoff = _run_git(
        ["show", f"{remote_head}:{claim['handoff_path']}"], root, preserve_output=True
    )
    local_handoff = (root / claim["handoff_path"]).read_text(encoding="utf-8")
    if remote_handoff != local_handoff:
        return {"ok": False, "publication_state": "PENDING_PUBLICATION", "reason": "HANDOFF_REMOTE_MISMATCH"}
    document, _ = _lifecycle_document(remote_handoff)
    if (document.get("claim_id"), document.get("claim_generation")) != (
        claim["claim_id"], claim["claim_generation"]
    ):
        return {"ok": False, "publication_state": "PENDING_PUBLICATION", "reason": "STALE_CLAIM_GENERATION"}
    events = document.get("events")
    if not isinstance(events, list):
        return {"ok": False, "publication_state": "PENDING_PUBLICATION", "reason": "LIFECYCLE_BLOCK_MALFORMED"}
    log = guard.LifecycleLog(document["claim_id"], document["claim_generation"])
    try:
        for raw in events:
            if not isinstance(raw, dict):
                raise AutonomyFailure("LIFECYCLE_BLOCK_MALFORMED")
            if not isinstance(raw.get("published", True), bool):
                raise AutonomyFailure("LIFECYCLE_EVENT_INVALID", "published must be boolean")
            log.apply(guard.LifecycleEvent(**{**raw, "published": True}))
    except (TypeError, guard.GuardFailure) as exc:
        if isinstance(exc, guard.GuardFailure):
            raise AutonomyFailure(exc.reason, exc.detail) from None
        raise AutonomyFailure("LIFECYCLE_EVENT_INVALID", type(exc).__name__) from None
    latest = events[-1] if events else None
    unresolved_hook_observations = _has_unresolved_hook_observations(document, log)
    return {
        "ok": True,
        "publication_state": "PUBLISHED",
        "checkpoint_sha": remote_head,
        "event_head": log.head_event_id,
        "handoff_commit": handoff_commit,
        "active_goal_id": log.active_goal_id,
        "latest_event_id": latest.get("event_id") if isinstance(latest, dict) else None,
        "latest_event_type": latest.get("event_type") if isinstance(latest, dict) else None,
        "lane_status": (latest.get("payload") or {}).get("lane_status")
            if isinstance(latest, dict) and isinstance(latest.get("payload"), dict) else None,
        "unresolved_external_operations": (
            log.has_unresolved_external_operations or unresolved_hook_observations
        ),
        "unresolved_hook_observations": unresolved_hook_observations,
    }


def verify_published_checkpoint(root: Path, policy: guard.TrustedPolicy, claim: dict) -> dict:
    """Require a latest published CHECKPOINT with no unresolved effects."""
    publication = verify_published_event(root, policy, claim)
    if publication.get("ok") is not True:
        return {"ok": False, "checkpoint_state": publication.get("publication_state"), "reason": publication.get("reason")}
    if publication.get("latest_event_type") != "CHECKPOINT":
        return {"ok": False, "checkpoint_state": "PUBLISHED_BUT_STALE", "reason": "LATEST_EVENT_IS_NOT_CHECKPOINT"}
    if publication.get("unresolved_hook_observations") is True:
        return {"ok": False, "checkpoint_state": "PUBLISHED_WITH_UNKNOWN_EFFECT", "reason": "UNRESOLVED_HOOK_OBSERVATION"}
    if publication.get("unresolved_external_operations") is True:
        return {"ok": False, "checkpoint_state": "PUBLISHED_WITH_UNKNOWN_EFFECT", "reason": "UNRESOLVED_EXTERNAL_OPERATION"}
    root = Path(_run_git(["rev-parse", "--show-toplevel"], root.resolve())).resolve()
    handoff_commit = publication.get("handoff_commit")
    event_source_head = _run_git(["show", f"{handoff_commit}:{claim['handoff_path']}"], root)
    document, _ = _lifecycle_document(event_source_head)
    latest = document["events"][-1]
    payload = latest.get("payload") if isinstance(latest, dict) else None
    parent = _run_git(["rev-parse", f"{handoff_commit}^"], root, check=False)
    if not checkpoint_source_matches_parent(payload, parent):
        return {**publication, "ok": False, "checkpoint_state": "PUBLISHED_BUT_STALE", "reason": "CHECKPOINT_SOURCE_HEAD_MISMATCH"}
    return {**publication, "checkpoint_state": "PUBLISHED"}


def checkpoint_source_matches_parent(payload: Any, parent_sha: str) -> bool:
    """Bind a published checkpoint to the commit parent it describes."""
    source_sha = payload.get("source_head_sha") if isinstance(payload, dict) else None
    return bool(
        isinstance(source_sha, str)
        and re.fullmatch(r"[0-9a-f]{40}", source_sha)
        and isinstance(parent_sha, str)
        and re.fullmatch(r"[0-9a-f]{40}", parent_sha)
        and source_sha == parent_sha
    )
def read_published_lane_checkpoint(root: Path, claim: dict) -> Optional[dict]:
    """Read a parked lane only from its latest published handoff on origin."""
    branch = claim.get("branch")
    handoff_path = claim.get("handoff_path")
    if not isinstance(branch, str) or not isinstance(handoff_path, str):
        return None
    root = root.resolve()
    if subprocess.run(
        ["git", "check-ref-format", "--branch", branch],
        cwd=root, capture_output=True, check=False,
    ).returncode != 0:
        return None
    try:
        _run_git(["fetch", "origin", branch], root)
        remote_ref = f"origin/{branch}"
        remote_head = _run_git(["rev-parse", remote_ref], root)
        handoff_commit = _run_git(
            ["log", "-1", "--format=%H", remote_ref, "--", handoff_path], root,
            check=False,
        )
        if not remote_head or handoff_commit != remote_head:
            return None
        remote_handoff = _run_git(["show", f"{remote_ref}:{handoff_path}"], root)
        document, _ = _lifecycle_document(remote_handoff)
        if (document.get("claim_id"), document.get("claim_generation")) != (
            claim.get("claim_id"), claim.get("claim_generation")
        ):
            return None
        events = document.get("events")
        if not isinstance(events, list) or not events:
            return None
        log = guard.LifecycleLog(document["claim_id"], document["claim_generation"])
        for raw in events:
            if not isinstance(raw, dict) or not isinstance(raw.get("published", True), bool):
                return None
            log.apply(guard.LifecycleEvent(**{**raw, "published": True}))
        latest = events[-1]
        payload = latest.get("payload") if isinstance(latest, dict) else None
        lane_status = payload.get("lane_status") if isinstance(payload, dict) else None
        if (
            latest.get("event_type") != "CHECKPOINT"
            or lane_status != claim.get("status")
            or lane_status not in PARKED_STATES
            or log.has_unresolved_external_operations
            or _has_unresolved_hook_observations(document, log)
        ):
            return None
        parent = _run_git(["rev-parse", f"{handoff_commit}^"], root, check=False)
        if not checkpoint_source_matches_parent(payload, parent):
            return None
        return {
            "status": lane_status,
            "published": True,
            "remote_head_sha": remote_head,
            "observed_remote_head_sha": remote_head,
            "claim_id": claim["claim_id"],
            "claim_generation": claim["claim_generation"],
            "execution_holder_id": claim["execution_holder_id"],
            "event_head": log.head_event_id,
            "active_goal_id": log.active_goal_id,
        }
    except (AutonomyFailure, guard.GuardFailure, OSError, TypeError, KeyError):
        return None


def dependencies_satisfied(root: Path, policy: guard.TrustedPolicy, claim: dict, current_work: str) -> bool:
    """Use the authoritative READY transition plus explicit dependency fences."""
    if claim.get("status") != "READY":
        return False
    for dependency in claim.get("dependencies", []):
        if not isinstance(dependency, str):
            return False
        shas = re.findall(r"\b[0-9a-f]{40}\b", dependency, re.I)
        if any(not _is_ancestor(root, sha, policy.policy_revision) for sha in shas):
            return False
        task_refs = re.findall(r"\bENV-[A-Z0-9]+(?:-[A-Z0-9]+)*\b", dependency)
        for task_ref in task_refs:
            depended_claim = policy.claim_by_id(task_ref)
            if depended_claim is None:
                depended_claim = policy.claim_by_task(task_ref)
            if depended_claim is not None:
                if depended_claim["status"] not in ("CLOSED", "MERGED", "APPROVED", "RECOVERY_HOLD", "READY"):
                    return False
                continue
            line = next((item for item in current_work.splitlines() if task_ref in item), "")
            if not line or re.search(r"(?i)blocked|paused|decision_required|human_action_required|recovery_hold", line):
                return False
            if not re.search(r"(?i)\b(closed|merged|approved|ready)\b", line):
                return False
    return True


KILO_RECEIPT_STATES = ("REQUESTED", "RESULT_WRITTEN", "INGESTED_TO_SSOT", "ARCHIVED/CLEARED")


def _kilo_operation_events(log: guard.LifecycleLog, run_id: str) -> tuple[guard.LifecycleEvent, Optional[guard.LifecycleEvent]]:
    events = [event for event in log.events if event.operation_id == run_id]
    intents = [event for event in events if event.event_type == "OPERATION_INTENT"]
    outcomes = [event for event in events if event.event_type == "OPERATION_OUTCOME"]
    if len(intents) != 1 or len(outcomes) > 1:
        raise AutonomyFailure("KILO_OPERATION_EVIDENCE_INVALID")
    return intents[0], outcomes[0] if outcomes else None


def _trusted_kilo_binding(
    root: Path, claim: dict, actual: dict, run_id: str, intent: guard.LifecycleEvent
) -> dict:
    payload = intent.payload
    if (
        intent.task_id != claim["task_id"]
        or intent.claim_id != claim["claim_id"]
        or intent.claim_generation != claim["claim_generation"]
        or intent.operation_id != run_id
        or not isinstance(payload, dict)
        or payload.get("run_id") != run_id
        or payload.get("work_order_path") != claim["work_order_path"]
        or payload.get("scope") != list(claim["mutable_scope"])
        or payload.get("dependencies") != list(claim["dependencies"])
        or payload.get("lane_kind") != "MUTATION"
    ):
        raise AutonomyFailure("KILO_RECEIPT_IDENTITY_MISMATCH")
    provider, model, variant = (payload.get(key) for key in ("provider", "model", "variant"))
    if not all(isinstance(value, str) and value for value in (provider, model, variant)):
        raise AutonomyFailure("KILO_RECEIPT_INVALID", "operation intent route is incomplete")
    if (
        provider.casefold() != "cointh-glm"
        or (model.casefold(), variant.casefold())
        not in (("glm-5.3", "max"), ("glm-5.3", "flash"))
    ):
        raise AutonomyFailure("KILO_ROUTE_UNSUPPORTED")
    starting_head = payload.get("starting_head_sha")
    admission_digest = payload.get("admission_evidence_sha256")
    if not isinstance(starting_head, str) or not re.fullmatch(r"[0-9a-f]{40}", starting_head):
        raise AutonomyFailure("KILO_RECEIPT_INVALID", "operation intent lacks exact starting HEAD")
    if not isinstance(admission_digest, str) or not re.fullmatch(r"[0-9a-f]{64}", admission_digest):
        raise AutonomyFailure("KILO_ADMISSION_UNVERIFIED")
    if (
        actual.get("repo", "").casefold() != REPO_SLUG.casefold()
        or _norm_worktree(actual.get("worktree", "")) != _norm_worktree(claim["worktree"])
        or actual.get("branch") != claim["branch"]
        or actual.get("claim_base_ancestor") is not True
        or actual.get("current_policy_ancestor") is not True
        or not _is_ancestor(root, claim["base_sha"], starting_head)
        or not _is_ancestor(root, starting_head, actual["head_sha"])
    ):
        raise AutonomyFailure("KILO_RECEIPT_CONTEXT_DRIFT")
    return {
        "repo": REPO_SLUG,
        "task_id": claim["task_id"],
        "claim_id": claim["claim_id"],
        "claim_generation": claim["claim_generation"],
        "execution_holder_id": claim["execution_holder_id"],
        "worktree": actual["worktree"],
        "branch": actual["branch"],
        "base_sha": claim["base_sha"],
        "head_sha": starting_head,
        "provider": provider,
        "model": model,
        "variant": variant,
        "run_id": run_id,
        "operation_intent_event_id": intent.event_id,
        "work_order_path": claim["work_order_path"],
        "scope": list(claim["mutable_scope"]),
        "dependencies": list(claim["dependencies"]),
        "lane_kind": "MUTATION",
    }


def _parse_aware_utc_timestamp(value: Any) -> Optional[dt.datetime]:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return None
    return parsed.astimezone(dt.timezone.utc)


def _validate_persisted_kilo_receipt(
    receipt: dict,
    binding: dict,
    intent: guard.LifecycleEvent,
    outcome: Optional[guard.LifecycleEvent],
    log: guard.LifecycleLog,
) -> None:
    """Re-derive stored receipt claims from the handoff operation/checkpoint events."""
    if receipt.get("run_id") != binding["run_id"] or receipt.get("binding") != binding:
        raise AutonomyFailure("KILO_RECEIPT_IDENTITY_MISMATCH")
    state = receipt.get("state")
    evidence = receipt.get("last_evidence")
    if not isinstance(evidence, dict):
        raise AutonomyFailure("KILO_RECEIPT_RECORD_INVALID")
    if state == "REQUESTED":
        payload = intent.payload if isinstance(intent.payload, dict) else {}
        admission = evidence.get("admission")
        if (
            set(evidence) != {"operation_intent_event_id", "requested_at_utc", "admission"}
            or evidence.get("operation_intent_event_id") != intent.event_id
            or not isinstance(admission, dict)
            or set(admission) != {
                "verified", "adapter_status", "proxy_quota_status", "upstream_model_status",
                "external_call_started", "provider", "model", "variant",
                "evidence_sha256", "observed_at_utc",
            }
            or admission.get("verified") is not True
            or admission.get("adapter_status") != "READY"
            or admission.get("proxy_quota_status") != "READY"
            or admission.get("upstream_model_status") != "READY"
            or admission.get("external_call_started") is not False
            or admission.get("provider") != binding["provider"]
            or admission.get("model") != binding["model"]
            or admission.get("variant") != binding["variant"]
            or admission.get("evidence_sha256") != payload.get("admission_evidence_sha256")
            or not isinstance(admission.get("evidence_sha256"), str)
            or not re.fullmatch(r"[0-9a-f]{64}", admission["evidence_sha256"])
        ):
            raise AutonomyFailure("KILO_RECEIPT_RECORD_INVALID")
        requested_at = _parse_aware_utc_timestamp(evidence.get("requested_at_utc"))
        observed_at = _parse_aware_utc_timestamp(admission.get("observed_at_utc"))
        if (
            requested_at is None or observed_at is None
            or (requested_at - observed_at).total_seconds() < 0
            or (requested_at - observed_at).total_seconds() > PROVIDER_EVIDENCE_MAX_AGE_SECONDS
        ):
            raise AutonomyFailure("KILO_RECEIPT_RECORD_INVALID")
        expected = {
            "operation_intent_event_id": intent.event_id,
            "requested_at_utc": evidence["requested_at_utc"],
            "admission": admission,
        }
    elif state in ("RESULT_WRITTEN", "INGESTED_TO_SSOT", "ARCHIVED/CLEARED"):
        if outcome is None or not isinstance(outcome.payload, dict):
            raise AutonomyFailure("KILO_RESULT_NOT_IN_HANDOFF")
        digest = outcome.payload.get("evidence_sha256")
        if not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest):
            raise AutonomyFailure("KILO_RESULT_NOT_IN_HANDOFF")
        expected = {
            "result_sha256": digest,
            "result_status": outcome.operation_outcome,
            "handoff_event_id": outcome.event_id,
        }
        if state in ("INGESTED_TO_SSOT", "ARCHIVED/CLEARED"):
            effect = log.operation_record(binding["run_id"])
            if effect["outcome"] == "UNKNOWN" and effect.get("reconciled_outcome") not in ("SUCCEEDED", "FAILED"):
                raise AutonomyFailure("UNRESOLVED_EXTERNAL_OPERATION")
            expected.update({
                "ingested_event_id": outcome.event_id,
                "ingested_result_sha256": digest,
            })
        if state == "ARCHIVED/CLEARED":
            archive_event_id = evidence.get("archive_checkpoint_event_id")
            archive_source_sha = evidence.get("archive_checkpoint_source_sha")
            archive_event = next(
                (event for event in log.events if event.event_id == archive_event_id), None
            )
            if (
                archive_event is None or archive_event.event_type != "CHECKPOINT"
                or not isinstance(archive_event.payload, dict)
                or archive_event.payload.get("source_head_sha") != archive_source_sha
                or not isinstance(archive_source_sha, str)
                or not re.fullmatch(r"[0-9a-f]{40}", archive_source_sha)
            ):
                raise AutonomyFailure("KILO_RECEIPT_NOT_DURABLE")
            expected.update({
                "archive_checkpoint_event_id": archive_event_id,
                "archive_checkpoint_source_sha": archive_source_sha,
            })
    else:
        raise AutonomyFailure("KILO_RECEIPT_RECORD_INVALID")
    if evidence != expected:
        raise AutonomyFailure("KILO_RECEIPT_RECORD_INVALID")


def transition_kilo_receipt(
    root: Path,
    policy: guard.TrustedPolicy,
    run_id: str,
    next_state: str,
    *,
    result_sha256: Optional[str] = None,
    result_status: Optional[str] = None,
) -> dict:
    """Persist one Kilo receipt transition in the existing published lane handoff."""
    if not isinstance(run_id, str) or not run_id.strip() or next_state not in KILO_RECEIPT_STATES:
        raise AutonomyFailure("KILO_RECEIPT_INVALID")
    claim = policy.claim_by_task("ENV-AUTONOMY-001")
    if claim is None:
        raise AutonomyFailure("UNKNOWN_TASK")
    actual = _actual_context(root, claim)
    publication = verify_published_event(root, policy, claim)
    if publication.get("ok") is not True:
        raise AutonomyFailure("KILO_HANDOFF_NOT_PUBLISHED", publication.get("reason", "unknown"))
    root = Path(actual["worktree"]).resolve()
    handoff_path = root / claim["handoff_path"]
    handoff_text = handoff_path.read_text(encoding="utf-8")
    document, log = _read_lifecycle_log(handoff_text, claim)
    intent, outcome = _kilo_operation_events(log, run_id)
    binding = _trusted_kilo_binding(root, claim, actual, run_id, intent)
    receipts = document.setdefault("kilo_receipts", [])
    if not isinstance(receipts, list) or any(not isinstance(item, dict) for item in receipts):
        raise AutonomyFailure("KILO_RECEIPT_STORE_MALFORMED")
    existing = next((item for item in receipts if item.get("run_id") == run_id), None)
    current_state = existing.get("state") if existing else None
    if existing is not None:
        _validate_persisted_kilo_receipt(existing, binding, intent, outcome, log)
    allowed = {
        None: "REQUESTED",
        "REQUESTED": "RESULT_WRITTEN",
        "RESULT_WRITTEN": "INGESTED_TO_SSOT",
        "INGESTED_TO_SSOT": "ARCHIVED/CLEARED",
    }
    if allowed.get(current_state) != next_state:
        raise AutonomyFailure("KILO_RECEIPT_OUT_OF_ORDER")

    if next_state == "REQUESTED":
        if outcome is not None:
            raise AutonomyFailure("KILO_REQUEST_ALREADY_HAS_OUTCOME")
        if existing is None:
            preflight_ctx = {
                "task_id": claim["task_id"], "claim_id": claim["claim_id"],
                "claim_generation": claim["claim_generation"],
                "execution_holder_id": claim["execution_holder_id"],
                "worktree": actual["worktree"], "branch": actual["branch"],
                "base_ancestor_of_head": actual["claim_base_ancestor"],
            }
            decision = guard.preflight(policy, preflight_ctx)
            if not decision.safe_to_mutate:
                raise AutonomyFailure(decision.reason or "PREFLIGHT_DENIED")
        admission = _require_kilo_admission(root, binding, intent)
        requested_at_utc = admission.pop("validated_at_utc")
        receipt = {
            "run_id": run_id,
            "binding": binding,
            "state": next_state,
            "last_evidence": {
                "operation_intent_event_id": intent.event_id,
                "requested_at_utc": requested_at_utc,
                "admission": admission,
            },
        }
        receipts.append(receipt)
    elif next_state == "RESULT_WRITTEN":
        digest = result_sha256
        if (
            outcome is None
            or not isinstance(digest, str)
            or not re.fullmatch(r"[0-9a-f]{64}", digest)
            or result_status not in guard.OPERATION_OUTCOMES
            or outcome.operation_outcome != result_status
            or not isinstance(outcome.payload, dict)
            or outcome.payload.get("evidence_sha256") != digest
        ):
            raise AutonomyFailure("KILO_RESULT_NOT_IN_HANDOFF")
        receipt = existing
        receipt["state"] = next_state
        receipt["last_evidence"] = {
            "result_sha256": digest,
            "result_status": result_status,
            "handoff_event_id": outcome.event_id,
        }
    elif next_state == "INGESTED_TO_SSOT":
        if outcome is None or not isinstance(outcome.payload, dict):
            raise AutonomyFailure("KILO_RECEIPT_NOT_INGESTED")
        effect = log.operation_record(run_id)
        if effect["outcome"] == "UNKNOWN" and effect.get("reconciled_outcome") not in ("SUCCEEDED", "FAILED"):
            raise AutonomyFailure("UNRESOLVED_EXTERNAL_OPERATION")
        prior = existing.get("last_evidence")
        if not isinstance(prior, dict) or prior.get("handoff_event_id") != outcome.event_id:
            raise AutonomyFailure("KILO_RECEIPT_NOT_INGESTED")
        receipt = existing
        receipt["state"] = next_state
        receipt["last_evidence"] = {
            **prior,
            "ingested_event_id": outcome.event_id,
            "ingested_result_sha256": outcome.payload.get("evidence_sha256"),
        }
    else:
        effect = log.operation_record(run_id)
        if (
            outcome is None
            or (effect["outcome"] == "UNKNOWN" and effect.get("reconciled_outcome") not in ("SUCCEEDED", "FAILED"))
            or log.has_unresolved_external_operations
            or _has_unresolved_hook_observations(document, log)
        ):
            raise AutonomyFailure("KILO_RECEIPT_NOT_DURABLE")
        if existing.get("last_evidence", {}).get("ingested_event_id") != outcome.event_id:
            raise AutonomyFailure("KILO_RECEIPT_NOT_INGESTED")
        checkpoint_event_id = f"env-kilo-receipt-checkpoint-{uuid.uuid4().hex}"
        checkpoint = {
            "task_id": claim["task_id"], "claim_id": claim["claim_id"],
            "claim_generation": claim["claim_generation"], "goal_id": log.active_goal_id,
            "event_type": "CHECKPOINT", "event_seq": log.events[-1].event_seq + 1,
            "event_id": checkpoint_event_id, "previous_event_id": log.head_event_id,
            "terminal_result": None, "operation_id": None, "operation_outcome": None,
            "payload": {
                "lane_status": "ACTIVE", "source_head_sha": actual["head_sha"],
                "recorded_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
            },
            "published": False,
        }
        existing["state"] = next_state
        existing["last_evidence"] = {
            **existing["last_evidence"],
            "archive_checkpoint_event_id": checkpoint_event_id,
            "archive_checkpoint_source_sha": actual["head_sha"],
        }
        _append_lifecycle_event_to_document(document, checkpoint)

    updated = _replace_lifecycle_block(handoff_text, document)
    handoff_path.write_text(updated, encoding="utf-8", newline="\n")
    return {
        "ok": True,
        "run_id": run_id,
        "state": next_state,
        "binding": binding,
        "publication_state": "PENDING_PUBLICATION",
    }


def verify_kilo_receipt(root: Path, policy: guard.TrustedPolicy, run_id: str) -> dict:
    """Verify receipt state from the clean remote handoff and its actual lifecycle events."""
    claim = policy.claim_by_task("ENV-AUTONOMY-001")
    if claim is None:
        raise AutonomyFailure("UNKNOWN_TASK")
    actual = _actual_context(root, claim)
    publication = verify_published_event(root, policy, claim)
    if publication.get("ok") is not True:
        return {"ok": False, "reason": "KILO_HANDOFF_NOT_PUBLISHED"}
    handoff_text = (Path(actual["worktree"]) / claim["handoff_path"]).read_text(encoding="utf-8")
    document, log = _read_lifecycle_log(handoff_text, claim)
    receipts = document.get("kilo_receipts", [])
    if not isinstance(receipts, list) or any(not isinstance(item, dict) for item in receipts):
        raise AutonomyFailure("KILO_RECEIPT_STORE_MALFORMED")
    receipt = next((item for item in receipts if item.get("run_id") == run_id), None)
    if receipt is None or receipt.get("state") not in KILO_RECEIPT_STATES:
        return {"ok": False, "reason": "KILO_RECEIPT_NOT_FOUND"}
    intent, outcome = _kilo_operation_events(log, run_id)
    binding = _trusted_kilo_binding(Path(actual["worktree"]), claim, actual, run_id, intent)
    try:
        _validate_persisted_kilo_receipt(receipt, binding, intent, outcome, log)
    except AutonomyFailure as exc:
        return {"ok": False, "reason": exc.reason, "state": receipt.get("state")}
    if receipt.get("binding") != binding:
        return {"ok": False, "reason": "KILO_RECEIPT_IDENTITY_MISMATCH"}
    state = receipt["state"]
    evidence = receipt.get("last_evidence")
    if not isinstance(evidence, dict):
        return {"ok": False, "reason": "KILO_RECEIPT_EVIDENCE_MISSING", "state": state}
    if state in ("RESULT_WRITTEN", "INGESTED_TO_SSOT", "ARCHIVED/CLEARED"):
        if (
            outcome is None
            or evidence.get("result_sha256", evidence.get("ingested_result_sha256"))
            != (outcome.payload or {}).get("evidence_sha256")
        ):
            return {"ok": False, "reason": "KILO_RESULT_NOT_IN_HANDOFF", "state": state}
        effect = log.operation_record(run_id)
        if effect["outcome"] == "UNKNOWN" and effect.get("reconciled_outcome") not in ("SUCCEEDED", "FAILED"):
            return {"ok": False, "reason": "UNRESOLVED_EXTERNAL_OPERATION", "state": state}
    if state == "ARCHIVED/CLEARED":
        checkpoint = verify_published_checkpoint(root, policy, claim)
        if (
            checkpoint.get("ok") is not True
            or checkpoint.get("latest_event_id") != evidence.get("archive_checkpoint_event_id")
            or checkpoint.get("checkpoint_sha") != publication.get("checkpoint_sha")
        ):
            return {"ok": False, "reason": "KILO_RECEIPT_NOT_DURABLE", "state": state}
        return {
            "ok": True, "run_id": run_id, "state": state,
            "published_checkpoint_sha": checkpoint["checkpoint_sha"],
            "handoff_event_id": evidence.get("ingested_event_id"),
        }
    return {
        "ok": True, "run_id": run_id, "state": state,
        "unresolved_external_operations": publication.get("unresolved_external_operations", False),
        **({
            "admission_evidence_state": "VERIFIED_AT_REQUEST_TIME",
            "admission_evidence_sha256": evidence["admission"]["evidence_sha256"],
        } if state == "REQUESTED" else {}),
        "handoff_event_id": evidence.get("handoff_event_id") or evidence.get("operation_intent_event_id"),
    }


def _parse_patch_paths(patch_text: str) -> list[tuple[str, str, Optional[str]]]:
    changes: list[tuple[str, str, Optional[str]]] = []
    for line in patch_text.splitlines():
        match = re.match(r"\*\*\*\s+(Update|Add|Delete) File:\s+(.+)$", line)
        if match:
            kind = {"Update": "modify", "Add": "add", "Delete": "delete"}[match.group(1)]
            changes.append((kind, match.group(2).strip(), None))
            continue
        move = re.match(r"\*\*\*\s+Move to:\s+(.+)$", line)
        if move and changes and changes[-1][2] is None:
            _, old_path, _ = changes[-1]
            changes[-1] = ("rename", old_path, move.group(1).strip())
    if not changes:
        for line in patch_text.splitlines():
            match = re.match(r"\+\+\+\s+b/(.+)$", line)
            if match:
                changes.append(("modify", match.group(1), None))
    return changes


def _tool_changes(tool_name: str, tool_input: dict) -> list[tuple[str, str, Optional[str]]]:
    if tool_name in ("apply_patch", "ApplyPatch"):
        patch_text = next(
            (tool_input.get(key) for key in ("patch", "command", "input")
             if isinstance(tool_input.get(key), str)),
            None,
        )
        return _parse_patch_paths(patch_text) if patch_text is not None else []
    if tool_name in ("Edit", "Write"):
        raw_path = next(
            (tool_input.get(key) for key in ("file_path", "filePath", "path", "filename")
             if isinstance(tool_input.get(key), str)),
            None,
        )
        if raw_path is None:
            return []
        kind = "modify" if tool_name == "Edit" or Path(raw_path).exists() else "add"
        return [(kind, raw_path, None)]
    return []


def _to_repo_path(root: Path, raw_path: str) -> str:
    path = Path(raw_path)
    if path.is_absolute():
        try:
            return path.resolve(strict=False).relative_to(root.resolve()).as_posix()
        except ValueError:
            raise AutonomyFailure("PATH_OUTSIDE_REPOSITORY") from None
    return guard.canonicalize_path(raw_path)


def _working_tree_paths(root: Path) -> list[str]:
    paths = set()
    for args in (["diff", "--name-only"], ["diff", "--cached", "--name-only"], ["ls-files", "--others", "--exclude-standard"]):
        output = _run_git(args, root)
        paths.update(line for line in output.splitlines() if line)
    return sorted(paths, key=str.casefold)


def _mutation_links(root: Path, changes: list[tuple[str, str, Optional[str]]]) -> list[guard.LinkRequest]:
    """Re-authorize changed paths through symlinks/junctions using the Guard core."""
    root = root.resolve()
    reparse_flag = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0)
    requests = []
    seen = set()
    for _, source, destination in changes:
        for raw_path in (source, destination):
            if not raw_path:
                continue
            canonical = _to_repo_path(root, raw_path)
            cursor = root
            for segment in Path(canonical).parts:
                cursor = cursor / segment
                try:
                    metadata = cursor.lstat()
                except OSError:
                    continue
                is_link = stat.S_ISLNK(metadata.st_mode) or bool(
                    getattr(metadata, "st_file_attributes", 0) & reparse_flag
                )
                if not is_link:
                    continue
                link_path = cursor.relative_to(root).as_posix()
                if link_path.casefold() in seen:
                    continue
                seen.add(link_path.casefold())
                try:
                    resolved = cursor.resolve(strict=False)
                    resolved_repo_path = resolved.relative_to(root).as_posix()
                    inside_root = True
                except (OSError, RuntimeError, ValueError):
                    resolved_repo_path = None
                    inside_root = False
                requests.append(guard.LinkRequest(link_path, resolved_repo_path, inside_root))
    return requests


def classify_shell_command(command: str) -> dict:
    """Conservative command classifier used only as an early local hook."""
    if not isinstance(command, str) or not command.strip():
        return {"kind": "UNKNOWN", "reason": "EMPTY_COMMAND"}
    text = command.strip()
    normalized_text = text.replace("\\", "/").casefold()
    if ".env" in normalized_text or "data/raw" in normalized_text:
        return {"kind": "DENY", "reason": "PROTECTED_LOCAL_DATA_PATH"}
    if re.search(r"(?i)(?:^|[\\/])\.env(?:\b|$)|data[\\/]raw(?:[\\/]|\b)", text):
        return {"kind": "DENY", "reason": "PROTECTED_LOCAL_DATA_PATH"}
    # No shell grammar is parsed after tokenization: reject expansion,
    # substitution, grouping and redirection syntax before shlex sees it.
    if re.search(r"[;&|<>`$()\r\n]", text):
        return {"kind": "UNKNOWN", "reason": "COMPOUND_SHELL_COMMAND_FORBIDDEN"}
    try:
        tokens = shlex.split(text, posix=True)
    except ValueError:
        return {"kind": "UNKNOWN", "reason": "COMMAND_PARSE_FAILED"}
    if not tokens:
        return {"kind": "UNKNOWN", "reason": "EMPTY_COMMAND"}
    if tokens[0].casefold() == "git" and len(tokens) > 1:
        sub = tokens[1].casefold()
        if sub == "add":
            return {"kind": "GIT_STAGE_OR_COMMIT", "action": "add", "changes": []}
        if sub == "commit":
            return {"kind": "GIT_STAGE_OR_COMMIT", "action": "commit", "changes": []}
        if sub == "push":
            if any(item in ("--force", "-f", "--force-with-lease") for item in tokens):
                return {"kind": "DENY", "reason": "FORCE_PUSH_FORBIDDEN"}
            return {"kind": "GIT_PUSH", "changes": []}
        if sub in ("reset", "clean", "checkout", "switch", "apply", "rm", "mv", "worktree", "update-ref"):
            return {"kind": "DENY", "reason": "UNSAFE_GIT_MUTATION"}
        if sub == "fetch":
            if len(tokens) != 4 or tokens[2] != "origin" or tokens[3].startswith("-"):
                return {"kind": "UNKNOWN", "reason": "FETCH_TARGET_UNBOUND"}
            return {"kind": "GIT_FETCH", "changes": []}
        if sub == "status" and tokens in (
            ["git", "status"], ["git", "status", "--short"],
            ["git", "status", "--porcelain"], ["git", "status", "-sb"],
        ):
            return {"kind": "READ_ONLY", "changes": []}
        if sub == "diff" and tokens == ["git", "diff", "--check"]:
            return {"kind": "READ_ONLY", "changes": []}
        if sub == "branch" and tokens in (
            ["git", "branch"], ["git", "branch", "--list"],
            ["git", "branch", "--show-current"],
        ):
            return {"kind": "READ_ONLY", "changes": []}
        if sub == "show" and len(tokens) == 3 and ":" in tokens[2]:
            revision, path = tokens[2].split(":", 1)
            if (
                revision and not revision.startswith("-")
                and re.fullmatch(r"[A-Za-z0-9_./@{}^~+-]+", revision)
                and path and not path.startswith("/")
                and all(part not in ("", ".", "..") for part in path.split("/"))
            ):
                return {"kind": "READ_ONLY", "changes": []}
        if sub == "rev-parse" and tokens in (
            ["git", "rev-parse", "HEAD"], ["git", "rev-parse", "origin/main"],
            ["git", "rev-parse", "--show-toplevel"],
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        ):
            return {"kind": "READ_ONLY", "changes": []}
        if sub == "remote" and tokens[2:] == ["-v"]:
            return {"kind": "READ_ONLY", "changes": []}
    if tokens[0].casefold() == "rg":
        # Backslash means a path separator to Windows shells and an escape to
        # POSIX shells. Do not let platform-dependent tokenization rewrite an
        # rg operand before the repository-path validator sees it.
        if "\\" in text:
            return {"kind": "UNKNOWN", "reason": "AMBIGUOUS_RIPGREP_BACKSLASH"}
        read_paths = _parse_literal_ripgrep_read_paths(tokens)
        if read_paths is None:
            return {"kind": "UNKNOWN", "reason": "UNSAFE_RIPGREP_OPTION"}
        return {"kind": "READ_ONLY", "changes": [], "read_paths": read_paths}
    if tokens[0].casefold() in ("get-content", "select-string"):
        if "\\" in text:
            return {"kind": "UNKNOWN", "reason": "UNSAFE_SHELL_READ_ARGUMENTS"}
        read_paths = _parse_literal_shell_read_paths(tokens)
        if read_paths is None:
            return {"kind": "UNKNOWN", "reason": "UNSAFE_SHELL_READ_ARGUMENTS"}
        return {"kind": "READ_ONLY", "changes": [], "read_paths": read_paths}
    if tokens[0].casefold() in ("python", "python3", "py"):
        args = tokens[1:]
        if args and args[0] == "-3":
            args = args[1:]
        if len(args) >= 2 and args[0].replace("\\", "/") == "scripts/env_autonomy_runtime.py":
            if args[1] in ("status", "refill", "verify-checkpoint", "verify-event", "kilo-preflight", "route", "kilo-receipt-verify"):
                return {"kind": "READ_ONLY", "changes": []}
            if args[1] in ("append-event", "kilo-receipt-transition"):
                return {"kind": "AUTONOMY_EVENT", "changes": [("modify", HANDOFF, None)]}
        if args and args[0].replace("\\", "/") in (
            "scripts/env_coordination_guard.py", "scripts/test_env_autonomy_runtime.py",
            "scripts/test_env_coordination_guard.py", "scripts/test_workflow_action_runtimes.py",
            "scripts/check_workflow_action_runtimes.py", "scripts/test_split_sql.py",
        ):
            return {"kind": "READ_ONLY", "changes": []}
    if tokens[:3] == ["uv", "run", "python"] and len(tokens) >= 4 and tokens[3] in (
        "scripts/test_env_autonomy_runtime.py", "scripts/test_workflow_action_runtimes.py",
        "scripts/check_workflow_action_runtimes.py", "scripts/test_split_sql.py",
    ):
        return {"kind": "READ_ONLY", "changes": []}
    if tokens[0].casefold() in ("set-content", "add-content", "out-file", "remove-item", "move-item", "new-item", "copy-item"):
        return {"kind": "UNKNOWN", "reason": "SHELL_WRITE_PATH_UNPARSED"}
    return {"kind": "UNKNOWN", "reason": "UNCLASSIFIED_SHELL_COMMAND"}
def hook_pretool(event: dict, root: Path) -> dict:
    """Bind each mutation to this claim and evaluate all changed endpoints."""
    tool_name = event.get("tool_name")
    tool_input = event.get("tool_input")
    if not isinstance(tool_name, str) or not isinstance(tool_input, dict):
        return {"permissionDecision": "deny", "reason": "MISSING_TOOL_IDENTITY"}
    classified = None
    if tool_name in ("apply_patch", "ApplyPatch", "Edit", "Write"):
        changes = _tool_changes(tool_name, tool_input)
        if not changes:
            return {"permissionDecision": "deny", "reason": "UNCLASSIFIED_PATCH_SCOPE"}
    elif tool_name == "Bash":
        classified = classify_shell_command(tool_input.get("command"))
        if classified["kind"] == "READ_ONLY":
            read_paths = classified.get("read_paths")
            if read_paths is not None and not _safe_repository_read_paths(root, read_paths):
                return {"permissionDecision": "deny", "reason": "UNSAFE_READ_PATH"}
            return {"permissionDecision": "allow"}
        if classified["kind"] == "DENY":
            return {"permissionDecision": "deny", "reason": classified["reason"]}
        if classified["kind"] not in ("GIT_STAGE_OR_COMMIT", "GIT_PUSH", "GIT_FETCH", "AUTONOMY_EVENT"):
            return {"permissionDecision": "deny", "reason": classified.get("reason", "UNCLASSIFIED_MUTATION")}
        changes = list(classified.get("changes", []))
    else:
        return {"permissionDecision": "deny", "reason": "UNSUPPORTED_MUTATION_TOOL"}

    try:
        policy, _ = load_trusted_policy(root, refresh=True)
        root = Path(_run_git(["rev-parse", "--show-toplevel"], root)).resolve()
        claim = policy.claim_by_task("ENV-AUTONOMY-001")
        if claim is None:
            raise AutonomyFailure("UNKNOWN_TASK")
        actual = _actual_context(root, claim)
        root = Path(actual["worktree"]).resolve()
        session_id, turn_id, tool_use_id = (event.get(key) for key in ("session_id", "turn_id", "tool_use_id"))
        if not all(isinstance(value, str) and value for value in (session_id, turn_id, tool_use_id)):
            raise AutonomyFailure("RUN_IDENTITY_MISSING")
        binding = {
            "repo": REPO_SLUG, "worktree": actual["worktree"], "branch": actual["branch"],
            "base_sha": claim["base_sha"], "head_sha": actual["head_sha"],
            "task_id": claim["task_id"], "work_order_path": claim["work_order_path"],
            "claim_id": claim["claim_id"], "claim_generation": claim["claim_generation"],
            "execution_holder_id": claim["execution_holder_id"],
            "scope": list(claim["mutable_scope"]), "dependencies": list(claim["dependencies"]),
            "lane_kind": "MUTATION", "provider": "codex-cli",
            "model": _nonempty(event.get("model"), "model"), "variant": "local-hook",
            "run_id": f"codex:{session_id}:{turn_id}:{tool_use_id}",
        }
        validate_lane_binding(policy, binding, actual)

        if tool_name == "Bash" and classified["kind"] == "GIT_FETCH":
            tokens = shlex.split(tool_input["command"], posix=True)
            if tokens not in (
                ["git", "fetch", "origin", "main"],
                ["git", "fetch", "origin", claim["branch"]],
            ):
                raise AutonomyFailure("FETCH_TARGET_UNBOUND")
            return {"permissionDecision": "allow"}

        handoff_path = root / claim["handoff_path"]
        handoff_text = handoff_path.read_text(encoding="utf-8")
        lifecycle_document, lifecycle_log = _read_lifecycle_log(handoff_text, claim)
        unresolved_hook_observations = _has_unresolved_hook_observations(
            lifecycle_document, lifecycle_log
        )
        unresolved = lifecycle_log.has_unresolved_external_operations or unresolved_hook_observations
        may_publish_or_reconcile = (
            classified is not None
            and classified["kind"] in ("GIT_STAGE_OR_COMMIT", "GIT_PUSH")
        ) or _is_reconciliation_command(tool_name, tool_input)
        may_progress_pending_operation = (
            not unresolved_hook_observations
            and _is_pending_operation_progress_command(tool_name, tool_input, lifecycle_log)
        )
        if unresolved and not (may_publish_or_reconcile or may_progress_pending_operation):
            raise AutonomyFailure("UNRESOLVED_EXTERNAL_EFFECT")

        if tool_name == "Bash" and classified["kind"] == "GIT_STAGE_OR_COMMIT":
            tokens = shlex.split(tool_input["command"], posix=True)
            action = classified["action"]
            if action == "commit":
                if len(tokens) not in (4, 5) or tokens[:3] != ["git", "commit", "-m"]:
                    raise AutonomyFailure("COMMIT_OPTIONS_UNSUPPORTED")
                if len(tokens) == 5 and tokens[4] != "--signoff":
                    raise AutonomyFailure("COMMIT_OPTIONS_UNSUPPORTED")
                if not tokens[3].strip():
                    raise AutonomyFailure("COMMIT_MESSAGE_REQUIRED")
                paths = [path for path in _run_git(["diff", "--cached", "--name-only"], root).splitlines() if path]
            else:
                if any(token in ("-f", "--force", "--patch", "-p", "--edit", "--intent-to-add") for token in tokens[2:]):
                    raise AutonomyFailure("GIT_ADD_OPTION_FORBIDDEN")
                explicit = []
                for token in tokens[2:]:
                    if token in ("-A", "--all", "--"):
                        continue
                    if token.startswith("-"):
                        raise AutonomyFailure("GIT_ADD_OPTION_UNSUPPORTED")
                    explicit.append(token)
                paths = _working_tree_paths(root)
                if explicit and explicit != ["."]:
                    exact = [guard.canonicalize_path(path) for path in explicit]
                    paths = [path for path in paths if any(
                        path.casefold() == wanted.casefold()
                        or path.casefold().startswith(wanted.casefold().rstrip("/") + "/")
                        for wanted in exact
                    )]
            if not paths:
                raise AutonomyFailure("NO_CLAIMED_CHANGES_TO_PUBLISH")
            changes = [("modify", path, None) for path in paths]
        elif tool_name == "Bash" and classified["kind"] == "GIT_PUSH":
            tokens = shlex.split(tool_input["command"], posix=True)
            if len(tokens) != 4 or tokens[:3] != ["git", "push", "origin"] or tokens[3] != claim["branch"]:
                raise AutonomyFailure("PUSH_TARGET_UNBOUND")
            remote_branch = _run_git(["rev-parse", f"origin/{claim['branch']}"], root, check=False)
            if remote_branch and not _is_ancestor(root, remote_branch, actual["head_sha"]):
                raise AutonomyFailure("NON_FAST_FORWARD_PUSH")
            if _run_git(["status", "--porcelain"], root):
                raise AutonomyFailure("PUBLISH_REQUIRES_CLEAN_WORKTREE")
            name_status = _run_git(["diff", "--name-status", f"origin/main...{actual['head_sha']}"], root)
            changes = []
            for row in name_status.splitlines():
                fields = row.split("\t")
                if len(fields) == 2:
                    kind = "add" if fields[0] == "A" else "delete" if fields[0] == "D" else "modify"
                    changes.append((kind, fields[1], None))
                elif len(fields) == 3 and fields[0].startswith("R"):
                    changes.append(("rename", fields[1], fields[2]))
                else:
                    raise AutonomyFailure("GIT_DIFF_STATUS_UNSUPPORTED")
            if not changes:
                raise AutonomyFailure("NO_CLAIMED_CHANGES_TO_PUBLISH")
        elif tool_name == "Bash" and classified["kind"] == "AUTONOMY_EVENT":
            try:
                runtime_tokens = shlex.split(tool_input["command"], posix=True)
            except ValueError:
                raise AutonomyFailure("AUTONOMY_EVENT_COMMAND_UNSUPPORTED") from None
            if runtime_tokens and runtime_tokens[0] in ("python", "python3", "py"):
                runtime_tokens = runtime_tokens[1:]
                if runtime_tokens[:1] == ["-3"]:
                    runtime_tokens = runtime_tokens[1:]
            if (
                len(runtime_tokens) < 3
                or runtime_tokens[0].replace("\\", "/") != "scripts/env_autonomy_runtime.py"
                or runtime_tokens[1] not in ("append-event", "kilo-receipt-transition")
            ):
                raise AutonomyFailure("AUTONOMY_EVENT_COMMAND_UNSUPPORTED")

        normalized = []
        for kind, source, destination in changes:
            normalized_source = _to_repo_path(root, source)
            normalized_destination = _to_repo_path(root, destination) if destination else None
            normalized.append((kind, normalized_source, normalized_destination))
        ctx = {
            "task_id": claim["task_id"], "claim_id": claim["claim_id"],
            "claim_generation": claim["claim_generation"],
            "execution_holder_id": claim["execution_holder_id"],
            "worktree": actual["worktree"], "branch": actual["branch"],
            "base_ancestor_of_head": actual["claim_base_ancestor"],
        }
        decision = guard.evaluate_mutation(
            policy, ctx,
            [guard.Change(kind, source, destination) for kind, source, destination in normalized],
            _mutation_links(root, normalized),
        )
        if not decision.safe_to_mutate:
            raise AutonomyFailure(decision.reason or "SCOPE_DENIED")
        return {"permissionDecision": "allow", "reason": "CLAIM_AND_SCOPE_PREFLIGHT_PASSED"}
    except (AutonomyFailure, guard.GuardFailure, OSError, ValueError) as exc:
        reason = exc.reason if hasattr(exc, "reason") else "PREFLIGHT_FAILED"
        return {"permissionDecision": "deny", "reason": reason}
def _emit(payload: dict, exit_code: int = 0) -> int:
    print(json.dumps(payload, ensure_ascii=False, sort_keys=True))
    return exit_code


def _cmd_status(args) -> int:
    root = Path(args.root or Path.cwd()).resolve()
    policy, _ = load_trusted_policy(root)
    claim = policy.claim_by_task(args.task)
    if claim is None:
        return _emit({"ok": False, "reason": "UNKNOWN_TASK"}, 2)
    actual = _actual_context(root, claim)
    preflight_ctx = {
        "task_id": claim["task_id"], "claim_id": claim["claim_id"],
        "claim_generation": claim["claim_generation"],
        "execution_holder_id": claim["execution_holder_id"],
        "worktree": actual["worktree"], "branch": actual["branch"],
        "base_ancestor_of_head": actual["claim_base_ancestor"],
    }
    decision = guard.preflight(policy, preflight_ctx)
    mode = guard.effective_enforcement_mode(policy.enforcement_mode, server_enforcement_verified=False)
    return _emit({
        "ok": True,
        "task_id": claim["task_id"], "claim_id": claim["claim_id"],
        "claim_generation": claim["claim_generation"], "status": claim["status"],
        "policy_revision": policy.policy_revision, "registry_hash": policy.registry_hash,
        "head_sha": actual["head_sha"], "branch": actual["branch"],
        "identity_preflight": decision.safe_to_mutate,
        "identity_reason": decision.reason,
        "enforcement_mode": mode.mode,
        "enforcement_reason": mode.reason,
        "server_enforcement_state": guard.ENFORCEMENT_NOT_ACTIVE,
        "autonomy_status": "AUTONOMY_NOT_READY",
    }, 0)


def _server_allows_production_dispatch(
    registry_mode: str, server_enforcement_verified: bool
) -> bool:
    """Production work stays paused without exact server-side enforcement proof."""
    effective = guard.effective_enforcement_mode(registry_mode, server_enforcement_verified)
    return server_enforcement_verified is True and effective.mode in guard.VERIFIED_MODES


def _refill_inputs(
    root: Path,
    policy: guard.TrustedPolicy,
    current_work: str,
    *,
    server_enforcement_verified: bool = False,
) -> tuple[list[dict], dict]:
    revision = policy.policy_revision
    production_dispatch_authorized = _server_allows_production_dispatch(
        policy.enforcement_mode, server_enforcement_verified
    )
    roadmap = _run_git(["show", f"{revision}:{ROADMAP}"], root)
    checkpoints = {}
    for claim in policy.claims:
        if claim["status"] in PARKED_STATES:
            published = read_published_lane_checkpoint(root, claim)
            if published is not None:
                checkpoints[claim["task_id"]] = published
    candidates = []
    # A task with a prose READY label but no canonical READY claim is not
    # dispatchable; a controlled claim transition must happen first.
    for claim in policy.claims:
        if claim["status"] != "READY":
            continue
        try:
            order_text = _run_git(["show", f"{revision}:{claim['work_order_path']}"], root)
        except AutonomyFailure:
            continue
        state = canonical_candidate_state(roadmap, current_work, order_text, claim["task_id"])
        if state.get("safe_ready") is not True:
            continue
        candidates.append({
            "task_id": claim["task_id"], "work_order_path": claim["work_order_path"],
            "safe_ready": True,
            "source_refs": [ROADMAP, CURRENT_WORK, claim["work_order_path"]],
            "dependencies_satisfied": dependencies_satisfied(root, policy, claim, current_work),
            "production_dispatch_authorized": production_dispatch_authorized,
            "scope": list(claim["mutable_scope"]),
            "lane_kind": "MUTATION",
            "priority_rank": state.get("priority_rank", 99),
        })
    return candidates, checkpoints


def _cmd_refill(args) -> int:
    root = Path(args.root or Path.cwd()).resolve()
    policy, current_work = load_trusted_policy(root)
    candidates, checkpoints = _refill_inputs(root, policy, current_work)
    result = safe_refill_decision(policy, candidates, checkpoints, active_review_count=args.active_reviews)
    result.update({"policy_revision": policy.policy_revision, "registry_hash": policy.registry_hash})
    return _emit(result)


def _read_lifecycle_log(handoff_text: str, claim: dict) -> tuple[dict, guard.LifecycleLog]:
    document, _ = _lifecycle_document(handoff_text)
    if (document.get("claim_id"), document.get("claim_generation")) != (
        claim["claim_id"], claim["claim_generation"]
    ):
        raise AutonomyFailure("STALE_CLAIM_GENERATION")
    events = document.get("events")
    if not isinstance(events, list):
        raise AutonomyFailure("LIFECYCLE_BLOCK_MALFORMED")
    log = guard.LifecycleLog(claim["claim_id"], claim["claim_generation"])
    try:
        for raw in events:
            if not isinstance(raw, dict):
                raise AutonomyFailure("LIFECYCLE_BLOCK_MALFORMED")
            if not isinstance(raw.get("published", True), bool):
                raise AutonomyFailure("LIFECYCLE_EVENT_INVALID", "published must be boolean")
            log.apply(guard.LifecycleEvent(**{**raw, "published": True}))
    except TypeError as exc:
        raise AutonomyFailure("LIFECYCLE_EVENT_INVALID", type(exc).__name__) from None
    except guard.GuardFailure as exc:
        raise AutonomyFailure(exc.reason, exc.detail) from None
    return document, log


def _cmd_append_event(args) -> int:
    root = Path(args.root or Path.cwd()).resolve()
    policy, _ = load_trusted_policy(root)
    claim = policy.claim_by_task("ENV-AUTONOMY-001")
    if claim is None:
        raise AutonomyFailure("UNKNOWN_TASK")
    actual = _actual_context(root, claim)
    run_id = args.run_id or f"codex-local:{uuid.uuid4()}"
    binding = {
        "repo": REPO_SLUG, "worktree": actual["worktree"], "branch": actual["branch"],
        "base_sha": claim["base_sha"], "head_sha": actual["head_sha"],
        "task_id": claim["task_id"], "work_order_path": claim["work_order_path"],
        "claim_id": claim["claim_id"], "claim_generation": claim["claim_generation"],
        "execution_holder_id": claim["execution_holder_id"],
        "scope": [claim["handoff_path"]], "dependencies": list(claim["dependencies"]),
        "lane_kind": "MUTATION", "provider": "codex-cli",
        "model": _nonempty(claim.get("agent_model"), "agent_model"),
        "variant": "lifecycle-event", "run_id": run_id,
    }
    validate_lane_binding(policy, binding, actual)
    publication = verify_published_event(root, policy, claim)
    if publication.get("ok") is not True:
        raise AutonomyFailure(publication.get("reason", "PREVIOUS_CHECKPOINT_UNPUBLISHED"))
    handoff_path = Path(actual["worktree"]) / claim["handoff_path"]
    handoff_text = handoff_path.read_text(encoding="utf-8")
    document, log = _read_lifecycle_log(handoff_text, claim)
    now = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    event_type = args.event_type
    goal_id = args.goal_id or log.active_goal_id or document.get("goal_id")
    if not isinstance(goal_id, str) or not goal_id:
        raise AutonomyFailure("GOAL_ID_REQUIRED")
    payload = None
    terminal_result = args.terminal_result
    operation_id = args.operation_id
    operation_outcome = args.operation_outcome
    if event_type == "CHECKPOINT":
        if args.lane_status is None:
            raise AutonomyFailure("LANE_STATUS_REQUIRED")
        payload = {
            "lane_status": args.lane_status,
            "source_head_sha": actual["head_sha"],
            "recorded_at_utc": now,
        }
    elif event_type == "OPERATION_INTENT":
        if not all((operation_id, args.provider, args.model, args.variant, args.run_id, args.evidence_sha256)):
            raise AutonomyFailure("OPERATION_INTENT_BINDING_REQUIRED")
        if not re.fullmatch(r"[0-9a-f]{64}", args.evidence_sha256):
            raise AutonomyFailure("OPERATION_ADMISSION_DIGEST_INVALID")
        payload = {
            "provider": args.provider, "model": args.model, "variant": args.variant,
            "run_id": args.run_id, "admission_evidence_sha256": args.evidence_sha256,
            "starting_head_sha": actual["head_sha"],
            "work_order_path": claim["work_order_path"],
            "scope": list(claim["mutable_scope"]),
            "dependencies": list(claim["dependencies"]),
            "lane_kind": "MUTATION",
        }
    elif event_type in ("OPERATION_OUTCOME", "OPERATION_RECONCILED"):
        if not operation_id or not operation_outcome or not args.evidence_sha256:
            raise AutonomyFailure("OPERATION_OUTCOME_EVIDENCE_REQUIRED")
        if not re.fullmatch(r"[0-9a-f]{64}", args.evidence_sha256):
            raise AutonomyFailure("OPERATION_OUTCOME_DIGEST_INVALID")
        payload = {"evidence_sha256": args.evidence_sha256, "observed_at_utc": now}
    elif event_type == "GOAL_END":
        if not terminal_result:
            raise AutonomyFailure("TERMINAL_RESULT_REQUIRED")
    event = {
        "task_id": claim["task_id"], "claim_id": claim["claim_id"],
        "claim_generation": claim["claim_generation"], "goal_id": goal_id,
        "event_type": event_type,
        "event_seq": (log.events[-1].event_seq + 1) if log.events else 1,
        "event_id": f"env-event-{uuid.uuid4()}",
        "previous_event_id": log.head_event_id or guard.GENESIS,
        "terminal_result": terminal_result,
        "operation_id": operation_id,
        "operation_outcome": operation_outcome,
        "payload": payload,
        "published": False,
    }
    if event_type == "OPERATION_INTENT" and isinstance(args.provider, str) and args.provider.casefold() == "cointh-glm":
        _require_kilo_admission(root, {
            "provider": args.provider, "model": args.model, "variant": args.variant,
        }, guard.LifecycleEvent(**event))
    result = append_lifecycle_event(handoff_path, event)
    result.update({
        "task_id": claim["task_id"], "claim_id": claim["claim_id"],
        "claim_generation": claim["claim_generation"], "source_head_sha": actual["head_sha"],
        "publication_state": "PENDING_PUBLICATION",
    })
    return _emit(result)


def _cmd_kilo_preflight(args) -> int:
    """Report the adapter gate without launching or probing a model."""
    return _emit(_kilo_preflight_snapshot(Path(args.root or Path.cwd()).resolve(), None, None), 2)


def _kilo_preflight_snapshot(root: Path, model: Optional[str], variant: Optional[str]) -> dict:
    """Current secret-safe admission probe state; unconfigured remains UNKNOWN and denied."""
    return {
        "ok": False,
        "adapter_status": "NOT_CONFIGURED_FOR_SECRET_SAFE_QUOTA_PROBE",
        "proxy_quota_status": "UNKNOWN",
        "upstream_model_status": "UNKNOWN",
        "reason": "PROVIDER_ADMISSION_PATH_UNVERIFIED",
        "external_call_started": False,
        "provider": "cointh-glm",
        "model": model,
        "variant": variant,
        "autonomy_status": "AUTONOMY_NOT_READY",
    }


def _require_kilo_admission(root: Path, binding: dict, intent: guard.LifecycleEvent) -> dict:
    """Refuse a provider request until separate quota/upstream evidence is fresh and exact."""
    snapshot = _kilo_preflight_snapshot(root, binding["model"], binding["variant"])
    validated_at = dt.datetime.now(dt.timezone.utc)
    payload = intent.payload if isinstance(intent.payload, dict) else {}
    observed_at = snapshot.get("observed_at_utc")
    digest = snapshot.get("evidence_sha256")
    verified_time = _parse_aware_utc_timestamp(observed_at)
    fresh = False
    if verified_time is not None:
        age = (validated_at - verified_time).total_seconds()
        fresh = 0 <= age <= PROVIDER_EVIDENCE_MAX_AGE_SECONDS
    if not (
        snapshot.get("verified") is True
        and snapshot.get("adapter_status") == "READY"
        and snapshot.get("proxy_quota_status") == "READY"
        and snapshot.get("upstream_model_status") == "READY"
        and snapshot.get("external_call_started") is False
        and snapshot.get("provider") == binding["provider"]
        and snapshot.get("model") == binding["model"]
        and snapshot.get("variant") == binding["variant"]
        and isinstance(digest, str)
        and re.fullmatch(r"[0-9a-f]{64}", digest)
        and payload.get("admission_evidence_sha256") == digest
        and fresh
    ):
        raise AutonomyFailure("KILO_ADMISSION_UNVERIFIED")
    # Persist only the exact, non-secret fields needed to verify the historical request.
    return {
        "verified": True,
        "adapter_status": "READY",
        "proxy_quota_status": "READY",
        "upstream_model_status": "READY",
        "external_call_started": False,
        "provider": binding["provider"],
        "model": binding["model"],
        "variant": binding["variant"],
        "evidence_sha256": digest,
        "observed_at_utc": observed_at,
        "validated_at_utc": validated_at.isoformat().replace("+00:00", "Z"),
    }


def _cmd_kilo_receipt_transition(args) -> int:
    root = Path(args.root or Path.cwd()).resolve()
    policy, _ = load_trusted_policy(root)
    try:
        result = transition_kilo_receipt(
            root, policy, args.run_id, args.next_state,
            result_sha256=args.result_sha256, result_status=args.result_status,
        )
    except AutonomyFailure as exc:
        return _emit({"ok": False, "reason": exc.reason}, 2)
    return _emit(result)


def _cmd_kilo_receipt_verify(args) -> int:
    root = Path(args.root or Path.cwd()).resolve()
    policy, _ = load_trusted_policy(root)
    result = verify_kilo_receipt(root, policy, args.run_id)
    return _emit(result, 0 if result.get("ok") is True else 2)


def _cmd_route(args) -> int:
    """Report task-fit selection only; never launches a provider."""
    result = select_route(args.task_category, args.lane_kind)
    return _emit({**result, "external_call_started": False})


def _cmd_verify_event(args) -> int:
    root = Path(args.root or Path.cwd()).resolve()
    policy, _ = load_trusted_policy(root)
    claim = policy.claim_by_task(args.task)
    if claim is None:
        raise AutonomyFailure("UNKNOWN_TASK")
    result = verify_published_event(root, policy, claim)
    if result.get("ok") is True and args.event_id and result.get("event_head") != args.event_id:
        result = {**result, "ok": False, "reason": "EVENT_HEAD_MISMATCH"}
    return _emit(result, 0 if result.get("ok") is True else 2)


def _cmd_verify_checkpoint(args) -> int:
    root = Path(args.root or Path.cwd()).resolve()
    policy, _ = load_trusted_policy(root)
    claim = policy.claim_by_task(args.task)
    if claim is None:
        raise AutonomyFailure("UNKNOWN_TASK")
    result = verify_published_checkpoint(root, policy, claim)
    return _emit(result, 0 if result.get("ok") is True else 2)


def _cmd_hook(args) -> int:
    root = Path(args.root or Path.cwd()).resolve()
    try:
        event = json.load(sys.stdin)
    except (json.JSONDecodeError, OSError):
        event = None
    if not isinstance(event, dict):
        if args.event == "PreToolUse":
            return _emit({"hookSpecificOutput": {
                "hookEventName": "PreToolUse", "permissionDecision": "deny",
                "permissionDecisionReason": "INVALID_HOOK_INPUT",
            }})
        if args.event == "Stop":
            return _emit({"decision": "block", "reason": "ENV state is unknown; recover the same Goal from the published handoff before stopping."})
        if args.event in ("PreCompact", "PostCompact"):
            return _emit({"continue": False, "stopReason": "ENV state is unknown; do not compact/replay until the same Goal is recovered from the published handoff."})
        return _emit({"systemMessage": "ENV hook input is invalid. Keep mutation blocked and recover from the published lane handoff."})

    try:
        policy, current_work = load_trusted_policy(root, refresh=True)
        claim = policy.claim_by_task("ENV-AUTONOMY-001")
        if claim is None:
            raise AutonomyFailure("UNKNOWN_TASK")
        actual = _actual_context(root, claim)
        context = (
            f"ENV claim {claim['claim_id']} generation {claim['claim_generation']} holder {claim['execution_holder_id']}; "
            f"repo {actual['repo']} worktree {actual['worktree']} branch {actual['branch']} HEAD {actual['head_sha']}; "
            f"CURRENT-WORK {policy.policy_revision}; enforcement {guard.ENFORCEMENT_NOT_ACTIVE}; "
            "AUTONOMY_NOT_READY. External UNKNOWN outcomes block retry."
        )
        if args.event == "PreToolUse":
            result = hook_pretool(event, root)
            return _emit({"hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": result["permissionDecision"],
                "permissionDecisionReason": result.get("reason", "blocked"),
            }})
        if args.event == "PostToolUse":
            observation = record_hook_observation(root, policy, event)
            if observation.get("reason") == "READ_ONLY":
                return _emit({})
            if observation.get("recorded") is False:
                context += f" Tool receipt note: {observation.get('reason')}; use the published Git head for verification."
            else:
                context += (
                    f" Hash-only mutation receipt {observation['tool_use_id']} covers "
                    f"{len(observation['changed_paths'])} claimed path(s); publish the handoff fast-forward and verify remote head."
                )
            return _emit({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": context}})
        if args.event == "SessionStart":
            checkpoint = verify_published_checkpoint(root, policy, claim)
            if checkpoint.get("ok") is True:
                context += (
                    f" Resume the SAME Goal {checkpoint['active_goal_id']} from lifecycle event "
                    f"{checkpoint['latest_event_id']} at checkpoint {checkpoint['checkpoint_sha']}; "
                    "reconcile current claims and provider effects before dispatch."
                )
            else:
                context += (
                    f" RECOVERY_REQUIRED: no current published checkpoint ({checkpoint.get('reason')}); "
                    "inspect local-versus-remote handoff and reconcile before replaying any external operation."
                )
            return _emit({"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": context}})
        if args.event == "PreCompact":
            checkpoint = verify_published_checkpoint(root, policy, claim)
            if checkpoint.get("ok") is True:
                return _emit({"continue": True, "systemMessage": context + f" Durable checkpoint {checkpoint['checkpoint_sha']} is current."})
            reason = checkpoint.get("reason", "CHECKPOINT_UNAVAILABLE")
            goal_id = checkpoint.get("active_goal_id") or "the existing Goal"
            command = f"python scripts/env_autonomy_runtime.py append-event --event-type CHECKPOINT --lane-status ACTIVE --goal-id {goal_id}"
            message = (
                f"{context} Checkpoint required before compaction ({reason}). If the worktree has unpublished edits, "
                "first publish only the exact claim-scoped changes and verify a clean remote fast-forward. Then "
                f"append the typed checkpoint with `{command}`, publish that handoff fast-forward, and verify the remote head."
            )
            return _emit({"continue": False, "stopReason": message, "systemMessage": message})
        if args.event == "PostCompact":
            checkpoint = verify_published_checkpoint(root, policy, claim)
            if checkpoint.get("ok") is not True:
                message = f"{context} COMPACT_RECOVERY_BLOCKED ({checkpoint.get('reason')}); do not replay external work. Recover from the same claim handoff first."
                return _emit({"continue": False, "stopReason": message, "systemMessage": message})
            recovered = context + f" Restored SAME Goal {checkpoint['active_goal_id']} at lifecycle event {checkpoint['latest_event_id']} / checkpoint {checkpoint['checkpoint_sha']}. Reconcile claims and unfinished operations before continuing."
            return _emit({"systemMessage": recovered})
        if args.event == "Stop":
            checkpoint = verify_published_checkpoint(root, policy, claim)
            stop_hook_active = event.get("stop_hook_active") is True
            if checkpoint.get("ok") is not True:
                reason = checkpoint.get("reason", "CHECKPOINT_UNAVAILABLE")
                message = f"{context} The Goal is still open; durable checkpoint failed ({reason}). Reconcile the handoff and publish a current checkpoint before stopping."
                if stop_hook_active:
                    return _emit({"continue": True, "systemMessage": message + " One automatic continuation was already used; the Goal remains resumable from its last published state."})
                return _emit({"decision": "block", "reason": message})
            candidates, checkpoints = _refill_inputs(root, policy, current_work)
            refill = safe_refill_decision(policy, candidates, checkpoints)
            if refill.get("auto_refill_required") is True:
                message = (
                    f"{context} AUTO_REFILL_REQUIRED: existing canonical SAFE_READY task "
                    f"{refill['selected_task_id']} has free capacity. Continue the same Goal and request its existing control transition; "
                    "do not create a task or launch a provider without current admission evidence."
                )
                if not stop_hook_active:
                    return _emit({"decision": "block", "reason": message})
                return _emit({"continue": True, "systemMessage": message + " One automatic continuation was already used; retain the checkpoint for the next session."})
            message = (
                f"{context} No canonical safe READY lane is currently refillable "
                f"({refill.get('reason')}); the project Goal is not marked complete. "
                "Keep this checkpoint and resume after the external/control gate changes."
            )
            return _emit({"continue": True, "systemMessage": message})
        if args.event == "Interrupt":
            checkpoint = verify_published_checkpoint(root, policy, claim)
            state = checkpoint.get("checkpoint_state", checkpoint.get("reason", "UNKNOWN"))
            return _emit({"systemMessage": context + f" Interrupted turn checkpoint state: {state}. Unknown external effects must be reconciled, never replayed."})
        if args.event == "SessionEnd":
            return _emit({"systemMessage": context + " SessionEnd is advisory; resume this same Goal from the published handoff."})
        return _emit({"systemMessage": context})
    except (AutonomyFailure, guard.GuardFailure, OSError, ValueError) as exc:
        reason = exc.reason if hasattr(exc, "reason") else "PREFLIGHT_FAILED"
        message = f"ENV autonomy state unavailable: {reason}. Keep mutation blocked and preserve the existing Goal."
        if args.event == "PreToolUse":
            return _emit({"hookSpecificOutput": {
                "hookEventName": "PreToolUse", "permissionDecision": "deny",
                "permissionDecisionReason": reason,
            }})
        if args.event == "Stop":
            if event.get("stop_hook_active") is True:
                return _emit({"continue": True, "systemMessage": message})
            return _emit({"decision": "block", "reason": message})
        if args.event in ("PreCompact", "PostCompact"):
            return _emit({"continue": False, "stopReason": message, "systemMessage": message})
        return _emit({"systemMessage": message})
def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    status = sub.add_parser("status", help="inspect the trusted claim and actual repository binding")
    status.add_argument("--task", default="ENV-AUTONOMY-001")
    status.add_argument("--root")
    status.set_defaults(func=_cmd_status)
    refill = sub.add_parser("refill", help="select one canonical safe READY lane without allocating it")
    refill.add_argument("--root")
    refill.add_argument("--active-reviews", type=int, default=0)
    refill.set_defaults(func=_cmd_refill)
    hook = sub.add_parser("hook", help="Codex command hook entrypoint")
    hook.add_argument("--event", required=True)
    hook.add_argument("--root")
    hook.set_defaults(func=_cmd_hook)
    append_event = sub.add_parser("append-event", help="append one typed lifecycle event to the existing lane handoff")
    append_event.add_argument("--event-type", required=True, choices=guard.LIFECYCLE_EVENT_TYPES)
    append_event.add_argument("--root")
    append_event.add_argument("--goal-id")
    append_event.add_argument("--run-id")
    append_event.add_argument("--lane-status", choices=("ACTIVE", "WAITING_EXTERNAL", "PARKED", "REPAIR_REQUIRED", "REVIEW_REQUESTED", "CHANGES_REQUIRED"))
    append_event.add_argument("--terminal-result", choices=guard.TERMINAL_GOAL_RESULTS)
    append_event.add_argument("--operation-id")
    append_event.add_argument("--operation-outcome", choices=guard.OPERATION_OUTCOMES)
    append_event.add_argument("--provider")
    append_event.add_argument("--model")
    append_event.add_argument("--variant")
    append_event.add_argument("--evidence-sha256")
    append_event.set_defaults(func=_cmd_append_event)
    verify_event = sub.add_parser("verify-event", help="verify that the latest handoff event is on the current clean remote head")
    verify_event.add_argument("--task", default="ENV-AUTONOMY-001")
    verify_event.add_argument("--event-id")
    verify_event.add_argument("--root")
    verify_event.set_defaults(func=_cmd_verify_event)
    verify_checkpoint = sub.add_parser("verify-checkpoint", help="verify the latest published checkpoint and unresolved effects")
    verify_checkpoint.add_argument("--task", default="ENV-AUTONOMY-001")
    verify_checkpoint.add_argument("--root")
    verify_checkpoint.set_defaults(func=_cmd_verify_checkpoint)
    kilo_preflight = sub.add_parser("kilo-preflight", help="report the current non-billable GLM admission gate without dispatch")
    kilo_preflight.add_argument("--root")
    kilo_preflight.set_defaults(func=_cmd_kilo_preflight)
    kilo_receipt = sub.add_parser("kilo-receipt-transition", help="persist one verified Kilo receipt state in the lane handoff")
    kilo_receipt.add_argument("--run-id", required=True)
    kilo_receipt.add_argument("--next-state", required=True, choices=KILO_RECEIPT_STATES)
    kilo_receipt.add_argument("--result-sha256")
    kilo_receipt.add_argument("--result-status", choices=guard.OPERATION_OUTCOMES)
    kilo_receipt.add_argument("--root")
    kilo_receipt.set_defaults(func=_cmd_kilo_receipt_transition)
    kilo_receipt_verify = sub.add_parser("kilo-receipt-verify", help="verify the persisted Kilo receipt from the remote lane handoff")
    kilo_receipt_verify.add_argument("--run-id", required=True)
    kilo_receipt_verify.add_argument("--root")
    kilo_receipt_verify.set_defaults(func=_cmd_kilo_receipt_verify)
    route = sub.add_parser("route", help="report a task-fit route selection without provider dispatch")
    route.add_argument("--task-category", required=True, choices=sorted(ROUTE_DEFAULTS))
    route.add_argument("--lane-kind")
    route.set_defaults(func=_cmd_route)
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except AutonomyFailure as exc:
        return _emit({"ok": False, "reason": exc.reason}, 2)
    except guard.GuardFailure as exc:
        return _emit({"ok": False, "reason": exc.reason}, 2)


if __name__ == "__main__":
    raise SystemExit(main())
