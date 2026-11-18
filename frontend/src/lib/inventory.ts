/**
 * ENV-PARITY-P3-002 — the chlorine inventory lib (lane P3.2): lot CRUD +
 * the FEFO auto-deduction RPC wrappers + truthful result badges.
 * Track Z owns logic; Track F owns polish.
 *
 * Surfaces:
 *   public.inventory_lot (security_invoker view over chemical.inventory_lot)
 *   chemical.fn_deduct_chlorine_stock / chemical.fn_revoke_chlorine_deduction
 *   (SECURITY INVOKER RPCs — RLS applies; migration 20261118000002 + the
 *   20261118000003_parity_p3_002_fix.sql guarded config seed)
 *
 * Ground truth: reference 12 §3.28 Inventory (READ-ONLY doc, ref 4679-4751);
 * the manual `Deduct Chlorine Stock` action anchor `=[Item ID] = "0c0e6a47"`
 * at ref 6014 (the bot is DISABLED at source — auto-deduct is an ENV-new
 * capability per owner answer B6 2026-11-15, never an AppSheet transcription).
 *
 * Honesty rules (WO §4-6): unknown ≠ zero — no lot / no mapping config =
 * skipped + flagged, never deducted-as-0, never stock fabricated; latest ≠
 * live — deduction reads receipted lots, never sensor telemetry; blanks ⇒
 * NULL; พ.ศ. user-facing dates are the render layer's job, storage is ISO.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

// ─── Verbatim pins ───────────────────────────────────────────────────────

/** The AppSheet `Deduct Chlorine Stock` action anchor (ref 6014 verbatim:
 * `=[Item ID] = "0c0e6a47"`). The RPC resolves the master by this config
 * value seeded in chemical.master.legacy_item_id — never hardcoded stock
 * logic beyond this constant mirroring the DB contract. */
export const CHLORINE_LEGACY_ITEM_ID = "0c0e6a47";

/** Deduction source tables (the D1-3 BOTH-IN ruling). */
export const SOURCE_WASTEWATER = "wastewater.reading";
export const SOURCE_WATER_SUPPLY = "water_supply.daily_check";

export const EMPTY_LOTS_LABEL = "ยังไม่มีล็อตสต๊อก — รอการรับเข้าจริง";

// ─── Row / result types ──────────────────────────────────────────────────

