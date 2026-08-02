import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
/**
 * Empty space reserved ABOVE the icon row, inside the scrolling box.
 *
 * The row needs `overflow-x: auto` to scroll, and per spec that forces
 * `overflow-y` from `visible` to `auto` — there is no way to clip one axis and
 * not the other. So a magnified icon had its top sliced off and the name tag,
 * which sits above the icon, was cut away entirely. Reserving headroom inside
 * the same box gives both room to exist without being clipped, and the pill
 * behind them is drawn to cover only the bottom strip so the icons still read
 * as rising out of it.
 *
 * Budget: icon growth 48×0.6 ≈ 29 · gap 10 · tag ≈ 26 → 76 with slack.
 */
const HEADROOM = 76;
/** How far above the slot the name tag sits — must clear a fully grown icon. */
const TIP_OFFSET = ITEM * (MAX_SCALE - 1) + 10;

/** Smoothstep — the ease that makes neighbours fall off gently instead of
 *  stepping. Straight linear falloff reads as mechanical. */
function falloff(distanceInSlots: number): number {
  const t = Math.max(0, 1 - distanceInSlots / RANGE);
  return t * t * (3 - 2 * t);
}

export function ModuleDock({ nav, isAdmin }: { nav: DockItem[]; isAdmin: boolean }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const barRef = useRef<HTMLDivElement>(null);
  /** The whole dock, incl. the picker — used to ignore its own scrolls. */
  const rootRef = useRef<HTMLElement>(null);

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
  /** Pointer x in viewport px. Set for touch as well as mouse — the dock owns
   *  its gesture, so a finger acts exactly like a cursor. */
  const [mouseX, setMouseX] = useState<number | null>(null);
  /** Mirrors barRef.scrollLeft. Slot centres are screen coordinates, so they
   *  MUST subtract this or magnification targets the wrong icon the moment
   *  the row has been scrolled. */
  const [scrollX, setScrollX] = useState(0);
  const [editing, setEditing] = useState(false);
  /** Index the drag STARTED from. Fixed for the whole gesture. */
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  /** Slot the dragged icon would drop into right now. */
  const [dropIndex, setDropIndex] = useState<number | null>(null);
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
    // Magnification stays live in edit mode too: while an icon rides the
    // finger, the ones it passes over still swell and fall off by distance,
    // which is what shows you where it will land.
    if (mouseX === null || barLeft === null) {
      scales.push(1);
      continue;
    }
    const centre = barLeft + PAD + i * (ITEM + GAP) + ITEM / 2 - scrollX;
    scales.push(
      1 + (MAX_SCALE - 1) * falloff(Math.abs(mouseX - centre) / (ITEM + GAP)),
    );
  }

  /** Which slot the pointer is over — drives the name tag. Derived rather
   *  than left to CSS :hover, because a finger never triggers :hover and the
   *  labels simply never appeared on a touch screen. */
  const hoverIndex =
    mouseX === null || barLeft === null
      ? null
      : (() => {
          const raw = Math.round(
            (mouseX - barLeft - PAD - ITEM / 2 + scrollX) / (ITEM + GAP),
          );
          const i = Math.max(0, Math.min(slots - 1, raw));
          const centre = barLeft + PAD + i * (ITEM + GAP) + ITEM / 2 - scrollX;
          return Math.abs(mouseX - centre) <= ITEM ? i : null;
        })();

  const totalGrowth = scales.reduce((sum, s) => sum + ITEM * (s - 1), 0);
  const offsets: number[] = [];
  let accumulated = 0;
  for (const s of scales) {
    offsets.push(accumulated + (ITEM * (s - 1)) / 2 - totalGrowth / 2);
    accumulated += ITEM * (s - 1);
  }

  /** Resting width of the pill, before any magnification. */
  const baseWidth = 2 * PAD + slots * ITEM + (slots - 1) * GAP;

  /**
   * How far slot `i` shifts to make room while something is being dragged.
   *
   * The order array is NOT mutated during a drag — it used to be rewritten on
   * every pointermove, which made the whole row churn under the finger. Now
   * the row just opens: everything between the slot the icon left and the slot
   * it is heading for steps one place toward the gap, so the hole closes
   * behind the icon and a slot opens ahead of it. Same as dragging an app
   * across an iOS home screen. The array is rewritten once, on drop.
   */
  const gapShift = (i: number): number => {
    if (dragFrom === null || dropIndex === null || i === dragFrom) return 0;
    const step = ITEM + GAP;
    if (dragFrom < dropIndex && i > dragFrom && i <= dropIndex) return -step;
    if (dropIndex < dragFrom && i >= dropIndex && i < dragFrom) return step;
    return 0;
  };

  const slotStyle = (i: number): CSSProperties => {
    // The slot being dragged leaves the row and rides the pointer: offset it
    // by however far the pointer is from where it would rest, lift it clear,
    // and put it above its neighbours so it reads as picked up.
    if (editing && dragFrom === i && mouseX !== null && barLeft !== null) {
      const rest = barLeft + PAD + i * (ITEM + GAP) + ITEM / 2 - scrollX;
      return {
        transform: `translateX(${(mouseX - rest).toFixed(2)}px) translateY(-20px) scale(1.18)`,
        zIndex: 20,
      };
    }
    return {
      transform: `translateX(${(offsets[i] + gapShift(i)).toFixed(2)}px) scale(${scales[i].toFixed(3)})`,
    };
  };
  /**
   * Ease only when it should NOT track the pointer frame-for-frame: on the way
   * out, and for the slots stepping aside during a drag — a gap that opens
   * instantly reads as a glitch, whereas one that slides reads as making room.
   * The icon riding the finger is never eased; it must stay glued to it.
   */
  const isSettling = (i: number) =>
    mouseX === null || (editing && dragFrom !== null && i !== dragFrom);

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
  /** Did this gesture move? Decides tap (Link handles it) vs drag-release
   *  (we navigate to whatever it ended on). */
  const travelled = useRef(false);
  /* ── Edge auto-scroll ────────────────────────────────────────────────────
   * Dragging the pointer to either end of the row scrolls it, so the modules
   * that overflow off the end stay reachable with one continuous gesture.
   * Replaces drag-to-pan: panning moved the content under a stationary
   * finger, which fought the magnification (the finger would end up over a
   * different icon than the one it started on). */
  const EDGE = 56;      // px from the end where scrolling kicks in
  const EDGE_SPEED = 14; // px per frame at the very edge
  const edgeRaf = useRef<number | null>(null);
  const edgeVel = useRef(0);

  const stopEdgeScroll = () => {
    if (edgeRaf.current !== null) {
      cancelAnimationFrame(edgeRaf.current);
      edgeRaf.current = null;
    }
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

  /** Set the scroll velocity from how deep into the edge zone the pointer is. */
  const updateEdgeScroll = (clientX: number) => {
    const bar = barRef.current;
    if (!bar) return;
    const r = bar.getBoundingClientRect();
    let v = 0;
    if (clientX < r.left + EDGE) {
      v = -EDGE_SPEED * Math.min(1, (r.left + EDGE - clientX) / EDGE);
    } else if (clientX > r.right - EDGE) {
      v = EDGE_SPEED * Math.min(1, (clientX - (r.right - EDGE)) / EDGE);
    }
    edgeVel.current = v;
    if (v !== 0 && edgeRaf.current === null) {
      edgeRaf.current = requestAnimationFrame(runEdgeScroll);
    }
  };

  useEffect(() => stopEdgeScroll, []);

  /* ── Hide on scroll down, show on scroll up ──────────────────────────────
   * The dock floats over the page, so on form pages it sat on top of the save
   * button at the bottom of the screen and there was no way to reach it.
   * Scrolling DOWN (reading/filling in) tucks it away; scrolling UP (looking
   * for navigation) brings it back. Always visible at the top of the page,
   * and never hidden mid-edit or with the sheet open, since that would yank
   * the thing being interacted with out from under the user. */
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const upAccum = useRef(0);

  useEffect(() => {
    if (editing || pickerOpen) {
      setHidden(false);
      return;
    }
    const onScroll = (e: Event) => {
      const t = e.target as Node | Document | null;
      // The dock's own row scrolls horizontally, and so does the picker —
      // neither should drive this.
      if (t instanceof Node && rootRef.current?.contains(t)) return;

      // Capture phase, because the scroller is not necessarily `window`:
      // <main> carries overflow-x-hidden, and per spec a non-visible value on
      // one axis promotes the other from `visible` to `auto`, which can make
      // main itself the scrolling box. Reading whichever element fired keeps
      // this working either way.
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
        // Stay hidden until the user has genuinely scrolled UP a little; a
        // few px of rubber-band or momentum wobble must not flick it back.
        upAccum.current += -dy;
        if (upAccum.current > 24) setHidden(false);
      }
    };
    lastY.current = window.scrollY;
    upAccum.current = 0;
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () =>
      window.removeEventListener("scroll", onScroll, { capture: true });
  }, [editing, pickerOpen]);

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
      setDropIndex(index);
    }, HOLD_MS);
  };
  const pressMoved = (x: number, y: number) => {
    const o = pressOrigin.current;
    if (!o) return;
    if (Math.hypot(x - o.x, y - o.y) > PRESS_SLOP) {
      travelled.current = true;
      clearPress();
    }
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
    <>
      {/* Scrim. Rendered as a SIBLING of the dock, never inside it: .dock-root
          carries a transform, and a transformed ancestor becomes the
          containing block for its position:fixed descendants — the scrim
          would have been trapped inside the dock instead of covering the
          page. z-[35] sits above the top bar (z-30) and below the dock (z-40)
          so the sheet stays lit while everything else recedes. */}
      {pickerOpen && (
        <div
          aria-hidden="true"
          onClick={() => setPickerOpen(false)}
          className="dock-scrim fixed inset-0 z-[35] bg-aura-bgDeep/50 backdrop-blur-sm"
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
          // Bottom strip only, not inset-y-0: the wrapper is now tall enough
          // to hold the headroom, and the pill must stay the height of the
          // resting row so magnified icons visibly rise out of it.
          className="dock-pill aura-card aura-card--static !absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full !p-0"
          // Clamped to the same width the row is, or on a phone the pill
          // would run off-screen while the row inside it scrolls.
          style={{
            width: baseWidth + totalGrowth,
            maxWidth: "calc(100vw - 6rem)",
            height: ITEM + 2 * PAD,
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
            paddingLeft: PAD,
            paddingRight: PAD,
            paddingBottom: PAD,
            // Room for the magnified icon and its name tag to exist without
            // overflow-y clipping them. See HEADROOM.
            paddingTop: HEADROOM,
            // `none`, never `pan-x`. Handing horizontal panning to the browser
            // makes it claim the gesture and fire pointercancel, after which
            // no pointermove reaches us — which is exactly why magnification
            // did not follow a finger. The dock scrolls itself instead.
            touchAction: "none",
          }}
          onScroll={(e) => setScrollX(e.currentTarget.scrollLeft)}
          onPointerDown={(e) => {
            // Deliberately NOT setPointerCapture. Capturing on the bar
            // re-targets the synthesised click to the bar itself, so taps
            // stopped opening modules at all. It is not needed either: the
            // edge-scroll zone sits INSIDE the bar, so the pointer never has
            // to leave the element for the gesture to work.
            setMouseX(e.clientX);
            travelled.current = false;
            // Also seed the origin when the press starts on padding rather
            // than on a slot, so dragging from a gap still counts as travel.
            if (!pressOrigin.current) {
              pressOrigin.current = { x: e.clientX, y: e.clientY };
            }
          }}
          onPointerMove={(e) => {
            setMouseX(e.clientX);
            pressMoved(e.clientX, e.clientY);
            // Pressed (or hovering with a mouse) near an end → keep scrolling.
            if (e.buttons === 1 || e.pointerType === "touch") {
              updateEdgeScroll(e.clientX);
            }
            // Only track where it WOULD land; the order is rewritten on drop.
            if (dragFrom !== null) setDropIndex(slotAt(e.clientX));
          }}
          onPointerLeave={(e) => {
            // A finger "leaving" mid-gesture is just capture doing its job —
            // only reset when nothing is pressed.
            if (e.buttons === 0) { setMouseX(null); stopEdgeScroll(); }
            clearPress();
          }}
          onPointerUp={() => {
            // Release-to-select: after dragging along the dock, lifting picks
            // whatever the pointer ended on. Only when the pointer actually
            // TRAVELLED — a stationary tap is left to the Link's own click, so
            // this never double-navigates. Suppressed in edit mode, where a
            // drag means "reorder".
            if (!editing && travelled.current && hoverIndex !== null) {
              if (hoverIndex >= items.length) {
                setPickerOpen((v) => !v);
              } else {
                navigate(items[hoverIndex].to);
              }
            }
            // Drop: one write, at the end of the gesture.
            if (dragFrom !== null && dropIndex !== null && dropIndex !== dragFrom) {
              commit(reorder(order, dragFrom, dropIndex));
            }
            travelled.current = false;
            setDragFrom(null);
            setDropIndex(null);
            clearPress();
            stopEdgeScroll();
          }}
          onPointerCancel={() => {
            setDragFrom(null);
            setDropIndex(null);
            clearPress();
            stopEdgeScroll();
          }}
        >
          {items.map((item, i) => (
            <DockSlot
              key={item.to}
              item={item}
              index={i}
              active={isActive(item.to)}
              style={slotStyle(i)}
              settling={isSettling(i)}
              showTip={hoverIndex === i}
              editing={editing}
              dragging={dragFrom === i}
              onPressStart={startPress}
              onPressEnd={clearPress}
              onDragStart={() => { if (editing) { setDragFrom(i); setDropIndex(i); } }}
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
    </>
  );
}

function DockSlot({
  item,
  index,
  active,
  style,
  settling,
  showTip,
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
  style: CSSProperties;
  settling: boolean;
  /** Parent decides, from pointer position — not CSS :hover, which a finger
   *  never fires. */
  showTip: boolean;
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
        style={{ bottom: "100%", marginBottom: TIP_OFFSET }}
        className={cn(
          "dock-tip pointer-events-none absolute left-1/2",
          "whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-thai",
          "bg-aura-surfaceHighest text-aura-textMain border border-aura-borderSubtle",
          "shadow-aura-card",
          showTip && "dock-tip--show",
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
          // Order matters. The STRONG cyan highlight belongs to whatever the
          // pointer is on, not to the current route — with release-to-select,
          // that slot is the pending choice, so the highlight has to travel
          // with the finger. It previously carried `!active`, which pinned it
          // to the current page's icon and made it look stuck.
          // The current route keeps a quieter tint plus its pip underneath, so
          // "where I am" is still legible while dragging.
          showTip
            ? "text-aura-cyan border-aura-cyan/60 bg-aura-cyan/15 shadow-aura-glow-cyan"
            : active
              ? "text-aura-cyan border-aura-cyan/25 bg-aura-cyan/5"
              : "text-aura-textMuted border-transparent",
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
    /* Two boxes, not one. Scrolling used to be on the .aura-card itself, and
       its ring is an inset:0 ::before — inside a scroll box that anchors to
       the padding box and rides the content, so the frame drifted over the
       heading and clipped the top-left text. The card is now a fixed shell
       and only the grid inside it scrolls.
       Height is bounded against the VIEWPORT (not 70vh) because this sheet
       stacks above a ~170px dock: on a short screen 70vh + dock overflowed
       the top of the display and the header went off-screen. */
    /* p-5 is NOT optional here. .aura-card is only the glass surface + ring —
       the padding every other card gets comes from the <AuraCard> COMPONENT,
       which adds `p-5`. This sheet uses the raw class, so it had zero padding:
       the heading sat flush against the edge and the 24px corner radius cut
       across it, which is the top-left text that kept "escaping the frame". */
    <div
      className="aura-card p-5 rounded-3xl w-[min(84vw,560px)] flex flex-col"
    >
      <div className="flex items-center justify-between mb-3 shrink-0">
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
        // Same fixed height as the grid, so pinning the last module does not
        // make the sheet collapse.
        <p
          className="text-xs text-aura-textMuted font-thai grid place-items-center"
          style={{ height: "min(46vh, 340px)" }}
        >
          ปักครบทุกโมดูลแล้ว
        </p>
      ) : (
        // The only scrolling element. -mx-1/px-1 keeps focus rings from being
        // shaved off at the edges of the scroll box.
        // FIXED height, not max-height: the sheet must not shrink as modules
        // get pinned out of it, or it resizes under the user's finger while
        // they are still picking. Empty space at the bottom is the point.
        <div
          className="overflow-y-auto -mx-1 px-1 pb-1 grid grid-cols-3 sm:grid-cols-4 gap-2 content-start"
          style={{ height: "min(46vh, 340px)" }}
        >
          {items.map((n) => (
            <div key={n.to} className="relative min-w-0">
              <Link
                to={n.to}
                onClick={onClose}
                className="flex flex-col items-center justify-center gap-1.5 p-2 pt-3 min-h-[82px] rounded-xl border border-aura-borderSubtle text-aura-textMuted hover:text-aura-cyan hover:border-aura-cyan/40 transition-colors overflow-hidden"
              >
                <MSymbol name={n.icon} className="text-[22px]" />
                {/* Thai has no inter-word spaces, so a long label is ONE
                    unbreakable token — it was punching straight out of the
                    tile and past the popup edge. `anywhere` lets it wrap
                    mid-word, which for Thai is what a reader expects. */}
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
          ))}
        </div>
      )}
    </div>
  );
}
