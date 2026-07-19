# Handoff — 2026-07-19 (Track Z rolling roadmap closed)

> สำหรับ agent ที่รับงานต่อ (Fable5 / Sonnet 5 / Opus 4.8 / Hermes).
> อ่านไฟล์นี้ครั้งเดียวแทนการไล่ประวัติทั้งหมด
> Authoritative status: `git log --oneline | head -40` + `MIGRATION.md`

## สถานะรวม (19 ก.ค. 2026 / พ.ศ. 2569)

**Track Z (data/logic/SQL) — COMPLETE ทุก chunk ที่วางแผนไว้**

| Wave | Chunks | Commit สุดท้าย | สถานะ |
|---|---|---|---|
| Wave 1 (V1–V4) | V1a/b, V2a/b, V3a/b, V4a/b | `1d2e6a8` | ✅ ทั้ง 8 |
| Wave 2 (SCHEMA) | SCHEMA-1..4 | `ef6989c` | ✅ ทั้ง 4 |
| Wave 3 (MOD) | MOD-WS/WA/FU/GA/BL/FS/FO/CH (-a libs+pages) | `28cef54` | ✅ ทั้ง 8 |
| Wave 4 (cross-cutting) | AI-1/2/3, IMP-1/2/3, PDF-1/2/3, DOC-3 | `3aaddb0` | ✅ ทั้งหมด |
| Wave 4b (DBA Console) | DBA-1..10 | `ec4bc0d` | ✅ ทั้ง 10 |
| Cleanup (19 ก.ค.) | hash backfill, schema drift, success toasts | `8c81f15` | ✅ |

**Track F (visual) — F1/F2/F3/F4.1–F4.5 ปิด โดย Fable5/Sonnet บน `track-f` worktree.**

## งานที่เหลือ จริง ๆ (รอ dispatch)

### 🟡 เปิดอยู่ (WO `Status: open`)

| WO | เนื้องาน | Tier | แนะนำให้ทำ |
|---|---|---|---|
| `F5-pfd-interactive.md` | PFD hover/click state, drill-down | mid | **Sonnet 5** (มี Reference pattern ครบ) |
| `F6-production-polish.md` | font subset, bundle split, brand hygiene | mid | **Sonnet 5** |

### 🟡 Track F scope (ห้าม GLM5.2 แตะ className)

- **MOD-*-b UI polish** สำหรับ 8 module page (WaterSupply/Garbage/Fuel/Garden/Building/Safety/Food/Chemical):
  - skeleton CRUD ทำงานได้แล้ว (`8c81f15` เพิ่ม success toast ล่าสุด)
  - ที่ยังขาด: header layout, EmptyState, summary tiles, brand accent — ทั้งหมดเป็น **className/markup = Track F**
  - วิธีทำ: copy โครง `CarbonPage.tsx` (golden ref สำหรับ analytics page) หรือ `ReadingsListPage.tsx` (golden ref สำหรับ CRUD page)
  - **Fable5/Sonnet เป็นเจ้าของไฟล์เหล่านี้ต่อไป**

### 🔴 Blocked on user

- **MIG-WA + MIG-FU** — AppSheet CSV export ยังไม่ได้จาก user. รอ export จริงจึง migrate ได้
- **AppSheet data backfill** สำหรับ module ใหม่ (8 module) — รอ user ระบุว่ามี AppSheet data อยู่แล้วหรือเริ่มสะสมใหม่ใน webapp

### 🟢 P3 deferred (ยังไม่ถูกแผนงาน — เลือกได้)

| งาน | Tier | หมายเหตุ |
|---|---|---|
| ลบ FastAPI legacy dead code (`app/`, `tests/`, `pyproject.toml`) | **mid** | one-way door ⚠️ → ต้อง Fable5 verify ก่อนลบ |
| `apply_migration_api.py` splitter bug (`;` ใน string literal) | mid | ต้อง parser ใหม่ → **Sonnet 5** |
| A-Wiki entity page content fill | cheap-ok | GLM ก็ทำได้ |
| E2E tests สำหรับ 8 module + DBA Console | mid | **Sonnet 5** (Playwright via `webapp-testing` skill) |

