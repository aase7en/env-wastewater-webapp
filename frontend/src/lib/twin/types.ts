export type TwinMode = "latest" | "live" | "historical" | "simulation";

/** Stable, process-wide asset identifier. Future phases can add assets without
 * changing the selection/store contract. */
export type TwinAssetId = `asset:${string}`;

export const AERATION_TANK_ID = "asset:aeration-tank-1" as const satisfies TwinAssetId;

export type TwinMetricSource =
  | "manual-snapshot"
  | "sensor-telemetry"
  | "simulation"
  | "unavailable";

export type TwinMetricAcquisition =
  | "manual-daily-snapshot"
  | "sensor"
  | "simulation"
  | "unknown";

export type TwinMetricFreshness = "fresh" | "stale" | "unknown";

export interface TwinMetricProvenance {
  acquisition: TwinMetricAcquisition;
}

export interface TwinMetric<T> {
  value: T | null;
  source: TwinMetricSource;
  /** Exact observation timestamp when the source supplies one. A daily
   * reading_date is not a timestamp, so DashboardRow mapping leaves this null. */
  observedAt: string | null;
  provenance: TwinMetricProvenance;
  /** No age threshold exists yet; manual snapshots therefore stay unknown. */
  freshness: TwinMetricFreshness;
}

export interface AerationTankTelemetryValues {
  waterLevelPercent: number | null;
  aeratorRunning: boolean | null;
  dissolvedOxygenMgL: number | null;
  tdsMgL: number | null;
  temperatureC: number | null;
}

export interface AerationTankTwinAsset {
  id: TwinAssetId;
  type: "aeration-tank";
  label: string;
  waterLevelPercent: TwinMetric<number>;
  aeratorRunning: TwinMetric<boolean>;
  dissolvedOxygenMgL: TwinMetric<number>;
  tdsMgL: TwinMetric<number>;
  temperatureC: TwinMetric<number>;
}

export type TwinAssetState = AerationTankTwinAsset;

export type WastewaterTwinAssets = Readonly<
  { [AERATION_TANK_ID]: AerationTankTwinAsset } &
    Partial<Record<TwinAssetId, TwinAssetState>>
>;

export interface WastewaterTwinState {
  mode: TwinMode;
  snapshotDate: string | null;
  assets: WastewaterTwinAssets;
}

/** Extend this map when a new asset type gains its own simulation contract. */
export interface TwinSimulationValuesByAssetType {
  "aeration-tank": AerationTankTelemetryValues;
}

export type TwinSimulatableAssetType = keyof TwinSimulationValuesByAssetType;

export type TwinSimulationOverride<
  TAssetType extends TwinSimulatableAssetType = TwinSimulatableAssetType,
> = {
  [K in TAssetType]: {
    assetId: TwinAssetId;
    assetType: K;
    values: Partial<TwinSimulationValuesByAssetType[K]>;
  };
}[TAssetType];

export type TwinSimulationOverrides = Readonly<
  Partial<Record<TwinAssetId, TwinSimulationOverride>>
>;
