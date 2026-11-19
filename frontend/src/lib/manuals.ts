/**
 * ENV-PARITY-P3-005 — the manuals lib (lane P3.5): the §3.22/§3.26
 * manual-shelf tables (คู่มือ ×2 — D1-2 RULED two tables, never one
 * shared table) as link-only metadata.
 *
 * Surface: public.manual_wastewater + public.manual_water_supply
 * (security_invoker views over core.manual_wastewater /
 * core.manual_water_supply — the ONE additive P3.5 migration
 * 20261118000007_parity_p3_005.sql; RLS: SELECT staff-or-admin,
 * INSERT/UPDATE/DELETE admin — the D1-6 admin-manage/staff-read posture;
 * zero anon policies, anonymous access fails closed).
 *
 * D1-4 file semantics (THE pin of this lane): the stored refs are
 * VERBATIM legacy metadata (คู่มือ_Files_/<id>.link.<HHMMSS>.pdf +
 * คู่มือ_Images/…); the actual PDFs/JPGs live in the AppSheet Drive
 * folders and NEVER enter repo/DB/bundle/chat — this lib moves metadata
 * ONLY (no fetch/embed/blob of file content, contract-tested). The UI
 * renders a new-tab anchor ONLY when the ref is an absolute http(s) URL;
 * legacy relative refs render as plain text + the honest note (the
 * AppSheet gettablefileurl resolution is infrastructure NOT replicated —
 * the P3.4 L.Image precedent). Unknown ≠ clickable: never a fake link.
 *
 * Honesty: the water-supply table carries 0 rows at delivery
 * (SOURCE_UNAVAILABLE — the owner sheet-share obligation is carried);
 * the UI renders the verbatim honest empty state, never a fabricated row.
 */
import { useQuery, useQueryClient, useMutation, type UseMutationResult } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useCallback } from "react";

export type ManualDomain = "wastewater" | "watersupply";

/** The row's "คู่มือ ×2" verbatim (D1-2): two façade tables. */
export const MANUAL_TABLES: Record<ManualDomain, string> = {
  wastewater: "manual_wastewater",
  watersupply: "manual_water_supply",
};

/** Thai domain labels (the AppSheet card views §3.22/§3.26). */
export const MANUAL_DOMAIN_LABELS: Record<ManualDomain, string> = {
  wastewater: "คู่มืองานบ่อบำบัด",
  watersupply: "คู่มือน้ำประปา",
};

/** The honest empty state for the น้ำประปา tab (WO §5; never a fabricated row). */
export const EMPTY_WATER_SUPPLY_LABEL = "ยังไม่มีข้อมูล — รอแหล่งข้อมูลจากเจ้าของระบบเดิม";

/** The honest note for legacy relative refs (WO §4-2 verbatim). */
export const LEGACY_DRIVE_NOTE = "คำเตือน: ไฟล์อยู่ในไดรฟ์ของระบบเดิม";

export interface ManualRow {
  id: string;
  legacy_id: string | null;
  title: string;
  image_ref: string | null;
  file_ref: string | null;
  source_provenance: string | null;
  created_at: string;
}

/** Absolute http(s) URL test (case-insensitive scheme) — the ONLY form
 *  that ever renders as a link (D1-4: unknown ≠ clickable). */
export function isAbsoluteHttpUrl(ref: string | null | undefined): boolean {
  if (!ref) return false;
  const s = ref.trim();
  if (!s) return false;
  return /^https?:\/\//i.test(s);
}

/** The D1-4 link-display predicate: an absolute http(s) ref renders a
 *  new-tab anchor; any other nonblank ref is a legacy relative Drive ref
 *  rendering as text + LEGACY_DRIVE_NOTE; blank renders nothing. */
export function fileLinkKind(ref: string | null | undefined): "external" | "legacy" | "none" {
  if (!ref || !ref.trim()) return "none";
  return isAbsoluteHttpUrl(ref) ? "external" : "legacy";
}

export interface ManualFormInput {
  title: string;
  image_ref: string | null;
  file_ref: string | null;
}

/** Build the insert/update payload with house honesty: verbatim strings
 *  trimmed (never rewritten), blanks ⇒ NULL (unknown ≠ fabricated);
 *  รายการ is the AppSheet Label — an empty title throws. */
export function buildManualPayload(input: ManualFormInput): Record<string, unknown> {
  const title = input.title.trim();
  if (!title) throw new Error("รายการ (title) เป็นช่องบังคับกรอก");
  const image = input.image_ref?.trim() ?? "";
  const file = input.file_ref?.trim() ?? "";
  return {
    title,
    image_ref: image === "" ? null : image,
    file_ref: file === "" ? null : file,
  };
}

async function fetchManuals(domain: ManualDomain): Promise<ManualRow[]> {
  const { data, error } = await supabase
    .from(MANUAL_TABLES[domain])
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ManualRow[];
}

export function useManuals(domain: ManualDomain) {
  const q = useQuery({
    queryKey: ["manuals", domain] as const,
    queryFn: () => fetchManuals(domain),
  });
  return {
    data: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refresh: () => q.refetch(),
  };
}

type ManualMutation = UseMutationResult<ManualRow | null, Error, Record<string, unknown>>;

function useManualMutation(
  domain: ManualDomain,
  op: "insert" | "update",
  id?: string,
): ManualMutation {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      let builder = supabase.from(MANUAL_TABLES[domain]);
      const b =
        op === "insert"
          ? builder.insert(payload).select("*").single()
          : builder.update(payload).eq("id", id ?? "").select("*").single();
      const { data, error } = await b;
      if (error) throw new Error(error.message);
      return data as ManualRow | null;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["manuals", domain] });
    },
  });
}

export function useCreateManual(domain: ManualDomain) {
  const m = useManualMutation(domain, "insert");
  const mutate = useCallback(
    async (payload: Record<string, unknown>): Promise<{ data: ManualRow | null; error: string | null }> => {
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

export function useUpdateManual(domain: ManualDomain, id: string) {
  const m = useManualMutation(domain, "update", id);
  const mutate = useCallback(
    async (payload: Record<string, unknown>): Promise<{ data: ManualRow | null; error: string | null }> => {
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

export function useDeleteManual(domain: ManualDomain) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(MANUAL_TABLES[domain]).delete().eq("id", id);
      if (error) throw new Error(error.message);
      return null;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["manuals", domain] });
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
