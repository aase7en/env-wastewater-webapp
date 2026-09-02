# ENV-INT-PROVENANCE-001 — Environmental Intelligence provenance/freshness/availability core

Status: REVIEW_REQUESTED
Owner / implementer: GLM-5.3 MAX (Core Engineering / Track Z)
Lead / review / merge owner: GPT-5.6 Sol
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-env-int-provenance-001`
Branch: `feat/env-int-provenance-001`
Base: `origin/main@436dbe77095cdc9c8e205ba5438a3850392d3c7c`
Design source: `A-Wiki/inbox/ENV-GLM53-ENV-INT-SOURCE-CONTRACT-001.md` §8 (provenance envelope), §10 (failure/outage states), §11 (sanitized fixtures), §12 (contract-test plan)
Lane handoff: `docs/ai/handoffs/ENV-INT-PROVENANCE-001-GLM.md`
Last updated: 2026-09-02

## Goal

Deliver the provider-agnostic Environmental Intelligence core — provenance
envelope, wall-clock time parsing, freshness computation, and the ordered
availability state machine — as pure, deterministic, network-free library
code with contract tests, BEFORE any provider adapter (GISTDA/TMD/HII) is
implemented. This is the ENV-INT source-contract campaign's recommended
first WO ("PROVENANCE → GISTDA → HII → TMD").

## Non-goals / forbidden scope (respected)

- No provider-specific code: no fetch, no URLs outside test fixtures, no
  provider imports in modules (provider names appear ONLY inside test
  fixtures as provenance documentation).
- No ENV page/route/UI wiring; no shared components/AppShell/styles.
- No Building lane or Command Center (ENV-CMD-*) files — zero overlap.
- No heat-index or flood-threshold logic of any kind (RESEARCH_REQUIRED per
  source-contract packet; not fabricatable).
- No DB/schema/RLS/carbon changes; no real environmental data; `.serena/**`
  untouched; no shared SSoT edits (coordinator owns reconciliation).

## Mutable scope (actual)

- `frontend/src/lib/env-int/core/time.ts` (new)
- `frontend/src/lib/env-int/core/provenance.ts` (new)
- `frontend/src/lib/env-int/core/freshness.ts` (new)
- `frontend/src/lib/env-int/core/env-int-core.test.ts` (new)
- this work order + lane handoff

## Settled contract (from source-contract packet §8/§10/§12)

- Data classes: `observed | forecast | derived | simulated | unavailable`,
  mutually exclusive; builders enforce: observed→observed_at required;
  forecast→observed_at forbidden + valid_at/issued_at/forecast_horizon
  required; derived→aggregation_window required; simulated→simulation_ref
  required.
- Availability states: `loading | ready | empty | stale | unavailable |
  error | schema_mismatch | license_blocked`; ordered classifier
  (license_blocked > error > schema_mismatch > unavailable(target) >
  empty > unavailable(unknown age) > stale > ready) can NEVER emit
  0/NORMAL/SAFE/LIVE, and no state fabricates a value.
- Time: only `Asia/Bangkok` (sole verified zone) — `parseWallClockAs`
  (unreliable-Z-as-ICT, the verified GISTDA trap) and `parseNaiveLocal`
  (HII-style); unparseable input throws, never guesses.
- Freshness: age = now − (observed_at ?? valid_at ?? issued_at) — NEVER
  received_at/cache age; unknown age = null, never 0.
- Units preserved verbatim (`"ug/m3"`, `"m_msl"`, ...) — the core never
  converts; negative values (real −0.81 m MSL observed) must survive.
- `formatProvenanceLine` renders provider · product · method · truthful
  class label · DATA time (never received_at).

## RED / GREEN evidence — 2026-09-02

- RED (before implementation): focused suite fails to load — `Cannot find
  module './provenance'` (all 24 tests blocked by module absence), plus
  `tsc -b` failing on the then-nonexistent imports. One test-authoring bug
  was found and fixed pre-implementation (schema-drift fixture originally
  kept the `unit` key via spread — corrected to a true field-removal drift;
  the corrected fixture still failed RED via module absence).
- GREEN (final state): focused **24/24 PASS**; full Vitest **272/272 PASS**
  (20 files); standalone `tsc -b` PASS (after typing the shared test fixture
  with `satisfies`); lint **12 pre-existing warnings / 0 errors**; production
  build PASS; full Playwright **124/124 PASS** (`--workers=1 --retries=0`);
  `git diff --check` PASS; changed-file scope audit PASS (only
  `frontend/src/lib/env-int/**` + this WO + handoff).
- One mid-loop defect, reproduced and root-caused (REPRODUCE→CLASSIFY→ROOT
  CAUSE→REPAIR→RE-TEST): "computes forecast age from valid_at" failed with
  −7,200,000 vs +7,200,000 — the TEST expectation had the sign inverted
  (implementation uniformly returns now − data-time; a future valid time
  correctly yields negative lead time). Expectation corrected with an
  explicit discriminating assertion (issued_at would give +3,600,000) —
  the test's power was preserved, not weakened; suite then 24/24.
- Missing `VITE_SUPABASE_*` in the fresh worktree for full-suite runs is the
  known module-load ENVIRONMENT_FAILURE; runs used process-only env from the
  existing secure local config; secrets never printed; Playwright REST fully
  mocked — no real writes.

## Review gate

Status: `REVIEW_REQUESTED`. Implementation owner does NOT self-merge.
Independent reviewer must bind to the exact pushed PR head; any head change
invalidates review. Required before merge: independent Standards + Spec
review, exact-head CI, remote-diff audit.

## One next safe action

GPT lead: independent exact-SHA review of this PR, then (after merge)
activate `ENV-INT-GISTDA-001`, consuming this core per the source-contract
packet ordering (PROVENANCE → GISTDA → HII → TMD).
