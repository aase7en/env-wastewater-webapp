# WO-CRB-2: เปิด realtime publication ให้ carbon.reading + แก้ month-cutoff edge
Status: open
Lane/files: `supabase/migrations/<timestamp>_crb2_realtime_publication.sql` (ไฟล์ใหม่),
`frontend/src/lib/carbon-rollup.ts` (บรรทัด 49–51), `frontend/src/lib/food.ts` (บรรทัด 85–86)
Branch: main
Model tier: **cheap-ok** (GLM/ZCode — โค้ดให้ verbatim)

## บริบท (จาก Fable5 review 2026-07-19 ของ commit f5308f7)

`useCarbonRollupRealtime` subscribe `postgres_changes` บน `carbon.reading` แต่
publication `supabase_realtime` มีแค่ `wastewater.sensor, wastewater.sensor_reading`
(ตรวจแล้วจาก `pg_publication_tables`) → **event ไม่มีวันมาถึง** และที่แย่กว่า:
subscription สำเร็จ (`SUBSCRIBED`) ทั้งที่ตารางไม่อยู่ใน publication → `live=true`
ค้างตลอด = LIVE badge หลอก ผิด ui-brief rule "no fake telemetry" ถ้า UI เอาไปใช้

แถม: month-cutoff arithmetic มี end-of-month bug 2 จุด — `setMonth()` ก่อน
`setDate(1)` ทำให้วันที่ 29/30/31 ของเดือน overflow ข้ามเดือน (เช่น 31 มี.ค.
ถอย 11 เดือน → ได้ 1 พ.ค. แทน 1 เม.ย.)

## Goal + Acceptance
1. `select * from pg_publication_tables where pubname='supabase_realtime'` มี
   `carbon.reading` เพิ่มเข้ามา (ของเดิม 2 ตารางคงอยู่)
2. `fetchRollup` / `fetchLabTests` คำนวณ cutoff ถูกต้องแม้รันวันที่ 31
3. `npm run build` ผ่าน + `npx playwright test` 20 passed

## Steps

### 1. Migration ใหม่ (apply ผ่าน Supabase MCP, project `gllqtbyofrcjzmbnfoeh`):
```sql
-- CRB-2: carbon.reading เข้า realtime publication (hook CRB-realtime ต้องการ)
alter publication supabase_realtime add table carbon.reading;
```

### 2. `frontend/src/lib/carbon-rollup.ts` บรรทัด 49–51 — สลับลำดับ (setDate ก่อน setMonth):
```ts
  const cutoff = new Date();
  cutoff.setDate(1);
  cutoff.setMonth(cutoff.getMonth() - (months - 1));
```

### 3. `frontend/src/lib/food.ts` บรรทัด 85–86 — กัน overflow ด้วยการ pin วันที่ 1 ก่อนถอยเดือน:
```ts
  const cutoff = new Date();
  cutoff.setDate(1);
  cutoff.setMonth(cutoff.getMonth() - monthsBack);
```
(สัญญาณของฟังก์ชันนี้คือ "ย้อนหลัง N เดือน" — pin ต้นเดือนให้ผลกว้างขึ้นเล็กน้อย
ไม่ตัดข้อมูลทิ้ง ยอมรับได้)

### 4. Verify → commit → push → set done + ปลด claim

## Forbidden
- ห้ามแตะ `useCarbonRollupRealtime` logic (โค้ด hook ถูกแล้ว — ขาดแค่ publication)
- ห้ามลบ `wastewater.sensor`/`sensor_reading` ออกจาก publication
- ห้ามแตะไฟล์อื่น/className ใด ๆ

## Verify commands
```bash
# MCP execute_sql: select schemaname||'.'||tablename from pg_publication_tables where pubname='supabase_realtime';
#   → ต้องมี carbon.reading ครบ 3 ตาราง
cd frontend && npm run build && npx playwright test   # 20 passed
```

## Checkpoint log (append-only)
- [2026-07-19] fable5: เขียน WO จากผล review f5308f7 — hook code ผ่าน, publication ขาด, date edge ×2 — รอ dispatch GLM
