/**
 * AISQL-phi-filter (2026-07-21) — unit tests for the pure helpers extracted
 * from buildSchemaContext(). The async parts (loadPhiDenySet, buildSchemaContext)
 * touch the supabase client and are covered by integration/manual smoke; the
 * pure filter + format logic is what these tests lock down.
 */
import { describe, it, expect } from "vitest";
import { filterPhiTables, formatSchemaContext, STATIC_PHI_DENY } from "./ai-sql";

describe("filterPhiTables", () => {
  it("drops tables present in the deny-set (exact schema.table match)", () => {
    const tables = ["wastewater.reading", "core.app_user", "core.personnel", "carbon.reading"];
    const deny = new Set(["core.app_user", "core.personnel"]);
    expect(filterPhiTables(tables, deny)).toEqual(["wastewater.reading", "carbon.reading"]);
  });

  it("passes everything through when the deny-set is empty", () => {
    const tables = ["a.b", "c.d"];
    expect(filterPhiTables(tables, new Set())).toEqual(["a.b", "c.d"]);
  });

  it("STATIC_PHI_DENY (fail-closed fallback) hides both people-tables", () => {
    // REVIEW-9: when core.ai_scope is unreadable, loadPhiDenySet falls back
    // to this set — an ai_scope outage must never widen provider visibility.
    const tables = ["wastewater.reading", "core.app_user", "core.personnel"];
    expect(filterPhiTables(tables, STATIC_PHI_DENY)).toEqual(["wastewater.reading"]);
    expect(STATIC_PHI_DENY.has("core.app_user")).toBe(true);
    expect(STATIC_PHI_DENY.has("core.personnel")).toBe(true);
  });

  it("returns a new array — does not mutate the input", () => {
    const input = ["x.y", "z.w"];
    const out = filterPhiTables(input, new Set(["x.y"]));
    expect(out).toEqual(["z.w"]);
    expect(input).toEqual(["x.y", "z.w"]); // untouched
  });

  it("is exact-match only — partial substring does not match", () => {
    const tables = ["core.app_user", "core.app_user_log"];
    const deny = new Set(["core.app_user"]);
    // The log table name contains "core.app_user" as a substring but is
    // a distinct table — it must pass through.
    expect(filterPhiTables(tables, deny)).toEqual(["core.app_user_log"]);
  });

  it("handles empty input", () => {
    expect(filterPhiTables([], new Set(["a.b"]))).toEqual([]);
  });
});

describe("formatSchemaContext", () => {
  it("renders the historical 'Tables (approx row counts):' header + one line per table", () => {
    const out = formatSchemaContext([
      { table: "wastewater.reading", count: 907 },
      { table: "carbon.reading", count: 907 },
    ]);
    expect(out).toBe(
      "Tables (approx row counts):\n" +
      "wastewater.reading: ~907 rows\n" +
      "carbon.reading: ~907 rows",
    );
  });

  it("renders count=null as '~0 rows' (matches the historical ?? 0 behaviour)", () => {
    const out = formatSchemaContext([{ table: "core.personnel", count: null }]);
    expect(out).toContain("core.personnel: ~0 rows");
  });

  it("renders count=0 literally (not '0 rows' missing)", () => {
    const out = formatSchemaContext([{ table: "core.equipment", count: 0 }]);
    expect(out).toContain("core.equipment: ~0 rows");
  });

  it("renders an empty list as just the header", () => {
    expect(formatSchemaContext([])).toBe("Tables (approx row counts):\n");
  });
});
