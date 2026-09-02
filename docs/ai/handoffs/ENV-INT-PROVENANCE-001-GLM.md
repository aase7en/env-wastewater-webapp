# ENV-INT-PROVENANCE-001 — Implementation / Review Handoff (GLM lane)

Status: REVIEW_REQUESTED
Date: 2026-09-02
Repo: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-env-int-provenance-001`
Branch: `feat/env-int-provenance-001`
Base: `origin/main@436dbe77095cdc9c8e205ba5438a3850392d3c7c` (verified current main; #68 Food-mobile + #69 closeout already merged)
Implementation checkpoint: frozen below after push — review binds to the actual pushed PR head; any head change invalidates review.
Owner: GLM-5.3 MAX (Core Engineering / Track Z). Review/merge owner: GPT-5.6 Sol. Implementer does not self-merge.

## Objective

Provider-agnostic Environmental Intelligence core (provenance envelope,
wall-clock time parsing, freshness, ordered availability state machine) with
deterministic contract tests — the first WO of the source-contract campaign
ordering (PROVENANCE → GISTDA → HII → TMD). Design: A-Wiki inbox packet
`ENV-GLM53-ENV-INT-SOURCE-CONTRACT-001.md` §8/§10/§11/§12.

## Files changed (complete list)

- `frontend/src/lib/env-int/core/time.ts` (new) — `parseWallClockAs`
  (unreliable-Z-as-ICT), `parseNaiveLocal` (naive local), zone locked to the
  sole verified zone "Asia/Bangkok"; unparseable input throws.
- `frontend/src/lib/env-int/core/provenance.ts` (new) — `EnvIntObservation`
  envelope + data-class-enforcing builder `envIntObservation`, structural
  guard `isEnvIntObservation` (schema-drift detection), `formatProvenanceLine`
  (renders DATA time, never received_at).
- `frontend/src/lib/env-int/core/freshness.ts` (new) — `computeFreshnessAge`
  (from observed_at ?? valid_at ?? issued_at; null when unknown, never 0) and
  `classifyAvailability` ordered state machine (license_blocked > error >
  schema_mismatch > unavailable > empty > unavailable(unknown age) > stale >
  ready; can never emit 0/NORMAL/SAFE/LIVE).
- `frontend/src/lib/env-int/core/env-int-core.test.ts` (new, 24 tests) —
  contract tests over the packet's sanitized fixtures (GISTDA 24h/Pred3
  Uthai, HII 471583 + stale 471584 + negative MSL, forecast lead time,
  schema-drift fixture).
- `docs/work-orders/ENV-INT-PROVENANCE-001.md`, this handoff.

No provider imports, no fetch/network code, no UI/pages/routes, no Building
or Command-Center files, no DB/schema/RLS/carbon, no shared SSoT, no
`.serena/**`.

## RED evidence (before implementation)

- Focused suite: `Cannot find module './provenance'` — all 24 tests blocked
  (module-absence RED); standalone `tsc -b` failing on missing imports.
- Pre-implementation harness correction (before any implementation existed):
  the schema-drift fixture originally kept the `unit` key via object spread
  and would not truly drift; corrected to a field-removal drift so the guard
  test is real. RED still held via module absence.

## GREEN evidence (final state, exact commit content)

- Focused `env-int-core.test.ts`: **24/24 PASS**; full Vitest: **272/272
  PASS** (20 files); standalone `tsc -b`: PASS; lint: **12 pre-existing
  warnings / 0 errors**; production build: PASS; full Playwright: **124/124
  PASS** (`--workers=1 --retries=0`); `git diff --check`: PASS; scope audit:
  PASS — `git status` shows only `frontend/src/lib/env-int/` + the two docs.
- Mid-loop defect record (REPRODUCE→CLASSIFY→ROOT CAUSE→REPAIR→RE-TEST):
  forecast-age test failed −7,200,000 vs +7,200,000 → TEST expectation sign
  error (implementation uniformly = now − data time; future valid time =
  negative lead time, correct); expectation corrected WITH a second
  discriminating assertion (issued_at would give +3,600,000) — test power
  preserved. Implementation unchanged. Suite 24/24 after repair.
- Environment classification: fresh-worktree missing `VITE_SUPABASE_*`
  (module-load guard) = ENVIRONMENT_FAILURE; resolved process-only from the
  existing secure local config; never printed; all Playwright REST mocked —
  no real environmental writes.

## Data-honesty guarantees (tested)

- unknown ≠ zero / normal / a real category / a value; empty ≠ 0;
  stale keeps its real timestamp and age; unknown age is null, never 0.
- observed ≠ forecast ≠ derived ≠ simulated (builder-enforced); forecast
  valid time ≠ issued time; received_at ≠ observed_at (never rendered as
  data time); 24h average ≠ current value (both representable, distinct).
- Units verbatim; negative MSL survives; only "Asia/Bangkok" (the single
  verified zone) is accepted — new zones require new source evidence.
- No heat-index and no flood-threshold code exists anywhere in the core
  (both RESEARCH_REQUIRED per source-contract packet; not fabricatable).

## Self-review verdicts (implementer, 2026-09-02)

- **Standards review: PASS.** Fresh worktree from verified `origin/main@436dbe7`;
  scope exactly `frontend/src/lib/env-int/**` + 2 lane docs; RED-first honored;
  deterministic pure-unit tests (no network); no secrets; no real writes;
  lint baseline; migration-safety N/A (no DB); no shared SSoT edits;
  `.serena/**` untouched; regression adequacy 24 contract tests incl. the
  packet's §12 essentials.
- **Spec review: PASS.** Provider-agnostic (no provider code, only packet
  fixture names inside tests); no provider-specific live integration;
  envelope/time/freshness/availability behaviors satisfy the §8/§10/§12
  design (details above); no overlap with Building or Command Center lanes;
  no fabricated environmental data anywhere.
- Independent GPT review remains the merge gate.

## Remote PR / CI (frozen 2026-09-02)

- Implementation checkpoint SHA: `baaeb2c25449e5c9bab20a90663253e63fe4cb7a` (6 files, exactly the WO scope, +1014 lines)
- PR: https://github.com/aase7en/env-wastewater-webapp/pull/72 (OPEN, base `main`, MERGEABLE at freeze)
- Remote diff audited: file list identical to the local diff — only `frontend/src/lib/env-int/core/**` + the two lane docs; no `.serena/**`, no shared SSoT/UI, no Building/Command-Center files
- This docs-only freeze commit follows the checkpoint; independent review binds to the actual PR head at review time (any head change invalidates review)
- Exact-head CI: observe on the PR at review time; reviewer must require checks green on the latest head before merge

## Decisions / blockers

- None for this slice. Stale-threshold VALUES (freshWithinMs/staleBeyondMs
  numbers per provider) are adapter-level inputs intentionally left to the
  provider WOs (source-contract packet D5) — the core takes them as
  parameters, so no product decision blocks this core.

## One next safe action

GPT lead: independent exact-SHA Standards + Spec review of this PR; after
merge, activate `ENV-INT-GISTDA-001` consuming this core.
