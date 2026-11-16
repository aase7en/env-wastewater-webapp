/**
 * ENV-PARITY-P1-004 — unit tests for the pure form-parity lib.
 *
 * Pins the AppSheet §3.3 parity surface VERBATIM (reference doc 12, lines
 * pinned per WO §2.1/§2.2/§2.3):
 *   - enum value lists + initial values (UI defaults on create only)
 *   - boolean ↔ enum mapping (booleans REMAIN source of truth)
 *   - validation rules with the verbatim Thai error texts
 *   - the >2.5 free-chlorine FORMAT rule (strictly greater; 2.5 NOT flagged)
 *   - honest warnings: missing Water_In → EMPTY + chip (NEVER 60/0),
 *     missing pump meters → "ยังไม่มีมิเตอร์สูบ" (never the AppSheet
 *     text prompt in any value)
 *   - ผู้บันทึก eligibility (position ∈ {นักวิชาการสาธารณสุข,
 *     พนักงานบริการ} ∧ สถานะ = ทำงาน)
 */
import { describe, it, expect } from "vitest";
import {
  MIX_RATIO_OPTIONS,
  MIX_RATIO_DEFAULT,
  SCREEN_CLEAN_OPTIONS,
  MACHINE_STATUS_OPTIONS,
  DISCHARGE_OPTIONS,
  SYSTEM_OPERATING_OPTIONS,
  EXCESS_SLUDGE_OPTIONS,
  COLOR_OPTIONS,
  SMELL_OPTIONS,
  COLOR_DEFAULT,
  SMELL_DEFAULT,
  ERR_FREE_CHLORINE,
  ERR_ELECTRICITY,
  ERR_WASTEWATER_IN,
  CHIP_NO_WATER_RECORD,
  CHIP_NO_PUMP_METERS,
  RECORDER_POSITIONS,
  RECORDER_STATUS_ACTIVE,
  createDefaults,
  screenCleanedToEnum,
  screenCleanedFromEnum,
  runningToEnum,
  runningFromEnum,
  dischargeToEnum,
  dischargeFromEnum,
  systemOperatingToEnum,
  systemOperatingFromEnum,
  buildStatusMirror,
  STATUS_KEYS,
  validateFreeChlorine,
  validateElectricity,
  validateWastewaterIn,
  isEligibleRecorder,
  isFreeChlorineHigh,
  deriveWaterUsed,
  needsNoWaterRecordChip,
  needsNoPumpMeterChip,
} from "./form-parity";

describe("enum value lists (verbatim §3.3)", () => {
  it("อัตราส่วนผสม(คลอรีน/น้ำ) = 1:2 / 1:4 / 1:9 with initial 1:4", () => {
    expect(MIX_RATIO_OPTIONS).toEqual(["1:2", "1:4", "1:9"]);
    expect(MIX_RATIO_DEFAULT).toBe("1:4");
  });
  it("ล้างตะแกรง enums = ไม่ล้าง / ล้าง", () => {
    expect(SCREEN_CLEAN_OPTIONS).toEqual(["ไม่ล้าง", "ล้าง"]);
  });
  it("machine enums = ปกติ / เสีย", () => {
    expect(MACHINE_STATUS_OPTIONS).toEqual(["ปกติ", "เสีย"]);
  });
  it("การระบายน้ำทิ้ง enums = ระบาย / ไม่ระบาย", () => {
    expect(DISCHARGE_OPTIONS).toEqual(["ระบาย", "ไม่ระบาย"]);
  });
  it("ระบบบำบัด enums = ปกติ / ผิดปกติ", () => {
    expect(SYSTEM_OPERATING_OPTIONS).toEqual(["ปกติ", "ผิดปกติ"]);
  });
  it("ตะกอนส่วนเกินที่นำไปกำจัด = 1.35 / 2.7 / 5.4 / 8.1", () => {
    expect(EXCESS_SLUDGE_OPTIONS).toEqual(["1.35", "2.7", "5.4", "8.1"]);
  });
  it("ลักษณะสี includes the third verbatim option ดำ", () => {
    expect(COLOR_OPTIONS).toEqual(["น้ำตาลอ่อน", "น้ำตาลเข้ม", "ดำ"]);
  });
  it("ลักษณะกลิ่น includes the two verbatim options", () => {
    expect(SMELL_OPTIONS).toEqual([
      "กลิ่นดินปกติ",
      "กลิ่นเหม็นแก๊สไข้เน่า",
      "อื่นๆ",
    ]);
    expect(SMELL_DEFAULT).toBe("กลิ่นดินปกติ");
    expect(COLOR_DEFAULT).toBe("น้ำตาลเข้ม");
  });
});

