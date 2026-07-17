import { cn } from "../../lib/utils";

/** Animated placeholder shimmer for loading states. Aura-themed. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-aura-surfaceHigh/50 animate-pulse",
        "bg-[linear-gradient(90deg,rgba(20,46,51,0.4)_25%,rgba(0,240,255,0.08)_50%,rgba(20,46,51,0.4)_75%)]",
        "bg-[length:200%_100%] animate-[flow_1.5s_linear_infinite]",
        className
      )}
    />
  );
}

/** Table row skeleton — N rows matching the readings list columns. */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={cn("h-6", j === 0 ? "flex-[2]" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Card grid skeleton — for KPI tiles. */
export function CardGridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton key={i} className="h-20 aura-card p-4" />
      ))}
    </div>
  );
}
