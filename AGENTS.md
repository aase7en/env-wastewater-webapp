# env-wastewater-webapp — Agent Notes

Environmental-monitoring webapp for โรงพยาบาลอุทัย (wastewater treatment +
utilities), migrated from AppSheet to Supabase; React frontend deployed on
GitHub Pages. Normal git workflow — branches, PRs, CI as needed. Not bound to
any "main-only" rule (that's an A-Wiki-specific policy, not this repo's).

## Mandatory SSoT reading — before non-trivial work

This repository, not chat history, is the shared memory for multi-agent work.

### Repository freshness gate

Before reading the SSoT files for non-trivial work, verify the active worktree is based on current `origin/main`:

1. `git fetch origin main`;
2. compare the active branch/HEAD with `origin/main` (or verify current `origin/main` is an ancestor of the working branch);
3. if the worktree is stale, update it safely before trusting local SSoT files;
4. if untracked/user-owned files would be overwritten, **do not clean, reset, delete, move, or stash them blindly**. Use a clean worktree based on current `origin/main` and record the local-worktree caveat in `docs/ai/HANDOFF.md`.

A stale local checkout must never silently become the project memory just because an agent was activated there.

Before non-trivial product, architecture, UI, Digital Twin, data, or integration work, read in this order:

1. `docs/ai/PROJECT-BRIEF.md`
2. `docs/ai/CURRENT-WORK.md`
3. `docs/ai/HANDOFF.md`
4. `docs/ai/ENV-ENGINEERING-LOOP.md` — binding goal-first engineering/review/merge process
5. `docs/ai/DEFECT-MEMORY.md` — reusable verified failure patterns; apply relevant prevention rules
6. `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md`
7. `docs/ai/design/ENV-PRODUCT-EXPERIENCE-GOAL.md` — user-confirmed dashboard prototype north star + mobile-first operational data-entry + responsive/interactive rules
8. `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md` — the multi-agent ownership/review rules; mandatory whenever more than one agent (GLM / GPT / Codex / others) is active on this repo
9. the relevant domain folder under `docs/ai/` (for example `digital-twin/`, `environmental-intelligence/`, or `tooling/`)

For any wastewater-process, process-flow, Digital Twin wastewater, sludge, chlorination, bypass, or simulation work, also read `docs/ai/digital-twin/11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md` before designing or editing behavior. It is the durable user-confirmed process-topology reference for Uthai Hospital's Activated Sludge system.

The Experience Master Plan is mandatory for all product/visual work. It explicitly preserves the existing Digital Twin as the spatial/visual core while adding Operations, Analytics, Flows, Hazard Map, Resource Explorer, and System/Data Network as complementary intelligence surfaces.

An active `CURRENT-WORK.md` remains the execution scope. Do not treat the master plan as permission to start unrelated work.

## Binding rules for every agent

These apply to **any** agent working in this repo, regardless of which tool
or session launched it. They consolidate rules that were previously scattered
across the collaboration protocol and design docs (audit record:
`reports/repo-health-2026-08-25.md`). Where this section and
`docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md` overlap, the protocol has
the detailed wording; this section is the always-read summary.

- **Goal-first engineering loop.** Significant work follows `docs/ai/ENV-ENGINEERING-LOOP.md`: define the goal first, fetch source reality, grill only unresolved decisions, specify/slice/assign ownership, establish RED or baseline evidence, implement narrowly, test like the real user, update SSoT + defect memory, review the exact diff/SHA independently, wait for applicable CI, re-audit, merge by the authorized reviewer, fetch main, verify deployment when applicable, then close. Repository SSoT is authoritative; chat/model memory is not.
- **No unauthorized work.** Only the active work order in
  `docs/ai/CURRENT-WORK.md` (or an explicit user instruction) authorizes
  changes. No silent scope expansion; no starting deferred lanes.
- **PHI boundary.** Patient-identifying data must never leave the system —
  never route PHI to external AI providers, directly or indirectly.
  AI annotate/chat features must go through the approved safe-field
  projection (`frontend/src/lib/admin/annotate-boundary.ts`) and fail closed.
- **Secrets & raw data.** `.env` and `data/raw/` are gitignored — never
  commit, never print contents to chat.
- **Ownership (two-track).** Track F (visual: className, styling, 3D,
  Digital Twin art direction) = Codex lane. Track Z (lib logic, SQL, RLS,
  data contracts, tests, CI) = GLM lane. One writer per file; do not touch
  files another agent owns.
- **Review gate.** The implementing agent never merges its own
  implementation PR. Stop at `REVIEW_REQUESTED`; the GPT reviewer owns
  approval and merge.
- **Data honesty.** Unknown ≠ Zero/Normal/Stopped — never coerce missing
  telemetry into a value. `latest` ≠ `live` (reserve "live" for real sensor
  telemetry). Simulation must be explicitly labeled as simulation.
- **Dates.** User-facing dates are พ.ศ. (CE + 543).
- **Git safety.** Never `reset --hard`, clean, delete, move, or blindly
  stash untracked files you did not create — they may be another agent's
  (or the user's) work.

## 📡 Companion repo — A-Wiki

This repo pairs with **A-Wiki**, a separate personal-wiki repo that holds:
- Domain knowledge: `wiki/entities/env/`, `wiki/concepts/env/`
- The schema design doc: `wiki/synthesis/env-webapp-schema-wastewater.md`
- The project pointer page: `wiki/entities/env/env-webapp-project.md`

**Before starting non-trivial work here, check A-Wiki for context.** Resolve its
location in this order:

1. `$A_WIKI_ROOT` env var, if set
2. Sibling directory: `../A-Wiki` (default — true today: both repos live under `~/Desktop/`)

```bash
A_WIKI_ROOT="${A_WIKI_ROOT:-../A-Wiki}"
ls "$A_WIKI_ROOT/wiki/entities/env/" 2>/dev/null
```

If `$A_WIKI_ROOT` doesn't resolve (different machine, repo moved), ask the user
where A-Wiki lives before assuming domain knowledge is unavailable — don't just
skip it silently.

## Data policy

- `data/raw/` holds source CSV/export files — **gitignored, never commit** (real
  hospital operational data). Original exports also live in the user's Downloads;
  this is a working copy for the migration scripts to read from.
- `.env` holds `SUPABASE_DB_URL` — **gitignored, never commit, never print to chat**.
- Supabase project: `ENV_DB` (`gllqtbyofrcjzmbnfoeh`, ap-southeast-1).

## Migration status

See `MIGRATION.md` for the current phase. Phase 1 (read-only CSV analysis)
and Phase 2 (Supabase insert, gated behind explicit user approval each time)
are both complete as of 2026-07-05 — 907/907 rows migrated. Remaining
follow-ups (personnel/location FK backfill, discharge-volume field) are
tracked there too.
