-- DOC-1 — Regulatory reference table + Thai law seed.
--
-- Stores the laws / standards that govern each module, so the UI can
-- surface "กฎหมายที่เกี่ยวข้อง" alongside the form (DOC-2 page + per-module
-- reference panel).
--
-- Track Z scope (SQL only).
-- Idempotent.

CREATE TABLE IF NOT EXISTS core.regulation (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    citation        text NOT NULL,        -- e.g. "พ.ร.บ. สาธารณสุข 2535 ม.42"
    summary_th      text,
    applies_to      text[] NOT NULL DEFAULT '{}',  -- module ids: ['water_supply','safety',...]
    official_url    text,
    effective_date  date,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_regulation_applies_to
    ON core.regulation USING gin (applies_to);

ALTER TABLE core.regulation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS regulation_authenticated_rw ON core.regulation;
CREATE POLICY regulation_authenticated_rw
    ON core.regulation FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_audit_log ON core.regulation;
CREATE TRIGGER trg_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON core.regulation
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

COMMENT ON TABLE core.regulation IS
    'DOC-1 (2026-07-17) — Thai environmental + safety laws + standards. applies_to is a text[] of module ids. RLS authenticated-rw (admin curates).';

-- Seed core Thai regulations relevant to ENV_DB modules.
INSERT INTO core.regulation (name, citation, summary_th, applies_to, official_url, effective_date) VALUES
    ('พ.ร.บ. ส่งเสริมและรักษาคุณภาพสิ่งแวดล้อมแห่งชาติ 2535',
     'พ.ร.บ. 2535',
     'กฎหมายหลักด้านสิ่งแวดล้อม — คุ้มครองคุณภาพน้ำ/อากาศ/เสียง/ขยะ',
     ARRAY['wastewater','garbage','fuel'],
     NULL, '1992-03-29'),
    ('ประกาศกระทรวงสาธารณสุข ฉ.135 (น้ำดื่ม)',
     'ประกาศ สธ. 2534',
     'มาตรฐานคุณภาพน้ำประปาบาดาล — pH 6.5-8.5, คลอรีนอิสระ, coliform',
     ARRAY['water_supply','food'],
     NULL, '1991-01-01'),
    ('มาตรฐานน้ำทิ้ง กรมควบคุมโรค',
     'กรมควบคุมโรค',
     'ค่า DO/pH/BOD/COD ที่ระบบบำบัดต้องปล่อยได้ก่อนลงแม่น้ำ',
     ARRAY['wastewater'],
     NULL, NULL),
    ('พ.ร.บ. ป้องกันอัคคีภัย 2542',
     'พ.ร.บ. 2542',
     'บังคับให้สถานพยาบาลตรวจอุปกรณ์ดับเพลิง + ไฟฉุกเฉินรายเดือน',
     ARRAY['safety','building'],
     NULL, '1999-01-01'),
    ('พ.ร.บ. วัตถุอันตราย 2535',
     'พ.ร.บ. 2535',
     'การจัดเก็บและกำจัดสารเคมี (คลอรีน, ด่างทับทิม, สารส้ม)',
     ARRAY['chemical','wastewater'],
     NULL, '1992-03-29'),
    ('มาตรฐาน TGO 2023 Grid EF',
     'TGO/announced 2024',
     'ค่าสัมประสิทธิ์การปล่อยก๊าซเรือนกระจกของไฟฟ้า 0.4999 kgCO₂e/kWh',
     ARRAY['carbon'],
     NULL, '2023-01-01'),
    ('มาตรฐาน WHO Drinking Water',
     'WHO 4th ed.',
     'เกณฑ์สากลคุณภาพน้ำดื่ม (coliform 0, turbidity <5 NTU)',
     ARRAY['water_supply','food'],
     NULL, NULL)
ON CONFLICT DO NOTHING;