describe("createDefaults (AppSheet initial values — UI defaults on create only)", () => {
  it("carries the verbatim initial values", () => {
    const d = createDefaults();
    expect(d.chlorine_mix_ratio).toBe("1:4");
    expect(d.screen_cleaned_coarse).toBe(false); // ไม่ล้าง
    expect(d.screen_cleaned_fine).toBe(true); // ล้าง
    expect(d.pump1_running).toBe(true); // ปกติ
    expect(d.pump2_running).toBe(true);
    expect(d.aerator1_running).toBe(true);
    expect(d.aerator2_running).toBe(true);
    expect(d.sludge_pump1_running).toBe(true);
    expect(d.sludge_pump2_running).toBe(true);
    expect(d.chlorine_pump1_running).toBe(true);
    expect(d.chlorine_pump2_running).toBe(true);
    expect(d.wastewater_discharged).toBe(true); // ระบาย
    expect(d.system_operating).toBe(true); // ปกติ
  });
  it("NEVER pre-fills measured values (no 60, no 0 — unknown ≠ zero)", () => {
    const d = createDefaults() as Record<string, unknown>;
    expect(d.water_used_total).toBe("");
    expect(d.wastewater_in).toBe("");
    expect(d.free_chlorine).toBe("");
    expect(Object.values(d)).not.toContain(60);
    expect(Object.values(d)).not.toContain(0);
  });
});

describe("boolean ↔ enum mapping (booleans stay source of truth)", () => {
  it("screen cleaned: true↔ล้าง, false↔ไม่ล้าง, null↔empty", () => {
    expect(screenCleanedToEnum(true)).toBe("ล้าง");
    expect(screenCleanedToEnum(false)).toBe("ไม่ล้าง");
    expect(screenCleanedToEnum(null)).toBe("");
    expect(screenCleanedFromEnum("ล้าง")).toBe(true);
    expect(screenCleanedFromEnum("ไม่ล้าง")).toBe(false);
    expect(screenCleanedFromEnum("")).toBe(null);
  });
  it("running: true↔ปกติ, false↔เสีย, null↔empty", () => {
    expect(runningToEnum(true)).toBe("ปกติ");
    expect(runningToEnum(false)).toBe("เสีย");
    expect(runningToEnum(null)).toBe("");
    expect(runningFromEnum("ปกติ")).toBe(true);
    expect(runningFromEnum("เสีย")).toBe(false);
    expect(runningFromEnum("")).toBe(null);
  });
  it("discharge: true↔ระบาย, false↔ไม่ระบาย", () => {
    expect(dischargeToEnum(true)).toBe("ระบาย");
    expect(dischargeToEnum(false)).toBe("ไม่ระบาย");
    expect(dischargeFromEnum("ระบาย")).toBe(true);
    expect(dischargeFromEnum("ไม่ระบาย")).toBe(false);
  });
  it("system operating: true↔ปกติ, false↔ผิดปกติ", () => {
    expect(systemOperatingToEnum(true)).toBe("ปกติ");
    expect(systemOperatingToEnum(false)).toBe("ผิดปกติ");
    expect(systemOperatingFromEnum("ปกติ")).toBe(true);
    expect(systemOperatingFromEnum("ผิดปกติ")).toBe(false);
  });
});

