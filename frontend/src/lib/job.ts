/**
 * ENV-PARITY-P3-004 — the job log lib (lane P3.4): QR resolve + the
 * server-pinned geofence client hint + form parity. Track Z owns logic;
 * Track F owns polish.
 *
 * Surface: public.job_log + public.location_area (security_invoker views
 * over core.job_log / core.location_area — migration
 * 20261118000006_parity_p3_004.sql).
 *
 * Ground truth: reference 12 §3.24 `job` (READ-ONLY doc, ref 4363–4620)
 * + §3.23 `location_area` (ref 4335–4361) + the งานสวน workbook
 * (1Hluhfryn2uMdK8nQ2kRJyLI3q-ZbrwgBgveDbhJlerw; the guarded 1102-row +
 * 15-row seeds).
 *
 * Honesty rules (WO §4/§5 + the D2 rulings):
 *   - D1-5 CONFIRMED: the write-gate bound is 0.7 km — the plan row's OWN
 *     pin ("geofence ≤0.7 กม. (server haversine)"). The AppSheet virtual
 *     Distance check uses <=2 — RECORDED as a display-layer artifact,
 *     never reconciled, never an ENV gate (DISPLAY_CHECK_LIMIT_KM).
 *   - D1-6: the SERVER trigger (core.fn_job_log_geofence) is the
 *     enforcement point — this lib computes the same haversine CLIENT
 *     hint only; an out-of-range entry fails here honestly (no write) and
 *     would ALSO fail server-side. Blank/unknown coordinates are never a
 *     pass (unknown ≠ passed, unknown ≠ zero).
 *   - The QR Valid If gate: placeholder 'สแกน QR CODE' and blank payloads
 *     are unusable; an id not in the master fails the verbatim poem.
 *   - D1-4: working carries the verbatim " , "-joined EnumList form.
 *   - PII: the payload NEVER carries a legacy practician string — the
 *     practician column resolves to a core.personnel UUID (picker only).
 *   - พ.ศ. user-facing dates are the render layer's job (lib/utils
 *     thaiDate); storage is CE ISO/timestamptz.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

// ─── Verbatim pins (§3.24) ───────────────────────────────────────────────

/** The working EnumList vocabulary verbatim (§3.24 ref). */
export const WORKING_OPTIONS = ["รดน้ำ", "ตัดหญ้า", "กวาด", "เก็บขยะ"] as const;

/** The verbatim " , " separator the sheet joins multi-selects with (the
 * §2 census: 15 distinct combos over exactly this vocabulary). */
export const WORKING_SEPARATOR = " , ";

/** The AppSheet QR_CODE placeholder init — never a usable value. */
export const QR_PLACEHOLDER = "สแกน QR CODE";

/** QR_CODE Invalid value error (§3.24, ref 4416ff) — the verbatim poem. */
export const ERR_QR =
  "*ต้องมีอะไรผิดพลาดตรงไหน ไม่เข้าใจเลยสักครั้ง ไอ้ที่เขาทำฉันนั้นก็ทำ แต่ทำและไม่เคยสมหวัง หรืออาจเป็นเพราะพื้นดวงหรือเปล่าหรือเป็นที่ราศีของดวงดาว*";

/** The location_name/Distance Valid If error (§3.24) — also the verbatim
 * error the SERVER geofence trigger raises on >0.7 km / blank coordinates. */
export const ERR_GEOFENCE = "ฮั่นแน่...เข้ามาทำงานก่อน";

/** House-level guard (never presented as AppSheet): a job with no work
 * type selected is not a record. */
export const ERR_WORKING_REQUIRED = "เลือกงานที่ทำอย่างน้อย 1 ประเภท (รดน้ำ / ตัดหญ้า / กวาด / เก็บขยะ)";

/** The verbatim honest empty state (WO §5). */
export const EMPTY_JOBS_LABEL = "ยังไม่มีรายการงาน";

/** The hospital geofence anchor — the verbatim AppSheet uthai_locate
 * LATLONG(14.361183, 100.645474); never a guessed coordinate. */
export const HOSPITAL_PIN = { lat: 14.361183, lng: 100.645474 } as const;

