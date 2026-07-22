# ADR-0010: CI Alert → Hermes self-healing protocol (zero-data + HMAC)

- **Status**: Accepted (2026-07-22, commit `b420202`)
- **Context**: [Protocol spec](../integrations/ci-hermes-protocol.md) · commit `b420202` (workflows) + `8427fa1`/`2535d82` (preceding Telegram notify jobs)
- **Related**: ADR-0009 §2 (PHI structural principle) · AGENTS.md (data policy)

## Context

The user's idea: route GitHub Actions CI failure alerts into the Telegram
chat an AI agent (Hermes, on a Raspberry Pi5) already monitors, so Hermes
can read the alert and diagnose (or eventually fix) the failure — turning
the alert from a passive email into an agentic loop ("self-healing CI").

Three constraints shape this:

1. **Hermes runs a cloud LLM** (Z.ai/GLM-class, the documented Pi5 pattern
   per A-Wiki `hermes-agent.md`). The repo's hard PHI boundary — *"Z.ai/GLM
   cloud อยู่ใต้กฎหมายจีน → ห้าม route PHI แม้ indirect"* (handoff doc rule 6,
   ADR-0009 §2) — means any CI content reaching Hermes's LLM must be PHI-free.
2. **Spoofing risk** — if the marker is plain text, anyone with chat access
   could forge an "alert" and trick Hermes into acting.
3. **Chat-spam aversion** — the user previously hit email-spam pain; a
   second parallel message stream would repeat that in Telegram.

A 2026-07-22 audit (exploration agent) confirmed the PHI concern is real,
not theoretical: `reports/phase2-batch-*.sql` (11 committed files, 907 rows)
carry 10 real Thai staff names + national-ID-shaped 13-digit reporter codes
+ real operational meter values; `reports/phase1-analysis.md:62-72` leaks
2 more 13-digit codes. Any stack trace, diff, or log line quoting these
files would exfiltrate PII to the cloud LLM.

## Decision

### 1. Zero-data payload — metadata only, never content

The CI alert JSON carries **only** fixed metadata (workflow name, run_id,
commit, branch, actor) + a curated `error_class` enum
(`deploy-failed` / `test-failed` / `e2e-failed` / etc.). It never carries
log lines, stack traces, file paths from content, diffs, or error text.

This mirrors the structural PHI principle established by AISQL-phi-filter
(ADR-0009 §2): the protocol cannot leak what it does not contain. It is the
**floor**, not a convention — no scrubber maturity required for L2 to be safe.

### 2. HMAC-SHA256 signature — authenticate the sender

Every payload is signed with `HERMES_HMAC_SECRET` (a shared 32+ char secret,
set in GitHub Secrets AND the Pi5 Hermes `.env`, must match). The signature
is HMAC-SHA256 over the canonical JSON (sorted keys, no whitespace).
Hermes verifies before acting; mismatches are rejected silently (fail-closed).

This holds even if the chat itself is compromised — a forged message
without the secret cannot produce a valid signature.

### 3. Embed JSON in the human HTML message — one stream, two layers

The `<code>{...}</code>` payload + `<!--sig:...-->` are appended to the
existing human-readable HTML body in the **same** Telegram message. No
second message, no separate bot stream → no chat-spam regression.

### 4. `error_class` enum, not raw text

The only failure signal is a fixed enum derived from the job `result` +
workflow identity. Raw error messages never enter the payload — so a PHI-
laden assertion dump (`test_split_sql.py:30-36` prints SQL bodies on failure)
or a future stack trace can't leak through this channel.

### 5. Defensive gates — workflow green in every config

- No `TELEGRAM_BOT_TOKEN`/`CHAT_ID` → skip notify entirely (notice logged).
- No `HERMES_HMAC_SECRET` → send human-only HTML, omit the JSON payload.
- `secrets.*` never appears in job-level `if:` (GitHub forbids it — env-var
  indirection pattern, documented in workflow comments).

This means the protocol is **opt-in for Hermes without breaking plain
alerts** — the user can keep using Telegram notify as-is and add Hermes
later by setting one more secret.

## Alternatives considered

- **A. Redacted-log (forward CI log through a PHI scrubber on the Pi5).**
  Rejected as the floor. Requires a mature scrubber (regex for 13-digit
  IDs, Thai name patterns, `phase2-batch` paths, `reported_by` columns)
  before any byte reaches the cloud LLM. Miss a pattern → PII leak. Keep
  as the **L3+ requirement** (log fetch via `gh`), documented but not the
  default. Zero-data (chosen) needs no scrubber to be safe at L2.
- **B. URL-only + Hermes fetches log via `gh`.** Rejected as the floor for
  the same reason as A — once Hermes pulls the log, the PHI exposure is
  live unless a scrubber runs first. Also requires `gh` auth on the Pi5.
  Future option once the scrubber exists.
- **C. Plain-text marker, no HMAC.** Rejected. A private chat is *not*
  sufficient authentication — members can be added, bots can be
  compromised, message history can leak. HMAC is cheap and removes the
  spoofing class entirely.
- **D. Separate Telegram message for the JSON.** Rejected. Doubles chat
  volume; the user explicitly hit email-spam pain and a parallel stream
  would repeat it in Telegram. Embedded-in-one-message is strictly better.
- **E. Webhook (HTTP POST to Hermes) instead of Telegram.** Rejected for
  now — would require exposing the Pi5 to the internet (reverse proxy /
  tunnel) and is a larger ops surface. Telegram is already there.

## Consequences

**Positive:**
- PHI boundary holds structurally at L2 — no scrubber needed yet.
- Spoofing impossible without the shared secret.
- One message per alert — no chat-spam regression.
- Opt-in Hermes: plain Telegram alerts keep working unchanged.
- Forward path to L3/L4 is open (add scrubber → enable log fetch → PR).

**Negative:**
- L2 diagnosis is limited to `error_class` + run URL — Hermes can say
  "error_class=test-failed usually means X" but can't read the actual
  error. Accepted: that's the price of zero-data without a scrubber.
- User must manage one more secret (`HERMES_HMAC_SECRET`) in two places.
- HMAC requires byte-exact canonical JSON on both sides — the protocol
  spec documents this (consumer must extract the `<code>` block verbatim,
  not re-serialize).

## L3+ requirements (gated, not default)

To escalate beyond L2 (diagnose from actual logs, propose patches, open PRs):

1. **PHI scrubber on the Pi5** — regex-filter 13-digit IDs, Thai name
   patterns, `reports/phase2-batch-*` paths, `reported_by*` column names,
   `core.personnel`/`core.app_user` row content. Mirror the
   `core.ai_scope` `patient_safe=false` vocabulary.
2. **Fail-closed**: if the scrubber can't classify a line, redact it
   (don't forward). Same posture as `ai-sql.ts` STATIC_PHI_DENY.
3. **Cooldown + attempt cap** — max 3 diagnosis attempts per `run_id`,
   then escalate to human (prevent infinite fix→fail loops).
4. **PR-only, never direct push to main** — L4 auto-fix opens a PR; human
   merges. Reference workflow: `_example_hermes_l4_auto_pr.yml`.

None of these are shipped here. They are documented so the next person to
escalate knows the gates.
