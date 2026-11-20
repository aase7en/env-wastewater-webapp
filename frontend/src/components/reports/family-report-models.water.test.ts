/**
 * ENV-PARITY-P4-005 — the น้ำประปา print-model tests.
 *
 * Layout authority: the generated sample `รายงานน้ำประปา-1.pdf`
 * (1AhI3lkDEYiDHoVPkVjD95RpmG-qrW5FP, sha256
 * 8d0e81c5d97e2f8a9f13381c19e6509489adc6cf26c42f15c81b52bda0c050bd,
 * 116,723 B, 15 pages — re-verified live at D1) + the ref-12 §3.10
 * `tap water_Filter` / §3.8 `น้ำประปา` censuses. THE HONEST DIVERGENCE:
 * no น้ำประปา template FILE exists (10/10 Content-folder entries
 * enumerated; absence re-verified live at D1) — the layout authority is
 * the GENERATED SAMPLE, recorded as the divergence, never presented as
 * a mirrored template file. Totals come from the delivered P1.5 chain
 * surfaces (buildWaterSupplySummary semantics) with the estimate/
 * provenance flags carried into the model (×3.7-class per A2, ÷10
 * chlorine per A3, meter-chain deltas); unknown ≠ 0.
 */
import { describe, expect, it } from "vitest";
import {
  WATER_COLUMNS,
  WATER_LAYOUT_NOTE,
  buildPersonnelNameMap,
  buildWaterPrintModel,
  type WaterChainInput,
} from "./family-report-models";

const MONTH = "2026-11"; // พ.ศ. 2569

function w(over: Partial<WaterChainInput>): WaterChainInput {
  return {
    id: "w-x",
    check_date: "2026-11-02",
    hour_meter: 1200,
    hour_work: 4,
    water_in: 40,
    water_in_estimate: null,
    chlorine_usage: 100,
    chlorine_usage_realy: 10,
    energy_use_estimate: null,
    hour_boundary_flag: false,
    spec_missing: false,
    recorded_by: "p3",
    ...over,
  };
}

const PERSONNEL = buildPersonnelNameMap([
  { id: "p3", full_name: "ผู้ลงบันทึก ทดสอบ", position: "พนักงานบริการ" },
]);

describe("น้ำประปา print model — the sample-PDF layout (honest divergence)", () => {
  it("renders the 5-column sample header verbatim", () => {
    const m = buildWaterPrintModel({ month: MONTH, chainRows: [w({})], personnel: PERSONNEL });
    expect(m.columns).toEqual(WATER_COLUMNS);
    expect(m.columns).toHaveLength(5);
    expect(m.columns[0]).toBe("วัน/เดือน/ปี");
    expect(m.columns[1]).toBe("Hour_meter");
    expect(m.columns[2]).toBe("ใช้น้ำ(ลบ.ม.)");
    expect(m.columns[3]).toBe("คลอรีนที่ใช้(ลิตร)");
    expect(m.columns[4]).toBe("ผู้บันทึก");
  });

  it("title carries the Thai month + COMPUTED พ.ศ. year (the sample's '2,569' renders as plain พ.ศ. 2569)", () => {
    const m = buildWaterPrintModel({ month: MONTH, chainRows: [w({})], personnel: PERSONNEL });
    expect(m.title).toBe(
      "แบบรายงานการใช้น้ำประปาบาดาลโรงพยาบาลอุทัย ประจำเดือน พฤศจิกายน พ.ศ. 2569",
    );
  });

  it("carries the honest layout-authority note — the template FILE is absent, the sample PDF is the authority", () => {
    const m = buildWaterPrintModel({ month: MONTH, chainRows: [w({})], personnel: PERSONNEL });
    expect(m.layoutAuthorityNote).toBe(WATER_LAYOUT_NOTE);
    expect(WATER_LAYOUT_NOTE).toContain("รายงานน้ำประปา-1.pdf");
    expect(WATER_LAYOUT_NOTE).toContain("ตัวอย่าง");
  });

  it("rows map the RECORDED daily reads + the personnel display path", () => {
    const m = buildWaterPrintModel({
      month: MONTH,
      chainRows: [
        w({}),
        w({
          id: "w2",
          check_date: "2026-11-03",
          hour_meter: 1204,
          water_in: null,
          chlorine_usage: null,
          recorded_by: null,
        }),
      ],
      personnel: PERSONNEL,
    });
    expect(m.rows).toHaveLength(2);
    expect(m.rows[0].dateThai).toContain("2569");
    expect(m.rows[0].hourMeter).toBe(1200);
    expect(m.rows[0].waterIn).toBe(40);
    expect(m.rows[0].chlorineLiters).toBe(100);
    expect(m.rows[0].recorder).toBe("ผู้ลงบันทึก ทดสอบ");
    expect(m.rows[1].waterIn).toBeNull(); // unknown ≠ 0
    expect(m.rows[1].recorder).toBe("— ไม่ระบุ —");
  });

  it("the two monthly totals use the delivered P1.5 surfaces (Σ Water_In; Σ chlorine_usage_realy)", () => {
    const m = buildWaterPrintModel({
      month: MONTH,
      chainRows: [w({}), w({ id: "w2", check_date: "2026-11-03", water_in: 35, chlorine_usage_realy: 7 })],
      personnel: PERSONNEL,
    });
    expect(m.sumWaterIn).toBe(75);
    expect(m.sumChlorineReal).toBe(17); // the ÷10 surface values (1:9 mix per A3)
    expect(m.summaryLines[0]).toContain("การบริโภคน้ำประปาบาดาล ตลอดเดือน พฤศจิกายน 75 ลบ.ม.");
    expect(m.summaryLines[1]).toContain("ปริมาณสารเคมีหรือสารสกัดชีวภาพที่ใช้ (คลอรีนน้ำ) 17 ลิตร");
  });

  it("the P1.5 estimate flags are carried into the model (ค่าประมาณจากสเปก / ประมาณจากชั่วโมงปั๊ม / ÷10)", () => {
    const m = buildWaterPrintModel({
      month: MONTH,
      chainRows: [
        w({}),
        w({
          id: "w2",
          check_date: "2026-11-03",
          water_in: null,
          water_in_estimate: 14.8,
          energy_use_estimate: 14.8,
          spec_missing: true,
        }),
      ],
      personnel: PERSONNEL,
    });
    expect(m.sumWaterInEstimate).toBe(14.8);
    expect(m.sumEnergyEstimate).toBe(14.8);
    const notes = m.notes.join("\n");
    expect(notes).toContain("ค่าประมาณจากสเปก");
    expect(notes).toContain("ประมาณจากชั่วโมงปั๊ม");
    expect(notes).toContain("÷10");
    expect(m.specMissingDays).toBe(1);
  });

  it("meter-chain boundary days are excluded and disclosed — never 0-filled", () => {
    const m = buildWaterPrintModel({
      month: MONTH,
      chainRows: [w({ hour_boundary_flag: true, hour_meter: null, hour_work: null, water_in: null })],
      personnel: PERSONNEL,
    });
    expect(m.boundaryDays).toBe(1);
    expect(m.notes.join("\n")).toContain("มิเตอร์ชั่วโมงเปลี่ยน");
  });

  it("missing days are counted, never 0-filled", () => {
    const m = buildWaterPrintModel({ month: MONTH, chainRows: [w({})], personnel: PERSONNEL });
    expect(m.totalDays).toBe(30);
    expect(m.recordedDays).toBe(1);
    expect(m.missingDays).toBe(29);
    expect(m.notes.join("\n")).toContain("29");
  });
});
