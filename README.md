# env-wastewater-webapp

Wastewater-treatment data migration (Google Sheets/AppSheet → Supabase) and
future monitoring webapp for โรงพยาบาลอุทัย's environmental (ENV) systems.

- **Companion repo**: [A-Wiki](../A-Wiki) holds the domain knowledge (schema
  design, ENV concepts) this repo builds against — see `AGENTS.md` for details.
- **Status**: Phase 1 (read-only CSV analysis) and Phase 2 (Supabase writes)
  are both complete — 907/907 rows migrated into `wastewater.reading` +
  `carbon.reading`. See `MIGRATION.md` for details and open follow-ups.
  Next up: FastAPI backend + frontend (not started).
- **Data**: `data/raw/` is gitignored — source exports never get committed.
