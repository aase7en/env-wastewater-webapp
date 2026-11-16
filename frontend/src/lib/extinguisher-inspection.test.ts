/**
 * ENV-PARITY-P2-002 — pure form-parity lib tests for the extinguisher
 * per-unit inspection flow (WO §7; AppSheet §3.13 verbatim pins).
 *
 * RED-first: at the RED commit `./extinguisher-inspection` does not exist —
 * suite-fail-to-collect is the RED evidence.
 */
import { describe, expect, it } from "vitest";
import {
  BARRIER_DEFAULT,
  BARRIER_OPTIONS,
  CAUSE_OPTIONS,
  ERR_QR_NOT_FOUND,
  INSPECTOR_POSITIONS,
  INELIGIBLE_STATUS,
  ITEM_DEFAULT,
  ITEM_OPTIONS,
  MASTER_TYPE_OPTIONS,
  PRESSURE_OPTIONS,
  TYPE_SNAPSHOT_OPTIONS,
  anyItemAbnormal,
  deriveBreakdownLabel,
  expiryStatusOf,
  generateInspectionId,
  generateLegacyRowId,
  isEligibleInspector,
  isQrPayloadUsable,
  showBreakdownDetails,
  showCauseAndPhoto,
} from "./extinguisher-inspection";

describe("verbatim enum vocabularies (§3.1)", () => {
  it("type_snapshot carries the 6-value inspection enum verbatim (divergence from the master's 5 — both pinned)", () => {
    expect(TYPE_SNAPSHOT_OPTIONS).toEqual([
      "เคมีแห้ง (Dry Chemical Extinguishers)",
      "สารเหลวระเหย BF2000",
      "น้ำยาโฟม (Foam Extinguishers)",
      "คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)",
      "น้ำ (Water Extinguishers)",
      "น้ำ (Best Drop แบบ Low Pressure Water Mist)",
    ]);
    expect(MASTER_TYPE_OPTIONS).toEqual([
      "เคมีแห้ง (Dry Chemical Extinguishers)",
      "สารเหลวระเหย BF2000",
      "น้ำยาโฟม (Foam Extinguishers)",
      "คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)",
      "น้ำ (Best Drop)",
    ]);
  });

  it("item enums: pipe/handle/tank ปกติ/ชำรุด, pressure_gauge ปกติ/ไม่ปกติ (semantics differ verbatim), barrier มี/ไม่มี", () => {
    expect(ITEM_OPTIONS).toEqual(["ปกติ", "ชำรุด"]);
    expect(PRESSURE_OPTIONS).toEqual(["ปกติ", "ไม่ปกติ"]);
    expect(BARRIER_OPTIONS).toEqual(["มี", "ไม่มี"]);
    expect(ITEM_DEFAULT).toBe("ปกติ");
    expect(BARRIER_DEFAULT).toBe("ไม่มี");
    expect(CAUSE_OPTIONS).toEqual(["เกิดจากการใช้งาน", "หมดอายุ"]);
  });
});

describe("QR Valid If (ref 3158-3166)", () => {
  it("blank/placeholder/whitespace payloads are unusable and map to the verbatim Thai error", () => {
    expect(ERR_QR_NOT_FOUND).toBe("ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ");
    expect(isQrPayloadUsable("")).toBe(false);
    expect(isQrPayloadUsable("   ")).toBe(false);
    expect(isQrPayloadUsable("สแกน QR CODE")).toBe(false);
    expect(isQrPayloadUsable("vtiHJw6wpw4c6f4553dms5")).toBe(true);
  });
});

describe("ผู้ตรวจสอบ eligibility (Valid If ref 3358-3382 — VERBATIM ≠ลาออก, not the P1.4 =ทำงาน rule)", () => {
  it("only นักวิชาการสาธารณสุข / พนักงานบริการ with status ≠ ลาออก", () => {
    expect(INSPECTOR_POSITIONS).toEqual(["นักวิชาการสาธารณสุข", "พนักงานบริการ"]);
    expect(INELIGIBLE_STATUS).toBe("ลาออก");
    expect(isEligibleInspector({ position: "นักวิชาการสาธารณสุข", status: "active" })).toBe(true);
    expect(isEligibleInspector({ position: "พนักงานบริการ", status: "ทำงาน" })).toBe(true);
    expect(isEligibleInspector({ position: "พนักงานบริการ", status: "ลาออก" })).toBe(false);
    expect(isEligibleInspector({ position: "นายแพทย์", status: "active" })).toBe(false);
    expect(isEligibleInspector({ position: "พนักงานเปล", status: "active" })).toBe(false);
    expect(isEligibleInspector({ position: null, status: "active" })).toBe(false);
  });
});

