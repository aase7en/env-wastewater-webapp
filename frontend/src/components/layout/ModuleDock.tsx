import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MSymbol } from "../ui/MSymbol";
import { cn } from "../../lib/utils";
import {
  ICON_PX,
  defaultPrefs,
  newFolderId,
  pinnedPaths,
  readDock,
  reorder,
  writeDock,
  type DockEntry,
  type DockPrefs,
  type IconSize,
} from "./dock-prefs";
import {
  useHiddenModules,
  type AppRole,
} from "../../lib/role-module-visibility";
import { RoleVisibilitySheet } from "./RoleVisibilitySheet";

export interface DockItem {
  to: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
  section?: string;
}

/* ── Geometry ──────────────────────────────────────────────────────────────
 * Slot centres are computed arithmetically rather than measured. That matters:
 * magnification runs on every pointermove, and getBoundingClientRect() per
 * item per frame would force layout. Everything here is transform-only, so the
 * compositor handles it and layout never runs.
 * Slot WIDTH is a preference (ICON_PX), so it is derived inside the component;
 * only the size-independent constants live out here. */
const GAP = 6;
const PAD = 10;
/** Magnification directly under the pointer. 1.6 → 1.95 (+20%): on a phone a
 *  fingertip covers roughly a 45px circle, so at the old size the icon being
 *  chosen was hidden by the finger choosing it. HEADROOM and TIP_OFFSET both
 *  derive from this, so the row makes room automatically. */
const MAX_SCALE = 1.95;
const RANGE = 2.2;     // falloff radius, in slots
/* ── Gesture model ─────────────────────────────────────────────────────────
 * Touch/point the dock and icons magnify under the pointer immediately, as
 * they always did. Holding still for HOLD_MS opens edit mode.
 *
 * DOCK-11: gating magnification behind a 500ms hold (DOCK-10) was a mistake —
 * it made ordinary selection feel broken. Panning and magnify-on-drag cannot
 * share one gesture, because a pan slides the content out from under the
 * finger while magnification needs the finger to stay over its icon. So they
 * are FUSED instead: the drag magnifies, and the strip scrubs in whichever
 * direction the pointer has moved away from centre. Drag toward an end and
 * the far modules come to you, already magnified, ready to release on.
 * A dead zone in the middle keeps precise picking possible. */
const HOLD_MS = 1900;
/** px of travel before a press counts as a drag.
 *  A finger held still for HOLD_MS drifts a long way more than a mouse does,
 *  and every px over this cancelled the hold — which is why holding an icon on
 *  a phone never reached edit mode. Generous for touch, tight for a pointer. */
const PRESS_SLOP_MOUSE = 8;
const PRESS_SLOP_TOUCH = 24;
/** Fraction of the half-width around centre where the strip does NOT scrub. */
const SCRUB_DEAD = 0.35;
const SCRUB_SPEED = 16; // px per frame at the very end of the bar

/** Smoothstep — makes neighbours fall off gently. Linear reads mechanical. */
function falloff(distanceInSlots: number): number {
  const t = Math.max(0, 1 - distanceInSlots / RANGE);
  return t * t * (3 - 2 * t);
}

