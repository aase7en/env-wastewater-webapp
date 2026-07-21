import { describe, it, expect } from "vitest";
import { fmt, thaiDate, daysSince, momPct } from "./utils";

/**
 * TEST-1: unit tests for the pure helpers in lib/utils.ts.
 *
 * Coverage (4 of 5 exports — `cn` is a clsx+twMerge passthrough, no value
 * in re-testing upstream libs):
 *   - fmt:        null/undefined/NaN/empty → "—"; string + number formatting
 *   - thaiDate:   Buddhist Era conversion (CE + 543); string + Date inputs
 *   - daysSince:  midnight-truncated day delta; today = 0; past > 0
 *   - momPct:     null baseline guards; signed %; UTILS-1 extract
 */

// ─── fmt ────────────────────────────────────────────────────────────────

describe("fmt", () => {
  it("returns '—' for null/undefined/empty", () => {
    expect(fmt(null)).toBe("—");
    expect(fmt(undefined)).toBe("—");
    expect(fmt("")).toBe("—");
  });

  it("returns '—' for NaN and unparseable strings", () => {
    expect(fmt(NaN)).toBe("—");
    expect(fmt("abc")).toBe("—");
  });

  it("formats numbers to the requested decimal places", () => {
    expect(fmt(3.14159, 2)).toBe("3.14");
    expect(fmt(3.14159, 4)).toBe("3.1416");
    expect(fmt(0, 1)).toBe("0.0");
    expect(fmt(-2.5, 1)).toBe("-2.5");
  });

  it("parses numeric strings before formatting", () => {
    expect(fmt("12.345", 1)).toBe("12.3");
    expect(fmt("100", 0)).toBe("100");
  });

  it("defaults to 1 decimal place", () => {
    expect(fmt(2.5)).toBe("2.5");
    expect(fmt(2)).toBe("2.0");
  });
});

// ─── thaiDate ───────────────────────────────────────────────────────────

describe("thaiDate", () => {
  it("converts CE → BE (CE + 543)", () => {
    // 2026-07-20 → 20 ก.ค. 2569
    expect(thaiDate("2026-07-20")).toBe("20 ก.ค. 2569");
  });

  it("accepts Date object input", () => {
    const d = new Date("2024-01-09T00:00:00Z");
    // Note: locale-dependent day — use UTC-safe construction in-test by
    // passing a date that doesn't cross tz boundaries for most offsets.
    const result = thaiDate(d);
    expect(result).toMatch(/^\d{1,2} \S+ \d{4}$/);
    expect(result.endsWith(" 2567")).toBe(true); // 2024 CE → 2567 BE
  });

  it("picks the right Thai month abbreviation", () => {
    const months = [
      ["2026-01-15", "ม.ค."], ["2026-02-15", "ก.พ."], ["2026-03-15", "มี.ค."],
      ["2026-04-15", "เม.ย."], ["2026-05-15", "พ.ค."], ["2026-06-15", "มิ.ย."],
      ["2026-07-15", "ก.ค."], ["2026-08-15", "ส.ค."], ["2026-09-15", "ก.ย."],
      ["2026-10-15", "ต.ค."], ["2026-11-15", "พ.ย."], ["2026-12-15", "ธ.ค."],
    ] as const;
    for (const [iso, label] of months) {
      expect(thaiDate(iso)).toContain(label);
    }
  });

  it("handles single-digit days without leading zero", () => {
    expect(thaiDate("2026-01-05")).toBe("5 ม.ค. 2569");
  });
});

// ─── daysSince ──────────────────────────────────────────────────────────

// FIX-1 (2026-07-21): helper to format a Date as a local YYYY-MM-DD string.
// The previous tests used toISOString().slice(0,10) which is UTC — under a
// positive tz offset (e.g. Asia/Bangkok UTC+7) that means "today UTC" can
// land on yesterday's date when re-parsed as local, producing off-by-one.
// Production callers feed dates that are already local YYYY-MM-DD (e.g.
// from thaiDate() or DB columns), so the test must mirror that.
function localIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

describe("daysSince", () => {
  it("returns 0 for today's date", () => {
    expect(daysSince(localIso(new Date()))).toBe(0);
  });

  it("returns 1 for yesterday", () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    expect(daysSince(localIso(d))).toBe(1);
  });

  it("returns N for N days ago", () => {
    const d = new Date();
    d.setDate(d.getDate() - 15);
    expect(daysSince(localIso(d))).toBe(15);
  });

  it("computes N days back accurately across month boundary", () => {
    // Cross-month regression: setDate handles 31→1 rollover correctly.
    // (Equivalent to the F7 stale-line case where latest reading is N days
    // back — but expressed relative to today so the test is date-stable.)
    const today = new Date();
    // Pin to 35 days back so it crosses at least one 30/31-day month end.
    today.setDate(today.getDate() - 35);
    expect(daysSince(localIso(today))).toBe(35);
  });
});

// ─── momPct ─────────────────────────────────────────────────────────────

describe("momPct", () => {
  it("returns null when prev is null/undefined/0 (no baseline)", () => {
    expect(momPct(100, null)).toBeNull();
    expect(momPct(100, undefined)).toBeNull();
    expect(momPct(100, 0)).toBeNull();
  });

  it("returns 0 when curr === prev (no change)", () => {
    expect(momPct(100, 100)).toBe(0);
    expect(momPct(50.5, 50.5)).toBe(0);
  });

  it("returns positive % for increase", () => {
    expect(momPct(150, 100)).toBe(50);
    expect(momPct(110, 100)).toBe(10);
  });

  it("returns negative % for decrease (carbon reduction shows as negative)", () => {
    expect(momPct(50, 100)).toBe(-50);
    expect(momPct(90, 100)).toBe(-10);
  });

  it("returns the raw float — callers round at display time via fmt(…, 1)", () => {
    // UTILS-1: canonical shape is unrounded. fmt(12.3456, 1) renders "12.3".
    expect(momPct(112.3456, 100)).toBeCloseTo(12.3456, 4);
    // Not pre-rounded (the bug GLM caught in the original overview.ts copy)
    expect(momPct(112.3456, 100)).not.toBe(12.3);
  });

  it("handles fractional prev (sub-1 baselines)", () => {
    expect(momPct(2, 0.5)).toBe(300); // +300%
    expect(momPct(0.1, 0.009)).toBeCloseTo(1011.111, 2);
  });
});
