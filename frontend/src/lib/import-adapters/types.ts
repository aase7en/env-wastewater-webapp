/**
 * IMP-2 — import adapters: per-module column mapping + validation.
 *
 * Each adapter maps ParsedTable (from import-engine) to the typed rows
 * a module's lib expects. Returns validated rows + list of errors for
 * rows that failed validation (caller shows in UI).
 */

export interface AdapterResult<T> {
  valid: T[];
  errors: Array<{ row: number; reason: string }>;
}

export interface Adapter<T> {
  /** Target module id (matches lib/<module>.ts name). */
  moduleId: string;
  /** Required source columns (case-insensitive substring match). */
  requiredColumns: string[];
  /** Optional source columns to also pull if present. */
  optionalColumns?: string[];
  /** Map a raw parsed row → typed input. Throw to mark invalid. */
  mapRow(raw: Record<string, unknown>, rowIndex: number): T;
}

/**
 * Run an adapter over a parsed table. Returns {valid, errors}.
 * Column matching is case-insensitive + whitespace-tolerant.
 */
export function applyAdapter<T>(
  columns: string[],
  rows: Record<string, unknown>[],
  adapter: Adapter<T>,
): AdapterResult<T> {
  // Build a lowercased-key map for tolerant lookup.
  const colIndex = new Map<string, string>();
  for (const c of columns) colIndex.set(c.toLowerCase().trim(), c);

  // Check required columns.
  const missing = adapter.requiredColumns.filter(
    (r) => !Array.from(colIndex.keys()).some((k) => k.includes(r.toLowerCase())),
  );
  if (missing.length > 0) {
    return {
      valid: [],
      errors: [{ row: -1, reason: `คอลัมน์ที่จำเป็นขาด: ${missing.join(", ")}` }],
    };
  }

  const valid: T[] = [];
  const errors: Array<{ row: number; reason: string }> = [];

  rows.forEach((raw, i) => {
    try {
      // Provide a helper for tolerant access.
      const get = (key: string): unknown => {
        const k = key.toLowerCase();
        for (const [low, orig] of colIndex) {
          if (low.includes(k) || k.includes(low)) return raw[orig];
        }
        return undefined;
      };
      const wrapped: Record<string, unknown> = new Proxy(raw, {
        get(_t, prop: string) { return get(prop); },
      });
      valid.push(adapter.mapRow(wrapped, i));
    } catch (e) {
      errors.push({ row: i + 2, reason: (e as Error).message }); // +2 = header + 1-indexed
    }
  });

  return { valid, errors };
}

// Helper exported for adapter authors.
export function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[,_]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export function date(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  // Accept ISO, dd/mm/yyyy, Buddhist-era (พ.ศ.).
  const s = String(v).trim();
  // Buddhist Era: yyyy+543 or พ.ศ. suffix
  const be = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (be) {
    const [_, dd, mm, yyyy] = be;
    let year = Number(yyyy);
    if (year > 2400) year -= 543; // พ.ศ. → CE
    return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0]!;
  return null;
}
