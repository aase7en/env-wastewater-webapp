# ENV-MOBILE-006 — Garbage Mobile Convergence

Status: REVIEW_REQUESTED
Owner / implementer: GPT-5.6 Sol via Serena (Visual Engineering fallback)
Independent review owner: external GLM-5.3 MAX or fresh independent reviewer after implementation stops
Parent roadmap: `ENV-MOBILE-002+` Domain form convergence
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-mobile-006-garbage`
Branch: `feat/env-mobile-006-garbage`
Base: `origin/main@b165a7209a4fa2a14f2471e3b0cdf36f9a806e25`
Exact HEAD: resolve from actual pushed branch/PR head at review time; review is invalidated by any head change
Last updated: 2026-08-31

## Goal

Make the existing Garbage collection workflow practical and accessible on 360–430 px phones while preserving the now-verified `GARBAGE-CORE-001` canonical classification contract, Supabase payload/query semantics, history compatibility, and useful tablet/desktop density.

## Routing rationale

The repo default prefers Codex for Track F visual work, but this chat harness cannot directly invoke Codex or the Browser plugin. To avoid turning the user into a prompt/result courier, GPT-5.6 Sol owns this bounded page-local implementation through Serena + repo Playwright. External GLM may be used later as read-only exact-SHA Standards/Spec reviewer; it does not own visual implementation. This is an availability-driven override, not a permanent routing rule.

Browser plugin status: **not available in this session**. Per frontend-testing-debugging guidance, use the repository Playwright path and record that fallback explicitly. Do not claim Browser-plugin screenshots/DOM evidence.

## Source-reality audit — 2026-08-31

- Route: `/garbage`; page: `frontend/src/pages/GarbagePage.tsx`.
- `GARBAGE-CORE-001` is CLOSED/MERGED/LIVE VERIFIED. `segregation_type` is the sole canonical classification write field; legacy `waste_type` is read fallback only.
- Current form uses `grid grid-cols-2 md:grid-cols-4`, so phone widths receive two dense controls per row.
- Nine visible controls (date, type, weight, disposal route, contractor, vehicle plate, manifest, destination, note) currently lack stable page-local ID + `Field htmlFor` associations.
- Delete is a plain text button; phone touch-target size is unproven and likely below the project 44 px minimum.
- History is a raw table. Measure actual local/document containment before adding a wrapper; do not assume overflow.
- No dedicated Garbage mobile Playwright spec exists.
- `segregation_type` values/options and null semantics are Core contract and READ-ONLY here.
- `waste_type`, import adapter, DB CHECK, carbon rollup, factors, RLS, schema, manifest/compliance semantics and shared UI primitives are out of scope.

## Mutable scope

May edit only:

- `frontend/src/pages/GarbagePage.tsx`
- `frontend/tests/e2e/garbage-mobile.spec.ts` (new)
- this work order
- `docs/ai/handoffs/ENV-MOBILE-006-SOL.md`
- bounded status/claim/closure entries in `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`, `docs/ai/ROADMAP.md`, `docs/ai/graph/PROJECT-GRAPH.md`

## Forbidden scope

- `frontend/src/lib/garbage.ts`
- `frontend/src/lib/import-adapters/garbage.ts` and its tests
- Supabase migrations/schema/RLS/carbon/factors
- `segregation_type`/`waste_type` semantics
- manifest/compliance feature expansion
- shared Input/Button/UI primitives/AppShell/ModuleDock/styles
- other ENV pages/domains or Digital Twin
- dependencies/workflows
- `.serena/**`
- real environmental writes/data

## Mobile contract — 360–430 px

1. Primary Garbage controls render one control per row at phone width; useful density returns at larger breakpoints.
2. No settled document-level horizontal overflow.
3. History remains contained. Add local horizontal scrolling only if baseline proves it is needed; if added, it must be named/focusable/keyboard-reachable.
4. Save/delete targets used in the workflow meet the project 44 px touch minimum.
5. All nine visible controls have stable page-local IDs and programmatic label associations.
6. Keyboard users can traverse controls and activate Save without pointer-only behavior.
7. A deterministic mocked save failure preserves entered values; retry sends the same complete canonical `GarbageInput` payload and succeeds.
8. Blank required date must fail locally, make zero POSTs, expose a persistent associated error and focus recovery before retry.
9. Pixel-class touch emulation completes a representative synthetic save path with `segregation_type` only; no legacy `waste_type` appears in the request body.

## Tablet / desktop contract

- Preserve useful multi-column density at 768 and 1024 px.
- History remains readable and actions reachable.
- Do not degrade desktop density to solve phone layout.

## Baseline / RED plan

Before production page edit, add the smallest focused Playwright spec and measure against the unchanged page:

- 360 px first/second control x-axis delta;
- semantic label association count;
- delete target dimensions;
- document + history-card containment with representative synthetic history;
- 1024 px multi-column density;
- current blank-date behavior and POST count;
- save-error/retry value + payload stability where the current page permits deterministic proof.

Record already-green conditions honestly; do not manufacture RED.

## Verification

- focused `garbage-mobile.spec.ts`, retries 0, worker 1;
- representative Pixel/touch context;
- keyboard/focus path;
- save failure/retry exact-body equality and canonical payload assertion;
- required-date zero-POST/error/focus path;
- 360/390/430/768/1024 layout evidence;
- full Vitest;
- standalone `tsc -b`;
- lint (no new warnings/errors);
- production build;
- full Playwright;
- `git diff --check` + actual changed-file/scope review;
- screenshots outside the repo when practical through Playwright fallback.

If a data/query/schema/carbon/import defect appears, stop that subproblem and route it to a separate Core WO. Do not broaden this visual slice.

## Stop condition

Implementation stops at `REVIEW_REQUESTED` with exact pushed SHA, remote diff, focused/full verification, known limitations, and one next safe action. Implementer does not self-merge.

## One next safe action

Freeze the activation docs checkpoint, establish focused Garbage mobile RED/baseline against unchanged production page, then implement only the smallest page-local responsive/accessibility/touch repair.

## Baseline / implementation evidence — 2026-09-01

Activation fixed point: `02eb11828a2326048e2c04f008cb7293aac43855`.

Deterministic baseline against the unchanged page:

- 360 px first/second control x-delta: **154 px** — RED versus one phone column.
- Programmatic label associations: **0/9** — RED.
- Delete target: **19.125 × 24.797 CSS px** — RED versus 44 px minimum.
- Blank required date: **1 POST**, no persistent associated error, no focus recovery — RED.
- 1024 px first/second control x-delta: **235 px** — PASS; preserve desktop density.
- Initial history/document containment with the baseline row: PASS; no wrapper was added by assumption.

Implementation is bounded to `GarbagePage.tsx` plus the focused Playwright spec. It adds one-column phone composition with larger-screen density restoration, stable IDs/labels for all nine controls, local required-date validation/error/focus recovery, and a 44 px Delete target while preserving canonical `segregation_type` write semantics. The 44 px Delete repair then exposed a new history-card containment regression with the representative focused-spec row; a named/focusable local horizontal-scroll region with ArrowRight reachability was added as the smallest regression repair.

GREEN evidence:

- focused `garbage-mobile.spec.ts`: **9/9 PASS**, retries 0, worker 1;
- Pixel-class touch save: PASS;
- save failure/retry preserves entered values and sends equal complete canonical request bodies; `waste_type` absent;
- blank date: zero POST + persistent associated error + focus recovery;
- 360/390/430/768/1024 coverage;
- full Vitest: **229/229 PASS**;
- standalone TypeScript: PASS;
- lint: **12 pre-existing warnings / 0 errors**;
- production build: PASS;
- full Playwright: **105/105 PASS**;
- `git diff --check`: PASS.

Fresh-worktree failures caused by missing `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` were classified as `ENVIRONMENT_FAILURE`; verification was rerun with process-only values loaded from existing secure local configuration without copying or printing secrets. Worker 502/timeouts were classified as `TRANSPORT_FAILURE`; artifact/process inspection confirmed full Playwright completed passed and left no port-5173 listener.

No Garbage data/import/schema/RLS/carbon/factor/shared-shell semantics changed. No real environmental writes were used.

## Review gate

Status: `REVIEW_REQUESTED`.

The implementer must freeze/push the branch, then an independent reviewer must resolve the actual remote branch/PR head SHA and review Standards + Spec/UX against that exact SHA. Any head change invalidates the review and requires re-review. The implementation owner does not self-merge.

## One next safe action

Freeze/push the verified implementation checkpoint and perform independent exact-SHA review before PR merge readiness.
