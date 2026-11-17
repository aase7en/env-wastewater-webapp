/**
 * ENV-PARITY-P2-005 — unit tests for the pure coliform summary lib
 * (AppSheet parity lane P2.5: สรุป coliform on /reports — reference doc 12
 * §3.37 Filter_ColiformBac ref 5523–5574 + the per-table semantics
 * §3.11/§3.16/§3.17/§3.19, pinned per WO ENV-PARITY-P2-005 §4.3).
 *
 * Pins VERBATIM (WO §4.3 + handoff §3):
 *   - per-`sample_source` (น้ำ/อาหาร/พนักงาน/ทั่วไป) จำนวนตัวอย่างที่เก็บ /
 *     รอผล / มีผล — รอผล is its OWN number, NEVER folded into ผ่าน/ไม่ผ่าน,
 *     NEVER zero-coerced (WO §4.4-1)
 *   - the pending predicate is HOUSE CODE — the lib CONSUMES isPendingResult
 *     from ./food (handoff §2.1: "CONSUME, never re-derive")
 *   - ผลผ่าน ⇔ Negative; ผลไม่ผ่าน ⇔ Positive ∨ Positive ++; the real
 *     denominator (มีผล) travels with the pair (WO §4.4-1)
 *   - Positive ++ counted SEPARATELY; invalid counted SEPARATELY; any other
 *     stored value lands in an explicit ค่าอื่น bucket — never coerced
 *     (P2.4 D1-12 free-text compat)
 *   - collect-point breakdowns: water 4 / food 5 / general 2 verbatim
 *     vocabularies; employee rows carry NO collect point → the single
 *     "ตัวอย่างจากบุคลากร" entry (counts only — NO person identity, PII pin)
 *   - monthly rollups (P1.6 month-not-reached pattern): a month with no
 *     records AND a month not yet reached → NULL, NEVER 0
 *   - พ.ศ. labels (Thai full month + year+543, the P1.6 verbatim order)
 *   - counts only — no names, no Employee_id anywhere (PII pin WO §4.4-4)
 */
import { describe, it, expect, vi } from "vitest";

// coliform-summary.ts consumes isPendingResult from ./food, which lives in
// the supabase-client module graph; the client throws at load without the
// two env vars. The tests below exercise PURE functions only — stub the
// env before the imports evaluate (vi.hoisted runs ahead of them; no
// network is ever touched; the node vitest environment has no .env).
vi.hoisted(() => {
  process.env.VITE_SUPABASE_URL ??= "https://stub.supabase.test";
  process.env.VITE_SUPABASE_ANON_KEY ??= "stub-anon-key";
});
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  buildColiformSummary,
  type ColiformReportRow,
} from "./coliform-summary";

function row(over: Partial<ColiformReportRow>): ColiformReportRow {
  return {
    sample_date: over.sample_date ?? "2026-11-02",
    sample_source: over.sample_source ?? "น้ำ",
    collect_point: over.collect_point ?? null,
    result: over.result ?? null,
    reported_date: over.reported_date ?? null,
  };
}

// ─── Per-source เก็บ / รอผล / มีผล (WO §4.3) ───────────────────────────────

