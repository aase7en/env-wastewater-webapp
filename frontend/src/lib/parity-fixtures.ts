/**
 * ENV-PARITY-P1-007 — the AppSheet-parity fixture tables (Phase 1 lane P1.7).
 *
 * Ground truth (VERBATIM, READ-ONLY):
 * docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md (ref doc 12).
 * Every case cites its reference lines; where ENV intentionally diverges the
 * case encodes the CORRECTED expectation + a divergence note — never a
 * silent match of a bug (WO §2/§7 divergence honesty).
 *
 * Families (WO §2.1–§2.5):
 *   meter-chain (§2.1) — LAG deltas incl. reset boundaries; the three KNOWN
 *     INTENTIONAL DIVERGENCES (LAG-vs-global-MAX ref 778–800; delta≤0→NULL vs
 *     the AppSheet negative raw difference ref 802–816; spec-config vs the
 *     hardcoded ×34/×12 constants ref 807/814).
 *   chlorine (§2.2) — ÷SWITCH verbatim ref 762–767 (enum 1:2/1:4/1:9 ref
 *     750–761); groundwater ÷(1+9) spec-derived (ref 2665–2671 records the
 *     schema's ÷10 ≡ ÷(1+9)-from-spec; P1.5 D1-4 ruling + owner gate A3).
 *   factor-1.2 (§2.3) — W/V_Chlorine Litter = [useage_Chlorine]*1.2
 *     (ref 1944–1950, factor on 1949); Kg_chlorine = [Sum_Chlorine_use]*1.2
 *     (ref 2844–2850, factor on 2849) — the named constant
 *     REPORT_CHLORINE_LITTER_FACTOR shipped P1.6.
 *   thresholds (§2.4) — the 8 seeded thresholds (P1.3 seeds, valid_from
 *     DATE '2024-01-09'), the 2-day Critical streak (per-date EXISTS at
 *     D−2/D−1/D; NULL never violates; a missing day breaks the streak
 *     honestly — NOT a naive LAG chain) + the continuous chlorine streak
 *     (gaps-and-islands; calendar gaps reset) + immediate sv30/wastewater_in
 *     (no streak, both polarities).
 *   estimates (§2.5) — Energy_use ×3.7 (ref 2529–2539; negative→0 NOT
 *     replicated — ENV honest NULL/boundary per P1.5; owner gate A2 spec
 *     3.7) + Water_In = [Hour_Work]*8 (ref 2547–2553) RECORDED-NOT-REPLICATED
 *     (P1.5 D1-5: ENV water_in_estimate is spec-flow-driven, never ×8; no
 *     flow seeded → NULL + spec_missing flag — unknown ≠ 0).
 *
 * Consumption:
 *   - factor-1.2 cases run HERE in vitest against the shipped lib
 *     (REPORT_CHLORINE_LITTER_FACTOR + buildWastewaterSummary /
 *     buildWaterSupplySummary — the client only aggregates view-computed
 *     values, never re-derives view math).
 *   - meter-chain / chlorine / thresholds / estimates SQL-semantics cases
 *     are exercised by scripts/test_parity_p1_007_fixtures_sql.py (the
 *     transactional rollback-smoke harness, P1.2/P1.3 precedent) — the SQL
 *     case table mirrors THESE ids 1:1 (SQL semantics are not importable
 *     into vitest; D1-3 forbids new lib test-exports).
 *
 * House truth constraints (WO §7, binding): unknown ≠ 0; latest ≠ live;
 * AppSheet formulas verbatim-recorded with reference lines; divergence
 * honesty; พ.ศ. dates; no PHI; synthetic values only (no production row
 * copies, no secrets).
 */

export type ParityFamily =
  | "meter-chain"
  | "chlorine"
  | "factor-1.2"
  | "thresholds"
  | "estimates";

/** Every fixture case carries a verbatim reference-doc-12 citation. */
export interface ParityCaseBase {
  /** Stable id mirrored by the SQL rollback-smoke suite (MC / CH / F12 / TH / ES prefixes). */
  id: string;
  family: ParityFamily;
  /** VERBATIM AppSheet formula + ref-doc-12 line citation. */
  ref: string;
  /** Present ONLY where ENV intentionally diverges: the corrected expectation + why. */
  divergence?: string;
}

