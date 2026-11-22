/**
 * Boundary example for ENV Core Engineering review.
 * Copy only into an authorized branch after matching repo-local Twin types.
 * Existing `TwinMetric` is authoritative; this is a presentation-only mapping.
 */
import { AERATION_TANK_ID } from '../../../lib/twin/types';
import type { TwinMetric, WastewaterTwinState } from '../../../lib/twin/types';
import type { ViewMetric, WWTPViewSnapshot } from './wwtp-model';

function viewMetric(metric: TwinMetric<number>, unit: string): ViewMetric {
  return {
    value: metric.value,
    unit,
    source: metric.source,
    observedAt: metric.observedAt,
    freshness: metric.freshness,
  };
}

/** Do not infer aeration DO from `DashboardRow.do_average`. */
export function adaptApprovedExistingTwinState(state: WastewaterTwinState): WWTPViewSnapshot {
  const aeration = state.assets[AERATION_TANK_ID];
  return {
    mode: state.mode,
    date: state.snapshotDate,
    assets: {
      T003: {
        do: viewMetric(aeration.dissolvedOxygenMgL, 'mg/L'),
        tds: viewMetric(aeration.tdsMgL, 'mg/L'),
        temperature: viewMetric(aeration.temperatureC, '°C'),
      },
    },
  };
}
