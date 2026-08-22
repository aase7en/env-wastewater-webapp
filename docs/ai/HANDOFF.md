# HANDOFF

Status: CHANGES_REQUIRED — GPT review queue checkpoint. Read `CURRENT-WORK.md` before taking ownership.

## Repo State — 2026-08-22

Review base on `main`: `77015d691d2d5a9f20937e582ffb53aa31cad875`

- All five P0 findings from `reports/code-review-2026-08-12.md` remain fixed on `main`.
- Supabase keep-alive workflow remains deployed.
- PR #16 (`WO-STAB-007`) was approved and merged at `77015d6`; overview carbon MoM now compares only the exact previous calendar month and returns null across a gap.
- PR #15 and PR #14 were not merged. Both have durable `CHANGES_REQUIRED` findings on their own branches.

## Active Queue

| Order | PR | Owner | State | Exact branch head |
|---:|---:|---|---|---|
| 1 | #15 — `WO-UX-SCALE-001` | Codex | CHANGES_REQUIRED | `edd18b0f77bf2050fa49e6cde95eb7d3f6251a99` |
| 2 | #14 — Digital Twin foundation | GLM 5.3 | CHANGES_REQUIRED; merge only after #15 | `fc9023020bd2fc09e1bab2138153f44ab3f11978` |

### PR #15 remediation summary

- Keep both bell dropdown panels fully inside a 360px viewport when open.
- Raise the mobile brand-link target from 36px to at least 44px.
- Add deterministic open-panel mobile coverage and reviewable before/after evidence.
- Integrate current `main`, run all gates and stop at `RE-REVIEW_REQUESTED`.

### PR #14 remediation summary

- Do not present derived plant-wide `do_average` as Aeration Tank DO with direct/manual provenance.
- Add/use `latest` for manual snapshots; reserve `live` for actual sensor telemetry.
- Make the renderer-init fallback test reach the real R3F renderer-construction failure path under StrictMode.
- Reset 3D readiness on mouse/touch Process → 3D re-entry and cover it deterministically.
- After #15 merges, integrate current `main`, resolve the two coordination-doc conflicts toward the latest state, run all gates and stop at `RE-REVIEW_REQUESTED`.

Full findings, scope limits and required gates are in each PR branch's `docs/ai/CURRENT-WORK.md`.

## Merge Order

1. GPT re-reviews and merges #15 only after its owner reports `RE-REVIEW_REQUESTED`.
2. GLM integrates that new `main` into #14 and requests re-review.
3. GPT re-reviews and merges #14 only if data honesty, resilience and readiness tests pass.
4. Codex may then start the Twin visual micro work orders from `docs/ai/digital-twin/03-MICRO-STEP-BOARD.md`.

Do not begin Twin visual styling while #14 is unmerged.

## Remaining GLM Backlog After #14

1. `WO-STAB-006` — alert unread optimistic double-decrement.
2. `WO-STAB-008` — role-visibility write-error surfacing.
3. `WO-STAB-009` — `annotateRow` PHI policy.
4. Component-test harness investigation.

## Operational Guardrails

- Never treat missing telemetry as zero, normal or stopped.
- React Query/Supabase remains telemetry source of truth; Zustand holds interaction/simulation state only.
- Keep private hospital photographs and drawings outside Git.
- Never use destructive Git commands in shared worktrees; stage only explicit owned files.
- The primary worktree contains unrelated untracked user files. Do not remove or stage them.