describe("status mirror (*_status columns written alongside booleans)", () => {
  it("exposes exactly the 10 P1.1 status keys", () => {
    expect(STATUS_KEYS).toHaveLength(10);
    expect(STATUS_KEYS).toContain("pump1_running_status");
    expect(STATUS_KEYS).toContain("screen_cleaned_coarse_status");
  });
  it("derives each status from its boolean (sync by construction)", () => {
    const mirror = buildStatusMirror({
      screen_cleaned_coarse: true,
      screen_cleaned_fine: false,
      pump1_running: true,
      pump2_running: false,
      aerator1_running: true,
      aerator2_running: false,
      sludge_pump1_running: true,
      sludge_pump2_running: false,
      chlorine_pump1_running: true,
      chlorine_pump2_running: false,
    });
    expect(mirror.screen_cleaned_coarse_status).toBe("ล้าง");
    expect(mirror.screen_cleaned_fine_status).toBe("ไม่ล้าง");
    expect(mirror.pump1_running_status).toBe("ปกติ");
    expect(mirror.pump2_running_status).toBe("เสีย");
    expect(mirror.chlorine_pump2_running_status).toBe("เสีย");
  });
  it("keeps unknown booleans as NULL statuses (never a guessed value)", () => {
    const mirror = buildStatusMirror({ pump1_running: null });
    expect(mirror.pump1_running_status).toBe(null);
  });
});

describe("validation rules (verbatim Thai error texts)", () => {
  it("error texts match the AppSheet Invalid value errors verbatim", () => {
    expect(ERR_FREE_CHLORINE).toBe("แน่ใจหรือที่จะลงข้อมูลนี้");
    expect(ERR_ELECTRICITY).toBe("ตรวจสอบข้อมูลดีๆนะจ๊ะ");
    expect(ERR_WASTEWATER_IN).toBe("ข้อมูลผิดพลาด");
  });
  it("Free Chlorine accepts 0 and 100 (Min 0 / Max 100, ref 456–474)", () => {
    expect(validateFreeChlorine("")).toBe(null);
    expect(validateFreeChlorine("0")).toBe(null);
    expect(validateFreeChlorine("100")).toBe(null);
    expect(validateFreeChlorine("2.5")).toBe(null);
  });
  it("Free Chlorine rejects out-of-range with แน่ใจหรือที่จะลงข้อมูลนี้", () => {
    expect(validateFreeChlorine("-1")).toBe(ERR_FREE_CHLORINE);
    expect(validateFreeChlorine("101")).toBe(ERR_FREE_CHLORINE);
    expect(validateFreeChlorine("abc")).toBe(ERR_FREE_CHLORINE);
  });
  it("Electricity accepts only >0 (Valid If ref 607)", () => {
    expect(validateElectricity("")).toBe(null);
    expect(validateElectricity("0.5")).toBe(null);
    expect(validateElectricity("12")).toBe(null);
  });
  it("Electricity rejects <=0 with ตรวจสอบข้อมูลดีๆนะจ๊ะ (ref 613)", () => {
    expect(validateElectricity("0")).toBe(ERR_ELECTRICITY);
    expect(validateElectricity("-3")).toBe(ERR_ELECTRICITY);
    expect(validateElectricity("abc")).toBe(ERR_ELECTRICITY);
  });
  it("Wastewater-in rejects non-numeric/negative with ข้อมูลผิดพลาด (ref 643)", () => {
    expect(validateWastewaterIn("")).toBe(null);
    expect(validateWastewaterIn("12.5")).toBe(null);
    expect(validateWastewaterIn("-1")).toBe(ERR_WASTEWATER_IN);
    expect(validateWastewaterIn("ไม่มีข้อมูล")).toBe(ERR_WASTEWATER_IN);
  });
});

describe("ผู้บันทึก eligibility (Valid If ref 716–720)", () => {
  it("exposes the verbatim position set + active status", () => {
    expect(RECORDER_POSITIONS).toEqual(["นักวิชาการสาธารณสุข", "พนักงานบริการ"]);
    expect(RECORDER_STATUS_ACTIVE).toBe("ทำงาน");
  });
  it("accepts eligible active personnel", () => {
    expect(isEligibleRecorder({ position: "นักวิชาการสาธารณสุข", status: "ทำงาน" })).toBe(true);
    expect(isEligibleRecorder({ position: "พนักงานบริการ", status: "ทำงาน" })).toBe(true);
  });
  it("rejects นายแพทย์, non-active, and unknown rows", () => {
    expect(isEligibleRecorder({ position: "นายแพทย์", status: "ทำงาน" })).toBe(false);
    expect(isEligibleRecorder({ position: "นักวิชาการสาธารณสุข", status: "ลาออก" })).toBe(false);
    expect(isEligibleRecorder({ position: null, status: "ทำงาน" })).toBe(false);
    expect(isEligibleRecorder({ position: "นักโภชนาการ", status: "ทำงาน" })).toBe(false);
  });
});

