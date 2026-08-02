/**
 * Dock preferences — what is on the dock, in what order, and how big.
 *
 * Lives beside the component rather than in `src/lib/` on purpose: this is
 * presentation state, not app data, so it stays inside Track F's scope.
 * Nothing here touches Supabase.
 *
 * Storage is localStorage, i.e. PER DEVICE. Making the arrangement follow a
 * user across devices needs a prefs table + RLS, which is Track Z work.
 * `readDock`/`writeDock` are the seam: swap their bodies for a query and every
 * call site keeps working.
 *
 * NOT a permission boundary. Hiding an icon here hides a shortcut, nothing
 * more — anyone can still type the URL. Real access control is RLS plus the
 * `RequireAuth requireAdmin` route guards. See
 * docs/work-orders/DOCK-role-module-visibility.md.
 */

const STORAGE_KEY = "dock:v1"; // key name kept; the payload is versioned inside

/** A dock slot: either one module, or a folder holding several. */
export type DockEntry =
  | { kind: "module"; to: string }
  | { kind: "folder"; id: string; name: string; items: string[] };

export type IconSize = "sm" | "md" | "lg";

/**
 * Slot sizes. `lg` is not decoration — staff read this at arm's length on a
 * phone, outdoors, sometimes in gloves, and some of them are long-sighted.
 */
export const ICON_PX: Record<IconSize, number> = { sm: 40, md: 48, lg: 60 };

export interface DockPrefs {
  entries: DockEntry[];
  iconSize: IconSize;
}

/** Paths shown before the user rearranges anything. */
export const DEFAULT_PATHS: readonly string[] = [
  "/",
  "/dashboard",
  "/form",
  "/readings",
  "/trends",
  "/carbon",
  "/equipment",
  "/reports",
];

const defaults = (): DockPrefs => ({
  entries: DEFAULT_PATHS.map((to) => ({ kind: "module", to })),
  iconSize: "md",
});

export function newFolderId(): string {
  return `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Every module path on the dock, whether loose or inside a folder. */
export function pinnedPaths(entries: readonly DockEntry[]): Set<string> {
  const s = new Set<string>();
  for (const e of entries) {
    if (e.kind === "module") s.add(e.to);
    else e.items.forEach((p) => s.add(p));
  }
  return s;
}

/**
 * Drop anything the user can no longer reach and anything stored twice, then
 * hand back a tree that is safe to render.
 *
 * @param valid every `to` this user may see. A path that has gone (route
 *   removed, or an admin-only entry read by a non-admin) is dropped here
 *   rather than rendering a dead icon.
 */
function sanitize(entries: DockEntry[], valid: ReadonlySet<string>): DockEntry[] {
  const seen = new Set<string>();
  const out: DockEntry[] = [];
  for (const e of entries) {
    if (e.kind === "module") {
      if (!valid.has(e.to) || seen.has(e.to)) continue;
      seen.add(e.to);
      out.push(e);
    } else {
      const items = e.items.filter((p) => valid.has(p) && !seen.has(p));
      items.forEach((p) => seen.add(p));
      // An empty folder is a dead end — it cannot be opened to anything.
      if (items.length === 0) continue;
      out.push({ ...e, items });
    }
  }
  return out;
}

export function readDock(valid: ReadonlySet<string>): DockPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults(), entries: sanitize(defaults().entries, valid) };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) throw new Error("shape");

    const obj = parsed as Record<string, unknown>;

    // v1 payload was { order: string[] } — migrate rather than discard, or a
    // user's arrangement silently resets the first time they load this build.
    if (Array.isArray(obj.order)) {
      const entries: DockEntry[] = (obj.order as unknown[])
        .filter((p): p is string => typeof p === "string")
        .map((to) => ({ kind: "module", to }));
      return { entries: sanitize(entries, valid), iconSize: "md" };
    }

    const entries = Array.isArray(obj.entries) ? (obj.entries as DockEntry[]) : [];
    const size = obj.iconSize;
    return {
      entries: sanitize(entries, valid),
      iconSize: size === "sm" || size === "lg" ? size : "md",
    };
  } catch {
    // Private mode, quota, or hand-edited garbage — fall through to defaults.
    return { ...defaults(), entries: sanitize(defaults().entries, valid) };
  }
}

export function writeDock(prefs: DockPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 2, ...prefs }));
  } catch {
    // Preference loss is survivable; never break navigation over it.
  }
}

/** Fresh defaults, ignoring anything stored. Backs the "reset" tool. */
export function defaultPrefs(valid: ReadonlySet<string>): DockPrefs {
  const d = defaults();
  return { ...d, entries: sanitize(d.entries, valid) };
}

/** Move `from` to `to` in a copy of the array. Used by drag-reorder. */
export function reorder<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
