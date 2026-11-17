/**
 * ENV-PARITY-P2-005 — unit tests for the pure safety summary lib
 * (AppSheet parity lane P2.5: นับปกติ/ผิดปกติถัง + ผ่าน/ไม่ผ่านไฟ on
 * /reports — reference doc 12 §3.20 Filter_Firer ref 3954–4293 + §3.35
 * Filter_Light ref 5183–5510, pinned per WO ENV-PARITY-P2-005 §4.1/§4.2).
 *
 * Pins VERBATIM:
 *   - จำนวนถังทั้งที่ตรวจ = COUNT(UNIQUE(...[QR_CODE]...)) — DISTINCT
 *     extinguishers inspected in range (§3.20; ENV: distinct extinguisher_id)
 *   - จำนวนถังที่มี = the MASTER denominator (distinct fire_extinguisher ids;
 *     0 today → SOURCE_UNAVAILABLE honest empty state, WO §4.4-3 — never a
 *     computed pass rate over 0)
 *   - ปกติ = pipe ปกติ ∧ handle ปกติ ∧ tank ปกติ ∧ pressure_gauge ปกติ (the
 *     4-component AND; D1-4 pin: `barrier` is in NO predicate — a
 *     barrier-ชำรุด-only row stays ปกติ, the recorded divergence)
 *   - ผิดปกติ = OR(pipe ชำรุด, handle ชำรุด, tank ชำรุด,
 *     pressure_gauge ไม่ปกติ, breakdown_details หมดอายุ) — the ∨5 incl.
 *     หมดอายุ (จำนวนถังผิดปกติ = the same OR count, the AppSheet headline)
 *   - blank/unknown components fall OUTSIDE both verbatim predicates —
 *     disclosed in the explicit honesty line, never coerced (WO §4.1)
 *   - Filter_Light: ผ่าน/ไม่ผ่าน headline pair; คงอยู่ มี/ไม่มี; ตำแหน่ง
 *     เหมาะสม/ไม่เหมาะสม; ความต้องการ per the 3 verbatim Status values +
 *     the REQUIRED ไม่ระบุ bucket for blank Status (D1-5 — the AppSheet
 *     IN() formula silently ignores blanks; ENV discloses them)
 *   - จำนวนที่ตรวจสอบ = total in range
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  SAFETY_MASTER_UNAVAILABLE_LABEL,
  buildExtinguisherSummary,
  buildLightSummary,
  type SafetyExtinguisherRow,
  type SafetyLightRow,
} from "./safety-summary";

function extRow(over: Partial<SafetyExtinguisherRow>): SafetyExtinguisherRow {
  return {
    inspection_date: over.inspection_date ?? "2026-11-02",
    extinguisher_id: over.extinguisher_id ?? "ext-A",
    pipe: over.pipe ?? null,
    handle: over.handle ?? null,
    tank: over.tank ?? null,
    pressure_gauge: over.pressure_gauge ?? null,
    barrier: over.barrier ?? null,
    breakdown_details: over.breakdown_details ?? null,
  };
}

function lightRow(over: Partial<SafetyLightRow>): SafetyLightRow {
  return {
    check_date: over.check_date ?? "2026-11-02",
    persistency: over.persistency ?? "มี",
    position: over.position ?? "เหมาะสม",
    test_result: over.test_result ?? "ผ่าน",
    status: over.status ?? null,
  };
}

// ─── ถังดับเพลิง (Filter_Firer §3.20) ──────────────────────────────────────

describe("buildExtinguisherSummary — verbatim ปกติ/ผิดปกติ predicates", () => {
  const rows: SafetyExtinguisherRow[] = [
    // ปกติ by the ∧4 — barrier ชำรุด is EXCLUDED from the predicate (D1-4 pin)
    extRow({ inspection_date: "2026-11-02", extinguisher_id: "ext-A", pipe: "ปกติ", handle: "ปกติ", tank: "ปกติ", pressure_gauge: "ปกติ", barrier: "ชำรุด" }),
    // ผิดปกติ via pipe ชำรุด (same tank re-inspected → distinct stays 1)
    extRow({ inspection_date: "2026-11-03", extinguisher_id: "ext-A", pipe: "ชำรุด", handle: "ปกติ", tank: "ปกติ", pressure_gauge: "ปกติ" }),
    // ผิดปกติ via breakdown_details หมดอายุ (∨5 incl. หมดอายุ pin) — other components blank
    extRow({ inspection_date: "2026-11-04", extinguisher_id: "ext-B", breakdown_details: "หมดอายุ" }),
    // outside both predicates (blank components) — the honesty line, never coerced
    extRow({ inspection_date: "2026-11-05", extinguisher_id: "ext-C", pipe: null, handle: "ปกติ", tank: null, pressure_gauge: null }),
    // pressure_gauge ไม่ปกติ alone → ผิดปกติ; OUT of range rows below
    extRow({ inspection_date: "2026-11-06", extinguisher_id: "ext-D", pipe: "ปกติ", handle: "ปกติ", tank: "ปกติ", pressure_gauge: "ไม่ปกติ" }),
    extRow({ inspection_date: "2026-10-31", extinguisher_id: "ext-Z", pipe: "ชำรุด", handle: "ชำรุด", tank: "ชำรุด", pressure_gauge: "ไม่ปกติ" }),
    extRow({ inspection_date: "2027-01-01", extinguisher_id: "ext-Y", pipe: "ปกติ", handle: "ปกติ", tank: "ปกติ", pressure_gauge: "ปกติ" }),
  ];

  const s = buildExtinguisherSummary({
    startISO: "2026-11-01",
    endISO: "2026-12-31",
    rows,
    masterIds: [],
  });

  it("จำนวนถังทั้งที่ตรวจ = DISTINCT extinguishers in range (COUNT(UNIQUE(QR_CODE)))", () => {
    expect(s.totalRows).toBe(5); // in-range only
    expect(s.inspectedCount).toBe(4); // ext-A ×2, ext-B, ext-C, ext-D → distinct {A,B,C,D}
    expect(s.inspectedCount).toBe(new Set(["ext-A", "ext-B", "ext-C", "ext-D"]).size);
  });

  it("ปกติ = the ∧4 predicate — barrier-ชำรุด-only row STILL counts ปกติ (D1-4 recorded divergence)", () => {
    expect(s.normalCount).toBe(1); // only row 1; its barrier ชำรุด changes nothing
  });

  it("ผิดปกติ = the ∨5 incl. หมดอายุ — pipe/gauge/breakdown paths all counted", () => {
    expect(s.abnormalCount).toBe(3); // pipe ชำรุด + หมดอายุ + gauge ไม่ปกติ
    // จำนวนถังผิดปกติ (AppSheet headline) = the same OR-predicate count
    expect(s.abnormalHeadlineCount).toBe(s.abnormalCount);
  });

  it("blank components fall outside BOTH predicates → the honesty line counts them", () => {
    expect(s.incompleteCount).toBe(1); // ext-C (pipe/tank/gauge blank)
  });

  it("class coverage reconciles: every in-range row is ปกติ, ผิดปกติ, or on the honesty line", () => {
    // NOTE: predicates are evaluated independently (AppSheet COUNT(SELECT)
    // semantics); with these value sets they are mutually exclusive, so the
    // three buckets tile the in-range rows exactly.
    expect(s.normalCount + s.abnormalCount + s.incompleteCount).toBe(s.totalRows);
  });

  it("empty range: honest true zeros (never hidden, never filled)", () => {
    const empty = buildExtinguisherSummary({ startISO: "2026-11-01", endISO: "2026-11-30", rows: [], masterIds: [] });
    expect(empty.totalRows).toBe(0);
    expect(empty.inspectedCount).toBe(0);
    expect(empty.normalCount).toBe(0);
    expect(empty.abnormalCount).toBe(0);
    expect(empty.incompleteCount).toBe(0);
  });
});

// ─── จำนวนถังที่มี — the master denominator (SOURCE_UNAVAILABLE pin) ───────

describe("จำนวนถังที่มี (master denominator — WO §4.4-3)", () => {
  it("master count = distinct master ids", () => {
    const s = buildExtinguisherSummary({
      startISO: "2026-11-01",
      endISO: "2026-11-30",
      rows: [extRow({ extinguisher_id: "ext-A", pipe: "ปกติ", handle: "ปกติ", tank: "ปกติ", pressure_gauge: "ปกติ" })],
      masterIds: ["m1", "m2", "m1"],
    });
    expect(s.masterCount).toBe(2); // distinct
    expect(s.masterAvailable).toBe(true);
  });

  it("0 masters → masterAvailable=false + the SOURCE_UNAVAILABLE label (never a fake denominator)", () => {
    const s = buildExtinguisherSummary({ startISO: "2026-11-01", endISO: "2026-11-30", rows: [], masterIds: [] });
    expect(s.masterCount).toBe(0);
    expect(s.masterAvailable).toBe(false);
    expect(SAFETY_MASTER_UNAVAILABLE_LABEL).toBe("ยังไม่มีข้อมูลทะเบียนถัง");
  });
});

// ─── ไฟฉุกเฉิน (Filter_Light §3.35) ────────────────────────────────────────

describe("buildLightSummary — headline pair + both-value displays + ไม่ระบุ bucket", () => {
  // small-scale mirror of the P2.3 seed reality: Status blank dominates
  const rows: SafetyLightRow[] = [
    lightRow({ check_date: "2026-11-02", test_result: "ผ่าน", persistency: "มี", position: "เหมาะสม", status: "แจ้งซ่อม" }),
    lightRow({ check_date: "2026-11-03", test_result: "ไม่ผ่าน", persistency: "ไม่มี", position: "ไม่เหมาะสม", status: "ขอติดตั้ง" }),
    lightRow({ check_date: "2026-11-04", test_result: "ผ่าน", persistency: "มี", position: "เหมาะสม", status: "แจ้งย้ายตำแหน่ง" }),
    lightRow({ check_date: "2026-11-05", test_result: "ผ่าน", persistency: "มี", position: "เหมาะสม", status: null }), // ไม่ระบุ
    lightRow({ check_date: "2026-11-06", test_result: "ผ่าน", persistency: "มี", position: "เหมาะสม", status: "" }), // ไม่ระบุ
    lightRow({ check_date: "2026-10-31", test_result: "ไม่ผ่าน", persistency: "ไม่มี", position: "ไม่เหมาะสม", status: "แจ้งซ่อม" }), // out of range
    lightRow({ check_date: "2027-01-02", test_result: "ผ่าน", persistency: "มี", position: "เหมาะสม", status: null }), // out of range
  ];

  const s = buildLightSummary({ startISO: "2026-11-01", endISO: "2026-12-31", rows });

  it("จำนวนที่ตรวจสอบ = total in range (out-of-range rows excluded)", () => {
    expect(s.totalChecked).toBe(5);
  });

  it("จำนวนการทดสอบผ่าน / ไม่ผ่าน — the headline pair", () => {
    expect(s.testPass).toBe(4);
    expect(s.testFail).toBe(1);
  });

  it("จำนวนการคงอยู่ — มี/ไม่มี both shown", () => {
    expect(s.persistencyHas).toBe(4);
    expect(s.persistencyNot).toBe(1);
  });

  it("จำนวนตำแหน่ง — เหมาะสม/ไม่เหมาะสม both shown", () => {
    expect(s.positionSuitable).toBe(4);
    expect(s.positionNot).toBe(1);
  });

  it("จำนวนความต้องการ — the 3 verbatim Status values + the ไม่ระบุ bucket (D1-5)", () => {
    expect(s.statusRepair).toBe(1);
    expect(s.statusRelocate).toBe(1);
    expect(s.statusInstall).toBe(1);
    expect(s.statusUnspecified).toBe(2); // blank Status disclosed, never folded into a class
    expect(s.statusRepair + s.statusRelocate + s.statusInstall + s.statusUnspecified).toBe(s.totalChecked);
  });

  it("free-text off-vocabulary values are disclosed per column, never coerced into a class", () => {
    const odd = buildLightSummary({
      startISO: "2026-11-01",
      endISO: "2026-11-30",
      rows: [
        lightRow({ check_date: "2026-11-02", test_result: "กำลังสอบ", persistency: "สงสัย", position: "ย้ายแล้ว", status: "รอพิจารณา" }),
      ],
    });
    expect(odd.testPass).toBe(0);
    expect(odd.testFail).toBe(0);
    expect(odd.testOther).toBe(1);
    expect(odd.persistencyOther).toBe(1);
    expect(odd.positionOther).toBe(1);
    expect(odd.statusUnspecified).toBe(1); // non-standard Status → the disclosure bucket
  });

  it("empty range: honest zeros across every bucket", () => {
    const empty = buildLightSummary({ startISO: "2026-11-01", endISO: "2026-11-30", rows: [] });
    expect(empty.totalChecked).toBe(0);
    expect(empty.testPass).toBe(0);
    expect(empty.testFail).toBe(0);
    expect(empty.statusUnspecified).toBe(0);
  });
});

// ─── PII pin — counts only (WO §4.4-4) ────────────────────────────────────

describe("PII pin — safety lib exposes no identity surface", () => {
  it("the lib source contains no inspector/auditor identity vocabulary", () => {
    const src = readFileSync(fileURLToPath(new URL("./safety-summary.ts", import.meta.url)), "utf8");
    // ผู้ตรวจสอบ/auditor are INPUTS in AppSheet, never summary numbers
    expect(src).not.toMatch(/inspector_id|auditor_id/);
    expect(src).not.toContain("full_name");
  });
});
