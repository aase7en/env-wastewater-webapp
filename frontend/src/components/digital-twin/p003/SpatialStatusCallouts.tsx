import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardRow } from "../../../lib/types";
import { deriveWastewaterTwinState } from "../../../lib/twin/selectors";
import { useTwinStore } from "../../../lib/twin/store";
import {
  SEMANTIC_BADGE_LABELS_TH,
  deriveCallouts,
  type CalloutModel,
  type SemanticBadge,
} from "./callout-model";
import { EvidencePanel } from "./EvidencePanel";

const BADGE_STYLES: Readonly<Record<SemanticBadge, string>> = {
  LIVE: "border-aura-cyan/60 bg-aura-cyan/10 text-aura-cyan",
  LATEST: "border-aura-cyan/40 bg-aura-cyan/10 text-aura-textMain",
  HISTORICAL: "border-aura-borderSubtle bg-aura-surfaceHigh text-aura-textMain",
  SIMULATED: "border-alert-amber/60 bg-alert-amber/10 text-alert-amber",
  STALE: "border-alert-amber/60 bg-alert-amber/10 text-alert-amber",
  UNAVAILABLE: "border-aura-borderSubtle bg-aura-surfaceHigh text-aura-textMuted",
};

function calloutKey(callout: CalloutModel): string {
  return `${callout.assetId}::${callout.metricKey}`;
}

/** DOM callouts stay outside TwinRendererBoundary and Canvas, so a WebGL
 * failure never removes the asset facts or the evidence destination. */
export function SpatialStatusCallouts({
  row,
  historicalRow,
}: {
  row: DashboardRow | undefined;
  historicalRow?: DashboardRow;
}) {
  const mode = useTwinStore((store) => store.mode);
  const simulationOverrides = useTwinStore((store) => store.simulationOverrides);
  const focusAsset = useTwinStore((store) => store.focusAsset);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const sourceRow = mode === "historical" ? historicalRow : row;
  const twinState = useMemo(
    () => deriveWastewaterTwinState(sourceRow, mode, simulationOverrides),
    [mode, simulationOverrides, sourceRow],
  );
  const callouts = useMemo(() => deriveCallouts(twinState), [twinState]);
  const selectedCallout = callouts.find((callout) => calloutKey(callout) === selectedKey);
  const assetLabels = [...new Set(callouts.map((callout) => callout.assetLabel))];

  useEffect(() => {
    if (selectedKey) panelRef.current?.focus();
  }, [selectedKey]);

  useEffect(() => () => focusAsset(null), [focusAsset]);

  const closePanel = () => {
    setSelectedKey(null);
    focusAsset(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <aside className="min-w-0 rounded-2xl border border-aura-borderSubtle bg-aura-surfaceHigh/35 p-3 font-thai md:self-start lg:border-l-2 lg:border-l-aura-cyan/60">
      <div className="px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aura-cyan">
          Spatial status · จุดข้อมูลในผัง
        </p>
        <h2 className="mt-1 text-base font-semibold text-aura-textMain">
          {assetLabels.length === 1 ? assetLabels[0] : "สถานะตามสินทรัพย์"}
        </h2>
        <p className="mt-1 text-xs text-aura-textMuted">
          เลือกค่าเพื่อดูหลักฐานของสินทรัพย์และแหล่งข้อมูล
        </p>
      </div>

      <ol
        data-testid="p003-callout-list"
        aria-label="จุดข้อมูลตามสินทรัพย์ใน Digital Twin"
        className="mt-3 grid gap-2"
      >
        {callouts.map((callout) => {
          const key = calloutKey(callout);
          const expanded = selectedKey === key;
          return (
            <li key={key} className="min-w-0">
              <button
                type="button"
                data-p003-callout=""
                data-p003-badge={callout.semanticBadge}
                data-asset-id={callout.assetId}
                aria-expanded={expanded}
                aria-controls={expanded ? callout.detailDestination : undefined}
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                  focusAsset(callout.assetId);
                  setSelectedKey(key);
                  if (expanded) panelRef.current?.focus();
                }}
                className={`flex min-h-[44px] w-full min-w-[44px] items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors duration-[var(--duration-base)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aura-cyan ${
                  expanded
                    ? "border-aura-cyan bg-aura-cyan/10"
                    : "border-aura-borderSubtle bg-aura-bg/45 hover:border-aura-cyan/60"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs text-aura-textMuted">
                    {callout.assetLabel} / {callout.metricLabel}
                  </span>
                  <span data-p003-value="" className="block text-sm font-semibold text-aura-textMain">
                    {callout.valueLabel}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold leading-tight ${BADGE_STYLES[callout.semanticBadge]}`}
                >
                  {callout.semanticBadge} · {SEMANTIC_BADGE_LABELS_TH[callout.semanticBadge]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="sr-only" role="status" aria-live="polite">
        {selectedCallout
          ? `เปิดหลักฐาน ${selectedCallout.metricLabel} ของ ${selectedCallout.assetLabel}`
          : ""}
      </p>

      {selectedCallout && (
        <EvidencePanel
          callout={selectedCallout}
          state={twinState}
          panelRef={panelRef}
          onClose={closePanel}
        />
      )}
    </aside>
  );
}
