# WO-FASTAPI-removal: ลบ FastAPI backend dead code (P3 deferred → GLM sweep 2026-07-19)
Status: in-progress (Fable5 audit ผ่าน — Approach C, fable5 execute เอง)
Lane/files: ดู claim row ใน MIGRATION.md In-progress table
Branch: main (via track-f worktree, ff-push)
Model tier: **Fable5** (one-way door อยู่ในกล่อง Fable5 ตาม routing chart ใน handoff — execute ทันที ไม่เผา dispatch รอบสอง)

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

- [x] Fable5 audit: ตัดสินใจ A/B/C พร้อมเหตุผล → **Approach C** (ด้านล่าง)
- [x] Fable5 เขียน Step-by-step ละเอียด (DDL-equivalent สำหรับ Python code)
- [ ] Fable5 verify scripts ที่จะเหลือทำงานได้จริง (apply_migration_api คือ
      สคริปต์สำคัญที่ใช้ทุก migration)
- [x] ~~dispatch GLM ตาม tier~~ → Fable5 execute เอง (one-way door อยู่ในกล่อง
      Fable5 ตาม routing chart; ประหยัด dispatch round-trip)

---

## Fable5 decision — 2026-07-19: **Approach C**

เหตุผล (จาก audit โค้ดจริง ไม่ใช่ inventory อย่างเดียว):

1. **Port surface เล็กกว่าที่ inventory ประเมินมาก** — ตรวจ call site จริง:
   - `apply_migration_api.py::_load_token()` ใช้แค่ `_resolve_env_file()` แล้ว
     parse บรรทัด `SUPABASE_ACCESS_TOKEN=` เอง — ไม่แตะ `Settings`/pydantic เลย
   - `introspect_schema_api.py::_load_token()` เรียก `get_settings()` แต่
     **ไม่ใช้ค่าที่ได้** (comment L30 ในไฟล์ยอมรับเอง: "supabase_access_token
     isn't on Settings; pull from env file directly") = dead call ลบได้
   - ⇒ สิ่งที่ต้อง port มีแค่ `_resolve_drive_root()` + `_resolve_env_file()`
     = **stdlib ล้วน ~70 บรรทัด** ไม่ต้อง port pydantic/Settings
2. **`introspect_schema.py` (direct-DB/asyncpg) ลบทิ้ง ไม่ port** — superseded
   โดย `_api` variant สมบูรณ์ (output เดียวกัน ผ่าน HTTPS ไม่ติด IPv6);
   ไม่มี caller นอก docs (grep ยืนยัน: เจอแค่ CONTRIBUTING/roadmap/WO นี้)
   ⇒ SQLAlchemy + asyncpg deps หายทั้งยวง
3. **B ปฏิเสธ**: เก็บ dead code ~460KB + FastAPI/uvicorn/SQLAlchemy deps ใน
   pyproject เพื่อเลี่ยงงาน port ~70 บรรทัด stdlib = แลกไม่คุ้ม และไม่ปิด chapter
4. **A vs C**: งาน port เท่ากันเป๊ะ; C เพิ่ม archive branch 1 คำสั่ง (named ref
   ราคาศูนย์ กู้ง่ายกว่าไล่ SHA ใน log) — สำหรับ one-way door เลือก C
5. **Residual refs ที่ inventory ไม่ได้จับ** (เจอจาก sweep เพิ่ม): CI
   `.github/workflows/test.yml` (รัน pytest + smoke `import app.main` — พังทันที
   ถ้าลบโดยไม่แก้), `README.md` §backend + §frontend (Vite proxy :8000 stale
   ตั้งแต่ P12), `CONTRIBUTING.md` (pytest/uvicorn/config.py), `docs/roadmap.md`
   (P5b.2-live one-command + alert.py notifier), `.env.example` (ตรวจใน step 7)
   — ADR 0003/0004 + MIGRATION.md history = บันทึกประวัติศาสตร์ **ไม่แก้**

## Step-by-step (Fable5 — executed 2026-07-19)

### Step 0 — archive branch (one-way door insurance)
```bash
git branch archive/fastapi-backend <HEAD ก่อนลบ>
git push origin archive/fastapi-backend
```

### Step 1 — สร้าง `scripts/_env.py` (stdlib-only, verbatim ในไฟล์จริง)
Public API 2 ตัว: `resolve_env_file() -> str | None` (contract เดิมของ
`app.core.config._resolve_env_file` — Drive-backed เมื่อ stub opt-in) และ
`load_secret(name) -> str` (env ก่อน → env-file line-parse; คืน "" เมื่อไม่พบ
— caller ตัดสินใจ fail เอง; ห้าม print ค่า). ต่างจากของเดิม 2 จุด (จงใจ):
stub path ผูก repo root แทน cwd (รันจาก dir ไหนก็ได้) + resolve แบบ lazy
per-call แทน module-level (ไม่มี FS walk ตอน import).

### Step 2 — `scripts/apply_migration_api.py`
- docstring L16-17: `app.core.config._resolve_env_file` → `scripts/_env.py`
- `_load_token()` body → `from _env import load_secret` +
  `tok = load_secret("SUPABASE_ACCESS_TOKEN")` (คง error message + exit 1 เดิม;
  import อยู่ในฟังก์ชันเหมือนเดิม — `test_split_sql.py` import โมดูลนี้อยู่
  ต้องไม่มี side effect ตอน import)

### Step 3 — `scripts/introspect_schema_api.py`
- ลบ dead `get_settings()` call + `_load_token()` body → `load_secret` แบบ
  เดียวกับ Step 2 (same-dir import ใช้ได้เพราะ sys.path[0] = scripts/)

### Step 4 — ลบไฟล์
```bash
git rm -r app tests
git rm scripts/introspect_schema.py
```

### Step 5 — `pyproject.toml` slim + `uv lock`
เหลือ: name/version 0.2.0/description ใหม่/requires-python >=3.11/
`dependencies = ["httpx>=0.27"]` + `[tool.uv] package = false`.
ตัด: fastapi/uvicorn/sqlalchemy/asyncpg/pydantic*/python-dotenv, dev extras,
build-system (ไม่มี package ให้ build), `[tool.pytest.ini_options]` (ไม่เหลือ
pytest — regression ของ scripts คือ `test_split_sql.py` รันตรง)

### Step 6 — `.github/workflows/test.yml`
แทน pytest + smoke-import ด้วย step เดียว:
`uv run python scripts/test_split_sql.py` (standalone, ไม่ใช้ secrets)

### Step 7 — docs
- `README.md`: §Running the backend → §Python scripts (migration/introspect
  commands + pointer ไป archive branch); §Running the frontend ตัด "Start the
  backend first" + Vite proxy paragraph (stale ตั้งแต่ P12 — frontend คุย
  Supabase ตรง); ตัด "FastAPI retained as reference" ใน Status bullet
