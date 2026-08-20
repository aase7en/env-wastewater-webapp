/**
 * WO-STAB-004 — form hydration gate (pure decision logic).
 *
 * The daily edit form hydrates its local state from a React Query
 * snapshot (`useReading(id)`). Background refetches (window-focus,
 * reconnect) deliver NEW snapshots, and the naive hydration effect
 * ([existing]) would repopulate the form and silently wipe unsaved user
 * edits (P0 #4, reports/code-review-2026-08-12.md).
 *
 * The decision "should this snapshot hydrate the form?" lives here as a
 * pure function so it is unit-testable in node env without DOM
 * rendering, and so the page component stays free of extra exports
 * (react(only-export-components) — see WO-STAB-INTEGRATE-001 finding 1).
 */
export interface HydrationGateState {
  /** The reading id whose data has already been hydrated into the form
   *  (null = nothing hydrated yet in this component's life). */
  hydratedId: string | null;
  /** True once the user has edited any field since the last hydration. */
  dirty: boolean;
}

export const INITIAL_GATE: HydrationGateState = { hydratedId: null, dirty: false };

/**
 * Decide whether a snapshot for `currentId` may hydrate the form, and
 * produce the gate state to persist afterwards.
 *
 * Rules (WO acceptance criteria):
 * - First hydration (nothing hydrated yet): ALLOW.
 * - Snapshot for a DIFFERENT reading id than the hydrated one: ALLOW
 *   (navigating to another record must hydrate the new record, regardless
 *   of the previous record's dirty state) and the gate resets.
 * - Same record, user has NOT edited since hydration: ALLOW (server
 *   refresh of a pristine form is still useful and must keep working).
 * - Same record, user HAS edited: DENY (protect unsaved input).
 */
export function resolveHydration(
  gate: HydrationGateState,
  currentId: string | undefined,
): { hydrate: boolean; next: HydrationGateState } {
  if (gate.hydratedId === null || gate.hydratedId !== currentId) {
    return { hydrate: true, next: { hydratedId: currentId ?? null, dirty: false } };
  }
  if (!gate.dirty) {
    return { hydrate: true, next: gate };
  }
  return { hydrate: false, next: gate };
}

/** Mark the gate dirty — called by the form's single field-set helper. */
export function markDirty(gate: HydrationGateState): HydrationGateState {
  return { ...gate, dirty: true };
}
