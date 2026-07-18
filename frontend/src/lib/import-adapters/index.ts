/**
 * IMP-2 — registry of per-module adapters.
 *
 * Each adapter exposes the column mapping for its module so the
 * BulkImportPage can present a dropdown of "Import → <module>".
 */
import type { Adapter } from "./types";

import { wastewaterAdapter } from "./wastewater";
import { waterSupplyAdapter } from "./water-supply";
import { fuelAdapter } from "./fuel";
import { garbageAdapter } from "./garbage";
import { gardenAdapter } from "./garden";
import { buildingAdapter } from "./building";
import { safetyAdapter } from "./safety";
import { foodAdapter } from "./food";
import { chemicalMovementAdapter } from "./chemical";

export const ADAPTERS: Adapter<unknown>[] = [
  wastewaterAdapter,
  waterSupplyAdapter,
  fuelAdapter,
  garbageAdapter,
  gardenAdapter,
  buildingAdapter,
  safetyAdapter,
  foodAdapter,
  chemicalMovementAdapter,
];

export function getAdapter(moduleId: string): Adapter<unknown> | undefined {
  return ADAPTERS.find((a) => a.moduleId === moduleId);
}

export * from "./types";
