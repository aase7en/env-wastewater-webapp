/**
 * ENV-PARITY-P1-006 — pure date-range report-summary aggregation lib
 * (AppSheet parity lane P1.6: รายงานสรุปช่วงวัน on /reports).
 *
 * Ground truth: docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md
 * §3.7 ตาราง Filter_Water (ref 1544–2383) + §3.10 tap water_Filter
 * (ref 2708–2960) + §5 findings — pinned per WO ENV-PARITY-P1-006 §2.
 *
 * House rules (WO §3.1 D1-1 / §2.4 / §7, binding):
 *   - CLIENT-SIDE aggregation over the EXISTING views only — this module
 *     NEVER re-derives view math; it only aggregates values the views
 *     already computed (meter-chain deltas, spec volumes, ÷SWITCH real
 *     chlorine, critical flags). No second write path, no DB access.
 *   - unknown ≠ 0: missing days are COUNTED and shown (มีบันทึก X /
 *     ไม่มีบันทึก Y), never 0-filled; averages carry their real
 *     days-with-value denominator; boundary/spec-missing rows are excluded
 *     from sums AND counted; no-record months are honest NULL (the
 *     AppSheet VC_CY_01..12 "null" branch, ref 1964–2126), NEVER 0.
 *   - Estimate provenance travels with the aggregates (P1.5 verbatim
 *     labels): "ค่าประมาณจากสเปก" for spec-derived sums, "ประมาณจากชั่วโมงปั๊ม"
 *     for water_in_estimate. Recorded values carry NO estimate flag.
 *     Meter-delta energy carries the "(delta)" provenance per the P1.4
 *     form precedent (DailyFormPage "ไฟฟ้าที่ใช้ (delta)") — it is
 *     derived-from-records, not spec-derived.
 *   - CO2 is surfaced from carbon.v_overview_carbon rows via pure
 *     aggregation ONLY (WO §2.2: "NO recompute — recomputing CO2 in this
 *     lane is FORBIDDEN"); the AppSheet CO2 factor never appears here
 *     (source-scan-enforced).
 *   - พ.ศ. everywhere user-facing: year_thai = year+543 (ref 1843) and the
 *     Thai full month names in the verbatim month_thai SWITCH order
 *     (ref 1822–1835).
 */

// ─── Named display constants (D1-3) ─────────────────────────────────────

/**
 * AppSheet-verbatim ×1.2 display factor (D1-3 — replicated as a named
 * constant, never folded silently into sums; reviewer adjudicates):
 *   - `W/V_Chlorine Litter` = [useage_Chlorine]*1.2 (ref 1944–1950, the
 *     factor sits on ref line 1949 — บ่อบำบัด side)
 *   - `Kg_chlorine` = [Sum_Chlorine_use]*1.2 (ref 2844–2850, ref 2849 —
 *     น้ำประปา side)
 * Both are report-DISPLAY semantics over an already-derived sum; each
 * displays on its own line with this provenance.
 */
export const REPORT_CHLORINE_LITTER_FACTOR = 1.2;

/** P1.5 verbatim estimate flag — spec-derived values (hours × spec-at-date). */
export const FLAG_SPEC_ESTIMATE = "ค่าประมาณจากสเปก";

/** P1.5 verbatim estimate flag — water_in derived from pump hours. */
export const FLAG_PUMP_HOURS_ESTIMATE = "ประมาณจากชั่วโมงปั๊ม";

/** Meter-delta energy provenance suffix (P1.4 form precedent "ไฟฟ้าที่ใช้ (delta)"). */
export const ENERGY_DELTA_PROVENANCE = "ไฟฟ้ารวม (จาก delta มิเตอร์)";

// ─── View-row shapes (view-provided values ONLY; P1.2/P1.3/P1.5 own them) ─

/** wastewater.v_reading_with_computed — subset the report aggregates (r.*
 *  per-day recorded values; the house detail view, fetchReading precedent). */
export interface ReportReadingRow {
  id: string;
  reading_date: string;
  do_aeration: number | string | null;
  do_sedimentation: number | string | null;
  do_before_discharge: number | string | null;
  ph: number | string | null;
  free_chlorine: number | string | null;
  tds_aeration: number | string | null;
  tds_before_discharge: number | string | null;
  sv30: number | string | null;
  wastewater_in: number | string | null;
  chlorine_used: number | string | null;
  chlorine_mix_ratio: string | null;
  excess_sludge_removed: number | string | null;
}

