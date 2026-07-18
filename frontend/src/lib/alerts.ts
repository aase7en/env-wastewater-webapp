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

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

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
export function useThresholdAlerts(pollMs = 60_000) {
  const [alerts, setAlerts] = useState<ThresholdAlert[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // useRef to keep the interval stable across renders without re-subscribing.
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [rows, n] = await Promise.all([
        fetchThresholdAlerts(20),
        countUnreadAlerts(),
      ]);
      setAlerts(rows);
      setUnread(n);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial + interval + focus/visibility refresh.
  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, pollMs);

    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timer.current) clearInterval(timer.current);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh, pollMs]);

  /** Mark one alert read — optimistic local update + server write. */
  const markRead = useCallback(async (id: string) => {
    // Optimistic: only update if currently unread locally.
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id && a.read_at === null
          ? { ...a, read_at: new Date().toISOString() }
          : a,
      ),
    );
    setUnread((u) => Math.max(0, u - 1));
    try {
      await markAlertRead(id);
    } catch (e) {
      // Roll back by refreshing from server.
      console.warn("markAlertRead failed, refreshing:", e);
      refresh();
    }
  }, [refresh]);

  return { alerts, unread, loading, error, refresh, markRead };
}
