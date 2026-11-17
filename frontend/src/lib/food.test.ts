/**
 * ENV-PARITY-P2-004 — form-parity tests for the coliform ×3 two-step
 * testing flow on `food.lab_test` (AppSheet parity Phase 2, lane P2.4).
 *
 * Pins the verbatim AppSheet contract (reference doc 12 §3.11/§3.16/§3.17/
 * §3.19, per WO §3.1/§4) onto the pure lib exports in ./food:
 *   - the verbatim per-source vocabularies (no hard DB CHECK — D1-8 — the
 *     UI restricts to these lists)
 *   - the two-step state machine (collect → รอผล pending → result later)
 *     with the verbatim Show If gate `TODAY() > Collect_date` (same-day
 *     collect NEVER exposes result fields — honest AppSheet parity)
 *   - suggested +1/+2 วัน = UI-only suggestions on food/employee ONLY,
 *     never auto-filled (D1-7)
 *   - personnel resolution UUID-or-NULL, never verbatim national-ID-class
 *     identifiers (PII pin D1-5 — pickers carry only {id, full_name,
 *     position, status})
 *   - equipment_legacy verbatim defaults (aca317bf water/food,
 *     2fe4aa7c employee; general carries none)
 *
 * RED-first: before the implementation lands these exports do not exist —
 * the suite fails to collect, and that failure is the evidence.
 */
// food.ts lives in the supabase-client module graph; the client throws at
// load without the two env vars. The tests below exercise PURE functions
// only — stub the env before the import so collection succeeds (no
// network is ever touched; the node vitest environment has no .env).
import { describe, expect, it, vi } from "vitest";

// food.ts lives in the supabase-client module graph; the client throws at
// load without the two env vars. The tests below exercise PURE functions
// only — stub the env before the imports evaluate (vi.hoisted runs ahead
// of them; no network is ever touched; the node vitest environment has
// no .env).
vi.hoisted(() => {
  process.env.VITE_SUPABASE_URL ??= "https://stub.supabase.test";
  process.env.VITE_SUPABASE_ANON_KEY ??= "stub-anon-key";
});
import {
  COLIFORM_SOURCES,
  COLIFORM_RESULT_EXTENDED,
  COLIFORM_RESULT_WATER,
  EQUIPMENT_DEFAULTS,
  FOOD_COLLECT_POINTS,
  GENERAL_COLLECT_POINTS,
  TEST_TYPE_DEFAULT,
  WATER_COLLECT_POINTS,
  collectPointsFor,
  eligibleCollectors,
  eligibleReporters,
  eligibleSamplePersons,
  isPendingResult,
  resultSetFor,
  showResultFields,
  suggestedResultDates,
  suggestsResultDates,
  type ColiformPersonnelOption,
  type ColiformSource,
} from "./food";

// ─── helpers ────────────────────────────────────────────────────────────

const P = (
  id: string,
  full_name: string,
  position: string,
  status = "ทำงาน",
): ColiformPersonnelOption => ({ id, full_name, position, status });

const STAFF = [
  P("p1", "สมศรี สาธารณสุข", "นักวิชาการสาธารณสุข"),
  P("p2", "สมศักดิ์ โภชนาการ", "นักโภชนาการ"),
  P("p3", "สมใจ ประกอบอาหาร", "พนักงานประกอบอาหาร"),
  P("p4", "นายแพทย์ ใหญ่", "นายแพทย์"),
  P("p5", "ลาออกแล้ว", "นักวิชาการสาธารณสุข", "ลาออก"),
];

// ─── verbatim vocabularies (D1-8; UI-restricted lists, NO DB CHECK) ─────

