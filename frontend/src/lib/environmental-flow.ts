export type EnvironmentalFlowMedium = "water" | "sludge" | "chemical";
export type EnvironmentalFlowEdgeKind = "normal" | "return" | "exception";
export type EnvironmentalFlowActivity = "structural" | "unknown";

/**
 * ENV-VIS-STORY-001A — static process-EXPLANATION topology (Stage 1).
 *
 * Derived from the process-topology SSoT
 * (docs/ai/digital-twin/11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md,
 * Recommended Process Graph + modeling rules 1–5). Teaching data only:
 * NO readings, timestamps, rates, equipment states, or simulation
 * vocabulary. A drawn pipe proves a connection, never current flow —
 * bypass/emergency stay `activity: "unknown"` with a
 * `needs_confirmation` tie-in and must never animate as flowing.
 * `toEnvironmentalFlowModel()` derives its edge identities/endpoints
 * from this contract so the project has ONE topology authority.
 */
export type ProcessExplanationTieIn = "confirmed" | "needs_confirmation";

export interface ProcessExplanationStage {
  id: string;
  /** Thai teaching label (educational, never an operational claim). */
  label: string;
}

export interface ProcessExplanationEdge {
  id: string;
  from: string;
  to: string;
  medium: EnvironmentalFlowMedium;
  kind: EnvironmentalFlowEdgeKind;
  activity: EnvironmentalFlowActivity;
  tieIn: ProcessExplanationTieIn;
  /** Thai uncertainty note, used on the exception paths only. */
  note?: string;
}

export interface ProcessExplanation {
  stages: readonly ProcessExplanationStage[];
  edges: readonly ProcessExplanationEdge[];
}

export const PROCESS_EXPLANATION: ProcessExplanation = {
  stages: [
    { id: "influent_collection", label: "ระบบรวบรวมน้ำเสีย" },
    { id: "pump_sump", label: "บ่อพัก / เครื่องสูบ" },
    { id: "fine_screen", label: "ตะแกรงละเอียด" },
    { id: "aeration_tank", label: "บ่อเติมอากาศ" },
    { id: "secondary_clarifier", label: "บ่อตกตะกอน" },
    { id: "flow_measurement_weir", label: "บ่อวัดอัตราการไหล" },
    { id: "chlorine_contact_tank", label: "บ่อสัมผัสคลอรีน" },
    { id: "treated_effluent_outfall", label: "จุดระบายน้ำทิ้ง" },
  ],
  edges: [
    { id: "influent-entry", from: "influent_collection", to: "pump_sump", medium: "water", kind: "normal", activity: "structural", tieIn: "confirmed" },
    { id: "pump-sump-to-screening", from: "pump_sump", to: "fine_screen", medium: "water", kind: "normal", activity: "structural", tieIn: "confirmed" },
    { id: "screening-to-aeration", from: "fine_screen", to: "aeration_tank", medium: "water", kind: "normal", activity: "structural", tieIn: "confirmed" },
    { id: "aeration-to-clarifier", from: "aeration_tank", to: "secondary_clarifier", medium: "water", kind: "normal", activity: "structural", tieIn: "confirmed" },
    { id: "clarifier-to-weir", from: "secondary_clarifier", to: "flow_measurement_weir", medium: "water", kind: "normal", activity: "structural", tieIn: "confirmed" },
    { id: "weir-to-chlorine", from: "flow_measurement_weir", to: "chlorine_contact_tank", medium: "water", kind: "normal", activity: "structural", tieIn: "confirmed" },
    { id: "chlorine-to-outfall", from: "chlorine_contact_tank", to: "treated_effluent_outfall", medium: "water", kind: "normal", activity: "structural", tieIn: "confirmed" },
    { id: "ras-return", from: "secondary_clarifier", to: "aeration_tank", medium: "sludge", kind: "return", activity: "structural", tieIn: "confirmed" },
    { id: "was-to-drying-beds", from: "secondary_clarifier", to: "sludge_drying_beds", medium: "sludge", kind: "normal", activity: "structural", tieIn: "confirmed" },
    { id: "filtrate-return", from: "sludge_drying_beds", to: "pump_sump", medium: "water", kind: "return", activity: "structural", tieIn: "confirmed" },
    { id: "chlorine-dosing", from: "chlorine_solution_storage", to: "chlorine_contact_tank", medium: "chemical", kind: "normal", activity: "structural", tieIn: "confirmed" },
    { id: "pump-sump-bypass", from: "pump_sump", to: "flow_measurement_weir", medium: "water", kind: "exception", activity: "unknown", tieIn: "needs_confirmation", note: "เส้นทางรอง — ยังไม่ยืนยันการเชื่อมต่อจริงและไม่แสดงการไหลปัจจุบัน" },
    { id: "emergency-overflow", from: "pump_sump", to: "flow_measurement_weir", medium: "water", kind: "exception", activity: "unknown", tieIn: "needs_confirmation", note: "เส้นทางล้นฉุกเฉิน — ยังไม่ยืนยันการเชื่อมต่อจริงและไม่แสดงการไหลปัจจุบัน" },
  ],
};