export interface InventoryLotRow {
  id: string;
  master_id: string | null;
  item_id: string | null;
  item_legacy_id: string | null;
  receipt_date: string;
  lot_no: string | null;
  mfg_date: string | null;
  expiry_date: string | null;
  lifetime_note: string | null;
  amount_received: number;
  amount_deducted: number;
  amount_remaining: number;
  source_provenance: string | null;
  legacy_id: string | null;
  note: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface DeductionAllocation {
  lot_id: string;
  lot_no: string | null;
  quantity: number;
  movement_id: string;
}

/** The typed RPC result (chemical.fn_deduct_chlorine_stock jsonb shape —
 * the R2 P3-2 pin: an already-deducted retry is an idempotent success
 * carrying the truthful flag, never a second deduction, never a misreport). */
export interface DeductionResult {
  status:
    | "deducted"
    | "partial"
    | "skipped"
    | "already-deducted"
    | "already-skipped"
    | "reversed"
    | "nothing-to-reverse"
    | "noop";
  deducted_total: number;
  shortfall: number;
  already_recorded: boolean;
  allocated: DeductionAllocation[];
  reason: string | null;
  /** Reversal results only (fn_revoke_chlorine_deduction). */
  restored_total?: number;
}

export interface ReversalResult {
  status: "reversed" | "nothing-to-reverse";
  restored_total: number;
  allocated: DeductionAllocation[];
  reason: string | null;
}

// ─── Derivations (view-mirroring, never re-invented math) ────────────────

/**
 * คลอรีนน้ำที่ใช้จริง — the verbatim ÷SWITCH formula of
 * wastewater.v_reading_meter_chain (migration 20261115140000, ref 12 ~767):
 * blank/unknown ratio or NULL value → NULL, never 0. The deduction quantity
 * for the wastewater flow is THIS derived value (WO §4-1).
 */
export function chlorineUsedReal(
  chlorineUsed: number | null,
  mixRatio: string | null
): number | null {
  if (chlorineUsed === null) return null;
  switch (mixRatio) {
    case "1:2":
      return chlorineUsed / 2;
    case "1:4":
      return chlorineUsed / 4;
    case "1:9":
      return chlorineUsed / 9;
    default:
      return null;
  }
}

// ─── Truthful badges (WO §5 texts) ───────────────────────────────────────

/** Non-blocking badge/note text for a deduction result — every status is
 * surfaced truthfully (deducted / partial / skipped / already-* / reversed),
 * never silent, never a fabricated success. */
export function formatDeductionBadge(result: DeductionResult): string {
  const lots = result.allocated
    .map((a) => a.lot_no)
    .filter((n): n is string => Boolean(n))
    .join(", ");
  switch (result.status) {
    case "deducted":
      return `หักสต๊อกแล้ว ${result.deducted_total} kg (FEFO ล็อต ${lots || "—"})`;
    case "partial":
      return `หักสต๊อกได้บางส่วน ${result.deducted_total} kg (FEFO ล็อต ${lots || "—"}) — สต๊อกไม่พอ ขาด ${result.shortfall} (บันทึกการใช้แล้ว แต่ยังขาดการหัก)`;
    case "skipped":
      if (result.reason?.startsWith("mapping config absent")) {
        return `ไม่มีสต๊อกพอ — บันทึกการใช้แล้ว แต่ยังไม่ได้หักสต๊อก (ขาด ${result.shortfall}) — ยังไม่ได้ตั้งค่ารายการคลอรีนในระบบ`;
      }
      return `ไม่มีสต๊อกพอ — บันทึกการใช้แล้ว แต่ยังไม่ได้หักสต๊อก (ขาด ${result.shortfall})`;
    case "already-deducted":
      return `บันทึกนี้ถูกหักสต๊อกไปแล้ว ${result.deducted_total} kg ก่อนหน้านี้ — ไม่หักซ้ำ`;
    case "already-skipped":
      return `บันทึกนี้เคยพยายามหักสต๊อกแล้วแต่สต๊อกไม่พอ (ขาด ${result.shortfall}) — ไม่พยายามซ้ำ`;
    case "reversed":
      return `ย้อนหักสต๊อกแล้ว ${result.restored_total ?? result.deducted_total} kg (คืนล็อต ${
        lots || "—"
      })`;
    case "nothing-to-reverse":
      return "ไม่มีรายการหักสต๊อกให้ย้อน — ไม่มีการเปลี่ยนแปลง";
    case "noop":
      return "ไม่มีปริมาณใช้คลอรีน — ไม่ต้องหักสต๊อก";
  }
}

// ─── RPC wrappers ────────────────────────────────────────────────────────

export async function deductChlorineStock(input: {
  sourceTable: string;
  sourceId: string;
  quantity: number;
  movementDate?: string;
}): Promise<DeductionResult> {
  const { data, error } = await supabase.rpc("fn_deduct_chlorine_stock", {
    p_source_table: input.sourceTable,
    p_source_id: input.sourceId,
    p_quantity: input.quantity,
    p_movement_date: input.movementDate ?? null,
  });
  if (error) throw new Error(error.message);
  return data as DeductionResult;
}

export async function revokeChlorineDeduction(input: {
  sourceTable: string;
  sourceId: string;
  reversalDate?: string;
}): Promise<ReversalResult> {
  const { data, error } = await supabase.rpc("fn_revoke_chlorine_deduction", {
    p_source_table: input.sourceTable,
    p_source_id: input.sourceId,
    p_reversal_date: input.reversalDate ?? null,
  });
  if (error) throw new Error(error.message);
  return data as ReversalResult;
}

/**
 * Wastewater save-path wiring (D1-3, additive): derive the ÷SWITCH real
 * usage from the SAVED payload and call the RPC. Returns the truthful badge
 * text (never throws for deduction outcomes — a deduction failure must not
 * misreport the usage save, which already succeeded; the caller toasts the
 * warning — the statusMirrorWarning precedent).
 */
export async function deductForReading(input: {
  readingId: string;
  chlorineUsed: number | null;
  mixRatio: string | null;
  readingDate?: string;
}): Promise<string | null> {
  const real = chlorineUsedReal(input.chlorineUsed, input.mixRatio);
  if (real === null) {
    return "ยังไม่ได้หักสต๊อก — ไม่ทราบปริมาณคลอรีนจริง (อัตราส่วนผสมว่างหรือไม่รู้จัก)";
  }
  if (real <= 0) return null; // honest no-op — zero usage deducts nothing
  try {
    const result = await deductChlorineStock({
      sourceTable: SOURCE_WASTEWATER,
      sourceId: input.readingId,
      quantity: Math.round(real * 1000) / 1000,
      movementDate: input.readingDate,
    });
    return formatDeductionBadge(result);
  } catch (e) {
    return `ยังไม่ได้หักสต๊อก (RPC ล้มเหลว): ${(e as Error).message}`;
  }
}

/**
 * Water-supply save-path wiring (D1-3, additive): the REAL quantity is the
 * view-owned chlorine_usage_realy (÷(1+9) spec-driven per A3) — read back
 * from v_daily_check_chain for the saved row, never re-derived client-side
 * (the report-summary precedent: view math is consumed, not mirrored).
 * Missing spec → honest skip note, never a guessed quantity.
 */
export async function deductForWaterSupplyCheck(input: {
  checkId: string;
  checkDate?: string;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from("v_daily_check_chain")
    .select("id, chlorine_usage_realy")
    .eq("id", input.checkId)
    .maybeSingle();
  if (error) {
    return `ยังไม่ได้หักสต๊อก (อ่านค่าคลอรีนจริงไม่สำเร็จ): ${error.message}`;
  }
  const real = (data as { chlorine_usage_realy: number | null } | null)
    ?.chlorine_usage_realy;
  if (real === null || real === undefined) {
    return "ยังไม่ได้หักสต๊อก — ค่าคลอรีนจริง (÷สเปกผสม) ยังคำนวณไม่ได้ (สเปกขาดหาย)";
  }
  if (real <= 0) return null;
  try {
    const result = await deductChlorineStock({
      sourceTable: SOURCE_WATER_SUPPLY,
      sourceId: input.checkId,
      quantity: Math.round(real * 1000) / 1000,
      movementDate: input.checkDate,
    });
    return formatDeductionBadge(result);
  } catch (e) {
    return `ยังไม่ได้หักสต๊อก (RPC ล้มเหลว): ${(e as Error).message}`;
  }
}

/**
 * Delete-path reversal wiring (the D2 P3-1 ruling): after a usage row is
 * deleted, compensate its recorded deduction. Best-effort — a reversal
 * failure returns an honest warning (the delete itself already succeeded;
 * misreporting it as failed would lie twice).
 */
export async function revokeForUsageRow(input: {
  sourceTable: string;
  sourceId: string;
}): Promise<string | null> {
  try {
    const result = await revokeChlorineDeduction(input);
    return formatDeductionBadge({
      status: result.status,
      deducted_total: 0,
      shortfall: 0,
      already_recorded: false,
      allocated: result.allocated,
      reason: result.reason,
    } as DeductionResult);
  } catch (e) {
    return `ยังไม่ได้ย้อนหักสต๊อก (RPC ล้มเหลว): ${(e as Error).message}`;
  }
}

/** FEFO preview order — mirrors the RPC: expiry ASC NULLS LAST, receipt,
 * created. Pure + exported for tests and the stock view. */
export function fefoOrder(rows: InventoryLotRow[]): InventoryLotRow[] {
  return [...rows].sort((a, b) => {
    const ax = a.expiry_date ?? "";
    const bx = b.expiry_date ?? "";
    if (ax === "" && bx !== "") return 1;
    if (bx === "" && ax !== "") return -1;
    if (ax !== bx) return ax < bx ? -1 : 1;
    if (a.receipt_date !== b.receipt_date) return a.receipt_date < b.receipt_date ? -1 : 1;
    return a.created_at < b.created_at ? -1 : 1;
  });
}

// ─── Lot CRUD (admin; RLS gates INSERT/DELETE admin) ─────────────────────

const LOT_COLUMNS =
  "id, master_id, item_id, item_legacy_id, receipt_date, lot_no, mfg_date, expiry_date, lifetime_note, amount_received, amount_deducted, amount_remaining, source_provenance, legacy_id, note, recorded_by, created_at";

export function useInventoryLots() {
  const q = useQuery({
    queryKey: ["inventory-lots"] as const,
    queryFn: async (): Promise<InventoryLotRow[]> => {
      const { data, error } = await supabase
        .from("inventory_lot")
        .select(LOT_COLUMNS)
        .order("receipt_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as InventoryLotRow[];
    },
  });
  return {
    data: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refresh: () => q.refetch(),
  };
}

/** The chemical master picker (the receipt's operational binding). Honest
 * empty state when the catalog is empty — never a fabricated option. */
export function useChemicalMasters() {
  const q = useQuery({
    queryKey: ["chemical-masters-active"] as const,
    queryFn: async (): Promise<{ id: string; name: string; unit: string }[]> => {
      const { data, error } = await supabase
        .from("master")
        .select("id, name, unit, is_active")
        .eq("is_active", true)
        .order("name");
      if (error) throw new Error(error.message);
      return (data ?? []) as { id: string; name: string; unit: string }[];
    },
  });
  return { data: q.data ?? [], loading: q.isLoading, error: q.error?.message ?? null };
}

export interface LotEntryForm {
  master_id: string;
  item_id: string;
  item_legacy_id: string;
  receipt_date: string;
  lot_no: string;
  mfg_date: string;
  expiry_date: string;
  lifetime_note: string;
  amount_received: string;
  note: string;
}

/** Blanks ⇒ NULL (unknown ≠ ''); amount_received must parse > 0 (never
 * fabricated stock); ถัง count rides in note — D1-7 receipt-time conversion
 * only, no invented tank→kg factor. */
export function buildLotPayload(form: Partial<LotEntryForm>): Record<string, unknown> {
  const blankToNull = (v?: string | null) => {
    const t = (v ?? "").trim();
    return t === "" ? null : t;
  };
  const rawAmount = blankToNull(form.amount_received);
  const amount = rawAmount === null ? NaN : Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("จำนวนรับเข้า (kg) ต้องเป็นตัวเลขมากกว่า 0 — ไม่สร้างสต๊อกจากค่าว่าง");
  }
  const payload: Record<string, unknown> = {
    master_id: blankToNull(form.master_id),
    item_id: blankToNull(form.item_id),
    item_legacy_id: blankToNull(form.item_legacy_id),
    receipt_date: blankToNull(form.receipt_date),
    lot_no: blankToNull(form.lot_no),
    mfg_date: blankToNull(form.mfg_date),
    expiry_date: blankToNull(form.expiry_date),
    lifetime_note: blankToNull(form.lifetime_note),
    amount_received: amount,
    note: blankToNull(form.note),
    source_provenance: "manual admin entry (ENV-PARITY-P3-002 inventory UI)",
  };
  return payload;
}

/**
 * One lot receipt = the inventory_lot row + ONE matching direction='in'
 * movement (the receipt-movement contract the SQL contract battery encodes):
 * chemical.master.current_balance (the fn_recompute_balance authority) is
 * net movements, so a receipt that skipped the ledger would push the master
 * balance negative on the next deduction — dishonest. Two sequential
 * writes (movement is master-linked; failure of the second surfaces an
 * honest warning) — an atomic receipt RPC is a possible future lane, not a
 * pinned surface here.
 */
export async function createInventoryLot(payload: Record<string, unknown>): Promise<void> {
  const { data, error } = await supabase
    .from("inventory_lot")
    .insert(payload)
    .select("id, master_id, receipt_date, lot_no, expiry_date, amount_received, note")
    .single();
  if (error) throw new Error(error.message);
  const lot = data as {
    id: string;
    master_id: string | null;
    receipt_date: string | null;
    lot_no: string | null;
    expiry_date: string | null;
    amount_received: number;
    note: string | null;
  };
  if (!lot.master_id) return; // no master binding → no ledger entry possible; the lot row is still the receipt of record
  const masterId = lot.master_id;
  const { data: master, error: masterError } = await supabase
    .from("master")
    .select("name, unit")
    .eq("id", masterId)
    .maybeSingle();
  if (masterError) throw new Error(masterError.message);
  const m = master as { name: string; unit: string } | null;
  const { error: movError } = await supabase.from("movement").insert({
    movement_date: lot.receipt_date,
    chemical_name: m?.name ?? "คลอรีน 10%",
    direction: "in",
    quantity: lot.amount_received,
    unit: m?.unit ?? "kg",
    purpose: "inventory lot receipt",
    note: lot.note ?? `lot ${lot.lot_no ?? lot.id}`,
    lot_no: lot.lot_no,
    expiry_date: lot.expiry_date,
    master_id: masterId,
  });
  if (movError) throw new Error(`บันทึกล็อตแล้ว แต่บันทึก movement รับเข้าไม่สำเร็จ: ${movError.message}`);
}
