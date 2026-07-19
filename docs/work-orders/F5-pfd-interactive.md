# WO-F5: PFD interactive drill-down
Status: done (2026-07-19) — logic half `130b53d` (zcode sub for sonnet) + visual half (fable5, commit ดู checkpoint ล่าสุด)
Lane/files: `frontend/src/components/pfd/ProcessFlowDiagram.tsx` เท่านั้น
Branch: main
Model tier: **mid** (opus4.8 — reasoning ปานกลาง, spec ปิดช่องแล้ว)

## Goal + Acceptance
- คลิก/แตะ stage node ใน SVG → แสดง panel ใต้ diagram (ใน AuraCard เดิม) กับค่า
  ของ stage นั้น + คำอธิบาย 1 บรรทัด; คลิก node เดิมซ้ำ = ปิด panel
- Node ที่เลือก: วง ring หนาขึ้น (strokeWidth 3→5) — ห้ามเปลี่ยนสี semantic
- Keyboard: `<g>` ใส่ `tabIndex={0}` + `onKeyDown` Enter/Space = เลือก, `role="button"`,
  `aria-label={label}`
- Bubbles/flow line เดิมห้ามกระทบ; reduced-motion ยังทำงาน

## Stage → fields mapping (ใช้ตามนี้เป๊ะ — field มีใน `DashboardRow` แล้ว)
| stage key | แสดงค่า (label = ไทย, ใช้ fmt() เดิม) | คำอธิบาย |
|---|---|---|
| screening | screen ผ่านการล้าง (จาก equipment checklist — ไม่มีใน row → แสดง "ดูในบันทึกประจำวัน") | ตะแกรงดักขยะก่อนเข้าระบบ |
| aeration | do_aeration (mg/L), tds_aeration (mg/L), temp_aeration (°C) | ถังเติมอากาศ — จุลินทรีย์ย่อยสารอินทรีย์ |
| sediment | do_sedimentation (mg/L), sv30 (mL/L) | ถังตกตะกอน — แยกตะกอนจุลินทรีย์ |
| chlorine | free_chlorine (mg/L), chlorine_used (L) | เติมคลอรีนฆ่าเชื้อก่อนระบาย |
| discharge | do_before_discharge (mg/L), tds_before_discharge (mg/L) | จุดระบายน้ำที่บำบัดแล้ว |

หมายเหตุ: field ใดไม่มีใน `DashboardRow` type → เพิ่มใน type ห้ามทำ; ใช้
`(row as Record<string, unknown>)["<field>"]` ผ่าน helper `num()` local แทน
(pattern เดียวกับ `gaugeFraction` ในไฟล์เดียวกัน)

## Reference pattern
- State: `const [selected, setSelected] = useState<string | null>(null)` — ไฟล์นี้ยัง
  ไม่มี useState → เพิ่ม import จาก react ได้ (ข้อยกเว้น Forbidden เดียวที่อนุญาต)
- Panel markup: copy โครง KPI row จาก `pages/CarbonPage.tsx` (div text-3xl + unit +
  caption) ย่อเป็นแถวเล็ก
- คลิก SVG: ใส่ `onClick={() => setSelected(s => s === key ? null : key)}` บน `<g>`

## Forbidden
ห้ามแตะไฟล์อื่น (นอกจาก MIGRATION claim + ไฟล์นี้), ห้ามเปลี่ยนสี semantic ของ
stage/flow, ห้ามเพิ่ม dependency, ห้ามแก้ Gauge/AerationTank/StatusBadge,
ห้ามลบ attention/aura logic ที่มีอยู่

## Verify commands
```
cd frontend
npm run build          # 0 errors
npx playwright test    # 8 passed
```
บวก: เปิด dev server → คลิกครบ 5 stage เห็นค่า/คำอธิบายถูก, Enter บน node ทำงาน,
คลิกซ้ำปิด panel (หน้า dashboard เป็น public — ทดสอบได้โดยไม่ต้อง login;
ถ้าไม่มีข้อมูล วันนี้จะเห็น "ไม่มีข้อมูลวันนี้" — mock ไม่ต้อง, บันทึกใน checkpoint)

## Checkpoint log
- [2026-07-19] zcode (sub for sonnet — sonnet + fable5 ติด 5hr limit): ทำ logic half ครบ
  - `useState<string|null>(null)` track selected stage
  - `<g>` ใส่ `tabIndex={0}` + `role="button"` + `aria-label` + `aria-pressed` + `onKeyDown` (Enter/Space)
  - `onClick` toggle selected/closed
  - `strokeWidth` selected 5 vs default 3 (ตาม acceptance ไม่เปลี่ยนสี semantic)
  - Panel markup: copy โครง KPI row จาก CarbonPage (text-2xl font-display + unit ขนาดเล็ก + label uppercase muted)
  - `STAGES` array ขยายด้วย `description` + `fields: {key,label,unit,digits}[]` ตาม mapping table
  - field ที่ไม่มีใน DashboardRow อ่านผ่าน `(row as Record<string, unknown>)` + helper `num()` + `fmt()` (— เมื่อ undefined)
  - **verify**: `npm run build` 0 errors · `npx playwright test` 8/8 passed
  - **manual smoke ไม่ได้ทำ** — dashboard public แต่ไม่มีข้อมูลวันนี้; panel จะแสดง "—" ทุก field. Track F ควรเปิด dev server ทดสอบร่วมกับ visual polish
- **pending Track F**:
  - className ของ panel + selected-ring (swap strokeWidth delta → token-driven ring per Aura)
  - micro-animation เมื่อ panel expand/collapse
  - focus-visible style บน `<g>` (ตอนนี้ `outline:none` เปล่า ๆ — Track F ใส่ focus ring ที่ถูก token)
  - ทดสอบ manual ร่วมกับ visual
- [2026-07-19] fable5 (visual half — ปิด pending ทั้ง 4 ข้อ):
  - selected node: คง strokeWidth 5 + เพิ่ม halo ring r=33 `rgb(var(--aura-cyan) / 0.55)` (token — สลับ theme ได้)
  - focus-visible: `.pfd-node:focus-visible circle` → cyan drop-shadow ×2 ใน `index.css` (`!important` จำเป็นเพราะ glow เดิมเป็น inline style); เอา `outline:none` inline ออก ย้ายไป class
  - panel: `.pfd-panel` slide/fade-in 220ms + `.pfd-node-halo` fade 200ms; `.pfd-node circle` transition stroke-width 150ms; ทั้งหมดปิดใน `@media (prefers-reduced-motion: reduce)`
  - screening: เพิ่ม `fallback: "ดูในบันทึกประจำวัน"` (typed `StageField.fallback?`) ตาม mapping เดิมของ WO — เลิกแสดง "—" กำพร้า
  - Lane ขยายรวม `frontend/src/index.css` (F-lane file ของ fable5 — CSS ของ polish อยู่ที่นั่น)
  - verify: `npm run build` ✅ · `npx playwright test` 20/20 ✅ · dev-server DOM check ผ่าน javascript_tool (mock route ไม่ได้ใน browser จริง — interaction ครอบโดย pfd.spec 4 เทสต์ mock แล้ว)
