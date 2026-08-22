# env-wastewater-webapp — Agent Notes

Wastewater-treatment data migration (AppSheet → Supabase) + future FastAPI/frontend
for โรงพยาบาลอุทัย's environmental monitoring. Normal git workflow — branches, PRs,
CI as needed. Not bound to any "main-only" rule (that's an A-Wiki-specific policy,
not this repo's).

## Mandatory SSoT reading — before non-trivial work

This repository, not chat history, is the shared memory for multi-agent work.

Before non-trivial product, architecture, UI, Digital Twin, data, or integration work, read in this order:

1. `docs/ai/PROJECT-BRIEF.md`
2. `docs/ai/CURRENT-WORK.md`
3. `docs/ai/HANDOFF.md`
4. `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md`
5. the relevant domain folder under `docs/ai/` (for example `digital-twin/`, `environmental-intelligence/`, or `tooling/`)

The Experience Master Plan is mandatory for all product/visual work. It explicitly preserves the existing Digital Twin as the spatial/visual core while adding Operations, Analytics, Flows, Hazard Map, Resource Explorer, and System/Data Network as complementary intelligence surfaces.

An active `CURRENT-WORK.md` remains the execution scope. Do not treat the master plan as permission to start unrelated work.

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
