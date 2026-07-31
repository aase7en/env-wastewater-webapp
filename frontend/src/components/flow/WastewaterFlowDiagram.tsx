import { Droplets } from "lucide-react";
import { AuraCard } from "../ui/AuraCard";
import { Chip } from "../ui/Chip";
import { StatusBadge } from "../pfd/StatusBadge";
import { fmt, thaiDate, cn } from "../../lib/utils";
import {
  FLOW_ANCHORS,
  FLOW_KIND_COLORS,
  FLOW_VIEWBOX,
  type EquipmentState,
  type FlowAnchorKey,
  type FlowDiagramData,
  type FlowStage,
} from "../../lib/flow-model";

/**
 * WastewaterFlowDiagram — 2.5D interactive process flow diagram (P21).
 *
 * SCAFFOLD ONLY. This file intentionally contains no isometric artwork and no
 * flow animation yet: it establishes the layout container, the three-layer
 * stacking order, the shared coordinate space, and the data contract, so the
 * visual work can be dropped in without re-plumbing anything.
 *
 * ── Layer stack (back to front) ──────────────────────────────────────────
 *   1. Backplate PNG      — the isometric plant illustration
 *   2. SVG flow overlay   — animated water/air/sludge lines between anchors
 *   3. Equipment PNG layer — per-stage sprites + live readouts, absolutely
 *                            positioned so they sit on top of the pipes
 *
 * Flow lines sit UNDER the equipment sprites on purpose — pipes disappear
 * behind tanks in an isometric scene, which is what sells the 2.5D depth.
 *
 * ── Coordinate space ─────────────────────────────────────────────────────
 * Both the PNG layer and the SVG overlay work in `FLOW_VIEWBOX` units
 * (1600×900). The SVG uses it as its `viewBox`; PNG sprites convert to
 * percentages via `pct()`. Author a path at (620, 470) and it lands exactly
 * on the aeration sprite at (620, 470), at every screen size. Move a stage
 * by editing `FLOW_ANCHORS` in lib/flow-model.ts — both layers follow.
 *
 * ── Data ─────────────────────────────────────────────────────────────────
 * Fully driven by the `data` prop (`FlowDiagramData`). No queries, no
 * context, no global store — see lib/use-flow-data.ts for the producer.
 */
