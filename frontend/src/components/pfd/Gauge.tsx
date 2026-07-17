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

/**
 * Circular SVG gauge for a single parameter (DO, pH, chlorine, TDS).
 * Aura Edition: cyan arc by default, red + glow when alert; dark track.
 */
export function Gauge({ label, value, unit, fraction = 0, alert, size = "md" }: GaugeProps) {
  const dim = size === "sm" ? 56 : 84;
  const stroke = size === "sm" ? 5 : 7;
  const r = (dim - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.max(0, Math.min(1, fraction));
  // Aura palette: neon cyan normally, neon red + glow when alerting.
  const color = alert ? "#ef4444" : "#00F0FF";

  return (
    <div className={cn("flex flex-col items-center gap-1", alert && "status-glow-red rounded-full")}>
      <svg width={dim} height={dim} className="-rotate-90">
        {/* Dark track ring (replaces light gray) */}
        <circle cx={dim / 2} cy={dim / 2} r={r}
          fill="none" stroke="#13383E" strokeWidth={stroke} />
        <circle cx={dim / 2} cy={dim / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{
            transition: "stroke-dasharray 0.6s ease-out",
            filter: alert
              ? "drop-shadow(0 0 4px rgba(239,68,68,0.7))"
              : "drop-shadow(0 0 3px rgba(0,240,255,0.6))",
          }} />
      </svg>
      <div className="text-center pointer-events-none relative" style={{ marginTop: -(dim / 2) - 10 }}>
        <div className={cn("font-mono font-semibold", size === "sm" ? "text-xs" : "text-base",
          alert ? "text-alert-red" : "text-aura-textMain")}>
          {fmt(value, value && parseFloat(String(value)) < 10 ? 2 : 1)}
        </div>
        {unit && <div className="text-[10px] text-aura-textMuted">{unit}</div>}
      </div>
      <div className="text-[11px] text-aura-textMuted font-medium font-thai mt-1">{label}</div>
    </div>
  );
}
