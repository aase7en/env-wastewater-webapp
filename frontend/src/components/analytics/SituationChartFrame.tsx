import type { ReactNode } from "react";
import { AuraCard } from "../ui/AuraCard";

export interface SituationChartFrameProps {
  title: string;
  periodLabel?: string;
  seriesSummary?: ReactNode;
  sourceSummary?: ReactNode;
  thresholdDescription?: string;
  empty?: boolean;
  emptyLabel?: string;
  children?: ReactNode;
  className?: string;
}

export function SituationChartFrame({
  title,
  periodLabel,
  seriesSummary,
  sourceSummary,
  thresholdDescription,
  empty = false,
  emptyLabel = "ยังไม่มีข้อมูลสำหรับช่วงเวลานี้",
  children,
  className,
}: SituationChartFrameProps) {
  const hasChartContent = !empty && children !== null && children !== undefined;

  return (
    <AuraCard as="section" className={["min-w-0 p-4 sm:p-5", className ?? ""].filter(Boolean).join(" ")}>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h3 className="font-thai text-base font-semibold text-aura-textMain">{title}</h3>
          {periodLabel ? <p className="mt-1 font-thai text-xs text-aura-textMuted">{periodLabel}</p> : null}
        </div>
        {seriesSummary ? (
          <div className="min-w-0 font-thai text-xs text-aura-textMuted" aria-label="ประเภทชุดข้อมูล">
            {seriesSummary}
          </div>
        ) : null}
      </div>

      {sourceSummary ? (
        <div className="mt-3 min-w-0 font-thai text-xs text-aura-textMuted" aria-label="สรุปแหล่งข้อมูล">
          {sourceSummary}
        </div>
      ) : null}

      <div className="mt-4 min-h-44 min-w-0 overflow-hidden" data-state={hasChartContent ? "ready" : "empty"}>
        {hasChartContent ? (
          children
        ) : (
          <div className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-aura-borderSubtle/80 bg-aura-surface-low/35 px-4 text-center">
            <p className="font-thai text-sm text-aura-textMuted">{emptyLabel}</p>
          </div>
        )}
      </div>

      {thresholdDescription ? (
        <p className="mt-3 font-thai text-xs text-aura-textMuted">
          <span className="font-semibold">เส้นอ้างอิง:</span> {thresholdDescription}
        </p>
      ) : null}
    </AuraCard>
  );
}
