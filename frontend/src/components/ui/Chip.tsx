import { type ReactNode } from "react";
import { cn } from "../../lib/utils";

/**
 * Small outlined status capsule (F-DESIGN-2b) — ported from the design
 * system, which had it while the app did not. Pages have been hand-rolling
 * this shape inline (see the per-module status pills on OverviewPage and the
 * repair-status badges on EquipmentPage); this is the shared version.
 *
 * Not a replacement for `StatusBadge`. That one is the filled traffic-light
 * for `system_operating` and carries its own true/false/null semantics;
 * `Chip` is the neutral outlined capsule for everything else.
 */
export type ChipTone = "neutral" | "cyan" | "green" | "amber" | "red";

const TONES: Record<ChipTone, string> = {
  neutral: "text-aura-textMuted border-aura-borderSubtle bg-transparent",
  cyan: "text-aura-cyan border-aura-cyan/40 bg-aura-cyan/10",
  green: "text-alert-green border-alert-green/50 bg-alert-green/10",
  amber: "text-alert-amber border-alert-amber/50 bg-alert-amber/10",
  red: "text-alert-red border-alert-red/50 bg-alert-red/10",
};

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full",
        "text-xs font-semibold whitespace-nowrap font-thai border",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
