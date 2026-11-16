-- ============================================================================
-- ENV-PARITY-P2-002 C1 — extinguisher per-unit inspection flow (AppSheet
-- parity Phase 2, lane P2.2) — NEW table + RLS + QR auto-fill RPC +
-- Update_ExpDate trigger + public façades. ZERO seed rows.
-- ============================================================================
-- Lane: Track-Z (GLM). Work Order: docs/work-orders/ENV-PARITY-P2-002.md
-- (plan §6 Phase 2 row P2.2). Handoff:
-- docs/ai/handoffs/ENV-PARITY-P2-002-GLM.md. Claim-claim R2 verdict
-- (issuecomment-6921736220) corrections applied here:
--
--   P3-1  "core.personnel does not exist" was a FALSE premise — it EXISTS
--         (v2 baseline, 9 rows live-verified 2026-11-16: PK `id uuid`,
--         `employee_code text NOT NULL`, position/status TEXT with the
--         P1.1 NOT-VALID enum CHECKs; `personnel_read` authenticated
--         SELECT policy; `public.personnel` façade; C8 pending = owner
--         approval of the enum VALUES, not table existence; no
--         auth<->personnel linkage column). The coordinator instruction
--         therefore binds the inspector ref to core.personnel — following
--         the wastewater daily form's ผู้บันทึก pattern — NOT the
--         auth-uuid convention the WO §3.1 wording assumed:
--           inspector_id uuid NULL REFERENCES core.personnel(id)
--         The AppSheet Valid If (ref 3358-3382) is enforced as a UI filter
--         (frontend/src/lib/extinguisher-inspection.ts isEligibleInspector)
--         transcribed VERBATIM: position ∈ {นักวิชาการสาธารณสุข,
--         พนักงานบริการ} ∧ status ≠ 'ลาออก' — note this is the ≠ลาออก
--         form, deliberately NOT the P1.4 recorder's =ทำงาน form (the
--         reference says ≠ลาออก; live statuses include the legacy alias
--         'active', which the verbatim rule admits and =ทำงาน would not).
--         The SWITCH(USEREMAIL()) init (ref 3362-3374) is NOT replicated:
--         no auth↔personnel mapping column exists (R2-verified) — the
--         picker starts empty rather than guessing (unknown stays unknown).
--   P3-2  inspection `type` blanks are OCCASIONAL (2/858; master-side
--         blanks propagate), not "frequent" — blank ⇒ NULL rule unchanged.
--
-- Additional coordinator binding vs WO §4.3 wording: the RPC is SECURITY
-- INVOKER (RLS respected) instead of the WO's SECURITY DEFINER + gate —
-- the staff-or-admin read gate is enforced by the P2.1 master SELECT
-- policy itself (an anon/outsider sees no master row ⇒ the same verbatim
-- unknown-id error; no definer privilege escalation is needed to READ).
-- The TRIGGER stays SECURITY DEFINER per WO §5 (staff have no master
-- UPDATE policy — the definer path is the ONLY staff bump path; pinned by
-- test_24).
--
-- DELIVERS (the ONE authorized supabase write of this lane):
--   1. safety.extinguisher_inspection — the 18 persisted ตรวจสอบถัง
--      columns → 17 ENV columns + provenance/audit (WO §3.1 pin);
--      defect photo is NOT a column (house attachment-link pattern:
--      core.attachment entity_type='extinguisher_inspection' +
--      entity_id = inspection id — same link shape every other domain
--      uses; D1-8)
--   2. RLS + policies + grants (house shapes; INSERT staff-or-admin —
--      this is an operational LOG, unlike the P2.1 admin-only masters;
--      UPDATE/DELETE admin-only — append-only integrity for staff)
--   3. safety.fn_resolve_extinguisher_qr(p_qr text) + public façade
--      wrapper (PostgREST exposes only `public` — the P2.1 header's
--      "P2.2 decides façades" deferral lands here)
--   4. trg_extinguisher_update_expdate AFTER INSERT — the AppSheet
--      `Update_ExpDate` bot + `_Bot_Update_EXP` action transcribed
--      VERBATIM (ref 6414-6420 + 6152-6185): bump-later-only
--      (NEW.chem_exp_snapshot > master.expiry_date — the ANY() guard with
--      a single-row master; NULL expiry/NULL chem_exp ⇒ no-op), master
--      expiry ← chem_exp_snapshot of the MAX(inspection_date) inspection
--      (latest-wins, incl. backdated inserts), deterministic tiebreak
--      (inspection_date DESC, created_at DESC, id DESC — D1-6 replaces
--      AppSheet's nondeterministic ANY() on ties)
--   5. public.extinguisher_inspection + public.fire_extinguisher façade
--      views (security_invoker — base RLS always applies)
--
-- ─── SOURCE HONESTY ───────────────────────────────────────────────────────
-- Schema from WO §3.1 = reference 12 §3.13 READ-ONLY × the real
-- ตรวจสอบถัง CSV (858 rows, 18 persisted headers, R2-re-verified).
-- ZERO seed rows here: the extinguisher MASTER is UNSEEDED
-- (SOURCE_UNAVAILABLE — P2.1 carry-over) and the inspection table is
-- populated by the staff UI from now on; a future owner-sheet backfill
-- migration sets its own source_provenance. QR strings are NEVER stored
-- (the AppSheet QR CODE is an app formula derived from the master Row ID;
-- the scan payload IS safety.fire_extinguisher.legacy_row_id, accepted
-- verbatim — PackedUUID (22 chars, e.g. vtiHJw6wpw4c6f4553dms5) and raw
-- legacy_row_id are the SAME column, so one exact match serves both;
-- leading/trailing whitespace is btrim'd, never numeric-coerced).
--
-- ─── PREFLIGHT (live-verified 2026-11-16 before apply) ───────────────────
--   to_regclass('safety.extinguisher_inspection') / public.extinguisher_
--   inspection / public.fire_extinguisher  → NULL (absent)
--   safety.fn_resolve_extinguisher_qr / trg_fn_extinguisher_update_expdate
--   → absent; baselines wastewater.reading 907 / core.personnel 9 /
--   core.equipment_spec 4 / safety.emergency_light 48 /
--   safety.fire_extinguisher 0.
--
-- ─── ROLLBACK (reverse order; DESTRUCTIVE — drops inspection rows) ───────
--   drop trigger if exists trg_extinguisher_update_expdate
--       on safety.extinguisher_inspection;
--   drop function if exists safety.trg_fn_extinguisher_update_expdate();
--   drop function if exists public.fn_resolve_extinguisher_qr(text);
--   drop function if exists safety.fn_resolve_extinguisher_qr(text);
--   drop view if exists public.extinguisher_inspection;
--   drop view if exists public.fire_extinguisher;
--   drop table if exists safety.extinguisher_inspection;
--   notify pgrst, 'reload schema';
--   (safety.fire_extinguisher is P2.1-owned — NEVER dropped here.)
--
-- Zero writes to any pre-existing table. No policies on the P2.1 masters
-- are touched (their admin INSERT policy is consumed by the admin entry
-- UI as-is, per WO §6).
-- ============================================================================

-- ─── 1) table (18 persisted → 17 ENV columns + provenance/audit) ──────────

create table safety.extinguisher_inspection (
    -- AppSheet row_ID (Key, init UNIQUEID()) — ENV generates its own
    -- 8-hex id (UI crypto); legacy_id keeps the AppSheet value verbatim
    -- when a future sheet backfill lands (house traceability convention).
    id                 text PRIMARY KEY,
    legacy_id          text UNIQUE,
    -- AppSheet Date_time (Label, init =now() form-only — NO DB default,
    -- P2.1 D1-6 rule; UI default = current datetime). Datetime at source
    -- (17/7/2566 16:02:03, พ.ศ. d/m/yyyy HH:MM:SS — parsed UI-side).
    inspection_date    timestamptz NOT NULL,
    -- AppSheet QR_CODE (init ="สแกน QR CODE", Valid If in-master) — the
    -- scan payload is the master Row ID; the QR string itself is NOT
    -- stored (P2.1 D1-3 carry-over). Placeholder/blank/in-master Valid If
    -- is enforced by the RPC + form (verbatim Thai error
    -- 'ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ'), not a DB constraint.
    extinguisher_id    text NOT NULL REFERENCES safety.fire_extinguisher(legacy_row_id),
    -- Auto-fill COPY semantics (AppSheet initial values select from the
    -- master; the master row may change later → frozen snapshots,
    -- R2-proven from real bytes: 26/30 extinguishers diverge across
    -- inspections). Blank ⇒ NULL (never ''/0).
    location_snapshot  text,                    -- AppSheet location (init =select(ข้อมูลถังดับเพลิง[Location],…))
    type_snapshot      text,                    -- DOCUMENTED ENUM, 6 values verbatim (ref 3198) — NO hard CHECK
                                                --   (D1-2/P1.001 lesson); 6 vs the master's 5 = recorded divergence
                                                --   'เคมีแห้ง (Dry Chemical Extinguishers)'
                                                --   'สารเหลวระเหย BF2000'
                                                --   'น้ำยาโฟม (Foam Extinguishers)'
                                                --   'คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)'
                                                --   'น้ำ (Water Extinguishers)'
                                                --   'น้ำ (Best Drop แบบ Low Pressure Water Mist)'
    packed_date_snapshot date,                  -- AppSheet packing_date (init copy from master)
    chem_exp_snapshot  date,                    -- AppSheet chem_exp — the Update_ExpDate trigger input (WO §5)
    size_snapshot      text,                    -- AppSheet packing_weight — free text ('15 ปอนด์')
    -- Inspection items — DOCUMENTED ENUMS verbatim, NO hard CHECK
    -- (D1-2; source has 3 all-blank rows ⇒ blank ⇒ NULL):
    --   pipe/handle/tank      ปกติ / ชำรุด         (init =ปกติ, form-only)
    --   pressure_gauge        ปกติ / ไม่ปกติ        (init =ปกติ — semantics differ, verbatim)
    --   barrier               มี / ไม่มี            (init =ไม่มี, form-only)
    pipe               text,
    handle             text,
    tank               text,
    pressure_gauge     text,
    barrier            text,
    -- Auto expiry label — AppSheet init IF([chem_exp]<=[Date_time],
    -- "หมดอายุ","ไม่หมดอายุ") (ref 3336-3338); UI pre-fills per the
    -- verbatim formula and persists verbatim.
    breakdown_details  text,
    -- AppSheet cause_of_damaged (Show If any-abnormal ref 3351) —
    -- DOCUMENTED ENUM เกิดจากการใช้งาน / หมดอายุ verbatim (ref 3354-3356),
    -- NO hard CHECK.
    cause_of_damaged   text,
    -- P3-1 correction (see header) — ref → core.personnel like the
    -- wastewater form's ผู้บันทึก pattern; NULL allowed (AppSheet column
    -- is nullable; blanks ⇒ NULL). Eligibility = UI Valid If filter.
    inspector_id       uuid REFERENCES core.personnel(id),
    -- รูปชำรุด (defect photo) is NOT a column: core.attachment row with
    -- entity_type='extinguisher_inspection' + entity_id=id (house
    -- attachments pattern; Show If gating is UI visibility only, D1-8).
    source_provenance  text NOT NULL DEFAULT 'manual entry (ENV-PARITY-P2-002)',
    created_at         timestamptz NOT NULL DEFAULT now()
);

