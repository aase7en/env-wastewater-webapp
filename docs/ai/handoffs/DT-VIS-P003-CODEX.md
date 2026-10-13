# DT-VIS-P003-C1 — Handoff (claim checkpoint)

## Checkpoint 0 — Claim transition authored (2026-10-12)

- Claim `DT-VIS-P003-C1` (generation 1, CLAIMED) registered by this transition;
  authority begins only after the reviewed transition merges to main.
- Work Order: `docs/work-orders/DT-VIS-P003.md` (objective, owner split, exact
  mutable scope, binding board/master-plan constraints, dispatch-exception risk
  record, D1–D6 plan, acceptance, review plan).
- Owner split: Codex CLI GPT-6.1 Sol MAX implements the visual slice (Role B,
  owner directive 2026-10-12); GLM-5.3 MAX coordinates + authors RED-first
  Track-Z tests + integration battery; fresh GLM reviewer reviews the
  Codex-authored implementation (never author-and-approve).
- Next: after merge → create isolated worktree `env-dtvis-p003-20261012`
  (branch `feat/dt-vis-p003`) from the merged main → ownership gate → D1 data
  contracts → D2 RED tests → D3 gated: BLOCKED until the implementation model
  itself is admitted (gpt-6.1-sol entitlement clearing, one re-probe per
  materially changed fingerprint, or explicit owner authorization of an
  alternative implementation model; the recorded 2026-10-12 gpt-5.6-sol
  admission is R3-review-only). Park in registry status `BLOCKED` with the
  typed model-admission blocker; never dispatch an unadmitted implementer.

## Checkpoint 1 — D3 model authorization canonical (2026-10-13)

- PR #114 merged `8e30d52` (second parent = R3-APPROVED `96ebb7d`; verdict issuecomment-6135985226; 2-round GPT-5.6-Sol revalidation): `gpt-6-sol` @ `model_reasoning_effort=max` is the D3 implementation model (explicit owner authorization 2026-10-13; owner-side probe evidence recorded; NOT Astra; gpt-6.1-sol unprobed/unblocked-fingerprint; gpt-5.6-sol R3-review-only). Canonical owner fields updated everywhere.
- Implementation worktree fast-forwarded to `8e30d52`.
- Next: D1 (GLM data contracts) → D2 (GLM RED-first tests) → D3 dispatch (`codex exec -m gpt-6-sol -c model_reasoning_effort=max` with an implementation-appropriate sandbox/approval policy — NOT the read-only probe policy; single-writer window opens; skills-context noise is nonfatal and tracked separately).

## D1 — Callout/evidence data contracts pinned (2026-10-13)

Grounding (read from code): `TwinMetric<T>` already carries the truthful
semantics payload (value | source: manual-snapshot/sensor-telemetry/simulation/
unavailable | observedAt | provenance.acquisition | freshness); assets today =
one aeration tank (`asset:aeration-tank-1`, label ถังเติมอากาศ) with 5 metrics,
of which ONLY `tdsMgL` maps from `DashboardRow.tds_aeration`; DO deliberately
stays unavailable (plant-wide `do_average` ≠ asset observation); mode ∈
latest|live|historical|simulation; DashboardPage hosts Twin/Process tabpanels
with `TwinRendererBoundary` + Suspense + `TwinCanvas` and a DOM
`ProcessFlowDiagram` fallback; selection contract `onSelectAsset(assetId)`.

**Pinned contracts (no new inference — callouts derive EXCLUSIVELY from
`WastewaterTwinState.assets[*]`):**
1. `CalloutModel` = { assetId, assetLabel, metricKey, metricLabel(th),
   valueLabel, semanticBadge, detailDestination }. New module
   `frontend/src/components/digital-twin/p003/callout-model.ts` (+ test) —
   pure derivation, DOM-side.
2. Semantic badge truth table (exhaustive): source=sensor-telemetry ∧ mode=live
   → LIVE; source=manual-snapshot → LATEST (HISTORICAL when mode=historical);
   source=simulation → SIMULATED; source=unavailable → UNAVAILABLE;
   freshness=stale overrides display to STALE. Color secondary; text badge
   always (Thai label + EN token).
3. Evidence panel hierarchy per board: situation → action/attention →
   source/freshness/provenance (acquisition + observedAt/snapshotDate) →
   trend/history — asset-specific metrics show only their own observedAt; the
   14-day DO/pH/Cl table stays the only trend source (no per-metric trend
   fabrication).
4. Breakpoints: ≥1024 anchored callouts; 768–1023 split spatial/detail; <768
   recompose to ordered list + drawer/bottom-sheet (44px targets, Escape
   close, focus management, aria-live).
5. Callout list + evidence panel are DOM-first (outside Canvas) so WebGL
   failure/reduced-motion keeps full information parity.
6. Anchors: only `asset:aeration-tank-1` exists today; no connector lines; new
   assets join via the existing `TwinAssetId` map without contract change.

## D2 — RED-first test contract landed (2026-10-13)

- `frontend/src/components/digital-twin/p003/callout-model.test.ts` (10 tests):
  badge truth table (LIVE/LATEST/HISTORICAL/SIMULATED/STALE/UNAVAILABLE incl.
  stale-override + sensor-live + simulation-only-on-override), stable asset
  anchoring, UNAVAILABLE never numeric, Thai labels for all badges, detail
  destination per callout. RED verified: `Cannot find module './callout-model'`
  (vitest, 1 file failed — implementation module absent by design).
- `frontend/tests/e2e/dt-vis-p003.spec.ts` (7 tests): accessible callout list +
  truthful badges; evidence panel with source/freshness/provenance; Escape
  close + focus return; 44px targets; 390px mobile ordered recomposition with
  no canvas overlap; WebGL-failure DOM parity; zero connector elements. RED
  verified: 7/7 failed (Playwright chromium, synthetic VITE_SUPABASE_* env —
  elements absent pre-implementation).
