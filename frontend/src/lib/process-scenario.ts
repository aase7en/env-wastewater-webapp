import {
  PROCESS_EXPLANATION,
  type EnvironmentalFlowActivity,
  type EnvironmentalFlowEdgeKind,
  type EnvironmentalFlowMedium,
  type ProcessExplanationEdgeId,
  type ProcessExplanationStageId,
  type ProcessExplanationTieIn,
} from "./environmental-flow";

/**
 * ENV-VIS-STORY-001B-C1 — deterministic process-scenario contract (Stage 2),
 * extended by ENV-VIS-STORY-001-NUM (owner numeric gate N3+N4 2026-11-10).
 *
 * The QUALITATIVE contract (deriveScenarioState) stays frozen: no numeric
 * effects, no water-quality values, no units, no observed timestamps in its
 * output. The numeric derivations below (ENV-VIS-STORY-001-NUM) are
 * separate typed outputs bound to the owner-approved packet tier-2 rules:
 * SIMULATED-labeled, unit-explicit, assumption-basis-stated, never blended
 * into LIVE/LATEST/HISTORICAL or operational writes, and never substituting
 * zero for unknown (ห้ามแทนค่าศูนย์). N1 is rejected; N2 stays deferred
 * pending the owner's relay duty-cycle reference sheet. Both derivation
 * entry points are synchronous and pure — no clock, randomness, I/O, or
 * background computation. A hypothetical activation of the bypass/emergency
 * paths NEVER resolves their as-built `needs_confirmation` tie-in (SSoT
 * modeling rules 3–5).
 */

export type ScenarioEdgeCondition = "active-path" | "interrupted";
export type ScenarioEdgeStateLabel = "baseline" | ScenarioEdgeCondition;

export interface ScenarioProvenance {
  source: "simulation";
  /** Nothing was observed — a scenario is hypothetical by construction. */
  observedAt: null;
}

export interface ScenarioDefinition {
  id: string;
  /** Thai label; explicitly hypothetical wording (สมมุติ). */
  label: string;
  provenance: ScenarioProvenance;
  /** Preserved assumptions (roadmap Stage-2 safeguard). */
  assumptions: string[];
  edgeOverrides: Partial<Record<ProcessExplanationEdgeId, ScenarioEdgeCondition>>;
  /**
   * Qualitative stage override — C1 allows exactly ONE shape: interrupting
   * the aeration process. Turning off a WATER edge instead would claim an
   * unsupported hydraulic effect (Role A finding).
   */
  stageOverrides?: { aeration_tank?: { aeration: "interrupted" } };
  /**
   * ENV-VIS-STORY-001-NUM: optional typed numeric-effect declarations
   * (owner numeric gate N3+N4 2026-11-10). Declarations only — the numbers
   * live in deriveScenarioWasDifference / deriveScenarioSensitivities,
   * never in deriveScenarioState's qualitative output.
   */
  numericEffects?: ScenarioNumericEffects;
}

export interface ScenarioEdgeState {
  id: ProcessExplanationEdgeId;
  from: string;
  to: string;
  medium: EnvironmentalFlowMedium;
  kind: EnvironmentalFlowEdgeKind;
  activity: EnvironmentalFlowActivity;
  tieIn: ProcessExplanationTieIn;
  note?: string;
  scenarioState: ScenarioEdgeStateLabel;
}

export interface ScenarioStageState {
  id: ProcessExplanationStageId;
  label: string;
  scenarioProcess?: "process-interrupted";
}

export interface ScenarioState {
  scenarioId: string;
  provenance: ScenarioProvenance;
  edges: ScenarioEdgeState[];
  stages: ScenarioStageState[];
}

/**
 * Derive the full hypothetical process state for one scenario definition.
 * All edges are returned in stable PROCESS_EXPLANATION order; topology
 * fields (medium/kind/activity/tieIn/note) are retained untouched and the
 * hypothetical condition lives ONLY in `scenarioState`/`scenarioProcess`.
 * Unknown edge IDs fail closed with UNKNOWN_SCENARIO_EDGE.
 */
