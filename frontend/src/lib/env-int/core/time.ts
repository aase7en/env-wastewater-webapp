/**
 * ENV-INT-PROVENANCE-001 — provider-agnostic timestamp parsing.
 *
 * Source-contract campaign (A-Wiki inbox ENV-GLM53-ENV-INT-SOURCE-CONTRACT-001
 * §7) verified that current ENV-relevant providers emit timestamps in two
 * wall-clock forms, both denoting Asia/Bangkok local time:
 *
 *  - GISTDA-style ISO strings whose trailing "Z" is UNRELIABLE (proven
 *    2026-09-02: latest data point 10:00"Z" arrived at 10:13 ICT — a true UTC
 *    reading would be ~7 h in the future). Parse with parseWallClockAs().
 *  - HII-style naive "YYYY-MM-DD HH:mm" local strings. Parse with
 *    parseNaiveLocal().
 *
 * Only "Asia/Bangkok" is supported: it is the only zone verified by current
 * provider evidence. Adding a zone requires new source-contract evidence.
 */

/** Timezones verified for ENV ingestion (source-contract packet §7). */
export type EnvIntZone = "Asia/Bangkok";

/** Fixed offsets for the verified zones (no DST anywhere in the set). */
const ZONE_OFFSETS: Record<EnvIntZone, string> = {
  "Asia/Bangkok": "+07:00",
};

const WALL_CLOCK_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

/**
 * Parse an ISO-like string whose zone suffix is unreliable (GISTDA "Z"-as-ICT
 * trap): the zone designator is stripped and the wall clock is interpreted in
 * `zone`. Never double-shifts a genuinely-zoned value — callers must only use
 * this for products whose contract says the suffix is unreliable.
 */
export function parseWallClockAs(value: string, zone: EnvIntZone): Date {
  const s = String(value).trim();
  if (!WALL_CLOCK_RE.test(s)) {
    throw new Error(`unparseable env-int timestamp: ${value}`);
  }
  const bare = s.replace(/(Z|[+-]\d{2}:?\d{2})$/, "");
  return new Date(`${bare}${ZONE_OFFSETS[zone]}`);
}

/**
 * Parse a naive local datetime ("YYYY-MM-DD HH:mm" or "...THH:mm") as
 * wall-clock time in `zone`. HII water-level/rainfall contract.
 */
export function parseNaiveLocal(value: string, zone: EnvIntZone): Date {
  const s = String(value).trim().replace(" ", "T");
  if (!WALL_CLOCK_RE.test(s)) {
    throw new Error(`unparseable env-int timestamp: ${value}`);
  }
  return new Date(`${s}${ZONE_OFFSETS[zone]}`);
}
