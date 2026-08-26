/**
 * WO-STAB-009 — row-annotation PHI/provider boundary.
 *
 * annotateRow used to ship JSON.stringify(row) to the external provider.
 * The table-NAME deny-set (applyPhiFilter inside sendChatTurn) could not
 * stop PHI content inside rows of non-flagged tables (e.g. emails inside
 * audit_log.old_data) from leaving the system.
 *
 * Boundary (GPT activation amendments — mandatory):
 *   Effective authorization = runtime core.ai_scope approval
 *   (patient_safe = true AND is_enabled = true, canonical schema.table)
 *   INTERSECTED with a static, in-code safe-field profile.
 *   - An admin runtime toggle alone can NEVER widen the payload.
 *   - Unknown / ambiguous / unqualified-without-map / disabled / missing /
 *     unreadable scope => fail closed locally, ZERO provider calls.
 *   - The row is projected to the static safe fields BEFORE prompt
 *     construction; unknown columns are omitted (Unknown ≠ shared).
 *   - A PII regex scrubber runs on projected string values as
 *     defense-in-depth (never the only gate).
 *   - Refusal/error paths never include or log the raw row.
 *   - STATIC_PHI_DENY is NOT used as a positive-allowlist fallback.
 */
import { supabase } from "../supabase";

/** Canonical fully-qualified safe-field profiles.
 * A table is annotatable ONLY if it appears here AND is approved at
 * runtime. Fields are allowlisted by name; anything else is dropped.
 * Values are scrubbed defensively before leaving the browser.
 *
 * PR #29 remediation: unrestricted free-text inputs the production UI
 * lets users type arbitrarily (color_desc, smell_desc, note in
 * DailyFormPage — "พิมพ์เอง" + free Textarea) are NOT provider-safe.
 * Regex scrubbing cannot guarantee removal of patient names / free-text
 * identifiers, so they stay out of the profile entirely. Only bounded
 * (numeric/date/uuid/enum-contract) fields may be allowlisted. */
const TABLE_SAFE_FIELDS: Readonly<Record<string, readonly string[]>> = {
  "wastewater.reading": [
    "id", "reading_date", "do_inlet", "do_tank", "do_outlet",
    "ph_inlet", "ph_tank", "ph_outlet", "tds_inlet", "tds_tank",
    "tds_outlet", "free_chlorine", "temperature", "sv30",
    "sludge_level_cm", "wastewater_in", "wastewater_out",
    "wastewater_discharged", "system_operating",
  ],
  "carbon.reading": [
    "id", "reading_date", "meter_value", "consumption",
  ],
  // Remediation 2 (all-profile audit): fuel_type / waste_type are
  // unrestricted `text` (no CHECK; bulk import accepts arbitrary strings
  // in fuel_type) — not structurally bounded, so not provider-safe.
  // severity was a stale entry — no such column exists in the current
  // wastewater.threshold_alert schema.
  "fuel.dispense_log": ["id", "log_date", "litres"],
  "garbage.collection_log": ["id", "log_date", "weight_kg"],
  "wastewater.threshold_alert": [
    "id", "created_at", "read_at",
  ],
};

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+?\d{1,3}[-. ]?)?\d{2,3}[-. ]?\d{3}[-. ]?\d{3,4}(?:[-. ]?\d{3})?/g;
const THAI_ID_RE = /\b[1-9]\d{12}\b/g;

function scrubValue(v: unknown): unknown {
  if (typeof v === "string") {
    return v
      .replace(EMAIL_RE, "[REDACTED]")
      .replace(THAI_ID_RE, "[REDACTED]")
      .replace(PHONE_RE, "[REDACTED]");
  }
  return v;
}

/** Project + scrub a row down to the table's safe fields.
 * Unknown columns are omitted by default. */
export function projectSafeRow(
  row: Record<string, unknown>,
  canonicalTable: string,
): Record<string, unknown> {
  const allow = TABLE_SAFE_FIELDS[canonicalTable] ?? [];
  const out: Record<string, unknown> = {};
  for (const key of allow) {
    if (key in row) out[key] = scrubValue(row[key]);
  }
  return out;
}

/** Whether the canonical table has a static safe-field profile at all. */
export function hasStaticProfile(canonicalTable: string): boolean {
  return canonicalTable in TABLE_SAFE_FIELDS;
}

/** Read runtime annotation approval for canonical schema.table.
 * Returns true ONLY when a row exists with patient_safe = true AND
 * is_enabled = true. Any error/exception => false (fail closed).
 * NEVER falls back to STATIC_PHI_DENY — that is a deny-list helper and
 * must not be reused as a positive allowlist (amendment #4). */
export async function isRuntimeApproved(canonicalTable: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("ai_scope")
      .select("view_name")
      .eq("view_name", canonicalTable)
      .eq("patient_safe", true)
      .eq("is_enabled", true)
      .maybeSingle();
    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

/** Resolve bare table names to canonical schema.table when unambiguous
 * against the static profile map. Unknown/ambiguous => null (fail closed). */
export function canonicalizeTableName(tableName: string): string | null {
  if (tableName.includes(".")) {
    return hasStaticProfile(tableName) ? tableName : null;
  }
  const matches = Object.keys(TABLE_SAFE_FIELDS)
    .filter((k) => k.split(".")[1] === tableName);
  return matches.length === 1 ? matches[0]! : null;
}
