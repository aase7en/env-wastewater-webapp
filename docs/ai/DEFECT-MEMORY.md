# UTH[AI]-ENV — Defect Memory

Last updated: 2026-08-29
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

## ENV-DEFECT-006 — Conditional error reveal must wait for the committed target

**Failure class:** accessibility / asynchronous UI focus and viewport race.

**Symptom:** after a failed mobile save, the error alert existed but intermittently focus remained on `BODY` and the alert was fully above the viewport. The regression reproduced 2/20 in the verification lane.

**Root cause:** focus/scroll was scheduled directly from the submit handler with `requestAnimationFrame`, which could run before React committed the conditionally rendered banner/validation target.

**How detected:** independent mobile E2E review strengthened the failed-save path to assert `role=alert`, focus ownership, viewport intersection, entered-value preservation, and successful retry; repeated execution exposed the race.

**Prevention rule:** when the focus/scroll target is conditionally rendered by state, represent the reveal as state and perform focus/scroll in an effect after the target is committed. Error recovery should be deterministic and must not depend on smooth-scroll timing. Preserve entered values and retry semantics.

**Regression/evidence:** `frontend/tests/e2e/daily-form-mobile.spec.ts` failed-save regression; ENV-MOBILE-001D evidence at `cdaa1097022b7fbfedfff8302a628af630f6cfb1`; remediation `b7c2623168da4d6fac8990a7f90180ee1b1326f1`; final independent repeat 20/20 PASS at PR head `f7af3027dafe52f06719a2e08de993a31045162f`.

**Domains affected:** mobile forms, async mutations, conditional validation/error banners, accessibility focus management.

---

## ENV-DEFECT-007 — Hidden document overflow can make local containment false-green

**Failure class:** responsive UI / false-green geometry assertion / action reachability.

**Symptom:** a mobile table and most of its 44px Delete action escaped the owning card/viewport, while `documentElement.scrollWidth <= innerWidth` still passed.

**Root cause:** an ancestor (`AppShell` main) used `overflow-x: hidden`, clipping escaped content and suppressing document-level overflow without creating a usable local scroll/reflow boundary.

**How detected:** independent ENV-MOBILE-005 review measured the Garden card, table, viewport, and action bounds at 320/360px rather than trusting document width alone.

**Prevention rule:** for wide content, assert the actual local boundary against its card and viewport, assert `scrollWidth/clientWidth` + overflow behavior, and prove the full terminal action is reachable by keyboard/touch. A document-width assertion is supplemental, never sufficient when an ancestor clips overflow.

**Regression/evidence:** `frontend/tests/e2e/garden-mobile.spec.ts` local boundary/table/action geometry and ArrowRight reachability; Garden remediation `e137cd468f628961dcfb697f0470cb3da76062bd`; reviewed PR #48 head `327ae8b541f3e29f5727acc7edb3ed76b12f20bc`.

**Domains affected:** every mobile table/chart/canvas, nested scroll regions, AppShell-contained forms, keyboard action reachability.

---

## Adding future entries

Add a new entry only after the root cause is verified. The entry should change at least one future behavior: a guardrail, test, spec rule, audit item, or implementation pattern.

When a lesson becomes obsolete because architecture removes the failure class, mark it `RETIRED` with the replacement contract instead of silently deleting history.
