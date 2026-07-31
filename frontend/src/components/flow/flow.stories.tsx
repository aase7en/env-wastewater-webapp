import { WastewaterFlowDiagram } from "./WastewaterFlowDiagram";
import { Wrapper } from "../ui/aura.stories";
import { flowDataFromRow } from "../../lib/use-flow-data";
import { DUMMY_FLOW_DATA, DUMMY_FLOW_ROW, EMPTY_FLOW_DATA } from "../../lib/flow-model";

/**
 * Ladle stories for the 2.5D flow diagram — `npm run ladle`.
 *
 * The component takes all of its state through one prop, so every branch is
 * reachable here with no network and no Supabase session. Iterate on the
 * artwork against these instead of clicking through the app.
 */

/** Nominal plant: pump1 running, pump2 off, aerator2 not recorded. */
export const Nominal = () => (
  <Wrapper>
    <WastewaterFlowDiagram data={DUMMY_FLOW_DATA} />
  </Wrapper>
);

/** Nothing logged — every metric "—", every device "ไม่ระบุ", lines idle. */
export const NoData = () => (
  <Wrapper>
    <WastewaterFlowDiagram data={EMPTY_FLOW_DATA} />
  </Wrapper>
);

/**
 * Abnormal: DO below THRESHOLDS.doMin, pH out of range, chlorine low, and the
 * system flagged abnormal — exercises the amber metrics, the attention ring,
 * and the inactive (dashed) water lines all at once.
 */
export const Abnormal = () => (
  <Wrapper>
    <WastewaterFlowDiagram
      data={flowDataFromRow({
        ...DUMMY_FLOW_ROW,
        system_operating: false,
        do_aeration: 1.2,
        ph: 9.1,
        free_chlorine: 0.2,
        aerator1_running: false,
        sludge_pump1_running: false,
      })}
    />
  </Wrapper>
);
