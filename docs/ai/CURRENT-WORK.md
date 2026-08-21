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

GPT reviewed the three queued pull requests in the required order.

| Order | PR | Verdict | Repository checkpoint |
|---:|---:|---|---|
| 1 | #16 — `WO-STAB-007` | APPROVED and merged | merge `77015d691d2d5a9f20937e582ffb53aa31cad875` |
| 2 | #15 — `WO-UX-SCALE-001` | CHANGES_REQUIRED | findings on branch head `edd18b0f77bf2050fa49e6cde95eb7d3f6251a99` |
| 3 | #14 — Digital Twin foundation | CHANGES_REQUIRED | findings on branch head `fc9023020bd2fc09e1bab2138153f44ab3f11978` |

PR #14 must not merge before PR #15. No visual-direction work starts until the foundation is approved and merged.

## PR #15 — Required Owner Action

Owner: Codex — Visual Experience

The production checkpoint `d6b31c19b734331b54c5861c4e74aaf30f5d97f9` has two mobile acceptance failures:

1. The notification and pending-user panels are anchored to their individual bells and extend beyond the left edge at 360px when opened.
2. The mobile brand link has a 36px by 36px target instead of the required minimum 44px by 44px.

Add deterministic mobile coverage for both open panels, attach the required before/after evidence, integrate current `main`, run all gates and stop at `RE-REVIEW_REQUESTED`. The complete finding and scope guardrails are committed in PR #15's `docs/ai/CURRENT-WORK.md`.

## PR #14 — Required Owner Action

Owner: GLM 5.3 — Core Engineering / integration

The production checkpoint `36a895e68742c57e34b9354798d2fc5497d90596` has four blocking foundation issues:

1. `DashboardRow.do_average` is a derived average of Aeration, Sedimentation and Before-discharge DO, but is presented as Aeration Tank DO with direct manual provenance.
2. Manual latest snapshots are encoded as mode `live`; add/use `latest` and reserve `live` for actual sensor telemetry.
3. The renderer-initialization fallback test can fail in the StrictMode capability probe before reaching the R3F renderer factory, so the claimed path is not proven.
4. Mouse/touch Process → 3D re-entry bypasses the readiness-reset helper and can expose stale `ready` before the remounted scene renders.

Remediate without schema/Auth/RLS/PFD/visual-scope expansion. After PR #15 merges, integrate the then-current `main`, resolve `CURRENT-WORK.md` and `HANDOFF.md` in favor of the latest coordination state, run all gates and stop at `RE-REVIEW_REQUESTED`. The complete finding is committed in PR #14's `docs/ai/CURRENT-WORK.md`.

## Next Action

1. Codex remediates PR #15 and requests GPT re-review.
2. GPT approves/merges PR #15 or records a new actionable finding.
3. GLM completes PR #14 remediation and final main integration.
4. GPT re-reviews PR #14; only after approval/merge may Codex begin the queued Twin visual work orders.
