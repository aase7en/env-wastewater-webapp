# WO-INTROSPECT-1: extend introspect_schema_api SCHEMAS tuple 3 → 11
Status: done (2026-07-20, zcode) — commit pending
Lane/files: `scripts/introspect_schema_api.py:23` (1 บรรทัด), `reports/schema-snapshot-live.md` (regenerated)
Branch: main
Model tier: **cheap-ok** (literal tuple extend + re-run snapshot)

## บริบท

Fable5 review #4 nit: `introspect_schema_api.py::SCHEMAS` ยังครอบแค่
`("core", "carbon", "wastewater")` ทั้งที่ SCHEMA-1 (`c639b67`) เพิ่ม 8 domain
schemas ใหม่ (food/fuel/garbage/garden/safety/building/chemical/water_supply)
ในวันเดียวกัน (2026-07-19). Snapshot ที่ออกมาเลยไม่ครอบตาราง/วิว/RLS
ของ 8 schemas ใหม่ → verify migration ไม่ครบ

`reports/schema-snapshot-live.md` ปัจจุบัน refresh ครั้งล่าสุดใน FASTAPI-
removal `c6fc72a` แต่ก็ใช้ tuple เดิม (3 schemas) — ยัง stale อยู่

## Goal + Acceptance (define done)

1. `scripts/introspect_schema_api.py:23` tuple = 11 schemas:
   `("core", "wastewater", "carbon", "food", "fuel", "garbage", "garden", "safety", "building", "chemical", "water_supply")`
   - **order**: ตาม grant ใน SCHEMA-5 (`core, wastewater, carbon, food, …`) เพื่อ match DDL conventions + ตรง SCHEMAS display line ใน snapshot header (line 92)
2. `reports/schema-snapshot-live.md` regenerated ครอบ 11 schemas:
   - tables จาก 8 schemas ใหม่ปรากฏ (food.lab_test, fuel.dispense_log, garbage.collection_log, garden.work_round, safety.monthly_check, building.inspection_round, chemical.master, chemical.movement, water_supply.daily_check)
   - row counts ของตารางที่ migrate แล้ว (907 rows ใน carbon.reading + wastewater.reading, 10 core.equipment, 1 carbon.meter, 1 core.location, etc.)
3. **No app/frontend code change** — pure scripts/ + reports/ housekeeping

## Pre-mortem

- **"ทำไมไม่ query ทุก schemas ใน DB?"** — มี schemas ที่ไม่เกี่ยว (public,
  graphql_public, auth, storage, extensions) ที่ไม่ต้อง snapshot — tuple
  explicit =ปลอดภัยกว่า `*`
- **"Ordering สำคัญมั้ย?"** — SQL `ORDER BY 1,2` ทำให้ output ออกตาม
  alphabetical อยู่แล้ว แต่ header line แสดง `', '.join(SCHEMAS)` ตรงๆ
  tuple จึง order ตาม grant เพื่ออ่านง่าย
- **Edge case**: บาง schemas อาจไม่มี enum/constraint → query returns []
  =ปกติ ไม่ใช่ error

## Reference pattern

- SCHEMA-5 grant line: `core, wastewater, carbon, food, fuel, garbage,
  garden, safety, building, chemical, water_supply` (commit 4c60805:21)
- Snapshot output: `reports/schema-snapshot-live.md` regenerated with
  `uv run python scripts/introspect_schema_api.py` (tokenless forces Drive
  fallback via scripts/_env.py — see FASTAPI-removal review #4)

## Steps

1. **`scripts/introspect_schema_api.py:23`** — replace tuple:
   ```python
   SCHEMAS = ("core", "wastewater", "carbon", "food", "fuel", "garbage",
              "garden", "safety", "building", "chemical", "water_supply")
   ```
   (multi-line tuple เพื่อ readability)

2. **Regenerate snapshot**:
   ```bash
   SUPABASE_ACCESS_TOKEN="" uv run python scripts/introspect_schema_api.py
   ```
   - Forces Drive-fallback path (scripts/_env.py)
   - Writes to `reports/schema-snapshot-live.md`
   - Read-only vs DB

3. **Spot-check snapshot** (manual):
   - Header line lists 11 schemas
   - Tables section has entries from all 11 schemas
   - Row counts: 907 สำหรับ carbon.reading + wastewater.reading

4. Verify → commit → push → set done

## Forbidden

- ห้ามแตะ logic อื่นใน introspect_schema_api.py (tuple เดียว)
- ห้ามแตะ frontend/app code
- ห้ามใช้ `*` wildcard สำหรับ schemas (security — จะ snapshot auth/storage ด้วย)
- ห้าม commit stale snapshot (ถ้า re-run ล้มเหลว → checkpoint + ไม่ push)

## Verify commands

```bash
# 1. Run introspect (Drive fallback):
SUPABASE_ACCESS_TOKEN="" uv run python scripts/introspect_schema_api.py

# 2. Spot-check snapshot:
grep -c "^| " reports/schema-snapshot-live.md   # many rows expected
head -5 reports/schema-snapshot-live.md         # header should list 11 schemas
grep "carbon.reading\|wastewater.reading" reports/schema-snapshot-live.md | head -2  # 907 rows

# 3. Build sanity (no frontend touched, but Two-track rule 2):
cd frontend && npm run build
```

## Checkpoint log (append-only)

- [2026-07-20] zcode (GLM): เขียน WO จาก Fable5 review #4 nit + cross-ref
  SCHEMA-5 grant line. tuple เดิม 3 schemas → 11 (matches DDL grant order).
  รอ execute.
- [2026-07-20] zcode (GLM): execute ตาม Steps 1-3 — tuple extend +
  regenerate snapshot (tokenless Drive fallback). Verify:
  - Header lists 11 schemas ครบ (`core, wastewater, carbon, food, fuel,
    garbage, garden, safety, building, chemical, water_supply`)
  - 30 tables ใน row count table (ทุก schema มี entries)
  - Migration integrity ตรง: carbon.reading=907 · wastewater.reading=907 ·
    core.equipment=10 · core.personnel=9 · core.location_category=16 ·
    carbon.emission_factor=12 · core.app_user=1 · core.audit_log=23 ·
    core.regulation=7
  - Module ใหม่ tables (food.lab_test, fuel.dispense_log, …) ปรากฏ
    ด้วย rows=0 (as expected — รอ AppSheet export)
  - `npm run build` ✅ (Two-track rule 2 แม้ไม่แตะ frontend)
