/**
 * ENV-VIS-STORY-001B — test/lib fixture shim.
 *
 * Since ENV-VIS-STORY-001B-VIEW promoted the six scenarios to the production
 * catalog, this module simply RE-EXPORTS it (same reference, not a copy).
 * Production code must keep importing from `../process-scenarios` — never
 * from `__fixtures__/`.
 */
export { PROCESS_SCENARIO_CATALOG as PROCESS_SCENARIOS } from "../process-scenarios";
