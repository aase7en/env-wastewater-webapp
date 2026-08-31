# ENV-MOBILE-006-GARBAGE — GPT-5.6 Sol Visual Lane Handoff

Status: CLAIMED
Date: 2026-08-31
Repo: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-mobile-006-garbage`
Branch: `feat/env-mobile-006-garbage`
Base: `origin/main@b165a7209a4fa2a14f2471e3b0cdf36f9a806e25`
Activation SHA: `PENDING_CHECKPOINT`

Objective: make `/garbage` practical and accessible on 360–430 px phones without changing the verified Garbage Core/data contract.

Allowed mutable scope:
- `frontend/src/pages/GarbagePage.tsx`
- `frontend/tests/e2e/garbage-mobile.spec.ts`
- `docs/work-orders/ENV-MOBILE-006-GARBAGE.md`
- this handoff
- bounded CURRENT-WORK/HANDOFF/ROADMAP/PROJECT-GRAPH status records

No-touch:
- `frontend/src/lib/garbage.ts`
- Garbage import adapter/tests
- Supabase/schema/RLS/carbon/factors
- shared UI/AppShell/styles
- other modules
- `.serena/**`

Source findings before baseline:
- phone form currently uses 2 columns;
- nine visible controls lack stable label associations;
- delete target is plain text and unproven for 44 px;
- history containment must be measured;
- no dedicated Garbage mobile E2E exists;
- canonical `segregation_type` semantics are verified and must remain unchanged.

Browser plugin unavailable; Playwright fallback declared.

One next safe action: freeze activation docs commit, then add focused RED/baseline E2E without changing production page behavior.