export function deriveScenarioState(definition: ScenarioDefinition): ScenarioState {
  const knownIds = new Set<string>(PROCESS_EXPLANATION.edges.map((edge) => edge.id));
  for (const key of Object.keys(definition.edgeOverrides ?? {})) {
    if (!knownIds.has(key)) {
      throw new Error(`UNKNOWN_SCENARIO_EDGE: ${key}`);
    }
  }

  const aerationInterrupted = definition.stageOverrides?.aeration_tank?.aeration === "interrupted";

  return {
    scenarioId: definition.id,
    provenance: definition.provenance,
    edges: PROCESS_EXPLANATION.edges.map((edge) => ({
      ...edge,
      scenarioState: definition.edgeOverrides[edge.id] ?? "baseline",
    })),
    stages: PROCESS_EXPLANATION.stages.map((stage) =>
      aerationInterrupted && stage.id === "aeration_tank"
        ? { id: stage.id, label: stage.label, scenarioProcess: "process-interrupted" as const }
        : { id: stage.id, label: stage.label },
    ),
  };
}

/**
 * ENV-VIS-STORY-001-NUM — simulated numeric effects (owner numeric gate
 * N3+N4 decision 2026-11-10, recorded on issue #110; packet tier-2
 * MODEL-ASSUMPTION-BOUND). Separate from the frozen qualitative contract
 * above: deriveScenarioState never carries numbers. Every output is
 * SIMULATED, typed, unit-explicit, never blended into observed evidence,
 * and NEVER substitutes zero for unknown (ห้ามแทนค่าศูนย์). N1 is rejected
 * and N2 stays deferred pending the owner's relay duty-cycle reference —
 * neither has a derivation here. Synchronous and pure like the contract
 * above: no clock, randomness, or I/O.
 */

/** Declared model-assumption input (the only N3 assumption class shipped). */
export interface ScenarioAssumedVolume {
  value: number;
  unit: "m³/วัน";
  assumptionClass: "declared-model-assumption";
  /** Versioned assumption id — replace only through a reviewed slice. */
  assumptionId: string;
  /** Thai basis note shown to the user (SIMULATED labeling is mandatory). */
  note: string;
}

/** Optional typed numeric-effect declarations on a scenario definition. */
export interface ScenarioNumericEffects {
  wasDifference?: { proposed: ScenarioAssumedVolume };
  sensitivities?: Array<ScenarioSensitivitySpec>;
}

/**
 * D5 P2-3 — owner-admissible activity-base statuses. An effect computes only
 * from `confirmed-by-owner` evidence; `pending-owner-values` is the shipped
 * declaration today and always derives to an omission.
 */
export type ScenarioActivityBaseStatus = "confirmed-by-owner" | "pending-owner-values";

/**
 * D5 P2-3 — typed activity-base evidence envelope. A bare number is never an
 * acceptable base: provenance (source id), owner-admission status, and the
 * evaluation period must travel with the value. The period must match the
 * scenario evaluation semantics (per-day, "daily"). R2 P2-1: the sourceId
 * must be a non-empty string and strictly equal to the scenario spec's
 * declared activityBase.sourceId at derivation time.
 */
export interface ScenarioActivityBaseEvidence {
  sourceId: string;
  status: ScenarioActivityBaseStatus;
  period: "daily";
  value: number;
}

/**
 * N4 spec: a sensitivity exists ONLY where both a scenario-specific
 * activity base AND a cited-versioned factor exist at derivation time.
 * The relay duty-cycle reference sheet (owner-filled) is the intended
 * activity-base source; until it is filled, every spec derives to an
 * explicit omission — never to zero.
 */
export interface ScenarioSensitivitySpec {
  id: string;
  label: string;
  factorId: string;
  activityBase: {
    kind: "aeration-blower-runtime-kwh";
    sourceId: "relay-duty-cycle-reference";
    status: ScenarioActivityBaseStatus;
  };
  formula: "activityBaseKwh × factorKgCo2ePerKwh";
}

/** Cited-versioned emission factor (N4 registry entry). */
export interface EmissionFactor {
  id: string;
  kind: "grid-electricity" | "fallback-class";
  name: string;
  /** null only for fallback-class entries (a declared class, no bound value). */
  value: number | null;
  unit: string | null;
  source: string;
  version: string;
  uncertaintyClass: string;
  applicability: string;
  sourceUrl?: string;
}

