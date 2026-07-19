import { useState } from "react";
import { Gauge } from "./Gauge";
import { AerationTank } from "./AerationTank";
import { StatusBadge } from "./StatusBadge";
import { AuraCard } from "../ui/AuraCard";
import { fmt, thaiDate, daysSince } from "../../lib/utils";
import type { DashboardRow } from "../../lib/types";

/**
 * Process Flow Diagram — SVG centerpiece of the dashboard.
 * 5 stages: screening → aeration → sedimentation → chlorination → discharge.
 * Water flow lines animate (dashed stroke) because they represent real flow.
 *
 * Aura Edition: glass card with neon cyan flow line + dark stage nodes that
 * glow per stage color.
 *
 * F5 interactive (logic half — zcode substituting Sonnet 2026-07-19): click
 * or keyboard-activate a stage node → panel under the diagram shows that
 * stage's fields + 1-line description. Click the same node again = close.
 * Aria/role wired for keyboard users. Visual className polish (selected-ring
 * token swap, micro-anim) is intentionally deferred to Track F.
 */
export function ProcessFlowDiagram({
  row,
  latestDate,
}: {
  row: DashboardRow | undefined;
  /** F7: latest reading_date across all time — shown in the empty-state so
   *  staff can tell "no one logged" from "system broken". null = truly empty. */
  latestDate?: string | null;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!row) {
    // F7 stale-data fallback: if we have a latestDate outside the 14-day
    // window, surface it. Pure text addition — no chart/gauge/status from
    // stale data (domain honesty, ui-brief rule).
    const staleLine = latestDate
      ? `บันทึกล่าสุด ${thaiDate(latestDate)} (${daysSince(latestDate)} วันก่อน)`
      : null;
    return (
      <AuraCard>
        <div className="text-aura-textMuted text-sm font-thai py-8 text-center">
          ไม่มีข้อมูลวันนี้
          {staleLine && (
            <div className="mt-1 text-xs text-aura-textMuted">{staleLine}</div>
          )}
        </div>
      </AuraCard>
    );
  }

  // Rotating aura ring only when the system needs operator attention
  // (abnormal status or any parameter alert) — static otherwise.
  const attention =
    row.system_operating === false ||
    !!row.do_alert || !!row.ph_alert || !!row.chlorine_alert;

  // Stage values are accessed by key via a Record helper because several
  // fields (do_aeration, sv30, chlorine_used, do_before_discharge, …) are
  // part of the data feed but not yet on the DashboardRow type. Treat the
  // row as a string-keyed bag so missing fields render as "—".
  const r = row as unknown as Record<string, number | string | null | undefined>;
  const num = (k: string): number | string | null | undefined => r[k];
  const selectedStage = STAGES.find((s) => s.key === selected) ?? null;

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

        {/* Stage nodes — theme surface fill with stage-colored stroke + glow.
            F5 visual: selected node = thicker stroke + token-cyan halo ring;
            keyboard focus = cyan glow via .pfd-node:focus-visible (index.css). */}
        {STAGES.map((s, i) => {
          const isSelected = selected === s.key;
          return (
            <g
              key={s.key}
              className="pfd-node"
              transform={`translate(${80 + i * 160}, 80)`}
              tabIndex={0}
              role="button"
              aria-label={`${s.label}: ${s.description}`}
              aria-pressed={isSelected}
              onClick={() => setSelected((cur) => (cur === s.key ? null : s.key))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected((cur) => (cur === s.key ? null : s.key));
                }
              }}
            >
              {isSelected && (
                <circle r="33" strokeWidth="1.5" fill="none" className="pfd-node-halo"
                  style={{ stroke: "rgb(var(--aura-cyan) / 0.55)" }} />
              )}
              <circle r="26" strokeWidth={isSelected ? 5 : 3}
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
          );
        })}
      </svg>

      {/* F5 interactive: selected-stage panel (markup mirrors CarbonPage KPI row;
          .pfd-panel = slide/fade-in, reduced-motion safe — index.css) */}
      {selectedStage && (
        <div className="pfd-panel mt-4 p-4 rounded-xl border border-aura-borderSubtle bg-aura-surfaceHigh/40">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-display font-semibold text-aura-textMain font-thai">
              {selectedStage.label}
            </h3>
            <span className="text-xs text-aura-textMuted font-thai">
              {selectedStage.description}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {selectedStage.fields.map((f) => {
              const v = num(f.key);
              return (
                <div key={f.key} className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-aura-textMuted font-thai">
                    {f.label}
                  </span>
                  {v == null && f.fallback ? (
                    <span className="mt-2 text-sm text-aura-textMuted font-thai">{f.fallback}</span>
                  ) : (
                    <span className="mt-1 text-2xl font-display font-bold text-aura-textMain tabular-nums">
                      {fmt(v ?? null, f.digits)}
                      {f.unit && (
                        <span className="text-xs font-normal text-aura-textMuted ml-1">{f.unit}</span>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
//
// F5: each stage carries its field list (key → label + unit + digits) and a
// one-line description shown in the panel. Fields not yet on DashboardRow
// are read via the Record helper — missing values render as "—", or as the
// field's `fallback` text when one is declared (e.g. screening points the
// reader to the daily log instead of a dash).
interface StageField {
  key: string;
  label: string;
  unit: string;
  digits: number;
  fallback?: string;
}

interface Stage {
  key: string;
  label: string;
  color: string;
  glow: string;
  description: string;
  fields: StageField[];
}

const STAGES: Stage[] = [
  {
    key: "screening",
    label: "ตะแกรง",
    color: "#94a3b8",
    glow: "rgba(148,163,184,0.65)",
    description: "ตะแกรงดักขยะก่อนเข้าระบบ",
    fields: [
      // Screening has no per-row metric today — operator notes are the source.
      { key: "screening_washed", label: "การล้างตะแกรง", unit: "", digits: 0, fallback: "ดูในบันทึกประจำวัน" },
    ],
  },
  {
    key: "aeration",
    label: "เติมอากาศ",
    color: "rgb(var(--aura-cyan))",
    glow: "rgb(var(--aura-cyan) / 0.65)",
    description: "ถังเติมอากาศ — จุลินทรีย์ย่อยสารอินทรีย์",
    fields: [
      { key: "do_aeration", label: "DO", unit: "mg/L", digits: 2 },
      { key: "tds_aeration", label: "TDS", unit: "mg/L", digits: 0 },
      { key: "temp_aeration", label: "อุณหภูมิ", unit: "°C", digits: 1 },
    ],
  },
  {
    key: "sediment",
    label: "ตกตะกอน",
    color: "#0ea5e9",
    glow: "rgba(14,165,233,0.65)",
    description: "ถังตกตะกอน — แยกตะกอนจุลินทรีย์",
    fields: [
      { key: "do_sedimentation", label: "DO", unit: "mg/L", digits: 2 },
      { key: "sv30", label: "SV30", unit: "mL/L", digits: 0 },
    ],
  },
  {
    key: "chlorine",
    label: "คลอรีน",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.65)",
    description: "เติมคลอรีนฆ่าเชื้อก่อนระบาย",
    fields: [
      { key: "free_chlorine", label: "Free Cl", unit: "mg/L", digits: 2 },
      { key: "chlorine_used", label: "ปริมาณใช้", unit: "L", digits: 1 },
    ],
  },
  {
    key: "discharge",
    label: "ระบาย",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.65)",
    description: "จุดระบายน้ำที่บำบัดแล้ว",
    fields: [
      { key: "do_before_discharge", label: "DO", unit: "mg/L", digits: 2 },
      { key: "tds_before_discharge", label: "TDS", unit: "mg/L", digits: 0 },
    ],
  },
];

/** Map a value to a 0–1 fraction of the gauge arc, clamped. */
function gaugeFraction(v: number | string | null | undefined, min: number, max: number): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, (n - min) / (max - min)));
}
