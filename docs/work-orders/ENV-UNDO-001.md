# ENV-UNDO-001 — ลบรายการบันทึกรายวันแบบย้อนกลับได้ 10 วินาที → v1.1.0 (Work Order)

สถานะ: **CLAIMED — transition PR เปิดรอรีวิวอิสระ (STOP ที่ REVIEW_REQUESTED —
ห้าม merge โดย implementer เสมอ)** claim `ENV-UNDO-001-C1` generation 1;
implementation base = merge SHA ของ transition PR นี้ (pin ที่ D2 หลัง merge;
base ของ transition เองคือ `fb124ac627a287247b95310d63d252d5e5d9d7ea` =
origin/main ณ ช่วงเขียน transition = merge SHA ของ PR #175 closeout ซึ่ง
ตรวจแล้วว่า fetched/clean/ff — ค่า "last known 2e6f011" ในใบสั่งงานเป็น
merge SHA ของ PR #172 ที่ล้าสม ณ เวลาเขียน จดไว้ตรงมา); สาขา implementation
`feat/env-undo-001` (ตั้งเมื่อเริ่ม D2) ใน worktree ที่จดทะเบียน
`/Volumes/MAC_WORK/DevWorkspace/Github/_worktrees/env-undo-001-20261112`;
ใบเสร็จถาวรอยู่ใน `docs/ai/handoffs/ENV-UNDO-001-GLM.md`
Task: `ENV-UNDO-001` (task row ใหม่ — ตรวจความซ้ำของ task_id กับทะเบียน
23 แถว ณ base แล้ว **ไม่มี** `ENV-UNDO*` ก่อนหน้า ไม่มี
OWNERSHIP_CONFLICT; claim id คือ `ENV-UNDO-001-C1`)

## เป้าหมาย — ฟีเจอร์เดียว ไม่มีอื่นใดเพิ่ม (no silent scope expansion)

กระบวนการลบ "รายการบันทึกรายวันน้ำเสีย" (wastewater daily record) บนหน้า
`DailyFormPage` เปลี่ยนจาก hard-delete ทันทีเป็น **ลบแบบเลื่อนเวลา (deferred
delete) ที่ย้อนกลับได้ภายใน 10 วินาที**:

- กดยืนยันลบ (confirm เดิม) → แถวหายจาก cache/UI ทันที (optimistic) + toast
  **"ลบแล้ว"** พร้อมปุ่ม action **"ย้อนกลับ"** เป็นเวลา **10 วินาที**
  (ถ้า house pattern ของ Toast รองรับให้แสดง countdown ที่มองเห็นได้)
- กด "ย้อนกลับ" ภายใน 10 วิ → คืนแถว (refetch/invalidate) — **ไม่ต้องมี
  server round-trip เพื่อคืนข้อมูล เพราะยังไม่ได้ลบจริง** (deletion ถูกเลื่อน)
- ครบ 10 วิโดยไม่กด → **ค่อยยิง DELETE จริง** (storage semantic ยังเป็น
  hard delete เดิม — **ห้ามเพิ่มคอลัมน์ soft-delete ใหม่ใน DB** เว้นแต่ D1
  delegated consult เห็น fork จริง; การเลื่อน DELETE ออกไปจนครบหน้าต่าง
  คือกลไกที่ทำให้ undo ถูกต้องและตรงความจริงที่สุด)
- ถ้า DELETE ที่เลื่อนไว้ **ล้มเหลวตอนครบหน้าต่าง** → error toast + refetch
  (ข้อมูลกลับมาแสดง) — **ห้ามสูญเสียผลลัพธ์ทั้งสองแบบแบบเงียบ ๆ** (ห้าม
  silent loss ทั้งฝั่ง "ลบสำเร็จ" และฝั่ง "ยังอยู่")
- ลบรัวหลายรายการติดกัน → toast queue ต้องไม่พัง ทุก toast ต้องยังมี undo
  ของตัวเองครบถ้วน (ความสามารถ queue ของ house ToastProvider ให้ implementer
  ตรวจยืนยันจริงก่อน D3 — ดู source reality ด้านล่าง)

ขอบเขต **BOUNDED**: พฤติกรรมใหม่นี้ใช้กับ **flow ลบรายการบันทึกรายวันน้ำเสีย
บน DailyFormPage เท่านั้น** (+ readings cache invalidation + การต่อยอด
Toast component **แบบ minimal** ให้รองรับ action button เพราะปัจจุบันไม่มี)
โมดูลอื่นทุกโมดูลคงพฤติกรรมเดิมทุกอย่าง การ generalize ไปโมดูลอื่นเป็น
follow-up lane ที่ต้องมี claim transition ใหม่

## สภาพปัจจุบัน (source reality ณ base `fb124ac` — every file:line verified)

- `frontend/src/pages/DailyFormPage.tsx:248-258` — `onDelete`:
  `window.confirm("ยืนยันการลบรายการนี้? การกระทำนี้ย้อนกลับไม่ได้")` →
  `deleteMut.mutate(id)` → สำเร็จ `navigate("/readings")` / ล้มเหลว
  `setBanner({kind:"error", ...})` — hard delete ทันที ไม่มีทางกลับ
- `frontend/src/lib/hooks.ts:185-186` — `useDeleteReading` เรียก
  `deleteReading` ผ่าน `useReadingMutation` (deleteReading คืน
  `Promise<void>`; การตัดสินสำเร็จต้องใช้ `!error` — คอมเมนต์ WO-STAB-001
  ที่ `DailyFormPage.tsx:251-254`)
- `frontend/src/lib/supabase-queries.ts:242` — `deleteReading(id)`:
  hard delete ผ่าน Supabase client
- `frontend/src/components/ui/Toast.tsx` (105 บรรทัด) — `ToastProvider` +
  `useToast`: kind success/error/warning/info; auto-dismiss 4s (success) /
  6s (อื่น); **ไม่มี action-button support** (มีแค่ปุ่ม X ปิด);
  เป็น shared component — `useToast` ถูกใช้โดย `AiQueryBox`,
  `AiSuggestions`, `ChatPanel`, `RepairRequestModal`, `ChemicalPage`,
  `GardenPage`, `FuelPage`, `ReportsPage`, `WaterSupplyPage` + DailyFormPage
  → **การต่อยอดต้อง backward-compatible 100%** (API เดิม + พฤติกรรม
  auto-dismiss เดิมคงเดิม; test เดิมของผู้ใช้ Toast ทุกตัวต้องผ่านไม่แก้)
- Route gate: `/form`, `/form/:id`, `/readings` อยู่ใน `RequireAuth`
  (`frontend/src/App.tsx:196-224`) — **gate คงเดิมทุกอย่าง** (App.tsx
  เองถูก forbidden)

## ขอบเขตการออกแบบที่ผูกตาย (design bounds — binding)

1. **UX**: ตามหมวดเป้าหมายด้านบน — optimistic removal + toast "ลบแล้ว" +
   ปุ่ม "ย้อนกลับ" 10 วินาที (countdown แสดงได้ถ้า house pattern รองรับ);
   undo คืนข้อมูลโดยไม่ต้องมี server round-trip เพราะ DELETE ถูกเลื่อน
2. **Race/error honesty**: DELETE ที่เลื่อนล้มเหลวตอนครบหน้าต่าง → error
   toast + refetch (record returns); ห้าม silent loss ทั้งสองฝั่ง; ลบรัวหลาย
   ครั้งต้องไม่พัง toast queue (implementer ตรวจยืนยันความสามารถจริงของ
   ToastProvider ก่อน D3 และจดผลใน handoff)
3. **Scope BOUNDED**: เฉพาะ flow ลบรายการบันทึกรายวันน้ำเสียบน DailyFormPage
   + readings cache invalidation + Toast action support แบบ minimal —
   ถ้างาน visual restyle ของ toast บานเกิน minimal ให้ park ไว้เป็นของ
   Track F (จดใน handoff) ไม่ทำใน lane นี้
4. **Accessibility/mobile**: ปุ่ม undo มี tap target ≥44px, visible focus,
   ข้อความไทย; เคารพ reduced-motion ตาม house patterns
   (`.toast-in` เดิม + house reduced-motion conventions)
5. **Admin gate unchanged**: RequireAuth ทุก route เกี่ยวข้องคงเดิม —
   lane นี้ไม่แตะระบบ auth/role ใด ๆ

ทางเลือกสถาปัตยกรรม: **deferred DELETE** (เลื่อนยิง DELETE จริงจนครบ
หน้าต่าง) เป็นค่า default ที่ผูกไว้เพราะทำ undo ให้ trivially correct;
soft-delete column ใน DB **ห้ามทำ** เว้นแต่ implementer เจอ fork จริงและ
D1 delegated consult (Jev/Terra ตาม house pattern, advisory
`authoritative_for_action:false`) ชี้ขาดเป็นอย่างอื่น — ใบเสร็จ consult
ต้องฝัง VERBATIM ใน handoff; ไม่มี fork = bounds เป็นตัวตัดสิน

## แผน release (ตามเกณฑ์ CHANGELOG — ไม่ต้อง consult เพิ่ม)

- **MINOR `v1.1.0`** ตามเกณฑ์ใน `CHANGELOG.md` หมวด SemVer: "MINOR —
  ฟีเจอร์ใหม่ที่ใช้งานได้โดยไม่กระทบของเดิม" (capability ใหม่ที่ผู้ใช้เห็น:
  ย้อนกลับได้ 10 วิ); `frontend/package.json` `1.0.2` → `1.1.0`