// ─── §2.1 meter-chain: LAG deltas + reset boundaries (SQL-smoke exercised) ──

/** Probe band: synthetic rows at 2099-12-01..06 (note-marked; rolled back).
 *  Spec-at-date flows (seeded 2024-01-09, READ-ONLY): pump1 ×34, pump2 ×12. */
export interface MeterChainCase extends ParityCaseBase {
  readingDate: string;
  pump1Meter: number | null;
  pump2Meter: number | null;
  electricMeter: number | null;
  chlorineUsed: number | null;
  chlorineMixRatio: "1:2" | "1:4" | "1:9" | null;
  expected: {
    pump1Hours: number | null;
    pump2Hours: number | null;
    deltaKwh: number | null;
    pump1M3: number | null;
    pump2M3: number | null;
    wastewaterInDerived: number | null;
    chlorineUsedReal: number | null;
    chlorineStreakCount: number;
    meterBoundaryFlag: boolean;
  };
}

export const METER_CHAIN_CASES: MeterChainCase[] = [
  {
    id: "MC-01",
    family: "meter-chain",
    ref: "คำนวณสูบ 1 = ([เลขมิเตอร์เครื่องสูบ 1]-[last_meter_สูบ1])*34 (ref 802–808); last_meter_สูบ1 = MAX(SELECT(..., [วันที่ บันทึก] < [_THISROW].[วันที่ บันทึก])) (ref 789–793)",
    divergence:
      "spec-config vs hardcoded ×34/×12 (WO §2.1-3): ENV multiplies by the spec-at-date flow from core.equipment_spec (seeded 34/12) — the AppSheet-verbatim constant ×34 is recorded here; a future spec change yields a different factor by design. First fixture row: prev meter chains from the last real row (2026-07-04) → meter value 0 makes delta≤0 deterministic → NULL + boundary flag (never a negative, never 0).",
    readingDate: "2099-12-01",
    pump1Meter: 0,
    pump2Meter: 0,
    electricMeter: 0,
    chlorineUsed: 9,
    chlorineMixRatio: "1:9",
    expected: {
      pump1Hours: null,
      pump2Hours: null,
      deltaKwh: null,
      pump1M3: null,
      pump2M3: null,
      wastewaterInDerived: null,
      chlorineUsedReal: 1.0,
      chlorineStreakCount: 1,
      meterBoundaryFlag: true,
    },
  },
  {
    id: "MC-02",
    family: "meter-chain",
    ref: "คำนวณสูบ 1 = ([เลขมิเตอร์เครื่องสูบ 1]-[last_meter_สูบ1])*34 (ref 802–808); คำนวณสูบ 2 = (...)*12 (ref 810–816)",
    divergence:
      "spec-config vs hardcoded ×34/×12 (WO §2.1-3): expected m³ use the spec-at-date flows 34/12 (≈ the AppSheet constants only while the seed holds); ENV correctness = spec-derived, not literal.",
    readingDate: "2099-12-02",
    pump1Meter: 34,
    pump2Meter: 12,
    electricMeter: 60,
    chlorineUsed: 8,
    chlorineMixRatio: "1:4",
    expected: {
      pump1Hours: 34,
      pump2Hours: 12,
      deltaKwh: 60,
      pump1M3: 1156,
      pump2M3: 144,
      wastewaterInDerived: 1300,
      chlorineUsedReal: 2.0,
      chlorineStreakCount: 2,
      meterBoundaryFlag: false,
    },
  },
  {
    id: "MC-03",
    family: "meter-chain",
    ref: "คำนวณสูบ 1/2 raw difference (ref 802–816); เลขมิเตอร์เมื่อวาน = MAX(SELECT(ข้อมูลคุณภาพน้ำ[เลขมิเตอร์วันนี้], TRUE)) — global MAX over ALL rows (ref 778–787)",
    divergence:
      "delta≤0 → NULL vs AppSheet raw difference (WO §2.1-2): pump1 34→10 is a reset; AppSheet would record a NEGATIVE คำนวณสูบ (10−34)×34; ENV yields NULL + meter_boundary_flag. Electric 60→60 → delta NULL + flag (never 0).",
    readingDate: "2099-12-03",
    pump1Meter: 10,
    pump2Meter: 20,
    electricMeter: 60,
    chlorineUsed: null,
    chlorineMixRatio: null,
    expected: {
      pump1Hours: null,
      pump2Hours: 8,
      deltaKwh: null,
      pump1M3: null,
      pump2M3: 96,
      wastewaterInDerived: null,
      chlorineUsedReal: null,
      chlorineStreakCount: 0,
      meterBoundaryFlag: true,
    },
  },
  {
    id: "MC-04",
    family: "meter-chain",
    ref: "last_meter_สูบ1 = MAX(SELECT(..., [วันที่ บันทึก] < [_THISROW].[วันที่ บันทึก])) (ref 789–793); คำนวณสูบ 1 ×34 (ref 802–808)",
    divergence:
      "LAG-vs-global-MAX correction (WO §2.1-1): after the MC-03 reset, AppSheet's global-MAX-before picks MAX(0, 34, 10) = 34 → (160−34)×34 = 4284 (wrong: the reset is silently absorbed); ENV's per-meter LAG takes prev = 10 (the actual previous row) → (160−10)×34 = 5100 — the CORRECTED expectation asserted here, never the global-MAX result.",
    readingDate: "2099-12-04",
    pump1Meter: 160,
    pump2Meter: 30,
    electricMeter: 80,
    chlorineUsed: 6,
    chlorineMixRatio: "1:2",
    expected: {
      pump1Hours: 150,
      pump2Hours: 10,
      deltaKwh: 20,
      pump1M3: 5100,
      pump2M3: 120,
      wastewaterInDerived: 5220,
      chlorineUsedReal: 3.0,
      chlorineStreakCount: 1,
      meterBoundaryFlag: false,
    },
  },
  {
    id: "MC-05",
    family: "meter-chain",
    ref: "chlorine_streak_count gaps-and-islands (P1.2 view addendum; Chlorine_StreakCount AppSheet lineage): consecutive recorded days count; a calendar GAP resets — never fabricated",
    divergence: undefined,
    readingDate: "2099-12-06",
    pump1Meter: null,
    pump2Meter: null,
    electricMeter: null,
    chlorineUsed: 9,
    chlorineMixRatio: "1:9",
    expected: {
      pump1Hours: null,
      pump2Hours: null,
      deltaKwh: null,
      pump1M3: null,
      pump2M3: null,
      wastewaterInDerived: null,
      chlorineUsedReal: 1.0,
      chlorineStreakCount: 1,
      meterBoundaryFlag: false,
    },
  },
];

