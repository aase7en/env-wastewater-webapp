import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation as useRqMutation, useQueryClient } from "@tanstack/react-query";
import {
  createEquipmentSpec as createEquipmentSpecQ,
  createReading as createReadingQ,
  deleteReading as deleteReadingQ,
  fetchDashboard,
  fetchEquipment,
  fetchEquipmentSpecs,
  fetchMeterChainBefore,
  fetchMeterChainById,
  fetchPersonnel,
  fetchReading,
  fetchReadings,
  fetchWaterUsedForDate,
  syncReadingStatusMirror,
  updateReading as updateReadingQ,
} from "./supabase-queries";
import type {
  EquipmentSpecInsert,
} from "./supabase-queries";
import type {
  ReadingCreate,
  ReadingDetail,
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

// ─── P1.4 parity hooks (personnel picker, honest warnings, spec admin) ──

export function usePersonnel() {
  const q = useQuery({
    queryKey: ["personnel"] as const,
    queryFn: () => fetchPersonnel(),
  });
  return {
    data: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
  };
}

/** น้ำประปา Water_In lookup for the form's reading_date (honest warnings). */
export function useWaterUsedForDate(date: string | null | undefined) {
  const q = useQuery({
    queryKey: ["water-used", date] as const,
    queryFn: () => fetchWaterUsedForDate(date!),
    enabled: !!date,
  });
  return {
    data: q.data ?? null,
    loading: q.isLoading,
    error: q.error?.message ?? null,
  };
}

/** Meter-chain row for a SAVED reading (edit mode honest-warning check). */
export function useMeterChainById(id: string | null | undefined) {
  const q = useQuery({
    queryKey: ["meter-chain-id", id] as const,
    queryFn: () => fetchMeterChainById(id!),
    enabled: !!id,
  });
  return {
    data: q.data ?? null,
    loading: q.isLoading,
    error: q.error?.message ?? null,
  };
}

/** Latest meter-chain row strictly before a reading_date (create mode). */
export function useMeterChainBefore(date: string | null | undefined) {
  const q = useQuery({
    queryKey: ["meter-chain-before", date] as const,
    queryFn: () => fetchMeterChainBefore(date!),
    enabled: !!date,
  });
  return {
    data: q.data ?? null,
    loading: q.isLoading,
    error: q.error?.message ?? null,
  };
}

/** Equipment-spec history (admin page). */
export function useEquipmentSpecs() {
  const q = useQuery({
    queryKey: ["equipment-specs"] as const,
    queryFn: () => fetchEquipmentSpecs(),
  });
  return {
    data: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refresh: () => q.refetch(),
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
 *  until React re-renders). EQ-5.1 fix.
 *
 * WO-STAB-001 contract note: when the underlying mutationFn returns
 * Promise<void> (e.g. deleteReading), a SUCCESSFUL call yields
 * {data: null, error: null} — `data` is null on success. Callers MUST
 * branch on `error`, never on data truthiness. `data` non-null is only
 * meaningful for mutations that return an entity (create/update). */
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
  // EQ-5.2 fix: the previous version called setLocalData/setLocalError
  // during render ("if (m.data !== localData) setLocalData(...)") which
  // triggered "Maximum update depth exceeded" — setState-in-render is
  // only safe under the React docs' "you can call set during render to
  // adjust state" carve-out IF guarded by a deep equality check that
  // converges. RQ's data identity flips on every cache snapshot, so the
  // guard never converged. Moving the mirrors into useEffect (committed
  // phase) is the canonical fix.
  useEffect(() => {
    setLocalData(m.data ?? null);
  }, [m.data]);
  useEffect(() => {
    if (m.isError && m.error) {
      setLocalError(m.error instanceof Error ? m.error.message : String(m.error));
    } else if (!m.isError) {
      setLocalError(null);
    }
  }, [m.isError, m.error]);
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

export function useUpdateReading() {
  return useReadingMutation((id: string, body: ReadingUpdate) => updateReadingQ(id, body));
}

/** Result of the create mutation — `statusMirrorWarning` carries an HONEST
 *  warning when the reading saved but the P1.1 `*_status` enum mirrors
 *  could not be synced (see supabase-queries.syncReadingStatusMirror). */
export interface CreateReadingMutationResult extends MutationResult<ReadingDetail> {
  statusMirrorWarning: string | null;
}

/**
 * ENV-PARITY-P1-004 — dedicated create hook (was the generic
 * useReadingMutation): after the row is durably saved, syncs the P1.1
 * `*_status` mirrors and reports a mirror failure as a WARNING (never as
 * a failed save — the reading itself is already stored). Same cache
 * invalidation as the generic path.
 */
export function useCreateReading() {
  const qc = useQueryClient();
  const m = useRqMutation({
    mutationFn: (body: ReadingCreate) => createReadingQ(body),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      void qc.invalidateQueries({ queryKey: ["readings"] });
      void qc.invalidateQueries({ queryKey: ["reading"] });
    },
  });
  const mutate = useCallback(
    async (body: ReadingCreate): Promise<CreateReadingMutationResult> => {
      try {
        const row = await m.mutateAsync(body);
        if (!row) {
          return { data: null, error: "บันทึกไม่สำเร็จ", statusMirrorWarning: null };
        }
        const warning = await syncReadingStatusMirror(row.id, body as unknown as Record<string, unknown>);
        return { data: row, error: null, statusMirrorWarning: warning };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { data: null, error: msg, statusMirrorWarning: null };
      }
    },
    [m],
  );
  return {
    loading: m.isPending,
    error: m.error?.message ?? null,
    mutate,
  };
}

export function useDeleteReading() {
  return useReadingMutation((id: string) => deleteReadingQ(id));
}

/** Spec-append mutation (admin). Mirrors the useReadingMutation caller
 *  shape but invalidates only the spec cache — a spec append must not
 *  refetch reading queries. Append-only: no update/delete hook exists. */
export function useCreateEquipmentSpec() {
  const qc = useQueryClient();
  const m = useRqMutation({
    mutationFn: (payload: EquipmentSpecInsert) => createEquipmentSpecQ(payload),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["equipment-specs"] });
    },
  });
  const mutate = useCallback(
    async (payload: EquipmentSpecInsert): Promise<MutationResult<unknown>> => {
      try {
        const data = await m.mutateAsync(payload);
        return { data: data ?? null, error: null };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { data: null, error: msg };
      }
    },
    [m],
  );
  return { loading: m.isPending, error: m.error?.message ?? null, mutate };
}
