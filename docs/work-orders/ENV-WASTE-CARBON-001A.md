# ENV-WASTE-CARBON-001A — Waste/Plastic/Carbon/T-VER Core Readiness + carbon-rollup data honesty

Status: REVIEW_REQUESTED (implementation complete; awaiting independent GPT MAX exact-SHA review)
Owner: GLM-5.3 MAX (Core Engineering)
Lead / review / merge owner: GPT MAX (independent exact-SHA review; GLM does not merge)
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-waste-carbon-core-001a`
Branch: `fix/env-waste-carbon-core-001a`
Base: `origin/main@64f9f89cec1e0abe6b81d50a9bc6f26ecc500098`
Task-specific handoff: `docs/ai/handoffs/ENV-WASTE-CARBON-001A-GLM.md`
Last updated: 2026-09-02

This is the Core/Data prerequisite sub-lane of roadmap node `ENV-WASTE-CARBON-001`
(Waste / Plastics / Carbon / T-VER). It does NOT implement that visual slice and
does NOT close the parent node.

## Implementation evidence — 2026-09-02

- **RED (before implementation):** focused `carbon-rollup.test.ts` **17 failed / 3 passed** — all new shaping contracts failed (`hasUnavailableContribution`/`unavailableSources`/`has_unavailable` undefined, `byScope` missing empty scopes, migration file absent → all 9 static SQL contract tests failed); the 3 passes pinned already-correct behavior (R10 duplicate aggregation, CRB-2 day-1 cutoff, hook export presence). TypeScript RED: `tsc -b` failed with **TS2459** (EXPECTED_SOURCES unexported), **TS2339 ×13** (missing contract properties), **TS2322** (null fixtures vs `kg_co2e: number`), and **TS2322 ×2** on the `live`/`realtimeConnected` type-contract assertions.
- **Test-harness defect found and fixed during the loop (honesty note):** the fixture helper initially used `partial.kg_co2e ?? 0`, coercing deliberate NULL fixtures into 0 — R3/R7/R8 stayed red against the NEW implementation until the helper defaulted only on `undefined`. The failure of those tests against both old and new code proves they detect unavailable-ness rather than passing vacuously.
- **Implementation (smallest fail-closed repair):**
  - `frontend/src/lib/carbon-rollup.ts` — `RollupRow.kg_co2e: number | null`; scope totals sum non-NULL rows only (known subtotals) with `has_unavailable`; `byScope` always represents Scopes 1–3 so the existing "ยังไม่มีข้อมูล" branch is reachable; `RollupSummary.unavailableSources` (sorted, seen-in-window with ≥1 NULL row) + `hasUnavailableContribution`; `EXPECTED_SOURCES` exported with documented factor-backed semantics; `useCarbonRollupRealtime` returns `realtimeConnected` (was `live`), doc comments state transport-not-measurement semantics. Zero reference updates needed — the hook has no consumers.
  - `supabase/migrations/20260902000000_waste_carbon_core_001a_rollup_honesty.sql` — idempotent `CREATE OR REPLACE VIEW carbon.v_unified_co2e`: electricity branch `COALESCE(SUM(r.consumption), 0) * ef.kg_co2e` + `WHERE r.consumption IS NOT NULL`; all 5 branches `LEFT JOIN LATERAL (… ORDER BY ef0.effective_from DESC LIMIT 1)` deterministic latest-effective factor (no fan-out); fuel label `COALESCE(d.fuel_type, 'fuel_unclassified')`; GARBAGE-CORE-001 waste semantics and FUEL-CORE-001 enum-side-to-text join preserved; no INSERT/UPDATE/DELETE/ALTER (asserted by S6).
  - `frontend/src/pages/CarbonRollupPage.tsx` — NULL kg renders `—` (never `"0.000"`); known-subtotal warning listing unavailableSources on the grand-total card; per-scope `has_unavailable` marker. Text-only, existing classes, no layout change.
- **GREEN gates:** focused **20/20 PASS**; full Vitest **268/268 PASS** (20 files, non-secret dummy Supabase env — matches repo-established practice); `tsc -b` PASS (all type contracts GREEN); oxlint **12 pre-existing warnings / 0 errors** (no new); production build PASS (existing chunk-size advisory only); `git diff --check` PASS.
- **Live-number equivalence argument (reviewer note):** with the current single-electricity-factor, all-NULL-free 907-row data, the new view produces bit-identical numbers to the old one (LATERAL LIMIT 1 selects the same single matching factor; the electricity WHERE only removes rows that contributed nothing to SUM); the repair changes contract behavior only for states that do not exist in production today.
- **Browser/E2E not run:** no route/navigation/interaction change; `modules.spec.ts` only asserts the `/carbon-rollup` link exists; truthfulness text is covered by the unit contracts. Noted for the reviewer rather than adding Playwright surface to justify it.
- **No real environmental data writes, no production migration apply, no RLS/factor/other-domain changes.**

## Goal

Answer, with repository evidence, "what carbon/waste/plastic/T-VER information is
actually supported by the repository and database, and which aggregation
contracts are safe enough for a later visual slice to consume" — and repair the
deterministic data-honesty defects in the carbon rollup contract so that
UNKNOWN / UNAVAILABLE can never silently become ZERO.

## Current verified reality — 2026-09-02 (recovered from current `origin/main`, not chat memory)

### Requirement-gate answers (A–K)

- **A. Carbon source families that actually exist (5):** electricity
  (`carbon.reading`), fuel (`fuel.dispense_log`), garden fuel
  (`garden.work_round`), waste (`garbage.collection_log`), chemical
  (`chemical.movement`). All 5 are UNION branches of `carbon.v_unified_co2e`.
- **B. Families actually contributing rows today (1):** electricity only —
  907 rows. `fuel.dispense_log`, `garbage.collection_log`, `garden.work_round`,
  `chemical.movement` are all 0 rows (`reports/schema-snapshot-live.md`,
  2026-08-03 introspection; `garbage.collection_log` re-verified empty by
  GARBAGE-CORE-001 closeout on 2026-08-31).
- **C. Valid emission factors (12 seeded rows):** electricity/kWh 0.4999
  (TGO 2023, effective 2023-01-01); diesel/L 10.21; gasoline/L 8.91; lpg/kg
  2.99; other/kg (general_waste) 0.524; other/kg (infectious_waste) 3.30;
  other/kg (recyclable) 0.0; other/km (waste_transport) 3.27; other/kg (chlorine)
  1.80; other/kg (alum) 0.45; other/kg (kmno4) 5.20; other/kg (reagent_disposal)
  2.50. UNIQUE (source, unit, effective_from).
- **D. Rows-but-no-applicable-factor classes (contract level):** waste
  `chemical`/missing/unsupported classification → factor unit CASE yields NULL →
  `kg_co2e NULL` (GARBAGE-CORE-001, correct); fuel `lpg` rows → view joins
  `ef.unit = 'L'` but the only lpg factor is unit `kg` → no match → NULL
  (fail-closed unit mismatch, honest but permanently unavailable — recorded,
  NOT changed: adding an L-unit lpg factor would be inventing factor data);
  fuel rows with unknown/legacy `fuel_type` text → no match → NULL
  (FUEL-CORE-001); chemical names not matching chlorine/alum/kmno4 →
  `kg (reagent_disposal)` fallback (intentional, pre-existing designed
  catch-all, authority recorded in the factor note).
- **E. Families with no data:** fuel, garden, waste, chemical (0 rows each).
- **F. Genuinely unsupported:** plastic (see below), T-VER (see below), and
  waste transport distance (a `km (waste_transport)` factor exists but no table
  records transport distance — nothing consumes it).
- **G. Plastic contract: ABSENT.** No canonical plastic category, mass field,
  unit, factor, or carbon mapping exists anywhere in schema, migrations, or
  frontend (`grep -ri plastic` across `frontend/src`, `supabase`, work orders →
  zero hits). `waste_recyclable` is NOT plastic and must never be relabeled or
  re-derived as plastic.
- **H. T-VER contract: NOT CONTRACTED.** No T-VER project identity,
  methodology, eligibility, baseline, monitoring period, MRV evidence,
  validation/verification, registration, issuance, credits, or retirement model
  exists anywhere in the repository. Generic CO2e reduction data must never be
  presented as T-VER eligibility/credits.
- **I. Current "incomplete" meaning:** `EXPECTED_SOURCES` labels not seen among
  returned rows in the 12-month window — pure label presence. A source with
  rows whose factor is unavailable still counts as "seen" (looks complete).
- **J. Confirmed UNKNOWN/UNAVAILABLE → ZERO collapses:**
  1. SQL electricity branch: `COALESCE(SUM(r.consumption) * ef.kg_co2e, 0)`
     converts missing-factor months to 0 kg (migration
     `20260831000000_garbage_core_001_canonical_classification.sql` line — the
     live view definition, reproduced from `20260719000002` / `20260830000000`).
  2. TypeScript shaping: `RollupRow.kg_co2e: number` plus
     `cur.total_kg_co2e += Number(r.kg_co2e)` — `Number(null) === 0` — silently
     adds unknown contributions as zero into scope totals and `grandTotalKg`
     (`frontend/src/lib/carbon-rollup.ts:21,75,89`).
  3. Page display: `Number(r.kg_co2e).toFixed(3)` renders NULL as `"0.000"`
     (`frontend/src/pages/CarbonRollupPage.tsx:68`).
- **K. Realtime/"live" semantics:** `useCarbonRollupRealtime()` returns a
  boolean named `live` set from Supabase subscription status
  (`setLive(status === "SUBSCRIBED")`). Verified zero production consumers
  import the hook (only its own definition file), so nothing currently
  displays it — but the exported name/comment invite relabeling monthly
  aggregates as "live environmental data". Transport connectivity must be named
  transport connectivity.

### Additional deterministic defects found during archaeology

- **Factor fan-out / no latest-effective selection (all 5 branches):** each
  branch LEFT JOINs `carbon.emission_factor` with only
  `effective_from <= month`. Two applicable factor rows (different
  `effective_from`, allowed by the UNIQUE constraint) fan the join out — every
  affected month appears TWICE with different kg values and the TS layer sums
  both (double counting). This is a live landmine because the electricity
  factor note explicitly expects annual TGO updates: inserting a newer
  electricity factor (the documented update path) would immediately double-count
  all months from its effective date. Current 12-row data has no duplicates, so
  today's numbers are unaffected — the defect is the contract, not current
  values.
- **Fuel branch NULL source label:** `d.fuel_type::text AS source` with no
  `fuel_type IS NOT NULL` filter — a fuel row with litres but missing fuel_type
  appears in the view with source `NULL` (and NULL kg). Should carry an explicit
  `fuel_unclassified` label, mirroring the GARBAGE-CORE-001
  `waste_unclassified` precedent.
- **Dead `has_data: false` path / missing scope cards:** `byScope` only contains
  scopes that have rows, so Scope 1 and Scope 3 cards are absent from the page
  entirely (they have 0 rows today) rather than showing the existing
  "ยังไม่มีข้อมูล" branch written for exactly that case.
- **Adjacent findings recorded, NOT repaired here (out of bounded scope):**
  `carbon.v_overview_carbon` hardcodes the 0.4999 literal (third copy besides
  `emission_factor` row and `carbon.ts` constant) instead of reading the factor
  table — owned by the Overview/CMD lane; `EXPECTED_SOURCES` label set predates
  GARBAGE-CORE canonical labels (kept as the factor-backed expected set by this
  contract, see below).

## Settled Core contract

### View (`carbon.v_unified_co2e`, new migration, CREATE OR REPLACE only)

1. **Electricity branch honesty:** drop the product-level
   `COALESCE(SUM(r.consumption) * ef.kg_co2e, 0)`; use
   `COALESCE(SUM(r.consumption), 0) * ef.kg_co2e` (factor missing → NULL) and
   add `WHERE r.consumption IS NOT NULL` (activity-quantity-missing rows are
   excluded exactly like every other branch's `WHERE … IS NOT NULL`;
   row_count = rows with activity quantity).
2. **Deterministic latest-effective factor in every branch:** replace each
   `LEFT JOIN carbon.emission_factor ef ON …` with
   `LEFT JOIN LATERAL (SELECT kg_co2e FROM carbon.emission_factor WHERE …
   ORDER BY effective_from DESC LIMIT 1) ef ON true` — at most one factor row
   per source row; boundary stays month-granularity
   (`effective_from <= date_trunc('month', …)`); with current single-factor
   data the numeric output is bit-identical.
3. **Fuel label honesty:** `COALESCE(d.fuel_type, 'fuel_unclassified')::text AS
   source`; missing fuel_type still matches no factor (NULL comparison) →
   `kg_co2e NULL`.
4. **Everything else preserved:** waste branch canonical `segregation_type`
   semantics (ELSE NULL → unavailable; `waste_unclassified` label), chemical
   branch reagent fallback, garden branch, RLS/grants/facade behavior
   (`public.v_unified_co2e` is a pass-through and needs no change), and all
   emission-factor rows/values untouched (no INSERT/UPDATE/DELETE/ALTER in the
   migration).

### TypeScript shaping (`frontend/src/lib/carbon-rollup.ts`)

- `RollupRow.kg_co2e: number | null` (view can legitimately produce NULL).
- `ScopeSummary.total_kg_co2e` = **known subtotal** (sum of non-NULL rows only)
  + `has_unavailable: boolean` (any NULL-kg row in scope).
- `RollupSummary.grandTotalKg` = **known total** (sum of known subtotals), plus
  `unavailableSources: string[]` (every source label seen in-window with ≥1
  NULL-kg row) and `hasUnavailableContribution: boolean`. A grand total with an
  unavailable contributor is never presented as a complete total.
- `incompleteSources` keeps its meaning (expected factor-backed sources with no
  rows in window) — distinct from unavailable. `waste_unclassified`,
  `waste_chemical`, `fuel_unclassified` are deliberately NOT added to
  `EXPECTED_SOURCES`: they are states, not factor-backed targets.
- `byScope` always represents Scopes 1–3 (`has_data: false` when no rows) so
  the existing "ยังไม่มีข้อมูล" UI branch becomes reachable.
- `useCarbonRollupRealtime()` returns `realtimeConnected` (was `live`); zero
  reference updates needed (no consumers); doc comments describe transport
  state, never live environmental measurement.

### Page (`frontend/src/pages/CarbonRollupPage.tsx`) — minimal truthfulness only

- NULL kg renders `—` (unavailable), never `"0.000"`.
- When `hasUnavailableContribution`, the grand-total card shows an explicit
  known-subtotal warning listing `unavailableSources`; scope cards show a
  has_unavailable marker. Text-only, existing classes, no layout/visual
  redesign, no new E2E surface.

### Plastic / T-VER representation

- `PLASTIC_DATA = ABSENT` and `TVER_STATUS = NOT CONTRACTED` are recorded as
  durable facts in this work order and the handoff. The later
  ENV-WASTE-CARBON-001 visual slice must render them as unavailable /
  not-yet-contracted. No synthetic plastic values, no T-VER eligibility,
  credits, or placeholders are created by this lane.

## Dependencies

- Base is current `origin/main@64f9f89` (ENV-CMD-002 closed; PR #74).
- `frontend/src/lib/env-int/**` remains GLM-owned by paused
  ENV-INT-PROVENANCE-001 (CHANGES_REQUIRED) — no-touch here.
- Building/Repair remains DECISION_REQUIRED — no-touch.

## Mutable scope

- `frontend/src/lib/carbon-rollup.ts`
- `frontend/src/lib/carbon-rollup.test.ts` (new)
- `frontend/src/pages/CarbonRollupPage.tsx` (semantic truthfulness only)
- one additive migration `supabase/migrations/20260902000000_waste_carbon_core_001a_rollup_honesty.sql`
- `docs/work-orders/ENV-WASTE-CARBON-001A.md` (this file)
- `docs/ai/handoffs/ENV-WASTE-CARBON-001A-GLM.md` (new)
- bounded `docs/ai/DEFECT-MEMORY.md` entry after the fix is verified

Global SSoT (`docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`) is intentionally
NOT edited in this lane while another agent owns paused state there; the lead
reconciles at review/merge time.

## No-touch scope

`frontend/src/lib/env-int/**`, `frontend/src/pages/OverviewPage.tsx`,
`frontend/tests/e2e/overview-command-center.spec.ts`, ENV-CMD implementation
files, `frontend/src/components/digital-twin/**`, `frontend/src/lib/twin/**`,
`frontend/src/pages/DashboardPage.tsx`, `frontend/src/App.tsx`, AppShell,
ModuleDock, shared Aura tokens/components, `BuildingPage.tsx`,
`frontend/src/lib/building.ts`, `frontend/src/lib/repair.ts`,
RepairRequestModal, Building/Repair migrations, Building work-order decision
packet, external provider adapters, GISTDA/TMD/HII integration, `.serena/**`,
historical migrations, GitHub workflows/packages/dependencies, secrets,
`data/raw/**`, `.env`.

## RED matrix (deterministic, synthetic fixtures only)

TS shaping (`carbon-rollup.test.ts`, mocked supabase client):

- R1 valid rows → correct known totals/scope sums/source_count;
- R2 explicit zero kg with data → legitimate zero, NOT unavailable/incomplete;
- R3/R17 NULL kg → excluded from totals (never `Number(null)`=0), source in
  `unavailableSources`, `hasUnavailableContribution` true, scope
  `has_unavailable` true;
- R4/R9 no rows → all three scopes present with `has_data:false`,
  `incompleteSources` = full expected set, no unavailable fabrication;
- R7 source with rows but all-NULL kg → unavailable (not "complete");
- R8 known subtotal + unavailable contributor → completeness stays explicit;
- R10 duplicate month rows → aggregated correctly, source_count deduped;
- R11/R12 pinned at SQL level (latest-effective factor; unit mismatch stays
  no-match);
- R13/R14 realtime transport naming: hook result type exposes
  `realtimeConnected`, NOT `live` (type-contract test);
- R18 `incompleteSources`/`unavailableSources`/`source_count` reflect contract
  truth, not mere label presence.

Static SQL view contract (same test file, repo-established pattern from
FUEL-CORE/GARBAGE-CORE):

- S1 migration exists + `CREATE OR REPLACE VIEW carbon.v_unified_co2e` idempotent;
- S2 electricity branch contains NO `COALESCE(SUM(r.consumption) * ef.kg_co2e, 0)`
  and HAS `WHERE r.consumption IS NOT NULL`;
- S3 exactly 5 `LEFT JOIN LATERAL` factor selectors, each
  `ORDER BY effective_from DESC LIMIT 1`;
- S4 fuel label `COALESCE(d.fuel_type, 'fuel_unclassified')`, no bare
  `d.fuel_type::text AS source`;
- S5 waste branch canonical semantics preserved (segregation_type, ELSE NULL,
  unclassified label; no `c.waste_type`);
- S6 no INSERT/UPDATE/DELETE/ALTER statements (no data/factor mutation);
- S7 fuel factor join stays enum-side-to-text (no free-text→enum cast).

R15/R16 (Plastic absent, T-VER not contracted) are inventory facts recorded
above; no code path exists that could fabricate them, and the regression is the
recorded contract itself plus the absence assertions documented in this WO.

## Migration decision

Bug lives in BOTH the SQL view (electricity COALESCE, fan-out, fuel label) and
TypeScript shaping — one additive idempotent `CREATE OR REPLACE VIEW`
migration + TS repair. No backfill, no environmental row mutation, no factor
insertion/update, RLS/grants/view-security behavior preserved,
`public.v_unified_co2e` facade unaffected (pass-through). Rollback = reapply
the previous view definition (`20260831000000`); reapply strategy = rerun
migration (idempotent).

**Production migration application is NOT authorized for the implementation
owner.** The lead applies it post-merge via the supported Management API path
and live-verifies read-only.

## Verification plan

Focused new suite → full Vitest → `tsc -b` (type contract RED→GREEN included)
→ oxlint (no new warnings) → production build → `git diff --check` →
changed-file audit → forbidden-scope audit. Browser/E2E not required (no
route/navigation/behavioral UI change beyond truthfulness text; existing
`modules.spec.ts` only asserts the route link, unaffected) — noted for the
reviewer rather than adding Playwright surface to justify it.

## Stop conditions

Stop at `REVIEW_REQUESTED` with exact pushed SHA. Escalate
`DECISION_REQUIRED`/`HUMAN_ACTION_REQUIRED` if verified source reality
contradicts this contract.
