/**
 * ENV-PARITY-P1-006 — unit tests for the pure report-summary lib
 * (reference doc 12 §3.7 ตาราง Filter_Water ref 1544–2383 + §3.10
 *  tap water_Filter ref 2708–2960 + §5 findings — pinned per WO §2).
 *
 * Pins VERBATIM:
 *   - range sums over non-NULL RECORDED values only (ref 1685–1779):
 *     Sum_Energy (chain delta_kwh, P1.2), Sum_waste_water (recorded
 *     wastewater_in), Sum_Chlorine (recorded chlorine_used), useage_Chlorine
 *     (chain chlorine_used_real), Sum_excess sludge (excess_sludge_removed)
 *   - `W/V_Chlorine Litter` = [useage_Chlorine]*1.2 (ref 1949) and
 *     `Kg_chlorine` = [Sum_Chlorine_use]*1.2 (ref 2849) — the ×1.2 factors
 *     as the NAMED display constant REPORT_CHLORINE_LITTER_FACTOR (D1-3),
 *     displayed on its own line, never folded into the sums
 *   - averages with REAL denominators (WO §2.4-1: days-with-value only;
 *     DO-1/2/3, pH, TDS-1/2, SV30, FreeCl)
 *   - calendar missing-day honesty (WO §2.4-1): มีบันทึก X / ไม่มีบันทึก Y
 *     per side; missing days contribute NOTHING (never 0-fill)
 *   - VC_CY_01..12 monthly energy breakdown (ref 1964–2126): month not
 *     reached OR no records → NULL (the AppSheet "null" honesty) — NEVER 0
 *   - estimate-flag propagation (WO §2.4-2, P1.5 verbatim labels):
 *     "ค่าประมาณจากสเปก" for spec-derived (ปริมาณสูบ, น้ำประปา energy),
 *     "ประมาณจากชั่วโมงปั๊ม" for water_in_estimate; recorded values carry NO
 *     estimate flag; meter-delta energy carries the "(delta)" provenance per
 *     the P1.4 form precedent (DailyFormPage "ไฟฟ้าที่ใช้ (delta)")
 *   - threshold-hit counts from v_reading_critical_flags only (WO §2.4-4):
 *     per-class counting of the 7 critical + 2 immediate flags
 *   - พ.ศ. vocabulary (ref 1817–1844 verbatim): Thai full month SWITCH order
 *     + year_thai = year+543
 *   - CO2 = display-only aggregation of carbon.v_overview_carbon rows (WO
 *     §2.2: "NO recompute — recomputing CO2 in this lane is FORBIDDEN"):
 *     the module must NOT contain the 0.4999 factor (source-scan pin)
 *   - no client-side re-derivation of view math (WO §7): the module
 *     aggregates view-provided values only
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  REPORT_CHLORINE_LITTER_FACTOR,
  FLAG_SPEC_ESTIMATE,
  FLAG_PUMP_HOURS_ESTIMATE,
  enumerateCalendarDays,
  averageWithCount,
  beYear,
  thaiMonthFull,
  thaiRangeLabel,
  buildWastewaterSummary,
  buildWaterSupplySummary,
  buildMonthlyEnergy,
  countFlagHits,
  summarizeCarbonOverview,
  type ReportReadingRow,
  type ReportMeterChainRow,
  type ReportWaterChainRow,
  type ReportCriticalFlagRow,
} from "./report-summary";

// ─── View-row fixtures (view-provided values ONLY — the lib never derives) ─

function readingRow(over: Partial<ReportReadingRow>): ReportReadingRow {
  return {
    id: over.id ?? "r",
    reading_date: over.reading_date ?? "2026-11-02",
    do_aeration: null,
    do_sedimentation: null,
    do_before_discharge: null,
    ph: null,
    free_chlorine: null,
    tds_aeration: null,
    tds_before_discharge: null,
    sv30: null,
    wastewater_in: null,
    chlorine_used: null,
    chlorine_mix_ratio: null,
    excess_sludge_removed: null,
    ...over,
  };
}

function chainRow(over: Partial<ReportMeterChainRow>): ReportMeterChainRow {
  return {
    id: over.id ?? "c",
    reading_date: over.reading_date ?? "2026-11-02",
    delta_kwh: null,
    pump1_m3: null,
    pump2_m3: null,
    chlorine_used_real: null,
    meter_boundary_flag: false,
    meter_boundary_reason: null,
    spec_missing: false,
    spec_missing_kinds: null,
    ...over,
  };
}

function waterChainRow(over: Partial<ReportWaterChainRow>): ReportWaterChainRow {
  return {
    id: over.id ?? "w",
    check_date: over.check_date ?? "2026-11-02",
    hour_work: null,
    water_in: null,
    water_in_estimate: null,
    chlorine_usage_realy: null,
    energy_use_estimate: null,
    hour_boundary_flag: false,
    spec_missing: false,
    spec_missing_kinds: null,
    ...over,
  };
}

// ─── ×1.2 display constant (D1-3, ref 1949 / ref 2849) ────────────────────

describe("REPORT_CHLORINE_LITTER_FACTOR (D1-3 named constant)", () => {
  it("is exactly 1.2 (ref 1949 W/V_Chlorine Litter + ref 2849 Kg_chlorine)", () => {
    expect(REPORT_CHLORINE_LITTER_FACTOR).toBe(1.2);
  });

  it("carries the verbatim provenance comments (ref 1949 / ref 2849)", () => {
    const src = readFileSync(
      fileURLToPath(new URL("./report-summary.ts", import.meta.url)),
      "utf8",
    );
    expect(src).toContain("ref 1949");
    expect(src).toContain("ref 2849");
    expect(src).toContain("W/V_Chlorine Litter");
    expect(src).toContain("Kg_chlorine");
  });
});

// ─── Calendar enumeration + missing-days honesty (WO §2.4-1) ──────────────

describe("enumerateCalendarDays (missing-days honesty)", () => {
  it("enumerates the inclusive calendar days of the range", () => {
    expect(enumerateCalendarDays("2026-11-01", "2026-11-04")).toEqual([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
    ]);
  });

  it("handles month rollover inclusively", () => {
    const days = enumerateCalendarDays("2026-10-30", "2026-11-02");
    expect(days).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
  });

  it("a 1-day range is one day (both endpoints recorded, ref 1668–1675)", () => {
    expect(enumerateCalendarDays("2026-11-16", "2026-11-16")).toEqual(["2026-11-16"]);
  });
});

// ─── Wastewater summary (§3.7 Filter_Water sums, ref 1685–1779) ───────────

describe("buildWastewaterSummary — recorded sums (unknown ≠ 0)", () => {
  const start = "2026-11-01";
  const end = "2026-11-07"; // 7 calendar days

  const readings: ReportReadingRow[] = [
    // Nov 2: fully recorded day
    readingRow({
      id: "r1",
      reading_date: "2026-11-02",
      wastewater_in: 40,
      chlorine_used: 5,
      excess_sludge_removed: 30,
    }),
    // Nov 4: partial day — wastewater_in only (NULLs excluded from their sums)
    readingRow({ id: "r2", reading_date: "2026-11-04", wastewater_in: 50 }),
    // Nov 6: sludge only
    readingRow({ id: "r3", reading_date: "2026-11-06", excess_sludge_removed: 12 }),
  ];

  const chain: ReportMeterChainRow[] = [
    chainRow({
      id: "c1",
      reading_date: "2026-11-02",
      delta_kwh: 120,
      pump1_m3: 20,
      pump2_m3: 22,
      chlorine_used_real: 2.5,
    }),
    // boundary row: delta excluded + counted, never 0
    chainRow({
      id: "c2",
      reading_date: "2026-11-04",
      delta_kwh: null,
      meter_boundary_flag: true,
      meter_boundary_reason: "delta <= 0 (meter reset/swap suspected)",
    }),
    // spec-missing row: pump volumes excluded + counted
    chainRow({
      id: "c3",
      reading_date: "2026-11-06",
      delta_kwh: 80,
      pump1_m3: null,
      pump2_m3: null,
      spec_missing: true,
      spec_missing_kinds: "pump_wastewater_1,pump_wastewater_2",
    }),
  ];

  it("sums recorded values only; missing days contribute NOTHING (never 0-fill)", () => {
    const s = buildWastewaterSummary({ startISO: start, endISO: end, readings, chain });
    expect(s.sumWastewaterIn).toBe(90); // 40 + 50 (NULL days contribute nothing)
    expect(s.sumChlorine).toBe(5); // only the recorded chlorine_used
    expect(s.sumSludge).toBe(42); // 30 + 12
    // 7 calendar days, 3 recorded → 4 missing, shown separately (never coerced)
    expect(s.totalDays).toBe(7);
    expect(s.recordedDays).toBe(3);
    expect(s.missingDays).toBe(4);
  });

  it("Sum_Energy = Σ chain delta_kwh; boundary rows excluded + counted (never 0)", () => {
    const s = buildWastewaterSummary({ startISO: start, endISO: end, readings, chain });
    expect(s.sumEnergy).toBe(200); // 120 + 80; boundary NULL day contributes nothing
    expect(s.energyDays).toBe(2);
    expect(s.energyBoundaryExcluded).toBe(1);
  });

  it("useage_Chlorine = Σ chain chlorine_used_real (÷SWITCH view value, never re-derived)", () => {
    const s = buildWastewaterSummary({ startISO: start, endISO: end, readings, chain });
    expect(s.sumChlorineReal).toBe(2.5);
    // W/V_Chlorine Litter = [useage_Chlorine]*1.2 (ref 1949) — display layer
    expect(s.chlorineLitter).toBeCloseTo(3, 10);
    expect(s.chlorineLitter).toBe(s.sumChlorineReal * REPORT_CHLORINE_LITTER_FACTOR);
  });

  it("ปริมาณสูบรวม = Σ pump m3 over non-NULL spec-derived values; flagged ค่าประมาณจากสเปก", () => {
    const s = buildWastewaterSummary({ startISO: start, endISO: end, readings, chain });
    expect(s.pumpVolumeTotal).toBe(42); // 20 + 22; spec-missing day contributes nothing
    expect(s.specMissingDays).toBe(1);
    expect(s.pumpVolumeFlagged).toBe(FLAG_SPEC_ESTIMATE);
  });

  it("boundary day count comes from the chain view flag", () => {
    const s = buildWastewaterSummary({ startISO: start, endISO: end, readings, chain });
    expect(s.boundaryDays).toBe(1);
  });

  it("average wastewater_in carries its REAL denominator (days with value only)", () => {
    const s = buildWastewaterSummary({ startISO: start, endISO: end, readings, chain });
    expect(s.avgWastewaterIn.days).toBe(2); // NOT 7, NOT recordedDays — days WITH the value
    expect(s.avgWastewaterIn.mean).toBe(45); // 90 / 2
  });

  it("empty range: sums 0 with 0 denominators and honest NULL averages (never fabricated)", () => {
    const s = buildWastewaterSummary({
      startISO: start,
      endISO: end,
      readings: [],
      chain: [],
    });
    expect(s.totalDays).toBe(7);
    expect(s.recordedDays).toBe(0);
    expect(s.missingDays).toBe(7);
    expect(s.sumWastewaterIn).toBe(0);
    expect(s.avgWastewaterIn.days).toBe(0);
    expect(s.avgWastewaterIn.mean).toBeNull();
  });
});

// ─── Quality averages with REAL denominators (WO §2.2 parity row) ─────────

describe("buildWastewaterSummary — quality averages (days-with-value denominators)", () => {
  const readings: ReportReadingRow[] = [
    readingRow({
      id: "q1",
      reading_date: "2026-11-02",
      do_aeration: 3,
      do_sedimentation: 4,
      do_before_discharge: 5,
      ph: 7,
      free_chlorine: 0.8,
      tds_aeration: 200,
      tds_before_discharge: 300,
      sv30: 250,
    }),
    readingRow({
      id: "q2",
      reading_date: "2026-11-03",
      do_aeration: 5,
      do_sedimentation: 6,
      do_before_discharge: 7,
      ph: 8,
      free_chlorine: null, // missing → excluded from the FreeCl average
      tds_aeration: 400,
      tds_before_discharge: null,
      sv30: null,
    }),
  ];

  const s = buildWastewaterSummary({
    startISO: "2026-11-01",
    endISO: "2026-11-07",
    readings,
    chain: [],
  });

  it("DO-1/2/3 each average their own raw days-with-value series", () => {
    const byKey = Object.fromEntries(s.quality.map((q) => [q.key, q]));
    expect(byKey["do1"]!.days).toBe(2);
    expect(byKey["do1"]!.mean).toBe(4);
    expect(byKey["do2"]!.days).toBe(2);
    expect(byKey["do2"]!.mean).toBe(5);
    expect(byKey["do3"]!.days).toBe(2);
    expect(byKey["do3"]!.mean).toBe(6);
  });

  it("pH / TDS-1 / FreeCl / SV30 / TDS-2 average over days WITH the value only", () => {
    const byKey = Object.fromEntries(s.quality.map((q) => [q.key, q]));
    expect(byKey["ph"]!.mean).toBe(7.5);
    expect(byKey["ph"]!.days).toBe(2);
    expect(byKey["tds1"]!.mean).toBe(300);
    expect(byKey["tds1"]!.days).toBe(2);
    expect(byKey["freecl"]!.days).toBe(1); // NULL day excluded — never 0-filled
    expect(byKey["freecl"]!.mean).toBe(0.8);
    expect(byKey["sv30"]!.days).toBe(1);
    expect(byKey["sv30"]!.mean).toBe(250);
    expect(byKey["tds2"]!.days).toBe(1);
    expect(byKey["tds2"]!.mean).toBe(300);
  });

  it("every average exposes its denominator for display (จำนวนวันที่มีค่า)", () => {
    for (const q of s.quality) {
      expect(q.days).toBeGreaterThanOrEqual(0);
      expect(q.days).toBeLessThanOrEqual(s.recordedDays);
    }
  });
});

// ─── Monthly breakdown — the VC_CY_01..12 honesty (ref 1964–2126) ─────────

describe("buildMonthlyEnergy (VC_CY pattern — no-record months honest NULL)", () => {
  const chain: ReportMeterChainRow[] = [
    chainRow({ id: "m1", reading_date: "2026-01-10", delta_kwh: 100 }),
    chainRow({ id: "m2", reading_date: "2026-01-20", delta_kwh: 30 }),
    // a recorded month where every delta is NULL (all-boundary) → NULL, not 0
    chainRow({ id: "m3", reading_date: "2026-02-05", delta_kwh: null, meter_boundary_flag: true }),
    chainRow({ id: "m4", reading_date: "2025-12-31", delta_kwh: 999 }),
  ];

  it("returns 12 months; months with values sum; empty months are NULL (never 0)", () => {
    const cy = buildMonthlyEnergy(chain, 2026);
    expect(cy).toHaveLength(12);
    expect(cy[0]!.month).toBe(1);
    expect(cy[0]!.total).toBe(130); // 100 + 30
    expect(cy[1]!.total).toBeNull(); // recorded rows but no usable delta → NULL
    expect(cy[5]!.total).toBeNull(); // มิถุนายน — month with no records: NULL, NEVER 0
    expect(cy[11]!.total).toBeNull(); // ธันวาคม — not yet reached in 2026: NULL
    expect(cy.some((m) => m.total === 0)).toBe(false);
  });

  it("year-scopes strictly (LY sums only that year)", () => {
    const ly = buildMonthlyEnergy(chain, 2025);
    expect(ly[11]!.total).toBe(999); // ธันวาคม 2025
    expect(ly[0]!.total).toBeNull();
  });

  it("labels months with the verbatim Thai SWITCH order + พ.ศ. year (ref 1822–1844)", () => {
    const cy = buildMonthlyEnergy(chain, 2026);
    expect(cy[0]!.label).toBe("มกราคม 2569");
    expect(cy[4]!.label).toBe("พฤษภาคม 2569");
    expect(cy[11]!.label).toBe("ธันวาคม 2569");
  });
});

// ─── tap water_Filter side (§3.10, ref 2796–2850) ─────────────────────────

describe("buildWaterSupplySummary (น้ำประปา side)", () => {
  const start = "2026-11-01";
  const end = "2026-11-05"; // 5 calendar days

  const chain: ReportWaterChainRow[] = [
    waterChainRow({
      id: "w1",
      check_date: "2026-11-02",
      hour_work: 4,
      water_in: 45, // recorded
      water_in_estimate: 32, // hours × spec flow — flagged ประมาณจากชั่วโมงปั๊ม
      chlorine_usage_realy: 0.5,
      energy_use_estimate: 14.8, // hours × 3.7 spec — flagged ค่าประมาณจากสเปก
    }),
    // boundary row: excluded + counted
    waterChainRow({
      id: "w2",
      check_date: "2026-11-03",
      hour_work: null,
      hour_boundary_flag: true,
    }),
  ];

  const s = buildWaterSupplySummary({ startISO: start, endISO: end, chain });

  it("Sum_water_in = Σ recorded Water_In (ref 2796–2810); missing days honest", () => {
    expect(s.sumWaterIn).toBe(45);
    expect(s.totalDays).toBe(5);
    expect(s.recordedDays).toBe(2);
    expect(s.missingDays).toBe(3);
    expect(s.boundaryDays).toBe(1);
  });

  it("water_in estimate is summed SEPARATELY with the ประมาณจากชั่วโมงปั๊ม flag (never merged)", () => {
    expect(s.sumWaterInEstimate).toBe(32);
    expect(s.waterInEstimateFlagged).toBe(FLAG_PUMP_HOURS_ESTIMATE);
    expect(s.sumWaterIn).toBe(45); // recorded total unchanged by the estimate
  });

  it("Sum_Chlorine_use = Σ chlorine_usage_realy (ref 2812–2826); Kg_chlorine = ×1.2 (ref 2849)", () => {
    expect(s.sumChlorineReal).toBe(0.5);
    expect(s.kgChlorine).toBeCloseTo(0.6, 10);
    expect(s.kgChlorine).toBe(s.sumChlorineReal * REPORT_CHLORINE_LITTER_FACTOR);
  });

  it("ไฟฟ้ารวม (ประปา) = Σ energy_use_estimate, flagged ค่าประมาณจากสเปก (P1.5 pattern)", () => {
    expect(s.sumEnergyEstimate).toBe(14.8);
    expect(s.energyEstimateFlagged).toBe(FLAG_SPEC_ESTIMATE);
  });

  it("estimate flags are the P1.5 VERBATIM labels", () => {
    expect(FLAG_SPEC_ESTIMATE).toBe("ค่าประมาณจากสเปก");
    expect(FLAG_PUMP_HOURS_ESTIMATE).toBe("ประมาณจากชั่วโมงปั๊ม");
  });
});

// ─── Threshold-hit counts (WO §2.4-4 — view-provided flags only) ──────────

describe("countFlagHits (v_reading_critical_flags, computed view only)", () => {
  const flags: ReportCriticalFlagRow[] = [
    flagRow({ id: "f1", critical_do1: true, critical_ph: true }),
    flagRow({ id: "f2", critical_do1: true }),
    flagRow({ id: "f3", immediate_sv30: true, immediate_wastewater_in: true }),
    flagRow({ id: "f4" }), // clean reading — counts nothing
  ];

  function flagRow(over: Partial<ReportCriticalFlagRow>): ReportCriticalFlagRow {
    return {
      id: over.id ?? "f",
      reading_date: over.reading_date ?? "2026-11-02",
      critical_do1: false,
      critical_do2: false,
      critical_do3: false,
      critical_free_chlorine_low: false,
      critical_free_chlorine_high: false,
      critical_tds2: false,
      critical_ph: false,
      immediate_sv30: false,
      immediate_wastewater_in: false,
      ...over,
    };
  }

  it("counts READINGS hitting each flag class (per-class, not per-row total)", () => {
    const c = countFlagHits(flags);
    expect(c.critical_do1).toBe(2);
    expect(c.critical_ph).toBe(1);
    expect(c.immediate_sv30).toBe(1);
    expect(c.immediate_wastewater_in).toBe(1);
    expect(c.critical_do2).toBe(0);
    expect(c.critical_free_chlorine_high).toBe(0);
  });

  it("exposes exactly the 9 P1.3 flag classes", () => {
    const c = countFlagHits([]);
    expect(Object.keys(c).sort()).toEqual(
      [
        "critical_do1",
        "critical_do2",
        "critical_do3",
        "critical_free_chlorine_low",
        "critical_free_chlorine_high",
        "critical_tds2",
        "critical_ph",
        "immediate_sv30",
        "immediate_wastewater_in",
      ].sort(),
    );
  });
});

// ─── พ.ศ. display vocabulary (ref 1817–1844 verbatim) ─────────────────────

describe("พ.ศ. helpers (year_thai = year+543, month_thai SWITCH verbatim)", () => {
  it("beYear adds 543", () => {
    expect(beYear("2026-11-16")).toBe(2569);
    expect(beYear("2025-01-01")).toBe(2568);
  });

  it("thaiMonthFull follows the ref 1822–1835 SWITCH order exactly", () => {
    expect(thaiMonthFull(1)).toBe("มกราคม");
    expect(thaiMonthFull(2)).toBe("กุมภาพันธ์");
    expect(thaiMonthFull(3)).toBe("มีนาคม");
    expect(thaiMonthFull(4)).toBe("เมษายน");
    expect(thaiMonthFull(5)).toBe("พฤษภาคม");
    expect(thaiMonthFull(6)).toBe("มิถุนายน");
    expect(thaiMonthFull(7)).toBe("กรกฎาคม");
    expect(thaiMonthFull(8)).toBe("สิงหาคม");
    expect(thaiMonthFull(9)).toBe("กันยายน");
    expect(thaiMonthFull(10)).toBe("ตุลาคม");
    expect(thaiMonthFull(11)).toBe("พฤศจิกายน");
    expect(thaiMonthFull(12)).toBe("ธันวาคม");
  });

  it("thaiRangeLabel renders both endpoints in พ.ศ.", () => {
    const label = thaiRangeLabel("2026-11-01", "2026-11-30");
    expect(label).toContain("2569");
    expect(label).toContain("พฤศจิกายน");
  });
});

// ─── CO2 reuse (display-only; NO recompute — WO §2.2 + §6) ────────────────

describe("summarizeCarbonOverview (carbon.v_overview_carbon rows, display only)", () => {
  it("sums the view-provided tco2e per calendar year (CY/LY) — pure aggregation", () => {
    const rows = [
      { month: "2025-12", days: 31, kwh_total: 10, tco2e: 2 },
      { month: "2026-01", days: 31, kwh_total: 10, tco2e: 1.5 },
      { month: "2026-06", days: 30, kwh_total: 10, tco2e: 2.5 },
    ];
    const out = summarizeCarbonOverview(rows, 2026, 2025);
    expect(out.cy).toBe(4); // 1.5 + 2.5
    expect(out.ly).toBe(2);
  });

  it("a year with no view rows is honest NULL (never 0)", () => {
    const out = summarizeCarbonOverview([{ month: "2026-01", days: 31, kwh_total: 10, tco2e: 1 }], 2026, 2025);
    expect(out.cy).toBe(1);
    expect(out.ly).toBeNull();
  });

  it("FORBIDDEN recompute: the module never contains the 0.4999 factor", () => {
    const src = readFileSync(
      fileURLToPath(new URL("./report-summary.ts", import.meta.url)),
      "utf8",
    );
    expect(src).not.toContain("0.4999");
  });
});

// ─── Averages helper (real denominators everywhere) ───────────────────────

describe("averageWithCount", () => {
  it("averages non-null values with the days-with-value denominator", () => {
    expect(averageWithCount([4, null, 6])).toEqual({ mean: 5, days: 2 });
    expect(averageWithCount([null, null])).toEqual({ mean: null, days: 0 });
  });
});