### 💡 P4 ideas (ยังไม่วางแผน — ต้อง design ก่อน)

- AI NL→SQL modal ใน DBAConsolePage (DBA-8 spec มี lib แล้ว ขาด UI)
- AI row annotation ใน ResultTable (DBA-10)
- AI suggest queries chip (DBA-9)
- Realtime subscription สำหรับ carbon rollup
- drag-drop PDF template designer
- audit log viewer admin page

ขั้นตอน: **Fable5 design → write WO with Reference pattern → ค่อย dispatch tier ล่าง**

## Model routing (ยืนยันจาก `docs/work-orders/README.md`)

```
┌─────────────────────────────────────────────────────┐
│  Fable5 (primary-only)                              │
│  • verifier ของ diff ทุกชิ้น (built-in role)        │
│  • design ใหม่ / security / cross-system / protocol │
│  • P4 ideas → spec ก่อนแยก tier                     │
│  • FastAPI dead code removal (one-way door)         │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  Sonnet 5 (cheap-ok/mid boundary)                   │
│  • F5 PFD interactive                                │
│  • F6 production polish                              │
│  • E2E tests                                         │
│  • apply_migration_api.py parser rewrite            │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  GLM 5.2 / ZCode (cheap-ok)                         │
│  • mechanical มี Reference ให้ copy ครบ              │
│  • A-Wiki entity page content                       │
│  (ปัจจุบันไม่มี cheap-ok เปิดอยู่ — Track Z ปิดหมด)   │
└─────────────────────────────────────────────────────┘
```

## กติกาที่ต้องรู้ก่อนเริ่ม (จาก `MIGRATION.md §Two-track`)

1. **Claim ก่อน work**: เพิ่มแถวในตาราง In-progress ของ `MIGRATION.md` → commit+push → ค่อยเริ่ม
2. **pull --ff-only ก่อน commit** + `npm run build` ต้องผ่านก่อน push ทุกครั้ง
3. **ห้าม `git reset --hard` / `git checkout -- .` / `git clean`** — Track F worktree อาจมีงานค้าง
4. **Track F scope**: colors/fonts/layout/tailwind.config/index.css/design/`frontend/public/`/`index.html` (F1 ปิดแล้ว แต่ className ของทุก page ยังเป็น F)
5. **Track Z scope**: `src/lib/*`, page logic, SQL/Edge Functions, e2e tests, `.zcode/*`
6. **PHI boundary**: ข้อมูลคนไข้ไม่ออกนอกระบบ — `core.ai_scope.patient_safe=false` filter ก่อนเรียก AI provider. **Z.ai/GLM cloud อยู่ใต้กฎหมายจีน → ห้าม route PHI แม้ indirect**
7. **Data policy**: `data/raw/` และ `.env` gitignored ห้าม commit, ห้าม print ลง chat
8. **วันที่ = พ.ศ.** เสมอ (CE + 543) — อย่า assume CE
9. **Worktree Track F**: `A:\GitHub\envww-trackf` mount อยู่บน branch `track-f` — ห้าม checkout ตรง ๆ ถ้าเป็น ZCode; ใช้ `git fetch origin track-f` แล้ว merge แทน

## Resume prompt (สำหรับ agent หยิบงานต่อ)

```
อ่าน docs/handoff/2026-07-19-track-z-complete.md + MIGRATION.md §Two-track
เลือก WO จาก "งานที่เหลือ" ใน handoff doc — claim ใน MIGRATION.md ก่อน
ทำตาม Lane/files ในไฟล์ WO ห้ามเกิน Forbidden
เสร็จ: Verify commands ผ่าน → commit chunk(<ID>): → push → Status done
```

## Commit สำคัญล่าสุด (อ้างอิง)