/** MC-05 calendar-gap note (kept as its own divergence-free assertion):
 *  2099-12-05 carries NO row at all (a MISSING calendar day); 12-06's
 *  streak therefore restarts at 1 even though 12-04 also recorded usage —
 *  a gap breaks the streak honestly (unknown ≠ 0). */

// ─── §2.2 chlorine: ÷SWITCH verbatim + groundwater ÷(1+9) spec-derived ─────

/** ÷SWITCH cases ride the MC band rows (chlorine_used/mix on 2099-12-*).
 *  The DB CHECK (P1.1) admits ONLY 1:2/1:4/1:9 or NULL — the unknown-mix
 *  case is therefore NULL (never a fabricated ratio). */
export interface ChlorineCase extends ParityCaseBase {
  carrierCaseId: string;
  chlorineUsed: number;
  chlorineMixRatio: "1:2" | "1:4" | "1:9" | null;
  expectedChlorineUsedReal: number | null;
}

export const CHLORINE_DIVSWITCH_CASES: ChlorineCase[] = [
  {
    id: "CH-01",
    family: "chlorine",
    carrierCaseId: "MC-01",
    ref: "คลอรีนน้ำที่ใช้จริง = .../ SWITCH([อัตราผสม(คลอรีน/น้ำ)], \"1:2\", 2, \"1:4\", 4, \"1:9\", 9, \"\") (ref 762–767); enum 1:2/1:4/1:9 (ref 750–759)",
    chlorineUsed: 9,
    chlorineMixRatio: "1:9",
    expectedChlorineUsedReal: 1.0,
  },
  {
    id: "CH-02",
    family: "chlorine",
    carrierCaseId: "MC-02",
    ref: "คลอรีนน้ำที่ใช้จริง = .../ SWITCH(..., \"1:4\", 4, ...) (ref 762–767)",
    chlorineUsed: 8,
    chlorineMixRatio: "1:4",
    expectedChlorineUsedReal: 2.0,
  },
  {
    id: "CH-03",
    family: "chlorine",
    carrierCaseId: "MC-04",
    ref: "คลอรีนน้ำที่ใช้จริง = .../ SWITCH(..., \"1:2\", 2, ...) (ref 762–767)",
    chlorineUsed: 6,
    chlorineMixRatio: "1:2",
    expectedChlorineUsedReal: 3.0,
  },
  {
    id: "CH-04",
    family: "chlorine",
    carrierCaseId: "MC-03",
    ref: "คลอรีนน้ำที่ใช้จริง SWITCH default branch \"\" (ref 762–767); init =1:4 is a UI create-only default (ref 750–761)",
    divergence: undefined,
    chlorineUsed: 5,
    chlorineMixRatio: null,
    expectedChlorineUsedReal: null,
  },
];

