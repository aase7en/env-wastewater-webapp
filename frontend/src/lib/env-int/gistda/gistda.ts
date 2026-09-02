/**
 * ENV-INT-GISTDA-CORE-001 — deterministic GISTDA PM2.5 adapter (parser /
 * normalization / schema-contract layer).
 *
 * Pure, network-free: this module turns already-fetched provider payloads
 * into merged ENV-INT core envelopes. It performs NO HTTP, stores nothing,
 * and reuses the merged core (`../core/*`) for every provenance/time rule —
 * it never reimplements any of it.
 *
 * Authority: source-contract packet
 * A-Wiki/inbox/ENV-GLM53-ENV-INT-SOURCE-CONTRACT-001.md §3/§7/§8/§10/§12
 * (verified by actual provider responses 2026-09-02). Contract:
 * docs/work-orders/ENV-INT-GISTDA-CORE-001.md.
 *
 * Time trap (§7, VERIFIED): GISTDA `dt` strings carry a trailing "Z" while
 * denoting Asia/Bangkok wall-clock. Parsed via the merged
 * `parseWallClockAs()` — never a second parser, never a +7 double shift.
 * Unparseable/impossible timestamps fail closed into `schema_mismatch`.
 *
 * License (§9): GISTDA publishes NO license/terms. Public redistribution is
 * DECISION_REQUIRED; every envelope therefore carries license "UNVERIFIED"
 * and the attribution floor is exported below.
 */
import { envIntObservation, type EnvIntObservation } from "../core/provenance";
import { parseWallClockAs, type EnvIntZone } from "../core/time";

// ─── Provider constants (public, anonymous service — no credentials exist) ──

export const GISTDA_PM25_HISTORY_URL =
  "https://pm25.gistda.or.th/rest/getPM25byAmphoe24hrs?ap_idn=1414";
export const GISTDA_PM25_PRED3_URL =
  "https://pm25.gistda.or.th/rest/getPm25byAmphoePred3?pv_idn=14";
/** Truthful method label (official About text): satellite + TMD weather +
 * hotspots AI fusion, calibrated to PCD ground stations — never "sensor". */
export const GISTDA_SOURCE_METHOD = "satellite_ground_calibrated_ai_analysis";
/** Attribution floor while no license exists (packet §9). */
export const GISTDA_ATTRIBUTION = "GISTDA (เช็คฝุ่น)";
/** License posture until a terms decision exists (packet §9). */
export const GISTDA_LICENSE = "UNVERIFIED";

const PROVIDER = "GISTDA";
const ZONE: EnvIntZone = "Asia/Bangkok";
const UNIT = "ug/m3";
const UTHAI_GEO = { level: "amphoe" as const, id: 1414, label: "อุทัย" };
/** Pred3 = 3-hourly prediction steps; predN is valid N×3h past the product dt. */
const FORECAST_STEP_MS = 3 * 3600 * 1000;

// ─── Result boundary (fail-closed, explicit — no thrown parse errors) ──────

export type GistdaFailKind =
  | "empty"
  | "target_not_found"
  | "schema_mismatch"
  | "provider_error"
  | "input_error";

export interface GistdaFail {
  kind: GistdaFailKind;
  reason: string;
}

export type GistdaParseResult<T> =
  | { kind: "ok"; data: T }
  | GistdaFail;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Validate the shared provider envelope {status, errMsg, data}. */
function openEnvelope(payload: unknown): { kind: "ok"; data: unknown } | GistdaFail {
  if (!isRecord(payload)) {
    return { kind: "input_error", reason: "payload must be a provider envelope object" };
  }
  const { status, errMsg, data } = payload;
  if (typeof status !== "number") {
    return { kind: "schema_mismatch", reason: "envelope.status must be a number" };
  }
  if (status !== 200) {
    return { kind: "provider_error", reason: `provider status ${status}` };
  }
  if (typeof errMsg !== "string") {
    return { kind: "schema_mismatch", reason: "envelope.errMsg must be a string" };
  }
  if (errMsg !== "") {
    return { kind: "provider_error", reason: `provider errMsg: ${errMsg}` };
  }
  if (data === undefined || data === null) {
    return { kind: "schema_mismatch", reason: "envelope.data missing" };
  }
  return { kind: "ok", data };
}

/** Validate the caller-supplied ingest clock. */
function checkReceivedAt(receivedAt: Date): GistdaFail | null {
  if (!(receivedAt instanceof Date) || Number.isNaN(receivedAt.getTime())) {
    return { kind: "input_error", reason: "receivedAt must be a valid Date (ENV ingest clock)" };
  }
  return null;
}

