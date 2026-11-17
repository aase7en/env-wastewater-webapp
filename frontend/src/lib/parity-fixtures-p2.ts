/**
 * ENV-PARITY-P2-006 — the AppSheet-parity fixture tables for the Phase-2
 * surfaces (final Phase-2 lane P2.6; the P1.7 fixture pattern applied to
 * the extinguisher / light / coliform domains, WO §4).
 *
 * Ground truth (VERBATIM, READ-ONLY):
 * docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md (ref doc
 * 12). Every case cites its reference lines; where ENV intentionally
 * diverges (or records an AppSheet self-divergence) the case encodes the
 * CORRECTED expectation + a divergence note — never a silent match of a
 * bug (WO §4-4; handoff §2.2 pins).
 *
 * Families (WO §4-1..4-3):
 *   extinguisher — the Update_ExpDate trigger decision table (bot ref
 *     6414-6420 + action _Bot_Update_EXP ref 6152-6199; the adjudicated
 *     NULL-expiry parity ruling resolved by migration
 *     20261116000006_parity_p2_002_trigger_null_fix.sql), the
 *     fn_resolve_extinguisher_qr contract (known/unknown/blank/both-forms
 *     payloads + snapshot freezing), QR derive-never-store (ref 3079),
 *     the verbatim form value sets (ref 3247-3330), the 6-vs-5 type-enum
 *     divergence (ref 3198 vs 3072), the breakdown_details auto-label
 *     (ref 3337), the Show If gates (ref 3343/3351/3389), the ผู้ตรวจสอบ
 *     Valid If (ref 3377).
 *   light — the §3.33 value sets (ref 5055/5067/5085/5118/5138), the Show
 *     If matrix (test_result on Persistency=มี ref 5080; Broken_detail on
 *     the 2-way OR ref 5113; Pic/Status on the 3-way OR ref 5125/5133),
 *     the light QR resolve contract (known/unknown), the seed-reality
 *     distributions (332-row P2.3 seed, live-verified 2026-11-18), the
 *     SortKey derive-never-store shape (ref 5160).
 *   coliform — the same-day รอผล gate (ref 3660/3854: result fields only
 *     when TODAY() > Collect_date), the isPendingResult consumption
 *     (lib/food.ts:251-255), the +1/+2 suggestions Food/Employee ONLY
 *     (ref 3654/3848 — water/general carry NONE), the per-source
 *     vocabularies (ref 3563/3641/3008/§3.19), the per-source result sets
 *     (ref 3577/3022/3673/3867), the equipment defaults (ref
 *     3584/3688/3882; ทั่วไป carries no อุปกรณ์ column at all — §3.11),
 *     the collect-first NULL result semantics (catalog probes: result-side
 *     columns carry NO DB defaults; no gate enforcement at the DB — the
 *     gate lives in the UI, never coerced).
 *
 * Consumption:
 *   - form/gate/vocab/suggest cases run in vitest
 *     (parity-fixtures-p2.test.ts) against the shipped libs
 *     extinguisher-inspection / emergency-light-check / food — the client
 *     only consumes the delivered pure predicates, never re-derives them.
 *   - trigger / RPC / seed-distribution / catalog cases (sql: true) are
 *     exercised by scripts/test_parity_p2_006_fixtures_sql.py — the
 *     transactional BEGIN…ROLLBACK battery (zero net persistence; the
 *     P2.2/P2.3/P2.4 house shape) — the SQL semantics are not importable
 *     into vitest; the case ids mirror 1:1 (P2_006_SQL_CASE_IDS).
 *
 * House truth constraints (WO §2.3 + D1-7, binding): unknown ≠ 0; latest
 * ≠ live; AppSheet formulas verbatim-recorded with reference lines;
 * divergence honesty; พ.ศ. dates; no PHI — SYNTHETIC values only (no
 * production row copies, no Employee_id values, no secrets; the 13-digit
 * digit-run scan in the test file pins this at 0 matches).
 */

export type P2Family = "extinguisher" | "light" | "coliform";

/** Every fixture case carries a verbatim reference-doc-12 citation. */
export interface P2CaseBase {
  /** Stable id mirrored by scripts/test_parity_p2_006_fixtures_sql.py (EX / LT / CB prefixes). */
  id: string;
  family: P2Family;
  /** VERBATIM AppSheet formula + ref-doc-12 line citation. */
  ref: string;
  /** Present ONLY where ENV intentionally diverges (or records an AppSheet self-divergence): the corrected expectation + why. */
  divergence?: string;
  /** true = exercised by the transactional SQL battery (not importable into vitest). */
  sql?: true;
}

/** The pinned corrected-divergence classes for this lane (WO §4-4): every
 *  divergence note must cite one of these (divergence honesty). */
export const DIVERGENCE_KINDS_P2 = [
  "NULL-expiry parity ruling (20261116000006)",
  "inspection-type 6-value vs master 5-value",
  "no Check-specific error pinned — §3.13-family label reused",
] as const;

// ─── §4-1 EXTINGUISHER — the Update_ExpDate trigger decision table ──────────

/** The verbatim bot pair: Update_ExpDate (event Adds on ตรวจสอบถัง,
 * condition ref 6414-6420) fires _Bot_Update_EXP (SET_COLUMN_VALUE
 * วันที่หมดอายุ, ref 6152-6199). ENV transcription: an AFTER INSERT
 * SECURITY DEFINER trigger with bump-later-only + the deterministic
 * tiebreak (inspection_date DESC, created_at DESC, id DESC). All cases
 * here run transactionally (rolled-back fixture masters; zero net
 * persistence). */
