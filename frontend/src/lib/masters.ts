/**
 * ENV-PARITY-P3-001 — the four AppSheet master tables (lane P3.1): lib +
 * REST access + picker data. Track Z owns logic; Track F owns polish.
 *
 * Surfaces (all via the public security_invoker façade views created by
 * migration 20261118000001_parity_p3_001.sql; RLS gates every row —
 * SELECT staff-or-admin, INSERT/UPDATE/DELETE admin):
 *   public.item / public.vendor / public.item_category / public.distributor
 *
 * Ground truth: reference 12 §3.29 Items / §3.31 Vendors / §3.27
 * Categories / §3.15 distributor (READ-ONLY doc). Honesty rules (WO D1-7):
 * blanks ⇒ NULL everywhere (unknown ≠ ''/0); empty masters surface honest
 * empty labels — never a fabricated option, never a silent blank; the
 * Items Category enum tokens are a UI-restricted verbatim list (NO hard
 * CHECK; P1.001 lesson).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

// ─── Verbatim AppSheet value sets ────────────────────────────────────────

/** Items.Category Enum tokens VERBATIM (ref 12 ref 4792 — the tokens are
 * legacy Categories IDs; Categories is SOURCE_UNAVAILABLE so they stay
 * UI-restricted values in item.category_legacy, never seeded rows). */
export const CATEGORY_TOKENS = ["w6hwsyj", "72b68b19", "9a7ebdaf"] as const;
export type CategoryToken = (typeof CATEGORY_TOKENS)[number];

/** Honest empty labels (WO §4 — empty masters pickers/sections never
 * fabricate options). */
export const EMPTY_ITEM_PICKER_LABEL = "ยังไม่มีข้อมูลอุปกรณ์";
export const EMPTY_VENDORS_LABEL = "ยังไม่มีข้อมูลผู้ขาย";
export const EMPTY_CATEGORIES_LABEL = "ยังไม่มีข้อมูลหมวดหมู่";
export const EMPTY_DISTRIBUTOR_LABEL = "ยังไม่มีข้อมูลผู้จัดจำหน่าย";

// ─── Row types (the migration's column shapes) ───────────────────────────

export interface ItemRow {
  id: string;
  legacy_id: string | null;
  name: string | null;
  description: string | null;
  image_path: string | null;
  category_legacy: string | null;
  category_id: string | null;
  vendor_id: string | null;
  purchase_cost: number | null;
  unit_count_num: number | null;
  unit_count: string | null;
  unit_formula: string | null;
  unit_use_num: number | null;
  unit_calculate: string | null;
  user_manual_path: string | null;
  min_qty: number | null;
  max_qty: number | null;
  source_provenance: string | null;
}

export interface ItemCategoryRow {
  id: string;
  category: string | null;
  icon_path: string | null;
  source_provenance: string | null;
  legacy_id: string | null;
}

export interface VendorRow {
  id: string;
  name: string | null;
  logo_path: string | null;
  url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  source_provenance: string | null;
  legacy_id: string | null;
}

export interface DistributorRow {
  id: string;
  legacy_id: string | null;
  dealer: string | null;
  dealer_email: string | null;
  dealer_address: string | null;
  dealer_tel: string | null;
  salesname: string | null;
  line_id: string | null;
  source_provenance: string | null;
}

// ─── Honesty helpers — blanks ⇒ NULL (D1-7) ──────────────────────────────

/** '' / whitespace-only ⇒ null; non-blank text passes through verbatim
 * (inner spaces untouched — the P2.1 verbatim-bytes discipline). */
export function toNullableText(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return v.trim() === "" ? null : v;
}

/** '' / whitespace-only ⇒ null; finite number otherwise (never coerced to
 * 0 — unknown ≠ zero). Non-numeric input throws (form validation is
 * upstream; this is the last guard). */
export function toNullableNumber(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error(`ค่าตัวเลขไม่ถูกต้อง: ${v}`);
  return n;
}

// ─── Payload builders (pure; unit-covered by masters.test.ts) ────────────

export interface DistributorFormInput {
  dealer: string;
  dealer_email: string;
  dealer_address: string;
  dealer_tel: string;
  salesname: string;
  line_id: string;
}

export interface DistributorPayload {
  dealer: string | null;
  dealer_email: string | null;
  dealer_address: string | null;
  dealer_tel: string | null;
  salesname: string | null;
  line_id: string | null;
  legacy_id?: string | null;
}

/** Verbatim fields, blanks ⇒ NULL; optional legacy_id carries the
 * create-verbatim / update-target through unchanged. */
