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
 * Availability is source availability, NOT environmental severity.
 * Ordered state machine lives in ./freshness (classifyAvailability).
 */
export type EnvIntAvailability =
  | "loading"
  | "ready"
  | "empty"
  | "stale"
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

/**
 * Structural guard for provider adapters: detects schema drift loudly so a
 * malformed payload maps to availability `schema_mismatch` — never silently
 * repaired or coerced.
 */
export function isEnvIntObservation(candidate: unknown): candidate is EnvIntObservation {
  if (typeof candidate !== "object" || candidate === null) return false;
  const o = candidate as Record<string, unknown>;
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
  if (!(o.received_at instanceof Date)) return false;
  if (typeof o.provider !== "string" || typeof o.unit !== "string") return false;
  if (o.data_class === "observed" && !(o.observed_at instanceof Date)) return false;
  if (
    o.data_class === "forecast" &&
    (!(o.valid_at instanceof Date) ||
      !(o.issued_at instanceof Date) ||
      typeof o.forecast_horizon !== "string")
  ) {
    return false;
  }
  if (o.data_class === "derived" && typeof o.aggregation_window !== "string") return false;
  if (o.data_class === "simulated" && typeof o.simulation_ref !== "string") return false;
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