export interface ExtinguisherTriggerCase extends P2CaseBase {
  sql: true;
  scenario: string;
  /** Fixture master expiry_date (วันที่หมดอายุ). */
  masterExpiry: string | null;
  /** Incoming inspection chem_exp_snapshot. */
  chemExp: string | null;
  /** Inspection date used by tiebreak/backdated scenarios. */
  inspectionDate?: string;
  /** Post-trigger master expiry_date — hand-computed. */
  expectedMasterExpiry: string | null;
}

export const EXTINGUISHER_TRIGGER_CASES: ExtinguisherTriggerCase[] = [
  {
    id: "EX-T01",
    family: "extinguisher",
    sql: true,
    ref: 'Update_ExpDate condition = [_THISROW].[chem_exp] > ANY( SELECT( ข้อมูลถังดับเพลิง[วันที่หมดอายุ], [_THISROW].[QR_CODE] = [Row ID] )) (ref 6414-6420); _Bot_Update_EXP SET วันที่หมดอายุ ← ANY(SELECT(ตรวจสอบถัง[chem_exp], …)) (ref 6152-6199)',
    scenario:
      "chem_exp 2029-01-01 > master expiry 2026-09-13 → the bot fires; master bumps to the recorded chem_exp (bump-later-only upper arm)",
    masterExpiry: "2026-09-13",
    chemExp: "2029-01-01",
    inspectionDate: "2026-11-01",
    expectedMasterExpiry: "2029-01-01",
  },
  {
    id: "EX-T02",
    family: "extinguisher",
    sql: true,
    ref: "Update_ExpDate condition chem_exp > ANY(master expiry) — a chem_exp ≤ expiry does NOT satisfy the strict > (ref 6414-6420)",
    scenario:
      "chem_exp 2026-09-01 ≤ master expiry 2026-09-13 → the bot never fires; master unchanged (bump-later-only guard)",
    masterExpiry: "2026-09-13",
    chemExp: "2026-09-01",
    inspectionDate: "2026-10-01",
    expectedMasterExpiry: "2026-09-13",
  },
  {
    id: "EX-T03",
    family: "extinguisher",
    sql: true,
    ref: "Update_ExpDate condition compares [_THISROW].[chem_exp] — blank chem_exp compares as blank, never strictly greater (ref 6414-6420); ENV guard chem_exp_snapshot IS NOT NULL",
    scenario:
      "NULL chem_exp_snapshot insert → no-op; master keeps 2026-09-13 (unknown stays unknown)",
    masterExpiry: "2026-09-13",
    chemExp: null,
    inspectionDate: "2026-11-01",
    expectedMasterExpiry: "2026-09-13",
  },
  {
    id: "EX-T04",
    family: "extinguisher",
    sql: true,
    ref: "Update_ExpDate condition vs a blank master วันที่หมดอายุ — AppSheet's blank date behaves as the spreadsheet-serial zero-date 1899-12-30, so chem_exp > ANY(...) FIRES and the real recorded chem_exp propagates (ref 6414-6420)",
    divergence:
      "NULL-expiry parity ruling (20261116000006): the delivered trigger initially skipped NULL master expiry; the adjudicated ruling (P2.2 D5 finding + coordinator ruling recorded verbatim in the P2.2 handoff repair section) SETs the master expiry from the recorded chem_exp_snapshot — a real value is SET, never fabricated. Fixtures assert the CORRECTED expectation.",
    scenario:
      "NULL master expiry + recorded chem_exp 2030-01-01 ⇒ SET 2030-01-01 (the parity-ruling case)",
    masterExpiry: null,
    chemExp: "2030-01-01",
    inspectionDate: "2026-11-01",
    expectedMasterExpiry: "2030-01-01",
  },
  {
    id: "EX-T05",
    family: "extinguisher",
    sql: true,
    ref: "_Bot_Update_EXP SET value picks Date_time = MAX(SELECT(ตรวจสอบถัง[Date_time], …)) — latest inspection_date wins; ENV adds the deterministic tiebreak created_at DESC then id DESC (P2.2 pin; ref 6152-6199)",
    scenario:
      "two inspections share inspection_date 2026-11-05: the later-created row (2032-01-01) wins; the final id-DESC fallback then picks the lexicographically greater id (2033-07-01)",
    masterExpiry: "2026-09-13",
    chemExp: "2033-07-01",
    inspectionDate: "2026-11-05",
    expectedMasterExpiry: "2033-07-01",
  },
  {
    id: "EX-T06",
    family: "extinguisher",
    sql: true,
    ref: "_Bot_Update_EXP SET recomputes from MAX(inspection Date_time), not from the just-inserted row (ref 6152-6199); ENV latest-wins recompute after a backdated insert",
    scenario:
      "backdated insert (inspection_date 2026-10-15, chem_exp 2029-06-01) AFTER a newer 2026-11-01 row (chem_exp 2029-01-01): MAX(inspection_date) stays 2026-11-01 → master stays 2029-01-01, NOT the backdated row's larger chem_exp",
    masterExpiry: "2026-09-13",
    chemExp: "2029-06-01",
    inspectionDate: "2026-10-15",
    expectedMasterExpiry: "2029-01-01",
  },
];

/** fn_resolve_extinguisher_qr(p_qr text) — SECURITY INVOKER, fail-closed
 * on blank/unknown with the verbatim Valid If error; the known-id payload
 * = master copies (location/type/packed/expiry/size) + the latest
 * inspection + the honest expiry status. Fixture payloads are SYNTHETIC
 * (the real PackedUUID shape, never a production row). */
