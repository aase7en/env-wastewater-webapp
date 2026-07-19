# WO-F7: Stale-data fallback — dashboard/overview บอก "ข้อมูลล่าสุด" แทนจอว่าง
Status: open
Lane/files: `frontend/src/lib/supabase-queries.ts` (เพิ่ม 1 ฟังก์ชัน),
`frontend/src/pages/DashboardPage.tsx`, `frontend/src/pages/OverviewPage.tsx`,
`frontend/src/components/pfd/ProcessFlowDiagram.tsx` (เฉพาะ empty-state block)
Branch: main
Model tier: **cheap-ok** (Sonnet 5 / GLM — pattern ให้ครบ)

## บริบท — ruling จาก Fable5 (2026-07-19)

`fetchDashboard` window 14 วันเป็น **พฤติกรรมที่ตั้งใจ** (สถานะ "ปัจจุบัน" ต้องไม่เอา
ข้อมูลเก่ามาแสดงเป็นของสด — ui-brief domain honesty) **แต่** เมื่อข้อมูลล่าสุดเก่ากว่า
14 วัน (ตอนนี้: ล่าสุด 2026-07-04) ทุกจออาศัย window นี้จะว่างเปล่าโดยไม่บอกอะไร —
เจ้าหน้าที่แยกไม่ออกว่า "ระบบพัง" หรือ "ไม่มีคนกรอก" Fix: คง window เดิม + เพิ่ม
บรรทัดบอกความจริง "บันทึกล่าสุด <วันที่ไทย> (N วันก่อน)" ใน empty state

## Goal + Acceptance
1. ฟังก์ชันใหม่ `fetchLatestReadingDate(): Promise<string | null>` ใน
   `supabase-queries.ts` — select `reading_date` จาก `v_dashboard_14day`
   order desc limit 1 (ไม่มี gte filter), null เมื่อไม่มีข้อมูลเลย
2. เมื่อ `fetchDashboard` คืน [] : DashboardPage / OverviewPage (การ์ดน้ำ) / PFD
   empty card แสดงเพิ่ม 1 บรรทัด: `บันทึกล่าสุด {thaiDate(d)} ({diffDays} วันก่อน)`
   — ใช้ `thaiDate()` จาก `lib/utils.ts` เดิม; ถ้า null → คงข้อความเดิมไว้
3. **ห้าม** เอาข้อมูลเก่าไปวาด chart/gauge/status เด็ดขาด — บรรทัดข้อความเท่านั้น
4. `npm run build` ผ่าน + `npx playwright test` 20 passed (เทสต์เดิมต้องไม่พัง —
   ข้อความใหม่เป็น addition ใน empty state เท่านั้น)

## Reference pattern
- การเรียก + shape: `fetchDashboard` ในไฟล์เดียวกัน (copy โครง query แล้วตัด gte)
- การใช้ hook ใน page: `useDashboard` ใน `lib/hooks.ts` — เพิ่ม state
  `latestDate` ควบคู่ หรือเรียกแยกใน page-level useEffect (เลือกแบบที่แตะไฟล์น้อยสุด)
- ป้ายวันที่ไทย: `thaiDate()` — ตัวอย่างการใช้ใน `EquipmentPage.tsx`

## Forbidden
- ห้ามแก้ window 14 วันของ `fetchDashboard`
- ห้ามแตะ className อื่นนอก empty-state block ที่ระบุ (สี/ฟอนต์/layout = Track F)
- ห้าม backfill/แก้ข้อมูลใน DB

## Verify commands
```bash
cd frontend && npm run build && npx playwright test   # 20 passed
# dev server → เปิด / และ /dashboard → เห็นบรรทัด "บันทึกล่าสุด 4 ก.ค. 2569 (…วันก่อน)"
```

## Checkpoint log (append-only)
- [2026-07-19] fable5: design + WO จาก production question ใน review (data ล่าสุด 2026-07-04 ทำจอว่าง) — รอ dispatch
