# WO-FASTAPI-removal: ลบ FastAPI backend dead code (P3 deferred → GLM sweep 2026-07-19)
Status: pending Fable5 audit (one-way door)
Lane/files: รอ Fable5 ตัดสินใจ scope (ดู Decision ด้านล่าง)
Branch: main
Model tier: **Fable5 design** → แยก tier ตาม decision

## บริบท

P12 (commit ??? ใน 2026-07-17) เลิกใช้ FastAPI backend ใน production —
frontend พูดกับ Supabase ตรงผ่าน supabase-js + RLS (ADR-0004). แต่โค้ด
FastAPI ยังอยู่ครบ (49 files, ~460KB) เพราะ one-way door.

GLM sweep 2026-07-19: รวบรวม inventory + dependency graph ให้ Fable5
ตัดสินใจวิธี remove ที่ปลอดภัย

## Inventory

### ไฟล์ที่อยู่ในขอบเขต remove
```
app/                    49 .py files, 336KB
├── api/                routers (dashboard, meta, pdf_templates, readings,
│                       reference, repair_requests)
├── core/               config, db, auth, alert, computed, dependencies
├── main.py             FastAPI app entry
├── models/             13 SQLAlchemy ORM models
└── schemas/            Pydantic schemas (auth, dashboard, ...)
tests/                  123KB, integration/ + unit tests
pyproject.toml          FastAPI/SQLAlchemy/asyncpg dependencies
uv.lock                 lockfile
```

### ไฟล์ที่อยู่นอกขอบเขต (keep)
```
scripts/apply_migration_api.py        ← ใช้ app.core.config._resolve_env_file
scripts/introspect_schema.py          ← ใช้ app.core.config.get_settings + app.core.db._engine
scripts/introspect_schema_api.py      ← ใช้ app.core.config (get_settings + _resolve_env_file)
scripts/test_split_sql.py             ← standalone (CRB-2)
```

## Dependency analysis

3 ใน 4 Supabase scripts ใน `scripts/` import `app.core.config` สำหรับ:
1. **`_resolve_env_file()`** — resolve path ของ Drive-backed secrets file
   (`L:\My Drive\A-Wiki-Data\secrets\env-wastewater-webapp.env`)
2. **`get_settings()`** — Pydantic settings object (URL, keys, JWT secret, AUTH_MODE)

`introspect_schema.py` ยังใช้ `app.core.db._engine` สำหรับ asyncpg engine
แต่ดูเหมือนจะเป็น dead path (มี `_api` variant ที่ใช้ HTTPS Management API แทน
direct DB connection — เป็น IPv6 workaround บน Windows)

## Decision tree (Fable5 ตัดสินใจ)

### Approach A: ลบ app/ + tests/ + pyproject.toml + uv.lock ทั้งหมด
- **บังคับ**: ย้าย `_resolve_env_file()` และ `get_settings()` (subset ที่ scripts
  ใช้จริง) ออกมาเป็น module ใหม่ เช่น `scripts/_env.py` หรือ `lib/env.py`
- แก้ 3 scripts ให้ import จาก module ใหม่
- ลบ `introspect_schema.py` (ตัวเก่าที่ใช้ direct DB) หรือ port ไปใช้ `_api` variant
- **Risk**: สูง — ทุกการแก้ scripts อาจ break migration/introspection pipeline
- **Benefit**: ลด ~460KB, ปิด chapter FastAPI สมบูรณ์, pyproject.toml สะอาด

### Approach B: เก็บไว้ใน git history + ลบเฉพาะ dead files
- ลบ `app/api/` + `app/main.py` (FastAPI entry + routers — ไม่มีใครเรียก)
- เก็บ `app/core/config.py` + `app/core/db.py` (scripts ยังใช้)
- ลบ `tests/` ที่ไม่ใช่ integration
- **Risk**: ต่ำ — scripts ยังทำงาน
- **Benefit**: น้อยกว่า A — ยังมี FastAPI deps ใน pyproject.toml

### Approach C: archive branch + ลบจาก main
- `git branch archive/fastapi-backend` เก็บสถานะปัจจุบัน
- ลบ app/ tests/ pyproject.toml uv.lock ออกจาก main
- ทำ Approach A (port _resolve_env_file + get_settings ออกมา)
- **Risk**: กลาง — history เก็บใน archive branch
- **Benefit**: main สะอาด, recover ได้

## Acceptance gate (Fable5 เลือก A/B/C ก่อน)

- [ ] Fable5 audit: ตัดสินใจ A/B/C พร้อมเหตุผล
- [ ] Fable5 เขียน Step-by-step ละเอียด (DDL-equivalent สำหรับ Python code)
- [ ] Fable5 verify scripts ที่จะเหลือทำงานได้จริง (apply_migration_api คือ
      สคริปต์สำคัญที่ใช้ทุก migration)
- [ ] dispatch GLM ตาม tier (Approach A=mid, B=cheap-ok, C=mid)

## Forbidden (GLM)
- ห้ามลบไฟล์ใด ๆ ก่อน Fable5 audit ผ่าน
- ห้ามแก้ scripts/*.py โดยไม่มี WO ที่ Fable5 เขียน Step ให้
- ห้าม force-push / git reset --hard

## Checkpoint log
- [2026-07-19] zcode (GLM sweep): inventory + dependency graph เสร็จ.
  พบ critical dep: 3 scripts (`apply_migration_api.py`,
  `introspect_schema.py`, `introspect_schema_api.py`) import
  `app.core.config` → ลบ app/ ทั้งหมดไม่ได้โดยตรง. Approach A/B/C
  รอ Fable5 ตัดสินใจ.