export interface ExtinguisherRpcCase extends P2CaseBase {
  sql: true;
  scenario: string;
  /** The QR payload passed to the RPC. */
  resolvePayload: string;
  expected: {
    outcome: "resolved" | "fail-closed";
    /** The verbatim Valid If error (ref 3165) on every fail-closed path. */
    errorLabel?: string;
    masterLegacyRowId?: string;
    masterLocation?: string;
    latestInspectionId?: string;
    expiryStatus?: "หมดอายุ" | "ไม่หมดอายุ" | null;
    /** EX-R05: the stored snapshots equal the insert-time master values even after the master later changes. */
    snapshotFrozen?: boolean;
  };
}

export const EXTINGUISHER_RPC_CASES: ExtinguisherRpcCase[] = [
  {
    id: "EX-R01",
    family: "extinguisher",
    sql: true,
    ref: 'QR_CODE Valid If =AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",IN([QR_CODE],ข้อมูลถังดับเพลิง[Row ID])) (ref 3159); location/type/packed/chem/size snapshot inits =select(ข้อมูลถังดับเพลิง[…],[_THISROW].[QR_CODE]=[Row ID]) (ref 3173/3193/3205/3219/3233); expiry status honest (NULL expiry ⇒ null, never guessed)',
    scenario:
      "known id (fixture master expiry 2026-09-13 ≤ today 2026-11) resolves: master.legacy_row_id + master.location copied, latest_inspection.id returned, expiry_status = หมดอายุ",
    resolvePayload: "vtiHJw6wpw4c6f4553dms5",
    expected: {
      outcome: "resolved",
      masterLegacyRowId: "vtiHJw6wpw4c6f4553dms5",
      masterLocation: "ห้องเคาะปอด",
      latestInspectionId: "deadbeef",
      expiryStatus: "หมดอายุ",
    },
  },
  {
    id: "EX-R02",
    family: "extinguisher",
    sql: true,
    ref: 'Valid If IN([QR_CODE], ข้อมูลถังดับเพลิง[Row ID]) fails for an unknown id; Invalid value error ="ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ" (ref 3159-3166; the double space after "!!" is verbatim)',
    scenario: "unknown id ⇒ fail-closed with the verbatim error",
    resolvePayload: "zzzzunknownzzzzzzzzzzzzz",
    expected: { outcome: "fail-closed", errorLabel: "ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ" },
  },
  {
    id: "EX-R03",
    family: "extinguisher",
    sql: true,
    ref: 'Valid If arms [QR_CODE]<>"สแกน QR CODE" and [QR_CODE]<>"" (ref 3159) — the placeholder init (ref 3153) and blank are unusable payloads',
    scenario: "blank / whitespace-only payload ⇒ fail-closed with the verbatim error",
    resolvePayload: "   ",
    expected: { outcome: "fail-closed", errorLabel: "ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ" },
  },
  {
    id: "EX-R04",
    family: "extinguisher",
    sql: true,
    ref: 'Valid If matches [QR_CODE] against ข้อมูลถังดับเพลิง[Row ID] (ref 3159) — both payload forms (the raw legacy_row_id and its padded variant) denote the SAME master row; the RPC btrims',
    scenario:
      "padded ' vtiHJw6wpw4c6f4553dms5 ' resolves identically to the raw form (both-forms pin)",
    resolvePayload: "  vtiHJw6wpw4c6f4553dms5  ",
    expected: {
      outcome: "resolved",
      masterLegacyRowId: "vtiHJw6wpw4c6f4553dms5",
    },
  },
  {
    id: "EX-R05",
    family: "extinguisher",
    sql: true,
    ref: "snapshot inits freeze the master values AT FORM-FILL time (ref 3205/3219/3233); the ENV transcription stores the snapshots at INSERT — a later master change never rewrites recorded history (data honesty: the inspection log is immutable history, admin-only UPDATE)",
    scenario:
      "snapshot freezing: after the master's location changes ห้องเคาะปอด → ห้องยา, the stored inspection location_snapshot remains ห้องเคาะปอด",
    resolvePayload: "vtiHJw6wpw4c6f4553dms5",
    expected: {
      outcome: "resolved",
      snapshotFrozen: true,
    },
  },
];

/** Form-side cases executed in vitest against the shipped pure lib. */
export interface ExtinguisherFormCase extends P2CaseBase {
  input: {
    chemExp?: string | null;
    inspectionDate?: string | null;
    position?: string | null;
    status?: string | null;
  };
  expected: {
    label?: string;
    eligible?: boolean;
    options?: readonly string[];
    init?: string;
    inspectionTypeOptions?: readonly string[];
    masterTypeOptions?: readonly string[];
    qrStored?: boolean;
    payloadShape?: string;
    qrFormula?: string;
  };
}

