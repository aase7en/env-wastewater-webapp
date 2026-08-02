import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MSymbol } from "../ui/MSymbol";
import { cn } from "../../lib/utils";
import { readDock, writeDock, reorder } from "./dock-prefs";

export interface DockItem {
  to: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
  section?: string;
}

/* ── Geometry ──────────────────────────────────────────────────────────────
 * Laid out with a fixed slot width so item centres can be computed
 * arithmetically instead of measured. That matters: magnification runs on
 * every pointermove, and getBoundingClientRect() per item per frame would
 * force layout. Everything below is transform-only, so the compositor
 * handles it and layout never runs. */
const ITEM = 48;       // slot width/height in px
const GAP = 6;         // gap between slots
const PAD = 10;        // dock inner padding
const MAX_SCALE = 1.6; // magnification at the cursor
const RANGE = 2.2;     // falloff radius, in slots

/** Smoothstep — the ease that makes neighbours fall off gently instead of
 *  stepping. Straight linear falloff reads as mechanical. */
function falloff(distanceInSlots: number): number {
  const t = Math.max(0, 1 - distanceInSlots / RANGE);
  return t * t * (3 - 2 * t);
}

export function ModuleDock({ nav, isAdmin }: { nav: DockItem[]; isAdmin: boolean }) {
  const loc = useLocation();
  const barRef = useRef<HTMLDivElement>(null);

  /** Everything this user is allowed to reach. */
  const allowed = useMemo(
    () => nav.filter((n) => !n.adminOnly || isAdmin),
    [nav, isAdmin],
  );
  const byPath = useMemo(
    () => new Map(allowed.map((n) => [n.to, n])),
    [allowed],
  );
  const validPaths = useMemo(
    () => new Set(allowed.map((n) => n.to)),
    [allowed],
  );

  const [order, setOrder] = useState<string[]>(() => readDock(validPaths));
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Re-filter if the user's admin status resolves after first paint —
  // otherwise an admin's pinned admin items would be dropped on load.
  useEffect(() => setOrder(readDock(validPaths)), [validPaths]);

  const commit = useCallback((next: string[]) => {
    setOrder(next);
    writeDock(next);
  }, []);

  const items = useMemo(
    () => order.map((p) => byPath.get(p)).filter((n): n is DockItem => !!n),
    [order, byPath],
  );

  const isActive = (to: string) =>
    loc.pathname === to || (to !== "/" && loc.pathname.startsWith(to + "/"));

  /** Pointer x → per-item scale. Null cursor (or reduced motion) = flat. */
  const scaleFor = (i: number): number => {
    if (mouseX === null || editing) return 1;
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return 1;
    const centre = rect.left + PAD + i * (ITEM + GAP) + ITEM / 2;
    return 1 + (MAX_SCALE - 1) * falloff(Math.abs(mouseX - centre) / (ITEM + GAP));
  };

  // ── Long-press → edit mode ───────────────────────────────────────────────
  const pressTimer = useRef<number | null>(null);
  const clearPress = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };
  const startPress = () => {
    clearPress();
    pressTimer.current = window.setTimeout(() => setEditing(true), 500);
  };

  // Escape leaves edit mode; so does clicking anywhere outside the dock.
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setEditing(false); setPickerOpen(false); }
    };
    const onDown = (e: PointerEvent) => {
      if (!barRef.current?.parentElement?.contains(e.target as Node)) {
        setEditing(false);
        setPickerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [editing]);

  useEffect(() => clearPress, []);

  /** Drag within edit mode: cursor x → slot index. */
  const slotAt = (clientX: number): number => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const raw = Math.round((clientX - rect.left - PAD - ITEM / 2) / (ITEM + GAP));
    return Math.max(0, Math.min(items.length - 1, raw));
  };

  const unpinned = allowed.filter((n) => !order.includes(n.to));

  return (
    // <nav> wraps the picker as well as the bar — every module link, pinned or
    // not, has to live inside the navigation landmark.
    <nav
      aria-label="โมดูล"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2"
    >
      {editing && (
        <div className="flex items-center gap-2 text-[11px] font-thai text-aura-textMuted bg-aura-surfaceHigh/80 backdrop-blur-md border border-aura-borderSubtle rounded-full px-3 py-1">
          ลากเพื่อจัดลำดับ · แตะ × เพื่อเอาออก
          <button
            type="button"
            onClick={() => { setEditing(false); setPickerOpen(false); }}
            className="text-aura-cyan font-semibold"
          >
            เสร็จ
          </button>
        </div>
      )}

      {pickerOpen && (
        <ModulePicker
          items={unpinned}
          onPick={(to) => commit([...order, to])}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <div className="aura-card rounded-full !p-0">
        <div
          ref={barRef}
          // 8 default pins at 48px overflow a 375px phone, so the bar scrolls
          // horizontally rather than pushing off-screen. Doing this clips the
          // magnified icon and the name tag at the edges — acceptable because
          // both are hover-only effects and a touch device has no hover. The
          // scrollbar itself is hidden; the dock is short enough to swipe.
          className="dock-bar flex items-end max-w-[calc(100vw-2rem)] overflow-x-auto"
          style={{ gap: GAP, padding: PAD }}
          onPointerMove={(e) => {
            setMouseX(e.clientX);
            if (dragFrom !== null) {
              const to = slotAt(e.clientX);
              if (to !== dragFrom) {
                commit(reorder(order, dragFrom, to));
                setDragFrom(to);
              }
            }
          }}
          onPointerLeave={() => { setMouseX(null); clearPress(); }}
          onPointerUp={() => { setDragFrom(null); clearPress(); }}
        >
          {items.map((item, i) => {
            const active = isActive(item.to);
            const scale = scaleFor(i);
            return (
              <DockSlot
                key={item.to}
                item={item}
                active={active}
                scale={scale}
                editing={editing}
                dragging={dragFrom === i}
                onPressStart={startPress}
                onPressEnd={clearPress}
                onDragStart={() => editing && setDragFrom(i)}
                onUnpin={() => commit(order.filter((p) => p !== item.to))}
              />
            );
          })}

          {/* Always present, so every module stays reachable even when the
              dock is pinned down to a handful. */}
          <button
            type="button"
            aria-label="ทุกโมดูล"
            title="ทุกโมดูล"
            onClick={() => setPickerOpen((v) => !v)}
            className={cn(
              "dock-slot shrink-0 grid place-items-center rounded-2xl",
              "text-aura-textMuted hover:text-aura-cyan",
              "border border-dashed border-aura-borderSubtle",
            )}
            style={{
              width: ITEM,
              height: ITEM,
              transform: `scale(${scaleFor(items.length)})`,
            }}
          >
            <MSymbol name="add" />
          </button>
        </div>
      </div>
    </nav>
  );
}

function DockSlot({
  item,
  active,
  scale,
  editing,
  dragging,
  onPressStart,
  onPressEnd,
  onDragStart,
  onUnpin,
}: {
  item: DockItem;
  active: boolean;
  scale: number;
  editing: boolean;
  dragging: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
  onDragStart: () => void;
  onUnpin: () => void;
}) {
  return (
    <div className="dock-item relative shrink-0" style={{ width: ITEM, height: ITEM }}>
      {/* Name floats above on hover/focus. aria-hidden because the link
          already carries the same string as its accessible name — announcing
          it twice is noise for a screen reader. */}
      <span
        aria-hidden="true"
        className={cn(
          "dock-tip pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-3",
          "whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-thai",
          "bg-aura-surfaceHighest text-aura-textMain border border-aura-borderSubtle",
          "shadow-aura-card",
        )}
      >
        {item.label}
      </span>

      <Link
        to={item.to}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        // Edit mode is a rearranging mode, not a navigating one.
        onClick={(e) => editing && e.preventDefault()}
        onPointerDown={(e) => {
          onPressStart();
          if (editing) {
            e.preventDefault();
            onDragStart();
          }
        }}
        onPointerUp={onPressEnd}
        onPointerCancel={onPressEnd}
        className={cn(
          "dock-slot grid place-items-center w-full h-full rounded-2xl",
          "border transition-colors",
          active
            ? "text-aura-cyan border-aura-cyan/50 bg-aura-cyan/10 shadow-aura-glow-cyan"
            : "text-aura-textMuted border-transparent hover:text-aura-textMain",
          editing && "dock-jiggle cursor-grab",
          dragging && "opacity-60 cursor-grabbing",
        )}
        style={{ transform: `scale(${scale})` }}
      >
        <MSymbol name={item.icon} fill={active} />
      </Link>

      {/* Active dot — the macOS "app is running" pip. */}
      {active && !editing && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-1 h-1 rounded-full bg-aura-cyan"
        />
      )}

      {editing && (
        <button
          type="button"
          aria-label={`เอา ${item.label} ออกจาก Dock`}
          onClick={onUnpin}
          className="absolute -top-1 -right-1 z-10 grid place-items-center w-5 h-5 rounded-full bg-alert-red text-white text-[13px] leading-none shadow-lg"
        >
          <MSymbol name="close" className="text-[13px]" />
        </button>
      )}
    </div>
  );
}