describe("Show If gates (ref 3343 / 3351 / 3389 verbatim)", () => {
  it("anyItemAbnormal: pipe/handle/tank ≠ ปกติ OR pressure_gauge ≠ ปกติ OR barrier ≠ ไม่มี", () => {
    expect(
      anyItemAbnormal({ pipe: "ปกติ", handle: "ปกติ", tank: "ปกติ", pressure_gauge: "ปกติ", barrier: "ไม่มี" }),
    ).toBe(false);
    expect(
      anyItemAbnormal({ pipe: "ชำรุด", handle: "ปกติ", tank: "ปกติ", pressure_gauge: "ปกติ", barrier: "ไม่มี" }),
    ).toBe(true);
    expect(
      anyItemAbnormal({ pipe: "ปกติ", handle: "ปกติ", tank: "ปกติ", pressure_gauge: "ไม่ปกติ", barrier: "ไม่มี" }),
    ).toBe(true);
    expect(
      anyItemAbnormal({ pipe: "ปกติ", handle: "ปกติ", tank: "ปกติ", pressure_gauge: "ปกติ", barrier: "มี" }),
    ).toBe(true);
    // unknown item values are NOT treated as abnormal (unknown ≠ any judgment)
    expect(anyItemAbnormal({ pipe: null, handle: "ปกติ", tank: "ปกติ", pressure_gauge: "ปกติ", barrier: "ไม่มี" })).toBe(
      false,
    );
  });

  it("showCauseAndPhoto: visible only when any item is abnormal (ref 3351/3389)", () => {
    const normal = { pipe: "ปกติ", handle: "ปกติ", tank: "ปกติ", pressure_gauge: "ปกติ", barrier: "ไม่มี" };
    const broken = { ...normal, handle: "ชำรุด" };
    expect(showCauseAndPhoto(normal)).toBe(false);
    expect(showCauseAndPhoto(broken)).toBe(true);
  });

  it("showBreakdownDetails: OR(any-abnormal, expired, extinguisher-resolved) per ref 3343 verbatim", () => {
    const normal = { pipe: "ปกติ", handle: "ปกติ", tank: "ปกติ", pressure_gauge: "ปกติ", barrier: "ไม่มี" };
    expect(showBreakdownDetails({ resolved: false, items: normal, expired: false })).toBe(false);
    expect(showBreakdownDetails({ resolved: true, items: normal, expired: false })).toBe(true);
    expect(showBreakdownDetails({ resolved: false, items: normal, expired: true })).toBe(true);
    expect(showBreakdownDetails({ resolved: false, items: { ...normal, tank: "ชำรุด" }, expired: false })).toBe(true);
  });
});

describe("breakdown_details auto-label (init IF(chem_exp<=Date_time,หมดอายุ,ไม่หมดอายุ) ref 3336-3338)", () => {
  it("chem_exp <= inspection_date → หมดอายุ; later → ไม่หมดอายุ", () => {
    expect(deriveBreakdownLabel("2026-09-13", "2026-09-13T10:00:00+07")).toBe("หมดอายุ");
    expect(deriveBreakdownLabel("2026-01-01", "2026-09-13T10:00:00+07")).toBe("หมดอายุ");
    expect(deriveBreakdownLabel("2027-01-01", "2026-09-13T10:00:00+07")).toBe("ไม่หมดอายุ");
  });
  it("missing dates stay unknown — never a fabricated label", () => {
    expect(deriveBreakdownLabel(null, "2026-09-13")).toBe("");
    expect(deriveBreakdownLabel("2026-09-13", null)).toBe("");
    expect(deriveBreakdownLabel(null, null)).toBe("");
  });
});

describe("expiry status from the master (honest — unknown stays unknown)", () => {
  it("expiry <= today → หมดอายุ; later → ไม่หมดอายุ; NULL → null (never guessed)", () => {
    expect(expiryStatusOf("2020-01-01", "2026-11-16")).toBe("หมดอายุ");
    expect(expiryStatusOf("2026-11-16", "2026-11-16")).toBe("หมดอายุ");
    expect(expiryStatusOf("2027-01-01", "2026-11-16")).toBe("ไม่หมดอายุ");
    expect(expiryStatusOf(null, "2026-11-16")).toBeNull();
  });
});

describe("id generators (D1-9)", () => {
  it("inspection id = 8-hex UNIQUEID() shape", () => {
    const id = generateInspectionId();
    expect(id).toMatch(/^[0-9a-f]{8}$/);
    expect(generateInspectionId()).not.toBe(id);
  });
  it("master legacy_row_id = 22-char PackedUUID-shape (never numeric)", () => {
    const id = generateLegacyRowId();
    expect(id).toMatch(/^[A-Za-z0-9]{22}$/);
    expect(id).not.toMatch(/^\d+$/);
    expect(generateLegacyRowId()).not.toBe(id);
  });
});
