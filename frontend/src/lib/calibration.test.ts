/**
 * ENV-PARITY-P3-003 — RED-first unit suite for the maintenance/calibration
 * lib (lane P3.3): the §3.30 form payload honesty (Cal_date Init TODAY() is
 * the ONLY verbatim validation), blanks ⇒ NULL, the per-tool latest grouping
 * (ครั้งล่าสุด + จำนวนครั้ง), and the D1-5 next-due honesty pin — NO
 * next-due is ever computed (the source cycle candidates calibrate_range/
 * calibrate_unit are measured values, not intervals; the AppSheet table has
 * NO next-due column or formula — ref 12 §3.30, its only formula being
 * Cal_date Init TODAY()).
 *
 * D2 RED: this file fails-to-collect while `./calibration` does not exist
 * (the honest new-file RED mode — P1.5/P2.4/P3.1/P3.2 precedent).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EMPTY_CALIBRATIONS_LABEL,
  NEXT_DUE_PINNED_ABSENT,
  buildCalibrationPayload,
  latestByTool,
} from "./calibration";

const h = vi.hoisted(() => ({
  fromCalls: [] as { table: string; op: string }[],
  insertPayload: null as Record<string, unknown> | null,
  insertError: null as { message: string } | null,
  selectData: null as unknown,
  selectError: null as { message: string } | null,
}));

vi.mock("./supabase", () => ({
  supabase: {
    from: (table: string) => {
      h.fromCalls.push({ table, op: "select" });
      return {
        select: () => ({
          order: () =>
            Promise.resolve({ data: h.selectData, error: h.selectError }),
        }),
        insert: (payload: Record<string, unknown>) => {
          h.fromCalls.push({ table, op: "insert" });
          h.insertPayload = payload;
          return {
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: h.insertPayload
                    ? { id: "00000000-0000-0000-0000-00000000f001" }
                    : null,
                  error: h.insertError,
                }),
            }),
          };
        },
      };
    },
  },
}));

beforeEach(() => {
  h.fromCalls.length = 0;
  h.insertPayload = null;
  h.insertError = null;
  h.selectData = null;
  h.selectError = null;
});

describe("D1-5 next-due honesty pin — NO next-due is ever computed", () => {
  it("pins NEXT_DUE_PINNED_ABSENT true (the lib exposes no next-due computation)", () => {
    expect(NEXT_DUE_PINNED_ABSENT).toBe(true);
  });
  it("exports the honest empty-state label verbatim (WO §5)", () => {
    expect(EMPTY_CALIBRATIONS_LABEL).toBe("ยังไม่มีรายการสอบเทียบ");
  });
});

describe("buildCalibrationPayload — form honesty (blanks ⇒ NULL; Cal_date Init TODAY() is the only verbatim AppSheet pin)", () => {
  it("blank optional fields become NULL — never '' (unknown ≠ fabricated)", () => {
    const payload = buildCalibrationPayload({
      item_id: "",
      tool_legacy_id: "af420125",
      item_name: "",
      calibration_date: "2024-05-16",
      cal_method: "",
      cal_result: "InControl",
      calibrate_range: " 12.7 ",
      calibrate_unit: "%",
    });
    expect(payload.item_id).toBeNull();
    expect(payload.item_name).toBeNull();
    expect(payload.cal_method).toBeNull();
    expect(payload.tool_legacy_id).toBe("af420125");
    expect(payload.cal_result).toBe("InControl");
    expect(payload.calibrate_range).toBe("12.7");
    expect(payload.calibrate_unit).toBe("%");
    expect(payload.source_provenance).toContain("manual admin entry");
  });

  it("a cleared calibration_date falls back to today (the Cal_date Init TODAY() verbatim behavior — the one §3.30 pin); a malformed date throws", () => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const payload = buildCalibrationPayload({ tool_legacy_id: "af420125", calibration_date: "" });
    expect(payload.calibration_date).toBe(iso);
    expect(() =>
      buildCalibrationPayload({ tool_legacy_id: "af420125", calibration_date: "not-a-date" })
    ).toThrow(/วันที่สอบเทียบ/);
  });

  it("requires at least one tool identity (item_id / tool_legacy_id / item_name) — house-level, never presented as AppSheet", () => {
    expect(() =>
      buildCalibrationPayload({ calibration_date: "2024-05-16" })
    ).toThrow(/เครื่องมือ/);
    expect(() =>
      buildCalibrationPayload({ item_name: "ลูกสูบวัดออกซิเจน", calibration_date: "2024-05-16" })
    ).not.toThrow();
  });

  it("defaults calibration_date to today (Cal_date Init TODAY() verbatim translation)", () => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const payload = buildCalibrationPayload({ tool_legacy_id: "af420125" });
    expect(payload.calibration_date).toBe(iso);
  });
});

describe("latestByTool — the ครั้งล่าสุด + จำนวนครั้ง grouping (display-time only)", () => {
  const rows: Parameters<typeof latestByTool>[0] = [
    { id: "a", item_id: null, tool_legacy_id: "af420125", item_name: null, calibration_date: "2024-05-16" },
    { id: "b", item_id: null, tool_legacy_id: "af420125", item_name: null, calibration_date: "2023-08-09" },
    { id: "c", item_id: null, tool_legacy_id: "cf9a417e", item_name: "TDS meter", calibration_date: "2024-05-30" },
  ];
  it("groups per tool: latest calibration_date + count", () => {
    const g = latestByTool(rows);
    expect(g).toHaveLength(2);
    const af = g.find((x) => x.tool_legacy_id === "af420125")!;
    expect(af.latest_date).toBe("2024-05-16");
    expect(af.count).toBe(2);
    const cf = g.find((x) => x.tool_legacy_id === "cf9a417e")!;
    expect(cf.latest_date).toBe("2024-05-30");
    expect(cf.count).toBe(1);
  });
  it("groups unbound rows (tool_legacy_id NULL) under their own identity, never merged into a guessed tool", () => {
    const g = latestByTool([
      { id: "x", item_id: null, tool_legacy_id: null, item_name: "เครื่องวัด pH", calibration_date: "2024-01-01" },
      { id: "y", item_id: null, tool_legacy_id: null, item_name: null, calibration_date: "2024-02-01" },
    ]);
    expect(g).toHaveLength(2);
  });
});
