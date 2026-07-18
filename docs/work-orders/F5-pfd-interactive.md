# WO-F5: PFD interactive drill-down
Status: in_progress (logic-half only, zcode substituting sonnet) — claim `<TBD>`
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
