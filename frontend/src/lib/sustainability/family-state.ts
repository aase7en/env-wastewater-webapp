import type { GarbageLog } from "../garbage";
import type { RollupSummary } from "../carbon-rollup";

/**
 * ENV-WASTE-CARBON-001-C1 D1 contract — family-state derivation.
 *
 * Pure derivation over the delivered read-only contracts
 * (`useCarbonRollup` RollupSummary + `useGarbageLogs` GarbageLog[]).
 * NO new data sources, NO inference, NO invented factors. Unknown is never
 * zero: 0-row families render ไม่มีข้อมูล, never a number.
 *
 * Truth table (pinned by family-state.test.ts):
 * - electricity: CONTRIBUTING when the rollup carries known kg (badge LATEST,
 *   manual-snapshot semantics); grandTotalKg is a KNOWN total only — flag
 *   knownOnlyTotal when hasUnavailableContribution.
 * - fuel / garden_fuel / waste / chemical: UNAVAILABLE today (0 rows) →
 *   ไม่มีข้อมูล, never numeric. Waste may still show a segregation summary
 *   from garbage rows without fabricating a carbon contribution.
 * - plastic: ABSENT — no plastic category/mass/unit/factor exists anywhere
 *   (001A A–K); waste_recyclable is NOT plastic and is never relabeled.
 */

export const FAMILY_ORDER = [
  "electricity",
  "fuel",
  "garden_fuel",
  "waste",
  "chemical",
  "plastic",
] as const;

export type FamilyName = (typeof FAMILY_ORDER)[number];

export type FamilyState =
  | "CONTRIBUTING"
  | "UNAVAILABLE"
  | "ABSENT";

export type FamilyBadge = "LATEST" | "UNAVAILABLE" | "ABSENT";

export interface SegregationSummaryItem {
  label: string;
  weightKg: number | null;
}

export interface FamilyStateView {
  family: FamilyName;
  state: FamilyState;
  badge: FamilyBadge;
  /** Thai display label for the value; never numeric for unknown states. */
  valueLabel: string;
  /** Carbon contribution state — distinct from data-state. */
  contribution?: "CONTRIBUTING" | "UNAVAILABLE";
  /** True when grandTotalKg is a known subtotal, not a complete total. */
  knownOnlyTotal?: boolean;
  detail?: {
    segregation?: SegregationSummaryItem[];
  };
}

export interface TverReadinessItem {
  input: string;
  status: "DOCUMENTED" | "ABSENT" | "PARTIAL";
}

const UNAVAILABLE_LABEL = "ไม่มีข้อมูล";

/** Map rollup source labels onto the five A–K carbon source families. */
const SOURCE_FAMILY: Record<string, FamilyName> = {
  diesel: "fuel",
  gasoline: "fuel",
  lpg: "fuel",
  garden_fuel: "garden_fuel",
  waste: "waste",
  waste_organic: "waste",
  waste_recyclable: "waste",
  waste_general: "waste",
  waste_chemical: "waste",
  chemical: "chemical",
  electricity: "electricity",
};

function unavailableFamily(family: FamilyName): FamilyStateView {
  return {
    family,
    state: "UNAVAILABLE",
    badge: "UNAVAILABLE",
    valueLabel: UNAVAILABLE_LABEL,
  };
}

export function deriveFamilyStates(
  rollup: RollupSummary,
  garbage: readonly GarbageLog[],
): FamilyStateView[] {
  const states: FamilyStateView[] = [];

  // Electricity: CONTRIBUTING when the rollup carries a known positive total
  // (the D1 fixture models the real-world state: only electricity contributes;
  // grandTotalKg is the known subtotal of that contribution).
  const hasKnownKg = Number.isFinite(rollup.grandTotalKg) && rollup.grandTotalKg > 0;
  if (hasKnownKg) {
    states.push({
      family: "electricity",
      state: "CONTRIBUTING",
      badge: "LATEST",
      valueLabel: String(rollup.grandTotalKg),
      contribution: "CONTRIBUTING",
      knownOnlyTotal: rollup.hasUnavailableContribution === true,
    });
  } else {
    states.push(unavailableFamily("electricity"));
  }

  // Fuel / garden_fuel / chemical: families with 0 rows today.
  for (const family of ["fuel", "garden_fuel", "chemical"] as const) {
    states.push(unavailableFamily(family));
  }

  // Waste: carbon contribution unavailable unless waste sources carry kg;
  // a segregation summary from garbage rows never fabricates carbon.
  const wasteHasKg = rollup.rows.some(
    (row) => row.kg_co2e !== null && SOURCE_FAMILY[row.source] === "waste",
  );
  const wasteUnavailableContribution = rollup.unavailableSources.some(
    (source) => SOURCE_FAMILY[source] === "waste",
  );
  const waste: FamilyStateView = wasteHasKg
    ? {
        family: "waste",
        state: "CONTRIBUTING",
        badge: "LATEST",
        valueLabel: String(rollup.grandTotalKg),
        contribution: "CONTRIBUTING",
      }
    : {
        ...unavailableFamily("waste"),
        ...(wasteUnavailableContribution
          ? { contribution: "UNAVAILABLE" as const }
          : {}),
      };
  if (garbage.length > 0) {
    const summary = new Map<string, SegregationSummaryItem>();
    for (const row of garbage) {
      const key = row.segregation_type ?? "unclassified";
      const existing = summary.get(key);
      const weight =
        row.weight_kg === null || row.weight_kg === undefined
          ? null
          : Number(row.weight_kg) || null;
      if (existing) {
        if (existing.weightKg !== null && weight !== null) {
          existing.weightKg += weight;
        } else if (weight !== null && existing.weightKg === null) {
          existing.weightKg = weight;
        }
      } else {
        summary.set(key, { label: key, weightKg: weight });
      }
    }
    waste.detail = { segregation: [...summary.values()] };
  }
  states.push(waste);

  // Plastic: ABSENT — no plastic contract exists (001A A–K); recyclable
  // garbage rows never make plastic CONTRIBUTING.
  states.push({
    family: "plastic",
    state: "ABSENT",
    badge: "ABSENT",
    valueLabel: UNAVAILABLE_LABEL,
  });

  return states;
}

export function deriveTverReadiness(
  rollup: RollupSummary,
  _garbage: readonly GarbageLog[],
): TverReadinessItem[] {
  // Readiness-only: statuses describe whether documented inputs exist.
  // NO eligibility, status, credit estimate, or registration progress.
  void _garbage;
  const hasKnownKg = Number.isFinite(rollup.grandTotalKg) && rollup.grandTotalKg > 0;
  const factorStatus: TverReadinessItem["status"] = hasKnownKg
    ? "PARTIAL"
    : "ABSENT";
  return [
    {
      input: "ข้อมูลการใช้ไฟฟ้า (electricity consumption)",
      status: hasKnownKg ? "DOCUMENTED" : "ABSENT",
    },
    {
      input: "องค์ประกอบขยะตามหมวด (waste composition by category)",
      status: "ABSENT",
    },
    {
      input: "ค่าการปล่อยต่อแหล่งกำเนิด (per-source emission factors)",
      status: factorStatus,
    },
    {
      input: "เอกสารขอบเขต/ช่วงเวลาสำหรับการตรวจสอบ (boundary/period evidence)",
      status: "ABSENT",
    },
  ];
}
