/**
 * WO-STAB-006 — threshold-alert optimistic mark-read transform (pure).
 *
 * `useThresholdAlerts().markRead(id)` optimistically writes a snapshot to
 * the React Query cache before the server write. The unread badge (`n`)
 * must only decrement when the target row was ACTUALLY unread: the
 * NotificationBell dismiss has no debounce, and the pre-fix code decremented
 * `n` unconditionally while the row-flip was already guarded by
 * `read_at === null` — so a double-click decremented the badge twice until
 * the next 60s poll (P1 #6, reports/code-review-2026-08-12.md).
 *
 * The transform lives here as a pure function (node-env testable,
 * mirroring form-hydration.ts) with the timestamp injected for
 * determinism, so the `wasUnread` decision cannot diverge between the row
 * flip and the badge arithmetic.
 */
import type { ThresholdAlert } from "./alerts";

/** Shape cached under ALERTS_QUERY_KEY by useThresholdAlerts. */
export interface AlertsSnapshot {
  rows: ThresholdAlert[];
  n: number;
}

/**
 * Optimistically mark `id` read in a snapshot.
 * Returns the SAME reference when the row is not unread (unknown id or
 * already read) — an idempotent second write is a full no-op.
 */
export function applyMarkRead(
  snapshot: AlertsSnapshot,
  id: string,
  now: Date = new Date(),
): AlertsSnapshot {
  // One decision drives BOTH the row flip and the badge arithmetic, so a
  // repeat click on an already-read row cannot decrement `n` again.
  const wasUnread = snapshot.rows.some(
    (a) => a.id === id && a.read_at === null,
  );
  if (!wasUnread) return snapshot;
  return {
    rows: snapshot.rows.map((a) =>
      a.id === id && a.read_at === null
        ? { ...a, read_at: now.toISOString() }
        : a,
    ),
    n: Math.max(0, snapshot.n - 1),
  };
}