describe("buildColiformSummary — เก็บ/รอผล/มีผล per source", () => {
  const rows: ColiformReportRow[] = [
    // น้ำ ×3: one resulted-pass, one pending, one Positive ++ (free-text compat)
    row({ sample_date: "2026-11-02", sample_source: "น้ำ", collect_point: "โรงครัว", result: "Negative", reported_date: "2026-11-04" }),
    row({ sample_date: "2026-11-03", sample_source: "น้ำ", collect_point: "ตู้กดน้ำ OPD" }), // รอผล — result+date absent
    row({ sample_date: "2026-11-04", sample_source: "น้ำ", collect_point: "ตู้กดน้ำ IPD", result: "Positive ++", reported_date: "2026-11-06" }),
    // อาหาร ×2: invalid separate + ไม่ผ่าน
    row({ sample_date: "2026-11-02", sample_source: "อาหาร", collect_point: "ช้อนสั้น", result: "invalid", reported_date: "2026-11-04" }),
    row({ sample_date: "2026-11-05", sample_source: "อาหาร", collect_point: "ถาด", result: "Positive", reported_date: "2026-11-07" }),
    // พนักงาน ×1: NO collect point (person swab — counts only)
    row({ sample_date: "2026-11-03", sample_source: "พนักงาน", collect_point: null, result: "Negative", reported_date: "2026-11-05" }),
    // ทั่วไป ×1: free-text result outside the documented sets → ค่าอื่น
    row({ sample_date: "2026-11-06", sample_source: "ทั่วไป", collect_point: "บ่อบำบัด", result: "ค่ากำกวม", reported_date: "2026-11-08" }),
    // OUT of range — must not contribute anywhere
    row({ sample_date: "2026-10-31", sample_source: "น้ำ", collect_point: "โรงครัว", result: "Negative", reported_date: "2026-11-01" }),
    row({ sample_date: "2027-01-01", sample_source: "น้ำ", collect_point: "โรงครัว", result: "Negative", reported_date: "2027-01-02" }),
  ];

  const s = buildColiformSummary({ startISO: "2026-11-01", endISO: "2026-12-31", rows });

  it("totals: เก็บ 7 / รอผล 1 / มีผล 6 — out-of-range rows contribute nothing", () => {
    expect(s.totalCollected).toBe(7);
    expect(s.totalPending).toBe(1);
    expect(s.totalResulted).toBe(6);
  });

  it("ผ่าน(Negative)=2 / ไม่ผ่าน(Positive∨++)=2 with the REAL มีผล denominator", () => {
    expect(s.totalPass).toBe(2);
    expect(s.totalFail).toBe(2);
    expect(s.totalPass + s.totalFail).toBe(s.totalResulted - s.totalInvalid - s.totalOther);
  });

  it("Positive ++ แยกต่างหาก (also inside ไม่ผ่าน)", () => {
    expect(s.totalPlusPlus).toBe(1);
    expect(s.totalFail).toBe(2); // Positive + Positive ++
  });

  it("invalid แยกต่างหาก", () => {
    expect(s.totalInvalid).toBe(1);
  });

  it("ค่าอื่น bucket: free-text result never coerced into ผ่าน/ไม่ผ่าน", () => {
    expect(s.totalOther).toBe(1);
  });

  it("รอผล is its own number — pending rows counted in NO result class", () => {
    // 7 เก็บ = 1 รอผล + 6 มีผล; the pending row appears in neither ผ่าน nor ไม่ผ่าน
    expect(s.totalPending + s.totalResulted).toBe(s.totalCollected);
    const water = s.sources.find((x) => x.source === "น้ำ")!;
    expect(water.pending).toBe(1);
    expect(water.collected).toBe(3);
    expect(water.resulted).toBe(2);
    expect(water.pass + water.fail + water.invalid + water.other).toBe(water.resulted);
  });

  it("all four sources always present in COLIFORM_SOURCES order, honest zeros included", () => {
    expect(s.sources.map((x) => x.source)).toEqual(["น้ำ", "อาหาร", "พนักงาน", "ทั่วไป"]);
    const food = s.sources.find((x) => x.source === "อาหาร")!;
    expect(food.collected).toBe(2);
    expect(food.pending).toBe(0); // honest zero — never hidden
    expect(food.invalid).toBe(1);
    expect(food.fail).toBe(1);
    const employee = s.sources.find((x) => x.source === "พนักงาน")!;
    expect(employee.collected).toBe(1);
    expect(employee.pass).toBe(1);
    const general = s.sources.find((x) => x.source === "ทั่วไป")!;
    expect(general.other).toBe(1);
    expect(general.pass).toBe(0);
  });

  it("empty range / no rows: honest zeros everywhere (never fabricated)", () => {
    const empty = buildColiformSummary({ startISO: "2026-11-01", endISO: "2026-11-30", rows: [] });
    expect(empty.totalCollected).toBe(0);
    expect(empty.totalPending).toBe(0);
    expect(empty.totalResulted).toBe(0);
    expect(empty.totalPass).toBe(0);
    expect(empty.sources).toHaveLength(4);
  });
});

