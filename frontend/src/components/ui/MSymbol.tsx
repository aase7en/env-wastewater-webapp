import { cn } from "../../lib/utils";

/**
 * Material Symbols Outlined icon (F2) — the icon system used across the
 * design/ suite exports. Font loaded in index.css. `fill` mirrors the
 * suite's active-state pattern: FILL 1 on the active nav item.
 */
export function MSymbol({
  name,
  fill = false,
  className,
}: {
  /** Material Symbols glyph name, e.g. "water_drop". */
  name: string;
  fill?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("msym select-none", fill && "msym--fill", className)}
    >
      {name}
    </span>
  );
}
