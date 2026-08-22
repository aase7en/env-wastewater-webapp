# CURRENT WORK

Status: CHANGES_REQUIRED

Allowed statuses:

- IDLE
- DESIGNING
- READY_FOR_IMPLEMENTATION
- IMPLEMENTING
- REVIEW_REQUESTED
- CHANGES_REQUIRED
- RE-REVIEW_REQUESTED
- APPROVED
- BLOCKED

> `CURRENT-WORK.md` is the authoritative task definition. Agents must not silently expand task scope.

## Review Queue — 2026-08-22

| Order | PR | Verdict | Repository checkpoint |
|---:|---:|---|---|
| 1 | #16 — `WO-STAB-007` | APPROVED and merged | merge `77015d691d2d5a9f20937e582ffb53aa31cad875` |
| 2 | #15 — `WO-UX-SCALE-001` | APPROVED and merged | merge `da3f510535e711c7cdcbd52bca98c3ecea15e2e7` |
| 3 | #14 — Digital Twin foundation | CHANGES_REQUIRED | findings head `fc9023020bd2fc09e1bab2138153f44ab3f11978` |

PR #15 is now merged. PR #14 is unblocked for its recorded remediation/integration work, but must not merge until GPT approves it. No Digital Twin visual-direction work starts until PR #14 is approved and merged.

## Active Work Order

PR #15 is complete. The active queue now advances to PR #14 — Digital Twin foundation remediation.

Owner: GLM 5.3 when available, or ChatGPT Sol MAX + SunDay-Worker as temporary implementation worker.

PR: #14

State: `CHANGES_REQUIRED`

Required findings remain:

1. `DashboardRow.do_average` must not be presented as Aeration Tank DO with direct/manual provenance.
2. Manual latest snapshots must use `latest`, reserving `live` for actual sensor telemetry.
3. Renderer-init fallback coverage must reach the actual R3F renderer-construction failure path under StrictMode.
4. Mouse/touch Process → 3D re-entry must reset readiness before the remounted scene renders.

Before editing PR #14, integrate current `main` including PR #15 merge `da3f510535e711c7cdcbd52bca98c3ecea15e2e7`, preserve the latest coordination state, and resolve conflicts without discarding another owner's changes. Run all required gates and stop at `RE-REVIEW_REQUESTED`.

## Non-Blocking Follow-up

The rendered top bar is now at least 64px high while `--topbar-h` in `frontend/src/styles/spacing.css` still documents 56px. The token is currently unused. Reconcile or retire it before a future consumer relies on it; do not expand this remediation scope.

## Next Action

PR #14 owner: integrate current `main` (including merged PR #15), remediate only the four recorded foundation findings, run all gates, update HANDOFF/CURRENT-WORK to `RE-REVIEW_REQUESTED`, and stop for GPT review. Do not begin Digital Twin visual-direction work yet.
