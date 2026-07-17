import { type ElementType, type ReactNode } from "react";
import { cn } from "../../lib/utils";

/**
 * Aura Edition glass card with rotating conic-gradient border.
 * See design/uth_ai_evn_system_design_aura_edition.md §3.
 *
 * `idle` dims the rotating aura (use for non-active / secondary cards).
 * `as` changes the underlying element (default div) for semantic cases.
 */
export function AuraCard({
  children,
  className,
  idle = false,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  idle?: boolean;
  as?: ElementType;
}) {
  return (
    <Tag className={cn("aura-card p-5", idle && "aura-card--idle", className)}>
      {children}
    </Tag>
  );
}