/** Groundwater chlorine — the ÷(1+9) spec-derived parity pair (water_supply). */
export interface GroundwaterChlorineCase extends ParityCaseBase {
  checkDate: string;
  chlorineUsage: number | null;
  expectedChlorineUsageRealy: number | null;
  expectedSpecMissing: boolean;
}

export const GROUNDWATER_CHLORINE_CASES: GroundwaterChlorineCase[] = [
  {
    id: "CH-05",
    family: "chlorine",
    ref: "Chlorine_usage_realy = [Chlorine usage]/10 (ref 2665–2671, ÷10 verbatim incl. the schema's own realy typo)",
    divergence:
      "÷10-in-the-schema ≡ ÷(1+9)-from-spec (WO §2.2; P1.5 D1-4 ruling + owner gate A3): ENV divides by NULLIF(mix_part_chlorine + mix_part_water, 0) from the chlorine_mix_groundwater spec row (seeded 1+9 = 10 total parts) — the fixture pins the spec-derived ÷(1+9) result, never a hardcoded 10.",
    checkDate: "2099-06-02",
    chlorineUsage: 10,
    expectedChlorineUsageRealy: 1.0,
    expectedSpecMissing: false,
  },
  {
    id: "CH-06",
    family: "chlorine",
    ref: "Chlorine_usage_realy = [Chlorine usage]/10 (ref 2665–2671); unknown ≠ 0 (WO §7)",
    divergence: undefined,
    checkDate: "2099-06-04",
    chlorineUsage: null,
    expectedChlorineUsageRealy: null,
    expectedSpecMissing: false,
  },
];

// ─── §2.3 ×1.2 factors (vitest-executed against the shipped lib) ────────────

export interface Factor12Case extends ParityCaseBase {
  /** Recorded-usage real-chlorine values summed by the report lib. */
  chlorineRealValues: (number | null)[];
  /** AppSheet verbatim expected: [sum]*1.2. */
  expectedFactor12: number;
  side: "wastewater-W/V" | "water-supply-Kg";
}

export const FACTOR_12_CASES: Factor12Case[] = [
  {
    id: "F12-01",
    family: "factor-1.2",
    ref: "W/V_Chlorine Litter = [useage_Chlorine]*1.2 (ref 1944–1950; the factor sits on ref 1949)",
    side: "wastewater-W/V",
    chlorineRealValues: [2.5, null, 1.5],
    expectedFactor12: 4.8,
  },
  {
    id: "F12-02",
    family: "factor-1.2",
    ref: "Kg_chlorine = [Sum_Chlorine_use]*1.2 (ref 2844–2850; the factor sits on ref 2849)",
    side: "water-supply-Kg",
    chlorineRealValues: [0.5, null],
    expectedFactor12: 0.6,
  },
];

// ─── §2.4 thresholds: 8 seeds + 2-day streak + continuous streak ────────────

/** The 8 seeded thresholds (P1.3 seeds; READ-ONLY consumption; valid_from
 *  DATE '2024-01-09'). One-sided thresholds keep the unused side NULL. */
