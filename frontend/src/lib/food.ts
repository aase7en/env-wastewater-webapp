/**
 * MOD-FO — food sanitation (coliform) module data layer.
 * CRUD over `food.lab_test`. AFTER INSERT trigger fn_decrement_reagent
 * auto-decrements chemical.movement — see SCHEMA MOD-batch migration.
 *
 * ⚠️ PHI boundary: coliform tests at รพ.อุทัย = water/food/environment
 * samples — NOT patient samples. If patient-adjacent samples are added
 * later, they MUST NOT route through AI providers (ZCode/GLM China law).
 *
 * ENV-PARITY-P2-004 — the additive coliform ×3 two-step flow (น้ำ/อาหาร/
 * พนักงาน + ทั่วไป) rides the SAME table: verbatim per-source vocabularies,
 * Show If `TODAY()>Collect_date` gating (same-day collect stays รอผล),
 * UI-only +1/+2 วัน suggestions, personnel resolution UUID-or-NULL (PII
 * pin — never verbatim national-ID-class identifiers). The existing
 * single-step form/CRUD behavior is preserved untouched (additive only).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { toLocalISODate } from "./utils";

export interface FoodLabTest {
  id: string;
  sample_date: string;
  sample_type: string | null;
  test_type: string | null;
  result: string | null;
  reported_date: string | null;
  technician: string | null;
  sample_point: string | null;
  mpn_value: number | null;
  reagent_used: { name?: string; qty?: number; unit?: string } | null;
  reported_by_lab_tech: string | null;
  follow_up_action: string | null;
  recorded_by: string | null;
  note: string | null;
  created_at: string;
  // ── P2.4 additive coliform columns (all NULLable; never set by the
  // legacy single-step form — compat preserved) ──
  sample_source?: string | null;
  collect_point?: string | null;
  sample_person_id?: string | null;
  collected_by_id?: string | null;
  collected_by_legacy?: string | null;
  reporter_id?: string | null;
  reporter_legacy?: string | null;
  equipment_legacy?: string | null;
  result_image?: string | null;
  legacy_id?: string | null;
  source_provenance?: string | null;
}

/**
 * FOOD-CORE-001 — `sample_type`/`test_type` are canonical categoricals
 * (import adapter + DB CHECK enforce the value sets; blank stays null).
 * `reagent_used` stays READ-ONLY: the AFTER INSERT trigger
 * `fn_decrement_reagent` → `chemical.movement` cross-domain decrement is
 * DORMANT (no app/import path writes it) and is excluded from the write
 * type so it cannot be silently activated; re-opening it requires a
 * separate evidence-backed scope decision (trigger hardening backlog in
 * docs/work-orders/FOOD-CORE-001.md).
 */
export type FoodInput = Omit<
  FoodLabTest,
  "id" | "recorded_by" | "created_at" | "reagent_used"
>;

const COLUMNS =
  "id, sample_date, sample_type, test_type, result, reported_date, technician, sample_point, mpn_value, reagent_used, reported_by_lab_tech, follow_up_action, recorded_by, note, created_at, sample_source, collect_point, sample_person_id, collected_by_id, collected_by_legacy, reporter_id, reporter_legacy, equipment_legacy, result_image, legacy_id, source_provenance";

