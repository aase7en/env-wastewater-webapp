"""CI-alert payload + HMAC logic — pure functions, shared by 3 GitHub workflows.

Extracted from inline Python in `.github/workflows/{deploy-frontend,test,e2e}.yml`
so the contract (canonical JSON, HMAC signing, error_class enum, HTML escape)
is unit-testable. The workflows call these functions; the canonical form is
pinned here, not duplicated across 3 YAML files.

Zero-data contract (ADR-0010): the payload carries METADATA ONLY — no logs,
no diffs, no file content, no stack traces. `error_class` is a safe enum,
never raw error text.

Public API:
  - build_payload(workflow, error_class, **extra) -> dict
  - canonical_json(payload) -> str  (sort_keys, compact separators)
  - sign(canon, secret) -> str      (HMAC-SHA256 hex)
  - verify(canon, secret, sig) -> bool  (timing-safe compare)
  - escape_commit_msg(raw, limit=160) -> str  (HTML-safe, first line, truncated)
  - error_class_for_deploy(deploy, smoke, rollback) -> (result, error_class)
  - error_class_for_simple(result, prefix) -> str  (test/e2e use this)

These are pure: no I/O, no env reads, no network. The workflow still owns
env resolution + GITHUB_OUTPUT writes; this module only computes.
"""
from __future__ import annotations

import hashlib
import hmac
import html
import json
from typing import Literal


# ─── Payload construction ────────────────────────────────────────────────────
def build_payload(
    *,
    workflow: str,
    error_class: str,
    repo: str,
    run_id: str,
    commit_sha: str,
    branch: str,
    actor: str,
    result: str,
    trigger: str | None = None,
) -> dict:
    """Build the Hermes CI-alert payload (metadata only — zero data).

    Field order in the dict literal is irrelevant: canonical_json sorts keys.
    All fields are metadata; none carry file content, logs, or stack traces.
    """
    payload = {
        "v": 1,
        "source": "github-ci",
        "event": "workflow_finished",
        "repo": repo,
        "workflow": workflow,
        "run_id": run_id,
        "commit": commit_sha[:7],
        "branch": branch,
        "actor": actor,
        "result": result,
        "error_class": error_class,
    }
    if trigger is not None:
        payload["trigger"] = trigger
    return payload


# ─── Canonical form + HMAC ───────────────────────────────────────────────────
def canonical_json(payload: dict) -> str:
    """Serialize the payload to canonical JSON.

    MUST match what the verifier (Hermes-side) expects: sorted keys + compact
    separators. Any change here is a wire-format break — bump `v` + update
    Hermes verifier. Tests pin this shape.
    """
    return json.dumps(payload, sort_keys=True, separators=(",", ":"))


def sign(canon: str, secret: str) -> str:
    """HMAC-SHA256 hex digest of the canonical JSON using the shared secret."""
    return hmac.new(secret.encode(), canon.encode(), hashlib.sha256).hexdigest()


def verify(canon: str, secret: str, sig: str) -> bool:
    """Timing-safe HMAC verification (Hermes-side mirror of sign())."""
    expected = sign(canon, secret)
    return hmac.compare_digest(expected, sig)


# ─── error_class derivation ──────────────────────────────────────────────────
# Deploy workflow: outcome depends on deploy + smoke + rollback combination.
DeployOutcome = tuple[str, Literal[
    "deploy-failed", "deploy-ok", "rolled-back", "smoke-failed"
]]


def error_class_for_deploy(
    deploy: str, smoke: str, rollback: str
) -> DeployOutcome:
    """Derive (result, error_class) for the deploy pipeline.

    Matrix:
      deploy != success                    → (deploy, "deploy-failed")
      smoke == success                     → ("success", "deploy-ok")
      rollback == success (smoke failed)   → ("failure", "rolled-back")
      else (smoke failed, no rollback)     → ("failure", "smoke-failed")
    """
    if deploy != "success":
        return deploy, "deploy-failed"
    if smoke == "success":
        return "success", "deploy-ok"
    if rollback == "success":
        return "failure", "rolled-back"
    return "failure", "smoke-failed"


# Simple workflows (test, e2e): map a single job result to error_class.
def error_class_for_simple(result: str, prefix: Literal["test", "e2e"]) -> str:
    """Derive error_class for a single-job workflow.

    prefix="test" → {"success":"test-ok", "failure":"test-failed", ...}
    prefix="e2e"  → {"success":"e2e-ok",  "failure":"e2e-failed",  ...}
    Unknown results fall through to "unknown" (safe default).
    """
    table = {
        "success":  f"{prefix}-ok",
        "failure":  f"{prefix}-failed",
        "cancelled": "cancelled",
        "skipped":   "skipped",
    }
    return table.get(result, "unknown")


# ─── HTML escape for Telegram message body ──────────────────────────────────
def escape_commit_msg(raw: str | None, limit: int = 160) -> str:
    """HTML-escape + first-line + truncate a commit message for Telegram.

    A `<`/`>`/`&` in a commit subject breaks Telegram's HTML parse mode and
    silently drops the alert (Opus review D4). First line only — multi-line
    bodies would break the layout and leak body text. Truncate to keep it
    readable.
    """
    if not raw:
        return ""
    first_line = raw.splitlines()[0][:limit]
    return html.escape(first_line)


# ─── Inline payload + signature emission (for GITHUB_OUTPUT) ─────────────────
def build_inline_block(canon: str, secret: str | None) -> tuple[str, str]:
    """Build the (sig, inline_html) pair to embed in the Telegram message.

    Returns ("", "") when no secret is configured (human-only HTML, no
    Hermes payload). The inline block is `<code>{canon}</code>` + an HTML
    comment carrying the signature, so Hermes can parse both from one message.
    """
    if not secret:
        return "", ""
    sig = sign(canon, secret)
    inline = f"\n<code>{canon}</code>\n<!--sig:{sig}-->"
    return sig, inline
