import { Gauge } from "./Gauge";
import { AerationTank } from "./AerationTank";
import { StatusBadge } from "./StatusBadge";
import { AuraCard } from "../ui/AuraCard";
import type { DashboardRow } from "../../lib/types";

/**
 * Process Flow Diagram — SVG centerpiece of the dashboard.
 * 5 stages: screening → aeration → sedimentation → chlorination → discharge.
 * Water flow lines animate (dashed stroke) because they represent real flow.
 *
 * Aura Edition: glass card with neon cyan flow line + dark stage nodes that
 * glow per stage color.
 */
export function ProcessFlowDiagram({ row }: { row: DashboardRow | undefined }) {
  if (!row) {
    return (
      <AuraCard>
        <div className="text-aura-textMuted text-sm font-thai py-8 text-center">ไม่มีข้อมูลวันนี้</div>
      </AuraCard>
    );
  }

  // Rotating aura ring only when the system needs operator attention
  // (abnormal status or any parameter alert) — static otherwise.
  const attention =
    row.system_operating === false ||
    !!row.do_alert || !!row.ph_alert || !!row.chlorine_alert;

  return (
    <AuraCard aura={attention ? "animated" : "static"}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-aura-textMain font-thai">ผังกระบวนการบำบัด</h2>
        <StatusBadge status={row.system_operating ?? null} />
      </div>

      {/* SVG: horizontal flow with animated dashed line */}
      <svg viewBox="0 0 800 160" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Accent gradient stroke — follows the theme via tokens */}
          <linearGradient id="pfd-flow-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" style={{ stopColor: "var(--aura-gradient-from)" }} />
            <stop offset="100%" style={{ stopColor: "var(--aura-gradient-to)" }} />
          </linearGradient>
        </defs>
        {/* Flow line: screening → aeration → sedimentation → chlorination → discharge */}
        <path d="M 40 80 L 760 80" fill="none" stroke="url(#pfd-flow-grad)" strokeWidth="6"
          className="pfd-flow-line" opacity="0.85" />

        {/* Stage nodes — theme surface fill with stage-colored stroke + glow */}
        {STAGES.map((s, i) => (
          <g key={s.key} transform={`translate(${80 + i * 160}, 80)`}>
            <circle r="26" strokeWidth="3"
              style={{
                fill: "rgb(var(--aura-surface-high))",
                stroke: s.color,
                filter: `drop-shadow(0 0 4px ${s.glow})`,
              }} />
            <text textAnchor="middle" y="-32" className="fill-aura-textMain font-thai"
              style={{ fontSize: 11, fontWeight: 600 }}>
              {s.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Gauges row — DO at 3 stages + pH + free chlorine */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 place-items-center">
        <Gauge label="DO บ่อเติมอากาศ" value={row.do_average} unit="mg/L"
          fraction={gaugeFraction(row.do_average, 0, 8)} alert={row.do_alert ?? false} size="sm" />
        <Gauge label="pH" value={row.ph} unit=""
          fraction={gaugeFraction(row.ph, 0, 14)} alert={row.ph_alert ?? false} size="sm" />
        <Gauge label="Free Chlorine" value={row.free_chlorine} unit="mg/L"
          fraction={gaugeFraction(row.free_chlorine, 0, 3)} alert={row.chlorine_alert ?? false} size="sm" />
        <Gauge label="TDS" value={row.tds_aeration} unit="mg/L"
          fraction={gaugeFraction(row.tds_aeration, 0, 1000)} size="sm" />
        <AerationTank aeratorOn={row.system_operating} />
      </div>
    </AuraCard>
  );
}

// Stage colors match the strict PFD flow-line color coding in design/ui-brief.md
// (blue water, teal aeration, navy sediment, amber chlorine, green discharge).
// Aeration uses the theme accent token so it stays readable in light mode;
// the rest are legible on both themes as-is.
const STAGES = [
  { key: "screening", label: "ตะแกรง", color: "#94a3b8", glow: "rgba(148,163,184,0.65)" },
  { key: "aeration", label: "เติมอากาศ", color: "rgb(var(--aura-cyan))", glow: "rgb(var(--aura-cyan) / 0.65)" },
  { key: "sediment", label: "ตกตะกอน", color: "#0ea5e9", glow: "rgba(14,165,233,0.65)" },
  { key: "chlorine", label: "คลอรีน", color: "#f59e0b", glow: "rgba(245,158,11,0.65)" },
  { key: "discharge", label: "ระบาย", color: "#22c55e", glow: "rgba(34,197,94,0.65)" },
];

/** Map a value to a 0–1 fraction of the gauge arc, clamped. */
function gaugeFraction(v: number | string | null | undefined, min: number, max: number): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, (n - min) / (max - min)));
}
