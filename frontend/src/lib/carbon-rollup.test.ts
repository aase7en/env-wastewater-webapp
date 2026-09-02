/**
 * ENV-WASTE-CARBON-001A — RED-first unit + static-SQL contract tests for the
 * carbon rollup data-honesty repair.
 *
 * Two layers, following the repo-established FUEL-CORE-001 / GARBAGE-CORE-001
 * pattern:
 *
 * 1. TypeScript shaping (fetchRollup), driven through a mocked supabase
 *    client with synthetic rows — the view can legitimately return
 *    kg_co2e = NULL (factor unavailable); the shaping layer must never
 *    collapse NULL into numeric zero (Number(null) === 0) inside scope
 *    totals or the grand total, and must expose explicit
 *    unavailable/known-subtotal semantics instead.
 *
 * 2. Rollup migration static contract: the additive ENV-WASTE-CARBON-001A
 *    migration must redefine carbon.v_unified_co2e so that (a) the
 *    electricity branch no longer COALESCEs a missing factor into 0 and
 *    filters NULL-activity rows like every other branch, (b) every branch
 *    selects at most ONE factor row via LATERAL latest-effective ordering
 *    (no join fan-out double counting when a newer factor appears), (c) a
 *    fuel row with litres but missing fuel_type gets an explicit
 *    fuel_unclassified label instead of a NULL source label, and (d) all
 *    GARBAGE-CORE-001 / FUEL-CORE-001 semantics and emission-factor data
 *    stay untouched.
 *
 * Mocking: carbon-rollup.ts imports ./supabase at top level, which throws at
 * import time without VITE_SUPABASE_URL/KEY — stubbed the same way
 * carbon.test.ts does. Fixtures are synthetic; no real REST call happens.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  gteArgs: [] as string[],
}));

vi.mock("./supabase", () => ({
  supabase: {
    from: (name: string) => {
      if (name !== "v_unified_co2e") throw new Error(`unexpected table ${name}`);
      return {
        select: () => ({
          gte: (_col: string, value: string) => {
            h.gteArgs.push(value);
            return { order: async () => ({ data: h.rows, error: null }) };
          },
        }),
      };
    },
  },
}));

import {
  EXPECTED_SOURCES,
  fetchRollup,
  useCarbonRollupRealtime,
  type RollupRow,
} from "./carbon-rollup";

/** Synthetic view row — mirrors what PostgREST returns for v_unified_co2e. */
function row(partial: Partial<RollupRow> & { source: string }): RollupRow {
  return {
    month: partial.month ?? "2026-08-01",
    scope: partial.scope ?? 2,
    // `?? 0` would coerce a deliberate NULL fixture into 0 — only default
    // when the key is absent entirely.
    kg_co2e: partial.kg_co2e === undefined ? 0 : partial.kg_co2e,
    row_count: partial.row_count ?? 1,
    source: partial.source,
  };
}

function setRows(rows: RollupRow[]) {
  // The mock hands whatever is here to fetchRollup; typed as the DB wire
  // shape, so NULL kg fixtures are legal inputs the view can produce.
  h.rows = rows as unknown as Array<Record<string, unknown>>;
}

beforeEach(() => {
  h.rows = [];
  h.gteArgs = [];
});

// ─── 1. fetchRollup shaping ───────────────────────────────────────────────