export const EXTINGUISHER_FORM_CASES: ExtinguisherFormCase[] = [
  {
    id: "EX-V01",
    family: "extinguisher",
    ref: "pipe/handle/tank inits =ปกติ (ref 3247/3265/3283); enums ปกติ/ชำรุด (ref 3258/3276/3294)",
    input: {},
    expected: { options: ["ปกติ", "ชำรุด"], init: "ปกติ" },
  },
  {
    id: "EX-V02",
    family: "extinguisher",
    ref: "pressure_gauge init =ปกติ (ref 3301); enum ปกติ/ไม่ปกติ (ref 3312) — semantics differ from pipe/handle/tank verbatim",
    input: {},
    expected: { options: ["ปกติ", "ไม่ปกติ"], init: "ปกติ" },
  },
  {
    id: "EX-V03",
    family: "extinguisher",
    ref: "barrier init =ไม่มี (ref 3319); enum มี/ไม่มี (ref 3330)",
    input: {},
    expected: { options: ["มี", "ไม่มี"], init: "ไม่มี" },
  },
  {
    id: "EX-V04",
    family: "extinguisher",
    ref: 'inspection type enum: `เคมีแห้ง (Dry Chemical Extinguishers)` / `สารเหลวระเหย BF2000` / `น้ำยาโฟม (Foam Extinguishers)` / `คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)` / `น้ำ (Water Extinguishers)` / `น้ำ (Best Drop แบบ Low Pressure Water Mist)` (ref 3198) — 6 values; MASTER enum: `เคมีแห้ง (Dry Chemical Extinguishers)` / `สารเหลวระเหย BF2000` / `น้ำยาโฟม (Foam Extinguishers)` / `คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)` / `น้ำ (Best Drop)` (ref 3072) — 5 values',
    divergence:
      "inspection-type 6-value vs master 5-value: an AppSheet SELF-divergence (น้ำ (Best Drop) on the master splits into น้ำ (Water Extinguishers) + น้ำ (Best Drop แบบ Low Pressure Water Mist) on the inspection form — both lists pinned verbatim). ENV keeps the inspection-side 6-value vocabulary for type_snapshot and the master-side 5-value for admin master entry — recorded, never silently merged.",
    input: {},
    expected: {
      inspectionTypeOptions: [
        "เคมีแห้ง (Dry Chemical Extinguishers)",
        "สารเหลวระเหย BF2000",
        "น้ำยาโฟม (Foam Extinguishers)",
        "คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)",
        "น้ำ (Water Extinguishers)",
        "น้ำ (Best Drop แบบ Low Pressure Water Mist)",
      ],
      masterTypeOptions: [
        "เคมีแห้ง (Dry Chemical Extinguishers)",
        "สารเหลวระเหย BF2000",
        "น้ำยาโฟม (Foam Extinguishers)",
        "คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)",
        "น้ำ (Best Drop)",
      ],
    },
  },
  {
    id: "EX-V05",
    family: "extinguisher",
    ref: 'breakdown_details init =IF([chem_exp]<=[Date_time],"หมดอายุ","ไม่หมดอายุ") (ref 3337) — day-level comparison; missing either date stays "" (unknown never becomes a label)',
    input: { chemExp: "2026-01-15", inspectionDate: "2026-01-15T10:00" },
    expected: { label: "หมดอายุ" },
  },
  {
    id: "EX-V06",
    family: "extinguisher",
    ref: "cause_of_damaged + รูปชำรุด Show If =OR([pipe]<>\"ปกติ\",[handle]<>\"ปกติ\",[tank]<>\"ปกติ\",[pressure_gauge]<>\"ปกติ\",[barrier]<>\"ไม่มี\") (ref 3351/3389); breakdown_details Show If adds [chem_exp]<=[Date_time] + the resolved arm (ref 3343)",
    input: {},
    expected: {},
  },
  {
    id: "EX-V07",
    family: "extinguisher",
    ref: 'ผู้ตรวจสอบ Valid If =SELECT(ข้อมูลผู้ปฏิบัติงาน[Employee_id],AND([ตำแหน่ง]<>"นายแพทย์",[สถานะ]<>"ลาออก",OR([ตำแหน่ง]="นักวิชาการสาธารณสุข",[ตำแหน่ง]="พนักงานบริการ"))) (ref 3377)',
    input: { position: "นักวิชาการสาธารณสุข", status: "ทำงาน" },
    expected: { eligible: true },
  },
  {
    id: "EX-Q01",
    family: "extinguisher",
    ref: 'master QR CODE app formula ="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" & [Row ID] (ref 3079) — the QR payload IS the Row ID; QR is a DERIVED image, never stored (P2.1 D1-3 carry-over); row_ID = 8-hex UNIQUEID() (ref 3137), master Row ID = 22-char UNIQUEID("PackedUUID") (ref 3065)',
    input: {},
    expected: {
      qrStored: false,
      payloadShape: "22-char PackedUUID text",
      qrFormula:
        '="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" & [Row ID]',
    },
  },
];

// ─── §4-2 LIGHT — the §3.33 value sets / Show If matrix / seed reality ──────

export interface LightValueSetCase extends P2CaseBase {
  valueSet: "persistency" | "position" | "test-result" | "status" | "broken-detail";
  expected: {
    options: readonly string[];
    /** Status carries NO AppSheet init (ref 5128-5138) → blank ⇒ NULL; the seed reality is blank×300/332. */
    blankIsPossible?: boolean;
  };
}

export const LIGHT_VALUE_SET_CASES: LightValueSetCase[] = [
  {
    id: "LT-V01",
    family: "light",
    valueSet: "persistency",
    ref: "Persistency init =มี (ref 5050); enum มี/ไม่มี (ref 5055)",
    expected: { options: ["มี", "ไม่มี"] },
  },
  {
    id: "LT-V02",
    family: "light",
    valueSet: "position",
    ref: "Position init =เหมาะสม (ref 5062); enum เหมาะสม/ไม่เหมาะสม (ref 5067)",
    expected: { options: ["เหมาะสม", "ไม่เหมาะสม"] },
  },
  {
    id: "LT-V03",
    family: "light",
    valueSet: "test-result",
    ref: "test_result init =ผ่าน (ref 5074); enum ผ่าน/ไม่ผ่าน (ref 5085)",
    expected: { options: ["ผ่าน", "ไม่ผ่าน"] },
  },
  {
    id: "LT-V04",
    family: "light",
    valueSet: "status",
    ref: "Status enum แจ้งซ่อม/แจ้งย้ายตำแหน่ง/ขอติดตั้ง (ref 5138); NO init pinned in §3.33 → blank ⇒ NULL; the P2.3 seed reality: blank×300 / ขอติดตั้ง×16 / แจ้งซ่อม×14 / แจ้งย้ายตำแหน่ง×2 of 332 (live-verified 2026-11-18)",
    expected: {
      options: ["แจ้งซ่อม", "แจ้งย้ายตำแหน่ง", "ขอติดตั้ง"],
      blankIsPossible: true,
    },
  },
  {
    id: "LT-V05",
    family: "light",
    valueSet: "broken-detail",
    ref: "Broken_detail EnumList ไม่มีหัตถการ/มีแสงสว่างจากธรรมชาติ/ไม่มีเวรดึก/ไฟไม่สว่าง/ไม่เก็บไฟ (ref 5118); free-text tokens beyond the list are ACCEPTED (observed น๊อตหลุด/ถอดปลั๊กออก — no hard CHECK, P2.3 D1-8)",
    expected: {
      options: ["ไม่มีหัตถการ", "มีแสงสว่างจากธรรมชาติ", "ไม่มีเวรดึก", "ไฟไม่สว่าง", "ไม่เก็บไฟ"],
    },
  },
];

