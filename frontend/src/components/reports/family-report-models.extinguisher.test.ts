/**
 * ENV-PARITY-P4-005 — the ถังดับเพลิง print-model tests.
 *
 * Layout authority: the gdoc `รายงานตรวจสอบถังดับเพลิง`
 * (1lKL8xgo_JnFcznMxncJ_kBKHgHpYYLgfOkhKy3WLPqg, txt-export sha256
 * c9f5f439e2b8594b28c56509ee7fec710f5352ff4fee2fc714e32bde5b8fc3a6,
 * 5,143 B — re-verified live at D1) — 9-column table + the COMPUTED
 * ☑/☐ summary pair (never asserted static) + blank signature rules.
 * Honesty pins (WO §2): the SOURCE_UNAVAILABLE master note (the
 * extinguisher master register stays UNSEEDED — never a fabricated
 * denominator, never zero-substituted master facts); unknown ≠ 0;
 * พ.ศ. computed year (the template's hardcoded พ.ศ. 2569 renders as
 * the COMPUTED year of the selected month — recorded divergence);
 * personnel only via the core.personnel display path (— ไม่ระบุ —
 * fallback) — the template's hardcoded names NEVER render.
 */
import { describe, expect, it } from "vitest";
import {
  EXTINGUISHER_MASTER_NOTE,
  EXT_COLUMNS,
  buildExtinguisherPrintModel,
  buildPersonnelNameMap,
  PERSONNEL_UNSET_LABEL,
  type ExtinguisherInspectionInput,
} from "./family-report-models";

const MONTH = "2026-11"; // พ.ศ. 2569

function row(over: Partial<ExtinguisherInspectionInput>): ExtinguisherInspectionInput {
  return {
    id: "ins-x",
    inspection_date: "2026-11-05",
    extinguisher_id: "ext-1",
    location_snapshot: "ห้องเครื่อง",
    pipe: "ปกติ",
    handle: "ปกติ",
    tank: "ปกติ",
    pressure_gauge: "ปกติ",
    barrier: "ไม่มี",
    breakdown_details: null,
    inspector_id: "p1",
    ...over,
  };
}

const PERSONNEL = buildPersonnelNameMap([
  { id: "p1", full_name: "ทดสอบ ใจดี", position: "นักวิชาการสาธารณสุข" },
]);

