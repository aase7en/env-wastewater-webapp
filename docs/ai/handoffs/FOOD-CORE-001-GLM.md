# FOOD-CORE-001 — Implementation / Review Handoff (GLM lane)

Status: REVIEW_REQUESTED
Date: 2026-09-02
Repo: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-food-core-001`
Branch: `fix/food-core-001`
Base: `origin/main@2194411c4cc2e63eefc89218328d34116a2b7b81`
Implementation (code) checkpoint: frozen below after push — review binds to the actual pushed PR head; any head change invalidates review.
Owner: GLM-5.3 MAX (Core Engineering / Track Z). Review/merge owner: GPT-5.6 Sol. Implementer does not self-merge.

## Objective

Close the Food categorical data-honesty defect before any Food mobile/visual
work: no fabricated `น้ำประปา`/`total_coliform` for missing data, fail-closed
non-canonical tokens, DB CHECKs agreeing with adapter semantics, and
`reagent_used` kept dormant with its trigger hazards recorded.

## Files changed (complete list)

- `frontend/src/lib/import-adapters/food.ts` — `mapSampleType()`/`mapTestType()`: blank → null; canonical sets (5 Thai sample types, 3 English test types); only the three verified A-Wiki test-type display labels mapped; anything else non-empty throws before any REST write; never writes `reagent_used`.
- `frontend/src/lib/import-adapters/food.test.ts` (new, 19 tests) — adapter honesty + migration static contract + `FoodInput` type contract (reagent_used unwritable).
- `frontend/src/lib/food.ts` — `FoodInput` `Omit`s `reagent_used` (read type + COLUMNS unchanged); dormancy documented.
- `frontend/src/pages/FoodPage.tsx` — semantic only: initial state drops `reagent_used`; informational note corrected to state dormancy. No layout/style/markup-structure change.
- `supabase/migrations/20260902000000_food_core_001_canonical_categories.sql` (new) — two idempotent canonical CHECK constraints; fail-closed on dirty data; no data mutation; reagent trigger/chemical schema untouched (pinned by tests).
- `docs/work-orders/FOOD-CORE-001.md`, this handoff.

## RED evidence (before implementation)

- Focused Vitest **14 failed / 5 passed** (clean assertions after one harness
  correction: null-SQL TypeErrors guarded with `expect(sql).toBeTruthy()`):
  missing/blank `sample_type` fabricated to `น้ำประปา` ×2; missing/blank
  `test_type` fabricated to `total_coliform` ×2; no normalization/verified
  label mapping ×2; arbitrary tokens accepted ×2; migration contract ×6.
- TypeScript **TS2322** (`Type 'true' is not assignable to type 'never'` at
  the `FoodInput` reagent_used type-contract assertion) — write-type defect.

## GREEN evidence (final state)

- Focused `food.test.ts`: **19/19 PASS**; full Vitest: **248/248 PASS**;
  standalone `tsc -b`: PASS; lint: **12 pre-existing warnings / 0 errors**;
  production build: PASS; full Playwright: **115/115 PASS**
  (`--workers=1 --retries=0`); `git diff --check`: PASS; changed-file scope
  audit: PASS (no shared SSoT / shared UI / other-domain / RLS / carbon /
  trigger changes; `.serena/**` untouched).
- Fresh-worktree missing `VITE_SUPABASE_URL/ANON_KEY` (module-load guard)
  classified ENVIRONMENT_FAILURE; runs used process-only values from the
  existing secure local config; secrets never printed. All Playwright REST
  is mocked/synthetic — no real writes.

## Reagent-trigger dormancy/hardening status

DORMANT and preserved: no app/import path writes `reagent_used`; `FoodInput`
omits it (compiler-enforced); migration + contract tests leave
`trg_decrement_reagent`/`fn_decrement_reagent`/`chemical.*` untouched.
Hardening backlog (non-numeric qty aborts INSERT; negative qty inverts
stock; orphan movements on failed master lookup; no unit reconciliation;
no duplicate-decrement protection; silent skip without feedback) is
recorded in `docs/work-orders/FOOD-CORE-001.md` for a separate decision/WO.

## Decisions / blockers

- None blocking this slice. Canonical vocabularies came from repo/A-Wiki
  contracts (page select + A-Wiki entity agree; stale 4-value SQL comment
  documented as non-contract). Building `repair_needed` DECISION_REQUIRED
  and Building adapter defects are OUT of scope (separate lane).

## Remote PR / CI (filled at freeze)

- Implementation checkpoint SHA: `<filled at freeze>`
- PR: `<filled at freeze>`
- Exact PR head SHA at review freeze: `<filled at freeze>`
- Remote diff audit + exact-head CI status: `<filled at freeze>`

## One next safe action

GPT lead ingests this handoff, performs independent exact-SHA Standards +
Spec review on the actual remote diff, requires exact-head CI, then merges
via the authorized owner and applies/live-verifies the migration read-only
(FUEL/GARBAGE post-merge pattern). Reagent hardening backlog decision can
proceed in parallel.
