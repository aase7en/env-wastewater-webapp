# ENV-INT-PROVENANCE-001 — Environmental Intelligence provenance/freshness/availability core

Status: RE-REVIEW_REQUESTED (R2 remediation of the 2026-09-02 GPT MAX CHANGES_REQUIRED review; fresh exact-SHA review requested)
Owner / implementer: GLM-5.3 MAX (Core Engineering / Track Z)
Lead / review / merge owner: GPT-5.6 Sol
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-env-int-provenance-001`
Branch: `feat/env-int-provenance-001`
Base: `origin/main@436dbe77095cdc9c8e205ba5438a3850392d3c7c`
Design source: `A-Wiki/inbox/ENV-GLM53-ENV-INT-SOURCE-CONTRACT-001.md` §8 (provenance envelope), §10 (failure/outage states), §11 (sanitized fixtures), §12 (contract-test plan)
Lane handoff: `docs/ai/handoffs/ENV-INT-PROVENANCE-001-GLM.md`
Last updated: 2026-09-02

## R2 remediation evidence — 2026-09-02

Closes every blocking finding from the GPT MAX exact-SHA review of head
`2415607f0572ec1a04aa0237078562dff439f1d1` (base `51d7421`):

- **F1 — stale is freshness, not availability:** `stale` removed from
  `EnvIntAvailability`; new `EnvIntFreshness = current | stale | unknown` +
  `classifyFreshness({ageMs, staleBeyondMs})` per canonical CMD-001 §5.1/§5.2.
  Old-but-valid data now classifies `ready` availability + `stale` freshness.
  Type-level RED (tsc TS2322 on `Extract<EnvIntAvailability,"stale">`) → GREEN.
- **F2 — loading reachable:** explicit `loading` input in
  `EnvIntAvailabilityInput`; ordered machine `license_blocked > error >
  schema_mismatch > loading > unavailable(target) > empty > unavailable(unknown
  age) > ready` — known failures outrank the pending flag. RED:
  `classifyAvailability({loading:true})` returned `"unavailable"`.
- **F3 — unavailable never carries a value:** builder throws on
  `data_class:"unavailable"` + non-null value (explicit `0` equally rejected);
  guard also rejects such envelopes. RED: built silently at the reviewed head.
- **F4 — guard hardening:** `isEnvIntObservation` now validates non-empty
  provider/source_product/source_method; string source_url/unit/license;
  `value` finite-number-or-null (rejects `"18.4"`, NaN, ±Infinity, objects,
  arrays, booleans); timezone membership via `isEnvIntZone` (Asia/Bangkok
  only); geo object + level enum + number/null id + ±90/±180 finite lat/lng +
  string/null label; every Date valid (never Invalid Date); string-or-null
  class fields; and all class invariants including forecast-without-
  observed_at and unavailable-value-null.
- **F5 — parser fail-closed:** strict anchored regex + explicit range
  validation (month 1–12, day valid-for-month incl. leap rules, hour ≤23,
  minute/second ≤59, suffix `Z|±HH:MM|±HHMM` with hours ≤23) + constructed-
  Date validity check. Month 00/13, day 00, Feb 31, invalid leap day, hour
  24/25, minute 60, second 60, trailing junk, malformed offset (`+99:99`
  previously parsed silently), and naive-with-suffix all throw. Genuine leap
  day (2024-02-29) and compact/valid offsets still parse; unreliable-suffix
  semantics (interpret wall clock as ICT, ignore suffix) preserved — no
  double shift.
- **Review non-blocking note closed:** `freshWithinMs` removed from the input
  contract (unused dead field; freshness needs only the verified
  `staleBeyondMs` policy).
- **RED evidence (round 1, before any production edit):** focused
  **13 failed / 26 passed** — one granular failure per finding area (F1
  availability-side, F2, F3, F4 ×7, F5 ×3) + tsc TS2322 on the stale-union
  type contract. `classifyFreshness` tests were authored together with its
  implementation because the export did not exist at the reviewed head; the
  F1 RED evidence is the availability-side test plus the type contract.
- **Main reconciliation:** merged current `origin/main@6c36ebe` (carbon PR
  #76 + CMD-002 closeout — file-disjoint from env-int) cleanly; no conflicts;
  no out-of-scope file touched.
- **GREEN gates (post-merge integrated state):** focused **47/47 PASS**; full
  Vitest **315/315 PASS** (non-secret dummy Supabase env); `tsc -b` PASS;
  oxlint **12 pre-existing warnings / 0 errors**; production build PASS;
  `git diff --check` PASS. No provider adapters, no network, no UI, no
  schema/RLS, no real environmental writes.

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
- Availability states (R2, canonical CMD-001 §5.1): `loading | ready | empty
  | unavailable | error | schema_mismatch | license_blocked` — `stale` is NOT
  an availability state (old-but-valid data stays available); `schema_mismatch`
  / `license_blocked` are env-int's domain-level reasons explicitly permitted
  by the canonical contract. Ordered classifier (license_blocked > error >
  schema_mismatch > loading > unavailable(target) > empty > unavailable(unknown
  age) > ready); `loading` is reachable via the explicit `loading` input;
  can NEVER emit 0/NORMAL/SAFE/LIVE, and no state fabricates a value.
- Freshness dimension (R2, canonical CMD-001 §5.2): `current | stale |
  unknown` via `classifyFreshness({ageMs, staleBeyondMs})` — `current`
  requires BOTH a data time and a verified cadence policy; boundary age ==
  threshold is still current (stale is strictly beyond); negative age (future
  forecast valid time) is legitimate lead time, never clamped.
- Time: only `Asia/Bangkok` (sole verified zone) — `parseWallClockAs`
  (unreliable-Z-as-ICT, the verified GISTDA trap) and `parseNaiveLocal`
  (HII-style); unparseable input throws, never guesses. R2: impossible
  wall clocks (month 00/13, day 00, Feb 31, invalid leap days, hour 24+,
  minute/second 60), trailing junk, malformed offsets, and naive strings
  carrying a zone designator all THROW — never Invalid Date, never silently
  normalized.
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