describe("carbon rollup shaping data honesty (ENV-WASTE-CARBON-001A)", () => {
  it("R1: valid rows aggregate into correct known totals and scope summaries", async () => {
    setRows([
      row({ scope: 2, source: "electricity", kg_co2e: 100.5, row_count: 31 }),
      row({ scope: 1, source: "diesel", kg_co2e: 50.25, row_count: 4 }),
      row({ scope: 1, source: "gasoline", kg_co2e: 8.91, row_count: 1 }),
    ]);
    const d = await fetchRollup();
    expect(d.grandTotalKg).toBe(159.66);
    const s1 = d.byScope.find((s) => s.scope === 1);
    const s2 = d.byScope.find((s) => s.scope === 2);
    expect(s1?.total_kg_co2e).toBe(59.16);
    expect(s1?.source_count).toBe(2);
    expect(s2?.total_kg_co2e).toBe(100.5);
    expect(s2?.source_count).toBe(1);
    expect(d.hasUnavailableContribution).toBe(false);
    expect(d.unavailableSources).toEqual([]);
  });

  it("R2: explicit zero kg with data is a legitimate zero, never flagged unavailable", async () => {
    setRows([
      row({ scope: 3, source: "waste_recyclable", kg_co2e: 0, row_count: 12 }),
    ]);
    const d = await fetchRollup();
    expect(d.byScope.find((s) => s.scope === 3)?.total_kg_co2e).toBe(0);
    expect(d.byScope.find((s) => s.scope === 3)?.has_data).toBe(true);
    expect(d.hasUnavailableContribution).toBe(false);
    expect(d.unavailableSources).toEqual([]);
    expect(d.incompleteSources).not.toContain("waste_recyclable");
  });

  it("R3/R17: NULL kg never becomes Number(null)=0 — excluded from totals, flagged unavailable", async () => {
    setRows([
      row({ scope: 2, source: "electricity", kg_co2e: 100, row_count: 31 }),
      row({ scope: 1, source: "lpg", kg_co2e: null, row_count: 2 }),
    ]);
    const d = await fetchRollup();
    // Known subtotal only — the NULL contribution is NOT silently zero.
    expect(d.grandTotalKg).toBe(100);
    expect(d.hasUnavailableContribution).toBe(true);
    expect(d.unavailableSources).toEqual(["lpg"]);
    const s1 = d.byScope.find((s) => s.scope === 1);
    expect(s1?.has_data).toBe(true);
    expect(s1?.has_unavailable).toBe(true);
    expect(s1?.total_kg_co2e).toBe(0); // known subtotal is zero, flag says why
  });

  it("R4/R9: no rows → all three scopes present with has_data false, no fabricated zeros", async () => {
    setRows([]);
    const d = await fetchRollup();
    expect(d.byScope.map((s) => s.scope)).toEqual([1, 2, 3]);
    for (const s of d.byScope) {
      expect(s.has_data).toBe(false);
      expect(s.total_kg_co2e).toBe(0);
      expect(s.source_count).toBe(0);
      expect(s.has_unavailable).toBe(false);
    }
    expect(d.grandTotalKg).toBe(0);
    expect(d.incompleteSources).toEqual(EXPECTED_SOURCES);
    expect(d.unavailableSources).toEqual([]);
    expect(d.hasUnavailableContribution).toBe(false);
  });

  it("R7: source with rows but all-NULL kg stays unavailable, not complete", async () => {
    setRows([
      row({ scope: 3, source: "waste_chemical", kg_co2e: null, row_count: 3 }),
      row({ scope: 3, source: "waste_general", kg_co2e: 52.4, row_count: 20 }),
    ]);
    const d = await fetchRollup();
    expect(d.unavailableSources).toEqual(["waste_chemical"]);
    expect(d.incompleteSources).not.toContain("waste_chemical");
    expect(d.incompleteSources).not.toContain("waste_general");
    expect(d.grandTotalKg).toBe(52.4);
  });

  it("R8: grand total with an unavailable contributor stays explicitly incomplete", async () => {
    setRows([
      row({ scope: 2, source: "electricity", kg_co2e: 200, row_count: 31 }),
      row({ scope: 3, source: "waste_unclassified", kg_co2e: null, row_count: 5 }),
    ]);
    const d = await fetchRollup();
    expect(d.grandTotalKg).toBe(200);
    expect(d.hasUnavailableContribution).toBe(true);
    expect(d.unavailableSources).toEqual(["waste_unclassified"]);
  });

  it("R10: duplicate rows in the same month aggregate correctly with deduped source_count", async () => {
    setRows([
      row({ month: "2026-08-01", scope: 1, source: "diesel", kg_co2e: 10.21, row_count: 1 }),
      row({ month: "2026-08-01", scope: 1, source: "diesel", kg_co2e: 10.21, row_count: 1 }),
      row({ month: "2026-07-01", scope: 1, source: "diesel", kg_co2e: 30.63, row_count: 3 }),
    ]);
    const d = await fetchRollup();
    expect(d.grandTotalKg).toBe(51.05);
    expect(d.byScope.find((s) => s.scope === 1)?.source_count).toBe(1);
  });

  it("R18: incompleteSources = expected-but-unseen only; unavailableSources = seen-but-NULL", async () => {
    setRows([
      row({ scope: 2, source: "electricity", kg_co2e: 80, row_count: 31 }),
    ]);
    const d = await fetchRollup();
    expect(d.incompleteSources).not.toContain("electricity");
    expect(d.incompleteSources).toContain("diesel");
    expect(d.incompleteSources).toContain("waste_general");
    expect(d.unavailableSources).toEqual([]);
  });

  it("negative kg values stay numeric (never reclassified as unavailable)", async () => {
    // A future correction/adjustment row could be negative; it is a KNOWN
    // value and must not be silently dropped or flagged.
    setRows([row({ scope: 2, source: "electricity", kg_co2e: -5.5, row_count: 1 })]);
    const d = await fetchRollup();
    expect(d.grandTotalKg).toBe(-5.5);
    expect(d.hasUnavailableContribution).toBe(false);
  });

  it("month cutoff is pinned to day 1 (CRB-2 month-boundary fix stays pinned)", async () => {
    await fetchRollup(12);
    expect(h.gteArgs).toHaveLength(1);
    expect(h.gteArgs[0]).toMatch(/^\d{4}-\d{2}-01$/);
  });
});

