# UTH[AI]-ENV — Defect Memory

Last updated: 2026-08-27
Status: ACTIVE REUSABLE FAILURE MEMORY

Purpose: retain only **reusable defect lessons** that should change how future ENV work is designed, tested, reviewed, or audited. This file is repository memory; chat memory is not a substitute.

Do not turn this into a chronological bug dump. A defect belongs here only when the failure pattern can recur across future work.

## Entry template

```text
ID:
Failure class:
Symptom:
Root cause:
How detected:
Prevention rule:
Regression/evidence:
Domains affected:
Source record:
```

---

## ENV-DEFECT-001 — Positive provider allowlists must be schema-backed

**Failure class:** PHI / external-provider authorization boundary.

**Symptom:** a row key positively allowlisted for external AI could carry arbitrary identifying text even when the field name looked like a numeric operational metric.

**Root cause:** safe-field authorization relied on field names while some allowlisted names were unrestricted text or did not exist in the current live schema. A stale/nonexistent name is not a safe contract.

**How detected:** independent reviewer RED proofs for WO-STAB-009, including captured provider-body leakage when stale `ph_tank` was temporarily re-added.

**Prevention rule:** every positive provider-safe field must be reconciled against the current live schema + later migrations and have an enforceable bounded type/write contract. Unknown/stale names are removed, not guessed. Regex scrubbing is defense-in-depth only.

**Regression/evidence:** `frontend/src/lib/admin/annotate-boundary.test.ts`; `reports/schema-snapshot-live.md`; PR #33 final review record in `docs/ai/CURRENT-WORK.md` / `HANDOFF.md`.

**Domains affected:** AI annotation/chat, schema changes, imports, provider integrations.

---

## ENV-DEFECT-002 — `latest` is not `live`; derived plant values are not direct asset telemetry

**Failure class:** data-honesty / Digital Twin semantics.

**Symptom:** manual/latest or plant-wide derived data could be presented as realtime/direct asset telemetry.

**Root cause:** presentation mapping compressed different provenance/measurement meanings into one visual field/mode.

**How detected:** Digital Twin foundation review and remediation.

**Prevention rule:** preserve distinct contracts for manual/latest, real sensor live, historical, and simulation. A plant-wide derived measurement must not be displayed as a direct asset measurement without a validated mapping.

**Regression/evidence:** Digital Twin records in `docs/ai/CURRENT-WORK.md`; `frontend/src/lib/twin/dashboard-adapter.test.ts`; Digital Twin Playwright coverage.

**Domains affected:** Digital Twin, dashboards, analytics, external telemetry.

---

## ENV-DEFECT-003 — E2E must exercise the PR code, not deployed main

**Failure class:** false-green CI / regression coverage.

**Symptom:** a PR could build successfully while Playwright exercised the already-deployed `main` application, allowing PR behavior regressions to escape pre-merge detection.

**Root cause:** the E2E target and the compiled PR artifact were disconnected.

**How detected:** WO-STAB-004 CI remediation recorded in `.github/workflows/e2e.yml`.

**Prevention rule:** pre-merge E2E must run against the checked-out PR code. Production smoke after merge/deploy is a separate gate.

**Regression/evidence:** `.github/workflows/e2e.yml` runs the branch via Playwright webServer; `deploy-frontend.yml` owns post-deploy smoke.

**Domains affected:** all frontend work.

---

## ENV-DEFECT-004 — Stale/dirty local checkout is not SSoT

**Failure class:** multi-agent coordination / repository freshness.

**Symptom:** an agent can confidently read an old local worktree and treat stale plans/source as current project truth, or destroy user/agent work while trying to update it.

**Root cause:** trusting session/project activation instead of verifying `origin/main`, combined with dirty/untracked multi-agent worktrees.

**How detected:** repository-health audit and repeated reviewer worktree caveats.

**Prevention rule:** fetch current `origin/main` before non-trivial work; verify ancestry; use a clean isolated worktree when the primary checkout is stale/dirty; never blindly reset/clean/stash unknown files.

**Regression/evidence:** freshness gate in `AGENTS.md`; `reports/repo-health-2026-08-25.md`.

**Domains affected:** every agent and every work order.

---

## ENV-DEFECT-005 — Optimistic state transitions must be idempotent

**Failure class:** UI state consistency / repeated action.

**Symptom:** repeated “mark read” interactions could decrement unread counts more than once or change state for already-read/unknown records.

**Root cause:** count mutation and row-state transition were not governed by the same pre-action condition.

**How detected:** WO-STAB-006 independent RED reproduction.

**Prevention rule:** derive one pre-action decision (`wasUnread` or equivalent) and use it for both entity mutation and aggregate count mutation; repeat/already-complete paths must be no-ops and preserve state identity where intended.

**Regression/evidence:** PR #30 review record in `docs/ai/CURRENT-WORK.md` / `HANDOFF.md`; alert unread tests.

**Domains affected:** alerts, optimistic React Query updates, counters/badges, repeated actions.

---

## Adding future entries

Add a new entry only after the root cause is verified. The entry should change at least one future behavior: a guardrail, test, spec rule, audit item, or implementation pattern.

When a lesson becomes obsolete because architecture removes the failure class, mark it `RETIRED` with the replacement contract instead of silently deleting history.
