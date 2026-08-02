/**
 * Dock preferences — which modules are pinned, and in what order.
 *
 * Lives beside the component rather than in `src/lib/` on purpose: this is
 * presentation state (icon order), not app data, so it stays inside Track F's
 * scope. Nothing here touches Supabase.
 *
 * Storage is localStorage, i.e. PER DEVICE. Making the arrangement follow the
 * user across devices needs a `core.app_user` column or a prefs table — that
 * is a Track Z job (schema + RLS). `readDock`/`writeDock` are the seam: swap
 * their bodies for a query and every call site keeps working.
 */

const STORAGE_KEY = "dock:v1";

/** Paths shown by default, before the user rearranges anything. */
export const DEFAULT_DOCK: readonly string[] = [
  "/",
  "/dashboard",
  "/form",
  "/readings",
  "/trends",
  "/carbon",
  "/equipment",
  "/reports",
];

export interface DockPrefs {
  /** Ordered list of nav `to` paths. Order in the array = order in the dock. */
  order: string[];
}

/**
 * @param valid every `to` the current user may see. Anything stored but no
 *   longer valid (route removed, or an admin-only item read by a non-admin)
 *   is dropped here rather than rendering a dead icon.
 */
export function readDock(valid: ReadonlySet<string>): string[] {
  let stored: string[] | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        Array.isArray((parsed as DockPrefs).order)
      ) {
        stored = (parsed as DockPrefs).order.filter((p) => typeof p === "string");
      }
    }
  } catch {
    // Private mode, quota, or hand-edited garbage — fall through to defaults.
  }
  const source = stored ?? DEFAULT_DOCK;
  // De-dupe as well as filter: a bad write should never render one icon twice.
  return [...new Set(source)].filter((p) => valid.has(p));
}

export function writeDock(order: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ order } satisfies DockPrefs));
  } catch {
    // Preference loss is survivable; never break navigation over it.
  }
}

/** Move `from` to `to` in a copy of the array. Used by drag-reorder. */
export function reorder<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