// ─── 2. realtime transport naming (R13/R14) ───────────────────────────────

describe("realtime hook transport semantics (ENV-WASTE-CARBON-001A)", () => {
  // Type contract (checked by `tsc -b`, which vitest does not run): the
  // realtime-aware hook must NOT expose a boolean named `live` — Supabase
  // subscription connectivity is TRANSPORT state, never live environmental
  // measurement. RED at activation base: the hook still returns `live`.
  type RealtimeResult = ReturnType<typeof useCarbonRollupRealtime>;
  type NoLiveFlag = RealtimeResult extends { live: unknown } ? never : true;
  const _noLiveFlag: NoLiveFlag = true;
  void _noLiveFlag;
  type HasRealtimeConnected = RealtimeResult extends { realtimeConnected: boolean } ? true : never;
  const _hasRealtimeConnected: HasRealtimeConnected = true;
  void _hasRealtimeConnected;

  it("type contract is compile-time only — runtime presence keeps vitest honest", () => {
    // The hook itself needs a React renderer to exercise; the exported
    // surface is pinned by the type assertions above (tsc RED→GREEN), the
    // same technique GARBAGE-CORE-001 used for the unwritable waste_type.
    expect(useCarbonRollupRealtime).toBeTypeOf("function");
  });
});

// ─── 3. rollup migration static contract ──────────────────────────────────

describe("carbon rollup migration contract (ENV-WASTE-CARBON-001A)", () => {
  const migrationsDir = join(__dirname, "..", "..", "..", "supabase", "migrations");
  const fileName = readdirSync(migrationsDir).find((f) =>
    /waste[_-]carbon[_-]core[_-]001a/i.test(f),
  );
  // Contract applies to EXECUTABLE SQL: strip `--` comments first so the
  // migration's defect-documentation prose cannot mask or trip assertions.
  const sql = fileName
    ? readFileSync(join(migrationsDir, fileName), "utf-8")
        .replace(/--[^\n]*/g, " ")
        .replace(/\s+/g, " ")
    : null;

  it("additive hardening migration exists", () => {
    expect(fileName, `no *waste-carbon-core-001a* file under ${migrationsDir}`).toBeTruthy();
  });

  it("redefines carbon.v_unified_co2e idempotently", () => {
    expect(sql).toContain("CREATE OR REPLACE VIEW carbon.v_unified_co2e");
  });

  it("S2: electricity branch never COALESCEs a missing factor into zero", () => {
    expect(sql).not.toContain("COALESCE(SUM(r.consumption) * ef.kg_co2e, 0)");
    expect(sql).toContain("COALESCE(SUM(r.consumption), 0) * ef.kg_co2e");
  });

  it("S2: electricity branch excludes NULL-activity rows like every other branch", () => {
    expect(sql).toContain("WHERE r.consumption IS NOT NULL");
  });

  it("S3: every branch selects exactly one latest-effective factor (no fan-out)", () => {
    expect(sql ? (sql.match(/LEFT JOIN LATERAL/g) ?? []).length : 0).toBe(5);
    expect(sql ? (sql.match(/ORDER BY ef0.effective_from DESC LIMIT 1/g) ?? []).length : 0).toBe(5);
  });

  it("S4: fuel rows with missing fuel_type get an explicit unclassified label", () => {
    expect(sql).toContain("COALESCE(d.fuel_type, 'fuel_unclassified')");
    expect(sql).not.toContain("d.fuel_type::text AS source");
  });

  it("S5: waste branch keeps canonical segregation_type semantics (GARBAGE-CORE-001)", () => {
    expect(sql).toContain("CASE c.segregation_type");
    expect(sql).not.toContain("CASE c.waste_type");
    expect(sql).toContain("COALESCE(c.segregation_type, 'unclassified')");
  });

  it("S7: fuel factor join stays enum-side-to-text (FUEL-CORE-001)", () => {
    expect(sql).toContain("ef0.source::text = d.fuel_type");
    expect(sql).not.toContain("d.fuel_type::carbon.source_type");
  });

  it("S6: no data or factor mutation of any kind", () => {
    expect(sql).not.toContain("INSERT INTO");
    expect(sql).not.toMatch(/\bUPDATE\b/);
    expect(sql).not.toContain("DELETE FROM");
    expect(sql).not.toContain("ALTER TABLE");
  });
});
