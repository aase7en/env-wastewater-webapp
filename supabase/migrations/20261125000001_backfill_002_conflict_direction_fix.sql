-- ENV-BACKFILL-002 — D5 P1 repair: electricity version-conflict DIRECTION fix
-- (claim ENV-BACKFILL-002-C1, Track-Z GLM; supersedes the seeded direction of
-- the base backfill_002_carbon migration at exactly 5 (meter, reading_date) rows)
--
-- WHY (D5 fresh-GLM review of PR #271 at head 20c3ba1, receipt
-- pull/271#issuecomment-7135229565 — P1):
--   The recorded D1 decision 4 (docs/ai/handoffs/ENV-BACKFILL-002-GLM.md) is
--   "the big row is the reading; the 5 small companions preserved verbatim in
--   raw_payload.companion_rows". The base migration seeded the OPPOSITE: at all
--   5 conflict dates the stored consumption is the small companion
--   (328/334/341/378/237 kWh) while the hospital-wide monthly bill
--   (73,079/71,485/69,375.99/81,131/41,988 kWh) lives only in
--   companion_rows (recorded_not_aggregated — values preserved, never lost).
--   The base header's justification ("the dedicated energy tab's value is the
--   reading") is factually false: the sha-pinned CSVs show the energy tab
--   carries BOTH values at every one of the 5 dates (energy.csv physical rows
--   13/14, 25/26, 41/42, 43/44, 45/46; basedata.csv same-date pairs at physical
--   rows 173/174, 179/180, 187/188, 268/269, 2862/2864), so the tab cannot
--   disambiguate — the recorded D1.4 ruling is the only authority, and it says
--   big-is-the-reading.
--   Delivered impact pre-fix: carbon.v_monthly_co2e electricity misses
--   335,440.99 kWh ≈ 167.70 tCO₂e across the 5 months vs the sheet's own bills
--   (the full big-bill corpus 337,058.99 kWh ≈ 168.50 tCO₂e was under-counted;
--   the 1,618 kWh of small companions were already aggregated). Dec-2025 read
--   379.00 kWh / 189.48 kg instead of ~42,130 kWh (41,988 big + plant meter).
--
-- WHAT (exactly 5 rows on the grid meter 'การใช้ไฟฟ้าส่วนภูมิภาค
-- (จากชีต CarbonF — ENV-BACKFILL-002)'):
--   consumption := the big hospital-wide value (companion_rows[0].value)
--   raw_payload.cost_thb := the big row's cost (companion_rows[0].cost_thb)
--   companion_rows[0] := the small value + its cost (recorded_not_aggregated
--   structure preserved; all four numbers kept verbatim, positions swapped)
--   meter_value stays NULL (the row keeps exactly one quantity column).
--   The stale waste_sale_ledger table comment ("one personal-name note
--   masked NULL") is repaired to the true count (4) — P3 rides along.
--
-- GUARDS (idempotent + drift-safe): every UPDATE pins the meter identity, the
-- reading_date, the current small consumption, AND the companion big value.
-- Post-apply the consumption guard can never match again ⇒ re-run swaps 0 rows.
--
-- ROLLBACK (owner-gated; NOT executed by this migration) — reverse swap, same
-- shape with the direction inverted (consumption := small companion, companion
-- := big), guards pinned on consumption = big + companion = small; e.g.
--   update carbon.reading r set consumption = 328.0::numeric,
--     raw_payload = jsonb_set(jsonb_set(jsonb_set(r.raw_payload,
--       '{companion_rows,0,cost_thb}', '1845.27'::jsonb),
--       '{companion_rows,0,value}', '73079.0'::jsonb),
--       '{cost_thb}', '334248.52'::jsonb)
--   where r.meter_id = (select id from carbon.meter where meter_name =
--     'การใช้ไฟฟ้าส่วนภูมิภาค (จากชีต CarbonF — ENV-BACKFILL-002)'
--     order by created_at limit 1) and r.reading_date = date '2024-08-20'
--     and r.consumption = 73079.0; -- (repeat per date with that date's pair)
--
-- Existing policies govern this write (runs as table owner).

update carbon.reading r set consumption = (r.raw_payload->'companion_rows'->0->>'value')::numeric, raw_payload = jsonb_set(jsonb_set(jsonb_set(r.raw_payload, '{companion_rows,0,cost_thb}', coalesce(r.raw_payload->'cost_thb', 'null'::jsonb)), '{companion_rows,0,value}', to_jsonb(r.consumption)), '{cost_thb}', coalesce(r.raw_payload->'companion_rows'->0->'cost_thb', 'null'::jsonb)) where r.meter_id = (select id from carbon.meter where meter_name = 'การใช้ไฟฟ้าส่วนภูมิภาค (จากชีต CarbonF — ENV-BACKFILL-002)' order by created_at limit 1) and r.reading_date = date '2024-08-20' and r.consumption = 328.0 and (r.raw_payload->'companion_rows'->0->>'value')::numeric = 73079.0 returning r.reading_date::text as d, r.consumption::text as c_new;
update carbon.reading r set consumption = (r.raw_payload->'companion_rows'->0->>'value')::numeric, raw_payload = jsonb_set(jsonb_set(jsonb_set(r.raw_payload, '{companion_rows,0,cost_thb}', coalesce(r.raw_payload->'cost_thb', 'null'::jsonb)), '{companion_rows,0,value}', to_jsonb(r.consumption)), '{cost_thb}', coalesce(r.raw_payload->'companion_rows'->0->'cost_thb', 'null'::jsonb)) where r.meter_id = (select id from carbon.meter where meter_name = 'การใช้ไฟฟ้าส่วนภูมิภาค (จากชีต CarbonF — ENV-BACKFILL-002)' order by created_at limit 1) and r.reading_date = date '2024-09-19' and r.consumption = 334.0 and (r.raw_payload->'companion_rows'->0->>'value')::numeric = 71485.0 returning r.reading_date::text as d, r.consumption::text as c_new;
update carbon.reading r set consumption = (r.raw_payload->'companion_rows'->0->>'value')::numeric, raw_payload = jsonb_set(jsonb_set(jsonb_set(r.raw_payload, '{companion_rows,0,cost_thb}', coalesce(r.raw_payload->'cost_thb', 'null'::jsonb)), '{companion_rows,0,value}', to_jsonb(r.consumption)), '{cost_thb}', coalesce(r.raw_payload->'companion_rows'->0->'cost_thb', 'null'::jsonb)) where r.meter_id = (select id from carbon.meter where meter_name = 'การใช้ไฟฟ้าส่วนภูมิภาค (จากชีต CarbonF — ENV-BACKFILL-002)' order by created_at limit 1) and r.reading_date = date '2024-10-20' and r.consumption = 341.0 and (r.raw_payload->'companion_rows'->0->>'value')::numeric = 69375.99 returning r.reading_date::text as d, r.consumption::text as c_new;
update carbon.reading r set consumption = (r.raw_payload->'companion_rows'->0->>'value')::numeric, raw_payload = jsonb_set(jsonb_set(jsonb_set(r.raw_payload, '{companion_rows,0,cost_thb}', coalesce(r.raw_payload->'cost_thb', 'null'::jsonb)), '{companion_rows,0,value}', to_jsonb(r.consumption)), '{cost_thb}', coalesce(r.raw_payload->'companion_rows'->0->'cost_thb', 'null'::jsonb)) where r.meter_id = (select id from carbon.meter where meter_name = 'การใช้ไฟฟ้าส่วนภูมิภาค (จากชีต CarbonF — ENV-BACKFILL-002)' order by created_at limit 1) and r.reading_date = date '2025-06-21' and r.consumption = 378.0 and (r.raw_payload->'companion_rows'->0->>'value')::numeric = 81131.0 returning r.reading_date::text as d, r.consumption::text as c_new;
update carbon.reading r set consumption = (r.raw_payload->'companion_rows'->0->>'value')::numeric, raw_payload = jsonb_set(jsonb_set(jsonb_set(r.raw_payload, '{companion_rows,0,cost_thb}', coalesce(r.raw_payload->'cost_thb', 'null'::jsonb)), '{companion_rows,0,value}', to_jsonb(r.consumption)), '{cost_thb}', coalesce(r.raw_payload->'companion_rows'->0->'cost_thb', 'null'::jsonb)) where r.meter_id = (select id from carbon.meter where meter_name = 'การใช้ไฟฟ้าส่วนภูมิภาค (จากชีต CarbonF — ENV-BACKFILL-002)' order by created_at limit 1) and r.reading_date = date '2025-12-21' and r.consumption = 237.0 and (r.raw_payload->'companion_rows'->0->>'value')::numeric = 41988.0 returning r.reading_date::text as d, r.consumption::text as c_new;

-- P3 (stale honesty receipt): the ledger comment must match reality — 4 notes
-- masked NULL (seqs 10/21/22/23), not one.
comment on table carbon.waste_sale_ledger is 'ENV-BACKFILL-002: waste-sale revenue ledger — ยอดรวมเหลือ stored as-written, never recomputed; 4 personal-name notes masked NULL (seqs 10/21/22/23; D1 PII rule widened at D3).';