export interface LightShowIfCase extends P2CaseBase {
  gate: "test-result" | "broken-detail" | "pic-status";
  input: { persistency?: string | null; testResult?: string | null; position?: string | null };
  expected: { visible: boolean };
}

export const LIGHT_SHOW_IF_CASES: LightShowIfCase[] = [
  {
    id: "LT-S01",
    family: "light",
    gate: "test-result",
    ref: 'test_result Show If =[Persistency]="มี" (ref 5080)',
    input: { persistency: "มี" },
    expected: { visible: true },
  },
  {
    id: "LT-S02",
    family: "light",
    gate: "broken-detail",
    ref: 'Broken_detail Show If =OR([test_result]="ไม่ผ่าน",[Position]="ไม่เหมาะสม") (ref 5113) — the 2-WAY gate; Persistency is NOT an arm',
    input: { testResult: "ผ่าน", position: "เหมาะสม", persistency: "ไม่มี" },
    expected: { visible: false },
  },
  {
    id: "LT-S03",
    family: "light",
    gate: "pic-status",
    ref: 'Pic Show If =OR([test_result]="ไม่ผ่าน",[Position]="ไม่เหมาะสม",[Persistency]="ไม่มี") (ref 5125); Status Show If = the same 3-way OR (ref 5133)',
    input: { testResult: "ผ่าน", position: "เหมาะสม", persistency: "ไม่มี" },
    expected: { visible: true },
  },
];

export interface LightQrCase extends P2CaseBase {
  expected: { qrStored: boolean; qrFormula: string };
}

export const LIGHT_QR_CASES: LightQrCase[] = [
  {
    id: "LT-Q01",
    family: "light",
    ref: 'Emergency light QR app formula ="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" & [ERL_ID] (ref 4954) — same derive-never-store contract as the extinguisher; ERL_ID = UNIQUEID() (ref 4946); Check.QR_CODE init =สแกน QR CODE placeholder (ref 5027); location auto-fill =select(Emergency light[location],[_THISROW].[QR_CODE]=[ERL_ID]) (ref 5035)',
    expected: {
      qrStored: false,
      qrFormula:
        '="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" & [ERL_ID]',
    },
  },
];

/** The light resolve-RPC + seed-reality + catalog cases (SQL battery).
 *  The P2.3 resolve RPC returns master { erl_id, location, … } + prior
 *  { check_count, latest_check_date, latest_test_result } — the SortKey
 *  transcription order (check_date DESC, id DESC). */
export interface LightSqlCase extends P2CaseBase {
  sql: true;
  scenario: string;
  expected: {
    outcome?: "resolved" | "fail-closed";
    errorLabel?: string;
    masterErlId?: string;
    priorSummaryPresent?: boolean;
    /** LT-D01..04: exact seed-reality distribution counts. */
    distribution?: Record<string, number>;
    /** LT-K01: no sort_key-equivalent column stored. */
    noSortKeyColumn?: boolean;
  };
}