-- ─── 2) RLS + policies (house shapes) ─────────────────────────────────────

alter table safety.extinguisher_inspection enable row level security;

drop policy if exists extinguisher_inspection_read on safety.extinguisher_inspection;
create policy extinguisher_inspection_read
    on safety.extinguisher_inspection for select to authenticated
    using (core.fn_is_staff_or_admin());

drop policy if exists extinguisher_inspection_insert_staff on safety.extinguisher_inspection;
create policy extinguisher_inspection_insert_staff
    on safety.extinguisher_inspection for insert to authenticated
    with check (core.fn_is_staff_or_admin());

drop policy if exists extinguisher_inspection_update_admin on safety.extinguisher_inspection;
create policy extinguisher_inspection_update_admin
    on safety.extinguisher_inspection for update to authenticated
    using (core.fn_is_admin())
    with check (core.fn_is_admin());

drop policy if exists extinguisher_inspection_delete_admin on safety.extinguisher_inspection;
create policy extinguisher_inspection_delete_admin
    on safety.extinguisher_inspection for delete to authenticated
    using (core.fn_is_admin());

grant select, insert, update, delete on safety.extinguisher_inspection to authenticated;
-- NO anon policies → anonymous access is fail-closed by RLS (house rule).

-- ─── 3) QR auto-fill RPC (WO §4.3 mirrors of the AppSheet initial-value
--        copies; coordinator binding: SECURITY INVOKER — RLS respected) ───

