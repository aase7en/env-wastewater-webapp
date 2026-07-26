"""Unit tests for scripts/ci_alert_payload.py — pins the CI-alert wire format.

These lock the contract that 3 GitHub workflows + the Hermes verifier depend
on. If canonical_json shape, HMAC algorithm, error_class enum, or HTML escape
changes, a test here must fail FIRST — before the change ships to a workflow
and silently breaks Hermes integration.
"""
from __future__ import annotations

import hashlib
import hmac
import json

import pytest

from ci_alert_payload import (
    build_payload,
    build_inline_block,
    canonical_json,
    escape_commit_msg,
    error_class_for_deploy,
    error_class_for_simple,
    sign,
    verify,
)


# ─── canonical_json ──────────────────────────────────────────────────────────
class TestCanonicalJson:
    def test_sorted_keys(self):
        """Keys MUST be sorted — Hermes verifier parses positionally."""
        p = {"b": 1, "a": 2, "c": 3}
        assert canonical_json(p) == '{"a":2,"b":1,"c":3}'

    def test_compact_separators(self):
        """No whitespace — separator is (',', ':'), not (', ', ': ')."""
        p = {"k": "v"}
        assert canonical_json(p) == '{"k":"v"}'
        assert ", " not in canonical_json({"a": 1, "b": 2})
        assert ": " not in canonical_json({"k": "v"})

    def test_roundtrip_via_json_loads(self):
        """Canonical form must be valid JSON (parseable by Hermes)."""
        p = build_payload(
            workflow="test", error_class="test-ok", repo="r", run_id="1",
            commit_sha="abcdef1234567", branch="main", actor="a",
            result="success", trigger="push",
        )
        canon = canonical_json(p)
        assert json.loads(canon) == p

    def test_deterministic(self):
        """Same input → same output (Hermes re-signs to compare)."""
        p = {"z": 1, "a": 2}
        assert canonical_json(p) == canonical_json(p)


# ─── HMAC sign / verify ──────────────────────────────────────────────────────
class TestHmac:
    SECRET = "test-secret-32-chars-min-xxxxxxxxx"

    def test_sign_is_hmac_sha256_hex(self):
        """Algorithm MUST be HMAC-SHA256, hex-encoded (Hermes mirror)."""
        canon = '{"a":1}'
        expected = hmac.new(
            self.SECRET.encode(), canon.encode(), hashlib.sha256
        ).hexdigest()
        assert sign(canon, self.SECRET) == expected

    def test_verify_roundtrip(self):
        """sign() output verifies under verify()."""
        canon = '{"x":42}'
        sig = sign(canon, self.SECRET)
        assert verify(canon, self.SECRET, sig) is True

    def test_verify_rejects_tampered_canon(self):
        """Changed payload → sig no longer matches."""
        sig = sign('{"a":1}', self.SECRET)
        assert verify('{"a":2}', self.SECRET, sig) is False

    def test_verify_rejects_wrong_secret(self):
        """Wrong secret → reject (anti-spoof even inside the chat)."""
        sig = sign('{"a":1}', self.SECRET)
        assert verify('{"a":1}', "wrong-secret", sig) is False

    def test_verify_timing_safe(self):
        """verify() must use hmac.compare_digest, not == (timing attack)."""
        # We can't directly assert the impl, but verify exists and works —
        # the impl uses compare_digest (see source). This is a smoke check.
        sig = sign('{"a":1}', self.SECRET)
        assert verify('{"a":1}', self.SECRET, sig)


# ─── error_class_for_deploy ──────────────────────────────────────────────────
class TestErrorClassDeploy:
    @pytest.mark.parametrize("deploy,smoke,rollback,expected", [
        ("failure", "skipped", "skipped", ("failure", "deploy-failed")),
        ("success", "success", "skipped", ("success", "deploy-ok")),
        ("success", "failure", "success", ("failure", "rolled-back")),
        ("success", "failure", "skipped", ("failure", "smoke-failed")),
        # rollback disabled (ENABLE_AUTO_ROLLBACK off → "skipped")
        ("success", "failure", None, ("failure", "smoke-failed")),
    ])
    def test_matrix(self, deploy, smoke, rollback, expected):
        assert error_class_for_deploy(deploy, smoke, rollback) == expected


