/**
 * ENV-VIS-STORY-001B — test/lib fixture shim.
 *
 * Since ENV-VIS-STORY-001B-VIEW promoted the six scenarios to the production
 * catalog, this module simply RE-EXPORTS it (same reference, not a copy).
 * ENV-VIS-STORY-001-NUM extends the re-export surface with the cited
 * emission-factor registry the N4 tests consume. Production code must keep
 * importing from `../process-scenarios` — never from `__fixtures__/`.
 */
export {
  PROCESS_SCENARIO_CATALOG as PROCESS_SCENARIOS,
  NUMERIC_EFFECT_EMISSION_FACTORS,
} from "../process-scenarios";
