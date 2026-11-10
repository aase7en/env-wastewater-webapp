# ENV-VIS-STORY-001-NUM-N2-ACTIVATION — เปิดใช้ N2 ปริมาตรที่สัมผัสระหว่างช่วงเหตุการณ์ (Work Order, C2 slice)

สถานะ: **CLAIMED** — ผูกกับ claim transition PR นี้ (claim
`ENV-VIS-STORY-001-NUM-C2` generation 1; base
`1908cea2a2abcae0cc52df63967b0fcc94c22766` = main ณ วัน transition)
วันที่: 11 พฤศจิกายน 2569 (2026-11-11)
สาขา: `docs/env-visstory-001num-n2-claim` ใน worktree ที่จดทะเบียน
`env-visstory-001num-n2` ใบเสร็จถาวรอยู่ใน
`docs/ai/handoffs/ENV-VIS-STORY-001-NUM-GLM.md`
Task: `ENV-VIS-STORY-001-NUM-N2` (task row ใหม่สำหรับ slice เปิดใช้ N2 —
schema ของ registry ห้าม task_id ซ้ำกับ task `ENV-VIS-STORY-001-NUM` ที่ยัง
มี claim C1 CLOSED ค้างอยู่ในทะเบียน; claim id คือ
`ENV-VIS-STORY-001-NUM-C2` ตามที่กำหนด) — เป็น slice ต่อยอดจาก C1 ที่ CLOSED
แล้วผ่าน PR #158 `fe96f7f` — slice เดิมส่งมอบ N3+N4-contract และแผ่นอ้างอิง
relay แบบโครงกระดาษรอค่าเจ้าของเท่านั้น ไม่มีโค้ด derivation ของ N2)

## ฐานอำนาจอนุมัติ (Authorization basis)

1. **การตัดสินใจของเจ้าของโดเมน 10 พฤศจิกายน 2569 บน issue #110**
   (บันทึก verbatim-substance ใน registry และ WO ของ C1): N2
   (ปริมาตรที่สัมผัสระหว่างช่วงเหตุการณ์ / volume exposed) = **DEFERRED
   ไม่ใช่ปฏิเสธ** — เจ้าของระบุว่าอุปกรณ์เดินบน relay duty timer และ
   N2 จะเปิดใช้ได้เมื่อแผ่นอ้างอิงรอบจ่ายไฟมีค่าที่เจ้าของกรอกแล้วเท่านั้น
2. **ข้อมูล relay ที่เจ้าของกรอก/ยืนยันแล้ว 10 พ.ย. 2569** — อยู่บน main
   แล้วผ่าน commit `b18e515` (เจ้าของกรอกข้อมูลแผ่นอ้างอิง) และ `1908cea`
   (เจ้าของยืนยันการจับคู่ ras_pumps + กลไกวาล์วเลือกทางน้ำตะกอน RAS/WAS
   ชุดเดียวกัน) — ใบเสร็จแชตของเจ้าของระบบ 10 พ.ย. 2569 บันทึกถาวรใน
   `docs/ai/design/ENV-VIS-STORY-001-NUM-RELAY-DUTY-CYCLE-REFERENCE.md`
   (commit ทั้งสองเป็นบรรพบุรุษของ main head 1908cea ณ วันเปิด claim นี้)