describe("format rule Cl>2.5 (ref §10 Format Rules, line 6429 — strictly >)", () => {
  it("flags values strictly greater than 2.5", () => {
    expect(isFreeChlorineHigh(2.6)).toBe(true);
    expect(isFreeChlorineHigh(3)).toBe(true);
    expect(isFreeChlorineHigh("2.51")).toBe(true);
    expect(isFreeChlorineHigh(100)).toBe(true);
  });
  it("does NOT flag 2.5 exactly", () => {
    expect(isFreeChlorineHigh(2.5)).toBe(false);
    expect(isFreeChlorineHigh("2.5")).toBe(false);
  });
  it("does NOT flag missing/low values", () => {
    expect(isFreeChlorineHigh(null)).toBe(false);
    expect(isFreeChlorineHigh(undefined)).toBe(false);
    expect(isFreeChlorineHigh(0)).toBe(false);
    expect(isFreeChlorineHigh("")).toBe(false);
    expect(isFreeChlorineHigh("abc")).toBe(false);
  });
});

describe("honest warnings — no-fallback-60 invariant (ref 616–622)", () => {
  it("chip texts are verbatim", () => {
    expect(CHIP_NO_WATER_RECORD).toBe("ยังไม่มีบันทึกน้ำประปาของวัน");
    expect(CHIP_NO_PUMP_METERS).toBe("ยังไม่มีมิเตอร์สูบ");
  });
  it("missing water record derives EMPTY (never 60, never 0)", () => {
    expect(deriveWaterUsed(null)).toBe(null);
    expect(deriveWaterUsed(undefined)).toBe(null);
    expect(needsNoWaterRecordChip(null)).toBe(true);
    expect(needsNoWaterRecordChip(undefined)).toBe(true);
  });
  it("a present record derives the record's own value (not 60)", () => {
    expect(deriveWaterUsed(45)).toBe(45);
    expect(deriveWaterUsed("38.5")).toBe(38.5);
    expect(needsNoWaterRecordChip(45)).toBe(false);
  });
  it("a present-but-valueless record still counts as missing (unknown ≠ zero)", () => {
    expect(needsNoWaterRecordChip(null)).toBe(true);
  });
  it("missing pump-meter chain row → ยังไม่มีมิเตอร์สูบ", () => {
    expect(needsNoPumpMeterChip(null)).toBe(true);
    expect(needsNoPumpMeterChip(undefined)).toBe(true);
  });
  it("boundary-flagged or spec-missing chain rows → ยังไม่มีมิเตอร์สูบ", () => {
    expect(
      needsNoPumpMeterChip({
        meter_boundary_flag: true,
        spec_missing: false,
        prev_pump1_meter: 100,
        prev_pump2_meter: 200,
      })
    ).toBe(true);
    expect(
      needsNoPumpMeterChip({
        meter_boundary_flag: false,
        spec_missing: true,
        prev_pump1_meter: 100,
        prev_pump2_meter: 200,
      })
    ).toBe(true);
  });
  it("a healthy chain row with both prev meters does NOT show the chip", () => {
    expect(
      needsNoPumpMeterChip({
        meter_boundary_flag: false,
        spec_missing: false,
        prev_pump1_meter: 100,
        prev_pump2_meter: 200,
      })
    ).toBe(false);
  });
  it("a chain row missing either prev meter → chip", () => {
    expect(
      needsNoPumpMeterChip({
        meter_boundary_flag: false,
        spec_missing: false,
        prev_pump1_meter: null,
        prev_pump2_meter: 200,
      })
    ).toBe(true);
  });
});
