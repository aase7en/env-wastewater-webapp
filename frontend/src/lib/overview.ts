import { useEffect, useState } from "react";
import { useDashboard } from "./hooks";
import { useCarbonMonthly, type CarbonMonth } from "./carbon";
import { fetchLatestReadingDate } from "./supabase-queries";
import type { DashboardRow } from "./types";

/**
 * Unified overview data (WO-V4a) — composes the EXISTING hooks (no
 * duplicated query logic per the WO): water from v_dashboard_14day,
 * energy + carbon from carbon.reading via useCarbonMonthly. Each section
 * carries its own loading/error so one failing source never blanks the
 * whole landing page.
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

export function useOverview(): OverviewData {
  const water = useDashboard(14);
  const carbon = useCarbonMonthly(12);

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

  const latestMonth = carbon.data?.months.length
    ? carbon.data.months[carbon.data.months.length - 1]
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
      loading: carbon.loading,
      error: carbon.error,
    },
    carbon: {
      latest: latestMonth,
      tco2ePeriod: carbon.data?.tco2e_total_period ?? null,
      loading: carbon.loading,
      error: carbon.error,
    },
  };
}