export function buildDistributorPayload(
  input: DistributorFormInput,
  legacyId?: string,
): DistributorPayload {
  return {
    dealer: toNullableText(input.dealer),
    dealer_email: toNullableText(input.dealer_email),
    dealer_address: toNullableText(input.dealer_address),
    dealer_tel: toNullableText(input.dealer_tel),
    salesname: toNullableText(input.salesname),
    line_id: toNullableText(input.line_id),
    ...(legacyId !== undefined ? { legacy_id: legacyId } : {}),
  };
}

export interface ItemFormInput {
  name: string;
  description?: string;
  category_token?: string;
  category_id?: string | null;
  vendor_id?: string | null;
  purchase_cost?: string;
  unit_count_num?: string;
  unit_count?: string;
  unit_formula?: string;
  unit_use_num?: string;
  unit_calculate?: string;
  min_qty?: string;
  max_qty?: string;
}

export interface ItemPayload {
  name: string | null;
  description: string | null;
  category_legacy: string | null;
  category_id: string | null;
  vendor_id: string | null;
  purchase_cost: number | null;
  unit_count_num: number | null;
  unit_count: string | null;
  unit_formula: string | null;
  unit_use_num: number | null;
  unit_calculate: string | null;
  min_qty: number | null;
  max_qty: number | null;
}

/** Item payload: the verbatim enum token lands in category_legacy unless a
 * resolved Categories row is picked (category_id); out-of-vocabulary
 * tokens throw (the UI list is the restriction — never a silent accept). */
export function buildItemPayload(input: ItemFormInput): ItemPayload {
  const token = toNullableText(input.category_token);
  if (token !== null && !(CATEGORY_TOKENS as readonly string[]).includes(token)) {
    throw new Error(`หมวดหมู่ไม่อยู่ในชุดค่าที่กำหนด: ${token}`);
  }
  return {
    name: toNullableText(input.name),
    description: toNullableText(input.description),
    category_legacy: input.category_id ? null : token,
    category_id: input.category_id ?? null,
    vendor_id: input.vendor_id ?? null,
    purchase_cost: toNullableNumber(input.purchase_cost),
    unit_count_num: toNullableNumber(input.unit_count_num),
    unit_count: toNullableText(input.unit_count),
    unit_formula: toNullableText(input.unit_formula),
    unit_use_num: toNullableNumber(input.unit_use_num),
    unit_calculate: toNullableText(input.unit_calculate),
    min_qty: toNullableNumber(input.min_qty),
    max_qty: toNullableNumber(input.max_qty),
  };
}

/** Picker label: name + legacy id (AppSheet อุปกรณ์/ชนิดเครื่องมือตรวจ
 * carry the Item ID); falls back to the legacy id when the name is blank. */
export function formatItemOption(item: Pick<ItemRow, "name" | "legacy_id">): string {
  const name = toNullableText(item.name);
  const legacy = toNullableText(item.legacy_id) ?? "";
  return name ? `${name} (${legacy})` : legacy;
}

// ─── REST access (the public façade views) ───────────────────────────────

const ITEM_COLUMNS =
  "id, legacy_id, name, description, image_path, category_legacy, category_id, vendor_id, purchase_cost, unit_count_num, unit_count, unit_formula, unit_use_num, unit_calculate, user_manual_path, min_qty, max_qty, source_provenance";
const CATEGORY_COLUMNS = "id, category, icon_path, source_provenance, legacy_id";
const VENDOR_COLUMNS = "id, name, logo_path, url, phone, email, address, source_provenance, legacy_id";
const DISTRIBUTOR_COLUMNS =
  "id, legacy_id, dealer, dealer_email, dealer_address, dealer_tel, salesname, line_id, source_provenance";

