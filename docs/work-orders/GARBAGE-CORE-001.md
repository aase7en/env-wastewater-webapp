# GARBAGE-CORE-001 — canonical waste classification and carbon data honesty

Status: CLAIMED
Owner: GLM-5.3 MAX (Core Engineering / Track Z)
Lead / review / merge owner: GPT-5.6 Sol
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-garbage-core-001`
Branch: `fix/garbage-core-001`
Base: `origin/main@196d023b9f2f2b3bfb1837ad2ad1bd6d713fde84`
Exact HEAD: `PENDING_CHECKPOINT` until activation commit is frozen
Handoff: `docs/ai/HANDOFF.md` + temporary external packet while active
Last updated: 2026-08-31

## Goal

Make Garbage classification truthful and single-directional before any Garbage visual/mobile expansion:

- `segregation_type` is the canonical write/classification field.
- `waste_type` remains legacy read compatibility only.
- Bulk Import never fabricates missing type into `general`.
- Unsupported non-empty types fail before REST write.
- Carbon uses canonical classification and never treats chemical/unknown/missing as general.
- Existing real data is never guessed/backfilled to make the system look complete.

## Source reality / Grill With Docs — 2026-08-31

Authoritative evidence:

- `20260719000006_mod_columns.sql` states: `waste_type` is kept for backwards compatibility and `segregation_type` is canonical going forward.
- A-Wiki garbage knowledge defines four categories: `general`, `infectious`, `recyclable`, `chemical`, with Thai labels `ทั่วไป`, `ติดเชื้อ`, `รีไซเคิล`, `เคมี`.
- `GarbagePage.tsx` currently initializes `waste_type="ทั่วไป"` while `segregation_type="general"` and later writes both.
- Garbage import currently writes only `segregation_type`, but missing values silently become `general` and arbitrary text is accepted.
- Latest carbon rollup still branches on legacy `waste_type` and falls all non-infectious/non-recyclable values, including `chemical` and unknown, to the general-waste factor.
- Emission factors currently exist for general, infectious and recyclable garbage. There is no verified garbage-chemical factor.
- Read-only production query returned no rows / no classification pairs in `garbage.collection_log` (`legacy_only=0`, `canonical_only=0`, `disagree=0`). Therefore no production backfill or cleanup is authorized or needed in this WO.

## Settled data contract

Canonical values:

- `general`
- `infectious`
- `recyclable`
- `chemical`

Import normalization:

- trim + case-normalize the four canonical English tokens;
- map only the verified Thai labels:
  - `ทั่วไป` → `general`
  - `ติดเชื้อ` → `infectious`
  - `รีไซเคิล` → `recyclable`
  - `เคมี` → `chemical`
- blank/missing → `null`;
- any other non-empty token → row error before REST write.

Write/read compatibility:

- new application writes use `segregation_type` only;
- `GarbageInput` must not expose legacy `waste_type` as a writable field;
- `GarbageLog.waste_type` may remain for legacy read/display fallback;
- do not auto-copy/synchronize canonical data into legacy `waste_type`.

Database:

- add an idempotent constraint enforcing `segregation_type IS NULL OR segregation_type IN ('general','infectious','recyclable','chemical')`;
- do not modify historical migrations;
- do not backfill/update/delete real rows;
- migration must fail closed if unexpected existing data would violate the constraint.

Carbon:

- use `segregation_type`, not legacy `waste_type`;
- `general` → `kg (general_waste)`;
- `infectious` → `kg (infectious_waste)`;
- `recyclable` → `kg (recyclable)`;
- `chemical`, `NULL`, or unsupported → no matching factor / `kg_co2e = NULL` (`UNAVAILABLE`), never general;
- source labeling must not call missing classification `waste_general`;
- preserve every non-Garbage union branch and all emission-factor rows/values unchanged.

## Model-fit evidence — 2026-08-31

GLM-5.3 MAX is selected for this Core/data-contract lane, not as a universal ranking.

- Z.ai official GLM-5.3 release (2026-08-14) reports strong long-horizon coding/terminal performance, including Terminal Bench 3.0 28.3, DeepSWE v1.1 66.9, and CyberGym 84.5.
  - https://z.ai/blog/glm-5.3
- Artificial Analysis currently reports GLM-5.3 (max) Intelligence Index 60, 1M context, and ~66.5 output tokens/s; useful independent evidence with the limitation that it is slower/verbose relative to some peers.
  - https://artificialanalysis.ai/models/glm-5-3/

Task mapping: bounded TypeScript + SQL contract repair, regression-first tests, long-context repo archaeology, and data-honesty reasoning fit GLM's demonstrated strengths. GPT remains independent exact-SHA reviewer/merge owner.

## Mutable scope

Implementation may change only:

- `frontend/src/lib/import-adapters/garbage.ts`
- `frontend/src/lib/import-adapters/garbage.test.ts` (new)
- `frontend/src/lib/garbage.ts`
- semantic-only Garbage write wiring in `frontend/src/pages/GarbagePage.tsx` (no layout/style redesign)
- one additive `GARBAGE-CORE-001` migration under `supabase/migrations/`
- `docs/work-orders/GARBAGE-CORE-001.md`
- `docs/ai/CURRENT-WORK.md`
- `docs/ai/HANDOFF.md`
- bounded `docs/ai/DEFECT-MEMORY.md` entry after the defect is verified/fixed

## Forbidden scope

- responsive/mobile/visual/className/layout redesign;
- manifest/compliance feature expansion;
- emission-factor values or new guessed chemical factor;
- historical migration rewrite;
- production data backfill/cleanup/reclassification;
- RLS/auth/PHI/shared shell/other ENV modules;
- GitHub workflows/packages/dependencies;
- `.serena/**`;
- secrets/tokens;
- MIG-WA legacy CSV migration (still separate; real export not supplied).

## RED / baseline evidence required before fix

Create deterministic regressions that fail against the activation base for at least:

1. missing/blank import must be null, not `general`;
2. canonical English values normalize correctly;
3. verified Thai category labels normalize to canonical English;
4. unsupported non-empty tokens throw through the adapter row-error path;
5. additive migration/constraint does not yet exist;
6. migration carbon branch must use canonical `segregation_type`, not `waste_type`;
7. chemical/missing/unknown must not fall through to general factor;
8. migration must not mutate emission-factor data or application data;
9. non-Garbage carbon branches remain equivalent to the current merged view.

If a test cannot genuinely demonstrate RED, record a truthful source/baseline proof instead of manufacturing a fake failure.

## Implementation rules

- smallest fail-closed repair only;
- do not broaden Garbage UI scope;
- preserve history read compatibility;
- no real environmental writes in tests;
- no production migration apply by implementation owner;
- if verified source reality contradicts this contract, stop at `DECISION_REQUIRED` rather than inventing semantics.

## Verification

At minimum:

- focused Garbage adapter/migration tests;
- full Vitest;
- `npx tsc -b`;
- lint with no new warnings/errors;
- build;
- `git diff --check`;
- actual changed-file/scope review;
- focused browser/Bulk Import payload check if practical using intercepted/mocked REST and zero real writes;
- exact-head GitHub checks/E2E as applicable after push/PR.

Post-merge/live verification remains GPT-owned:

- verify reviewed head ancestry/current main;
- apply only the merged additive migration using the supported Management API path;
- read-only verify live constraint/view definition and full rollup scan;
- no environmental data insert/update/delete.

## Acceptance

- One canonical write field: `segregation_type`.
- Legacy `waste_type` is no longer written by new UI/import flows.
- Missing/unknown classification is never fabricated into general.
- Only verified categories/Thai labels normalize.
- Invalid non-empty import fails before write.
- Database rejects unsupported canonical values.
- Carbon consumes canonical classification.
- Chemical/missing classification returns unavailable carbon rather than a false general factor.
- No factor value, RLS, unrelated UI/domain, or real production row is changed.
- Full applicable verification passes.
- Implementation stops at `REVIEW_REQUESTED`; GLM does not merge.

## One next safe action

GLM-5.3 MAX reads repo SSoT + this WO, verifies actual git/ownership state, establishes RED/baseline evidence, implements the smallest bounded repair, runs verification, updates SSoT/defect memory, pushes/opens PR, writes the result to the external packet, and stops at `REVIEW_REQUESTED`.