describe("coliform vocabularies (verbatim per source)", () => {
  it("exposes exactly the four sample sources", () => {
    expect([...COLIFORM_SOURCES]).toEqual(["น้ำ", "อาหาร", "พนักงาน", "ทั่วไป"]);
  });

  it("water collect points = §3.16 4-value enum verbatim", () => {
    expect([...WATER_COLLECT_POINTS]).toEqual([
      "โรงครัว",
      "ตู้กดน้ำ OPD",
      "ตู้กดน้ำ IPD",
      "ตู้กดน้ำปฐมภูมิ (ห้องฟัน)",
    ]);
    expect([...collectPointsFor("น้ำ" as ColiformSource)]).toEqual([...WATER_COLLECT_POINTS]);
  });

  it("food collect points = §3.17 5-value enum verbatim", () => {
    expect([...FOOD_COLLECT_POINTS]).toEqual([
      "ช้อนสั้น",
      "ถาด",
      "มือพี่กุ้ง",
      "มือป้าอ้อ",
      "มือแก๊ป",
    ]);
    expect([...collectPointsFor("อาหาร" as ColiformSource)]).toEqual([...FOOD_COLLECT_POINTS]);
  });

  it("general collect points = §3.11 2-value enum verbatim", () => {
    expect([...GENERAL_COLLECT_POINTS]).toEqual(["โรงครัว", "บ่อบำบัด"]);
    expect([...collectPointsFor("ทั่วไป" as ColiformSource)]).toEqual([...GENERAL_COLLECT_POINTS]);
  });

  it("employee rows carry NO collect-point list (the sample is a person)", () => {
    expect([...collectPointsFor("พนักงาน" as ColiformSource)]).toEqual([]);
  });

  it("result sets: water/general = {Positive, Negative}; food/employee extended", () => {
    expect([...COLIFORM_RESULT_WATER]).toEqual(["Positive", "Negative"]);
    expect([...COLIFORM_RESULT_EXTENDED]).toEqual([
      "Positive",
      "Negative",
      "Positive ++",
      "invalid",
    ]);
    expect([...resultSetFor("น้ำ" as ColiformSource)]).toEqual(["Positive", "Negative"]);
    expect([...resultSetFor("ทั่วไป" as ColiformSource)]).toEqual(["Positive", "Negative"]);
    expect([...resultSetFor("อาหาร" as ColiformSource)]).toEqual([...COLIFORM_RESULT_EXTENDED]);
    expect([...resultSetFor("พนักงาน" as ColiformSource)]).toEqual([...COLIFORM_RESULT_EXTENDED]);
  });

  it("equipment_legacy defaults verbatim (aca317bf water/food, 2fe4aa7c employee, none general)", () => {
    expect(EQUIPMENT_DEFAULTS["น้ำ"]).toBe("aca317bf");
    expect(EQUIPMENT_DEFAULTS["อาหาร"]).toBe("aca317bf");
    expect(EQUIPMENT_DEFAULTS["พนักงาน"]).toBe("2fe4aa7c");
    expect(EQUIPMENT_DEFAULTS["ทั่วไป"]).toBeNull();
  });

  it("test_type defaults to total_coliform (the coliform lane's canonical value)", () => {
    expect(TEST_TYPE_DEFAULT).toBe("total_coliform");
  });
});

// ─── two-step state machine (Show If TODAY() > Collect_date, verbatim) ──

