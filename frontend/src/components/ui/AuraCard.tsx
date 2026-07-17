import { type ElementType, type ReactNode } from "react";
import { cn } from "../../lib/utils";

/**
 * Aura glass card with conic-gradient border ring (design/ suite spec).
 *
 * Ring discipline (Track F): the rotating animation is reserved for cards
 * that need operator attention (alerts, abnormal status) — everything else
 * gets a static ring. This keeps GPU/battery cost low on the phones staff
 * use at the pond and stops the dashboard from strobing.
 *
 * `aura="animated"` opts a card into the rotating ring.
 * `idle` dims the ring further (secondary/backdrop cards).
 * `as` changes the underlying element (default div) for semantic cases.
 */
export function AuraCard({
  children,
  className,
  aura = "static",
  idle = false,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  aura?: "animated" | "static";
  idle?: boolean;
  as?: ElementType;
}) {
  return (
    <Tag
      className={cn(
        "aura-card p-5",
        aura !== "animated" && "aura-card--static",
        idle && "aura-card--idle",
        className
      )}
    >
      {children}
    </Tag>
  );
}