create or replace function safety.fn_resolve_extinguisher_qr(p_qr text)
returns jsonb
language plpgsql
security invoker
set search_path = safety, core, public
as $$
DECLARE
    v_qr  text;
    v_row safety.fire_extinguisher%rowtype;
    v_latest safety.extinguisher_inspection%rowtype;
    v_status text;
BEGIN
    -- Accept BOTH id forms: the 22-char PackedUUID (e.g.
    -- 'vtiHJw6wpw4c6f4553dms5') and the raw legacy_row_id — they are the
    -- SAME column, so one exact (btrim'd) match serves both. Never
    -- numeric-coerce, never case-fold (TEXT verbatim, house rule).
    v_qr := coalesce(btrim(p_qr), '');
    IF v_qr = '' THEN
        RAISE EXCEPTION 'ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ';
    END IF;

    -- SECURITY INVOKER: the P2.1 master SELECT policy
    -- (core.fn_is_staff_or_admin()) gates this read — a non-staff caller
    -- sees no row and gets the same verbatim fail-closed error.
    SELECT * INTO v_row FROM safety.fire_extinguisher WHERE legacy_row_id = v_qr;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ';
    END IF;

    -- Latest prior inspection (same deterministic order as the trigger
    -- tiebreak, D1-6). NULL when this extinguisher was never inspected.
    SELECT * INTO v_latest FROM safety.extinguisher_inspection
     WHERE extinguisher_id = v_qr
     ORDER BY inspection_date DESC, created_at DESC, id DESC
     LIMIT 1;

    -- Expiry status per the breakdown_details formula (ref 3336-3338):
    -- chem_exp <= today → หมดอายุ else ไม่หมดอายุ; NULL expiry stays NULL
    -- (unknown ≠ any judgment — house honesty rule).
    IF v_row.expiry_date IS NULL THEN
        v_status := NULL;
    ELSIF v_row.expiry_date <= current_date THEN
        v_status := 'หมดอายุ';
    ELSE
        v_status := 'ไม่หมดอายุ';
    END IF;

    RETURN jsonb_build_object(
        'master', jsonb_build_object(
            'legacy_row_id',    v_row.legacy_row_id,
            'location',         v_row.location,
            'extinguisher_type', v_row.extinguisher_type,
            'packed_date',      v_row.packed_date,
            'expiry_date',      v_row.expiry_date,
            'size_label',       v_row.size_label
        ),
        'latest_inspection', CASE WHEN v_latest.id IS NULL THEN NULL ELSE jsonb_build_object(
            'id',               v_latest.id,
            'inspection_date',  v_latest.inspection_date,
            'chem_exp_snapshot', v_latest.chem_exp_snapshot,
            'pipe',             v_latest.pipe,
            'handle',           v_latest.handle,
            'tank',             v_latest.tank,
            'pressure_gauge',   v_latest.pressure_gauge,
            'barrier',          v_latest.barrier,
            'breakdown_details', v_latest.breakdown_details,
            'created_at',       v_latest.created_at
        ) END,
        'expiry_status', v_status
    );
END;
$$;

-- PostgREST façade wrapper (PostgREST exposes only `public`; same shape
-- as the public.fn_create_reading precedent). Still SECURITY INVOKER —
-- RLS applies end to end.
create or replace function public.fn_resolve_extinguisher_qr(p_qr text)
returns jsonb
language plpgsql
security invoker
set search_path = safety, core, public
as $$
BEGIN
    RETURN safety.fn_resolve_extinguisher_qr(p_qr);
END;
$$;

-- Standard execute grants: revoked from PUBLIC/anon, granted to
-- authenticated (function ACLs default to PUBLIC — pin them).
revoke all on function safety.fn_resolve_extinguisher_qr(text) from public;
revoke all on function safety.fn_resolve_extinguisher_qr(text) from anon;
grant execute on function safety.fn_resolve_extinguisher_qr(text) to authenticated;
revoke all on function public.fn_resolve_extinguisher_qr(text) from public;
revoke all on function public.fn_resolve_extinguisher_qr(text) from anon;
grant execute on function public.fn_resolve_extinguisher_qr(text) to authenticated;

-- ─── 4) Update_ExpDate trigger (WO §5 — verbatim AppSheet semantics) ──────
--
-- Bot Update_ExpDate condition (verbatim):
--   [_THISROW].[chem_exp] > ANY(SELECT(ข้อมูลถังดับเพลิง[วันที่หมดอายุ],
--                                [QR_CODE] = [Row ID]))
-- → single-row master ⇒ strictly-greater ⇒ bump-later-only; NULL expiry
--   or NULL chem_exp ⇒ three-valued no-op.
-- Action _Bot_Update_EXP (verbatim):
--   SET วันที่หมดอายุ ← ANY(SELECT(ตรวจสอบถัง[chem_exp],
--       [Row ID] = [QR_CODE] AND [Date_time] = MAX(SELECT(Date_time))))
-- → master expiry ← chem_exp of the MAX(inspection_date) inspection.
-- D1-6: AppSheet ANY() is nondeterministic on MAX() ties; ENV pins
-- inspection_date DESC, created_at DESC, id DESC (the just-inserted row
-- wins ties — created_at now() > any prior row).
-- SECURITY DEFINER because staff hold the SQL grant but NO master UPDATE
-- policy (P2.1 admin-only) — the definer path performs EXACTLY the
-- guarded single-column UPDATE and nothing else, fail-closed. The
-- fn_is_staff_or_admin() gate is defense-in-depth: a write from a
-- non-staff context (which the INSERT policy already forbids) would
-- silently skip the bump rather than escalate.

