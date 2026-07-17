-- P20d — sensor feed foundation (v2 roadmap).
--
-- SPEC.md lists IoT sensor ingest as out-of-v1. This migration adds the
-- schema + Realtime publication wiring so a future Edge Function can write
-- telemetry rows and the frontend can subscribe via Supabase Realtime
-- channels without polling. No v1 page consumes this yet.
--
-- Idempotent throughout.

-- 1) sensor — master list of physical/logical sensors (one row per device).
CREATE TABLE IF NOT EXISTS wastewater.sensor (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code            text UNIQUE NOT NULL,
    parameter_code  text NOT NULL,
    label_th        text,
    unit            text NOT NULL,
    location_id     uuid REFERENCES core.location(id),
    is_active       boolean NOT NULL DEFAULT true,
    last_seen_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE wastewater.sensor IS 'P20d master list of telemetry sensors. parameter_code is the semantic kind (do/ph/cl/tds/temp/flow).';

-- 2) sensor_reading — one row per telemetry sample (append-only).
CREATE TABLE IF NOT EXISTS wastewater.sensor_reading (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id     uuid NOT NULL REFERENCES wastewater.sensor(id) ON DELETE CASCADE,
    taken_at      timestamptz NOT NULL DEFAULT now(),
    value         numeric(12,3) NOT NULL,
    raw           jsonb,
    inserted_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sensor_reading_sensor_time
    ON wastewater.sensor_reading (sensor_id, taken_at DESC);
COMMENT ON TABLE wastewater.sensor_reading IS 'P20d append-only telemetry samples. Inserted by ingest-sensor EF, consumed by frontend Realtime subscription.';

-- 3) Realtime publication — push INSERT events to subscribed clients.
--    Idempotent: skip tables already in the publication.
DO $$
DECLARE
    pub_exists boolean;
    sr_in_pub boolean;
    s_in_pub  boolean;
BEGIN
    SELECT EXISTS(SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') INTO pub_exists;
    IF NOT pub_exists THEN RETURN; END IF;
    SELECT EXISTS(
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'wastewater' AND tablename = 'sensor_reading'
    ) INTO sr_in_pub;
    IF NOT sr_in_pub THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE wastewater.sensor_reading;
    END IF;
    SELECT EXISTS(
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'wastewater' AND tablename = 'sensor'
    ) INTO s_in_pub;
    IF NOT s_in_pub THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE wastewater.sensor;
    END IF;
END $$;
