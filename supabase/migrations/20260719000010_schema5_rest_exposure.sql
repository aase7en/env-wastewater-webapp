-- SCHEMA-5: expose domain tables to PostgREST via public façade views
-- Design: Fable5 2026-07-19 (see docs/work-orders/SCHEMA-5-rest-exposure.md)
-- Applied 2026-07-19 via scripts/apply_migration_api.py (46 statements).
-- Note: meter view must come right after carbon_reading — first run skipped
-- it due to the apply_migration_api.py splitter bug; verified applied after.

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