// ─── isPendingResult CONSUMED (house predicate — never re-derived) ─────────

describe("pending gate — isPendingResult house predicate consumption", () => {
  it("result-present-but-date-blank stays รอผล (the house predicate's shape)", () => {
    const rows = [
      row({ sample_date: "2026-11-02", sample_source: "น้ำ", collect_point: "โรงครัว", result: "Negative", reported_date: null }),
    ];
    const s = buildColiformSummary({ startISO: "2026-11-01", endISO: "2026-11-30", rows });
    expect(s.totalPending).toBe(1);
    expect(s.totalResulted).toBe(0);
    expect(s.totalPass).toBe(0); // never zero-coerced into a class
  });

  it("blank-result-but-date-present stays รอผล", () => {
    const rows = [
      row({ sample_date: "2026-11-02", sample_source: "อาหาร", collect_point: "ถาด", result: "", reported_date: "2026-11-04" }),
    ];
    const s = buildColiformSummary({ startISO: "2026-11-01", endISO: "2026-11-30", rows });
    expect(s.totalPending).toBe(1);
    expect(s.totalResulted).toBe(0);
    expect(s.totalOther).toBe(0); // blank result ≠ ค่าอื่น — it is รอผล
  });

  it("the lib imports isPendingResult from ./food (CONSUME, never re-derive)", () => {
    const src = readFileSync(
      fileURLToPath(new URL("./coliform-summary.ts", import.meta.url)),
      "utf8",
    );
    expect(src).toContain("isPendingResult");
    expect(src).toMatch(/from\s+["']\.\/food["']/);
  });
});

// ─── Collect-point breakdowns (verbatim vocabularies) ──────────────────────

describe("collect-point breakdowns (water 4 / food 5 / general 2 / employee)", () => {
  it("น้ำ: the 4 verbatim points in order; blanks land in ไม่ระบุ; unknown in อื่นๆ", () => {
    const rows = [
      row({ sample_source: "น้ำ", collect_point: "โรงครัว", result: "Negative", reported_date: "2026-11-04" }),
      row({ sample_date: "2026-11-03", sample_source: "น้ำ", collect_point: "ตู้กดน้ำ OPD" }),
      row({ sample_source: "น้ำ", collect_point: null, result: "Negative", reported_date: "2026-11-05" }),
      row({ sample_source: "น้ำ", collect_point: "จุดแปลกปลอม", result: "Negative", reported_date: "2026-11-05" }),
    ];
    const s = buildColiformSummary({ startISO: "2026-11-01", endISO: "2026-11-30", rows });
    const water = s.sources.find((x) => x.source === "น้ำ")!;
    const labels = water.points.map((p) => p.label);
    expect(labels).toContain("โรงครัว");
    expect(labels).toContain("ตู้กดน้ำ OPD");
    expect(labels).toContain("ตู้กดน้ำ IPD");
    expect(labels).toContain("ตู้กดน้ำปฐมภูมิ (ห้องฟัน)");
    const byLabel = Object.fromEntries(water.points.map((p) => [p.label, p.count]));
    expect(byLabel["โรงครัว"]).toBe(1);
    expect(byLabel["ตู้กดน้ำ OPD"]).toBe(1);
    expect(byLabel["ตู้กดน้ำ IPD"]).toBe(0); // pinned vocabulary always present
    expect(byLabel["ไม่ระบุ"]).toBe(1); // blank collect_point disclosed
    expect(byLabel["อื่นๆ"]).toBe(1); // free-text collect_point disclosed
    // breakdown covers every collected sample
    expect(water.points.reduce((a, p) => a + p.count, 0)).toBe(water.collected);
  });

  it("อาหาร: the 5 verbatim points in order", () => {
    const rows = [
      row({ sample_source: "อาหาร", collect_point: "มือแก๊ป", result: "Negative", reported_date: "2026-11-04" }),
    ];
    const s = buildColiformSummary({ startISO: "2026-11-01", endISO: "2026-11-30", rows });
    const labels = s.sources.find((x) => x.source === "อาหาร")!.points.map((p) => p.label);
    expect(labels).toEqual(["ช้อนสั้น", "ถาด", "มือพี่กุ้ง", "มือป้าอ้อ", "มือแก๊ป"]);
  });

  it("ทั่วไป: the 2 verbatim points in order", () => {
    const s = buildColiformSummary({ startISO: "2026-11-01", endISO: "2026-11-30", rows: [] });
    const labels = s.sources.find((x) => x.source === "ทั่วไป")!.points.map((p) => p.label);
    expect(labels).toEqual(["โรงครัว", "บ่อบำบัด"]);
  });

  it("พนักงาน: single ตัวอย่างจากบุคลากร entry — NO person identity anywhere", () => {
    const rows = [
      row({ sample_source: "พนักงาน", collect_point: null, result: "Negative", reported_date: "2026-11-04" }),
      row({ sample_date: "2026-11-03", sample_source: "พนักงาน", collect_point: null }),
    ];
    const s = buildColiformSummary({ startISO: "2026-11-01", endISO: "2026-11-30", rows });
    const employee = s.sources.find((x) => x.source === "พนักงาน")!;
    expect(employee.points).toEqual([{ label: "ตัวอย่างจากบุคลากร", count: 2 }]);
    expect(employee.collected).toBe(2);
    expect(employee.pending).toBe(1);
  });
});

// ─── Monthly rollups — the P1.6 month-not-reached NULL pattern ─────────────

describe("monthly rollups (no-record month AND month-not-reached → NULL, never 0)", () => {
  const rows: ColiformReportRow[] = [
    row({ sample_date: "2026-11-02", result: "Negative", reported_date: "2026-11-04" }),
    row({ sample_date: "2026-11-05", result: "Negative", reported_date: "2026-11-07" }),
    row({ sample_date: "2026-11-20", sample_source: "อาหาร", collect_point: "ถาด" }),
    // 2026-10 rows — outside a Nov→Dec range; must not leak in
    row({ sample_date: "2026-10-15", result: "Negative", reported_date: "2026-10-20" }),
  ];

  it("November sums its rows; December (no records, not yet reached) is NULL — NEVER 0", () => {
    const s = buildColiformSummary({ startISO: "2026-11-01", endISO: "2026-12-31", rows });
    expect(s.monthly).toHaveLength(2);
    expect(s.monthly[0]!.ym).toBe("2026-11");
    expect(s.monthly[0]!.total).toBe(3);
    expect(s.monthly[1]!.ym).toBe("2026-12");
    expect(s.monthly[1]!.total).toBeNull();
    expect(s.monthly.some((m) => m.total === 0)).toBe(false);
  });

  it("labels are Thai full months + พ.ศ. (the P1.6 verbatim order)", () => {
    const s = buildColiformSummary({ startISO: "2026-11-01", endISO: "2026-12-31", rows });
    expect(s.monthly[0]!.label).toBe("พฤศจิกายน 2569");
    expect(s.monthly[1]!.label).toBe("ธันวาคม 2569");
  });

  it("spans multiple months inclusively (a 3-month range yields 3 points)", () => {
    const s = buildColiformSummary({ startISO: "2026-10-15", endISO: "2026-12-31", rows: [] });
    expect(s.monthly.map((m) => m.ym)).toEqual(["2026-10", "2026-11", "2026-12"]);
  });
});

// ─── PII pin — counts only (WO §4.4-4 / handoff §2.2) ─────────────────────

describe("PII pin — the section family carries NO 13-digit digit-run", () => {
  it("13-digit digit-run grep of the NEW P2.5 files = 0 matches (suite pin)", () => {
    const files = [
      "./coliform-summary.ts",
      "./coliform-summary.test.ts",
      "./safety-summary.ts",
      "./safety-summary.test.ts",
    ];
    for (const f of files) {
      const src = readFileSync(fileURLToPath(new URL(f, import.meta.url)), "utf8");
      const matches = src.match(/\d{13}/g);
      expect(matches, `${f} carries a 13-digit digit-run: ${matches?.join(", ")}`).toBeNull();
    }
  });
});
