import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  INITIAL_GATE,
  markDirty,
  resolveHydration,
  type HydrationGateState,
} from "../lib/form-hydration";
import { AccordionSection } from "../components/ui/Accordion";
import { MSymbol } from "../components/ui/MSymbol";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Field, Input, NumberInput, Textarea } from "../components/ui/Input";
import { Toggle } from "../components/ui/Toggle";
import { useCreateReading, useEquipment, useReading, useUpdateReading } from "../lib/hooks";
import { deleteReading as deleteReadingQ } from "../lib/supabase-queries";
import { useToast, type ToastContextValue } from "../components/ui/Toast";
import { checkThresholds } from "../lib/types";
import type { ReadingCreate } from "../lib/types";
import { cn } from "../lib/utils";

/** Today's date as YYYY-MM-DD (for the reading_date default). */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Empty form state — every measured field defaults to "" (sent as null). */
function emptyForm(): FormState {
  return {
    reading_date: todayISO(),
    do_aeration: "", do_sedimentation: "", do_before_discharge: "",
    tds_aeration: "", tds_before_discharge: "",
    ph: "", temp_aeration: "", sv30: "", free_chlorine: "",
    screen_cleaned_coarse: null, screen_cleaned_fine: null,
    pump1_running: null, pump2_running: null,
    aerator1_running: null, aerator2_running: null,
    sludge_pump1_running: null, sludge_pump2_running: null,
    chlorine_pump1_running: null, chlorine_pump2_running: null,
    system_operating: true,
    pump1_meter: "", pump2_meter: "",
    water_used_total: "", wastewater_in: "",
    wastewater_discharged: null,
    chlorine_used: "", chlorine_mix_ratio: "", excess_sludge_removed: "",
    color_desc: "", smell_desc: "", note: "",
    electricity_consumption: "", electricity_meter_value: "",
    abnormal_cause: "",
  };
}

type FormState = Omit<ReadingCreate, "reading_date"> & {
  reading_date: string;
  // All numeric fields use "" (empty string) on the form side; converted to
  // null on submit so omitted values don't get coerced to 0.
  [k: string]: unknown;
};

// ─── Equipment checklist config ──────────────────────────────────────────
// Maps the *_running / screen_cleaned_* keys to the core.equipment code,
// so we can pull the Thai name from /api/equipment (fallback to code).
// Quick-pick chips for สี/กลิ่น — the ONLY values that exist in the real
// 907-row dataset (SPEC: สี = น้ำตาลเข้ม 824 / น้ำตาลอ่อน 83; กลิ่น =
// กลิ่นดินปกติ 907). Free-text stays available for new observations.
const COLOR_CHIPS = ["น้ำตาลเข้ม", "น้ำตาลอ่อน"];
const SMELL_CHIPS = ["กลิ่นดินปกติ"];