describe("two-step flow state machine", () => {
  it("SAME-DAY collect keeps result fields hidden (รอผล — Show If TODAY()>Collect_date)", () => {
    expect(showResultFields("2026-11-17", "2026-11-17")).toBe(false);
  });

  it("NEXT-DAY collect exposes the result fields (กรอกผลภายหลัง)", () => {
    expect(showResultFields("2026-11-16", "2026-11-17")).toBe(true);
  });

  it("FUTURE collect date keeps result fields hidden (never editable early)", () => {
    expect(showResultFields("2026-11-18", "2026-11-17")).toBe(false);
  });

  it("unknown/blank collect date never exposes result fields", () => {
    expect(showResultFields("", "2026-11-17")).toBe(false);
    expect(showResultFields(null as unknown as string, "2026-11-17")).toBe(false);
  });

  it("a row without a result renders รอผล (pending) — unknown never coerced to a value", () => {
    expect(isPendingResult({ result: null, reported_date: null })).toBe(true);
    expect(isPendingResult({ result: undefined, reported_date: undefined })).toBe(true);
    expect(isPendingResult({ result: "", reported_date: null })).toBe(true);
    expect(isPendingResult({ result: "Positive", reported_date: "2026-11-17" })).toBe(false);
    // a result WITHOUT a date is still unentered (both step-2 fields move together)
    expect(isPendingResult({ result: "Positive", reported_date: null })).toBe(true);
    expect(isPendingResult({ result: null, reported_date: "2026-11-17" })).toBe(true);
  });

  it("suggested +1/+2 วัน exist for food/employee ONLY (verbatim §3.17/§3.19)", () => {
    expect(suggestsResultDates("อาหาร" as ColiformSource)).toBe(true);
    expect(suggestsResultDates("พนักงาน" as ColiformSource)).toBe(true);
    expect(suggestsResultDates("น้ำ" as ColiformSource)).toBe(false);
    expect(suggestsResultDates("ทั่วไป" as ColiformSource)).toBe(false);
  });

  it("suggestions are exactly collect+1 and collect+2 — UI-only, never auto-filled", () => {
    expect(suggestedResultDates("2026-11-17")).toEqual(["2026-11-18", "2026-11-19"]);
    // month-boundary safety (local date math, no UTC drift)
    expect(suggestedResultDates("2026-11-30")).toEqual(["2026-12-01", "2026-12-02"]);
    expect(suggestedResultDates("2026-02-28")).toEqual(["2026-03-01", "2026-03-02"]);
  });
});

// ─── personnel resolution (PII pin D1-5: UUID-or-NULL, never verbatim) ──

describe("personnel pickers (UUID-or-NULL, never verbatim IDs)", () => {
  it("employee swab subject = นักโภชนาการ / พนักงานประกอบอาหาร only (§3.19 Valid If)", () => {
    const ids = eligibleSamplePersons(STAFF).map((p) => p.id);
    expect(ids).toEqual(["p2", "p3"]);
  });

  it("collector = นักวิชาการสาธารณสุข with สถานะ ≠ ลาออก (§3.17 Valid If)", () => {
    const ids = eligibleCollectors(STAFF).map((p) => p.id);
    expect(ids).toEqual(["p1"]);
  });

  it("reporter food/employee = นักวิชาการสาธารณสุข — position ONLY, no status clause (§3.17 ref 3737/§3.19 Valid If verbatim: the ลาออก exclusion belongs to the COLLECTOR's Valid If, not the reporter's)", () => {
    const ids = eligibleReporters(STAFF, "อาหาร" as ColiformSource).map((p) => p.id);
    expect(ids).toEqual(["p1", "p5"]);
    expect(eligibleReporters(STAFF, "พนักงาน" as ColiformSource).map((p) => p.id)).toEqual(["p1", "p5"]);
  });

  it("reporter water/general = ตำแหน่ง ≠ นายแพทย์ (§3.11/§3.16 Valid If)", () => {
    const ids = eligibleReporters(STAFF, "น้ำ" as ColiformSource).map((p) => p.id);
    expect(ids).toEqual(["p1", "p2", "p3", "p5"]);
    expect(eligibleReporters(STAFF, "ทั่วไป" as ColiformSource).map((p) => p.id)).toEqual(ids);
  });

  it("picker options carry ONLY {id, full_name, position, status} — never Employee_id-class data", () => {
    for (const p of eligibleSamplePersons(STAFF)) {
      expect(Object.keys(p).sort()).toEqual(["full_name", "id", "position", "status"]);
    }
  });

  it("null/empty personnel list yields empty pickers (UUID-or-NULL — an empty pick stays NULL)", () => {
    expect(eligibleSamplePersons(null)).toEqual([]);
    expect(eligibleCollectors([])).toEqual([]);
    expect(eligibleReporters(null, "น้ำ" as ColiformSource)).toEqual([]);
  });
});
