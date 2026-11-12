# ENV-PERF-001 — Top-5 performance slice: lazy routes, N+1 fix, atomic reading RPC, form-save UX, consistency sweep (Work Order)

สถานะ: **IN PROGRESS — D4 เสร็จ, implementation PR เปิดรอรีวิวอิสระ
(STOP ที่ REVIEW_REQUESTED — ห้าม merge โดย implementer)** claim
`ENV-PERF-001-C1` generation 1; implementation base
`4b4a4820e1ba39317bd8e873d58b694220d7faa3` = merge SHA ของ transition PR
#170 (main หลัง transition รีวิวแล้ว merge 12 พฤศจิกายน 2569); สาขา implementation:
`feat/env-perf-001` ใน worktree ที่จดทะเบียน
`/Volumes/MAC_WORK/DevWorkspace/Github/_worktrees/env-perf-001-20261112`
ใบเสร็จถาวรอยู่ใน `docs/ai/handoffs/ENV-PERF-001-GLM.md` (รายงาน audit
ฝัง VERBATIM เป็นหลักฐาน D0; checkpoints D2/D3/D4 ต่อท้าย)
Task: `ENV-PERF-001` (task row ใหม่ — ตรวจความซ้ำของ task_id กับทะเบียนแล้ว
ไม่มี OWNERSHIP_CONFLICT; claim id คือ `ENV-PERF-001-C1`)

## เป้าหมาย — 5 รายการจาก audit ประสิทธิภาพ 2026-11-12 (READ-ONLY)

ทุกรายการอิงหลักฐาน file:line จากรายงาน audit (VERBATIM ใน handoff D0) และ
**ตรวจซ้ำแล้วว่ามีจริง ณ base `3875bc68`** ก่อนเขียน WO นี้

### 1. Lazy-load หน้า eager 24 หน้าใน App.tsx — impact สูง / effort ต่ำ

- หลักฐาน: `frontend/src/App.tsx:9-32` import ตรง 24 หน้า; มี pattern
  lazy+PageSkeleton อยู่แล้วที่ `App.tsx:33-69`
- งาน: เปลี่ยน 24 import นั้นเป็น `lazy(() => import(...))` + PageSkeleton
  ตาม pattern เดิมทุกประการ — **พฤติกรรม auth-guard/routing ต้องเท่าเดิม
  (byte-equivalent semantics)** ห้ามแตะโครงสร้าง route/RequireAuth
- คาดหวัง: main bundle ~808 KB → ~450-500 KB (วัดจริงด้วย `vite build`
  ที่ D4 — ไม่ใช่ assertion ของ D2)
- ตรวจ: ไม่มี skeleton regression บนมือถือ (360/390/430) ที่ e2e เดิมครอบ

### 2. แก้ N+1 ใน useSensorFeed — impact กลาง / effort ต่ำ

- หลักฐาน: `frontend/src/lib/use-sensor-feed.ts:73-83` —
  `Promise.all(sensors.map(...))` ยิง 1 query ต่อ 1 เซนเซอร์
- งาน: query เดียว `.in("sensor_id", ids)` + เรียง `taken_at DESC` + limit
  รวม แล้ว group ต่อเซนเซอร์ฝั่ง client — **คงพฤติกรรม realtime incremental
  cache เดิม** (index `idx_sensor_reading_sensor_time` มีอยู่แล้ว
  snapshot:883 — ห้ามเพิ่ม index ใหม่)

### 3. createReading → RPC atomic `fn_create_reading(p_payload jsonb)` — impact กลาง / effort กลาง

- หลักฐาน: `frontend/src/lib/supabase-queries.ts:194-247` — (1) insert
  carbon_reading (`:202`), (2) insert reading (`:224`), (3) insert
  repair_request (`:235`) — 3 round trips ต่อเนื่อง และความล้มเหลวของขั้น (3)
  **ถูกกลืน** ที่ `:240-243` (console.warn) = ไม่ atomic + ไม่ honest
- งาน: สร้าง Postgres function `fn_create_reading(p_payload jsonb)` ทำทั้ง 3
  ขั้นใน transaction เดียว คืน reading detail — call site เปลี่ยนไปเรียก RPC
  และ **ความล้มเหลวของขั้น (3) ต้องโผล่ออกมาจริง** (surface failure
  honestly) ไม่กลืนอีก