export interface ScenarioWasDifferenceEffect {
  kind: "was-difference";
  scenarioId: string;
  provenance: ScenarioProvenance;
  proposed: ScenarioAssumedVolume;
  /**
   * The RECORDED excess-sludge evidence for the relevant scope — carried
   * separately, displayed with precedence, never overwritten (owner rule).
   */
  recorded: {
    field: "excess_sludge_removed";
    value: number;
    unit: "m³";
    period: "daily";
  } | null;
  /** proposed − recorded; uncomputable without a recorded value (never 0). */
  difference: number | null;
  displayPrecedence: "recorded" | "simulated";
  formula: "proposed − recorded";
  uncertaintyNote: string;
}

export interface ScenarioSensitivityEffect {
  kind: "electricity-grid-emission";
  id: string;
  label: string;
  value: number;
  unit: "kgCO2e/วัน";
  baseKwh: number;
  factor: EmissionFactor;
  formula: string;
  note: string;
  provenance: ScenarioProvenance;
}

export interface ScenarioSensitivityOmission {
  id: string;
  label: string;
  /**
   * Fail-closed reason: the sensitivity renders NOTHING, never zero.
   * D5 P2-2 adds `invalid-factor-metadata` (missing citation/version/unit);
   * D5 P2-3 adds the activity-base evidence gates; R2 P2-1 adds
   * `activity-base-source-mismatch` (evidence sourceId must be a non-empty
   * string strictly equal to the declared activity-base source).
   */
  reason:
    | "no-factor"
    | "invalid-factor-metadata"
    | "no-activity-base"
    | "activity-base-source-mismatch"
    | "activity-base-unconfirmed"
    | "activity-base-period-mismatch";
  note: string;
}

export interface ScenarioSensitivitiesResult {
  rendered: ScenarioSensitivityEffect[];
  omitted: ScenarioSensitivityOmission[];
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * D5 P2-1 — honest numeric display. At the established 3-decimal display
 * precision a genuinely nonzero value (e.g. 0.0004 m³/วัน) must NEVER
 * collapse to a bare "0" (a display-level zero substitution, ห้ามแทนค่าศูนย์
 * at display level): the precision escalates (extra decimals, compact
 * scientific-ish form for extreme magnitudes) so the shown text stays true.
 * Only an EXACT zero may display "0". Null/non-finite → null (render nothing).
 */
export function formatScenarioNumber(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (value === 0) return "0";
  const atDisplayPrecision = Number.parseFloat(value.toFixed(3));
  if (atDisplayPrecision !== 0) return String(atDisplayPrecision);
  return String(Number.parseFloat(value.toPrecision(12)));
}

/**
 * D5 P3-plus — Buddhist-Era (พ.ศ.) factor-version display. User-facing years
 * in a factor version identifier are rendered as พ.ศ. (CE + 543) while the
 * original CE digits stay inline in parentheses for traceability. The
 * contract expects CE-authored version strings (Thai พ.ศ. years must not be
 * embedded in version identifiers); the underlying factor.version string is
 * never mutated — formatting is display-only.
 *
 * R2 P3-3 — year-token scoping: ONLY STANDALONE year-like tokens convert.
 * A token immediately preceded or followed by a word character or a dot is
 * part of a quantity/version identifier (digits inside decimals like
 * "0.2022"/"0.4750", dotted identifiers like "v1.2022") and must stay
 * untouched. Hyphen-separated ranges ("2022-2024") still convert BOTH
 * years, and space-separated tokens ("ปี 2026") convert. Implemented as a
 * split-token transform with explicit neighbor checks instead of regex
 * lookbehind: Vite's default browser target includes Safari 16, which does
 * not support lookbehind (added in Safari 16.4) — the transform keeps the
 * formatting deterministic across every supported engine.
 */
const FACTOR_VERSION_CE_YEAR_PATTERN = /(?:1[6-9]\d{2}|2\d{3})/g;
/** Characters that make an adjacent year-like token NON-standalone. */
const FACTOR_VERSION_YEAR_NEIGHBOR = /[A-Za-z0-9_.]/;

export function formatScenarioFactorVersion(version: string): string {
  const segments: string[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = FACTOR_VERSION_CE_YEAR_PATTERN.exec(version)) !== null) {
    const token = match[0];
    const start = match.index;
    const end = start + token.length;
    const prevChar = start > 0 ? version[start - 1] : "";
    const nextChar = end < version.length ? version[end] : "";
    segments.push(version.slice(cursor, start));
    if (
      !FACTOR_VERSION_YEAR_NEIGHBOR.test(prevChar) &&
      !FACTOR_VERSION_YEAR_NEIGHBOR.test(nextChar)
    ) {
      const ce = Number.parseInt(token, 10);
      segments.push(`${ce + 543} พ.ศ. (${token} ค.ศ.)`);
    } else {
      segments.push(token);
    }
    cursor = end;
  }
  segments.push(version.slice(cursor));
  return segments.join("");
}

