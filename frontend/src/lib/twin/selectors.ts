import type { DashboardRow } from "../types";
import { dashboardRowToTwinState } from "./dashboard-adapter";
import {
  AERATION_TANK_ID,
  type AerationTankTelemetryValues,
  type AerationTankTwinAsset,
  type TwinMetric,
  type TwinMode,
  type TwinSimulationOverrides,
  type WastewaterTwinState,
} from "./types";

function simulatedMetric<T>(value: T | null | undefined, fallback: TwinMetric<T>): TwinMetric<T> {
  return value === undefined ? fallback : { value, source: "simulation" };
}

export function deriveWastewaterTwinState(
  row: DashboardRow | undefined,
  mode: TwinMode,
  simulationOverrides: TwinSimulationOverrides,
): WastewaterTwinState {
  const base = dashboardRowToTwinState(row, mode === "historical" ? "historical" : "live");
  if (mode !== "simulation") return base;

  const baseTank = base.assets[AERATION_TANK_ID];
  const overrides: Partial<AerationTankTelemetryValues> =
    simulationOverrides[AERATION_TANK_ID] ?? {};
  const tank: AerationTankTwinAsset = {
    ...baseTank,
    waterLevelPercent: simulatedMetric(overrides.waterLevelPercent, baseTank.waterLevelPercent),
    aeratorRunning: simulatedMetric(overrides.aeratorRunning, baseTank.aeratorRunning),
    dissolvedOxygenMgL: simulatedMetric(
      overrides.dissolvedOxygenMgL,
      baseTank.dissolvedOxygenMgL,
    ),
    tdsMgL: simulatedMetric(overrides.tdsMgL, baseTank.tdsMgL),
    temperatureC: simulatedMetric(overrides.temperatureC, baseTank.temperatureC),
  };

  return {
    ...base,
    mode: "simulation",
    assets: { ...base.assets, [AERATION_TANK_ID]: tank },
  };
}