- **DEVIATION จดไว้ตรงไปตรงมา**: คำสั่ง transition ระบุ `db/migrations/` แต่
  ให้ยึด naming convention ของ repo เป็นหลัก — repo **ไม่มีไดเรกทอรี `db/`**
  migration ทุกไฟล์รวมทั้งคู่ของ Building C1 อยู่ที่ `supabase/migrations/`
  ตามรูปแบบ `YYYYMMDDNNNNNN_name.sql` → ไฟล์ใหม่คือ
  `supabase/migrations/20261112000001_fn_create_reading.sql` (ไฟล์เดียว)
- กฎการ apply (ผูกตาย):
  - apply กับ **ENV_DB เท่านั้น** ผ่าน `scripts/apply_migration_api.py`
    (`SUPABASE_ACCESS_TOKEN` จาก Drive env — ห้าม commit/print token)
  - **preflight ศูนย์การแก้ข้อมูล (zero-data-mutation)** ก่อน apply เสมอ:
    ตรวจว่า script ที่จะรันมีแต่ DDL (CREATE FUNCTION) ไม่มี INSERT/UPDATE/
    DELETE/TRUNCATE ต่อข้อมูลแถว
  - **SQL rollback เขียนไว้ใน WO นี้** (หมวด rollback ด้านล่าง)
  - **ห้ามแตะข้อมูลแถวใด ๆ** (schema-only) — ห้ามแตะ RLS policy ใด ๆ
  - function ต้องบังคับ gate บทบาทเดียวกับ RLS เดิม ผ่าน pattern
    `core.fn_is_staff_or_admin()` (ตรวจชื่อ function จริงจาก snapshot/
    migrations ณ ฐานก่อนเขียน SQL — ถ้าชื่อจริงต่างจากนี้ ให้ยึดชื่อจริง
    และจดใน handoff)

### 4. Form-save perceived latency — impact กลาง (รู้สึก) / effort ต่ำ

- หลักฐาน: `frontend/src/pages/DailyFormPage.tsx:213-239` — navigate หลัง
  success หน่วง `setTimeout(..., 900)` ที่ `:226` และ `:234`; มี submitting
  state (line 264) แต่ผู้ใช้ยังรอเงียบ ๆ
- งาน: ตัด delay 900 ms — navigate ทันทีเมื่อสำเร็จ (toast ข้ามหน้าทำงานอยู่
  แล้วผ่าน ToastProvider) + ทำ pending state ให้เห็นทางสายตาทันทีที่กดบันทึก
- **ห้าม full-optimistic insert** — คง await semantics เดิม เพราะ
  `id`/`reported_by` มาจาก DB trigger (data honesty); นี่คือ UX-state
  ปรับปรุง ไม่ใช่การแทนค่าที่ไม่รู้

### 5. เก็บกวาดความสม่ำเสมอ — impact ต่ำ / effort ต่ำ

- หลักฐาน A: `frontend/src/pages/EquipmentPage.tsx:60-89` ใช้
  useState+useEffect manual fetch ทั้งที่มี `useEquipment()` บน React Query
  แล้ว (`frontend/src/lib/hooks.ts:56-66`)
- งาน A: port EquipmentPage ไปใช้ useEquipment + useQuery ให้ cache รวมศูนย์
  (ไม่เปลี่ยน UI) — ห้ามทำให้ error/toast path หาย
- งาน A2 (conditional, มี justification): ตรวจ
  `frontend/src/pages/admin/AIAdminPage.tsx` — **ตรวจแล้ว ณ base ว่าใช้
  pattern เดียวกัน** (useState+useEffect+Promise.all manual fetch ที่
  `:29-49`) → ถ้า port ได้โดยไม่กระทบพฤติกรรม ให้ port ตาม; ถ้า port
  แล้วกระทบพฤติกรรม admin เดิม ให้จด follow-up ตรงไปตรงมาแล้วข้าม
- หลักฐาน B: `frontend/public/icon-512.png` และ `frontend/public/logo-aura.png`
  = **405,585 ไบต์ต่อไฟล์ ณ base** (favicon-aura.png 8 KB พิสูจน์ว่า
  compress ได้)
- งาน B: บีบ 2 ไฟล์นี้เท่านั้น (ห้ามแตะ PNG อื่น ห้ามแตะ sw.js) เหลือเป้า
  <40 KB ด้วยเครื่องมือ macOS ที่มีจริง (sips/pngquant ถ้ามี) — **ถ้า
  เครื่องมือทำให้คุณภาพเสียจนเกินรับได้ ให้จด follow-up ตรงไปตรงมา
  และไม่ ship ภาพเสีย** (manifest.webmanifest อ้าง icon-512.png อยู่ 2 จุด
  — ต้องยังใช้งานได้จริงหลังบีบ)

