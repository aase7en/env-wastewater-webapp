/**
 * WO-V2a — Carbon (electricity) data layer.
 *
 * Aggregates `carbon.reading` (907 daily rows, 2024-01-09 → present) into
 * monthly kWh + tCO₂e figures for the Carbon page (V2b).
 *
 * Schema verified live 2026-07-17:
 *   carbon.reading:
 *     meter_value    numeric   cumulative meter reading (do NOT sum this)
 *     consumption    numeric   daily usage kWh — SOURCE OF TRUTH
 *   carbon.meter:
 *     1 active row: "ระบบบ่อบัดบำบัดน้ำเสีย" (whole-WWTP electricity)
 *
 * IMPORTANT — phase1-analysis.md §4:
 *   Day-over-day delta of meter_value vs the `consumption` col mismatches
 *   on 71 / 907 rows. The operators entered actual usage into AppSheet;
 *   the `consumption` column IS the authoritative value — never derive
 *   usage from meter deltas. We aggregate SUM(consumption).
 *
 * Design note on multi-meter:
 *   Only one meter exists today, but the API returns `meters[]` so V2b
 *   and later additions (e.g. pump1/pump2 sub-meters) can be rendered
 *   without touching this layer again.
 *
 * RLS:
 *   carbon.reading + carbon.meter — both `authenticated`, ALL commands
 *   (policy `carbon_reading_rw` / `carbon_meter_rw`). Read path only here.
 */

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// ─── Config ──────────────────────────────────────────────────────────────

/**
 * Thailand grid emission factor for electricity.
 *
 * Source: Thailand Greenhouse Gas Management Organization (TGO) —
 * "Emission Factor of Electricity Grid 2023" (ค่าสัมประสิทธิ์การปล่อยก๊าซ
 * เรือนกระจกของไฟฟ้าที่จ่ายในประเทศไทย). Published 2024.
 *
 * ⚠️ USER SHOULD VERIFY: this factor is updated annually by TGO. If your
 * reporting year differs, check the latest TGO announcement and update
 * this single constant — every downstream calculation picks it up.
 *
 * Unit: kgCO₂e per kWh.
 */
export const EMISSION_FACTOR_KGCO2E_PER_KWH = 0.4999;

// ─── Types ───────────────────────────────────────────────────────────────

export interface MeterMonthly {
  meter_id: string;
  meter_name: string;
  kwh: number;
}

export interface CarbonMonth {
  /** YYYY-MM (Gregorian). */
  month: string;
  /** Number of days with readings this month (helps spot partial months). */
  days: number;
  /** Per-meter breakdown. For now this is a single-entry array. */
  meters: MeterMonthly[];
  /** Total kWh across all meters for the month. */
  kwh_total: number;
  /** tCO₂e = kwh_total × factor / 1000. */
  tco2e: number;
  /** Month-over-month % change in tCO₂e vs the previous month in the slice.
   * `null` for the oldest month in the returned range (no previous to
   * compare against). A negative number = reduction. */
  mom_change_pct: number | null;
}

