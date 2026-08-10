import { useCallback, useState } from "react";
import { useQuery, useMutation as useRqMutation, useQueryClient } from "@tanstack/react-query";
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
//
// EQ-4 (2026-08-11): ported to @tanstack/react-query's useMutation. The
// caller-facing shape { loading, error, data, mutate, reset } is preserved.
// On success, related read queries are invalidated so pages refetch
// automatically (replaces the previous "caller calls refresh() after
// mutate" convention — though callers can still call refresh explicitly).
//
// The invalidate targets the same queryKey tuples the read hooks use
// (see useDashboard/useReadings/useReading above).

type MutationData<T> = { loading: boolean; error: string | null; data: T | null };

/** Invalidate every query that touches a reading (dashboard, readings
 * list, single reading). Called after create/update/delete. */
function useInvalidateReadings() {
  const qc = useQueryClient();
  return useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
    void qc.invalidateQueries({ queryKey: ["readings"] });
    void qc.invalidateQueries({ queryKey: ["reading"] });
  }, [qc]);
}

function useReadingMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
) {
  const invalidate = useInvalidateReadings();
  const [localData, setLocalData] = useState<TResult | null>(null);
  const m = useRqMutation({
    mutationFn: (args: TArgs) => fn(...args),
    onSettled: () => invalidate(),
  });
  // Mirror RQ's data into localData so reset() can null it on demand
  // (matches the prior useMutation helper's reset semantics).
  if (m.data !== undefined && m.data !== localData) setLocalData(m.data ?? null);
  const mutate = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      try {
        const result = await m.mutateAsync(args);
        return result ?? null;
      } catch {
        return null;
      }
    },
    [m],
  );
  const reset = useCallback(() => {
    m.reset();
    setLocalData(null);
  }, [m]);
  return {
    loading: m.isPending,
    error: m.error instanceof Error ? m.error.message : (m.error ? String(m.error) : null),
    data: localData,
    mutate,
    reset,
  } satisfies MutationData<TResult> & { mutate: typeof mutate; reset: () => void };
}

export function useCreateReading() {
  return useReadingMutation((body: ReadingCreate) => createReadingQ(body));
}

export function useUpdateReading() {
  return useReadingMutation((id: string, body: ReadingUpdate) => updateReadingQ(id, body));
}

export function useDeleteReading() {
  return useReadingMutation((id: string) => deleteReadingQ(id));
}