/** THE plan row's own write-gate bound (server haversine, D1-5 CONFIRMED). */
export const GEOFENCE_LIMIT_KM = 0.7;

/** RECORDED, never used as a gate (D1-5): the AppSheet virtual Distance
 * check carries <=2 — a display-layer artifact of the legacy system. */
export const DISPLAY_CHECK_LIMIT_KM = 2;

// ─── Geofence (client hint only — the server trigger enforces) ───────────

/** Great-circle distance (haversine, mean earth radius 6371.0088 km) —
 * the same formula shape the server trigger computes. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371.0088;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export interface GeofenceVerdict {
  ok: boolean;
  distanceKm: number | null;
  error: string | null;
}

/** The client-hint verdict over a candidate write location. Blank/unknown
 * coordinates are REJECTED (the AppSheet distance-on-blank Valid If
 * failure mirrored honestly — D1-6). */
export function geofenceVerdict(
  lat: number | null | undefined,
  lng: number | null | undefined
): GeofenceVerdict {
  const la = typeof lat === "number" ? lat : Number.NaN;
  const ln = typeof lng === "number" ? lng : Number.NaN;
  if (!Number.isFinite(la) || !Number.isFinite(ln)) {
    return { ok: false, distanceKm: null, error: ERR_GEOFENCE };
  }
  const d = haversineKm(la, ln, HOSPITAL_PIN.lat, HOSPITAL_PIN.lng);
  if (d > GEOFENCE_LIMIT_KM) {
    return { ok: false, distanceKm: d, error: ERR_GEOFENCE };
  }
  return { ok: true, distanceKm: d, error: null };
}

// ─── QR usable-value rule (the QR_CODE Valid If) ─────────────────────────

export function isQrPayloadUsable(v: string | null | undefined): boolean {
  const s = (v ?? "").trim();
  return s !== "" && s !== QR_PLACEHOLDER;
}

// ─── working (D1-4 joined-text storage shape) ────────────────────────────

/** Join selected working values with the verbatim " , " separator;
 * empty selections ⇒ NULL. */
export function joinWorking(values: string[]): string | null {
  const cleaned = values.map((v) => v.trim()).filter((v) => v !== "");
  if (cleaned.length === 0) return null;
  return cleaned.join(WORKING_SEPARATOR);
}

// ─── practician eligibility (the Valid If / P1.4 ผู้บันทึก gate verbatim) ─

export interface PractitionerCandidate {
  position?: string | null;
  status?: string | null;
}

/** §3.24 practician Valid If VERBATIM: SELECT(...,AND([ตำแหน่ง]<>"นายแพทย์",
 * [สถานะ]="ทำงาน",OR([ตำแหน่ง]="นักวิชาการสาธารณสุข",[ตำแหน่ง]="พนักงานบริการ"))).
 * Blank position/status ⇒ ineligible (unknown ≠ eligible). */
export function isEligiblePractician(p: PractitionerCandidate): boolean {
  const positionOk =
    p.position === "นักวิชาการสาธารณสุข" || p.position === "พนักงานบริการ";
  return positionOk && p.status === "ทำงาน";
}

// ─── Row / form types ────────────────────────────────────────────────────

export interface JobArea {
  id: string;
  legacy_id: string | null;
  area_name: string;
  qr_url: string | null;
  image_ref: string | null;
  source_provenance: string | null;
  created_at: string;
}

export interface JobRow {
  id: string;
  legacy_id: string | null;
  scanned_at: string | null;
  location_area_id: string | null;
  qr_legacy_id: string | null;
  location_name: string | null;
  lat: string | number | null;
  lng: string | number | null;
  practitioner_id: string | null;
  practitioner_legacy_id: string | null;
  working: string | null;
  image_ref: string | null;
  issue: string | null;
  source_provenance: string | null;
  created_at: string;
}

export interface JobFormInput {
  qrPayload: string;
  area: Pick<JobArea, "id" | "legacy_id" | "area_name"> | null;
  location: { lat: number; lng: number } | null;
  working: string[];
  practitionerId: string;
  issue?: string;
  imageUrl?: string | null;
}