export const LIGHT_SQL_CASES: LightSqlCase[] = [
  {
    id: "LT-R01",
    family: "light",
    sql: true,
    ref: 'location auto-fill init =select(Emergency light[location],[_THISROW].[QR_CODE]=[ERL_ID]) (ref 5035) — known ERL_ID resolves the master (location + floor); the ENV resolve RPC additionally returns the prior-check summary (count + latest check_date + latest test_result; the SortKey transcription order, ref 5160)',
    scenario:
      "known erl_id '001' (real seeded master) resolves: master.erl_id = '001', master.location present, prior summary { check_count, latest_check_date, latest_test_result } complete; a new fixture check becomes prior.latest_test_result",
    expected: { outcome: "resolved", masterErlId: "001", priorSummaryPresent: true },
  },
  {
    id: "LT-R02",
    family: "light",
    sql: true,
    ref: 'Check.QR_CODE init =สแกน QR CODE placeholder (ref 5027); reference 12 pins NO Check-specific Valid If error — the ENV resolve RPC fail-closes blank/unknown with the §3.13-family verbatim label',
    divergence:
      "no Check-specific error pinned — §3.13-family label reused: ref 12 records no Check.Valid If error text; ENV reuses ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ for the fail-closed path (the P2.3 handoff D1-5-spirit record). A documented fill of an unpinned gap, not a correction of a pinned behavior.",
    scenario: "unknown / blank / placeholder payload ⇒ fail-closed with the reused verbatim label",
    expected: { outcome: "fail-closed", errorLabel: "ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ" },
  },
  {
    id: "LT-D01",
    family: "light",
    sql: true,
    ref: "seed reality (P2.3 migration 20261117000001, 332/332 guarded backfill, พ.ศ. −543 parse): test_result ผ่าน×316 / ไม่ผ่าน×16 — REAL data facts asserted exactly (live-verified 2026-11-18)",
    scenario: "test_result distribution over safety.emergency_light_check",
    expected: { distribution: { "ผ่าน": 316, "ไม่ผ่าน": 16 } },
  },
  {
    id: "LT-D02",
    family: "light",
    sql: true,
    ref: "seed reality: Persistency มี×315 / ไม่มี×17 of 332 (live-verified 2026-11-18)",
    scenario: "persistency distribution",
    expected: { distribution: { "มี": 315, "ไม่มี": 17 } },
  },
  {
    id: "LT-D03",
    family: "light",
    sql: true,
    ref: "seed reality: Position เหมาะสม×329 / ไม่เหมาะสม×3 of 332 (live-verified 2026-11-18)",
    scenario: "position distribution",
    expected: { distribution: { "เหมาะสม": 329, "ไม่เหมาะสม": 3 } },
  },
  {
    id: "LT-D04",
    family: "light",
    sql: true,
    ref: "seed reality: Status blank×300 / ขอติดตั้ง×16 / แจ้งซ่อม×14 / แจ้งย้ายตำแหน่ง×2 of 332 — the blank majority is the honest no-init reality (LT-V04), never coerced to a value (live-verified 2026-11-18)",
    scenario: "status distribution (NULL counted as blank)",
    expected: {
      distribution: { "(blank)": 300, "ขอติดตั้ง": 16, "แจ้งซ่อม": 14, "แจ้งย้ายตำแหน่ง": 2 },
    },
  },
  {
    id: "LT-K01",
    family: "light",
    sql: true,
    ref: 'SortKey app formula =CONCATENATE([Date_time], "-", [_ROWNUMBER]) (ref 5160) — a display-time derivation; ENV stores NO SortKey column (derive-never-store) and orders the history check_date DESC + id DESC (the RPC prior-summary transcription)',
    scenario: "catalog probe: safety.emergency_light_check carries no sort_key column; ordering is query-time",
    expected: { noSortKeyColumn: true },
  },
];

// ─── §4-3 COLIFORM — the two-step flow (collect → รอผล → resulted) ──────────

export interface ColiformGateCase extends P2CaseBase {
  input: { collectDate?: string | null; todayISO: string };
  expected: { resultFieldsVisible: boolean };
}

export const COLIFORM_GATE_CASES: ColiformGateCase[] = [
  {
    id: "CB-G01",
    family: "coliform",
    ref: 'Result_bac./Result_date Show If =TODAY()>[Collect_date] (food ref 3660/3668; employee ref 3854/3862) — collect YESTERDAY ⇒ result fields appear',
    input: { collectDate: "2026-11-16", todayISO: "2026-11-17" },
    expected: { resultFieldsVisible: true },
  },
  {
    id: "CB-G02",
    family: "coliform",
    ref: "the STRICT > gate: same-day collect never satisfies TODAY()>[Collect_date] (ref 3660/3854) — the row stays รอผล (pending); AppSheet made same-day results impossible and ENV preserves that honest constraint",
    input: { collectDate: "2026-11-17", todayISO: "2026-11-17" },
    expected: { resultFieldsVisible: false },
  },
  {
    id: "CB-G03",
    family: "coliform",
    ref: "a future-dated collect fails TODAY()>[Collect_date] (ref 3660/3854) — never editable as resulted",
    input: { collectDate: "2026-11-18", todayISO: "2026-11-17" },
    expected: { resultFieldsVisible: false },
  },
  {
    id: "CB-G04",
    family: "coliform",
    ref: "blank Collect_date: the gate cannot hold (no date to compare) → result fields hidden (unknown never becomes editable-by-default)",
    input: { collectDate: null, todayISO: "2026-11-17" },
    expected: { resultFieldsVisible: false },
  },
];

export interface ColiformPendingCase extends P2CaseBase {
  input: { result?: string | null; reported_date?: string | null };
  expected: { pending: boolean };
}

export const COLIFORM_PENDING_CASES: ColiformPendingCase[] = [
  {
    id: "CB-P01",
    family: "coliform",
    ref: "isPendingResult (lib/food.ts:251-255): pending ⇔ result blank OR reported_date blank — BOTH writes present ⇒ resulted (the step-2 write landed); CONSUMED, never re-derived (P2.4 D1 pin)",
    input: { result: "Positive", reported_date: "2026-11-16" },
    expected: { pending: false },
  },
  {
    id: "CB-P02",
    family: "coliform",
    ref: "isPendingResult: result present but reported_date missing ⇒ still pending (the two-step write is atomic in AppSheet's one-form; ENV's honest state machine)",
    input: { result: "Positive", reported_date: null },
    expected: { pending: true },
  },
  {
    id: "CB-P03",
    family: "coliform",
    ref: "isPendingResult: reported_date present but result missing ⇒ pending (never coerced to a result)",
    input: { result: null, reported_date: "2026-11-16" },
    expected: { pending: true },
  },
  {
    id: "CB-P04",
    family: "coliform",
    ref: "isPendingResult: whitespace-only values are blank (unknown ≠ 0; never a fabricated result)",
    input: { result: "   ", reported_date: "" },
    expected: { pending: true },
  },
];

export interface ColiformSuggestCase extends P2CaseBase {
  input: { source: "น้ำ" | "อาหาร" | "พนักงาน" | "ทั่วไป"; collectDate?: string };
  expected: { suggests: boolean; suggestions?: readonly [string, string] };
}

