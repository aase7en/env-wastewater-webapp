import type { DashboardRow } from "../types";
import {
  AERATION_TANK_ID,
  type AerationTankTwinAsset,
  type TwinMetric,
  type TwinMode,
  type WastewaterTwinState,
} from "./types";

function finiteNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function dashboardMetric(value: number | string | null | undefined): TwinMetric<number> {
  const parsed = finiteNumber(value);
  return parsed === null
    ? unavailableMetric<number>()
    : {
        value: parsed,
        source: "manual-snapshot",
        observedAt: null,
        provenance: { acquisition: "manual-daily-snapshot" },
        freshness: "unknown",
      };
}

function unavailableMetric<T>(): TwinMetric<T> {
  return {
    value: null,
    source: "unavailable",
    observedAt: null,
    provenance: { acquisition: "unknown" },
    freshness: "unknown",
  };
}

const unavailableNumber = (): TwinMetric<number> => unavailableMetric<number>();
const unavailableBoolean = (): TwinMetric<boolean> => unavailableMetric<boolean>();

/**
 * Converts the latest/historical React Query row into a render snapshot.
 * DashboardRow intentionally has no tank level, temperature, or aerator flag;
 * those stay unknown rather than being inferred from unrelated fields.
 */
export function dashboardRowToTwinState(
  row: DashboardRow | undefined,
  mode: Exclude<TwinMode, "simulation" | "live"> = "latest",
): WastewaterTwinState {
  const aerationTank: AerationTankTwinAsset = {
    id: AERATION_TANK_ID,
    type: "aeration-tank",
    label: "ถังเติมอากาศ",
    waterLevelPercent: unavailableNumber(),
    aeratorRunning: unavailableBoolean(),
    // DashboardRow.do_average is a plant-wide derived average, not a direct
    // Aeration Tank observation. Keep the asset-specific DO unknown until
    // a truthful Aeration measurement source is available.
    dissolvedOxygenMgL: unavailableNumber(),
    tdsMgL: dashboardMetric(row?.tds_aeration),
    temperatureC: unavailableNumber(),
  };

  return {
    mode,
    snapshotDate: row?.reading_date ?? null,
    assets: { [AERATION_TANK_ID]: aerationTank },
  };
}
