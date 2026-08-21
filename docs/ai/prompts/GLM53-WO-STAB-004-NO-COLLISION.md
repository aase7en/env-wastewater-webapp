# GLM 5.3 MAX — PARALLEL EXECUTION / NO-COLLISION MODE

/goal Complete the repository-authoritative stabilization work order as a focused micro-step implementation, open a PR, and stop for GPT 5.6 Sol UltraMAX review without touching the Digital Twin work currently being handled by Codex.

## PROJECT

Repository:

`A:\GitHub\env-wastewater-webapp`

You are:

**GLM 5.3 MAX Zcode**

Role:

**Implementation Engineer / Long-running Coding Worker**

Another agent, **Codex**, is currently working in parallel on the Digital Twin / visual workstream.

You MUST avoid overlapping with Codex.

## SOURCE OF TRUTH

Do not rely on previous chat memory.

Repository files are authoritative.

Read FIRST:

- `docs/ai/PROJECT-BRIEF.md`
- `docs/ai/CURRENT-WORK.md`
- `docs/ai/HANDOFF.md`
- `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md`
- `docs/ai/digital-twin/02-AI-AGENT-GOVERNANCE.md`
- `docs/ai/digital-twin/03-MICRO-STEP-BOARD.md`
- `docs/ai/digital-twin/05-PR-REVIEW-PROTOCOL.md`

`docs/ai/CURRENT-WORK.md` overrides chat instructions if there is any conflict.

## STEP 0 — IDENTITY GATE

Before changing anything, verify:

```bash
git branch --show-current
git rev-parse HEAD
git status --short
```

Also inspect current remotes/branch relationship without destructive operations.

Report internally before implementation:

```text
ACTIVE REPO:
ACTIVE BRANCH:
HEAD:
WORKTREE STATUS:
AUTHORITATIVE WORK ORDER:
```

If repository identity does not match `env-wastewater-webapp`:

**STOP.**

## STEP 1 — COLLISION GATE

Codex is working on the Digital Twin / visual stream.

For this assignment you MUST NOT modify:

```text
docs/ai/digital-twin/**
frontend/src/components/digital-twin/**
frontend/src/lib/twin/**
frontend/tests/e2e/digital-twin.spec.ts
Digital Twin assets
3D assets
GLTF files
Three.js/R3F visual implementation
Dashboard Digital Twin visual layout
```

Also do not modify any file currently changed by another agent if `git status` shows unexpected work.

If unexpected dirty files overlap the active task:

**STOP and report COLLISION_DETECTED.**

Do not stash, reset, clean, discard, or overwrite another agent's work.

## STEP 2 — AUTHORITATIVE TASK

Execute ONLY the current work order defined in:

`docs/ai/CURRENT-WORK.md`

Expected active work order:

`WO-STAB-004`

Goal:

Prevent React Query background/window-focus refetch from overwriting unsaved user edits in the wastewater Daily Form.

This is a **P0 data-integrity stabilization task**.

Do not expand scope.

## STEP 3 — MICRO-STEP EXECUTION

Work using small checkpoints.

### Micro Step A — Inspect

Inspect only the files required by CURRENT-WORK, including as applicable:

```text
frontend/src/pages/DailyFormPage.tsx
frontend/src/lib/hooks.ts
frontend/src/lib/query-client.ts
frontend/tests/e2e/**
relevant tests/fixtures
reports/code-review-2026-08-12.md
```

Understand the existing hydration/refetch behavior before editing.

Do not change files yet.

### Micro Step B — Plan

Write a concise implementation plan containing:

```text
ROOT CAUSE:
MINIMAL FIX:
FILES TO CHANGE:
TEST STRATEGY:
RISKS:
```

Prefer the smallest robust solution.

Do not globally disable React Query focus refetch unless repository evidence proves that is necessary.

### Micro Step C — Implement

Implement ONLY `WO-STAB-004`.

Requirements include:

- initial record hydration still works
- user-edited local state survives background/window-focus refetch
- changing to another reading ID allows new record hydration
- create/update/delete behavior remains unchanged
- no visual redesign
- no Digital Twin changes
- no new dependency
- no database migration

### Micro Step D — Focused Tests

Run the smallest relevant tests first.

If focused tests pass, continue to required regression gates from `CURRENT-WORK.md`.

Do not start unrelated fixes when failures are discovered.

Classify failures as:

```text
REGRESSION_FROM_THIS_WO
PRE_EXISTING
ENVIRONMENTAL
UNKNOWN
```

### Micro Step E — Full Gates

Run the required gates from the authoritative work order, including as applicable:

```bash
npm run build
npm test
npm run lint
git diff --check
```

Run the required Playwright regression suite according to repository instructions.

Avoid commands that generate huge unbounded terminal output.

If a command is expected to be long, use the repository's established supervised/test workflow if available.

## STEP 4 — HANDOFF

Update:

`docs/ai/HANDOFF.md`

Record factual evidence only:

- work order
- implementation summary
- files changed
- important implementation decisions
- tests run
- exact results
- known issues
- deferred work
- branch
- implementation checkpoint SHA
- reviewer focus

Set status to:

`REVIEW_REQUESTED`

Do not put private reasoning or chain-of-thought in repository documents.

## STEP 5 — GIT / PR

Use a focused branch for this work.

Expected/recommended branch:

`fix/p0-form-dirty-gate`

Do not merge into `main`.

Before committing:

```bash
git status --short
git diff --check
```

Review the final diff and confirm:

```text
NO Digital Twin files
NO Codex files
NO unrelated fixes
```

Commit with a focused message.

Push the branch.

Create a Pull Request.

PR title should clearly reference:

`WO-STAB-004`

PR body must include:

```text
## Goal
## Root Cause
## Implementation
## Files Changed
## Tests
## Risks / Limitations
## Reviewer Focus
```

## STEP 6 — STOP GATE

After PR creation:

**STOP.**

Do NOT merge.

Do NOT begin another work order.

Do NOT start Digital Twin implementation.

Final state must be:

```text
WO-STAB-004
STATUS: REVIEW_REQUESTED
PR: <URL>
NEXT OWNER: GPT 5.6 Sol UltraMAX
```

GPT 5.6 Sol UltraMAX will perform the final review.

## HARD RULES

Never:

- modify Codex's Digital Twin work
- checkout/switch into Codex's branch just to inspect its work
- merge Codex's work
- rewrite Digital Twin architecture
- silently expand scope
- fix unrelated findings
- reset/clean/stash another agent's files
- merge your own PR

Repository > chat memory.

One micro-step/work order > one focused branch/PR.

If repository state contradicts the work order:

**STOP with `DECISION_REQUIRED`.**
