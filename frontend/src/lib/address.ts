/**
 * ENV-PARITY-P3-005 — the address lib (lane P3.5): the §3.6 report-header
 * reference table (8 cols, key TambonID — D1-9 RULED verbatim 8) as
 * `core.address`, the B7 admin-EDITABLE reference (2026-11-15: หัวรายงาน =
 * ตารางแก้ไขได้ — ไม่ฝังในเทมเพลต).
 *
 * Surface: public.address (security_invoker view over core.address — the
 * ONE additive P3.5 migration 20261118…000007_parity_p3_005.sql; RLS:
 * SELECT staff-or-admin, INSERT/UPDATE/DELETE admin — zero anon policies,
 * anonymous access fails closed).
 *
 * D1-5/D1-9 Address_Key semantics: the AppSheet virtual column (App
 * formula =[TambonThai]&"-"&[DistrictThai]&"-"&[ProvinceThai]) is NEVER
 * stored — no column, no generated column, no trigger (contract-tested).
 * addressKey() derives it display-time from the row's live values.
 *
 * P2.3 float-id lesson: the markad tab stores the ids as sheet floats
 * (910104.0); everything entering the DB is integer-coerced here
 * (coerceAddressInt) — a non-integral value throws, never a silent store.
 *
 * Census honesty: the seeded census is 7,436/7,436 (D1-3 full census);
 * the UI searches + paginates client-side over the fetched census — the
 * rows are never rendered unpaginated.
 */
import { useQuery, useQueryClient, useMutation, type UseMutationResult } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useCallback } from "react";

export interface AddressRow {
  id: string;
  tambon_id: number;
  tambon_thai: string;
  district_id: number;
  district_thai: string;
  province_id: number;
  province_thai: string;
  source_provenance: string | null;
  created_at: string;
}

/** The bounded page size — the 7,436-row census is NEVER rendered
 *  unpaginated (WO §5). */
export const ADDRESS_PAGE_SIZE = 50;

/** The on-screen Phase-4 dependency note (WO §5: noted, never built). */
export const ADDRESS_PHASE4_NOTE =
  "หัวรายงาน ทส. จะอ่านจากตารางนี้ใน Phase 4 — ยังไม่เชื่อมในเลนนี้";

/** Integer coercion for the id columns (the P2.3 float lesson):
 *  910104.0 → 910104; "100101" → 100101; non-integral values THROW
 *  (never a silent float/NaN store). */
export function coerceAddressInt(v: number | string | null | undefined): number {
  if (v === null || v === undefined) throw new Error("ค่ารหัสเป็นช่องบังคับกรอก");
  const s = typeof v === "string" ? v.trim() : v;
  if (s === "" || s === null || s === undefined) throw new Error("ค่ารหัสเป็นช่องบังคับกรอก");
  const n = typeof s === "string" ? Number(s) : (s as number);
  if (!Number.isFinite(n)) throw new Error(`ค่ารหัสไม่ใช่ตัวเลข: ${String(v)}`);
  if (!Number.isInteger(n)) throw new Error(`ค่ารหัสต้องเป็นจำนวนเต็ม: ${String(v)}`);
  return n;
}

/** The §3.6 Address_Key virtual formula VERBATIM
 *  (=[TambonThai]&"-"&[DistrictThai]&"-"&[ProvinceThai]) — display-time
 *  ONLY, derived from the row's live values each call (never cached,
 *  never stored). */
export function addressKey(row: Pick<AddressRow, "tambon_thai" | "district_thai" | "province_thai">): string {
  return `${row.tambon_thai}-${row.district_thai}-${row.province_thai}`;
}

export interface AddressFormInput {
  tambon_id: string | number;
  tambon_thai: string;
  district_id: string | number;
  district_thai: string;
  province_id: string | number;
  province_thai: string;
}

/** Build the insert/update payload with house honesty: the three id
 *  fields integer-coerced, the Thai names trimmed verbatim, everything
 *  required (the §3.6 key + the header chain); the payload NEVER carries
 *  an address_key field (the virtual is never stored). */