/**
 * N3 — excess-sludge (WAS) volume difference (owner-approved 2026-11-10).
 * Returns null when the definition declares no proposed volume (no
 * declaration = no effect). Recorded evidence is carried separately with
 * display precedence; without it the difference is UNCOMPUTABLE (null) and
 * display precedence falls to the SIMULATED proposed value — zero is never
 * substituted for unknown.
 */
export function deriveScenarioWasDifference(
  definition: ScenarioDefinition,
  recorded: number | null,
): ScenarioWasDifferenceEffect | null {
  const proposed = definition.numericEffects?.wasDifference?.proposed;
  if (!proposed || finiteOrNull(proposed.value) === null) return null;

  const recordedValue = finiteOrNull(recorded);
  return {
    kind: "was-difference",
    scenarioId: definition.id,
    provenance: { source: "simulation", observedAt: null },
    proposed,
    recorded:
      recordedValue === null
        ? null
        : { field: "excess_sludge_removed", value: recordedValue, unit: "m³", period: "daily" },
    difference: recordedValue === null ? null : proposed.value - recordedValue,
    displayPrecedence: recordedValue === null ? "simulated" : "recorded",
    formula: "proposed − recorded",
    uncertaintyNote:
      "ความไม่แน่นอน: สูง — ผลลัพธ์จากสมมติฐานแบบจำลอง (SIMULATED) ไม่ใช่การสังเกตในสนาม และไม่ใช่การคาดการณ์คุณภาพน้ำ",
  };
}

/**
 * N4 — resource/emission sensitivities (owner-approved contingent
 * 2026-11-10; evidence-gated per D5 repairs + R2 repairs). A sensitivity
 * renders ONLY where an owner-confirmed, per-day activity base from the
 * DECLARED source AND a fully-cited kgCO2e/kWh factor exist; otherwise it
 * is OMITTED with a fail-closed reason (render nothing, never zero). No
 * factor = no effect. Gates, in order: factor presence/kind/value
 * (`no-factor`), factor citation metadata with runtime type-guards
 * (`invalid-factor-metadata`, D5 P2-2 + R2 P2-2), base presence/finite
 * (`no-activity-base`), evidence source binding — the envelope sourceId
 * must be a non-empty string strictly equal to the declared
 * `activityBase.sourceId` (`activity-base-source-mismatch`, R2 P2-1),
 * owner confirmation — both the DECLARED spec status and the input
 * evidence status must be confirmed-by-owner
 * (`activity-base-unconfirmed`, D5 P2-3), and evaluation-period match
 * (`activity-base-period-mismatch`, D5 P2-3). A bare number is never an
 * acceptable base: the input must carry the typed evidence envelope.
 */
