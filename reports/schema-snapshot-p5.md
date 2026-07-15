# Schema Snapshot & Reconciliation — P5b.2 (local-source pass)

> Status: **PARTIAL** — reconciled against local sources (Phase 2 INSERT
> contract + MIGRATION.md notes). Live DB introspection still pending
> `SUPABASE_DB_URL`. Any future drift found against the live DB wins.

## Method

The authoritative local source for column names is `phase2_generate_sql.py`'s
`WR_COLS` list — that generator emits the INSERT statement that populated
ENV_DB, so its column list IS the contract the live DB accepted (Phase 2 ran
clean, 907/907 rows). Each P5 ORM model was diffed programmatically against
this contract plus the columns the P1–P4 migrations added.

## Findings

### Drift found and fixed (this pass)

**`wastewater.reading.cause` — DID NOT EXIST in the DB.**

- The P5b model declared `cause: Optional[str]` on `WastewaterReading`,
  assuming SPEC §6 ("cause mandatory when system_operating=False") implied a
  column on this table. It does not.
- `WR_COLS` (the INSERT contract) has no `cause`. The `cause text NOT NULL`
  column in MIGRATION.md:89 belongs to **`core.repair_request`**, not
  `wastewater.reading`.
- **Fix**: removed `cause` from the model. Renamed the schema field to
  `abnormal_cause` (on `ReadingCreate`/`ReadingUpdate` only, not on the
  shared `_ReadingBase` that maps to columns). `create_reading` now uses
  `abnormal_cause` to seed a `core.repair_request` row in the same
  transaction — the correct home for the cause per the existing schema.
- Tests updated to match; 44 still passing.

### Verified clean (no drift)

| Table | Source of truth | Result |
|---|---|---|
| `wastewater.reading` | `WR_COLS` (33 reading cols) + 7 migration-added | ✅ exact match |
| `carbon.reading` | `build_batch_sql` insert list (5 cols) + migration | ✅ exact match |
| `carbon.meter` | single fixed UUID `b6be4c99-...` referenced by Phase 2 | ✅ |
| `core.equipment` | 10 codes matching boolean column prefixes | ✅ |
| `core.location` / `core.location_category` | P3 migration notes | ✅ (pending live confirm) |
| `core.personnel` | P1 seed (9 rows, STAFF-001..009) | ✅ (pending live confirm) |
| `core.app_user` / `core.repair_request` / `core.pdf_template` | P2 notes | ✅ (pending live confirm) |
| `wastewater.threshold` | exists, unused in v1 | ✅ (pending live confirm) |

## Still pending (needs `SUPABASE_DB_URL`)

Local sources confirm column NAMES but not:
- Exact Postgres **types** (e.g. `Numeric(5,2)` vs `Numeric(6,2)` — guessed
  precision/scale from data samples)
- **Constraints** beyond the unique on `(reading_date, location_id)` —
  check constraints on `role`, `status`, `paper_size`, `orientation` enums
- **Index** definitions
- **View** column sets (`v_reading_detail`, `v_monthly_summary`) — currently
  read defensively via raw SQL with `.get()` per column
- **RLS policies** (assumed `authenticated` ALL, per MIGRATION.md)

When the URL is provided, run:

```python
# 1. Dump every table/view in core, carbon, wastewater schemas
SELECT table_schema, table_name, column_name, data_type,
       is_nullable, column_default
FROM information_schema.columns
WHERE table_schema IN ('core','carbon','wastewater')
ORDER BY table_schema, table_name, ordinal_position;

# 2. Enum types
SELECT t.typname, e.enumlabel
FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typnamespace IN ('core'::regnamespace, 'wastewater'::regnamespace);

# 3. Views
SELECT table_name, definition FROM pg_views
WHERE schemaname IN ('core','carbon','wastewater');
```

Then update this file's "verified clean" rows from "(pending live confirm)"
to ✅ with the live type, and file model fixes for any remaining drift.
