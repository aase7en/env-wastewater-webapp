# DT-VIS-P003 — Spatial Status Callouts + Evidence Panel (Work Order)

Claim: `DT-VIS-P003-C1` (generation 1) · Status at activation: CLAIMED
Authoring lane: GLM-5.3 MAX (claim coordination + Track-Z tests) · Implementation owner: **Codex CLI GPT-6.1 Sol MAX** (Track F visual, owner directive 2026-10-12 Role B)
Base main at transition authoring: `1c91af4591f549741c1a8295f7fd180d9865bc87`

## Objective

Activate the user-approved (2026-09-10) DT-VIS-P003 design target from
`docs/ai/digital-twin/03-MICRO-STEP-BOARD.md`: evolve the existing DOM operational
panel hierarchy around the Digital Twin into **anchored Spatial Status Callouts +
an accessible Evidence Panel + a responsive operational hierarchy** — without
replacing the Twin with a card dashboard and without creating a second competing
dashboard architecture.

## Authority

- User-approved P003 design target (2026-09-10) recorded on the micro-step board
  and in `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md` (anchored callouts /
  evidence panel sections).
- Owner continuation steer (2026-10-12): continue the ENV Roadmap on non-Building
  lanes; Building Gate 2 deferred (PR #111 issuecomment-6127497707).
- Owner routing directive (2026-10-12): Codex CLI GPT-6.1 Sol MAX may implement
  bounded difficult tasks directly (Role B) under its five conditions; GLM-5.3 MAX
  remains the main engine for coordination/tests; independence floors unchanged.

## Owner split

- **Codex CLI GPT-6.1 Sol MAX** (dispatched from the canonical session; admission
  verified once per materially changed admission fingerprint — see the risk
  record below; never author-and-approve): visual implementation — callout
  components, spatial anchoring, evidence panel composition, responsive
  recomposition, reduced-motion/WebGL-fallback presentation.
- **GLM-5.3 MAX**: claim coordination; Track-Z data plumbing contracts
  (callout source identifiers, evidence queries via existing truthful adapters);
  RED-first test authoring (unit + Playwright + fallback/a11y); integration
  battery; independent review of the Codex-authored implementation (fresh GLM
  context satisfies cross-model independence).
- **Per-file ownership boundary (single-writer rule):** during D3 the Codex
  dispatch is the TEMPORARY SOLE writer of every mutable file — including shared
  `DashboardPage.tsx`; GLM (and any other agent) touches no mutable file during
  D3. Ownership of all mutable files transfers back to GLM at the recorded
  D3→D4 handoff entry in `docs/ai/handoffs/DT-VIS-P003-CODEX.md`, which states
  the transfer explicitly; before that entry exists, DashboardPage.tsx has
  exactly one writer (Codex) and no competing owner.

## Scope (mutable, exactly — identical to the registry claim entry)

- `frontend/src/components/digital-twin/TwinCanvas.tsx`
- `frontend/src/components/digital-twin/TwinRendererBoundary.tsx`
- `frontend/src/components/digital-twin/WastewaterTwin.tsx`
- `frontend/src/components/digital-twin/p003/**` (new callout/evidence components confined to this subfolder)
- `frontend/src/lib/twin/dashboard-adapter.ts`, `dashboard-adapter.test.ts`, `demo-state.ts`, `selectors.ts`, `store.ts`, `types.ts`, `webgl.ts` (callout data contracts only)
- `frontend/src/pages/DashboardPage.tsx` (Twin host; coordinate with the ENV-CMD-001/002 command-center contract — no regressions to its hierarchy/semantics)
- `frontend/tests/e2e/digital-twin.spec.ts`, `frontend/tests/e2e/digital-twin-visual.spec.ts`, `frontend/tests/e2e/dt-vis-p003.spec.ts`
- `docs/work-orders/DT-VIS-P003.md` (this file), `docs/ai/handoffs/DT-VIS-P003-CODEX.md`
- `docs/ai/digital-twin/03-MICRO-STEP-BOARD.md` (P003 status lines only)

Everything else forbidden, notably `docs/ai/CURRENT-WORK.md`, `docs/ai/HANDOFF.md`,
`AGENTS.md`, `scripts/env_coordination_guard.py`, `scripts/env_autonomy_runtime.py`,
Operations/Building/Flow surfaces, `frontend/src/lib/env-int/**`, `data/**`, `.env`.

## Binding constraints (from the board + master plan; verbatim obligations)

- Callouts anchor ONLY to validated asset/domain/source identifiers; no connector
  or status relationship without a stable mapped identifier.
- Selection may focus/highlight the mapped asset and opens an accessible DOM
  evidence panel; hierarchy prefers situation → action/attention →
  source/freshness/provenance → trend/history.
- Desktop: anchored callouts; tablet: split spatial/detail; mobile: recompose to
  ordered list/drawer/bottom sheet/drill-down — no floating-label crowding.
- Preserve `LIVE` / `LATEST` / `HISTORICAL` / `SIMULATED` / `STALE` /
  `UNAVAILABLE` semantics; color secondary only; progressive reveal must never
  imply realtime scanning without a LIVE source.
- No new telemetry inference; no per-equipment state from aggregate data.
- Preserve Aura, Thai labels, source/provenance text, keyboard focus, Escape
  close, 44px touch targets; all decision-relevant content reachable via
  DOM/Process/Data fallback when WebGL/motion unavailable.
- User-facing dates พ.ศ.; no PHI; no real environmental writes in tests; unknown ≠
  zero/normal; simulation explicitly labeled.

## Dispatch-exception risk record (standing pattern)

Autonomous production dispatch remains `BOOTSTRAP_CONTROL` / `AUTONOMY_NOT_READY` /
`ENFORCEMENT_NOT_ACTIVE` (truthful). This lane proceeds under the explicit
owner-authorized continuation steer (2026-10-12) as a dispatch exception.
Pre-enforcement limitations: no autonomous production enforcement beyond CI;
Codex CLI model admission is verified once per MATERIALLY CHANGED admission
fingerprint (routing-directive rule — not per dispatch); recorded admission
evidence 2026-10-12: `gpt-6.1-sol` → HTTP 400 "not supported when using Codex
with a ChatGPT account" (entitlement; the owner's quota statement does not
override the provider error); `gpt-5.6-sol` ADMITTED and executed this claim's
R3 transition review — repair rounds and the D3 implementation dispatch reuse
this evidence unchanged unless the fingerprint materially changes (one re-probe
maximum). Human gates remain for consequential production changes.
Compensating controls: RED-first tests before implementation; full local battery
(tsc/lint/vitest/playwright) before review; fresh-context independent exact-SHA
review (GLM reviews Codex-authored code); expected-head merge; post-main
exact-SHA CI + Pages deploy + deployed smoke; bounded mutable scope enforced by
the registry claim; single-writer rule for DashboardPage.tsx during D3.

