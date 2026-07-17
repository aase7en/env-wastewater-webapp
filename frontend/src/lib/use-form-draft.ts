/**
 * useFormDraft (P20b foundation) — autosave + restore hook for long forms.
 *
 * Usage (intended for DailyFormPage once F2 releases it; not wired yet):
 *
 *   const draft = useFormDraft({
 *     namespace: "daily-form",
 *     context: id, // edit-mode reading id; null for create
 *     values: form,
 *     debounceMs: 800,
 *   });
 *   // draft.restored  — the saved values to merge on mount, or null
 *   // draft.lastSavedAt — ISO string for the banner, or null
 *   // draft.clear() — wipe after submit
 *
 * Behaviour:
 * - On mount: reads any saved draft. If `context` matches (e.g. the same
 *   reading_id being edited, or both null = create mode), the values are
 *   surfaced via `restored` for the host form to merge. A mismatch (e.g.
 *   draft saved for reading X but now editing reading Y) is ignored — the
 *   stale draft is left in place; the host can call clear() if it wants.
 * - While mounted: debounced writeDraft on every `values` change.
 * - clear() removes the draft (call on successful submit).
 *
 * Track Z: pure logic, no UI, no page edit.
 */
import { useEffect, useRef, useState } from "react";
import { clearDraft, readDraft, relativeTimeThai, writeDraft, type Draft } from "./draft-storage";

export interface UseFormDraftOptions<T> {
  namespace: string;
  /** Disambiguator for edit-mode (e.g. reading id). Same value = same draft. */
  context?: string | null;
  values: T;
  /** Debounce window for writes. Default 800ms. */
  debounceMs?: number;
  /** Disable writes (e.g. while a submit is in flight). Default false. */
  paused?: boolean;
}

export interface UseFormDraftResult<T> {
  /** A draft restored on mount, if any matching one existed. Null otherwise. */
  restored: Draft<T> | null;
  /** Relative-time label for the saved draft, or null if none. */
  lastSavedLabel: string | null;
  /** ISO timestamp of the last successful write, or null. */
  lastSavedAt: string | null;
  /** Drop the draft (call after a successful submit). */
  clear: () => void;
}

export function useFormDraft<T>(opts: UseFormDraftOptions<T>): UseFormDraftResult<T> {
  const { namespace, context, values, debounceMs = 800, paused = false } = opts;

  // Read once on mount — subsequent reads would just echo our own writes.
  const [restored] = useState<Draft<T> | null>(() => {
    const d = readDraft<T>(namespace);
    if (!d) return null;
    // Context match: both null/undefined OR equal strings.
    const ctxMatches = (c1?: string | null, c2?: string | null) =>
      (c1 ?? null) === (c2 ?? null);
    if (!ctxMatches(d.context, context)) return null;
    return d;
  });

  const [lastSavedAt, setLastSavedAt] = useState<string | null>(restored?.savedAt ?? null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced autosave.
  useEffect(() => {
    if (paused) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      writeDraft(namespace, values, context ?? undefined);
      setLastSavedAt(new Date().toISOString());
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [values, namespace, context, debounceMs, paused]);

  const clear = () => {
    clearDraft(namespace);
    setLastSavedAt(null);
  };

  return {
    restored,
    lastSavedLabel: lastSavedAt ? relativeTimeThai(lastSavedAt) : null,
    lastSavedAt,
    clear,
  };
}
