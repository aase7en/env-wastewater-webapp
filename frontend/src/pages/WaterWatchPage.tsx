import { WaterWatchDashboard } from "../features/water-watch/WaterWatchDashboard";
import { simulatedWaterWatchSnapshot } from "../features/water-watch/model";

/**
 * ENV-WATER-WATCH-001 public visual slice.
 *
 * Deliberately uses SIMULATED data only. Real provider adapters and risk
 * semantics are separate reviewed Core Engineering work orders.
 */
export function WaterWatchPage() {
  return <WaterWatchDashboard snapshot={simulatedWaterWatchSnapshot} />;
}