function QuickChips({ options, value, onPick }: { options: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onPick(o)}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-thai border transition-colors min-h-[var(--touch-min)] min-w-[var(--touch-min)]",
            value === o
              ? "bg-aura-cyan text-aura-onAccent border-transparent font-semibold"
              : "bg-aura-surfaceHigh/40 border-aura-borderSubtle text-aura-textMuted hover:text-aura-textMain hover:border-aura-cyan/40"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const EQUIPMENT_CHECKS: { key: keyof FormState; code: string }[] = [
  { key: "screen_cleaned_coarse", code: "screen_coarse" },
  { key: "screen_cleaned_fine", code: "screen_fine" },
  { key: "pump1_running", code: "pump1" },
  { key: "pump2_running", code: "pump2" },
  { key: "aerator1_running", code: "aerator1" },
  { key: "aerator2_running", code: "aerator2" },
  { key: "sludge_pump1_running", code: "sludge_pump1" },
  { key: "sludge_pump2_running", code: "sludge_pump2" },
  { key: "chlorine_pump1_running", code: "chlorine_pump1" },
  { key: "chlorine_pump2_running", code: "chlorine_pump2" },
];

// ─── ENV-UNDO-001: deferred delete + 10-second undo window ──────────────
// The server DELETE is deferred until a 10-second undo window expires;
// undo cancels the pending timer and restores the captured React Query
// cache snapshots (NO server round-trip — the row was never deleted, so
// restore is trivially correct and needs no refetch). The storage semantic
// stays a hard delete; only the CALL is deferred. State lives at module
// scope (NOT component scope) so the window survives navigating away from
// the form page — ToastProvider is app-level and the timers intentionally
// outlive the unmounted component. Known semantics (recorded in the WO +
// handoff): a full page unload/reload mid-window drops the pending timer,
// so the record simply stays — honest and conservative (a closed browser
// cancels the delete; no data loss either way).
const UNDO_WINDOW_MS = 10_000;

interface PendingDelete {
  id: string;
  timerId: ReturnType<typeof setTimeout>;
  readingDetail: unknown;
  listSnapshots: Array<{ key: readonly unknown[]; data: unknown }>;
  toast: ToastContextValue;
}

type ReadingCacheRow = { id?: string | null };

const pendingDeletes = new Map<string, PendingDelete>();

/** Hide `id` from every cached readings/dashboard view, snapshotting each
 *  affected cache entry first so undo can restore exactly what the user
 *  saw. Keys without the row are left untouched (their snapshots would
 *  clobber newer background refetches on restore). */
function captureAndHideReadings(qc: QueryClient, id: string): Omit<PendingDelete, "timerId" | "id" | "toast"> {
  const readingDetail = qc.getQueryData(["reading", id]);
  const listSnapshots: Array<{ key: readonly unknown[]; data: unknown }> = [];
  for (const q of qc.getQueryCache().getAll()) {
    const key = q.queryKey;
    if (key[0] !== "readings" && key[0] !== "dashboard") continue;
    const data = qc.getQueryData(key) as unknown;
    if (Array.isArray(data)) {
      const rows = data as ReadingCacheRow[];
      if (!rows.some((r) => r?.id === id)) continue;
      listSnapshots.push({ key, data });
      qc.setQueryData(key, rows.filter((r) => r?.id !== id));
    } else if (data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)) {
      const shaped = data as { items: ReadingCacheRow[] };
      if (!shaped.items.some((r) => r?.id === id)) continue;
      listSnapshots.push({ key, data });
      qc.setQueryData(key, { ...shaped, items: shaped.items.filter((r) => r?.id !== id) });
    }
  }
  qc.removeQueries({ queryKey: ["reading", id] });
  return { readingDetail, listSnapshots };
}

/** Undo path: put back exactly what was hidden. Pure cache writes — no
 *  server round-trip by design (the deletion was deferred, so the row is
 *  still on the server and the snapshots ARE the truth the user saw).
 *  Snapshot rows for OTHER still-pending deletes stay hidden — restoring
 *  this entry must not resurrect rows whose own undo windows are live. */
function restoreReadingsSnapshots(qc: QueryClient, entry: PendingDelete): void {
  if (entry.readingDetail !== undefined) qc.setQueryData(["reading", entry.id], entry.readingDetail);
  if (entry.listSnapshots.length > 0) {
    const pendingIds = new Set(Array.from(pendingDeletes.keys(), String));
    const keep = (r: ReadingCacheRow) => !pendingIds.has(String(r?.id));
    for (const s of entry.listSnapshots) {
      const data = s.data as unknown;
      if (Array.isArray(data)) {
        qc.setQueryData(s.key, (data as ReadingCacheRow[]).filter(keep));
      } else if (data && typeof data === "object") {
        const shaped = data as { items: ReadingCacheRow[] };
        qc.setQueryData(s.key, { ...shaped, items: shaped.items.filter(keep) });
      }
    }
  } else {
    // Cold-entry edge (list cache absent at confirm — e.g. direct URL into
    // the edit form): heal from server truth instead of inventing rows.
    void qc.invalidateQueries({ queryKey: ["readings"] });
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
  }
}