## เกณฑ์การเพิ่มเลขเวอร์ชัน (ตัดสินตอน D4 — ห้าม pre-decide)

ยึดเกณฑ์ที่บันทึกใน `CHANGELOG.md` (SemVer vMAJOR.MINOR.PATCH):

- งานทั้ง 5 รายการคือ **ปรับปรุงประสิทธิภาพ/พฤติกรรมภายในที่ผู้ใช้อาจสังเกต
  ได้** (โหลดครั้งแรกเร็วขึ้น, บันทึกฟอร์มไวขึ้น) ไม่มีฟีเจอร์ใหม่
  → น่าจะเข้า **PATCH (v1.0.1)** — "แก้ไขข้อผิดพลาดหรือปรับปรุงภายในที่ผู้ใช้
  อาจสังเกตได้"
- **ห้ามตัดสิน v1.1.0 ล่วงหน้า** — ถ้าขณะ implement มีรายการใดโผล่เป็น
  ความสามารถใหม่ที่ผู้ใช้เรียกใช้ได้จริง ให้ยกเป็น MINOR พร้อมเหตุผล
- **การตัดสินสุดท้ายเกิดที่ D4** พร้อมหลักฐาน build จริง + เหตุผลเขียนไว้ใน
  checkpoint ของ handoff; entry CHANGELOG เป็นภาษาไทย วันที่ พ.ศ.
- tag ตามขั้นตอน release ใน
  `docs/ai/handoffs/ENV-APP-VERSION-001-GLM.md` D6 (ขั้นตอนบัมป์เวอร์ชันครั้ง
  หน้า): bump package.json → CHANGELOG entry → gate เต็ม → merge ด้วย
  expected-head discipline → **หลัง merge**: รอ Pages deploy สำเร็จที่ merge
  SHA → ตรวจ live asset → ค่อย push annotated tag ชี้ merge SHA ที่ deploy
  แล้ว → `check_release_version.py --tag vX.Y.Z` exit 0
- **transition PR นี้เป็น docs-only** — docs-only merge ห้ามบัมป์ ห้าม
  CHANGELOG ห้าม tag ตามนโยบาย CHANGELOG

## ฐานอำนาจอนุมัติ (Authorization basis — บันทึกตรงไปตรงมาและครบถ้วน)

1. **การตัดสินใจของเจ้าของในเซสชัน 2026-11-12**: หลังเห็น Top-5 จากรายงาน
   audit ประสิทธิภาพ read-only ประจำวันที่ 2026-11-12 เจ้าของเลือก
   **"ทำครบ Top 5"** — ทั้ง 5 รายการในหนึ่ง lane
2. **รายงาน audit เป็นใบเสร็จถาวร**: คัดลอก VERBATIM ใน handoff D0 พร้อมข้อ
   "อย่าทำ" ที่ผูก lane นี้ (ห้าม Wasm, ห้ามย้าย Next.js, ห้าม pooling
   client, ห้ามย้าย read ผ่าน Edge Function, ห้ามเพิ่ม index โดยไม่มี
   query ใหม่, ห้าม full-optimistic insert, ห้ามแคชข้อมูล Supabase ใน SW,
   ห้าม matview)
3. **คำสั่งถาวรของเจ้าของ (Goal mode)**: เดินงานต่อเนื่องตาม loop ที่บันทึก
   ไว้ — RED-first, battery เต็ม, รีวิวอิสระ, ห้าม merge ตัวเอง

## Execution routing (Track-Z GLM ทุกรายการ — ไม่มี Codex dispatch)

- **D2** — GLM Track-Z RED-first tests **เฉพาะพฤติกรรมที่ทดสอบได้**:
  sensor-feed single-query assertion, RPC call-shape assertion,
  form-navigate behavior, EquipmentPage cache usage — truthful failures
  บันทึกถาวร (ความคาดหวังขนาด bundle **ไม่ใช่** assertion ของ D2 — เป็น
  รายงานวัดจริงของ D4)
- **D3** — GLM Track-Z implementation ตาม 5 รายการ + migration SQL
- **D4** — GLM battery เต็มที่ head ที่ freeze: FULL vitest + `tsc -b` +
  lint + Playwright FULL `--workers=1` + guard 344/344 + runtime 62/62 +
  checker + **รายงานขนาด main bundle ก่อน/หลังจาก `vite build` จริง**
