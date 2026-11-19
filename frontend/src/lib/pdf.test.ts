/**
 * ENV-PARITY-P4-001 — ทส.1/ทส.2 print-ready report model tests.
 *
 * Ground truth: the D1 DRIVE enumeration (handoff §5 D1) —
 *   ทส.1 = `261109_PDF_TEMPLATE_ทส1_V5.1.3_หมอปรัช.docx`
 *          (1ptC4G55ftF3Dv74RaL8Vd-yNFgqWsTcc, sha256 378be461…, 2,657,668 B)
 *   ทส.2 = `ทส.2_Template_หมอปรัช` Google Docs
 *          (1Wj16uu2q5pTbWTeOs-U6rOpH7X79h6zP2yDudEGkU80, export sha256 c6e67afa…, 8,684 B)
 * Field layouts mirrored from the drive files; census-vs-drive divergences
 * recorded in the handoff (drive-file wins).
 *
 * House rules under test (WO §2/D1-5):
 *   - the ทส.2 address header renders the B7 TABLE values (core.address),
 *     never the template constants masquerading as data
 *   - พ.ศ. everywhere (month_thai verbatim class, year +543)
 *   - unknown ≠ 0 (missing telemetry = null, never 0)
 *   - estimate provenance flags travel into the model that the printed
 *     output renders (meter-delta energy, ×1.2 chlorine litter)
 *   - ผู้บันทึก / personnel identity NEVER enters the report
 */
import { describe, expect, it } from "vitest";
import type { DashboardRow } from "./types";
import type { ReportMeterChainRow, ReportReadingRow } from "./report-summary";
import type { ReadingRunStatusRow } from "./supabase-queries";
import {
  buildTs1PrintModel,
  buildTs2PrintModel,
} from "./pdf";

const MONTH = "2026-11";
const START = "2026-11-01";
const END = "2026-11-30";

function reading(partial: Partial<ReportReadingRow> & { id: string; reading_date: string }): ReportReadingRow {
  return {
    do_aeration: null, do_sedimentation: null, do_before_discharge: null,
    ph: null, free_chlorine: null, tds_aeration: null, tds_before_discharge: null,
    sv30: null, wastewater_in: null, chlorine_used: null, chlorine_mix_ratio: null,
    excess_sludge_removed: null,
    ...partial,
  };
}

function chain(partial: Partial<ReportMeterChainRow> & { id: string; reading_date: string }): ReportMeterChainRow {
  return {
    delta_kwh: null, pump1_m3: null, pump2_m3: null, chlorine_used_real: null,
    meter_boundary_flag: false, meter_boundary_reason: null, spec_missing: false,
    spec_missing_kinds: null,
    ...partial,
  };
}

function dash(partial: Partial<DashboardRow> & { reading_date: string }): DashboardRow {
  return {
    do_average: null, ph: null, free_chlorine: null, tds_aeration: null,
    water_used_total: null, wastewater_in: null, system_operating: null,
    wastewater_discharged: null, do_alert: null, chlorine_alert: null,
    ph_alert: null,
    ...partial,
  };
}

function run(partial: Partial<ReadingRunStatusRow> & { id: string; reading_date: string }): ReadingRunStatusRow {
  return {
    pump1_running: null, pump2_running: null, aerator1_running: null,
    aerator2_running: null, sludge_pump1_running: null, sludge_pump2_running: null,
    chlorine_pump1_running: null, chlorine_pump2_running: null,
    ...partial,
  };
}

const ADDR_ROW = {
  tambon_thai: "อุทัยใหม่",
  district_thai: "อุทัยธานี",
  province_thai: "พระนครศรีอยุธยา",
};

