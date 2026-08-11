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

/** Result of a mutation call — callers read this tuple instead of
 *  reading hook.error after await (which is a stale closure snapshot
 *  until React re-renders). EQ-5.1 fix. */
export interface MutationResult<T> {
  data: T | null;
  error: string | null;
}

function useReadingMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
) {
  const invalidate = useInvalidateReadings();
  const [localData, setLocalData] = useState<TResult | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const m = useRqMutation({
    mutationFn: (args: TArgs) => fn(...args),
    onSettled: () => invalidate(),
  });
  // Mirror RQ's data/error into local state so reset() can null them on
  // demand (matches the prior useMutation helper's reset semantics) and
  // so mutate() can return a fresh error string instead of a stale
  // closure snapshot (EQ-5.1 fix — caller in DailyFormPage reads
  // mut.error right after await; the closure couldn't see the new error
  // until React re-rendered).
  if (m.data !== undefined && m.data !== localData) setLocalData(m.data ?? null);
  if (m.error !== null && m.isError) {
    const msg = m.error instanceof Error ? m.error.message : String(m.error);
    if (msg !== localError) setLocalError(msg);
  }
  const mutate = useCallback(
    async (...args: TArgs): Promise<MutationResult<TResult>> => {
      try {
        const result = await m.mutateAsync(args);
        const data = result ?? null;
        setLocalError(null);
        return { data, error: null };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setLocalError(msg);
        return { data: null, error: msg };
      }
    },
    [m],
  );
  const reset = useCallback(() => {
    m.reset();
    setLocalData(null);
    setLocalError(null);
  }, [m]);
  return {
    loading: m.isPending,
    // Kept for callers that read this on re-render (not after await).
    // Callers reading right after `await mutate(...)` should use the
    // returned tuple instead.
    error: localError,
    data: localData,
    mutate,
    reset,
  };
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
