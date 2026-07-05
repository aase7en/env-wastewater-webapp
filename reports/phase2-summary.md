# Phase 2 — Supabase Migration Summary

**Status: COMPLETE** — executed 2026-07-05 after user command "ไปต่อเฟส2".

## Method

- Generated 11 batch SQL files (`phase2-batch-01.sql` .. `phase2-batch-11.sql`, 90 rows each except batch 11 = 7 rows) via `scripts/phase2_generate_sql.py`, instead of one 907-row transaction, because the combined SQL (~365KB) exceeded the tool read-size limit.
- Each batch is independently wrapped in `begin; ... commit;` and executed via the Supabase MCP `execute_sql` tool against project `ENV_DB` (`gllqtbyofrcjzmbnfoeh`).
- Each batch: `WITH input_data(...) AS (VALUES ...)` → insert into `carbon.reading` (meter_id fixed to `b6be4c99-c83a-43f7-b765-72286cc78bd0`) `RETURNING id, reading_date` → join back on `reading_date` (verified unique across all 907 rows) to insert `wastewater.reading` with `carbon_reading_id` populated.
- Dates converted via `core.thai_be_to_date(text)` inline in SQL — no Thai BE date parsing in Python.
- All-NULL columns (`wastewater_discharged`, `excess_sludge_removed` in some batches) required explicit casts (`NULL::numeric`, `NULL::text`, `NULL::boolean`) to avoid Postgres mis-inferring the VALUES column type from an all-NULL sample.

## Batch execution log

| Batch | Rows | Cumulative (expected) | Result |
|---|---|---|---|
| 01–09 | 90 each | 90 → 810 | OK, matched at each step |
| 10 | 90 | 900 | OK |
| 11 | 7 | 907 | OK |

## Final verification (post-commit query)

```
ww_rows=907  carbon_rows=907  distinct_dates=907
min_date=2024-01-09  max_date=2026-07-04
joined_ok=907 (wastewater.reading ⋈ carbon.reading via carbon_reading_id)
wrong_meter=0 (all carbon.reading rows use meter b6be4c99-c83a-43f7-b765-72286cc78bd0)
null_legacy_id=0
```

907 = 908 source CSV rows − 1 row with a blank date (per Phase 1 finding). No duplicate `reading_date`, no orphaned joins, no wrong meter assignment.

## Known follow-ups (not blocking, out of scope for this migration)

- `reported_by` / `location_id` FKs left NULL — personnel + location migration is a separate future task.
- `wastewater_discharged` is NULL for all rows (source column is a text status, not a volume); the discharge status text was appended into `note` instead, per user decision.
