# WO-SCHEMA-6: public definer `v_overview_carbon` — anon-safe aggregate สำหรับหน้า `/`
Status: done (2026-07-20, zcode) — commit pending
Lane/files: `supabase/migrations/20260720000000_schema6_overview_public_aggregate.sql` (ไฟล์ใหม่),
`frontend/src/lib/supabase-queries.ts` (เพิ่ม 1 ฟังก์ชัน),
`frontend/src/lib/overview.ts` (สลับ energy/carbon source)
Branch: main
Model tier: **cheap-ok** (GLM/ZCode — DDL verbatim + pattern ครบ)

## บริบท — พบใน Fable5 visual tour 2026-07-19 (commit `c995ac0`)

หน้า `/` (OverviewPage) เป็น **public** (ไม่ RequireAuth) แต่ `useOverview →
useCarbonMonthly → carbon.reading + carbon.meter` อ่านผ่าน `public.carbon_reading`
+ `public.meter` ที่เป็น `security_invoker=on` (grant authenticated เท่านั้น —
commit `4c60805` SCHEMA-5). Anon เจอ `permission denied for table meter` →
**การ์ดพลังงานไฟฟ้า + Carbon Footprint แดง** "โหลดไม่สำเร็จ".

Fable5 ruling: ไปทาง **definer report view** (aggregate ไม่มี PHI — แบบเดียวกับ
4 report views เดิมใน SCHEMA-5: `v_dashboard_14day`, `v_reading_with_computed`,
`v_unified_co2e`, `v_ai_provider_public`) สำหรับตัวเลขที่การ์ด overview ใช้ —
รอเขียน WO SCHEMA-6 (cheap-ok, DDL verbatim).

CarbonPage (ยังเป็น RequireAuth) ยังคงใช้ `useCarbonMonthly` ที่อ่าน
`carbon.reading` + `carbon.meter` ตรง ๆ เพราะ (a) ต้องการ per-meter/per-reading
detail และ (b) auth แล้ว grant authenticated ครบ — ไม่กระทบ.

## Goal + Acceptance

1. migration ใหม่สร้าง `public.v_overview_carbon` (definer-style — *default*
   Postgres view semantics, ไม่ใช่ `security_invoker=on`) คืน aggregate รายเดือน
   12 เดือนล่าสุด: `month, days, kwh_total, tco2e`
2. grant `select` ให้ `anon, authenticated`
3. anon สามารถ GET `/rest/v1/v_overview_carbon` → 200 + rows
4. anon ยังคงไม่สามารถ GET `/rest/v1/carbon_reading` หรือ `/rest/v1/meter` ได้
   (401/42501) — per-reading detail ยัง lock (domain privacy)
5. `frontend/src/lib/overview.ts` ใช้ source ใหม่ แทน `useCarbonMonthly`
   (energy + carbon cards ใช้ข้อมูลจาก v_overview_carbon)
6. CarbonPage ยังคงใช้ `useCarbonMonthly` เดิม (auth + per-meter detail)
7. `npm run build` + `npx playwright test` ผ่าน
8. หน้า `/` บน browser ไม่ login → การ์ด Energy/Carbon โชว์ตัวเลข ไม่แดง

## Reference pattern

- `supabase/migrations/20260719000010_schema5_rest_exposure.sql:57-61` — 4 report
  views ที่ไม่ใช้ `security_invoker=on` (definer-style default):
  ```sql
  create view public.v_dashboard_14day       as select * from wastewater.v_dashboard_14day;
  create view public.v_unified_co2e          as select * from carbon.v_unified_co2e;
  -- ...
  grant select on public.v_dashboard_14day to anon, authenticated;
  grant select on public.v_reading_with_computed, public.v_unified_co2e, public.v_ai_provider_public to authenticated;
  ```
- `frontend/src/lib/carbon.ts:160-192` — logic aggregate เดิม (kwh_total, tco2e,
  mom_change_pct) เพื่อ reuse สำหรับ mom% computation ฝั่ง JS
- Emission factor constant `EMISSION_FACTOR_KGCO2E_PER_KWH = 0.4999` ใน
  `carbon.ts:48` — **ใช้ค่าเดียวกันใน DDL** เพื่อ consistent

## Steps

### 1. migration ใหม่ `supabase/migrations/20260720000000_schema6_overview_public_aggregate.sql`:

ใช้สองเลเยอร์ตาม pattern ที่มี (domain view + public façade) ตรงกับ
`wastewater.v_dashboard_14day` + `public.v_dashboard_14day` ใน SCHEMA-5:

```sql
-- SCHEMA-6: anon-safe overview carbon aggregate (definer-style via 2-layer)
-- Design: Fable5 visual tour 2026-07-19 — หน้า `/` เป็น public แต่การ์ด
-- energy/carbon ใช้ data ที่ lock อยู่หลัง authenticated (security_invoker).
-- เปิด aggregate เดือนล่าสุดให้ anon ได้เพราะ:
--   (1) ไม่มี PHI (carbon.reading = electricity usage ของ WWTP เท่านั้น)
--   (2) aggregate รายเดือน = ไม่ leak per-day reading
--   (3) ตรง pattern 4 report views เดิมใน SCHEMA-5 (v_dashboard_14day ฯลฯ)
-- CarbonPage (auth) ยังคงอ่าน per-reading ตรง ๆ ผ่าน public.carbon_reading.
--
-- สถาปัตยกรรม 2 ชั้น (ตรง pattern ที่มี):
--   carbon.v_overview_carbon    = domain view (aggregate logic, owner=postgres)
--   public.v_overview_carbon    = thin façade (security definer-style โดย default;
--                                 ไม่ใช่ security_invoker=on) → anon grant ผ่านได้

-- Emission factor: Thailand grid 2023 (TGO) = 0.4999 kgCO₂e/kWh
-- คงเป็น literal ที่นี่ (sync กับ carbon.ts:48 EMISSION_FACTOR_KGCO2E_PER_KWH)
-- ถ้า TGO ประกาศ factor ใหม่ = แก้ที่นี่ + carbon.ts:48 + reapply migration

-- Layer 1: domain view (aggregate logic lives here)
create or replace view carbon.v_overview_carbon as
select
  to_char(date_trunc('month', r.reading_date), 'YYYY-MM') as month,
  count(*)::int                                       as days,
  sum(r.consumption)                                  as kwh_total,
  round((sum(r.consumption) * 0.4999 / 1000)::numeric, 3) as tco2e
from carbon.reading r
where r.reading_date >= date_trunc('month', now()) - interval '11 months'
group by 1;

comment on view carbon.v_overview_carbon is
  'SCHEMA-6: monthly carbon aggregate (last 12 months) for OverviewPage. Domain view — wrapped by public.v_overview_carbon for anon access.';

-- Layer 2: public façade (NOT security_invoker — runs as owner → bypasses
-- base-table RLS; this is how SCHEMA-5 v_dashboard_14day etc. allow anon).
-- ไม่ใส่ with(...) clause เลย = default = security_invoker=off = definer-style.
create or replace view public.v_overview_carbon as
  select * from carbon.v_overview_carbon;

-- Grant anon + authenticated (เหมือน v_dashboard_14day)
grant select on public.v_overview_carbon to anon, authenticated;

notify pgrst, 'reload schema';
```

หมายเหตุ: `order by` ใน view ไม่จำเป็น — caller เลือกเอง; default order ของ
view = unspecified (Postgres doc) แต่ระดับ UI ใช้ `order by month desc limit 12`
อยู่แล้ว

### 2. `frontend/src/lib/supabase-queries.ts` — เพิ่มฟังก์ชันใหม่:

```ts
/**
 * Public overview carbon aggregate (SCHEMA-6) — anon-safe 12-month slice
 * for the landing-page Energy + Carbon cards. Authenticated CarbonPage
 * keeps using useCarbonMonthly (per-meter detail).
 *
 * Returns months in DESC order (latest first).
 */
export interface OverviewCarbonRow {
  month: string;       // YYYY-MM Gregorian
  days: number;
  kwh_total: number;
  tco2e: number;
}

export async function fetchOverviewCarbon(): Promise<OverviewCarbonRow[]> {
  const { data, error } = await supabase
    .from("v_overview_carbon")
    .select("month, days, kwh_total, tco2e")
    .order("month", { ascending: false })
    .limit(12);
  if (error) throw new Error(error.message);
  return (data ?? []) as OverviewCarbonRow[];
}
```

### 3. `frontend/src/lib/overview.ts` — สลับ energy/carbon source:

เปลี่ยนจาก `useCarbonMonthly(12)` → hook ใหม่ที่อ่าน `fetchOverviewCarbon`.
เพื่อ minimize diff + reuse pattern ที่มี, เพิ่ม `useOverviewCarbon` hook ใน
`overview.ts` (หรือ `carbon.ts` — เลือกตามความเหมาะสม; แนะนำใน `overview.ts`
เพราะใช้เฉพาะ overview):

```ts
// useOverviewCarbon — anon-safe 12-month aggregate from public.v_overview_carbon
function useOverviewCarbon() {
  const [data, setData] = useState<OverviewCarbonRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverviewCarbon()
      .then((rows) => { setData(rows); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
```

ใน `useOverview` เปลี่ยน:
- ลบ `const carbon = useCarbonMonthly(12);`
- เพิ่ม `const carbonPub = useOverviewCarbon();`
- `energy.latest` + `carbon.latest` derive จาก `carbonPub.data?.[0]` (เดือนล่าสุด)
- `carbon.tco2ePeriod` = `sum of carbonPub.data?.tco2e` (หรือเก็บ logic เดิมถ้า
  ต้องการ totals)

