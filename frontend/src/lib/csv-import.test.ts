import { describe, it, expect, vi } from "vitest";
import {
  parseReadingCsv,
  csvTemplate,
  bulkInsertReadings,
  READING_CSV_COLUMNS,
  type ParsedRow,
} from "./csv-import";

/**
 * TEST-3: unit tests for the CSV bulk-import path (admin feature).
 *
 * Three pure-ish functions:
 *   - parseReadingCsv(text):  header-driven parser + coercion + validation
 *   - csvTemplate():          blank template generator
 *   - bulkInsertReadings():   batched insert driver (supabase fn is injected,
 *                             so we mock it — no network)
 *
 * Coverage focus:
 *   - Header parsing: known/unknown columns, missing required, any order
 *   - Coercion: empty → null, "true"/"false"/"1"/"0"/"yes"/"no" → bool,
 *     numeric strings → number, free text passthrough
 *   - CSV format: quoted fields with embedded commas, escaped "", CRLF/LF
 *   - Validation: required reading_date + YYYY-MM-DD format
 *   - Edge: empty input, header-only, trailing blank line
 *   - bulkInsertReadings: valid/invalid split, batched at 100, error surfacing
 */

const VALID_HEADER = READING_CSV_COLUMNS.join(",");

// ─── csvTemplate ────────────────────────────────────────────────────────

describe("csvTemplate", () => {
  it("emits the header row + one blank row of the same column count", () => {
    const t = csvTemplate();
    const lines = t.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(VALID_HEADER);
    // Blank row = N-1 commas (N empty cells).
    expect(lines[1]).toBe(",".repeat(READING_CSV_COLUMNS.length - 1));
  });

  it("header column count matches READING_CSV_COLUMNS", () => {
    const t = csvTemplate();
    const headerCells = t.split("\n")[0].split(",");
    expect(headerCells).toHaveLength(READING_CSV_COLUMNS.length);
    for (let i = 0; i < READING_CSV_COLUMNS.length; i++) {
      expect(headerCells[i]).toBe(READING_CSV_COLUMNS[i]);
    }
  });
});

// ─── parseReadingCsv — empty / minimal ──────────────────────────────────

describe("parseReadingCsv — empty / minimal cases", () => {
  it("returns fatal 'ไฟล์ว่าง' on empty string", () => {
    const r = parseReadingCsv("");
    expect(r.rows).toEqual([]);
    expect(r.fatalErrors).toEqual(["ไฟล์ว่าง"]);
    expect(r.totalLines).toBe(0);
  });

  it("returns fatal 'ไฟล์ว่าง' on whitespace-only string", () => {
    const r = parseReadingCsv("   \n\n  ");
    // The filter strips the trailing-blank line; after that we still have
    // whitespace lines that aren't truly empty. Either way: no usable header.
    expect(r.fatalErrors.length).toBeGreaterThan(0);
  });

  it("returns 0 rows on header-only input (no data lines)", () => {
    const r = parseReadingCsv(VALID_HEADER);
    expect(r.rows).toEqual([]);
    expect(r.fatalErrors).toEqual([]);
    expect(r.totalLines).toBe(0);
  });

  it("parses a single valid row", () => {
    const r = parseReadingCsv(`${VALID_HEADER}\n2026-07-20${",".repeat(READING_CSV_COLUMNS.length - 1)}`);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].values.reading_date).toBe("2026-07-20");
    expect(r.rows[0].errors).toEqual([]);
  });
});

// ─── parseReadingCsv — header validation ────────────────────────────────

describe("parseReadingCsv — header validation", () => {
  it("fatal error when required column 'reading_date' is missing", () => {
    // Strip reading_date from the header.
    const header = READING_CSV_COLUMNS.filter((c) => c !== "reading_date").join(",");
    const r = parseReadingCsv(`${header}\n`);
    expect(r.fatalErrors.length).toBe(1);
    expect(r.fatalErrors[0]).toContain("reading_date");
    expect(r.rows).toEqual([]);
  });

  it("unknown columns are ignored (warning, not fatal)", () => {
    const r = parseReadingCsv(`${VALID_HEADER},extra_col,another_one\n2026-07-20,${",".repeat(READING_CSV_COLUMNS.length - 1)}value1,value2`);
    expect(r.fatalErrors).toEqual([]);
    expect(r.rows).toHaveLength(1);
    // Unknown columns should not appear in values.
    expect("extra_col" in r.rows[0].values).toBe(false);
    expect("another_one" in r.rows[0].values).toBe(false);
  });

  it("columns can be in any order", () => {
    // Reverse the header — parser should still map correctly.
    const reversed = [...READING_CSV_COLUMNS].reverse().join(",");
    const cells = [...READING_CSV_COLUMNS].reverse();
    const dateIdx = cells.indexOf("reading_date");
    const cellsAfter = cells.map((_, i) => (i === dateIdx ? "2026-07-20" : "")).join(",");
    const r = parseReadingCsv(`${reversed}\n${cellsAfter}`);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].values.reading_date).toBe("2026-07-20");
  });

  it("header cells are trimmed (extra whitespace tolerated)", () => {
    const padded = READING_CSV_COLUMNS.map((c) => ` ${c} `).join(",");
    const r = parseReadingCsv(`${padded}\n2026-07-20${",".repeat(READING_CSV_COLUMNS.length - 1)}`);
    expect(r.fatalErrors).toEqual([]);
    expect(r.rows[0].values.reading_date).toBe("2026-07-20");
  });
});

