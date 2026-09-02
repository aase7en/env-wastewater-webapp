/**
 * ENV-INT-PROVENANCE-001 — provider-agnostic provenance envelope.
 *
 * Implements the observation/provenance contract designed in the
 * source-contract campaign (A-Wiki inbox ENV-GLM53-ENV-INT-SOURCE-CONTRACT-001
 * §8) as pure types + builders + a structural guard. NO provider imports, NO
 * network code, NO unit conversion — every ingested value must carry its own
 * provenance, and data classes stay mutually exclusive:
 *
 *   observed  — direct source observation (observed_at required)
 *   forecast  — model/prediction (observed_at forbidden; valid_at/issued_at/
 *               forecast_horizon required)
 *   derived   — provider- or app-computed aggregate (aggregation_window
 *               required; e.g. 24h average ≠ current hourly value)
 *   simulated — explicitly labeled simulation (simulation_ref required)
 *   unavailable — explicit absence of a value (never coerced to 0/normal)
 *
 * Non-negotiable separations enforced by builders and the guard:
 * received_at ≠ observed_at; forecast valid time ≠ issued time; a missing
 * value is never fabricated into zero/normal/safe/live.
 */
import type { EnvIntZone } from "./time";
import { isEnvIntZone } from "./time";

export type { EnvIntZone } from "./time";

/** Units are preserved verbatim from the provider ("ug/m3", "m_msl", ...). */
export type EnvIntUnit = string;

export type EnvIntDataClass =
  | "observed"
  | "forecast"
  | "derived"
  | "simulated"
  | "unavailable";

/**
 * Availability is source availability, NOT environmental severity, and NOT
 * freshness. Aligned with the canonical merged ENV-CMD-001 contract §5.1:
 * `stale` is a FRESHNESS state (see ./freshness classifyFreshness), never an
 * availability state — old-but-valid data stays `ready` availability with
 * `stale` freshness. `schema_mismatch` and `license_blocked` are env-int's
 * domain-level availability reasons, explicitly permitted by the canonical
 * contract ("a domain may additionally expose a schema/license-specific
 * reason through its own data contract"). Ordered classifier lives in
 * ./freshness (classifyAvailability).
 */
export type EnvIntAvailability =
  | "loading"
  | "ready"
  | "empty"
  | "unavailable"
  | "error"
  | "schema_mismatch"
  | "license_blocked";

export interface EnvIntGeoId {
  level: "province" | "amphoe" | "tambon" | "point" | "station";
  id?: number | null;
  lat?: number | null;
  lng?: number | null;
  label?: string | null;
}

export interface EnvIntObservation {
  /** Provider name, e.g. "GISTDA" | "TMD" | "HII". */
  provider: string;
  /** Product identifier, e.g. "pm25_check_amphoe_24h". */
  source_product: string;
  /** Truthful method label, e.g. "satellite_ground_calibrated_ai_analysis". */
  source_method: string;
  /** Exact endpoint/resource the value came from. */
  source_url: string;
  /** Geographic identity the value represents. */
  source_geo_id: EnvIntGeoId;
  /** Observation time (null for forecasts). */
  observed_at: Date | null;
  /** Time the value is valid for (== observed_at for observed data). */
  valid_at: Date | null;
  /** Provider product generation time (forecasts); null when unpublished. */
  issued_at: Date | null;
  /** ENV ingest clock time — ALWAYS distinct from data time. */
  received_at: Date;
  timezone: EnvIntZone;
  /** Provider unit, preserved verbatim (never converted silently). */
  unit: EnvIntUnit;
  value: number | null;
  /** e.g. "1h" | "24h" — required for derived data. */
  aggregation_window: string | null;
  /** e.g. "3h_step" — required for forecasts. */
  forecast_horizon: string | null;
  /** Required explicit label for simulated data. */
  simulation_ref: string | null;
  data_class: EnvIntDataClass;
  /** License status — "UNVERIFIED" until a terms decision exists. */
  license: string;
}

