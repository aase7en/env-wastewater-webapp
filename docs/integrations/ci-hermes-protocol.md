# CI Alert → Hermes Protocol (v1)

**Status**: Active (2026-07-22, commit `b420202`). Repo-side complete; Hermes-side deployment is the user's task on the Pi5.

**Related**: [ADR-0010](../adr/0010-ci-alert-hermes-protocol.md) · [Telegram notify setup](../handoff/2026-07-19-track-z-complete.md) · [ADR-0009 §2 PHI principle](../adr/0009-ai-sql-ui-review-gate.md)

This is the machine-readable protocol that GitHub Actions emits alongside the
human-readable Telegram alert. An AI agent (Hermes, on a Raspberry Pi5) parses
it to drive a **self-healing CI** loop: receive failure → diagnose → reply
in chat. This repo emits the protocol; the agent consumes it.

## Design summary

- **Two layers, one message** — human-readable HTML body (unchanged) +
  an embedded `<code>{...JSON...}</code>` payload + an HMAC signature, all
  in the same Telegram message. Keeps chat low-spam.
- **Zero-data posture** — payload carries metadata ONLY (workflow name,
  run_id, commit, a curated `error_class` enum). Never log lines, stack
  traces, file contents, or diffs. The PHI boundary (see ADR-0010 §1)
  holds structurally, not by convention.
- **HMAC-signed** — `sig` = HMAC-SHA256 over the canonical JSON (sorted keys)
  with a shared secret `HERMES_HMAC_SECRET`. Hermes rejects anything that
  fails verification, so spoofing is impossible even if the chat leaks.
- **Defensive gates** — workflows stay green in every config:
  no `TELEGRAM_BOT_TOKEN`/`CHAT_ID` → skip notify entirely;
  no `HERMES_HMAC_SECRET` → send human-only HTML (no JSON payload).

## Message wire format

```
🔔 <human-readable HTML body — repo, workflow, ผล, commit, author, message, run URL>

<code>{"actor":"...","branch":"...","commit":"...","error_class":"...","event":"...","repo":"...","result":"...","run_id":"...","source":"github-ci","v":1,"workflow":"..."}</code>
<!--sig:<hex-hmac-sha256>-->
```

- The `<code>{...}</code>` block holds the **canonical** JSON: sorted keys,
  no whitespace, `,`/`:` separators — this exact form is what was signed.
- The `<!--sig:...-->` HTML comment immediately after carries the signature.
- A consumer MUST extract the `<code>` block verbatim, NOT re-serialize —
  re-serialization would change byte ordering and break HMAC verification.

## Payload fields (v1)

| Field | Type | Source | Notes |
|---|---|---|---|
| `v` | int | constant `1` | Protocol version — bump on breaking change |
| `source` | string | constant `"github-ci"` | Lets Hermes disambiguate from other chat sources |
| `event` | string | `"workflow_finished"` | Reserved for future `workflow_started`, etc. |
| `repo` | string | `GITHUB_REPOSITORY` | `owner/name` |
| `workflow` | string | hardcoded per workflow file | Human-readable workflow name |
| `run_id` | string | `GITHUB_RUN_ID` | Numeric; append to run URL |
| `commit` | string | `GITHUB_SHA[:7]` | 7-char short SHA |
| `branch` | string | `GITHUB_REF_NAME` | On PRs this is the PR head branch |
| `actor` | string | `GITHUB_ACTOR` | Who/what triggered the run |
| `trigger` | string | `github.event_name` | `push` / `pull_request` — only test/e2e |
| `result` | string | `needs.<job>.result` | `success` / `failure` / `cancelled` / `skipped` |
| `error_class` | enum | derived from `result` | **Safe category, never raw error text** |
| `sig` | hex string | HMAC-SHA256 | Not in the JSON; lives in `<!--sig:...-->` |

### `error_class` enum (exhaustive)

| Workflow | result | error_class |
|---|---|---|
| Deploy | success | `deploy-ok` |
| Deploy | failure | `deploy-failed` |
| test | success | `test-ok` |
| test | failure | `test-failed` |
| E2E | success | `e2e-ok` |
| E2E | failure | `e2e-failed` |
| (any) | cancelled | `cancelled` |
| (any) | skipped | `skipped` |
| (fallback) | — | `unknown` |

`error_class` is **the only signal about what went wrong**. It is a fixed
enum, not raw text — so a PHI-laden stack trace can never reach Hermes
through this channel.

## HMAC algorithm (parity reference)

CI-side (in the workflow, Python 3 stdlib):

```python
import json, hmac, hashlib
canon = json.dumps(payload, sort_keys=True, separators=(",", ":"))
sig = hmac.new(SECRET.encode(), canon.encode(), hashlib.sha256).hexdigest()
```