export interface ThresholdSeedCase extends ParityCaseBase {
  parameterCode: string;
  minValue: number | null;
  maxValue: number | null;
}

export const THRESHOLD_SEED_CASES: ThresholdSeedCase[] = [
  {
    id: "TH-S-do1",
    family: "thresholds",
    ref: "DO-1 < 1 Critical (ref §3.3); seed note 'Critical-DO-1 (ref §3.3): DO-1 < 1 — AppSheet parity seed' (20261115130000:151-199)",
    parameterCode: "do1",
    minValue: null,
    maxValue: 1,
  },
  {
    id: "TH-S-do2",
    family: "thresholds",
    ref: "DO-2 < 1 Critical (ref §3.3); seed 20261115130000:151-199",
    parameterCode: "do2",
    minValue: null,
    maxValue: 1,
  },
  {
    id: "TH-S-do3",
    family: "thresholds",
    ref: "DO-3 < 1.5 Critical (ref §3.3); seed 20261115130000:151-199",
    parameterCode: "do3",
    minValue: null,
    maxValue: 1.5,
  },
  {
    id: "TH-S-free-chlorine",
    family: "thresholds",
    ref: "Free chlorine < 0.5 / > 1 Critical (ref §3.3); seed 20261115130000:151-199",
    parameterCode: "free_chlorine",
    minValue: 0.5,
    maxValue: 1,
  },
  {
    id: "TH-S-ph",
    family: "thresholds",
    ref: "pH > 9 OR < 5 Critical (ref §3.3 verbatim); seed 20261115130000:151-199",
    parameterCode: "ph",
    minValue: 5,
    maxValue: 9,
  },
  {
    id: "TH-S-tds2",
    family: "thresholds",
    ref: "TDS-2 > 1000 Critical (ref §3.3); seed 20261115130000:151-199",
    parameterCode: "tds2",
    minValue: 1000,
    maxValue: null,
  },
  {
    id: "TH-S-sv30",
    family: "thresholds",
    ref: "SV30 > 450 OR < 150 (ref §9 SV30_Notice bot); seed 20261115130000:151-199",
    parameterCode: "sv30",
    minValue: 150,
    maxValue: 450,
  },
  {
    id: "TH-S-wastewater-in",
    family: "thresholds",
    ref: "wastewater_in > 70 (ref §9 water_overload bot); seed 20261115130000:151-199",
    parameterCode: "wastewater_in",
    minValue: 70,
    maxValue: null,
  },
];

/** 2-day Critical streak cases: per-date EXISTS at D−2/D−1/D over exact
 *  calendar equality; NULL never violates; a MISSING day breaks the streak
 *  honestly (unknown ≠ 0; NOT a naive LAG chain — P1.3 divergence note).
 *  SQL-smoke exercised via wastewater.fn_critical_flags on synthetic
 *  2099-01..11 bands (never threshold_alert — flags come from the
 *  computed view only). */
export interface StreakCase extends ParityCaseBase {
  probeDate: string;
  /** fn_critical_flags output column asserted for this probe. */
  flagColumn:
    | "critical_do1"
    | "critical_do2"
    | "critical_do3"
    | "critical_free_chlorine_low"
    | "critical_free_chlorine_high"
    | "critical_tds2"
    | "critical_ph"
    | "immediate_sv30"
    | "immediate_wastewater_in";
  expectedFlag: boolean;
  scenario: string;
}

