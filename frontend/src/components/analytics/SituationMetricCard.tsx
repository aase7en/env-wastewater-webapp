import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { AuraCard } from "../ui/AuraCard";
import { Chip } from "../ui/Chip";
import { ProvenanceBadge } from "./ProvenanceBadge";
import type {
  FreshnessState,
  SituationSourceType,
  SituationStatusTone,
  SituationTrend,
} from "./types";

const TREND_ICON = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  stable: ArrowRight,
} as const;

export interface SituationMetricCardProps {
  label: string;
  value?: string | number | null;
  unit?: string;
  trend?: SituationTrend;
  provider?: string;
  sourceType?: SituationSourceType;
  observedAt?: string;
  freshness?: FreshnessState;
  freshnessLabel?: string;
  statusLabel?: string;
  statusTone?: SituationStatusTone;
  unknownLabel?: string;
  className?: string;
}

function hasKnownValue(value: SituationMetricCardProps["value"]): value is string | number {
  return value !== null && value !== undefined && value !== "";
}

export function SituationMetricCard({
  label,
  value,
  unit,
  trend,
  provider,
  sourceType,
  observedAt,
  freshness,
  freshnessLabel,
  statusLabel,
  statusTone = "neutral",
  unknownLabel = "ไม่ทราบค่า",
  className,
}: SituationMetricCardProps) {
  const known = hasKnownValue(value);
  const TrendIcon = trend ? TREND_ICON[trend.direction] : null;

  return (
    <AuraCard
      as="article"
      className={[
        "min-w-0 p-4 sm:p-5",
        freshness === "stale" ? "border-alert-amber/35" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <h3 className="min-w-0 text-sm font-semibold font-thai text-aura-textMuted">{label}</h3>
        {statusLabel ? <Chip tone={statusTone}>{statusLabel}</Chip> : null}
      </div>

      <div className="mt-3 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1" data-state={known ? "known" : "unknown"}>
        <span className={known ? "font-mono text-3xl font-semibold tracking-tight text-aura-textMain" : "font-thai text-lg font-semibold text-aura-textMuted"}>
          {known ? value : unknownLabel}
        </span>
        {known && unit ? <span className="text-sm font-medium text-aura-textMuted">{unit}</span> : null}
      </div>

      {trend && TrendIcon ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-aura-textMain" data-role="trend">
          <TrendIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-thai">{trend.label}</span>
        </div>
      ) : null}

      {observedAt ? (
        <p className="mt-3 text-xs font-thai text-aura-textMuted">
          <span className="font-semibold">เวลาอ้างอิง:</span> {observedAt}
        </p>
      ) : null}

      <ProvenanceBadge
        className="mt-4 flex flex-wrap items-center gap-2"
        sourceType={sourceType}
        provider={provider}
        freshness={freshness}
        freshnessLabel={freshnessLabel}
      />
    </AuraCard>
  );
}
