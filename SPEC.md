# SPEC — Wastewater Monitoring Webapp (รพ.อุทัย)

> Requirement ตกผลึกจาก session 2026-07-06 (ขั้น 4.1 ของ roadmap ใน MIGRATION.md)
> Schema จริงอยู่ที่ Supabase `ENV_DB` (`gllqtbyofrcjzmbnfoeh`) — ดู companion repo A-Wiki
> สำหรับ domain knowledge

## ผู้ใช้ (3 กลุ่ม)

| กลุ่ม | ใช้ทำอะไร | Role (`core.app_user.role`) |
|---|---|---|
| เจ้าหน้าที่ดูแลบ่อบำบัด | กรอกข้อมูลรายวัน (ค่าน้ำ + เช็คอุปกรณ์) แทน AppSheet เดิม | `staff` |
| นักวิชาการ ENV (เจ้าของระบบ) | ดู dashboard, ตรวจแนวโน้ม, ทำรายงานประจำเดือน/ปี | `admin` |
| ผู้บริหาร/กรรมการ ENV | ดูสรุประดับสูง read-only | `staff` (read-only view) |

## ขอบเขต v1

1. **Form บันทึกรายวัน** — แทน AppSheet ทันที (ไม่มีช่วง dual-entry) เขียนเข้า
   `wastewater.reading` + `carbon.reading` ตรงตาม pattern เดียวกับข้อมูล migrate
2. **Dashboard รายวัน** — ตาม mockup ที่ออกแบบแล้ว (DO process-flow, KPI tiles,
   equipment LED panel, ตาราง log 14 วัน)
3. **Auth** — Supabase Auth email+password → `auth.users` 1:1 `core.app_user`
   (schema มีอยู่แล้ว), role `admin`/`staff`
4. **Mobile-first** — เจ้าหน้าที่กรอกที่หน้างานบ่อบำบัดด้วยมือถือเป็นหลัก
   form ต้องออกแบบ mobile ก่อน desktop; dashboard ใช้ได้ทั้งสอง
5. **PDF Template-Builder module** (เพิ่มจาก grilling session 2026-07-06 —
   ดู `docs/adr/0001-pdf-template-builder-in-v1.md`): หน้า UI ให้ผู้ใช้ออกแบบ
   template รายงานเอง — เลือก data source/table, วาง field, ตั้งขนาดกระดาษ
   A4/A5 + แนวตั้ง/แนวนอน, save ไว้ใช้ซ้ำ, generate PDF จากข้อมูลจริง
   Starter templates ที่มากับระบบ: **ทส.1** (daily log, ข้อมูลมีอยู่แล้วใน
   `wastewater.reading`/`carbon.reading`), **ทส.2** (monthly summary จาก ทส.1),
   **ใบแจ้งซ่อม** (raised จาก `system_operating` = ผิดปกติ หรือ equipment flag)
6. **ระบุสาเหตุเมื่อระบบผิดปกติ** — เพิ่ม `system_operating` เข้า form (auto-seed
   จาก equipment 10 ตัว, เจ้าหน้าที่ override ได้) + ช่องกรอกสาเหตุ **บังคับ**
   เมื่อตั้งเป็นผิดปกติ (ดู `CONTEXT.md`) — สาเหตุนี้ป้อนเข้าใบแจ้งซ่อมโดยตรง
7. **`wastewater_in` เข้า form** — เดิมหลุดจาก mockup (มี column ใน DB แต่ไม่มี
   ช่องกรอก) พบระหว่างเทียบ form กับ schema จริง

## Table เพิ่มที่ต้องมีสำหรับข้อ 5 (PDF module)

- `core.pdf_template` — เก็บ layout ที่ผู้ใช้ออกแบบ (JSON: fields, data source,
  paper size, orientation)
- `core.equipment` — master รายการอุปกรณ์ (เชื่อมกับ checklist 10 รายการใน
  `wastewater.reading`)
- `core.repair_request` — ใบแจ้งซ่อมแต่ละใบ (equipment, สาเหตุ, วันที่, สถานะ)

## นอกขอบเขต v1 (ไว้ v2+)

- ใบขอซื้อ (purchase request) / inventory tracking — ต้องมี stock table
  เพิ่มทั้งชุด แยกจาก scope ใบแจ้งซ่อมที่ทำใน v1
- แจ้งเตือนเมื่อค่าเกิน threshold (`wastewater.threshold` มีตารางรออยู่แล้ว)
- IoT sensor ingest
- AI query (`core.ai_*` tables มีรออยู่แล้ว)

## Stack

- **Backend**: FastAPI + Supabase (Postgres + Auth + RLS) — ตาม schema doc ใน A-Wiki
- **Frontend**: v1 เริ่มจาก server-rendered/lightweight ก่อน (ตัดสินใจ framework
  ตอน scaffold — ดู mockup เป็น reference ของ visual language)
- **Deploy**: Cloud Run (ตาม schema doc) — ยืนยันอีกทีตอนถึงขั้น deploy

## เงื่อนไขจาก schema จริงที่ form ต้องรองรับ

- ค่าน้ำ: DO 3 จุด (เติมอากาศ/ตกตะกอน/ก่อนระบาย), pH, TDS 2 จุด, อุณหภูมิ,
  SV30, Free Chlorine, สี/กลิ่น — **ค่าจริงจาก DB (907 แถว) มีแค่ 2 ค่า/แต่ละ
  field**: สี = `น้ำตาลเข้ม` (824) / `น้ำตาลอ่อน` (83); กลิ่น = `กลิ่นดินปกติ`
  (907, ค่าเดียวทั้งหมด) — chip ใน form ต้องปรับให้ตรงชุดนี้ (ของเดิมที่ mockup
  ทำไว้ใช้ค่าสมมติ ไม่ตรงกับข้อมูลจริง)
- Checklist อุปกรณ์ 10 รายการ (boolean): ปั๊ม 2, เครื่องเติมอากาศ 2, ปั๊มตะกอน 2,
  ปั๊มคลอรีน 2, ตะแกรง 2 (default "ปกติ" ให้กรอกเร็ว — ตาม data จริง 99% ปกติ)
- คลอรีน: ปริมาณที่ใช้จริง + อัตราส่วนผสม (ดู MIGRATION.md เรื่อง mapping)
- มิเตอร์ไฟฟ้า 2 ตัว, ปริมาณน้ำ
- `reported_by` = user ที่ login (อัตโนมัติ ไม่ต้องเลือก)
- `input_source` enum มีอยู่ใน schema — ค่าจาก form ใหม่ต้อง distinguish จาก
  ข้อมูล migrate

## สถานะการออกแบบ UI

- Dashboard mockup v1 (industrial/control-room, เขียว-เทา): เสร็จ — user ไม่ชอบสี/ฟอนต์
  อยู่ระหว่างทำ 3 variants ใหม่ (concept เดิม, เปลี่ยนสี/ฟอนต์) ให้เลือก
- Form บันทึกรายวัน mockup (mobile-first): เสร็จ v1 — ต้องอัปเดตตามข้อ 6-7 ข้างบน
  + ปรับ chip สี/กลิ่นให้ตรงข้อมูลจริง
- PDF template-builder UI: ยังไม่เริ่ม — งานออกแบบชิ้นถัดไป (ใหญ่ แยก session)
- หน้ารายงานประจำเดือน (ทส.2): จะเป็น starter template ในระบบ template-builder
  ไม่ใช่หน้าจอแยก