// ─── parseReadingCsv — coercion ─────────────────────────────────────────

describe("parseReadingCsv — type coercion", () => {
  function parseOneRow(cellsByCol: Partial<Record<string, string>>) {
    const cells = READING_CSV_COLUMNS.map((c) => cellsByCol[c] ?? "");
    return parseReadingCsv(`${VALID_HEADER}\n${cells.join(",")}`).rows[0];
  }

  it("empty cells coerce to null", () => {
    const r = parseOneRow({ reading_date: "2026-07-20" });
    // Every non-date column is empty → null.
    for (const col of READING_CSV_COLUMNS) {
      if (col === "reading_date") continue;
      expect(r.values[col]).toBeNull();
    }
  });

  it("boolean columns accept true/false/1/0/yes/no/t/f (case-insensitive)", () => {
    const cases: Array<[string, boolean]> = [
      ["true", true], ["TRUE", true], ["T", true], ["1", true], ["yes", true], ["Y", true],
      ["false", false], ["F", false], ["0", false], ["no", false], ["N", false],
    ];
    for (const [raw, expected] of cases) {
      const r = parseOneRow({ reading_date: "2026-07-20", system_operating: raw });
      expect(r.values.system_operating, `raw='${raw}'`).toBe(expected);
    }
  });

  it("unrecognized boolean value coerces to null (not error)", () => {
    const r = parseOneRow({ reading_date: "2026-07-20", system_operating: "maybe" });
    expect(r.values.system_operating).toBeNull();
  });

  it("numeric columns parse to numbers", () => {
    const r = parseOneRow({
      reading_date: "2026-07-20",
      ph: "7.2",
      free_chlorine: "0.85",
      pump1_meter: "12345",
    });
    expect(r.values.ph).toBe(7.2);
    expect(r.values.free_chlorine).toBe(0.85);
    expect(r.values.pump1_meter).toBe(12345);
  });

  it("non-numeric value in numeric column coerces to null", () => {
    const r = parseOneRow({ reading_date: "2026-07-20", ph: "abc" });
    expect(r.values.ph).toBeNull();
  });

  it("free-text columns pass through as trimmed string", () => {
    const r = parseOneRow({
      reading_date: "2026-07-20",
      color_desc: "  light brown  ",
      note: "routine day",
      legacy_id: "ROW-001",
    });
    expect(r.values.color_desc).toBe("light brown");
    expect(r.values.note).toBe("routine day");
    expect(r.values.legacy_id).toBe("ROW-001");
  });
});

// ─── parseReadingCsv — CSV format quirks ────────────────────────────────

describe("parseReadingCsv — CSV format edge cases", () => {
  it("handles quoted fields with embedded commas", () => {
    // note = "a, b, c" — must survive the comma split.
    const cells = READING_CSV_COLUMNS.map((c) =>
      c === "note" ? '"a, b, c"' : c === "reading_date" ? "2026-07-20" : "",
    );
    const r = parseReadingCsv(`${VALID_HEADER}\n${cells.join(",")}`);
    expect(r.rows[0].values.note).toBe("a, b, c");
  });

  it("handles escaped double quotes inside quoted field", () => {
    // CSV escapes " as "" inside a quoted field. So the field value
    // `say "hi"` must be sent in the CSV as `"say ""hi"""`.
    const cells = READING_CSV_COLUMNS.map((c) =>
      c === "note" ? '"say ""hi"""' : c === "reading_date" ? "2026-07-20" : "",
    );
    const r = parseReadingCsv(`${VALID_HEADER}\n${cells.join(",")}`);
    expect(r.rows[0].values.note).toBe('say "hi"');
  });

  it("normalizes CRLF line endings", () => {
    const text = `${VALID_HEADER}\r\n2026-07-20${",".repeat(READING_CSV_COLUMNS.length - 1)}\r\n`;
    const r = parseReadingCsv(text);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].values.reading_date).toBe("2026-07-20");
  });

  it("normalizes lone CR line endings", () => {
    const text = `${VALID_HEADER}\r2026-07-20${",".repeat(READING_CSV_COLUMNS.length - 1)}\r`;
    const r = parseReadingCsv(text);
    expect(r.rows).toHaveLength(1);
  });

  it("drops a single trailing blank line (but not multiple)", () => {
    // Production behavior: parseReadingCsv filters only the LAST line if it's
    // blank. A trailing `\n\n` produces: [row, ""] → filter drops the trailing
    // "" → leaves [row]. A `\n\n\n` produces [row, "", ""] → filter drops only
    // the final "" → leaves [row, ""] → second "row" is parsed as all-empty
    // cells (which then fails reading_date validation, not silently dropped).
    const text = `${VALID_HEADER}\n2026-07-20${",".repeat(READING_CSV_COLUMNS.length - 1)}\n`;
    const r = parseReadingCsv(text);
    expect(r.rows).toHaveLength(1);
    // With an extra trailing newline, the second "row" is all-blank cells and
    // gets flagged for missing reading_date (validation error, not dropped).
    const textWithExtraBlank = `${VALID_HEADER}\n2026-07-20${",".repeat(READING_CSV_COLUMNS.length - 1)}\n\n`;
    const r2 = parseReadingCsv(textWithExtraBlank);
    expect(r2.rows).toHaveLength(2);
    expect(r2.rows[1].errors).toContain("reading_date ว่าง");
  });
});