Hermes-side verifier (Python 3 stdlib — drop-in):

```python
import re, json, hmac, hashlib

def parse_ci_alert(message_html: str, secret: str) -> dict | None:
    """Extract + verify a CI alert payload from a Telegram HTML message.

    Returns the parsed payload dict if the signature verifies, else None.
    Never raises on tampering — fail-closed (return None).
    """
    code = re.search(r"<code>(\{.*\})</code>", message_html)
    sig_m = re.search(r"<!--sig:([0-9a-f]{64})-->", message_html)
    if not code or not sig_m:
        return None  # not a CI alert, or payload disabled (no HMAC_SECRET)
    canon = code.group(1)
    expected = hmac.new(secret.encode(), canon.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig_m.group(1), expected):
        return None  # signature mismatch — reject silently
    return json.loads(canon)
```

Verified round-trip in this repo's commit `b420202` planning (CI sig →
Hermes verify = PASS; tamper = rejected; PHI-leak scan = clean).

## L2 diagnostic host contract (current target)

Hermes's system prompt (deployed on the Pi5 by the user) should encode:

1. On every incoming message, run `parse_ci_alert(...)`. If it returns
   `None`, ignore (it's not a signed CI alert — handle normally).
2. If it returns a payload, the action depends on `event` + `result`:
   - `workflow_finished` + `success` → no action (or a short ack)
   - `workflow_finished` + `failure` → **L2 diagnose**: reply in chat with
     "ดู <run_url> — error_class=`<X>` มักหมายถึง <Y>" using the enum table
     above + the run URL. Do NOT clone the repo, do NOT fetch logs, do NOT
     propose code changes. This level is read-only diagnosis.
3. **Forbidden at L2**: any git operation, any repo clone, any code edit,
   any PR creation. Those are gated behind L3/L4 (separate rollout).
4. PHI boundary: the payload is zero-data, but if Hermes ever escalates to
   L3 (log fetch via `gh run view`), a PHI scrubber must run before any
   content reaches the cloud LLM — see ADR-0010 §"L3+ requirements".

## User setup checklist (Pi5 side — NOT done by this repo)

1. **Generate a shared secret** (any 32+ char random string):
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(48))"
   ```
2. **Set it in both places** (must match exactly):
   - GitHub: repo Settings → Secrets → `HERMES_HMAC_SECRET`
   - Pi5: in Hermes profile `.env` as `HERMES_HMAC_SECRET`
3. **Set Telegram creds** (if not already):
   - GitHub: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` (see handoff doc)
   - Decide: separate bot for CI vs reuse Hermes's bot (recommended:
     separate — see handoff doc "Telegram setup" section for trade-offs)
4. **Deploy the Hermes system prompt** encoding the L2 host contract above
   into the Hermes profile that watches the CI chat.
5. **Smoke test**: push a deliberate failing commit to a throwaway branch
   + open a PR. The PR's `test` workflow will run, fail, and send a
   signed alert. Hermes should reply in chat with a diagnosis.

## Rollout levels (where we are)

| Level | Hermes does | Status |
|---|---|---|
| L1: Notify only | (nothing — alert is human-read) | ✅ was the baseline before this protocol |
| **L2: Diagnose** | parse + verify sig + reply "error_class X usually means Y" (no code touch) | ✅ **protocol shipped, host = user deploys** |
| L3: Suggest patch | L2 + fetch log via `gh` (PHI scrubber required) + propose diff in chat | ⏸ future — needs Pi5 scrubber |
| L4: Auto-PR | L3 + open PR automatically (human merges) | ⏸ future — see `_example_hermes_l4_auto_pr.yml` |
| L5: Auto-merge | L4 + self-merge if CI passes | ⏸ far future |

## PHI posture — why zero-data is the floor

A 2026-07-22 audit of this repo (see ADR-0010 §1) found real PHI committed
to git:

- `reports/phase2-batch-*.sql` (11 files, 907 rows) — 10 real Thai staff
  full names + national-ID-shaped 13-digit reporter codes + real meter
  values, in `reported_by_name_legacy`.
- `reports/phase1-analysis.md:62-72` — 2 more 13-digit reporter codes.

Any stack trace, diff, or log line that quotes these files would exfiltrate
PII to a cloud LLM. **Zero-data is the only posture that holds without a
mature scrubber** — the protocol cannot leak what it does not contain.
This mirrors the structural PHI principle established by AISQL-phi-filter
(ADR-0009 §2) for NL→SQL.

L3+ (log fetch) is gated behind a separate scrubber doc precisely because
it crosses this floor. Do not enable L3 without that scrubber.
