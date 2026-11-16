/**
 * ENV-PARITY-P1-007 — the parameterized AppSheet-parity unit suite (P1.7).
 *
 * Consumes the fixture tables in ./parity-fixtures (WO §3.2/§3.3) and
 * asserts the ENV-facing surfaces that live in THIS process:
 *   - fixture-data integrity: every case cites its reference-doc-12 line;
 *     divergence cases carry a note naming a pinned divergence kind (§7
 *     divergence honesty); the SQL-exercised id registry is complete.
 *   - family factor-1.2 (§2.3) executes HERE against the SHIPPED lib:
 *     REPORT_CHLORINE_LITTER_FACTOR (named, provenance-carried) and the
 *     report builders that multiply the view-computed sums ×1.2 — the
 *     client only aggregates view values, never re-derives view math.
 *   - the AppSheet mix enum (ref 750–761) is pinned against form-parity.
 *   - estimate-flag vocabulary (§2.5) is pinned against report-summary /
 *     water-supply-parity + a source-scan pin that NO ×8 Water_In
 *     replication exists anywhere in the shipped parity libs
 *     (RECORDED-NOT-REPLICATED, P1.5 D1-5).
 *
 * meter-chain / chlorine / thresholds / estimates SQL semantics are NOT
 * importable into vitest — they run in
 * scripts/test_parity_p1_007_fixtures_sql.py (rollback-smoke, P1.2/P1.3
 * precedent) against the SAME case ids (D1-3: zero lib test-export
 * touches; every existing lib file here is READ-ONLY).
 *
 * RED disclosure (D2, recorded honestly): these pins run against surfaces
 * that ALREADY exist (P1.4–P1.6) — they are pass-by-design, never claimed
 * as RED. The truthful RED evidence for this lane is (a) this suite's
 * fail-to-collect before parity-fixtures.ts existed and (b) the SQL
 * suite's façade-group failure pre-apply (see the handoff D-phase log).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ALL_PARITY_CASES,
  CHLORINE_DIVSWITCH_CASES,
  DIVERGENCE_KINDS,
  ESTIMATE_CASES,
  FACTOR_12_CASES,
  GROUNDWATER_CHLORINE_CASES,
  METER_CHAIN_CASES,
  SQL_EXERCISED_CASE_IDS,
  STREAK_CASES,
  THRESHOLD_SEED_CASES,
} from "./parity-fixtures";

import {
  ENERGY_DELTA_PROVENANCE,
  FLAG_PUMP_HOURS_ESTIMATE,
  FLAG_SPEC_ESTIMATE,
  REPORT_CHLORINE_LITTER_FACTOR,
  buildWastewaterSummary,
  buildWaterSupplySummary,
  type ReportMeterChainRow,
  type ReportWaterChainRow,
} from "./report-summary";

import { MIX_RATIO_DEFAULT, MIX_RATIO_OPTIONS } from "./form-parity";

// ─── fixture-data integrity (meta-pins, every family) ───────────────────────

describe("parity fixture tables — citation completeness (WO §7)", () => {
  it("every case carries a non-empty ref citation citing reference doc 12", () => {
    expect(ALL_PARITY_CASES.length).toBeGreaterThan(0);
    for (const c of ALL_PARITY_CASES) {
      expect(c.ref, `${c.id} must cite its reference line`).toBeTruthy();
      expect(c.ref.length, `${c.id} ref must be substantive`).toBeGreaterThan(10);
    }
  });

  it("case ids are unique across all families", () => {
    const ids = ALL_PARITY_CASES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every divergence case carries a note naming a pinned divergence kind", () => {
    const divergent = ALL_PARITY_CASES.filter((c) => c.divergence !== undefined);
    expect(divergent.length).toBeGreaterThan(0);
    for (const c of divergent) {
      const named = DIVERGENCE_KINDS.filter((k) => c.divergence?.includes(k));
      expect(
        named.length,
        `${c.id} divergence note must name one of the pinned kinds`,
      ).toBeGreaterThan(0);
    }
  });

  it("the SQL-exercised id registry mirrors exactly the SQL-semantics cases", () => {
    // factor-1.2 runs in vitest (this file); everything else runs in SQL.
    const vitestOnly = FACTOR_12_CASES.map((c) => c.id);
    const sqlSide = ALL_PARITY_CASES.map((c) => c.id).filter(
      (id) => !vitestOnly.includes(id),
    );
    expect([...SQL_EXERCISED_CASE_IDS].sort()).toEqual([...sqlSide].sort());
  });

  it("covers all five WO §2 families", () => {
    const families = new Set(ALL_PARITY_CASES.map((c) => c.family));
    expect([...families].sort()).toEqual(
      [
        "chlorine",
        "estimates",
        "factor-1.2",
        "meter-chain",
        "thresholds",
      ].sort(),
    );
  });
});

// ─── §2.2 chlorine: the AppSheet mix enum (form-parity pin) ─────────────────

describe("chlorine mix enum verbatim (ref 750–761)", () => {
  it("MIX_RATIO_OPTIONS is exactly the AppSheet enum 1:2 / 1:4 / 1:9", () => {
    expect([...MIX_RATIO_OPTIONS]).toEqual(["1:2", "1:4", "1:9"]);
  });

  it("the AppSheet init value =1:4 is the UI create-only default (ref 756)", () => {
    expect(MIX_RATIO_DEFAULT).toBe("1:4");
  });

  it("÷SWITCH cases cover every enum value + the NULL (unknown) branch", () => {
    const ratios = CHLORINE_DIVSWITCH_CASES.map((c) => c.chlorineMixRatio);
    expect(ratios).toContain("1:2");
    expect(ratios).toContain("1:4");
    expect(ratios).toContain("1:9");
    expect(ratios).toContain(null);
    for (const c of CHLORINE_DIVSWITCH_CASES) {
      // unknown ≠ 0: the NULL-mix branch expects NULL, never 0 (ref 762–767
      // default branch "" + P1.1 DB CHECK admits only 1:2/1:4/1:9 or NULL).
      if (c.chlorineMixRatio === null) {
        expect(c.expectedChlorineUsedReal).toBeNull();
      } else {
        const divisor = Number(c.chlorineMixRatio.split(":")[1]);
        expect(c.expectedChlorineUsedReal).toBeCloseTo(
          c.chlorineUsed / divisor,
          10,
        );
      }
    }
  });

  it("groundwater cases pin the spec-derived ÷(1+9) result, never a hardcoded 10", () => {
    const withUsage = GROUNDWATER_CHLORINE_CASES.filter(
      (c) => c.chlorineUsage !== null,
    );
    expect(withUsage.length).toBeGreaterThan(0);
    for (const c of withUsage) {
      // chlorine_mix_groundwater seed: mix parts 1 + 9 = 10 total parts
      // (P1.5 D1-4 ruling; the AppSheet-verbatim ÷10, ref 2665–2671, is
      // recorded in the case's ref — the assertion is the spec-derived value).
      expect(c.expectedChlorineUsageRealy).toBeCloseTo(c.chlorineUsage! / 10, 10);
      expect(JSON.stringify(c.divergence)).toContain("÷(1+9)");
    }
    // NULL usage stays NULL (unknown ≠ 0).
    const nullCase = GROUNDWATER_CHLORINE_CASES.find(
      (c) => c.chlorineUsage === null,
    );
    expect(nullCase?.expectedChlorineUsageRealy).toBeNull();
  });
});

// ─── §2.3 ×1.2 factors (executed against the shipped report lib) ────────────

describe("×1.2 chlorine-litter factor (ref 1949 / 2849, D1-3 named constant)", () => {
  it("is the named constant REPORT_CHLORINE_LITTER_FACTOR = 1.2 (never a magic literal)", () => {
    expect(REPORT_CHLORINE_LITTER_FACTOR).toBe(1.2);
    // Provenance travels with the constant's doc comment (ref 1949/2849).
    const src = readFileSync(path.join(__dirname, "report-summary.ts"), "utf8");
    expect(src).toContain("ref 1944–1950");
    expect(src).toContain("ref 2844–2850");
  });

  for (const c of FACTOR_12_CASES) {
    it(`${c.id} (${c.side}): sum(chlorineReal) × 1.2 = ${c.expectedFactor12} — AppSheet verbatim [sum]*1.2`, () => {
      if (c.side === "wastewater-W/V") {
        // buildWastewaterSummary multiplies the VIEW-computed real-chlorine
        // sum by the named constant — never re-derives the ÷SWITCH math.
        const chain: ReportMeterChainRow[] = c.chlorineRealValues.map(
          (v, i) => ({
            id: `f12-${c.id}-${i}`,
            reading_date: `2099-01-${String(i + 1).padStart(2, "0")}`,
            delta_kwh: null,
            pump1_m3: null,
            pump2_m3: null,
            chlorine_used_real: v,
            meter_boundary_flag: false,
            meter_boundary_reason: null,
            spec_missing: false,
            spec_missing_kinds: null,
          }),
        );
        const ww = buildWastewaterSummary({
          startISO: "2099-01-01",
          endISO: "2099-01-31",
          readings: [],
          chain,
        });
        const sum = c.chlorineRealValues.reduce<number>(
          (a, v) => a + (v ?? 0),
          0,
        );
        expect(ww.sumChlorineReal).toBeCloseTo(sum, 10);
        expect(ww.chlorineLitter).toBeCloseTo(c.expectedFactor12, 10);
        expect(ww.chlorineLitter).toBeCloseTo(sum * REPORT_CHLORINE_LITTER_FACTOR, 10);
      } else {
        const chain: ReportWaterChainRow[] = c.chlorineRealValues.map(
          (v, i) => ({
            id: `f12-${c.id}-${i}`,
            check_date: `2099-01-${String(i + 1).padStart(2, "0")}`,
            hour_work: null,
            water_in: null,
            water_in_estimate: null,
            chlorine_usage_realy: v,
            energy_use_estimate: null,
            hour_boundary_flag: false,
            spec_missing: false,
            spec_missing_kinds: null,
          }),
        );
        const ws = buildWaterSupplySummary({
          startISO: "2099-01-01",
          endISO: "2099-01-31",
          chain,
        });
        const sum = c.chlorineRealValues.reduce<number>(
          (a, v) => a + (v ?? 0),
          0,
        );
        expect(ws.sumChlorineReal).toBeCloseTo(sum, 10);
        expect(ws.kgChlorine).toBeCloseTo(c.expectedFactor12, 10);
        expect(ws.kgChlorine).toBeCloseTo(sum * REPORT_CHLORINE_LITTER_FACTOR, 10);
      }
    });
  }
});

// ─── §2.5 estimate vocabulary + the ×8 RECORDED-NOT-REPLICATED pin ──────────

describe("estimate-flag vocabulary + no ×8 Water_In replication (ref 2547–2553)", () => {
  it("the P1.5 verbatim estimate flags are the shipped vocabulary", () => {
    expect(FLAG_SPEC_ESTIMATE).toBe("ค่าประมาณจากสเปก");
    expect(FLAG_PUMP_HOURS_ESTIMATE).toBe("ประมาณจากชั่วโมงปั๊ม");
  });

  it("ES cases: the ×8 AppSheet formula is RECORDED (in refs), never asserted as ENV output", () => {
    const waterInCases = ESTIMATE_CASES.filter((c) =>
      c.ref.includes("[Hour_Work]*8"),
    );
    expect(waterInCases.map((c) => c.id)).toContain("ES-03");
    for (const c of waterInCases) {
      expect(JSON.stringify(c.divergence)).toContain("RECORDED-NOT-REPLICATED");
      // The ENV corrected expectation is NULL + flag when no flow is
      // seeded — never the ×8 value, never 0.
      expect(c.expected.waterInEstimate).toBeNull();
      expect(c.expected.specMissing).toBe(true);
    }
  });

  it("energy cases pin the ×3.7 spec-derived result and honest boundary NULLs", () => {
    const energyCases = ESTIMATE_CASES.filter(
      (c) => c.expected.energyUseEstimate !== null,
    );
    for (const c of energyCases) {
      expect(c.expected.energyUseEstimate).toBeCloseTo(
        c.expected.hourWork! * 3.7,
        10,
      );
    }
    // Boundary cases are NULL + flagged — never 0, never negative.
    for (const c of ESTIMATE_CASES) {
      if (c.expected.energyUseEstimate === null && c.expected.hourWork === null) {
        expect(c.expected.hourBoundaryFlag).toBe(true);
      }
    }
    expect(JSON.stringify(ESTIMATE_CASES.find((c) => c.id === "ES-01")?.divergence)).toContain(
      "negative→0 NOT replicated",
    );
  });

  it("meter-chain cases: reset/boundary deltas are NULL + flagged, never 0 or negative (§2.1-2)", () => {
    for (const c of METER_CHAIN_CASES) {
      const e = c.expected;
      if (e.pump1Hours === null && c.pump1Meter !== null) {
        expect(e.meterBoundaryFlag).toBe(true);
      }
      if (e.pump2Hours === null && c.pump2Meter !== null) {
        expect(e.meterBoundaryFlag, `${c.id} pump2`).toBe(true);
      }
      for (const [k, v] of Object.entries(e)) {
        if (typeof v === "number") {
          expect(v, `${c.id}.${k} must never be negative`).toBeGreaterThanOrEqual(0);
        }
      }
    }
    expect(JSON.stringify(METER_CHAIN_CASES.find((c) => c.id === "MC-04")?.divergence)).toContain(
      "LAG-vs-global-MAX",
    );
  });

  it("streak cases pin both the hit and the honest-break semantics (§2.4)", () => {
    const byExpectation = STREAK_CASES.reduce<Record<string, number>>(
      (acc, c) => {
        acc[String(c.expectedFlag)] = (acc[String(c.expectedFlag)] ?? 0) + 1;
        return acc;
      },
      {},
    );
    // Both polarities must exist (no assertion weakening).
    expect(byExpectation["true"]).toBeGreaterThan(0);
    expect(byExpectation["false"]).toBeGreaterThan(0);
    // The missing-day and NULL-day break cases are explicitly pinned.
    expect(
      STREAK_CASES.some((c) => c.scenario.includes("MISSING")),
    ).toBe(true);
    expect(
      STREAK_CASES.some((c) => c.id === "TH-05" && c.expectedFlag === false),
    ).toBe(true);
    // Immediate conditions exist for BOTH window polarities (sv30 + water_in).
    expect(STREAK_CASES.find((c) => c.id === "TH-12")?.expectedFlag).toBe(true);
    expect(STREAK_CASES.find((c) => c.id === "TH-13")?.expectedFlag).toBe(true);
    expect(STREAK_CASES.find((c) => c.id === "TH-14")?.expectedFlag).toBe(false);
    expect(STREAK_CASES.find((c) => c.id === "TH-16")?.expectedFlag).toBe(false);
  });

  it("the 8 threshold seeds are pinned with verbatim min/max sides", () => {
    expect(THRESHOLD_SEED_CASES.length).toBe(8);
    expect(THRESHOLD_SEED_CASES.map((c) => c.parameterCode).sort()).toEqual(
      [
        "do1",
        "do2",
        "do3",
        "free_chlorine",
        "ph",
        "sv30",
        "tds2",
        "wastewater_in",
      ].sort(),
    );
    const byCode = Object.fromEntries(
      THRESHOLD_SEED_CASES.map((c) => [c.parameterCode, c]),
    );
    expect(byCode.do1.minValue).toBeNull();
    expect(byCode.do1.maxValue).toBe(1);
    expect(byCode.do3.maxValue).toBe(1.5);
    expect(byCode.free_chlorine.minValue).toBe(0.5);
    expect(byCode.free_chlorine.maxValue).toBe(1);
    expect(byCode.ph.minValue).toBe(5);
    expect(byCode.ph.maxValue).toBe(9);
    expect(byCode.tds2.minValue).toBe(1000);
    expect(byCode.tds2.maxValue).toBeNull();
    expect(byCode.sv30.minValue).toBe(150);
    expect(byCode.sv30.maxValue).toBe(450);
    expect(byCode.wastewater_in.minValue).toBe(70);
    expect(byCode.wastewater_in.maxValue).toBeNull();
  });
});

// ─── shipped-lib hygiene pins (source-scan precedent, P1.6) ─────────────────

describe("parity-lib hygiene (no silent replication)", () => {
  it("no Water_In ×8 replication exists in the shipped parity libs", () => {
    for (const f of ["report-summary.ts", "water-supply-parity.ts"]) {
      const src = readFileSync(path.join(__dirname, f), "utf8");
      // The estimate path multiplies by spec values; a literal ×8 replication
      // of ref 2547–2553 would appear as "* 8" / "*8" arithmetic. Documented
      // mentions inside comments are excluded by asserting on the exact
      // arithmetic token only.
      expect(src).not.toMatch(/\*\s*8\b/);
    }
  });

  it("report-summary carries no chlorine ÷SWITCH re-derivation (view math stays in the view)", () => {
    const src = readFileSync(path.join(__dirname, "report-summary.ts"), "utf8");
    expect(src).not.toMatch(/SWITCH\s*\(/);
    expect(src).not.toContain("chlorine_used /");
    expect(ENERGY_DELTA_PROVENANCE).toContain("delta");
  });
});
