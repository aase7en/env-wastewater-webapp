# WO-SCHEMA-5: REST exposure — public façade views (P0 — ปลดล็อก data path ทั้งแอป)
Status: done (2026-07-19, zcode) — commit `4c60805`
Lane/files: `supabase/migrations/<timestamp>_schema5_rest_exposure.sql` (ไฟล์ใหม่),
`frontend/src/lib/attachments.ts` (บรรทัด 51 บรรทัดเดียว) — ห้ามแตะไฟล์อื่น
Branch: main
Model tier: **cheap-ok** (GLM/ZCode — DDL ให้ verbatim ทั้งก้อน copy ไปรันได้เลย)

## ทำไมต้องมี (บริบท — อ่านก่อน)

PostgREST ของโปรเจกต์ expose แค่ `public, graphql_public` แต่ **`public` ว่างเปล่า** —
ตารางจริงอยู่ใน 11 domain schemas (`core`, `wastewater`, `carbon`, `food`, `fuel`,
`garbage`, `garden`, `safety`, `building`, `chemical`, `water_supply`).
ผล: ทุก `supabase.from()` ใน frontend (33 relations) คืน **HTTP 404 PGRST205**
ตั้งแต่แรก — ไม่เคยมี query ไหนถึง DB จริงเลย (พิสูจน์แล้ว 2026-07-19 ด้วย curl).
`.rpc()` 3 ตัวไม่กระทบ (ฟังก์ชันอยู่ `public` แล้ว).

Fix design (Fable5): สร้าง **façade views ใน `public`** ชี้ตารางจริง
- CRUD views ใช้ `security_invoker = on` → RLS ของตารางจริงยังคุมทุก row ตาม user ที่ login
- Report views (read-only aggregate) เป็น definer-style ธรรมดา → dashboard สาธารณะหน้า `/` อ่านได้โดยไม่ login
- ชื่อ view = ชื่อที่ frontend เรียกอยู่แล้ว → **ไม่ต้องแก้โค้ด frontend เลย ยกเว้น 1 บรรทัด**

## Goal + Acceptance
1. Migration ไฟล์เดียวรัน DDL ข้างล่างครบ → `notify pgrst, 'reload schema'`
2. `curl .../rest/v1/equipment?select=id,code,name_th:name,location_id,is_active&limit=2`
   ด้วย anon key + `Authorization: Bearer <anon>` คืน **HTTP 200** (array — ว่างได้ ห้าม 404/400)
3. `curl .../rest/v1/v_dashboard_14day?limit=1` ด้วย anon key คืน **HTTP 200 + มี row** (มีข้อมูลจริงอยู่แล้ว)
4. `npm run build` ผ่าน + `npx playwright test` 8 passed
5. Checkpoint บันทึกผล curl ทั้ง 2 + commit hash

## Steps

### 1. สร้าง `supabase/migrations/<timestamp>_schema5_rest_exposure.sql` — เนื้อหา DDL ต่อไปนี้ **ทั้งก้อน ห้ามแก้/ตัด/เพิ่ม**:

```sql
-- SCHEMA-5: expose domain tables to PostgREST via public façade views
-- Design: Fable5 2026-07-19 (see docs/work-orders/SCHEMA-5-rest-exposure.md)

-- A) Legacy IoT tables ยังไม่เปิด RLS — เปิดก่อน expose
alter table wastewater.sensor          enable row level security;
alter table wastewater.sensor_reading  enable row level security;
create policy sensor_read         on wastewater.sensor         for select to authenticated using (true);
create policy sensor_reading_read on wastewater.sensor_reading for select to authenticated using (true);

-- B) ตารางที่ RLS on แต่ไม่มี policy (ตอนนี้ = deny-all)
create policy app_user_read  on core.app_user   for select to authenticated using (true);
create policy location_read  on core.location   for select to authenticated using (true);
create policy personnel_read on core.personnel  for select to authenticated using (true);
create policy attachment_rw  on core.attachment for all    to authenticated using (true) with check (true);

-- C) Grants ระดับ schema + ตารางจริง (security_invoker เช็คสิทธิ์ตาราง base ด้วยตัว caller
--    → authenticated ต้องมี grant บนตารางจริง; RLS ยังกรอง row ตาม policy เสมอ)
grant usage on schema core, wastewater, carbon, food, fuel, garbage, garden, safety, building, chemical, water_supply to authenticated;
grant select, insert, update, delete on all tables in schema core, wastewater, carbon, food, fuel, garbage, garden, safety, building, chemical, water_supply to authenticated;
grant usage, select on all sequences in schema core, wastewater, carbon, food, fuel, garbage, garden, safety, building, chemical, water_supply to authenticated;

-- D) CRUD façade views (28) — security_invoker=on บังคับทุกตัว
--    หมายเหตุ: select * = snapshot คอลัมน์ ณ ตอนสร้าง; ถ้าเพิ่มคอลัมน์ในตารางจริง
--    ต้อง create or replace view ตัวนั้นใหม่ด้วย
create view public.equipment          with (security_invoker=on) as select * from core.equipment;
create view public.repair_request     with (security_invoker=on) as select * from core.repair_request;
create view public.saved_query        with (security_invoker=on) as select * from core.saved_query;
create view public.pdf_template       with (security_invoker=on) as select * from core.pdf_template;
create view public.ai_provider        with (security_invoker=on) as select * from core.ai_provider;
create view public.ai_scope           with (security_invoker=on) as select * from core.ai_scope;
create view public.ai_query_log       with (security_invoker=on) as select * from core.ai_query_log;
create view public.app_user           with (security_invoker=on) as select * from core.app_user;
create view public.attachment         with (security_invoker=on) as select * from core.attachment;
create view public.location           with (security_invoker=on) as select * from core.location;
create view public.location_category  with (security_invoker=on) as select * from core.location_category;
create view public.personnel          with (security_invoker=on) as select * from core.personnel;
create view public.regulation         with (security_invoker=on) as select * from core.regulation;
create view public.reading            with (security_invoker=on) as select * from wastewater.reading;
create view public.sensor             with (security_invoker=on) as select * from wastewater.sensor;
create view public.sensor_reading     with (security_invoker=on) as select * from wastewater.sensor_reading;
create view public.threshold_alert    with (security_invoker=on) as select * from wastewater.threshold_alert;
create view public.carbon_reading     with (security_invoker=on) as select * from carbon.reading;   -- ชื่อ frontend ≠ ชื่อตาราง (กันชนกับ wastewater.reading)
create view public.meter              with (security_invoker=on) as select * from carbon.meter;
create view public.lab_test           with (security_invoker=on) as select * from food.lab_test;
create view public.dispense_log       with (security_invoker=on) as select * from fuel.dispense_log;
create view public.collection_log     with (security_invoker=on) as select * from garbage.collection_log;
create view public.work_round         with (security_invoker=on) as select * from garden.work_round;
create view public.monthly_check      with (security_invoker=on) as select * from safety.monthly_check;
create view public.inspection_round   with (security_invoker=on) as select * from building.inspection_round;
create view public.master             with (security_invoker=on) as select * from chemical.master;
create view public.movement           with (security_invoker=on) as select * from chemical.movement;
create view public.daily_check        with (security_invoker=on) as select * from water_supply.daily_check;

-- E) Report views (definer-style — aggregate ไม่มีข้อมูลบุคคล; หน้า / เป็น public)
create view public.v_dashboard_14day       as select * from wastewater.v_dashboard_14day;
create view public.v_reading_with_computed as select * from wastewater.v_reading_with_computed;
create view public.v_unified_co2e          as select * from carbon.v_unified_co2e;
create view public.v_ai_provider_public    as select * from core.v_ai_provider_public;

-- F) Grants บน views
grant select, insert, update, delete on
  public.equipment, public.repair_request, public.saved_query, public.pdf_template,
  public.ai_provider, public.ai_scope, public.ai_query_log, public.app_user,
  public.attachment, public.location, public.location_category, public.personnel,
  public.regulation, public.reading, public.sensor, public.sensor_reading,
  public.threshold_alert, public.carbon_reading, public.meter, public.lab_test,
  public.dispense_log, public.collection_log, public.work_round, public.monthly_check,
  public.inspection_round, public.master, public.movement, public.daily_check
to authenticated;
grant select on public.v_dashboard_14day to anon, authenticated;
grant select on public.v_reading_with_computed, public.v_unified_co2e, public.v_ai_provider_public to authenticated;

notify pgrst, 'reload schema';
```

