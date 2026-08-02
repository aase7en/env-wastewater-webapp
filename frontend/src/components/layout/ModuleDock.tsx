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
/** How long a STILL press takes to open edit mode. 500ms was short enough to
 *  fire during ordinary hesitation before a tap; 900 leaves room to pause. */
const HOLD_MS = 900;
const PRESS_SLOP = 8;  // px of travel before a hold is reclassified as a drag

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

  /* ── Magnification + displacement ────────────────────────────────────────
   * Two passes. First the scale of every slot from its distance to the
   * cursor; then how far each slot has to shift so that a grown neighbour
   * PUSHES it aside instead of overlapping it — the part that makes this read
   * as the macOS dock rather than as icons that merely inflate.
   *
   * Slot i's centre moves by the total extra width of every slot before it,
   * plus half of its own (scale is about its own centre, so its growth is
   * symmetric). Subtracting half the total growth keeps the row centred, so
   * the dock expands evenly both ways instead of creeping rightward.
   *
   * The picker button is the last slot, hence `slots = items.length + 1`. */
  const slots = items.length + 1;
  const barLeft = barRef.current?.getBoundingClientRect().left ?? null;

  const scales: number[] = [];
  for (let i = 0; i < slots; i++) {
    if (mouseX === null || editing || barLeft === null) {
      scales.push(1);
      continue;
    }
    const centre = barLeft + PAD + i * (ITEM + GAP) + ITEM / 2;
    scales.push(
      1 + (MAX_SCALE - 1) * falloff(Math.abs(mouseX - centre) / (ITEM + GAP)),
    );
  }

  const totalGrowth = scales.reduce((sum, s) => sum + ITEM * (s - 1), 0);
  const offsets: number[] = [];
  let accumulated = 0;
  for (const s of scales) {
    offsets.push(accumulated + (ITEM * (s - 1)) / 2 - totalGrowth / 2);
    accumulated += ITEM * (s - 1);
  }

  /** Resting width of the pill, before any magnification. */
  const baseWidth = 2 * PAD + slots * ITEM + (slots - 1) * GAP;

  const slotStyle = (i: number) => ({
    transform: `translateX(${offsets[i].toFixed(2)}px) scale(${scales[i].toFixed(3)})`,
  });
  /** Ease only on the way out; track the cursor instantly while over the bar. */
  const settling = mouseX === null;

  /* ── Press gestures ──────────────────────────────────────────────────────
   * Two gestures share one pointerdown, told apart by whether the pointer
   * MOVES:
   *   press + drag       → pan the dock (native overflow scroll; touch-action
   *                        pan-x lets the browser own it, which keeps the
   *                        momentum feel)
   *   press + hold still → edit mode
   * So any movement past a small slop radius has to cancel the pending
   * long-press, or a deliberate drag trips into edit mode after 500ms. */
  const pressTimer = useRef<number | null>(null);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);
  /** Horizontal pan state for mouse drag (touch is handled by the browser). */
  const pan = useRef<{ x: number; scrollLeft: number } | null>(null);

  const clearPress = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    pressOrigin.current = null;
  };
  /**
   * @param index slot being held. When the hold completes we go straight into
   *   dragging THAT slot — otherwise the finger is already down, edit mode
   *   opens, and nothing moves until you lift and press again, which feels
   *   broken. iOS does the same: hold, wobble, keep dragging.
   */
  const startPress = (x: number, y: number, index: number) => {
    clearPress();
    pressOrigin.current = { x, y };
    pressTimer.current = window.setTimeout(() => {
      setEditing(true);
      setDragFrom(index);
    }, HOLD_MS);
  };
  const pressMoved = (x: number, y: number) => {
    const o = pressOrigin.current;
    if (!o || pressTimer.current === null) return;
    if (Math.hypot(x - o.x, y - o.y) > PRESS_SLOP) clearPress();
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
    // bottom-8 (was bottom-4): the bar was sitting almost on the screen edge.
    // The row is also held well inside the viewport — see max-w on .dock-bar —
    // so it reads as a floating object rather than a fixed footer.
    <nav
      aria-label="โมดูล"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3"
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

      {/* The pill is its own absolutely-positioned layer so that widening it
          to swallow the displacement never reflows the icons — the icon row
          stays a pure transform, no layout on pointermove. */}
      <div className="relative flex justify-center">
        {/* `!absolute` is not decoration: .aura-card sets `position: relative`
            and `z-index: 1`, and it is declared after @tailwind utilities, so
            the plain utility loses the cascade. Same reason the row below
            takes z-10 — otherwise the pill paints over its own icons.
            --static because the dock is chrome, not a card asking for
            attention; the running ring is reserved for alert states. */}
        <div
          aria-hidden="true"
          className="dock-pill aura-card aura-card--static !absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-full !p-0"
          // Clamped to the same width the row is, or on a phone the pill
          // would run off-screen while the row inside it scrolls.
          style={{
            width: baseWidth + totalGrowth,
            maxWidth: "calc(100vw - 6rem)",
          }}
        />
        <div
          ref={barRef}
          // 8 default pins at 48px overflow a 375px phone, so the row scrolls
          // horizontally rather than running off-screen. touch-action pan-x
          // hands horizontal panning to the browser (momentum, rubber-band)
          // while leaving vertical page scroll alone; in edit mode it becomes
          // `none` so a drag reorders instead of scrolling.
          className="dock-bar relative z-10 flex items-end max-w-[calc(100vw-6rem)] overflow-x-auto"
          style={{
            gap: GAP,
            padding: PAD,
            touchAction: editing ? "none" : "pan-x",
          }}
          onPointerDown={(e) => {
            // Mouse drag-to-pan. Touch gets this free from touch-action:pan-x,
            // but a browser will not pan an overflow container on mouse drag,
            // so it is wired by hand.
            if (!editing && e.pointerType === "mouse" && barRef.current) {
              pan.current = { x: e.clientX, scrollLeft: barRef.current.scrollLeft };
            }
          }}
          onPointerMove={(e) => {
            setMouseX(e.clientX);
            pressMoved(e.clientX, e.clientY);
            if (dragFrom !== null) {
              const to = slotAt(e.clientX);
              if (to !== dragFrom) {
                commit(reorder(order, dragFrom, to));
                setDragFrom(to);
              }
              return;
            }
            if (pan.current && e.buttons === 1 && barRef.current) {
              barRef.current.scrollLeft =
                pan.current.scrollLeft - (e.clientX - pan.current.x);
            }
          }}
          onPointerLeave={() => { setMouseX(null); clearPress(); pan.current = null; }}
          onPointerUp={() => { setDragFrom(null); clearPress(); pan.current = null; }}
          onPointerCancel={() => { setDragFrom(null); clearPress(); pan.current = null; }}
        >
          {items.map((item, i) => (
            <DockSlot
              key={item.to}
              item={item}
              index={i}
              active={isActive(item.to)}
              style={slotStyle(i)}
              settling={settling}
              editing={editing}
              dragging={dragFrom === i}
              onPressStart={startPress}
              onPressEnd={clearPress}
              onDragStart={() => editing && setDragFrom(i)}
              onUnpin={() => commit(order.filter((p) => p !== item.to))}
            />
          ))}

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
            style={{ width: ITEM, height: ITEM, ...slotStyle(items.length) }}
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
  index,
  active,
  style,
  settling,
  editing,
  dragging,
  onPressStart,
  onPressEnd,
  onDragStart,
  onUnpin,
}: {
  item: DockItem;
  index: number;
  active: boolean;
  /** translateX + scale, computed by the parent from cursor distance. */
  style: { transform: string };
  settling: boolean;
  editing: boolean;
  dragging: boolean;
  onPressStart: (x: number, y: number, index: number) => void;
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
          onPressStart(e.clientX, e.clientY, index);
          if (editing) {
            e.preventDefault();
            onDragStart();
          }
        }}
        onPointerUp={onPressEnd}
        onPointerCancel={onPressEnd}
        className={cn(
          "dock-slot grid place-items-center w-full h-full rounded-2xl border",
          settling && "dock-slot--settling",
          active
            ? "text-aura-cyan border-aura-cyan/50 bg-aura-cyan/10 shadow-aura-glow-cyan"
            : "text-aura-textMuted border-transparent hover:text-aura-textMain",
          editing && "dock-jiggle cursor-grab",
          dragging && "opacity-60 cursor-grabbing",
        )}
        style={style}
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
    <div className="aura-card rounded-3xl w-[min(94vw,860px)] max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold font-thai text-aura-textMain">
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {items.map((n) => (
            <div key={n.to} className="relative">
              <Link
                to={n.to}
                onClick={onClose}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-aura-borderSubtle text-aura-textMuted hover:text-aura-cyan hover:border-aura-cyan/40 transition-colors"
              >
                <MSymbol name={n.icon} className="text-[28px]" />
                <span className="text-[11px] font-thai text-center leading-tight">
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
