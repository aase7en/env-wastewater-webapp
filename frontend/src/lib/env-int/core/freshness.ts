/**
 * ENV-INT-PROVENANCE-001 — provider-agnostic freshness + availability.
 *
 * Implements §8 freshness rules and the §10 failure/outage state machine from
 * the source-contract campaign (A-Wiki inbox
 * ENV-GLM53-ENV-INT-SOURCE-CONTRACT-001):
 *
 *  - freshness age is computed from the DATA time (observed_at, else
 *    valid_at, else issued_at) — NEVER from received_at and never from a
 *    React/query cache age, which carry no environmental meaning;
 *  - unknown age (no data time) is unavailable, never zero;
 *  - availability classification is an ordered state machine and can never
 *    emit 0 / NORMAL / SAFE / LIVE, and no state ever fabricates a value;
 *  - source availability is intentionally separate from any environmental
 *    severity label ENV may render later.
 */
import type { EnvIntAvailability, EnvIntObservation } from "./provenance";

/**
 * Age of the data (not of the fetch). Returns null when the observation
 * carries no data time — the caller must treat that as unknown, never 0.
 */
export function computeFreshnessAge(
  o: Pick<EnvIntObservation, "observed_at" | "valid_at" | "issued_at">,
  now: Date,
): number | null {
  const at = o.observed_at ?? o.valid_at ?? o.issued_at ?? null;
  if (at === null) return null;
  return now.getTime() - at.getTime();
}

export interface EnvIntAvailabilityInput {
  /** Transport outcome. Absent = transport state not yet known. */
  httpState?: "ok" | "error" | "timeout";
  /** Did the payload match the contracted schema? (guard-checked upstream) */
  schemaValid?: boolean;
  /** Did the provider return a non-empty payload? (empty ≠ zero value) */
  dataPresent?: boolean;
  /** Is the specific station/target present (feed may be healthy without it)? */
  stationPresent?: boolean;
  /** Data age in ms from computeFreshnessAge; null = unknown. */
  ageMs?: number | null;
  /** Fresh band upper bound in ms (display nuance; classification only needs staleBeyondMs). */
  freshWithinMs?: number | null;
  /** Stale threshold in ms from verified provider cadence. */
  staleBeyondMs?: number | null;
  /** License/terms gate failed → nothing may be displayed from this source. */
  licenseBlocked?: boolean;
}

/**
 * Ordered availability state machine:
 * license_blocked > error > schema_mismatch > unavailable(target) >
 * empty(payload) > unavailable(unknown age) > stale > ready.
 */
export function classifyAvailability(i: EnvIntAvailabilityInput): EnvIntAvailability {
  if (i.licenseBlocked) return "license_blocked";
  if (i.httpState === "error" || i.httpState === "timeout") return "error";
  if (i.schemaValid === false) return "schema_mismatch";
  if (i.stationPresent === false) return "unavailable";
  if (i.dataPresent === false) return "empty";
  if (i.ageMs === null || i.ageMs === undefined) return "unavailable";
  if (
    i.staleBeyondMs !== null &&
    i.staleBeyondMs !== undefined &&
    i.ageMs > i.staleBeyondMs
  ) {
    return "stale";
  }
  return "ready";
}
