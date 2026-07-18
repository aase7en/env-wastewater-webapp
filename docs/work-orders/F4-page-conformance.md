# WO-F4.1–F4.5: Per-page suite conformance (หน้าละ sub-WO — claim แยกได้)
Status: F4.1–F4.3 done · **F4.4–F4.5 open**
Lane/files: `frontend/src/pages/<หน้านั้น>.tsx` — **className/markup เท่านั้น** (logic/hook/state ห้ามแตะ)
Branch: main (cheap model ทำใน shared tree ได้ — งานไฟล์เดียว commit เร็ว)
Model tier: **cheap-ok** (glm / sonnet5) — งาน mechanical มี pattern ให้ copy ครบ

## Reference patterns (copy จากไฟล์เหล่านี้เท่านั้น — อย่าประดิษฐ์ใหม่)
- **Icon**: `import { MSymbol } from "../components/ui/MSymbol";` แล้วแทน lucide ทุกตัว:
  `<IconName className="w-4 h-4" />` → `<MSymbol name="<material_name>" className="text-[18px]" />`
  (ขนาดเทียบ: w-4=text-[16px]~[18px], w-5=text-[20px], w-8=text-[32px])
- **หัวตาราง small-caps**: copy `<tr>` header จาก `pages/ReadingsListPage.tsx` (คลาส
  `text-[11px] uppercase tracking-wider` + `font-bold` ต่อ th)
- **หน้า/การ์ด/ปุ่ม**: ดูโครงจาก `pages/CarbonPage.tsx` (golden reference: header,
  AuraCard, KPI, chip, EmptyState, Skeleton)

## Sub-WOs + icon map ที่ต้องใช้
- **F4.3 EquipmentPage** — แทน lucide (ตรวจตัวจริงในไฟล์): Wrench→`build`,
  RefreshCw→`refresh`, CheckCircle2→`check_circle`, AlertTriangle→`warning`,
  Clock→`schedule`, Plus→`add`; หัวตารางใช้ pattern ReadingsListPage
- **F4.4 ReportsPage** — icons: FileText/FileBarChart→`description`, Download→`download`,
  Printer→`print`; การ์ด template ใช้ AuraCard (static) + บรรทัด meta ล่างแบบการ์ดใน
  `design/staff_manuals_resources/screen.png` (ชื่อหนา + คำอธิบาย muted + meta เล็ก)
- **F4.5 AuthPage** — โครง: glass card (`aura-card aura-card--static p-6`) กว้าง ~max-w-md
  กลางจอ; เพิ่ม BrandWordmark **copy ทั้ง function จาก `components/layout/AppShell.tsx`
  มาไว้ในไฟล์** (อย่า export ข้ามไฟล์ — กัน scope ขยาย); ปุ่ม tab/submit ใช้ `Button`
  เดิม; **Google logo SVG สีทางการห้ามเปลี่ยน**

## Steps (ทำทีละ sub-WO, commit แยก)
1. claim sub-WO ในตาราง MIGRATION.md (`### In-progress claims`) → commit+push
2. เปิดไฟล์เป้าหมาย แทน icon ตาม map + ปรับ markup ตาม reference pattern
3. รัน Verify commands ให้ผ่านครบ
4. อัปเดต Status บนหัวไฟล์นี้ + append Checkpoint (รูปแบบดูตัวอย่างด้านล่าง)
5. commit: `chunk(F4.x): <page> conformance [next: F4.x+1]` + ปลด claim → push

## Forbidden (เกินนี้ = หยุดแล้วถามใน checkpoint แทน)
- ห้ามแก้ hook/useState/useEffect/ฟังก์ชัน logic ใด ๆ, ห้ามแก้ไฟล์อื่นนอก page เป้าหมาย
  (ยกเว้น MIGRATION claim + ไฟล์นี้), ห้ามเพิ่ม dependency, ห้ามแก้ route,
  ห้ามลบ error/loading/empty state ที่มีอยู่, ห้ามแตะ `tests/` (ถ้า smoke พังเพราะ
  markup — บันทึกใน checkpoint ให้ fable5 ตรวจ)

## Verify commands (ต้องผ่านทุกข้อก่อน commit)
```
cd frontend
npm run build          # ต้องจบด้วย "built in" ไม่มี error TS
npx playwright test    # ต้อง 8 passed
```

## Checkpoint log
- [2026-07-18] sonnet5: **F4.3 done** — EquipmentPage: icons lucide→MSymbol.
  Actual icons in file differed from the map above (no `RefreshCw`; status
  used `AlertCircle` not `AlertTriangle` for "cancelled"): Wrench→`build`,
  CheckCircle2→`check_circle`, Clock→`schedule`, Plus→`add`,
  AlertCircle→`cancel` (semantic match to "ยกเลิก" label, not in the
  original map — flagging for fable5 review). `repairBadge()` now returns
  an icon *name* string instead of a lucide component reference so both
  call sites render `<MSymbol name={b.icon} .../>` — presentational-only
  change, no logic/state touched. Table header → small-caps pattern from
  ReadingsListPage. build + E2E 8/8 green. F4.4 Reports is next.
- [2026-07-18] fable5: **F4.2 done** — ReadingsListPage: icons lucide→MSymbol
  (refresh/add/description/edit), header ตารางเป็น small-caps label style ตาม
  ตาราง fuel-fleet ใน suite; build + E2E 8/8 เขียว. F4.3 Equipment คือคิวถัดไป
- [2026-07-18] fable5: **F4.1 done** — sticky submit bar `md:left-56`→`md:left-72`
  (สอดคล้อง sidebar F2), icons lucide→MSymbol (warning/check_circle/delete),
  เพิ่ม QuickChips สี/กลิ่นค่าจริงจาก dataset (สี: น้ำตาลเข้ม/อ่อน; กลิ่น:
  กลิ่นดินปกติ) + free text คงไว้; แก้ smoke.spec 2 ตัวที่พังจาก F2 nav/brand
  (ตั้งค่า ถูกถอด, EVN→ENV) — E2E 8/8 เขียว, build ผ่าน. หมายเหตุถึงผู้ทำ
  F4.2–F4.5: /form ติด auth — verify ผ่าน build+E2E+code review; visual
  เต็มรูปแบบต้องรอ user login ดูเอง
