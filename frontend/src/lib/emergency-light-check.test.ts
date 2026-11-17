/**
 * ENV-PARITY-P2-003 — form-parity tests for the emergency-light check lib
 * (lib/emergency-light-check.ts). Verbatim pins per WO §3.1/§6 (reference
 * 12 §3.33): enum value lists + init values, Show If gates, the resolved
 * gate, พ.ศ. helpers, the 8-hex id generator, and the unresolved-'31'
 * honest display state.
 */
import { describe, expect, it } from "vitest";
import {
  BROKEN_DETAIL_OPTIONS,
  ERR_QR_NOT_FOUND,
  PERSISTENCY_DEFAULT,
  PERSISTENCY_OPTIONS,
  POSITION_DEFAULT,
  POSITION_OPTIONS,
  QR_PLACEHOLDER,
  STATUS_OPTIONS,
  TEST_RESULT_DEFAULT,
  TEST_RESULT_OPTIONS,
  generateCheckId,
  isQrPayloadUsable,
  showBrokenDetail,
  showPicAndStatus,
  showTestResult,
} from "./emergency-light-check";

describe("enum vocabularies (verbatim §3.33)", () => {
  it("persistency มี/ไม่มี with init มี (ref 5045-5055)", () => {
    expect([...PERSISTENCY_OPTIONS]).toEqual(["มี", "ไม่มี"]);
    expect(PERSISTENCY_DEFAULT).toBe("มี");
  });

  it("position เหมาะสม/ไม่เหมาะสม with init เหมาะสม (ref 5057-5067)", () => {
    expect([...POSITION_OPTIONS]).toEqual(["เหมาะสม", "ไม่เหมาะสม"]);
    expect(POSITION_DEFAULT).toBe("เหมาะสม");
  });

  it("test_result ผ่าน/ไม่ผ่าน with init ผ่าน (ref 5069-5085)", () => {
    expect([...TEST_RESULT_OPTIONS]).toEqual(["ผ่าน", "ไม่ผ่าน"]);
    expect(TEST_RESULT_DEFAULT).toBe("ผ่าน");
  });

  it("status 3 values verbatim (ref 5128-5138)", () => {
    expect([...STATUS_OPTIONS]).toEqual(["แจ้งซ่อม", "แจ้งย้ายตำแหน่ง", "ขอติดตั้ง"]);
  });

  it("broken_detail documents the 5 enum values (free text allowed beyond)", () => {
    expect([...BROKEN_DETAIL_OPTIONS]).toEqual([
      "ไม่มีหัตถการ",
      "มีแสงสว่างจากธรรมชาติ",
      "ไม่มีเวรดึก",
      "ไฟไม่สว่าง",
      "ไม่เก็บไฟ",
    ]);
  });
});

describe("QR resolved gate (init =สแกน QR CODE, ref 5022-5043)", () => {
  it("placeholder and blank payloads are unusable", () => {
    expect(isQrPayloadUsable("")).toBe(false);
    expect(isQrPayloadUsable("   ")).toBe(false);
    expect(isQrPayloadUsable("สแกน QR CODE")).toBe(false);
    expect(QR_PLACEHOLDER).toBe("สแกน QR CODE");
  });

  it("a typed/padded master id is usable", () => {
    expect(isQrPayloadUsable("001")).toBe(true);
    expect(isQrPayloadUsable(" 001 ")).toBe(true);
  });
});

describe("Show If gates (verbatim)", () => {
  it("test_result only when persistency = มี (ref 5079-5081)", () => {
    expect(showTestResult("มี")).toBe(true);
    expect(showTestResult("ไม่มี")).toBe(false);
    expect(showTestResult(null)).toBe(false);
  });

  it("broken_detail only when ไม่ผ่าน OR ไม่เหมาะสม (ref 5112-5114)", () => {
    expect(showBrokenDetail({ testResult: "ไม่ผ่าน", position: "เหมาะสม" })).toBe(true);
    expect(showBrokenDetail({ testResult: "ผ่าน", position: "ไม่เหมาะสม" })).toBe(true);
    expect(showBrokenDetail({ testResult: "ผ่าน", position: "เหมาะสม" })).toBe(false);
    expect(showBrokenDetail({ testResult: null, position: null })).toBe(false);
  });

  it("pic + status only when any of ไม่ผ่าน / ไม่เหมาะสม / ไม่มี (ref 5124-5134)", () => {
    expect(showPicAndStatus({ testResult: "ไม่ผ่าน", position: "เหมาะสม", persistency: "มี" })).toBe(true);
    expect(showPicAndStatus({ testResult: "ผ่าน", position: "ไม่เหมาะสม", persistency: "มี" })).toBe(true);
    expect(showPicAndStatus({ testResult: "ผ่าน", position: "เหมาะสม", persistency: "ไม่มี" })).toBe(true);
    expect(showPicAndStatus({ testResult: "ผ่าน", position: "เหมาะสม", persistency: "มี" })).toBe(false);
    expect(showPicAndStatus({ testResult: null, position: null, persistency: null })).toBe(false);
  });
});

describe("verbatim Thai fail-closed error", () => {
  it("carries the safety-flow verbatim (double space)", () => {
    expect(ERR_QR_NOT_FOUND).toBe("ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ");
  });
});

describe("id generator (8-hex UNIQUEID() shape)", () => {
  it("generates 8 hex chars, practically unique", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const id = generateCheckId();
      expect(id).toMatch(/^[0-9a-f]{8}$/);
      seen.add(id);
    }
    expect(seen.size).toBe(200);
  });
});

describe("unresolved-'31' honest display state", () => {
  it("unresolved payload renders verbatim with an explicit unresolved marker", async () => {
    const { unresolvedLightLabel } = await import("./emergency-light-check");
    expect(unresolvedLightLabel("31", false)).toContain("31");
    expect(unresolvedLightLabel("31", false)).toContain("ไม่พบอ้างอิง");
    // resolved payload has no marker
    expect(unresolvedLightLabel("001", true)).not.toContain("ไม่พบอ้างอิง");
  });
});
