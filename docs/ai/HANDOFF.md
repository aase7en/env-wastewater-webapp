# HANDOFF

Status: APPROVED (WO-STAB-005 merged via PR #12). This file is the repo-wide session checkpoint — read this before chat history.

## Repo state @ 2026-08-22 (authoritative)

main = 2eab5ee. **All 5 P0s from reports/code-review-2026-08-12.md are fixed on main.** Keep-alive CI (daily Supabase ping) live and verified HTTP 200.

### Open PRs (all CI-green, awaiting review/merge — GLM did NOT merge per instruction)

| PR | Branch | Content | Owner | Checkpoint |
|---|---|---|---|---|
| #14 | feature/digital-twin-integration | Digital Twin foundation (3D Plant/Process tabs, lib/twin contracts, twin docs 00–05) = twin-v3 @6123a4a merged with main, zero source conflicts; gates: Vitest 154/154, e2e 40/40 | GLM-integrated (Codex's work preserved) | 29a5147 (+doc 36a895e) |
| #15 | feat/ux-scale-001 | WO-UX-SCALE-001 app-wide readability scale (typography/icons/touch targets, 360px header). WO doc: docs/work-orders/WO-UX-SCALE-001.md | Codex | (see PR) |
| #16 | fix/p1-carbon-mom-gap | WO-STAB-007 P1 #7: overview MoM calendar-previous (gap month → null); +4 tests RED→GREEN; Vitest 152/152 | GLM | 8bf5ebd |

Suggested merge order: #16 → #15 → #14 (smallest→largest; #14 last so twin lands once on fully-scaled UI).

### GLM backlog (next, in priority order)
1. WO-STAB-006 — alert unread optimistic double-decrement (P1 #6, small)
2. WO-STAB-008 — role-visibility write-error surfacing (P1 #8; UI share with Codex)
3. WO-STAB-009 — annotateRow PHI policy (GPT-approved direction: allowlist + safe-field projection first; scrubber as defense-in-depth)
4. Component-test harness (jsdom/RTL retry — react-dom/vitest issue documented in e065253)

### Codex lanes (after #14 merges): twin visual WOs per docs/ai/digital-twin/03-MICRO-STEP-BOARD.md

### Ops lessons (binding)
- Agent shells reset cwd between tool calls — single self-contained commands only; verify `git rev-parse --show-toplevel` when state matters.
- `feature/digital-twin-v3` branch is held by Codex's worktree (envw...-dt-v3-docs) — never checkout it; integration went via a new branch.
- Human preview of twin: worktree `A:\GitHub\envww-twin-preview` (has .env + deps; npm run dev in frontend/).
- Supabase free tier pauses on inactivity → keep-alive workflow handles it; if site breaks with ERR_NAME_NOT_RESOLVED again: resume at supabase.com/dashboard.