export interface EnvironmentalFlowReading {
  reading_date?: string | null;
  water_used_total?: number | string | null;
  wastewater_in?: number | string | null;
  excess_sludge_removed?: number | string | null;
  wastewater_discharged?: boolean | null;
  input_source?: string | null;
}

export interface EnvironmentalFlowQuantity {
  field: "water_used_total" | "wastewater_in" | "excess_sludge_removed";
  value: number | null;
  unit: "m³";
  medium: EnvironmentalFlowMedium;
  period: "daily";
}

export interface EnvironmentalFlowEdge {
  id: string;
  from: string;
  to: string;
  medium: EnvironmentalFlowMedium;
  kind: EnvironmentalFlowEdgeKind;
  activity: EnvironmentalFlowActivity;
  quantity: number | null;
  unit: "m³" | null;
}

export interface EnvironmentalFlowModel {
  asOf: string | null;
  sourceType: "manual-latest" | "recorded-latest";
  quantities: {
    waterUse: EnvironmentalFlowQuantity;
    influent: EnvironmentalFlowQuantity;
    excessSludge: EnvironmentalFlowQuantity;
  };
  discharge: {
    recorded: boolean | null;
    quantity: null;
  };
  edges: EnvironmentalFlowEdge[];
}

function finiteNumberOrNull(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function edge(
  id: string,
  from: string,
  to: string,
  medium: EnvironmentalFlowMedium,
  kind: EnvironmentalFlowEdgeKind = "normal",
  activity: EnvironmentalFlowActivity = "structural",
  quantity: number | null = null,
): EnvironmentalFlowEdge {
  return {
    id,
    from,
    to,
    medium,
    kind,
    activity,
    quantity,
    unit: quantity === null ? null : "m³",
  };
}

/**
 * Build the truthful wastewater environmental-flow model from one latest
 * manual daily reading.
 *
 * The model deliberately distinguishes structural topology from measured
 * quantity. A measured influent volume is attached only to the plant-entry
 * edge; it is never propagated through downstream treatment stages. Likewise,
 * the wastewater_discharged boolean is retained only as a recorded state and
 * is never converted into an effluent volume.
 */
export function toEnvironmentalFlowModel(
  reading: EnvironmentalFlowReading | null,
): EnvironmentalFlowModel {
  const waterUse = finiteNumberOrNull(reading?.water_used_total);
  const influent = finiteNumberOrNull(reading?.wastewater_in);
  const excessSludge = finiteNumberOrNull(reading?.excess_sludge_removed);

  return {
    asOf: reading?.reading_date?.trim() || null,
    sourceType: reading?.input_source === "manual" ? "manual-latest" : "recorded-latest",
    quantities: {
      waterUse: {
        field: "water_used_total",
        value: waterUse,
        unit: "m³",
        medium: "water",
        period: "daily",
      },
      influent: {
        field: "wastewater_in",
        value: influent,
        unit: "m³",
        medium: "water",
        period: "daily",
      },
      excessSludge: {
        field: "excess_sludge_removed",
        value: excessSludge,
        unit: "m³",
        medium: "sludge",
        period: "daily",
      },
    },
    discharge: {
      recorded: reading?.wastewater_discharged ?? null,
      quantity: null,
    },
    edges: PROCESS_EXPLANATION.edges.map((explanation) =>
      edge(
        explanation.id,
        explanation.from,
        explanation.to,
        explanation.medium,
        explanation.kind,
        explanation.activity,
        explanation.id === "influent-entry"
          ? influent
          : explanation.id === "was-to-drying-beds"
            ? excessSludge
            : null,
      ),
    ),
  };
}
