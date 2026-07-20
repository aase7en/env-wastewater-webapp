import { cn } from "../../lib/utils";

/**
 * Skeleton placeholders (SKEL-1). Motion + colors live in the `.skeleton`
 * class (index.css) + `--skeleton-sheen` token (tokens.css) — neutral grey
 * box with a light sweep, dual-theme, frozen under prefers-reduced-motion,
 * invisible for the first 200ms (anti-flash). `data-skeleton` is the e2e
 * hook (tests/e2e/skeleton.spec.ts) — keep it on the primitive only.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div data-skeleton aria-hidden="true" className={cn("skeleton rounded-lg", className)} />;
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

/** Full-page placeholder (SKEL-1) — header line + KPI tiles + content block.
 * Used by RequireAuth while the auth/appUser check settles and as the
 * Suspense fallback for lazy routes. */
export function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-8 w-64" />
      <CardGridSkeleton cards={4} />
      <Skeleton className="h-72" />
    </div>
  );
}
