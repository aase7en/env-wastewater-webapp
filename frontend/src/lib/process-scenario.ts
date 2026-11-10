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
    status: "pending-owner-values";
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
  /** Fail-closed reason: the sensitivity renders NOTHING, never zero. */
  reason: "no-factor" | "no-activity-base";
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
 * 2026-11-10). A sensitivity renders ONLY where both a finite activity
 * base and a cited-versioned factor exist; otherwise it is OMITTED with a
 * fail-closed reason (render nothing, never zero). No factor = no effect.
 */
export function deriveScenarioSensitivities(
  definition: ScenarioDefinition,
  inputs: { aerationBlowerRuntimeKwh?: number | null },
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
    const baseKwh = finiteOrNull(inputs.aerationBlowerRuntimeKwh);
    if (baseKwh === null) {
      omitted.push({
        id: spec.id,
        label: spec.label,
        reason: "no-activity-base",
        note: "ยังไม่มีฐานกิจกรรม (รอแผ่นอ้างอิงรอบจ่ายไฟ relay จากเจ้าของ) — ไม่แสดงผลกระทบ (ไม่แทนค่าศูนย์)",
      });
      continue;
    }
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
