/**
 * CSV bulk import — parse + validate + insert wastewater.reading rows.
 *
 * The CSV column order matches the authoritative Phase 2 INSERT contract
 * (scripts/phase2_generate_sql.py WR_COLS) so historical exports can be
 * re-imported without manual column reordering. The parser also accepts
 * a CSV with a header row containing those names in any order.
 *
 * Insert strategy: batched insert via Supabase's `.insert([...])`.
 * Each row goes through the same coercion the form does (empty string →
 * null, "true"/"false" → boolean, numeric strings → number). The
 * fn_persist_threshold_alerts trigger still fires per row, so threshold
 * breaches discovered during import get staged for notification too.
 *
 * Scope: this is Track Z feature/data work — pure logic, no styling.
 */

// The 36-column authoritative INSERT contract (Phase 2). Order here is
// also the default column order for the downloadable CSV template.
export const READING_CSV_COLUMNS = [
  "reading_date", "tds_aeration", "temp_aeration", "tds_before_discharge", "ph",
  "do_aeration", "do_sedimentation", "do_before_discharge", "sv30", "free_chlorine",
  "screen_cleaned_coarse", "screen_cleaned_fine",
  "pump1_running", "pump2_running", "aerator1_running", "aerator2_running",
  "sludge_pump1_running", "sludge_pump2_running",
  "chlorine_pump1_running", "chlorine_pump2_running", "system_operating",
  "pump1_meter", "pump2_meter", "water_used_total", "wastewater_in",
  "wastewater_discharged", "chlorine_used", "chlorine_mix_ratio",
  "excess_sludge_removed", "color_desc", "smell_desc", "note", "legacy_id",
  "reported_by_name_legacy", "meter_value", "consumption",
] as const;

export type ReadingCsvColumn = (typeof READING_CSV_COLUMNS)[number];

// Boolean-typed columns — values "true"/"false"/"1"/"0"/"" map to bool/null.
const BOOLEAN_COLS: ReadonlySet<string> = new Set([
  "screen_cleaned_coarse", "screen_cleaned_fine",
  "pump1_running", "pump2_running", "aerator1_running", "aerator2_running",
  "sludge_pump1_running", "sludge_pump2_running",
  "chlorine_pump1_running", "chlorine_pump2_running", "system_operating",
  "wastewater_discharged",
]);

// Numeric columns — everything except booleans, dates, and the free-text
// descriptors (color/smell/note/legacy_id/reported_by_name_legacy/mix_ratio).
const NUMERIC_COLS: ReadonlySet<string> = new Set([
  "tds_aeration", "temp_aeration", "tds_before_discharge", "ph",
  "do_aeration", "do_sedimentation", "do_before_discharge", "sv30", "free_chlorine",
  "pump1_meter", "pump2_meter", "water_used_total", "wastewater_in",
  "chlorine_used", "excess_sludge_removed", "meter_value", "consumption",
]);

const REQUIRED_COLS: ReadonlySet<string> = new Set(["reading_date"]);

export interface ParsedRow {
  /** Source line number (1-based, excluding header). */
  lineNumber: number;
  /** Coerced row, ready for Supabase insert. */
  values: Record<string, unknown>;
  /** Validation errors for this row (empty array = OK). */
  errors: string[];
}

export interface ParseResult {
  rows: ParsedRow[];
  /** Aggregate validation errors that prevented any insert (bad header etc). */
  fatalErrors: string[];
  /** Total source lines (excluding header). */
  totalLines: number;
}

/** Coerce a raw string cell to its target type. Returns null for empty. */
function coerce(col: string, raw: string): unknown {
  const v = raw.trim();
  if (v === "") return null;

  if (BOOLEAN_COLS.has(col)) {
    const lv = v.toLowerCase();
    if (lv === "true" || lv === "1" || lv === "yes" || lv === "y" || lv === "t") return true;
    if (lv === "false" || lv === "0" || lv === "no" || lv === "n" || lv === "f") return false;
    return null; // unrecognized → unknown
  }
  if (NUMERIC_COLS.has(col)) {
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
  }
  // Dates, free text, IDs — pass through as string.
  return v;
}

/**
 * Minimal RFC-4180-ish CSV parser. Handles quoted fields, embedded commas,
 * and escaped quotes (""). Not a full spec implementation, but enough for
 * Phase-2-style exports and spreadsheet saves.
 */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let buf = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          buf += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        buf += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        out.push(buf);
        buf = "";
      } else {
        buf += ch;
      }
    }
  }
  out.push(buf);
  return out;
}

