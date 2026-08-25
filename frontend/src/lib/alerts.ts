/**
 * WO-V3a — Threshold alerts data layer.
 *
 * Reads `wastewater.threshold_alert` — the staging table populated by the
 * P17 AFTER-INSERT trigger `fn_persist_threshold_alerts` on
 * `wastewater.reading`. Each row = one threshold breach on one reading.
 *
 * V3a added two things to make this usable from the UI:
 *   1. `read_at` column — NULL = unread in dashboard; timestamp when the
 *      user dismissed it. (Distinct from `notified_at` = whether the
 *      Line/Telegram webhook fired.)
 *   2. RLS enabled + policy `threshold_alert_authenticated_rw` for
 *      `authenticated` role, ALL commands.
 *
 * Acceptance (V3a-alerts-data.md):
 *   - useThresholdAlerts() — newest first, limit 20
 *   - markAlertRead(id) + unread count
 *   - Poll every 60s OR on window focus — NOT realtime subscription
 *     (free-tier discipline, deliberately deferred)
 */

import { useCallback } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { applyMarkRead, type AlertsSnapshot } from "./alerts-unread";

// ─── Types ───────────────────────────────────────────────────────────────

export interface ThresholdAlert {
  id: string;
  reading_id: string;
  /** Parameter that breached — e.g. "do_average" | "free_chlorine" | "ph". */
  field: string;
  /** Human-readable Thai message from fn_check_thresholds. */
  message: string;
  created_at: string;
  /** NULL until the notify-threshold EF pushes to Line/Telegram. */
  notified_at: string | null;
  /** NULL until the user dismisses it in the UI (V3a column). */
  read_at: string | null;
}

// ─── Async functions ─────────────────────────────────────────────────────

/** Fetch newest alerts, limit 20. Joined reading_date is convenient for
 * the dropdown UI (V3b) but not required — keep the column set minimal
 * so it matches the table directly. */
export async function fetchThresholdAlerts(limit = 20): Promise<ThresholdAlert[]> {
  const { data, error } = await supabase
    .from("threshold_alert")
    .select(
      "id, reading_id, field, message, created_at, notified_at, read_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as ThresholdAlert[];
}

/** Count unread alerts (read_at IS NULL). Used for the badge. */
export async function countUnreadAlerts(): Promise<number> {
  const { count, error } = await supabase
    .from("threshold_alert")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Mark one alert as read (sets read_at to now). Idempotent — if already
 * set, the update is a no-op server-side. */
export async function markAlertRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("threshold_alert")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null); // don't clobber an earlier read timestamp
  if (error) throw new Error(error.message);
}

// ─── Optimistic mark-read (cache write + rollback) ───────────────────────

/** Minimal query-client surface markReadViaCache needs — keeps the helper
 *  unit-testable in node env with a plain fake object (no DOM test infra
 *  in this repo). */
export type AlertsCacheClient = Pick<
  QueryClient,
  "getQueryData" | "setQueryData" | "invalidateQueries"
>;

/**
 * markRead body, extracted module-level (WO-STAB-006): optimistic cache
 * write via the pure applyMarkRead transform, then the server write, with
 * invalidation-on-error rollback unchanged from the pre-extraction inline
 * block. Only difference from the old inline code: the unread decrement
 * now shares the row-flip's `wasUnread` decision, so a repeat click on an
 * already-read alert can no longer double-decrement the badge.
 */
export async function markReadViaCache(
  qc: AlertsCacheClient,
  queryKey: readonly unknown[],
  id: string,
): Promise<void> {
  // Optimistic: flip the matching row + decrement unread (gated).
  const prev = qc.getQueryData<AlertsSnapshot>(queryKey);
  if (prev) {
    qc.setQueryData<AlertsSnapshot>(queryKey, applyMarkRead(prev, id));
  }
  try {
    await markAlertRead(id);
  } catch (e) {
    console.warn("markAlertRead failed, rolling back:", e);
    // Roll back: invalidate forces a fresh fetch from the server.
    void qc.invalidateQueries({ queryKey });
  }
}

// ─── Hooks ───────────────────────────────────────────────────────────────

/**
 * useThresholdAlerts — read hook with poll + on-focus refresh (NOT realtime).
 *
 * Polling cadence: every `pollMs` (default 60_000ms). Also refreshes when
 * the window regains focus or the document visibility flips back to
 * visible — covers the "user comes back to the tab" case cheaply.
 *
 * Returns { alerts, unread, loading, error, refresh, markRead }.
 * `markRead(id)` updates local state optimistically (decrements unread +
 * sets read_at) so the UI reacts without waiting for the next poll.
 */
// Module-level stable key — declared here (not inside the hook) so
// useCallback dependencies don't change identity every render.
const ALERTS_QUERY_KEY = ["threshold-alerts", 20] as const;

export function useThresholdAlerts(pollMs = 60_000) {
  // EQ-3 (2026-08-11): polling + focus/visibility replaced by React Query's
  // refetchInterval + refetchOnWindowFocus (set globally in query-client.ts).
  //
  // EQ-4 (2026-08-11): markRead now uses useMutation with onMutate writing
  // to the query cache via queryClient.setQueryData (optimistic) + onError
  // rolling back via invalidate. Local useState for alerts/unread is gone
  // — the cache is the single source of truth.
  //
  // EQ-5.1 (2026-08-11 fix): queryKey moved to module-level (was inside hook
  // body → identity changed every render → useCallback recreated markRead/
  // refresh every render, lint flagged it).
  const qc = useQueryClient();
  const queryKey = ALERTS_QUERY_KEY;

  const q = useQuery({
    queryKey,
    queryFn: async () => {
      const [rows, n] = await Promise.all([
        fetchThresholdAlerts(20),
        countUnreadAlerts(),
      ]);
      return { rows, n };
    },
    refetchInterval: pollMs,
  });

  const refresh = useCallback(() => q.refetch(), [q]);

  /** Mark one alert read — optimistic cache update + server write.
   *  Rolls back on error by invalidating (forces a refetch).
   *  Logic lives in markReadViaCache (module-level, testable). */
  const markRead = useCallback(
    (id: string) => markReadViaCache(qc, queryKey, id),
    [qc, queryKey],
  );

  return {
    alerts: q.data?.rows ?? [],
    unread: q.data?.n ?? 0,
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refresh,
    markRead,
  };
}
