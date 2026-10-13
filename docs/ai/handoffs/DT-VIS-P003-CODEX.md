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
