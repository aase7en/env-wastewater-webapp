import { useCallback, useEffect, useState } from "react";
import { api } from "./api-client";
import type {
  DashboardRow,
  EquipmentOut,
  ReadingCreate,
  ReadingDetail,
  ReadingList,
  ReadingUpdate,
} from "./types";

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
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    api.readings(limit)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [limit, nonce]);

  return { data, loading, error, refresh };
}

/** Equipment reference — for the 10-item checklist labels (Thai names). */
export function useEquipment() {
  const [data, setData] = useState<EquipmentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.equipment()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

/** GET a single reading for edit mode. Pass null/undefined to skip (create mode). */
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
    api.getReading(id)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
}

// ─── Mutation hooks (lightweight — no react-query needed yet) ────────────

type MutationData<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
};

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
  return useMutation((body: ReadingCreate) => api.createReading(body));
}

export function useUpdateReading() {
  return useMutation((id: string, body: ReadingUpdate) =>
    api.updateReading(id, body)
  );
}

export function useDeleteReading() {
  return useMutation((id: string) => api.deleteReading(id));
}