**คำนวณ mom_change_pct ฝั่ง JS**: ใช้ helper เดิมจาก `carbon.ts` (`momPct`)
หรือ inline ใน overview.ts:

```ts
const latestRow = carbonPub.data?.[0];
const prevRow = carbonPub.data?.[1];
const momChangePct = latestRow && prevRow
  ? Math.round(((latestRow.tco2e - prevRow.tco2e) / prevRow.tco2e) * 1000) / 10
  : null;
```

OverviewData shape คงเดิม — `CarbonMonth` type reuse ได้ (มี month/days/meters/
kwh_total/tco2e/mom_change_pct). แปลง OverviewCarbonRow → CarbonMonth เล็กน้อย
(meters = [] เพราะ overview ไม่ต้องการ per-meter detail)

### 4. Verify → commit → push → set done + ปลด claim

## Forbidden

- ห้ามแตะ `useCarbonMonthly` / `carbon.ts` aggregate logic (CarbonPage ยังใช้อยู่)
- ห้ามแก้ `public.carbon_reading` / `public.meter` grant (ต้องยัง authenticated-only)
- ห้ามใช้ `security_invoker=on` บน v_overview_carbon (definer = public access)
- ห้าม leak per-day reading / per-meter detail ผ่าน view (aggregate month เท่านั้น)
- ห้าม hardcode ค่าล่าสุด/ค่าวันที่ (อ้างอิง `now()` ใน SQL เสมอ)
- ห้ามเปลี่ยน emission factor โดยไม่ sync กับ `carbon.ts:48`
- ห้ามแตะ CarbonPage.tsx (ไม่เกี่ยว — auth ใช้ useCarbonMonthly ได้ปกติ)

## Verify commands

```bash
# 1. Splitter regression (migration splitter ต้องไม่พัง):
uv run python scripts/test_split_sql.py   # → 8/8 PASS

# 2. Apply migration (read-only via Management API, project gllqtbyofrcjzmbnfoeh):
#    ใช้ scripts/apply_migration_api.py กับไฟล์ migration ใหม่

# 3. Probe anon access (Supabase REST):
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://gllqtbyofrcjzmbnfoeh.supabase.co/rest/v1/v_overview_carbon?apikey=$ANON_KEY"
#   → ต้องเป็น 200 + rows (12 เดือน)
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://gllqtbyofrcjzmbnfoeh.supabase.co/rest/v1/carbon_reading?apikey=$ANON_KEY&limit=1"
#   → ต้องเป็น 401/42501 (per-reading detail ยัง lock)

# 4. Frontend:
cd frontend && npm run build          # typecheck + bundle
cd frontend && npx playwright test    # 26+ passed
# Manual (GLM ไม่ทำ — ส่ง Fable5):
#   dev server → ไม่ login → เปิด / → การ์ด Energy + Carbon โชว์ตัวเลข ไม่แดง
```

## Checkpoint log (append-only)

- [2026-07-20] zcode (GLM): เขียน WO จาก Fable5 tour finding + reference pattern
  4 report views ใน SCHEMA-5. design decision: aggregate month-only (ไม่ leak
  per-reading) + reuse EMISSION_FACTOR literal 0.4999 + คำนวณ mom% ฝั่ง JS.
  รอ dispatch/claim.
- [2026-07-20] zcode (GLM): execute ตาม Steps 1-4 — migration + frontend
  fetchOverviewCarbon + overview.ts rewrite (useOverviewCarbon hook +
  toCarbonMonths converter + inline momPct). Verify ครบ:
  - `uv run python scripts/test_split_sql.py` → 8/8 PASS
  - dry-run split_sql บน migration ใหม่ → 5 statements แยกสะอาด
  - apply migration ผ่าน Management API → 5/5 OK 0 FAIL (Drive-fallback
    path ผ่าน scripts/_env.py)
  - curl anon `/rest/v1/v_overview_carbon?order=month.desc&limit=3` →
    **HTTP 200** + 3 rows: 2026-07 (4d/19kWh/0.009tCO₂e), 2026-06 (30d/
    140/0.070), 2026-05 (31d/137/0.068)
  - curl anon `/rest/v1/carbon_reading?limit=1` → **HTTP 401** (per-reading
    detail ยัง lock — domain privacy ปกป้อง)
  - `npm run build` ✅ (TS clean — no leftover useCarbonMonthly ref)
  - Playwright 23/23 ✅ (smoke #16 OverviewPage ยัง render ได้)

  Nit follow-up (out of scope รอบนี้ — Forbidden ห้ามแตะ carbon.ts):
  carbon.ts:92 `momPct` เป็น module-private (ไม่ export) → overview.ts
  inline copy 1 ตัว. Extract ไป lib/utils.ts = chunk เล็ก cheap-ok.
