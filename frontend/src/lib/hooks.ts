import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  ReadingCreate,
  ReadingUpdate,
} from "./types";

/**
 * Data hooks — all queries now hit Supabase directly via supabase-queries.ts
 * (P12: FastAPI is no longer in the runtime path for the frontend).
 *
 * EQ-2 (2026-08-11): read hooks migrated to @tanstack/react-query. The
 * caller-facing shape { data, loading, error, refresh } is preserved so
 * no page changes are required. Mutations stay on the ad-hoc useMutation
 * helper below until EQ-4 ports them to react-query's useMutation with
 * cache invalidation.
 */

// ─── Read hooks ─────────────────────────────────────────────────────────

export function useDashboard(days = 14) {
  const q = useQuery({
    queryKey: ["dashboard", days] as const,
    queryFn: () => fetchDashboard(days),
  });
  return {
    data: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refresh: () => q.refetch(),
  };
}

export function useReadings(limit = 14) {
  const q = useQuery({
    queryKey: ["readings", limit] as const,
    queryFn: () => fetchReadings(limit),
  });
  return {
    data: q.data ?? null,
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refresh: () => q.refetch(),
  };
}

export function useEquipment() {
  const q = useQuery({
    queryKey: ["equipment"] as const,
    queryFn: () => fetchEquipment(),
  });
  return {
    data: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
  };
}

export function useReading(id: string | null | undefined) {
  const q = useQuery({
    queryKey: ["reading", id] as const,
    queryFn: () => fetchReading(id!),
    enabled: !!id,
  });
  return {
    data: q.data ?? null,
    loading: q.isLoading,
    error: q.error?.message ?? null,
  };
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