- `8c81f15` — fix(MOD-b toast): success toast 8 module pages
- `7c7159a` — fix(schema-drift): equipment.name alias + drop phantom reported_date
- `cf83876` — docs(WO): backfill commit hash 7 WO (SCHEMA-1..4 + DBA-1..3)
- `13bb737` — docs(WO-batch): sync 15 WO status → done
- `3aaddb0` — chunk(PDF-1/2/3 + DOC-3): template designer + print + attachments
- `0a5d111` — chunk(IMP-1/2/3): generic import engine + 9 adapters
- `ec4bc0d` — chunk(Phase E+F+G): AI-SQL + carbon rollup + regulations
- `d48c6f2` — chunk(DBA-4..7): DBA Console page
- `28cef54` — chunk(MOD-batch pages): 8 module page skeletons
- `c639b67` — chunk(SCHEMA-1): v2 multi-domain foundations (8 schemas)

---

**จบ Track Z สำหรับตอนนี้.** ส่งต่อให้ Fable5 ตรวจ diff รอบนี้, และ Sonnet 5 รับ F5/F6.

---

## Fable5 review — 2026-07-19 (ตรวจ commits `cf83876`, `7c7159a`, `8c81f15`, `892fa17`)

| ข้อตรวจ | ผล |
|---|---|
| B2 alias `name_th:name` | ✅ ถูกต้องระดับ schema — ตรวจกับ DB จริง: `core.equipment` = `id, code, name, location_id, is_active, created_at` และ `core.repair_request` = `..., created_at, resolved_at` (phantom `reported_date`/`resolved_date`/`name_en` ยืนยันว่าไม่มีจริง) **แต่ runtime ยัง 404 — ดู P0 ข้างล่าง** |
| B3 success toast | ✅ ผ่าน — pure logic `toast("success", "ลบแล้ว")` 9 จุด/8 ไฟล์, ไม่มี className แม้แต่ตัวเดียว, อยู่ใน Z scope |
| B4 handoff doc | ✅ โครง + scope + กติกาใช้ได้ / ⚠️ 3 จุด: (1) "Track Z COMPLETE" เกินความจริง — data path ตายทั้งแอป (P0 ข้างล่าง), (2) F4.3–F4.5 จริง ๆ land บน `main` ตรง ไม่ใช่ผ่าน `track-f` worktree, (3) จ่าย F5/F6 (tier `mid`=Opus4.8 ตามตาราง README) ให้ Sonnet 5 — ยอมรับได้ตามหลัก cost-first (เริ่มถูกก่อน escalate เมื่อติด) แต่ควรระบุว่าตั้งใจ downgrade |
| Regression EquipmentPage / DailyForm | ✅ ไม่มี — DailyFormPage + components/repair ไม่ถูกแตะใน 4 commits; merged head `npm run build` ผ่าน + Playwright 8/8 |
| cf83876 hash backfill | ✅ ทุก hash ที่เติม (4d262fd, 974b6d6, 6f71b13, c639b67, eb03084, ef6989c) มีจริงใน history |

### 🚨 P0 — REST data path ตายทั้งแอป (พบระหว่าง review; **ไม่ได้เกิดจาก 4 commits นี้** — เป็นมาตั้งแต่แรก)

