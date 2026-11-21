-- ENV-PERSONNEL-C8-001 — the personnel enum correction (claim
-- ENV-PERSONNEL-C8-001-C1; Track-Z GLM; WO
-- docs/work-orders/ENV-PERSONNEL-C8-001.md).
--
-- PROVENANCE / AUTHORIZATION: owner approval 2026-11-21
-- "อนุมัติทั้งหมด" = option ① of the C8 proposal presented 2026-11-20.
-- The proposal receipt attaches to this lane's handoff
-- verbatim-except-PII (docs/ai/handoffs/ENV-PERSONNEL-C8-001-GLM.md,
-- Appendix A); the original stays /tmp-only
-- (/tmp/env-c8-personnel-proposal-2026-11-20.md — it carries personnel
-- names and declares itself "ไม่ลง Git เพราะมีชื่อ-สกุลบุคลากร").
-- Authorization chain: plan C8 deferral 2026-11-15 "ให้เสนอมาภายหลัง" →
-- proposal + four-option menu 2026-11-20 → owner approval 2026-11-21.
-- The prevent-lane closeout frontier (PR #257 merged ecf4b88…) recorded
-- C8 execution as "a small gated lane once the owner picks an option" —
-- this migration IS that lane, gate answered.
--
-- D1 live re-verification 2026-11-21 (read-only Management-API probes,
-- synthetic codes only): 9 rows total; exactly 6 `active` rows, ALL
-- inside the authorized code set below; 0 `ทำงาน`; exactly 3 `ลาออก`
-- (STAFF-004/005/007); positions byte-match WO §0 row-by-row; both
-- CHECKs convalidated=false; the P1.4 recorder gate rejects all 9
-- pre-fix (STAFF-001/STAFF-008 fail the status clause).
--
-- ORDERING DEVIATION — live-DB-evidence-forced, reviewer adjudicates
-- (handoff §D3): the WO §5 D3(a)→(b)→(c) order (status UPDATE FIRST,
-- then the position-CHECK swap) is IMPOSSIBLE on the live DB. First
-- apply attempt 2026-11-21 in that exact order: statement 1 failed
-- `23514 new row for relation "personnel" violates check constraint
-- "ck_core_personnel_position_enum"` — setting status='ทำงาน' writes a
-- new row version, and 3 of the 6 target rows (STAFF-002/003/009) carry
-- positions outside the OLD 5-value CHECK, so EVERY status UPDATE on
-- them violates it. The statement rolled back atomically (guard read
-- active=6 / ทำงาน=0 after); the attempt's DROP+re-ADD+VALIDATE of the
-- position CHECK landed, leaving the verified intermediate state the
-- re-apply below converges from. The corrected forward order is
-- constraint-swap → status UPDATE → VALIDATE both: identical predicates,
-- identical authorized write surface, identical final posture. The raw
-- first-attempt log stays /tmp-only (its PG DETAIL echoes a personnel
-- name — a PII incident recorded in the handoff; never committed).
--
-- Scope: NOTHING outside core.personnel.status data + the two named
-- CHECK constraints. ZERO position cells written (option ②'s rename of
-- พนักงานเปล was REJECTED by the approval record). No column add/drop,
-- no default, no NOT NULL, no RLS/policy/grant, no other table.
-- 20261115120000_parity_p1_001.sql stays byte-identical — this
-- migration supersedes the position CHECK by DROP + re-ADD, never by
-- editing history.
--
-- Rollback: documented in the trailer below; NEVER executed unless the
-- owner orders it.

-- (b) FIRST — the position-enum extension 5 → 8 (WO §2 item 2). The 5
-- original values stay VERBATIM (20261115120000_parity_p1_001.sql:140-
-- 141); exactly 3 new real-role values are added
-- (ผู้ช่วยช่างทั่วไป / พนักงานเปล / พนักงานช่วยเหลือคนไข้) so that
-- STAFF-002/003/009's existing position cells — legal data, previously
-- outside the 5-value CHECK — become legal WITHOUT any rewrite. The
-- unused old values (นายแพทย์ / นักโภชนาการ / พนักงานประกอบอาหาร) stay:
-- the AppSheet Valid If families reference them (the หัก-นายแพทย์ gate,
-- the sample gate — WO §2 row 4). NOT VALID initially, per the P1.1
-- precedent. This swap MUST precede the status UPDATE (see the ordering
-- note above) or the UPDATE is rejected by the old CHECK.
ALTER TABLE core.personnel
  DROP CONSTRAINT ck_core_personnel_position_enum;

ALTER TABLE core.personnel
  ADD CONSTRAINT ck_core_personnel_position_enum
  CHECK (position IN ('นายแพทย์', 'พนักงานบริการ', 'นักวิชาการสาธารณสุข',
                      'นักโภชนาการ', 'พนักงานประกอบอาหาร',
                      'ผู้ช่วยช่างทั่วไป', 'พนักงานเปล',
                      'พนักงานช่วยเหลือคนไข้')) NOT VALID;

-- (a) THEN — the ONLY authorized row-write: status UPDATE keyed on the
-- synthetic employee_code set + the status='active' conjunction.
-- D1-verified pre-state: exactly these 6 rows hold `active`; the 3
-- ลาออก rows do not match the predicate and stay byte-untouched.
UPDATE core.personnel
   SET status = 'ทำงาน'
 WHERE status = 'active'
   AND employee_code IN ('STAFF-001', 'STAFF-002', 'STAFF-003',
                         'STAFF-006', 'STAFF-008', 'STAFF-009');

-- Count-pin guard (WO §5 D3(a)): aborts on any mismatch — 0 `active`
-- rows must remain and exactly 6 `ทำงาน` rows must exist. On RAISE the
-- apply run fails (exit 1) and the lane halts + reports; the D1-verified
-- exactly-6 pre-state is the pin that keeps this RAISE path unreachable
-- in the expected run.
DO $$
DECLARE
  v_active int;
  v_work   int;
BEGIN
  SELECT count(*) INTO v_active FROM core.personnel WHERE status = 'active';
  SELECT count(*) INTO v_work   FROM core.personnel WHERE status = 'ทำงาน';
  IF v_active <> 0 OR v_work <> 6 THEN
    RAISE EXCEPTION 'ENV-PERSONNEL-C8-001 count guard failed: active=% (expect 0), thamngaan=% (expect 6)',
      v_active, v_work;
  END IF;
END
$$;

-- (c) FINALLY — VALIDATE both CHECKs after the data conforms (WO §2
-- item 3 — the P1.001 owner-gated follow-up, un-gated by the
-- 2026-11-21 approval). The status CHECK is NEVER dropped/re-added in
-- the forward path — its 4-value set is already correct; only
-- convalidated flips to true.
ALTER TABLE core.personnel
  VALIDATE CONSTRAINT ck_core_personnel_position_enum;

ALTER TABLE core.personnel
  VALIDATE CONSTRAINT ck_core_personnel_status_enum;

notify pgrst, 'reload schema';

-- ROLLBACK (documented per WO §5 D3 — restores the EXACT pre-fix
-- posture; never executed unless the owner orders it):
--   UPDATE core.personnel
--      SET status = 'active'
--    WHERE status = 'ทำงาน'
--      AND employee_code IN ('STAFF-001', 'STAFF-002', 'STAFF-003',
--                            'STAFF-006', 'STAFF-008', 'STAFF-009');
--   ALTER TABLE core.personnel DROP CONSTRAINT ck_core_personnel_position_enum;
--   ALTER TABLE core.personnel
--     ADD CONSTRAINT ck_core_personnel_position_enum
--     CHECK (position IN ('นายแพทย์','พนักงานบริการ','นักวิชาการสาธารณสุข',
--                         'นักโภชนาการ','พนักงานประกอบอาหาร')) NOT VALID;
--   ALTER TABLE core.personnel DROP CONSTRAINT ck_core_personnel_status_enum;
--   ALTER TABLE core.personnel
--     ADD CONSTRAINT ck_core_personnel_status_enum
--     CHECK (status IN ('ทำงาน','ย้ายกลุ่มงาน','ลาออก','ลาศึกษาต่อ')) NOT VALID;
--   notify pgrst, 'reload schema';
-- (convalidated = false ×2 restored — the exact pre-fix posture.)
