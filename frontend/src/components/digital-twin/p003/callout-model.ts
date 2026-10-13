import type {
  AerationTankTwinAsset,
  TwinAssetId,
  TwinMetric,
  WastewaterTwinState,
} from "../../../lib/twin/types";

export type SemanticBadge =
  | "LIVE"
  | "LATEST"
  | "HISTORICAL"
  | "SIMULATED"
  | "STALE"
  | "UNAVAILABLE";

export const SEMANTIC_BADGE_LABELS_TH: Readonly<Record<SemanticBadge, string>> = {
  LIVE: "สด",
  LATEST: "ล่าสุด",
  HISTORICAL: "ย้อนหลัง",
  SIMULATED: "จำลอง",
  STALE: "ข้อมูลเก่า",
  UNAVAILABLE: "ไม่พร้อมใช้งาน",
};

const AERATION_METRICS = [
  { key: "waterLevelPercent", label: "ระดับน้ำ" },
  { key: "aeratorRunning", label: "เครื่องเติมอากาศ" },
  { key: "dissolvedOxygenMgL", label: "ออกซิเจนละลายน้ำ (DO)" },
  { key: "tdsMgL", label: "สารละลายรวม (TDS)" },
  { key: "temperatureC", label: "อุณหภูมิ" },
] as const satisfies ReadonlyArray<{
  key: keyof Pick<
    AerationTankTwinAsset,
    | "waterLevelPercent"
    | "aeratorRunning"
    | "dissolvedOxygenMgL"
    | "tdsMgL"
    | "temperatureC"
  >;
  label: string;
}>;

export type CalloutMetricKey = (typeof AERATION_METRICS)[number]["key"];

export interface CalloutModel {
  assetId: TwinAssetId;
  assetLabel: string;
  metricKey: CalloutMetricKey;
  metricLabel: string;
  valueLabel: string;
  semanticBadge: SemanticBadge;
  detailDestination: string;
}

function semanticBadge(metric: TwinMetric<number | boolean>, mode: WastewaterTwinState["mode"]): SemanticBadge {
  if (metric.freshness === "stale") return "STALE";
  switch (metric.source) {
    case "sensor-telemetry":
      return mode === "live" ? "LIVE" : mode === "historical" ? "HISTORICAL" : "LATEST";
    case "manual-snapshot":
      return mode === "historical" ? "HISTORICAL" : "LATEST";
    case "simulation":
      return "SIMULATED";
    case "unavailable":
      return "UNAVAILABLE";
  }
}

function valueLabel(key: CalloutMetricKey, metric: TwinMetric<number | boolean>): string {
  if (metric.source === "unavailable" || metric.value === null) return "ไม่มีข้อมูล";
  if (typeof metric.value === "boolean") return metric.value ? "ทำงาน" : "หยุด";
  if (!Number.isFinite(metric.value)) return "ไม่มีข้อมูล";
  switch (key) {
    case "waterLevelPercent":
      return `${metric.value.toFixed(0)} %`;
    case "dissolvedOxygenMgL":
      return `${metric.value.toFixed(2)} mg/L`;
    case "tdsMgL":
      return `${metric.value.toFixed(0)} mg/L`;
    case "temperatureC":
      return `${metric.value.toFixed(1)} °C`;
    case "aeratorRunning":
      return "ไม่มีข้อมูล";
  }
}

/** Only asset-local metrics enter this model. In particular, plant-wide
 * do_average is never mapped onto the aeration tank's DO callout. */
export function deriveCallouts(state: WastewaterTwinState): CalloutModel[] {
  const callouts: CalloutModel[] = [];
  for (const [assetId, asset] of Object.entries(state.assets)) {
    if (!asset || asset.id !== assetId || asset.type !== "aeration-tank") continue;
    for (const { key, label } of AERATION_METRICS) {
      const metric = asset[key];
      callouts.push({
        assetId: asset.id,
        assetLabel: asset.label,
        metricKey: key,
        metricLabel: label,
        valueLabel: valueLabel(key, metric),
        semanticBadge: semanticBadge(metric, state.mode),
        detailDestination: "p003-evidence-panel",
      });
    }
  }
  return callouts;
}