describe("buildTs1PrintModel — the V5.1.3 drive-template layout", () => {
  it("mirrors the 18-column census layout verbatim (drive-file authority)", () => {
    const model = buildTs1PrintModel({
      month: MONTH,
      dashboardRows: [dash({ reading_date: "2026-11-02" })],
      readings: [reading({ id: "r1", reading_date: "2026-11-02" })],
      chain: [chain({ id: "c1", reading_date: "2026-11-02", delta_kwh: 42.5 })],
      runStatus: [run({ id: "s1", reading_date: "2026-11-02", pump1_running: true })],
    });
    expect(model.columns).toHaveLength(18);
    expect(model.columns[0]).toContain("วันเดือนปี");
    expect(model.columns[1]).toContain("ปริมาณการใช้ไฟฟ้าของระบบบำบัดน้ำเสีย");
    expect(model.columns[2]).toContain("ปริมาณน้ำใช้ในทุกกิจกรรมของแหล่งกำเนิดมลพิษ");
    expect(model.columns[3]).toContain("ปริมาณน้ำเสียที่เข้าระบบบ่อบำบัดน้ำเสีย");
    expect(model.columns[4]).toContain("การระบายน้ำทิ้งจากระบบบำบัดน้ำเสีย");
    expect(model.columns[5]).toContain("ปริมาณสารเคมีหรือสารสกัดชีวภาพที่ใช้");
    expect(model.columns[5]).toContain("คลอรีนน้ำ");
    expect(model.columns[6]).toContain("ตะกอนส่วนเกินที่นำไปกำจัด");
    expect(model.columns[7]).toContain("ปริมาณของแข็งละลายน้ำ");
    expect(model.columns[8]).toContain("ปริมาณออกซิเจนละลายน้ำ");
    // equipment group (drive-template labels)
    expect(model.columns[9]).toContain("เครื่องสูบน้ำ 1");
    expect(model.columns[10]).toContain("เครื่องสูบน้ำ 2");
    expect(model.columns[11]).toContain("เครื่องเติมอากาศ 1");
    expect(model.columns[12]).toContain("เครื่องเติมอากาศ 2");
    expect(model.columns[13]).toContain("เครื่องสูบตะกอน 1");
    expect(model.columns[14]).toContain("เครื่องสูบตะกอน 2");
    expect(model.columns[15]).toContain("เครื่องจ่ายคลอรีน 1");
    expect(model.columns[16]).toContain("เครื่องจ่ายคลอรีน 2");
    expect(model.columns[17]).toContain("ผู้บันทึก");
  });

  it("renders พ.ศ. dates (+543) and the Thai month in the title", () => {
    const model = buildTs1PrintModel({
      month: MONTH,
      dashboardRows: [dash({ reading_date: "2026-11-02" })],
      readings: [reading({ id: "r1", reading_date: "2026-11-02" })],
      chain: [chain({ id: "c1", reading_date: "2026-11-02" })],
      runStatus: [],
    });
    expect(model.monthThai).toBe("พฤศจิกายน");
    expect(model.yearThai).toBe(2569);
    expect(model.rows[0]?.dateThai).toContain("2569");
  });

  it("unknown ≠ zero — boundary/no-value cells stay null, never coerced to 0", () => {
    const model = buildTs1PrintModel({
      month: MONTH,
      dashboardRows: [dash({ reading_date: "2026-11-02", water_used_total: null, wastewater_in: null })],
      readings: [reading({ id: "r1", reading_date: "2026-11-02", chlorine_used: null })],
      chain: [chain({ id: "c1", reading_date: "2026-11-02", delta_kwh: null, meter_boundary_flag: true })],
      runStatus: [],
    });
    const row = model.rows[0];
    expect(row).toBeTruthy();
    expect(row?.energy).toBeNull();
    expect(row?.chlorine).toBeNull();
    expect(row?.waterUsed).toBeNull();
  });

  it("maps the 8 equipment-run booleans in template order (true/false/null kept)", () => {
    const model = buildTs1PrintModel({
      month: MONTH,
      dashboardRows: [dash({ reading_date: "2026-11-02" })],
      readings: [reading({ id: "r1", reading_date: "2026-11-02" })],
      chain: [chain({ id: "c1", reading_date: "2026-11-02" })],
      runStatus: [run({
        id: "s1", reading_date: "2026-11-02",
        pump1_running: true, pump2_running: false,
        aerator1_running: true, aerator2_running: true,
        sludge_pump1_running: null, sludge_pump2_running: null,
        chlorine_pump1_running: true, chlorine_pump2_running: false,
      })],
    });
    const row = model.rows[0];
    expect(row?.equipment).toEqual([true, false, true, true, null, null, true, false]);
  });

  it("counts recorded vs missing days honestly (never 0-fills the gap)", () => {
    const model = buildTs1PrintModel({
      month: MONTH,
      dashboardRows: [dash({ reading_date: "2026-11-02" })],
      readings: [reading({ id: "r1", reading_date: "2026-11-02" })],
      chain: [chain({ id: "c1", reading_date: "2026-11-02" })],
      runStatus: [],
    });
    // only the recorded day becomes a row (the AppSheet START loop class)
    expect(model.rows).toHaveLength(1);
    expect(model.recordedDays).toBe(1);
    expect(model.missingDays).toBe(29); // November = 30 calendar days
  });

  it("NEVER renders personnel identity — the ผู้บันทึก column stays empty", () => {
    const model = buildTs1PrintModel({
      month: MONTH,
      dashboardRows: [dash({ reading_date: "2026-11-02" })],
      readings: [reading({ id: "r1", reading_date: "2026-11-02" })],
      chain: [chain({ id: "c1", reading_date: "2026-11-02" })],
      runStatus: [],
    });
    expect(model.rows[0]?.recorder).toBeNull();
  });

  it("carries the energy meter-delta provenance into the printed model", () => {
    const model = buildTs1PrintModel({
      month: MONTH,
      dashboardRows: [],
      readings: [],
      chain: [],
      runStatus: [],
    });
    expect(model.energyProvenance).toContain("delta");
    expect(model.energyProvenance).toContain("มิเตอร์");
  });
});

