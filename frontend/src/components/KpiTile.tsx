import { type ReactNode } from "react";
import { cn, fmt } from "../lib/utils";

interface KpiTileProps {
  label: string;
  value: number | string | null | undefined;
  unit?: string;
  icon?: ReactNode;
  digits?: number;
  accent?: "teal" | "water" | "amber";
}

export function KpiTile({ label, value, unit, icon, digits = 1, accent = "teal" }: KpiTileProps) {
  const accentClass = {
    teal: "text-teal-600 bg-teal-50",
    water: "text-water-600 bg-water-100",
    amber: "text-alert-amber bg-amber-50",
  }[accent];

  return (
    <div className="bg-white rounded-xl border border-navy-100 shadow-sm p-4 flex items-center gap-3">
      {icon && <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", accentClass)}>{icon}</div>}
      <div className="min-w-0">
        <div className="text-xs text-navy-500 truncate">{label}</div>
        <div className="font-mono font-semibold text-navy-900 text-lg">
          {fmt(value, digits)}
          {unit && <span className="text-xs text-navy-400 ml-1">{unit}</span>}
        </div>
      </div>
    </div>
  );
}
