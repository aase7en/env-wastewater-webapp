# DT-VIS-P002 — ภาษาการเคลื่อนไหวผิวน้ำบ่อเติมอากาศ (Work Order — bounded first slice)

สถานะ: **CLAIMED** — ผูกกับ claim transition PR นี้ (claim `DT-VIS-P002-C1`
generation 1; base `35516047a10a59cfaa5ff609a21ce8172190c447` = main ณ วัน
transition) วันที่: 12 พฤศจิกายน 2569 (2026-11-12)
สาขา: `docs/dt-vis-p002-claim` ใน worktree ที่จดทะเบียน
`/Volumes/MAC_WORK/DevWorkspace/Github/_worktrees/env-dtvis-p002-20261112`
ใบเสร็จถาวรอยู่ใน `docs/ai/handoffs/DT-VIS-P002-CODEX.md`
Task: `DT-VIS-P002` (task row ใหม่ — ตรวจความซ้ำของ task_id กับทะเบียนผ่าน
guard แล้ว ไม่มี OWNERSHIP_CONFLICT; claim id คือ `DT-VIS-P002-C1`) — เป็น
**slice แรกแบบมีขอบเขต** ของรายการ DT-VIS-P002 บน micro-step board
(`docs/ai/digital-twin/03-MICRO-STEP-BOARD.md`, Status: BACKLOG — claim นี้เป็น
ตัวเปิดใช้; board Owner: Codex) ต่อยอดจาก DT-VIS-P001 (approved, merged) และ
DT-VIS-P003 (CLOSED 2026-10-13, PR #115 `96b59fb`)

## เป้าหมาย (slice แรก — ผิวน้ำเท่านั้น)

ภาษาการเคลื่อนไหว (motion language) ของ **ผิวน้ำในบ่อเติมอากาศ** บน Digital
Twin ที่อยู่ใน `frontend/src/components/digital-twin/WastewaterTwin.tsx`
(mesh น้ำปัจจุบันที่ WastewaterTwin.tsx:227-235) ภายใต้ host
`frontend/src/components/digital-twin/TwinCanvas.tsx`:

- ผิวน้ำต้อง**สื่อว่าเป็นกระบวนการบำบัดที่กำลังเดินอยู่ ไม่ใช่บ่อน้ำประดับ
  (clear ornamental pond)** — ตามข้อจำกัด verbatim ของบอร์ด
- การเคลื่อนไหวอิง **เฉพาะ** (1) **สถานะรวมที่ validated** (validated aggregate
  state ที่มีอยู่แล้วใน Twin contract เช่น `aeratorRunning: TwinMetric<boolean>`
  บน asset `asset:aeration-tank-1`) หรือ (2) **ข้อมูลสถานการณ์จำลองที่ระบุชัด**
  (explicit scenario data, SIMULATED-labeled)
- ห้ามอิง per-equipment telemetry, ห้ามสูตรกระบวนการ (process formulas),
  ห้ามอ้าง/แสดง "ความเร็วจริง" หรือ "การไหลจริง" ของน้ำ
- unknown / UNAVAILABLE / STALE → **still state ที่สื่อความหมาย** (still state
  ต้องอ่านออกว่านี่คือบ่อเติมอากาศของกระบวนการบำบัด) — ห้ามปลอมการเคลื่อนไหว
  เพื่อแก้ภาพ
- reduced motion (`prefers-reduced-motion`) ต้องมี still state ที่สื่อความหมาย
  เช่นเดียวกัน

## ฐานอำนาจอนุมัติ (Authorization basis — บันทึกอย่างตรงไปตรงมาและครบถ้วน)

1. **Roadmap SSoT** `docs/ai/ROADMAP.md` หมวด M4 "DT-VIS-P002 / P003": P003
   ✓ COMPLETE (PR #115/#116) — **P002 เป็นรายการที่เหลือ** (aeration water/
   system motion language, BACKLOG บน micro-step board — claim นี้เปิดใช้;
   board Owner: Codex; ข้อจำกัด verbatim ของบอร์ด: "water must not resemble a
   clear ornamental pond; animation reflects only validated aggregate state or
   explicit scenario data"; Stop: "no per-equipment telemetry or process
   formulas")
2. **Roadmap Critical-path rule** (`docs/ai/ROADMAP.md` หมวด "Critical-path
   rule"): "The next eligible bounded slice is the first incomplete item whose
   dependencies are satisfied. Do not ask the user what to do next when this
   roadmap + CURRENT-WORK already provides an authorized next step" —
   dependency ของ P002 บนบอร์ด (DT-VIS-P001 approved) เป็นจริงแล้ว → P002
   เป็น slice ถัดไปที่ eligible
3. **คำสั่งเจ้าของถาวร 2026-11-11/12** (โหมด Goal, สั่งซ้ำ): เดินตาม roadmap
   ต่อไป; มอบจุดตัดสินใจให้ Jev + Terra ปรึกษาร่วมกัน
4. **Joint delegated consult 2026-11-12** (CORRECTED-INPUT re-consult —
   ปรึกษาใหม่หลังเหตุการณ์ GISTDA stale-roadmap: การปรึกษาก่อนหน้า ~1 ชม.
   เสนอ ENV-INT-GISTDA-CORE-001 ซึ่งส่งมอบไปแล้ว 2026-09 ผ่าน PR #80 —
   ข้อความ roadmap ที่ใช้ปรึกษาครั้งก่อนล้าสมัย):
   - **Terra** (`gpt-6.1-terra` ผ่าน Codex CLI read-only) เลือก
     **A = DT-VIS-P002** (Q1=A, readiness-risk 2/5) และเลือก **Q4=B: bounded
     first slice** (ภาษาผิวน้ำก่อน, สัญญาณระดับระบบทีหลัง)
   - **Jev** (`jev-1.13.0` ผ่าน jev-advisory MCP) ตอบ **D = STOP ที่ความมั่นใจ
     LOW 0.25** (เกือบเสมอกัน D=0.44 vs A=0.30) ขณะที่**ให้ค่าความคุ้มของ A
     สูงสุดในบรรดา lane ที่ทำได้ (4/5, conf 0.83)** และระบุว่าต้องให้
     project authority ตัดสิน (arbitration)
   - **การตัดสิน (arbitration)** ตามกติกา critical-path rule ของ roadmap เอง +
     คำสั่งถาวรของเจ้าของให้เดิน roadmap ต่อ — delegates เป็น advisory เท่านั้น
     (ไม่มีอำนาจ merge/review-acceptance ตามนโยบาย delegated-decision ที่ wired
     ใน `scripts/env_autonomy_runtime.py`)
   - **ทั้งสองโมเดลปฏิเสธ ENV-SYSTEM-001** (dependency M6 ยังไม่ครบ; risk 5)
     และจัดลำดับหลัง slice license/design ของ hazard (risk 4–5)
   - **ใบเสร็จครบถ้วน verbatim** (คัดลอกถาวรแล้ว): หมวด D0 ของ
     `docs/ai/handoffs/DT-VIS-P002-CODEX.md`
     (แฟ้มต้นทาง /tmp/terra-nextlane2-receipt-2026-11-12.txt +
     /tmp/jev-nextlane2-consult-2026-11-12.txt +
     /tmp/jev-nextlane2-consult-2026-11-12.json — /tmp เป็น storage ชั่วคราว
     สำเนาถาวรคือสิ่งที่อยู่ใน handoff)

## ขอบเขตสืบทอดจาก DT-VIS-P003 / DT-VIS-P001 (ผูกเป็นข้อบังคับ)

- Aura design tokens; ป้าย/ข้อความภาษาไทยทั้งหมด
- คำศัพท์ความจริง `LIVE` / `LATEST` / `HISTORICAL` / `SIMULATED` / `STALE` /
  `UNAVAILABLE` ตามที่ P003 วางไว้ — สีเป็นคิวรองเท่านั้น
- reduced motion ต้องมี still state ที่สื่อความหมาย
- mobile 360/390/430 — องค์ประกอบสำคัญต้องอยู่นอก Canvas ได้ครบถ้วน /
  WebGL-failure fallback ไม่สูญเสียความหมาย
- เป้า hit 44px; เข้าถึงได้ด้วย keyboard
- วันที่แสดงผลเป็น พ.ศ. (ค.ศ. + 543); ไม่มี PHI; ไม่มี write จริงใน tests

## Execution routing (precedent DT-VIS-P003)

- **D2** — GLM Track-Z: RED-first tests ก่อน (truthful failures บันทึกถาวร)
- **D3** — Codex CLI `gpt-6-sol` @ `model_reasoning_effort=max` ภายใต้ Role B
  **single-writer window** (ตามคำสั่ง routing 2026-10-12 + การอนุมัติโมเดล
  2026-10-13 ของเจ้าของ, precedent DT-VIS-P003 WO/PR #114): admission probe
  ก่อน dispatch **หนึ่งครั้งตาม fingerprint ที่เปลี่ยนแปลงสำคัญ** (ไม่ probe
  ซ้ำบน fingerprint เดิม — หลักฐาน admission เดิมใช้ซ้ำได้); ถ้า dispatch จริง
  คืน provider admission error → **จดสถานะ BLOCKED ในทะเบียน ห้าม fallback
  เงียบ** — ไม่มี GLM รับงาน Track-F แทนเอง, ห้าม GPT-6 Astra เด็ดขาด
- **D4** — GLM: integration + battery เต็ม (tsc + lint + FULL vitest + Playwright
  twin regression + spec ใหม่ + diff-check + scope-exact + guard 344/344)
- **D5** — fresh-GLM cross-model review เทียบกับ Codex author (Terra ผ่าน Codex
  CLI eligible เป็น cross-model reviewer สำรองตาม precedent N2/P003; GPT-6
  Astra ห้าม; never author-and-approve; never silent downgrade)
- **Implementer ห้าม merge ตัวเอง — lane หยุดที่ REVIEW_REQUESTED เสมอ**

## Deferred — system-level motion cues

**สัญญาณการเคลื่อนไหวระดับระบบ (system-level motion cues — เช่น flow ระหว่าง
ถัง/ขวดโหล/สาย process) = DEFERRED ออกจาก slice นี้ทั้งหมด** ไปเป็น successor
slice ในอนาคต ซึ่งต้องมี **claim ใหม่ผ่าน transition ที่รีวิวเป็นของตัวเอง** —
claim/WO นี้ห้ามเริ่มหรือเตรียมงานส่วนนั้น (no silent scope expansion)

## Scope (mutable, exactly — ตรงกับ registry claim entry, one-writer)

ไฟล์ Twin ภาพจริงที่ตรวจยืนยันแล้ว (grep frontend/src):

- `frontend/src/components/digital-twin/WastewaterTwin.tsx` — ผิวน้ำ/motion
  ภาษาของบ่อเติมอากาศ (mesh น้ำ + คิวการเคลื่อนไหว)
- `frontend/src/components/digital-twin/TwinCanvas.tsx` — host: สาย aggregate
  state ที่ validated (`tank.aeratorRunning` ฯลฯ) + `reducedMotion` ที่มีอยู่
- ไฟล์ test: `frontend/tests/e2e/dt-vis-p002.spec.ts` (ใหม่ — RED-first),
  `frontend/tests/e2e/digital-twin.spec.ts`,
  `frontend/tests/e2e/digital-twin-visual.spec.ts` (regression pins)
- `docs/work-orders/DT-VIS-P002.md` (WO นี้)
- `docs/ai/handoffs/DT-VIS-P002-CODEX.md` (append checkpoints)
- `docs/ai/CURRENT-WORK.md` (เฉพาะ transition ถัดไปที่รีวิวแล้ว)
- `docs/ai/digital-twin/03-MICRO-STEP-BOARD.md` (**เฉพาะบรรทัดสถานะ P002 เมื่อ
  CLOSEOUT เท่านั้น — ไม่อยู่ใน PR transition นี้**)

## Forbidden (ห้ามแตะ)

ไฟล์เรื่องราว /flow: `frontend/src/components/flow/**`,
`frontend/src/pages/FlowDiagramPage.tsx`; lib สถานการณ์/ตัวเลข:
`frontend/src/lib/process-scenario.ts`, `frontend/src/lib/process-scenarios.ts`,
`frontend/src/lib/process-scenario.test.ts`,
`frontend/src/lib/environmental-flow.test.ts`; provenance/GISTDA:
`frontend/src/lib/env-int/**`; `frontend/src/components/pfd/**`;
`frontend/src/components/digital-twin/p003/**` (พื้นผิว P003 ที่ส่งมอบแล้ว);
`frontend/src/lib/twin/**` (data contracts — อ่านอย่างเดียว);
`frontend/src/pages/DashboardPage.tsx`, `OperationsPage.tsx`,
`BuildingPage.tsx`; `supabase/**`; `docs/ai/digital-twin/
11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md` (อ่านอย่างเดียว — บังคับอ่าน
ก่อนออกแบบพฤติกรรม); `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md` (อ่าน
อย่างเดียว); `docs/ai/HANDOFF.md`; `AGENTS.md`; `scripts/**`; `.github/**`;
`data/**`; `.env` และทุกไฟล์ที่ไม่อยู่ใน claimed list — ห้ามสร้าง telemetry
inference ใหม่, ห้ามสร้าง per-equipment state จากข้อมูลรวม, ห้ามเครื่องยนต์
3D ที่สอง, ห้ามใช้คำว่า LIVE กับค่าจำลอง

## ขั้นตอน (D-plan)

- **D1** — GLM: ออกแบบ contract ภาษาการเคลื่อนไหวผิวน้ำ (mapping จาก aggregate
  metric ที่ validated → คิวการเคลื่อนไหว; truth table ของ still/motion ตาม
  source/freshness/mode; อ่าน 11-UTHAI ก่อน — read-only) — ไม่มี inference ใหม่
- **D2** — GLM: RED tests ก่อน (`dt-vis-p002.spec.ts`: ภาษาไทย, ป้าย
  SIMULATED/UNAVAILABLE ครบ, still state ภายใต้ reduced-motion และ
  WebGL-failure, mobile 390/430, ห้ามคิวเคลื่อนไหวเมื่อ unknown) — truthful
  failures บันทึกถาวร
- **D3** — Codex CLI `gpt-6-sol` @ max (Role B, single-writer window — WO
  precedent P003; จบหน้าต่างด้วยรายการ D3→D4 transfer ใน handoff)
- **D4** — GLM: battery เต็ม + handoff checkpoint + freeze exact head
- **D5** — independent review ที่ exact head; repair rounds ตามผล; lane หยุดที่
  REVIEW_REQUESTED — merge เป็นของผู้รีวิวที่ได้รับมอบอำนาจเท่านั้น
- **Closeout** (PR ถัดไปที่รีวิวแล้ว): บอร์ด P002 status + WO completion record
  + ทะเบียน

## การยอมรับ (Acceptance)

- ผิวน้ำบ่อเติมอากาศอ่านออกว่าเป็นกระบวนการบำบัด ไม่ใช่บ่อประดับ (ทั้งโหมด
  เคลื่อนไหวและ still state)
- คิวการเคลื่อนไหวปรากฏเฉพาะเมื่อ (1) สถานะรวม validated มีอยู่ หรือ (2)
  โหมด/ข้อมูล SIMULATED ที่ระบุชัด — unknown/unavailable/stale แสดง still
  state จริงใจ เท่านั้น (tests pin ทุกกรณี)
- reduced-motion + WebGL-failure + mobile 390/430: ความหมายครบถ้วนนอก Canvas
- ทดสอบเดิมทั้งหมด (twin regression + p003 spec) ไม่ถูกทำให้เสีย
- Battery D4 ทุกประตูเขียวที่ head ที่ freeze; ไม่มีไฟล์ forbidden ถูกแตะ
- พ.ศ. สำหรับวันที่ทุกจอ (ค.ศ. + 543)

## Review plan

Claim transition (PR นี้) = รีวิวอิสระ exact-SHA (R2 floor: fresh-GLM; cross-model
R3 ที่ admission เอื้อ — Terra eligible, Astra ห้าม). Implementation PR = fresh
GLM reviewer (cross-model เทียบ Codex author; Terra สำรองได้ตาม precedent).
Implementing lane ไม่เคย merge PR ของตัวเอง