export async function fetchItems(): Promise<ItemRow[]> {
  const { data, error } = await supabase
    .from("item")
    .select(ITEM_COLUMNS)
    .order("name", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ItemRow[];
}

export async function fetchItemCategories(): Promise<ItemCategoryRow[]> {
  const { data, error } = await supabase
    .from("item_category")
    .select(CATEGORY_COLUMNS)
    .order("category", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ItemCategoryRow[];
}

export async function fetchVendors(): Promise<VendorRow[]> {
  const { data, error } = await supabase
    .from("vendor")
    .select(VENDOR_COLUMNS)
    .order("name", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as VendorRow[];
}

export async function fetchDistributors(): Promise<DistributorRow[]> {
  const { data, error } = await supabase
    .from("distributor")
    .select(DISTRIBUTOR_COLUMNS)
    .order("dealer", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DistributorRow[];
}

export async function createItem(payload: Partial<ItemPayload>): Promise<ItemRow> {
  const { data, error } = await supabase
    .from("item")
    .insert({ ...payload, source_provenance: "ENV UI manual entry (P3.1 masters)" })
    .select(ITEM_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as ItemRow;
}

export async function updateItem(id: string, payload: Partial<ItemPayload>): Promise<void> {
  const { error } = await supabase.from("item").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from("item").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createItemCategory(payload: { category: string | null; icon_path: string | null }): Promise<ItemCategoryRow> {
  const { data, error } = await supabase
    .from("item_category")
    .insert({ ...payload, source_provenance: "ENV UI manual entry (P3.1 masters)" })
    .select(CATEGORY_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as ItemCategoryRow;
}

export async function updateItemCategory(id: string, payload: { category: string | null; icon_path: string | null }): Promise<void> {
  const { error } = await supabase.from("item_category").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteItemCategory(id: string): Promise<void> {
  const { error } = await supabase.from("item_category").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createVendor(payload: {
  name: string | null;
  logo_path: string | null;
  url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}): Promise<VendorRow> {
  const { data, error } = await supabase
    .from("vendor")
    .insert({ ...payload, source_provenance: "ENV UI manual entry (P3.1 masters)" })
    .select(VENDOR_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as VendorRow;
}

export async function updateVendor(id: string, payload: {
  name: string | null;
  logo_path: string | null;
  url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}): Promise<void> {
  const { error } = await supabase.from("vendor").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteVendor(id: string): Promise<void> {
  const { error } = await supabase.from("vendor").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createDistributor(payload: DistributorPayload): Promise<DistributorRow> {
  const { data, error } = await supabase
    .from("distributor")
    .insert({ ...payload, source_provenance: "ENV UI manual entry (P3.1 masters)" })
    .select(DISTRIBUTOR_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as DistributorRow;
}

export async function updateDistributor(id: string, payload: DistributorPayload): Promise<void> {
  const { error } = await supabase.from("distributor").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteDistributor(id: string): Promise<void> {
  const { error } = await supabase.from("distributor").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Read hooks (the hooks.ts caller shape; local — hooks.ts is out of
//     this lane's scope) ──────────────────────────────────────────────────

function useMasterQuery<T>(key: readonly unknown[], fn: () => Promise<T[]>) {
  const q = useQuery({ queryKey: key, queryFn: fn });
  return { data: q.data ?? [], loading: q.isLoading, error: q.error?.message ?? null, refresh: () => q.refetch() };
}

export function useItems() {
  return useMasterQuery<ItemRow>(["p3-items"], fetchItems);
}

export function useItemCategories() {
  return useMasterQuery<ItemCategoryRow>(["p3-item-categories"], fetchItemCategories);
}

export function useVendors() {
  return useMasterQuery<VendorRow>(["p3-vendors"], fetchVendors);
}

export function useDistributors() {
  return useMasterQuery<DistributorRow>(["p3-distributors"], fetchDistributors);
}

// ─── Mutation hooks — caller shape { loading, error, mutate } ────────────

type MutationTuple = { loading: boolean; error: string | null; mutate: (fn: () => Promise<unknown>) => Promise<{ error: string | null }> };

function useMasterMutation(keys: readonly unknown[][]): MutationTuple {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSettled: () => {
      for (const k of keys) void qc.invalidateQueries({ queryKey: k });
    },
  });
  const mutate = async (fn: () => Promise<unknown>) => {
    try {
      await m.mutateAsync(fn);
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  };
  return { loading: m.isPending, error: m.error?.message ?? null, mutate };
}

const ALL_MASTER_KEYS = [
  ["p3-items"],
  ["p3-item-categories"],
  ["p3-vendors"],
  ["p3-distributors"],
] as unknown[][];

export function useCreateItem() {
  return useMasterMutation(ALL_MASTER_KEYS);
}
export function useUpdateItem() {
  return useMasterMutation(ALL_MASTER_KEYS);
}
export function useDeleteItem() {
  return useMasterMutation(ALL_MASTER_KEYS);
}
export function useCreateItemCategory() {
  return useMasterMutation(ALL_MASTER_KEYS);
}
export function useUpdateItemCategory() {
  return useMasterMutation(ALL_MASTER_KEYS);
}
export function useDeleteItemCategory() {
  return useMasterMutation(ALL_MASTER_KEYS);
}
export function useCreateVendor() {
  return useMasterMutation(ALL_MASTER_KEYS);
}
export function useUpdateVendor() {
  return useMasterMutation(ALL_MASTER_KEYS);
}
export function useDeleteVendor() {
  return useMasterMutation(ALL_MASTER_KEYS);
}
export function useCreateDistributor() {
  return useMasterMutation(ALL_MASTER_KEYS);
}
export function useUpdateDistributor() {
  return useMasterMutation(ALL_MASTER_KEYS);
}
export function useDeleteDistributor() {
  return useMasterMutation(ALL_MASTER_KEYS);
}