export function WastewaterFlowDiagram({
  data,
  className,
}: {
  data: FlowDiagramData;
  className?: string;
}) {
  const { asOf, source, systemOperating, stages, links } = data;

  // Rotating ring only when the plant needs attention — matches the ring
  // discipline in AuraCard/ProcessFlowDiagram (no strobing dashboards).
  const attention = systemOperating === false || stages.some((s) => s.attention);

  return (
    <AuraCard aura={attention ? "animated" : "static"} className={className}>
      <header className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="font-display font-semibold text-aura-textMain font-thai flex items-center gap-2">
            <Droplets className="w-5 h-5 text-aura-cyan" />
            ผังกระบวนการบำบัด 2.5D
          </h2>
          <p className="text-xs text-aura-textMuted font-thai mt-1">
            {asOf ? `ข้อมูล ${thaiDate(asOf)}` : "ไม่มีข้อมูล"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SourceBadge source={source} />
          <StatusBadge operating={systemOperating} />
        </div>
      </header>

      {/* ══ Scene container ══════════════════════════════════════════════
          Fixed 16:9 box matching FLOW_VIEWBOX so the isometric artwork never
          letterboxes. Everything inside is absolutely positioned. */}
      <div
        className="relative w-full overflow-hidden rounded-xl border border-aura-borderSubtle bg-aura-surfaceHigh/30"
        style={{ aspectRatio: `${FLOW_VIEWBOX.width} / ${FLOW_VIEWBOX.height}` }}
      >
        {/* ── LAYER 1: backplate PNG ──────────────────────────────────────
            DROP-IN POINT. Replace this placeholder with the isometric plant
            illustration:
              <img src={`${import.meta.env.BASE_URL}flow/plant-base.png`}
                   alt="" className="absolute inset-0 w-full h-full object-contain"
                   draggable={false} />
            Put the asset in frontend/public/flow/ so BASE_URL resolves it on
            GitHub Pages (the app is served from a sub-path, so a bare
            "/flow/..." would 404). */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] uppercase tracking-[0.2em] text-aura-textMuted/40 font-bold">
            Layer 1 · backplate PNG
          </span>
        </div>

        {/* ── LAYER 2: SVG flow overlay ───────────────────────────────────
            Straight placeholder segments between anchors — correct colours
            and correct active/inactive state, no animation. Replace the
            <line> elements with real <path> pipe geometry and add the dash
            animation then; the anchor lookup and colour mapping stay.

            Colour coding is fixed by design/ui-brief.md — 🔵 water,
            ⚪ air, 🟤 sludge. Don't recolour to fit a palette. */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${FLOW_VIEWBOX.width} ${FLOW_VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {links.map((link) => {
            const a = FLOW_ANCHORS[link.from];
            const b = FLOW_ANCHORS[link.to];
            return (
              <line
                key={`${link.from}-${link.to}-${link.kind}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={FLOW_KIND_COLORS[link.kind]}
                strokeWidth={link.active ? 6 : 3}
                strokeLinecap="round"
                // Dashed + faded = medium is not moving (pump off / unknown).
                strokeDasharray={link.active ? undefined : "10 14"}
                opacity={link.active ? 0.75 : 0.3}
              />
            );
          })}
        </svg>

        {/* ── LAYER 3: equipment PNG layer + readouts ─────────────────────
            One positioned node per stage. DROP-IN POINT: swap <StageNode>'s
            placeholder disc for the stage's isometric sprite — the wrapper
            already handles positioning, so the sprite just needs to render. */}
        {stages.map((stage) => (
          <StageNode key={stage.key} stage={stage} anchor={stage.key} />
        ))}

        {/* Off-stage anchors that carry no data but anchor flow lines. */}
        <AnchorMarker anchor="influent" label="น้ำเสียเข้า" />
        <AnchorMarker anchor="blower" label="เครื่องเป่าอากาศ" />
        <AnchorMarker anchor="sludge_out" label="ตะกอนทิ้ง" />
      </div>

      {/* ══ Data readout ═══════════════════════════════════════════════════
          Proves what the component actually received. Keep it while building
          the artwork; delete it once the scene renders the same values. */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stages.map((stage) => (
          <StageReadout key={stage.key} stage={stage} />
        ))}
      </div>

      <FlowLegend />
    </AuraCard>
  );
}

// ─── Positioning ──────────────────────────────────────────────────────────

/** Anchor (viewBox units) → CSS percentage, so PNG and SVG layers agree. */
function pct(anchor: FlowAnchorKey): { left: string; top: string } {
  const { x, y } = FLOW_ANCHORS[anchor];
  return {
    left: `${(x / FLOW_VIEWBOX.width) * 100}%`,
    top: `${(y / FLOW_VIEWBOX.height) * 100}%`,
  };
}

/**
 * A stage's node in the PNG layer. Placeholder disc + label + equipment dots;
 * the disc is what the isometric sprite replaces.
 */
function StageNode({ stage, anchor }: { stage: FlowStage; anchor: FlowAnchorKey }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5"
      style={pct(anchor)}
    >
      <div
        className={cn(
          "w-14 h-14 rounded-2xl border-2 bg-aura-surfaceHighest/80 backdrop-blur-sm",
          "flex items-center justify-center text-[10px] font-bold text-aura-textMuted",
          stage.attention ? "border-alert-amber" : "border-aura-borderSubtle",
        )}
      >
        PNG
      </div>
      <span className="text-[11px] font-semibold text-aura-textMain font-thai whitespace-nowrap">
        {stage.label}
      </span>
      <div className="flex gap-1">
        {stage.equipment.map((eq) => (
          <span
            key={eq.code}
            title={`${eq.label}: ${STATE_LABELS[eq.state]}`}
            className={cn("w-2 h-2 rounded-full", STATE_DOT[eq.state])}
          />
        ))}
      </div>
    </div>
  );
}

/** Label-only marker for anchors with no stage data (influent/blower/sludge). */
function AnchorMarker({ anchor, label }: { anchor: FlowAnchorKey; label: string }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
      style={pct(anchor)}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-aura-textMuted/50 mx-auto" />
      <span className="text-[10px] text-aura-textMuted font-thai whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

// ─── Readouts ─────────────────────────────────────────────────────────────

function StageReadout({ stage }: { stage: FlowStage }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 bg-aura-surfaceHigh/30",
        stage.attention ? "border-alert-amber/40" : "border-aura-borderSubtle",
      )}
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-aura-textMain font-thai">
          {stage.label}
        </span>
        <span className="text-[10px] font-mono text-aura-textMuted">{stage.key}</span>
      </div>

      {stage.metrics.length > 0 ? (
        <dl className="grid grid-cols-2 gap-2 mb-2">
          {stage.metrics.map((m) => (
            <div key={m.key}>
              <dt className="text-[10px] uppercase tracking-wider font-bold text-aura-textMuted font-thai">
                {m.label}
              </dt>
              <dd
                className={cn(
                  "text-lg font-display font-bold tabular-nums",
                  m.alert ? "text-alert-amber" : "text-aura-textMain",
                )}
              >
                {fmt(m.value, m.digits)}
                {m.unit && (
                  <span className="text-[10px] font-normal text-aura-textMuted ml-1">
                    {m.unit}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-xs text-aura-textMuted font-thai mb-2">
          ไม่มีค่าที่วัดในขั้นนี้
        </p>
      )}

      <ul className="space-y-1 pt-2 border-t border-aura-borderSubtle/50">
        {stage.equipment.map((eq) => (
          <li key={eq.code} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-aura-textMuted font-thai truncate">{eq.label}</span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className={cn("w-2 h-2 rounded-full", STATE_DOT[eq.state])} />
              <span className="text-aura-textMain font-thai">{STATE_LABELS[eq.state]}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FlowLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-aura-textMuted font-thai">
      {(
        [
          ["water", "น้ำเสีย / น้ำที่บำบัดแล้ว"],
          ["air", "อากาศจากเครื่องเป่า"],
          ["sludge", "ตะกอน (RAS/WAS)"],
        ] as const
      ).map(([kind, label]) => (
        <span key={kind} className="flex items-center gap-1.5">
          <span
            className="w-4 h-1 rounded-full"
            style={{ background: FLOW_KIND_COLORS[kind] }}
          />
          {label}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="w-4 h-1 rounded-full border-t-2 border-dashed border-aura-textMuted/60" />
        เส้นประ = ไม่มีการไหล
      </span>
    </div>
  );
}

/** Dummy data must never be mistaken for a real measurement. */
function SourceBadge({ source }: { source: FlowDiagramData["source"] }) {
  const label =
    source === "dummy"
      ? "ข้อมูลตัวอย่าง"
      : source === "live-sensor"
        ? "เซนเซอร์ Live"
        : "บันทึกประจำวัน";
  // Amber for the fixture — it should read as "not a real reading", not as
  // just another accent chip.
  return <Chip tone={source === "dummy" ? "amber" : "cyan"}>{label}</Chip>;
}

const STATE_DOT: Record<EquipmentState, string> = {
  active: "bg-alert-green",
  idle: "bg-aura-textMuted/50",
  fault: "bg-alert-red status-glow-red",
  unknown: "bg-aura-textMuted/25 border border-aura-textMuted/40",
};

const STATE_LABELS: Record<EquipmentState, string> = {
  active: "ทำงาน",
  idle: "หยุด",
  fault: "ขัดข้อง",
  unknown: "ไม่ระบุ",
};