export const STREAK_CASES: StreakCase[] = [
  {
    id: "TH-01",
    family: "thresholds",
    ref: "Critical-DO-1: violations on D−2 AND D−1 AND D (ref §3.3 streak semantics; P1.3 WO §2.2)",
    probeDate: "2099-01-03",
    flagColumn: "critical_do1",
    expectedFlag: true,
    scenario: "do_aeration 0.5 on 01,02,03 → 3-day streak TRUE",
  },
  {
    id: "TH-02",
    family: "thresholds",
    ref: "2-day streak needs ALL THREE dates (ref §3.3; P1.3 WO §2.2 — NOT a naive LAG chain)",
    probeDate: "2099-01-02",
    flagColumn: "critical_do1",
    expectedFlag: false,
    scenario: "D−2 (01-01 missing day) → FALSE (missing day breaks honestly)",
  },
  {
    id: "TH-03",
    family: "thresholds",
    ref: "2-day streak calendar-gap reset (ref §3.3; P1.3 WO §2.2)",
    probeDate: "2099-02-03",
    flagColumn: "critical_do1",
    expectedFlag: false,
    scenario: "violations 02-01 + 02-03, 02-02 MISSING → FALSE (gap breaks)",
  },
  {
    id: "TH-04",
    family: "thresholds",
    ref: "DO-1 < 1 threshold window (ref §3.3); in-bounds values never violate",
    probeDate: "2099-03-03",
    flagColumn: "critical_do1",
    expectedFlag: false,
    scenario: "do_aeration 1.2 ×3 days (≥ 1) → FALSE",
  },
  {
    id: "TH-05",
    family: "thresholds",
    ref: "NULL never violates a threshold (WO §7 unknown ≠ 0; P1.3 WO §2.2)",
    probeDate: "2099-04-03",
    flagColumn: "critical_do1",
    expectedFlag: false,
    scenario: "04-02 do_aeration NULL (missing value day) → FALSE",
  },
  {
    id: "TH-06",
    family: "thresholds",
    ref: "DO-2 < 1 streak (ref §3.3)",
    probeDate: "2099-10-03",
    flagColumn: "critical_do2",
    expectedFlag: true,
    scenario: "do_sedimentation 0.5 ×3 days → TRUE",
  },
  {
    id: "TH-07",
    family: "thresholds",
    ref: "DO-3 < 1.5 streak (ref §3.3)",
    probeDate: "2099-11-03",
    flagColumn: "critical_do3",
    expectedFlag: true,
    scenario: "do_before_discharge 1.0 ×3 days → TRUE",
  },
  {
    id: "TH-08",
    family: "thresholds",
    ref: "pH > 9 OR < 5 streak (ref §3.3 verbatim; the plan-summary '<4' is a recorded typo)",
    probeDate: "2099-06-03",
    flagColumn: "critical_ph",
    expectedFlag: true,
    scenario: "ph 9.5 ×3 days → TRUE",
  },
  {
    id: "TH-09",
    family: "thresholds",
    ref: "Free chlorine < 0.5 Lowerlow streak (ref §3.3)",
    probeDate: "2099-07-03",
    flagColumn: "critical_free_chlorine_low",
    expectedFlag: true,
    scenario: "free_chlorine 0.2 ×3 days → TRUE",
  },
  {
    id: "TH-10",
    family: "thresholds",
    ref: "Free chlorine > 1 HigherHigh streak (ref §3.3)",
    probeDate: "2099-09-03",
    flagColumn: "critical_free_chlorine_high",
    expectedFlag: true,
    scenario: "free_chlorine 1.5 ×3 days → TRUE",
  },
  {
    id: "TH-11",
    family: "thresholds",
    ref: "TDS-2 > 1000 streak (ref §3.3)",
    probeDate: "2099-08-03",
    flagColumn: "critical_tds2",
    expectedFlag: true,
    scenario: "tds_before_discharge 1100 ×3 days → TRUE",
  },
  {
    id: "TH-12",
    family: "thresholds",
    ref: "SV30 > 450 immediate (ref §9 SV30_Notice bot — no streak applies)",
    probeDate: "2099-05-01",
    flagColumn: "immediate_sv30",
    expectedFlag: true,
    scenario: "sv30 480 single day → TRUE immediately",
  },
  {
    id: "TH-13",
    family: "thresholds",
    ref: "SV30 < 150 immediate (ref §9 — the other polarity of the window)",
    probeDate: "2099-05-02",
    flagColumn: "immediate_sv30",
    expectedFlag: true,
    scenario: "sv30 100 single day → TRUE immediately (< 150)",
  },
  {
    id: "TH-14",
    family: "thresholds",
    ref: "SV30 window 150..450 (ref §9) — in-window never flags",
    probeDate: "2099-05-03",
    flagColumn: "immediate_sv30",
    expectedFlag: false,
    scenario: "sv30 200 single day → FALSE (in-window)",
  },
  {
    id: "TH-15",
    family: "thresholds",
    ref: "wastewater_in > 70 immediate (ref §9 water_overload bot — no streak)",
    probeDate: "2099-05-01",
    flagColumn: "immediate_wastewater_in",
    expectedFlag: true,
    scenario: "wastewater_in 85 single day → TRUE immediately",
  },
  {
    id: "TH-16",
    family: "thresholds",
    ref: "wastewater_in > 70 window (ref §9); in-bounds never flags",
    probeDate: "2099-05-03",
    flagColumn: "immediate_wastewater_in",
    expectedFlag: false,
    scenario: "wastewater_in 40 single day → FALSE (in-bounds)",
  },
  {
    id: "TH-17",
    family: "thresholds",
    ref: "NULL never violates (WO §7 unknown ≠ 0; ref §9 windows)",
    probeDate: "2099-05-04",
    flagColumn: "immediate_sv30",
    expectedFlag: false,
    scenario: "sv30 NULL day → FALSE (never fabricated as in-window)",
  },
  {
    id: "TH-18",
    family: "thresholds",
    ref: "NULL never violates (WO §7 unknown ≠ 0; ref §9 window)",
    probeDate: "2099-05-04",
    flagColumn: "immediate_wastewater_in",
    expectedFlag: false,
    scenario: "wastewater_in NULL day → FALSE (never fabricated as in-bounds)",
  },
];