- CHANGELOG entry ภาษาไทย วันที่ **พ.ศ.** (ค.ศ. + 543) เท่านั้น
- bump + entry ทำใน implementation PR (convention ของ lane ที่ release);
  **transition PR นี้เป็น docs-only** — ห้ามบัมป์ ห้าม CHANGELOG entry
  ห้าม tag ณ ตอนนี้
- tag ตามขั้นตอน release มาตรฐาน (D6 ใน
  `docs/ai/handoffs/ENV-APP-VERSION-001-GLM.md`): หลัง merge → รอ Pages
  deploy สำเร็จที่ merge SHA → ตรวจ live asset → push annotated tag
  `v1.1.0` ชี้ deployed merge SHA → `check_release_version.py --tag
  v1.1.0` exit 0

## ฐานอำนาจอนุมัติ (Authorization basis — บันทึกตรงไปตรงมาและครบถ้วน)

1. **การตัดสินใจของเจ้าของใน session วันที่ 2026-11-12** — หลังเห็น
   พฤติกรรมปัจจุบัน (permanent delete ที่ย้อนกลับไม่ได้: DailyFormPage
   onDelete → window.confirm "ย้อนกลับไม่ได้" → deleteReading hard delete;
   ผ่าน gate RequireAuth ระดับ route) เจ้าของอนุมัติด้วยถ้อยคำตามตรง:
   **"เรื่องบันทึก 10 วิลบย้อนกลับได้อันนี้น่าสนใจดีทำเลย"**
   (quote verbatim — รวมสำนวน "วิลบ" เดิม ห้ามแก้)
