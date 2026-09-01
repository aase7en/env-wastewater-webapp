# FOOD-CORE-001 — canonical food categorical honesty

Status: REVIEW_REQUESTED
Owner / implementer: GLM-5.3 MAX (Core Engineering / Track Z)
Lead / review / merge owner: GPT-5.6 Sol
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-food-core-001`
Branch: `fix/food-core-001`
Base: `origin/main@2194411c4cc2e63eefc89218328d34116a2b7b81` (post-Safety-#65 merge; verified at activation)
Exact HEAD: frozen at commit/push; see `docs/ai/handoffs/FOOD-CORE-001-GLM.md`
Lane handoff: `docs/ai/handoffs/FOOD-CORE-001-GLM.md`
Selection evidence: `A-Wiki/inbox/ENV-GLM53-SAFETY-FOOD-BUILDING-READINESS.md` Phase B (Food trace, 2026-09-02)
Last updated: 2026-09-02

## Goal

Make Food categorical data truthful before any Food visual/mobile expansion (ENV-MOBILE-008):

- missing/blank `sample_type` must NOT be fabricated into `น้ำประปา`;
- missing/blank `test_type` must NOT be fabricated into `total_coliform`;
- non-canonical categorical tokens must fail the row before any REST write;
- DB constraints and adapter semantics must agree;
- `reagent_used` stays dormant (no app/import write path), with its trigger
  hazards recorded as a separate hardening/decision surface.

Same data-honesty defect class already closed by FUEL-CORE-001 and
GARBAGE-CORE-001; their patterns were reused where semantically valid.

## Source reality — 2026-09-02 (current main 2194411c, re-traced)

- `frontend/src/lib/import-adapters/food.ts` fabricated categoricals:
  `sample_type ?? "น้ำประปา"`, `test_type ?? "total_coliform"`, and accepted
  arbitrary text for both. `applyAdapter` (types.ts) turns per-row throws
  into UI row errors, so a throwing adapter fails closed per row.
- `FoodPage.tsx` form never sets `reagent_used` (stays null); the adapter
  never maps it → the AFTER INSERT trigger `trg_decrement_reagent`
  (`food.fn_decrement_reagent` → `chemical.movement`, `20260719000006_mod_columns.sql:186-217`)
  is DORMANT on every current app/import path.
- `food.lab_test` had no CHECK constraints on `sample_type`/`test_type`
  (v2 + MOD-batch migrations; live snapshot `reports/schema-snapshot-live.md`
  2026-08-03 confirms only PK/FK and records the table empty).
- Canonical vocabularies (repo + A-Wiki, no model guesses):
  - `sample_type`: น้ำประปา / น้ำบาดาล / อาหาร / ผัก / น้ำแข็ง — FoodPage
    select (5 options) and A-Wiki food entity agree; the v2 SQL schema
    comment listing only 4 is stale documentation, not a contract.
  - `test_type`: total_coliform / e_coli / fecal_coliform — FoodPage select,
    A-Wiki food entity, and v2 schema comment agree.
- Shared SSoT (CURRENT-WORK/HANDOFF/ROADMAP) intentionally NOT edited by
  this lane; GPT lead owns global reconciliation per campaign contract.

## Settled data contract

Import normalization:

- blank/missing `sample_type`/`test_type` → `null` (unknown ≠ a category);
- canonical Thai sample types pass after trim (`str()` trims);
- test types: trim + lowercase canonical tokens; ONLY the three verified
  A-Wiki display labels (`Total coliform`, `E. coli`, `Fecal coliform`,
  case-insensitive) map to canonical values — no other synonym invented;
- any other non-empty token → row error before REST write.

Write contract:

- `FoodInput` omits `reagent_used` (read stays available on `FoodLabTest`
  for display); the page no longer seeds it; the adapter never writes it.
  Reagent decrement therefore stays dormant until a separate evidence-backed
  scope decision re-opens it.

Database:

- idempotent CHECK constraints on `food.lab_test.sample_type` and
  `.test_type` with exactly the canonical sets above;
- no historical migration modified; no data read/written/backfilled;
- migration fails closed if existing data would violate the constraint.

## Mutable scope (actual)

- `frontend/src/lib/import-adapters/food.ts`
- `frontend/src/lib/import-adapters/food.test.ts` (new)
- `frontend/src/lib/food.ts` (FoodInput Omit only)
- `frontend/src/pages/FoodPage.tsx` (semantic only: initial state drops
  `reagent_used`; informational note corrected; no layout/style change)
- `supabase/migrations/20260902000000_food_core_001_canonical_categories.sql` (new)
- this work order + `docs/ai/handoffs/FOOD-CORE-001-GLM.md`

## Forbidden scope (respected)

FoodPage mobile/layout convergence (ENV-MOBILE-008), Building, Safety,
shared Aura/AppShell/styles, unrelated refactors, carbon, RLS, reagent
trigger behavior (untouched — dormancy preserved and contract-tested),
real environmental writes, `.serena/**`, shared CURRENT-WORK/HANDOFF/ROADMAP.

## Reagent trigger hardening backlog (recorded, NOT implemented)

Dormant hazards in `food.fn_decrement_reagent` + `chemical.fn_recompute_balance`
to be resolved by a separate decision/WO before any UI/import path sets
`reagent_used`:

1. non-numeric `qty` casts via `(v_reagent->>'qty')::numeric` and aborts the
   whole `lab_test` INSERT with a cryptic error;
2. negative `qty` inserts an `out` movement with negative quantity — the
   balance recompute sums `out` as `-quantity`, so stock INCREASES;
3. master lookup failure (uncatalogued name) still inserts an orphan
   movement row with NULL `master_id` (counted by usage reports, ignored by
   balances);
4. no unit reconciliation against `chemical.master.unit`;
5. no idempotency/dedupe (`purpose` carries the lab_test id but has no
   UNIQUE constraint — duplicate inserts double-decrement);
6. silent skip (null name/qty) has no operator feedback path.

## Implementation evidence — 2026-09-02

- RED (focused `food.test.ts` + `tsc -b`, before implementation):
  - Vitest **14 failed / 5 passed** (clean assertion failures after one
    harness correction — two migration tests initially TypeError'd on null
    SQL and were guarded with `expect(sql).toBeTruthy()` so absence fails
    loudly): fabrication ×4 (missing/blank sample_type → น้ำประปา,
    missing/blank test_type → total_coliform), no test-type normalization
    or verified-label mapping ×2, arbitrary tokens accepted ×2, migration
    contract ×6 (absent). The 5 passes = canonical pass-through ×3,
    adapter-never-writes-reagent_used, required-date throw (already true).
  - TypeScript **TS2322** at the type-contract assertion — proving
    `FoodInput` still exposed `reagent_used` as writable.
- Implementation (smallest fail-closed repair):
  - `import-adapters/food.ts` — `mapSampleType()`/`mapTestType()`: blank →
    null; canonical sets; verified test-type display labels; anything else
    throws `ประเภทตัวอย่างไม่รองรับ…` / `การทดสอบไม่รองรับ…` before any REST
    write; adapter never writes `reagent_used`.
  - `lib/food.ts` — `FoodInput` now `Omit`s `reagent_used` (read-type and
    COLUMNS unchanged for display).
  - `pages/FoodPage.tsx` — semantic only: initial state no longer seeds
    `reagent_used`; the page note now states the trigger is dormant.
  - `supabase/migrations/20260902000000_food_core_001_canonical_categories.sql`
    — two idempotent CHECK constraints (DROP IF EXISTS + ADD revalidates →
    fails closed on dirty data; no backfill; trigger/chemical schema
    untouched — pinned by contract tests).
- GREEN: focused **19/19 PASS**; full Vitest **248/248 PASS** (19 files);
  standalone `tsc -b` PASS; lint **12 pre-existing warnings / 0 errors**;
  production build PASS; full Playwright **115/115 PASS** (`--workers=1
  --retries=0`); `git diff --check` PASS; changed-file scope audit PASS.
  Missing `VITE_SUPABASE_URL/ANON_KEY` in the fresh worktree was classified
  ENVIRONMENT_FAILURE (module-load guard) and resolved by process-only env
  from existing secure local config; values never printed.
- No real environmental data writes; no production migration apply; no
  RLS/carbon/shared-UI/other-domain changes; migration apply + read-only
  live verification remain with the merge owner post-merge (FUEL/GARBAGE
  pattern).

## Review gate

Status: `REVIEW_REQUESTED`. Implementation owner does NOT self-merge.
Independent reviewer must bind to the exact pushed PR head SHA; any head
change invalidates review. Required before merge: independent Standards +
Spec review, exact-head CI, remote-diff audit.

## One next safe action

GPT lead: resolve the reagent hardening backlog decision (activate-with-
hardening vs keep-dormant), independently review the exact PR head, require
exact-head CI, then merge via the authorized owner and apply/live-verify
the migration read-only (FUEL/GARBAGE post-merge pattern).