export interface CarbonSummary {
  months: CarbonMonth[];
  /** Sum of kWh across all returned months. */
  kwh_total_period: number;
  /** Sum of tCO₂e across all returned months. */
  tco2e_total_period: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function num(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

/** Compute month-over-month % change. Returns null if previous is 0/missing. */
function momPct(curr: number, prev: number | null | undefined): number | null {
  if (prev === null || prev === undefined || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

// ─── Async functions ─────────────────────────────────────────────────────

/**
 * Fetch monthly carbon aggregates for the last `months` months (default 12).
 *
 * Implemented client-side over PostgREST (no SQL view needed):
 *   1. Read carbon.meter (id + name) — small.
 *   2. Read carbon.reading for the date range, grouped via Supabase
 *      by YYYY-MM + meter_id.
 *
 * Why client-side aggregation: only 907 rows total; fetching raw monthly
 * buckets keeps the wire payload tiny (≤12 × meters-per-month) and lets
 * the UI re-render instantly when the emission factor constant changes
 * without a DB round-trip.
 */
export async function fetchCarbonMonthly(months = 12): Promise<CarbonSummary> {
  // 1. Meter map.
  const { data: meters, error: mErr } = await supabase
    .from("meter")
    .select("id, meter_name")
    .eq("source", "electricity");
  if (mErr) throw new Error(mErr.message);
  const meterName = new Map<string, string>(
    (meters ?? []).map((m: { id: string; meter_name: string }) => [m.id, m.meter_name]),
  );

  // 2. Date range: cover the last N whole months back from current month.
  //    Use ISO dates; Supabase compares text correctly for YYYY-MM-DD.
  const now = new Date();
  const endExclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const startInclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  const startDate = startInclusive.toISOString().slice(0, 10);
  const endDate = endExclusive.toISOString().slice(0, 10);

  // 3. Fetch daily rows for the window. ~365 rows max — cheap.
  const { data: rows, error: rErr } = await supabase
    .from("carbon_reading")
    .select("meter_id, reading_date, consumption")
    .gte("reading_date", startDate)
    .lt("reading_date", endDate);
  if (rErr) throw new Error(rErr.message);

  // 4. Aggregate in JS: bucket by {month, meter_id}.
  type Bucket = { kwh: number; days: Set<string> };
  const buckets = new Map<string, Bucket>(); // key = `${month}|${meter_id}`
  for (const row of rows ?? []) {
    const dateStr = String(row.reading_date ?? "").slice(0, 10); // YYYY-MM-DD
    const month = dateStr.slice(0, 7); // YYYY-MM
    const key = `${month}|${row.meter_id}`;
    let b = buckets.get(key);
    if (!b) { b = { kwh: 0, days: new Set<string>() }; buckets.set(key, b); }
    b.kwh += num(row.consumption);
    if (dateStr) b.days.add(dateStr);
  }

  // 5. Collapse buckets → one CarbonMonth per YYYY-MM (sorted ascending).
  const byMonth = new Map<string, CarbonMonth>();
  for (const [key, b] of buckets) {
    const [month, meterId] = key.split("|");
    const kwh = Math.round(b.kwh * 100) / 100; // 2dp
    const tco2e = Math.round((kwh * EMISSION_FACTOR_KGCO2E_PER_KWH / 1000) * 1000) / 1000;
    let m = byMonth.get(month);
    if (!m) {
      m = {
        month, days: 0, meters: [],
        kwh_total: 0, tco2e: 0, mom_change_pct: null,
      };
      byMonth.set(month, m);
    }
    m.days += b.days.size;
    m.meters.push({
      meter_id: meterId,
      meter_name: meterName.get(meterId) ?? "(unknown meter)",
      kwh,
    });
    m.kwh_total = Math.round((m.kwh_total + kwh) * 100) / 100;
    m.tco2e = Math.round((m.tco2e + tco2e) * 1000) / 1000;
  }

  const sortedMonths = Array.from(byMonth.values()).sort((a, b) =>
    a.month < b.month ? -1 : a.month > b.month ? 1 : 0,
  );

  // 6. Compute MoM% (oldest = null baseline).
  for (let i = 0; i < sortedMonths.length; i++) {
    const curr = sortedMonths[i];
    const prev = i > 0 ? sortedMonths[i - 1].tco2e : null;
    curr.mom_change_pct = momPct(curr.tco2e, prev);
  }

  return {
    months: sortedMonths,
    kwh_total_period: Math.round(sortedMonths.reduce((s, m) => s + m.kwh_total, 0) * 100) / 100,
    tco2e_total_period: Math.round(sortedMonths.reduce((s, m) => s + m.tco2e, 0) * 1000) / 1000,
  };
}

// ─── Hooks ───────────────────────────────────────────────────────────────

/** useCarbonMonthly — read hook with manual refresh (no polling by default;
 * monthly data changes once a day at most). */
export function useCarbonMonthly(months = 12) {
  const [data, setData] = useState<CarbonSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCarbonMonthly(months)
      .then((summary) => { setData(summary); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [months]);

  return { data, loading, error };
}
