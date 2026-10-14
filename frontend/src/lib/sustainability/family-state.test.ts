import { describe, expect, it } from "vitest";

import type { GarbageLog } from "../garbage";
import type { RollupSummary } from "../carbon-rollup";
import { deriveFamilyStates, deriveTverReadiness, FAMILY_ORDER } from "./family-state";

function rollup(overrides: Partial<RollupSummary> = {}): RollupSummary {
  return {
    rows: [],
    byScope: [],
    grandTotalKg: 1234.5,
    incompleteSources: ["diesel", "gasoline", "lpg", "garden_fuel", "waste", "chemical"],
    unavailableSources: [],
    hasUnavailableContribution: false,
    ...overrides,
  } as RollupSummary;
}

describe("deriveFamilyStates — WC001 D1 truth table", () => {
  it("family order is fixed and includes Plastic as an explicit family", () => {
    expect(FAMILY_ORDER).toEqual([
      "electricity",
      "fuel",
      "garden_fuel",
      "waste",
      "chemical",
      "plastic",
    ]);
  });

  it("electricity with rollup rows → CONTRIBUTING with LATEST numbers", () => {
    const states = deriveFamilyStates(
      rollup({ incompleteSources: ["diesel", "gasoline", "lpg", "garden_fuel", "waste", "chemical"] }),
      [],
    );
    const electricity = states.find((s) => s.family === "electricity");
    expect(electricity?.state).toBe("CONTRIBUTING");
    expect(electricity?.valueLabel).toContain("1234.5");
    expect(electricity?.badge).toBe("LATEST");
  });

  it("0-row families → UNAVAILABLE with ไม่มีข้อมูล, never a number", () => {
    const states = deriveFamilyStates(rollup(), []);
    for (const family of ["fuel", "garden_fuel", "waste", "chemical"] as const) {
      const s = states.find((x) => x.family === family);
      expect(s?.state).toBe("UNAVAILABLE");
      expect(s?.valueLabel).toContain("ไม่มีข้อมูล");
      expect(s?.valueLabel).not.toMatch(/\d/);
    }
  });

  it("plastic is ABSENT — never derived from garbage rows or waste_recyclable", () => {
    const garbageRow = {
      id: "g1",
      log_date: "2026-10-01",
      segregation_type: "waste_recyclable",
      weight_kg: 55,
    } as unknown as GarbageLog;
    const states = deriveFamilyStates(rollup(), [garbageRow]);
    const plastic = states.find((s) => s.family === "plastic");
    expect(plastic?.state).toBe("ABSENT");
    expect(plastic?.valueLabel).toContain("ไม่มีข้อมูล");
    // ABSENT even when garbage rows exist — recyclable ≠ plastic
    expect(plastic?.state).not.toBe("CONTRIBUTING");
  });

  it("waste with garbage rows shows segregation summary, not fabricated carbon", () => {
    const rows = [
      { segregation_type: "waste_recyclable", weight_kg: 10 },
      { segregation_type: "waste_chemical", weight_kg: 5 },
      { segregation_type: null, weight_kg: 3 },
    ] as unknown as GarbageLog[];
    const states = deriveFamilyStates(rollup(), rows);
    const waste = states.find((s) => s.family === "waste");
    expect(waste?.detail?.segregation).toBeDefined();
    expect(waste?.state).toBe("UNAVAILABLE"); // carbon contribution still unavailable
    expect(waste?.detail?.segregation?.[0]?.label).toContain("waste_recyclable");
  });

  it("sources with NULL-kg rows render UNAVAILABLE-contribution marker, not 0", () => {
    const states = deriveFamilyStates(
      rollup({ unavailableSources: ["waste"], hasUnavailableContribution: true }),
      [],
    );
    const waste = states.find((s) => s.family === "waste");
    expect(waste?.contribution).toBe("UNAVAILABLE");
    expect(waste?.valueLabel).not.toContain("0.000");
  });

  it("grand total carries the known-only flag when hasUnavailableContribution", () => {
    const states = deriveFamilyStates(
      rollup({ hasUnavailableContribution: true }),
      [],
    );
    expect(states.find((s) => s.family === "electricity")?.knownOnlyTotal).toBe(true);
  });
});

describe("deriveTverReadiness — readiness-only, never eligibility", () => {
  it("items expose DOCUMENTED/ABSENT status only", () => {
    const items = deriveTverReadiness(rollup(), []);
    expect(items.length).toBeGreaterThanOrEqual(4);
    for (const item of items) {
      expect(["DOCUMENTED", "ABSENT", "PARTIAL"]).toContain(item.status);
    }
    const electricity = items.find((i) => i.input.includes("ไฟฟ้า"));
    expect(electricity?.status).toBe("DOCUMENTED");
  });

  it("no eligibility/status/credit/registration fields exist anywhere", () => {
    const items = deriveTverReadiness(rollup(), []);
    const serialized = JSON.stringify(items);
    expect(serialized).not.toMatch(/eligib|credit|เครดิต|สิทธิ์|registration|จดทะเบียน|qualified/i);
  });
});
