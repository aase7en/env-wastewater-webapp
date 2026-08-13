import { afterEach, describe, expect, it } from "vitest";
import { AERATION_DEMO_OVERRIDES } from "./demo-state";
import { dashboardRowToTwinState } from "./dashboard-adapter";
import { deriveWastewaterTwinState } from "./selectors";
import { resetTwinStore, useTwinStore } from "./store";
import { AERATION_TANK_ID } from "./types";

describe("wastewater twin domain", () => {
  afterEach(resetTwinStore);

  it("maps only telemetry that DashboardRow actually supplies", () => {
    const state = dashboardRowToTwinState({
      reading_date: "2026-08-14",
      do_average: "2.75",
      tds_aeration: 432,
      system_operating: true,
      wastewater_in: 15,
    });
    const tank = state.assets[AERATION_TANK_ID];
    expect(tank).toBeDefined();
    if (!tank) throw new Error("Aeration tank asset missing");

    expect(state.snapshotDate).toBe("2026-08-14");
    expect(tank.dissolvedOxygenMgL).toEqual({ value: 2.75, source: "manual-snapshot" });
    expect(tank.tdsMgL).toEqual({ value: 432, source: "manual-snapshot" });
    expect(tank.aeratorRunning).toEqual({ value: null, source: "unavailable" });
    expect(tank.waterLevelPercent).toEqual({ value: null, source: "unavailable" });
    expect(tank.temperatureC).toEqual({ value: null, source: "unavailable" });
  });

  it("rejects invalid dashboard numbers instead of leaking NaN", () => {
    const tank = dashboardRowToTwinState({
      reading_date: "2026-08-14",
      do_average: "not-a-number",
      tds_aeration: null,
    }).assets[AERATION_TANK_ID];
    expect(tank).toBeDefined();
    if (!tank) throw new Error("Aeration tank asset missing");

    expect(tank.dissolvedOxygenMgL.value).toBeNull();
    expect(tank.tdsMgL.value).toBeNull();
  });

  it("supports historical mode without changing mapping semantics", () => {
    const state = dashboardRowToTwinState({ reading_date: "2025-01-02" }, "historical");
    expect(state.mode).toBe("historical");
    expect(state.snapshotDate).toBe("2025-01-02");
  });

  it("applies explicitly labeled simulation values", () => {
    const state = deriveWastewaterTwinState(undefined, "simulation", AERATION_DEMO_OVERRIDES);
    const tank = state.assets[AERATION_TANK_ID];
    expect(tank).toBeDefined();
    if (!tank) throw new Error("Aeration tank asset missing");

    expect(state.mode).toBe("simulation");
    expect(tank.aeratorRunning).toEqual({ value: true, source: "simulation" });
    expect(tank.waterLevelPercent).toEqual({ value: 68, source: "simulation" });
    expect(tank.temperatureC.source).toBe("simulation");
  });

  it("keeps only interaction and simulation state in Zustand", () => {
    useTwinStore.getState().selectAsset(AERATION_TANK_ID);
    useTwinStore.getState().startSimulation(AERATION_DEMO_OVERRIDES);

    expect(useTwinStore.getState().selectedAssetId).toBe(AERATION_TANK_ID);
    expect(useTwinStore.getState().mode).toBe("simulation");
    expect("sourceRow" in useTwinStore.getState()).toBe(false);

    useTwinStore.getState().returnToLatest();
    expect(useTwinStore.getState().mode).toBe("live");
    expect(useTwinStore.getState().simulationOverrides).toEqual({});
  });
});
