# ENV-PERF-001-C1 — Handoff (claim checkpoint)

conventions note: this handoff follows the
`docs/ai/handoffs/ENV-APP-VERSION-001-GLM.md` conventions (claim checkpoint
sections, per-phase evidence, durable receipts).

## D0 — Claim transition authored (12 พฤศจิกายน 2569 / 2026-11-12)

- Claim `ENV-PERF-001-C1` (generation 1, CLAIMED) registered by this
  transition; authority begins only after the reviewed transition merges to
  main.
- Task `ENV-PERF-001` (new task row; task_id uniqueness checked against the
  registry via the guard — 0 prior occurrences of `ENV-PERF`, no
  OWNERSHIP_CONFLICT; the only lock-holding claim
  `ENV-BUILDING-REPAIR-001-C1` holds no overlapping path — its migrations,
  Building/repair libs+pages, sw.js and e2e spec are all disjoint from this
  claim's mutable scope and stay explicitly forbidden here).
- Work Order: `docs/work-orders/ENV-PERF-001.md` (Top-5 performance slice,
  authorization basis, execution routing, exact mutable scope, forbidden
  scope, truth constraints, D-plan, release-criteria reasoning, acceptance,
  review plan).
- Lane: Track-Z (GLM) for ALL five items — no Codex dispatch needed (no
  visual art direction; the UX copy/state tweaks in item 4 are behavioral,
  not visual). Holder (this coordinator session):
  `kilo-env-perf-001-g1-primary`; worktree
  `/Volumes/MAC_WORK/DevWorkspace/Github/_worktrees/env-perf-001-20261112`;
  branch `docs/env-perf-001-claim`; base
  `3875bc68b5bdfae8ee4c232a8bc47a33280c94d0` (= origin/main at transition
  authoring; verified fetched, clean, ff — it is the merge SHA of PR #169;
  fence `expected_policy_revision` pins this SHA and
  `expected_registry_hash` pins the registry block AT this base, guard
  method `scripts/env_coordination_guard.py:454-456`, verified by running
  `validate-registry` at base: hash `5280a0be3ac6c22bb07a37b895b6a2575321b3257f105e91c83bbddd8768b37e`,
  claims 21, ok:true — this re-pins the prior fence
  `5bca608…` / `1123c740…` from the ENV-APP-VERSION-001-C1 closeout PR #169).
- Scope: the Top-5 improvements from the 2026-11-12 read-only performance
  audit (VERBATIM receipt below — it carries file:line evidence for every
  item, all re-verified present at base `3875bc68` before authoring):
  1. Lazy-load the 24 eager page imports (`frontend/src/App.tsx:9-32`) via
     the EXISTING lazy+PageSkeleton pattern (`App.tsx:33-69`) — auth
     guards/routing behavior byte-equivalent; expect main bundle
     ~808KB → ~450-500KB; verify no mobile skeleton regressions.
  2. Fix the N+1 per-sensor query (`frontend/src/lib/use-sensor-feed.ts:73-83`)
     with a single `.in("sensor_id", ids)` query + client-side grouping,
     preserving the realtime incremental cache behavior (supporting index
     `idx_sensor_reading_sensor_time` already exists, snapshot:883).
  3. Atomic `createReading` RPC: new Postgres function
     `fn_create_reading(p_payload jsonb)` replacing the 3 sequential inserts
     (`frontend/src/lib/supabase-queries.ts:194-247`; step-3 failure is
     currently swallowed at `:240-243` — the RPC makes it atomic AND
     surfaces failures honestly). SQL migration under `supabase/migrations/`
     (repo convention `YYYYMMDDNNNNNN_name.sql`; DEVIATION recorded: the
     transition instruction said `db/migrations/` but explicitly deferred to
     existing repo naming — the repo has NO `db/` directory; every prior
     migration incl. the Building C1 pair lives in `supabase/migrations/`),
     applied to ENV_DB ONLY via `scripts/apply_migration_api.py`
     (SUPABASE_ACCESS_TOKEN from the Drive env; zero-data-mutation preflight;
     rollback SQL documented in the WO; NO row data touched; RLS untouched —
     the function enforces the same staff-role gate via the
     `core.fn_is_staff_or_admin()` pattern). Schema-only; no real-data
     writes.
  4. Form-save perceived latency (`frontend/src/pages/DailyFormPage.tsx:213-239`):
     remove the fixed 900 ms `setTimeout` before navigate (`:226`, `:234`),
     navigate on success with the cross-page toast; make the
     submitting/pending state visually immediate; keep await semantics
     (NO full-optimistic insert — `id`/`reported_by` come from DB triggers;
     data-honesty rule).
  5. Consistency sweep: port `frontend/src/pages/EquipmentPage.tsx:60-89` to
     the existing React Query hook `useEquipment`
     (`frontend/src/lib/hooks.ts:56-66`); port
     `frontend/src/pages/admin/AIAdminPage.tsx` IF it shares the manual
     useState+useEffect fetch pattern (verified at base: it does —
     `AIAdminPage.tsx:29-49` useState+useEffect+Promise.all manual fetch,
     same class as EquipmentPage — conditional claim pinned with this
     justification); compress `frontend/public/icon-512.png` +
     `frontend/public/logo-aura.png` (405,585 bytes each at base → target
     <40KB) using available macOS tooling (sips/pngquant if present); if
     tooling cannot preserve fidelity, record the follow-up honestly instead
     of shipping degradation.
- Release: per the CHANGELOG-documented SemVer criteria decide the bump
  honestly at D4 (PATCH-leaning: perf/ปรับปรุง, no new features — reasoning
  recorded in the WO; v1.1.0 NOT pre-decided) + CHANGELOG entry (Thai,
  พ.ศ.) + `frontend/package.json` bump + annotated tag at the deployed merge
  SHA post-deploy, per the release process
  `docs/ai/handoffs/ENV-APP-VERSION-001-GLM.md` D6
  (ขั้นตอนบัมป์เวอร์ชันครั้งหน้า).
- Execution routing: D2 GLM Track-Z RED-first — kept to TESTABLE behavior
  only: sensor-feed single-query assertion, RPC call-shape assertion,
  form-navigate behavior, EquipmentPage cache usage (truthful failures
  recorded; the bundle-size expectation is NOT a D2 test — it is measured
  and reported at D4 via a before/after `vite build` main-bundle size
  report) → D3 GLM Track-Z implementation → D4 GLM battery (FULL vitest +
  tsc + lint + Playwright FULL workers=1 + guard 344/344 + runtime 62/62 +
  checker + the measured before/after main-bundle size report) → freeze the
  exact head → D5 fresh-GLM independent review → STOP at
  REVIEW_REQUESTED — the implementing lane never merges its own PR.
- Truth constraints pinned for the whole lane: unknown ≠ 0 (ห้ามแทนค่าศูนย์
  — no missing telemetry coerced into a value); `latest` ≠ `live` (no
  "live" wording for non-telemetry paths); no full-optimistic form insert
  (id/reported_by are DB-trigger truth); PNG compression must not ship
  fidelity degradation (honest follow-up instead); migration is schema-only
  (zero row-data mutation, preflight-verified, rollback documented); RLS
  untouched; user-facing dates พ.ศ. (CE + 543); no PHI; no real writes in
  tests.

### Authorization basis (honest and complete)

1. Owner decision in-session 2026-11-12: shown the 2026-11-12 read-only
   performance audit's Top-5 findings, the owner chose
   **"ทำครบ Top 5"** — all five items, one lane.
2. The audit report itself is receipted VERBATIM below (D0-EVIDENCE) — the
   implementation must not contradict its "อย่าทำ" list (no Wasm, no
   Next.js migration, no client pooling, no Edge-Function read path, no new
   indexes, no full-optimistic insert, no SW data cache, no matview).
3. Owner standing Goal-mode instruction (continuation discipline).
4. Next action after merge: D2 RED-first in the registered worktree.

## D0-EVIDENCE — read-only performance audit 2026-11-12 (VERBATIM receipt)

Copied byte-for-byte from `/tmp/env-perf-audit-2026-11-12.md` (86 lines,
17,336 bytes, dated 2026-11-12 07:42 local). This is the D0 evidence basis;
every file:line claim below was re-verified present at base `3875bc68`
during transition authoring. Nothing in this section is paraphrased.

# รายงาน Audit ประสิทธิภาพ ENV webapp — 2026-11-12 (READ-ONLY)

Scope: React 19 + Vite 8 (rolldown) SPA บน GitHub Pages → Supabase (PostgREST/RLS) โดยตรง
Method: grep ซอร์สโค้ด + อ่าน schema snapshot + `vite build` ในเครื่อง + HEAD จาก production
ไม่มีการแก้ไฟล์ใด ๆ ไม่มี DB write ไม่มีการ dispatch model ภายนอก

---

## สรุปผู้บริหาร (5 บรรทัด)

1. แอปนี้ถูก optimize มาแล้วเกือบทั้งหมดที่คำแนะนำ generic แนะ: React Query cache (frontend/src/lib/query-client.ts:28-43), คอลัมน์เฉพาะใน .select เกือบ 100% (75 จุด), view รวมข้อมูลฝั่ง DB ครบ (v_dashboard_14day, v_overview_carbon, v_unified_co2e), index ตรง pattern ทุกจุดร้อน (reports/schema-snapshot-live.md:838,880,883,887-888), SW cache asset แบบ stale-while-revalidate (frontend/public/sw.js:80-96)
2. คอขวดจริงที่ผู้ใช้รู้สึกได้ = first visit: main bundle 808 KB (gzip 217 KB) เพราะ App.tsx eager-import 24 หน้า (frontend/src/App.tsx:9-32) ขณะที่ lazy มีแค่หน้า chart/admin 10 หน้า (App.tsx:33-69)
3. จุดรอง: N+1 query ต่อเซนเซอร์ใน useSensorFeed (frontend/src/lib/use-sensor-feed.ts:73-83), ฟอร์มบันทึกวันละ 1 แถวเดิน insert ถึง 3 รอบต่อเนื่อง (frontend/src/lib/supabase-queries.ts:202,224,235) + หน่วง 900 ms ก่อน redirect (frontend/src/pages/DailyFormPage.tsx:226,234)
4. คำแนะนำ 9 ข้อแบบ generic: ใช้ได้จริงแค่ 2-3 ข้อในเชิงแคบ, 4 ข้อมีอยู่แล้ว, 3-4 ข้อ N/A ทางสถาปัตยกรรม (pooling/Rust/Server Components/Edge Functions สำหรับ read)
5. สำหรับ 907 แถว + 3-5 ผู้ใช้ + region ap-southeast-1 ตรงกับผู้ใช้ไทย: ความเร็วต่อการใช้งานซ้ำ (staff ใช้ทุกวัน) ถูก SW+React Query ดูแลแล้ว — งานที่เหลือคือลด first-load payload และปิดจุด N+1 เท่านั้น

---

## ตาราง map คำแนะนำ Gemini 9 ข้อ

| # | คำแนะนำ | ผลตรวจ | เหตุผล/หลักฐาน |
|---|---------|--------|----------------|
| 1 | DB RPC functions | **APPLIES (เฉพาะจุด)** | Aggregation ส่วนใหญ่ทำใน view แล้ว (v_dashboard_14day reports/schema-snapshot-live.md:1048-1065; v_unified_co2e frontend/src/lib/carbon-rollup.ts:91) เหลือ 2 จุดที่ RPC ช่วยได้จริง: (a) recent-samples ต่อเซนเซอร์ แก้ N+1 (use-sensor-feed.ts:73-83), (b) createReading รวม 3 insert เป็น 1 atomic call (supabase-queries.ts:194-247) |
| 2 | Targeted indexes | **มีอยู่แล้ว** | reading_reading_date_idx (reading_date DESC) ตรง ORDER BY ทุก query dashboard (snapshot:880); idx_sensor_reading_sensor_time (sensor_id, taken_at DESC) ตรง sensor feed (snapshot:883); partial index threshold_alert unread/pending ตรง badge (snapshot:887-888); carbon (meter_id, reading_date DESC) (snapshot:838) — ที่ 907 แถว seq scan ก็ sub-ms อยู่แล้ว |
| 3 | Connection pooling (6543) | **N/A** | Browser คุยกับ Supabase ผ่าน PostgREST-over-HTTPS ด้วย supabase-js เท่านั้น (frontend/src/lib/supabase.ts) — ไม่มี direct Postgres connection จาก client ให้ pool; Supavisor เป็นเรื่อง server-side ที่จัดการให้แล้ว |
| 4 | Column-specific selects | **มีอยู่แล้ว** | 75 จุด .select( ใน frontend/src เกือบทั้งหมดระบุคอลัมน์หรือใช้ COLUMNS constants (เช่น fuel.ts:37, building.ts:48, supabase-queries.ts:37-39) — .select("*") เหลือ 4 จุด และ 3 จุดเป็น single-row (supabase-queries.ts:137,227,261) ไม่มีผลในทางปฏิบัติ |
| 5 | Edge Functions | **N/A สำหรับ read** | มีใช้ถูกที่แล้ว: ingest-sensor + notify-threshold (supabase/functions/) สำหรับ ingest และ push แต่ถ้าย้าย read path ไอ้ผ่าน EF = เพิ่ม hop (client→EF→DB) ช้ากว่า PostgREST ตรง, EF มี cold start |
| 6 | Rust/Wasm | **N/A — อย่าทำ** | Client ไม่มี CPU-bound workload: 907 แถว, aggregation ฝั่ง client เหลือแค่ momPct/toCarbonMonths (overview.ts:67-81,103-104) ซึ่งใช้เวลาระดับไมโครวินาที — Wasm เพิ่ม payload ไม่ลด latency เครือข่ายซึ่งเป็นตัวแปรหลัก |
| 7 | Server Components / caching | **N/A — อย่าทำ** | SPA ล้วน static บน GitHub Pages (vite.config.ts, deploy workflow) — ไม่มี server runtime ให้ทำ RSC/ISR; ย้าย Next.js เพื่อ perf ล้วน ๆ ไม่ justify กับ 3-5 ผู้ใช้ และทำลายโมเดล hosting ฟรี + PWA/SW |
| 8 | Optimistic UI | **PARTIAL** | มีแล้ว 2 จุด: optimistic mark-read พร้อม rollback (alerts.ts:81-99 markReadViaCache) + realtime incremental cache (use-sensor-feed.ts:101-107) + React Query staleTime 30s (query-client.ts:31) — จุดที่ยังไม่ optimistic: ฟอร์มบันทึก (DailyFormPage.tsx:213-239) ซึ่งควรใช้แบบ "pending state + feedback ทันที" ไม่ใช่ full-optimistic เพราะ DB trigger เติม reported_by/id ให้ |
| 9 | Region alignment | **มีอยู่แล้ว** | ENV_DB (gllqtbyofrcjzmbnfoeh) = ap-southeast-1; ผู้ใช้อยู่ไทย; GitHub Pages = global CDN — แนะนำนี้ตอบโจทย์แล้วโดยดีฟอลต์ |

---

## Top 5 โอกาสปรับปรุง (ranked ด้วย impact×effort)

### 1. Lazy-load หน้า eager 24 หน้าใน App.tsx — impact: สูง / effort: ต่ำ
- หลักฐาน: frontend/src/App.tsx:9-32 import ตรง 24 หน้า (Dashboard, DailyForm, ReadingsList, Reports, Equipment, Overview, Flow, BulkImport, WaterSupply, Garbage, Fuel, Garden, Building, Safety, Food, Chemical, Regulations, PDFDesigner, Attachments, Operations, Auth*, NotFound); มีเพียง 10 หน้า lazy (App.tsx:33-69)
- ผล build จริง (vite build วันที่ 2026-11-12): main `index-*.js` **807.84 KB (gzip 216.96 KB)** — ใน main chunk มี React + router + supabase-js (GoTrue+Realtime) + 24 หน้านี้ทั้งหมด; TwinCanvas 912 KB, pdf 427+434 KB, exceljs 930 KB, pdf.worker 1,173 KB แยกชั้น dynamic import ถูกต้องแล้ว (import-engine.ts:65-143, DashboardPage.tsx:19)
- ข้อเสนอ: ใช้ pattern เดิมที่มีอยู่ (`lazy(() => import(...))` + PageSkeleton) กับหน้า module v2 (WaterSupply/Garbage/Fuel/Garden/Building/Safety/Food/Chemical/Regulations/PDFDesigner/Attachments/Operations/BulkImport) — คาดหวัง main chunk ลดเหลือ ~400-500 KB (gzip ~110-140 KB); rolldown split ให้เอง, ไม่ต้องแตะ manualChunks
- หมายเหตุ: repeat visit ไม่กระทบ (SW cache asset ถาวร sw.js:80-96) — ผลนี้โดนเฉพาะ first visit และหลัง deploy ใหม่ (hash เปลี่ยน → cache ข้าม)

### 2. แก้ N+1 ใน useSensorFeed — impact: กลาง / effort: ต่ำ
- หลักฐาน: frontend/src/lib/use-sensor-feed.ts:73-83 — `Promise.all(sensors.map(...))` ยิง 1 query ต่อ 1 เซนเซอร์ (`.eq("sensor_id", s.id)...limit(50)`) = N+1 HTTP requests ต่อการโหลด SensorsPage ครั้งแรก
- ข้อเสนอ: query เดียว `.in("sensor_id", ids).order("taken_at", {ascending:false}).limit(ids.length * limit)` แล้ว group ใน JS (index idx_sensor_reading_sensor_time รองรับอยู่แล้ว snapshot:883) หรือ RPC `fn_recent_samples(p_sensor_ids uuid[], p_per_sensor int)` ด้วย LATERAL — ลดจาก N+1 เหลือ 1 request
- ผลต่อจริง: N น่าจะ <10 เซนเซอร์ จึงไม่ใช่ฉุกเฉิน แต่เป็นงาน 30 นาทีที่ผลชัดที่สุดต่อ 1 หน้า

### 3. createReading: รวม 3 sequential inserts เป็น 1 RPC — impact: กลาง / effort: กลาง
- หลักฐาน: frontend/src/lib/supabase-queries.ts:194-247 — (1) insert carbon_reading ถ้ามีไฟฟ้า (line 202), (2) insert reading (line 224), (3) insert repair_request ถ้าผิดปกติ (line 235) — 3 round trips ต่อเนื่อง และความล้มเหลวของขั้น (3) ถูกกลืน (line 240-243 console.warn) = ไม่ atomic
- ข้อเสนอ: Postgres function `fn_create_reading(p_payload jsonb)` ทำทั้ง 3 ขั้นใน transaction เดียว คืน reading detail — form save จาก ~3 RTT เหลือ 1 RTT + atomicity ถูกต้องตามที่ comment ตั้งใจ ("same logical transaction" supabase-queries.ts:192)
- ระวัง: RPC ต้อง set search_path + SECURITY DEFINER อย่างระมัดระวัง, RLS ปัจจุบัน gate ด้วย role check อยู่แล้ว

### 4. Form save perceived latency: ตัด delay 900 ms หรือทำ optimistic pending — impact: กลาง (รู้สึก) / effort: ต่ำ
- หลักฐาน: frontend/src/pages/DailyFormPage.tsx:223-237 — await mutate → แสดง banner สำเร็จ → `setTimeout(() => navigate("/readings"), 900)`; submit เป็น await-then-toast ไม่มี pending feedback ก่อน response กลับ (มี submitting state line 264 แต่ผู้ใช้ยังรอเงียบ ๆ)
- ข้อเสนอ: (a) แสดง "กำลังบันทึก…" ทันทีที่กด (มี state แล้ว แค่ให้ชัดทางสายตา), (b) navigate ทันทีเมื่อสำเร็จโดยไม่รอ 900 ms (toast ทำงานข้ามหน้าอยู่แล้วผ่าน ToastProvider) — full-optimistic insert ไม่แนะนำเพราะ id/reported_by มาจาก DB trigger
- หมายเหตุ: ผู้ใช้ 3-5 คนจากไทยไป Singapore RTT ~10-30 ms/รอบ — ตัว delay 900 ms คือส่วนที่รู้สึกช้ากว่า network จริงเสียอีก

### 5. เก็บกวาดความสม่ำเสมอ: EquipmentPage/AIAdminPage bypass React Query + รูป icon 400 KB — impact: ต่ำ / effort: ต่ำ
- หลักฐาน A: frontend/src/pages/EquipmentPage.tsx:60-89 ใช้ useState+useEffect manual fetch (Promise.all ถูกต้องแล้วที่ line 64-74) ขณะที่มี useEquipment() บน React Query อยู่แล้ว (frontend/src/lib/hooks.ts:56-66) — สลับหน้าแล้ว fetch ซ้ำ ไม่ได้ staleTime
- หลักฐาน B: frontend/public/icon-512.png และ logo-aura.png = **400 KB ต่อไฟล์** (favicon-aura 8 KB พิสูจน์ว่า compress ได้) — โหลดที่ login/manifest ครั้งแรก
- ข้อเสนอ: (A) port EquipmentPage ไปใช้ useEquipment + useQuery ให้ cache รวมศูนย์ (ไม่ยุ่ง UI), (B) ย่อ PNG เหลือ <40 KB ด้วย squoosh/pngquant หรือเปลี่ยน logo เป็น SVG

---

## รายการ "อย่าทำ"

| อย่าทำ | เหตุผล |
|--------|--------|
| เพิ่ม Rust/Wasm | ไม่มี CPU-bound workload — 907 แถว aggregate ใน JS เสร็จในไมโครวินาที (overview.ts:67-104); ตัวแปรความเร็วจริงคือ network RTT ซึ่ง Wasm ไม่ช่วย แต่เพิ่ม bundle + ซับซ้อน build |
| ย้ายไป Next.js เพื่อ RSC/caching | SPA static บน GH Pages คือโมเดลที่ถูกต้องแล้ว: hosting ฟรี, global CDN, SW ทำ offline+cache ครบ (sw.js) — 3-5 ผู้ใช้ไม่เคยจ่ายค่า server runtime คุ้ม |
| เพิ่ม connection pooling config ฝั่ง client | ไม่มี direct Postgres connection จาก browser — supabase-js คุย PostgREST/HTTPS เท่านั้น; คำแนะนำ port 6543 ใช้กับสถาปัตยกรรมนี้ไม่ได้เลย |
| ย้าย read queries ไปผ่าน Edge Functions | เพิ่ม hop + cold start — PostgREST ตรงเร็วกว่าสำหรับ read; EF มีอยู่ถูกที่แล้ว (ingest-sensor, notify-threshold) |
| เพิ่ม index เพิ่มโดยไม่มี query ใหม่มาใช้ | indexes ครอบคลุม pattern ที่มีอยู่ครบแล้ว (snapshot:838-889); ที่ขนาด 907 แถว index ใหม่ = ต้นทุน write ฟรี ๆ โดยไม่มี read ไหนเร็วขึ้นจับต้องได้ |
| ทำ full-optimistic form insert | id/reported_by/location defaults มาจาก DB trigger (supabase-queries.ts:187-193) — optimistic แล้วจะ reconcile ยาก + ผิดหลัก data honesty; ใช้ pending-feedback แทน |
| แคชข้อมูล Supabase ใน service worker | SW กัน cross-origin ไว้ถูกต้องแล้ว (sw.js:56) — แคช data จะทำ stale data แบบไม่มี invalidation ซึ่งผิดความต้องการ "ข้อมูลวันนี้บันทึกหรือยัง"; React Query staleTime ครอบ use-case นี้แล้ว |
| บีบ aggregate เพิ่มเป็น materialized view | 907 แถว refresh ตอน read ผ่าน view ธรรมดาก็เร็วอยู่แล้ว — matview แลกมาด้วย stale + ต้องมี refresh job ไม่คุ้ม |

---

## ข้อจำกัดของการตรวจครั้งนี้

1. **ไม่ได้รัน query จริงบน DB** — ไม่มี EXPLAIN ANALYZE; บทวิเคราะห์ index/RLS อิง reports/schema-snapshot-live.md + supabase/migrations เท่านั้น (snapshot ไม่มี CREATE POLICY ฝั่ง RLS ทั้งหมด จึงตรวจ policy จาก migrations — พบ 15 ไฟล์มี policy, 0 policy ที่มี per-row subquery)
2. **ไม่ได้วัด timing จริง** — ไม่มี Lighthouse/tracing; ขนาด asset มาจาก `vite build` ในเครื่อง (commit ebdfcee) + HEAD จาก production (index-B7_pHGga.js = 807,772 B ตรงกับ build ในเครื่อง 807.84 KB; gzip 218,142 B)
3. **ไม่ได้วัด RTT จริงไทย→Singapore** — ตัวเลข 10-30 ms เป็นค่าอ้างอิงทั่วไป ไม่ใช่ผลวัด
4. ตัวเลข N+1 ใน useSensorFeed ขึ้นกับจำนวน sensor ที่ active จริง (ไม่ทราบจาก repo — ประเมินว่า <10)
5. ไม่ได้ audit ความถี่การเรียก refetchOnWindowFocus รวมทุก hook รายหน้า (default เปิดทั้งแอป — ถ้ามีหน้าที่ query หนักหลายตัวอาจยิงถี่ขึ้นตอนสลับแท็บ แต่ที่ 907 แถวไม่น่าเป็นปัญหา)

## Checkpoints

(appended per phase as work proceeds; each checkpoint carries exact SHAs and
truthful failure/pass records)

## D2 — RED-first (commit `ea49d59`, on top of implementation base `4b4a482`)

Tests added (behavior-only; bundle-size expectation is NOT a D2 test):

- `frontend/src/lib/use-sensor-feed.test.ts` (ใหม่) — 4 tests: single-query
  seeding, `.in("sensor_id", ids)` + newest-first shape, per-sensor
  grouping/cap at the limit, combined limit = ids.length × per-sensor limit.
  RED record (focused run `vitest run src/lib/use-sensor-feed.test.ts
  src/lib/create-reading-rpc.test.ts`, base behavior): **2 files failed,
  8 tests failed / 0 passed** — the use-sensor-feed failures surfaced as
  `TypeError: fetchSensorFeedData is not a function` (module-level seeding
  function not yet extracted; dynamic-import call sites failed per test).
- `frontend/src/lib/create-reading-rpc.test.ts` (ใหม่) — 4 tests: exactly one
  `rpc("fn_create_reading")` + zero direct table writes, full payload inside
  `p_payload` (incl. abnormal_cause + electricity), RPC failure PROPAGATES
  (no swallow), returns the RPC row. RED: all 4 failed (rpcCalls 0 ≠ 1,
  fromCalls 3 ≠ [], no rejection, row id mismatch).
- `frontend/tests/e2e/env-perf-001.spec.ts` (ใหม่) — 5 tests, RED record
  (`npx playwright test env-perf-001.spec.ts --workers=1`):
  **3 failed / 2 passed**
  - FAILED (intended RED pins): form navigate-without-delay (`toHaveURL
    /\/readings/` — URL stuck on /form: the legacy 900 ms setTimeout frozen
    under `page.clock.pauseAt`), equipment React-Query cache hit (2 equipment
    fetches across SPA remount vs 1 expected), lazy-route chunk (DailyFormPage
    module already fetched at boot — eager import).
  - PASSED (kept honestly as already-green pins): immediate disabled pending
    state during the in-flight save (no fake clock; real 800 ms in-flight
    window), AIAdmin providers/scopes render (port-safety guard).

Test-infra note (disclosed): the D2-committed spec used
`pauseAt(new Date())` before navigation; during D3 this was found to freeze
React's commit of lazy-resolved routes (Suspense skeleton never resolves) and
was moved to AFTER initial render, then later hardened to pause at a fixed
future instant (the running fake clock passes a captured `new Date()` under
FULL-battery load — "Cannot fast-forward to the past"). RED failure modes
were unchanged and RE-VERIFIED at D3: with the D2-era 900 ms DailyFormPage
restored (`git checkout ea49d59 -- src/pages/DailyFormPage.tsx`), the test
fails exactly at `toHaveURL /\/readings/`; with the new code it passes.

## D3 — implementation (commits `ba2b42c` perf + `9b102a3` test-boundary update)

All five items implemented at head `9b102a3` (branch `feat/env-perf-001`):

1. **App.tsx** — all 24 eager page imports → existing lazy+PageSkeleton
   Suspense pattern (Suspense inside RequireAuth for gated routes, same as
   the pre-existing chart/admin pattern). Route paths/RequireAuth structure
   untouched. `tsc -b` clean, oxlint 0 errors.
2. **use-sensor-feed.ts** — seeding body extracted module-level as
   `fetchSensorFeedData(limit)` (alerts-unread pattern, node-env testable);
   ONE `.in("sensor_id", ids).order("taken_at", {ascending:false})
   .limit(ids.length * limit)` query + client-side grouping capped per
   sensor; realtime incremental-cache effect untouched. Known trade-off
   documented in-code (hot-sensor crowding of the combined window —
   negligible at <10 sensors).
3. **supabase-queries.ts createReading** — now ONE
   `supabase.rpc("fn_create_reading", { p_payload })` call; failures throw.
   Migration `supabase/migrations/20261112000001_fn_create_reading.sql`
   (house style per OAUTH-3: core gate-check + public-schema function,
   SECURITY DEFINER, `SET search_path = core, public`, fail-closed
   `core.fn_is_staff_or_admin()` gate with ERRCODE 42501, COMMENT ON
   FUNCTION, GRANT EXECUTE TO authenticated, returns the created reading row
   as jsonb; step-3 repair_request failure propagates by transaction
   semantics). Rollback SQL per WO:
   `DROP FUNCTION IF EXISTS public.fn_create_reading(jsonb);`
4. **DailyFormPage** — both 900 ms `setTimeout(..., 900)` delays removed;
   `toast.success(...)` (cross-page ToastProvider) + immediate
   `navigate("/readings")` on success; await semantics kept (no optimistic
   insert); error banner path unchanged. Pending feedback = existing
   `Button loading={submitting}` (disabled + spinner), pinned by e2e.
5. **EquipmentPage** — `useEquipment()` hook + `useQuery(["repair-requests"])`
   (cache centralized; error toast path preserved); **AIAdminPage** — no
   shared hook existed and `hooks.ts` is outside this claim's mutable scope,
   so the hook lives in-page (`useAiAdminData`, hooks.ts conventions
   `{ data, loading, error, refresh }`); scope toggle patches the query cache
   in place (same instant feedback as the old local setState).
   **PNGs** — `icon-512.png` + `logo-aura.png` (byte-identical twins at base,
   md5 decd5ede…) compressed **405,585 → 38,779 bytes each (−90.4%)**,
   dimensions preserved 512×512, via PIL 12.2.0 FASTOCTREE 256-color palette
   quantization WITHOUT dithering — near-lossless (mean abs delta 0.00/255,
   p99 0, max single-pixel delta 9/255, alpha EXACT). Tooling honesty:
   pngquant not installed; sips cannot palette-quantize; ffmpeg
   palettegen/paletteuse EVALUATED AND REJECTED (109,337 B output, alpha p99
   delta 255 — corrupted glow edges); PIL dithered variant rejected
   (visible background speckle; mean 1.66) in favor of the no-dither output.

### Migration preflight (READ-ONLY, verbatim)

Script: `/tmp/kilo/preflight_fn_create_reading.py` (one-off, read-only,
Management API `/database/query` — same path as
`scripts/introspect_schema_api.py`). Output:

```
[1] fn_create_reading existing definitions: []
[2] role gate fn_is_staff_or_admin: [{'nspname': 'core', 'proname': 'fn_is_staff_or_admin'}]
[3] fixed electricity meter present: [{'id': 'b6be4c99-c83a-43f7-b765-72286cc78bd0'}]
[4] triggers on wastewater.reading:
    - trg_audit_log: CREATE TRIGGER trg_audit_log AFTER INSERT OR DELETE OR UPDATE ON wastewater.reading FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log()
    - trg_persist_threshold_alerts: CREATE TRIGGER trg_persist_threshold_alerts AFTER INSERT ON wastewater.reading FOR EACH ROW EXECUTE FUNCTION wastewater.fn_persist_threshold_alerts()
[5] migration statements OUTSIDE function body: ['CREATE OR REPLACE FUNCTION public.fn_create_reading(p_payload jsonb)', 'RETURNS jsonb', 'LANGUAGE plpgsql', 'SECURITY DEFINER', 'SET search_path = core, public', 'AS $$', '$$;', 'COMMENT ON FUNCTION public.fn_create_reading(jsonb) IS', "'ENV-PERF-001 (2026-11-12) — atomic daily-reading create: carbon.reading (when electricity present) + wastewater.reading + core.repair_request (when abnormal_cause set) in ONE transaction, returning the created reading row as jsonb. SECURITY DEFINER, gated on core.fn_is_staff_or_admin() (fail-closed, same role gate as the transactional RLS policies). Replaces the 3 sequential client-side inserts whose repair_request failures were swallowed.';", 'GRANT EXECUTE ON FUNCTION public.fn_create_reading(jsonb) TO authenticated;']
    data-mutation statements outside body: NONE
PREFLIGHT_RESULT: OK
```

Conclusion: no name collision; role gate exists; fixed meter exists;
statement-level analysis = only CREATE OR REPLACE FUNCTION / COMMENT ON
FUNCTION / GRANT EXECUTE outside the `$$` body — **zero data-mutation
statements** (the INSERTs live inside the function body and run only when
the RPC is later called by gated staff code). RLS untouched.

### Migration apply (verbatim output)

`python3 scripts/apply_migration_api.py supabase/migrations/20261112000001_fn_create_reading.sql`:

```
20261112000001_fn_create_reading.sql: 3 statement(s)
  [1/3] OK: CREATE OR REPLACE FUNCTION public.fn_create_reading(p_payload jsonb)
  [2/3] OK: COMMENT ON FUNCTION public.fn_create_reading(jsonb) IS
  [3/3] OK: GRANT EXECUTE ON FUNCTION public.fn_create_reading(jsonb) TO authenticated;

Done: 3 OK, 0 FAIL
```

### Post-apply verification (read-only, verbatim)

```
function row: [{'schema': 'public', 'name': 'fn_create_reading', 'security_definer': True, 'config': ['search_path=core, public'], 'args': 'p_payload jsonb'}]
proacl: [{'proacl': '{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}'}]
```

SECURITY DEFINER + pinned search_path confirmed live; EXECUTE posture
identical to the existing OAUTH-3 RPCs (gate enforced inside the body,
fail-closed for anon/pending). NO row data was written at any point.

### D3 deviations + honest findings

1. **`frontend/tests/e2e/daily-form-mobile.spec.ts` modified — OUTSIDE the
   claimed file list (disclosed for reviewer approval).** The two
   ENV-MOBILE-001B/D create-save pins captured the OLD client-side boundary
   (POST `/rest/v1/reading` + separate `/rest/v1/repair_request` POST).
   Item 3's authorized contract change (atomic RPC) makes those captures
   impossible — the battery cannot be green without moving the capture to
   the rpc endpoint. Test intent preserved (validation-before-write, value
   preservation, repair payload integrity now asserted INSIDE `p_payload`,
   first-failure announce + retry). No other spec touches the save boundary
   (building-repair/operations only mock unrelated GETs).
2. **Audit premise correction (live introspection)**: the audit said
   `id/reported_by/location defaults มาจาก DB trigger`
   (supabase-queries.ts:187-193 comment era) — live `pg_trigger` shows NO
   BEFORE INSERT defaults trigger on wastewater.reading (only trg_audit_log
   + trg_persist_threshold_alerts, both AFTER INSERT/UPDATE/DELETE). The RPC
   therefore passes `reported_by`/`location_id` through from the payload
   (NULL from the form) — byte-equivalent to what the old PostgREST insert
   did — and the audit/threshold triggers fire identically inside the RPC.
   No behavior change; premise recorded honestly.
3. **Drive token resolution**: `scripts/_env.py`'s resolution chain did not
   find `secrets/env-wastewater-webapp.env` (its candidate roots don't
   include this machine's CloudStorage mount). The file was located at
   `/Users/aase7en/Library/CloudStorage/GoogleDrive-aase7en@sunday-estate.com/My Drive/A-Wiki-Data/secrets/env-wastewater-webapp.env`
   and supplied via the chain's FIRST-priority mechanism
   `A_WIKI_DRIVE_PATH` (process-env handoff to `load_secret`) — no script
   changes, token never printed/committed.
4. **PNG tooling**: sips/pngquant unavailable as listed; PIL (macOS-present
   python3) used per the WO's fidelity constraint with metrics above; ffmpeg
   variant evaluated and rejected with evidence.
5. D2 test files were refined during D3 (clock mechanics + capture moves) —
   disclosed in the D2 section; RED failure modes unchanged and re-verified.
6. e2e hygiene: every spec that saves now mocks the rpc endpoint; no e2e
   test writes to real data (fake JWT → PostgREST 401 if ever unmocked).

## D4 — battery at frozen head `9b102a3` (branch `feat/env-perf-001`)

### Main bundle BEFORE/AFTER (`vite build`, measured, not asserted)

| | raw | gzip |
|---|---|---|
| BEFORE @ base `4b4a482` (`index-DvjOuNLb.js`) | **814,032 B** | **217,063 B** |
| AFTER @ head `9b102a3` (`index-C5a0CY0J.js`) | **553,306 B** | **158,691 B** |
| Δ | −260,726 B (−32.0%) | −58,372 B (−26.9%) |

Page chunks now split out (e.g. DailyFormPage 17,630 B, OverviewPage
14,922 B, DashboardPage 33,340 B — loaded on first navigation). The audit's
~450-500 KB expectation was directionally met (553 KB; rolldown split —
noted, not tuned; manualChunks forbidden by WO).

### Full battery (all green)

- `vitest run` FULL: **31 files passed, 493 tests passed | 1 skipped (494)**
- `tsc -b`: clean
- `oxlint src`: **0 errors** (10 pre-existing warnings, all in untouched
  files: AuthProvider.tsx, Toast.tsx)
- `playwright test --workers=1` FULL: **206 passed / 0 failed** (4.7 min,
  includes the 5 new env-perf-001 pins + updated mobile pins)
- `python3 scripts/test_env_coordination_guard.py`: **Ran 344 tests — OK**
- `python3 scripts/test_env_autonomy_runtime.py`: **Ran 62 tests — OK**
- `python3 scripts/check_release_version.py`: **OK (v1.0.1; CHANGELOG entry
  v1.0.1)**
- `git diff --check`: clean (no whitespace/conflict markers)
- `git diff origin/main --stat`: 17 files after the docs commit (15 code/test
  files + WO + this handoff); `docs/ai/CURRENT-WORK.md` untouched.

### Release bump decision (D4, written reasoning)

**PATCH v1.0.0 → v1.0.1.** Per the CHANGELOG-documented criteria: all five
items are ปรับปรุงภายในที่ผู้ใช้อาจสังเกตได้ (faster first load, instant
form-save feedback, atomic honest save, cheaper sensor seeding, lighter
icons) — no NEW user-invokable capability (MINOR ✗), no behavior-contract
break of existing usage (MAJOR ✗). The repair-request honesty fix is a
bug-class correction (silent data loss → surfaced error) — squarely PATCH's
"แก้ไขข้อผิดพลาด". `frontend/package.json` = 1.0.1; CHANGELOG entry in Thai,
พ.ศ. 2569, Asia/Bangkok date 12 พฤศจิกายน พ.ศ. 2569, measured numbers only.
**NO tag** — tag happens post-merge + verified deploy per ENV-APP-VERSION-001
D6 (PR-ref placeholder "PR นี้" in the CHANGELOG to be fixed at merge time).

### Acceptance self-check (WO การยอมรับ)

- Bundle measured before/after: 814,032 → 553,306 B raw (−32%) ✓; no route/
  auth breakage (auth bounce, dock-nav, form, admin specs all green) ✓;
  mobile skeletons covered by existing mobile specs (all green) ✓
- Sensor feed single query: unit tests + code ✓
- createReading one atomic RPC, repair failure propagates: unit tests ✓
- Form navigate immediate, pending state visible, no optimistic insert: e2e
  pins ✓ (RED honestly re-verified against old code)
- EquipmentPage + AIAdminPage on React Query cache ✓ (cache-hit e2e pin)
- 2 PNGs <40 KB with near-lossless metrics ✓ (no follow-up needed)
- Migration applied with preflight + verbatim output in this handoff ✓;
  rollback SQL in WO (schema-only, reviewed against the created function) ✓
- Release: PATCH reasoning written ✓; tag deferred post-merge/deploy ✓
- Battery all green at frozen head ✓; no forbidden file touched EXCEPT the
  disclosed `daily-form-mobile.spec.ts` boundary update (D3 deviation #1 —
  reviewer to approve or direct revert+alternative) ⚠️

**STOP — REVIEW_REQUESTED.** The implementing lane does not merge. Next:
D5 fresh-GLM independent review at exact head `9b102a3` (+ docs commit),
independent battery rerun when available, then authorized merge; D6 release
(bump already staged; tag post-deploy).
