import { type ReactNode } from "react";
import { cn, fmt } from "../lib/utils";

interface KpiTileProps {
  label: string;
  value: number | string | null | undefined;
  unit?: string;
  icon?: ReactNode;
  digits?: number;
  /** Aura accent — neon cyan / lime / amber. All glow on hover. */
  accent?: "cyan" | "lime" | "amber";
}

export function KpiTile({ label, value, unit, icon, digits = 1, accent = "cyan" }: KpiTileProps) {
  const accentClass = {
    cyan: "text-aura-cyan bg-aura-cyan/10 border-aura-cyan/30",
    lime: "text-aura-lime bg-aura-lime/10 border-aura-lime/30",
    amber: "text-alert-amber bg-alert-amber/10 border-alert-amber/30",
  }[accent];
  const glowClass = {
    cyan: "hover:shadow-aura-glow-cyan",
    lime: "hover:shadow-aura-glow-lime",
    amber: "",
  }[accent];

  return (
    <div
      className={cn(
        "aura-card p-4 flex items-center gap-3 transition-shadow",
        glowClass
      )}
    >
      {icon && (
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", accentClass)}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs text-aura-textMuted font-thai truncate">{label}</div>
        <div className="font-mono font-semibold text-aura-textMain text-lg">
          {fmt(value, digits)}
          {unit && <span className="text-xs text-aura-textMuted ml-1 font-sans">{unit}</span>}
        </div>
      </div>
    </div>
  );
}
