# Digital Twin Agent Governance

Status: ACTIVE

## Core Rule

Repository files are the durable memory. Each agent updates the work-order and handoff documents before ending a material session.

## Roles

### Architecture/Review Owner

- approves product semantics and architecture boundaries
- resolves conflicts between Core Engineering and Visual Experience
- reviews data honesty and scope

### Core Engineering Owner

- owns Twin domain contracts and data correctness
- owns React Query/Supabase/provenance/freshness/scenario logic
- provides renderer-ready fields and null behavior

### Visual Experience Owner

- owns the R3F scene, procedural assets, camera, light, materials, interaction, responsive presentation, and visual QA
- renders the contract without inventing telemetry

## Startup Gate

Before a non-trivial task:

1. Read the required documents listed in `README.md`.
2. Run `git status --short --branch` and `git worktree list`.
3. Confirm the target branch and active work order.
4. Inspect the actual source and tests named by the work order.
5. Confirm that no other agent owns the same shared files.

## During Work

- Keep the micro-step status current.
- Record decisions that affect future agents in `06-DECISION-LOG.md`.
- Record missing domain fields as a data request; do not infer them in the renderer.
- Keep work small enough for one focused review/PR.

## Session End Gate

Update `docs/ai/HANDOFF.md` and append to `10-SESSION-LEDGER.md`:

- task and owner
- branch and exact HEAD
- files changed
- behavior/contracts changed
- tests and screenshots
- limitations and open decisions
- exact next action

## Privacy and Reference Assets

Hospital-site photos, drone imagery, and scanned engineering drawings may reveal site/security details. Do not commit originals to a public branch without explicit user approval and a review of cropping/redaction needs.

Game screenshots are inspiration references only. Do not copy protected assets, UI, characters, textures, maps, or distinctive layouts.
