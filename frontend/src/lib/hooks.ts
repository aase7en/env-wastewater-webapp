import { useEffect, useState } from "react";
import { api } from "./api-client";
import type { DashboardRow, ReadingList } from "./types";

/** Fetch the 14-day dashboard log. Returns {data, loading, error, refresh}. */
export function useDashboard(days = 14) {
  const [data, setData] = useState<DashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    api.dashboard(days)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [days]);
  return { data, loading, error, refresh };
}

/** Fetch recent readings (for the log table). */
export function useReadings(limit = 14) {
  const [data, setData] = useState<ReadingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.readings(limit)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [limit]);

  return { data, loading, error };
}