2. **คำสั่งถาวรของเจ้าของ (Goal mode)** — เดินงานตาม loop ที่บันทึกไว้:
   RED-first, battery เต็ม, รีวิวอิสระ, ห้าม merge ตัวเอง
3. **Micro-decisions**: genuine fork เท่านั้นที่เข้า D1 delegated consult
   (advisory ไม่ใช่อำนาจ merge/review) — ไม่มี fork ให้ design bounds
   ผูกตายเอง

## Execution routing (Track-Z GLM — behavior + minimal UI wiring เท่านั้น)

- **D2 — GLM Track-Z RED-first** ณ implementation base: spec ใหม่
  `frontend/tests/e2e/env-undo-001.spec.ts` + `frontend/src/components/ui/
  Toast.test.tsx` ต้อง **fail จริง** กับพฤติกรรม base ที่ยังไม่แก้ โดย
  ครอบคลุม: (a) confirm ลบแล้ว **ไม่มี DELETE ออก server ภายในหน้าต่าง
  10 วิ** (assert network — deferred); (b) undo คืนแถวสำเร็จ **ไม่มี
  refetch flicker / ไม่มี fetch เพิ่มที่มาจากการคืนข้อมูล**; (c) ครบ
  หน้าต่าง → DELETE ยิง **ครั้งเดียว**; (d) DELETE ล้มเหลวตอนครบหน้าต่าง →
  error toast + refetch (record returns); (e) ปุ่ม undo ≥44px + ข้อความไทย
  ("ลบแล้ว"/"ย้อนกลับ"); (f) ลบรัวหลายครั้ง → ทุก toast มี undo ของตัวเอง
  queue ไม่พัง — ใช้ clock control (Playwright `page.clock` / house
  clock-pin pattern ตาม PERF lane) ควบคุมหน้าต่าง 10 วิ; กรณีที่ RED ไม่ได้
  ตามธรรมชาติ ให้จดสถานะตรงมา (pin-not-red — house precedent) ห้ามอ้าง RED
  ลอย ๆ