export interface EnvIntObservationInput {
  provider: string;
  source_product: string;
  source_method: string;
  source_url: string;
  source_geo_id: EnvIntGeoId;
  data_class: EnvIntDataClass;
  received_at: Date;
  timezone: EnvIntZone;
  unit: EnvIntUnit;
  value?: number | null;
  observed_at?: Date | null;
  valid_at?: Date | null;
  issued_at?: Date | null;
  aggregation_window?: string | null;
  forecast_horizon?: string | null;
  simulation_ref?: string | null;
  license?: string;
}

/** Build a normalized envelope, enforcing data-class truthfulness rules. */
export function envIntObservation(input: EnvIntObservationInput): EnvIntObservation {
  const {
    provider,
    source_product,
    source_method,
    source_url,
    source_geo_id,
    data_class,
    received_at,
    timezone,
    unit,
    value = null,
  } = input;

  if (data_class === "forecast") {
    if (input.observed_at != null) {
      throw new Error("env-int forecast must not carry observed_at (use valid_at/issued_at)");
    }
    if (!input.valid_at || !input.issued_at || !input.forecast_horizon) {
      throw new Error("env-int forecast requires valid_at, issued_at and forecast_horizon");
    }
  } else if (data_class === "observed") {
    if (!input.observed_at) {
      throw new Error("env-int observed data requires observed_at");
    }
  } else if (data_class === "derived") {
    if (!input.aggregation_window) {
      throw new Error("env-int derived data requires an explicit aggregation_window");
    }
  } else if (data_class === "simulated") {
    if (!input.simulation_ref) {
      throw new Error("env-int simulated data requires an explicit simulation_ref");
    }
  } else if (data_class === "unavailable") {
    // F3 (review finding 3): explicit unavailability must never carry a
    // value — fail closed instead of silently discarding a contradictory one.
    if (value !== null) {
      throw new Error("env-int unavailable data must not carry a value (explicit absence, never zero)");
    }
  }

  const observed_at = input.observed_at ?? null;
  return {
    provider,
    source_product,
    source_method,
    source_url,
    source_geo_id,
    observed_at,
    valid_at: input.valid_at ?? observed_at,
    issued_at: input.issued_at ?? null,
    received_at,
    timezone,
    unit,
    value,
    aggregation_window: input.aggregation_window ?? null,
    forecast_horizon: input.forecast_horizon ?? null,
    simulation_ref: input.simulation_ref ?? null,
    data_class,
    license: input.license ?? "UNVERIFIED",
  };
}

const DATA_CLASSES: readonly EnvIntDataClass[] = [
  "observed",
  "forecast",
  "derived",
  "simulated",
  "unavailable",
];

const GEO_LEVELS: readonly string[] = [
  "province",
  "amphoe",
  "tambon",
  "point",
  "station",
];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function isStringOrNull(v: unknown): boolean {
  return v === null || typeof v === "string";
}

function isFiniteNumberOrNull(v: unknown): boolean {
  return v === null || (typeof v === "number" && Number.isFinite(v));
}

function isValidDate(v: unknown): v is Date {
  return v instanceof Date && !Number.isNaN(v.getTime());
}

function isDateOrNull(v: unknown): boolean {
  return v === null || isValidDate(v);
}

/** Optional geo field: absent, explicitly null, or a finite number. */
function isFiniteNumberOrNullish(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === "number" && Number.isFinite(v));
}

/**
 * Structural guard for provider adapters (R2-hardened, review finding 4):
 * validates types, ranges, Date validity, timezone membership, geo shape and
 * every data-class invariant — not just key presence. Malformed payloads map
 * to availability `schema_mismatch` upstream — never silently repaired,
 * never coerced.
 */