export function buildAddressPayload(input: AddressFormInput): Record<string, unknown> {
  const tambon_thai = input.tambon_thai.trim();
  const district_thai = input.district_thai.trim();
  const province_thai = input.province_thai.trim();
  if (!tambon_thai) throw new Error("ชื่อตำบลเป็นช่องบังคับกรอก");
  if (!district_thai) throw new Error("ชื่ออำเภอเป็นช่องบังคับกรอก");
  if (!province_thai) throw new Error("ชื่อจังหวัดเป็นช่องบังคับกรอก");
  return {
    tambon_id: coerceAddressInt(input.tambon_id),
    tambon_thai,
    district_id: coerceAddressInt(input.district_id),
    district_thai,
    province_id: coerceAddressInt(input.province_id),
    province_thai,
  };
}

/** Client-side census search: substring match over tambon/district/
 *  province names + the numeric ids as digits (the admin search box). */
export function filterAddressRows(rows: AddressRow[], query: string): AddressRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.tambon_thai.toLowerCase().includes(q) ||
      r.district_thai.toLowerCase().includes(q) ||
      r.province_thai.toLowerCase().includes(q) ||
      String(r.tambon_id).includes(q),
  );
}

/** Pagination slice (page is 1-based; out-of-range pages return []). */
export function paginateAddressRows(rows: AddressRow[], page: number, size: number): AddressRow[] {
  const start = (page - 1) * size;
  return rows.slice(start, start + size);
}

async function fetchAddressCensus(): Promise<AddressRow[]> {
  // Range-fetch in bounded pages so a PostgREST max-rows cap can never
 // silently truncate the census (the P2.5 "the report must see the full
  // range" lesson, applied to a 7,436-row master).
  const PAGE = 1000;
  const out: AddressRow[] = [];
  for (;;) {
    const { data, error } = await supabase
      .from("address")
      .select("*")
      .order("tambon_id", { ascending: true })
      .range(out.length, out.length + PAGE - 1);
    if (error) throw new Error(error.message);
    const chunk = (data ?? []) as AddressRow[];
    out.push(...chunk);
    if (chunk.length < PAGE) break;
  }
  return out;
}

export function useAddressCensus() {
  const q = useQuery({
    queryKey: ["address-census"] as const,
    queryFn: () => fetchAddressCensus(),
  });
  return {
    data: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refresh: () => q.refetch(),
  };
}

type AddressMutation = UseMutationResult<AddressRow | null, Error, Record<string, unknown>>;

function useAddressMutation(op: "insert" | "update", id?: string): AddressMutation {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      let builder = supabase.from("address");
      const b =
        op === "insert"
          ? builder.insert(payload).select("*").single()
          : builder.update(payload).eq("id", id ?? "").select("*").single();
      const { data, error } = await b;
      if (error) throw new Error(error.message);
      return data as AddressRow | null;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["address-census"] });
    },
  });
}

export function useCreateAddress() {
  const m = useAddressMutation("insert");
  const mutate = useCallback(
    async (payload: Record<string, unknown>): Promise<{ data: AddressRow | null; error: string | null }> => {
      try {
        const data = await m.mutateAsync(payload);
        return { data: data ?? null, error: null };
      } catch (e) {
        return { data: null, error: e instanceof Error ? e.message : String(e) };
      }
    },
    [m],
  );
  return { loading: m.isPending, error: m.error?.message ?? null, mutate };
}

export function useUpdateAddress(id: string) {
  const m = useAddressMutation("update", id);
  const mutate = useCallback(
    async (payload: Record<string, unknown>): Promise<{ data: AddressRow | null; error: string | null }> => {
      try {
        const data = await m.mutateAsync(payload);
        return { data: data ?? null, error: null };
      } catch (e) {
        return { data: null, error: e instanceof Error ? e.message : String(e) };
      }
    },
    [m],
  );
  return { loading: m.isPending, error: m.error?.message ?? null, mutate };
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("address").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return null;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["address-census"] });
    },
  });
  const mutate = useCallback(
    async (id: string): Promise<{ data: null; error: string | null }> => {
      try {
        await m.mutateAsync(id);
        return { data: null, error: null };
      } catch (e) {
        return { data: null, error: e instanceof Error ? e.message : String(e) };
      }
    },
    [m],
  );
  return { loading: m.isPending, error: m.error?.message ?? null, mutate };
}
