# ENV-CMD-002 — Hospital Overview Command-Center Vertical Slice

Status: REVIEW_REQUESTED
Owner / implementer: GPT-5.6 Sol via Serena visual lane
Independent review owner: fresh exact-SHA reviewer
Parent: `ENV-CMD-001` canonical composition contract
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\\GitHub\\envww-cmd-002`
Branch: `feat/env-cmd-002-overview`
Activation base: `origin/main@51d742104b96ba9a86e218f6b49850ab5115c3b8`
Date: 2026-09-02

## Goal

Incrementally upgrade the authenticated `/` Overview into the first truthful Hospital Environmental Command Center slice without changing data contracts, navigation architecture, Building/repair semantics, or the GLM-owned Environmental Intelligence provenance core.

The slice must help an operator answer in order:

1. what situation is known from current internal data;
2. what requires attention;
3. what date/period and trust limitation applies;
4. where to drill down for process/evidence/action.

## Dependencies / concurrency

- `ENV-CMD-001` is CLOSED / MERGED / POST-MERGE VERIFIED.
- GLM-5.3 MAX owns `frontend/src/lib/env-int/**` in `ENV-INT-PROVENANCE-001`; this WO must not touch or import unfinished GLM files.
- Building/repair remains `DECISION_REQUIRED` (C1 vs C2); this WO must not expose automatic Building repair semantics.
- Existing Overview/Dashboard routes and analytics/Aura components are production foundations to reuse.

## Mutable scope

- `frontend/src/pages/OverviewPage.tsx`
- `frontend/tests/e2e/overview-command-center.spec.ts` (new)
- `docs/work-orders/ENV-CMD-002.md`
- `docs/ai/handoffs/ENV-CMD-002-SOL.md` (new)

Global SSoT remains read-only until implementation reaches a durable review checkpoint.

## Forbidden / read-only scope

- `frontend/src/lib/env-int/**`
- Building/repair page/lib/components/migrations
- `frontend/src/lib/overview.ts`
- `frontend/src/lib/supabase-queries.ts`
- `frontend/src/components/analytics/**`
- `frontend/src/components/digital-twin/**`
- `frontend/src/lib/twin/**`
- `frontend/src/App.tsx`
- AppShell / ModuleDock / shared Aura tokens/primitives
- Supabase schema/RLS/migrations
- external provider integration
- `.serena/**`
- real hospital/environmental data

## Settled behavior

### Situation cards

Use only existing internal Overview values. Never invent provider/freshness metadata.

Wastewater:

- primary metric remains `DO เฉลี่ยล่าสุด` from the current derived `do_average` field;
- status wording must be explicitly tied to the **latest record**, e.g. `บันทึกล่าสุด: ปกติ/ผิดปกติ`, never bare current-normal wording;
- display the actual latest record date when available;
- do not relabel `do_average` as Aeration DO or live sensor data.

Energy:

- current public overview value is monthly `kwh_total`;
- `days` is SQL `count(*)`, so UI must not call it unique `วันที่บันทึก`; describe it as record count if shown;
- show month/period, not fake freshness/provider.

Carbon:

- current public overview value is monthly `tco2e` with calendar-previous-month MoM only when available;
- show month/period;
- no provider/source/current claim because current Overview contract does not expose that metadata.

### Attention lane

- show actionable wastewater attention only when the latest row carries existing abnormal/alert state;
- no global `all systems normal` claim;
- missing/error/unknown source state is not an operational incident by itself.

### Spatial/process anchor

- provide an explicit lightweight `Digital Twin / Process` entry to `/dashboard`;
- do not import/mount a second `TwinCanvas`, R3F Canvas, or WebGL context on `/`;
- critical text remains DOM-accessible.

### Domain entries

Expose real route entries for at least:

- Waste / Garbage → `/garbage`
- Fuel → `/fuel`
- Water Supply → `/water-supply`
- Safety → `/safety`

These are route entries, not fake KPI cards. Do not invent status/values for them.

### Supporting actions

Preserve real wastewater actions:

- `/form`
- `/readings`
- `/trends`
- `/reports`

They remain below situation/action/spatial context on mobile.

## Responsive acceptance

At 360 / 390 / 430:

- one-column operational hierarchy;
- no required document-level horizontal scroll;
- situation first, then attention, then Twin/Process entry, then domain/supporting links;
- all important links/actions >=44 px;
- no critical hover-only state;
- no clipped status/date/period text.

At 768:

- first-class touch layout with useful 2-column composition where readable.

At 1024 / 1440:

- coordinated high-density command-center composition without merely stretching cards;
- no extra Twin runtime in Overview.

## RED / baseline contract

Before production edits, focused Playwright must prove the old Overview fails the new contract while preserving already-good invariants.

Expected REDs include:

1. latest wastewater normal status is bare `ปกติ` instead of explicitly latest-record scoped;
2. Energy count is labeled `N วันที่บันทึก` although SQL is `count(*)` rows;
3. no explicit Digital Twin / Process entry panel exists;
4. no command-center domain entry group for Garbage/Fuel/Water Supply/Safety;
5. no panel-local date/period/trust context sufficient for the new hierarchy.

Expected already-green invariants may include auth gate, real routes, no Overview canvas, and no document overflow.

## Focused E2E requirements

Use fake staff auth + synthetic mocked REST only. No real writes.

Test at minimum:

- truthful wastewater latest-record status/date wording;
- Energy row-count wording and explicit month period;
- Carbon month period + MoM only when real previous calendar month exists;
- attention lane appears only for existing abnormal/alert state;
- Digital Twin / Process entry points to `/dashboard` and Overview has no `<canvas>`;
- Garbage/Fuel/Water Supply/Safety entries use existing routes without fake KPI/status;
- supporting quick actions remain reachable;
- 360/390/430 no document overflow and important targets >=44 px;
- keyboard reaches primary drill-down/action links;
- independent source error does not erase unrelated panels.

## Verification

Before review:

- truthful RED evidence;
- focused `overview-command-center.spec.ts`, `--workers=1 --retries=0`;
- TypeScript;
- full Vitest;
- lint baseline or better;
- production build;
- full Playwright if practical / exact-head CI otherwise remains release authority;
- inspect build output so Overview did not pull Twin runtime into its eager page path;
- `git diff --check` + changed-file/forbidden-scope audit;
- exact-SHA Standards + Spec/UX/Data-honesty review.

## Implementation evidence — 2026-09-02

- Truthful RED baseline: focused `overview-command-center.spec.ts` = **9 failed** before production edits.
- Root causes covered: missing command-center zones, unscoped latest wastewater condition, Carbon `days` mislabeled as recorded days, no attention lane, no lightweight Twin/Process anchor, no domain-entry group, source-failure isolation/keyboard hierarchy absent.
- First reruns that still showed 9 failures were classified correctly as test-environment failures: local Playwright reused another worktree's Vite `:5173`, then the fresh worktree lacked process-level Vite Supabase env. No application verdict was taken from those runs.
- Worktree-specific Vite `:5174` + process-only secure local `VITE_SUPABASE_URL` / publishable anon key produced focused **9/9 PASS**, `workers=1`, `retries=0`.
- Phone acceptance passed at **360 / 390 / 430** with command-center hierarchy, no document/body overflow and >=44px marked actions.
- TypeScript `tsc -b`: PASS.
- Full Vitest: **19 files / 248 tests PASS**.
- Lint: **12 pre-existing warnings / 0 errors**; no new lint error.
- Production build: PASS, 3305 modules. `TwinCanvas` remains a separate lazy chunk (~913 kB raw) and Overview does not mount a Canvas.
- `git diff --check`: PASS.
- A full local Playwright attempt was interrupted by connector HTTP 502 before a result was returned; classified `TOOL/TRANSPORT_FAILURE`. Exact-head GitHub E2E/CI is therefore the release authority for the full suite.
- No real hospital/environmental writes; focused browser tests use fake staff auth + mocked REST.

## Stop condition

Stop at `REVIEW_REQUESTED` after exact pushed SHA, actual remote diff, deterministic evidence and independent review request. Implementer does not self-merge.
