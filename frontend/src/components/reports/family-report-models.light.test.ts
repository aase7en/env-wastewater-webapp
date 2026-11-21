/**
 * ENV-PARITY-P4-005 — the ไฟฉุกเฉิน print-model tests.
 *
 * Layout authority: the gdoc `รายงานตรวจสอบไฟฉุกเฉิน`
 * (1MDUy6PHBXPISfnKGXyGnRZPJpT1ef4RHbeODQ9f_Pi4, txt-export sha256
 * fad4cef1282fb898dc28763d3f6ce5b3867e71aadfc58e91f4f046c89f1d28df,
 * 4,300 B — re-verified live at D1) — 6-column check table + the
 * COMPUTED ☑/☐ pair. Rows = the month's `safety.emergency_light_check`
 * records — the delivered 332-row history is LIVE data rendered as-is
 * (the 1 NULL `light_id` row is never normalized away); unknown ≠ 0
 * (missing fields render ค่าว่าง, never 0/ผ่าน-by-default).
 */
import { describe, expect, it } from "vitest";
import {
  LIGHT_COLUMNS,
  buildLightPrintModel,
  buildPersonnelNameMap,
  type LightCheckInput,
} from "./family-report-models";

const MONTH = "2026-11"; // พ.ศ. 2569

function chk(over: Partial<LightCheckInput>): LightCheckInput {
  return {
    id: "chk-x",
    check_date: "2026-11-04",
    light_id: "L-1",
    location_snapshot: "อาคารผู้ป่วยนอก ชั้น 1",
    test_result: "ผ่าน",
    position: "เหมาะสม",
    status: null,
    auditor_id: "p2",
    ...over,
  };
}

const PERSONNEL = buildPersonnelNameMap([
  { id: "p2", full_name: "สอบผ่าน มาแล้ว", position: "พนักงานบริการ" },
]);

