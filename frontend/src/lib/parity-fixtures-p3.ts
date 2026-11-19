/**
 * ENV-PARITY-P3-006 — the AppSheet-parity fixture tables for the Phase-3
 * surfaces (the FINAL Phase-3 lane P3.6; the P1.7/P2.6 fixture pattern
 * applied to the five delivered Phase-3 domains, WO §2).
 *
 * Ground truth (VERBATIM, READ-ONLY):
 * docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md (ref doc
 * 12). Every case cites its reference lines; where ENV intentionally
 * diverges (or records an AppSheet self-divergence / a plan-line reality
 * gap) the case encodes the CORRECTED expectation + a divergence note —
 * never a silent match of a bug (WO §2/§6 D1-5).
 *
 * Families (WO §2 rows 1–5):
 *   masters — master-shape + blanks⇒NULL honesty + the Category enum
 *     tokens verbatim (§3.29 Items ref 4753 / §3.31 Vendors ref 4886 /
 *     §3.27 Categories ref 4660 / §3.15 distributor ref 3505; tokens ref
 *     4792), the honest empty labels, the lab_test.equipment_id binding
 *     and the seed verdicts (Items/Vendors/Categories 0
 *     SOURCE_UNAVAILABLE; distributor 6/6 seeded).
 *   inventory — the FEFO order (expiry ASC NULLS LAST → receipt →
 *     created), the ÷SWITCH real-usage derivation, the fail-closed
 *     lot-entry payload, every truthful badge status (deducted / partial
 *     / skipped ×2 / already-deducted / already-skipped / reversed /
 *     nothing-to-reverse / noop), the unknown-usage reading gate
 *     (§3.28 ref 4679–4751; the deduction anchor ref 6014
 *     `=[Item ID] = "0c0e6a47"`; FEFO = ENV-new per owner answer B6 of
 *     2026-11-15 — never presented as an AppSheet transcription).
 *   calibration — NEXT_DUE_PINNED_ABSENT (the ONLY §3.30 formula is
 *     Cal_date Init TODAY(), ref 4864–4884; the cycle fields are MEASURED
 *     VALUES, not intervals), the ครั้งล่าสุด/จำนวนครั้ง display-time
 *     grouping, blanks⇒NULL, the 11-row maintaining census as data facts.
 *   job — the geofence verdict table (haversine ≤0.7 inclusive at the
 *     server write gate; the AppSheet Distance<=2 virtual display check
 *     RECORDED never reconciled — the 0.7-vs-2 divergence, §3.24 ref
 *     4363–4620), the QR fail-closed gates (placeholder/blank/unresolved
 *     ⇒ the verbatim poem ref 4416ff), the working EnumList joined " , ",
 *     the practician eligibility Valid If verbatim, the PII resolution
 *     class (payload carries a personnel UUID, never a legacy identity
 *     string — the §3.24 practician Init ="⟨thai-id ID7⟩" class is never
 *     replicated).
 *   manuals-address — link-only metadata + the link-display predicate
 *     (absolute http(s) ⇒ external; legacy relative ref ⇒ text + honest
 *     note; §3.22 ref 4315–4334 / §3.26 ref 4640–4659), the honest
 *     water-supply zero, the Address_Key display-time-only contract
 *     (=[TambonThai]&"-"&[DistrictThai]&"-"&[ProvinceThai] NEVER stored,
 *     §3.6 ref 1521–1543), integer-coerced float ids, the 7,436 census
 *     helpers (the plan line-95 "~1 แถว" vs the delivered census recorded
 *     as a divergence).
 *
 * Consumption:
 *   - lib-contract cases run in vitest (parity-fixtures-p3.test.ts)
 *     against the shipped libs masters / inventory / calibration / job /
 *     manuals / address — the client only consumes the delivered pure
 *     functions, never re-derives them.
 *   - seed-distribution / catalog / trigger / RPC cases (sql: true) are
 *     exercised by scripts/test_parity_p3_006_fixtures_sql.py — the
 *     transactional BEGIN…ROLLBACK battery over the LIVE delivered
 *     objects (zero net persistence); the case ids mirror 1:1
 *     (P3_006_SQL_CASE_IDS).
 *
 * House truth constraints (WO §6 D1-6, binding): unknown ≠ 0; latest ≠
 * live; AppSheet formulas verbatim-recorded with reference lines;
 * divergence honesty; พ.ศ. dates; no PHI — SYNTHETIC values only (no
 * production row copies, no personnel identity values, no secrets; the
 * 13-digit digit-run scan pins this at 0 matches — the 12-digit tails of
 * the synthetic uuid fixtures stay under the pin).
 */

import type {
  AddressFormInput,
  AddressRow,
} from "./address";
import type { CalibrationForm, CalibrationRow } from "./calibration";
import type {
  DeductionBadgeVariant,
  DeductionResult,
  InventoryLotRow,
  LotEntryForm,
} from "./inventory";
import type { JobFormInput } from "./job";
import type { DistributorFormInput, ItemFormInput } from "./masters";
import type { ManualFormInput } from "./manuals";

export type P3Family =
  | "masters"
  | "inventory"
  | "calibration"
  | "job"
  | "manuals-address";

export const P3FAMILIES: readonly P3Family[] = [
  "masters",
  "inventory",
  "calibration",
  "job",
  "manuals-address",
];

/** Every fixture case carries a verbatim reference-doc-12 citation. */
export interface P3CaseBase {
  /** Stable id mirrored by scripts/test_parity_p3_006_fixtures_sql.py (MS / IN / CA / JB / MA-AD prefixes). */
  id: string;
  family: P3Family;
  /** VERBATIM AppSheet formula/pin + ref-doc-12 line citation. */
  ref: string;
  /** Present ONLY where ENV intentionally diverges: the corrected expectation + why (must cite DIVERGENCE_KINDS_P3). */
  divergence?: string;
  /** true = exercised by the transactional SQL battery (not importable into vitest). */
  sql?: true;
}

/** The pinned divergence classes for this lane (WO §6 D1-5): every
 *  divergence note must cite one of these (divergence honesty). */
export const DIVERGENCE_KINDS_P3 = [
  "0.7-vs-2 geofence bound divergence (server write gate 0.7 km; the Distance<=2 virtual display check documented, never reconciled)",
  "NEXT_DUE_PINNED_ABSENT (no verbatim §3.30 formula; cycle fields are measured values)",
  "FEFO = ENV-new per owner answer B6 2026-11-15 (AppSheet never auto-deducted; owner-decided expectation, never an AppSheet transcription)",
  "plan line-95 '~1 แถว' vs the delivered 7,436-row address census (recorded verbatim, never reconciled)",
] as const;

// ─── Family 1 — masters/bindings (P3.1) ────────────────────────────────────

export interface MastersNullCase extends P3CaseBase {
  input: { text?: string | null; num?: string | null };
  expected: { text?: string | null; num?: number | null; numThrows?: string };
}

export const MASTERS_NULL_CASES: MastersNullCase[] = [
  {
    id: "MS-V01",
    family: "masters",
    ref: "§3.29 Items ref 4753 / §3.15 distributor ref 3505: the sheet's blank cells carry no value — the house blanks⇒NULL honesty rule (WO D1-7: unknown ≠ '')",
    input: { text: "" },
    expected: { text: null },
  },
  {
    id: "MS-V02",
    family: "masters",
    ref: "same blanks⇒NULL rule applied to whitespace-only cells (never coerced to '' or a label — unknown stays unknown) — §3.29 ref 4753",
    input: { text: "   " },
    expected: { text: null },
  },
  {
    id: "MS-V03",
    family: "masters",
    ref: "verbatim-bytes discipline (the P2.1 verbatim rule): non-blank text passes through with INNER spaces untouched — only the outer trim applies — §3.29 ref 4753",
    input: { text: "บจก. ตัวอย่าง (สังเคราะห์)" },
    expected: { text: "บจก. ตัวอย่าง (สังเคราะห์)" },
  },
  {
    id: "MS-V04",
    family: "masters",
    ref: "§3.29 Items ref 4753 numeric blanks: unknown ≠ zero — a blank purchase_cost/unit_count_num/min_qty/max_qty is NULL, never 0",
    input: { num: "" },
    expected: { num: null },
  },
  {
    id: "MS-V05",
    family: "masters",
    ref: "the unknown ≠ zero rule cuts both ways: a TYPED zero IS a value (0 stays 0 — never silently nulled) — §3.29 ref 4753",
    input: { num: "0" },
    expected: { num: 0 },
  },
  {
    id: "MS-V06",
    family: "masters",
    ref: "numeric transcription fidelity: the sheet string '25.5' parses to the numeric 25.5 (never a rounded/int form) — §3.29 ref 4753",
    input: { num: "25.5" },
    expected: { num: 25.5 },
  },
  {
    id: "MS-V07",
    family: "masters",
    ref: "the lib is the last guard: non-numeric input throws (form validation is upstream) — never a silent NaN/0 store — §3.29 ref 4753",
    input: { num: "abc" },
    expected: { numThrows: "ค่าตัวเลขไม่ถูกต้อง: abc" },
  },
];

export interface MastersItemPayloadCase extends P3CaseBase {
  input: ItemFormInput;
  expected: { payload?: Record<string, unknown>; throws?: string };
}

