import { Clock3, Radio, Satellite, Sparkles, UserRoundPen, Waves, Waypoints } from "lucide-react";
import { Chip } from "../ui/Chip";
import type { FreshnessState, SituationSourceType } from "./types";
import { FRESHNESS_LABELS, SOURCE_TYPE_LABELS } from "./types";

const SOURCE_ICONS = {
  observation: Waves,
  forecast: Waypoints,
  satellite_estimate: Satellite,
  model_estimate: Sparkles,
  manual_latest: UserRoundPen,
  live_sensor: Radio,
  simulation: Sparkles,
} satisfies Record<SituationSourceType, typeof Waves>;

const FRESHNESS_TONE = {
  current: "green",
  stale: "amber",
  unknown: "neutral",
} as const satisfies Record<FreshnessState, "green" | "amber" | "neutral">;

export interface ProvenanceBadgeProps {
  sourceType?: SituationSourceType;
  provider?: string;
  freshness?: FreshnessState;
  freshnessLabel?: string;
  className?: string;
}

export function ProvenanceBadge({
  sourceType,
  provider,
  freshness,
  freshnessLabel,
  className,
}: ProvenanceBadgeProps) {
  if (!sourceType && !provider && !freshness) return null;

  const SourceIcon = sourceType ? SOURCE_ICONS[sourceType] : null;
  const sourceLabel = sourceType ? SOURCE_TYPE_LABELS[sourceType] : null;
  const freshnessText = freshness ? freshnessLabel ?? FRESHNESS_LABELS[freshness] : null;

  return (
    <div className={className ?? "flex flex-wrap items-center gap-2"} aria-label="แหล่งที่มาและความสดใหม่ของข้อมูล">
      {sourceType || provider ? (
        <Chip tone="cyan">
          {SourceIcon ? <SourceIcon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
          <span>{[sourceLabel, provider].filter(Boolean).join(" · ")}</span>
        </Chip>
      ) : null}
      {freshness && freshnessText ? (
        <Chip tone={FRESHNESS_TONE[freshness]}>
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{freshnessText}</span>
        </Chip>
      ) : null}
    </div>
  );
}
