/**
 * FOOD-CORE-001 — canonical food categorical honesty.
 *
 * Contracts under test:
 *
 * 1. Import adapter: missing/blank `sample_type` and `test_type` stay
 *    `null` (never fabricated into น้ำประปา/total_coliform); only the
 *    canonical value sets pass (5 Thai sample types, 3 English test types
 *    mirroring the DB CHECK and the FoodPage selects); the ONLY verified
 *    synonyms are the A-Wiki food-entity display labels for the three
 *    test types; any other non-empty token fails the row through the
 *    adapter's throw-based row-error path before any REST write.
 *
 * 2. Migration static contract: the additive FOOD-CORE-001 migration adds
 *    idempotent canonical CHECK constraints on `food.lab_test.sample_type`
 *    and `.test_type` with exactly the adapter's value sets, alters no
 *    other table, mutates no data, and leaves the reagent decrement
 *    trigger/function untouched (reagent dormancy is preserved).
 *
 * 3. Type contract (checked by `tsc -b`, which vitest does not run):
 *    `FoodInput` must not expose `reagent_used` — the cross-domain
 *    chemical.movement decrement path stays dormant at the write-type
 *    level until a separate evidence-backed scope decision re-opens it.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { foodAdapter } from "./food";
import type { FoodInput } from "../food";

const VALID_DATE = "2026-01-01"; // synthetic test-only value

function mapRow(raw: Record<string, unknown>) {
  return foodAdapter.mapRow({ sample_date: VALID_DATE, ...raw }, 0);
}

// FOOD-CORE-001 type contract: `reagent_used` must not be writable.
// RED at activation base: FoodInput still includes reagent_used, so tsc
// fails here. GREEN after the Omit fix in lib/food.ts.
type ReagentUsedNotWritable = FoodInput extends { reagent_used: unknown } ? never : true;
const _reagentUsedNotWritable: ReagentUsedNotWritable = true;
void _reagentUsedNotWritable;

describe("food adapter categorical honesty (FOOD-CORE-001)", () => {
  it("missing sample_type stays null — never fabricated into น้ำประปา", () => {
    expect(mapRow({}).sample_type).toBeNull();
  });

  it("blank sample_type variants stay null", () => {
    expect(mapRow({ sample_type: "" }).sample_type).toBeNull();
    expect(mapRow({ sample_type: "   " }).sample_type).toBeNull();
  });

  it("missing test_type stays null — never fabricated into total_coliform", () => {
    expect(mapRow({}).test_type).toBeNull();
  });

  it("blank test_type variants stay null", () => {
    expect(mapRow({ test_type: "" }).test_type).toBeNull();
    expect(mapRow({ test_type: "   " }).test_type).toBeNull();
  });

  it("canonical Thai sample types are accepted as-is", () => {
    for (const t of ["น้ำประปา", "น้ำบาดาล", "อาหาร", "ผัก", "น้ำแข็ง"]) {
      expect(mapRow({ sample_type: t }).sample_type).toBe(t);
    }
  });

  it("whitespace-wrapped canonical sample types trim to canonical form", () => {
    expect(mapRow({ sample_type: " น้ำประปา " }).sample_type).toBe("น้ำประปา");
    expect(mapRow({ sample_type: "\tน้ำแข็ง\n" }).sample_type).toBe("น้ำแข็ง");
  });

  it("canonical English test types are accepted as-is", () => {
    for (const t of ["total_coliform", "e_coli", "fecal_coliform"]) {
      expect(mapRow({ test_type: t }).test_type).toBe(t);
    }
  });

  it("case/whitespace-equivalent test-type tokens normalize to canonical form", () => {
    expect(mapRow({ test_type: " Total Coliform " }).test_type).toBe("total_coliform");
    expect(mapRow({ test_type: "TOTAL_COLIFORM" }).test_type).toBe("total_coliform");
    expect(mapRow({ test_type: "Fecal Coliform" }).test_type).toBe("fecal_coliform");
    expect(mapRow({ test_type: "E_COLI" }).test_type).toBe("e_coli");
  });

  it("verified A-Wiki display labels map to canonical test types", () => {
    expect(mapRow({ test_type: "Total coliform" }).test_type).toBe("total_coliform");
    expect(mapRow({ test_type: "E. coli" }).test_type).toBe("e_coli");
    expect(mapRow({ test_type: "Fecal coliform" }).test_type).toBe("fecal_coliform");
  });

  it("unsupported non-empty sample_type tokens fail the row before any write", () => {
    for (const bad of ["หนอนในน้ำ", "tap water", "นม", "air"]) {
      expect(() => mapRow({ sample_type: bad }), `token: ${bad}`).toThrowError(
        /ประเภทตัวอย่างไม่รองรับ/,
      );
    }
  });

  it("unsupported non-empty test_type tokens fail the row before any write", () => {
    for (const bad of ["salmonella", "coliform_total", "e-coli", "ph"]) {
      expect(() => mapRow({ test_type: bad }), `token: ${bad}`).toThrowError(
        /การทดสอบไม่รองรับ/,
      );
    }
  });

  it("adapter never writes reagent_used (reagent decrement stays dormant)", () => {
    const row = mapRow({ sample_type: "น้ำประปา", test_type: "total_coliform" }) as Record<
      string,
      unknown
    >;
    expect(row).not.toHaveProperty("reagent_used");
  });

  it("invalid sample_date still fails the row (existing required-date contract)", () => {
    expect(() => foodAdapter.mapRow({ sample_date: "not-a-date" }, 0)).toThrowError(
      /วันที่ไม่ถูกต้อง/,
    );
  });
});

describe("food categorical migration contract (FOOD-CORE-001)", () => {
  // __dirname = <repo>/frontend/src/lib/import-adapters → repo root is 4 up.
  const migrationsDir = join(__dirname, "..", "..", "..", "..", "supabase", "migrations");
  const fileName = readdirSync(migrationsDir).find((f) => /food[_-]core[_-]001/i.test(f));
  // Contract applies to EXECUTABLE SQL: strip `--` comments first.
  const sql = fileName
    ? readFileSync(join(migrationsDir, fileName), "utf-8")
        .replace(/--[^\n]*/g, " ")
        .replace(/\s+/g, " ")
    : null;

  it("additive hardening migration exists", () => {
    expect(fileName, `no *food-core-001* file under ${migrationsDir}`).toBeTruthy();
  });

  it("adds an idempotent canonical CHECK constraint on sample_type", () => {
    expect(sql).toContain("ALTER TABLE food.lab_test");
    expect(sql).toContain("DROP CONSTRAINT IF EXISTS lab_test_sample_type_check");
    expect(sql).toContain("ADD CONSTRAINT lab_test_sample_type_check");
    expect(sql).toContain(
      "CHECK (sample_type IS NULL OR sample_type IN ('น้ำประปา','น้ำบาดาล','อาหาร','ผัก','น้ำแข็ง'))",
    );
  });

  it("adds an idempotent canonical CHECK constraint on test_type", () => {
    expect(sql).toContain("DROP CONSTRAINT IF EXISTS lab_test_test_type_check");
    expect(sql).toContain("ADD CONSTRAINT lab_test_test_type_check");
    expect(sql).toContain(
      "CHECK (test_type IS NULL OR test_type IN ('total_coliform','e_coli','fecal_coliform'))",
    );
  });

  it("alters no table other than food.lab_test (DROP+ADD constraint pairs)", () => {
    expect(sql?.match(/ALTER TABLE food\.lab_test /g)?.length).toBe(4);
    expect(sql?.match(/ALTER TABLE (?!food\.lab_test )/g)).toBeNull();
  });

  it("leaves the reagent decrement trigger/function untouched (dormancy preserved)", () => {
    expect(sql, "migration SQL missing").toBeTruthy();
    expect(sql).not.toMatch(/\bTRIGGER\b/i);
    expect(sql).not.toContain("fn_decrement_reagent");
    expect(sql).not.toContain("chemical.movement");
    expect(sql).not.toContain("chemical.master");
  });

  it("does not mutate application data", () => {
    expect(sql, "migration SQL missing").toBeTruthy();
    expect(sql).not.toMatch(/\bINSERT\s+INTO\b/i);
    expect(sql).not.toMatch(/\bUPDATE\b/i);
    expect(sql).not.toMatch(/\bDELETE\b/i);
  });
});
