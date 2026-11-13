# ENV-SUNDAYMCP-ROUTING-001 — SundayMCP-first Repository Instruction Migration

Status: CLAIM_ACCEPTED / IMPLEMENTED_AWAITING_INDEPENDENT_REVIEW. Claim transition PR #179 independently APPROVED at exact head `b320e806b025de9fd7acfe8a0c7ed3c5ec072352`, CI `scripts`/`notify` passed and merged to authoritative `main` as `8dd0c5ce031ecd39b553f340c376ad5b2ebc1d57`. Implementation remains separately gated by actual repository ownership/scope/SAFE_TO_MUTATE, evidence and independent review.
Owner authorization: explicit project-owner request on 2026-11-13 to perform repository synchronization after ChatGPT Project Instructions and Sources were updated (owner-reported, not directly verified).
Repository: aase7en/env-wastewater-webapp
Proposed claim: ENV-SUNDAYMCP-ROUTING-001-C1, generation 1
Transition base: f60316ceff7459caebc7b18d112b0976dec32890; revalidate before merge.
Implementation branch: docs/env-sundaymcp-routing-001 (create only after accepted transition merge).
Implementation worktree: /Volumes/MAC_WORK/DevWorkspace/Github/_worktrees/env-sundaymcp-routing-001-impl-20261113

## Objective

Surgically align ACTIVE repository instructions to SundayMCP-first routing. Preserve ENV identity, architecture, product/data semantics, governance, PHI/security, existing claims, and historical Worker/Serena evidence. This is a docs/config migration, not a new engineering project.

## Allowed implementation scope — exact paths

- `AGENTS.md`
- `docs/ai/PROJECT-OPERATING-MAP.md`
- `docs/ai/tooling/AI-DEVELOPER-TOOLCHAIN.md`
- `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md`
- `docs/work-orders/ENV-SUNDAYMCP-ROUTING-001.md`
- `docs/ai/handoffs/ENV-SUNDAYMCP-ROUTING-001.md`

## Forbidden and no-touch

- `docs/ai/CURRENT-WORK.md` (coordinator transitions only; implementation lane may never self-claim).
- `docs/ai/HANDOFF.md`, `docs/ai/architecture/ENV-COORDINATION-GUARD.md`, `scripts/**`, `.github/**`.
- `frontend/**`, `supabase/**`, `data/**`, `.env`, production data, credentials, server startup config.
- Existing handoffs, archived Work Orders, historical Worker/Serena execution evidence, and unknown dirty/untracked files.

## Required surgical edits

1. `AGENTS.md`: add current local routing. macOS SundayMCP PRIMARY; Windows SundayMCP Windows PRIMARY; matching-device RDC secondary/recovery; GitHub remote PR/CI authority; retired SunDay-Worker 1–5 and Serena never auto-started/dispatched/rebound. Connected does not imply SAFE_TO_MUTATE.
2. `docs/ai/PROJECT-OPERATING-MAP.md`: replace obsolete ACTIVE SunDay workers/Serena routing bullet. Preserve GPT/GLM/Codex ownership.
3. `docs/ai/tooling/AI-DEVELOPER-TOOLCHAIN.md`: replace obsolete active Serena/Worker row with OS-specific SundayMCP, verified RDC fallback, legacy compatibility only. Preserve dated historical Codex toolchain notes.
4. `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md`: replace active Serena/Worker instruction with current routing. Preserve design responsibilities and historical records.

## Gates / acceptance

- FIRST verify accepted claim is present on fetched authoritative main and generation/holder match; use clean isolated implementation worktree based on claim-transition merge SHA, not the dirty original Mac or stale Windows checkout.
- Verify actual SundayMCP device/capabilities with a bounded read-only call; GitHub independently for PR/CI; RDC only verified fallback. No legacy Worker/Serena dispatch.
- Verify claim, scope, no overlapping owner, actual branch/HEAD/dirty state, secure/no PHI/secret boundaries: SAFE_TO_MUTATE = YES before implementation.
- Preserve unrelated text and filename identity; do not rewrite historical handoffs. Check link references, active routing search, `git diff --check`, diff scope and mandatory security.
- Docs-only: focused deterministic checks; do not claim frontend E2E passed when it was not run. Test coordination guard if control registry changed.
- Freeze exact candidate SHA; obtain independent reviewer verdict and applicable hosted CI; inspect exact remote PR diff.
- Implementation author must stop at REVIEW_REQUESTED; no self-approval or self-merge. Claim-transition merge in BOOTSTRAP_CONTROL needs exact-SHA independent review plus separate explicit human authorization.
- After authorized merge verify merged main SHA and routing; record durable closeout and release claim through accepted transition.

## One next safe action

Obtain independent exact-SHA review of the claim-transition PR; after owner-authorized merge, create implementation branch/worktree and edit only the four ACTIVE routing documents listed above.
