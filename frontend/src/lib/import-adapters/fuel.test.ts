/**
 * FUEL-CORE-001 — fuel_type data honesty + carbon rollup safety.
 *
 * Two contracts under test:
 *
 * 1. Import adapter: missing/blank imported fuel type must stay `null`
 *    (never fabricated into `diesel`/`other`); only the four canonical
 *    enum-compatible values are accepted; whitespace/case-equivalent
 *    tokens normalize to the canonical form; any other non-empty token
 *    fails the row through the adapter's throw-based row-error path
 *    BEFORE any REST write.
 *
 * 2. Rollup migration static contract: the additive hardening migration
 *    must redefine carbon.v_unified_co2e so the fuel branch never casts
 *    free-text d.fuel_type into carbon.source_type (enum-side-to-text
 *    comparison instead — an unknown legacy value simply matches no
 *    factor), while every other UNION branch and all factor semantics
 *    stay byte-for-byte equivalent, and no emission-factor data changes.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fuelAdapter } from "./fuel";

const VALID_DATE = "2026-01-01"; // synthetic test-only value

function mapRow(raw: Record<string, unknown>) {
  return fuelAdapter.mapRow({ log_date: VALID_DATE, ...raw }, 0);
}

describe("fuel adapter fuel_type data honesty (FUEL-CORE-001)", () => {
  it("missing fuel_type stays null — never fabricated into diesel", () => {
    expect(mapRow({}).fuel_type).toBeNull();
  });

  it("blank fuel_type variants stay null", () => {
    expect(mapRow({ fuel_type: "" }).fuel_type).toBeNull();
    expect(mapRow({ fuel_type: "   " }).fuel_type).toBeNull();
  });

  it("canonical values are accepted as-is", () => {
    for (const t of ["diesel", "gasoline", "lpg", "other"]) {
      expect(mapRow({ fuel_type: t }).fuel_type).toBe(t);
    }
  });

  it("whitespace/case-equivalent canonical tokens normalize to canonical form", () => {
    expect(mapRow({ fuel_type: " DIESEL " }).fuel_type).toBe("diesel");
    expect(mapRow({ fuel_type: "Gasoline" }).fuel_type).toBe("gasoline");
    expect(mapRow({ fuel_type: "LPG" }).fuel_type).toBe("lpg");
    expect(mapRow({ fuel_type: "Other" }).fuel_type).toBe("other");
  });

  it("unsupported non-empty tokens fail the row before any write", () => {
    for (const bad of ["biodiesel", "ดีเซล", "dieselx", "91"]) {
      expect(() => mapRow({ fuel_type: bad }), `token: ${bad}`).toThrowError(
        /ประเภทน้ำมันไม่รองรับ/,
      );
    }
  });
});

describe("fuel rollup migration contract (FUEL-CORE-001)", () => {
  // __dirname = <repo>/frontend/src/lib/import-adapters → repo root is 4 up.
  const migrationsDir = join(__dirname, "..", "..", "..", "..", "supabase", "migrations");
  const fileName = readdirSync(migrationsDir).find((f) =>
    /fuel[_-]core[_-]001/i.test(f),
  );
  // Contract applies to EXECUTABLE SQL: strip `--` comments first so the
  // migration's defect-documentation prose cannot mask or trip assertions.
  const sql = fileName
    ? readFileSync(join(migrationsDir, fileName), "utf-8")
        .replace(/--[^\n]*/g, " ")
        .replace(/\s+/g, " ")
    : null;

  it("additive hardening migration exists", () => {
    expect(fileName, `no *fuel-core-001* file under ${migrationsDir}`).toBeTruthy();
  });

  it("redefines carbon.v_unified_co2e idempotently", () => {
    expect(sql).toContain("CREATE OR REPLACE VIEW carbon.v_unified_co2e");
  });

  it("contains no free-text fuel_type → carbon.source_type cast", () => {
    expect(sql).not.toContain("d.fuel_type::carbon.source_type");
  });

  it("joins the enum side cast to text so unknown values simply match no factor", () => {
    expect(sql).toContain("ef.source::text = d.fuel_type");
  });

  it("preserves every other UNION branch and its factor semantics", () => {
    expect(sql).toContain("'electricity'");
    expect(sql).toContain("ef.unit = 'kWh'");
    expect(sql).toContain("'garden_fuel'");
    expect(sql).toContain("ON ef.source = 'gasoline'");
    expect(sql).toContain("ON ef.source = 'other'");
    expect(sql).toContain("'kg (infectious_waste)'");
    expect(sql).toContain("'kg (recyclable)'");
    expect(sql).toContain("'kg (general_waste)'");
    expect(sql).toContain("'kg (chlorine)'");
    expect(sql).toContain("m.direction = 'out'");
    // 5 SELECT branches require 4 UNION ALL separators.
    expect(sql?.split("UNION ALL").length).toBe(5);
  });

  it("does not modify emission-factor data or any table data", () => {
    expect(sql).not.toMatch(/\bINSERT\s+INTO\s+carbon\.emission_factor\b/i);
    expect(sql).not.toMatch(/\b(UPDATE|DELETE\s+FROM|ALTER\s+TABLE)\b/i);
  });
});