## D-plan

- D1 — GLM: confirm callout/evidence data contracts against existing truthful
  adapters (no new inference); pin the composition patterns per breakpoint.
- D2 — GLM: RED tests first (unit: selector/anchor contracts; Playwright: callout
  presence/labels, evidence-panel open/close/Escape, focus, 44px, mobile
  recomposition, WebGL-fallback DOM parity, semantics badges) — truthful failures
  before implementation.
- D3 — Codex CLI implementation dispatch (Role B; one admission probe; exact
  mutable scope = this WO; read-only instructions from the frozen test contract).
- D4 — GLM: integration, full battery green, handoff checkpoint.
- D5 — Independent review (fresh GLM-5.3 MAX context, exact SHA; implementing
  model never approves). Repair rounds as needed.
- D6 — Expected-head merge, exact-main CI/E2E, Pages deploy, deployed-bundle
  smoke (callout/evidence markers present), checkpoint, board status update.

## Acceptance

Board acceptance list verbatim: spatial context materially improves "where is the
issue?"; all callouts have truthful semantic labels + accessible non-Canvas
equivalents; selected state has a clear evidence/detail destination; intentional
per-breakpoint compositions with no mobile crowding; unknown/stale/unavailable and
simulation states understandable without color/animation.

## Review plan

Claim transition = deterministic R3 cross-model review (Codex gpt-6.1-sol
preferred; GPT-5.6 Sol designated fallback with recorded admission evidence;
never Astra; never silent GLM downgrade). Implementation PR = fresh GLM-5.3 MAX
reviewer (cross-model vs Codex author). Implementing lane never merges its own PR.
