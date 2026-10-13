import { describe, expect, it } from "vitest";

import type { DashboardRow } from "../../../lib/types";
import {
  deriveCallouts,
  SEMANTIC_BADGE_LABELS_TH,
  type SemanticBadge,
} from "./callout-model";
import { dashboardRowToTwinState } from "../../../lib/twin/dashboard-adapter";
import { deriveWastewaterTwinState } from "../../../lib/twin/selectors";

function baseRow(overrides: Partial<DashboardRow> = {}): DashboardRow {
  return {
    reading_date: "2026-10-13",
    tds_aeration: "312",
    ...overrides,
  } as DashboardRow;
}

describe("deriveCallouts — semantic badge truth table (P003 D1 contract)", () => {
  it("derives a callout per asset metric, anchored to the stable asset id", () => {
    const state = dashboardRowToTwinState(baseRow(), "latest");
    const callouts = deriveCallouts(state);
    expect(callouts.length).toBeGreaterThan(0);
    for (const c of callouts) {
      expect(c.assetId).toBe("asset:aeration-tank-1");
      expect(c.metricKey).toBeTruthy();
      expect(c.metricLabel).toBeTruthy();
      expect(c.semanticBadge).toBeTruthy();
    }
  });

  it("manual-snapshot metric (tds present) → LATEST badge with truthful value", () => {
    const state = dashboardRowToTwinState(baseRow(), "latest");
    const tds = deriveCallouts(state).find((c) => c.metricKey === "tdsMgL");
    expect(tds).toBeDefined();
    expect(tds?.semanticBadge).toBe("LATEST");
    expect(tds?.valueLabel).toContain("312");
  });

  it("unavailable metric → UNAVAILABLE badge, value never coerced to a number", () => {
    const state = dashboardRowToTwinState(baseRow(), "latest");
    const do_ = deriveCallouts(state).find((c) => c.metricKey === "dissolvedOxygenMgL");
    expect(do_).toBeDefined();
    expect(do_?.semanticBadge).toBe("UNAVAILABLE");
    expect(do_?.valueLabel).not.toMatch(/\d/);
  });

  it("unavailable metric with no row at all → UNAVAILABLE, snapshot date null", () => {
    const state = dashboardRowToTwinState(undefined, "latest");
    const tds = deriveCallouts(state).find((c) => c.metricKey === "tdsMgL");
    expect(tds?.semanticBadge).toBe("UNAVAILABLE");
  });

  it("historical mode → HISTORICAL badge on manual-snapshot metrics", () => {
    const state = dashboardRowToTwinState(baseRow(), "historical");
    const tds = deriveCallouts(state).find((c) => c.metricKey === "tdsMgL");
    expect(tds?.semanticBadge).toBe("HISTORICAL");
  });

  it("simulation override → SIMULATED badge only on overridden metrics", () => {
    const state = deriveWastewaterTwinState(baseRow(), "simulation", {
      "asset:aeration-tank-1": {
        assetId: "asset:aeration-tank-1",
        assetType: "aeration-tank",
        values: { waterLevelPercent: 62 },
      },
    });
    const level = deriveCallouts(state).find((c) => c.metricKey === "waterLevelPercent");
    const tds = deriveCallouts(state).find((c) => c.metricKey === "tdsMgL");
    expect(level?.semanticBadge).toBe("SIMULATED");
    expect(level?.valueLabel).toContain("62");
    expect(tds?.semanticBadge).toBe("LATEST");
  });

  it("freshness=stale overrides display badge to STALE", () => {
    const state = dashboardRowToTwinState(baseRow(), "latest");
    const staleState = {
      ...state,
      assets: {
        ...state.assets,
        "asset:aeration-tank-1": {
          ...state.assets["asset:aeration-tank-1"],
          tdsMgL: { ...state.assets["asset:aeration-tank-1"].tdsMgL, freshness: "stale" as const },
        },
      },
    };
    const tds = deriveCallouts(staleState).find((c) => c.metricKey === "tdsMgL");
    expect(tds?.semanticBadge).toBe("STALE");
  });

  it("sensor-telemetry while mode=live → LIVE badge", () => {
    const state = dashboardRowToTwinState(baseRow(), "latest");
    const liveState = {
      mode: "live" as const,
      snapshotDate: state.snapshotDate,
      assets: {
        ...state.assets,
        "asset:aeration-tank-1": {
          ...state.assets["asset:aeration-tank-1"],
          dissolvedOxygenMgL: {
            value: 4.2,
            source: "sensor-telemetry" as const,
            observedAt: "2026-10-13T09:00:00Z",
            provenance: { acquisition: "sensor" as const },
            freshness: "fresh" as const,
          },
        },
      },
    };
    const do_ = deriveCallouts(liveState).find((c) => c.metricKey === "dissolvedOxygenMgL");
    expect(do_?.semanticBadge).toBe("LIVE");
  });

  it("every badge value has a Thai label (color stays secondary)", () => {
    const badges: SemanticBadge[] = [
      "LIVE",
      "LATEST",
      "HISTORICAL",
      "SIMULATED",
      "STALE",
      "UNAVAILABLE",
    ];
    for (const b of badges) {
      expect(SEMANTIC_BADGE_LABELS_TH[b]).toBeTruthy();
    }
  });

  it("each callout carries an evidence detail destination", () => {
    const state = dashboardRowToTwinState(baseRow(), "latest");
    for (const c of deriveCallouts(state)) {
      expect(c.detailDestination).toBeTruthy();
    }
  });
});
