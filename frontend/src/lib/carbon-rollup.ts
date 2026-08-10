/**
 * CRB-1..4 — Carbon rollup data layer (Scope 1+2+3 unified).
 *
 * Reads `carbon.v_unified_co2e` (SCHEMA-3 view) which UNIONs every
 * carbon-contributing table across all schemas. Per-scope + per-source
 * aggregation done server-side; client just shapes for display.
 *
 * Scope 1 (direct): fuel + garden
 * Scope 2 (indirect electricity): carbon.reading
 * Scope 3 (other indirect): waste + chemical
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { toLocalISODate } from "./utils";

export interface RollupRow {
  month: string;       // YYYY-MM-01
  scope: number;       // 1, 2, 3
  source: string;
  kg_co2e: number;
  row_count: number;
}

export interface ScopeSummary {
  scope: number;
  total_kg_co2e: number;
  source_count: number;
  has_data: boolean;
}

export interface RollupSummary {
  rows: RollupRow[];
  byScope: ScopeSummary[];
  grandTotalKg: number;
  /** Sources still without data — UI shows "ข้อมูล incomplete" flag. */
  incompleteSources: string[];
}

const EXPECTED_SOURCES = [
  // Scope 1
  "diesel", "gasoline", "lpg", "garden_fuel",
  // Scope 2
  "electricity",
  // Scope 3
  "waste_general", "waste_infectious", "waste_recyclable",
  "chemical_chlorine", "chemical_alum", "chemical_kmno4",
];

export async function fetchRollup(months = 12): Promise<RollupSummary> {
  const cutoff = new Date();
  // Pin day-of-month to 1 BEFORE rewinding months — otherwise the 29/30/31
  // edge overflows across month boundaries (e.g. 31 Mar − 11 months = 1 May
  // instead of 1 Apr). CRB-2 fix (Fable5 review of f5308f7).
  cutoff.setDate(1);
  cutoff.setMonth(cutoff.getMonth() - (months - 1));
  const cutoffIso = toLocalISODate(cutoff);

  const { data, error } = await supabase
    .from("v_unified_co2e")
    .select("month, scope, source, kg_co2e, row_count")
    .gte("month", cutoffIso)
    .order("month", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = ((data ?? []) as unknown[]) as RollupRow[];

  // Aggregate by scope.
  const scopeMap = new Map<number, ScopeSummary>();
  for (const r of rows) {
    const cur = scopeMap.get(r.scope) ?? {
      scope: r.scope, total_kg_co2e: 0, source_count: 0, has_data: false,
    };
    cur.total_kg_co2e += Number(r.kg_co2e);
    cur.has_data = true;
    scopeMap.set(r.scope, cur);
  }
  const byScope = Array.from(scopeMap.values()).map((s) => {
    const sources = new Set<string>();
    for (const r of rows) if (r.scope === s.scope) sources.add(r.source);
    return {
      ...s,
      source_count: sources.size,
      total_kg_co2e: Math.round(s.total_kg_co2e * 1000) / 1000,
    };
  }).sort((a, b) => a.scope - b.scope);

  const grandTotalKg = Math.round(byScope.reduce((s, x) => s + x.total_kg_co2e, 0) * 1000) / 1000;

  const seenSources = new Set(rows.map((r) => r.source));
  const incompleteSources = EXPECTED_SOURCES.filter((s) => !seenSources.has(s));

  return { rows, byScope, grandTotalKg, incompleteSources };
}

export function useCarbonRollup(months = 12) {
  const q = useQuery({
    queryKey: ["carbon-rollup", months] as const,
    queryFn: () => fetchRollup(months),
  });
  return {
    data: q.data ?? null,
    loading: q.isLoading,
    error: q.error?.message ?? null,
  };
}

/**
 * Realtime-aware variant of useCarbonRollup.
 *
 * Subscribes to `postgres_changes` on `carbon.reading` (the primary daily
 * feed into v_unified_co2e). On any INSERT/UPDATE/DELETE there, refetches
 * the rollup so the page shows fresh totals without a manual refresh.
 *
 * Scope: Track Z (logic only). Track F owns the decision of *whether* a
 * page uses this hook vs the polling variant — wire it from
 * CarbonRollupPage when ready. Realtime on the underlying view itself is
 * not supported by Supabase (views can't be broadcast), so we watch the
 * most-frequently-written base table. Other sources (fuel, garbage,
 * garden, chemical) will land on next manual refresh; covering them all
 * would need 5 channels — defer until usage proves the need.
 *
 * Returns the same shape as useCarbonRollup plus a `live` flag the UI can
 * use to show a "live" indicator.
 */
export function useCarbonRollupRealtime(months = 12) {
  const [data, setData] = useState<RollupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRollup(months)
      .then((d) => { if (!cancelled) { setData(d); setError(null); } })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    const channel = supabase
      .channel("carbon-rollup-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "carbon", table: "reading" },
        () => {
          // Refetch the whole rollup — v_unified_co2e aggregates server-side.
          fetchRollup(months)
            .then((d) => { if (!cancelled) { setData(d); setError(null); } })
            .catch((e: Error) => { if (!cancelled) setError(e.message); });
        },
      )
      .subscribe((status) => {
        if (cancelled) return;
        // "SUBSCRIBED" === connected; anything else (TIMED_OUT/CLOSED/CHANNEL_ERROR) = offline.
        setLive(status === "SUBSCRIBED");
      });

    // Resilience (2026-08-03): the status callback fires only on status
    // CHANGES. Supabase's socket layer auto-reconnects, but on a transient
    // drop+recover the callback can stay silent, leaving `live=false`
    // forever even though the channel is secretly healthy again. Poll the
    // channel's binding state every 10s as a backstop — if it has resubscribed
    // (REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) flip `live` back to true, and if
    // the socket is dead we refetch on a timer so data isn't silently stale.
    // Cheap: one property read + at most one fetch when offline.
    const state = setInterval(() => {
      if (cancelled) return;
      // Supabase v2 channel exposes the raw binding state. SUBSCRIBED there
      // is the same enum the subscribe callback reports.
      const bound = (channel as unknown as { state?: string }).state;
      if (bound === "SUBSCRIBED") {
        setLive(true);
        return;
      }
      // Offline: refetch on the timer so the page shows fresh-ish data even
      // while the realtime layer is down (no silent staleness).
      setLive(false);
      fetchRollup(months)
        .then((d) => { if (!cancelled) { setData(d); setError(null); } })
        .catch(() => { /* swallow — poll will retry */ });
    }, 10_000);

    return () => {
      cancelled = true;
      clearInterval(state);
      supabase.removeChannel(channel);
      setLive(false);
    };
  }, [months]);

  return { data, loading, error, live };
}