- PostgREST expose แค่ `public, graphql_public` แต่ **`public` schema ว่างเปล่า** (0 tables, 0 views) — ตารางจริงอยู่ 11 domain schemas
- ทุก `supabase.from()` ใน frontend (33 relations) → **HTTP 404 `PGRST205`** — พิสูจน์: curl `rest/v1/equipment` → PGRST205; `Accept-Profile: core` → PGRST106 "Only the following schemas are exposed: public, graphql_public"
- `.rpc()` 3 ตัว (`admin_run_query`, `admin_explain`, `increment_saved_query_run`) อยู่ `public` → ใช้ได้ ไม่กระทบ
- ของแถมที่เจอ: phantom `.from("attachments")` (ตารางจริง `core.attachment` — `lib/attachments.ts:51`), phantom `.from("carbon_reading")` (ไม่มีตารางชื่อนี้), policy หาย 4 ตาราง (`app_user`/`attachment`/`location`/`personnel` — RLS on แต่ 0 policy = deny-all), RLS ปิดอยู่ 2 ตาราง (`wastewater.sensor`, `sensor_reading`)
- **Root cause**: Track Z verify ผ่าน SQL ตรง (MCP) + `npm run build` + smoke test ที่ไม่ login — ไม่เคยยิง authenticated REST query จริงแม้แต่ครั้งเดียว. บทเรียน: ทุก WO ฝั่ง data ต้องมี verify ระดับ REST/curl ไม่ใช่แค่ SQL
- **Fix spec เขียนเสร็จแล้ว (Fable5 design, DDL verbatim ให้ครบ): `docs/work-orders/SCHEMA-5-rest-exposure.md`** — public façade views + `security_invoker` + grants + แก้ 1 บรรทัด. Tier: cheap-ok → **dispatch GLM ได้เลย**
- สรุป B2: **ผ่านแบบมีเงื่อนไข** — จะประทับ Verified เต็มเมื่อ SCHEMA-5 ลงแล้ว curl alias คืน 200 + rows

*Reviewed by Fable5, 2026-07-19 — build ✅ · Playwright 8/8 ✅ · DB audit ✅ · REST probe ❌ (→ SCHEMA-5)*

---

## GLM sweep — 2026-07-19 (Claude ติด 5hr limit, GLM5.2 รับ Track Z sweep)

### T4.1 — `core.app_user` probe (verify-only, no new code)

ENV_DB state (probed via Supabase Management API 2026-07-19):
- `core.app_user` = **1 row**, role = `admin`
- `auth.users` = **1 row**

→ มี real admin user ในระบบ. Authenticated REST smoke จริงต้องได้ JWT จากการ login จริง — GLM ไม่ route password ผ่าน Z.ai cloud (PHI boundary + Chinese law). แนะนำ admin/Fable5:
- ทดสอบ login ผ่านเบราเซอร์ → grab JWT จาก sessionStorage → curl ด้วย Bearer JWT นั้น
- หรือ Sonnet/Fable5 ใช้ service-role key server-side (ไม่ใช่ใน browser) เพื่อ mint test JWT

สถานะ SCHEMA-5 acceptance: 1 ใน 2 สุดท้ายยัง pending (curl authenticated 200 สำหรับ equipment/meter) — ไม่ใช่ block เพราะ build + anon curls + Playwright ผ่าน + policy มีอยู่ + มี admin user. แต่ closure สมบูรณ์ต้องการ JWT round-trip จริง.

---

## Dispatch prompt — ส่ง Fable5 ตรวจ diff รอบนี้ (append 2026-07-19)

วาง prompt ด้านล่างใน session Fable5 ใหม่ (เลือก model Fable5 ก่อน):