- **D5** — fresh-GLM independent review ที่ exact head (Terra ผ่าน Codex CLI
  eligible เป็น cross-model reviewer; GPT-6 Astra ห้าม; never
  author-and-approve; never silent downgrade); implementer ห้าม merge ตัวเอง
  — **lane หยุดที่ REVIEW_REQUESTED เสมอ**
- **D6 release — หลัง merge เท่านั้น**: ตามหมวดเกณฑ์เวอร์ชันด้านบน

## Scope (mutable, exactly — ตรงกับ registry claim entry, one-writer)

ตรวจแล้ว ณ base ว่ามีอยู่จริงหรือเป็นไฟล์ใหม่:

- `frontend/src/App.tsx` (มีอยู่ — เฉพาะ import block :9-32 + lazy block)
- `frontend/src/lib/use-sensor-feed.ts` (มีอยู่ — query N+1)
- `frontend/src/lib/use-sensor-feed.test.ts` (ใหม่ — D2)
- `frontend/src/lib/supabase-queries.ts` (มีอยู่ — createReading call site)
- `frontend/src/lib/create-reading-rpc.test.ts` (ใหม่ — D2 call-shape)
- `frontend/src/pages/DailyFormPage.tsx` (มีอยู่ — ตัด delay + pending state)
- `frontend/src/pages/EquipmentPage.tsx` (มีอยู่ — port React Query)
- `frontend/src/pages/admin/AIAdminPage.tsx` (มีอยู่ — conditional port,
  justification จดแล้ว)
- `frontend/tests/e2e/env-perf-001.spec.ts` (ใหม่ — D2 form navigate +
  Equipment cache + lazy-route smoke)
- `supabase/migrations/20261112000001_fn_create_reading.sql` (ใหม่ — ไฟล์เดียว;
  path ตาม convention จริงของ repo, DEVIATION จดแล้ว)
- `frontend/package.json` (มีอยู่ — bump field `version` เฉพาะตอน release)
- `frontend/public/icon-512.png` (มีอยู่ — บีบขนาด)
- `frontend/public/logo-aura.png` (มีอยู่ — บีบขนาด)
- `CHANGELOG.md` (มีอยู่ — entry release ภาษาไทย พ.ศ. เฉพาะตอน release)
- `docs/work-orders/ENV-PERF-001.md` (WO นี้)
- `docs/ai/handoffs/ENV-PERF-001-GLM.md` (append checkpoints)
- `docs/ai/CURRENT-WORK.md` (เฉพาะ transition ถัดไปที่รีวิวแล้ว)

## Forbidden (ห้ามแตะ)

- `frontend/vite.config.ts` (ห้าม manualChunks — rolldown split เอง)
- `frontend/src/lib/version.ts` (version source คือ package.json เท่านั้น —
  chip อ่าน injected constant ไม่ต้องแก้)
- `frontend/src/components/**` ทั้งหมด (PageSkeleton ใช้ของเดิม)
- `frontend/src/pages/**` ทุกหน้านอกเหนือจาก 3 หน้าที่ claim ด้านบน —
  โดยเฉพาะ `frontend/src/pages/BuildingPage.tsx` (ของ claim Building
  ที่ยัง CLAIMED), `frontend/src/pages/BulkImportPage.tsx`,
  `frontend/src/pages/FlowDiagramPage.tsx`
- `frontend/src/lib/twin/**`, `frontend/src/lib/carbon-rollup.ts`,
  `frontend/src/lib/import-adapters/**`
- `frontend/public/sw.js` (ของ claim Building), `frontend/public/` ไฟล์
  อื่นทั้งหมดนอกจาก 2 PNG ที่ claim (favicon*, icon-192.png, icons.svg,
  manifest.webmanifest, fonts)
- `supabase/functions/**` (ingest-sensor, notify-threshold — อยู่ถูกที่แล้ว)
- `.github/**` (CI workflow ทุกไฟล์)
- RLS policy ทุกตัว; ข้อมูลแถวทุกแถว (migration เป็น schema-only)
- `.env`, `data/**`
- `docs/ai/ROADMAP.md`, `docs/ai/HANDOFF.md`, `docs/ai/design/**`,
  `docs/ai/digital-twin/11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md`
  (อ่านอย่างเดียว), `AGENTS.md`
