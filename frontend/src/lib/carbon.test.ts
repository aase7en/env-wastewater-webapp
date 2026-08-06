/**
 * OPT-HYGIENE (2026-08-07): unit tests for carbon.ts pure helpers.
 *
 * Coverage (initial):
 *   - prevCalendarMonth — the C3 MoM-gap fix. The previous code used
 *     `sortedMonths[i-1]` for month-over-month, which silently skipped over
 *     months that had no readings (Feb gap → Mar compared to Jan instead of
 *     showing "no prior data"). prevCalendarMonth always answers the true
 *     calendar previous month, so a gap yields `null` (no baseline) rather
 *     than a misleading delta. These tests pin that contract.
 *
 * Mocking: carbon.ts imports `./supabase` at the top level, and that module
 * throws at import time if VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY are unset.
 * Vitest doesn't provide those, so we stub the client the same way
 * ai-chat.test.ts does. prevCalendarMonth itself never touches supabase —
 * the mock only exists to let the module load.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("./supabase", () => ({
  // Minimal stub — prevCalendarMonth doesn't use any of this; it only needs
  // carbon.ts to import successfully.
  supabase: {
    from: vi.fn(() => ({
      select: () => ({
        order: () => ({ gte: async () => ({ data: [], error: null }) }),
      }),
    })),
  },
}));

import { prevCalendarMonth } from "./carbon";

// ─── prevCalendarMonth ───────────────────────────────────────────────────

describe("prevCalendarMonth", () => {
  it("returns the previous calendar month in the same year", () => {
    expect(prevCalendarMonth("2026-03")).toBe("2026-02");
    expect(prevCalendarMonth("2026-07")).toBe("2026-06");
    expect(prevCalendarMonth("2026-12")).toBe("2026-11");
  });

  it("rolls over January to December of the previous year", () => {
    // The C3 edge case. The pre-fix `sortedMonths[i-1]` lookup didn't care
    // about the calendar boundary — but prevCalendarMonth must.
    expect(prevCalendarMonth("2026-01")).toBe("2025-12");
    expect(prevCalendarMonth("2025-01")).toBe("2024-12");
    expect(prevCalendarMonth("2024-01")).toBe("2023-12");
  });

  it("zero-pads single-digit months in the output", () => {
    // Feb–Sep render as 02–09, not 2–9. Without padding the key wouldn't
    // match the YYYY-MM format of the byMonth map → MoM would always be null.
    expect(prevCalendarMonth("2026-03")).toBe("2026-02");
    expect(prevCalendarMonth("2026-11")).toBe("2026-10");
    expect(prevCalendarMonth("2026-02")).toBe("2026-01");
  });

  it("handles the month key whose own previous month is single-digit", () => {
    // October → September: 10 → 09. Guards the inverse padding direction.
    expect(prevCalendarMonth("2026-10")).toBe("2026-09");
  });

  it("is NOT idempotent — going back twice skips a month (guards against accidental truncation)", () => {
    // If someone "optimized" prevCalendarMonth to just decrement the MM
    // suffix without rebuilding the date, two calls would land on the same
    // month. The real implementation returns to two months prior.
    expect(prevCalendarMonth(prevCalendarMonth("2026-03"))).toBe("2026-01");
    expect(prevCalendarMonth(prevCalendarMonth("2026-01"))).toBe("2025-11");
  });

  it("round-trips the format: output is always parseable as input", () => {
    // The byMonth map is keyed YYYY-MM; the lookup only works if prevCalendarMonth
    // returns the exact same shape. Asserting via re-parsing.
    const cases = ["2026-01", "2026-06", "2026-12", "2025-02", "2024-11"];
    for (const c of cases) {
      const out = prevCalendarMonth(c);
      expect(out).toMatch(/^\d{4}-\d{2}$/);
      expect(out.length).toBe(7);
    }
  });
});