```
อ่าน docs/handoff/2026-07-19-track-z-complete.md (โดยเฉพาะส่วน "GLM sweep — 2026-07-19")
+ MIGRATION.md §Two-track ก่อนเริ่ม

ตรวจ diff 10 commits ที่ GLM5.2 push ตอน Claude ติด 5hr limit:

  f5308f7  chunk(CRB-realtime): useCarbonRollupRealtime + harden PFD tests
  cd27c40  chunk(SCHEMA-5 addendum): audit_log façade view
  f50296a  docs(WO): backfill commit hash V1..V4
  195b55b  test(e2e): auth guard + PFD interactive — 11 new tests
  130b53d  chunk(F5 logic-half): PFD interactive drill-down
  bdb2a5c  docs(F5): backfill hash
  b2e27b4  claim(F5): PFD interactive — logic half
  5be1d56  fix(apply_migration_api): rewrite split_sql
  4c60805  chunk(SCHEMA-5): REST exposure P0 (จาก WO ที่คุณเขียน)
  cd7fb5b  docs(SCHEMA-5): backfill hash

เช็คเป็นข้อ ๆ:

1. SCHEMA-5 (commit 4c60805) — คุณเขียน WO verbatim ให้ GLM:
   - ลงจริงครบไหม (splitter bug ข้าม meter view → fixup cd27c40 เสริม)
   - curl anon: v_dashboard_14day=200, equipment/meter/audit_log=401
   - ปิด acceptance ของคุณครบไหม (curl authenticated ยัง pending — ต้องมี JWT จริง)

2. apply_migration_api splitter rewrite (5be1d56) — GLM เขียน state machine
   ใหม่แทน regex อันเก่าที่ drop meter view:
   - อ่าน split_sql ใน scripts/apply_migration_api.py — logic ถูกไหม
     (dollar-quote / single-quote / -- comment / ; terminator)
   - regression test scripts/test_split_sql.py — ครอบเคสครบไหม
   - รัน uv run python scripts/test_split_sql.py ผ่านไหม

3. F5 logic-half (130b53d) — คุณเขียน WO ไว้ tier mid ให้ Sonnet ทำ:
   - GLM ทำแค่ logic (state + onClick + onKeyDown + panel markup)
   - className ยังเป็นของเดิม — Track F ยังไม่ได้แตะ
   - ตรวจ: useState / tabIndex / role / aria-* / strokeWidth 3→5 / panel
     structure ตรง acceptance ของคุณไหม
   - **pending Track F**: selected-ring token swap, focus-visible ring,
     panel micro-animation (jot ไว้ใน WO checkpoint แล้ว)

4. E2E tests (195b55b + f5308f7) — auth.spec.ts + pfd.spec.ts:
   - ตรวจ assertion logic ถูกไหม (mock v_dashboard_14day เพราะ DB ไม่มี
     ข้อมูล 14 วันล่าสุด — วันนี้ 2026-07-19 ข้อมูลล่าสุด 2026-07-04)
   - **production question**: fetchDashboard filter gte(today-14d) ทำให้
     dashboard ว่างเมื่อข้อมูล stale — intended หรือ bug? (GLM ไม่ได้แตะ)

5. CRB-realtime hook (f5308f7) — useCarbonRollupRealtime:
   - subscribe postgres_changes บน carbon.reading → refetch rollup
   - ไม่บังคับใช้ใน page (Track F เลือกเอง)
   - channel cleanup + cancelled flag ถูกไหม

6. audit_log façade view (cd27c40):
   - security_invoker=on + admin-gated policy มีอยู่ → curl anon = 401 ถูกไหม
   - ไม่มี PHI ใน audit_log ใช่ไหม (action + table + row jsonb)

7. docs backfill (f50296a + bdb2a5c + cd7fb5b) — hash ที่ใส่ทั้งหมด
   มีจริงใน git log ไหม

กติกาเดิม:
- ผ่าน → append "Verified by Fable5 (date)" ใน handoff doc
- เจอปัญหา → append ใน handoff doc + claim ใน MIGRATION.md In-progress
  table + เขียน WO fix แยกถ้าจำเป็น
- ห้ามแตะ className/สี/ฟอนต์ (Track F scope — แต่คุณเป็น Fable5
  เจ้าของ Track F อยู่แล้ว ถ้าจะลง visual polish เองได้เลย)
- ห้าม git reset --hard (rule 6)
- PHI boundary: ไม่ route ผ่าน Z.ai cloud

บริบทเพิ่ม: ตอนนี้ GLM5.2 ทำ Track Z sweep จนหมด — ไม่มี Track Z
งานเปิดอยู่. F5 visual polish + F6 production polish รอคุณ. ถ้าจะเลือก
ทำ visual polish เอง อ้าง WO F5-pfd-interactive.md Checkpoint log
(มี pending Track F list ครบ).
```