export const COLIFORM_SUGGEST_CASES: ColiformSuggestCase[] = [
  {
    id: "CB-S01",
    family: "coliform",
    ref: 'food Result_date Suggested values =LIST(date([Collect_date]+1),date([Collect_date]+2) ) (ref 3654) — local date-parts math, no UTC drift across month/year boundaries',
    input: { source: "อาหาร", collectDate: "2026-11-30" },
    expected: { suggests: true, suggestions: ["2026-12-01", "2026-12-02"] },
  },
  {
    id: "CB-S02",
    family: "coliform",
    ref: 'employee Result_date Suggested values =LIST(date([Collect_date]+1),date([Collect_date]+2) ) (ref 3848); init =IF([Collect_date]<=TODAY(),TODAY(),"") (ref 3842)',
    input: { source: "พนักงาน", collectDate: "2024-12-31" },
    expected: { suggests: true, suggestions: ["2025-01-01", "2025-01-02"] },
  },
  {
    id: "CB-S03",
    family: "coliform",
    ref: "§3.16 water pins NO Result_date Suggested values (Result_date init plain TODAY(), ref 3568-3572) — honest per-source parity: suggestions carry NONE",
    input: { source: "น้ำ" },
    expected: { suggests: false },
  },
  {
    id: "CB-S04",
    family: "coliform",
    ref: "§3.11 general pins NO Result_date Suggested values (result_date init plain TODAY(), ref 3012-3016) — honest per-source parity",
    input: { source: "ทั่วไป" },
    expected: { suggests: false },
  },
  {
    id: "CB-S05",
    family: "coliform",
    ref: "the suggested +1/+2 lists are UI-only suggestions (ref 3654/3848) — never auto-filled, never enforced; ENV's createFoodLabTest inserts the caller's step-2 input verbatim",
    input: { source: "อาหาร" },
    expected: { suggests: true },
  },
];

export interface ColiformVocabCase extends P2CaseBase {
  input: { source: "น้ำ" | "อาหาร" | "พนักงาน" | "ทั่วไป" };
  expected: {
    collectPoints?: readonly string[];
    resultSet?: readonly string[];
    equipmentDefault?: string | null;
  };
}

export const COLIFORM_VOCAB_CASES: ColiformVocabCase[] = [
  {
    id: "CB-V01",
    family: "coliform",
    ref: 'water Collect_Location enum (Key): `โรงครัว` / `ตู้กดน้ำ OPD` / `ตู้กดน้ำ IPD` / `ตู้กดน้ำปฐมภูมิ (ห้องฟัน)` (ref 3563) — 4 collect points verbatim',
    input: { source: "น้ำ" },
    expected: {
      collectPoints: ["โรงครัว", "ตู้กดน้ำ OPD", "ตู้กดน้ำ IPD", "ตู้กดน้ำปฐมภูมิ (ห้องฟัน)"],
    },
  },
  {
    id: "CB-V02",
    family: "coliform",
    ref: 'food sample enum: `ช้อนสั้น` / `ถาด` / `มือพี่กุ้ง` / `มือป้าอ้อ` / `มือแก๊ป` (ref 3641) — 5 collect points verbatim',
    input: { source: "อาหาร" },
    expected: { collectPoints: ["ช้อนสั้น", "ถาด", "มือพี่กุ้ง", "มือป้าอ้อ", "มือแก๊ป"] },
  },
  {
    id: "CB-V03",
    family: "coliform",
    ref: 'general สานถานที่เก็บตัวอย่าง enum: `โรงครัว` / `บ่อบำบัด` (ref 3008) — 2 collect points verbatim',
    input: { source: "ทั่วไป" },
    expected: { collectPoints: ["โรงครัว", "บ่อบำบัด"] },
  },
  {
    id: "CB-V04",
    family: "coliform",
    ref: "§3.19 employee: sample is a Ref to ข้อมูลผู้ปฏิบัติงาน (person swabs) — NO collect-point vocabulary (ref 3795-3810)",
    input: { source: "พนักงาน" },
    expected: { collectPoints: [] },
  },
  {
    id: "CB-V05",
    family: "coliform",
    ref: "water Result_bac. enum `Positive`/`Negative` (ref 3577); general Result enum `Positive`/`Negative` (ref 3022)",
    input: { source: "น้ำ" },
    expected: { resultSet: ["Positive", "Negative"] },
  },
  {
    id: "CB-V06",
    family: "coliform",
    ref: 'food Result_bac. enum `Positive`/`Negative`/`Positive ++`/`invalid` (ref 3673); employee the same 4-value set (ref 3867)',
    input: { source: "อาหาร" },
    expected: { resultSet: ["Positive", "Negative", "Positive ++", "invalid"] },
  },
  {
    id: "CB-V07",
    family: "coliform",
    ref: "อุปกรณ์ inits verbatim: water =aca317bf (ref 3584), food =aca317bf (ref 3688), employee =2fe4aa7c (ref 3882); §3.11 general has NO อุปกรณ์ column at all (ref 2975-2984) ⇒ default none",
    input: { source: "พนักงาน" },
    expected: { equipmentDefault: "2fe4aa7c" },
  },
];

/** The SQL-side coliform cases: catalog probes + the transactional
 *  two-step smoke. The DB deliberately carries NO result defaults and NO
 *  vocabulary/gate enforcement — the AppSheet gates live at the form;
 *  ENV transcribes them as UI gates (never as coercions). */
