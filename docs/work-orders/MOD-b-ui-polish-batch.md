# WO-MOD-*-b: UI polish สำหรับ 8 module page (WaterSupply/Garbage/Fuel/Garden/Building/Safety/Food/Chemical)
Status: done (2026-07-19, zcode) — commit `c87fc81`
Lane/files: `frontend/src/pages/{WaterSupply,Garbage,Fuel,Garden,Building,Safety,Food,Chemical}Page.tsx`
Branch: main
Model tier: **cheap-ok** (GLM — search-and-replace สูตรเดียวทั้ง 8 ไฟล์)

## บริบท

8 module page ส่งฟังก์ชันได้ครบ (CRUD + list) ตั้งแต่ MOD-*-a (commit
`28cef54`) แต่ header + container เป็น skeleton แบบเดิม:
```tsx
<div className="p-4 space-y-6">
  <h1 className="text-2xl font-bold font-thai">{หัวเรื่องไทย}</h1>
```

เทียบกับ CarbonPage (golden reference, F4.5 conform + Aura polish) header:
```tsx
<div className="max-w-5xl mx-auto space-y-5">
  <header className="flex items-end justify-between gap-3 flex-wrap">
    <div>
      <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
        <span className="text-aura-textMain">{หัวเรื่องไทย part 1}</span>
        <span className="aura-text-gradient">{หัวเรื่องไทย part 2}</span>
      </h1>
      <p className="text-sm text-aura-textMuted font-thai mt-1">{subtitle}</p>
    </div>
  </header>
```

Gap คือ container + header polish. **เนื้อหาใน AuraCard แต่ละหน้า (form/list)
ห้ามแตะทุกบรรทัด — เปลี่ยนเฉพาะ 2 จุดบนสุดของ return** (container div +
h1).

## Goal + Acceptance
1. ทุกไฟล์ใน Lane: container div เปลี่ยนจาก `p-4 space-y-6` →
   `max-w-5xl mx-auto space-y-5`
2. h1 เปลี่ยนจากแบบเดิม → แบบ CarbonPage (font-display tracking-tight
   + responsive text-2xl md:text-3xl + แยก `text-aura-textMain` กับ
   `aura-text-gradient` ครึ่งหลัง)
3. เพิ่ม subtitle `<p className="text-sm text-aura-textMuted font-thai mt-1">`
   บรรทัดเดียวใต้ h1 — เนื้อหาตามตารางข้างล่าง (บรรยาย module สั้น ๆ)
4. **ห้ามแตะ**: ภายใน AuraCard, ฟอร์ม, ตาราง, ปุ่ม, toast, hook, logic.
   เปลี่ยนเฉพาะ container + h1 + เพิ่ม subtitle
5. `npm run build` ผ่าน + `npx playwright test` 20 passed

## Mapping table — h1 split + subtitle สำหรับแต่ละหน้า

| File | h1 part 1 (text-aura-textMain) | h1 part 2 (aura-text-gradient) | subtitle |
|---|---|---|---|
| WaterSupplyPage | น้ำประปา | บาดาล | บันทึกคุณภาพน้ำบาดาลรายวัน — pH / คลอรีน / ความขุ่น / coliform |
| GarbagePage | การ | จัดการขยะ | บันทึกปริมาณขยะแยกตามประเภท — ทั่วไป / ติดเชื้อ / รีไซเคิล |
| FuelPage | การ | ใช้เชื้อเพลิง | บันทึกการจ่ายน้ำมัน — ดีเซล / เบนซิน / LPG (Scope 1 carbon source) |
| GardenPage | งาน | สวนและภูมิทัศน์ | บันทัดรอบตรวจและดูแลพื้นที่สีเขียว — ปุ๋ย / ยาฆ่าแมลง / อุปกรณ์ |
| BuildingPage | ตรวจ | อาคารสถานที่ | รอบตรวจอาคาร — พื้น / ฝาผนัง / ไฟ / น้ำ / สุขภัณฑ์ → repair_request |
| SafetyPage | ตรวจ | ความปลอดภัย | รายเดือน — อุปกรณ์ดับเพลิง / ทางเหยียบ / ฉุกเฉิน |
| FoodPage | ตรวจ | ครัวและอาหาร | ห้องครัวโรงพยาบาล — แหล่งอาหาร / ล้างจาน / ตรวจแลป / reagent |
| ChemicalPage | คลัง | เคมี | ต้นแบบ / รับเข้า / เบิกออก — ยอดคงคลัง + การเคลื่อนไหว |

## Steps (ทำซ้ำ 8 ครั้ง — 1 ครั้งต่อไฟล์)

1. อ่านบรรทัด container + h1 ปัจจุบันของไฟล์
2. ใน `return (`:
   - แทน `<div className="p-4 space-y-6">` ด้วย
     `<div className="max-w-5xl mx-auto space-y-5">`
   - แทน `<h1 className="text-2xl font-bold font-thai">{X}</h1>` ด้วย
     ```tsx
     <header className="flex items-end justify-between gap-3 flex-wrap">
       <div>
         <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
           <span className="text-aura-textMain">{part1}</span>
           <span className="aura-text-gradient">{part2}</span>
         </h1>
         <p className="text-sm text-aura-textMuted font-thai mt-1">{subtitle}</p>
       </div>
     </header>
     ```
3. ห้ามแตะบรรทัดอื่น
4. build + playwright เมื่อครบทุกไฟล์

## Forbidden
- ห้ามแตะ AuraCard / form / list / ปุ่ม / ตรรกะในไฟล์
- ห้ามเพิ่ม hook / state / import ใหม่
- ห้ามแตะ className ของ AuraCard หรือตาราง
- ห้ามลบ toast หรือลบฟังก์ชัน
- ถ้า structure ของไฟล์ไหนไม่ตรง pattern ข้างบน (เช่น ChemicalPage มี
  structure ซับซ้อนกว่า) → บันทึก checkpoint + skip ไฟล์นั้น อย่าเดา

## Verify commands
```
cd frontend && npm run build && npx playwright test   # 20 passed
```

## Checkpoint log
- [2026-07-19] zcode: เขียน WO verbatim สูตร search-and-replace — รอ execute
- [2026-07-19] zcode: execute ครบ 8 ไฟล์ — container `p-4 space-y-6` → `max-w-5xl mx-auto space-y-5`, h1 เดิม → CarbonPage pattern (font-display tracking-tight + text-aura-textMain + aura-text-gradient), เพิ่ม subtitle 1 บรรทัด. แต่ละไฟล์แตะ 2 จุดบนสุดของ return เท่านั้น — AuraCard/form/list ไม่ถูกแตะ
  - **verify**: npm run build ✅ · npx playwright test 20/20 ✅
  - **typo fix bonus**: GarbagePage เดิม "ขย้า / การเก็บขยะ" (พิมพ์ผิด) → "การ จัดการขยะ"
- **pending Track F (deeper polish)**: EmptyState แทน "ไม่มีข้อมูล" แบบ raw, summary tiles, mobile spacing audit — ไว้สำหรับ Fable5 รอบถัดไป