3. **เนื้อหากำกับ (frozen)**:
   `docs/ai/design/ENV-VIS-STORY-001B-NUMERIC-APPROVAL-PACKET.md` (merged
   PR #141 แล้วรีวิวอิสระ APPROVED) แถว N2 (~line 38): คลาสผลกระทบ
   "ปริมาตรที่สัมผัสระหว่างช่วงเหตุการณ์ (volume exposed)" สถานการณ์ที่เกี่ยว
   หยุดเติมอากาศ / หยุด RAS / หยุดจ่ายคลอรีน รูปแบบสูตร **ปริมาตรน้ำเข้าที่บันทึก
   × กรอบเวลาสัมผัส (สมมติ)** และข้อบังคับรายรายการเช่นเดียวกับ N1 (mapping
   สถานการณ์, ปัจจัยทุกตัวระบุที่มา, หน่วย, วันที่/แหล่งข้อมูลนำเข้า,
   ความไม่แน่นอน, ขอบเขตการตีความ) — ทุกค่า SIMULATED-labeled เสมอ
   ห้ามแทนค่าศูนย์ ห้ามอ้างเป็นข้อมูลสังเกตการณ์

## เป้าหมาย

เปิดใช้ N2 (ปริมาตรที่สัมผัสระหว่างช่วงเหตุการณ์ — volume exposed,
SIMULATED-labeled เสมอ) ในหน้า /flow **เฉพาะสองสถานการณ์**:

- **หยุดเติมอากาศ** (loss-of-aeration)
- **หยุด RAS** (ras-stop)

โดยแสดงบนหน้า /flow ผ่านระบบ chip เชิงตัวเลข SIMULATED ที่ C1 วางไว้แล้ว
(contract + derivation + view แยกจาก `deriveScenarioState` ที่ byte-frozen)
— **ไม่มีเครื่องยนต์ flow ที่สอง ไม่มี renderer ที่สอง** (กติกา issue #110
ข้อ 5)

**OMISSION บังคับ — สถานการณ์ หยุดจ่ายคลอรีน (chlorine-stop): N2 ของ
สถานการณ์นี้ งดแสดง (omitted) เด็ดขาด** — เจ้าของยืนยันแล้ว (แผ่นอ้างอิง
แถว 6-7 ช่องยืนยัน ☐) ว่าเครื่องจ่ายคลอรีน **ไม่มีรอบตั้งเวลาคงที่**
(ทำงานตามเงื่อนไขค่า free chlorine ที่สูง) → **ไม่มีฐานตัวเลขสำหรับ
กรอบเวลาสัมผัส** — ห้ามแทนค่าศูนย์ ห้ามเดา ห้ามเติมค่าตัวอย่าง
(state = omitted, ไม่ render อะไรเลย — พฤติกรรม fail-closed เดียวกับ
no-factor-no-effect ของ N4)

## ฐานหลักฐาน (Evidence basis — เจ้าของกำหนด 10 พ.ย. 2569)

ที่มาทั้งหมด: แผ่นอ้างอิง relay
`docs/ai/design/ENV-VIS-STORY-001-NUM-RELAY-DUTY-CYCLE-REFERENCE.md`
`sourceId = "relay-duty-cycle-reference"` — เจ้าของระบบแจ้งทางแชต
(Kilo remote session) และช่องยืนยัน ☑ ครบสำหรับหน่วยที่ใช้:

| หน่วยอุปกรณ์ | ทำงาน นาที/รอบ | หยุด นาที/รอบ | ช่องยืนยันเจ้าของ |
| --- | --- | --- | --- |
| เครื่องเติมอากาศ 1 (`aerator_1`) | 15 | 15 | ☑ |
| เครื่องเติมอากาศ 2 (`aerator_2`) | 15 | 15 | ☑ |
| ปั๊มสูบตะกอนหมุนเวียน RAS (`ras_pumps`) | 15 | 15 | ☑ (ยืนยัน 10 พ.ย. 2569: "เครื่องสูบตะกอน" ตามที่เจ้าของเรียก = `ras_pumps` ชุดเดียวกัน) |

**สัดส่วน duty = 15 / (15 + 15) = 50%** — **ข้อความที่มาต้องระบุชัดเจนใน
UI note และ tests ว่าค่านี้เป็น "การอนุมานเลขคณิตจากค่าทำ/หยุดที่เจ้าของยืนยัน"
(declared-owner-values + arithmetic-inference) ไม่ใช่ค่าที่เจ้าของระบุตรง**
— เจ้าของไม่เคยพิมพ์เลข 50% เอง

**ข้อจำกัดความจริง (truth constraints) — ต้องสะท้อนใน UI และ tests ทุกข้อ**:

1. ค่า duty-cycle **ไม่คงที่** — เจ้าของแจ้งว่าค่าอาจเปลี่ยนตามแต่ละ
   สถานการณ์ (บันทึกข้อ 1 ของแผ่นอ้างอิง)
2. เครื่องเติมอากาศ **ช่วงเช้าของการทำงานจริงเปิดค้างแบบ manual**
   (ไม่ได้อยู่ auto 100%) — รอบจริงจึงไม่คงที่
3. **รอบ/วันไม่ทราบ** (คอลัมน์ว่างทั้งหมด) — ห้ามเติมค่า ห้ามอนุมาน
   จำนวนรอบต่อวัน ห้ามใช้คำว่า "ต่อวัน" กับค่าใด ๆ ที่ได้
4. วาล์วเลือกทางน้ำตะกอน (RAS/WAS ชุดเดียวกัน) เป็น **การเปิด-ปิดด้วยมือ
   และไม่มีบันทึกสถานะวาล์วในระบบ** (เจ้าของยืนยัน 10 พ.ย. 2569, commit
   `1908cea`) — ห้ามแสดง/อ้างสถานะวาล์วใด ๆ
5. ข้อมูลแผ่นนี้เป็น **manual reference ไม่ใช่ telemetry** — ไม่ใช่ข้อมูล
   live ไม่เข้าระบบเป็นข้อมูลสังเกตการณ์ (unknown ≠ zero, latest ≠ live)

## สูตรและความหมายกรอบเวลา (ตาม packet, frozen)

ปริมาตรที่สัมผัส N2 = **ปริมาตรน้ำเข้าที่บันทึก × กรอบเวลาสัมผัส (สมมติ)**
— ค่า "ปริมาตรน้ำเข้าที่บันทึก" ใช้ค่า recorded `wastewater_in` เดิม
(บันทึกจริงไม่ถูกแก้) ส่วน "กรอบเวลาสัมผัส (สมมติ)" เป็นสมมติฐานแบบจำลอง
ที่มาจาก duty-cycle ของหน่วยอุปกรณ์ตามฐานหลักฐานข้างต้น

**ความหมาย exact ของ exposure-window (กรอบเวลาสัมผัส) ยังไม่กำหนด ณ WO นี้**
— ต้องผ่าน **delegated AI-decision consult แบบร่วม (Jev + Terra) ก่อนเขียน
D2 RED tests** ตามนโยบาย delegated-decision ของเจ้าของ 2026-11-08 ที่ wired
อยู่ใน `scripts/env_autonomy_runtime.py` (JEV = read-only advisory ผ่าน
TypeSafe-direct; Terra = architecture_consult ผ่าน Codex CLI; delegates
ไม่มีอำนาจ merge/review-acceptance) และตามแบบแผนใบเสร็จ consult ใน
`docs/ai/handoffs/ENV-FLEET-ROUTER-001-GLM.md` (receipts คัดลอกถาวร
verbatim ลง handoff ของ lane นี้) — คำถาม consult: semantics ของ
"กรอบเวลาสัมผัส" ระหว่างช่วงเหตุการณ์ (เริ่ม/สิ้นสุด window เทียบกับ
สถานการณ์ที่ apply, duty fraction เข้าสูตรตรงไหน, การ propagade unknown)
— ผลลัพธ์ consult เป็น **advisory ต่อการออกแบบ D1** ไม่ใช่อำนาจอนุมัติ
(อำนาจอนุมัติคือการตัดสินใจ issue #110 ของเจ้าของ + packet ที่ frozen อยู่แล้ว)

## D-phases

- **D1** design + delegated consult (Jev + Terra ร่วม, receipts ถาวร) —
  typing contract ของ N2 (ต่อยอด `ScenarioDefinition.numericEffects` +
  `ScenarioActivityBaseEvidence` envelope ที่ C1 วางไว้: sourceId-bound
  `relay-duty-cycle-reference`, status `confirmed-by-owner`, period
  semantics ตามผล consult) → **D2** RED tests ก่อน (truthful failures
  บันทึกถาวร — ทำได้เมื่อ consult เสร็จแล้วเท่านั้น) → **D3** implement
  ตาม D2 (derivation pure function แยก, SIMULATED labels ภาษาไทย, หน่วย
  กำกับทุกเลข, ที่มา + ความไม่แน่นอน + ขอบเขตการตีความมองเห็นได้,
  omission ของ chlorine-stop render ไม่มีอะไร) → **D4** battery: vitest
  รวม tests ใหม่ (focused + FULL) + tsc + lint + Playwright /flow
  (รวมเคส N2 ใหม่ + เคส omission คลอรีน) + guard 344/344 + runtime 62/62
  + scope-exact ตามรายการไฟล์ + diff-check → **D5** cross-model review
  (GPT-6.1 Terra ผ่าน Codex CLI ตาม routing ของ C1 — GLM เขียนทั้งสอง track
  จึง PREFERRED cross-model; fresh-GLM R2 เป็น floor; GPT-6 Astra ห้าม;
  never author-and-approve; never silent downgrade) — **ห้าม implementer
  merge ตัวเอง; lane หยุดที่ REVIEW_REQUESTED เสมอ**

## Scope (mutable, exactly — ตรงกับ registry claim entry, one-writer)

- `frontend/src/lib/process-scenario.ts` — typing + derivation ของ N2
- `frontend/src/lib/process-scenarios.ts` — catalog declaration ของ N2
  (aeration-stop + RAS-stop เท่านั้น; ไม่มี declaration ของ chlorine-stop)
- `frontend/src/components/flow/EnvironmentalFlowStory.tsx` — wiring chip
  SIMULATED ของ N2
- `frontend/src/pages/FlowDiagramPage.tsx` — ประโยค vocabulary SIMULATED
  (ถ้าจำเป็น)
- ไฟล์ test ที่เกี่ยว: `frontend/src/lib/process-scenario.test.ts`,
  `frontend/src/lib/environmental-flow.test.ts`,
  `frontend/tests/e2e/environmental-flow.spec.ts`
- `docs/work-orders/ENV-VIS-STORY-001-NUM-N2-ACTIVATION.md` (WO นี้)
- `docs/ai/handoffs/ENV-VIS-STORY-001-NUM-GLM.md` (append receipts)
- `docs/ai/CURRENT-WORK.md` (เฉพาะ transition ถัดไปที่รีวิวแล้ว)

## Forbidden (ห้ามแตะ)

`docs/ai/design/ENV-VIS-STORY-001B-NUMERIC-APPROVAL-PACKET.md` (frozen),
`docs/ai/digital-twin/11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md`,
`docs/ai/design/ENV-VIS-STORY-001-NUM-RELAY-DUTY-CYCLE-REFERENCE.md`
(ข้อมูลเจ้าของ — อ่านอย่างเดียว), `docs/ai/HANDOFF.md`,
`docs/ai/DEFECT-MEMORY.md`, `AGENTS.md`, `scripts/**`, `supabase/**`,
`.github/**`, `data/**`, `.env`,
`frontend/src/components/digital-twin/**`,
`frontend/src/components/pfd/**`, `frontend/src/lib/twin/**`,
`frontend/src/components/flow/WastewaterFlowDiagram.tsx` และทุกไฟล์ที่ไม่
อยู่ใน claimed list — ไม่มี N1 code path, ไม่มี water-quality projection,
ไม่มี operational writes, ห้ามใช้คำว่า LIVE กับค่าจำลอง

## การยอมรับ (Acceptance)

- หยุดเติมอากาศ / หยุด RAS: chip N2 SIMULATED แสดงเมื่อครบเงื่อนไข
  (declaration `confirmed-by-owner` + evidence sourceId ตรง
  `relay-duty-cycle-reference` + ค่า recorded `wastewater_in` มีอยู่) —
  ขาดข้อใดข้อหนึ่ง → omitted ไม่ render, **ไม่มีทาง render 0**
- หยุดจ่ายคลอรีน: ไม่มี declaration, ไม่มี chip, tests pin การ omission
- ทุกจอแสดง: ป้าย SIMULATED, หน่วย, ที่มา (owner-declared relay values +
  arithmetic duty inference), ความไม่แน่นอน, ข้อจำกัดความจริงทั้ง 4 ข้อ
- Qualitative contract ของ 001B และ pin เดิมทั้งหมดไม่ถูกแก้
  (`deriveScenarioState` byte-frozen)
- Battery D4 ทุกประตูเขียวที่ head ที่ freeze; ไม่มีไฟล์ forbidden ถูกแตะ
- พ.ศ. สำหรับวันที่ทุกจอ (CE + 543)
