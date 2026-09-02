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

## Review verdicts (implementer self-review, 2026-09-02)

- **Standards review: PASS.** Repo freshness gate honored (fresh worktree from verified `origin/main@2194411c`); work-order containment exact (7 files, remote diff = local diff); data honesty preserved (unknown ≠ real category, blank → null, only canonical + verified labels, no invented mappings); schema/adapter agree (CHECK sets = adapter sets); migration additive/idempotent/fail-closed/no-data-mutation, trigger + chemical schema untouched (pinned by contract tests); no secrets exposed (env values process-only, never printed); no real writes (all REST mocked/synthetic); regression adequacy: 19 focused tests + full suites (248 Vitest, 115 Playwright); `.serena/**` never staged/touched; no shared SSoT edited (coordinator owns reconciliation).
- **Spec review: PASS.** Missing/blank `sample_type`/`test_type` remain null; non-canonical tokens fail closed per row before any REST write; canonical values (5 Thai sample types, 3 English test types) import correctly incl. trim/case/verified-label normalization; existing valid Food workflows compatible (page form defaults/submit unchanged semantically; only `reagent_used` removed from a write path that never populated it); reagent trigger remains DORMANT (compiler-enforced via `FoodInput` Omit; migration + tests pin no-trigger-touch); no mobile/UI behavior changed (no layout/style/markup-structure edits).
- Independent GPT review remains the merge gate; these self-verdicts do not approve the merge.

## Exact-SHA CI (observed 2026-09-02)

- Final PR head at review freeze: `597b679fbe319763e9fa9b1435dcd4e9613f5c00` (docs-freeze commit).
- All four GitHub check runs verified bound to exactly that SHA via the check-runs API (`head_sha=597b679`): **smoke PASS (3m31s, full Playwright E2E), scripts PASS, notify PASS ×2**.
- If this handoff is later amended by a docs-only completeness commit, the binding head is that latest PR head — resolve via PR #66 `headRefOid`; per collaboration protocol §17 no commit writes its own SHA into itself.

## Dirty state at freeze

Worktree `A:\GitHub\envww-food-core-001` clean (no modified/untracked tracked-path files; `git status --short` empty) on `fix/food-core-001` at the pushed head. Protected `.serena/**` does not exist in this worktree.

## Remote PR / CI (frozen 2026-09-02)

- Implementation checkpoint SHA: `5f0407a94223a6b07709f5ab10ceb17d15b430e8` (7 files, exactly the WO scope)
- PR: https://github.com/aase7en/env-wastewater-webapp/pull/66 (OPEN, base `main`, MERGEABLE at freeze)
- Remote diff audited: file list identical to the local diff — no `.serena/**`, no shared SSoT/UI, no other-domain files
- This docs-only freeze commit follows the implementation checkpoint; independent review binds to the actual PR head at review time (any head change invalidates review)
- Exact-head CI status: observe on the PR at review time (checks triggered by the push; reviewer must require them green on the latest head before merge)

## One next safe action

GPT lead ingests this handoff, performs independent exact-SHA Standards +
Spec review on the actual remote diff, requires exact-head CI, then merges
via the authorized owner and applies/live-verifies the migration read-only
(FUEL/GARBAGE post-merge pattern). Reagent hardening backlog decision can
proceed in parallel.
