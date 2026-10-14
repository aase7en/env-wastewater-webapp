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
 * ENV-VIS-STORY-001B-C1 — deterministic process-scenario contract (Stage 2).
 *
 * Qualitative simulation ONLY: no numeric effects, no water-quality values,
 * no units, no observed timestamps. The domain-owner approval required
 * before numeric effects or water-quality projections remains UNPASSED —
 * this module cannot express them. Simulated output never blends into
 * LIVE/LATEST/HISTORICAL or operational writes: ScenarioState is not
 * assignable to EnvironmentalFlowModel and no adapter exists (pinned by
 * tests). `deriveScenarioState` is synchronous and pure — no clock,
 * randomness, I/O, or background computation. A hypothetical activation of
 * the bypass/emergency paths NEVER resolves their as-built
 * `needs_confirmation` tie-in (SSoT modeling rules 3–5).
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
