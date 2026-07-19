-- SCHEMA-6: anon-safe overview carbon aggregate (definer-style via 2-layer)
-- Design: Fable5 visual tour 2026-07-19 — หน้า `/` (OverviewPage) เป็น public
-- แต่การ์ด energy/carbon ใช้ data ที่ lock อยู่หลัง authenticated
-- (public.carbon_reading + public.meter ใน SCHEMA-5 ใช้ security_invoker=on).
-- เปิด aggregate เดือนล่าสุด 12 เดือนให้ anon ได้เพราะ:
--   (1) ไม่มี PHI (carbon.reading = electricity usage ของ WWTP เท่านั้น)
--   (2) aggregate รายเดือน = ไม่ leak per-day reading / per-meter detail
--   (3) ตรง pattern 4 report views เดิมใน SCHEMA-5 (v_dashboard_14day ฯลฯ)
-- CarbonPage (auth) ยังคงอ่าน per-reading ตรง ๆ ผ่าน public.carbon_reading.
--
-- สถาปัตยกรรม 2 ชั้น (ตรง pattern ที่มี):
--   carbon.v_overview_carbon    = domain view (aggregate logic, owner=postgres)
--   public.v_overview_carbon    = thin façade (security definer-style โดย default;
--                                 ไม่ใช่ security_invoker=on) → anon grant ผ่านได้
--
-- Emission factor: Thailand grid 2023 (TGO) = 0.4999 kgCO₂e/kWh
-- Literal นี้ต้อง sync กับ frontend/src/lib/carbon.ts:48 (EMISSION_FACTOR_KGCO2E_PER_KWH)
-- ถ้า TGO ประกาศ factor ใหม่ = แก้ที่นี่ + carbon.ts:48 + reapply migration.

-- Layer 1: domain view (aggregate logic lives here)
-- consumption column = SOURCE OF TRUTH per phase1-analysis.md §4 (never derive
-- from meter_value deltas — operators entered actual usage into AppSheet).
create or replace view carbon.v_overview_carbon as
select
  to_char(date_trunc('month', r.reading_date), 'YYYY-MM') as month,
  count(*)::int                                       as days,
  sum(r.consumption)                                  as kwh_total,
  round((sum(r.consumption) * 0.4999 / 1000)::numeric, 3) as tco2e
from carbon.reading r
where r.reading_date >= (date_trunc('month', now()) - interval '11 months')::date
group by 1;

comment on view carbon.v_overview_carbon is
  'SCHEMA-6: monthly carbon aggregate (last 12 months, month-inclusive) for OverviewPage. Domain view — wrapped by public.v_overview_carbon for anon access.';

-- Layer 2: public façade (NO with(...) clause → default = security_invoker=off
-- → runs as view owner (postgres) → bypasses base-table RLS). This is exactly
-- how SCHEMA-5 v_dashboard_14day allows anon to read aggregates despite
-- wastewater.reading being RLS-gated.
create or replace view public.v_overview_carbon as
  select * from carbon.v_overview_carbon;

-- Grant anon + authenticated (เหมือน v_dashboard_14day ใน SCHEMA-5:73)
grant select on public.v_overview_carbon to anon, authenticated;

notify pgrst, 'reload schema';
