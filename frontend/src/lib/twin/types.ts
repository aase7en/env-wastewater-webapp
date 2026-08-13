export type TwinMode = "live" | "historical" | "simulation";

/** Stable, process-wide asset identifier. Future phases can add assets without
 * changing the selection/store contract. */
export type TwinAssetId = `asset:${string}`;

export const AERATION_TANK_ID = "asset:aeration-tank-1" as const satisfies TwinAssetId;

export type TwinMetricSource = "manual-snapshot" | "simulation" | "unavailable";

export interface TwinMetric<T> {
  value: T | null;
  source: TwinMetricSource;
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

export type TwinSimulationOverrides = Readonly<
  Partial<Record<TwinAssetId, Partial<AerationTankTelemetryValues>>>
>;