/** Contracted JSON number: finite only — strings/booleans/NaN/±Infinity are drift. */
function contractNumber(v: unknown): { ok: true; value: number } | { ok: false } {
  return typeof v === "number" && Number.isFinite(v)
    ? { ok: true, value: v }
    : { ok: false };
}

/** Optional provider field: absent-by-omission OR explicit null stays absent. */
function optionalContractNumber(
  rec: Record<string, unknown>,
  key: string,
): { state: "absent" } | { state: "present"; value: number } | { state: "invalid" } {
  const v = rec[key];
  if (v === undefined || v === null) return { state: "absent" };
  const n = contractNumber(v);
  return n.ok ? { state: "present", value: n.value } : { state: "invalid" };
}

/** Parse a contracted GISTDA timestamp with the merged wall-clock contract.
 * Returns the instant, or the fail boundary (never throws past this seam). */
function contractTime(value: unknown, field: string): Date | GistdaFail {
  if (typeof value !== "string") {
    return { kind: "schema_mismatch", reason: `${field} must be a timestamp string` };
  }
  try {
    return parseWallClockAs(value, ZONE);
  } catch (e) {
    return {
      kind: "schema_mismatch",
      reason: `${field} unparseable: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

// ─── History product: hourly OBSERVED points ───────────────────────────────

export interface GistdaHistoryOutput {
  /** One OBSERVED envelope per provider point, provider order preserved. */
  observations: EnvIntObservation[];
}

/**
 * Parse `getPM25byAmphoe24hrs?ap_idn=1414` (envelope fixture F1). Each
 * `graphHistory24hrs` point becomes an OBSERVED hourly envelope. The
 * trailing-24h mean is NOT produced here: on this endpoint the official app
 * computes it client-side, and this adapter never fabricates aggregates the
 * provider did not send (packet §3.2).
 */
export function parseGistdaPm25History(
  payload: unknown,
  receivedAt: Date,
): GistdaParseResult<GistdaHistoryOutput> {
  const clock = checkReceivedAt(receivedAt);
  if (clock) return clock;
  const env = openEnvelope(payload);
  if (env.kind !== "ok") return env;
  const data = env.data;
  if (!isRecord(data)) {
    return { kind: "schema_mismatch", reason: "history data must be an object" };
  }
  // Column order defines tuple semantics — anything but ["pm25","dt"] is drift.
  const meta = data.graphMetadata;
  if (
    !Array.isArray(meta) ||
    meta.length !== 2 ||
    meta[0] !== "pm25" ||
    meta[1] !== "dt"
  ) {
    return { kind: "schema_mismatch", reason: "graphMetadata must be exactly ['pm25','dt']" };
  }
  const history = data.graphHistory24hrs;
  if (!Array.isArray(history)) {
    return { kind: "schema_mismatch", reason: "graphHistory24hrs must be an array" };
  }
  if (history.length === 0) {
    return { kind: "empty", reason: "provider returned no history points" };
  }

  const observations: EnvIntObservation[] = [];
  for (let i = 0; i < history.length; i++) {
    const point = history[i];
    if (!Array.isArray(point) || point.length < 2) {
      return { kind: "schema_mismatch", reason: `graphHistory24hrs[${i}] must be a [pm25, dt] pair` };
    }
    const value = contractNumber(point[0]);
    if (!value.ok) {
      return {
        kind: "schema_mismatch",
        reason: `graphHistory24hrs[${i}][0] must be a finite number (pm25)`,
      };
    }
    const at = contractTime(point[1], `graphHistory24hrs[${i}][1]`);
    if (!(at instanceof Date)) return at;
    observations.push(
      envIntObservation({
        provider: PROVIDER,
        source_product: "pm25_check_amphoe_24h",
        source_method: GISTDA_SOURCE_METHOD,
        source_url: GISTDA_PM25_HISTORY_URL,
        source_geo_id: UTHAI_GEO,
        data_class: "observed",
        observed_at: at,
        received_at: receivedAt,
        timezone: ZONE,
        unit: UNIT,
        value: value.value,
        aggregation_window: "1h",
        license: GISTDA_LICENSE,
      }),
    );
  }
  return { kind: "ok", data: { observations } };
}

// ─── Pred3 product: current + provider 24h average + 3 forecast steps ──────

export interface GistdaPred3Output {
  /** pm25 — current hourly analysis value (OBSERVED, 1h window). */
  current: EnvIntObservation;
  /** pm25Avg24hr — provider-computed trailing mean (DERIVED, 24h window);
   * null iff the provider omitted it. Never computed here. */
  average24h: EnvIntObservation | null;
  /** pred1..3 — FORECAST envelopes for the steps the provider actually sent
   * (0–3). Absent steps stay absent; nothing is cross-filled. */
  forecasts: EnvIntObservation[];
}

/**
 * Parse `getPm25byAmphoePred3?pv_idn=14` (record fixture F2) and select the
 * Uthai amphoe (ap_idn 1414) entry. pm25 → OBSERVED; pm25Avg24hr → DERIVED;
 * pred1/2/3 → FORECAST with valid_at = dt + N×3h, issued_at = dt,
 * horizon "3h_step".
 */
export function parseGistdaPm25Pred3(
  payload: unknown,
  receivedAt: Date,
): GistdaParseResult<GistdaPred3Output> {
  const clock = checkReceivedAt(receivedAt);
  if (clock) return clock;
  const env = openEnvelope(payload);
  if (env.kind !== "ok") return env;
  const rows = env.data;
  if (!Array.isArray(rows)) {
    return { kind: "schema_mismatch", reason: "pred3 data must be an array of amphoe records" };
  }
  if (rows.length === 0) {
    return { kind: "empty", reason: "provider returned no amphoe records" };
  }
  const record = rows.find((r) => isRecord(r) && r.ap_idn === UTHAI_GEO.id);
  if (!isRecord(record)) {
    return {
      kind: "target_not_found",
      reason: `amphoe ${UTHAI_GEO.id} (อุทัย) not present in the provider payload`,
    };
  }

  const pm25 = contractNumber(record.pm25);
  if (!pm25.ok) {
    return { kind: "schema_mismatch", reason: "pm25 must be a finite number" };
  }
  const dt = contractTime(record.dt, "dt");
  if (!(dt instanceof Date)) return dt;

  const current = envIntObservation({
    provider: PROVIDER,
    source_product: "pm25_check_pred3",
    source_method: GISTDA_SOURCE_METHOD,
    source_url: GISTDA_PM25_PRED3_URL,
    source_geo_id: UTHAI_GEO,
    data_class: "observed",
    observed_at: dt,
    received_at: receivedAt,
    timezone: ZONE,
    unit: UNIT,
    value: pm25.value,
    aggregation_window: "1h",
    license: GISTDA_LICENSE,
  });

  const avgField = optionalContractNumber(record, "pm25Avg24hr");
  if (avgField.state === "invalid") {
    return { kind: "schema_mismatch", reason: "pm25Avg24hr, when present, must be a finite number" };
  }
  const average24h =
    avgField.state === "present"
      ? envIntObservation({
          provider: PROVIDER,
          source_product: "pm25_check_pred3",
          source_method: GISTDA_SOURCE_METHOD,
          source_url: GISTDA_PM25_PRED3_URL,
          source_geo_id: UTHAI_GEO,
          data_class: "derived",
          observed_at: dt,
          received_at: receivedAt,
          timezone: ZONE,
          unit: UNIT,
          value: avgField.value,
          aggregation_window: "24h",
          license: GISTDA_LICENSE,
        })
      : null;

  const forecasts: EnvIntObservation[] = [];
  for (let n = 1; n <= 3; n++) {
    const key = `pred${n}`;
    const pred = optionalContractNumber(record, key);
    if (pred.state === "absent") continue; // render only what exists — no cross-fill
    if (pred.state === "invalid") {
      return { kind: "schema_mismatch", reason: `${key}, when present, must be a finite number` };
    }
    forecasts.push(
      envIntObservation({
        provider: PROVIDER,
        source_product: "pm25_check_pred3",
        source_method: GISTDA_SOURCE_METHOD,
        source_url: GISTDA_PM25_PRED3_URL,
        source_geo_id: UTHAI_GEO,
        data_class: "forecast",
        observed_at: null,
        valid_at: new Date(dt.getTime() + n * FORECAST_STEP_MS),
        issued_at: dt,
        received_at: receivedAt,
        timezone: ZONE,
        unit: UNIT,
        value: pred.value,
        forecast_horizon: "3h_step",
        license: GISTDA_LICENSE,
      }),
    );
  }

  return { kind: "ok", data: { current, average24h, forecasts } };
}