export async function fetchFoodLabTests(limit = 30): Promise<FoodLabTest[]> {
  const { data, error } = await supabase
    .from("lab_test")
    .select(COLUMNS)
    .order("sample_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as FoodLabTest[];
}

export async function createFoodLabTest(input: FoodInput): Promise<FoodLabTest> {
  const { data, error } = await supabase
    .from("lab_test")
    .insert(input)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as FoodLabTest;
}

export async function deleteFoodLabTest(id: string): Promise<void> {
  const { error } = await supabase.from("lab_test").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function useFoodLabTests(limit = 30) {
  const q = useQuery({
    queryKey: ["food-lab-tests", limit] as const,
    queryFn: () => fetchFoodLabTests(limit),
  });
  return {
    data: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refresh: () => q.refetch(),
  };
}

/**
 * useReagentUsage(months) — aggregate reagent consumption for report.
 * Joins via chemical.movement (written by fn_decrement_reagent trigger).
 */
export async function fetchReagentUsage(monthsBack = 3): Promise<
  Array<{ chemical_name: string; total_qty: number; unit: string }>
> {
  const cutoff = new Date();
  // Pin day-of-month to 1 BEFORE rewinding — guards against the same
  // 29/30/31 overflow as CRB-2 carbon-rollup fix. This function means
  // "last N months" so widening to start-of-month is acceptable.
  cutoff.setDate(1);
  cutoff.setMonth(cutoff.getMonth() - monthsBack);
  const cutoffIso = toLocalISODate(cutoff);

  const { data, error } = await supabase
    .from("movement")
    .select("chemical_name, quantity, unit")
    .eq("direction", "out")
    .like("purpose", "auto: food.lab_test%")
    .gte("movement_date", cutoffIso);
  if (error) throw new Error(error.message);

  const byName = new Map<string, { qty: number; unit: string }>();
  for (const row of (data ?? []) as Array<{ chemical_name: string; quantity: number; unit: string }>) {
    const key = row.chemical_name;
    const prev = byName.get(key) ?? { qty: 0, unit: row.unit };
    prev.qty += Number(row.quantity);
    byName.set(key, prev);
  }
  return Array.from(byName.entries()).map(([chemical_name, v]) => ({
    chemical_name,
    total_qty: Math.round(v.qty * 1000) / 1000,
    unit: v.unit,
  }));
}

// ═══════════════════════════════════════════════════════════════════════
// ENV-PARITY-P2-004 — coliform ×3 two-step flow (pure form parity + DB
// access). Verbatim AppSheet ground truth: reference doc 12 §3.11 (general
// ทั่วไป), §3.16 (Water), §3.17 (Food), §3.19 (Employee); pins per WO
// §3.1/§4. NO hard DB CHECK — the value sets below are UI-restricted
// verbatim lists (D1-8/P1.001: unknown ≠ rejected).
// ═══════════════════════════════════════════════════════════════════════

/** The four coliform surfaces the plan row P2.4 covers (the §3.3 mapping
 * routes all four AppSheet tables through the one generic lab_test). */
export type ColiformSource = "น้ำ" | "อาหาร" | "พนักงาน" | "ทั่วไป";
export const COLIFORM_SOURCES: readonly ColiformSource[] = ["น้ำ", "อาหาร", "พนักงาน", "ทั่วไป"];

/** Water collect points — §3.16 Collect_Location Enum Key verbatim. */
export const WATER_COLLECT_POINTS = [
  "โรงครัว",
  "ตู้กดน้ำ OPD",
  "ตู้กดน้ำ IPD",
  "ตู้กดน้ำปฐมภูมิ (ห้องฟัน)",
] as const;

/** Food collect points — §3.17 sample Enum verbatim. */
export const FOOD_COLLECT_POINTS = [
  "ช้อนสั้น",
  "ถาด",
  "มือพี่กุ้ง",
  "มือป้าอ้อ",
  "มือแก๊ป",
] as const;

/** General collect points — §3.11 สานถานที่เก็บตัวอย่าง verbatim. */
export const GENERAL_COLLECT_POINTS = ["โรงครัว", "บ่อบำบัด"] as const;

/** Result set water/general — §3.16/§3.11 verbatim. */
export const COLIFORM_RESULT_WATER = ["Positive", "Negative"] as const;

/** Result set food/employee — §3.17/§3.19 verbatim (the ++/invalid variants). */
export const COLIFORM_RESULT_EXTENDED = [
  "Positive",
  "Negative",
  "Positive ++",
  "invalid",
] as const;

/** อุปกรณ์ AppSheet Items defaults verbatim (§3.16 init =aca317bf,
 * §3.17 init =aca317bf, §3.19 init =2fe4aa7c; ทั่วไป carries none).
 * TEXT legacy ids — core.item does not exist yet (Phase 3 successor). */
export const EQUIPMENT_DEFAULTS: Record<ColiformSource, string | null> = {
  "น้ำ": "aca317bf",
  "อาหาร": "aca317bf",
  "พนักงาน": "2fe4aa7c",
  "ทั่วไป": null,
};

/** Step-1 test_type default — the coliform lane's canonical value. */
export const TEST_TYPE_DEFAULT = "total_coliform";

/** Collect-point vocabulary gated per source; พนักงาน rows carry NO
 * collect point (the sample is a person — §3.19). */
export function collectPointsFor(source: ColiformSource): readonly string[] {
  switch (source) {
    case "น้ำ": return WATER_COLLECT_POINTS;
    case "อาหาร": return FOOD_COLLECT_POINTS;
    case "ทั่วไป": return GENERAL_COLLECT_POINTS;
    case "พนักงาน": return [];
  }
}

/** Result value set gated per source (water/general 2-value; food/employee
 * extended with the Positive ++ / invalid variants). */
export function resultSetFor(source: ColiformSource): readonly string[] {
  return source === "อาหาร" || source === "พนักงาน" ? COLIFORM_RESULT_EXTENDED : COLIFORM_RESULT_WATER;
}

/** Suggested +1/+2 วัน exist for food/employee ONLY (§3.17 ref 3654,
 * §3.19 ref 3848); water/general carry none in AppSheet — honest
 * per-source parity (D1-7). Suggestions are UI-only: never auto-filled,
 * never enforced. */
export function suggestsResultDates(source: ColiformSource): boolean {
  return source === "อาหาร" || source === "พนักงาน";
}

/** collect+1 / collect+2 as ISO dates (local date-parts math — no UTC
 * drift across month/year boundaries). */
export function suggestedResultDates(collectDate: string): [string, string] {
  const [y, m, d] = collectDate.split("-").map(Number);
  const pad = (x: number) => String(x).padStart(2, "0");
  const add = (n: number): string => {
    const dt = new Date(y as number, (m as number) - 1, (d as number) + n);
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  };
  return [add(1), add(2)];
}

/** The verbatim Show If gate `TODAY()>[Collect_date]` (§3.17 ref 3656,
 * §3.19 ref 3838): result fields appear only on a STRICTLY later day —
 * a same-day collect stays รอผล (the AppSheet gate made same-day results
 * impossible; ENV preserves that honest constraint as UI gating). */
export function showResultFields(collectDate: string | null | undefined, todayISO: string): boolean {
  if (!collectDate) return false;
  return todayISO.slice(0, 10) > collectDate.slice(0, 10);
}

/** Pending (รอผล) = the step-2 write has not landed: BOTH result AND
 * reported_date must be present. Unknown stays unknown — never coerced
 * to a value, never zero (data honesty). */
export function isPendingResult(row: { result?: string | null; reported_date?: string | null }): boolean {
  const hasResult = !!(row.result ?? "").trim();
  const hasDate = !!(row.reported_date ?? "").trim();
  return !(hasResult && hasDate);
}

/** Personnel picker option — carries ONLY the safe core.personnel columns.
 * NEVER an Employee_id-class identifier (PII pin D1-5). position/status are
 * nullish-tolerant (matches PersonnelOut; null never matches a verbatim
 * position, which is the correct deny behavior). */
export interface ColiformPersonnelOption {
  id: string;
  full_name: string;
  position?: string | null;
  status?: string | null;
}

/** Employee-swab subject eligibility — §3.19 Valid If verbatim:
 * OR(ตำแหน่ง="นักโภชนาการ", ตำแหน่ง="พนักงานประกอบอาหาร"). */
export function eligibleSamplePersons(
  personnel: ColiformPersonnelOption[] | null | undefined,
): ColiformPersonnelOption[] {
  return (personnel ?? []).filter(
    (p) => p.position === "นักโภชนาการ" || p.position === "พนักงานประกอบอาหาร",
  );
}

/** ผู้เก็บตัวอย่าง eligibility — §3.17 Valid If verbatim:
 * ตำแหน่ง = นักวิชาการสาธารณสุข AND สถานะ ≠ ลาออก (the ≠นายแพทย์ clause is
 * implied by the positive position match). */
export function eligibleCollectors(
  personnel: ColiformPersonnelOption[] | null | undefined,
): ColiformPersonnelOption[] {
  return (personnel ?? []).filter(
    (p) => p.position === "นักวิชาการสาธารณสุข" && p.status !== "ลาออก",
  );
}

/** ผู้รายงาน eligibility — food/employee: ตำแหน่ง = นักวิชาการสาธารณสุข
 * (§3.17/§3.19 Valid If); water/general: ตำแหน่ง ≠ นายแพทย์
 * (§3.16/§3.11 Valid If). */
export function eligibleReporters(
  personnel: ColiformPersonnelOption[] | null | undefined,
  source: ColiformSource,
): ColiformPersonnelOption[] {
  const list = personnel ?? [];
  return source === "อาหาร" || source === "พนักงาน"
    ? list.filter((p) => p.position === "นักวิชาการสาธารณสุข")
    : list.filter((p) => p.position !== "นายแพทย์");
}

/** Step-1 write (บันทึกเก็บตัวอย่าง): collect-side fields only — every
 * result-side column stays NULL (รอผล) until กรอกผลภายหลัง. sample_date
 * may be omitted → DB DEFAULT CURRENT_DATE (the existing NOT NULL default
 * carries the AppSheet Collect_date TODAY() init at the storage layer). */
export type ColiformSampleInput = {
  sample_source: ColiformSource;
  collect_point: string | null;
  sample_person_id: string | null;
  collected_by_id: string | null;
  equipment_legacy: string | null;
  // P3.1 deviation (recorded): the lab อุปกรณ์ picker binding needs this
  // optional field + the insert key below — the mutable_scope pinned only
  // the wiring files, but this closed insert literal would silently drop
  // the D1-4 FK write. 2 additive lines, never a silent switch (WO §8).
  equipment_id?: string | null;
  sample_date?: string;
  test_type?: string;
  sample_type?: string | null;
  note?: string | null;
  source_provenance?: string;
};

/** Step-2 write (กรอกผลภายหลัง): app-supplied result fields — NO DB
 * defaults exist on these (D1-7); the Show If gate decides UI exposure. */
export type ColiformResultPatch = {
  result: string;
  reported_date: string;
  mpn_value?: number | null;
  reporter_id: string | null;
  result_image?: string | null;
};

export async function createColiformSample(input: ColiformSampleInput): Promise<FoodLabTest> {
  const { data, error } = await supabase
    .from("lab_test")
    .insert({
      sample_source: input.sample_source,
      collect_point: input.collect_point,
      sample_person_id: input.sample_person_id,
      collected_by_id: input.collected_by_id,
      equipment_legacy: input.equipment_legacy,
      equipment_id: input.equipment_id ?? null,
      sample_date: input.sample_date || undefined,
      test_type: input.test_type || TEST_TYPE_DEFAULT,
      sample_type: input.sample_type ?? null,
      note: input.note ?? null,
      source_provenance: input.source_provenance ?? null,
      // step-1 rows land รอผล: the result-side columns are EXPLICITLY null
      // (D1-7 — no DB default fills them; the step-2 write sets them later)
      result: null,
      reported_date: null,
      reporter_id: null,
    })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as FoodLabTest;
}

export async function saveColiformResult(id: string, patch: ColiformResultPatch): Promise<void> {
  const { error } = await supabase
    .from("lab_test")
    .update({
      result: patch.result,
      reported_date: patch.reported_date,
      ...(patch.mpn_value != null ? { mpn_value: patch.mpn_value } : {}),
      reporter_id: patch.reporter_id,
      ...(patch.result_image ? { result_image: patch.result_image } : {}),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