/** wastewater.v_reading_meter_chain (public façade, P1.4) — subset used.
 *  delta_kwh/pump m3/chlorine_used_real are VIEW-computed (P1.2); this
 *  module only sums the provided numbers — never re-derives. */
export interface ReportMeterChainRow {
  id: string;
  reading_date: string;
  delta_kwh: number | string | null;
  pump1_m3: number | string | null;
  pump2_m3: number | string | null;
  chlorine_used_real: number | string | null;
  meter_boundary_flag: boolean | null;
  meter_boundary_reason: string | null;
  spec_missing: boolean | null;
  spec_missing_kinds: string | null;
}

/** wastewater.v_reading_critical_flags (P1.3 computed view) — subset used.
 *  NOTE (recorded deviation D1-5): this view has NO public PostgREST façade
 *  yet (P1.4/P1.5 exposed their views via `public.*` security_invoker
 *  façades; the flags view did not get one). The wiring queries the view
 *  name so it goes live the moment the adjudicated façade amendment lands;
 *  until then the report renders an honest "not available" notice — the
 *  counts are NEVER re-derived client-side (WO §2.4-4/§7). */
export interface ReportCriticalFlagRow {
  id: string;
  reading_date: string;
  critical_do1: boolean | null;
  critical_do2: boolean | null;
  critical_do3: boolean | null;
  critical_free_chlorine_low: boolean | null;
  critical_free_chlorine_high: boolean | null;
  critical_tds2: boolean | null;
  critical_ph: boolean | null;
  immediate_sv30: boolean | null;
  immediate_wastewater_in: boolean | null;
}

/** water_supply.v_daily_check_chain (public façade, P1.5) — subset used. */
export interface ReportWaterChainRow {
  id: string;
  check_date: string;
  hour_work: number | string | null;
  water_in: number | string | null;
  water_in_estimate: number | string | null;
  chlorine_usage_realy: number | string | null;
  energy_use_estimate: number | string | null;
  hour_boundary_flag: boolean | null;
  spec_missing: boolean | null;
  spec_missing_kinds: string | null;
}

/** carbon.v_overview_carbon row (SCHEMA-6; the factor lives server-side). */
export interface ReportCarbonRow {
  month: string; // YYYY-MM
  days: number;
  kwh_total: number;
  tco2e: number;
}

// ─── Numeric helpers ─────────────────────────────────────────────────────

/** Coerce a view cell to a finite number, or null (unknown stays unknown). */
function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

/** Sum of the non-NULL recorded values (NULL days contribute nothing). */
export function sumNonNull(values: (number | string | null | undefined)[]): number {
  let sum = 0;
  for (const v of values) {
    const n = num(v);
    if (n !== null) sum += n;
  }
  return sum;
}

/** Average with its REAL denominator (days with a value only). */
export interface AverageWithCount {
  /** null when no day carried a value (honest unknown, never 0). */
  mean: number | null;
  /** จำนวนวันที่มีค่า — displayed next to every average. */
  days: number;
}

export function averageWithCount(values: (number | string | null | undefined)[]): AverageWithCount {
  const nums: number[] = [];
  for (const v of values) {
    const n = num(v);
    if (n !== null) nums.push(n);
  }
  if (nums.length === 0) return { mean: null, days: 0 };
  return { mean: nums.reduce((a, b) => a + b, 0) / nums.length, days: nums.length };
}

// ─── Calendar + พ.ศ. helpers (ref 1817–1844 verbatim) ────────────────────

/** Inclusive calendar days of the range (ref 1668–1675: >= Start AND <= End).
 *  The missing-day honesty line counts against THIS enumeration. */
