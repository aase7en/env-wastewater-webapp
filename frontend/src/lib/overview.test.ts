/**
 * WO-STAB-007 — overview MoM must be calendar-previous, not index-previous.
 *
 * Bug (P1 #7, reports/code-review-2026-08-12.md): toCarbonMonths compared
 * each month to `rows[i+1]` — the previous ROW, not the previous calendar
 * month. With a data gap (e.g. data exists for Jan and Mar but not Feb),
 * March's MoM% silently compared against January, mislabeling the delta as
 * "vs last month". carbon.ts had already fixed this exact class (C3) via
 * prevCalendarMonth; overview.ts regressed the same shape.
 */
import { describe, it, expect } from "vitest";
import { toCarbonMonths } from "./overview";

const row = (month: string, tco2e: number) => ({ month, days: 20, kwh_total: tco2e / 0.4999, tco2e });

describe("toCarbonMonths — calendar-previous MoM (WO-STAB-007)", () => {
  it("consecutive months: normal delta", () => {
    const out = toCarbonMonths([row("2026-03", 110), row("2026-02", 100)]);
    expect(out[0]!.mom_change_pct).toBe(10);
    expect(out[1]!.mom_change_pct).toBeNull(); // oldest = no baseline
  });

  it("month GAP: MoM must be null, not a delta against an older month", () => {
    const out = toCarbonMonths([row("2026-03", 110), row("2026-01", 100)]);
    // Feb missing → March has NO calendar-previous baseline → null.
    // (Index-previous bug computed +10% against January here.)
    expect(out[0]!.mom_change_pct).toBeNull();
  });

  it("year-boundary gap (Jan vs last Dec) also null when Dec missing", () => {
    const out = toCarbonMonths([row("2026-01", 120), row("2025-11", 100)]);
    expect(out[0]!.mom_change_pct).toBeNull();
  });

  it("year-boundary consecutive: Jan vs present Dec computes normally", () => {
    const out = toCarbonMonths([row("2026-01", 110), row("2025-12", 100)]);
    expect(out[0]!.mom_change_pct).toBe(10);
  });
});
