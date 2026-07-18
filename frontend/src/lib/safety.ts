/**
 * MOD-FS — fire safety module data layer.
 * CRUD over `safety.monthly_check`. Legal requirement (พ.ร.บ. ป้องกัน
 * อัคคีภัย 2542) — monthly cadence. Includes useUpcomingSafetyChecks
 * helper for due-date alerts.
 */
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface SafetyMonthlyCheck {
  id: string;
  check_date: string;
  location_id: string | null;
  extinguisher_inspected: boolean;
  exit_light_functional: boolean;
  issues_found: string | null;
  extinguisher_count: number | null;
  extinguisher_expired_count: number | null;
  exit_light_count: number | null;
  exit_light_broken_count: number | null;
  fire_alarm_tested: boolean;
  sprinkler_tested: boolean;
  apd_aed_checked: boolean;
  next_check_due: string | null;
  recorded_by: string | null;
  note: string | null;
  created_at: string;
}

export type SafetyInput = Omit<SafetyMonthlyCheck, "id" | "recorded_by" | "created_at">;

const COLUMNS =
  "id, check_date, location_id, extinguisher_inspected, exit_light_functional, issues_found, extinguisher_count, extinguisher_expired_count, exit_light_count, exit_light_broken_count, fire_alarm_tested, sprinkler_tested, apd_aed_checked, next_check_due, recorded_by, note, created_at";

export async function fetchSafetyMonthly(limit = 12): Promise<SafetyMonthlyCheck[]> {
  const { data, error } = await supabase
    .from("monthly_check")
    .select(COLUMNS)
    .order("check_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as SafetyMonthlyCheck[];
}

export async function createSafetyCheck(input: SafetyInput): Promise<SafetyMonthlyCheck> {
  const { data, error } = await supabase
    .from("monthly_check")
    .insert(input)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as SafetyMonthlyCheck;
}

export async function deleteSafetyCheck(id: string): Promise<void> {
  const { error } = await supabase.from("monthly_check").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function useSafetyMonthly(limit = 12) {
  const [data, setData] = useState<SafetyMonthlyCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const refresh = () => setNonce((n) => n + 1);

  useEffect(() => {
    fetchSafetyMonthly(limit)
      .then((rows) => { setData(rows); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [limit, nonce]);

  return { data, loading, error, refresh };
}

/**
 * useUpcomingSafetyChecks — checks with next_check_due within `days`
 * (default 30). Used by alert systems / nav badges.
 */
export function useUpcomingSafetyChecks(days = 30) {
  const [data, setData] = useState<SafetyMonthlyCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const cutoffIso = cutoff.toISOString().slice(0, 10);

    supabase
      .from("monthly_check")
      .select(COLUMNS)
      .not("next_check_due", "is", null)
      .lte("next_check_due", cutoffIso)
      .order("next_check_due", { ascending: true })
      .limit(20)
      .then(({ data, error }) => {
        if (!error) setData((data ?? []) as SafetyMonthlyCheck[]);
        setLoading(false);
      });
  }, [days]);

  return { data, loading };
}