export function deriveScenarioSensitivities(
  definition: ScenarioDefinition,
  inputs: { aerationBlowerRuntimeKwh?: ScenarioActivityBaseEvidence | null },
  registry: readonly EmissionFactor[],
): ScenarioSensitivitiesResult {
  const rendered: ScenarioSensitivityEffect[] = [];
  const omitted: ScenarioSensitivityOmission[] = [];

  for (const spec of definition.numericEffects?.sensitivities ?? []) {
    const factor = registry.find((candidate) => candidate.id === spec.factorId);
    if (!factor || factor.kind !== "grid-electricity" || finiteOrNull(factor.value) === null) {
      omitted.push({
        id: spec.id,
        label: spec.label,
        reason: "no-factor",
        note: "ยังไม่มีแฟกทอร์อ้างอิงที่กำกับเวอร์ชันรองรับ — ไม่แสดงผลกระทบ (ไม่แทนค่าศูนย์)",
      });
      continue;
    }
    // D5 P2-2 + R2 P2-2 — factor admission validation: a factor whose
    // source/version metadata is missing, null, or empty at runtime is not
    // admissible evidence, even when a value is present. Runtime type-guards
    // run FIRST so a shape violation fails closed (omitted) instead of
    // throwing TypeError on .trim().
    if (
      typeof factor.source !== "string" ||
      typeof factor.version !== "string" ||
      factor.source.trim().length === 0 ||
      factor.version.trim().length === 0 ||
      factor.unit !== "kgCO2e/kWh"
    ) {
      omitted.push({
        id: spec.id,
        label: spec.label,
        reason: "invalid-factor-metadata",
        note:
          "แฟกทอร์อ้างอิงไม่ครบข้อมูลกำกับ (แหล่งอ้างอิง/เวอร์ชัน/หน่วย kgCO2e/kWh) — ไม่แสดงผลกระทบ (ไม่แทนค่าศูนย์)",
      });
      continue;
    }
    // D5 P2-3 — typed activity-base evidence envelope (never a bare number).
    const base = inputs.aerationBlowerRuntimeKwh ?? null;
    if (!base || finiteOrNull(base.value) === null) {
      omitted.push({
        id: spec.id,
        label: spec.label,
        reason: "no-activity-base",
        note: "ยังไม่มีฐานกิจกรรม (รอแผ่นอ้างอิงรอบจ่ายไฟ relay จากเจ้าของ) — ไม่แสดงผลกระทบ (ไม่แทนค่าศูนย์)",
      });
      continue;
    }
    // R2 P2-1 — evidence source binding: the envelope sourceId must be a
    // non-empty string AND strictly equal to the scenario spec's declared
    // activityBase.sourceId. Evidence from any other source (or with a
    // blank/runtime-missing sourceId) never computes.
    if (
      typeof base.sourceId !== "string" ||
      base.sourceId.length === 0 ||
      base.sourceId !== spec.activityBase.sourceId
    ) {
      omitted.push({
        id: spec.id,
        label: spec.label,
        reason: "activity-base-source-mismatch",
        note:
          "แหล่งอ้างอิงของฐานกิจกรรมไม่ตรงกับแหล่งที่ประกาศในสถานการณ์ (sourceId) — ไม่แสดงผลกระทบ (ไม่แทนค่าศูนย์)",
      });
      continue;
    }
    if (spec.activityBase.status !== "confirmed-by-owner" || base.status !== "confirmed-by-owner") {
      omitted.push({
        id: spec.id,
        label: spec.label,
        reason: "activity-base-unconfirmed",
        note:
          "ฐานกิจกรรมยังไม่ได้รับการยืนยันจากเจ้าของ (ทั้งประกาศและหลักฐานต้องเป็น confirmed-by-owner) — ไม่แสดงผลกระทบ (ไม่แทนค่าศูนย์)",
      });
      continue;
    }
    if (base.period !== "daily") {
      omitted.push({
        id: spec.id,
        label: spec.label,
        reason: "activity-base-period-mismatch",
        note: "ฐานกิจกรรมไม่ตรงกับช่วงเวลาประเมินของสถานการณ์ (รายวัน) — ไม่แสดงผลกระทบ (ไม่แทนค่าศูนย์)",
      });
      continue;
    }
    const baseKwh = base.value as number;
    const factorValue = factor.value as number;
    rendered.push({
      kind: "electricity-grid-emission",
      id: spec.id,
      label: spec.label,
      value: baseKwh * factorValue,
      unit: "kgCO2e/วัน",
      baseKwh,
      factor,
      formula: spec.formula,
      note:
        "SIMULATED — ฐานกิจกรรม × แฟกทอร์อ้างอิงฉบับกำกับเวอร์ชัน ไม่ใช่ข้อมูลจริงและไม่ใช่การคาดการณ์คุณภาพน้ำ",
      provenance: { source: "simulation", observedAt: null },
    });
  }

  return { rendered, omitted };
}
