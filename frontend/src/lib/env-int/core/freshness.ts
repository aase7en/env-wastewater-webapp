/**
 * ENV-INT-PROVENANCE-001 (+R2) — provider-agnostic freshness + availability.
 *
 * Implements §8 freshness rules and the §10 failure/outage state machine from
 * the source-contract campaign (A-Wiki inbox
 * ENV-GLM53-ENV-INT-SOURCE-CONTRACT-001), realigned to the canonical merged
 * ENV-CMD-001 four-orthogonal-dimensions contract (review finding 1):
 *
 *  - AVAILABILITY (classifyAvailability) answers "can this source present
 *    usable data right now?" — `stale` is NOT an availability state; old but
 *    valid data stays available. `loading` is reachable via the explicit
 *    `loading` input (review finding 2: a pending transport must not fall
 *    through to `unavailable`).
 *  - FRESHNESS (classifyFreshness) answers "how current is the evidence
 *    relative to a verified provider cadence policy?" — current / stale /
 *    unknown. Without a data time or without a policy the answer is unknown,
 *    never guessed, never zero.
 *
 *  - freshness age is computed from the DATA time (observed_at, else
 *    valid_at, else issued_at) — NEVER from received_at and never from a
 *    React/query cache age, which carry no environmental meaning;
 *  - unknown age is null, never zero;
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
  /**
   * True while the transport/payload for this source is still pending — the
   * deterministic path to availability `loading` (review finding 2). Known
   * failures (license / transport error / schema mismatch) still outrank it:
   * a resolved fact beats a pending flag.
   */
  loading?: boolean;
  /** Did the payload match the contracted schema? (guard-checked upstream) */
  schemaValid?: boolean;
  /** Did the provider return a non-empty payload? (empty ≠ zero value) */
  dataPresent?: boolean;
  /** Is the specific station/target present (feed may be healthy without it)? */
  stationPresent?: boolean;
  /** Data age in ms from computeFreshnessAge; null = unknown. */
  ageMs?: number | null;
  /** Stale threshold in ms from verified provider cadence (freshness policy). */
  staleBeyondMs?: number | null;
  /** License/terms gate failed → nothing may be displayed from this source. */
  licenseBlocked?: boolean;
}

/**
 * Ordered availability state machine:
 * license_blocked > error > schema_mismatch > loading > unavailable(target) >
 * empty > unavailable(unknown age) > ready.
 *
 * Staleness deliberately has no place here (canonical CMD-001 §5.1: "stale
 * is not an availability state; stale content can remain available
 * evidence") — use classifyFreshness for the age dimension.
 */
export function classifyAvailability(i: EnvIntAvailabilityInput): EnvIntAvailability {
  if (i.licenseBlocked) return "license_blocked";
  if (i.httpState === "error" || i.httpState === "timeout") return "error";
  if (i.schemaValid === false) return "schema_mismatch";
  if (i.loading) return "loading";
  if (i.stationPresent === false) return "unavailable";
  if (i.dataPresent === false) return "empty";
  if (i.ageMs === null || i.ageMs === undefined) return "unavailable";
  return "ready";
}

/** Freshness dimension, canonical vocabulary (CMD-001 §5.2). */
export type EnvIntFreshness = "current" | "stale" | "unknown";

export interface EnvIntFreshnessInput {
  /** Age in ms from computeFreshnessAge; null/absent = unknown. */
  ageMs?: number | null;
  /** Verified provider cadence policy; null/absent = no policy. */
  staleBeyondMs?: number | null;
}

/**
 * Classify freshness against a verified cadence policy. `current` requires
 * BOTH a meaningful data time and a policy (CMD-001 §5.2: only claim current
 * when a reference timestamp AND a freshness policy support it); otherwise
 * the answer is `unknown`. Age exactly at the threshold is still current —
 * stale is strictly beyond. Negative age (a forecast whose valid time is in
 * the future) is legitimate lead time, never clamped.
 */
export function classifyFreshness(i: EnvIntFreshnessInput): EnvIntFreshness {
  if (typeof i.ageMs !== "number" || !Number.isFinite(i.ageMs)) return "unknown";
  if (typeof i.staleBeyondMs !== "number" || !Number.isFinite(i.staleBeyondMs)) return "unknown";
  return i.ageMs > i.staleBeyondMs ? "stale" : "current";
}