function scheduleDeferredDelete(entry: Omit<PendingDelete, "timerId">, qc: QueryClient): void {
  // Same-id re-confirm inside the window keeps the original pending entry
  // (its undo toast is still live; the delete fires once).
  if (pendingDeletes.has(entry.id)) return;
  const timerId = setTimeout(async () => {
    pendingDeletes.delete(entry.id);
    try {
      await deleteReadingQ(entry.id);
      qc.removeQueries({ queryKey: ["reading", entry.id] });
      void qc.invalidateQueries({ queryKey: ["readings"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch {
      // Honest failure — never silent loss on either side: surface the
      // error and refetch so the record visibly returns from server truth.
      void qc.invalidateQueries({ queryKey: ["reading", entry.id] });
      void qc.invalidateQueries({ queryKey: ["readings"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      entry.toast.error("ลบไม่สำเร็จ — ยังไม่ได้ลบจากระบบ รายการจะปรากฏอีกครั้ง");
    }
  }, UNDO_WINDOW_MS);
  pendingDeletes.set(entry.id, { ...entry, timerId });
}

export function DailyFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [banner, setBanner] = useState<{ kind: "success" | "error" | "warning"; msg: string } | null>(null);
  const [revealRequest, setRevealRequest] = useState<{ target: "banner" | "cause" } | null>(null);
  const [dockOverlayOpen, setDockOverlayOpen] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const causeRef = useRef<HTMLTextAreaElement>(null);

  const { data: existing, loading: loadingExisting } = useReading(isEdit ? id : null);
  const { data: equipment } = useEquipment();
  const createMut = useCreateReading();
  const updateMut = useUpdateReading();
  const queryClient = useQueryClient();

  // ModuleDock renders its modal scrim outside this page. Keep the form actions
  // above the dock during normal use, but demote + inert them whenever that
  // shared scrim is mounted so actions cannot render/click through the sheet.
  useEffect(() => {
    const overlaySelector = 'div[aria-hidden="true"][class*="fixed inset-0"][class*="z-[35]"]';
    const sync = () => setDockOverlayOpen(Boolean(document.querySelector(overlaySelector)));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Edit mode: hydrate the form from the reading record — gated.
  // WO-STAB-004 (P0 #4): React Query background/window-focus refetches
  // deliver fresh snapshots of `existing`; the ungated effect repopulated
  // the whole form and silently wiped unsaved edits. The gate allows the
  // first hydration, pristine same-record refreshes, and record switches;
  // it denies replacement while the user has edited the current record.
  const gateRef = useRef<HydrationGateState>(INITIAL_GATE);
  useEffect(() => {
    if (!existing) return;
    const { hydrate, next } = resolveHydration(gateRef.current, id);
    if (!hydrate) return;
    gateRef.current = next;
    setForm({
      ...emptyForm(),
      ...Object.fromEntries(
        Object.entries(existing).map(([k, v]) => [k, v === null ? "" : v])
      ),
      abnormal_cause: "",
    } as FormState);
  }, [existing, id]);

  // equipment code → Thai label lookup
  const equipLabel = useMemo(() => {
    const map = new Map(equipment.map((e) => [e.code, e.name_th]));
    return (code: string) => map.get(code) ?? code;
  }, [equipment]);

  // Inline threshold warnings (computed live from current form values).
  const thresholdAlerts = useMemo(
    () => checkThresholds({ ...form, system_operating: form.system_operating } as never),
    [form]
  );

  // SPEC §6: abnormal_cause required when system_operating === false.
  const causeMissing = form.system_operating === false && !String(form.abnormal_cause ?? "").trim();

  // Helper to update a single field. WO-STAB-004: every user edit marks
  // the hydration gate dirty so a later background refetch snapshot of the
  // SAME record cannot overwrite the form (record switches still hydrate).
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    gateRef.current = markDirty(gateRef.current);
    setForm((f) => ({ ...f, [key]: value }));
  };

  // Convert form-state strings to the API shape ("" → null, numbers stay).
  const buildPayload = (): ReadingCreate => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      if (typeof v === "string") out[k] = v.trim() === "" ? null : v;
      else out[k] = v;
    }
    // abnormal_cause is only sent when relevant (avoids seeding spurious
    // repair_request on edits that don't touch the field).
    if (form.system_operating !== false) out.abnormal_cause = null;
    return out as unknown as ReadingCreate;
  };

  // Reveal requests are committed as state so the effect runs only after React
  // has mounted the conditional banner/field. Scheduling directly from the
  // submit handler can race that commit and leave focus on <body>.
  useEffect(() => {
    if (!revealRequest) return;
    const frameId = requestAnimationFrame(() => {
      const target = revealRequest.target === "banner" ? bannerRef.current : causeRef.current;
      if (!target) return;
      target.focus({ preventScroll: true });
      target.scrollIntoView({
        // Error recovery is time-critical: an animated scroll can settle
        // outside the viewport under concurrent layout updates. Reveal it
        // synchronously; this also satisfies reduced-motion preferences.
        behavior: "auto",
        block: "center",
        inline: "nearest",
      });
    });
    return () => cancelAnimationFrame(frameId);
  }, [revealRequest]);

  const showApiError = (msg: string) => {
    setBanner({ kind: "error", msg });
    setRevealRequest({ target: "banner" });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (causeMissing) {
      setBanner({ kind: "error", msg: "กรุณาระบุสาเหตุที่ระบบผิดปกติ" });
      setRevealRequest({ target: "cause" });
      return;
    }
    setBanner(null);
    const payload = buildPayload();
    if (isEdit && id) {
      const { data, error } = await updateMut.mutate(id, payload);
      if (data) {
        // ENV-PERF-001: navigate immediately — the 900ms setTimeout delay is
        // gone. Success feedback travels across the navigation via the
        // portal-based ToastProvider (kept await semantics: no optimistic
        // insert; id/reported_by come back from the saved DB row — server
        // truth, no client invention).
        toast.success("อัปเดตรายการสำเร็จ");
        navigate("/readings");
      } else {
        showApiError(error ?? "อัปเดตไม่สำเร็จ");
      }
    } else {
      const { data, error } = await createMut.mutate(payload);
      if (data) {
        toast.success("บันทึกรายการสำเร็จ");
        navigate("/readings");
      } else {
        showApiError(error ?? "บันทึกไม่สำเร็จ");
      }
    }
  };

  const onDelete = () => {
    if (!id) return;
    if (!window.confirm("ยืนยันการลบรายการนี้? ย้อนกลับได้ภายใน 10 วินาที")) return;
    // ENV-UNDO-001: deferred delete — hide the row optimistically (cache
    // snapshots captured for undo), show the 10s "ย้อนกลับ" toast, and fire
    // the real DELETE only when the window expires. Undo is a pure cache
    // restore: the row was never deleted server-side. (The old flow's
    // WO-STAB-001 !error judgment lived here; the deferred outcome is now
    // judged on expiry inside scheduleDeferredDelete instead.)
    const snapshots = captureAndHideReadings(queryClient, id);
    navigate("/readings");
    scheduleDeferredDelete({ id, toast, ...snapshots }, queryClient);
    toast.toast("success", "ลบแล้ว", {
      action: {
        label: "ย้อนกลับ",
        onAction: () => {
          const entry = pendingDeletes.get(id);
          if (!entry) return;
          clearTimeout(entry.timerId);
          pendingDeletes.delete(id);
          restoreReadingsSnapshots(queryClient, entry);
        },
      },
      durationMs: UNDO_WINDOW_MS,
      countdown: true,
    });
  };

  if (loadingExisting) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const submitting = createMut.loading || updateMut.loading;

  return (
    <form onSubmit={onSubmit} className="max-w-3xl mx-auto space-y-4 pb-48">
      {/* Header */}
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            <span className="aura-text-gradient">{isEdit ? "แก้ไข" : "บันทึก"}</span>
            <span className="text-aura-textMain"> ประจำวัน</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            ระบบบำบัดน้ำเสีย · WWTP-1
          </p>
        </div>
      </header>

      {/* Banner */}
      {banner && (
        <div
          ref={bannerRef}
          role={banner.kind === "error" ? "alert" : "status"}
          aria-live={banner.kind === "error" ? "assertive" : "polite"}
          aria-atomic="true"
          tabIndex={-1}
          className={cn(
            "rounded-2xl px-4 py-3 text-sm font-thai flex items-center gap-2 border focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-cyan/70",
            banner.kind === "success" && "bg-alert-green/10 border-alert-green/40 text-alert-green",
            banner.kind === "error" && "bg-alert-red/10 border-alert-red/40 text-alert-red",
            banner.kind === "warning" && "bg-alert-amber/10 border-alert-amber/40 text-alert-amber"
          )}
        >
          <MSymbol name={banner.kind === "success" ? "check_circle" : "warning"} className="text-[18px]" />
          {banner.msg}
        </div>
      )}

      {/* Threshold warning banner (live, pre-submit) */}
      {thresholdAlerts.length > 0 && (
        <div className="rounded-2xl px-4 py-3 text-sm font-thai bg-alert-amber/10 border border-alert-amber/40 text-alert-amber space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <MSymbol name="warning" className="text-[18px]" /> ค่าผิดปกติ ({thresholdAlerts.length})
          </div>
          {thresholdAlerts.map((a, i) => (
            <div key={i} className="pl-6">• {a.message}</div>
          ))}
        </div>
      )}

      {/* SECTION 1 — ข้อมูลทั่วไป */}
      <AccordionSection title="ข้อมูลทั่วไป" subtitle="วันที่บันทึกและสถานะระบบ" defaultOpen>
        <Field label="วันที่บันทึก" required htmlFor="reading_date">
          <Input
            id="reading_date"
            type="date"
            value={String(form.reading_date)}
            onChange={(e) => set("reading_date", e.target.value)}
            required
          />
        </Field>
        <div className="rounded-xl p-4 bg-aura-surfaceHigh/40 border border-aura-borderSubtle space-y-3">
          <Toggle
            checked={(form.system_operating ?? null) as boolean | null}
            onChange={(v) => set("system_operating", v)}
            label="ระบบทำงานปกติ"
            description={form.system_operating === false ? "⚠ ทำเครื่องหมายว่าระบบผิดปกติ — ต้องระบุสาเหตุด้านล่าง" : "เปิดอยู่/ทำงานปกติ"}
          />
          {form.system_operating === false && (
            <div className="space-y-1.5 pl-14">
              <Field
                label="สาเหตุที่ผิดปกติ"
                required
                hint={causeMissing ? undefined : "ระบบจะบันทึกรายการก่อน แล้วจึงพยายามสร้างใบแจ้งซ่อมแยกต่างหาก"}
                htmlFor="abnormal_cause"
              >
                <>
                  <Textarea
                    ref={causeRef}
                    id="abnormal_cause"
                    rows={2}
                    value={String(form.abnormal_cause ?? "")}
                    onChange={(e) => set("abnormal_cause", e.target.value)}
                    aria-invalid={causeMissing || undefined}
                    aria-describedby={causeMissing ? "abnormal-cause-error" : undefined}
                    placeholder="เช่น เครื่องเติมอากาศ 2 ขัดข้อง, ปั๊มน้ำเสีย 1 หยุดทำงาน"
                  />
                  {causeMissing && (
                    <p id="abnormal-cause-error" role="alert" className="text-xs text-alert-red font-thai">
                      จำเป็นต้องระบุเมื่อระบบผิดปกติ
                    </p>
                  )}
                </>
              </Field>
            </div>
          )}
        </div>
      </AccordionSection>

      {/* SECTION 2 — คุณภาพน้ำ */}
      <AccordionSection title="คุณภาพน้ำ" subtitle="DO, pH, TDS, อุณหภูมิ, SV30, คลอรีนอิสระ">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="DO ถังเติมอากาศ" unit="mg/L">
            <NumberInput value={String(form.do_aeration)} onChange={(e) => set("do_aeration", e.target.value)} />
          </Field>
          <Field label="DO ถังตกตะกอน" unit="mg/L">
            <NumberInput value={String(form.do_sedimentation)} onChange={(e) => set("do_sedimentation", e.target.value)} />
          </Field>
          <Field label="DO ก่อนระบาย" unit="mg/L">
            <NumberInput value={String(form.do_before_discharge)} onChange={(e) => set("do_before_discharge", e.target.value)} />
          </Field>
          <Field label="pH">
            <NumberInput value={String(form.ph)} onChange={(e) => set("ph", e.target.value)} />
          </Field>
          <Field label="TDS ถังเติมอากาศ" unit="mg/L">
            <NumberInput value={String(form.tds_aeration)} onChange={(e) => set("tds_aeration", e.target.value)} />
          </Field>
          <Field label="TDS ก่อนระบาย" unit="mg/L">
            <NumberInput value={String(form.tds_before_discharge)} onChange={(e) => set("tds_before_discharge", e.target.value)} />
          </Field>
          <Field label="อุณหภูมิ" unit="°C">
            <NumberInput value={String(form.temp_aeration)} onChange={(e) => set("temp_aeration", e.target.value)} />
          </Field>
          <Field label="SV30" unit="mL/L">
            <NumberInput value={String(form.sv30)} onChange={(e) => set("sv30", e.target.value)} />
          </Field>
          <Field label="คลอรีนอิสระ" unit="mg/L">
            <NumberInput value={String(form.free_chlorine)} onChange={(e) => set("free_chlorine", e.target.value)} />
          </Field>
        </div>
      </AccordionSection>

      {/* SECTION 3 — คลอรีนและสารเคมี */}
      <AccordionSection title="คลอรีนและสารเคมี" subtitle="ปริมาณคลอรีนที่ใช้, อัตราผสม, ตะกอนส่วนเกิน">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="คลอรีนที่ใช้" unit="ลิตร">
            <NumberInput value={String(form.chlorine_used)} onChange={(e) => set("chlorine_used", e.target.value)} />
          </Field>
          <Field label="อัตราส่วนผสม">
            <Input value={String(form.chlorine_mix_ratio ?? "")} onChange={(e) => set("chlorine_mix_ratio", e.target.value)} placeholder="เช่น 1:5" />
          </Field>
          <Field label="ตะกอนส่วนเกินที่เก็บออก" unit="m³">
            <NumberInput value={String(form.excess_sludge_removed)} onChange={(e) => set("excess_sludge_removed", e.target.value)} />
          </Field>
        </div>
      </AccordionSection>

      {/* SECTION 4 — เช็คลิสต์อุปกรณ์ */}
      <AccordionSection title="เช็คลิสต์อุปกรณ์ (10 ตัว)" subtitle="ตรวจสอบการทำงานของอุปกรณ์แต่ละชิ้น">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EQUIPMENT_CHECKS.map(({ key, code }) => (
            <div key={code} className="rounded-xl p-3 bg-aura-surfaceHigh/30 border border-aura-borderSubtle/60">
              <Toggle
                checked={(form[key] ?? null) as boolean | null}
                onChange={(v) => set(key, v as never)}
                label={equipLabel(code)}
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* SECTION 5 — มิเตอร์ + ปริมาณน้ำ */}
      <AccordionSection title="มิเตอร์ + ปริมาณน้ำ + ไฟฟ้า" subtitle="มิเตอร์ปั๊ม, ปริมาณน้ำเข้า/ออก, ไฟฟ้า">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="มิเตอร์ปั๊ม 1" unit="kWh">
            <NumberInput value={String(form.pump1_meter)} onChange={(e) => set("pump1_meter", e.target.value)} />
          </Field>
          <Field label="มิเตอร์ปั๊ม 2" unit="kWh">
            <NumberInput value={String(form.pump2_meter)} onChange={(e) => set("pump2_meter", e.target.value)} />
          </Field>
          <Field label="น้ำที่ใช้รวม" unit="m³">
            <NumberInput value={String(form.water_used_total)} onChange={(e) => set("water_used_total", e.target.value)} />
          </Field>
          <Field label="น้ำเข้าระบบ" unit="m³">
            <NumberInput value={String(form.wastewater_in)} onChange={(e) => set("wastewater_in", e.target.value)} />
          </Field>
          <Field label="เลขมิเตอร์ไฟฟ้า" unit="kWh">
            <NumberInput value={String(form.electricity_meter_value)} onChange={(e) => set("electricity_meter_value", e.target.value)} />
          </Field>
          <Field label="ไฟฟ้าที่ใช้วันนี้" unit="kWh">
            <NumberInput value={String(form.electricity_consumption)} onChange={(e) => set("electricity_consumption", e.target.value)} />
          </Field>
        </div>
        <div className="rounded-xl p-4 bg-aura-surfaceHigh/40 border border-aura-borderSubtle">
          <Toggle
            checked={(form.wastewater_discharged ?? null) as boolean | null}
            onChange={(v) => set("wastewater_discharged", v)}
            label="มีการระบายน้ำทิ้งวันนี้"
            description="บันทึกสถานะการระบายน้ำที่ผ่านการบำบัดแล้ว"
          />
        </div>
      </AccordionSection>

      {/* SECTION 6 — หมายเหตุ */}
      <AccordionSection title="หมายเหตุ" subtitle="สี, กลิ่น, ข้อสังเกตอื่นๆ">
        <Field label="สีของน้ำ" hint="แตะเลือกค่าที่พบบ่อย หรือพิมพ์เอง">
          <QuickChips options={COLOR_CHIPS} value={String(form.color_desc ?? "")} onPick={(v) => set("color_desc", v)} />
          <Input value={String(form.color_desc ?? "")} onChange={(e) => set("color_desc", e.target.value)} placeholder="เช่น น้ำตาลเข้ม" />
        </Field>
        <Field label="กลิ่น" hint="แตะเลือกค่าที่พบบ่อย หรือพิมพ์เอง">
          <QuickChips options={SMELL_CHIPS} value={String(form.smell_desc ?? "")} onPick={(v) => set("smell_desc", v)} />
          <Input value={String(form.smell_desc ?? "")} onChange={(e) => set("smell_desc", e.target.value)} placeholder="เช่น กลิ่นดินปกติ" />
        </Field>
        <Field label="หมายเหตุเพิ่มเติม">
          <Textarea rows={3} value={String(form.note ?? "")} onChange={(e) => set("note", e.target.value)} />
        </Field>
      </AccordionSection>

      {/* Sticky submit bar — lifted above the floating ModuleDock so phone users can always tap the actions. */}
      <div
        aria-hidden={dockOverlayOpen || undefined}
        inert={dockOverlayOpen || undefined}
        className={cn(
          "fixed bottom-24 inset-x-0 md:left-72 border-t border-aura-borderSubtle bg-aura-bgDeep/90 backdrop-blur-xl px-4 py-3 flex items-center gap-3",
          dockOverlayOpen ? "z-30 pointer-events-none" : "z-50",
        )}
      >
        <Button type="submit" loading={submitting} size="lg" className="flex-1 sm:flex-none sm:min-w-40">
          {isEdit ? "อัปเดต" : "บันทึก"}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => navigate(-1)}>
          ยกเลิก
        </Button>
        {isEdit && (
          <Button type="button" variant="danger" size="lg" onClick={onDelete} className="ml-auto">
            <MSymbol name="delete" className="text-[18px]" /> ลบ
          </Button>
        )}
      </div>
    </form>
  );
}
