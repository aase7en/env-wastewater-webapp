# HANDOFF

Status: CHANGES_REQUIRED — PR #15 approved/merged; PR #14 is the active remediation queue.

## Repo State — 2026-08-22

Current `main` after UX-scale merge: `da3f510535e711c7cdcbd52bca98c3ecea15e2e7`.

Completed in review order:

- PR #16 — `WO-STAB-007`: APPROVED / MERGED at `77015d691d2d5a9f20937e582ffb53aa31cad875`.
- PR #15 — `WO-UX-SCALE-001`: APPROVED / MERGED at `da3f510535e711c7cdcbd52bca98c3ecea15e2e7`.

PR #15 final review verified:

- mobile notification and pending-user panels stay inside the 360px viewport;
- mobile brand link target is at least 44x44;
- focused mobile run `--retries=0 --repeat-each=3` passed 6/6;
- build passed; Vitest passed 152/152; full Playwright passed 37/37; `git diff --check` passed;
- lint remained at the documented baseline (12 warnings + 3 existing fixture false-positive errors);
- GitHub `scripts`, `smoke`, and notify checks were green;
- PR was MERGEABLE before merge;
- before/after evidence is committed under `docs/review-evidence/pr-15/`.

## Active Queue

| Order | PR | Owner | State | Dependency |
|---:|---:|---|---|---|
| 1 | #14 — Digital Twin foundation | GLM 5.3 or ChatGPT Sol MAX + SunDay-Worker | CHANGES_REQUIRED | integrate current main including PR #15 |

## PR #14 Required Remediation

1. `DashboardRow.do_average` is a derived average of Aeration, Sedimentation and Before-discharge DO. Do not present it as direct Aeration Tank DO or give it incorrect manual/direct provenance.
2. Manual/latest database snapshots must use mode `latest`; reserve `live` for actual sensor telemetry.
3. Renderer-init fallback test must prove the real R3F renderer-construction failure path under StrictMode rather than failing earlier in a capability probe.
4. Mouse/touch Process → 3D re-entry must reset readiness before the remounted scene renders; stale `ready` must not leak across the transition.
5. Integrate current `main` and resolve coordination-doc conflicts toward this latest state without discarding another owner's changes.

## Required Gates for PR #14

- focused tests for each remediated finding;
- `npm run lint` at baseline or better;
- `npm run build`;
- `npm test`;
- full Playwright;
- `git diff --check`;
- GitHub CI green before final review.

## Guardrails

- No schema/Auth/RLS/PFD changes unless a recorded blocker proves they are necessary.
- Unknown telemetry must remain unknown; never map missing data to zero, normal or stopped.
- `live` must mean actual live/sensor telemetry only.
- Do not start Digital Twin visual-direction work while PR #14 is unmerged.
- Primary worktree contains unrelated untracked user files; do not remove, clean, reset or stage them.

## Next Action

PR #14 implementation owner: integrate `main@da3f510535e711c7cdcbd52bca98c3ecea15e2e7`, remediate only the four recorded foundation findings, update `CURRENT-WORK.md` and this handoff to `RE-REVIEW_REQUESTED`, push to PR #14, then STOP for GPT review.
