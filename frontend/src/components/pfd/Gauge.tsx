import { cn, fmt } from "../../lib/utils";

interface GaugeProps {
  label: string;
  value: number | string | null | undefined;
  unit?: string;
  /** 0–1 fraction of the arc to fill. */
  fraction?: number;
  alert?: boolean | null;
  size?: "sm" | "md";
}

/** Circular SVG gauge for a single parameter (DO, pH, chlorine). */
export function Gauge({ label, value, unit, fraction = 0, alert, size = "md" }: GaugeProps) {
  const dim = size === "sm" ? 56 : 84;
  const stroke = size === "sm" ? 5 : 7;
  const r = (dim - stroke) / 2;
  const circ = 2 * Math.PI * r;
  // Fill from 0 to fraction, leaving the rest as track.
  const dash = circ * Math.max(0, Math.min(1, fraction));
  const color = alert ? "#ef4444" : "#0d9488";

  return (
    <div className={cn("flex flex-col items-center gap-1", alert && "status-glow-red rounded-full")}>
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={dim / 2} cy={dim / 2} r={r}
          fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle cx={dim / 2} cy={dim / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease-out" }} />
      </svg>
      <div className="text-center -mt-[calc(50%+8px)] pointer-events-none relative" style={{ marginTop: -(dim / 2) - 10 }}>
        <div className={cn("font-mono font-semibold text-navy-900", size === "sm" ? "text-xs" : "text-base")}>
          {fmt(value, value && parseFloat(String(value)) < 10 ? 2 : 1)}
        </div>
        {unit && <div className="text-[10px] text-navy-500">{unit}</div>}
      </div>
      <div className="text-[11px] text-navy-600 font-medium mt-1">{label}</div>
    </div>
  );
}
