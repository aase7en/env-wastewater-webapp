import { describe, expect, it } from "vitest";

import type { GarbageLog } from "../garbage";
import type { RollupRow, RollupSummary } from "../carbon-rollup";
import {
  deriveFamilyStates,
  deriveTverReadiness,
  FAMILY_ORDER,
  READINESS_DOM_STATUS_UNAVAILABLE,
} from "./family-state";

// Models the real-world rollup: only electricity carries rows today
// (001A A–K). Rows are explicit so family-local derivations cannot hide
// behind the rollup-wide grandTotalKg shorthand (001B R3 P2 finding).
const ELECTRICITY_ROWS: RollupRow[] = [
  { month: "2026-09-01", scope: 2, source: "electricity", kg_co2e: 800, row_count: 450 },
  { month: "2026-08-01", scope: 2, source: "electricity", kg_co2e: 434.5, row_count: 457 },
];

function rollup(overrides: Partial<RollupSummary> = {}): RollupSummary {
  return {
    rows: ELECTRICITY_ROWS,
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

  it("electricity card carries the known-only flag when ITS rows carry NULL kg", () => {
    // 001B: per-family semantics — the flag describes the card's own subtotal,
    // not the rollup-wide hasUnavailableContribution shorthand.
    const withNull = deriveFamilyStates(
      rollup({
        rows: [
          { month: "2026-09-01", scope: 2, source: "electricity", kg_co2e: 800, row_count: 450 },
          { month: "2026-08-01", scope: 2, source: "electricity", kg_co2e: null, row_count: 457 },
        ],
      }),
      [],
    );
    expect(withNull.find((s) => s.family === "electricity")?.knownOnlyTotal).toBe(true);

    const noNulls = deriveFamilyStates(rollup({ hasUnavailableContribution: true }), []);
    // Polarity pin: another family's unavailable contribution does not make
    // the electricity subtotal incomplete.
    expect(noNulls.find((s) => s.family === "electricity")?.knownOnlyTotal).toBe(false);
  });
});

describe("deriveFamilyStates — 001B follow-up repairs (RED-first)", () => {
  it("waste CONTRIBUTING labels the waste-family subtotal, never the grand total", () => {
    const states = deriveFamilyStates(
      rollup({
        rows: [
          ...ELECTRICITY_ROWS,
          { month: "2026-09-01", scope: 3, source: "waste_general", kg_co2e: 50, row_count: 30 },
          { month: "2026-09-01", scope: 3, source: "waste_recyclable", kg_co2e: 30, row_count: 5 },
        ],
        grandTotalKg: 1314.5,
      }),
      [],
    );
    const waste = states.find((s) => s.family === "waste");
    expect(waste?.state).toBe("CONTRIBUTING");
    expect(waste?.valueLabel).toBe("80");
    expect(waste?.valueLabel).not.toContain("1314.5");
    // The symmetric fix: electricity labels its own subtotal too.
    const electricity = states.find((s) => s.family === "electricity");
    expect(electricity?.valueLabel).toBe("1234.5");
    expect(electricity?.valueLabel).not.toContain("1314.5");
  });

  it("waste-only contribution leaves electricity UNAVAILABLE, never numeric", () => {
    const states = deriveFamilyStates(
      rollup({
        rows: [
          { month: "2026-09-01", scope: 3, source: "waste_infectious", kg_co2e: 60, row_count: 4 },
        ],
        grandTotalKg: 60,
      }),
      [],
    );
    const waste = states.find((s) => s.family === "waste");
    expect(waste?.state).toBe("CONTRIBUTING");
    expect(waste?.valueLabel).toBe("60");
    const electricity = states.find((s) => s.family === "electricity");
    expect(electricity?.state).toBe("UNAVAILABLE");
    expect(electricity?.valueLabel).toContain("ไม่มีข้อมูล");
    expect(electricity?.valueLabel).not.toMatch(/\d/);
  });

  it("waste_infectious kg counts toward the waste family (SOURCE_FAMILY coverage)", () => {
    const states = deriveFamilyStates(
      rollup({
        rows: [
          { month: "2026-09-01", scope: 3, source: "waste_infectious", kg_co2e: 25, row_count: 3 },
        ],
        grandTotalKg: 25,
      }),
      [],
    );
    expect(states.find((s) => s.family === "waste")?.state).toBe("CONTRIBUTING");
  });

  it("waste_unclassified NULL kg marks the waste subtotal known-only, never 0", () => {
    const states = deriveFamilyStates(
      rollup({
        rows: [
          { month: "2026-09-01", scope: 3, source: "waste_general", kg_co2e: 40, row_count: 20 },
          { month: "2026-09-01", scope: 3, source: "waste_unclassified", kg_co2e: null, row_count: 2 },
        ],
        grandTotalKg: 40,
        hasUnavailableContribution: true,
      }),
      [],
    );
    const waste = states.find((s) => s.family === "waste");
    expect(waste?.state).toBe("CONTRIBUTING");
    expect(waste?.valueLabel).toBe("40");
    expect(waste?.valueLabel).not.toContain("0.000");
    expect(waste?.knownOnlyTotal).toBe(true);
  });

  it("pinned DOM readiness status constant exists and stays the page attribute value", () => {
    expect(READINESS_DOM_STATUS_UNAVAILABLE).toBe("UNAVAILABLE");
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

  it("electricity documentation derives from electricity rows, not the grand total", () => {
    // 001B basis fix: a waste-only rollup must not document electricity.
    const items = deriveTverReadiness(
      rollup({
        rows: [
          { month: "2026-09-01", scope: 3, source: "waste_infectious", kg_co2e: 60, row_count: 4 },
        ],
        grandTotalKg: 60,
      }),
      [],
    );
    const electricity = items.find((i) => i.input.includes("ไฟฟ้า"));
    expect(electricity?.status).toBe("ABSENT");
    // An applied factor exists (non-NULL kg on a real row) → factor PARTIAL.
    const factor = items.find((i) => i.input.includes("per-source"));
    expect(factor?.status).toBe("PARTIAL");
  });

  it("factor status is ABSENT when every row has NULL kg (no applied factor)", () => {
    const items = deriveTverReadiness(
      rollup({
        rows: [
          { month: "2026-09-01", scope: 2, source: "electricity", kg_co2e: null, row_count: 450 },
        ],
        grandTotalKg: 0,
      }),
      [],
    );
    const factor = items.find((i) => i.input.includes("per-source"));
    expect(factor?.status).toBe("ABSENT");
    const electricity = items.find((i) => i.input.includes("ไฟฟ้า"));
    expect(electricity?.status).toBe("ABSENT");
  });

  it("no eligibility/status/credit/registration fields exist anywhere", () => {
    const items = deriveTverReadiness(rollup(), []);
    const serialized = JSON.stringify(items);
    expect(serialized).not.toMatch(/eligib|credit|เครดิต|สิทธิ์|registration|จดทะเบียน|qualified/i);
  });
});
