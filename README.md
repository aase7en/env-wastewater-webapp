# env-wastewater-webapp

Wastewater-treatment data migration (Google Sheets/AppSheet → Supabase) and
future monitoring webapp for โรงพยาบาลอุทัย's environmental (ENV) systems.

- **Companion repo**: [A-Wiki](../A-Wiki) holds the domain knowledge (schema
  design, ENV concepts) this repo builds against — see `AGENTS.md` for details.
- **Status**: Phase 1 (read-only CSV analysis) in progress. Phase 2 (actual
  Supabase writes) is gated behind explicit approval each time.
- **Data**: `data/raw/` is gitignored — source exports never get committed.