- **D3 — GLM Track-Z implementation** ตาม mutable scope เท่านั้น
  (DailyFormPage + Toast minimal extension + hooks.ts/supabase-queries.ts
  เฉพาะเมื่อ wiring/refactor ต้องใช้จริง — conditional claim จดเหตุผลใน
  handoff ตาม PERF precedent)
- **D4 — GLM battery เต็ม** ที่ head ที่ freeze: **vitest FULL + `tsc -b` +
  lint + Playwright FULL `--workers=1` รวม case ใหม่ทั้งหมด (clock control)
  + guard 344/344 + runtime 62/62 + checker (`v1.1.0` หลัง bump) +
  `git diff --check`**
- **D5 — fresh-GLM independent review** ที่ exact frozen head (Terra ผ่าน
  Codex CLI eligible เป็น cross-model reviewer; GPT-6 Astra ห้าม; never
  author-and-approve; never silent downgrade)
- **STOP ที่ REVIEW_REQUESTED** — implementer ห้าม merge ตัวเอง; closeout
  transition (docs-only รีวิวใหม่) ปิด claim + จด frontier

## Scope (mutable, exactly — ตรงกับ registry claim entry, one-writer)

ตรวจแล้ว ณ base ว่ามีอยู่จริง (ไฟล์ spec ใหม่ 2 ไฟล์เป็นไฟล์ใหม่ที่ lane นี้
สร้าง — เป็น mutable scope ของตัวเอง):

- `frontend/src/pages/DailyFormPage.tsx` (มีอยู่ — flow ลบใหม่)
- `frontend/src/components/ui/Toast.tsx` (มีอยู่ — **ต่อยอด minimal**:
  optional action button support; API เดิมของผู้ใช้ทุกตัวคงเดิม)
- `frontend/src/lib/hooks.ts` (มีอยู่ — เฉพาะเมื่อ mutation wiring ต้องใช้)
- `frontend/src/lib/supabase-queries.ts` (มีอยู่ — เฉพาะเมื่อ refactor
  delete flow ต้องแตะ)
- `frontend/tests/e2e/env-undo-001.spec.ts` (ใหม่ — e2e หน้าต่าง undo
  พร้อม clock control)
- `frontend/src/components/ui/Toast.test.tsx` (ใหม่ — vitest action support
  + queue ทนการลบรัว; .test.tsx เป็น house precedent แล้ว — analytics,
  WaterWatchDashboard)
- `CHANGELOG.md` (มีอยู่ — entry ภาษาไทย พ.ศ. เฉพาะตอน release)
- `frontend/package.json` (มีอยู่ — bump `1.0.2` → `1.1.0` เฉพาะตอน release)
- `docs/work-orders/ENV-UNDO-001.md` (WO นี้)
- `docs/ai/handoffs/ENV-UNDO-001-GLM.md` (append checkpoints)
- `docs/ai/CURRENT-WORK.md` (**เฉพาะ claim transition ที่รีวิวแล้ว:
  transition PR นี้ + closeout transition ของ lane นี้เท่านั้น** —
  implementation PR ห้ามแตะ)

## Forbidden (ห้ามแตะ)

- ทุกหน้า/โมดูลอื่นทั้งหมด — รวม delete path ของทุกโมดูลอื่น
  (`ChemicalPage`, `GardenPage`, `FuelPage`, `GarbagePage`, `SafetyPage`,
  `FoodPage`, `WaterSupplyPage`, `BuildingPage` ฯลฯ) และ
  `frontend/src/App.tsx` (route/gate คงเดิม), `ReadingsListPage.tsx`
- `frontend/src/components/layout/VersionChip.tsx`,
  `frontend/src/components/layout/AppShell.tsx`,
  `frontend/src/lib/version.ts`, `frontend/vite.config.ts`,
  `frontend/public/**`
- `supabase/**` ทั้งหมด — ไม่มี migration, ไม่มี function, ไม่มี RLS
  เปลี่ยนใน lane นี้ (hard delete semantic คงเดิม)