- Next: D3 dispatch (`gpt-6-sol` @ max) — Codex becomes the temporary sole
  writer of ALL mutable files; GLM does not touch them until the recorded
  D3→D4 handoff entry.

## D3 → D4 — Codex implementation handoff (2026-10-13)

- Claim `DT-VIS-P003-C1`, branch `feat/dt-vis-p003`, worktree
  `A:/GitHub/_worktrees/env-dtvis-p003-20261012`; committed HEAD
  `32d27e31a66b911f3d2f4527c08361c9d1431b25`, fetched `origin/main`
  `8e30d52601115ca4173fdc2730ddcaf1432851f9`. D3 changes are left
  **uncommitted** in this worktree for GLM integration.
- **Ownership transfer:** the Codex D3 temporary sole-writer window ends at
  this entry. GLM-5.3 MAX may resume mutation of the claim's mutable scope
  for D4 integration. A fresh independent GLM context still owns D5 review;
  the implementation author does not approve or merge it.
- Implemented pure asset-only callout derivation, the D1 semantic badge table,
  DOM callout list and evidence panel, transient mapped-asset highlight,
  Escape/focus return, and responsive Dashboard Twin composition. The
  renderer boundary, Suspense, Process tab, and 14-day table remain in place.
  The board's P003 status line now records IMPLEMENTING/pending D4-D5.
- Evidence panel shows each metric's `observedAt`; a date-only
  `snapshotDate` is shown only for a present manual-snapshot metric. It does
  not derive asset DO from plant-wide `do_average` or invent asset trend data.
  The existing 14-day table is linked and explicitly described as a
  plant-wide overview, not a per-asset history.
- Verification: P003 Vitest **10/10 pass**; `dashboard-adapter.test.ts`
  **7/7 pass**; `npx tsc --noEmit` exit 0; P003 Playwright Chromium
  **7/7 pass** (dummy Supabase env, exit 0); existing Digital Twin + visual
  Playwright **11/11 pass**; `npm run lint` exit 0 (only pre-existing,
  unrelated warnings); `git diff --check` clean.
- D2 Playwright setup correction: the original spec visited anonymous `/`
  with the plain fixture, but the Twin tab is on authenticated `/dashboard`.
  Its original 7 RED failures therefore did not prove P003 behavior. D3
  changed only test setup: existing authenticated fixture, `/dashboard`, a
  synthetic session for the configured dummy project, and a mocked dashboard
  row. **No assertions were changed.** The final green run used a separately
  managed local Vite server (`E2E_BASE_URL=http://localhost:5173`); the first
  config-managed-server run passed all seven cases but hung during teardown
  on this Windows runner and was interrupted.
- Next: GLM D4 integration/full battery and exact-diff review preparation;
  preserve this worktree and claim scope. No commit or merge was made by D3.

## D4 — GLM integration battery GREEN (2026-10-13)

Ownership transferred back to GLM at the recorded D3→D4 entry. GLM-verified:
- `npx tsc --noEmit` clean; `npm run lint` (oxlint) 0 errors / 12 pre-existing warnings.
- `npx vitest run`: **26 files / 378 tests passed** (incl. new callout-model 10/10; required the standard fresh-worktree `cp .env.example .env` stub).
- Playwright chromium vs a ref-matching dev server (VITE_SUPABASE_URL=https://gllqtbyofrcjzmbnfoeh.supabase.co + dummy anon key, E2E_BASE_URL=localhost): **18/18 passed** — dt-vis-p003 7/7 + digital-twin + digital-twin-visual regressions all green.
- Environmental lesson (not a product defect): the authed fixture seeds `sb-<project-ref>-auth-token`; a dummy-host dev server yields a different storage key → login-page bounce. Twin e2e MUST run with a ref-matching VITE_SUPABASE_URL (secret-free dummy anon key suffices; no real credentials involved).
- Codex D3 deviation verified legitimate: dt-vis-p003.spec.ts switched to the authed fixture + ref-derived storage key + /dashboard route + v_dashboard_14day mock; ALL original assertions unchanged (diff-verified).
- Next: D5 fresh-GLM independent review at the pushed head; then expected-head merge, post-main CI/deploy/smoke.

## D5 + D6 — Review, merge, deploy, live-marker receipts (2026-10-13)

- **D5 (independent review)**: fresh-GLM reviewer (separate context; implementation
  authored by Codex `gpt-6-sol` — cross-model independence satisfied) returned
  **VERDICT: APPROVED at exact head `ae6e97af832fb5c86e9953164d34a2fd6dc027b7`**
  with all five adversarial dimensions PASS (truth table, a11y, Command-Center
  contract, responsive, scope) and 3 non-blocking P3 notes. Durable verdict:
  PR #115 issuecomment-6139798040.
- **Merge**: PR #115 expected-head merged as **`96b59fb`** (second parent =
  reviewed `ae6e97a`; ancestry verified via `git merge-base --is-ancestor`).
- **Exact-main CI**: `test` SUCCESS; `E2E smoke tests` SUCCESS; Pages deploy
  run `38357581371` SUCCESS at head `96b59fb`.
- **D6 live-marker verification (fresh check 2026-10-13, this closeout)**:
  deployed bundle `assets/index-wU0QHL8u.js` on the live Pages origin contains
  BOTH `p003-callout-list` and `p003-evidence-panel` test ids; `sw.js` serves
  `uth-env-v2`. Verified at closeout time from the live origin — not inferred
  from the deploy run alone.
- Worktree disposition: `env-dtvis-p003-20261012` preserved clean at `ae6e97a`
  (fully merged). Lane closed; scope lock released at generation 1.