create or replace function safety.trg_fn_extinguisher_update_expdate()
returns trigger
language plpgsql
security definer
set search_path = safety, core, public
as $$
DECLARE
    v_current_expiry date;
    v_latest_chem    date;
BEGIN
    IF NOT core.fn_is_staff_or_admin() THEN
        RETURN NEW;  -- defense-in-depth: only staff/admin writes bump
    END IF;
    IF NEW.extinguisher_id IS NULL OR NEW.chem_exp_snapshot IS NULL THEN
        RETURN NEW;  -- NULL chem_exp ⇒ no-op (verbatim guard input)
    END IF;

    SELECT expiry_date INTO v_current_expiry
      FROM safety.fire_extinguisher
     WHERE legacy_row_id = NEW.extinguisher_id;

    -- bump-later-only: NEW.chem_exp > master expiry (strictly greater;
    -- NULL master expiry ⇒ NULL comparison ⇒ no bump — verbatim ANY()).
    IF v_current_expiry IS NULL OR NEW.chem_exp_snapshot <= v_current_expiry THEN
        RETURN NEW;
    END IF;

    -- Master expiry ← chem_exp of the latest inspection (MAX
    -- inspection_date; NEW is already visible AFTER INSERT). Deterministic
    -- tiebreak per D1-6. A latest row with NULL chem_exp sets expiry NULL
    -- — verbatim _Bot_Update_EXP behavior (the AppSheet SET writes the
    -- selected row's chem_exp even when blank).
    SELECT chem_exp_snapshot INTO v_latest_chem
      FROM safety.extinguisher_inspection
     WHERE extinguisher_id = NEW.extinguisher_id
     ORDER BY inspection_date DESC, created_at DESC, id DESC
     LIMIT 1;

    UPDATE safety.fire_extinguisher
       SET expiry_date = v_latest_chem
     WHERE legacy_row_id = NEW.extinguisher_id;

    RETURN NEW;
END;
$$;

drop trigger if exists trg_extinguisher_update_expdate on safety.extinguisher_inspection;
create trigger trg_extinguisher_update_expdate
    after insert on safety.extinguisher_inspection
    for each row
    execute function safety.trg_fn_extinguisher_update_expdate();

-- ─── 5) public façades (security_invoker — base RLS always applies) ───────
-- The inspection view serves the staff list/form; the MASTER view is new
-- in this lane (P2.1 shipped none — "P2.2 decides façades"): the manual
-- pick list + the admin entry UI both need REST reachability, through the
-- UNCHANGED P2.1 policies (staff SELECT / admin INSERT).

create view public.extinguisher_inspection with (security_invoker=on)
    as select * from safety.extinguisher_inspection;
create view public.fire_extinguisher with (security_invoker=on)
    as select * from safety.fire_extinguisher;

grant select, insert, update, delete on public.extinguisher_inspection to authenticated;
grant select, insert, update, delete on public.fire_extinguisher to authenticated;

notify pgrst, 'reload schema';