/**
 * Sheet of everything not currently pinned.
 *
 * Each tile is a LINK, not a pin button. That distinction is the whole point:
 * a dock that only shows pinned icons would otherwise make every unpinned
 * module unreachable — you would have to pin something to visit it once. So
 * the tile navigates, and a separate corner button pins. This also keeps every
 * route a real `nav a[href]`, which is what modules.spec.ts checks.
 */
function ModulePicker({
  items,
  onPick,
  onClose,
}: {
  items: DockItem[];
  onPick: (to: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="aura-card rounded-2xl max-w-[min(92vw,560px)] max-h-[50vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold font-thai text-aura-textMain">
          ทุกโมดูล
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
      {items.length === 0 ? (
        <p className="text-xs text-aura-textMuted font-thai py-2">
          ปักครบทุกโมดูลแล้ว
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((n) => (
            <div key={n.to} className="relative">
              <Link
                to={n.to}
                onClick={onClose}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-aura-borderSubtle text-aura-textMuted hover:text-aura-cyan hover:border-aura-cyan/40 transition-colors"
              >
                <MSymbol name={n.icon} />
                <span className="text-[10px] font-thai text-center leading-tight">
                  {n.label}
                </span>
              </Link>
              <button
                type="button"
                aria-label={`ปัก ${n.label} ลง Dock`}
                title="ปักลง Dock"
                onClick={() => onPick(n.to)}
                className="absolute top-1 right-1 grid place-items-center w-5 h-5 rounded-full text-aura-textMuted hover:text-aura-cyan hover:bg-aura-cyan/10"
              >
                <MSymbol name="add" className="text-[14px]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
