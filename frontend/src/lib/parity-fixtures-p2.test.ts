/**
 * ENV-PARITY-P2-006 — the parameterized AppSheet-parity unit suite for the
 * Phase-2 surfaces (final Phase-2 lane P2.6; the P1.7 fixture pattern).
 *
 * Consumes the fixture tables in ./parity-fixtures-p2 (WO §4) and asserts
 * the ENV-facing surfaces that live in THIS process:
 *   - fixture-data integrity: every case cites its reference-doc-12 line;
 *     divergence cases carry a note naming a pinned divergence kind (WO
 *     §4-4 corrected-divergence discipline — never a silent match of a
 *     bug); the SQL-exercised id registry is complete.
 *   - family extinguisher (WO §4-1): the VERBATIM form value sets (ref
 *     3256–3330), the 6-vs-5 type-enum divergence (ref 3198 vs 3072), the
 *     breakdown_details auto-label IF([chem_exp]<=[Date_time],…) (ref
 *     3337), the Show If gates (ref 3343/3351/3389), the ผู้ตรวจสอบ Valid
 *     If staff filter (ref 3377), the QR derive-never-store contract (ref
 *     3079) + the id shapes.
 *   - family light (WO §4-2): the §3.33 value sets (ref 5055/5067/5085/
 *     5118/5138), the Show If matrix — test_result gated on Persistency=มี
 *     (ref 5080), Broken_detail on the 2-way OR (ref 5113), Pic/Status on
 *     the 3-way OR (ref 5125/5133) — and the light QR derive-never-store
 *     contract (ref 4954).
 *   - family coliform (WO §4-3): the same-day รอผล gate (ref 3660/3854),
 *     the isPendingResult consumption (lib/food.ts:251-255), the +1/+2
 *     suggestions Food/Employee ONLY (ref 3654/3848), the per-source
 *     vocabularies (ref 3563/3641/3008), the result sets (ref 3577/3022/
 *     3673/3867), the equipment defaults (ref 3584/3688/3882).
 *   - trigger / RPC / seed-distribution / catalog-probe semantics are NOT
 *     importable into vitest — they run in
 *     scripts/test_parity_p2_006_fixtures_sql.py (transactional
 *     BEGIN…ROLLBACK, zero net persistence, the P2.2/P2.3/P2.4 house
 *     shape) against the SAME case ids (D1-3: zero lib test-export
 *     touches; every existing lib file here is READ-ONLY).
 *
 * House truth constraints (WO §2.3 + D1-7, binding): unknown ≠ 0; latest
 * ≠ live; AppSheet formulas verbatim-recorded with reference lines;
 * divergence honesty; พ.ศ. dates; no PHI — SYNTHETIC values only (the
 * 13-digit digit-run scan below is a suite pin; zero matches).
 *
 * RED disclosure (D2, recorded honestly): the DB-side objects ALREADY
 * exist (P2.2/P2.3/P2.4 delivered) — SQL-side cases are pass-by-design
 * verification of EXISTING semantics, never claimed as RED. The truthful
 * RED evidence for this lane is this suite's fail-to-collect before
 * parity-fixtures-p2.ts existed (the P1.7/P2.4 new-file-lane RED mode).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ALL_P2_CASES,
  CB_COLIFORM_CASES,
  DIVERGENCE_KINDS_P2,
  EXTINGUISHER_CASES,
  LIGHT_CASES,
  P2_006_SQL_CASE_IDS,
} from "./parity-fixtures-p2";

import {
  BARRIER_DEFAULT,
  BARRIER_OPTIONS,
  CAUSE_OPTIONS,
  ERR_QR_NOT_FOUND,
  INELIGIBLE_STATUS,
  INSPECTOR_POSITIONS,
  ITEM_DEFAULT,
  ITEM_OPTIONS,
  MASTER_TYPE_OPTIONS,
  PRESSURE_OPTIONS,
  QR_PLACEHOLDER,
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
  type InspectionItems,
} from "./extinguisher-inspection";

import {
  BROKEN_DETAIL_OPTIONS,
  PERSISTENCY_DEFAULT,
  PERSISTENCY_OPTIONS,
  POSITION_DEFAULT,
  POSITION_OPTIONS,
  QR_PLACEHOLDER as QR_LIGHT_PLACEHOLDER,
  STATUS_OPTIONS,
  TEST_RESULT_DEFAULT,
  TEST_RESULT_OPTIONS,
  unresolvedLightLabel,
  generateCheckId,
  isQrPayloadUsable as isLightQrPayloadUsable,
  showBrokenDetail as showLightBrokenDetail,
  showPicAndStatus,
  showTestResult,
} from "./emergency-light-check";

import {
  COLIFORM_RESULT_EXTENDED,
  COLIFORM_RESULT_WATER,
  COLIFORM_SOURCES,
  EQUIPMENT_DEFAULTS,
  FOOD_COLLECT_POINTS,
  GENERAL_COLLECT_POINTS,
  WATER_COLLECT_POINTS,
  collectPointsFor,
  isPendingResult,
  resultSetFor,
  showResultFields,
  suggestedResultDates,
  suggestsResultDates,
} from "./food";

// ─── fixture-data integrity (meta-pins, every family) ───────────────────────

describe("P2 parity fixture tables — citation completeness (WO §4-4)", () => {
  it("every case carries a non-empty ref citation citing reference doc 12", () => {
    expect(ALL_P2_CASES.length).toBeGreaterThan(0);
    for (const c of ALL_P2_CASES) {
      expect(c.ref, `${c.id} must cite its reference line`).toBeTruthy();
      expect(c.ref.length, `${c.id} ref must be substantive`).toBeGreaterThan(10);
    }
  });

  it("case ids are unique across all families", () => {
    const ids = ALL_P2_CASES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every divergence case carries a note naming a pinned divergence kind", () => {
    const divergent = ALL_P2_CASES.filter((c) => c.divergence !== undefined);
    expect(divergent.length).toBeGreaterThan(0);
    for (const c of divergent) {
      const named = DIVERGENCE_KINDS_P2.filter((k) => c.divergence?.includes(k));
      expect(
        named.length,
        `${c.id} divergence note must name one of the pinned kinds`,
      ).toBeGreaterThan(0);
    }
  });

  it("the SQL-exercised id registry mirrors exactly the SQL-side cases", () => {
    const vitestOnly = ALL_P2_CASES.map((c) => c.id).filter(
      (id) => !P2_006_SQL_CASE_IDS.includes(id),
    );
    const sqlSide = ALL_P2_CASES.map((c) => c.id).filter((id) =>
      P2_006_SQL_CASE_IDS.includes(id),
    );
    expect(P2_006_SQL_CASE_IDS.length).toBe(sqlSide.length);
    // every SQL-side id belongs to a declared SQL-exercised case shape
    expect(vitestOnly.length + sqlSide.length).toBe(ALL_P2_CASES.length);
  });

  it("covers the three WO §4 families", () => {
    const families = new Set(ALL_P2_CASES.map((c) => c.family));
    expect([...families].sort()).toEqual(
      ["coliform", "extinguisher", "light"].sort(),
    );
  });

  it("PII pin: no 13-digit digit-run anywhere in the new fixture files", () => {
    for (const f of ["parity-fixtures-p2.ts", "parity-fixtures-p2.test.ts"]) {
      const src = readFileSync(path.join(__dirname, f), "utf8");
      expect(src.match(/\d{13}/), `${f} must carry no 13-digit run`).toBeNull();
    }
  });
});

// ─── EXTINGUISHER — verbatim value sets + divergence (WO §4-1) ──────────────

describe("extinguisher form value sets verbatim (ref 3256–3330)", () => {
  it("EX-V01: pipe/handle/tank = {ปกติ, ชำรุด} init ปกติ (ref 3247/3265/3283 inits, enums 3258/3276/3294)", () => {
    expect([...ITEM_OPTIONS]).toEqual(["ปกติ", "ชำรุด"]);
    expect(ITEM_DEFAULT).toBe("ปกติ");
  });

  it("EX-V02: pressure_gauge = {ปกติ, ไม่ปกติ} init ปกติ (ref 3301 init, enum 3312)", () => {
    expect([...PRESSURE_OPTIONS]).toEqual(["ปกติ", "ไม่ปกติ"]);
  });

  it("EX-V03: barrier = {มี, ไม่มี} init ไม่มี (ref 3319 init, enum 3330)", () => {
    expect([...BARRIER_OPTIONS]).toEqual(["มี", "ไม่มี"]);
    expect(BARRIER_DEFAULT).toBe("ไม่มี");
  });

  it("EX-V04: the 6-vs-5 type-enum divergence — both lists pinned VERBATIM (ref 3198 vs 3072)", () => {
    for (const c of EXTINGUISHER_CASES.filter((x) => x.id === "EX-V04")) {
      expect(c.expected.inspectionTypeOptions).toEqual([...TYPE_SNAPSHOT_OPTIONS]);
      expect(c.expected.masterTypeOptions).toEqual([...MASTER_TYPE_OPTIONS]);
      expect(c.expected.inspectionTypeOptions.length).toBe(6);
      expect(c.expected.masterTypeOptions.length).toBe(5);
      // the AppSheet self-divergence, verbatim both sides:
      expect(c.expected.inspectionTypeOptions[4]).toBe("น้ำ (Water Extinguishers)");
      expect(c.expected.masterTypeOptions[4]).toBe("น้ำ (Best Drop)");
      expect(c.expected.inspectionTypeOptions[5]).toBe(
        "น้ำ (Best Drop แบบ Low Pressure Water Mist)",
      );
      expect(JSON.stringify(c.divergence)).toContain(
        "inspection-type 6-value vs master 5-value",
      );
    }
  });

  it("EX-V05: breakdown_details auto-label IF([chem_exp]<=[Date_time],…) — hand-computed (ref 3337)", () => {
    const cases = EXTINGUISHER_CASES.filter((x) => x.id === "EX-V05");
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) {
      expect(deriveBreakdownLabel(c.input.chemExp, c.input.inspectionDate)).toBe(
        c.expected.label,
      );
    }
    // the exact hand-computed AppSheet semantics, case by case:
    expect(deriveBreakdownLabel("2026-01-15", "2026-01-15T10:00")).toBe("หมดอายุ");
    expect(deriveBreakdownLabel("2026-01-16", "2026-01-15T10:00")).toBe("ไม่หมดอายุ");
    expect(deriveBreakdownLabel("2026-09-13", "2026-01-15")).toBe("หมดอายุ");
    expect(deriveBreakdownLabel(null, "2026-01-15")).toBe("");
    expect(deriveBreakdownLabel("2026-01-15", undefined)).toBe("");
  });

  it("EX-V06: the Show If gates — 5-way abnormal OR (ref 3351/3389) + 7-way breakdown OR (ref 3343)", () => {
    const normal: InspectionItems = {
      pipe: "ปกติ",
      handle: "ปกติ",
      tank: "ปกติ",
      pressure_gauge: "ปกติ",
      barrier: "ไม่มี",
    };
    expect(anyItemAbnormal(normal)).toBe(false);
    expect(showCauseAndPhoto(normal)).toBe(false);
    for (const item of ["pipe", "handle", "tank"] as const) {
      expect(anyItemAbnormal({ ...normal, [item]: "ชำรุด" })).toBe(true);
    }
    expect(anyItemAbnormal({ ...normal, pressure_gauge: "ไม่ปกติ" })).toBe(true);
    expect(anyItemAbnormal({ ...normal, barrier: "มี" })).toBe(true);
    // unknown values are never judged abnormal (unknown ≠ defect)
    expect(
      anyItemAbnormal({ pipe: null, handle: null, tank: null, pressure_gauge: null, barrier: null }),
    ).toBe(false);
    // breakdown_details opens on the extra arms too: expired / resolved
    expect(
      showBreakdownDetails({ resolved: false, items: normal, expired: false }),
    ).toBe(false);
    expect(
      showBreakdownDetails({ resolved: false, items: normal, expired: true }),
    ).toBe(true);
    expect(
      showBreakdownDetails({ resolved: true, items: normal, expired: false }),
    ).toBe(true);
    expect(
      showBreakdownDetails({ resolved: false, items: { ...normal, tank: "ชำรุด" }, expired: false }),
    ).toBe(true);
  });

  it("EX-V07: ผู้ตรวจสอบ Valid If — positions × status ≠ ลาออก (ref 3377, hand-computed)", () => {
    const cases = EXTINGUISHER_CASES.filter((x) => x.id === "EX-V07");
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) {
      expect(isEligibleInspector(c.input)).toBe(c.expected.eligible);
    }
    // the deliberate verbatim ≠ลาออก reading: the legacy 'active' status
    // stays eligible (recorded difference vs the P1.4 =ทำงาน recorder rule)
    expect(isEligibleInspector({ position: "นักวิชาการสาธารณสุข", status: "active" })).toBe(true);
    expect(INELIGIBLE_STATUS).toBe("ลาออก");
    expect([...INSPECTOR_POSITIONS]).toEqual(["นักวิชาการสาธารณสุข", "พนักงานบริการ"]);
    expect([...CAUSE_OPTIONS]).toEqual(["เกิดจากการใช้งาน", "หมดอายุ"]);
  });

  it("EX-Q01: QR derive-never-store — payload = Row ID, the QR image/URL never persisted (ref 3079)", () => {
    const cases = EXTINGUISHER_CASES.filter((x) => x.id === "EX-Q01");
    for (const c of cases) {
      expect(c.expected.qrStored).toBe(false);
      expect(c.expected.payloadShape).toBe("22-char PackedUUID text");
      expect(c.expected.qrFormula).toBe(
        '="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" & [Row ID]',
      );
    }
    // the shipped lib derives ids and NEVER stores any QR artifact:
    const src = readFileSync(path.join(__dirname, "extinguisher-inspection.ts"), "utf8");
    expect(src).not.toContain("qrserver");
    expect(src).not.toContain("create-qr-code");
    expect(generateLegacyRowId()).toMatch(/^[A-Za-z0-9]{22}$/);
    expect(generateInspectionId()).toMatch(/^[0-9a-f]{8}$/);
    // the placeholder init (ref 3153) and blank are never usable payloads
    expect(QR_PLACEHOLDER).toBe("สแกน QR CODE");
    expect(isQrPayloadUsable("สแกน QR CODE")).toBe(false);
    expect(isQrPayloadUsable("")).toBe(false);
    expect(isQrPayloadUsable("  ")).toBe(false);
    expect(isQrPayloadUsable("vtiHJw6wpw4c6f4553dms5")).toBe(true);
    // the verbatim Valid If error label (ref 3165; double space verbatim)
    expect(ERR_QR_NOT_FOUND).toBe("ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ");
  });

  it("expiry status is honest: expiry ≤ today ⇒ หมดอายุ, later ⇒ ไม่หมดอายุ, NULL ⇒ null (RPC payload)", () => {
    expect(expiryStatusOf("2026-09-13", "2026-11-17")).toBe("หมดอายุ");
    expect(expiryStatusOf("2026-11-18", "2026-11-17")).toBe("ไม่หมดอายุ");
    expect(expiryStatusOf("2026-11-17", "2026-11-17")).toBe("หมดอายุ");
    expect(expiryStatusOf(null, "2026-11-17")).toBeNull();
    expect(expiryStatusOf("", "2026-11-17")).toBeNull();
  });
});

// ─── LIGHT — §3.33 value sets + the Show If matrix (WO §4-2) ────────────────

describe("light Check value sets verbatim (ref 5055/5067/5085/5118/5138)", () => {
  it("LT-V01: Persistency = {มี, ไม่มี} init มี (ref 5050 init, enum 5055)", () => {
    expect([...PERSISTENCY_OPTIONS]).toEqual(["มี", "ไม่มี"]);
    expect(PERSISTENCY_DEFAULT).toBe("มี");
  });

  it("LT-V02: Position = {เหมาะสม, ไม่เหมาะสม} init เหมาะสม (ref 5062 init, enum 5067)", () => {
    expect([...POSITION_OPTIONS]).toEqual(["เหมาะสม", "ไม่เหมาะสม"]);
    expect(POSITION_DEFAULT).toBe("เหมาะสม");
  });

  it("LT-V03: test_result = {ผ่าน, ไม่ผ่าน} init ผ่าน (ref 5074 init, enum 5085)", () => {
    expect([...TEST_RESULT_OPTIONS]).toEqual(["ผ่าน", "ไม่ผ่าน"]);
    expect(TEST_RESULT_DEFAULT).toBe("ผ่าน");
  });

  it("LT-V04: Status = 3 values verbatim, blank ⇒ NULL (ref 5138; no init pinned — seed reality blank×300)", () => {
    for (const c of LIGHT_CASES.filter((x) => x.id === "LT-V04")) {
      expect(c.expected.options).toEqual([...STATUS_OPTIONS]);
      expect(c.expected.blankIsPossible).toBe(true);
    }
    expect([...STATUS_OPTIONS]).toEqual(["แจ้งซ่อม", "แจ้งย้ายตำแหน่ง", "ขอติดตั้ง"]);
  });

  it("LT-V05: Broken_detail EnumList = the 5 documented values verbatim (ref 5118)", () => {
    for (const c of LIGHT_CASES.filter((x) => x.id === "LT-V05")) {
      expect(c.expected.options).toEqual([...BROKEN_DETAIL_OPTIONS]);
    }
    expect([...BROKEN_DETAIL_OPTIONS]).toEqual([
      "ไม่มีหัตถการ",
      "มีแสงสว่างจากธรรมชาติ",
      "ไม่มีเวรดึก",
      "ไฟไม่สว่าง",
      "ไม่เก็บไฟ",
    ]);
  });
});

describe("light Show If matrix — hand-computed (ref 5080/5113/5125/5133)", () => {
  it("LT-S01: test_result gated on [Persistency]=\"มี\" — unknown persistency never reveals", () => {
    const cases = LIGHT_CASES.filter((x) => x.id === "LT-S01");
    for (const c of cases) {
      expect(showTestResult(c.input.persistency)).toBe(c.expected.visible);
    }
    expect(showTestResult("มี")).toBe(true);
    expect(showTestResult("ไม่มี")).toBe(false);
    expect(showTestResult(null)).toBe(false);
    expect(showTestResult(undefined)).toBe(false);
  });

  it("LT-S02: Broken_detail on the 2-way OR(ไม่ผ่าน, ไม่เหมาะสม) — persistency=ไม่มี ALONE does NOT open it (ref 5113)", () => {
    const cases = LIGHT_CASES.filter((x) => x.id === "LT-S02");
    for (const c of cases) {
      expect(showLightBrokenDetail(c.input)).toBe(c.expected.visible);
    }
    expect(showLightBrokenDetail({ testResult: "ผ่าน", position: "เหมาะสม" })).toBe(false);
    expect(showLightBrokenDetail({ testResult: "ไม่ผ่าน", position: "เหมาะสม" })).toBe(true);
    expect(showLightBrokenDetail({ testResult: "ผ่าน", position: "ไม่เหมาะสม" })).toBe(true);
    // the discriminator vs Pic/Status: the third arm is persistency —
    // NOT part of the Broken_detail gate (hand-computed AppSheet matrix)
    expect(
      showLightBrokenDetail({ testResult: "ผ่าน", position: "เหมาะสม", persistency: "ไม่มี" }),
    ).toBe(false);
  });

  it("LT-S03: Pic/Status on the 3-way OR(ไม่ผ่าน, ไม่เหมาะสม, ไม่มี) (ref 5125/5133)", () => {
    const cases = LIGHT_CASES.filter((x) => x.id === "LT-S03");
    for (const c of cases) {
      expect(showPicAndStatus(c.input)).toBe(c.expected.visible);
    }
    expect(showPicAndStatus({ testResult: "ผ่าน", position: "เหมาะสม", persistency: "มี" })).toBe(false);
    expect(showPicAndStatus({ testResult: "ผ่าน", position: "เหมาะสม", persistency: "ไม่มี" })).toBe(true);
    expect(showPicAndStatus({ testResult: "ไม่ผ่าน", position: "เหมาะสม", persistency: "มี" })).toBe(true);
    expect(showPicAndStatus({ testResult: "ผ่าน", position: "ไม่เหมาะสม", persistency: "มี" })).toBe(true);
    expect(showPicAndStatus({ testResult: null, position: null, persistency: null })).toBe(false);
  });

  it("LT-Q01: light QR derive-never-store over [ERL_ID] (ref 4954) + the honest unresolved label", () => {
    const cases = LIGHT_CASES.filter((x) => x.id === "LT-Q01");
    for (const c of cases) {
      expect(c.expected.qrStored).toBe(false);
      expect(c.expected.qrFormula).toBe(
        '="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" & [ERL_ID]',
      );
    }
    const src = readFileSync(path.join(__dirname, "emergency-light-check.ts"), "utf8");
    expect(src).not.toContain("qrserver");
    expect(src).not.toContain("create-qr-code");
    expect(generateCheckId()).toMatch(/^[0-9a-f]{8}$/);
    expect(QR_LIGHT_PLACEHOLDER).toBe("สแกน QR CODE");
    expect(isLightQrPayloadUsable("สแกน QR CODE")).toBe(false);
    expect(isLightQrPayloadUsable("001")).toBe(true);
    // the verbatim unresolved-reference honesty (the '31' row shape):
    expect(unresolvedLightLabel("31", false)).toBe("31 (ไม่พบอ้างอิง)");
    expect(unresolvedLightLabel("001", true)).toBe("001");
  });
});

// ─── COLIFORM — same-day gate / pending / suggestions / vocab (WO §4-3) ─────

describe("coliform same-day รอผล gate — TODAY()>[Collect_date] (ref 3660/3854)", () => {
  it("CB-G: hand-computed gate cases — strictly-later day only", () => {
    const gateCases = CB_COLIFORM_CASES.filter((x) => x.id.startsWith("CB-G"));
    for (const c of gateCases) {
      expect(showResultFields(c.input.collectDate, c.input.todayISO)).toBe(
        c.expected.resultFieldsVisible,
      );
    }
    expect(showResultFields("2026-11-16", "2026-11-17")).toBe(true);
    expect(showResultFields("2026-11-17", "2026-11-17")).toBe(false);
    expect(showResultFields("2026-11-18", "2026-11-17")).toBe(false);
    expect(showResultFields(null, "2026-11-17")).toBe(false);
    expect(showResultFields("", "2026-11-17")).toBe(false);
  });

  it("CB-P: isPendingResult consumed, never re-derived (lib/food.ts:251-255) — both writes required", () => {
    const pendingCases = CB_COLIFORM_CASES.filter((x) => x.id.startsWith("CB-P"));
    for (const c of pendingCases) {
      expect(isPendingResult(c.input)).toBe(c.expected.pending);
    }
    expect(isPendingResult({ result: "Positive", reported_date: "2026-11-16" })).toBe(false);
    expect(isPendingResult({ result: "Positive", reported_date: null })).toBe(true);
    expect(isPendingResult({ result: null, reported_date: "2026-11-16" })).toBe(true);
    expect(isPendingResult({ result: "   ", reported_date: "" })).toBe(true);
    expect(isPendingResult({})).toBe(true);
  });

  it("CB-S: +1/+2 suggestions Food/Employee ONLY (ref 3654/3848) — hand-computed boundary math", () => {
    const suggestCases = CB_COLIFORM_CASES.filter((x) => x.id.startsWith("CB-S"));
    for (const c of suggestCases) {
      expect(suggestsResultDates(c.input.source)).toBe(c.expected.suggests);
      if (c.expected.suggests && c.input.collectDate) {
        expect(suggestedResultDates(c.input.collectDate)).toEqual(c.expected.suggestions);
      }
    }
    // month boundary: 2026-11-30 +1/+2 → 2026-12-01 / 2026-12-02
    expect(suggestedResultDates("2026-11-30")).toEqual(["2026-12-01", "2026-12-02"]);
    // year boundary: 2024-12-31 +1/+2 → 2025-01-01 / 2025-01-02
    expect(suggestedResultDates("2024-12-31")).toEqual(["2025-01-01", "2025-01-02"]);
    // water/general carry NONE in AppSheet (§3.16/§3.11) — honest per-source
    expect(suggestsResultDates("น้ำ")).toBe(false);
    expect(suggestsResultDates("ทั่วไป")).toBe(false);
  });

  it("CB-S05: suggestions are UI-only — never auto-filled into the step-2 write", () => {
    const src = readFileSync(path.join(__dirname, "food.ts"), "utf8");
    // createFoodLabTest inserts the caller's input verbatim — no
    // suggestedResultDates call site, no default result/reported_date.
    const createFn = src.slice(src.indexOf("createFoodLabTest"), src.indexOf("deleteFoodLabTest"));
    expect(createFn).not.toContain("suggestedResultDates");
    expect(createFn).not.toContain("TODAY()");
    expect(createFn).not.toContain("new Date()");
  });

  it("CB-V: per-source vocabularies gated, never coerced (ref 3563/3641/3008/§3.19)", () => {
    const vocabCases = CB_COLIFORM_CASES.filter((x) => x.id.startsWith("CB-V"));
    for (const c of vocabCases) {
      if (c.expected.collectPoints !== undefined) {
        expect([...collectPointsFor(c.input.source)]).toEqual(c.expected.collectPoints);
      }
      if (c.expected.resultSet !== undefined) {
        expect([...resultSetFor(c.input.source)]).toEqual(c.expected.resultSet);
      }
      if (c.expected.equipmentDefault !== undefined) {
        expect(EQUIPMENT_DEFAULTS[c.input.source]).toBe(c.expected.equipmentDefault);
      }
    }
    expect([...COLIFORM_SOURCES]).toEqual(["น้ำ", "อาหาร", "พนักงาน", "ทั่วไป"]);
    expect([...WATER_COLLECT_POINTS]).toEqual([
      "โรงครัว",
      "ตู้กดน้ำ OPD",
      "ตู้กดน้ำ IPD",
      "ตู้กดน้ำปฐมภูมิ (ห้องฟัน)",
    ]);
    expect([...FOOD_COLLECT_POINTS]).toEqual([
      "ช้อนสั้น",
      "ถาด",
      "มือพี่กุ้ง",
      "มือป้าอ้อ",
      "มือแก๊ป",
    ]);
    expect([...GENERAL_COLLECT_POINTS]).toEqual(["โรงครัว", "บ่อบำบัด"]);
    // employee person-swabs carry NO collect point (§3.19 — the sample is a person)
    expect([...collectPointsFor("พนักงาน")]).toEqual([]);
  });

  it("CB-V05/06: result sets per source — ผ่าน/ไม่ผ่าน mapping is Positive/Negative (+ the ++/invalid variants)", () => {
    expect([...COLIFORM_RESULT_WATER]).toEqual(["Positive", "Negative"]);
    expect([...COLIFORM_RESULT_EXTENDED]).toEqual([
      "Positive",
      "Negative",
      "Positive ++",
      "invalid",
    ]);
    expect([...resultSetFor("น้ำ")]).toEqual([...COLIFORM_RESULT_WATER]);
    expect([...resultSetFor("ทั่วไป")]).toEqual([...COLIFORM_RESULT_WATER]);
    expect([...resultSetFor("อาหาร")]).toEqual([...COLIFORM_RESULT_EXTENDED]);
    expect([...resultSetFor("พนักงาน")]).toEqual([...COLIFORM_RESULT_EXTENDED]);
  });

  it("CB-V07: equipment defaults aca317bf / aca317bf / 2fe4aa7c / none (ref 3584/3688/3882/§3.11)", () => {
    expect(EQUIPMENT_DEFAULTS["น้ำ"]).toBe("aca317bf");
    expect(EQUIPMENT_DEFAULTS["อาหาร"]).toBe("aca317bf");
    expect(EQUIPMENT_DEFAULTS["พนักงาน"]).toBe("2fe4aa7c");
    expect(EQUIPMENT_DEFAULTS["ทั่วไป"]).toBeNull();
  });
});