# ─── error_class_for_simple ──────────────────────────────────────────────────
class TestErrorClassSimple:
    @pytest.mark.parametrize("prefix,result,expected", [
        ("test", "success", "test-ok"),
        ("test", "failure", "test-failed"),
        ("test", "cancelled", "cancelled"),
        ("test", "skipped", "skipped"),
        ("e2e", "success", "e2e-ok"),
        ("e2e", "failure", "e2e-failed"),
        ("test", "bogus", "unknown"),  # safe default
    ])
    def test_map(self, prefix, result, expected):
        assert error_class_for_simple(result, prefix) == expected


# ─── escape_commit_msg ───────────────────────────────────────────────────────
class TestEscapeCommitMsg:
    def test_html_escape_angle_brackets(self):
        """`<`/`>` in commit subject must NOT reach Telegram HTML raw."""
        assert escape_commit_msg("fix: handle <script> in input") == \
            "fix: handle &lt;script&gt; in input"

    def test_html_escape_ampersand(self):
        assert escape_commit_msg("docs: a & b") == "docs: a &amp; b"

    def test_first_line_only(self):
        """Multi-line bodies must NOT leak into the alert."""
        raw = "subject line\n\nbody line 1\nbody line 2"
        assert escape_commit_msg(raw) == "subject line"

    def test_truncate_to_limit(self):
        long = "x" * 300
        assert len(escape_commit_msg(long, limit=160)) == 160

    def test_empty_or_none(self):
        assert escape_commit_msg("") == ""
        assert escape_commit_msg(None) == ""

    def test_safe_subject_unchanged(self):
        """Normal commit subjects pass through verbatim."""
        assert escape_commit_msg("feat: add login page") == "feat: add login page"


# ─── build_inline_block ──────────────────────────────────────────────────────
class TestBuildInlineBlock:
    def test_with_secret_emits_sig_and_inline(self):
        canon = '{"a":1}'
        secret = "secret-32-chars-min-xxxxxxxxxxx"
        sig, inline = build_inline_block(canon, secret)
        assert sig  # non-empty
        assert canon in inline
        assert f"<!--sig:{sig}-->" in inline
        assert "<code>" in inline and "</code>" in inline

    def test_no_secret_returns_empty(self):
        """Defensive gate: no HERMES_HMAC_SECRET → human-only HTML."""
        sig, inline = build_inline_block('{"a":1}', None)
        assert sig == ""
        assert inline == ""

    def test_empty_string_secret_treated_as_none(self):
        sig, inline = build_inline_block('{"a":1}', "")
        assert sig == ""
        assert inline == ""


# ─── build_payload (zero-data contract) ──────────────────────────────────────
class TestBuildPayloadZeroData:
    def test_no_phiable_fields(self):
        """Payload MUST NOT carry file content, logs, diffs, stack traces."""
        p = build_payload(
            workflow="test", error_class="test-ok", repo="r", run_id="1",
            commit_sha="abcdef1234567", branch="main", actor="a",
            result="success",
        )
        # Allowlist of safe keys. Any new key here needs review.
        allowed = {
            "v", "source", "event", "repo", "workflow", "run_id",
            "commit", "branch", "actor", "result", "error_class",
        }
        assert set(p.keys()) <= allowed, \
            f"unexpected fields: {set(p.keys()) - allowed}"

    def test_commit_truncated_to_7(self):
        """Commit SHA in payload is short (7 chars) — never full hash."""
        p = build_payload(
            workflow="t", error_class="t-ok", repo="r", run_id="1",
            commit_sha="abcdef1234567890123", branch="main", actor="a",
            result="success",
        )
        assert len(p["commit"]) == 7
        assert p["commit"] == "abcdef1"

    def test_trigger_optional(self):
        """test/e2e workflows pass trigger; deploy does not — both must work."""
        with_t = build_payload(
            workflow="t", error_class="t-ok", repo="r", run_id="1",
            commit_sha="abcdef1", branch="main", actor="a",
            result="success", trigger="push",
        )
        without_t = build_payload(
            workflow="t", error_class="t-ok", repo="r", run_id="1",
            commit_sha="abcdef1", branch="main", actor="a",
            result="success",
        )
        assert "trigger" in with_t
        assert "trigger" not in without_t
