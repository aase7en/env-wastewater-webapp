# SDLC-OPT-001 — Risk-based SDLC and context-efficiency pass

Status: IMPLEMENTING
Risk: LOW (governance/docs only)
Owner: GPT-5.6 Sol / SDLC Architect
Base: `origin/main@685037e5c6c94bc11bf307ac2b739eaeec3eebd2`
Branch: `docs/sdlc-opt-001`

## Objective

Reduce process/context overhead while preserving ENV's existing verification,
data-honesty, security, release, and multi-agent protections.

## Problem / evidence

- ENV already has a strong end-to-end engineering loop, but the canonical loop
  is commonly presented as one long superset rather than an explicit
  risk-selected FAST / STANDARD / HIGH-RISK route.
- `AGENTS.md` and the operating map currently direct non-trivial work through
  a broad mandatory reading set even when only a small subset is relevant.
- `docs/work-orders/README.md` still presents a July-era vendor/model routing
  table and queue that are historical, while current repo/A-Wiki governance is
  capability-first.
- Live GitHub state can lead canonical repo status: at audit time PR #80 is
  `REVIEW_REQUESTED` while `main` `CURRENT-WORK.md` still starts at
  `Status: READY`. This pass defines the reconciliation rule but does not edit
  that active feature lane.

## Allowed scope

- `AGENTS.md`
- `docs/ai/PROJECT-OPERATING-MAP.md`
- `docs/ai/ENV-ENGINEERING-LOOP.md`
- `docs/work-orders/README.md`
- this work order

## Forbidden scope

- production/frontend source
- schema, RLS, migrations, live data, credentials
- `CURRENT-WORK.md` / `HANDOFF.md` active feature records in this pass
- PR #80 GISTDA files or PR #75 Building decision file
- deleting historical governance/evidence
- weakening exact-SHA review, CI, PHI, data-honesty, or release gates

## Acceptance criteria

1. Define FAST / STANDARD / HIGH-RISK routes with risk-proportionate gates.
2. Define progressive context so agents read only task-relevant SSoT.
3. Add compact Definition of Ready / Definition of Done and WIP/frontier rules.
4. Replace new-work vendor routing with capability-first routing while keeping
   the old table/queue clearly historical.
5. Define live-PR/branch vs SSoT mismatch as state drift requiring
   reconciliation.
6. Preserve current strong CI/E2E/release/security protections.
7. Remote diff contains only the allowed files.

## Verification

- inspect exact remote diff against `main@685037e...`
- confirm only allowed files changed
- confirm FAST/STANDARD/HIGH-RISK, progressive context, DoR/DoD, capability
  routing, and state-drift rules are present
- verify referenced canonical files exist
- run applicable docs-only CI after PR creation
- no frontend Playwright/build required solely for this docs-only governance change

## Rollback

Revert this docs-only branch/PR. No runtime, schema, or data migration exists.

## Stop / review state

Implementation owner does not self-merge. Stop at `REVIEW_REQUESTED` after
remote-diff and applicable deterministic verification.