describe("buildTs2PrintModel — the ทส.2 gdoc-template layout", () => {
  function ts2Input(address: typeof ADDR_ROW | null, overrides: {
    dash?: DashboardRow[];
    run?: ReadingRunStatusRow[];
  } = {}) {
    return {
      month: MONTH,
      startISO: START,
      endISO: END,
      dashboardRows: overrides.dash ?? [
        dash({ reading_date: "2026-11-02", wastewater_discharged: true, system_operating: true }),
        dash({ reading_date: "2026-11-03", wastewater_discharged: true, system_operating: true }),
      ],
      readings: [
        reading({ id: "r1", reading_date: "2026-11-02", wastewater_in: 10 }),
        reading({ id: "r2", reading_date: "2026-11-03", wastewater_in: 5 }),
      ],
      chain: [
        chain({ id: "c1", reading_date: "2026-11-02", delta_kwh: 30, chlorine_used_real: 2 }),
        chain({ id: "c2", reading_date: "2026-11-03", delta_kwh: 12, chlorine_used_real: 1 }),
      ],
      waterChain: [],
      runStatus: overrides.run ?? [run({
        id: "s1", reading_date: "2026-11-02",
        pump1_running: true, pump2_running: true,
        aerator1_running: true, aerator2_running: true,
        sludge_pump1_running: true, sludge_pump2_running: true,
        chlorine_pump1_running: true, chlorine_pump2_running: true,
      })],
      address,
    };
  }

  it("renders the ADDRESS HEADER from the B7 table — not the template constants", () => {
    const model = buildTs2PrintModel(ts2Input(ADDR_ROW));
    expect(model.addressHeader.tambon).toBe("อุทัยใหม่"); // the TABLE value (template constant is "อุทัย")
    expect(model.addressHeader.district).toBe("อุทัยธานี");
    expect(model.addressHeader.province).toBe("พระนครศรีอยุธยา");
    expect(model.addressHeader.missing).toBe(false);
  });

  it("absent census row → the honest missing-address flag, ค่าว่าง slots (never fabricated)", () => {
    const model = buildTs2PrintModel(ts2Input(null));
    expect(model.addressHeader.missing).toBe(true);
    expect(model.addressHeader.tambon).toBeNull();
    expect(model.addressHeader.district).toBeNull();
    expect(model.addressHeader.province).toBeNull();
  });

  it("renders พ.ศ. month/year (month_thai verbatim class, +543)", () => {
    const model = buildTs2PrintModel(ts2Input(ADDR_ROW));
    expect(model.monthThai).toBe("พฤศจิกายน");
    expect(model.yearThai).toBe(2569);
  });

  it("§๓ aggregate rows carry estimate/provenance flags into the printed model", () => {
    const model = buildTs2PrintModel(ts2Input(ADDR_ROW));
    // Sum_Energy — meter-delta provenance travels to print
    expect(model.section3.sumEnergy).toBeCloseTo(42);
    expect(model.section3.sumEnergyProvenance).toContain("มิเตอร์");
    // useage_Chlorine — the ×1.2 W/V litter factor is displayed on its own line
    expect(model.section3.chlorineReal).toBeCloseTo(3);
    expect(model.section3.chlorineLitter).toBeCloseTo(3.6);
    expect(model.section3.chlorineProvenance).toContain("1.2");
    // Sum_waste_water / Sum_excess sludge
    expect(model.section3.sumWasteWater).toBeCloseTo(15);
  });

  it("§๓(๔) การระบายน้ำทิ้ง is COMPUTED from recorded rows — never an asserted constant", () => {
    const all = buildTs2PrintModel(ts2Input(ADDR_ROW));
    expect(all.section3.dischargeLine).toContain("ระบายทุกวัน");

    const partial = buildTs2PrintModel(ts2Input(ADDR_ROW, {
      dash: [
        dash({ reading_date: "2026-11-02", wastewater_discharged: true, system_operating: true }),
        dash({ reading_date: "2026-11-03", wastewater_discharged: false, system_operating: true }),
      ],
    }));
    expect(partial.section3.dischargeLine).toContain("1");
    expect(partial.section3.dischargeLine).not.toContain("ทุกวัน");

    const none = buildTs2PrintModel(ts2Input(ADDR_ROW, { dash: [] }));
    expect(none.section3.dischargeLine).toContain("ค่าว่าง");
  });

  it("§๓(๖) equipment operation statuses are computed — ผิดปกติ/ค่าว่าง, never blind ☑ปกติ", () => {
    const ok = buildTs2PrintModel(ts2Input(ADDR_ROW));
    const pumps = ok.section3.operations.find((o) => o.label === "เครื่องสูบน้ำ");
    expect(pumps?.status).toContain("ปกติ");

    const broken = buildTs2PrintModel(ts2Input(ADDR_ROW, {
      run: [run({
        id: "s1", reading_date: "2026-11-02",
        pump1_running: false, pump2_running: true,
        aerator1_running: true, aerator2_running: true,
        sludge_pump1_running: true, sludge_pump2_running: true,
        chlorine_pump1_running: true, chlorine_pump2_running: true,
      })],
    }));
    const pumpsBroken = broken.section3.operations.find((o) => o.label === "เครื่องสูบน้ำ");
    expect(pumpsBroken?.status).toContain("ผิดปกติ");

    const mixer = ok.section3.operations.find((o) => o.label.includes("เครื่องกวน"));
    expect(mixer?.status).toContain("ค่าว่าง");
  });

  it("counts recorded vs missing days for the honesty line", () => {
    const model = buildTs2PrintModel(ts2Input(ADDR_ROW));
    expect(model.recordedDays).toBe(2);
    expect(model.missingDays).toBe(28); // 30 − 2
  });

  it("no personnel identity anywhere in the ทส.2 model", () => {
    const model = buildTs2PrintModel(ts2Input(ADDR_ROW));
    const json = JSON.stringify(model);
    expect(json).not.toContain("ปรัชญา");
    expect(json).not.toContain("เศกสรรค์");
  });
});
