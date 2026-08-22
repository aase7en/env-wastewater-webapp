import { AERATION_TANK_ID, type TwinSimulationOverrides } from "./types";

/** Clearly synthetic values used only by the visible simulation demo. */
export const AERATION_DEMO_OVERRIDES: TwinSimulationOverrides = {
  [AERATION_TANK_ID]: {
    assetId: AERATION_TANK_ID,
    assetType: "aeration-tank",
    values: {
      waterLevelPercent: 68,
      aeratorRunning: true,
      dissolvedOxygenMgL: 3.2,
      tdsMgL: 410,
      temperatureC: 29.4,
    },
  },
};
