import { cn } from "../../lib/utils";

/**
 * Material Symbols Outlined icon (F2) — the icon system used across the
 * design/ suite exports. Font loaded in index.css. `fill` mirrors the
 * suite's active-state pattern: FILL 1 on the active nav item.
 *
 * FONTS-1: the font file is a subset generated from the literal icon names
 * in src/ — after adding a new name, rerun `node scripts/gen-msymbol-subset.mjs`.
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