export function ModuleDock({
  nav,
  isAdmin,
  role,
}: {
  nav: DockItem[];
  isAdmin: boolean;
  role: AppRole | null;
}) {
  const loc = useLocation();
  const navigate = useNavigate();
  const barRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  // DOCK role-visibility: admin-configurable hidden-module set for the
  // caller's own role. Presentation only — NOT a security boundary (route
  // guards + RLS remain authoritative; see docs/work-orders/DOCK-role-
  // module-visibility.md "Do not"). '/' and '/dashboard' are never hidden
  // (stranding a user off the landing page). Loading state is folded into
  // the filter: until the set resolves, show everything (default visible).
  const { hidden: hiddenModules } = useHiddenModules(role);
  const [visSheetOpen, setVisSheetOpen] = useState(false);

  const allowed = useMemo(
    () =>
      nav.filter(
        (n) =>
          (!n.adminOnly || isAdmin) &&
          // Never hide the landing page — stranding a user is worse than
          // over-showing. (WO "Do not".)
          (n.to === "/" || n.to === "/dashboard" || !hiddenModules.has(n.to)),
      ),
    [nav, isAdmin, hiddenModules],
  );
  const byPath = useMemo(() => new Map(allowed.map((n) => [n.to, n])), [allowed]);
  const validPaths = useMemo(() => new Set(allowed.map((n) => n.to)), [allowed]);

  const [prefs, setPrefs] = useState<DockPrefs>(() => readDock(validPaths));
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [scrollX, setScrollX] = useState(0);
  const [editing, setEditing] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  /** null = closed · "dock" = pin to top level · otherwise a folder id. */
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  /** Pointer is down — enables scrubbing and release-to-select. */
  const [pressed, setPressed] = useState(false);
  /** Slot with a hold counting down — drives the arming ring. */
  const [holdIndex, setHoldIndex] = useState<number | null>(null);
  /** The press has moved past the slop radius. */
  const travelled = useRef(false);
  const pointerType = useRef<string>("mouse");
  /**
   * The window-level completion has already decided what this gesture meant,
   * so the <a>'s own click must not also fire. Without this, a drag-release
   * navigated twice — once to the slot released on, once to the slot the press
   * started on — and a long press that ended in edit mode still followed its
   * link.
   */
  const suppressClick = useRef(false);

  // Re-filter once admin status resolves, or an admin's pinned admin entries
  // would be dropped on first paint.
  useEffect(() => setPrefs(readDock(validPaths)), [validPaths]);

  const commit = useCallback((next: DockPrefs) => {
    setPrefs(next);
    writeDock(next);
  }, []);
  const setEntries = useCallback(
    (entries: DockEntry[]) => commit({ ...prefs, entries }),
    [commit, prefs],
  );

  const entries = prefs.entries;
  const ITEM = ICON_PX[prefs.iconSize];
  /** Space above the row for a grown icon + its name tag; see DOCK-5. */
  const TIP_OFFSET = ITEM * (MAX_SCALE - 1) + 10;
  const HEADROOM = Math.round(TIP_OFFSET + 38);

  const pinned = useMemo(() => pinnedPaths(entries), [entries]);
  const unpinned = useMemo(
    () => allowed.filter((n) => !pinned.has(n.to)),
    [allowed, pinned],
  );

  const isActive = (to: string) =>
    loc.pathname === to || (to !== "/" && loc.pathname.startsWith(to + "/"));
  /** A folder is "active" when the page you are on lives inside it. */
  const entryActive = (e: DockEntry) =>
    e.kind === "module" ? isActive(e.to) : e.items.some(isActive);

  /* ── Magnification + displacement ──────────────────────────────────────── */
  const slots = entries.length + 1; // + the trailing "ทุกโมดูล" button
  const barLeft = barRef.current?.getBoundingClientRect().left ?? null;
  const centreOf = (i: number) =>
    (barLeft ?? 0) + PAD + i * (ITEM + GAP) + ITEM / 2 - scrollX;

  const scales: number[] = [];
  for (let i = 0; i < slots; i++) {
    if (mouseX === null || barLeft === null) {
      scales.push(1);
      continue;
    }
    scales.push(
      1 + (MAX_SCALE - 1) * falloff(Math.abs(mouseX - centreOf(i)) / (ITEM + GAP)),
    );
  }

  /** Slot under the pointer — drives the name tag and the highlight. Derived,
   *  not CSS :hover, because a finger never fires :hover. */
  const hoverIndex =
    mouseX === null || barLeft === null
      ? null
      : (() => {
          const raw = Math.round(
            (mouseX - barLeft - PAD - ITEM / 2 + scrollX) / (ITEM + GAP),
          );
          const i = Math.max(0, Math.min(slots - 1, raw));
          return Math.abs(mouseX - centreOf(i)) <= ITEM ? i : null;
        })();

  const totalGrowth = scales.reduce((sum, s) => sum + ITEM * (s - 1), 0);
  const offsets: number[] = [];
  let accumulated = 0;
  for (const s of scales) {
    offsets.push(accumulated + (ITEM * (s - 1)) / 2 - totalGrowth / 2);
    accumulated += ITEM * (s - 1);
  }

  const baseWidth = 2 * PAD + slots * ITEM + (slots - 1) * GAP;

  /** Slots between the hole and the target step aside, iOS-style. */
  const gapShift = (i: number): number => {
    if (dragFrom === null || dropIndex === null || i === dragFrom) return 0;
    const step = ITEM + GAP;
    if (dragFrom < dropIndex && i > dragFrom && i <= dropIndex) return -step;
    if (dropIndex < dragFrom && i >= dropIndex && i < dragFrom) return step;
    return 0;
  };

  const slotStyle = (i: number): CSSProperties => {
    if (editing && dragFrom === i && mouseX !== null && barLeft !== null) {
      return {
        transform: `translateX(${(mouseX - centreOf(i)).toFixed(2)}px) translateY(-24px) scale(1.42)`,
        zIndex: 20,
      };
    }
    return {
      transform: `translateX(${(offsets[i] + gapShift(i)).toFixed(2)}px) scale(${scales[i].toFixed(3)})`,
    };
  };
  const isSettling = (i: number) =>
    mouseX === null || (editing && dragFrom !== null && i !== dragFrom);

  /* ── Press gestures ────────────────────────────────────────────────────── */
  const magnifyTimer = useRef<number | null>(null);
  const editTimer = useRef<number | null>(null);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);

  const clearTimers = () => {
    if (magnifyTimer.current !== null) window.clearTimeout(magnifyTimer.current);
    if (editTimer.current !== null) window.clearTimeout(editTimer.current);
    magnifyTimer.current = null;
    editTimer.current = null;
  };
  const endPress = () => {
    clearTimers();
    pressOrigin.current = null;
    setPressed(false);
    travelled.current = false;
    setHoldIndex(null);
  };
  const startPress = (x: number, y: number, index: number) => {
    clearTimers();
    pressOrigin.current = { x, y };
    setPressed(true);
    travelled.current = false;
    setHoldIndex(index >= 0 ? index : null);
    // index < 0 means the press landed on padding rather than a slot. It can
    // still browse and scrub, but there is nothing to pick up, so no edit.
    if (index >= 0) {
      editTimer.current = window.setTimeout(() => {
        setHoldIndex(null);
        setEditing(true);
        setDragFrom(index);
        setDropIndex(index);
      }, HOLD_MS);
    }
  };

  /** Movement ends the still-hold, so a drag can never fall into edit mode. */
  const pressMoved = (x: number, y: number) => {
    const o = pressOrigin.current;
    if (!o || editing) return;
    const slop =
      pointerType.current === "mouse" ? PRESS_SLOP_MOUSE : PRESS_SLOP_TOUCH;
    if (Math.hypot(x - o.x, y - o.y) <= slop) return;
    travelled.current = true;
    setHoldIndex(null);
    if (editTimer.current !== null) {
      window.clearTimeout(editTimer.current);
      editTimer.current = null;
    }
  };


  /* ── Edge auto-scroll ──────────────────────────────────────────────────── */
  const edgeRaf = useRef<number | null>(null);
  const edgeVel = useRef(0);
  const stopEdgeScroll = () => {
    if (edgeRaf.current !== null) cancelAnimationFrame(edgeRaf.current);
    edgeRaf.current = null;
    edgeVel.current = 0;
  };
  const runEdgeScroll = useCallback(() => {
    const bar = barRef.current;
    if (!bar || edgeVel.current === 0) {
      edgeRaf.current = null;
      return;
    }
    bar.scrollLeft += edgeVel.current;
    setScrollX(bar.scrollLeft);
    edgeRaf.current = requestAnimationFrame(runEdgeScroll);
  }, []);
  /**
   * Scrub speed from how far the pointer sits either side of the bar's centre.
   * Zero inside the dead zone so a pick near the middle stays steady; ramps to
   * SCRUB_SPEED at the ends, which is what makes a distant module reachable
   * without letting go.
   */
  const updateEdgeScroll = (clientX: number) => {
    const bar = barRef.current;
    if (!bar) return;
    const r = bar.getBoundingClientRect();
    const half = r.width / 2;
    if (half <= 0) return;
    // −1 at the left end, 0 at centre, +1 at the right end.
    const t = (clientX - (r.left + half)) / half;
    const mag = Math.min(1, Math.abs(t));
    const v =
      mag <= SCRUB_DEAD
        ? 0
        : Math.sign(t) * SCRUB_SPEED * ((mag - SCRUB_DEAD) / (1 - SCRUB_DEAD));
    edgeVel.current = v;
    if (v !== 0 && edgeRaf.current === null)
      edgeRaf.current = requestAnimationFrame(runEdgeScroll);
  };
  useEffect(() => stopEdgeScroll, []);
  useEffect(() => clearTimers, []);

  /* ── Gesture completion, at window level ────────────────────────────────
   * Both the move and the release are handled on `window`, not on the bar.
   * DOCK-12: they used to be on the bar, which meant a drag that wandered
   * outside it — routine, since scrubbing pulls the finger toward the ends —
   * released onto some other element and the selection was simply lost. The
   * pointerleave handler made it worse by tearing the gesture down mid-drag.
   *
   * setPointerCapture would also fix this, but it re-targets the synthesised
   * click to the capturing element and stops taps opening modules at all
   * (DOCK-4). Window listeners have no such side effect.
   *
   * A latest-ref carries the live closure so the listeners never need to
   * re-subscribe as state changes. */
  const gesture = useRef({
    move: (_x: number, _y: number) => {},
    complete: () => {},
  });
  gesture.current = {
    move: (x: number, y: number) => {
      pressMoved(x, y);
      setMouseX(x);
      // Only scrub once this is definitely a DRAG. Scrubbing on a stationary
      // hold slid the pressed icon out from under the finger for the whole
      // 1.9s count, which read as the dock running away rather than as edit
      // mode arming — so the hold got abandoned before it ever completed.
      if (travelled.current || editing) updateEdgeScroll(x);
      if (dragFrom !== null) setDropIndex(slotAt(x));
    },
    complete: () => {
      // Anything other than a clean stationary tap has been handled here.
      if (editing || travelled.current) suppressClick.current = true;
      if (
        editing &&
        dragFrom !== null &&
        dropIndex !== null &&
        dropIndex !== dragFrom
      ) {
        setEntries(reorder(entries, dragFrom, dropIndex));
      } else if (!editing && travelled.current && hoverIndex !== null) {
        // Release-to-select. Only after real travel — a stationary tap is left
        // to the slot's own click, so this never double-fires.
        if (hoverIndex >= entries.length) setPickerFor("dock");
        else activate(entries[hoverIndex]);
      }
      // A lifted finger points at nothing; leaving mouseX set would freeze the
      // icons mid-magnification. A mouse is still hovering, so it keeps its
      // position.
      if (pointerType.current !== "mouse") setMouseX(null);
      setDragFrom(null);
      setDropIndex(null);
      endPress();
      stopEdgeScroll();
    },
  };

  useEffect(() => {
    if (!pressed) return;
    const onMove = (e: PointerEvent) => gesture.current.move(e.clientX, e.clientY);
    const onUp = () => gesture.current.complete();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [pressed]);

  // visSheetOpen belongs here too: it drives the scrim, the escape key and
  // the tap-outside handler. Left out, the role sheet rendered over an
  // unblurred page and was hard to read against the dashboard behind it.
  const sheetOpen =
    pickerFor !== null || openFolder !== null || visSheetOpen;

  /* Escape / tap-outside leaves edit mode and closes sheets. */
  useEffect(() => {
    if (!editing && !sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setPickerFor(null);
      setOpenFolder(null);
      setVisSheetOpen(false);
      setEditing(false);
    };
    const onDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setPickerFor(null);
      setOpenFolder(null);
      setVisSheetOpen(false);
      setEditing(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [editing, sheetOpen]);

  /* ── Hide on scroll down, show on scroll up ────────────────────────────── */
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const upAccum = useRef(0);
  useEffect(() => {
    if (editing || sheetOpen) {
      setHidden(false);
      return;
    }
    const onScroll = (e: Event) => {
      const t = e.target as Node | Document | null;
      if (t instanceof Node && rootRef.current?.contains(t)) return;
      // Capture phase: <main> carries overflow-x-hidden, and per spec a
      // non-visible value on one axis promotes the other from `visible` to
      // `auto`, so main can be the scroller rather than window.
      const y =
        t === document || t === document.documentElement || t === document.body
          ? window.scrollY
          : t instanceof HTMLElement
            ? t.scrollTop
            : window.scrollY;
      const dy = y - lastY.current;
      lastY.current = y;
      if (Math.abs(dy) < 4) return;
      if (y < 80) {
        upAccum.current = 0;
        setHidden(false);
      } else if (dy > 0) {
        upAccum.current = 0;
        setHidden(true);
      } else {
        upAccum.current += -dy;
        if (upAccum.current > 24) setHidden(false);
      }
    };
    lastY.current = window.scrollY;
    upAccum.current = 0;
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, [editing, sheetOpen]);

  /* ── Entry actions ─────────────────────────────────────────────────────── */
  const slotAt = (clientX: number): number => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const raw = Math.round(
      (clientX - rect.left - PAD - ITEM / 2 + scrollX) / (ITEM + GAP),
    );
    return Math.max(0, Math.min(entries.length - 1, raw));
  };

  const activate = (e: DockEntry) => {
    if (e.kind === "folder") setOpenFolder(e.id);
    else navigate(e.to);
  };

  /**
   * Put `to` in `target`, taking it out of wherever it currently lives first.
   * A module must exist in exactly ONE place — loose on the dock or inside a
   * single folder — or the same icon appears twice and it stops being obvious
   * which one the folder actually holds.
   */
  const addTo = (target: string, to: string) => {
    const without = entries
      .map((e) =>
        e.kind === "folder" ? { ...e, items: e.items.filter((p) => p !== to) } : e,
      )
      .filter((e) => !(e.kind === "module" && e.to === to))
      // A folder emptied by the move has nothing left to open.
      .filter((e) => e.kind !== "folder" || e.items.length > 0);

    if (target === "dock") {
      setEntries([...without, { kind: "module", to }]);
      return;
    }
    setEntries(
      without.map((e) =>
        e.kind === "folder" && e.id === target
          ? { ...e, items: [...e.items, to] }
          : e,
      ),
    );
  };

  const removeEntry = (index: number) =>
    setEntries(entries.filter((_, i) => i !== index));

  /** Pull a module out of a folder and drop it back on the dock. */
  const liftOut = (folderId: string, to: string) => {
    const next: DockEntry[] = [];
    for (const e of entries) {
      if (e.kind === "folder" && e.id === folderId) {
        const items = e.items.filter((p) => p !== to);
        if (items.length) next.push({ ...e, items });
        // A folder emptied this way disappears — nothing left to open.
      } else next.push(e);
    }
    next.push({ kind: "module", to });
    setEntries(next);
  };

  const renameFolder = (folderId: string, name: string) =>
    setEntries(
      entries.map((e) =>
        e.kind === "folder" && e.id === folderId ? { ...e, name } : e,
      ),
    );

  /* ── Tools ─────────────────────────────────────────────────────────────── */
  const createFolder = () => {
    const id = newFolderId();
    setEntries([...entries, { kind: "folder", id, name: "โฟลเดอร์ใหม่", items: [] }]);
    // Straight into the picker: an empty folder cannot be opened to anything,
    // and sanitize() drops it on next load, so it must be filled now.
    setPickerFor(id);
  };

  const pinCurrent = () => {
    const here = allowed.find((n) => isActive(n.to));
    if (here && !pinned.has(here.to))
      setEntries([...entries, { kind: "module", to: here.to }]);
  };

  /** Restore NAV order for loose modules; folders keep their places at the end. */
  const autoArrange = () => {
    const rank = new Map(allowed.map((n, i) => [n.to, i]));
    const mods = entries.filter((e): e is Extract<DockEntry, { kind: "module" }> => e.kind === "module");
    const folders = entries.filter((e) => e.kind === "folder");
    mods.sort((a, b) => (rank.get(a.to) ?? 0) - (rank.get(b.to) ?? 0));
    setEntries([...mods, ...folders]);
  };

  const cycleSize = () => {
    const next: Record<IconSize, IconSize> = { sm: "md", md: "lg", lg: "sm" };
    commit({ ...prefs, iconSize: next[prefs.iconSize] });
  };

  const resetDock = () => commit(defaultPrefs(validPaths));

  const folder = openFolder
    ? entries.find((e) => e.kind === "folder" && e.id === openFolder)
    : undefined;

  return (
    <>
      {/* Scrim. A SIBLING of the dock, never inside it: .dock-root carries a
          transform, and a transformed ancestor becomes the containing block
          for position:fixed descendants, so a nested scrim would be trapped
          inside the dock instead of covering the page. */}
      {sheetOpen && (
        <div
          aria-hidden="true"
          onClick={() => {
            setPickerFor(null);
            setOpenFolder(null);
            setVisSheetOpen(false);
          }}
          className="fixed inset-0 z-[35] bg-aura-bgDeep/50 backdrop-blur-sm"
        />
      )}

      <nav
        ref={rootRef}
        aria-label="โมดูล"
        className={cn(
          "dock-root fixed bottom-8 left-1/2 z-40 flex flex-col items-center gap-3",
          hidden && "dock-root--hidden",
        )}
      >
        {editing && (
          <DockToolbar
            iconSize={prefs.iconSize}
            canPin={allowed.some((n) => isActive(n.to) && !pinned.has(n.to))}
            isAdmin={isAdmin}
            onCreateFolder={createFolder}
            onPinCurrent={pinCurrent}
            onAutoArrange={autoArrange}
            onCycleSize={cycleSize}
            onReset={resetDock}
            onOpenVisibility={() => setVisSheetOpen(true)}
            onDone={() => {
              setEditing(false);
              setPickerFor(null);
              setOpenFolder(null);
            }}
          />
        )}

        {visSheetOpen && (
          <RoleVisibilitySheet
            nav={nav}
            onClose={() => setVisSheetOpen(false)}
          />
        )}

        {folder && folder.kind === "folder" && (
          <FolderSheet
            folder={folder}
            byPath={byPath}
            editing={editing}
            isActive={isActive}
            onClose={() => setOpenFolder(null)}
            onRename={(name) => renameFolder(folder.id, name)}
            onLiftOut={(to) => liftOut(folder.id, to)}
            onAdd={() => setPickerFor(folder.id)}
          />
        )}

        {pickerFor !== null && (
          <ModulePicker
            // Filling a FOLDER offers everything not already in that folder,
            // including modules currently sitting loose on the dock — moving
            // one in is the whole point, and addTo() takes it out of its old
            // home. Filling the DOCK only offers what is not pinned anywhere.
            items={
              pickerFor === "dock"
                ? unpinned
                : allowed.filter((n) => {
                    const f = entries.find(
                      (e) => e.kind === "folder" && e.id === pickerFor,
                    );
                    return !(f?.kind === "folder" && f.items.includes(n.to));
                  })
            }
            title={pickerFor === "dock" ? "ทุกโมดูล" : "เพิ่มลงโฟลเดอร์"}
            navigable={pickerFor === "dock"}
            onPick={(to) => addTo(pickerFor, to)}
            onClose={() => setPickerFor(null)}
          />
        )}

        <div className="relative flex justify-center">
          <div
            aria-hidden="true"
            className="aura-card aura-card--static !absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full !p-0"
            style={{
              width: baseWidth + totalGrowth,
              maxWidth: "calc(100vw - 6rem)",
              height: ITEM + 2 * PAD,
            }}
          />
          <div
            ref={barRef}
            className="dock-bar relative z-10 flex items-end max-w-[calc(100vw-6rem)] overflow-x-auto"
            style={{
              gap: GAP,
              paddingLeft: PAD,
              paddingRight: PAD,
              paddingBottom: PAD,
              paddingTop: HEADROOM,
              // `none`, never `pan-x`: handing the pan to the browser makes it
              // claim the gesture and fire pointercancel, after which no
              // pointermove reaches us and magnification stops following.
              touchAction: "none",
            }}
            onScroll={(e) => setScrollX(e.currentTarget.scrollLeft)}
            onPointerDown={(e) => {
              // The press begins on the bar even when it lands between slots,
              // so a drag started on padding still scrubs.
              pointerType.current = e.pointerType;
              suppressClick.current = false;
              if (!pressOrigin.current) startPress(e.clientX, e.clientY, -1);
              setMouseX(e.clientX);
            }}
            onPointerMove={(e) => {
              // Hover only. Once the pointer is DOWN the window listener owns
              // the gesture, so it keeps working past the edges of the bar.
              if (pressed) return;
              setMouseX(e.clientX);
            }}
            onPointerLeave={() => {
              // Never tear down mid-gesture: a drag routinely wanders outside
              // the bar, and resetting here is what used to throw away
              // `travelled` and swallow the selection on release.
              if (pressed) return;
              setMouseX(null);
              stopEdgeScroll();
              endPress();
            }}
          >
            {entries.map((entry, i) => (
              <DockSlot
                key={entry.kind === "module" ? entry.to : entry.id}
                entry={entry}
                byPath={byPath}
                size={ITEM}
                tipOffset={TIP_OFFSET}
                index={i}
                active={entryActive(entry)}
                style={slotStyle(i)}
                settling={isSettling(i)}
                // While something is being dragged the highlight belongs to
                // the icon on the finger alone. Keying it off hoverIndex lit
                // the slot underneath as well, so two icons glowed at once.
                showTip={dragFrom !== null ? dragFrom === i : hoverIndex === i}
                holding={holdIndex === i && !editing}
                holdMs={HOLD_MS}
                editing={editing}
                dragging={dragFrom === i}
                onPressStart={startPress}
                suppressClick={suppressClick}
                onDragStart={() => {
                  if (editing) {
                    setDragFrom(i);
                    setDropIndex(i);
                  }
                }}
                onActivate={() => activate(entry)}
                onRemove={() => removeEntry(i)}
              />
            ))}

            {/* Always present, so every module stays reachable however few are
                pinned. */}
            <button
              type="button"
              aria-label="ทุกโมดูล"
              title="ทุกโมดูล"
              onClick={() => setPickerFor((v) => (v === "dock" ? null : "dock"))}
              className="dock-slot shrink-0 grid place-items-center rounded-2xl text-aura-textMuted hover:text-aura-cyan border border-dashed border-aura-borderSubtle"
              style={{ width: ITEM, height: ITEM, ...slotStyle(entries.length) }}
            >
              <MSymbol name="add" />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

/* ── Edit-mode toolbar ─────────────────────────────────────────────────────*/

function DockToolbar({
  iconSize,
  canPin,
  isAdmin,
  onCreateFolder,
  onPinCurrent,
  onAutoArrange,
  onCycleSize,
  onReset,
  onOpenVisibility,
  onDone,
}: {
  iconSize: IconSize;
  canPin: boolean;
  isAdmin: boolean;
  onCreateFolder: () => void;
  onPinCurrent: () => void;
  onAutoArrange: () => void;
  onCycleSize: () => void;
  onReset: () => void;
  onOpenVisibility: () => void;
  onDone: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const sizeLabel: Record<IconSize, string> = {
    sm: "เล็ก",
    md: "กลาง",
    lg: "ใหญ่",
  };
  return (
    <div className="aura-card aura-card--static !p-2 rounded-2xl flex items-center gap-1 flex-wrap justify-center max-w-[calc(100vw-3rem)]">
      <Tool icon="create_new_folder" label="สร้างโฟลเดอร์" onClick={onCreateFolder} />
      <Tool
        icon="push_pin"
        label="ปักหน้านี้"
        onClick={onPinCurrent}
        disabled={!canPin}
      />
      <Tool icon="sort" label="เรียงอัตโนมัติ" onClick={onAutoArrange} />
      <Tool
        icon="format_size"
        label={`ขนาดไอคอน: ${sizeLabel[iconSize]}`}
        onClick={onCycleSize}
      />
      {confirmReset ? (
        <button
          type="button"
          onClick={() => {
            onReset();
            setConfirmReset(false);
          }}
          onBlur={() => setConfirmReset(false)}
          className="px-2.5 h-9 rounded-xl text-xs font-thai bg-alert-red/15 text-alert-red border border-alert-red/50"
        >
          ยืนยันรีเซ็ต?
        </button>
      ) : (
        // Two-step: reset throws away an arrangement the user built by hand,
        // and there is no undo.
        <Tool icon="restart_alt" label="รีเซ็ต Dock" onClick={() => setConfirmReset(true)} />
      )}
      {isAdmin && (
        <Tool
          icon="admin_panel_settings"
          label="สิทธิ์การมองเห็น"
          onClick={onOpenVisibility}
        />
      )}
      <span className="w-px h-6 bg-aura-borderSubtle mx-1" />
      <button
        type="button"
        onClick={onDone}
        className="px-3 h-9 rounded-xl text-xs font-semibold font-thai bg-aura-cyan text-aura-onAccent"
      >
        เสร็จ
      </button>
    </div>
  );
}

function Tool({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  // .dock-item / .dock-tip are the same pair the dock slots use, so a tool
  // names itself exactly the way an icon does instead of falling back to the
  // browser's own tooltip, which looks nothing like the rest of the dock and
  // never appears on touch.
  return (
    <span className="dock-item relative inline-flex">
      <span
        aria-hidden="true"
        className="dock-tip pointer-events-none absolute left-1/2 bottom-full mb-2 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-thai bg-aura-surfaceHighest text-aura-textMain border border-aura-borderSubtle shadow-aura-card"
      >
        {label}
      </span>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "h-9 px-2 rounded-xl grid place-items-center transition-colors",
          disabled
            ? "text-aura-textMuted/40 cursor-not-allowed"
            : "text-aura-textMuted hover:text-aura-cyan hover:bg-aura-cyan/10",
        )}
      >
        <MSymbol name={icon} className="text-[20px]" />
      </button>
    </span>
  );
}

/* ── Slot ──────────────────────────────────────────────────────────────────*/

function DockSlot({
  entry,
  byPath,
  size,
  tipOffset,
  index,
  active,
  style,
  settling,
  showTip,
  holding,
  holdMs,
  editing,
  dragging,
  onPressStart,
  suppressClick,
  onDragStart,
  onActivate,
  onRemove,
}: {
  entry: DockEntry;
  byPath: Map<string, DockItem>;
  size: number;
  tipOffset: number;
  index: number;
  active: boolean;
  style: CSSProperties;
  settling: boolean;
  showTip: boolean;
  /** A hold is counting down on this slot. */
  holding: boolean;
  holdMs: number;
  editing: boolean;
  dragging: boolean;
  onPressStart: (x: number, y: number, index: number) => void;
  /** Shared with the parent: set once the gesture was handled at window level. */
  suppressClick: React.MutableRefObject<boolean>;
  onDragStart: () => void;
  onActivate: () => void;
  onRemove: () => void;
}) {
  const item = entry.kind === "module" ? byPath.get(entry.to) : undefined;
  const label = entry.kind === "folder" ? entry.name : (item?.label ?? entry.to);

  // The countdown lives on .dock-holding::after, and an inline
  // `animationDuration` would never reach a pseudo-element — custom properties
  // do inherit into one, so HOLD_MS is handed over as a variable.
  // The transform belongs to the wrapper; only the countdown duration needs to
  // reach the slot itself (its ::after reads the variable).
  const holdStyle: CSSProperties = style;
  const holdVars: CSSProperties = holding
    ? ({ ["--dock-hold-ms" as string]: `${holdMs}ms` } as CSSProperties)
    : {};

  const body =
    entry.kind === "folder" ? (
      <FolderGlyph entry={entry} byPath={byPath} />
    ) : (
      <MSymbol name={item?.icon ?? "description"} fill={active} />
    );

  const slotClass = cn(
    "dock-slot grid place-items-center w-full h-full rounded-2xl border",
    // The strong highlight belongs to whatever the pointer is on — with
    // release-to-select that slot is the pending choice. The current route
    // keeps a quieter tint plus its pip.
    showTip
      ? "text-aura-cyan border-aura-cyan/60 bg-aura-cyan/15 shadow-aura-glow-cyan"
      : active
        ? "text-aura-cyan border-aura-cyan/25 bg-aura-cyan/5"
        : "text-aura-textMuted border-transparent",
    // The countdown ring is cyan; so were the highlight's border, fill and
    // glow, which swallowed it whole. While counting, the slot goes quiet and
    // the ring is the only lit thing on it.
    holding && "dock-holding !border-transparent !bg-aura-surfaceHighest/70 !shadow-none",
    editing && "dock-jiggle cursor-grab",
    dragging && "opacity-60 cursor-grabbing",
  );

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      onPressStart(e.clientX, e.clientY, index);
      if (editing) {
        e.preventDefault();
        onDragStart();
      }
    },
  };

  return (
    <div
      className="dock-item relative shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden="true"
        style={{ bottom: "100%", marginBottom: tipOffset }}
        className={cn(
          "dock-tip pointer-events-none absolute left-1/2",
          "whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-thai",
          "bg-aura-surfaceHighest text-aura-textMain border border-aura-borderSubtle shadow-aura-card",
          showTip && "dock-tip--show",
        )}
      >
        {label}
      </span>

      {/* A folder has no URL, so it is a button; a module keeps a real <a> so
          middle-click, copy-link and keyboard all behave. */}
      {/* DOCK-18: the transform moved from the slot onto this wrapper, so the
          remove × and the running pip travel and scale WITH the icon. They
          used to sit on the untransformed outer box and stayed put while the
          icon magnified away from them. The name tag stays outside it — it
          should follow horizontally but must not scale, or the text balloons.
          transform-origin matches .dock-slot so growth is still upward. */}
      <span
        className={cn(
          "dock-xform absolute inset-0 grid place-items-center",
          settling && "dock-xform--settling",
        )}
        style={holdStyle}
      >
      {entry.kind === "folder" ? (
        <button
          type="button"
          aria-label={label}
          onClick={() => !editing && onActivate()}
          className={slotClass}
          style={holdVars}
          {...handlers}
        >
          {body}
        </button>
      ) : (
        <Link
          to={entry.to}
          aria-label={label}
          aria-current={active ? "page" : undefined}
          onClick={(e) => {
            // The window-level completion already decided this gesture's
            // outcome; letting the anchor navigate as well would either
            // double-fire or send the user to the icon the press STARTED on
            // rather than the one it ended on.
            if (editing || suppressClick.current) {
              e.preventDefault();
              suppressClick.current = false;
            }
          }}
          className={slotClass}
          style={holdVars}
          {...handlers}
        >
          {body}
        </Link>
      )}

      {active && !editing && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-1 h-1 rounded-full bg-aura-cyan"
        />
      )}

      {editing && (
        <button
          type="button"
          aria-label={`เอา ${label} ออกจาก Dock`}
          onClick={onRemove}
          // Matches the × in the sheets: quiet by default, red only on
          // hover. The solid red badge read as an error state and crowded a
          // 48px icon.
          className="absolute -top-1 -right-1 z-10 grid place-items-center w-4 h-4 rounded-full bg-aura-surface/90 border border-aura-borderSubtle text-aura-textMuted hover:text-alert-red transition-colors"
        >
          <MSymbol name="close" className="text-[11px]" />
        </button>
      )}
      </span>
    </div>
  );
}

/** Folder icon: a 2×2 peek at what is inside, like an iOS folder. */
function FolderGlyph({
  entry,
  byPath,
}: {
  entry: Extract<DockEntry, { kind: "folder" }>;
  byPath: Map<string, DockItem>;
}) {
  return (
    <span className="grid grid-cols-2 gap-px place-items-center w-[62%] h-[62%]">
      {entry.items.slice(0, 4).map((p) => (
        <MSymbol
          key={p}
          name={byPath.get(p)?.icon ?? "description"}
          className="text-[11px] leading-none"
        />
      ))}
    </span>
  );
}

/* ── Sheets ────────────────────────────────────────────────────────────────*/

const SHEET_BODY_H = "min(46vh, 340px)";

/** Long enough for a real Thai group name, short enough to stay on one line
 *  in the folder sheet header and under a 48px icon. */
const FOLDER_NAME_MAX = 24;

/** Starting points, grouped the way this app's nav already is, so a folder
 *  gets a name that matches the language of the rest of the system instead of
 *  "โฟลเดอร์ใหม่". Free text still wins — these are only shortcuts. */
const FOLDER_NAME_SUGGESTIONS = [
  "โมดูล ENV",
  "งานประจำวัน",
  "ตรวจวัด & แนวโน้ม",
  "คาร์บอน",
  "รายงาน & เอกสาร",
  "ความปลอดภัย",
  "คลังข้อมูล",
  "ผู้ดูแลระบบ",
];

function FolderSheet({
  folder,
  byPath,
  editing,
  isActive,
  onClose,
  onRename,
  onLiftOut,
  onAdd,
}: {
  folder: Extract<DockEntry, { kind: "folder" }>;
  byPath: Map<string, DockItem>;
  editing: boolean;
  isActive: (to: string) => boolean;
  onClose: () => void;
  onRename: (name: string) => void;
  onLiftOut: (to: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="aura-card p-5 rounded-3xl w-[min(84vw,560px)] flex flex-col">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        {editing ? (
          <input
            value={folder.name}
            onChange={(e) => onRename(e.target.value.slice(0, FOLDER_NAME_MAX))}
            maxLength={FOLDER_NAME_MAX}
            aria-label="ชื่อโฟลเดอร์"
            placeholder="ตั้งชื่อโฟลเดอร์"
            className="glass-input flex-1 min-w-0 px-3 font-thai text-sm"
          />
        ) : (
          <h2 className="flex-1 min-w-0 text-base font-semibold font-thai text-aura-textMain truncate">
            {folder.name}
          </h2>
        )}
        {editing && (
          <button
            type="button"
            onClick={onAdd}
            aria-label="เพิ่มโมดูลลงโฟลเดอร์"
            title="เพิ่มโมดูล"
            className="shrink-0 grid place-items-center w-9 h-9 rounded-xl text-aura-textMuted hover:text-aura-cyan hover:bg-aura-cyan/10"
          >
            <MSymbol name="add" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="shrink-0 text-aura-textMuted hover:text-aura-textMain"
        >
          <MSymbol name="close" className="text-[18px]" />
        </button>
      </div>

      {editing && (
        <div className="shrink-0 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-aura-textMuted font-thai">
              ชื่อที่แนะนำ
            </span>
            <span className="text-[10px] text-aura-textMuted tabular-nums">
              {folder.name.length}/{FOLDER_NAME_MAX}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FOLDER_NAME_SUGGESTIONS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onRename(name)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-thai border transition-colors",
                  folder.name === name
                    ? "border-aura-cyan/60 text-aura-cyan bg-aura-cyan/10"
                    : "border-aura-borderSubtle text-aura-textMuted hover:text-aura-cyan hover:border-aura-cyan/40",
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="overflow-y-auto -mx-1 px-1 pb-1 grid grid-cols-3 sm:grid-cols-4 gap-2 content-start"
        style={{ height: editing ? "min(32vh, 240px)" : SHEET_BODY_H }}
      >
        {folder.items.map((p) => {
          const n = byPath.get(p);
          if (!n) return null;
          return (
            <div key={p} className="relative min-w-0">
              <Link
                to={p}
                onClick={onClose}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 p-2 pt-3 min-h-[82px] rounded-xl border transition-colors overflow-hidden",
                  isActive(p)
                    ? "border-aura-cyan/50 text-aura-cyan"
                    : "border-aura-borderSubtle text-aura-textMuted hover:text-aura-cyan hover:border-aura-cyan/40",
                )}
              >
                <MSymbol name={n.icon} className="text-[22px]" />
                <span className="w-full text-[11px] font-thai text-center leading-tight [overflow-wrap:anywhere]">
                  {n.label}
                </span>
              </Link>
              {editing && (
                <button
                  type="button"
                  aria-label={`ย้าย ${n.label} ออกจากโฟลเดอร์`}
                  title="ย้ายออกไปไว้บน Dock"
                  onClick={() => onLiftOut(p)}
                  className="absolute top-0.5 right-0.5 grid place-items-center w-5 h-5 rounded-full bg-aura-surface/80 text-aura-textMuted hover:text-alert-red"
                >
                  <MSymbol name="close" className="text-[13px]" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Sheet of everything not currently on the dock.
 *
 * Tiles are LINKS when picking for the dock: a dock that only shows pinned
 * icons would otherwise make every unpinned module unreachable — you would
 * have to pin something to visit it once. The corner button pins instead of
 * navigating. When filling a FOLDER, navigating away mid-task is not what the
 * user means, so the whole tile pins.
 */
function ModulePicker({
  items,
  title,
  navigable,
  onPick,
  onClose,
}: {
  items: DockItem[];
  title: string;
  navigable: boolean;
  onPick: (to: string) => void;
  onClose: () => void;
}) {
  const tile =
    "flex flex-col items-center justify-center gap-1.5 p-2 pt-3 min-h-[82px] rounded-xl border border-aura-borderSubtle text-aura-textMuted hover:text-aura-cyan hover:border-aura-cyan/40 transition-colors overflow-hidden";

  return (
    // p-5 is NOT optional: .aura-card is only the glass surface and ring — the
    // padding every other card has comes from the <AuraCard> COMPONENT. Using
    // the raw class without it left the heading flush against the edge, where
    // the 24px corner radius cut across it.
    <div className="aura-card p-5 rounded-3xl w-[min(84vw,560px)] flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-base font-semibold font-thai text-aura-textMain">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="text-aura-textMuted hover:text-aura-textMain"
        >
          <MSymbol name="close" className="text-[18px]" />
        </button>
      </div>

      {/* FIXED height, not max-height: the sheet must not shrink as modules are
          pinned out of it, or it resizes under the user mid-pick. */}
      {items.length === 0 ? (
        <p
          className="text-xs text-aura-textMuted font-thai grid place-items-center"
          style={{ height: SHEET_BODY_H }}
        >
          ปักครบทุกโมดูลแล้ว
        </p>
      ) : (
        <div
          className="overflow-y-auto -mx-1 px-1 pb-1 grid grid-cols-3 sm:grid-cols-4 gap-2 content-start"
          style={{ height: SHEET_BODY_H }}
        >
          {items.map((n) =>
            navigable ? (
              <div key={n.to} className="relative min-w-0">
                <Link to={n.to} onClick={onClose} className={tile}>
                  <MSymbol name={n.icon} className="text-[22px]" />
                  {/* Thai has no inter-word spaces, so a long label is one
                      unbreakable token that would punch out of the tile. */}
                  <span className="w-full text-[11px] font-thai text-center leading-tight [overflow-wrap:anywhere]">
                    {n.label}
                  </span>
                </Link>
                <button
                  type="button"
                  aria-label={`ปัก ${n.label} ลง Dock`}
                  title="ปักลง Dock"
                  onClick={() => onPick(n.to)}
                  className="absolute top-0.5 right-0.5 grid place-items-center w-5 h-5 rounded-full bg-aura-surface/80 text-aura-textMuted hover:text-aura-cyan hover:bg-aura-cyan/10"
                >
                  <MSymbol name="add" className="text-[14px]" />
                </button>
              </div>
            ) : (
              <button
                key={n.to}
                type="button"
                onClick={() => onPick(n.to)}
                className={cn(tile, "min-w-0")}
              >
                <MSymbol name={n.icon} className="text-[22px]" />
                <span className="w-full text-[11px] font-thai text-center leading-tight [overflow-wrap:anywhere]">
                  {n.label}
                </span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