export interface ColiformSqlCase extends P2CaseBase {
  sql: true;
  scenario: string;
  expected: {
    noDefaultColumns?: readonly string[];
    pendingAfterCollect?: boolean;
    resultedAfterUpdate?: boolean;
    onlyChecks?: readonly string[];
    onlyTriggers?: readonly string[];
  };
}

export const COLIFORM_SQL_CASES: ColiformSqlCase[] = [
  {
    id: "CB-C01",
    family: "coliform",
    sql: true,
    ref: "collect-first NULL result semantics: AppSheet result fields are form-side (Show If ref 3660/3854); the ENV result-side columns carry NO DB defaults — step-2 values are app-supplied (P2.4 D1-7)",
    scenario:
      "catalog probe: food.lab_test result/mpn_value/reported_date/reporter_id/result_image (and the traceability sample_source/collect_point) all column_default NULL",
    expected: {
      noDefaultColumns: ["result", "mpn_value", "reported_date", "reporter_id", "result_image", "sample_source", "collect_point"],
    },
  },
  {
    id: "CB-C02",
    family: "coliform",
    sql: true,
    ref: "the two-step flow: a collect-only row (result-side NULL) is pending (รอผล); the later result+reported_date UPDATE makes it resulted (isPendingResult states; food ref 3654/3660 domain)",
    scenario:
      "transactional smoke: staff INSERT collect-only (อาหาร / ช้อนสั้น) → row pending; UPDATE result 'Positive' + reported_date → resulted; rolled back",
    expected: { pendingAfterCollect: true, resultedAfterUpdate: true },
  },
  {
    id: "CB-C03",
    family: "coliform",
    sql: true,
    ref: "documented enums are UI-restricted verbatim lists, never hard CHECKs (D1-8/P1.001; the per-source vocabularies ref 3563/3641/3008 live in the lib, off-vocabulary values are never coerced)",
    scenario:
      "catalog probe: the ONLY CHECK constraints on food.lab_test are the two FOOD-CORE-001 canonical ones (sample_type, test_type) — no CHECK on sample_source/collect_point/result",
    expected: { onlyChecks: ["lab_test_sample_type_check", "lab_test_test_type_check"] },
  },
  {
    id: "CB-F01",
    family: "coliform",
    sql: true,
    ref: "the same-day gate TODAY()>[Collect_date] (ref 3660/3854) is an AppSheet FORM gate; ENV transcribes it as the UI gate showResultFields — the DB deliberately enforces NO gate (never coerces; data honesty: a DB-side refusal could not distinguish backfill from live entry)",
    scenario:
      "catalog probe: no constraint/trigger enforces the gate — the only triggers are trg_audit_log + trg_decrement_reagent",
    expected: { onlyTriggers: ["trg_audit_log", "trg_decrement_reagent"] },
  },
];

// ─── Registry ────────────────────────────────────────────────────────────────

/** Every fixture case, by family (the parity-% denominator inputs). */
export const ALL_P2_CASES: P2CaseBase[] = [
  ...EXTINGUISHER_TRIGGER_CASES,
  ...EXTINGUISHER_RPC_CASES,
  ...EXTINGUISHER_FORM_CASES,
  ...LIGHT_VALUE_SET_CASES,
  ...LIGHT_SHOW_IF_CASES,
  ...LIGHT_QR_CASES,
  ...LIGHT_SQL_CASES,
  ...COLIFORM_GATE_CASES,
  ...COLIFORM_PENDING_CASES,
  ...COLIFORM_SUGGEST_CASES,
  ...COLIFORM_VOCAB_CASES,
  ...COLIFORM_SQL_CASES,
];

/** Family-grouped unions consumed by the vitest suite (typed as the exact
 *  case-shape unions so the suite narrows .input/.expected per family). */
export const EXTINGUISHER_CASES: (
  | ExtinguisherTriggerCase
  | ExtinguisherRpcCase
  | ExtinguisherFormCase
)[] = [
  ...EXTINGUISHER_TRIGGER_CASES,
  ...EXTINGUISHER_RPC_CASES,
  ...EXTINGUISHER_FORM_CASES,
];

export const LIGHT_CASES: (
  | LightValueSetCase
  | LightShowIfCase
  | LightQrCase
  | LightSqlCase
)[] = [
  ...LIGHT_VALUE_SET_CASES,
  ...LIGHT_SHOW_IF_CASES,
  ...LIGHT_QR_CASES,
  ...LIGHT_SQL_CASES,
];

export const CB_COLIFORM_CASES: (
  | ColiformGateCase
  | ColiformPendingCase
  | ColiformSuggestCase
  | ColiformVocabCase
  | ColiformSqlCase
)[] = [
  ...COLIFORM_GATE_CASES,
  ...COLIFORM_PENDING_CASES,
  ...COLIFORM_SUGGEST_CASES,
  ...COLIFORM_VOCAB_CASES,
  ...COLIFORM_SQL_CASES,
];

/** Case ids exercised by scripts/test_parity_p2_006_fixtures_sql.py — the
 *  transactional BEGIN…ROLLBACK battery asserts the SAME ids against
 *  ENV_DB inside one rolled-back transaction (mirrored 1:1; every entry
 *  here corresponds to a case with sql: true). */
export const P2_006_SQL_CASE_IDS = [
  "EX-T01",
  "EX-T02",
  "EX-T03",
  "EX-T04",
  "EX-T05",
  "EX-T06",
  "EX-R01",
  "EX-R02",
  "EX-R03",
  "EX-R04",
  "EX-R05",
  "LT-R01",
  "LT-R02",
  "LT-D01",
  "LT-D02",
  "LT-D03",
  "LT-D04",
  "LT-K01",
  "CB-C01",
  "CB-C02",
  "CB-C03",
  "CB-F01",
] as const;
