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

## นอกขอบเขต v1 (ไว้ v2+)

- รายงาน PDF ประจำเดือน/ปี อัตโนมัติ
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
  SV30, Free Chlorine, สี/กลิ่น
- Checklist อุปกรณ์ 10 รายการ (boolean): ปั๊ม 2, เครื่องเติมอากาศ 2, ปั๊มตะกอน 2,
  ปั๊มคลอรีน 2, ตะแกรง 2 (default "ปกติ" ให้กรอกเร็ว — ตาม data จริง 99% ปกติ)
- คลอรีน: ปริมาณที่ใช้จริง + อัตราส่วนผสม (ดู MIGRATION.md เรื่อง mapping)
- มิเตอร์ไฟฟ้า 2 ตัว, ปริมาณน้ำ
- `reported_by` = user ที่ login (อัตโนมัติ ไม่ต้องเลือก)
- `input_source` enum มีอยู่ใน schema — ค่าจาก form ใหม่ต้อง distinguish จาก
  ข้อมูล migrate

## สถานะการออกแบบ UI

- Dashboard mockup: เสร็จ (Claude Artifact — desktop-first, ต้องเพิ่ม mobile view)
- Form บันทึกรายวัน mockup (mobile-first): ขั้นถัดไป (4.2)
- หน้ารายงานประจำเดือน: ยังไม่เริ่ม