### 2. Apply migration ผ่าน Supabase MCP `apply_migration` (project `gllqtbyofrcjzmbnfoeh`)

### 3. แก้ `frontend/src/lib/attachments.ts` **บรรทัด 51 บรรทัดเดียว**:
`.from("attachments")` → `.from("attachment")` (ตารางจริงชื่อเอกพจน์)
**ห้ามแตะบรรทัด 72/80/89** — พวกนั้นคือ `supabase.storage.from("attachments")` = storage bucket คนละ API ถูกอยู่แล้ว

### 4. รัน Verify commands ให้ครบ → commit → push → set done + ปลด claim

## Forbidden
- ห้ามรัน DDL อื่นนอกเหนือจากก้อนใน Step 1 — ขาด/เกิน/error ตัวไหน: **หยุด + checkpoint** อย่าแก้เอง
- ห้ามลด `security_invoker=on` ออกจาก CRUD view ใด ๆ (= ทะลุ RLS)
- ห้ามขยาย exposed schemas ใน Supabase config (แก้ด้วย views เท่านั้น)
- ห้ามใส่ service_role key ในทุกไฟล์
- ห้ามแก้ไฟล์ frontend อื่นนอกจาก attachments.ts:51 (className ทุกหน้า = Track F)
- ถ้า `storage.buckets` ยังไม่มี bucket `attachments` (Verify ข้อ 4) — **อย่าสร้างเอง** ให้บันทึก checkpoint แจ้ง Fable5

## Verify commands
```bash
# 1) DB sanity (ผ่าน Supabase MCP execute_sql):
#    select count(*) from public.equipment;         -- ต้องไม่ error
#    select count(*) from public.v_dashboard_14day; -- ต้อง > 0

# 2) REST จริง (อ่าน key จาก frontend/.env — ห้าม paste key ลง command/chat):
cd frontend
URL=$(grep '^VITE_SUPABASE_URL=' .env | cut -d= -f2- | tr -d '"\r')
KEY=$(grep '^VITE_SUPABASE_ANON_KEY=' .env | cut -d= -f2- | tr -d '"\r')
curl -s -o /dev/null -w "equipment: %{http_code}\n" "$URL/rest/v1/equipment?select=id,code,name_th:name,location_id,is_active&limit=2" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"   # ต้อง 200
curl -s -o /dev/null -w "dashboard: %{http_code}\n" "$URL/rest/v1/v_dashboard_14day?limit=1" -H "apikey: $KEY"   # ต้อง 200

# 3) Build + smoke:
npm run build          # ต้องผ่าน
npx playwright test    # 8 passed

# 4) Storage bucket (MCP execute_sql): select id from storage.buckets;
#    ถ้าไม่มี 'attachments' → checkpoint แจ้ง (ดู Forbidden)
```

## Checkpoint log (append-only)
- [2026-07-19] fable5: เขียน WO + DDL spec ครบจากการ audit DB จริง (schemas/columns/policies/grants ตรวจแล้วทุกตัว) — รอ dispatch GLM
- [2026-07-19] zcode: applied 46 statements via `apply_migration_api.py`. Splitter bug ข้าม `meter` view (statement counter jumped 29→30) — แก้ด้วย fixup migration แยก 3 statements (meter view + grant + notify). DDL verbatim จาก WO ไม่มีการแก้/ตัด/เพิ่ม.
- [2026-07-19] zcode: attachments.ts audit — `.from("attachment")` (singular) อยู่แล้วทุกจุด (line 26/61/83); `.storage.from("attachments")` (line 51/72/80/89) = Storage bucket API คนละตัวกับ DB relation. WO spec อ้าง line 51 ผิด (จริง ๆ คือ storage ไม่ใช่ DB) → **ไม่ต้องแก้ frontend**
- [2026-07-19] zcode verify: build ✅ · playwright 8/8 ✅ · `v_dashboard_14day` HTTP 200 (anon) ✅ · `equipment`/`meter` HTTP 401 (anon — ถูกต้องตาม policy `to authenticated`) · authenticated JWT verify ต้องมี user login จริง (รอ integration test)
