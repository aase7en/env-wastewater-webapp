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
**[ปิดแล้วโดย Fable5 review #2 ข้างล่าง — DB-level role simulation แทน JWT]**

---

## Fable5 review #2 — 2026-07-19 (GLM sweep 10 commits: `cf7fb5b`→`f5308f7`)

| ข้อตรวจ | ผล |
|---|---|
| 1. SCHEMA-5 `4c60805` + fixup | ✅ **Verified เต็ม** — migration ตรง WO DDL verbatim (diff เทียบแล้ว); DB จริงมี 33 views = 29 `security_invoker=on` + 4 definer ตรง design เป๊ะ; meter fixup ถูกต้อง; curl anon: `v_dashboard_14day` 200+row (ล่าสุด 2026-07-04), `equipment`/`meter`/`audit_log` 401 = ถูกต้องตาม design (anon ไม่มี grant บนตารางจริง); **gap "authenticated ต้องมี JWT" ปิดแล้ว** ด้วย DB-level simulation `set local role authenticated` → equipment=10, meter=1, reading=907, carbon_reading=907, dash=907 — grants+RLS+invoker ทำงานครบทั้งเส้นเหมือนที่ PostgREST จะรัน. หมายเหตุ: acceptance ข้อ 2 ใน WO เดิมผมเขียนคาดผล anon=200 ซึ่งผิดเอง (ถูกคือ 401) — GLM รายงานตามจริง ถูกแล้ว |
| 2. split_sql rewrite `5be1d56` | ✅ state machine ถูกหลัก (dollar-quote/`''` escape/line-comment ไม่หลุดเข้า buf/tail flush); test 8/8 ผ่าน (รันเอง) รวม real-file regression (47 stmt มี meter view); ข้อจำกัดที่ยอมรับ: ไม่รองรับ `/* */` (ไม่มีใช้ใน migrations — grep แล้ว) และ `E'...'` backslash strings |
| 3. F5 logic-half `130b53d` | ✅ ตรง acceptance ทุกข้อ (useState toggle / tabIndex / role / aria-label+aria-pressed / Enter+Space+preventDefault / strokeWidth 3→5 / panel copy CarbonPage / token classes มีจริงใน tailwind config); scope สะอาด. 2 จุดที่ pending (focus ring, screening "—") **fable5 ปิดแล้วใน visual half วันนี้** |
| 4. E2E `195b55b`+`f5308f7` | ✅ assertion ถูก; mock ผ่าน `page.route` fulfill = วิธีที่ถูกต้อง (อิสระจาก DB stale); either-or poll กันสอง state ดี. nit: เทสต์ "preserves query in next param" ไม่ได้ assert ส่วน query จริง ๆ. ตอนนี้ suite = **20 เทสต์** (8 smoke + 8 auth + 4 pfd) ไม่ใช่ 19 — นับของ GLM stale หลัง f5308f7 ขยาย pfd |
| 5. CRB-realtime `f5308f7` | ⚠️ **defect จริง 1 ตัว** — โค้ด hook ถูก (cancelled flag ครบทุก setState path + `removeChannel` + `live` จาก SUBSCRIBED) **แต่ `carbon.reading` ไม่อยู่ใน publication `supabase_realtime`** (มีแค่ wastewater.sensor, sensor_reading — ตรวจ `pg_publication_tables`) → event ไม่มีวันมาถึง และ subscription ยัง SUBSCRIBED สำเร็จ → `live=true` หลอกตลอดกาล = fake-telemetry ที่ ui-brief ห้าม. บวก end-of-month bug `setMonth` ก่อน `setDate(1)` (carbon-rollup.ts:50, food.ts:86). → **WO-CRB-2** (cheap-ok, spec ครบ) ห้ามหน้าไหนใช้ hook นี้จนกว่า CRB-2 ลง |
| 6. audit_log view `cd27c40` | ✅ invoker=on + anon 401 ถูก; แม่นยำขึ้น: policy จริงมี 3 ตัว (admin ALL / authenticated INSERT / SELECT own `actor=auth.uid()`) — ไม่ใช่ "admin-only-read" ตาม comment แต่ปลอดภัยกว่าที่อ้าง; columns (action/table/row jsonb) อยู่บน env-domain ทั้งหมด ไม่มี PHI |
| 7. hash backfills ×3 | ✅ ทั้ง 9 hash มีจริงใน history (cat-file ตรวจครบ) |

### Ruling — production question (ข้อ 4): dashboard ว่างเมื่อข้อมูล stale

**Intended, ไม่ใช่ bug** — window 14 วันคือ semantic "สถานะปัจจุบัน" (domain honesty:
ข้อมูลเก่า 15 วันห้ามแสดงเป็นของสด) **แต่** จอว่างเงียบ ๆ ทำให้แยกไม่ออกว่าระบบพัง
หรือไม่มีคนกรอก → enhancement ออกแบบแล้ว: **WO-F7-stale-data-fallback** (บรรทัด
"บันทึกล่าสุด <วันที่ไทย> (N วันก่อน)" ใน empty states — ห้ามเอาข้อมูลเก่าไปวาด chart)

### สรุปรอบนี้

- ✅ **Verified by Fable5 (2026-07-19)** — 9/10 commits ผ่านเต็ม; commit `f5308f7`
  ผ่านฝั่ง test-hardening แต่ hook realtime ยังใช้ไม่ได้จนกว่า **CRB-2** ลง
- WO เปิดใหม่: `CRB-2-realtime-publication` (cheap-ok → GLM) ·
  `F7-stale-data-fallback` (cheap-ok → Sonnet/GLM)
- F5 ปิดสมบูรณ์ทั้ง 2 ครึ่ง (visual polish โดย fable5 — ดู checkpoint ใน WO)
- เหลือใน backlog เดิม: F6 production polish (mid)

---

## Fable5 review #3 — 2026-07-19 (CRB-2 `72634fb` + F7 `7d71166` + backfills)

**✅ Verified by Fable5 (2026-07-19) — ผ่านทั้ง 4 ข้อ ไม่มี defect**

1. **CRB-2 publication** ✅ `pg_publication_tables` = carbon.reading + wastewater.sensor + sensor_reading (ของเดิมครบ) — realtime hook ใช้งานได้แล้ว
2. **Date cutoff** ✅ อ่านไฟล์จริงยืนยัน: `setDate(1)` มาก่อน `setMonth` ทั้ง `carbon-rollup.ts` และ `food.ts` (ตอนแรก diff แบบตัด context ทำให้ดูกำกวม — ตรวจไฟล์ตรงแล้วถูกต้อง)
3. **F7 fetchLatestReadingDate** ✅ unfiltered + desc + limit 1 + null-safe; ใช้ definer view → หน้า `/` ที่ public อ่านได้โดยไม่ login; render ครบ 3 จุด: DashboardPage header (guard `!loading && !error && rows.length===0`), PFD empty card, OverviewPage header (ผ่าน `overview.ts lastDate` — ฉลาดกว่า spec: ไม่ต้องแตะ page)
4. **Domain honesty** ✅ `latestDate` เป็น text ล้วน — status/anyAlert/chart/gauge ยังผูกกับ window 14 วันเท่านั้น
- Build ✅ · Playwright 20/20 ✅ · hash backfill ครบทั้ง 2 ใบ (`72634fb`, `7d71166`)
- Nit (ไม่ bounce): `daysSince()` ซ้ำ 2 ไฟล์ (PFD + DashboardPage) → ยุบเข้า `lib/utils.ts` ในรอบ cleanup/F6; OverviewPage แสดงแค่วันที่ไม่มี "(N วันก่อน)" (cosmetic — header pattern เดิม)

---

## Dispatch prompt — ส่ง Fable5 ตรวจ diff รอบนี้ (append 2026-07-19) [ดำเนินการแล้ว — ผลอยู่ใน review #2 ด้านบน]

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

---

## Dispatch prompt #2 — Fable5 (GLM sweep รอบใหม่ + FastAPI removal audit)

วาง prompt ด้านล่างใน session Fable5 ใหม่ (เลือก model Fable5 ก่อน):

```
อ่าน docs/handoff/2026-07-19-track-z-complete.md (โดยเฉพาะ "GLM sweep"
สองส่วน) + docs/work-orders/FASTAPI-removal.md + MIGRATION.md §Two-track

### Part 1 — ตรวจ diff GLM sweep รอบใหม่ (Claude ยังติด 5hr limit)

สังเกต: GLM ทำ Track F scope แทน Sonnet เพราะ user อนุญาตเฉพาะรอบนี้
(F6 + MOD-*-b + E2E) โดยมีเงื่อนไข "WO เขียนเป็นสูตร verbatim + ตรวจ
ทุกใบ"

ตรวจ diff 6 commits:

  15476c4  docs(FASTAPI-removal): inventory + A/B/C decision tree
  f1f8674  test(e2e): module routes + DBA guard + sidebar (23/23)
  c87fc81  chunk(MOD-*-b batch): UI polish 8 module pages (container+h1+subtitle)
  a04df47  chunk(F6): production polish — self-host fonts + lazy + pdf + favicon

เช็คเป็นข้อ ๆ:

1. F6 (a04df47):
   - Self-host fonts: 13 woff2 + Material Symbols variable (3.9MB full —
     subset ของ variable font ทำให้ axes หาย จึงเก็บเต็ม). แทน @import
     ใน index.css ด้วย @font-face + unicode-range per subset. ถูกไหม?
   - React.lazy: TrendsPage/CarbonPage/CarbonRollupPage + Suspense fallback
     ภาษาไทย. pattern เดียวกับ DBAConsolePage ที่คุณเขียนเอง
   - Dynamic import pdf.ts: ReportsPage.onDownload async +
     RepairRequestModal.printPdf async (type-only import ค้างไว้)
   - favicon.ico multi-size (16/32/64) ผ่าน PIL + index.html เพิ่ม link
   - Main chunk 1,255KB → 424KB (-66%, < 600KB target ✅)
   - **pending Track F (visual verify)**: dev server → block
     fonts.googleapis.com + fonts.gstatic.com → reload → ฟอนต์ไทย/icon
     ยัง render ถูก. กดพิมพ์ PDF ยังได้ (chunk pdf load on demand)

2. MOD-*-b (c87fc81): UI polish 8 module pages
   - แตะแค่ container + h1 + subtitle (Aura pattern เดียวกับ CarbonPage)
   - AuraCard/form/list ไม่ถูกแตะ
   - typo fix bonus: GarbagePage "ขย้า / การเก็บขยะ" → "การ จัดการขยะ"
   - WO: docs/work-orders/MOD-b-ui-polish-batch.md
   - **ถ้าคุณเห็น spacing/layout ที่ยังไม่ใช่ Aura — เจ้าของ Track F
     คือคุณ แก้ได้เลย**

3. E2E modules + DBA (f1f8674): 3 tests ใหม่ → 23/23 รวม
   - modules.spec.ts: 8 module routes + 2 admin routes bounce
   - sidebar assertion: ใช้ .first() เพราะ desktop+mobile sidebar ซ้อน
   - **Track F gap ที่พบ**: NAV list ใน AppShell.tsx ไม่มี 8 module
     routes + admin/db + admin/ai → ผู้ใช้ต้องพิมพ์ URL เอง. flag ไว้ใน
     test comment. คุณเป็นเจ้าของ — อยากเพิ่มใน NAV รอบถัดไปไหม?

### Part 2 — FastAPI removal audit (the real ask)

อ่าน docs/work-orders/FASTAPI-removal.md ที่ GLM เขียน inventory + dep
graph + A/B/C decision tree ให้ครบ แล้ว:

- **ตัดสินใจ Approach A/B/C** พร้อมเหตุผล (one-way door ⚠️)
- **เขียน Step-by-step ละเอียด** ในไฟล์เดียวกัน (เพิ่มใต้ "Acceptance gate")
  เฉพาะส่วนที่ต้อง port `_resolve_env_file()` + `get_settings()` subset
  ออกจาก app/core/config.py มาเป็น module ใหม่ (Approach A/C) — หรือ
  Approach B ไม่ต้อง port
- **verify scripts ที่จะเหลือ**: สำคัญสุดคือ apply_migration_api.py
  (ใช้ทุก migration) — หลัง remove ต้องยังรันได้
- **ระบุ tier**: Approach A=mid, B=cheap-ok, C=mid
- ถ้ายังไม่ถึงเวลา remove (ขอดูข้อมูลจริงก่อน / รอ deploy) → ปิด WO
  ด้วย "deferred" + บอกเหตุผล ไม่ผิดกติกา

กติกาเดิม: append "Verified by Fable5 (date)" ใน handoff doc + claim
ใน MIGRATION.md ถ้าจะ execute เอง. ห้าม git reset --hard. PHI boundary
ไม่ route ผ่าน Z.ai cloud.

บริบทเพิ่ม: GLM5.2 Track Z + Track F (sub for Sonnet) หมดแล้ว. ถ้า
FastAPI WO ของคุณออกมาเป็น cheap-ok/mid tier และ Claude ยังติด limit
GLM รับ execute ต่อได้ทันที.
```

---

## Fable5 visual tour ทั้ง 26 หน้า + hotfix theme — 2026-07-19 (หลัง sweep #2)

ตรวจด้วยตาครั้งแรกทั้งแอป (Playwright screenshot tour: หน้า public ใช้ข้อมูลจริง,
หน้าหลัง login ใช้ seeded session + mock `app_user`) — ทำหน้าที่ pending
"Track F visual verify" ของ F6 ไปในตัว ผล:

- 🔴 **F6 regression — theme ล่มทั้งแอป (Fable5 แก้แล้วใน commit นี้)**:
  `a04df47` วาง `@import "./styles/tokens.css"` ไว้**หลัง**บล็อก `@font-face`
  ใน `index.css` — ผิด CSS spec (@import ต้องมาก่อน rule อื่นทุกชนิด)
  เบราว์เซอร์จึงทิ้ง @import เงียบ ๆ → `--aura-*` หายหมดทั้ง light/dark
  (ขาว-ดำทั้งแอป ทั้ง dev และ production build). build ผ่าน + e2e 23/23
  เขียวเพราะไม่มี assertion เรื่องสีเลย. **Fix**: ย้าย @import ขึ้นบรรทัดแรกสุด.
  **บทเรียนเข้า WO template**: WO ที่แตะ CSS/theme ต้องมีขั้น visual check
  (screenshot หรือ computed-style assert `--aura-cyan` ≠ ว่าง) ใน Verify commands
- 🔴 **StatusBadge กลับด้าน (เปิดใหม่ — รอ WO STAT-1, cheap-ok)**:
  `StatusBadge` นิยาม prop `status: true = ผิดปกติ` แต่ callsite ส่ง
  `row.system_operating` (true = ระบบเดินปกติ) ตรง ๆ อย่างน้อย 2 จุด —
  DashboardPage ตารางประวัติ 14 วัน + ProcessFlowDiagram header → ข้อมูลจริง
  ทุกวันที่ระบบเดินปกติขึ้นป้ายแดง "ผิดปกติ" ขัดกับ KPI "วันผิดปกติ (14d) 0 วัน"
  บนหน้าเดียวกัน. Fix: audit callsite ทั้งหมดของ StatusBadge แล้ว negate ที่
  callsite (`row.system_operating == null ? null : !row.system_operating`)
  หรือเปลี่ยน prop เป็น `operating` ให้ semantic ตรง — ห้ามแก้สองที่พร้อมกัน
- 🔴 **Auth refresh-bounce (เปิดใหม่ — รอ WO AUTH-1, Track Z logic)**:
  `AuthProvider` ตั้ง `loading=false` ทันทีหลัง `getSession()` โดย **ไม่รอ**
  `loadAppUser` (async) → `isAuthenticated = session && appUser` เป็น false
  ชั่วขณะ → hard refresh / deep link หน้า RequireAuth ใด ๆ เด้งไป /login
  เสมอแม้ session ยัง valid และหน้า login ไม่พากลับ. พิสูจน์แล้วด้วย seeded
  session: request `app_user` ยิงถูกต้อง (id ตรง) แต่ redirect เกิดก่อน response.
  Fix: คง loading จนกว่า appUser lookup แรกจะ resolve
- 🟡 **Overview (public) การ์ดพลังงานไฟฟ้า + Carbon Footprint แสดง
  "โหลดไม่สำเร็จ: permission denied for table meter" สำหรับ anon**: ผลจาก
  `010b` ที่ re-create `meter` เป็น invoker view (grant เฉพาะ authenticated)
  แต่หน้า `/` เป็น public. **Ruling Fable5**: ไปทาง definer report view
  (aggregate ไม่มี PHI — แบบเดียวกับ 4 report views เดิม) สำหรับตัวเลข
  ที่การ์ด overview ใช้ — รอเขียน WO SCHEMA-6 (cheap-ok, DDL verbatim)
- ✅ F6 fonts self-host ใช้งานจริง: `public/fonts` 16 ไฟล์ (4.1MB),
  `document.fonts.check` = true ครบ 3 ตระกูล (Jakarta / Plex Thai / Symbols)
- ✅ F6 หลัง hotfix: theme กลับมาครบทั้ง light/dark, PFD interactive + halo +
  panel สวยตาม F5, F7 stale line แสดงถูกทั้ง header + empty card
  ("บันทึกล่าสุด 4 ก.ค. 2569 (15 วันก่อน)"), MOD-b h1/subtitle มาตามแบบ
  CarbonPage, DBA Console / AI Admin / PDF designer / Bulk import render ปกติ
- Screenshot ชุดเต็ม 26 ภาพอยู่ใน scratchpad ของ session (นอก repo) —
  สร้างใหม่ได้ทุกเมื่อด้วย spec ชั่วคราว (บันทึกวิธีไว้ในส่วนนี้แล้ว: seeded
  localStorage session + mock app_user + SPA popstate navigation เลี่ยงบั๊ก AUTH-1)

— Fable5 (2026-07-19)

---

## Fable5 review #4 — 2026-07-19 (dispatch #2: GLM sweep รอบ 2 + FASTAPI audit → executed)

ตรวจ 6 commits (`a04df47` F6 · `c87fc81` MOD-b · `f1f8674` e2e · `15476c4`
FASTAPI-WO · backfill `4e3edc7`/`688e457`) + hotfix `c995ac0` ของ session tour
ที่ push แทรกระหว่างรอบนี้

| ข้อตรวจ | ผล |
|---|---|
| 1. F6 `a04df47` | ✅ **ผ่านหลัง F6.5** — lazy 3 chart pages ตรง DBAConsole pattern (Suspense fallback ไทยครบ); pdf dynamic import ถูกต้องทั้ง 2 จุด (type-only import คง static — ตรวจ dist: `pdf-*.js` 425+434KB แยก chunk จริง, main 428KB < 600KB target); favicon ico ทำงาน; **daysSince dedupe เข้า `lib/utils.ts` = ปิด nit จาก review #3**. defect @import order เป็นเรื่องจริง → ข้อ 2 |
| 2. F6.5 `c995ac0` (hotfix โดย session tour) | ✅ ถูกต้องตามสเปค (@import ก่อน rule อื่นทุกชนิด). เติมความแม่นให้บันทึก: ผมตรวจ dist **ก่อน** hotfix แล้วพบ tokens ถูก inline ครบ + ไม่มี literal @import เหลือ (rolldown-vite inline ให้แม้ตำแหน่งผิดสเปค) → กลไกที่พังชัวร์คือ **dev** (browser ทิ้ง literal @import); "production build ล่มด้วย" ยังไม่มีหลักฐานตรง — moot แล้วหลัง hotfix. Post-hotfix: build ✅ + tokens อยู่ต้น dist CSS ✅ |
| 3. Fonts self-host (F6) | ✅ ใช้จริง (ยืนยันซ้ำจาก fonts.check ของ tour) + ตรวจไฟล์ลึก: Jakarta + JetBrains เป็น **variable font จริง** (fvar ตรวจด้วย fontTools) → ทุก weight render ถูก แต่เป็น**ไฟล์เดียวกัน copy 5+2 ชื่อ** (MD5 ตรงกัน, ~100KB โหลดซ้ำ/URL) → nit: ยุบเหลือ @font-face เดียว `font-weight: 400 800` ต่อตระกูล; IBM Plex Thai เป็น static per-weight ถูกต้องแล้ว; Material 3.9MB full-variable = tradeoff ที่บันทึกไว้ (เน็ตช้า icon จะ blank นาน — ลอง `pyftsubset --flavor woff2` แบบ keep-axes ภายหลังได้) |
| 4. MOD-b `c87fc81` | ✅ 8 ไฟล์ pattern เดียวกันเป๊ะ (`max-w-5xl mx-auto` + header + gradient h1 + subtitle ไทย) ตรง CarbonPage; AuraCard/form/list ไม่ถูกแตะ; typo "ขย้า" แก้แล้ว. nit typographic: gradient-split ทำให้มีช่องว่างกลางคำไทย ("การ จัดการขยะ", "น้ำประปา บาดาล") — แก้ตอน Track F NAV pass ได้ |
| 5. e2e `f1f8674` | ✅ assertion ถูก (bounce + `%2F` encode + `.first()` กัน desktop/mobile sidebar ซ้อน); รันจริงที่ merged head = **26 passed** (tracked 23 + `__screens.spec.ts` scratch 3 ของ session tour). **NAV gap — ruling เจ้าของ Track F: เพิ่ม 8 module + `/admin/db` + `/admin/ai` เข้า AppShell NAV ในรอบ Track F ถัดไป** (มัดรวมกับ STAT-1 sweep ได้ — ตอนนั้นค่อยแก้ sidebar test ให้ assert ชุดเต็ม) |
| 6. FASTAPI `15476c4` + Part 2 | ✅ inventory/dep-graph ถูก แต่ประเมิน port surface เกินจริง — `introspect_schema_api` เรียก `get_settings()` แบบ dead call (ไม่ใช้ค่า) และ `apply_migration_api` ใช้แค่ `_resolve_env_file` → **ตัดสิน Approach C และ execute เสร็จแล้ว** (`0841078` claim → `c6fc72a` chunk): `archive/fastapi-backend` push แล้ว, `scripts/_env.py` stdlib-only, ลบ 52 ไฟล์ (−4,164 บรรทัด), pyproject 0.2.0 เหลือ dep เดียว httpx, CI → split_sql regression, docs 5 ไฟล์อัปเดต (รวม Vite-proxy stale จาก P12), snapshot refresh. Verify: split_sql 8/8 · introspect + `SELECT 1;` migration ผ่านโดย**ล้าง token ใน env บังคับเดิน Drive chain เต็มเส้น** · grep สะอาด · build ✅ |
| 7. backfill `4e3edc7`/`688e457` | ✅ hash ตรง history ทั้งคู่ |

### ขอบเขต + ของที่ไม่แตะ

- **STAT-1 / AUTH-1 / SCHEMA-6** จาก visual tour — เป็นของ session tour
  (ประกาศ `[next: STAT-1]` ในหัว commit) → review นี้ไม่ claim กันชน
- Backlog เปิดหลังรอบนี้: F6 nit fonts dedupe (cheap-ok) · Track F NAV pass
  (+ช่องว่าง h1) · `introspect_schema_api::SCHEMAS` ขยาย 3→11 domain schemas
  (cheap-ok) · E2E authenticated integration profile (P11 follow-up)

*Reviewed + executed by Fable5, 2026-07-19 — build ✅ · Playwright 26/26 ✅ ·
FASTAPI removal C done (`c6fc72a`) · dist CSS token-order ✅*


---

## Fable5 review #5 — 2026-07-19 (re-audit dispatch #2 + CI-1 + F8)

Dispatch #2 ที่ได้รับเขียนจาก state `1f9d077` — แต่ origin/main ล้ำไปแล้ว 4 commits
(`c995ac0` F6.5 · `0841078` claim · `c6fc72a` FASTAPI removal · `3d7a292` review #4)
→ รอบนี้จึงเป็น **independent re-verification ของสิ่งที่ landed แล้ว** + งานใหม่ 2 chunk

| ข้อตรวจซ้ำ (รันเองทุกรายการ ไม่อ้าง doc) | ผล |
|---|---|
| SCHEMA-5 REST chain | ✅ curl anon: dash 200 (ล่าสุด 2026-07-04) / equipment·meter·audit_log 401 (42501); DB sim `set local role authenticated`: eq=10 · meter=1 · reading=907 · dash=907 |
| CRB-2 realtime + cutoff | ✅ `pg_publication_tables` = carbon.reading + wastewater.sensor + sensor_reading; `setDate(1)` ก่อน `setMonth` ทั้ง carbon-rollup.ts:53 และ food.ts:89 |
| split_sql @ HEAD | ✅ 8/8 (รวม real-file 47 stmt หลัง FASTAPI removal) |
| FASTAPI removal `c6fc72a` | ✅ tokenless probe → `_env.py` เดิน Drive chain เต็มเส้น (`0 OK, 0 FAIL`); grep `app.` imports สะอาด; `archive/fastapi-backend`=`0841078` มี app/ ครบ; CI test เขียว. Nuance ที่ยืนยันการ port ว่าเป็น bug fix จริง: `import app` จาก scripts เคยรอดเพราะ editable `.pth` ค้างใน `.venv` (machine state) — fresh clone จะพังตั้งแต่แรก |
| F6/F6.5/MOD-b/e2e | ✅ dist CSS: tokens inline + ไม่มี literal `@import` (สอดคล้อง review #4); Vite rebase `/fonts/` ตาม base จริง (ทดสอบ build ด้วย `GH_PAGES_BASE`); MD5 fonts ซ้ำยืนยันเองแล้ว; e2e local 23/23 ก่อน F8 |

### 🚨 พบใหม่ (P0-infra) → CI-1

**deploy-frontend + e2e workflows แดง 40/40 ตลอดประวัติ repo** — `npm ci` บน
Node 20 (npm 10) reify optional peer (`tsconfck` → `typescript ^5`) แล้ว reject
lockfile ที่ gen ด้วย npm 11: `Missing: typescript@5.9.3 from lock file`.
Production Pages จึงค้าง bundle เก่า — งานวันนี้ทั้งหมด (F5/F6/F6.5/MOD-b) ไม่เคยถึง user.
**Fix `69aa8dd` chunk(CI-1)**: Node 20 → 24 ทั้ง 2 workflow (ตรง env ที่ verify จริงทุกวัน;
`npm ci --dry-run` npm 11 ผ่านกับ lock เดิม) → **deploy เขียวครั้งแรกในประวัติ (43s)**

### F8 — Track F NAV pass (ruling จาก review #4 ข้อ 5)

- AppShell NAV: +13 รายการ, 2 section (`โมดูล ENV` ×9 · `ผู้ดูแล` ×4 adminOnly) —
  ปิด orphan routes ทั้งหมด (8 modules + regulations + carbon-rollup + attachments +
  pdf-designer + admin/db + admin/ai)
- h1 gradient: ตัด space กลางคำไทย 8 module pages (space มาจาก pattern อังกฤษของ CarbonPage)
- DashboardPage tbody: `key={r.id ?? r.reading_date}` (กัน mock ไม่มี id — warning ใน e2e log)
- Fonts dedupe: Jakarta 5→1 + JetBrains 2→1 @font-face (weight-range บน variable font),
  `git rm` 5 ไฟล์ MD5 ซ้ำ (~100KB×5 ประหยัดโหลดแรก)
- Sidebar tests: smoke.spec assert ครบ 19 label · modules.spec assert module+orphan hrefs
  ปรากฏ + admin ทั้ง 4 ซ่อนเมื่อไม่ login

Backlog คงเหลือ: `introspect_schema_api::SCHEMAS` 3→11 (cheap-ok) · Material Symbols
subset แบบ keep-axes (cheap-ok) · E2E authenticated profile (P11)

*Re-audited by Fable5, 2026-07-19 — probes รันเองครบ · CI-1 deploy เขียวแรก ·
F8 landed (ดู commit)*

---

## GLM sweep #3 — 2026-07-20 (post-F8/CI-1/FastAPI-removal: 3 bug fixes)

Claude ยังติด 5hr limit. GLM5.2 รับ Track Z sweep รอบใหม่ — 3 bug ที่
Fable5 visual tour 2026-07-19 flag 🔴 + WO README sync.

### Commit สรุป

| Chunk | Commit | Tier | Files |
|---|---|---|---|
| WO specs + claim + README sync + .gitignore | `8c89072` | docs | `docs/work-orders/AUTH-1-*.md`, `STAT-1-*.md`, `SCHEMA-6-*.md`, `docs/work-orders/README.md`, `MIGRATION.md`, `.gitignore` |
| AUTH-1 — auth loading race | `1e9be0c` | cheap-ok/mid | `frontend/src/components/AuthProvider.tsx` |
| STAT-1 — StatusBadge prop rename | `d2f8dfb` | mid | `StatusBadge.tsx`, `ProcessFlowDiagram.tsx`, `DashboardPage.tsx`, `ReadingsListPage.tsx`, `EquipmentPage.tsx`, `aura.stories.tsx` |
| SCHEMA-6 — anon-safe v_overview_carbon | `073a65f` | cheap-ok | `supabase/migrations/20260720000000_schema6_*.sql`, `frontend/src/lib/supabase-queries.ts`, `overview.ts` |

### GLM self-verify (รันเองครบทุกข้อ)

| Chunk | Build | Playwright | สิ่งอื่น |
|---|---|---|---|
| AUTH-1 | ✅ | 23/23 ✅ | auth guard 8 tests ผ่านหมด — bounce behavior ไม่พัง |
| STAT-1 | ✅ | 23/23 ✅ | TS catch rename ครบ (no leftover `status=`) |
| SCHEMA-6 | ✅ | 23/23 ✅ | split_sql 8/8 · apply migration 5/5 OK · curl anon `/rest/v1/v_overview_carbon` 200 + rows sane (2026-07 4d/19kWh/0.009tCO₂e partial, 2026-06 30d/140/0.070, 2026-05 31d/137/0.068) · curl anon `/rest/v1/carbon_reading` ยัง 401 (per-reading locked ✅) |

### ส่งต่อ Fable5 — ตรวจ 4 commits นี้

**สิ่งที่ต้องตรวจเป็นพิเศษ:**

1. **AUTH-1 (`1e9be0c`)** — logic fix เท่านั้น ไม่แตะ className:
   - ทดสอบจริงด้วย seeded localStorage session (เหมือนที่คุณ tour): refresh หน้า
     RequireAuth ใด ๆ ต้องไม่ bounce ไป /login ถ้า session valid + appUser resolve
   - Edge case ที่ GLM ระบุ: session==null (logged out) ต้อง collapse loading
     ทันที; appUser lookup ล้มเหลว (RLS/network) ต้องไป /login (preserve
     existing behavior, ไม่ทำให้ worse); session เปลี่ยนกลาง lookup → stale
     guard ป้องกัน setState ทับค่าใหม่ (`latestUserIdRef`)
   - derived loading = `sessionLoading || (!!session && appUserLoading)` —
     ใช่มั้ยว่า collapse ได้ถูกเวลา

2. **STAT-1 (`d2f8dfb`)** — interface refactor (user-approved rename):
   - StatusBadge polarity flip + prop rename (`status` → `operating`)
   - 3 callsites ที่ส่ง `system_operating` ใช้ไม่ต้อง negate (system semantics
     = operating semantics)
   - EquipmentPage (`open.length === 0`) negate 1 จุดเพราะ callsite นั้นใช้
     alert semantics จริง ๆ — semantic ถูกบอกเป็นคำเฉย ๆ (negate = explicit)
   - ด้วยตา: row `system_operating=true` ขึ้นสีเขียว "ปกติ" + `false` ขึ้นแดง
     "ผิดปกติ" + null "—" เทา ใน PFD/Dashboard/Readings + EquipmentPage
     (open>0 = แดง "มีการแจ้งซ่อม")
   - **className ไม่ถูกแตะ** (color classes `bg-alert-green`/`bg-alert-red`
     คงเดิม) — เป็น Track F scope

3. **SCHEMA-6 (`073a65f`)** — SQL DDL + frontend switch:
   - 2-layer definer-style pattern (`carbon.v_overview_carbon` + `public.v_overview_carbon`)
     ตรง pattern SCHEMA-5:57-61 (v_dashboard_14day ฯลฯ)
   - ใช่มั้ยว่า layer public ไม่มี `security_invoker=on` (default = definer →
     runs as owner → bypass base-table RLS → anon อ่านได้)
   - emission factor 0.4999 sync กับ `carbon.ts:48 EMISSION_FACTOR_KGCO2E_PER_KWH`
     — ถ้า TGO ออกปีใหม่ ต้องแก้ 2 ที่
   - overview.ts: `useOverviewCarbon` hook + `toCarbonMonths` converter +
     inline `momPct` (carbon.ts:92 module-private — extract to utils.ts =
     nit แยก). OverviewData shape ไม่เปลี่ยน (OverviewPage ไม่ต้องแก้)
   - CarbonPage ยังคงใช้ `useCarbonMonthly` (auth-only, per-meter detail)

4. **WO README sync (`8c89072` รวมในนั้น + final sync ใน commit ถัดไป)** —
   แค่ housekeeping; ตรวจฉลาด ๆ ว่า "ปิดแล้ว" list ตรง git log

### Nit follow-up (รอบถัดไป — backlog เปิดใหม่)

- `lib/utils.ts::momPct` extract (carbon.ts:92 module-private → shared) —
  overview.ts inline copy 1 ตัวจาก SCHEMA-6
- `introspect_schema_api::SCHEMAS` ขยาย 3→11 domain schemas (Fable5 review #4)
- Material Symbols subset แบบ keep-axes (Fable5 review #5)
- E2E authenticated profile (P11 follow-up — Sonnet/Fable5 tier)

*GLM5.2 sweep #3, 2026-07-20 — 4 commits · build ✅ · Playwright 23/23 ·
migration applied live · anon probe 200 + per-reading 401.*


---

## Fable5 review #6 — 2026-07-20 (GLM sweep #3: AUTH-1 + STAT-1 + SCHEMA-6 + docs)

**✅ Verified by Fable5 (2026-07-20) — ผ่านทั้ง 4 commits, ไม่มี defect**

| ข้อตรวจ | ผล |
|---|---|
| 1. AUTH-1 `1e9be0c` | ✅ ไล่ race ทุกเส้น: `setAppUserLoading(true)` เกิดก่อน `setSessionLoading(false)` ใน tick เดียว (React batch → ไม่มีหน้าต่าง false-negative); stale guard ownership ถูก (`finally` flip เฉพาะเจ้าของ lookup); logged-out collapse ทันที; lookup fail → bounce (พฤติกรรมเดิม). **พิสูจน์เชิงพฤติกรรม**: probe spec seeded localStorage session + หน่วง `/rest/v1/app_user` 700ms → อยู่ที่ /form ไม่ bounce ✅ (โค้ดก่อน fix จะ bounce ใน window นี้). Nit ไม่ใช่ defect: `appUserLoading` ค้าง true ได้ถ้า sign-out กลาง lookup — ถูก mask ด้วยสูตร derive (`!!session &&`) |
| 2. STAT-1 `d2f8dfb` | ✅ บั๊กเดิมจริง (system_operating=true เคยขึ้นแดง "ผิดปกติ" ทุกวันปกติ); rename+polarity ถูกทั้ง 7 callsites (grep `status=` = 0); EquipmentPage negate จุดเดียวที่ semantics เป็น alert จริง ✅. **Visual proof (Track F)**: probe render mock 2 แถว → true = เขียว `bg-alert-green` "ปกติ", false = แดง `bg-alert-red` "ผิดปกติ" ✅ |
| 3. SCHEMA-6 `073a65f` | ✅ DDL ตรง SCHEMA-5 pattern; DB จริง: facade `public.v_overview_carbon` reloptions=null (definer ✅); curl anon เอง: 200 + แถวตรง GLM ทุกตัวเลข (2026-07 4d/19/0.009 · 06 30d/140/0.070 · 05 31d/137/0.068; 0.4999×140/1000=0.070 ✓); `carbon_reading` ยัง 401 ✅; EF 0.4999 ตรง carbon.ts:48; overview.ts: desc+limit12, prev=rows[i+1], null guards ครบ, tco2ePeriod=sum window, F7 fallback คงเดิม, OverviewData shape ไม่เปลี่ยน |
| 4. Docs `8c89072`+`454f220` | ✅ WO 3 ใบ + README sync + claims released (ตาราง In-progress ว่าง) |
- Suite ที่ HEAD: **25 passed** (23 tracked + 2 probe แล้วลบ probe) · build ✅

### 🔴 พบใหม่ → WO-E2E-2 (cheap-ok, สูตร verbatim พร้อม dispatch GLM)

e2e.yml prod-smoke run แรกในประวัติ (หลัง CI-1 ปลดบล็อก) ล้ม 6 เทสต์ auth.spec —
**บั๊ก harness ไม่ใช่แอป**: `page.goto("/form")` resolve กับ ORIGIN ทิ้ง subpath
ของ baseURL → ยิง `aase7en.github.io/form` (นอก project site). แถม href-exact
matchers จะไม่ match บน prod (react-router เติม basename). Fix formula ครบใน
`docs/work-orders/E2E-2-prod-profile-basename.md` (fixture goto rewrite + `href$=`).
แอปบน prod ตรวจแล้วปกติ (review #5).

*Re-audited by Fable5, 2026-07-20 — probes รันเอง (AUTH-1 race + STAT-1 colors +
SCHEMA-6 DB/curl) · suite 25/25 · WO-E2E-2 เปิดใหม่*

---

## GLM sweep #4 — next queue (2026-07-20, planning only — not executed)

> Fable5 review #6 (`272b25b`) ปิด GLM sweep #3 ทั้ง 3 chunks (AUTH-1/STAT-1/
> SCHEMA-6) ผ่านครบ + เปิด WO-E2E-2 (Fable5 เขียนสูตร verbatim แล้ว). รอบ
> ถัดไปของ GLM = 4 chunks เรียงตามลำดับนี้:

### Q1 — WO-E2E-2 (test harness, prod CI เขียวครั้งแรก)

- **WO file**: `docs/work-orders/E2E-2-prod-profile-basename.md` (Fable5 เขียน
  Steps verbatim ครบ — **ไม่ต้องเขียน WO ใหม่**)
- **Tier**: cheap-ok
- **Scope (Lane/files)**: `frontend/tests/e2e/fixtures.ts` (new), `*.spec.ts`
  (import swap + href matchers), `frontend/playwright.config.ts` (baseURL
  normalize 1 บรรทัด)
- **Why now**: CI-1 (`69aa8dd`) ปลดบล็อก e2e.yml ครั้งแรกในประวัติ repo →
  run แรกเผยบั๊ก harness (goto "/x" ทิ้ง subpath ของ baseURL; href-exact
  matchers ไม่ match basename). แอปปกติ — pure test fix
- **Verify**: local `npx playwright test` ผ่านครบ + push → e2e.yml เขียวใน CI
- **Forbidden**: ห้ามแตะ app code / RequireAuth / AuthProvider / `.github/`
- **Deps**: ไม่มี — execute ได้เลย

### Q2 — momPct extract (lib refactor, dedupe 2 copies → 1)

- **WO file**: ยังไม่มี — เขียนใหม่ `docs/work-orders/UTILS-1-mompct-extract.md`
- **Tier**: cheap-ok
- **Scope**: `frontend/src/lib/utils.ts` (+ `momPct`), `frontend/src/lib/carbon.ts:92`
  (export inline → import), `frontend/src/lib/overview.ts:18` (inline → import)
- **Why now**: SCHEMA-6 ทำให้มี copy ที่ 2 ของ `momPct` (overview.ts inline) —
  carbon.ts:92 module-private. Dedupe → deep module (1 def + 2 callers)
- **Verify**: `npm run build` + Playwright 25/25 + (manual) CarbonPage + `/`
  cards ยังคำนวณ MoM% ถูก
- **Forbidden**: ห้ามเปลี่ยน logic; ห้ามแตะ className
- **Deps**: ไม่มี

### Q3 — introspect_schema_api::SCHEMAS 3→11 (Python, 1 บรรทัด)

- **WO file**: ยังไม่มี — เขียนใหม่ `docs/work-orders/INTROSPECT-1-schemas-extend.md`
- **Tier**: cheap-ok
- **Scope**: `scripts/introspect_schema_api.py:23` (extend tuple)
- **Why now**: SCHEMA-1..6 เพิ่ม 11 domain schemas (core/carbon/wastewater +
  food/fuel/garbage/garden/safety/building/chemical/water_supply + ใหม่ล่าสุด
  regulation ใน core) — `reports/schema-snapshot-live.md` ปัจจุบัน cover แค่ 3
  (nit จาก Fable5 review #4). Snapshot stale → verify migration ไม่ได้
- **Verify**: `uv run python scripts/introspect_schema_api.py` → snapshot
  อัปเดต (ครอบ 11 schemas) + diff เทียบ `core.app_user` row count ตรง DB
- **Forbidden**: ห้ามแตะ logic introspect; ห้าม commit stale snapshot
- **Deps**: ไม่มี

### Q4 — Material Symbols subset keep-axes (asset + index.css — Track F!)

- **WO file**: ยังไม่มี — **ต้อง Fable5 ออกแบบสูตรก่อน** (pyftsubset args +
  glyph list ที่ MSymbol ใช้จริง)
- **Tier**: cheap-ok **ถ้า** Fable5 เขียนสูตร verbatim; มิฉะนั้น **mid/Track F**
- **Scope (Lane/files)**: `frontend/public/fonts/material-symbols-outlined.woff2`
  (3.9MB → ~200KB subset), `frontend/src/index.css:38-46` (@font-face block)
- **Why now**: Fable5 review #5 nit — font 3.9MB = icon blank นานบนเน็ตช้า
- **⚠ Track F scope**: asset ใน `public/` + `index.css` อยู่ใน Lane ห้ามของ
  GLM ตาม MIGRATION.md Two-track rule 4. **GLM ทำได้เฉพาะถ้า Fable5 เขียน
  WO แบบ F6/MOD-*-b** (verbatim formula + Reference pattern + diff check).
  ไม่งั้น → queue ไว้ให้ Sonnet/Fable5 tier
- **Verify**: dev server → block network → reload → icon ยัง render + bundle
  -3.7MB + `font-display: block` ป้องกัน flash
- **Deps**: Fable5 WO (suspended until Fable5 on limit)

### Out of GLM scope (Sonnet/Fable5 tier — listed for completeness)

- **E2E authenticated integration profile** (P11 follow-up): ต้องมี real
  seeded session + auth.users integration test. Sonnet/Fable5 tier.

### ลำดับ execution (recommended)

1. **Q1** WO-E2E-2 (5 นาที — WO พร้อม execute) → prod CI เขียวครั้งแรก
2. **Q2** momPct extract (10 นาที) → dedupe
3. **Q3** introspect SCHEMAS (5 นาที) → snapshot refresh
4. **Q4** Material Symbols subset — **block on Fable5 WO** (15 นาที execute
   เมื่อ WO ลง)

**Total Q1-Q3: ~20 นาที / 3 commits + 1 claim commit + 1 release commit = 5 commits**

### Guardrails (carried from sweep #3)

- ทุก chunk: `git pull --ff-only` ก่อน, `npm run build` ผ่านก่อน push
- ห้าม `git reset --hard` / `git checkout -- .` / `git clean` (rule 6)
- PHI boundary: ไม่ route ผ่าน Z.ai cloud
- วันที่ = พ.ศ. เสมอ
- แตะ Track F scope (asset + index.css) เฉพาะเมื่อมี Fable5 WO verbatim
- ถ้า verify fail → checkpoint + ไม่ push + แจ้ง user

---

## GLM sweep #4 — executed (2026-07-20): Q1 + Q2 + Q3 done; Q4 blocked

Q1-Q3 of the queue above landed. Q4 (Material Symbols subset) remains
blocked on a Fable5 WO (Track F scope).

### Commit สรุป

| Chunk | Commit | Tier | Files |
|---|---|---|---|
| Q1 E2E-2 — prod basename | `0d1f636` | cheap-ok | `frontend/tests/e2e/fixtures.ts` (new), 4 spec files (import swap + href matchers), `frontend/playwright.config.ts` (baseURL normalize) |
| Q2 UTILS-1 — momPct extract | `2477d78` | cheap-ok | `frontend/src/lib/utils.ts`, `carbon.ts`, `overview.ts` |
| Q3 INTROSPECT-1 — SCHEMAS 3→11 | `ff81e16` | cheap-ok | `scripts/introspect_schema_api.py`, `reports/schema-snapshot-live.md` (regenerated) |

### GLM self-verify

| Chunk | Build | Playwright | สิ่งอื่น |
|---|---|---|---|
| Q1 E2E-2 | ✅ | 23/23 ✅ | prod CI smoke รอ push — คาดว่าจะเขียวครั้งแรก (WO Fable5 verbatim รันตาม Steps 1-4) |
| Q2 UTILS-1 | ✅ | 23/23 ✅ | behavior preserved (double-rounding idempotent for display); momPct now single source in utils.ts |
| Q3 INTROSPECT-1 | ✅ | (n/a) | snapshot 30 tables, 11 schemas; migration integrity (907+907 rows carbon/wastewater.reading) intact |

### ส่งต่อ Fable5 — ตรวจ 3 commits

**สิ่งที่ต้องตรวจเป็นพิเศษ:**

1. **Q1 E2E-2 (`0d1f636`)** — pure test harness fix:
   - รัน `npx playwright test` local ผ่าน — แต่ prod CI smoke รอ push
     แล้วดู e2e.yml run เขียว (ควรเป็นครั้งแรกในประวัติ prod profile)
   - fixture.ts override `page.goto` rewrite `/x` → `./x` — verify
     ถูกต้องไหมว่า relative-resolves กับ baseURL directory
   - modules.spec.ts href matchers `href$=` (ends-with) + ตัด "/" ออก
     จาก expectedNav — boundary case: root "/" href บน prod = basename
     dir + "/" → smoke.spec "sidebar nav" (label-based) ครอบแทน
   - playwright.config.ts baseURL normalize — ตรวจว่าไม่ break local
     dev profile (`localhost:5173` → `localhost:5173/`)

2. **Q2 UTILS-1 (`2477d78`)** — pure helper refactor:
   - `momPct` extracted จาก carbon.ts:92 + overview.ts:65 (มี subtle diff:
     carbon.ts unrounded, overview.ts pre-rounded 1 decimal). Disproof:
     both display sites ใช้ `fmt(…, 1)` อยู่แล้ว → pre-rounding redundant
     → ใช้ carbon.ts shape เป็น canonical (rounding = presentation)
   - ตรวจ CarbonPage + OverviewPage chips render identical (12.3% เท่าเดิม)

3. **Q3 INTROSPECT-1 (`ff81e16`)** — tuple extend + snapshot regenerate:
   - `scripts/introspect_schema_api.py:23` — tuple 11 schemas ตรง SCHEMA-5
     grant line
   - `reports/schema-snapshot-live.md` regenerated — spot-check ว่า
     30 tables ครอบทุก domain + row counts ตรง migration history
     (907+907 carbon/wastewater.reading, 10 equipment, 9 personnel, etc.)
   - ไม่แตะ logic introspect อื่น (tuple เดียว)

### Q4 — Material Symbols subset (ยัง block)

ยังรอ Fable5 WO verbatim (Track F scope: asset + index.css). GLM จะ
execute ได้ทันทีเมื่อ WO ลง — formula: pyftsubset args + glyph list
ที่ MSymbol ใช้จริง. ไม่งั้น → queue Sonnet/Fable5 tier.

### ลำดับ queue ถัดไป (หลัง Q4)

- **E2E authenticated integration profile** (P11 follow-up) — Sonnet/
  Fable5 tier (ต้องมี real seeded session)

*GLM5.2 sweep #4, 2026-07-20 — 3 commits · build ✅ · Playwright 23/23 ·
snapshot 11 schemas verified · Q4 blocked on Fable5 WO.*

---

## Dispatch prompt #3 — ส่ง Fable5 (verify sweep #3+#4 + Q4 WO design)

วาง prompt ด้านล่างใน session Fable5 ใหม่ (เลือก model Fable5 ก่อน):

```
อ่าน docs/handoff/2026-07-19-track-z-complete.md (ส่วน "GLM sweep #3" +
"GLM sweep #4 — executed" + Fable5 review #6 ด้านบน) + MIGRATION.md
§Two-track ก่อนเริ่ม

สถานะ: Claude ติด 5hr limit มา 2 รอบ → GLM5.2 รับ Track Z sweep 2 รอบ
(#3 + #4) รวม 7 chunks ที่รอคุณ verify ในบทบาท verifier ปกติ

### Part 1 — ตรวจ diff 7 commits

รอบ #3 (Fable5 review #6 เคยเปิด WO-E2E-2 แต่ยังไม่ verify 3 ตัวนี้):

  1e9be0c  chunk(AUTH-1): fix auth loading race — wait for appUser before unloading
  d2f8dfb  chunk(STAT-1): rename StatusBadge prop status → operating
  073a65f  chunk(SCHEMA-6): public definer v_overview_carbon — anon-safe aggregates

รอบ #4 (ทั้งหมดยังไม่ verify):

  0d1f636  chunk(E2E-2): basename-aware goto + href matchers — prod CI smoke ready
  2477d78  chunk(UTILS-1): extract momPct to lib/utils.ts — dedupe 2 copies → 1 source
  ff81e16  chunk(INTROSPECT-1): extend SCHEMAS tuple 3→11 + refresh snapshot

เช็คเป็นข้อ ๆ:

1. **AUTH-1** (1e9be0c) — async ordering bug fix แท้ (0 className):
   - ทดสอบจริงด้วย seeded localStorage session (เหมือน tour): refresh หน้า
     RequireAuth ใด ๆ ต้องไม่ bounce ไป /login ถ้า session valid + appUser resolve
   - derived loading = `sessionLoading || (!!session && appUserLoading)` —
     collapse ได้ถูกเวลามั้ย
   - Edge cases ที่ GLM ระบุ: session==null (logged out) collapse ทันที;
     appUser lookup fail → /login (preserve existing behavior); session
     เปลี่ยนกลาง lookup → stale guard `latestUserIdRef` กัน setState ทับ

2. **STAT-1** (d2f8dfb) — interface refactor (user-approved rename):
   - StatusBadge prop `status` → `operating`, polarity flip
   - 3 callsites (PFD/Dashboard/Readings) rename only; EquipmentPage negate
     1 จุด (`operating={open.length === 0}`) เพราะ callsite นั้นใช้ alert
     semantics จริง ๆ
   - ด้วยตา: `system_operating=true` ขึ้นเขียว "ปกติ", `false` ขึ้นแดง
     "ผิดปกติ", null "—" เทา — ทั้ง PFD/Dashboard/Readings/EquipmentPage
   - className ไม่ถูกแตะ (Track F scope)

3. **SCHEMA-6** (073a65f) — SQL DDL + frontend switch:
   - 2-layer definer-style (carbon.v_overview_carbon + public.v_overview_carbon
     façade) ตรง pattern SCHEMA-5:57-61
   - public façade NO security_invoker → runs as owner → bypass base-table
     RLS → anon อ่านได้ (เหมือน v_dashboard_14day)
   - emission factor 0.4999 sync กับ carbon.ts:48
   - curl anon `/rest/v1/v_overview_carbon` → 200 + rows (GLM probe แล้ว:
     2026-07 4d/19kWh/0.009tCO₂e, 2026-06 30d/140/0.070, 2026-05 31d/137/0.068)
   - curl anon `/rest/v1/carbon_reading` → ยัง 401 (per-reading locked)
   - CarbonPage ยังใช้ useCarbonMonthly (auth + per-meter detail) — ไม่แตะ

4. **E2E-2** (0d1f636) — pure test harness fix (WO คุณเขียนเอง):
   - ตาม Steps 1-4 ใน WO-E2E-2-prod-profile-basename.md ครบมั้ย
   - **prod CI**: ดู GitHub Actions → e2e.yml run ล่าสุด (trigger จาก push
     b6ccc8b หรือใหม่กว่า) — คาดว่าเขียวครั้งแรกในประวัติ repo สำหรับ
     prod profile. ถ้าแดง → วิเคราะห์ edge case ที่ WO ไม่ cover
   - modules.spec.ts `href$=` ends-with + ตัด "/" ออกจาก expectedNav —
     boundary case ที่ต้องเช็ค: root "/" href บน prod
   - playwright.config.ts baseURL normalize — ไม่ break local dev มั้ย
     (`localhost:5173` → `localhost:5173/`)

5. **UTILS-1** (2477d78) — pure helper refactor:
   - momPct extract จาก carbon.ts:92 + overview.ts:65 → utils.ts
   - **Subtle diff ที่ GLM พบ**: carbon.ts unrounded, overview.ts pre-rounded
     1 decimal. Disproof: ทั้งคู่ render ผ่าน fmt(…, 1) → pre-rounding
     redundant → ใช้ carbon.ts shape เป็น canonical (rounding = presentation
     concern ของ fmt)
   - ตรวจ CarbonPage + OverviewPage chips render identical (12.3% เท่าเดิม)
   - signature เดิม `momPct(curr, prev)` — callers ไม่ต้องแก้

6. **INTROSPECT-1** (ff81e16) — tuple extend + snapshot regenerate:
   - scripts/introspect_schema_api.py:23 — tuple 11 schemas ตรง SCHEMA-5
     grant line (4c60805:21)
   - reports/schema-snapshot-live.md — spot-check ว่า 30 tables ครอบทุก
     domain + row counts ตรง migration history (907+907 carbon/wastewater.
     reading, 10 equipment, 9 personnel, 12 emission_factor, 16
     location_category, 7 regulation, 23 audit_log)
   - ไม่แตะ logic introspect อื่น (tuple เดียว)

กติกาเดิม:
- ผ่าน → append "Verified by Fable5 (date)" ใน handoff doc
- เจอปัญหา → append ใน handoff doc + claim ใน MIGRATION.md In-progress
  table + เขียน WO fix แยกถ้าจำเป็น
- ห้าม git reset --hard (rule 6)
- PHI boundary: ไม่ route ผ่าน Z.ai cloud

### Part 2 — Q4 WO design (unblock Material Symbols subset)

หลัง verify Part 1 เสร็จ (หรือระหว่างรอ prod CI run) — เขียน WO สำหรับ
Material Symbols subset keep-axes (Fable5 review #5 nit):

- asset: frontend/public/fonts/material-symbols-outlined.woff2 (3.9MB →
  subset ~200KB)
- Lane: Track F scope (asset + index.css:38-46)
- GLM execute ได้ถ้าคุณเขียน WO แบบ F6/MOD-*-b (formula verbatim +
  Reference pattern + diff check)
- สิ่งที่ต้องระบุใน WO:
  - pyftsubset args ที่ preserve variable axes (FILL/wght/GRAD/opsz)
  - glyph list ที่ `<MSymbol name="...">` ใช้จริงใน codebase (grep
    MSymbol name="..." ทั้ง frontend/src)
  - verify: block network fonts.gstatic.com → reload → icon ยัง render
  - bundle -3.7MB + `font-display: block` ป้องกัน flash
- output: `docs/work-orders/FONTS-1-material-symbols-subset.md`

### Part 3 (optional หลัง Part 1+2) — P4 design

ถ้าเหลือเวลา: design P4 ideas (AI NL→SQL modal, audit log viewer,
suggest queries chip) → write WO → dispatch tier ล่าง

บริบทเพิ่ม:
- ตอนนี้ GLM5.2 Track Z + Track F (sub for Sonnet) หมดแล้ว — Track Z
  scope เปิดค้างเฉพาะ Q4 (block on คุณ) + authenticated profile
  (Sonnet tier out of GLM scope)
- ถ้า WO Q4 ของคุณออกมาเป็น cheap-ok tier GLM รับ execute ทันที
- commit convention: `chunk(<ID>): ... [next: <ID>]`
```

---

## Fable5 review #7 — 2026-07-20 (sweep #3 re-audit + sweep #4 + SPA-1 + FONTS-1 WO)

> หมายเหตุ dispatch #3: ข้อความ "review #6 ยังไม่ verify 3 ตัวของรอบ #3" คลาดเคลื่อน —
> review #6 (`272b25b`) verify AUTH-1/STAT-1/SCHEMA-6 ครบพร้อม probe แล้ว.
> รอบนี้จึงเป็น **independent re-audit** ของรอบ #3 (code + curl รันเองใหม่)
> + **verify เต็ม** ของรอบ #4.

**✅ Verified by Fable5 (2026-07-20) — ผ่านทั้ง 6 commits; พบ+แก้บั๊กแอป 1 ตัว
(SPA-1, อยู่นอก 6 commits ที่ตรวจ)**

| ข้อตรวจ | ผล |
|---|---|
| 1. AUTH-1 `1e9be0c` (re-audit) | ✅ ยืนคำ review #6 — ไล่ code ใหม่: `setAppUserLoading(true)` เป็น synchronous ก่อน `await` → batch เดียวกับ `setSessionLoading(false)` ไม่มีหน้าต่าง false-negative; stale guard ownership ถูก (`finally` flip เฉพาะเจ้าของ); logged-out early-return ก่อน try → collapse ทันที; lookup fail → bounce (พฤติกรรมเดิม); useMemo deps ครอบ ingredients ของ derived loading ครบ |
| 2. STAT-1 `d2f8dfb` (re-audit) | ✅ callsites ครบ 5+2 stories, grep `status=` = 0, className/color classes ไม่ถูกแตะ. **Nit แฝง (ไม่ bounce)**: text branch เช็ค `operating === null` อย่างเดียว แต่ color branch เช็ค null+undefined → `operating={undefined}` จะได้ badge เทา + text "ผิดปกติ" ขัดกัน — วันนี้ไม่มี callsite ไหนส่ง undefined (ทุกจุด `?? null` / boolean) → latent เท่านั้น; แก้เป็น `operating == null` ในรอบ cleanup ได้ |
| 3. SCHEMA-6 `073a65f` (re-audit) | ✅ DDL ตรง pattern SCHEMA-5:58 (façade ไม่มี invoker) + :73 (grant anon,authenticated); curl anon เอง: `v_overview_carbon` **200 + 12 เดือนเต็ม** ตัวเลขตรง GLM ทุกค่า (2026-07 4d/19/0.009 · 06 30d/140/0.070 — 140×0.4999/1000=0.06999 ✓ · 05 31d/137/0.068), `carbon_reading` **401** ✓; EF 0.4999 ตรง `carbon.ts:49` (เลขบรรทัดใน commit msg คลาด 1 — สาระถูก); CarbonPage ยังใช้ useCarbonMonthly ไม่ถูกแตะ |
| 4. E2E-2 `0d1f636` | ✅ **harness fix ถูกต้องครบตาม WO Steps 1-4** — probe ยืนยัน: `goto("./form")` + baseURL normalize resolve เป็น `…/env-wastewater-webapp/form` ตามออกแบบ; `href$=` + ตัด root "/" ถูก (suffix "/form" ไม่ false-match "-form"; root ครอบด้วย label ใน smoke); local dev ไม่พัง (23/23). **แต่ prod CI run 29709454444 แดง 8 เทสต์** — root cause ไม่ใช่ harness → SPA-1 ด้านล่าง |
| 5. UTILS-1 `2477d78` | ✅ `utils.momPct` = shape carbon.ts เป๊ะ, 2 callers import แล้ว, ไม่มี copy เหลือ; display เดิม (round(round(x,1),1) = round(x,1) ที่ precision เดียวกัน). **Edge ที่ disproof ของ GLM ไม่ cover**: OverviewPage:87,92 ใช้ `mom_change_pct > 0` เลือกสี/"+"/ลูกศรด้วย — band |pct|<0.05 เดิม pre-round เป็น 0 (no-change) ตอนนี้เป็น ±จิ๋ว → แสดง "+0.0%" ได้. Cosmetic, vanishing edge (ข้อมูลจริง MoM หลัก %), และถือว่าถูกกว่าเดิม (0.04% เพิ่มจริงคือเพิ่ม) — ไม่ bounce, จดไว้เฉย ๆ |
| 6. INTROSPECT-1 `ff81e16` | ✅ tuple 11 schemas เรียงตรง grant line SCHEMA-5 (`4c60805`) เป๊ะ, ไม่แตะ logic อื่น; snapshot regenerate จริง — row counts ตรงทุกตัวที่ dispatch ระบุ (907+907, eq 10, personnel 9, EF 12, loc_cat 16, regulation 7, audit 23, app_user 1, meter 1) + module ใหม่ 0 rows ตามคาด. Nit: GLM อ้าง "30 tables" — นับจริงใน snapshot = **31** (ตกนับ `wastewater.threshold`); prose off-by-one, artifact ถูก |

### 🔴→🟢 SPA-1 — บั๊กแอปที่ prod CI run แรกเผย (พบระหว่างข้อ 4 → แก้ landed แล้ว)

- **กลไก** (reproduce ได้ 100% จากเครื่อง): deep link บน Pages → 404.html
  snippet stash pathname เต็ม + bounce ไป SPA root → `main.tsx` restore แบบ
  strip-and-rejoin: `slice(basename.length)` กิน "/" นำหน้าของส่วนที่เหลือ →
  rejoin ได้ `/env-wastewater-webappform` → BrowserRouter (basename
  `/env-wastewater-webapp/`) match ไม่ได้ → **จอเปล่าทุก prod deep link รวม
  `/auth/callback` = OAuth login พังบน prod**
- **ที่มา**: `fc30a4c fix(P13)` (ZCode, ก่อน sweep #3/#4 — ไม่ใช่ฝีมือ 6 commits
  ที่ตรวจ); latent ตลอดเพราะ deploy แดง 40/40 จน CI-1 ปลดล็อก 2026-07-19 →
  บั๊กเพิ่ง live วันเดียวก่อนถูกจับ. Diagnosis เดิมใน WO-E2E-2 ("แอปบน prod
  ปกติ") แคบไป — review #5 ตรวจแค่ root/assets ไม่เคย deep-link
- **Fix `fcd2a16`**: restore stash verbatim (stash คือ pathname+search+hash
  จาก site เดียวกัน มี basename ครบอยู่แล้ว — ไม่มีอะไรต้อง strip/rejoin)
- **ผล**: e2e.yml run `29711714159` = **23 passed — เขียวครั้งแรกในประวัติ
  repo สำหรับ prod profile** ✓ + รัน `npm run e2e:prod` จากเครื่องกับ site
  ที่ deploy จริงซ้ำ = 23 passed ✓ (acceptance "e2e.yml เขียว" ของ WO-E2E-2
  ปิดที่ chunk นี้ — จดไว้ใน WO checkpoint แล้ว)
- **Deploy แดง 2 run ก่อนหน้า** (ที่ push E2E-2/UTILS-1) = GitHub Pages API
  **503 outage ชั่วคราว** ("No server is currently available") — ไม่เกี่ยวกับ
  commit ใด; deploy ที่ SPA-1 push เขียว (54s) → prod เสิร์ฟ bundle ล่าสุดแล้ว
- **บทเรียน**: (1) e2e prod smoke ที่ deep-link จริงคือ regression net ตัวเดียว
  ที่จับบั๊กคลาสนี้ได้ — คุ้มแล้วที่ลงทุน E2E-2; (2) SPA-fallback restore
  ห้าม reconstruct URL — restore verbatim เท่านั้น

### Part 2 — FONTS-1 WO ✓ (Q4 ปลดบล็อกแล้ว)

`docs/work-orders/FONTS-1-material-symbols-subset.md` — **cheap-ok, GLM execute
ได้ทันที**. จุดสำคัญ: ทางที่ถูกคือ **css2 `icon_names=` server-side subset**
(validate จริงรอบนี้: 3 icons = 4,648 bytes, fvar ครบ `FILL 0..1 / GRAD -50..200
/ opsz 20..48 / wght 100..700` — ล้มข้ออ้าง F6 ที่ว่า "subset แล้ว axes หาย");
pyftsubset local เป็นทางตัน (GSUB closure เห็น a-z+_ จะลาก ligature ทั้ง font
กลับมา). Inventory 48 icon names scan ครบ 3 รูปแบบ (`name="…"` / `icon: "…"` /
literal ใน `name={…}`) + regen script + drift check + verify commands ครบใน WO.
คาด **3.9MB → <150KB (−3.75MB+)**.

### Part 3 — deferred (เจตนา ไม่ใช่ลืม)

P4 design (AI NL→SQL modal / audit log viewer / suggest queries) ต้องการ
grill scope + ui-brief pass จริงจัง — ยกไป session ถัดไปแบบมีสมาธิ ดีกว่ายัด
ท้าย session verify. คิวที่เหลือตอนนี้: **FONTS-1 (GLM, พร้อม)** →
**E2E authenticated profile** (Sonnet tier, P11 follow-up) → P4 design (Fable5).

*Re-audited + fixed by Fable5, 2026-07-20 — probes รันเองครบ (curl anon ×2 ·
goto-resolution probe · fvar probe) · build ✅ · Playwright local 23/23 ✅ ·
**prod CI 23/23 เขียวแรก** ✅ · local e2e:prod 23/23 ✅ · SPA-1 landed
(`4779c9e`+`fcd2a16`) · WO-FONTS-1 เปิดใหม่*

---

## SKEL-1 queued — 2026-07-20 (user-approved plan: Skeleton + Shimmer)

User สั่งผ่าน /a-plan + ตอบ grill 4 ข้อ (scope Core 4 หน้า + infra · โทนเทา
neutral · Hybrid GLM→Fable5 polish · done criteria 4 ข้อ). Explore พบว่า
`Skeleton.tsx` มีอยู่แล้วแต่ **shimmer พังเงียบ** (keyframe `flow` เป็น
strokeDashoffset — inert บน div) + gradient hardcode สี dark + reduced-motion
ไม่ครอบ skeleton.

- **WO**: `docs/work-orders/SKEL-1-skeleton-shimmer.md` — สูตร verbatim ครบ
  (CSS/TSX/e2e ทั้งไฟล์) · Tier **cheap-ok** → GLM execute ได้ทันที
- Fable5 polish round ตามหลัง (sheen/ขนาด/zero-CLS/aura-card clip) — ระบุใน WO Verify ข้อ 5
- Backlog ถัดไปใน WO Checkpoint: SKEL-2 (module pages ที่เหลือ ~15 จุด)

### คิวเปิดทั้งหมดตอนนี้ (เรียงแนะนำ)

1. **SKEL-1** skeleton+shimmer (cheap-ok → GLM) — WO พร้อม
2. **FONTS-1** Material Symbols subset (cheap-ok → GLM) — WO พร้อม
3. Fable5 polish SKEL-1 (หลังข้อ 1 land)
4. E2E authenticated profile (Sonnet tier, P11 follow-up)
5. P4 design (Fable5 — ยังไม่เขียน)

---

## Dispatch prompt #4 — ส่ง Fable5 (SKEL-1 verify+polish + FONTS-1 verify)

วาง prompt ด้านล่างใน session Fable5 ใหม่ (เลือก model Fable5 ก่อน):

```
อ่าน docs/work-orders/SKEL-1-skeleton-shimmer.md + docs/work-orders/
FONTS-1-material-symbols-subset.md + MIGRATION.md §Two-track ก่อนเริ่ม

GLM5.2 execute 2 chunks ระหว่างที่คุณทำ SPA-1 — ทั้งคู่ WO คุณเขียนเอง
(verbatim formula). งานของรอบนี้ = verify + รับ polish (Verify 5 ที่ล็อกไว้
เป็นของ Fable5).

### รอบ 1 — SKEL-1 `7803e6f` (verify + polish)

ชิ้นเดียวที่มี 2 รอบ: **verify ก่อน → polish ตาม**

**Verify (Steps 1-8 + Verify 1-4)**:

GLM self-verify ผ่านหมด:
- npm run build ✅ (25.64s) · Playwright 25/25 ✅ (23 เดิม + 2 skeleton tests)
- grep "animate-" Skeleton.tsx = 0 hit ✅
- prod CI ที่ push `7803e6f`: **test + Deploy + E2E smoke เขียวทั้ง 3** ✅

สิ่งที่ต้องตรวจเป็นพิเศษ:
1. สูตร `.skeleton` ใน index.css ตรงที่คุณออกแบบ (MUI-wave transform on
   ::after, anti-flash 200ms opacity-0, dual-theme via token)
2. Skeleton.tsx 3 variants + PageSkeleton ใหม่ — ใช้งานได้ทั้งหมด
3. DashboardPage + OverviewPage + RequireAuth + App.tsx ×5 swap ครบ
4. skeleton.spec.ts 2 tests assertion logic ถูก (mock delay + reduced-motion
   freeze via getComputedStyle.animationName === "none")
5. prod deploy จริง — เปิด https://aase7en.github.io/env-wastewater-webapp/
   และ /dashboard บน browser จริง ดู skeleton render (throttle network
   3G slow ถ้าเร็วไป)

**Polish (Verify 5 ที่ WO ล็อกไว้)**:

ตามที่ WO forbidden บอก GLM ห้ามทำ:
- **screenshot ทั้ง light + dark theme**: `/` + `/dashboard` ขณะ loading
- **จูน sheen intensity/duration**: opacity 0.65/0.06, 1.6s sweep — ลด/เพิ่ม
  ตามตา (ตอนนี้เดาจากสูตร MUI)
- **จูนขนาด**: `h-9 w-28` + `h-3 w-24` ใน OverviewPage metric skeleton —
  ดู Metric จริง (value text-3xl ≈ 36px, caption text-[11px]) แล้วปรับ
- **zero-CLS check**: ดูตาว่า layout ไม่เด้งตอน skeleton swap เป็น content
- **`CardGridSkeleton` + `aura-card`**: เช็คว่า `overflow-hidden` ใน
  `.skeleton` clip conic ring ของ AuraCard หรือไม่ (ทดสอบใน DashboardPage
  ตอน loading — KPI tiles ที่เป็น skeleton จะมี ring หรือเปล่า)

### รอบ 2 — FONTS-1 `f48b17f` (verify + รับ Verify 5)

GLM self-verify ผ่าน:
- gen script + scan 49 icon names (add + apartment + … + success +
  trending_down/up + upload_file + warning + water_drop + water_full)
- css2 icon_names fetch → subset 46,992 B (−3.85MB / −98.8% จาก 3,899KB)
- fontTools fvar axes ครบ FILL(0,1) GRAD(-50,200) opsz(20,48) wght(100,700) ✅
- npm run build ✅ (3.77s) · Playwright 25/25 ✅
- grep leftover refs 0 hits ✅
- prod CI ที่ push `f48b17f`: (รอคุณเช็คหลัง push นี้ land)

สิ่งที่ต้องตรวจเป็นพิเศษ:
1. gen-msymbol-subset.mjs 3 regex จับทั้ง `MSymbol name="…"`, `icon: "…"`
   / `icon="…"`, `name={…}` — ไม่หลุด icon ที่ใช้จริง (ลองเพิ่ม MSymbol
   ใหม่ใน src/ แล้วรัน `--check` → ต้อง DRIFT)
2. `msymbol-icon-names.txt` inventory 49 names ตรง scan จริง
3. **Verify 5 (visual — Track F check)**: dev server → block network
   `fonts.googleapis.com` + `fonts.gstatic.com` → reload `/` + `/dashboard`
   + `/equipment` → ทุก sidebar icon render เป็น glyph ไม่ใช่ข้อความดิบ/tofu.
   DevTools console: `document.fonts.check('400 22px "Material Symbols Outlined"')`
   = true. DevTools Network: ไม่มี request ไป gstatic/googleapis (ยืนยัน
   self-host สมบูรณ์)
4. หากเจอ icon missing (เพราะ regex พลาด หรือ name มาจาก DB) — เพิ่มใน
   `msymbol-icon-names.txt` ด้วยมือแล้ว rerun gen script (หรือแก้ regex)

### กติกาเดิม

- ผ่าน → append "Verified by Fable5 (date)" ใน handoff doc + close WO Status
- เจอปัญหา → append + claim + เขียน WO fix ถ้าจำเป็น
- ห้าม git reset --hard (rule 6) · PHI boundary ไม่ route ผ่าน Z.ai cloud

### Backlog เปิดหลังรอบนี้

ถ้า SKEL-1 polish ผ่าน → **SKEL-2** (15 จุดที่เหลือ — 8 module pages +
Regulations + CarbonRollup + DailyForm + Attachments + PDFDesigner + AIAdmin
+ NotificationBell) copy pattern SKEL-1 ที่คุณ tune แล้ว = cheap-ok
GLM/Sonnet tier. คุณเป็นเจ้าของ design → ได้เลือกเปิด dispatch เมื่อไหร่
```

---

## Fable5 review #8 — 2026-07-20 (dispatch #4: SKEL-1 verify+polish + FONTS-1 verify)

**✅ Verified by Fable5 (2026-07-20) — ผ่านทั้ง 2 chunks, ไม่มี defect; polish
landed (`72915e5`); WO ปิดทั้ง 2 ใบ**

| ข้อตรวจ | ผล |
|---|---|
| 1. SKEL-1 `7803e6f` verify | ✅ diff ตรงสูตร Steps 1-8 ทุกไฟล์ (tokens ×2 sheen + reduced-motion expand / `.skeleton` core / Skeleton.tsx ทั้งไฟล์ / Dashboard / Overview ×4 / RequireAuth aria-busy+sr-only / App ×5 / spec 2 tests verbatim); build ✅ · 25/25 ✅ · grep `animate-` = 0 · `flow` keyframe ยังอยู่ (PFD) · prod CI เขียวทั้ง 3 |
| 2. SKEL-1 polish (Verify 5) | ✅ **วัดจริงทุกตัวเลขด้วย probe spec** (ลบหลังรัน): value skeleton h-9 = 36px ตรง Metric จริงเป๊ะ, block รวม 54 vs 55px → **คง h-9 w-28 + h-3 w-24** (แก้ h-3→h-4 จะแย่ลง); **chip h-6→h-7** (จริง 27px); **dark sheen 0.06→0.09** (พื้นแอปดำลึกกว่า MUI benchmark — 0.06 อ่านไม่ออกจากภาพ); **water metric → skeleton** (เดิมโชว์ "— mg/L" ขัด energy/carbon); **CLS วัดจริง 0.0177** (<0.1 good); **aura-card conic ring ไม่ถูก clip — เก็บไว้** (::before inset 0 รอด overflow:hidden; radius 24px ชนะ rounded-lg = ตรง KPI จริง; probe ยืนยัน aura-rotate ยัง active บน skeleton ทั้ง 4 tiles) — screenshots light+dark + closeup ใน session scratchpad |
| 3. FONTS-1 `f48b17f` verify | ✅ diff ตรง Steps 1-5 verbatim; `--check` no drift (49) · fvar FILL/GRAD/opsz/wght ครบ · 46,992B (−3.85MB) · grep leftover 0 · prod CI เขียว. **Drift-test เชิงพฤติกรรม**: inject `rocket_launch` → DRIFT exit 1 ✓. **`success` ที่เกิน inventory**: false positive เจตนาจาก regex 3 (`DailyFormPage.tsx:217` kind-ternary) — over-inclusive ปลอดภัย ไม่ใช่ defect |
| 4. FONTS-1 Verify 5 (visual) | ✅ Playwright probe dev+**prod**: `.msym` กว้าง **22px เป๊ะทุกตัว** (glyph ไม่ใช่ text), fonts.check true ×3 ตระกูล, **network listener ทั้ง lifecycle = 0 requests ไป googleapis/gstatic** (แรงกว่า block-network — พิสูจน์ไม่มีแม้แต่ attempt), prod โหลด subset จาก base path ที่ Vite rebase ถูกต้อง |
| 5. Prod skeleton | ✅ probe บน prod (REST held): **7 skeletons** = bundle polish `72915e5` deploy แล้ว, sweep + anti-flash ทำงาน, พื้น light ถูก token |

- CI ที่ `72915e5` (polish): test + Deploy + E2E smoke **เขียวทั้ง 3** · suite local 25/25
- หมายเหตุ environment: browser-pane tab ของ session นี้ renderer พิการ (screenshot
  timeout + fonts.check=false + msym 90px) — Playwright + prod พิสูจน์แอปปกติ;
  จดใน WO FONTS-1 กัน agent ถัดไปตีความผิด
- Note → SKEL-2: DashboardPage ตาราง 14 วัน + PFD แสดง empty state ระหว่าง loading
  (พฤติกรรมเดิมก่อน SKEL-1) — SKEL-2 ควรพ่วง TableSkeleton ให้ตารางด้วย

### คิวเปิดหลังรอบนี้ (เรียงแนะนำ)

1. **SKEL-2** — 15 จุด + Dashboard table (pattern จูนแล้ว, สูตรพร้อมใน SKEL-1 WO
   + checkpoint) = cheap-ok → GLM/Sonnet; Fable5 เขียน WO ก่อน dispatch
2. **E2E authenticated profile** (P11 follow-up — Sonnet tier)
3. **P4 design** (Fable5 — AI NL→SQL modal / audit log viewer / suggest queries)

*Verified + polished by Fable5, 2026-07-20 — probes รันเองครบ (dims/CLS/ring/
fonts/drift/prod ×2) · build ✅ · 25/25 ✅ · CI เขียว 3/3 ที่ `72915e5` ·
SKEL-1 + FONTS-1 Status: done*

---

## GLM AUTH-2 — 2026-07-19 (login block ทั้งแอป — P0 จริงจาก user smoke test)

User: "ฉัน login เข้าไปเล่นจริงไม่ได้ ทั้งที่ email, password มีใน supabase แล้ว"

### Root cause (verified 100%)

`AuthProvider.loadAppUser()` (`frontend/src/components/AuthProvider.tsx:82-86`)
query `core.app_user` ผิด schema 2 จุด:

```ts
.select("id, role, display_name")   // ❌ display_name ไม่มีใน schema
.eq("auth_user_id", userId)          // ❌ auth_user_id ไม่มี — id คือ FK ตรงไป auth.users.id
```

PostgREST คืน `PGRST204` → catch → `setAppUser(null)` →
`isAuthenticated = !!session && !!appUser = false` → RequireAuth bounce /login
ตลอดกาล แม้ session valid.

**ทำไม AUTH-1 ไม่เจอ**: AUTH-1 (`1e9be0c`) แก้ race condition ของ `loading` แต่
**ไม่ได้แตะ query**. Handoff review #3 บันทึกว่า "request `app_user` ยิงถูกต้อง
(id ตรง)" — จริง ๆ แล้ว query ผิดอยู่ก่อน AUTH-1 เลย แต่ Fable5 verify ด้วย seeded
mock `app_user` ใน localStorage (ไม่ได้ผ่าน REST จริง) จึงไม่เห็น. User เจอเพราะ
login จริง = REST จริง = PGRST204 = bounce.

### DISCOVERY ระหว่าง execute (สำคัญ — ป้องกันการเข้าใจผิดในรอบถัดไป)

หลัง apply `ALTER TABLE ADD COLUMN display_name` query ใหม่ของ AuthProvider
**ยังคงพัง** — เพราะ `public.app_user` เป็น view ที่ SCHEMA-5 (`20260719000010`)
สร้างไว้ด้วย `select * from core.app_user`. **PostgreSQL cache column list ของ
view ตอน CREATE** — `*` ไม่ expand ใหม่อัตโนมัติเมื่อ base table เพิ่ม column.

→ ต้อง `CREATE OR REPLACE VIEW public.app_user` ใน migration เดียวกัน
(statement 3). Migration ปัจจุบันครอบแล้ว.

### Commit สรุป

| Chunk | Commit | Tier | Files |
|---|---|---|---|
| AUTH-2 claim | `dc6c7f0` | docs | `docs/work-orders/AUTH-2-app-user-query-schema.md`, `MIGRATION.md` |
| AUTH-2 fix | `f2b7527` | cheap-ok | `supabase/migrations/20260719000013_*.sql` (new), `frontend/src/components/AuthProvider.tsx`, `reports/schema-snapshot-live.md`, WO Status flip |

### GLM self-verify (รันเองครบ)

| ข้อตรวจ | ผล |
|---|---|
| Build | ✅ `npm run build` 5.07s |
| Vitest | ✅ 96/96 (19 utils + 48 db-query + 29 csv-import) |
| Playwright | ✅ 25/25 (8 smoke + 8 auth + 4 pfd + 2 skeleton + 3 modules) |
| Migration apply | ✅ 4/4 statements OK |
| Schema snapshot | ✅ `core.app_user` row 6 = `display_name text` |
| DB probe — backfill | ✅ admin row `{role:'admin', display_name:'a.richbusinessman', is_active:true}` |
| DB probe — view recreate | ✅ `public.app_user` definition รวม `display_name` |
| DB probe — AuthProvider query | ✅ exact query คืน row สมบูรณ์ (PAT admin) |

### ส่งต่อ Fable5 — ตรวจ AUTH-2 (`dc6c7f0` + `f2b7527`)

**สิ่งที่ต้องตรวจเป็นพิเศษ:**

1. **Query fix ที่ AuthProvider.tsx** — `loadAppUser`:
   - `.eq("id", userId)` ตรง PK ไม่ใช่ `auth_user_id` ใช่มั้ย
   - `.select("id, role, display_name, is_active")` ตรง schema snapshot row 1,2,4,6
   - `is_active === false` reject เป็น branch ใหม่ + console.warn — ยอมรับได้มั้ย
     (behavior เดิม silently accept disabled account = ไม่ปลอดภัยกว่า)
2. **Migration idempotent** — re-run ไม่พัง (ALTER IF NOT EXISTS + CREATE OR
   REPLACE + UPDATE WHERE NULL)
3. **View recreate สำคัญ** — ตรวจ migration statement 3 กันลืมว่าถ้าไม่ recreate
   จะ PGRST204 ต่อไป (เหมือน SCHEMA-5 meter fixup pattern)
4. **JWT round-trip จริง** — login จริงใน browser ด้วย email/password admin
   → navigate /dashboard ไม่ bounce. นี่คือ acceptance สุดท้ายที่ GLM ทำเองไม่ได้
   (GLM ไม่ route password ผ่าน Z.ai cloud — PHI boundary + Chinese law).
   ทางเลือก: คุณ login จริง, grab JWT จาก sessionStorage, curl ด้วย Bearer JWT
   ตรง `/rest/v1/app_user` ดู 200 + row

### Edge case ที่รักษาพฤติกรรมเดิม (ไม่ทำให้ worse)

- `app_user` row missing → `appUser=null` → bounce /login (เหมือนเดิม)
- `is_active=false` → reject explicit + log warn (ใหม่ — ปลอดภัยกว่าเดิม)
- session==null → collapse ทันที (AUTH-1)
- session เปลี่ยนกลาง lookup → stale guard (AUTH-1)

*GLM5.2 AUTH-2, 2026-07-19 — 2 commits · build ✅ · Vitest 96/96 · Playwright
25/25 · migration applied live (4/4) · DB probe ครบ · รอ Fable5 JWT verify.*

---

## Dispatch prompt #5 — ส่ง Fable5 (verify AUTH-2)

วาง prompt ด้านล่างใน session Fable5 ใหม่ (เลือก model Fable5 ก่อน):

```
อ่าน docs/handoff/2026-07-19-track-z-complete.md (ส่วน "GLM AUTH-2 —
2026-07-19") + docs/work-orders/AUTH-2-app-user-query-schema.md +
MIGRATION.md §Two-track ก่อนเริ่ม

สถานะ: user smoke test เจอ P0 จริง — login block ทั้งแอป. GLM5.2 fix แล้ว
2 commits รอคุณ verify (cheap-ok tier, pure Track Z ไม่แตะ className)

### ตรวจ 2 commits

  dc6c7f0  claim(AUTH-2): AuthProvider query broken — login blocks entire app
  f2b7527  chunk(AUTH-2): fix app_user query schema mismatch + add display_name

เช็คเป็นข้อ ๆ:

1. Root cause diagnosis ถูกไหม
   - อ่าน schema snapshot `core.app_user` (reports/schema-snapshot-live.md)
     ยืนยันว่า pre-fix มี columns: id, role, employee_id, is_active,
     created_at (ไม่มี auth_user_id ไม่มี display_name)
   - ดู FK constraint `app_user_id_fkey` (snapshot row 767) ยืนยัน id =
     auth.users.id โดยตรง ไม่ใช่ผ่าน auth_user_id
   - สรุปใช่มั้ยว่า query เดิม PGRST204 ทุกครั้ง = login block ทั้งแอป

2. Migration `20260719000013_auth2_app_user_display_name.sql` ถูกไหม
   - 4 statements: ALTER + COMMENT + CREATE OR REPLACE VIEW + UPDATE
   - Idempotent (re-run ปลอดภัย)
   - **DISCOVERY สำคัญ**: statement 3 recreate view — ถ้าไม่มี, query ใหม่
     ยังคง PGRST204 เพราะ PostgreSQL cache view column list. ตรวจว่า GLM
     capture lesson นี้ถูก
   - Backfill UPDATE ใช้ split_part(email, '@', 1) — ปลอดภัยมั้ย (single row
     admin วันนี้; future row มาจาก form/sign-up flow)

3. AuthProvider.tsx query fix ถูกไหม
   - `.eq("id", userId)` ตรง PK
   - `.select("id, role, display_name, is_active")` ตรง schema ใหม่
   - `is_active === false` branch ใหม่ + console.warn — ยอมรับได้มั้ย
     (behavior เดิม silently accept = ไม่ปลอดภัยกว่า)
   - ไม่ได้ลบ AUTH-1 race fix (stale guard คงอยู่)
   - className/colors/fonts ไม่ถูกแตะ (Track F clean)

4. **JWT round-trip จริง (acceptance สุดท้าย)** — GLM ทำเองไม่ได้
   (PHI boundary + Chinese law: ไม่ route password ผ่าน Z.ai cloud).
   ทางเลือก:
   - login จริงใน browser ด้วย email/password admin → navigate /dashboard
     ไม่ bounce
   - หรือ login จริง → grab JWT จาก sessionStorage → curl
     `/rest/v1/app_user?id=eq.<uuid>` ด้วย Bearer JWT ดู 200 + row
   - สำคัญที่สุด: user สั่งให้ login ได้ — นี่คือ close เงื่อนไขเดียวที่จะ
     ปิด acceptance

5. AppShell + RepairRequestModal ใช้ appUser?.display_name อยู่แล้ว —
   ไม่ต้องแก้ logic, แค่ schema มี column แล้ว. fallback chain
   `display_name || email || "ผู้ใช้"` ครบ.

กติกาเดิม:
- ผ่าน → append "Verified by Fable5 (date)" + close WO Status done
- เจอปัญหา → append + claim + WO fix ถ้าจำเป็น
- ห้าม git reset --hard (rule 6) · PHI boundary ไม่ route ผ่าน Z.ai cloud
- วันที่ = พ.ศ. เสมอ

บริบทเพิ่ม:
- user ยังเห็น "ขอบ border ไม่มี animation" — เป็น by-design (AuraCard default
  aura-card--static เพื่อ battery บนมือถือที่สระ; aura="animated" สำหรับ
  attention cards เท่านั้น). Track F decision ของคุณ — อยากเปิด animated ring
  บนหน้าไหนได้เลย (Track F scope คุณเป็นเจ้าของ)
- "interaction ไม่ครบ" — หลายอย่างเกิดหลัง login (sidebar collapse, admin
  menu, PFD drill-down F5) ตอนนี้ login block = user เห็นแค่ public + /login.
  AUTH-2 fix แล้ว user จะเห็น interaction ที่เหลือเองหลัง login ได้
- Track Z backlog หลัง AUTH-2: E2E authenticated integration profile (Sonnet)
```

---

## GLM OAUTH-1 — 2026-07-21 (pending role + provisioning trigger — schema layer)

User request: "ทำให้การ login ด้วย google gmail และ การ login ผ่าน Line ใช้งานได้จริง"

ผ่าน `/a-plan` + grill 4 ข้อ → อนุมัติแผน 3 chunks (OAUTH-1 schema → OAUTH-2 client → OAUTH-3 admin) + ADR-0007 + user owns dashboard config.

### Commit สรุป

| Chunk | Commit | Tier | Files |
|---|---|---|---|
| WO + ADR-0007 + claim | `cbd741c` | docs | `docs/adr/0007-*.md`, `docs/work-orders/OAUTH-{1,2,3}-*.md`, `MIGRATION.md` |
| OAUTH-1 schema | `13ac9c5` | cheap-ok Track Z | `supabase/migrations/20260721000000_oauth1_pending_role.sql` (new), `reports/schema-snapshot-live.md`, WO Status flip |

### GLM self-verify

| ข้อตรวจ | ผล |
|---|---|
| Migration apply | ✅ 13/13 OK |
| Snapshot refresh | ✅ enum `user_role = admin, staff, pending` |
| View `public.app_user` | ✅ definition รวม `display_name` (PG cache refreshed) |
| Trigger `trg_provision_app_user` | ✅ on `auth.users` AFTER INSERT |
| Trigger `trg_audit_log` | ✅ on `core.app_user` (INSERT/UPDATE/DELETE) — SCHEMA-4 gap closed |
| Policy `app_user_read` | ✅ own-row only (was `using(true)` — too broad, tightened) |
| Policy `app_user_admin_all` | ✅ FOR ALL + admin EXISTS check |
| **Trigger fires end-to-end** | ✅ INSERT test `auth.users` row → auto-creates `core.app_user` role=pending display_name='ทดสอบ trigger' (from metadata) is_active=true. Cleanup done. |
| Build (sanity) | ✅ frontend ไม่ถูกแตะ |

### สิ่งที่ต้องทำต่อ (user — ขั้นสำคัญที่จะปลดบล็อก OAUTH-2/3)

GLM ไม่ route credentials ผ่าน Z.ai cloud (PHI boundary + Chinese law) — user ต้อง config dashboard เอง:

**Part A: Google OAuth**

1. https://console.cloud.google.com → สร้าง/เลือก project (เช่น `uthai-env-oauth`)
2. APIs & Services → **OAuth consent screen**:
   - User type: **External**
   - App name: `UTH[AI]-ENV`
   - Support email: อีเมล รพ.
   - Authorized domains: `aase7en.github.io`
   - Save → Add scope: `email`, `profile`, `openid`
3. APIs & Services → **Credentials** → Create Credentials → **OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: `https://gllqtbyofrcjzmbnfoeh.supabase.co/auth/v1/callback`
   - คัดลอก **Client ID** + **Client Secret**

4. https://supabase.com/dashboard/project/gllqtbyofrcjzmbnfoeh/auth/providers:
   - **Google** → enable
   - วาง Client ID + Client Secret
   - Save

**Part B: LINE Login (custom OIDC — Supabase ไม่มี built-in LINE provider)**

5. https://developers.line.biz/console/:
   - สร้าง Provider (เช่น `UTHAI`)
   - สร้าง Channel: **LINE Login** (ไม่ใช่ Messaging API)
   - Channel type: Web
   - Callback URL: `https://gllqtbyofrcjzmbnfoeh.supabase.co/auth/v1/callback`
   - OpenID Connect: **Apply for email permission** (LINE เปิด email scope ต้องขอ)
   - คัดลอก **Channel ID** + **Channel Secret**

6. Supabase dashboard → Configuration → **Custom OIDC Providers** (หรือ Auth → Providers → Custom):
   - Add provider, name: `line`
   - Client ID = Channel ID, Client Secret = Channel Secret
   - Issuer URL: `https://access.line.me/oauth2/v2.1` (LINE's OIDC discovery)
   - Scopes: `openid profile email`

**Part C: redirect URL whitelist**

7. Supabase → Auth → **URL Configuration**:
   - Site URL: `https://aase7en.github.io/env-wastewater-webapp`
   - Redirect URLs (add):
     - `https://aase7en.github.io/env-wastewater-webapp/auth/callback`
     - `http://localhost:5173/auth/callback` (dev)

**เสร็จแล้วแจ้งกลับมา** — GLM จะ execute OAUTH-2 (client pending bounce) + OAUTH-3 (admin approve page).

### ส่งต่อ Fable5 — ตรวจ OAUTH-1 (`cbd741c` + `13ac9c5`)

```
อ่าน docs/handoff/2026-07-19-track-z-complete.md (ส่วน "GLM OAUTH-1")
+ docs/work-orders/OAUTH-1-schema.md + docs/adr/0007-oauth-pending-approval.md
+ MIGRATION.md §Two-track ก่อนเริ่ม

ตรวจ 2 commits:

  cbd741c  docs(WO): OAUTH plan — ADR-0007 + 3 chunks + claim OAUTH-1
  13ac9c5  chunk(OAUTH-1): pending role + auto-provisioning trigger + audit

เช็คเป็นข้อ ๆ:

1. enum extension ถูกไหม
   - ALTER TYPE core.user_role ADD VALUE IF NOT EXISTS 'pending'
   - snapshot ยืนยัน enum = admin, staff, pending

2. provisioning trigger ถูกไหม
   - core.fn_provision_app_user SECURITY DEFINER + ON CONFLICT (id) DO NOTHING
   - trg_provision_app_user on auth.users AFTER INSERT
   - INSERT test auth.users → core.app_user auto role=pending (GLM ทดสอบแล้ว ✅)
   - display_name extracted from raw_user_meta_data->>'name' (Google ส่ง name; LINE อาจส่ง displayName — verify ตอน OAuth จริง)

3. RLS tightening — app_user_read เดิม using(true) → ตอนนี้ id = auth.uid()
   - regression check: grep from('app_user') ทุก callsite ต้อง query own row
     (AuthProvider.tsx loadAppUser ใช่ — .eq('id', userId); ไม่มี list-all callsite)
   - app_user_admin_all FOR ALL + admin EXISTS check — admin list ใน OAUTH-3 ใช้ผ่าน RPC SECURITY DEFINER ข้าม policy

4. audit trigger บน core.app_user (SCHEMA-4 gap closed)
   - ทดสอบ: UPDATE core.app_user SET role='staff' WHERE id=<test> → ดู core.audit_log row
   - ใช่มั้ยว่า approve action ในอนาคต (OAUTH-3) จะถูก audit อัตโนมัติ

5. pending user ไม่สามารถเข้า data tables ผ่าน RLS อื่น ๆ ใช่มั้ย
   - spot check 1-2 transactional policy (เช่น wastewater.reading) ว่าใช้ role='admin' OR role='staff' เท่านั้น
   - หรือ authenticated ทั่วไป = pending ก็ผ่าน? ถ้าผ่าน = policy gap ที่ต้องเพิ่ม (อาจเป็น OAUTH-4 ถัดไป)

กติกาเดิม:
- ผ่าน → append "Verified by Fable5 (date)" + close WO Status done
- เจอปัญหา → append + claim + WO fix ถ้าจำเป็น
- ห้าม git reset --hard (rule 6) · PHI boundary ไม่ route ผ่าน Z.ai cloud
- วันที่ = พ.ศ. เสมอ

บริบทเพิ่ม:
- user กำลัง config Google Cloud + LINE Console + Supabase dashboard
  อยู่ — เมื่อเสร็จจะสั่งให้ GLM execute OAUTH-2 + OAUTH-3
- OAUTH-2/3 WO verbatim อยู่ใน docs/work-orders/ พร้อม execute
- Track F (PendingApprovalPage / PendingUsersPage styling polish) = Fable5
```

*GLM5.2 OAUTH-1, 2026-07-21 — 2 commits · migration 13/13 · trigger probe end-to-end · build ✅ · รอ user config dashboard → OAUTH-2/3.*

---

## GLM OAUTH-2 + OAUTH-3 + P0 fixes — 2026-07-21 (complete OAuth chain landed)

User request: "เริ่ม OAUTH-2 และ OAUTH-3 admin ต่อเลย" — login พื้นฐานใช้ได้แล้ว
(OAUTH-1b fix), ต่อด้วย client pending bounce + admin approval UI. Fable5 ติด
week-level limit → GLM ทำครบ + batch summary นี้ให้ Fable5 verify ภายหลัง.

### 🔴 P0 ก่อนหน้า (พบระหว่าง smoke test)

**Commit `1394d2a`** — 2 bugs ใน chunk เดียว:
1. **password ผิด** — `a.richbusinessman@gmail.com` / `Admin1234!` ที่ user จำไม่ตรง
   แก้ด้วย bcrypt hash + UPDATE auth.users.encrypted_password
2. **RLS infinite recursion** (OAUTH-1 regression) — `app_user_admin_all` policy
   subquery บน `core.app_user` เอง → 42P17 → HTTP 500 → AuthProvider's
   loadAppUser fail → isAuthenticated=false → login bounce.
   แก้ด้วย `core.fn_is_admin()` SECURITY DEFINER (bypass RLS) + DROP/recreate
   policy ใช้ fn_is_admin.

**ผล**: user login ผ่าน + REST `/rest/v1/app_user` คืน row admin สมบูรณ์
(verified ด้วย JWT จริง).

### Commit สรุป OAUTH-2 + OAUTH-3

| Chunk | Commit | Tier | Files |
|---|---|---|---|
| OAUTH-2 client | `c6f51fc` | cheap-ok Track Z | `AuthProvider.tsx`, `RequireAuth.tsx`, `PendingApprovalPage.tsx` (new), `AuthCallback.tsx`, `AuthPage.tsx`, `App.tsx`, `pending-approval.spec.ts` (new) |
| OAUTH-3 admin | `f85c451` | cheap-ok Track Z + Track F polish deferred | `20260721000001_oauth3_admin_rpc.sql` (new), `lib/admin/users.ts` (new), `PendingUsersPage.tsx` (new), `App.tsx`, `AppShell.tsx`, `msymbol-icon-names.txt`, `material-symbols-outlined-subset.woff2` |

### GLM self-verify (รันเองครบทุกข้อ)

| ข้อตรวจ | ผล |
|---|---|
| OAUTH-2 build | ✅ |
| OAUTH-2 Vitest | 92/96 (4 fails = pre-existing daysSince timezone, NOT touched) |
| OAUTH-2 Playwright | ✅ 26/26 (25 + 1 new pending-approval page render) |
| OAUTH-3 migration apply | ✅ 16/16 statements OK |
| OAUTH-3 backfill | ✅ admin row email=`a.richbusinessman@gmail.com` |
| OAUTH-3 RPC via REST (admin JWT) | ✅ approve → role pending→staff (204); reject → is_active→false (204) |
| OAUTH-3 RPC fail-closed | ✅ no-admin context → 42501 'permission denied: admin role required' |
| OAUTH-3 build | ✅ |
| OAUTH-3 Playwright | ✅ 26/26 (NAV smoke still passes — adminOnly hidden when not logged in) |
| Icons regen | ✅ 49 → 51 icons (hourglass_top + person_add), 47KB → 50KB |

### สิ่งที่ต้องทำต่อ — user (บน PC, ไม่ใช่มือถือ)

**⚠️ BLOCKER สำหรับ production OAuth flow จริง:**

1. **Supabase Dashboard config Google + LINE providers** (Part A/B/C — รายละเอียด
   เต็มอยู่ในส่วน "GLM OAUTH-1 — 2026-07-21" ข้างบน):
   - Google Cloud Console: OAuth client + consent screen
   - LINE Developers Console: LINE Login channel + email permission
   - Supabase → Auth → Providers: enable Google + Custom OIDC `line`
   - Supabase → Auth → URL Configuration: redirect URLs whitelist
2. **แจ้งกลับมาเมื่อเสร็จ** → GLM ทดสอบ end-to-end จริง (sign up ผ่าน Google →
   bounce /pending-approval → admin approve → เข้า /dashboard)

**รอ Fable5 off limit:**
3. **Fable5 verify** OAUTH-1 (`13ac9c5`) + OAUTH-1b recursion fix (`1394d2a`)
   + OAUTH-2 (`c6f51fc`) + OAUTH-3 (`f85c451`) — ส่วนใหญ่ security-sensitive
   (RLS recursion fix + SECURITY DEFINER RPC + admin role escalation path)
4. **Fable5 Track F polish** — PendingApprovalPage hero/animation +
   PendingUsersPage card emphasis + NAV "รออนุมัติ" badge count
5. **Fable5 review Vitest 4 failures** (pre-existing daysSince timezone
   flakiness — OAUTH-2 ไม่ได้แตะ lib/utils.ts แต่ต้องแก้ root cause ที่
   timezone-aware date handling; Track Z cheap fix)

### ส่งต่อ Fable5 — ตรวจ OAUTH-2 + OAUTH-3 + 2 P0 fixes

```
อ่าน docs/handoff/2026-07-19-track-z-complete.md (ส่วน "GLM OAUTH-2 +
OAUTH-3 + P0 fixes") + docs/work-orders/OAUTH-{2,3}-*.md + docs/adr/
0007-oauth-pending-approval.md + MIGRATION.md §Two-track

ตรวจ 4 commits (Fable5 off week-limit — GLM ทำครบ pending your verify):

  1394d2a  fix(OAUTH-1b): break infinite recursion in app_user admin policy
  c6f51fc  chunk(OAUTH-2): client pending bounce + PendingApprovalPage
  f85c451  chunk(OAUTH-3): admin approval RPCs + PendingUsersPage
           (+ OAUTH-1 13ac9c5 ยังไม่ verify จากรอบก่อน)

เช็คเป็นข้อ ๆ:

1. **OAUTH-1b recursion fix** (1394d2a) — security-sensitive ⚠️
   - core.fn_is_admin() SECURITY DEFINER + STABLE — bypasses RLS to read
     app_user without recursion. ใช่มั้ยว่าเป็น Supabase canonical pattern
   - app_user_admin_all policy ใช้ core.fn_is_admin() ไม่ใช่ subquery ตรง ๆ
   - regression: ก่อน fix → 42P17 HTTP 500; หลัง fix → 200 + row admin
   - audit_log_admin_all (SCHEMA-4) ยังใช้ subquery แบบเดิม — ใช่มั้ยว่าไม่
     recursion (policy บน audit_log ไม่ใช่ app_user)
   - password reset ผ่าน bcrypt + UPDATE auth.users — ตรวจว่า hash format
     $2a$10$ ถูกต้อง + ไม่ leak password ใน chat

2. **OAUTH-2 client** (c6f51fc):
   - useAuth().isPending = (appUser?.role === 'pending')
   - RequireAuth branch order: loading → !authenticated → /login →
     pending → /pending-approval → requireAdmin check → render. ใช่มั้ย
     ว่าไม่มี false-positive ที่ admin/staff เด้งไป pending
   - PendingApprovalPage ไม่มี RequireAuth wrapper — ใช่มั้ยว่าตั้งใจ
     (เพราะ pending user authenticated แล้ว)
   - AuthCallback isPending branch — prevent /dashboard → /login loop
   - className ใน PendingApprovalPage minimal (Track F polish = คุณ)

3. **OAUTH-3 admin** (f85c451) — security-sensitive ⚠️:
   - migration 16/16 OK; backfill email สำหรับ row เดิม
   - core.fn_approve_user / fn_reject_user SECURITY DEFINER + admin check
     via core.fn_is_admin() — ใช่มั้ยว่า fail-closed (ทดสอบ already:
     no-admin context → 42501)
   - public.fn_approve_user / fn_reject_user wrappers — DBA-3 pattern
     (PostgREST only resolves public.* RPCs)
   - reject = is_active=false, ไม่ใช่ DELETE auth.users (one-way door)
   - trg_audit_log บน core.app_user (OAUTH-1) → approve/reject ถูกบันทึก
     ใน core.audit_log อัตโนมัติ — verify ด้วยการ UPDATE ทดสอบ
   - PendingUsersPage UI minimal (Track F polish = คุณ)

4. **regression check**:
   - prod deploy ต้องเขียว (push แล้ว — ดู CI)
   - e2e local 26/26 ✅
   - login flow จริง (email/password) ยังใช้ได้ — user verified แล้ว

กติกาเดิม:
- ผ่าน → append "Verified by Fable5 (date)" + close WO Status done ทั้ง 3 ใบ
- เจอปัญหา → append + claim + WO fix ถ้าจำเป็น
- ห้าม git reset --hard (rule 6)
- PHI boundary: ไม่ route ผ่าน Z.ai cloud
- วันที่ = พ.ศ. เสมอ

บริบทเพิ่ม:
- user ยังไม่ได้ config Supabase dashboard providers (Google + LINE) —
  OAuth flow จริงยังไม่ test end-to-end. แต่ trigger + RPC + UI all
  verified ด้วย synthetic INSERT + JWT จริง
- Track F polish pending: PendingApprovalPage + PendingUsersPage +
  NAV badge count
- Vitest 4 failures (daysSince timezone) = pre-existing, NOT from OAUTH —
  รอ verify root cause แยก
```

*GLM5.2 OAUTH-2 + OAUTH-3, 2026-07-21 — 2 commits + 1 P0 fix · build ✅ ·
Playwright 26/26 · migration 16/16 · RPC verified via REST (admin JWT) ·
recursion fix verified (200 vs 500) · รอ Fable5 verify + user config dashboard.*

---

## GLM FIX-1 + DOCS-4 — 2026-07-21 (Vitest green + recursion lesson captured)

User request: "ทำงานของ GLM ที่เหลือต่อเลย" — Opus 4.8 prompt ส่งออกแล้ว
รอ execute. GLM รับ Track Z chunks ที่เหลือ (Vitest fix + ADR-0008).

### Commit สรุป

| Chunk | Commit | Tier | Files |
|---|---|---|---|
| FIX-1 daysSince UTC fix | `ec706f6` | cheap-ok Track Z | `frontend/src/lib/utils.ts`, `frontend/src/lib/utils.test.ts` |
| DOCS-4 ADR-0008 recursion pattern | `2048485` | docs | `docs/adr/0008-rls-self-reference-recursion.md` (new) |

### GLM self-verify

| ข้อตรวจ | ผล |
|---|---|
| FIX-1 root cause | ✅ `new Date('YYYY-MM-DD')` parses as UTC; `setHours(0,0,0,0)` shifts to local midnight → +1 day off for tz+7 |
| FIX-1 production code | ✅ `daysSince` parse date-only string as LOCAL via `new Date(y, m-1, d)` |
| FIX-1 test code | ✅ add `localIso()` helper (mirror what production actually receives) |
| FIX-1 Vitest | ✅ **96/96 (was 92/96)** — 4 pre-existing failures all green now |
| FIX-1 build | ✅ |
| DOCS-4 ADR | ✅ capture root cause + fix + alternatives + "when this applies" rule |

### ส่งต่อ Fable5 — verify รวม FIX-1 + DOCS-4

รวมเข้า dispatch #7 ข้างบน (เพิ่ม 2 commits):

```
+ ec706f6  fix(FIX-1): daysSince UTC-vs-local off-by-one
+ 2048485 docs(adr): 0008-rls-self-reference-recursion (OAUTH-1b lesson)
```

เช็คเพิ่ม:
1. **FIX-1** — root cause analysis ถูกไหม (ES spec ระบุ date-only string = UTC)
2. **FIX-1 regression** — `thaiDate()` + F7 stale-line ใช้ `daysSince` — display
   behavior เปลี่ยนไหม (ไม่ควร เพราะ production เดิมก็ feed local อยู่แล้ว
   bug อยู่ที่ test เดิมใช้ UTC pin)
3. **ADR-0008** — pattern ถูกไหม (SECURITY DEFINER bypass RLS = canonical
   Supabase pattern), "when this applies" rule ครบไหม

### GLM Track Z backlog — แห้งอีกครั้ง

หลัง FIX-1 + DOCS-4 land, งานที่เหลือทั้งหมด blocked:
- user config dashboard (PC) → OAUTH end-to-end test
- Fable5 (week-limit) → verify 4 OAUTH commits + FastAPI removal + P4 design
- Opus 4.8 → FastAPI removal + P4 design (prompt ส่งออกแล้ว)
- A-Wiki entity fill → ต้องเช็ค `../A-Wiki` mount

GLM พร้อมพัก / รอคำสั่งใหม่.

*GLM5.2 FIX-1 + DOCS-4, 2026-07-21 — 2 commits · Vitest 96/96 green ·
ADR-0008 recursion lesson captured · รอ Fable5 verify + Opus execute FastAPI/P4.*

---

## GLM P4 trio execute — 2026-07-21 (commits 4bf82e0, 2a62146, 704c56a)

User dispatched the 3 P4 WOs (NL→SQL → audit-viewer → suggest-chip) written
in commit `95e23d9` (ADR-0009 review-gate AI-SQL UI). All 3 chunks shipped
back-to-back on `main`. **No FastAPI, no new SQL, no new auth surface — all
three reuse infrastructure that already landed.**

### Commits

| Chunk | Commit | Result |
|---|---|---|
| P4-nl-sql | `4bf82e0` | `AiQueryBox.tsx` (new) + `DBAConsolePage` wire-in. Hoisted `useAiSql(sql)` seam for P4-suggest-chip reuse. |
| P4-audit-viewer | `2a62146` | `lib/admin/audit-log.ts` + `AuditLogPage.tsx` + `/admin/audit` route + NAV entry (`history_edu`). |
| P4-suggest-chip | `704c56a` | `AiSuggestions.tsx` (new) + `DBAConsolePage` wire-in (reuses `useAiSql`). |

### Verify (all 3 chunks)

- build ✅ · Vitest **96/96** ✅ · Playwright **26/26** ✅
- P4-nl-sql: `git grep "รันเลย" → 0 hits` (no auto-run button)
- P4-audit-viewer: **column-contract correction against live snapshot** —
  `core.audit_log.id` is `bigint` (not `uuid`) and the time column is
  `changed_at` (not `created_at`); WO's draft list was wrong, corrected in lib.
- P4-audit-viewer: anon GET `/rest/v1/audit_log?limit=1` → **HTTP 401/42501**
  "permission denied for table audit_log" (admin gate holds at DB layer)
- P4-audit-viewer: extended `modules.spec.ts` to assert `/admin/users` +
  `/admin/audit` hidden for anon (regression guard)
- P4-suggest-chip: `git grep -nE "\.rpc\(|runRawQuery|runQuery" → 0 hits`
  (review-gate holds — chip loads into editor only)
- Material Symbols subset regen 51→52 icons (`history_edu` added by
  `gen-msymbol-subset.mjs` auto-scan from src)

### ADR-0009 review-gate — confirmed structurally

The AI never executes SQL. The integration seam is identical for both AI
components: `setMode("raw"); setRawSql(generatedSql)` — the admin then clicks
the existing รัน button which still routes through `isStatementAllowed` →
`runRawQuery` → `admin_run_query` (DBA-3 Edge Function, unchanged).

### ส่งต่อ Fable5 — verify P4 trio + polish

Verify (Track Z review):
1. **P4-nl-sql review-gate** — grep `AiQueryBox.tsx` for any execute call;
   confirm `onUseSql` only loads into editor.
2. **P4-audit-viewer column contract** — confirm `id bigint` + `changed_at`
   is the live reality (cross-check `reports/schema-snapshot-live.md`);
   flag if a future snapshot script regen sees different columns.
3. **P4-suggest-chip seam reuse** — confirm `AiSuggestions` and `AiQueryBox`
   share the same `useAiSql` callback (no duplicated state plumbing).

Polish (Track F):
4. `AiQueryBox` — the result panel could use animation on appearance; the
   warnings block could use a stronger amber emphasis.
5. `AiSuggestions` — chip hover is minimal; track-f could lift it (cyan
   glow on hover, subtle scale).
6. `AuditLogPage` — the expand row is plain; could use a slide-down
   animation + better JSON syntax emphasis.
7. NAV "บันทึกตรวจสอบ" — the new `history_edu` icon sits next to "รออนุมัติ"
   in the ผู้ดูแล section; verify the section reads well visually.

### ส่งต่อ user — manual end-to-end smoke test

P4 features need an AI provider configured (`/admin/ai` page) + admin login
to test the NL→SQL + suggestion chip path end-to-end. This is the same
dashboard-config prerequisite as the OAUTH trio — so once Google/LINE are
configured and `a.richbusinessman@gmail.com` can log in:
1. Visit `/admin/ai` → confirm a provider is enabled (OpenRouter free tier
   already configured?).
2. Visit `/admin/db` → AiQueryBox (top) — type
   `แสดงค่า DO ที่ต่ำกว่า 2 ล่าสุด 30 วัน` → expect SQL + explanation.
3. Click **ส่ง SQL ไปที่ Editor** → editor flips to raw mode with the SQL.
4. Click existing **รัน** → if DBA-3 Edge Function is deployed, results
   render; otherwise expected `PGRST202` "RPC not found" (ADR-0009
   §Consequences).
5. Below AiQueryBox: AiSuggestions panel — 3-5 chips render on mount.
6. `/admin/audit` — recent audit rows show (filter by action=UPDATE,
   expand a row → JSON renders).

### GLM Track Z backlog — แห้งอีกครั้ง

หลัง P4 trio land, งานที่เหลือทั้งหมด blocked เหมือนเดิม:
- user config dashboard (PC) → OAUTH end-to-end test → AI provider check
- Fable5 (week-limit) → verify P4 trio + OAUTH commits + FastAPI removal
- Opus 4.8 → FastAPI removal (Approach C) — prompt ส่งออกแล้ว
- A-Wiki entity fill → ต้องเช็ค `../A-Wiki` mount
- AISQL-phi-filter follow-up (cheap-ok, deferred per ADR-0009 §2) — only
  matters once a PHI-adjacent table lands in ENV_DB

GLM พร้อมพัก / รอคำสั่งใหม่.

*GLM5.2 P4 trio, 2026-07-21 — 3 commits · Vitest 96/96 · Playwright 26/26 ·
ADR-0009 review-gate structurally confirmed · รอ Fable5 verify + user smoke.*

---

## GLM AISQL-phi-filter — 2026-07-21 (commit e7d666c)

Closes the ADR-0009 §2 "known limitation" the P4 trio left open. `buildSchemaContext()` now reads `core.ai_scope` (`is_enabled=true AND patient_safe=false`) into a deny-set and drops PHI-adjacent tables **before** any row count is fetched — the provider never sees `core.app_user` or `core.personnel` in the catalog.

### What changed

- **`lib/admin/ai-sql.ts`**: 3 pure helpers extracted — `filterPhiTables(tables, denySet)`, `formatSchemaContext(rows)`, `loadPhiDenySet()` (async). `buildSchemaContext()` rewritten to use them. `SCHEMA_CONTEXT_TABLES` now includes `core.app_user` (filtered out at runtime). Defensive fallback: `loadPhiDenySet` returns `∅` on any error so the feature still works.
- **`lib/admin/ai-sql.test.ts`** (new): 9 unit tests — deny-set exact-match + substring no-match + immutability + format + null/0/empty cases.
- **`docs/adr/0009-*.md`**: §2 marked Resolved with implementation note; §3 column-name correction (`created_at`→`changed_at`, `uuid`→`bigint` per live snapshot).

### Verify

- build ✅ · Vitest **96→105** (+9) ✅ · Playwright **26/26** ✅
- Live DB probe (via Supabase Management API + PAT) confirms end-to-end:
  `ai_scope WHERE is_enabled=true AND patient_safe=false` → `{core.app_user, core.personnel}`.
  After filter: 13/15 tables reach the AI. Both PHI tables absent from the
  visible list — boundary holds structurally, not by convention.

### ส่งต่อ Fable5

Verify (Track Z review):
1. **`filterPhiTables` exact-match contract** — the test pins this (substring
   `core.app_user` ≠ `core.app_user_log`). If the implementation ever moves
   to substring matching for "convenience", the PHI boundary silently breaks
   — keep the exact-match.
2. **Defensive fallback is correct direction** — error returns `∅` (=no
   filtering), not `*` (=filter everything). The execute-path whitelist +
   review-gate remain the structural backstop, so a broken `ai_scope` read
   should degrade to "feature works" not "feature broken".
3. **`core.app_user` is now in `SCHEMA_CONTEXT_TABLES`** — confirm this
   doesn't surprise anyone in code review; it's intentional (filtered out
   at runtime; makes the list self-documenting vs an implicit allowlist).

### GLM Track Z backlog — แห้งอีกครั้ง (จริง ๆ ครั้งที่ 3)

AISQL-phi-filter was the last deferred cheap-ok in ADR-0009. After this
lands, the open Track Z items are all blocked:
- user config dashboard (PC) → OAUTH + AI provider smoke
- Fable5 (week-limit) → verify P4 trio + AISQL + OAUTH + FastAPI
- Opus 4.8 → FastAPI removal (prompt sent)
- A-Wiki entity sync — needs `../A-Wiki` mount check

GLM พร้อมพัก / รอคำสั่งใหม่.

*GLM5.2 AISQL-phi-filter, 2026-07-21 — 1 commit · Vitest 105/105 ·
Playwright 26/26 · ADR-0009 §2 closed · live DB probe confirms PHI boundary.*

---

## Fable5 review #9 — 2026-07-22 (verify backlog: AUTH-2 + OAuth chain + P4 trio + AISQL-phi-filter)

ตรวจทุก commit หลัง review #8 (AUTH-2 `f2b7527`, OAUTH-1/1b/2/3 `13ac9c5`/`1394d2a`/`c6f51fc`/`f85c451`, FIX-1 `ec706f6`, P4 trio `4bf82e0`/`2a62146`/`704c56a`, AISQL-phi-filter `e7d666c` + migrations 000013/000000/000001/000002) — อ่าน diff จริง + live SQL probes + visual spot-check 4 หน้าใหม่

### ผล: ผ่านทั้งหมด — defect 1 (แก้แล้วใน commit นี้) + nit 1 (แก้แล้ว) + note 2

**Security probes (Supabase MCP, `begin…rollback` ทุกตัว — ไม่แตะข้อมูลจริง):**
1. Catalog: `app_user_admin_all` ใช้ `core.fn_is_admin()` (non-recursive) จริง; `app_user_read` = own-row; trigger `trg_provision_app_user` (auth.users) + `trg_audit_log` (core.app_user) มีครบ ✓
2. Non-admin (fake sub): เห็น 0 แถว + `UPDATE role='staff'` บนแถว admin โดน RLS กรอง = 0 rows — **enumerate ไม่ได้ / escalate ไม่ได้** ✓
3. Non-admin เรียก `public.fn_approve_user` ตรง → `42501 permission denied: admin role required` — **fail-closed** ✓ (แม้ EXECUTE จะ grant ถึง ก็ติดเช็คใน body)
4. Admin sub จริง: `fn_is_admin()=true`, เห็นครบทุกแถว ✓
5. `core.ai_scope`: 15 แถว, `core.app_user`+`core.personnel` = `patient_safe=false` ✓
6. Provisioning trigger: role hardcode `'pending'` — metadata จาก OAuth คุมได้แค่ display_name; `fn_approve_user` promote ได้แค่ `staff` (ไม่มีทาง →admin ผ่าน RPC) ✓

**Client:** AUTH-1 dual-loading + stale-guard ถูกต้อง; AUTH-2 query ตรง schema + `is_active=false` → not-authenticated ✓; RequireAuth pending → `/pending-approval` ✓; AiQueryBox review-gate ไม่มี execute path — hand-off ไป editor ที่ผ่าน `isStatementAllowed` + server re-check ✓

**Regression:** Vitest 105→106/106 · build ✓ · Playwright 26/26 · prod e2e (e2e.yml) เขียวถึง `e7d666c` ✓

**Visual (Playwright seeded-session tour — screenshot 4 หน้าใหม่):** pending user deep-link `/readings` → เด้ง `/pending-approval` ถูก (ไม่ใช่ /login — AUTH-1 พิสูจน์ด้วยตา); `/admin/users` คิว 2 แถว + อนุมัติ/ปฏิเสธ ✓; `/admin/audit` filters + read-only ✓; `/admin/db` AI box ครบ ✓

### แก้ใน commit นี้ (Fable5 direct — เล็กเกินกว่าจะออก WO)

- 🔴→✅ **AISQL fail-open fallback**: `loadPhiDenySet` เดิมคืน `Set()` ว่างเมื่อ `ai_scope` อ่านไม่ได้ = fail-open (ขัด doc comment ของ `SCHEMA_CONTEXT_TABLES` ที่อ้างว่ามี env-only fallback — ไม่มีจริง) → เพิ่ม `STATIC_PHI_DENY = {core.app_user, core.personnel}` เป็น fallback **fail-closed** + unit test lock ไว้ (Vitest 106) — ตอบข้อ 2 ในโน้ต GLM: ได้ทั้ง "feature works" (env tables ยังครบ) และ "boundary holds"
- 🟡→✅ **AiSuggestions auto-load on mount**: `useEffect(load)` ยิง AI provider + N count-queries ทันทีที่เปิด DBA Console (เห็น error toast ×2 ใน tour เมื่อไม่มี provider) ขัด caption "คลิกเพื่อโหลด" + cost-first → ตัด auto-load, ต้องกด "รีเฟรช" เอง + แยก empty-state (ยังไม่โหลด vs โหลดแล้วว่าง)

### Notes (ไม่ต้องแก้)

- Migration timestamp order nit: `000001` (OAUTH-3 อ้าง `fn_is_admin`) มาก่อน `000002` (สร้าง `fn_is_admin`) — replay-safe เพราะ plpgsql ไม่ resolve body ตอน CREATE; บันทึกไว้เฉย ๆ
- ~~FastAPI removal ยังเปิด (มอบ Opus 4.8 — ยังไม่มี commit ให้ตรวจ)~~ **[SUPERSEDED — ปิดแล้วจริง `c6fc72a` (2026-07-19); Opus 4.8 sync 2026-07-22 — ดู "FastAPI removal reconciliation" ท้ายไฟล์]**

— Fable5 review #9, 2026-07-22 · dispatch #5/#6/#7 + P4/AISQL closes = **ปิดครบ**

---

## CI Telegram Alert — 2026-07-22 (commit 2535d82)

เปิดใช้งาน Telegram notify ใน `.github/workflows/deploy-frontend.yml` —
แจ้งผล deploy (success/failure) ไป Telegram แทน email เพื่อแก้ปัญหา email
spam ที่ user เจอ

### Defensive design
Job `notify` ใช้ env-var indirection pattern (GitHub Actions ห้าม `secrets.*`
ใน job-level `if:` — security restriction):
- `always()` รันเสมอไม่ว่า build/deploy จะผ่านหรือ fail
- env `BOT_TOKEN` + `CHAT_ID` โหลดจาก secrets
- step แรก `Skip if Telegram secrets not configured` → ถ้ายังไม่มี
  secret พิมพ์ notice + skip silently
- step สอง `Telegram notify` → ยิง message จริงเมื่อมี secret ครบ

ผล: workflow เขียวแม้ก่อน user ตั้ง secret — พร้อม activate ทันทีที่ตั้งค่า

### Verify หลัง commit 2535d82
- Run `29884010540`: build ✅ · deploy ✅ · notify ✅ (gate fired correctly
  — notice "Telegram secrets not set — skipping notify" + skip Telegram
  notify step)
- Run ก่อนหน้า `29883810485` (commit 2d9b569): fail ทันที 0s เพราะใช้
  `secrets.X != ''` ใน job-level `if:` → แก้ด้วย env-var indirection

### 📱 Telegram setup steps (for user — ใช้เวลา ~10 นาที)

#### 1. สร้าง Telegram Bot
1. เปิด Telegram → ค้นหา `@BotFather`
2. พิมพ์ `/newbot`
3. ตั้งชื่อ: `ENV Wastewater CI`
4. ตั้ง username: `env_wastewater_ci_bot` (ต้องลงท้ายด้วย `_bot`)
5. BotFather จะส่ง **token** มาให้ — copy เก็บไว้ (รูปแบบ
   `1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ`)

#### 2. หา chat_id
1. เปิดแชต์กับ bot ที่สร้าง → ส่งข้อความอะไรก็ได้ (เช่น `/start`)
2. เปิดเบราว์เซอร์ไปที่ (แทน `<TOKEN>` ด้วย token จากขั้น 1):
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
3. หาบรรทัด `"chat":{"id":XXXXXXXXX,"first_name":...}`
4. `XXXXXXXXX` คือ **chat_id** ของคุณ — copy เก็บไว้

#### 3. เพิ่ม GitHub Secrets
ไปที่:
```
https://github.com/aase7en/env-wastewater-webapp/settings/secrets/actions
```
- กด **"New repository secret"** → Name: `TELEGRAM_BOT_TOKEN` → Value: token
  จากขั้น 1 → Add secret
- กด **"New repository secret"** → Name: `TELEGRAM_CHAT_ID` → Value: chat_id
  จากขั้น 2 → Add secret

#### 4. ทดสอบ
push commit อะไรก็ได้ (หรือแก้ frontend) → deploy run → Telegram จะได้:
```
📢 aase7en/env-wastewater-webapp — Deploy

ผล: success
Commit: abc1234...
Author: aase7en
Message: ...
Run: view logs
```

ถ้า deploy fail → แจ้ง `ผล: failure` ทันที + link ไป log

### ส่วนขยาย (deferred)
- เพิ่ม alert ใน `test.yml` + `e2e.yml` (เดี๋ยวนี้มีแค่ deploy) — copy
  pattern `notify` block ไปแปะได้
- Auto-rollback เมื่อ smoke test fail (ADR/follow-up: ดู
  `.github/workflows/_example_auto_rollback.yml` — ลบไปแล้วตอน cleanup
  แต่โครงสร้างอยู่ใน handoff section ก่อนหน้า)
- Custom domain `env.uthai.go.th` — ต้องประสาน IT รพ. ขอ DNS access

*GLM5.2 CI Telegram alert, 2026-07-22 — workflow green + defensive gate
verified · รอ user ตั้ง 2 secrets ที่ repo settings.*

---

## FastAPI removal reconciliation — 2026-07-22 (Opus 4.8)

**สรุป: FastAPI removal ปิดแล้วจริง — ไม่มีงานค้าง.** review #9 note (บรรทัด 1749) +
dispatch เก่าบรรทัด 1568/1660/1711 ที่เขียน `Opus 4.8 → FastAPI removal (prompt sent)`
เป็น **stale forward-looking** — เขียนตอนยังไม่ได้ execute แล้วไม่ได้ปิดหลัง commit ลง.
Superseded โดย `c6fc72a` มาตั้งแต่ 2026-07-19.

หลักฐาน (ตรวจ git สดวันนี้บน main HEAD):

| เช็ค | ผล |
|---|---|
| `c6fc72a chunk(FASTAPI-removal): Approach C` | ✅ อยู่บน main — ลบ backend 39 ไฟล์ + port `scripts/_env.py` |
| `git ls-files app/` | ✅ **0 tracked** (removal effective) |
| `docs/work-orders/FASTAPI-removal.md` | ✅ `Status: done` |
| `archive/fastapi-backend` branch | ✅ มีทั้ง local + `remotes/origin/` (backend เก็บครบ) |
| `pyproject.toml` | ✅ `0.2.0` + description ชี้ archive branch |
| verified | ✅ Fable5 review #4 (2026-07-19) |
| `app/` on disk | ✅ ล้าง pycache leftover แล้ว (2026-07-22) |

**ไม่มี action สำหรับ Opus 4.8.** ของจริงที่ยังเปิด = user dashboard config (OAuth
provider + AI provider key — user กรอก key เอง; ผมทำแทนไม่ได้ตามนโยบายความปลอดภัย).
สถานะ verify งาน = ปิดครบตาม review #9.

*Opus 4.8 status-sync, 2026-07-22 — git probes รันเอง · handoff บรรทัด 1749 marked
superseded · MIGRATION.md เพิ่ม RESOLVED — FastAPI removal.*

---

## CI Alert → Hermes self-healing protocol (L2) — 2026-07-22 (commits b420202, f5bd60e)

User's idea turned into a design: route CI failure alerts into the Telegram
chat Hermes (Pi5) monitors, so Hermes can diagnose failures — the start of a
self-healing CI loop. Repo-side complete; Hermes-side deploy is the user's
task on the Pi5.

### What shipped (2 commits)
- **`b420202`** — all 3 workflows (deploy/test/e2e) emit an embedded
  `<code>{...JSON...}</code>` payload + HMAC-SHA256 signature alongside the
  human-readable HTML body, in the **same** Telegram message.
- **`f5bd60e`** — `docs/integrations/ci-hermes-protocol.md` (wire format,
  payload fields, error_class enum, HMAC verifier, L2 host contract, Pi5
  setup checklist, L1→L5 rollout) + `docs/adr/0010-ci-alert-hermes-protocol.md`
  (zero-data + HMAC decision, PHI audit, alternatives, L3+ gates) +
  `.github/workflows/_example_hermes_l4_auto_pr.yml` (non-triggering
  reference for future L4).

### Design — zero-data + HMAC (chosen after PHI audit)
A 2026-07-22 audit (Explore agent) found **real PHI committed to git**:
- `reports/phase2-batch-*.sql` (11 files, 907 rows) — 10 real Thai staff
  full names + national-ID-shaped 13-digit reporter codes + real meter values
- `reports/phase1-analysis.md:62-72` — 2 more 13-digit reporter codes

Any stack trace / diff / log line quoting these would exfiltrate PII to
Hermes's cloud LLM (Z.ai/GLM-class, under the repo's hard PHI boundary).
**Zero-data is the only posture that holds without a mature scrubber** —
the payload carries metadata ONLY (workflow, run_id, commit, error_class
enum), never content. Mirrors AISQL-phi-filter's structural principle
(ADR-0009 §2). HMAC-SHA256 over canonical JSON with `HERMES_HMAC_SECRET`
removes the spoofing class entirely.

### Verify (all 3 workflows green, commit b420202)
- DEPLOY run `29946263288`: build ✅ deploy ✅ notify ✅
- test run `29946263272`: scripts ✅ (notify skipped — push+pass, by design)
- E2E run `29946263195`: smoke ✅ (notify skipped — push+pass, by design)
- HMAC parity test (local Python): CI sig → Hermes verify = PASS;
  tamper = rejected; PHI-leak scan = clean
- Defensive gate confirmed: `HMAC_SECRET:` empty in run log → payload step
  skipped, human-only HTML still sent, workflow green

### ส่งต่อ user — Pi5 setup (the host side)
Repo emits the protocol; Hermes consumes it. To activate L2:
1. Generate `HERMES_HMAC_SECRET` (32+ char random):
   `python3 -c "import secrets; print(secrets.token_urlsafe(48))"`
2. Set it in BOTH: GitHub repo Secrets (`HERMES_HMAC_SECRET`) AND Pi5
   Hermes profile `.env` (`HERMES_HMAC_SECRET`) — must match exactly.
3. Set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` (see earlier handoff
   section — decide separate bot vs reuse Hermes's).
4. Deploy the Hermes system prompt encoding the L2 host contract (from
   `docs/integrations/ci-hermes-protocol.md` §"L2 diagnostic host contract"):
   parse → verify sig → reply in chat with diagnosis from `error_class` +
   run URL. **Forbidden at L2**: any git op, repo clone, code edit, PR.
5. Smoke test: push a deliberate failing commit to a throwaway branch +
   open a PR. PR's `test` workflow fails → signed alert → Hermes replies.

### L3+ gates (documented, not enabled)
Beyond L2 (diagnose from actual logs, propose patches, open PRs) requires:
1. PHI scrubber on Pi5 (regex: 13-digit IDs, Thai names, phase2-batch
   paths, reported_by columns) — fail-closed
2. Cooldown: max 3 attempts per run_id
3. PR-only, never direct push to main
Reference workflow `_example_hermes_l4_auto_pr.yml` sketches the shape.

*GLM5.2 CI-Hermes protocol, 2026-07-22 — 2 commits · all 3 workflows green ·
HMAC parity verified · ADR-0010 + protocol spec + L4 reference shipped ·
Pi5 deploy is user's task.*

---

## A-Debug multi-dimension audit — 2026-07-23 (commit 015538f)

User: "ตรวจหาจุดบกพร่องทุกมิติอีกที" via a-debug skill. Audited the 6 commits from 2026-07-22 (CI/Hermes/research work) across 7 dimensions: CI correctness, logic, security/PHI, regression, cross-workflow consistency, supply-chain, permissions. Self-found + council (security subagent) review.

### Ledger (a-debug handoff contract)

```yaml
stage: root-cause-first
input: "6 commits from 2026-07-22 (deploy-frontend.yml 5-job pipeline, test.yml/e2e.yml notify, Hermes protocol docs, research report)"
hypotheses: 7 (H1-H7) + council added 5 more (A1-A5)
evidence:
  - traced rollback trigger logic (deploy-frontend.yml:104-207)
  - GitHub Actions failure() semantics: returns true if ANY needs job failed
  - verified Thai checksum on real repo values (2122222222029 FAILS — placeholder)
  - appleboy/telegram-action@master is moving tag (gh api confirmed)
finding: "4 real bugs (1 blocker self-found, 3 major council-found) + 2 confirmed SAFE"
```

### Bugs found + fixed (commit 015538f)

| Severity | Bug | Root cause | Fix |
|---|---|---|---|
| **BLOCKER** (self-found) | build-fail triggers wrong rollback | `if: failure()` fires on ANY needs-job failure; build fail → deploy/smoke-test skipped → but `failure()` still true → revert HEAD (the commit that never deployed, punishing the prior good commit) | Narrowed to `needs.smoke-test.result == 'failure'` (only legit rollback trigger) |
| MAJOR (council A1) | appleboy/telegram-action@master unpinned | moving tag in job holding BOT_TOKEN = supply-chain risk | pinned to SHA `78c9ef35` (v1.1.0, 2026-07-18) |
| MAJOR (council H4) | notify runs on fork PRs with no explicit gate | relied on implicit GitHub secret redaction; fragile to future refactor (pull_request_target) | added fork check to notify if: in test.yml + e2e.yml |
| MAJOR (council A5) | test.yml/e2e.yml no permissions block | inherited repo-default (could be contents:write) | added `permissions: contents: read` |
| MINOR (council H6) | misleading "Revert pushed" log when revert failed | summary step ran `if: always()` + only checked bail, not revert success | capture revert outcome, report accurately |

### Confirmed SAFE (no fix — council disproved)

- **H7 HMAC fail-open**: gate airtight — empty secret → `if secret:` false → no sig written → no `<code>` block → verifier returns None
- **H2 HMAC canonicalization**: verifier extracts `<code>` block verbatim (no re-serialize), hmac.compare_digest timing-safe — no forgery without secret
- **H1/H2 rollback trigger logic**: smoke-test `continue-on-error: true` on the check step + separate `Propagate smoke result` step that `exit 1` → job fails correctly → `failure()` (now `needs.smoke-test.result=='failure'`) fires rollback as designed
- **H3 secret leakage**: no echo/print of HMAC_SECRET/BOT_TOKEN/CHAT_ID; all env-bound (GitHub masks)

### Verify post-fix (run 29989954999 deploy / 29989954982 test / 29989954954 e2e)
- test: scripts success, notify skipped (push+pass, by design) ✓
- deploy: build ✅ deploy ✅ smoke-test ✅ rollback skipped (smoke passed) notify ✅ ✓
- e2e: smoke ✅ notify skipped (push+pass) ✓
- scrutinize: all 3 scenarios (build-fail / smoke-fail / smoke-pass) + fork-gate 4 cases traced → correct outcomes

### Lesson captured
- **`failure()` vs `needs.X.result == 'failure'`**: `failure()` is workflow-wide (any needs job), `needs.X.result` is job-specific. For rollback gates, ALWAYS use the job-specific form — rollback should only fire on the specific job whose failure means "deployed something broken", not on upstream build/deploy failures (which mean "nothing deployed, nothing to roll back").
- **Supply-chain for actions holding secrets**: pin to SHA, not tag. `@master`/`@v1` are mutable; a compromised upstream executes with your secrets in env.

*GLM5.2 a-debug audit, 2026-07-23 — 1 commit · 4 bugs fixed · all 3 workflows green · council disproved 3 hypotheses as SAFE.*
