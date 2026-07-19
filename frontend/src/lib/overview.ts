import { useEffect, useState } from "react";
import { useDashboard } from "./hooks";
import { type CarbonMonth } from "./carbon";
import { fetchLatestReadingDate, fetchOverviewCarbon, type OverviewCarbonRow } from "./supabase-queries";
import type { DashboardRow } from "./types";

/**
 * Unified overview data (WO-V4a) — composes the EXISTING hooks (no
 * duplicated query logic per the WO): water from v_dashboard_14day,
 * energy + carbon from the SCHEMA-6 anon-safe aggregate view
 * `public.v_overview_carbon` (so the landing page works for anon users —
 * `useCarbonMonthly` reads `carbon.reading` directly which is auth-only).
 * Each section carries its own loading/error so one failing source never
 * blanks the whole landing page.
 */
export interface OverviewData {
  water: {
    today: DashboardRow | undefined;
    /** true = ปกติ, false = ผิดปกติ, null = ไม่ทราบ/ยังไม่บันทึก */
    status: boolean | null;
    anyAlert: boolean;
    lastDate: string | null;
    loading: boolean;
    error: string | null;
  };
  energy: {
    latest: CarbonMonth | null;
    loading: boolean;
    error: string | null;
  };
  carbon: {
    latest: CarbonMonth | null;
    tco2ePeriod: number | null;
    loading: boolean;
    error: string | null;
  };
}

/**
 * useOverviewCarbon — anon-safe 12-month aggregate from public.v_overview_carbon
 * (SCHEMA-6). Returns latest-first rows; converts to the CarbonMonth shape
 * (meters=[] since the overview cards don't need per-meter detail) and
 * computes mom_change_pct client-side from the previous row.
 *
 * momPct is inlined here because carbon.ts:92 keeps it module-private (not
 * exported). The follow-up nit (WO Forbidden prevents touching carbon.ts in
 * this chunk): extract momPct into lib/utils.ts, then both carbon.ts and
 * overview.ts import from there. That is a separate cheap-ok chunk.
 */
function useOverviewCarbon() {
  const [rows, setRows] = useState<OverviewCarbonRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverviewCarbon()
      .then((r) => { setRows(r); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { rows, loading, error };
}

function momPct(curr: number, prev: number | null): number | null {
  if (prev == null || prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

/** Convert flat OverviewCarbonRow[] → CarbonMonth[] (latest-first). */
function toCarbonMonths(rows: OverviewCarbonRow[]): CarbonMonth[] {
  return rows.map((r, i) => {
    const prev = i + 1 < rows.length ? rows[i + 1].tco2e : null;
    return {
      month: r.month,
      days: r.days,
      meters: [],
      kwh_total: Math.round(r.kwh_total * 100) / 100,
      tco2e: r.tco2e,
      mom_change_pct: momPct(r.tco2e, prev),
    } satisfies CarbonMonth;
  });
}

export function useOverview(): OverviewData {
  const water = useDashboard(14);
  const carbonPub = useOverviewCarbon();

  const today = water.data[0];

  // F7: when the 14-day window is empty, fetch the actual latest date so the
  // landing card can say "บันทึกล่าสุด <date> (N วันก่อน)" instead of bare
  // "ยังไม่บันทึกวันนี้". Only fetched when today is undefined.
  const [latestDateAny, setLatestDateAny] = useState<string | null>(null);
  useEffect(() => {
    if (today) { setLatestDateAny(null); return; }
    fetchLatestReadingDate()
      .then(setLatestDateAny)
      .catch(() => setLatestDateAny(null));
  }, [today]);

  const months = carbonPub.rows ? toCarbonMonths(carbonPub.rows) : [];
  // rows come latest-first from the query; latestMonth = months[0]
  const latestMonth = months.length ? months[0] : null;
  const tco2ePeriod = months.length
    ? Math.round(months.reduce((s, m) => s + m.tco2e, 0) * 1000) / 1000
    : null;

  return {
    water: {
      today,
      status: today?.system_operating ?? null,
      anyAlert: !!today && (!!today.do_alert || !!today.ph_alert || !!today.chlorine_alert),
      lastDate: today?.reading_date ?? latestDateAny,
      loading: water.loading,
      error: water.error,
    },
    energy: {
      latest: latestMonth,
      loading: carbonPub.loading,
      error: carbonPub.error,
    },
    carbon: {
      latest: latestMonth,
      tco2ePeriod,
      loading: carbonPub.loading,
      error: carbonPub.error,
    },
  };
}
