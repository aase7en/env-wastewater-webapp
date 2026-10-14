# ENV-WASTE-CARBON-001-C1 — Handoff (claim checkpoint)

## Checkpoint 0 — Claim transition authored (2026-10-13)

- Claim `ENV-WASTE-CARBON-001-C1` (generation 1, CLAIMED) registered by this
  transition; authority begins only after the reviewed transition merges.
- Work Order: `docs/work-orders/ENV-WASTE-CARBON-001.md` — bounded C1 slice:
  integrated sustainability view (`/sustainability`) grounded in the delivered
  001A A–K inventory + honesty contracts; 1 contributing family (electricity)
  + 4 explicit UNAVAILABLE families; T-VER evidence-readiness ONLY (never
  eligibility); read-only reuse of the rollup contract.
- D3 model AUTHORIZED (2026-10-14 owner steer, recorded in-substance in the
  WO): Codex CLI `gpt-6-sol` @ max implements D3 (Track-F-consistent);
  single-writer window during the dispatch; gpt-6.1-sol unprobed on its
  unchanged blocked fingerprint; gpt-5.6-sol R3-review-only. JEV named by the
  owner as helper but UNAVAILABLE per the fleet router — no advisory consumed,
  no probing. D1 (@29f0471: contracts + truth table) and D2 (@1b4f73d: RED
  unit + e2e) are COMPLETE in worktree `env-wc001-20261013` (branch
  `feat/env-waste-carbon-001`).
- Next (D3 split by track per AGENTS.md): **D3a GLM implements
  `frontend/src/lib/sustainability/family-state.ts`** to the frozen unit
  contract (RED→green; GLM sole writer of lib/sustainability/**). **D3b
  Codex `gpt-6-sol` @ max implements `SustainabilityPage.tsx` + `App.tsx`
  route + `AppShell.tsx` nav** consuming family-state read-only (Codex sole
  writer of those three files only; GLM paused during the dispatch). → D4
  battery (full vitest + tsc + lint + Playwright on a ref-matching dev
  server) → D5 FRESH independent GLM-5.3 MAX review (cross-model vs the
  Codex author; implementing lane never merges) → D6 deploy + receipts +
  closeout.