/**
 * Form → payload. Verbatim validations ONLY where §3.24 pins them:
 * the QR gate (placeholder/blank/unresolved ⇒ the poem) and the geofence
 * (missing/out-of-range ⇒ ฮั่นแน่...เข้ามาทำงานก่อน). working-required is
 * house-level (never presented as AppSheet). The practitioner picker is
 * Ref-class (§3.24 practician) — an entry without a recorder is rejected
 * house-level. The payload NEVER carries a legacy practician string.
 */
export function buildJobPayload(form: JobFormInput): Record<string, unknown> {
  if (!isQrPayloadUsable(form.qrPayload)) {
    throw new Error(ERR_QR);
  }
  if (!form.area || !form.area.id) {
    // the IN([QR_CODE],location_area[id]) Valid If failure
    throw new Error(ERR_QR);
  }
  const verdict = geofenceVerdict(form.location?.lat, form.location?.lng);
  if (!verdict.ok) {
    // missing or >0.7 km ⇒ the verbatim error; the server trigger would
    // reject the same write — this is an honest pre-reject, never a pass
    throw new Error(ERR_GEOFENCE);
  }
  const working = joinWorking(form.working);
  if (working === null) {
    throw new Error(ERR_WORKING_REQUIRED);
  }
  const practitionerId = (form.practitionerId ?? "").trim();
  if (practitionerId === "") {
    throw new Error("เลือกผู้ปฏิบัติงาน (ผู้บันทึก) — ระบบเดิมผูกบันทึกกับผู้ปฏิบัติงานเสมอ");
  }
  const issue = (form.issue ?? "").trim();
  return {
    scanned_at: new Date().toISOString(),
    location_area_id: form.area.id,
    qr_legacy_id: form.qrPayload.trim(),
    location_name: form.area.area_name,
    lat: form.location!.lat,
    lng: form.location!.lng,
    practitioner_id: practitionerId,
    working,
    image_ref: form.imageUrl?.trim() ? form.imageUrl.trim() : null,
    issue: issue === "" ? null : issue,
    source_provenance: "manual staff entry (ENV-PARITY-P3-004 job log UI)",
  };
}

// ─── Reads / writes (RLS gates: job SELECT+INSERT staff-or-admin) ────────

const JOB_COLUMNS =
  "id, legacy_id, scanned_at, location_area_id, qr_legacy_id, location_name, lat, lng, practitioner_id, practitioner_legacy_id, working, image_ref, issue, source_provenance, created_at";

const AREA_COLUMNS = "id, legacy_id, area_name, qr_url, image_ref, source_provenance, created_at";

export function useJobLogs(limit = 200) {
  const q = useQuery({
    queryKey: ["job-logs", limit] as const,
    queryFn: async (): Promise<JobRow[]> => {
      const { data, error } = await supabase
        .from("job_log")
        .select(JOB_COLUMNS)
        .order("scanned_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []) as JobRow[];
    },
  });
  return {
    data: q.data ?? [],
    loading: q.isLoading,
    error: q.error?.message ?? null,
    refresh: () => q.refetch(),
  };
}

/** The QR-venue master (§3.23) — the scan-resolve target + the manual
 * pick list (the AppSheet scan/manual duality). */
export function useJobAreas() {
  const q = useQuery({
    queryKey: ["location-areas"] as const,
    queryFn: async (): Promise<JobArea[]> => {
      const { data, error } = await supabase
        .from("location_area")
        .select(AREA_COLUMNS)
        .order("area_name");
      if (error) throw new Error(error.message);
      return (data ?? []) as JobArea[];
    },
  });
  return { data: q.data ?? [], loading: q.isLoading, error: q.error?.message ?? null };
}

/** Exact legacy_id resolve against the master — the IN() Valid If
 * counterpart. Unresolved payloads stay null (fail-closed upstream). */
export async function resolveJobArea(qrPayload: string): Promise<JobArea | null> {
  const { data, error } = await supabase
    .from("location_area")
    .select(AREA_COLUMNS)
    .eq("legacy_id", qrPayload.trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as JobArea) ?? null;
}

export async function createJobLog(payload: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from("job_log").insert(payload);
  if (error) {
    // the server geofence reject surfaces verbatim (the trigger message)
    throw new Error(error.message);
  }
}