// ─── parseReadingCsv — row-level validation ─────────────────────────────

describe("parseReadingCsv — row validation", () => {
  it("flags missing reading_date per row (not fatal)", () => {
    const r = parseReadingCsv(`${VALID_HEADER}\n${",".repeat(READING_CSV_COLUMNS.length - 1)}`);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].errors).toContain("reading_date ว่าง");
  });

  it("flags malformed reading_date (not YYYY-MM-DD)", () => {
    const cells = READING_CSV_COLUMNS.map((c) => (c === "reading_date" ? "20/07/2026" : ""));
    const r = parseReadingCsv(`${VALID_HEADER}\n${cells.join(",")}`);
    expect(r.rows[0].errors.length).toBe(1);
    expect(r.rows[0].errors[0]).toContain("YYYY-MM-DD");
  });

  it("lineNumber is 1-based (excluding header)", () => {
    const dataRow = () => `2026-07-20${",".repeat(READING_CSV_COLUMNS.length - 1)}`;
    const r = parseReadingCsv(`${VALID_HEADER}\n${dataRow()}\n${dataRow()}\n${dataRow()}`);
    expect(r.rows.map((row) => row.lineNumber)).toEqual([1, 2, 3]);
  });
});

// ─── bulkInsertReadings ─────────────────────────────────────────────────

describe("bulkInsertReadings", () => {
  function makeRow(date: string | null, errors: string[] = []): ParsedRow {
    return { lineNumber: 1, values: { reading_date: date }, errors };
  }

  it("inserts only rows with no validation errors", async () => {
    const valid = makeRow("2026-07-20");
    const invalid = makeRow(null, ["reading_date ว่าง"]);
    const insert = vi.fn().mockResolvedValue({ error: null });
    const report = await bulkInsertReadings(insert, [valid, invalid]);
    expect(report.inserted).toBe(1);
    expect(report.failed).toBe(1);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ reading_date: "2026-07-20", input_source: "manual" }),
    ]);
  });

  it("batches at 100 rows per call", async () => {
    const rows = Array.from({ length: 250 }, (_, i) => makeRow(`2026-01-${String(i + 1).padStart(2, "0").slice(0, 2)}` || "2026-01-01"));
    // Fix the date generation — padStart trick above is fragile. Use a counter.
    const valid = Array.from({ length: 250 }, (_, i) => makeRow(`2026-${String((i % 12) + 1).padStart(2, "0")}-01`));
    const insert = vi.fn().mockResolvedValue({ error: null });
    const report = await bulkInsertReadings(insert, valid);
    expect(insert).toHaveBeenCalledTimes(3); // 100 + 100 + 50
    expect(report.inserted).toBe(250);
    void rows; // suppress unused
  });

  it("surfaces insert errors with batch index", async () => {
    const valid = makeRow("2026-07-20");
    const insert = vi.fn().mockResolvedValue({ error: "PK conflict" });
    const report = await bulkInsertReadings(insert, [valid]);
    expect(report.inserted).toBe(0);
    expect(report.sampleErrors[0]).toContain("batch 1");
    expect(report.sampleErrors[0]).toContain("PK conflict");
  });

  it("includes per-row validation errors in sampleErrors", async () => {
    const invalid = makeRow(null, ["reading_date ว่าง"]);
    const insert = vi.fn().mockResolvedValue({ error: null });
    const report = await bulkInsertReadings(insert, [invalid]);
    expect(report.sampleErrors.some((e) => e.includes("reading_date ว่าง"))).toBe(true);
  });

  it("truncates sampleErrors to ~10 entries", async () => {
    const invalid = Array.from({ length: 20 }, () => makeRow(null, ["reading_date ว่าง"]));
    const insert = vi.fn().mockResolvedValue({ error: null });
    const report = await bulkInsertReadings(insert, invalid);
    expect(report.sampleErrors.length).toBeLessThanOrEqual(10);
  });
});
