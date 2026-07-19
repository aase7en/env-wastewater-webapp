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
