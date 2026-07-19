-- CRB-2: add carbon.reading to supabase_realtime publication.
--
-- useCarbonRollupRealtime (commit f5308f7) subscribes postgres_changes on
-- carbon.reading but the publication only had wastewater.sensor +
-- wastewater.sensor_reading — events never arrived. This is idempotent
-- (ADD TABLE errors silently if already a member).
--
-- Design: Fable5 2026-07-19 (see docs/work-orders/CRB-2-realtime-publication.md).
alter publication supabase_realtime add table carbon.reading;