describe("ถังดับเพลิง print model — the gdoc authority layout", () => {
  it("renders the 9-column template header verbatim in gdoc order", () => {
    const m = buildExtinguisherPrintModel({
      month: MONTH,
      inspections: [row({})],
      masterIds: ["m1"],
      personnel: PERSONNEL,
    });
    expect(m.columns).toEqual(EXT_COLUMNS);
    expect(m.columns).toHaveLength(9);
    expect(m.columns[0]).toBe("ลำดับ");
    expect(m.columns[1]).toBe("สถานที่ติดตั้ง");
    expect(m.columns[6]).toBe("สิ่งกีดขวาง");
    expect(m.columns[7]).toBe("รายละเอียดการชำรุด");
    expect(m.columns[8]).toBe("ผู้ตรวจสอบ");
  });

  it("title carries the Thai month + COMPUTED พ.ศ. year (never the hardcoded 2569 constant alone)", () => {
    const m = buildExtinguisherPrintModel({
      month: MONTH,
      inspections: [row({})],
      masterIds: ["m1"],
      personnel: PERSONNEL,
    });
    expect(m.title).toBe(
      "แบบฟอร์มรายงานผลการตรวจสอบถังดับเพลิงโรงพยาบาลอุทัย ประจำเดือน พฤศจิกายน พ.ศ. 2569",
    );
    const feb = buildExtinguisherPrintModel({
      month: "2027-02",
      inspections: [],
      masterIds: ["m1"],
      personnel: PERSONNEL,
    });
    expect(feb.title).toContain("กุมภาพันธ์ พ.ศ. 2570");
  });

  it("maps the row fields verbatim + the personnel display path with the — ไม่ระบุ — fallback", () => {
    const m = buildExtinguisherPrintModel({
      month: MONTH,
      inspections: [
        row({ id: "a", extinguisher_id: "ext-1", inspector_id: "p1" }),
        row({
          id: "b",
          inspection_date: "2026-11-09",
          extinguisher_id: "ext-2",
          location_snapshot: null,
          breakdown_details: "หมดอายุ",
          inspector_id: null,
        }),
      ],
      masterIds: ["m1"],
      personnel: PERSONNEL,
    });
    expect(m.rows).toHaveLength(2);
    expect(m.rows[0].seq).toBe(1);
    expect(m.rows[0].location).toBe("ห้องเครื่อง");
    expect(m.rows[0].inspector).toBe("ทดสอบ ใจดี");
    expect(m.rows[1].seq).toBe(2);
    expect(m.rows[1].location).toBeNull(); // unknown ≠ fabricated
    expect(m.rows[1].inspector).toBe(PERSONNEL_UNSET_LABEL);
  });

  it("the ☑/☐ pair is COMPUTED — all-normal month ⇒ ☑ ready + ☐ action-0", () => {
    const m = buildExtinguisherPrintModel({
      month: MONTH,
      inspections: [row({}), row({ id: "b", extinguisher_id: "ext-2", inspection_date: "2026-11-07" })],
      masterIds: ["m1"],
      personnel: PERSONNEL,
    });
    expect(m.totalInspected).toBe(2);
    expect(m.abnormalCount).toBe(0);
    expect(m.summaryReady).toBe("☑ ถังดับเพลิงทุกจุดอยู่ในสภาพพร้อมใช้งาน");
    expect(m.summaryAction).toBe(
      "☐ มีถังดับเพลิงที่ต้องดำเนินการแก้ไข/ซ่อมบำรุง จำนวน 0 ถัง (ตามรายละเอียดในตาราง)",
    );
  });

  it("the ☑/☐ pair COMPUTES the abnormal verdict (the ∨5 verbatim predicate) — never static", () => {
    const m = buildExtinguisherPrintModel({
      month: MONTH,
      inspections: [
        row({}),
        row({ id: "b", extinguisher_id: "ext-2", inspection_date: "2026-11-08", pipe: "ชำรุด" }),
        row({ id: "c", extinguisher_id: "ext-3", inspection_date: "2026-11-09", breakdown_details: "หมดอายุ" }),
      ],
      masterIds: ["m1"],
      personnel: PERSONNEL,
    });
    expect(m.abnormalCount).toBe(2);
    expect(m.summaryReady).toBe("☐ ถังดับเพลิงทุกจุดอยู่ในสภาพพร้อมใช้งาน");
    expect(m.summaryAction).toBe(
      "☑ มีถังดับเพลิงที่ต้องดำเนินการแก้ไข/ซ่อมบำรุง จำนวน 2 ถัง (ตามรายละเอียดในตาราง)",
    );
  });

  it("SOURCE_UNAVAILABLE — empty master register ⇒ the honest master note, never a fabricated denominator", () => {
    const m = buildExtinguisherPrintModel({
      month: MONTH,
      inspections: [row({})],
      masterIds: [],
      personnel: PERSONNEL,
    });
    expect(m.masterAvailable).toBe(false);
    expect(m.notes).toContain(EXTINGUISHER_MASTER_NOTE);
    expect(EXTINGUISHER_MASTER_NOTE).toBe("ยังไม่มีข้อมูลทะเบียนถังดับเพลิง (master)");
  });

  it("a month with NO inspections states honest absence — never ☑-ready and never 0-filled", () => {
    const m = buildExtinguisherPrintModel({
      month: MONTH,
      inspections: [],
      masterIds: [],
      personnel: PERSONNEL,
    });
    expect(m.totalInspected).toBe(0);
    expect(m.summaryReady).toBeNull();
    expect(m.summaryAction).toBeNull();
    expect(m.notes.join("\n")).toContain("ไม่มีรายการตรวจสอบในเดือนนี้");
  });

  it("incomplete rows (outside both verbatim predicates) are disclosed — never silently ปกติ", () => {
    const m = buildExtinguisherPrintModel({
      month: MONTH,
      inspections: [row({ pipe: null, handle: null, tank: null, pressure_gauge: null })],
      masterIds: ["m1"],
      personnel: PERSONNEL,
    });
    expect(m.incompleteCount).toBe(1);
    expect(m.abnormalCount).toBe(0);
    expect(m.notes.join("\n")).toContain("1");
  });

  it("ENV-REPAIR-REPORT-HONESTY-001 — incomplete-only month ⇒ NOT the ☑ ready verdict (unknown never coerced to Ready)", () => {
    const m = buildExtinguisherPrintModel({
      month: MONTH,
      inspections: [row({ pipe: null, handle: null, tank: null, pressure_gauge: null })],
      masterIds: ["m1"],
      personnel: PERSONNEL,
    });
    expect(m.incompleteCount).toBe(1);
    expect(m.abnormalCount).toBe(0);
    expect(m.summaryReady).not.toContain("☑");
    expect(m.summaryReady).toContain("ยังสรุปความพร้อมใช้งานไม่ได้");
    expect(m.summaryReady).toContain("1");
    expect(m.summaryAction).toContain("จำนวน 0 ถัง");
  });

  it("ENV-REPAIR-REPORT-HONESTY-001 — all-normal + incomplete mix never renders ☑ ready either", () => {
    const m = buildExtinguisherPrintModel({
      month: MONTH,
      inspections: [
        row({}),
        row({ id: "b", extinguisher_id: "ext-2", inspection_date: "2026-11-07", pipe: null, handle: "ปกติ", tank: "ปกติ", pressure_gauge: null }),
      ],
      masterIds: ["m1"],
      personnel: PERSONNEL,
    });
    expect(m.incompleteCount).toBe(1);
    expect(m.abnormalCount).toBe(0);
    expect(m.summaryReady).not.toContain("☑");
    expect(m.summaryReady).toContain("ยังสรุปความพร้อมใช้งานไม่ได้");
  });
});