- ทุกไฟล์ที่ไม่อยู่ใน claimed list

## Rollback SQL (สำหรับ migration `20261112000001_fn_create_reading.sql`)

```sql
-- rollback: ลบ function ที่เพิ่มสร้าง (schema-only, ไม่กระทบข้อมูล)
DROP FUNCTION IF EXISTS public.fn_create_reading(jsonb);
```

(ชื่อ schema สุดท้ายของ function ต้องตรงกับที่สร้างจริงในไฟล์ migration —
ตรวจกับไฟล์ก่อนรัน rollback เสมอ; rollback นี้ schema-only เช่นกัน)

## ข้อจำกัดความจริง (truth constraints)

- unknown ≠ 0 (ห้ามแทนค่าศูนย์) — ไม่มี telemetry ที่หายถูกเติมเป็นค่าใด ๆ
- `latest` ≠ `live` — ห้ามใช้คำ "live" กับ path ที่ไม่ใช่ telemetry จริง
- ห้าม full-optimistic form insert — `id`/`reported_by` เป็นความจริงจาก DB
  trigger; form save คง await semantics แล้วแสดง pending ที่เห็นจริง
- ความล้มเหลวของขั้น repair_request ต้อง surface จริง ไม่กลืน (แก้ defect
  เดิมที่ :240-243)
- บีบรูปไม่ ship ภาพเสีย — เครื่องมือไม่ไหว = จด follow-up ตรงไปตรงมา
- migration: schema-only, preflight zero-data-mutation, rollback เขียนไว้ใน
  WO นี้, apply ผ่าน `scripts/apply_migration_api.py` เท่านั้น, RLS ไม่แตะ
- วันที่ user-facing (CHANGELOG) เป็น พ.ศ. (ค.ศ. + 543)
- ไม่มี PHI; ไม่มี write จริงใน tests; ห้าม print/commit token ใด ๆ

## ขั้นตอน (D-plan) — ดูหมวด Execution routing ด้านบน

## การยอมรับ (Acceptance)

- `vite build` วัดจริง: main bundle ลดลงชัดเจนจาก ~808 KB (รายงานก่อน/หลัง
  ใน handoff D4); ไม่มี route/auth พัง; skeleton มือถือปกติ
- sensor feed โหลดด้วย query เดียวต่อการ seed (ตรวจได้จาก test + code)
- createReading เรียก RPC เดียว atomic; ความล้มเหลวขั้น repair_request
  surface เป็น error จริง (test ครอบ call-shape)
- ฟอร์ม navigate ทันทีหลัง success (ไม่มี 900 ms delay หลงเหลือ); pending
  state เห็นทันที; ไม่มี optimistic insert
- EquipmentPage (+AIAdminPage ถ้า port) ใช้ React Query cache รวมศูนย์
- 2 PNG ลดเหลือ <40 KB ต่อไฟล์ หรือ follow-up ถูกจดตรงไปตรงมา (ไม่ ship
  ภาพเสีย)
- migration apply สำเร็จบน ENV_DB ด้วยหลักฐาน preflight + output จดใน
  handoff; rollback ทดสอบได้ตาม SQL ใน WO นี้
- release: เลขเวอร์ชันตัดสินตอน D4 พร้อมเหตุผลตามเกณฑ์ CHANGELOG; CHANGELOG
  entry ไทย พ.ศ.; tag เกิดหลัง merge + deploy ตรวจแล้วเท่านั้น
- Battery D4 ทุกประตูเขียวที่ head ที่ freeze; ไม่มีไฟล์ forbidden ถูกแตะ;
  ทดสอบเดิมทั้งหมดไม่ถูกทำให้เสีย

## Review plan

Claim transition (PR นี้) = รีวิวอิสระ exact-SHA (R2 floor: fresh-GLM;
cross-model R3 ที่ admission เอื้อ — Terra eligible, Astra ห้าม).
Implementation PR = D5 fresh-GLM independent review ที่ exact frozen head
พร้อม battery rerun อิสระเมื่อทำได้. Implementing lane ไม่เคย merge PR ของ
ตัวเอง — หยุดที่ REVIEW_REQUESTED; merge เป็นของผู้รีวิวที่ได้รับมอบอำนาจ
เท่านั้น. Release (bump + CHANGELOG + tag) เกิดหลัง merge + deploy ตรวจแล้ว
เท่านั้น ตามขั้นตอน D6 ของ ENV-APP-VERSION-001
