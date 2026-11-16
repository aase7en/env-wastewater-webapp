/**
 * ENV-PARITY-P1-005 — unit tests for the pure water-supply parity lib
 * (reference doc 12 §3.8 ตาราง น้ำประปา, ref 2384–2677 — pinned per WO §2).
 *
 * Pins VERBATIM:
 *   - activity enum values + init default (UI default on create only;
 *     ref 2509–2519)
 *   - Water_In Valid If >0 + the verbatim Invalid value error
 *     "ตรวจสอบข้อมูลดีๆก่อน" (ref 2561–2571); empty passes (NULL ≠ violation)
 *   - Show-If groups (§2.3): usage fields (activity=usage ∧ สถานที่ resolves
 *     โรงจ่ายคลอรีน; ref 2501–2527/2673–2677), Water_In
 *     (activity ≠ "ฟรีคลอรีน / TDS"; ref 2573–2577)
 *   - estimate flag labels verbatim: "ค่าประมาณจากสเปก" (A2 energy from
 *     spec) + "ประมาณจากชั่วโมงปั๊ม" (D1-5 water_in_estimate)
 *   - the view-math mirrors for testability (WO §3.3 — never a second write
 *     path): LAG tie-break semantics, delta ≤ 0 → NULL + boundary flag
 *     (never 0, never negative), spec-at-date pick (half-open window, latest
 *     start wins), energy = hours × spec-at-date, water_in_estimate
 *     spec-flow-driven (NEVER the AppSheet ×8 constant, ref 2547–2553),
 *     chlorine_usage_realy ÷(1+9) from the mix spec parts (D1-4 — NEVER a
 *     hardcoded 10, ref 2603–2609/2665–2671 recorded verbatim)
 *   - no-fallback invariants (WO §2.4-4): never 60, never ×8 silent store,
 *     never 0-fill, no DB defaults on the new columns
 *   - the migration DDL contract (additive NULLable/no-default columns,
 *     verbatim CHECK, view + public security_invoker façade, grant, notify,
 *     zero DML)
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  ACTIVITY_OPTIONS,
  ACTIVITY_DEFAULT,
  ACTIVITY_USAGE_MODE,
  ACTIVITY_QUALITY_MODE,
  LABEL_ACTIVITY,
  LABEL_HOUR_METER,
  LABEL_CHLORINE_USAGE,
  LABEL_WATER_IN,
  PROMPT_ENERGY,
  PROMPT_WATER_IN,
  ERR_WATER_IN,
  FLAG_ENERGY_ESTIMATE,
  FLAG_WATER_IN_ESTIMATE,
  CHLORINE_STATION_DEFAULT,
  isUsageMode,
  resolveLocationDisplay,
  showUsageFields,
  showWaterIn,
  validateWaterIn,
  pickSpecAtDate,
  hourWork,
  energyUseEstimate,
  waterInEstimate,
  chlorineUsageReal,
  type SpecRow,
} from "./water-supply-parity";

// ─── Migration DDL contract (supabase/migrations/20261116000002) ────────

const MIGRATION_PATH = fileURLToPath(
  new URL(
    "../../../supabase/migrations/20261116000002_parity_p1_005_water_supply_usage.sql",
    import.meta.url,
  ),
);

describe("migration DDL contract (additive, verbatim, zero DML)", () => {
  const sql = readFileSync(MIGRATION_PATH, "utf8");

  it("adds the 4 usage columns NULLable with NO defaults", () => {
    for (const col of ["activity", "hour_meter", "water_in", "chlorine_usage"]) {
      expect(sql).toMatch(new RegExp(`ADD COLUMN IF NOT EXISTS ${col}\\s+(text|numeric)\\b`));
    }
    // No DEFAULT and no NOT NULL on any new column (unknown ≠ any value).
    expect(sql).not.toMatch(/ADD COLUMN IF NOT EXISTS \w+ [^,\n]*DEFAULT/i);
    expect(sql).not.toMatch(/ADD COLUMN IF NOT EXISTS \w+ [^,\n]*NOT NULL/i);
  });

  it("CHECK constraint carries the two verbatim activity values", () => {
    expect(sql).toContain("'ลงข้อมูลการใช้น้ำประจำวัน'");
    expect(sql).toContain("'ฟรีคลอรีน / TDS'");
    expect(sql).toMatch(/ck_daily_check_activity_values/);
  });

  it("creates water_supply.v_daily_check_chain with LAG tie-break (check_date, created_at, id)", () => {
    expect(sql).toMatch(/CREATE VIEW water_supply\.v_daily_check_chain/i);
    expect(sql).toMatch(/LAG\(d\.hour_meter\)\s+OVER/i);
    expect(sql).toMatch(/ORDER BY d\.check_date, d\.created_at, d\.id/);
    // Global-MAX bug never replicated.
    expect(sql).not.toMatch(/MAX\(SELECT/i);
  });

  it("hour delta ≤ 0 → NULL + boundary flag (never 0, never negative)", () => {
    expect(sql).toMatch(/hour_boundary_flag/);
    expect(sql).toMatch(/hour_boundary_reason/);
    expect(sql).toMatch(/<= 0 THEN NULL/);
    // The AppSheet clamp (<0 → 0) is NOT replicated.
    expect(sql).not.toMatch(/\* 3\.7 < 0/);
  });

  it("energy_use_estimate joins spec-at-date (pump_groundwater, half-open window)", () => {
    expect(sql).toMatch(/energy_use_estimate/);
    expect(sql).toMatch(/'pump_groundwater'/);
    expect(sql).toMatch(/es\.valid_from <= \w+\.check_date/);
    expect(sql).toMatch(/es\.valid_to IS NULL OR es\.valid_to > \w+\.check_date/);
    expect(sql).toMatch(/ORDER BY es\.valid_from DESC/);
  });

  it("water_in_estimate is spec-flow-driven — the ×8 constant is NEVER replicated", () => {
    expect(sql).toMatch(/water_in_estimate/);
    expect(sql).toMatch(/flow_m3_per_h/);
    expect(sql).not.toMatch(/\* 8\b/);
  });

  it("chlorine_usage_realy divides by (mix_part_chlorine + mix_part_water) — never a hardcoded 10", () => {
    expect(sql).toMatch(/chlorine_usage_realy/);
    expect(sql).toMatch(/chlorine_concentrated/);
    expect(sql).toMatch(/NULLIF\((\w+\.)?mix_part_chlorine \+ (\w+\.)?mix_part_water, 0\)/);
    expect(sql).not.toMatch(/\/\s*10\b/);
    expect(sql).toMatch(/'chlorine_mix_groundwater'/);
  });

  it("exposes the public security_invoker façade + grant + notify (P1.4 D1-7 pattern)", () => {
    expect(sql).toMatch(/CREATE VIEW public\.v_daily_check_chain WITH \(security_invoker=on\)/i);
    expect(sql).toMatch(/grant select on public\.v_daily_check_chain to authenticated/i);
    expect(sql).toMatch(/notify pgrst, 'reload schema'/);
  });

  it("is zero-DML (no row writes anywhere)", () => {
    expect(sql).not.toMatch(/INSERT INTO water_supply/i);
    expect(sql).not.toMatch(/UPDATE water_supply/i);
    expect(sql).not.toMatch(/DELETE FROM water_supply/i);
    expect(sql).not.toMatch(/TRUNCATE/i);
  });

  it("documents the rollback in the header", () => {
    expect(sql).toMatch(/ROLLBACK/);
    expect(sql).toMatch(/DROP VIEW IF EXISTS public\.v_daily_check_chain/);
    expect(sql).toMatch(/DROP COLUMN IF EXISTS activity/);
  });
});

// ─── §2.1 activity enum (verbatim, ref 2509–2519) ───────────────────────

describe("activity enum (verbatim §3.8)", () => {
  it("carries exactly the two verbatim values", () => {
    expect(ACTIVITY_OPTIONS).toEqual(["ลงข้อมูลการใช้น้ำประจำวัน", "ฟรีคลอรีน / TDS"]);
  });
  it("init default = ลงข้อมูลการใช้น้ำประจำวัน — UI default on create only", () => {
    expect(ACTIVITY_DEFAULT).toBe("ลงข้อมูลการใช้น้ำประจำวัน");
    expect(ACTIVITY_USAGE_MODE).toBe("ลงข้อมูลการใช้น้ำประจำวัน");
    expect(ACTIVITY_QUALITY_MODE).toBe("ฟรีคลอรีน / TDS");
  });
  it("form labels are the AppSheet column names + Thai prompts verbatim", () => {
    expect(LABEL_ACTIVITY).toBe("activity");
    expect(LABEL_HOUR_METER).toBe("Hour_meter");
    expect(LABEL_CHLORINE_USAGE).toBe("Chlorine usage");
    expect(LABEL_WATER_IN).toBe("Water_In");
    expect(PROMPT_ENERGY).toBe("ไฟฟ้าที่ใช้");
    expect(PROMPT_WATER_IN).toBe("บริมาณน้ำเข้า");
  });
});

// ─── §2.3 conditional display (Show If verbatim) ────────────────────────

describe("show-if groups (§2.3)", () => {
  it("usage fields show when activity = usage mode ∧ สถานที่ resolves โรงจ่ายคลอรีน", () => {
    expect(isUsageMode("ลงข้อมูลการใช้น้ำประจำวัน")).toBe(true);
    expect(isUsageMode("ฟรีคลอรีน / TDS")).toBe(false);
    expect(showUsageFields("ลงข้อมูลการใช้น้ำประจำวัน", "โรงจ่ายคลอรีน")).toBe(true);
    expect(showUsageFields("ฟรีคลอรีน / TDS", "โรงจ่ายคลอรีน")).toBe(false);
    expect(showUsageFields("ลงข้อมูลการใช้น้ำประจำวัน", "WARD")).toBe(false);
  });
  it("unset location resolves to the AppSheet init default โรงจ่ายคลอรีน (UI display only)", () => {
    expect(resolveLocationDisplay(null)).toBe(CHLORINE_STATION_DEFAULT);
    expect(resolveLocationDisplay(undefined)).toBe(CHLORINE_STATION_DEFAULT);
    expect(resolveLocationDisplay("โรงครัว")).toBe("โรงครัว");
    expect(showUsageFields("ลงข้อมูลการใช้น้ำประจำวัน", null)).toBe(true);
  });
  it("Water_In shows when activity ≠ ฟรีคลอรีน / TDS (ref 2573–2577)", () => {
    expect(showWaterIn("ลงข้อมูลการใช้น้ำประจำวัน")).toBe(true);
    expect(showWaterIn("ฟรีคลอรีน / TDS")).toBe(false);
    expect(showWaterIn(null)).toBe(true); // NULL activity ≠ quality mode
  });
});

// ─── §2.2-2 Water_In Valid If + verbatim error ──────────────────────────

describe("Water_In validation (>0, error verbatim)", () => {
  it("error text is verbatim ref 2567–2571", () => {
    expect(ERR_WATER_IN).toBe("ตรวจสอบข้อมูลดีๆก่อน");
  });
  it("empty passes (NULL ≠ violation — AppSheet blank handling)", () => {
    expect(validateWaterIn("")).toBeNull();
    expect(validateWaterIn(null)).toBeNull();
    expect(validateWaterIn(undefined)).toBeNull();
  });
  it("values ≤ 0 or non-numeric → the verbatim error", () => {
    expect(validateWaterIn("0")).toBe(ERR_WATER_IN);
    expect(validateWaterIn("-1")).toBe(ERR_WATER_IN);
    expect(validateWaterIn("-0.5")).toBe(ERR_WATER_IN);
    expect(validateWaterIn("abc")).toBe(ERR_WATER_IN);
  });
  it("positive values pass", () => {
    expect(validateWaterIn("5")).toBeNull();
    expect(validateWaterIn("0.1")).toBeNull();
    expect(validateWaterIn("123.45")).toBeNull();
  });
});

// ─── §2.4 view-math mirrors (testability only — never a write path) ─────

const SPECS: SpecRow[] = [
  {
    kind: "pump_groundwater",
    valid_from: "2024-01-09",
    valid_to: null,
    flow_m3_per_h: null,
    energy_kwh_per_h: 3.7,
    mix_part_chlorine: null,
    mix_part_water: null,
  },
  {
    kind: "pump_groundwater",
    valid_from: "2026-01-01",
    valid_to: "2026-06-01",
    flow_m3_per_h: 8,
    energy_kwh_per_h: 4,
    mix_part_chlorine: null,
    mix_part_water: null,
  },
  {
    kind: "chlorine_mix_groundwater",
    valid_from: "2024-01-09",
    valid_to: null,
    flow_m3_per_h: null,
    energy_kwh_per_h: null,
    mix_part_chlorine: 1,
    mix_part_water: 9,
  },
];

describe("spec-at-date pick (half-open window, latest start wins)", () => {
  it("picks the row covering the date; latest valid_from wins", () => {
    const s = pickSpecAtDate(SPECS, "pump_groundwater", "2025-06-01");
    expect(s?.energy_kwh_per_h).toBe(3.7);
    const s2 = pickSpecAtDate(
      [
        ...SPECS,
        {
          kind: "pump_groundwater",
          valid_from: "2025-03-01",
          valid_to: null,
          flow_m3_per_h: 9,
          energy_kwh_per_h: 3.9,
          mix_part_chlorine: null,
          mix_part_water: null,
        },
      ],
      "pump_groundwater",
      "2025-06-01",
    );
    expect(s2?.energy_kwh_per_h).toBe(3.9); // 2025-03-01 > 2024-01-09, both open
  });
  it("honors the half-open [valid_from, valid_to) boundary", () => {
    expect(pickSpecAtDate(SPECS, "pump_groundwater", "2026-01-01")?.flow_m3_per_h).toBe(8);
    expect(pickSpecAtDate(SPECS, "pump_groundwater", "2026-05-31")?.flow_m3_per_h).toBe(8);
    expect(pickSpecAtDate(SPECS, "pump_groundwater", "2026-06-01")?.energy_kwh_per_h).toBe(3.7); // valid_to exclusive
  });
  it("no covering row → NULL (missing spec is flagged downstream, never guessed)", () => {
    expect(pickSpecAtDate(SPECS, "pump_groundwater", "2024-01-08")).toBeNull();
    expect(pickSpecAtDate([], "pump_groundwater", "2025-01-01")).toBeNull();
  });
});

describe("hour_work delta guard (LAG semantics — never 0, never negative)", () => {
  it("both meters present with positive delta → the delta", () => {
    const r = hourWork(10, 6);
    expect(r.value).toBe(4);
    expect(r.boundary).toBe(false);
    expect(r.reason).toBeNull();
  });
  it("delta ≤ 0 → NULL + boundary flag + reason (meter reset/swap suspected)", () => {
    expect(hourWork(6, 10).value).toBeNull();
    expect(hourWork(6, 10).boundary).toBe(true);
    expect(hourWork(6, 10).reason).toBeTruthy();
    expect(hourWork(7, 7).value).toBeNull(); // 0 is boundary too
    expect(hourWork(7, 7).boundary).toBe(true);
  });
  it("missing previous (or current) hour meter → NULL; boundary only when current exists", () => {
    const r = hourWork(10, null);
    expect(r.value).toBeNull();
    expect(r.boundary).toBe(true);
    expect(r.reason).toBeTruthy();
    expect(hourWork(null, 6).value).toBeNull();
    expect(hourWork(null, 6).boundary).toBe(false);
    expect(hourWork(null, null).value).toBeNull();
    expect(hourWork(null, null).boundary).toBe(false);
  });
  it("the guard NEVER emits 0 or a negative hour value", () => {
    for (const [cur, prev] of [[6, 10], [7, 7], [0, 5], [5, 5.5]] as const) {
      const v = hourWork(cur, prev).value;
      expect(v === null || v > 0).toBe(true);
    }
  });
});

describe("energy_use_estimate (A2: hours × spec-at-date, flagged estimate)", () => {
  it("flag label verbatim: ค่าประมาณจากสเปก", () => {
    expect(FLAG_ENERGY_ESTIMATE).toBe("ค่าประมาณจากสเปก");
  });
  it("hours × spec energy (3.7 seed), never a hardcoded ×3.7", () => {
    const est = energyUseEstimate(4, { energy_kwh_per_h: 3.7 });
    expect(est.value).toBeCloseTo(14.8);
    expect(est.specMissing).toBe(false);
    const est2 = energyUseEstimate(2, { energy_kwh_per_h: 4 });
    expect(est2.value).toBeCloseTo(8);
  });
  it("missing hours or missing spec → NULL + specMissing (never 0)", () => {
    expect(energyUseEstimate(null, { energy_kwh_per_h: 3.7 })).toEqual({ value: null, specMissing: false });
    expect(energyUseEstimate(4, null).value).toBeNull();
    expect(energyUseEstimate(4, null).specMissing).toBe(true);
    expect(energyUseEstimate(4, { energy_kwh_per_h: null }).value).toBeNull();
    expect(energyUseEstimate(4, { energy_kwh_per_h: null }).specMissing).toBe(true);
  });
});

describe("water_in_estimate (D1-5: spec-flow-driven — NEVER ×8)", () => {
  it("flag label verbatim: ประมาณจากชั่วโมงปั๊ม", () => {
    expect(FLAG_WATER_IN_ESTIMATE).toBe("ประมาณจากชั่วโมงปั๊ม");
  });
  it("hours × spec flow when the spec flow exists", () => {
    const est = waterInEstimate(4, { flow_m3_per_h: 8 });
    expect(est.value).toBe(32);
    expect(est.specMissing).toBe(false);
  });
  it("no flow in spec (live seed reality) → NULL + specMissing — honest unknown, never 8, never 0", () => {
    const est = waterInEstimate(4, { flow_m3_per_h: null });
    expect(est.value).toBeNull();
    expect(est.specMissing).toBe(true);
    expect(waterInEstimate(null, { flow_m3_per_h: 8 })).toEqual({ value: null, specMissing: false });
  });
});

describe("chlorine_usage_realy ÷(1+9) derivation (D1-4 — never hardcoded 10)", () => {
  it("divides by the mix parts sum (1+9 = 10 = the 10% stock semantics)", () => {
    const r = chlorineUsageReal(5, { mix_part_chlorine: 1, mix_part_water: 9 });
    expect(r.value).toBeCloseTo(0.5);
    expect(r.specMissing).toBe(false);
    const r2 = chlorineUsageReal(10, { mix_part_chlorine: 2, mix_part_water: 8 });
    expect(r2.value).toBeCloseTo(1); // derivation, not /10 literal
  });
  it("missing usage → NULL (no flag); missing spec or null parts → NULL + specMissing", () => {
    expect(chlorineUsageReal(null, { mix_part_chlorine: 1, mix_part_water: 9 })).toEqual({
      value: null,
      specMissing: false,
    });
    const miss = chlorineUsageReal(5, null);
    expect(miss.value).toBeNull();
    expect(miss.specMissing).toBe(true);
    const parts = chlorineUsageReal(5, { mix_part_chlorine: null, mix_part_water: 9 });
    expect(parts.value).toBeNull();
    expect(parts.specMissing).toBe(true);
  });
});

// ─── §2.4-4 no-fallback invariants (binding) ────────────────────────────

describe("no-fallback invariants (unknown ≠ 0)", () => {
  it("the lib never emits the fallback constants 60 / 8 / 0-fill as substitutes", () => {
    const unknowns: Array<[number | null, { flow_m3_per_h: number | null } | null]> = [
      [null, { flow_m3_per_h: null }],
      [4, null],
      [null, null],
    ];
    for (const [hw, spec] of unknowns) {
      const w = waterInEstimate(hw, spec);
      expect(w.value).not.toBe(60);
      expect(w.value).not.toBe(8);
      expect(w.value === null || w.value > 0).toBe(true);
    }
  });
});

// ─── lib/water-supply.ts wiring contract ────────────────────────────────

describe("water-supply lib wiring contract", () => {
  it("COLUMNS includes the 4 new columns", async () => {
    const mod = await import("./water-supply");
    expect(mod.COLUMNS).toContain("activity");
    expect(mod.COLUMNS).toContain("hour_meter");
    expect(mod.COLUMNS).toContain("water_in");
    expect(mod.COLUMNS).toContain("chlorine_usage");
  });
  it("exposes the chain-view read (namespaced cache key)", async () => {
    const mod = await import("./water-supply");
    expect(typeof mod.fetchWaterSupplyChain).toBe("function");
    expect(typeof mod.useWaterSupplyChain).toBe("function");
    expect(mod.WATER_SUPPLY_CHAIN_TABLE).toBe("v_daily_check_chain");
  });
});
