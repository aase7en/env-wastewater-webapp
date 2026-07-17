import { useCallback, useEffect, useState } from "react";
import {
  createReading as createReadingQ,
  deleteReading as deleteReadingQ,
  fetchDashboard,
  fetchEquipment,
  fetchReading,
  fetchReadings,
  updateReading as updateReadingQ,
} from "./supabase-queries";
import type {
  DashboardRow,
  EquipmentOut,
  ReadingCreate,
  ReadingDetail,
  ReadingList,
  ReadingUpdate,
} from "./types";

/**
 * Data hooks — all queries now hit Supabase directly via supabase-queries.ts
 * (P12: FastAPI is no longer in the runtime path for the frontend).
 *
 * Each read hook exposes `refresh` so callers can invalidate after a
 * mutation. Mutation hooks (useCreate/Update/DeleteReading) return
 * { loading, error, data, mutate, reset }.
 */

// ─── Read hooks ─────────────────────────────────────────────────────────

export function useDashboard(days = 14) {
  const [data, setData] = useState<DashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchDashboard(days)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useReadings(limit = 14) {
  const [data, setData] = useState<ReadingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    fetchReadings(limit)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [limit, nonce]);

  return { data, loading, error, refresh };
}

export function useEquipment() {
  const [data, setData] = useState<EquipmentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEquipment()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useReading(id: string | null | undefined) {
  const [data, setData] = useState<ReadingDetail | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchReading(id)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
}

// ─── Mutation hooks ─────────────────────────────────────────────────────

type MutationData<T> = { loading: boolean; error: string | null; data: T | null };

function useMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>
) {
  const [state, setState] = useState<MutationData<TResult>>({
    loading: false,
    error: null,
    data: null,
  });

  const mutate = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setState({ loading: true, error: null, data: null });
      try {
        const data = await fn(...args);
        setState({ loading: false, error: null, data });
        return data;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setState({ loading: false, error: msg, data: null });
        return null;
      }
    },
    [fn]
  );

  const reset = useCallback(
    () => setState({ loading: false, error: null, data: null }),
    []
  );

  return { ...state, mutate, reset };
}

export function useCreateReading() {
  return useMutation((body: ReadingCreate) => createReadingQ(body));
}

export function useUpdateReading() {
  return useMutation((id: string, body: ReadingUpdate) => updateReadingQ(id, body));
}

export function useDeleteReading() {
  return useMutation((id: string) => deleteReadingQ(id));
}