// ─── §2.5 estimates: hours × spec + water_in ×8 recorded-not-replicated ────

export interface EstimateCase extends ParityCaseBase {
  checkDate: string;
  hourMeter: number | null;
  expected: {
    hourWork: number | null;
    energyUseEstimate: number | null;
    waterInEstimate: number | null;
    hourBoundaryFlag: boolean;
    specMissing: boolean;
  };
}

export const ESTIMATE_CASES: EstimateCase[] = [
  {
    id: "ES-01",
    family: "estimates",
    ref: "Energy_use = IF(([Hour_meter]-[last_Hour_meter])*3.7 < 0, 0, (...)*3.7) (ref 2529–2539); last_Hour_meter = MAX(SELECT(น้ำประปา[Hour_meter], [Date] < ...)) (ref 2648–2654)",
    divergence:
      "×3.7 spec-derived; negative→0 NOT replicated (WO §2.5): ENV yields honest NULL + hour_boundary_flag on a missing/reset delta (P1.5 chain) — unknown ≠ 0. First fixture row: daily_check is empty in live ENV_DB, so prev is genuinely missing → NULL + flag.",
    checkDate: "2099-06-01",
    hourMeter: 0,
    expected: {
      hourWork: null,
      energyUseEstimate: null,
      waterInEstimate: null,
      hourBoundaryFlag: true,
      specMissing: false,
    },
  },
  {
    id: "ES-02",
    family: "estimates",
    ref: "Energy_use = ([Hour_meter]-[last_Hour_meter])*3.7 (ref 2529–2539; the ×3.7 constant)",
    divergence:
      "×3.7 spec-derived; negative→0 NOT replicated (WO §2.5; owner gate A2, plan §5.3 commit fb57369): ENV multiplies by the spec-at-date energy_kwh_per_h (pump_groundwater seed 3.7) — the AppSheet-verbatim constant is recorded here; displayed with the 'ค่าประมาณจากสเปก' estimate flag (latest ≠ live).",
    checkDate: "2099-06-02",
    hourMeter: 4,
    expected: {
      hourWork: 4,
      energyUseEstimate: 14.8,
      waterInEstimate: null,
      hourBoundaryFlag: false,
      specMissing: true,
    },
  },
  {
    id: "ES-03",
    family: "estimates",
    ref: "Water_In = IF(ISBLANK([ชนิดเครื่องมือตรวจ]), [Hour_Work]*8, \"\") (ref 2547–2553)",
    divergence:
      "Water_In ×8 RECORDED-NOT-REPLICATED (WO §2.5; P1.5 D1-5 ruling): ENV water_in_estimate is spec-flow-driven (pump_groundwater.flow_m3_per_h); no flow is seeded live (NULL) → water_in_estimate NULL + spec_missing TRUE — never a hardcoded ×8 (the AppSheet-verbatim 4×8=32 is recorded, never asserted).",
    checkDate: "2099-06-02",
    hourMeter: 4,
    expected: {
      hourWork: 4,
      energyUseEstimate: 14.8,
      waterInEstimate: null,
      hourBoundaryFlag: false,
      specMissing: true,
    },
  },
  {
    id: "ES-04",
    family: "estimates",
    ref: "last_Hour_meter + delta semantics (ref 2648–2654; Energy_use ref 2529–2539)",
    divergence:
      "×3.7 spec-derived; negative→0 NOT replicated (WO §2.5): hour_meter 4→4 is a reset; AppSheet would coerce (4−4)×3.7 < 0 → 0; ENV honest NULL + boundary (unknown ≠ 0).",
    checkDate: "2099-06-03",
    hourMeter: 4,
    expected: {
      hourWork: null,
      energyUseEstimate: null,
      waterInEstimate: null,
      hourBoundaryFlag: true,
      specMissing: false,
    },
  },
  {
    id: "ES-05",
    family: "estimates",
    ref: "Energy_use ×3.7 (ref 2529–2539); spec seeds valid_from DATE '2024-01-09' (P1.2/P1.5)",
    divergence: undefined,
    checkDate: "2099-06-04",
    hourMeter: 8,
    expected: {
      hourWork: 4,
      energyUseEstimate: 14.8,
      waterInEstimate: null,
      hourBoundaryFlag: false,
      specMissing: true,
    },
  },
  {
    id: "ES-06",
    family: "estimates",
    ref: "spec-at-date pick valid_from ≤ check_date (P1.2/P1.5 effective-dated join rule); spec seeds start 2024-01-09",
    divergence: undefined,
    checkDate: "2024-01-02",
    hourMeter: 4,
    expected: {
      hourWork: 4,
      energyUseEstimate: null,
      waterInEstimate: null,
      hourBoundaryFlag: false,
      specMissing: true,
    },
  },
];