- `.github/**` (CI ทุกไฟล์)
- `scripts/env_coordination_guard.py` + `scripts/test_env_coordination_guard.py`
  + `scripts/env_autonomy_runtime.py` +
  `scripts/test_env_autonomy_runtime.py` (verify-only — รันได้ แก้ไม่ได้)
  และ `scripts/**` อื่นทุกไฟล์
- `docs/ai/digital-twin/11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md`
  (อ่านอย่างเดียว), `docs/ai/design/**` (รวม approval packet),
  `docs/ai/ROADMAP.md`, `docs/ai/HANDOFF.md`, `README.md`, `AGENTS.md`,
  `MIGRATION.md`
- `.env`, `data/**`, RLS policy ทุกตัว, ข้อมูลแถวทุกแถว
- `frontend/tests/e2e/**` ทุกไฟล์นอกเหนือจาก `env-undo-001.spec.ts` ที่ claim
  (รวม `daily-form-mobile.spec.ts` — ปุ่ม ลบ ยังอยู่ครบ ไม่ต้องแตะ; หาก
  implementation ทำให้ pin เดิมของ daily-form เปลี่ยนพฤติกรรมจริง ให้หยุดและ
  จดเป็น boundary ruling ให้ผู้รีวิวชี้ขาด ไม่แก้เงียบ ๆ)
- ทุกไฟล์ที่ไม่อยู่ใน mutable scope

## ข้อจำกัดความจริง (truth constraints)

- unknown ≠ 0 (ห้ามแทนค่าศูนย์) — การ "ย้อนกลับ" ต้องคืนข้อมูลจริงทั้งแถว
  ไม่ใช่แถวว่างหรือค่าแทน
- `latest` ≠ `live` — ห้ามใช้คำ "live" กับ path ที่ไม่ใช่ telemetry จริง
- ห้าม silent loss ทั้งสองผลลัพธ์: ลบสำเร็จต้องจริง (DELETE ยิงจริงตอนครบ
  หน้าต่าง) และ undo ต้องคืนจริง; DELETE ล้มเหลวต้องแสดง error + refetch
  (record returns) ทุกครั้ง
- การต่อยอด Toast ห้ามทำพฤติกรรมเดิมของผู้ใช้ Toast รายอื่นอ่อนลงหรือ
  เปลี่ยน (auto-dismiss เดิม, API เดิม) — test เดิมทุกตัวต้องผ่านโดยไม่แก้
- ห้ามทำ assertion อ่อนลง; ห้าม RED ปลอม; RED จริงต้องจากพฤติกรรม base ที่
  ยังไม่แก้
- วันที่ user-facing (CHANGELOG) เป็น พ.ศ. (ค.ศ. + 543)
- simulation/test ทั้งหมดไม่มี write จริงต่อข้อมูลโรงพยาบาล; ไม่มี PHI;
  ห้าม print/commit token ใด ๆ
- D1 consult (ถ้ามี fork) เป็น advisory เท่านั้น
  (`authoritative_for_action:false`) — ใบเสร็จฝัง VERBATIM ห้ามสรุปแทน

## ขั้นตอน (D-plan) — ดูหมวด Execution routing ด้านบน

## การยอมรับ (Acceptance)

- D2 RED จริงและจดจำนวนตามตรง (กรณี pin-not-red จดสถานะตรงมา)
- D4 battery เต็มผ่านที่ frozen head: vitest FULL + tsc + lint + Playwright
  FULL workers=1 (รวม case ใหม่ทั้ง 6 หมวด a-f) + guard 344/344 + runtime
  62/62 + `git diff --check`
- ผู้ใช้จริงได้พฤติกรรมตาม WO: ลบ → toast "ลบแล้ว" + ปุ่ม "ย้อนกลับ" 10 วิ →
  กดแล้วรายการกลับมาครบทั้งแถว; ไม่กด → รายการถูกลบจริง; ลบรัวได้; error
  แสดงตรงมา
- release หลัง merge + deploy: package.json `1.1.0`, CHANGELOG entry ไทย
  พ.ศ., annotated tag `v1.1.0` ชี้ deployed merge SHA,
  `check_release_version.py --tag v1.1.0` exit 0
- closeout transition (docs-only, รีวิวใหม่) ปิด claim + จด frontier
  (ทั่วไปลบแบบ undo ไปโมดูลอื่น = follow-up lane ต้องมี transition ใหม่)
- ห้าม merge โดย implementer ทุก PR ของ lane นี้ — STOP ที่
  REVIEW_REQUESTED เสมอ