describe("ไฟฉุกเฉิน print model — the gdoc authority layout", () => {
  it("renders the 6-column template header verbatim in gdoc order", () => {
    const m = buildLightPrintModel({
      month: MONTH,
      checks: [chk({})],
      personnel: PERSONNEL,
    });
    expect(m.columns).toEqual(LIGHT_COLUMNS);
    expect(m.columns).toHaveLength(6);
    expect(m.columns[0]).toBe("ลำดับ");
    expect(m.columns[1]).toBe("สถานที่ติดตั้ง");
    expect(m.columns[2]).toBe("ผลการทดสอบ");
    expect(m.columns[3]).toBe("จุดติดตั้ง");
    expect(m.columns[4]).toBe("สถานะร้องขอ");
    expect(m.columns[5]).toBe("ผู้ตรวจสอบ");
  });

  it("title carries the Thai month + COMPUTED พ.ศ. year", () => {
    const m = buildLightPrintModel({ month: MONTH, checks: [chk({})], personnel: PERSONNEL });
    expect(m.title).toBe(
      "แบบฟอร์มรายงานผลการตรวจโคมไฟฉุกเฉินโรงพยาบาลอุทัย ประจำเดือน พฤศจิกายน พ.ศ. 2569",
    );
  });

  it("maps rows as-is (the delivered history) + the personnel display path", () => {
    const m = buildLightPrintModel({
      month: MONTH,
      checks: [
        chk({ id: "a", status: "แจ้งซ่อม" }),
        chk({
          id: "b",
          check_date: "2026-11-18",
          light_id: null, // the NULL light_id row class — never normalized
          location_snapshot: null,
          test_result: "ไม่ผ่าน",
          auditor_id: null,
        }),
      ],
      personnel: PERSONNEL,
    });
    expect(m.rows).toHaveLength(2);
    expect(m.rows[0].seq).toBe(1);
    expect(m.rows[0].status).toBe("แจ้งซ่อม");
    expect(m.rows[0].auditor).toBe("สอบผ่าน มาแล้ว");
    expect(m.rows[1].seq).toBe(2);
    expect(m.rows[1].location).toBeNull();
    expect(m.rows[1].testResult).toBe("ไม่ผ่าน");
    expect(m.rows[1].status).toBeNull(); // ค่าว่าง — never 0/ผ่าน-by-default
  });

  it("the ☑/☐ pair COMPUTES from จำนวนที่ตรวจสอบ / จำนวนการทดสอบไม่ผ่าน — all-pass month", () => {
    const m = buildLightPrintModel({
      month: MONTH,
      checks: [chk({}), chk({ id: "b", check_date: "2026-11-06" })],
      personnel: PERSONNEL,
    });
    expect(m.totalChecked).toBe(2);
    expect(m.failCount).toBe(0);
    expect(m.summaryReady).toBe("☑ โคมไฟฉุกเฉินทุกจุดอยู่ในสภาพพร้อมใช้งาน");
    expect(m.summaryAction).toBe(
      "☐ มี โคมไฟฉุกเฉินที่ต้องดำเนินการแก้ไข/ซ่อมบำรุง จำนวน 0 เครื่อง (ตามรายละเอียดในตาราง)",
    );
  });

  it("the ☑/☐ pair flips on a ไม่ผ่าน record — computed, never asserted", () => {
    const m = buildLightPrintModel({
      month: MONTH,
      checks: [chk({}), chk({ id: "b", check_date: "2026-11-06", test_result: "ไม่ผ่าน" })],
      personnel: PERSONNEL,
    });
    expect(m.failCount).toBe(1);
    expect(m.summaryReady).toBe("☐ โคมไฟฉุกเฉินทุกจุดอยู่ในสภาพพร้อมใช้งาน");
    expect(m.summaryAction).toBe(
      "☑ มี โคมไฟฉุกเฉินที่ต้องดำเนินการแก้ไข/ซ่อมบำรุง จำนวน 1 เครื่อง (ตามรายละเอียดในตาราง)",
    );
  });

  it("off-vocabulary test_result values are disclosed (otherCount) — never coerced into ผ่าน/ไม่ผ่าน", () => {
    const m = buildLightPrintModel({
      month: MONTH,
      checks: [chk({ test_result: "เสีย" }), chk({ id: "b", check_date: "2026-11-06", test_result: "" })],
      personnel: PERSONNEL,
    });
    expect(m.failCount).toBe(0);
    expect(m.otherCount).toBe(2);
    expect(m.notes.join("\n")).toContain("2");
    // blank test_result renders honest absence, never a default ผ่าน
    expect(m.rows[1].testResult).toBe("");
  });

  it("a month with NO checks states honest absence — never ☑-ready", () => {
    const m = buildLightPrintModel({ month: MONTH, checks: [], personnel: PERSONNEL });
    expect(m.totalChecked).toBe(0);
    expect(m.summaryReady).toBeNull();
    expect(m.summaryAction).toBeNull();
    expect(m.notes.join("\n")).toContain("ไม่มีรายการตรวจสอบในเดือนนี้");
  });

  it("ENV-REPAIR-REPORT-HONESTY-001 — unknown-result-only month ⇒ NOT the ☑ ready verdict (off-vocab never coerced to Ready)", () => {
    const m = buildLightPrintModel({
      month: MONTH,
      checks: [chk({ test_result: "เสีย" }), chk({ id: "b", check_date: "2026-11-06", test_result: "" })],
      personnel: PERSONNEL,
    });
    expect(m.failCount).toBe(0);
    expect(m.otherCount).toBe(2);
    expect(m.summaryReady).not.toContain("☑");
    expect(m.summaryReady).toContain("ยังสรุปความพร้อมใช้งานไม่ได้");
    expect(m.summaryReady).toContain("2");
    expect(m.summaryAction).toContain("จำนวน 0 เครื่อง");
  });
});
