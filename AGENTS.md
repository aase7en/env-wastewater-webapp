# env-wastewater-webapp — Agent Notes

Wastewater-treatment data migration (AppSheet → Supabase) + future FastAPI/frontend
for โรงพยาบาลอุทัย's environmental monitoring. Normal git workflow — branches, PRs,
CI as needed. Not bound to any "main-only" rule (that's an A-Wiki-specific policy,
not this repo's).

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

See `MIGRATION.md` (once created) for the current phase (Phase 1 = read-only
CSV analysis, Phase 2 = actual Supabase insert — gated behind explicit user
approval each time, per the wastewater migration protocol worked out with A-Wiki).
