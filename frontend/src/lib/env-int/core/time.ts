/**
 * ENV-INT-PROVENANCE-001 (+R2) — provider-agnostic timestamp parsing.
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
 *
 * R2 fail-closed contract (review finding 5): a timestamp string either
 * denotes ONE exact intended instant or the parser THROWS. Impossible
 * wall-clock values (month 00/13, day 00, Feb 31, invalid leap days, hour
 * 24+, minute/second 60), trailing junk, malformed zone suffixes, and naive
 * strings that carry a zone designator are all rejected — never silently
 * normalized, never returned as an Invalid Date, never double-shifted.
 */

/** Timezones verified for ENV ingestion (source-contract packet §7). */
export type EnvIntZone = "Asia/Bangkok";

/** Fixed offsets for the verified zones (no DST anywhere in the set). */
const ZONE_OFFSETS: Record<EnvIntZone, string> = {
  "Asia/Bangkok": "+07:00",
};

/** Zone-membership check for the structural guard (single source of truth). */
export function isEnvIntZone(v: unknown): v is EnvIntZone {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(ZONE_OFFSETS, v);
}

/**
 * Strict full-string wall-clock shape:
 *   YYYY-MM-DD [T| ] HH:mm [:ss [.sss]] [Z | ±HH:MM | ±HHMM]
 * Everything outside this shape (including trailing junk) fails the match.
 */
const WALL_CLOCK_RE =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:?\d{2})?$/;

/** A present suffix must at least be a syntactically possible offset. */
const VALID_SUFFIX_RE = /^Z$|^[+-](?:[01]\d|2[0-3]):?[0-5]\d$/;

function daysInMonth(year: number, month: number): number {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

interface WallClockParts {
  /** Normalized "YYYY-MM-DDTHH:mm:ss.sss" with no zone designator. */
  bare: string;
  /** Matched suffix ("Z" / "±HH:MM" / "±HHMM") or null when absent. */
  suffix: string | null;
}

/** Parse + range-validate a wall-clock string; throws on anything impossible. */
function parseWallClockParts(value: string): WallClockParts {
  const s = String(value).trim();
  const m = WALL_CLOCK_RE.exec(s);
  if (m === null) {
    throw new Error(`unparseable env-int timestamp: ${value}`);
  }
  const [, y, mo, d, h, mi, sec = "00", ms = "0", suffix] = m;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const hour = Number(h);
  const minute = Number(mi);
  const second = Number(sec);
  if (month < 1 || month > 12) {
    throw new Error(`unparseable env-int timestamp (month): ${value}`);
  }
  if (day < 1 || day > daysInMonth(year, month)) {
    throw new Error(`unparseable env-int timestamp (day): ${value}`);
  }
  if (hour > 23) {
    throw new Error(`unparseable env-int timestamp (hour): ${value}`);
  }
  if (minute > 59) {
    throw new Error(`unparseable env-int timestamp (minute): ${value}`);
  }
  if (second > 59) {
    throw new Error(`unparseable env-int timestamp (second): ${value}`);
  }
  if (suffix !== undefined && !VALID_SUFFIX_RE.test(suffix)) {
    throw new Error(`unparseable env-int timestamp (offset): ${value}`);
  }
  return {
    bare: `${y}-${mo}-${d}T${h}:${mi}:${sec}.${ms.padEnd(3, "0")}`,
    suffix: suffix ?? null,
  };
}

/** Build the instant from validated parts; refuse any engine-level surprise. */
function buildZoned(bare: string, zone: EnvIntZone): Date {
  const d = new Date(`${bare}${ZONE_OFFSETS[zone]}`);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`unparseable env-int timestamp (constructed invalid): ${bare}`);
  }
  return d;
}

/**
 * Parse an ISO-like string whose zone suffix is unreliable (GISTDA "Z"-as-ICT
 * trap): the suffix must be syntactically well formed but is IGNORED — the
 * wall clock is interpreted in `zone`. Never double-shifts a genuinely-zoned
 * value because callers must only use this for products whose contract says
 * the suffix is unreliable.
 */
export function parseWallClockAs(value: string, zone: EnvIntZone): Date {
  const { bare } = parseWallClockParts(value);
  return buildZoned(bare, zone);
}

/**
 * Parse a naive local datetime ("YYYY-MM-DD HH:mm" or "...THH:mm[:ss]") as
 * wall-clock time in `zone`. HII water-level/rainfall contract. A naive
 * string that carries a zone designator violates this contract and throws.
 */
export function parseNaiveLocal(value: string, zone: EnvIntZone): Date {
  const { bare, suffix } = parseWallClockParts(value);
  if (suffix !== null) {
    throw new Error(`unparseable env-int timestamp (naive carries zone): ${value}`);
  }
  return buildZoned(bare, zone);
}