export const MASTERS_ITEM_PAYLOAD_CASES: MastersItemPayloadCase[] = [
  {
    id: "MS-P01",
    family: "masters",
    ref: "§3.29 Items Category enum tokens VERBATIM `w6hwsyj` / `72b68b19` / `9a7ebdaf` (ref 4792 — legacy Categories IDs; Categories is SOURCE_UNAVAILABLE so the token lands in item.category_legacy, never a seeded row); numeric fields parse verbatim",
    input: {
      name: "อุปกรณ์ทดสอบ (สังเคราะห์)",
      category_token: "72b68b19",
      purchase_cost: "1500",
      unit_count_num: "3",
      min_qty: "1",
      max_qty: "10",
    },
    expected: {
      payload: {
        name: "อุปกรณ์ทดสอบ (สังเคราะห์)",
        category_legacy: "72b68b19",
        category_id: null,
        vendor_id: null,
        purchase_cost: 1500,
        unit_count_num: 3,
        min_qty: 1,
        max_qty: 10,
        description: null,
      },
    },
  },
  {
    id: "MS-P02",
    family: "masters",
    ref: "the token lands in category_legacy UNLESS a resolved Categories row is picked (category_id) — the real-FK precedence; the token is then NOT stored — §3.29 ref 4792",
    input: {
      name: "อุปกรณ์ทดสอบ (สังเคราะห์)",
      category_token: "w6hwsyj",
      category_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    },
    expected: {
      payload: { category_legacy: null, category_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee" },
    },
  },
  {
    id: "MS-P03",
    family: "masters",
    ref: "ref 4792 is a UI-restricted verbatim list (NO hard CHECK — the P1.001 lesson): an out-of-vocabulary token throws (never a silent accept)",
    input: { name: "อุปกรณ์ทดสอบ (สังเคราะห์)", category_token: "not-a-token" },
    expected: { throws: "หมวดหมู่ไม่อยู่ในชุดค่าที่กำหนด: not-a-token" },
  },
  {
    id: "MS-P04",
    family: "masters",
    ref: "§3.29 numeric blanks⇒NULL across the payload (unknown ≠ 0 — a blank-cost item is honest, never priced at 0) — §3.29 ref 4753",
    input: { name: "อุปกรณ์ไม่ระบุราคา (สังเคราะห์)", purchase_cost: "", min_qty: "", max_qty: "" },
    expected: {
      payload: { purchase_cost: null, min_qty: null, max_qty: null },
    },
  },
];

export interface MastersPickerCase extends P3CaseBase {
  input: { name: string | null; legacy_id: string | null };
  expected: { label: string };
}

export const MASTERS_PICKER_CASES: MastersPickerCase[] = [
  {
    id: "MS-K01",
    family: "masters",
    ref: "§3.29 ref 4753: the AppSheet อุปกรณ์/ชนิดเครื่องมือตรวจ pickers carry the Item ID — the ENV option label is name + legacy id",
    input: { name: "อุปกรณ์ทดสอบ (สังเคราะห์)", legacy_id: "aa11bb22" },
    expected: { label: "อุปกรณ์ทดสอบ (สังเคราะห์) (aa11bb22)" },
  },
  {
    id: "MS-K02",
    family: "masters",
    ref: "a blank name falls back to the legacy id (never a fabricated label, never an empty unidentifiable option) — §3.29 ref 4753",
    input: { name: "", legacy_id: "aa11bb22" },
    expected: { label: "aa11bb22" },
  },
  {
    id: "MS-K03",
    family: "masters",
    ref: "both blanks ⇒ the honest empty label (the empty-picker state, never a fabricated option — WO §4) — §3.29 ref 4753",
    input: { name: null, legacy_id: null },
    expected: { label: "" },
  },
];

export interface MastersDistributorCase extends P3CaseBase {
  input: DistributorFormInput;
  legacyId?: string;
  expected: Record<string, unknown>;
}

export const MASTERS_DISTRIBUTOR_CASES: MastersDistributorCase[] = [
  {
    id: "MS-D01",
    family: "masters",
    ref: "§3.15 distributor ref 3505 (8 cols): the six verbatim business fields transcribe with blanks⇒NULL; legacy_id carries the create-verbatim/update-target through unchanged",
    input: {
      dealer: "บจก. ตัวอย่าง (สังเคราะห์)",
      dealer_email: "",
      dealer_address: "  ",
      dealer_tel: "0200000000",
      salesname: "",
      line_id: "",
    },
    legacyId: "dd11ee22",
    expected: {
      dealer: "บจก. ตัวอย่าง (สังเคราะห์)",
      dealer_email: null,
      dealer_address: null,
      dealer_tel: "0200000000",
      salesname: null,
      line_id: null,
      legacy_id: "dd11ee22",
    },
  },
];

export interface MastersPinCase extends P3CaseBase {
  expected: {
    categoryTokens?: readonly string[];
    labels?: { items: string; vendors: string; distributors: string };
  };
}

export const MASTERS_PIN_CASES: MastersPinCase[] = [
  {
    id: "MS-T01",
    family: "masters",
    ref: "§3.29 Category enum tokens verbatim (ref 4792): `w6hwsyj` / `72b68b19` / `9a7ebdaf` — order and spelling pinned (legacy Categories IDs; Categories SOURCE_UNAVAILABLE)",
    expected: { categoryTokens: ["w6hwsyj", "72b68b19", "9a7ebdaf"] },
  },
  {
    id: "MS-T02",
    family: "masters",
    ref: "the honest empty labels (WO §4 — Items/Vendors/distributor pickers never fabricate options while the sheet-shares are pending) — §3.29/§3.31 ref 4753/4886",
    expected: {
      labels: {
        items: "ยังไม่มีข้อมูลอุปกรณ์",
        vendors: "ยังไม่มีข้อมูลผู้ขาย",
        distributors: "ยังไม่มีข้อมูลผู้จัดจำหน่าย",
      },
    },
  },
];

export interface MastersSqlCase extends P3CaseBase {
  sql: true;
  scenario: string;
  expected: Record<string, unknown>;
}

export const MASTERS_SQL_CASES: MastersSqlCase[] = [
  {
    id: "MS-S01",
    family: "masters",
    sql: true,
    ref: "WO §2 row 1 seed verdicts as REAL data facts: core.item / core.vendor / core.item_category carry 0 rows (SOURCE_UNAVAILABLE — awaiting owner sheet-shares, never fabricated); core.distributor carries the seeded 6/6 (sheetId 11 census) — §3.15/§3.29 ref 3505/4753",
    scenario: "catalog count probe over the four master tables",
    expected: { item: 0, vendor: 0, itemCategory: 0, distributor: 6 },
  },
  {
    id: "MS-S02",
    family: "masters",
    sql: true,
    ref: "WO §2 row 1: the D1-4 lab binding — food.lab_test.equipment_id (uuid, NULL FK → core.item(id)) + the equipment_legacy verbatim column stays untouched; with core.item empty, count(equipment_id NOT NULL) must be 0 (never a fabricated FK) — §3.29 ref 4753",
    scenario: "binding catalog + data probe over food.lab_test",
    expected: { equipmentIdFk: true, equipmentLegacyColumn: true, equipmentIdBoundRows: 0 },
  },
  {
    id: "MS-S03",
    family: "masters",
    sql: true,
    ref: "the water-side ชนิดเครื่องมือตรวจ additive picker consumes public.item (Ref→Items semantics); the P2.4 select*-expansion lesson requires the public.lab_test façade to expose equipment_id + equipment_legacy; the four master façades exist security_invoker — §3.29 ref 4753",
    scenario: "façade exposure probe",
    expected: {
      labFacadeColumns: ["equipment_id", "equipment_legacy"],
      masterFacades: ["item", "vendor", "item_category", "distributor"],
    },
  },
];

// ─── Family 2 — inventory FEFO deduction + reversal (P3.2) ────────────────

const FEFO_DIVERGENCE =
  "FEFO = ENV-new per owner answer B6 2026-11-15 (AppSheet never auto-deducted; owner-decided expectation, never an AppSheet transcription) — plan §5.3 line 197: เปิด ถ้าทำได้จริง; the fixtures assert the OWNER-DECIDED expectation";

export interface InventoryFefoCase extends P3CaseBase {
  input: Array<Pick<InventoryLotRow, "id" | "expiry_date" | "receipt_date" | "created_at">>;
  expected: { order: string[] };
}

export const INVENTORY_FEFO_CASES: InventoryFefoCase[] = [
  {
    id: "IN-V01",
    family: "inventory",
    ref: "§3.28 Inventory ref 4679–4751; ENV FEFO = expiry ASC NULLS LAST, then receipt_date ASC, then created_at (inventory.ts fefoOrder; the migration 20261118…000002 RPC p_order)",
    divergence: FEFO_DIVERGENCE,
    input: [
      { id: "lot-A", expiry_date: "2026-12-01", receipt_date: "2026-11-01", created_at: "2026-11-01T00:00:00Z" },
      { id: "lot-B", expiry_date: "2027-01-31", receipt_date: "2026-11-01", created_at: "2026-11-01T00:00:00Z" },
      { id: "lot-C", expiry_date: null, receipt_date: "2026-10-01", created_at: "2026-10-01T00:00:00Z" },
      { id: "lot-D", expiry_date: "2026-12-01", receipt_date: "2026-10-15", created_at: "2026-10-15T00:00:00Z" },
    ],
    // Hand-computed: lot-D and lot-A share the earliest expiry 2026-12-01 →
    // receipt ASC puts lot-D (10-15) before lot-A (11-01); lot-B expires
    // 2027-01-31 next; lot-C (NULL expiry) last.
    expected: { order: ["lot-D", "lot-A", "lot-B", "lot-C"] },
  },
];

export interface InventoryRealCase extends P3CaseBase {
  input: { used: number | null; ratio: string | null };
  expected: { real: number | null };
}

export const INVENTORY_REAL_CASES: InventoryRealCase[] = [
  {
    id: "IN-R01",
    family: "inventory",
    ref: "the verbatim ÷SWITCH of wastewater.v_reading_meter_chain (migration 20261115…140000; ref 12 คลอรีนน้ำที่ใช้จริง ~767): ratio 1:2 ⇒ used/2 — hand-computed 10/2 = 5",
    input: { used: 10, ratio: "1:2" },
    expected: { real: 5 },
  },
  {
    id: "IN-R02",
    family: "inventory",
    ref: "the same ÷SWITCH: ratio 1:4 ⇒ used/4 — hand-computed 10/4 = 2.5 (the deduction quantity is THIS real value, WO §4-1) — ref 767",
    input: { used: 10, ratio: "1:4" },
    expected: { real: 2.5 },
  },
  {
    id: "IN-R03",
    family: "inventory",
    ref: "the same ÷SWITCH: ratio 1:9 ⇒ used/9 — hand-computed 9/9 = 1 — ref 767",
    input: { used: 9, ratio: "1:9" },
    expected: { real: 1 },
  },
  {
    id: "IN-R04",
    family: "inventory",
    ref: "the SWITCH default arm: an unknown/blank ratio yields NULL (unknown ≠ zero — never deducted-as-0, never guessed) — ref 767",
    input: { used: 10, ratio: "1:5" },
    expected: { real: null },
  },
  {
    id: "IN-R05",
    family: "inventory",
    ref: "a NULL คลอรีนที่ใช้ stays NULL through the ÷SWITCH (missing input never becomes a computable real) — ref 767",
    input: { used: null, ratio: "1:2" },
    expected: { real: null },
  },
];

export interface InventoryLotPayloadCase extends P3CaseBase {
  input: Partial<LotEntryForm>;
  expected: { payload?: Record<string, unknown>; throws?: string; exactKeys?: readonly string[] };
}

export const INVENTORY_LOT_PAYLOAD_CASES: InventoryLotPayloadCase[] = [
  {
    id: "IN-L01",
    family: "inventory",
    ref: "§3.28 receipt columns ref 4679–4751; the lot-entry payload transcribes blanks⇒NULL with the admin-typed kg amount (never fabricated stock)",
    input: {
      master_id: "11111111-1111-4111-8111-111111111111",
      item_id: "22222222-2222-4222-8222-222222222222",
      item_legacy_id: "0c0e6a47",
      receipt_date: "2026-11-19",
      lot_no: "L-FX-01",
      mfg_date: "",
      expiry_date: "2027-03-01",
      lifetime_note: "  ",
      amount_received: "25.5",
      note: "ถัง 5 (สังเคราะห์)",
    },
    expected: {
      payload: {
        master_id: "11111111-1111-4111-8111-111111111111",
        item_id: "22222222-2222-4222-8222-222222222222",
        item_legacy_id: "0c0e6a47",
        receipt_date: "2026-11-19",
        lot_no: "L-FX-01",
        mfg_date: null,
        expiry_date: "2027-03-01",
        lifetime_note: null,
        amount_received: 25.5,
        note: "ถัง 5 (สังเคราะห์)",
      },
    },
  },
  {
    id: "IN-L02",
    family: "inventory",
    ref: "amount_received must parse > 0 — a blank amount NEVER fabricates stock (unknown ≠ zero, WO §4-6) — §3.28 ref 4679",
    input: { amount_received: "" },
    expected: {
      throws: "จำนวนรับเข้า (kg) ต้องเป็นตัวเลขมากกว่า 0 — ไม่สร้างสต๊อกจากค่าว่าง",
    },
  },
  {
    id: "IN-L03",
    family: "inventory",
    ref: "zero is not a receipt (a 0-kg receipt is no stock — rejected, never a fabricated lot) — §3.28 ref 4679",
    input: { amount_received: "0" },
    expected: {
      throws: "จำนวนรับเข้า (kg) ต้องเป็นตัวเลขมากกว่า 0 — ไม่สร้างสต๊อกจากค่าว่าง",
    },
  },
  {
    id: "IN-L04",
    family: "inventory",
    ref: "a negative amount is never a receipt (the inventory_lot_amount_positive CHECK class mirrored at the form) — §3.28 ref 4679",
    input: { amount_received: "-1" },
    expected: {
      throws: "จำนวนรับเข้า (kg) ต้องเป็นตัวเลขมากกว่า 0 — ไม่สร้างสต๊อกจากค่าว่าง",
    },
  },
  {
    id: "IN-L05",
    family: "inventory",
    ref: "D1-7 receipt-time conversion only: the ถัง count rides the note VERBATIM — the payload carries NO invented tank→kg factor field (the admin types the kg; the note keeps the legacy unit lineage) — §3.28 ref 4679",
    input: {
      master_id: "11111111-1111-4111-8111-111111111111",
      receipt_date: "2026-11-19",
      amount_received: "25.5",
      note: "ถัง 5 (สังเคราะห์)",
    },
    expected: {
      payload: { note: "ถัง 5 (สังเคราะห์)", amount_received: 25.5 },
      exactKeys: [
        "master_id",
        "item_id",
        "item_legacy_id",
        "receipt_date",
        "lot_no",
        "mfg_date",
        "expiry_date",
        "lifetime_note",
        "amount_received",
        "note",
        "source_provenance",
      ],
    },
  },
];

export interface InventoryBadgeCase extends P3CaseBase {
  input: Pick<DeductionResult, "status"> & Partial<DeductionResult>;
  expected: { text: string; variant: DeductionBadgeVariant };
}

export const INVENTORY_BADGE_CASES: InventoryBadgeCase[] = [
  {
    id: "IN-B01",
    family: "inventory",
    ref: "the truthful full-deduction badge (WO §5): หักสต๊อกแล้ว <total> kg (FEFO ล็อต …) — the ONLY success-variant outcome (D5 P3-4) — §3.28 ref 4679–4751",
    input: {
      status: "deducted",
      deducted_total: 4,
      shortfall: 0,
      already_recorded: false,
      allocated: [{ lot_id: "x", lot_no: "L1", quantity: 4, movement_id: "m" }],
      reason: null,
    },
    expected: { text: "หักสต๊อกแล้ว 4 kg (FEFO ล็อต L1)", variant: "success" },
  },
  {
    id: "IN-B02",
    family: "inventory",
    ref: "the partial badge surfaces BOTH truths (the usage recorded AND the shortfall) — never a fabricated full success — §3.28 ref 4679–4751",
    input: {
      status: "partial",
      deducted_total: 2,
      shortfall: 3,
      already_recorded: false,
      allocated: [{ lot_id: "x", lot_no: "L1", quantity: 2, movement_id: "m" }],
      reason: null,
    },
    expected: {
      text: "หักสต๊อกได้บางส่วน 2 kg (FEFO ล็อต L1) — สต๊อกไม่พอ ขาด 3 (บันทึกการใช้แล้ว แต่ยังขาดการหัก)",
      variant: "warning",
    },
  },
  {
    id: "IN-B03",
    family: "inventory",
    ref: "the no-stock badge (unknown ≠ zero — the deduction is skipped + flagged, never deducted-as-0) — §3.28 ref 4679–4751",
    input: {
      status: "skipped",
      deducted_total: 0,
      shortfall: 4,
      already_recorded: false,
      allocated: [],
      reason: null,
    },
    expected: {
      text: "ไม่มีสต๊อกพอ — บันทึกการใช้แล้ว แต่ยังไม่ได้หักสต๊อก (ขาด 4)",
      variant: "warning",
    },
  },
  {
    id: "IN-B04",
    family: "inventory",
    ref: "the mapping-absent badge names the config gap honestly (ยังไม่ได้ตั้งค่ารายการคลอรีน — never misreported as no stock) — §3.28 ref 4679–4751",
    input: {
      status: "skipped",
      deducted_total: 0,
      shortfall: 4,
      already_recorded: false,
      allocated: [],
      reason: "mapping config absent (chemical.master legacy_item_id)",
    },
    expected: {
      text: "ไม่มีสต๊อกพอ — บันทึกการใช้แล้ว แต่ยังไม่ได้หักสต๊อก (ขาด 4) — ยังไม่ได้ตั้งค่ารายการคลอรีนในระบบ",
      variant: "warning",
    },
  },
  {
    id: "IN-B05",
    family: "inventory",
    ref: "the RACE-SAFETY surface (R2 P3-2 pin): an already-deducted retry is an idempotent SUCCESS carrying the truthful total — ไม่หักซ้ำ; the DB-level backstop is the (source_table, source_id) UNIQUE (IN-S03) — §3.28 ref 4679–4751",
    input: {
      status: "already-deducted",
      deducted_total: 2,
      shortfall: 0,
      already_recorded: true,
      allocated: [],
      reason: null,
    },
    expected: {
      text: "บันทึกนี้ถูกหักสต๊อกไปแล้ว 2 kg ก่อนหน้านี้ — ไม่หักซ้ำ",
      variant: "warning",
    },
  },
  {
    id: "IN-B06",
    family: "inventory",
    ref: "an already-skipped retry never retries a known-failing deduction (the honest memo — ไม่พยายามซ้ำ) — §3.28 ref 4679–4751",
    input: {
      status: "already-skipped",
      deducted_total: 0,
      shortfall: 4,
      already_recorded: true,
      allocated: [],
      reason: null,
    },
    expected: {
      text: "บันทึกนี้เคยพยายามหักสต๊อกแล้วแต่สต๊อกไม่พอ (ขาด 4) — ไม่พยายามซ้ำ",
      variant: "warning",
    },
  },
  {
    id: "IN-B07",
    family: "inventory",
    ref: "the reversal badge (the D2 P3-1 ruling surface): ย้อนหักสต๊อกแล้ว <restored> kg (คืนล็อต …) — the FEFO-inverse restore is visible to the operator — §3.28 ref 4679–4751",
    input: {
      status: "reversed",
      deducted_total: 0,
      shortfall: 0,
      already_recorded: false,
      restored_total: 4,
      allocated: [{ lot_id: "y", lot_no: "L2", quantity: 4, movement_id: "m2" }],
      reason: null,
    },
    expected: { text: "ย้อนหักสต๊อกแล้ว 4 kg (คืนล็อต L2)", variant: "warning" },
  },
  {
    id: "IN-B08",
    family: "inventory",
    ref: "a revoke with nothing to reverse is an honest no-op (never an invented success) — §3.28 ref 4679–4751",
    input: {
      status: "nothing-to-reverse",
      deducted_total: 0,
      shortfall: 0,
      already_recorded: false,
      allocated: [],
      reason: null,
    },
    expected: { text: "ไม่มีรายการหักสต๊อกให้ย้อน — ไม่มีการเปลี่ยนแปลง", variant: "warning" },
  },
  {
    id: "IN-B09",
    family: "inventory",
    ref: "zero usage is an honest no-op (ไม่มีปริมาณใช้คลอรีน — nothing to deduct, nothing claimed) — §3.28 ref 4679–4751",
    input: {
      status: "noop",
      deducted_total: 0,
      shortfall: 0,
      already_recorded: false,
      allocated: [],
      reason: null,
    },
    expected: { text: "ไม่มีปริมาณใช้คลอรีน — ไม่ต้องหักสต๊อก", variant: "warning" },
  },
];

export interface InventoryReadingGateCase extends P3CaseBase {
  input: { used: number | null; ratio: string | null };
  expected: { badge: { text: string; variant: DeductionBadgeVariant } | null };
}

export const INVENTORY_READING_GATE_CASES: InventoryReadingGateCase[] = [
  {
    id: "IN-G01",
    family: "inventory",
    ref: "the wastewater save-path gate (D1-3): an unknown real usage (blank ratio) NEVER reaches the RPC — the honest warning badge, the usage save unaffected — ref 767",
    input: { used: 10, ratio: null },
    expected: {
      badge: {
        text: "ยังไม่ได้หักสต๊อก — ไม่ทราบปริมาณคลอรีนจริง (อัตราส่วนผสมว่างหรือไม่รู้จัก)",
        variant: "warning",
      },
    },
  },
  {
    id: "IN-G02",
    family: "inventory",
    ref: "zero real usage deducts nothing and reports NOTHING (no badge — an honest no-op, never a fabricated deduction event) — ref 767",
    input: { used: 0, ratio: "1:2" },
    expected: { badge: null },
  },
];

export interface InventorySqlCase extends P3CaseBase {
  sql: true;
  scenario: string;
  expected: Record<string, unknown>;
}

export const INVENTORY_SQL_CASES: InventorySqlCase[] = [
  {
    id: "IN-S01",
    family: "inventory",
    sql: true,
    ref: "§3.28 ref 4679–4751 + the ref-6014 anchor `=[Item ID] = \"0c0e6a47\"`; FEFO slices: earliest EXP first, NULL expiry last, multi-lot split, movement rows direction='out' purpose 'auto-deduct FEFO <source>:<id>'",
    divergence: FEFO_DIVERGENCE,
    scenario:
      "fixture lots L-FXA (exp 2027-02-01, 4.0) / L-FXB (exp 2026-12-01, 3.0) / L-FXC (NULL exp, 5.0); deduct 5.5 → L-FXB full 3.0, then L-FXA 2.5, L-FXC untouched; 2 out-movements; shortfall 0",
    expected: {
      status: "deducted",
      slices: { "L-FXB": 3.0, "L-FXA": 2.5, "L-FXC": 0.0 },
      movementCount: 2,
      shortfall: 0,
    },
  },
  {
    id: "IN-S02",
    family: "inventory",
    sql: true,
    ref: "the exact FEFO-inverse reversal (never-over-restore): a lot carrying TWO deductions restores exactly the revoked slice; the surviving deduction stays 'deducted'; a second revoke is an honest nothing-to-reverse — §3.28 ref 4679",
    scenario:
      "lot L-REV received 5.0; source S1 deducts 3.0; source S2 deducts 2.0; revoke S1 → restores exactly 3.0 (amount_deducted back to 2.0); ledger S1 'reversed', S2 still 'deducted'; revoke S1 again → nothing-to-reverse",
    expected: {
      restored: 3.0,
      lotDeductedAfter: 2.0,
      s1Status: "reversed",
      s2Status: "deducted",
      secondRevoke: "nothing-to-reverse",
    },
  },
  {
    id: "IN-S03",
    family: "inventory",
    sql: true,
    ref: "race safety: the (source_table, source_id) UNIQUE on chemical.inventory_lot_deduction makes a same-source double-save fail-closed (23505 class) at the DB; the RPC-level retry returns the idempotent already-deducted (one movement, one ledger row); allocation quantities sum to the ledger deducted_total — §3.28 ref 4679–4751",
    scenario:
      "catalog probe of the unique index + an in-txn same-source double-deduct retry + the allocation-sum consistency probe",
    expected: {
      uniqueIndex: true,
      retryStatus: "already-deducted",
      ledgerRows: 1,
      allocationSumEqualsTotal: true,
    },
  },
  {
    id: "IN-S04",
    family: "inventory",
    sql: true,
    ref: "Total_deduct non-persistence: AppSheet's Total_deduct rollup is a SHEET-side aggregate — chemical.master carries NO total_deduct-class column (derive-never-store); the ledger's deducted_total is the only recorded total — §3.28 ref 4679–4751",
    scenario: "catalog probe over chemical.master columns",
    expected: { noTotalDeductColumn: true },
  },
  {
    id: "IN-S05",
    family: "inventory",
    sql: true,
    ref: "MFG date-typed NULL-not-coerced: inventory_lot.mfg_date is a real date column; a NULL MFG stays NULL (never 1899-12-30 / epoch coercion — unknown stays unknown) — §3.28 ref 4679",
    scenario: "fixture lot insert with mfg_date NULL read back in-txn",
    expected: { nullMfgPreserved: true },
  },
];

// ─── Family 3 — calibration incl. NEXT_DUE_ABSENT (P3.3) ──────────────────

const NEXT_DUE_DIVERGENCE =
  "NEXT_DUE_PINNED_ABSENT (no verbatim §3.30 formula; cycle fields are measured values)";

export interface CalibrationPayloadCase extends P3CaseBase {
  input: Partial<CalibrationForm>;
  expected: { payload?: Record<string, unknown>; throws?: string; todayDefault?: boolean };
}

export const CALIBRATION_PAYLOAD_CASES: CalibrationPayloadCase[] = [
  {
    id: "CA-P01",
    family: "calibration",
    ref: "§3.30 ref 4864–4884: the ONLY formula is Cal_date Init TODAY() — a blank date defaults to the LOCAL-tz today (never the UTC slice)",
    divergence: NEXT_DUE_DIVERGENCE,
    input: {
      item_id: "33333333-3333-4333-8333-333333333333",
      tool_legacy_id: "fx-tool-01",
      item_name: "เครื่องวัด pH (สังเคราะห์)",
    },
    expected: {
      todayDefault: true,
      payload: { cal_method: null, cal_result: null, calibrate_range: null, calibrate_unit: null },
    },
  },
  {
    id: "CA-P02",
    family: "calibration",
    ref: "an explicit Cal_date transcribes verbatim (CE ISO storage; the พ.ศ. render is the display layer's job) — §3.30 ref 4864–4884",
    input: { tool_legacy_id: "fx-tool-01", calibration_date: "2026-05-20" },
    expected: { payload: { calibration_date: "2026-05-20" } },
  },
  {
    id: "CA-P03",
    family: "calibration",
    ref: "a non-date value is rejected (the NOT NULL date column mirrored honestly — never a silent string store) — §3.30 ref 4864–4884",
    input: { tool_legacy_id: "fx-tool-01", calibration_date: "not-a-date" },
    expected: {
      throws:
        "วันที่สอบเทียบต้องเป็นวันที่ (ค่าเริ่มต้นคือวันนี้ ตามระบบเดิม Cal_date = TODAY())",
    },
  },
  {
    id: "CA-P04",
    family: "calibration",
    ref: "house-level guard (never presented as AppSheet): a calibration of NO tool (all three identity fields blank) is not a record — §3.30 ref 4864–4884",
    input: { cal_method: "สอบเทียบภายใน (สังเคราะห์)" },
    expected: {
      throws:
        "ต้องระบุเครื่องมืออย่างน้อยหนึ่งช่อง (อุปกรณ์ในระบบ / รหัสเครื่องมือเดิม / ชื่อรายการ) — ระบบไม่บันทึกรายการสอบเทียบของ 'ไม่มีเครื่องมือ'",
    },
  },
  {
    id: "CA-P05",
    family: "calibration",
    ref: "blanks⇒NULL across the four free fields (cal_method/cal_result/calibrate_range/calibrate_unit — the 11-row seed carries 4 blank ranges as NULL, never '') — §3.30 ref 4864–4884",
    input: {
      item_id: "33333333-3333-4333-8333-333333333333",
      calibration_date: "2026-05-20",
      cal_method: "",
      cal_result: " ",
      calibrate_range: "",
      calibrate_unit: "",
    },
    expected: {
      payload: {
        cal_method: null,
        cal_result: null,
        calibrate_range: null,
        calibrate_unit: null,
        item_name: null,
      },
    },
  },
  {
    id: "CA-P06",
    family: "calibration",
    ref: "the cycle fields are MEASURED VALUES, not intervals (P3.3 D1-5): calibrate_range '12.7' + unit '%' pass through VERBATIM — never parsed into a next-due interval — §3.30 ref 4864–4884",
    divergence: NEXT_DUE_DIVERGENCE,
    input: {
      tool_legacy_id: "fx-tool-01",
      calibration_date: "2026-05-20",
      calibrate_range: "12.7",
      calibrate_unit: "%",
      cal_result: "InControl",
    },
    expected: {
      payload: { calibrate_range: "12.7", calibrate_unit: "%", cal_result: "InControl" },
    },
  },
];

export interface CalibGroupCase extends P3CaseBase {
  input: Array<Pick<CalibrationRow, "id" | "item_id" | "tool_legacy_id" | "item_name" | "calibration_date">>;
  expected: { groups: Array<[string, string, number]> };
}

export const CALIBRATION_GROUP_CASES: CalibGroupCase[] = [
  {
    id: "CA-G01",
    family: "calibration",
    ref: "§3.30 ref 4864–4884 + the D1-5 display-time ruling: the UI shows ครั้งล่าสุด + จำนวนครั้ง per tool — NO next-due anywhere; rows sharing tool_legacy_id group; no-identity rows stay their own entries (never merged into a guessed tool)",
    divergence: NEXT_DUE_DIVERGENCE,
    input: [
      { id: "c1", item_id: null, tool_legacy_id: "fx-tool-a", item_name: null, calibration_date: "2026-03-10" },
      { id: "c2", item_id: null, tool_legacy_id: "fx-tool-a", item_name: null, calibration_date: "2026-07-22" },
      { id: "c3", item_id: null, tool_legacy_id: "fx-tool-b", item_name: null, calibration_date: "2026-05-02" },
      { id: "c4", item_id: "44444444-4444-4444-4444-444444444444", tool_legacy_id: null, item_name: null, calibration_date: "2026-02-11" },
      { id: "c5", item_id: null, tool_legacy_id: null, item_name: "เครื่องวัด ORP พกพา (สังเคราะห์)", calibration_date: "2026-01-05" },
      { id: "c6", item_id: null, tool_legacy_id: null, item_name: null, calibration_date: "2026-04-18" },
    ],
    // Hand-computed groups, latest-first: fx-tool-a {c1 03-10, c2 07-22} →
    // latest 2026-07-22 count 2; fx-tool-b 2026-05-02; the identity-less c6
    // stays its own row-keyed entry 2026-04-18; c4 groups by item_id
    // 2026-02-11; c5 by item_name 2026-01-05.
    expected: {
      groups: [
        ["fx-tool-a", "2026-07-22", 2],
        ["fx-tool-b", "2026-05-02", 1],
        ["row:c6", "2026-04-18", 1],
        ["44444444-4444-4444-4444-444444444444", "2026-02-11", 1],
        ["เครื่องวัด ORP พกพา (สังเคราะห์)", "2026-01-05", 1],
      ],
    },
  },
  {
    id: "CA-G02",
    family: "calibration",
    ref: "the identity precedence: tool_legacy_id wins over item_id — rows with the same tool group even with different item_ids; an item-only row keys by item_id (never cross-grouped into the tool group) — §3.30 ref 4864–4884",
    input: [
      { id: "g1", item_id: "iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii", tool_legacy_id: "fx-tool-a", item_name: null, calibration_date: "2026-06-01" },
      { id: "g2", item_id: "jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj", tool_legacy_id: "fx-tool-a", item_name: null, calibration_date: "2026-05-01" },
      { id: "g3", item_id: "iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii", tool_legacy_id: null, item_name: null, calibration_date: "2026-04-01" },
    ],
    // Hand-computed: g1+g2 share fx-tool-a → latest 2026-06-01 count 2;
    // g3 has NO tool → keys by its item_id, its own group 2026-04-01.
    expected: {
      groups: [
        ["fx-tool-a", "2026-06-01", 2],
        ["iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii", "2026-04-01", 1],
      ],
    },
  },
];

export interface CalibrationPinCase extends P3CaseBase {
  expected: {
    nextDuePinnedAbsent?: boolean;
    summaryHasNoNextDueField?: boolean;
    todayIsoMatchesLocalUtil?: boolean;
    emptyLabel?: string;
  };
}

export const CALIBRATION_PIN_CASES: CalibrationPinCase[] = [
  {
    id: "CA-T01",
    family: "calibration",
    ref: "the lane pin itself (P3.3 D1-5): NEXT_DUE_PINNED_ABSENT — no next-due is computed, stored, or rendered BY DESIGN; the legacy system has no next-due counterpart — §3.30 ref 4864–4884",
    divergence: NEXT_DUE_DIVERGENCE,
    expected: { nextDuePinnedAbsent: true },
  },
  {
    id: "CA-T02",
    family: "calibration",
    ref: "the ครั้งล่าสุด summary objects carry NO next-due field (the absence is structural, not just unrendered) — §3.30 ref 4864–4884",
    expected: { summaryHasNoNextDueField: true },
  },
  {
    id: "CA-T03",
    family: "calibration",
    ref: "the Cal_date Init TODAY() translation is the LOCAL-tz today (toLocalISODate — never the UTC slice; the off-by-one fix applies) — §3.30 ref 4864–4884",
    expected: { todayIsoMatchesLocalUtil: true },
  },
  {
    id: "CA-T04",
    family: "calibration",
    ref: "the honest empty state (WO §5): ยังไม่มีรายการสอบเทียบ — §3.30 ref 4864–4884",
    expected: { emptyLabel: "ยังไม่มีรายการสอบเทียบ" },
  },
];

export interface CalibrationSqlCase extends P3CaseBase {
  sql: true;
  scenario: string;
  expected: Record<string, unknown>;
}

export const CALIBRATION_SQL_CASES: CalibrationSqlCase[] = [
  {
    id: "CA-S01",
    family: "calibration",
    sql: true,
    ref: "§3.30 ref 4864–4884: the ONLY formula is Cal_date Init TODAY() — catalog probe: NO next/due column exists on core.item_calibration, is_generated NEVER for every column, and NO trigger exists (nothing computes a next-due anywhere)",
    divergence: NEXT_DUE_DIVERGENCE,
    scenario: "catalog probe over core.item_calibration",
    expected: { nextDueColumns: 0, generatedColumns: 0, triggers: 0 },
  },
  {
    id: "CA-S02",
    family: "calibration",
    sql: true,
    ref: "the 11-row maintaining seed census as data facts (the P3.3 guarded seed receipt, live-verified): 11 rows / 6 distinct tool_legacy_id / 5 distinct dates / calibrate_range 7 nonempty + 4 NULL / 4 units / 2 result classes {InControl, Higher Ref.} / cal_method NULL ×11 / item_id NULL ×11 / item_name NULL ×11 — §3.30 ref 4864–4884",
    scenario: "census count probe over core.item_calibration",
    expected: {
      rows: 11,
      tools: 6,
      dates: 5,
      rangesNonEmpty: 7,
      rangesNull: 4,
      units: 4,
      results: ["InControl", "Higher Ref."],
      methodNulls: 11,
      itemBoundRows: 0,
      nameNulls: 11,
    },
  },
  {
    id: "CA-S03",
    family: "calibration",
    sql: true,
    ref: "§3.30 Cal_date Init TODAY() transcribed as the column default: calibration_date NOT NULL DEFAULT CURRENT_DATE — §3.30 ref 4864–4884",
    scenario: "catalog probe of the calibration_date column",
    expected: { nullable: "NO", defaultIsCurrentDate: true },
  },
];

// ─── Family 4 — job geofence/QR (P3.4) ────────────────────────────────────

const GEOFENCE_DIVERGENCE =
  "0.7-vs-2 geofence bound divergence (server write gate 0.7 km; the Distance<=2 virtual display check documented, never reconciled)";

/**
 * Hand-computation for the geofence fixture latitudes (JOB_GEOFENCE_CASES):
 * a DUE-NORTH displacement makes dLng = 0 kill the cos term of the
 * haversine, and 2·asin(sin(Δφ/2)) = Δφ exactly — so d = R·Δφ with
 * R = 6371.0088 km and deg/km = 180/(π·R) = 8.9932038e-3 (1 deg ≈
 * 111.19509 km). The fixture latitudes are pin.lat + (km × 8.9932038e-3),
 * rounded to 10 decimals (residual < 1e-11 deg ≈ 6e-13 km — far under the
 * asserted precision). The due-EAST case uses d = R·cos(φ₁)·Δλ with
 * cos(14.361183°) = 0.968751 (hand-expanded Taylor series) →
 * 107.7206 km/deg → 0.005° = 0.5386 km (3-decimal precision).
 */
export interface JobGeofenceCase extends P3CaseBase {
  input: { lat: number | null; lng: number | null };
  expected: {
    ok: boolean;
    distanceKm: number | null;
    decimals?: number;
    error?: string | null;
  };
}

export const JOB_GEOFENCE_CASES: JobGeofenceCase[] = [
  {
    id: "JB-V01",
    family: "job",
    ref: "§3.24 location_name Valid If =distance([uthai_locate],[location])<=0.7 (ref ~4448; the plan row's own server pin — D1-5 CONFIRMED); hand-computed 0.69 km due north (Δφ = 0.69 × 8.9932038e-3 deg = 6.2053106e-3): ACCEPT",
    input: { lat: 14.3673883106, lng: 100.645474 },
    expected: { ok: true, distanceKm: 0.69, decimals: 5, error: null },
  },
  {
    id: "JB-V02",
    family: "job",
    ref: "the bound is INCLUSIVE (<=0.7): hand-computed 0.699999 km due north (Δφ = 6.2952337e-3 deg → lat 14.3674782337): ACCEPT (inside by a hair) — §3.24 ref 4448",
    input: { lat: 14.3674782337, lng: 100.645474 },
    expected: { ok: true, distanceKm: 0.699999, decimals: 5, error: null },
  },
  {
    id: "JB-V03",
    family: "job",
    ref: "hand-computed 0.700001 km due north (Δφ = 6.2952517e-3 deg → lat 14.3674782517): REJECT — the gate sits exactly at d>0.7 with NO buffer; the verbatim error fires — §3.24 ref 4448",
    input: { lat: 14.3674782517, lng: 100.645474 },
    expected: { ok: false, distanceKm: 0.700001, decimals: 5, error: "ฮั่นแน่...เข้ามาทำงานก่อน" },
  },
  {
    id: "JB-V04",
    family: "job",
    ref: "hand-computed 0.71 km due north (Δφ = 6.3851747e-3 deg): REJECT (the entry gate AND the server trigger agree) — §3.24 ref 4448",
    input: { lat: 14.3675681747, lng: 100.645474 },
    expected: { ok: false, distanceKm: 0.71, decimals: 5, error: "ฮั่นแน่...เข้ามาทำงานก่อน" },
  },
  {
    id: "JB-V05",
    family: "job",
    ref: "hand-computed 1.0 km due north (Δφ = 8.9932038e-3 deg): INSIDE the legacy Distance<=2 display check, OUTSIDE the ENV write gate — REJECT — §3.24 ref 4448",
    divergence: GEOFENCE_DIVERGENCE,
    input: { lat: 14.3701762038, lng: 100.645474 },
    expected: { ok: false, distanceKm: 1.0, decimals: 5, error: "ฮั่นแน่...เข้ามาทำงานก่อน" },
  },
  {
    id: "JB-V06",
    family: "job",
    ref: "the longitude arm exercises the cos(φ₁) term: hand-computed d = R·cos(14.361183°)·rad(0.005°) = 6371.0088 × 0.968751 × 8.7266463e-5 = 0.5386 km east: ACCEPT — §3.24 ref 4448",
    input: { lat: 14.361183, lng: 100.650474 },
    expected: { ok: true, distanceKm: 0.5386, decimals: 3, error: null },
  },
  {
    id: "JB-V07",
    family: "job",
    ref: "blank/unknown coordinates are REJECTED (the distance-on-blank Valid If failure mirrored honestly — unknown ≠ passed, distance unknown stays null) — §3.24 ref 4448",
    input: { lat: null, lng: null },
    expected: { ok: false, distanceKm: null, error: "ฮั่นแน่...เข้ามาทำงานก่อน" },
  },
];

export interface JobPinCase extends P3CaseBase {
  expected: {
    hospitalPin?: { lat: number; lng: number };
    geofenceLimitKm?: number;
    displayCheckLimitKm?: number;
    qrPlaceholder?: string;
    errGeofence?: string;
    errQrSubstrings?: readonly string[];
    workingOptions?: readonly string[];
    workingSeparator?: string;
    emptyLabel?: string;
  };
}

export const JOB_PIN_CASES: JobPinCase[] = [
  {
    id: "JB-T01",
    family: "job",
    ref: "§3.24 uthai_locate App formula =LATLONG(14.361183, 100.645474) (ref ~4566 — never a guessed coordinate); the server write gate = 0.7 km (the plan row's own pin); the AppSheet Distance virtual carries <=2 (ref ~4486) — recorded, never an ENV gate",
    divergence: GEOFENCE_DIVERGENCE,
    expected: {
      hospitalPin: { lat: 14.361183, lng: 100.645474 },
      geofenceLimitKm: 0.7,
      displayCheckLimitKm: 2,
    },
  },
  {
    id: "JB-T02",
    family: "job",
    ref: "§3.24 QR_CODE Init =\"สแกน QR CODE\" (ref ~4410); the geofence Invalid value error =\"ฮั่นแน่...เข้ามาทำงานก่อน\" (ref ~4448); the QR Invalid value error poem (ref 4416ff) verbatim arms",
    expected: {
      qrPlaceholder: "สแกน QR CODE",
      errGeofence: "ฮั่นแน่...เข้ามาทำงานก่อน",
      errQrSubstrings: ["ต้องมีอะไรผิดพลาดตรงไหน", "ราศีของดวงดาว"],
    },
  },
  {
    id: "JB-T03",
    family: "job",
    ref: "§3.24 working Enum values รดน้ำ / ตัดหญ้า / กวาด / เก็บขยะ (ref ~4556); the sheet joins multi-selects with \" , \" (the §2 census: 15 distinct combos over exactly this vocabulary); the honest empty label",
    expected: {
      workingOptions: ["รดน้ำ", "ตัดหญ้า", "กวาด", "เก็บขยะ"],
      workingSeparator: " , ",
      emptyLabel: "ยังไม่มีรายการงาน",
    },
  },
];

export interface JobQrGateCase extends P3CaseBase {
  input: string | null;
  expected: { usable: boolean };
}

export const JOB_QR_GATE_CASES: JobQrGateCase[] = [
  {
    id: "JB-Q01",
    family: "job",
    ref: "the QR_CODE Valid If arm [QR_CODE]<>\"\" (ref ~4412): blank payloads are unusable",
    input: "",
    expected: { usable: false },
  },
  {
    id: "JB-Q02",
    family: "job",
    ref: "the QR_CODE Valid If arm [QR_CODE]<>\"สแกน QR CODE\" (ref ~4412): the placeholder init is never a usable value",
    input: "สแกน QR CODE",
    expected: { usable: false },
  },
  {
    id: "JB-Q03",
    family: "job",
    ref: "whitespace-only payloads are blank (unknown ≠ usable) — §3.24 ref 4412",
    input: "   ",
    expected: { usable: false },
  },
  {
    id: "JB-Q04",
    family: "job",
    ref: "a resolved master id payload passes the arm (the IN([QR_CODE],location_area[id]) class — JB-P04 pins the unresolved variant) — §3.24 ref 4412",
    input: "fxarea01",
    expected: { usable: true },
  },
];

export interface JobPayloadCase extends P3CaseBase {
  input: JobFormInput;
  expected: {
    payload?: Record<string, unknown>;
    throws?: string;
    isoShapeKeys?: readonly string[];
    exactKeys?: readonly string[];
  };
}

const JOB_HAPPY_AREA = {
  id: "55555555-5555-5555-5555-555555555555",
  legacy_id: "fxarea01",
  area_name: "สวนหลังโรงพยาบาล (สังเคราะห์)",
} as const;

const JOB_EXACT_KEYS = [
  "scanned_at",
  "location_area_id",
  "qr_legacy_id",
  "location_name",
  "lat",
  "lng",
  "practitioner_id",
  "working",
  "image_ref",
  "issue",
  "source_provenance",
] as const;

export const JOB_PAYLOAD_CASES: JobPayloadCase[] = [
  {
    id: "JB-P01",
    family: "job",
    ref: "§3.24 ref 4363–4620: the in-range payload transcribes verbatim — working joined \" , \", blanks⇒NULL (image/issue), location_name from the resolved area, CE ISO scanned_at",
    input: {
      qrPayload: "fxarea01",
      area: JOB_HAPPY_AREA,
      location: { lat: 14.3673883106, lng: 100.645474 },
      working: ["รดน้ำ", "เก็บขยะ"],
      practitionerId: "66666666-6666-6666-6666-666666666666",
    },
    expected: {
      payload: {
        location_area_id: "55555555-5555-5555-5555-555555555555",
        qr_legacy_id: "fxarea01",
        location_name: "สวนหลังโรงพยาบาล (สังเคราะห์)",
        lat: 14.3673883106,
        lng: 100.645474,
        practitioner_id: "66666666-6666-6666-6666-666666666666",
        working: "รดน้ำ , เก็บขยะ",
        image_ref: null,
        issue: null,
        source_provenance: "manual staff entry (ENV-PARITY-P3-004 job log UI)",
      },
      isoShapeKeys: ["scanned_at"],
    },
  },
  {
    id: "JB-P02",
    family: "job",
    ref: "the QR_CODE Valid If failure carries the VERBATIM poem (ref 4416ff): the placeholder payload is rejected before any write",
    input: {
      qrPayload: "สแกน QR CODE",
      area: JOB_HAPPY_AREA,
      location: { lat: 14.3673883106, lng: 100.645474 },
      working: ["รดน้ำ"],
      practitionerId: "66666666-6666-6666-6666-666666666666",
    },
    expected: { throws: "ERR_QR" },
  },
  {
    id: "JB-P03",
    family: "job",
    ref: "a blank QR payload fails the same verbatim gate ([QR_CODE]<>\"\" arm) — §3.24 ref 4412",
    input: {
      qrPayload: "",
      area: JOB_HAPPY_AREA,
      location: { lat: 14.3673883106, lng: 100.645474 },
      working: ["รดน้ำ"],
      practitionerId: "66666666-6666-6666-6666-666666666666",
    },
    expected: { throws: "ERR_QR" },
  },
  {
    id: "JB-P04",
    family: "job",
    ref: "the IN([QR_CODE],location_area[id]) Valid If failure: an unresolved payload (no matching master row) is rejected with the verbatim poem — fail-closed upstream — §3.24 ref 4412",
    input: {
      qrPayload: "fxarea01",
      area: null,
      location: { lat: 14.3673883106, lng: 100.645474 },
      working: ["รดน้ำ"],
      practitionerId: "66666666-6666-6666-6666-666666666666",
    },
    expected: { throws: "ERR_QR" },
  },
  {
    id: "JB-P05",
    family: "job",
    ref: "an out-of-range write (>0.7 km — the hand-computed 0.71 km latitude) is rejected client-side with the verbatim ฮั่นแน่ error; the server trigger would reject the same write — §3.24 ref 4448",
    input: {
      qrPayload: "fxarea01",
      area: JOB_HAPPY_AREA,
      location: { lat: 14.3675681747, lng: 100.645474 },
      working: ["รดน้ำ"],
      practitionerId: "66666666-6666-6666-6666-666666666666",
    },
    expected: { throws: "ERR_GEOFENCE" },
  },
  {
    id: "JB-P06",
    family: "job",
    ref: "a blank location is rejected (unknown ≠ passed — the distance-on-blank Valid If failure) — §3.24 ref 4448",
    input: {
      qrPayload: "fxarea01",
      area: JOB_HAPPY_AREA,
      location: null,
      working: ["รดน้ำ"],
      practitionerId: "66666666-6666-6666-6666-666666666666",
    },
    expected: { throws: "ERR_GEOFENCE" },
  },
  {
    id: "JB-P07",
    family: "job",
    ref: "house-level guard (never presented as AppSheet): a job with NO work type is not a record — §3.24 ref 4556",
    input: {
      qrPayload: "fxarea01",
      area: JOB_HAPPY_AREA,
      location: { lat: 14.3673883106, lng: 100.645474 },
      working: [],
      practitionerId: "66666666-6666-6666-6666-666666666666",
    },
    expected: {
      throws: "เลือกงานที่ทำอย่างน้อย 1 ประเภท (รดน้ำ / ตัดหญ้า / กวาด / เก็บขยะ)",
    },
  },
  {
    id: "JB-P08",
    family: "job",
    ref: "house-level guard: the practician is Ref-class (§3.24) — an entry without a recorder is rejected (ระบบเดิมผูกบันทึกกับผู้ปฏิบัติงานเสมอ) — §3.24 ref 4526",
    input: {
      qrPayload: "fxarea01",
      area: JOB_HAPPY_AREA,
      location: { lat: 14.3673883106, lng: 100.645474 },
      working: ["รดน้ำ"],
      practitionerId: "  ",
    },
    expected: {
      throws: "เลือกผู้ปฏิบัติงาน (ผู้บันทึก) — ระบบเดิมผูกบันทึกกับผู้ปฏิบัติงานเสมอ",
    },
  },
  {
    id: "JB-P09",
    family: "job",
    ref: "PII resolution class (WO §2 row 4): the payload carries practitioner_id as a personnel UUID and NEVER a legacy practician string — the §3.24 practician Init =\"⟨thai-id ID7⟩\" class (ref ~4526) is never replicated; the exact 11-key payload shape pins the absence",
    input: {
      qrPayload: "fxarea01",
      area: JOB_HAPPY_AREA,
      location: { lat: 14.3673883106, lng: 100.645474 },
      working: ["กวาด"],
      practitionerId: "66666666-6666-6666-6666-666666666666",
    },
    expected: {
      payload: { practitioner_id: "66666666-6666-6666-6666-666666666666" },
      exactKeys: JOB_EXACT_KEYS,
    },
  },
];

export interface JobWorkingCase extends P3CaseBase {
  input: string[];
  expected: { joined: string | null };
}

export const JOB_WORKING_CASES: JobWorkingCase[] = [
  {
    id: "JB-W01",
    family: "job",
    ref: "an empty selection joins to NULL (no working vocabulary value is invented) — §3.24 ref 4556",
    input: [],
    expected: { joined: null },
  },
  {
    id: "JB-W02",
    family: "job",
    ref: "the verbatim \" , \" separator (the sheet's joined-text storage shape — the §2 census 15-combo lineage) — §3.24 ref 4556",
    input: ["รดน้ำ", "ตัดหญ้า"],
    expected: { joined: "รดน้ำ , ตัดหญ้า" },
  },
  {
    id: "JB-W03",
    family: "job",
    ref: "blank selections are dropped before the join (never an empty arm in the stored text) — §3.24 ref 4556",
    input: ["รดน้ำ", "", "เก็บขยะ"],
    expected: { joined: "รดน้ำ , เก็บขยะ" },
  },
  {
    id: "JB-W04",
    family: "job",
    ref: "the joined arms are trimmed (verbatim values, no stray sheet whitespace) — §3.24 ref 4556",
    input: [" รดน้ำ  ", "กวาด"],
    expected: { joined: "รดน้ำ , กวาด" },
  },
];

export interface JobPractitionerCase extends P3CaseBase {
  input: { position: string | null; status: string | null };
  expected: { eligible: boolean };
}

export const JOB_PRACTITIONER_CASES: JobPractitionerCase[] = [
  {
    id: "JB-E01",
    family: "job",
    ref: "§3.24 practician Valid If VERBATIM =SELECT(ข้อมูลผู้ปฏิบัติงาน[Employee_id],AND([ตำแหน่ง]<>\"นายแพทย์\",[สถานะ]=\"ทำงาน\",OR([ตำแหน่ง]=\"นักวิชาการสาธารณสุข\",[ตำแหน่ง]=\"พนักงานบริการ\"))) (ref ~4526ff): นักวิชาการสาธารณสุข + ทำงาน ELIGIBLE",
    input: { position: "นักวิชาการสาธารณสุข", status: "ทำงาน" },
    expected: { eligible: true },
  },
  {
    id: "JB-E02",
    family: "job",
    ref: "the same Valid If: พนักงานบริการ + ทำงาน ELIGIBLE (the OR's second arm) — §3.24 ref 4526",
    input: { position: "พนักงานบริการ", status: "ทำงาน" },
    expected: { eligible: true },
  },
  {
    id: "JB-E03",
    family: "job",
    ref: "the AND's [ตำแหน่ง]<>\"นายแพทย์\" arm: นายแพทย์ is NEVER eligible (even ทำงาน) — §3.24 ref 4526",
    input: { position: "นายแพทย์", status: "ทำงาน" },
    expected: { eligible: false },
  },
  {
    id: "JB-E04",
    family: "job",
    ref: "the AND's [สถานะ]=\"ทำงาน\" arm: a non-working status is NEVER eligible — §3.24 ref 4526",
    input: { position: "นักวิชาการสาธารณสุข", status: "ลาพัก" },
    expected: { eligible: false },
  },
  {
    id: "JB-E05",
    family: "job",
    ref: "a blank position matches NEITHER OR arm (unknown ≠ eligible) — §3.24 ref 4526",
    input: { position: null, status: "ทำงาน" },
    expected: { eligible: false },
  },
  {
    id: "JB-E06",
    family: "job",
    ref: "blank position AND blank status (unknown ≠ eligible — never a default-eligible form) — §3.24 ref 4526",
    input: { position: "", status: "" },
    expected: { eligible: false },
  },
];

export interface JobSqlCase extends P3CaseBase {
  sql: true;
  scenario: string;
  expected: Record<string, unknown>;
}

export const JOB_SQL_CASES: JobSqlCase[] = [
  {
    id: "JB-S01",
    family: "job",
    sql: true,
    ref: "§3.24 ref ~4448 + the server haversine write gate core.fn_job_log_geofence (BEFORE INSERT): in-range ≤0.7 accepted; >0.7 rejected with the verbatim ฮั่นแน่...เข้ามาทำงานก่อน; blank lat/lng rejected (unknown ≠ passed); the seed-provenance history class is EXEMPT (recorded rows never re-validated)",
    scenario:
      "transactional boundary smoke: staff-ctx inserts at the hand-computed 0.69 km / 0.71 km / blank / seed-exempt coordinates (own fixture ids fx-p3-006-*)",
    expected: {
      inRangeAccepted: true,
      outOfRangeRejected: true,
      blankRejected: true,
      seedProvenanceExempt: true,
    },
  },
  {
    id: "JB-S02",
    family: "job",
    sql: true,
    ref: "the 1102/15 seed census facts (the P3.4 guarded seed receipt, live-verified): 1102 rows / 1102 distinct legacy_id / 2 literal placeholder QR rows + 1 NULL carried verbatim / 15 distinct in-vocabulary working combos + 17 NULL / image NULL ×11 / location_name NULL ×13 / practitioner_legacy_id NULL ×1102 (the PII resolution class — UUID-or-NULL only, zero legacy identity strings) — §3.24 ref 4363–4620",
    scenario: "census count probe over core.job_log",
    expected: {
      rows: 1102,
      distinctIds: 1102,
      qrPlaceholder: 2,
      qrNull: 1,
      workingDistinct: 15,
      workingNull: 17,
      imageNull: 11,
      locationNameNull: 13,
      practitionerLegacyNonNull: 0,
    },
  },
  {
    id: "JB-S03",
    family: "job",
    sql: true,
    ref: "the 9 virtual columns never stored (§3.24 ref 4363–4620): Distance / uthai_locate / M.THAI / Y.THAI (+543 display-time) / D.THAI / N.NAME / L.Image (gettablefileurl NOT replicated) / Shows_Location_PIC1 / End_date — none exist on core.job_log and no generated column exists (derive-never-store)",
    scenario: "catalog probe over core.job_log columns",
    expected: {
      absentColumns: [
        "distance",
        "uthai_locate",
        "m_thai",
        "y_thai",
        "d_thai",
        "n_name",
        "l_image",
        "shows_location_pic1",
        "end_date",
      ],
      generatedColumns: 0,
    },
  },
];

// ─── Family 5 — manuals/address (P3.5) ────────────────────────────────────

export interface ManualsLinkCase extends P3CaseBase {
  input: string | null;
  expected: { absolute: boolean; kind: "external" | "legacy" | "none" };
}

export const MANUALS_LINK_CASES: ManualsLinkCase[] = [
  {
    id: "MA-V01",
    family: "manuals-address",
    ref: "D1-4 link-display predicate (WO §2 row 5): an absolute https URL is the ONLY form rendering a new-tab anchor (external) — §3.22 ref 4315–4334",
    input: "https://example.org/fx-manual.pdf",
    expected: { absolute: true, kind: "external" },
  },
  {
    id: "MA-V02",
    family: "manuals-address",
    ref: "the scheme test is case-insensitive http(s) (both absolute forms are external) — §3.22 ref 4315–4334",
    input: "http://example.org/fx-manual.pdf",
    expected: { absolute: true, kind: "external" },
  },
  {
    id: "MA-V03",
    family: "manuals-address",
    ref: "§3.22 ref 4315–4334: the legacy File refs are VERBATIM relative Drive metadata (คู่มือ_Files_/<id>.link.<HHMMSS>.pdf) — never fetched, never rewritten, never a fake link (legacy text + the honest note)",
    input: "คู่มือ_Files_/c845e81a.link.062513.pdf",
    expected: { absolute: false, kind: "legacy" },
  },
  {
    id: "MA-V04",
    family: "manuals-address",
    ref: "the Image refs carry the same legacy class (คู่มือ_Images/… — metadata only, no fetch/embed) — §3.22 ref 4315–4334",
    input: "คู่มือ_Images/c845e81a.รูป.062513.jpg",
    expected: { absolute: false, kind: "legacy" },
  },
  {
    id: "MA-V05",
    family: "manuals-address",
    ref: "a blank ref renders NOTHING (no fabricated link, no placeholder anchor) — §3.22 ref 4315",
    input: "",
    expected: { absolute: false, kind: "none" },
  },
  {
    id: "MA-V06",
    family: "manuals-address",
    ref: "NULL ⇒ none (the honest blank state) — §3.22 ref 4315",
    input: null,
    expected: { absolute: false, kind: "none" },
  },
];

export interface ManualsPayloadCase extends P3CaseBase {
  input: ManualFormInput;
  expected: { payload?: Record<string, unknown>; throws?: string };
}

export const MANUALS_PAYLOAD_CASES: ManualsPayloadCase[] = [
  {
    id: "MA-P01",
    family: "manuals-address",
    ref: "§3.22 รายการ is the AppSheet Label (ref ~4321) — an empty title throws (never an unlabelled manual row)",
    input: { title: "   ", image_ref: null, file_ref: null },
    expected: { throws: "รายการ (title) เป็นช่องบังคับกรอก" },
  },
  {
    id: "MA-P02",
    family: "manuals-address",
    ref: "verbatim strings trimmed, never rewritten: the title keeps its words; the file_ref keeps the legacy relative form verbatim — §3.22 ref 4315",
    input: {
      title: "  คู่มือทดสอบ (สังเคราะห์)  ",
      image_ref: "",
      file_ref: " คู่มือ_Files_/fx000000.link.000000.pdf ",
    },
    expected: {
      payload: {
        title: "คู่มือทดสอบ (สังเคราะห์)",
        image_ref: null,
        file_ref: "คู่มือ_Files_/fx000000.link.000000.pdf",
      },
    },
  },
  {
    id: "MA-P03",
    family: "manuals-address",
    ref: "blanks⇒NULL (unknown ≠ fabricated metadata) — §3.22 ref 4315",
    input: { title: "คู่มือทดสอบ (สังเคราะห์)", image_ref: "", file_ref: "" },
    expected: {
      payload: { title: "คู่มือทดสอบ (สังเคราะห์)", image_ref: null, file_ref: null },
    },
  },
];

export interface ManualsPinCase extends P3CaseBase {
  expected: {
    tables?: Record<string, string>;
    domainLabels?: Record<string, string>;
    emptyWaterSupplyLabel?: string;
    legacyDriveNote?: string;
  };
}

export const MANUALS_PIN_CASES: ManualsPinCase[] = [
  {
    id: "MA-T01",
    family: "manuals-address",
    ref: "D1-2 RULED คู่มือ ×2 (two tables, never one shared): §3.22 คู่มือ ref 4315–4334 + §3.26 คู่มือน้ำประปา ref 4640–4659 — the façade pair + the Thai card labels",
    expected: {
      tables: { wastewater: "manual_wastewater", watersupply: "manual_water_supply" },
      domainLabels: { wastewater: "คู่มืองานบ่อบำบัด", watersupply: "คู่มือน้ำประปา" },
    },
  },
  {
    id: "MA-T02",
    family: "manuals-address",
    ref: "the honest zero note (manual_water_supply carries 0 rows at delivery — SOURCE_UNAVAILABLE, never fabricated) + the legacy-ref note verbatim — §3.26 ref 4640–4659",
    expected: {
      emptyWaterSupplyLabel: "ยังไม่มีข้อมูล — รอแหล่งข้อมูลจากเจ้าของระบบเดิม",
      legacyDriveNote: "คำเตือน: ไฟล์อยู่ในไดรฟ์ของระบบเดิม",
    },
  },
];

export interface AddressKeyCase extends P3CaseBase {
  input: Pick<AddressRow, "tambon_thai" | "district_thai" | "province_thai">;
  expected: { key: string };
}

export const ADDRESS_KEY_CASES: AddressKeyCase[] = [
  {
    id: "AD-V01",
    family: "manuals-address",
    ref: "§3.6 Address_Key App formula VERBATIM =[TambonThai]&\"-\"&[DistrictThai]&\"-\"&[ProvinceThai] (ref 1536-1543) — display-time ONLY: hand-computed from the 910104 spot row (บ้านควน / อำเภอเมืองสตูล / สตูล)",
    input: { tambon_thai: "บ้านควน", district_thai: "อำเภอเมืองสตูล", province_thai: "สตูล" },
    expected: { key: "บ้านควน-อำเภอเมืองสตูล-สตูล" },
  },
];

export interface AddressPayloadCase extends P3CaseBase {
  input: AddressFormInput;
  expected: { payload?: Record<string, unknown>; throws?: string; neverCarriesAddressKey?: boolean };
}

export const ADDRESS_PAYLOAD_CASES: AddressPayloadCase[] = [
  {
    id: "AD-P01",
    family: "manuals-address",
    ref: "§3.6 ref 1521–1543: the id fields integer-coerce (TambonID/DistrictID/ProvinceID) and the three Thai names are required; the payload NEVER carries an address_key field (the virtual is never stored — D1-5/D1-9)",
    input: {
      tambon_id: "910104",
      tambon_thai: "บ้านควน",
      district_id: "9101",
      district_thai: "อำเภอเมืองสตูล",
      province_id: "91",
      province_thai: "สตูล",
    },
    expected: {
      payload: {
        tambon_id: 910104,
        tambon_thai: "บ้านควน",
        district_id: 9101,
        district_thai: "อำเภอเมืองสตูล",
        province_id: 91,
        province_thai: "สตูล",
      },
      neverCarriesAddressKey: true,
    },
  },
  {
    id: "AD-P02",
    family: "manuals-address",
    ref: "the P2.3 float-id lesson: the markad tab stores sheet floats (910104.0) — the coercion accepts the float form and stores the integer 910104 — §3.6 ref 1521–1543",
    input: {
      tambon_id: 910104.0,
      tambon_thai: "บ้านควน",
      district_id: 9101.0,
      district_thai: "อำเภอเมืองสตูล",
      province_id: 91.0,
      province_thai: "สตูล",
    },
    expected: {
      payload: { tambon_id: 910104, district_id: 9101, province_id: 91 },
    },
  },
  {
    id: "AD-P03",
    family: "manuals-address",
    ref: "a NON-integral id throws (never a silent fractional TambonID store) — §3.6 ref 1521–1543",
    input: {
      tambon_id: 910104.5,
      tambon_thai: "บ้านควน",
      district_id: 9101,
      district_thai: "อำเภอเมืองสตูล",
      province_id: 91,
      province_thai: "สตูล",
    },
    expected: { throws: "ค่ารหัสต้องเป็นจำนวนเต็ม" },
  },
  {
    id: "AD-P04",
    family: "manuals-address",
    ref: "the header chain requires every name (ชื่อตำบล/อำเภอ/จังหวัด — the report-header dependency) — §3.6 ref 1521–1543",
    input: {
      tambon_id: 910104,
      tambon_thai: "  ",
      district_id: 9101,
      district_thai: "อำเภอเมืองสตูล",
      province_id: 91,
      province_thai: "สตูล",
    },
    expected: { throws: "ชื่อตำบลเป็นช่องบังคับกรอก" },
  },
];

export interface AddressSearchCase extends P3CaseBase {
  input: {
    rows?: AddressRow[];
    query?: string;
    page?: number;
    size?: number;
  };
  expected: {
    filteredIds?: number[];
    pageIds?: number[];
    pageSize?: number;
    phase4Note?: string;
  };
}

const AD_CENSUS_ROWS: AddressRow[] = [
  {
    id: "a1",
    tambon_id: 610101,
    tambon_thai: "อุทัยใหม่",
    district_id: 6101,
    district_thai: "อำเภอเมืองอุทัยธานี",
    province_id: 61,
    province_thai: "อุทัยธานี",
    source_provenance: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "a2",
    tambon_id: 610102,
    tambon_thai: "อุทัยเก่า",
    district_id: 6101,
    district_thai: "อำเภอเมืองอุทัยธานี",
    province_id: 61,
    province_thai: "อุทัยธานี",
    source_provenance: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "a3",
    tambon_id: 910104,
    tambon_thai: "บ้านควน",
    district_id: 9101,
    district_thai: "อำเภอเมืองสตูล",
    province_id: 91,
    province_thai: "สตูล",
    source_provenance: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "a4",
    tambon_id: 100101,
    tambon_thai: "แขวงพระบรมมหาราชวัง",
    district_id: 1001,
    district_thai: "เขตพระนคร",
    province_id: 10,
    province_thai: "กรุงเทพมหานคร",
    source_provenance: null,
    created_at: "2026-01-01T00:00:00Z",
  },
];

const AD_PAGE_ROWS: AddressRow[] = Array.from({ length: 7 }, (_, i) => ({
  id: `p${i + 1}`,
  tambon_id: i + 1,
  tambon_thai: `ตำบลทดสอบ ${i + 1} (สังเคราะห์)`,
  district_id: 1,
  district_thai: "อำเภอทดสอบ (สังเคราะห์)",
  province_id: 1,
  province_thai: "จังหวัดทดสอบ (สังเคราะห์)",
  source_provenance: null,
  created_at: "2026-01-01T00:00:00Z",
}));

export const ADDRESS_SEARCH_CASES: AddressSearchCase[] = [
  {
    id: "AD-S01",
    family: "manuals-address",
    ref: "the client-side census search: a substring match over the Thai names — hand-computed: 'อุทัย' matches อุทัยใหม่ + อุทัยเก่า (the อุทัยธานี district strings also contain it, same rows) — §3.6 ref 1521",
    input: { rows: AD_CENSUS_ROWS, query: "อุทัย" },
    expected: { filteredIds: [610101, 610102] },
  },
  {
    id: "AD-S02",
    family: "manuals-address",
    ref: "the numeric ids search as digit substrings — hand-computed: '61' matches 610101 + 610102 (never a fuzzy id guess) — §3.6 ref 1521",
    input: { rows: AD_CENSUS_ROWS, query: "61" },
    expected: { filteredIds: [610101, 610102] },
  },
  {
    id: "AD-S03",
    family: "manuals-address",
    ref: "an empty query returns the rows unchanged (no reorder, no filter — the census order is the fetch order) — §3.6 ref 1521",
    input: { rows: AD_CENSUS_ROWS, query: "" },
    expected: { filteredIds: [610101, 610102, 910104, 100101] },
  },
  {
    id: "AD-S04",
    family: "manuals-address",
    ref: "the census is NEVER rendered unpaginated (WO §5): hand-computed over 7 synthetic rows at size 3 — page 1 = rows 1..3 — §3.6 ref 1521",
    input: { rows: AD_PAGE_ROWS, page: 1, size: 3 },
    expected: { pageIds: [1, 2, 3] },
  },
  {
    id: "AD-S05",
    family: "manuals-address",
    ref: "hand-computed: page 3 (the last page) = row 7 only — §3.6 ref 1521",
    input: { rows: AD_PAGE_ROWS, page: 3, size: 3 },
    expected: { pageIds: [7] },
  },
  {
    id: "AD-S06",
    family: "manuals-address",
    ref: "hand-computed: page 4 is out of range ⇒ [] (never a fabricated page) — §3.6 ref 1521",
    input: { rows: AD_PAGE_ROWS, page: 4, size: 3 },
    expected: { pageIds: [] },
  },
  {
    id: "AD-S07",
    family: "manuals-address",
    ref: "the bounded page size over the real census: 7,436 = 148 × 50 + 36 → the last page carries 36 rows at ADDRESS_PAGE_SIZE 50 (hand-computed); the Phase-4 header dependency is a NOTED note, never built in this lane — §3.6 ref 1521",
    input: {},
    expected: {
      pageSize: 50,
      phase4Note: "หัวรายงาน ทส. จะอ่านจากตารางนี้ใน Phase 4 — ยังไม่เชื่อมในเลนนี้",
    },
  },
];

export interface ManualsAddressSqlCase extends P3CaseBase {
  sql: true;
  scenario: string;
  expected: Record<string, unknown>;
}

export const MANUALS_ADDRESS_SQL_CASES: ManualsAddressSqlCase[] = [
  {
    id: "MA-S01",
    family: "manuals-address",
    sql: true,
    ref: "D1-5/D1-9 catalog pins: NO address_key column exists on core.address; is_generated NEVER on manual_wastewater / manual_water_supply / address; NO non-internal trigger on the three tables (the §3.6 virtual + display derivations are never stored) — §3.6 ref 1534",
    scenario: "catalog probe over the three P3.5 tables",
    expected: { noAddressKey: true, generatedColumns: 0, triggers: 0 },
  },
  {
    id: "MA-S02",
    family: "manuals-address",
    sql: true,
    ref: "§3.6 + the P3.5 census receipt (live-verified): core.address 7,436/7,436 with TambonID unique / 77 provinces / DistrictID 928 distinct / อุทัยธานี 70 rows over 8 districts — §3.6 ref 1521–1543",
    divergence:
      "plan line-95 '~1 แถว' vs the delivered 7,436-row address census (recorded verbatim, never reconciled)",
    scenario: "census count probe over core.address",
    expected: {
      rows: 7436,
      distinctTambonIds: 7436,
      provinces: 77,
      districts: 928,
      uthaiRows: 70,
      uthaiDistricts: 8,
    },
  },
  {
    id: "MA-S03",
    family: "manuals-address",
    sql: true,
    ref: "the manual-shelf seeds: core.manual_wastewater 10/10 (the pond-tab คู่มือ census, 10 distinct 8-hex legacy ids) + core.manual_water_supply 0 (SOURCE_UNAVAILABLE — the honest zero, never fabricated) — §3.22/§3.26 ref 4315/4640",
    scenario: "count probe over the two manual tables",
    expected: { wastewaterRows: 10, wastewaterDistinctIds: 10, waterSupplyRows: 0 },
  },
  {
    id: "MA-S04",
    family: "manuals-address",
    sql: true,
    ref: "the RLS postures: address is the admin-EDITABLE reference (owner B7 — the UPDATE policy carries USING + WITH CHECK); manuals are admin-manage staff-read; ZERO anon policies on all three and the anon read fails closed — §3.6 ref 1521–1543",
    scenario: "policy shape + anon fail-closed probe",
    expected: {
      addressUpdateDual: true,
      anonPolicies: 0,
      anonReadFailsClosed: true,
    },
  },
  {
    id: "MA-S05",
    family: "manuals-address",
    sql: true,
    ref: "the verbatim spot rows (the P3.5 seed receipt): address 910104 = บ้านควน / 9101 อำเภอเมืองสตูล / 91 สตูล; manual c845e81a = ควบคุมและบำรุงรักษาระบบบำบัดน้ำเสีย with the legacy link-only refs (คู่มือ_Images/… + คู่มือ_Files_/… — metadata only, never binary) — §3.6/§3.22 ref 1536/4315",
    scenario: "verbatim spot-row probe",
    expected: {
      addressSpot: {
        tambonId: 910104,
        tambonThai: "บ้านควน",
        districtId: 9101,
        districtThai: "อำเภอเมืองสตูล",
        provinceId: 91,
        provinceThai: "สตูล",
      },
      manualSpot: {
        legacyId: "c845e81a",
        title: "ควบคุมและบำรุงรักษาระบบบำบัดน้ำเสีย",
        imageRefPrefix: "คู่มือ_Images/c845e81a.",
        fileRefPrefix: "คู่มือ_Files_/c845e81a.",
      },
    },
  },
];

// ─── Registry ────────────────────────────────────────────────────────────────

/** Every fixture case, by family (the parity-% denominator inputs). */
export const ALL_P3_CASES: P3CaseBase[] = [
  ...MASTERS_NULL_CASES,
  ...MASTERS_ITEM_PAYLOAD_CASES,
  ...MASTERS_PICKER_CASES,
  ...MASTERS_DISTRIBUTOR_CASES,
  ...MASTERS_PIN_CASES,
  ...MASTERS_SQL_CASES,
  ...INVENTORY_FEFO_CASES,
  ...INVENTORY_REAL_CASES,
  ...INVENTORY_LOT_PAYLOAD_CASES,
  ...INVENTORY_BADGE_CASES,
  ...INVENTORY_READING_GATE_CASES,
  ...INVENTORY_SQL_CASES,
  ...CALIBRATION_PAYLOAD_CASES,
  ...CALIBRATION_GROUP_CASES,
  ...CALIBRATION_PIN_CASES,
  ...CALIBRATION_SQL_CASES,
  ...JOB_PIN_CASES,
  ...JOB_GEOFENCE_CASES,
  ...JOB_QR_GATE_CASES,
  ...JOB_PAYLOAD_CASES,
  ...JOB_WORKING_CASES,
  ...JOB_PRACTITIONER_CASES,
  ...JOB_SQL_CASES,
  ...MANUALS_LINK_CASES,
  ...MANUALS_PAYLOAD_CASES,
  ...MANUALS_PIN_CASES,
  ...ADDRESS_KEY_CASES,
  ...ADDRESS_PAYLOAD_CASES,
  ...ADDRESS_SEARCH_CASES,
  ...MANUALS_ADDRESS_SQL_CASES,
];

/** Case ids exercised by scripts/test_parity_p3_006_fixtures_sql.py — the
 *  transactional BEGIN…ROLLBACK battery asserts the SAME ids against
 *  ENV_DB (mirrored 1:1; every entry here corresponds to a case with
 *  sql: true). */
export const P3_006_SQL_CASE_IDS = [
  "MS-S01",
  "MS-S02",
  "MS-S03",
  "IN-S01",
  "IN-S02",
  "IN-S03",
  "IN-S04",
  "IN-S05",
  "CA-S01",
  "CA-S02",
  "CA-S03",
  "JB-S01",
  "JB-S02",
  "JB-S03",
  "MA-S01",
  "MA-S02",
  "MA-S03",
  "MA-S04",
  "MA-S05",
] as const;
