# ENV-MOBILE-005 - Garden mobile convergence

Date: 2026-08-28
Status: IMPLEMENTING
Owner: GPT-5.6 Sol
Branch/worktree: `feat/env-mobile-005-garden` / `A:\GitHub\envww-review-mobile-001`
Base: `origin/main@19eb31ff725e746a1e5856db5c9e86badd1c725b`
Contract: `docs/work-orders/ENV-MOBILE-005-GARDEN.md`

## Activation checkpoint

- Fuel (`ENV-MOBILE-004`) is closed on main; no production work order overlapped at activation.
- Garden was selected before Garbage because both share the same mobile layout/touch pattern, while Garbage also has dual `waste_type`/`segregation_type` and manifest/compliance semantics that deserve a separate Core audit before responsive mutation.
- Mutable production file is only `frontend/src/pages/GardenPage.tsx`; focused regression file is `frontend/tests/e2e/garden-mobile.spec.ts`.
- `frontend/src/lib/garden.ts`, schema/RLS/carbon/shared UI/AppShell/other modules are read-only.
- Actual ENV schema confirms Garden extension fields; A-Wiki's pending-extension note is stale and not used as authority.
- `.serena/` remains protected/untracked and untouched.
- Next step: establish deterministic phone-width RED/baseline before production edit.

## RED / baseline evidence

At activation head `1fce5132f7e667f9324a1ff0eca9110c73d9f2f1`, focused Garden baseline ran with retries 0 / worker 1: **2 PASS / 3 RED**.

- phone control x-delta = 154 px;
- delete width = 19.125 px (<44);
- first semantic label lookup resolves 0 controls and source shows the same unassociated label pattern for all nine controls;
- history/document containment already passes at 360 px;
- desktop density already passes at 1024 px.

The production page remained untouched. The implementation seam is therefore limited to phone grid composition, page-local label/control associations, and the delete touch target.
