# Environmental Intelligence Micro-Step Board

Last updated: 2026-08-22

## Status Vocabulary

`BACKLOG → READY → IMPLEMENTING → TESTING → REVIEW_REQUESTED → APPROVED → DONE`

Use `WAITING_FOR_INPUT` for credentials, provider access, user decisions, or reference material that cannot be derived from the repository.

## Planning Foundation

### ENV-INT-P000 — Durable product/architecture plan

- Status: DONE when this planning branch is merged
- Owner: GPT / Architecture
- Scope: documentation only
- Result: vision, architecture, provenance policy, roadmap, and toolchain state live in the repository
- Stop: no production hazard ingestion in this work order

## Tooling

### ENV-TOOL-P001 — Core free MCP developer toolchain

- Status: DONE for Codex configuration; other clients remain client-specific
- Owner: GPT / Tooling
- Configured locally for OpenAI Codex:
  - Context7 MCP — remote basic access, no API key
  - Playwright MCP — local `npx`
  - Chrome DevTools MCP — local `npx`, isolated browser profile, network-header redaction
- Verification: package CLIs resolve successfully
- Safety: Codex config backed up before modification
- Follow-up: restart/reload Codex client so it discovers the new MCP servers

### ENV-TOOL-P002 — Supabase MCP read-only project connection

- Status: WAITING_FOR_INPUT
- Owner: User performs OAuth/project authorization; GPT supplies/validates configuration
- Requirement: scope to the UTH[AI]-ENV Supabase project and start read-only
- Do not grant broad organization access if project-scoped access is available

### ENV-TOOL-P003 — Figma design integration

- Status: WAITING_FOR_INPUT / OPTIONAL
- Owner: User performs Figma OAuth/account authorization
- Use when visual design files/components are actively maintained in Figma
- Keep design context separate from production data access

### ENV-TOOL-P004 — Component knowledge MCP

- Status: BACKLOG
- Candidate: Storybook MCP
- Current repository already has Ladle; do not introduce Storybook merely to obtain MCP without a reviewed migration/value decision
- Trigger: visual component catalog becomes a bottleneck for multi-agent UI work

### ENV-TOOL-P005 — Runtime observability MCP

- Status: BACKLOG
- Candidate: Sentry MCP after a Sentry project/account is intentionally adopted
- Trigger: production runtime diagnostics/trace workflow is approved

## GISTDA Integration

### ENV-DATA-P001 — GISTDA entitlement and endpoint inventory

- Status: READY
- Owner: GPT/GLM with user-provided local credential placement
- No production code yet
- Tasks:
  1. identify exact endpoints/products enabled for the user's API key;
  2. capture sanitized sample responses;
  3. document units, cadence, spatial resolution, rate limits, attribution, and licensing;
  4. classify each response as observation, satellite estimate, forecast, model, or map layer;
  5. decide which products are useful for hospital environmental-health monitoring.
- Credential rule: key must be supplied through a local/server-side secret mechanism, never chat/Git

### ENV-DATA-P002 — GISTDA server-side proxy/ingestion proof of concept

- Status: BACKLOG
- Dependency: ENV-DATA-P001 approved
- Preferred runtime: Supabase Edge Function or equivalent trusted server-side layer
- Scope: one read-only endpoint/product only
- Requirements: timeout, error mapping, timestamp/provenance preservation, no browser-exposed secret

### ENV-DATA-P003 — TMD and ThaiWater/HII source research

- Status: BACKLOG
- Scope: documentation/research first
- Verify access method, station/grid coverage, cadence, provenance, terms, and data needed for heat and river/flood domains

## Hazard Features

### ENV-HAZ-P001 — PM2.5 situational card + map concept

- Status: BACKLOG
- Dependency: validated source contract
- Must separate current observation/estimate from forecast
- Must show source, valid time, ingestion time, and freshness

### ENV-HAZ-P002 — Heat / Heat Index concept

- Status: BACKLOG
- Dependency: validated temperature/humidity source and threshold policy
- Do not invent risk bands or clinical instructions

### ENV-HAZ-P003 — River level / flood context

- Status: BACKLOG
- Dependency: validated station/layer sources
- Start with read-only trend/proximity; no predictive flood claim without validated model

## Geospatial Presentation

### ENV-MAP-P001 — MapLibre/deck.gl architecture spike

- Status: BACKLOG
- Dependency: at least one validated geospatial source
- Goal: prove a lightweight 2D hazard map without coupling it to the R3F Digital Twin
- Compare bundle size, mobile performance, accessibility, attribution, and layer controls

## QA

### ENV-QA-P001 — Environmental data-honesty acceptance suite

- Status: BACKLOG
- Coverage should include:
  - missing source;
  - stale source;
  - forecast vs observation labels;
  - satellite estimate vs ground measurement;
  - provider timeout;
  - partial provider failure;
  - mobile map/card layout;
  - no secret present in browser bundle/network request to our frontend origin.