export function isEnvIntObservation(candidate: unknown): candidate is EnvIntObservation {
  if (!isPlainObject(candidate)) return false;
  const o = candidate;
  const keys = [
    "provider",
    "source_product",
    "source_method",
    "source_url",
    "source_geo_id",
    "observed_at",
    "valid_at",
    "issued_at",
    "received_at",
    "timezone",
    "unit",
    "value",
    "aggregation_window",
    "forecast_horizon",
    "simulation_ref",
    "data_class",
    "license",
  ];
  for (const k of keys) {
    if (!(k in o)) return false;
  }
  if (!DATA_CLASSES.includes(o.data_class as EnvIntDataClass)) return false;
  if (!isEnvIntZone(o.timezone)) return false;
  if (
    !isNonEmptyString(o.provider) ||
    !isNonEmptyString(o.source_product) ||
    !isNonEmptyString(o.source_method)
  ) {
    return false;
  }
  if (typeof o.source_url !== "string") return false;
  if (typeof o.unit !== "string" || typeof o.license !== "string") return false;
  if (!isValidDate(o.received_at)) return false;
  if (!isFiniteNumberOrNull(o.value)) return false;
  if (
    !isStringOrNull(o.aggregation_window) ||
    !isStringOrNull(o.forecast_horizon) ||
    !isStringOrNull(o.simulation_ref)
  ) {
    return false;
  }
  if (!isDateOrNull(o.observed_at) || !isDateOrNull(o.valid_at) || !isDateOrNull(o.issued_at)) {
    return false;
  }
  if (!isPlainObject(o.source_geo_id)) return false;
  const g = o.source_geo_id;
  if (typeof g.level !== "string" || !GEO_LEVELS.includes(g.level)) return false;
  if (!isFiniteNumberOrNullish(g.id)) return false;
  if (g.label !== undefined && !isStringOrNull(g.label)) return false;
  if (!isFiniteNumberOrNullish(g.lat) || !isFiniteNumberOrNullish(g.lng)) return false;
  if (typeof g.lat === "number" && (g.lat < -90 || g.lat > 90)) return false;
  if (typeof g.lng === "number" && (g.lng < -180 || g.lng > 180)) return false;

  // Class invariants enforced by the guard itself.
  switch (o.data_class) {
    case "observed":
      if (!isValidDate(o.observed_at)) return false;
      break;
    case "forecast":
      if (o.observed_at !== null) return false;
      if (!isValidDate(o.valid_at) || !isValidDate(o.issued_at)) return false;
      if (typeof o.forecast_horizon !== "string") return false;
      break;
    case "derived":
      if (typeof o.aggregation_window !== "string") return false;
      break;
    case "simulated":
      if (typeof o.simulation_ref !== "string") return false;
      break;
    case "unavailable":
      if (o.value !== null) return false;
      break;
  }
  return true;
}

/** Format a data time in the envelope's own timezone wall clock. */
function wallClock(o: { timezone: EnvIntZone }, at: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: o.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(at)
    .replace(",", "");
}

/**
 * One-line provenance summary for UI display. Always shows provider ·
 * product · method · truthful data-class label · the DATA time (observed or
 * forecast-valid, never received_at, never a cache time).
 */
export function formatProvenanceLine(o: EnvIntObservation): string {
  const head = `${o.provider} · ${o.source_product} · ${o.source_method}`;
  switch (o.data_class) {
    case "observed":
      return `${head} · observed ${o.observed_at ? wallClock(o, o.observed_at) : "?"}`;
    case "forecast":
      return `${head} · forecast valid ${o.valid_at ? wallClock(o, o.valid_at) : "?"}`;
    case "derived":
      return `${head} · derived ${o.aggregation_window ?? "?"}${
        o.valid_at ? ` ending ${wallClock(o, o.valid_at)}` : ""
      }`;
    case "simulated":
      return `${head} · simulated ${o.simulation_ref ?? "?"}${
        o.valid_at ? ` valid ${wallClock(o, o.valid_at)}` : ""
      }`;
    case "unavailable":
    default:
      return `${head} · unavailable`;
  }
}
