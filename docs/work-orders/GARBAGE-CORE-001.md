# GARBAGE-CORE-001 — canonical waste classification and carbon data honesty

Status: CLOSED
Owner: GLM-5.3 MAX (Core Engineering / Track Z)
Lead / review / merge owner: GPT-5.6 Sol
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-garbage-core-001`
Branch: `fix/garbage-core-001`
Base: `origin/main@196d023b9f2f2b3bfb1837ad2ad1bd6d713fde84`
Reviewed exact SHA: `f7d9c82c6d583da01861f06374ac2b0b1c55ccf0` (frozen PR head; any later head would require re-review)
Handoff: `docs/ai/HANDOFF.md` + temporary external packet while active
Last updated: 2026-08-31

## Implementation evidence — 2026-08-31

- RED (focused `garbage.test.ts` + `tsc -b`, before implementation):
  - Vitest **13 failed / 2 passed** — `expected 'general' to be null` ×2 (missing/blank fabricated to general); `expected 'General' to be 'general'` + `expected 'ทั่วไป' to be 'general'` (no normalization / no verified Thai mapping); `token: hazardous … to throw` (arbitrary token accepted); migration contract ×8 (no canonical migration existed). The 2 passes = canonical English accept + adapter never writes `waste_type` (already true).
  - TypeScript **TS2322** at the type-contract assertion — proving `GarbageInput` still exposed legacy `waste_type` as writable (UI write path: `GarbagePage.tsx` initial `waste_type:"ทั่วไป"` + Select writing both fields — static defect, fixed by the type change).
- Implementation (smallest fail-closed repair):
  - `import-adapters/garbage.ts` — `mapSegregationType()`: blank/missing → `null`; trim/case normalization of the 4 canonical English tokens; ONLY the 4 verified Thai labels (A-Wiki garbage page) mapped; anything else non-empty throws `ประเภทขยะไม่รองรับ…` before any REST write. Never writes legacy `waste_type`.
  - `lib/garbage.ts` — `GarbageInput` now `Omit`s `waste_type` (legacy column stays readable in `GarbageLog`/COLUMNS for display fallback; no auto-copy into legacy).
  - `pages/GarbagePage.tsx` — semantic wiring only: initial state no longer seeds `waste_type`; the Select writes `segregation_type` only. No layout/style change.
  - `supabase/migrations/20260831000000_garbage_core_001_canonical_classification.sql` — (A) idempotent CHECK `segregation_type IS NULL OR IN ('general','infectious','recyclable','chemical')` (DROP IF EXISTS + ADD revalidates → fails closed on dirty data; no backfill); (B) `CREATE OR REPLACE VIEW carbon.v_unified_co2e` waste branch now reads canonical `c.segregation_type` with explicit general/infectious/recyclable factor mapping and **ELSE NULL** — chemical/missing/unsupported match no factor (`kg_co2e NULL` = UNAVAILABLE), never general; missing labels `waste_unclassified`; every non-Garbage branch (incl. the merged FUEL-CORE-001 fuel join) reproduced verbatim; no emission-factor data touched.
- Test-harness note: migration contract strips `--` comments before asserting (executable SQL only); the ALTER TABLE assertion pins the constraint pair to `garbage.collection_log` exclusively.
- GREEN gates: focused **15/15 PASS**; full Vitest **229/229 PASS** (18 files); standalone `tsc -b` PASS (type contract now GREEN — `waste_type` unwritable); lint **12 pre-existing warnings / 0 errors** (no new); production build PASS (existing chunk-size advisory only); `git diff --check` PASS.
- Browser/Bulk-Import E2E deferred: a new e2e spec file is outside this WO's mutable scope; adapter rejection + payload shape are proven at unit/type level through the same `mapRow` throw path Bulk Import renders, and the UI write path is enforced by the compiler.
- No real environmental data, no real REST writes, no production migration apply, no RLS/factor/other-domain changes.

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

## Closeout evidence — 2026-08-31

- GPT-5.6 Sol independently reviewed and APPROVED exact implementation SHA `f7d9c82c6d583da01861f06374ac2b0b1c55ccf0` after actual remote diff/scope review, focused **15/15**, full Vitest **229/229**, `tsc -b`, lint **12 pre-existing warnings / 0 errors**, build, and `git diff --check` all passed.
- Independent migration comparison proved all four non-Garbage `carbon.v_unified_co2e` branches remained byte-equivalent to current main; only the Garbage branch changed, now using canonical `segregation_type` and never `c.waste_type`.
- PR #61 merged with expected-head protection as `a2b7823a09d85bd8e116a37e654d05fdd3b8c012`; reviewed-head ancestry verified.
- Exact-main CI/CD: test `33342456911`, E2E smoke `33342456910`, and Pages deploy `33342456899` — all SUCCESS.
- Reviewed migration Git blob `c24cb9f3875448c1a2b61d08b7bee7cdca1ac0f6` matched current main. Fresh current-main Management API probe passed; migration apply returned **3/3 OK**.
- Live read-only verification: canonical CHECK exists/validated and contains the four allowed values; carbon view uses canonical `segregation_type`, legacy `waste_type` is absent, unclassified semantics are present, chemical/NULL match no waste factor, and both `carbon.v_unified_co2e` + `public.v_unified_co2e` full scans pass.
- `garbage.collection_log` remained empty throughout; no environmental row insert/update/delete/backfill occurred. Temporary `.env`/`.venv` artifacts created by the live gate were removed.
- External GLM packet is eligible for `INGESTED_TO_SSOT -> ARCHIVED/CLEARED` after this closeout reaches main.

## One next safe action

Activate the bounded Garbage responsive/mobile UI slice from current `origin/main`; preserve the verified canonical `segregation_type` contract and keep schema/factor/RLS semantics out of the visual lane unless new evidence requires a separate Core decision.