export function enumerateCalendarDays(startISO: string, endISO: string): string[] {
  const [sy, sm, sd] = startISO.split("-").map(Number);
  const [ey, em, ed] = endISO.split("-").map(Number);
  const days: string[] = [];
  const cur = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  while (cur.getTime() <= end.getTime()) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

/** year_thai = year + 543 (ref 1843, 1880). */
export function beYear(iso: string): number {
  return Number(iso.slice(0, 4)) + 543;
}

/** month_thai SWITCH — verbatim Thai full month names in ref 1822–1835
 *  order (the "ไม่มีข้อมูล" default branch is unreachable for 1..12). */
export function thaiMonthFull(month: number): string {
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  return months[month - 1] ?? "ไม่มีข้อมูล";
}

/** Thai พ.ศ. range label for the report header. */
export function thaiRangeLabel(startISO: string, endISO: string): string {
  const [sy, sm, sd] = startISO.split("-").map(Number);
  const [ey, em, ed] = endISO.split("-").map(Number);
  const sameMonth = sy === ey && sm === em;
  const startPart = sameMonth
    ? `${sd}`
    : `${sd} ${thaiMonthFull(sm)} ${beYear(startISO)}`;
  return `${startPart} – ${ed} ${thaiMonthFull(em)} ${beYear(endISO)}`;
}

// ─── บ่อบำบัด (Filter_Water §3.7) aggregates ─────────────────────────────

/** One quality-average line: key + Thai label + value + real denominator. */
export interface QualityAverage {
  key: "do1" | "do2" | "do3" | "ph" | "tds1" | "tds2" | "sv30" | "freecl";
  label: string;
  mean: number | null;
  days: number;
}

export interface WastewaterSummary {
  /** Calendar days in the range (ref 1632–1646 inclusive endpoints). */
  totalDays: number;
  /** วันที่มีบันทึก — days with a wastewater.reading row. */
  recordedDays: number;
  /** วันที่ไม่มีบันทึก — shown, never treated as zero-filled days. */
  missingDays: number;
  /** Chain rows flagged meter_boundary (their deltas are NULL → excluded). */
  boundaryDays: number;
  /** Chain rows flagged spec_missing (pump volumes NULL → excluded). */
  specMissingDays: number;
  /** Sum_Energy (ref 1685–1699) = Σ v_reading_meter_chain.delta_kwh. */
  sumEnergy: number;
  /** Days that contributed a delta (the real energy denominator). */
  energyDays: number;
  /** Boundary days whose delta was excluded from Sum_Energy. */
  energyBoundaryExcluded: number;
  /** Sum_waste_water (ref 1717–1731) = Σ recorded wastewater_in. */
  sumWastewaterIn: number;
  /** ค่าเฉลี่ยน้ำเข้าต่อวัน + real denominator (WO §2.2). */
  avgWastewaterIn: AverageWithCount;
  /** Sum_Chlorine (ref 1733–1747) = Σ recorded chlorine_used (คลอรีนน้ำ ที่ใช้). */
  sumChlorine: number;
  /** useage_Chlorine (ref 1765–1779) = Σ chain chlorine_used_real (คลอรีนน้ำที่ใช้จริง). */
  sumChlorineReal: number;
  /** W/V_Chlorine Litter (ref 1944–1950) = sumChlorineReal × 1.2 — display layer. */
  chlorineLitter: number;
  /** Sum_excess sludge (ref 1749–1763) = Σ recorded excess_sludge_removed. */
  sumSludge: number;
  /** ปริมาณสูบรวม = Σ (pump1_m3 + pump2_m3) non-NULL (spec-flow × hours). */
  pumpVolumeTotal: number;
  /** Provenance flag: this aggregate IS spec-derived ("ค่าประมาณจากสเปก"). */
  pumpVolumeFlagged: string;
  /** Quality averages, each with its days-with-value denominator. */
  quality: QualityAverage[];
}

/** Aggregate the บ่อบำบัด date-range summary from the existing view rows. */
export function buildWastewaterSummary(input: {
  startISO: string;
  endISO: string;
  readings: ReportReadingRow[];
  chain: ReportMeterChainRow[];
}): WastewaterSummary {
  const { startISO, endISO, readings, chain } = input;
  const calendar = enumerateCalendarDays(startISO, endISO);
  const recorded = new Set(readings.map((r) => r.reading_date));

  const deltas = chain.map((c) => c.delta_kwh);
  const boundaryDeltaExcluded = chain.filter(
    (c) => num(c.delta_kwh) === null && c.meter_boundary_flag === true,
  ).length;

  const byKey: Array<Pick<QualityAverage, "key" | "label"> & {
    get: (r: ReportReadingRow) => number | string | null;
  }> = [
    { key: "do1", label: "DO บ่อเติมอากาศ (DO-1)", get: (r) => r.do_aeration },
    { key: "do2", label: "DO บ่อตกตะกอน (DO-2)", get: (r) => r.do_sedimentation },
    { key: "do3", label: "DO น้ำก่อนทิ้ง (DO-3)", get: (r) => r.do_before_discharge },
    { key: "ph", label: "pH", get: (r) => r.ph },
    { key: "tds1", label: "TDS บ่อเติม (TDS-1)", get: (r) => r.tds_aeration },
    { key: "tds2", label: "TDS น้ำก่อนทิ้ง (TDS-2)", get: (r) => r.tds_before_discharge },
    { key: "sv30", label: "SV30", get: (r) => r.sv30 },
    { key: "freecl", label: "คลอรีนอิสระ (FreeCl)", get: (r) => r.free_chlorine },
  ];
  const quality: QualityAverage[] = byKey.map(({ key, label, get }) => {
    const avg = averageWithCount(readings.map(get));
    return { key, label, mean: avg.mean, days: avg.days };
  });

  const sumChlorineReal = sumNonNull(chain.map((c) => c.chlorine_used_real));

  return {
    totalDays: calendar.length,
    recordedDays: recorded.size,
    missingDays: calendar.length - recorded.size,
    boundaryDays: chain.filter((c) => c.meter_boundary_flag === true).length,
    specMissingDays: chain.filter((c) => c.spec_missing === true).length,
    sumEnergy: sumNonNull(deltas),
    energyDays: deltas.filter((d) => num(d) !== null).length,
    energyBoundaryExcluded: boundaryDeltaExcluded,
    sumWastewaterIn: sumNonNull(readings.map((r) => r.wastewater_in)),
    avgWastewaterIn: averageWithCount(readings.map((r) => r.wastewater_in)),
    sumChlorine: sumNonNull(readings.map((r) => r.chlorine_used)),
    sumChlorineReal,
    // W/V_Chlorine Litter = [useage_Chlorine]*1.2 (ref 1949) — display layer,
    // its own line, never folded into the sums (D1-3).
    chlorineLitter: sumChlorineReal * REPORT_CHLORINE_LITTER_FACTOR,
    sumSludge: sumNonNull(readings.map((r) => r.excess_sludge_removed)),
    pumpVolumeTotal:
      sumNonNull(chain.map((c) => c.pump1_m3)) + sumNonNull(chain.map((c) => c.pump2_m3)),
    pumpVolumeFlagged: FLAG_SPEC_ESTIMATE,
    quality,
  };
}

// ─── Monthly breakdown — the VC_CY_01..12 honesty (ref 1964–2126) ────────

export interface MonthlyPoint {
  month: number; // 1..12
  label: string; // Thai full month + พ.ศ. year
  /** Σ delta_kwh of that month, or NULL when no usable record exists
   *  (month not yet reached OR recorded rows without a usable delta) —
   *  the AppSheet "null" branch, NEVER 0. */
  total: number | null;
}

/** 12-month energy breakdown for a CE year (VC_CY_01..12 pattern). */
export function buildMonthlyEnergy(
  chain: ReportMeterChainRow[],
  yearCE: number,
): MonthlyPoint[] {
  const points: MonthlyPoint[] = [];
  for (let m = 1; m <= 12; m++) {
    const prefix = `${yearCE}-${String(m).padStart(2, "0")}`;
    const rows = chain.filter((c) => c.reading_date.startsWith(prefix));
    const usable = rows.filter((c) => num(c.delta_kwh) !== null);
    points.push({
      month: m,
      label: `${thaiMonthFull(m)} ${yearCE + 543}`,
      // Honest NULL when the month carries no usable value (never 0).
      total: usable.length === 0 ? null : sumNonNull(rows.map((c) => c.delta_kwh)),
    });
  }
  return points;
}

// ─── น้ำประปา (tap water_Filter §3.10) aggregates ────────────────────────

export interface WaterSupplySummary {
  totalDays: number;
  /** วันที่มีบันทึก — days with a water_supply.daily_check row. */
  recordedDays: number;
  missingDays: number;
  /** Rows flagged hour_boundary (hour deltas NULL → excluded). */
  boundaryDays: number;
  specMissingDays: number;
  /** Sum_water_in (ref 2796–2810) = Σ recorded Water_In (Filter_Water's
   *  Sum_Water ref 1701–1716 reads the SAME น้ำประปา[Water_In] source). */
  sumWaterIn: number;
  /** Σ water_in_estimate (hours × spec flow) — flagged ประมาณจากชั่วโมงปั๊ม. */
  sumWaterInEstimate: number;
  waterInEstimateFlagged: string;
  /** Sum_Chlorine_use (ref 2812–2826) = Σ chlorine_usage_realy (÷(1+9) view value). */
  sumChlorineReal: number;
  /** Kg_chlorine (ref 2844–2850) = sumChlorineReal × 1.2 — display layer. */
  kgChlorine: number;
  /** ไฟฟ้ารวม (ประปา) = Σ energy_use_estimate (hours × 3.7 spec-at-date). */
  sumEnergyEstimate: number;
  energyEstimateFlagged: string;
}

/** Aggregate the น้ำประปา date-range summary from the P1.5 chain view rows. */
export function buildWaterSupplySummary(input: {
  startISO: string;
  endISO: string;
  chain: ReportWaterChainRow[];
}): WaterSupplySummary {
  const { startISO, endISO, chain } = input;
  const calendar = enumerateCalendarDays(startISO, endISO);
  const recorded = new Set(chain.map((c) => c.check_date));
  const sumChlorineReal = sumNonNull(chain.map((c) => c.chlorine_usage_realy));

  return {
    totalDays: calendar.length,
    recordedDays: recorded.size,
    missingDays: calendar.length - recorded.size,
    boundaryDays: chain.filter((c) => c.hour_boundary_flag === true).length,
    specMissingDays: chain.filter((c) => c.spec_missing === true).length,
    sumWaterIn: sumNonNull(chain.map((c) => c.water_in)),
    sumWaterInEstimate: sumNonNull(chain.map((c) => c.water_in_estimate)),
    waterInEstimateFlagged: FLAG_PUMP_HOURS_ESTIMATE,
    sumChlorineReal,
    // Kg_chlorine = [Sum_Chlorine_use]*1.2 (ref 2849) — display layer (D1-3).
    kgChlorine: sumChlorineReal * REPORT_CHLORINE_LITTER_FACTOR,
    sumEnergyEstimate: sumNonNull(chain.map((c) => c.energy_use_estimate)),
    energyEstimateFlagged: FLAG_SPEC_ESTIMATE,
  };
}

// ─── Threshold-hit counts (WO §2.4-4 — v_reading_critical_flags ONLY) ────

export interface FlagClassCounts {
  critical_do1: number;
  critical_do2: number;
  critical_do3: number;
  critical_free_chlorine_low: number;
  critical_free_chlorine_high: number;
  critical_tds2: number;
  critical_ph: number;
  immediate_sv30: number;
  immediate_wastewater_in: number;
}

/** Count READINGS hitting each flag class. The flags are the view's
 *  computed booleans (P1.3; never re-evaluated client-side, and the
 *  threshold/threshold_alert tables are never read). */
export function countFlagHits(rows: ReportCriticalFlagRow[]): FlagClassCounts {
  const counts: FlagClassCounts = {
    critical_do1: 0,
    critical_do2: 0,
    critical_do3: 0,
    critical_free_chlorine_low: 0,
    critical_free_chlorine_high: 0,
    critical_tds2: 0,
    critical_ph: 0,
    immediate_sv30: 0,
    immediate_wastewater_in: 0,
  };
  for (const r of rows) {
    for (const key of Object.keys(counts) as (keyof FlagClassCounts)[]) {
      if (r[key] === true) counts[key] += 1;
    }
  }
  return counts;
}

// ─── CO2 surfacing (display-only aggregation — NO recompute, WO §2.2) ────

export interface CarbonOverviewSummary {
  /** Σ tco2e of the view rows whose month falls in yearCE; null when the
   *  view has no rows for that year (honest unknown, never 0). */
  cy: number | null;
  /** Same for yearCE - 1 (ปีก่อน). */
  ly: number | null;
}

/** Sum the EXISTING carbon.v_overview_carbon rows per calendar year.
 *  Pure aggregation of view-provided tco2e — the AppSheet CO2 factor (and
 *  any factor math) stays server-side in the view; recomputing it here is
 *  FORBIDDEN by WO §2.2 (enforced by the source-scan test). */
export function summarizeCarbonOverview(
  rows: ReportCarbonRow[],
  yearCE: number,
  prevYearCE: number,
): CarbonOverviewSummary {
  const sumYear = (y: number): number | null => {
    const vals = rows
      .filter((r) => Number(r.month.slice(0, 4)) === y)
      .map((r) => r.tco2e);
    return vals.length === 0 ? null : vals.reduce((a, b) => a + b, 0);
  };
  return { cy: sumYear(yearCE), ly: sumYear(prevYearCE) };
}
