/**
 * CRB-1..4 + ENV-WASTE-CARBON-001A — Carbon rollup data layer (Scope 1+2+3).
 *
 * Reads `carbon.v_unified_co2e` (SCHEMA-3 view) which UNIONs every
 * carbon-contributing table across all schemas. Per-scope + per-source
 * aggregation done server-side; client just shapes for display.
 *
 * Scope 1 (direct): fuel + garden
 * Scope 2 (indirect electricity): carbon.reading
 * Scope 3 (other indirect): waste + chemical
 *
 * ENV-WASTE-CARBON-001A data-honesty contract:
 *   The view legitimately emits kg_co2e = NULL when an emission factor is
 *   unavailable for a source/month (missing factor, unsupported
 *   classification, unit mismatch, period outside factor validity). NULL is
 *   UNKNOWN — it must never be coerced through Number(null) into a numeric
 *   zero inside scope totals or the grand total. Totals are therefore
 *   KNOWN subtotals: sums over non-NULL rows only, with explicit
 *   `unavailableSources` / `hasUnavailableContribution` flags so no
 *   incomplete total can be presented as complete.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { toLocalISODate } from "./utils";

export interface RollupRow {
  month: string;       // YYYY-MM-01
  scope: number;       // 1, 2, 3
  source: string;
  /** NULL = factor unavailable for that source/month (UNKNOWN, not zero). */
  kg_co2e: number | null;
  row_count: number;
}

export interface ScopeSummary {
  scope: number;
  /** Known subtotal: sum of non-NULL kg_co2e rows in this scope. */
  total_kg_co2e: number;
  source_count: number;
  has_data: boolean;
  /** True when at least one row in this scope had kg_co2e NULL. */
  has_unavailable: boolean;
}

export interface RollupSummary {
  rows: RollupRow[];
  byScope: ScopeSummary[];
  /** Known total (sum of known subtotals) — not a complete total while
   * hasUnavailableContribution is true. */
  grandTotalKg: number;
  /** Expected factor-backed sources still without data — UI shows "ข้อมูล
   * incomplete" flag. Label-presence semantics: a source needs rows in the
   * window to leave this list. */
  incompleteSources: string[];
  /** Sources seen in-window with at least one NULL-kg row (factor
   * unavailable). Distinct from incompleteSources: these have data but an
   * unavailable contribution. Sorted for deterministic display. */
  unavailableSources: string[];
  /** True when any NULL-kg row exists — the grand total is then a known
   * subtotal, never a "complete total". */
  hasUnavailableContribution: boolean;
}

/** Factor-backed target labels per scope. States like waste_unclassified /
 * waste_chemical / fuel_unclassified are deliberately NOT expected targets:
 * they describe unavailable classifications, not sources with factors. */
export const EXPECTED_SOURCES = [
  // Scope 1
  "diesel", "gasoline", "lpg", "garden_fuel",
  // Scope 2
  "electricity",
  // Scope 3
  "waste_general", "waste_infectious", "waste_recyclable",
  "chemical_chlorine", "chemical_alum", "chemical_kmno4",
];

const ALL_SCOPES = [1, 2, 3] as const;

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

  // Aggregate by scope. All three scopes are always represented so the UI
  // can render its "ยังไม่มีข้อมูล" branch instead of silently dropping
  // empty scope cards.
  const scopeMap = new Map<number, ScopeSummary>(
    ALL_SCOPES.map((scope) => [
      scope,
      { scope, total_kg_co2e: 0, source_count: 0, has_data: false, has_unavailable: false },
    ]),
  );
  for (const r of rows) {
    const cur = scopeMap.get(r.scope) ?? {
      scope: r.scope, total_kg_co2e: 0, source_count: 0, has_data: false, has_unavailable: false,
    };
    if (r.kg_co2e === null || r.kg_co2e === undefined) {
      // UNKNOWN contribution — never Number(null) === 0.
      cur.has_unavailable = true;
    } else {
      const n = Number(r.kg_co2e);
      if (Number.isFinite(n)) cur.total_kg_co2e += n;
      else cur.has_unavailable = true;
    }
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

  // A source is unavailable when any of its rows carries NULL kg (factor
  // unavailable for at least one month in the window).
  const unavailable = new Set<string>();
  for (const r of rows) {
    if (r.kg_co2e === null || r.kg_co2e === undefined || !Number.isFinite(Number(r.kg_co2e))) {
      unavailable.add(r.source);
    }
  }
  const unavailableSources = Array.from(unavailable).sort();

  return {
    rows,
    byScope,
    grandTotalKg,
    incompleteSources,
    unavailableSources,
    hasUnavailableContribution: unavailableSources.length > 0,
  };
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
 * page uses this hook vs the polling variant. Realtime on the underlying
 * view itself is not supported by Supabase (views can't be broadcast), so
 * we watch the most-frequently-written base table. Other sources (fuel,
 * garbage, garden, chemical) will land on next manual refresh; covering
 * them all would need 5 channels — defer until usage proves the need.
 *
 * ENV-WASTE-CARBON-001A: `realtimeConnected` describes TRANSPORT state
 * only — whether the Supabase realtime subscription is connected. It is
 * NOT a claim that carbon measurement is live: v_unified_co2e serves
 * monthly aggregates over manual field recordings, so "live environmental
 * data" semantics never apply to this hook's output.
 */
export function useCarbonRollupRealtime(months = 12) {
  const [data, setData] = useState<RollupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

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
        // "SUBSCRIBED" === transport connected; anything else
        // (TIMED_OUT/CLOSED/CHANNEL_ERROR) = transport offline.
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    // Resilience (2026-08-03): the status callback fires only on status
    // CHANGES. Supabase's socket layer auto-reconnects, but on a transient
    // drop+recover the callback can stay silent, leaving the flag false
    // forever even though the channel is secretly healthy again. Poll the
    // channel's binding state every 10s as a backstop — if it has resubscribed
    // (REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) flip it back to true, and if
    // the socket is dead we refetch on a timer so data isn't silently stale.
    // Cheap: one property read + at most one fetch when offline.
    const state = setInterval(() => {
      if (cancelled) return;
      // Supabase v2 channel exposes the raw binding state. SUBSCRIBED there
      // is the same enum the subscribe callback reports.
      const bound = (channel as unknown as { state?: string }).state;
      if (bound === "SUBSCRIBED") {
        setRealtimeConnected(true);
        return;
      }
      // Transport offline: refetch on the timer so the page shows fresh-ish
      // data even while the realtime layer is down (no silent staleness).
      setRealtimeConnected(false);
      fetchRollup(months)
        .then((d) => { if (!cancelled) { setData(d); setError(null); } })
        .catch(() => { /* swallow — poll will retry */ });
    }, 10_000);

    return () => {
      cancelled = true;
      clearInterval(state);
      supabase.removeChannel(channel);
      setRealtimeConnected(false);
    };
  }, [months]);

  return { data, loading, error, realtimeConnected };
}