/**
 * Parse the full CSV text. The header row must contain the expected column
 * names (any order). Missing REQUIRED_COLS → fatal error. Unknown columns
 * are dropped with a warning (not fatal — exports may have extra cols).
 */
export function parseReadingCsv(text: string): ParseResult {
  const fatalErrors: string[] = [];
  // Normalize line endings + drop trailing blank line.
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l, i, arr) => !(i === arr.length - 1 && l.trim() === ""));
  if (lines.length === 0) {
    return { rows: [], fatalErrors: ["ไฟล์ว่าง"], totalLines: 0 };
  }

  const headerCells = parseCsvLine(lines[0]).map((c) => c.trim());
  // Build column index. Drop unknown columns (warn, don't fail).
  const colIndex: Record<string, number> = {};
  const unknown: string[] = [];
  headerCells.forEach((h, i) => {
    if ((READING_CSV_COLUMNS as readonly string[]).includes(h)) {
      colIndex[h] = i;
    } else if (h !== "") {
      unknown.push(h);
    }
  });

  // Required-column check.
  const missingRequired = [...REQUIRED_COLS].filter((c) => !(c in colIndex));
  if (missingRequired.length > 0) {
    fatalErrors.push(`Header ขาดคอลัมน์บังคับ: ${missingRequired.join(", ")}`);
  }
  if (unknown.length > 0) {
    // Warning only — exported CSVs may carry extra metadata columns.
    console.warn("CSV import: ignoring unknown columns:", unknown);
  }
  if (fatalErrors.length > 0) {
    return { rows: [], fatalErrors, totalLines: lines.length - 1 };
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const values: Record<string, unknown> = {};
    const errors: string[] = [];

    for (const col of Object.keys(colIndex)) {
      const raw = cells[colIndex[col]] ?? "";
      values[col] = coerce(col, raw);
    }

    // Required-field validation.
    if (!values.reading_date) {
      errors.push("reading_date ว่าง");
    } else {
      // Loose date shape check (YYYY-MM-DD).
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(values.reading_date))) {
        errors.push(`reading_date รูปแบบไม่ใช่ YYYY-MM-DD: '${values.reading_date}'`);
      }
    }

    rows.push({ lineNumber: i, values, errors });
  }

  return { rows, fatalErrors, totalLines: lines.length - 1 };
}

/**
 * Bulk-insert parsed rows. Splits valid from invalid; returns counts.
 * Inserts in batches of 100 to stay within PostgREST's payload limit.
 *
 * Does NOT insert carbon.reading companion rows for meter_value/consumption
 * — the daily form creates those transactionally, but bulk import of
 * historical data skips them (the legacy rows were carbon-linked during
 * the original Phase 2 migration; re-imports are for wastewater-only
 * fixes). If you need carbon linkage, insert via the form instead.
 */
export interface BulkInsertReport {
  inserted: number;
  failed: number;
  /** First ~10 error messages for UI display. */
  sampleErrors: string[];
}

export async function bulkInsertReadings(
  supabaseInsert: (rows: Record<string, unknown>[]) => Promise<{ error: string | null }>,
  rows: ParsedRow[]
): Promise<BulkInsertReport> {
  const valid = rows.filter((r) => r.errors.length === 0).map((r) => ({
    ...r.values,
    input_source: "manual",
  }));
  const failed = rows.length - valid.length;

  let inserted = 0;
  const BATCH = 100;
  const sampleErrors: string[] = [];

  for (let i = 0; i < valid.length; i += BATCH) {
    const batch = valid.slice(i, i + BATCH);
    const { error } = await supabaseInsert(batch);
    if (error) {
      // Likely a PK/FK conflict on a batch; surface it. We do not retry
      // row-by-row here (would be slow + risk partial state). The user
      // can re-run after fixing the source CSV.
      sampleErrors.push(`batch ${i / BATCH + 1}: ${error}`);
    } else {
      inserted += batch.length;
    }
  }

  // Include per-row validation errors in sampleErrors.
  for (const r of rows) {
    if (r.errors.length > 0) {
      sampleErrors.push(`line ${r.lineNumber}: ${r.errors.join("; ")}`);
      if (sampleErrors.length >= 10) break;
    }
  }

  return { inserted, failed: failed + (valid.length - inserted), sampleErrors };
}

/** Generate a blank CSV template string for users to fill in. */
export function csvTemplate(): string {
  return [READING_CSV_COLUMNS.join(","), ",".repeat(READING_CSV_COLUMNS.length - 1)].join("\n");
}