- `CONTRIBUTING.md`: dev-loop block → frontend + scripts; Data policy bullet
  ORM→introspect ใหม่; §Secret storage: `app/core/config.py` → `scripts/_env.py`,
  verify ด้วย `introspect_schema_api.py` แทน pytest
- `docs/roadmap.md`: P5b.2-live one-command → `_api` variant (ตัด pytest
  integration ที่ลบแล้ว); alert notifier bullet → ชี้ SQL/Edge Function +
  Python reference ใน archive branch
- `.env.example`: ตัด backend-only vars (DB URL/JWT/AUTH_MODE) ถ้ามี — เหลือ
  `SUPABASE_ACCESS_TOKEN` + `__LOAD_FROM_DRIVE__` pattern

### Step 8 — Verify (ทุกข้อต้องผ่านก่อน push)
1. `uv run python scripts/test_split_sql.py` → 8/8 PASS
2. `SUPABASE_ACCESS_TOKEN` **ว่าง** + `uv run python scripts/introspect_schema_api.py`
   → บังคับเดิน Drive-fallback ผ่าน `_env.py` จริง → เขียน
   `reports/schema-snapshot-live.md` สำเร็จ (read-only ต่อ DB)
3. migration no-op (`SELECT 1;`) ผ่าน `apply_migration_api.py` → `1/1 OK`
   (พิสูจน์เส้น migration ครบวงจรหลัง port)
4. `git grep -nE "from app|app\.core" -- scripts .github` → 0 hit
5. `npm run build` ผ่าน (กติกา Two-track rule 2)

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
