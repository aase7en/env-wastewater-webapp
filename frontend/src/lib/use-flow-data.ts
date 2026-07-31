/**
 * useFlowData — the single data source for `WastewaterFlowDiagram`.
 *
 * Follows the same contract as the other read hooks in `lib/hooks.ts`
 * ({ data, loading, error, refresh }) so swapping the dummy fixture for a
 * real query later does not change a single line in the component.
 *
 * Today it returns `DUMMY_FLOW_DATA` synchronously. The two real producers
 * are stubbed below with the exact query each needs — see `mode`.
 */
import { useCallback, useMemo, useState } from "react";
import {
  DUMMY_FLOW_DATA,
  toFlowModel,
  type FlowDiagramData,
  type FlowSource,
} from "./flow-model";

export type FlowDataMode = "dummy" | "daily-reading" | "live-sensor";

export interface FlowDataState {
  data: FlowDiagramData;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * @param mode Which producer to read from. Only `"dummy"` is implemented;
 *   the other two throw at the call site rather than silently returning
 *   fixture data dressed up as real measurements.
 *
 * When wiring `"daily-reading"`, query `v_reading_with_computed` (not
 * `v_dashboard_14day` — that view exposes neither the per-stage DO/TDS
 * columns nor the 10 `*_running` booleans the diagram needs):
 *
 *   const { data } = await supabase
 *     .from("v_reading_with_computed")
 *     .select("*")
 *     .order("reading_date", { ascending: false })
 *     .limit(1);
 *   return toFlowModel(data[0] as FlowSource, "daily-reading");
 *
 * For `"live-sensor"`, fold `useSensorFeed()`'s newest sample per
 * `parameter_code` into a FlowSource, then call `toFlowModel(row, "live-sensor")`.
 */
export function useFlowData(mode: FlowDataMode = "dummy"): FlowDataState {
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const data = useMemo<FlowDiagramData>(() => {
    // `nonce` is the refresh trigger; it has no effect while mode is "dummy"
    // but keeps the memo honest once a real fetch lands here.
    void nonce;
    if (mode === "dummy") return DUMMY_FLOW_DATA;
    throw new Error(
      `useFlowData: mode "${mode}" is not implemented yet — see the JSDoc for the query to add.`,
    );
  }, [mode, nonce]);

  return { data, loading: false, error: null, refresh };
}

/**
 * Escape hatch for previews and tests: build a view model from an arbitrary
 * partial reading without going through a hook.
 */
export function flowDataFromRow(
  row: FlowSource,
  source: FlowDiagramData["source"] = "dummy",
): FlowDiagramData {
  return toFlowModel(row, source);
}