// ─── Registry ────────────────────────────────────────────────────────────────

/** Every fixture case, by family (the parity-% denominator inputs). */
export const ALL_PARITY_CASES: ParityCaseBase[] = [
  ...METER_CHAIN_CASES,
  ...CHLORINE_DIVSWITCH_CASES,
  ...GROUNDWATER_CHLORINE_CASES,
  ...FACTOR_12_CASES,
  ...THRESHOLD_SEED_CASES,
  ...STREAK_CASES,
  ...ESTIMATE_CASES,
];

/** Divergence kinds pinned by WO §2.1-2.1/2.2/2.5 — every divergence note
 *  must cite one of these correction classes (divergence honesty, §7). */
export const DIVERGENCE_KINDS = [
  "LAG-vs-global-MAX correction",
  "delta≤0 → NULL vs AppSheet raw difference",
  "spec-config vs hardcoded ×34/×12",
  "÷10-in-the-schema ≡ ÷(1+9)-from-spec",
  "×3.7 spec-derived; negative→0 NOT replicated",
  "Water_In ×8 RECORDED-NOT-REPLICATED",
] as const;

/** Case ids mirrored by scripts/test_parity_p1_007_fixtures_sql.py (the
 *  SQL rollback-smoke harness asserts the SAME ids against ENV_DB inside
 *  one rolled-back transaction). */
export const SQL_EXERCISED_CASE_IDS = [
  "MC-01",
  "MC-02",
  "MC-03",
  "MC-04",
  "MC-05",
  "CH-01",
  "CH-02",
  "CH-03",
  "CH-04",
  "CH-05",
  "CH-06",
  "TH-S-do1",
  "TH-S-do2",
  "TH-S-do3",
  "TH-S-free-chlorine",
  "TH-S-ph",
  "TH-S-tds2",
  "TH-S-sv30",
  "TH-S-wastewater-in",
  "TH-01",
  "TH-02",
  "TH-03",
  "TH-04",
  "TH-05",
  "TH-06",
  "TH-07",
  "TH-08",
  "TH-09",
  "TH-10",
  "TH-11",
  "TH-12",
  "TH-13",
  "TH-14",
  "TH-15",
  "TH-16",
  "TH-17",
  "TH-18",
  "ES-01",
  "ES-02",
  "ES-03",
  "ES-04",
  "ES-05",
  "ES-06",
];
