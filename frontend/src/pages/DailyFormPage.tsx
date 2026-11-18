import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  INITIAL_GATE,
  markDirty,
  resolveHydration,
  type HydrationGateState,
} from "../lib/form-hydration";
import {
  APPSHEET_EQUIPMENT_LABELS,
  CHIP_NO_PUMP_METERS,
  CHIP_NO_WATER_RECORD,
  COLOR_OPTIONS,
  DISCHARGE_OPTIONS,
  EXCESS_SLUDGE_OPTIONS,
  MACHINE_STATUS_OPTIONS,
  MIX_RATIO_OPTIONS,
  SCREEN_CLEAN_OPTIONS,
  SMELL_OPTIONS,
  SYSTEM_OPERATING_OPTIONS,
  buildStatusMirror,
  createDefaults,
  dischargeFromEnum,
  dischargeToEnum,
  isEligibleRecorder,
  isFreeChlorineHigh,
  needsNoPumpMeterChip,
  needsNoWaterRecordChip,
  runningFromEnum,
  runningToEnum,
  screenCleanedFromEnum,
  screenCleanedToEnum,
  systemOperatingFromEnum,
  systemOperatingToEnum,
  validateElectricity,
  validateFreeChlorine,
  validateWastewaterIn,
} from "../lib/form-parity";
import { AccordionSection } from "../components/ui/Accordion";
import { MSymbol } from "../components/ui/MSymbol";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Field, Input, NumberInput, Select, Textarea } from "../components/ui/Input";
import { Toggle } from "../components/ui/Toggle";
import {
  useCreateReading,
  useEquipment,
  useMeterChainBefore,
  useMeterChainById,
  usePersonnel,
  useReading,
  useUpdateReading,
  useWaterUsedForDate,
} from "../lib/hooks";
// ENV-PARITY-P3-002 — ADDITIVE deduction wiring (D1-3; the badge text is honest per outcome)
import { deductForReading } from "../lib/inventory";
import { deleteReading as deleteReadingQ } from "../lib/supabase-queries";
import type { MeterChainRow } from "../lib/supabase-queries";
import { useToast, type ToastContextValue } from "../components/ui/Toast";
import { checkThresholds } from "../lib/types";
import type { ReadingCreate } from "../lib/types";
import { cn } from "../lib/utils";

/** Today's date as YYYY-MM-DD (for the reading_date default). */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Empty form state — every measured field defaults to "" (sent as null).
 *  ENV-PARITY-P1-004: AppSheet initial values (§2.1, create-only UI
 *  defaults) ride on top via createDefaults() — measured values stay
 *  EMPTY (no fallback 60/0; unknown ≠ zero). */
function emptyForm(): FormState {
  return {
    reading_date: todayISO(),
    do_aeration: "", do_sedimentation: "", do_before_discharge: "",
    tds_aeration: "", tds_before_discharge: "",
    ph: "", temp_aeration: "", sv30: "", free_chlorine: "",
    ...createDefaults(),
    pump1_meter: "", pump2_meter: "",
    water_used_total: "", wastewater_in: "",
    chlorine_used: "", excess_sludge_removed: "",
    note: "",
    electricity_consumption: "", electricity_meter_value: "",
    abnormal_cause: "",
    reported_by: "",
  } as FormState;
}

type FormState = Omit<ReadingCreate, "reading_date"> & {
  reading_date: string;
  // All numeric fields use "" (empty string) on the form side; converted to
  // null on submit so omitted values don't get coerced to 0.
  [k: string]: unknown;
};

// ─── Equipment checklist config ──────────────────────────────────────────
// Maps the *_running / screen_cleaned_* keys to the core.equipment code.
// ENV-PARITY-P1-004: labels are the VERBATIM AppSheet display names (§3.3),
// and each entry carries its enum family so the enum Select rides alongside
// the boolean Toggle (booleans REMAIN the source of truth).
const EQUIPMENT_CHECKS: {
  key: keyof FormState;
  code: string;
  family: "screen" | "machine";
}[] = [
  { key: "screen_cleaned_coarse", code: "screen_coarse", family: "screen" },
  { key: "screen_cleaned_fine", code: "screen_fine", family: "screen" },
  { key: "pump1_running", code: "pump1", family: "machine" },
  { key: "pump2_running", code: "pump2", family: "machine" },
  { key: "aerator1_running", code: "aerator1", family: "machine" },
  { key: "aerator2_running", code: "aerator2", family: "machine" },
  { key: "sludge_pump1_running", code: "sludge_pump1", family: "machine" },
  { key: "sludge_pump2_running", code: "sludge_pump2", family: "machine" },
  { key: "chlorine_pump1_running", code: "chlorine_pump1", family: "machine" },
  { key: "chlorine_pump2_running", code: "chlorine_pump2", family: "machine" },
];

/** Enum vocabulary per family (verbatim §3.3). */
const FAMILY_OPTIONS: Record<"screen" | "machine", readonly string[]> = {
  screen: SCREEN_CLEAN_OPTIONS,
  machine: MACHINE_STATUS_OPTIONS,
};

function QuickChips({ options, value, onPick, testIdPrefix }: { options: string[]; value: string; onPick: (v: string) => void; testIdPrefix?: string }) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          data-testid={testIdPrefix ? `${testIdPrefix}-${o}` : undefined}
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
  const [revealRequest, setRevealRequest] = useState<{ target: string } | null>(null);
  const [dockOverlayOpen, setDockOverlayOpen] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const causeRef = useRef<HTMLTextAreaElement>(null);

  const { data: existing, loading: loadingExisting } = useReading(isEdit ? id : null);
  const { data: equipment } = useEquipment();
  const { data: personnel } = usePersonnel();
  const createMut = useCreateReading();
  const updateMut = useUpdateReading();
  const queryClient = useQueryClient();

  // ENV-PARITY-P1-004 — honest-warning sources (§2.2).
  // น้ำประปา Water_In lookup for the form's date (never a fallback 60/0).
  const readingDateStr = String(form.reading_date ?? "") || null;
  const waterUsed = useWaterUsedForDate(readingDateStr);
  // Meter chain: the row of THIS reading when editing, else the latest
  // row strictly before the date (create mode — the current row is not
  // saved yet). Read-only (P1.2 owns the view).
  const chainById = useMeterChainById(isEdit ? id : null);
  const chainBefore = useMeterChainBefore(isEdit ? null : readingDateStr);
  const meterChainRow = useMemo<MeterChainRow | null>(() => {
    if (isEdit) return chainById.data;
    const row = chainBefore.data;
    if (!row) return null;
    // For a NEW reading, the previous meters to diff against are the
    // previous row's OWN meters — normalize into the chip predicate shape.
    return {
      ...row,
      meter_boundary_flag: false,
      spec_missing: false,
      prev_pump1_meter: row.pump1_meter,
      prev_pump2_meter: row.pump2_meter,
    };
  }, [isEdit, chainById.data, chainBefore.data]);

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

  // ENV-PARITY-P1-004 — AppSheet LOOKUP parity (ref 616–622), honestly:
  // when the day's น้ำประปา record carries Water_In and the field is still
  // empty, fill the RECORD's own value (never 60, never 0). Marked dirty so
  // a background same-record snapshot cannot silently wipe the filled
  // value. Missing record → field stays EMPTY + the warning chip (§2.2).
  useEffect(() => {
    const lookup = waterUsed.data;
    if (!lookup || !lookup.hasRecord || lookup.value === null) return;
    setForm((f) => {
      if (String(f.water_used_total ?? "") !== "") return f;
      gateRef.current = markDirty(gateRef.current);
      return { ...f, water_used_total: String(lookup.value) };
    });
  }, [waterUsed.data]);

  // Inline threshold warnings (computed live from current form values).
  const thresholdAlerts = useMemo(
    () => checkThresholds({ ...form, system_operating: form.system_operating } as never),
    [form]
  );

  // SPEC §6: abnormal_cause required when system_operating === false.
  const causeMissing = form.system_operating === false && !String(form.abnormal_cause ?? "").trim();

  // ENV-PARITY-P1-004 — Valid If / Min-Max / Invalid-value errors (§2.1
  // items 1–3), computed live; submit is blocked while any error stands.
  const fieldErrors = useMemo(
    () => ({
      free_chlorine: validateFreeChlorine(form.free_chlorine as string),
      electricity_consumption: validateElectricity(form.electricity_consumption as string),
      wastewater_in: validateWastewaterIn(form.wastewater_in as string),
    }),
    [form.free_chlorine, form.electricity_consumption, form.wastewater_in]
  );
  const errorFieldOrder = ["free_chlorine", "electricity_consumption", "wastewater_in"] as const;
  const firstError = errorFieldOrder.find((k) => fieldErrors[k] !== null) ?? null;

  // Honest warnings (§2.2) — informational chips, never value substitutions.
  const showWaterChip = useMemo(() => {
    if (!waterUsed.data) return false; // lookup still loading — no flash
    return needsNoWaterRecordChip(waterUsed.data.hasRecord ? waterUsed.data.value : null);
  }, [waterUsed.data]);
  const showMeterChip = useMemo(() => {
    if (chainById.loading && isEdit) return false;
    if (chainBefore.loading && !isEdit) return false;
    return needsNoPumpMeterChip(meterChainRow);
  }, [meterChainRow, chainById.loading, chainBefore.loading, isEdit]);

  // Helper to update a single field. WO-STAB-004: every user edit marks
  // the hydration gate dirty so a later background refetch snapshot of the
  // SAME record cannot overwrite the form (record switches still hydrate).
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    gateRef.current = markDirty(gateRef.current);
    setForm((f) => ({ ...f, [key]: value }));
  };

  // Convert form-state strings to the API shape ("" → null, numbers stay).
  // ENV-PARITY-P1-004: the P1.1 `*_status` mirrors ride along on every save
  // (derived from the booleans — source of truth — so they are in sync by
  // construction), and ผู้บันทึก travels as reported_by.
  const buildPayload = (): ReadingCreate => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      if (typeof v === "string") out[k] = v.trim() === "" ? null : v;
      else out[k] = v;
    }
    if (String(out.reported_by ?? "") === "") out.reported_by = null;
    // *_status mirrors (10 columns) — boolean-derived, never hand-entered.
    Object.assign(out, buildStatusMirror(form as never));
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
      const target =
        revealRequest.target === "banner"
          ? bannerRef.current
          : revealRequest.target === "cause"
            ? causeRef.current
            : document.getElementById(revealRequest.target);
      if (!target) return;
      if (target instanceof HTMLElement) {
        target.focus({ preventScroll: true });
        target.scrollIntoView({
          // Error recovery is time-critical: an animated scroll can settle
          // outside the viewport under concurrent layout updates. Reveal it
          // synchronously; this also satisfies reduced-motion preferences.
          behavior: "auto",
          block: "center",
          inline: "nearest",
        });
      }
    });
    return () => cancelAnimationFrame(frameId);
  }, [revealRequest]);

  const showApiError = (msg: string) => {
    setBanner({ kind: "error", msg });
    setRevealRequest({ target: "banner" });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // ENV-PARITY-P1-004 — AppSheet blocks invalid VALUES on save; mirror
    // that by refusing submit while any Valid If / Min-Max error stands.
    if (firstError) {
      setBanner({ kind: "error", msg: fieldErrors[firstError] ?? "" });
      setRevealRequest({ target: `field-${firstError}` });
      return;
    }
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
      const { data, error, statusMirrorWarning } = await createMut.mutate(payload);
      if (data) {
        // ENV-PERF-001: navigate immediately — the 900ms setTimeout delay is
        // gone. Success feedback travels across the navigation via the
        // portal-based ToastProvider (kept await semantics: no optimistic
        // insert; id/reported_by come back from the saved DB row — server
        // truth, no client invention).
        toast.success("บันทึกรายการสำเร็จ");
        if (statusMirrorWarning) {
          // Honest warning: the reading saved; only the P1.1 enum mirrors
          // (parallel parity columns) are not yet in sync.
          toast.warning(statusMirrorWarning);
        }
        // ENV-PARITY-P3-002 (additive badge lines, D1-3): a save with
        // chlorine_used > 0 also drives the FEFO stock deduction — the
        // honest outcome badge is non-blocking and never misreports the
        // save itself (the reading IS saved; only the deduction outcome
        // varies: deducted / partial / skipped / already-*). Edits do NOT
        // re-deduct (WO §4-4).
        const usedRaw = payload.chlorine_used;
        const usedNum = usedRaw === null || usedRaw === undefined || usedRaw === "" ? null : Number(usedRaw);
        if (Number.isFinite(usedNum as number) && (usedNum as number) > 0 && data.id) {
          const deductionNote = await deductForReading({
            readingId: data.id,
            chlorineUsed: usedNum,
            mixRatio: (payload.chlorine_mix_ratio as string | null) ?? null,
            readingDate: payload.reading_date,
          });
          if (deductionNote) toast.warning(deductionNote);
        }
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
            label="การทำงานของระบบบำบัดน้ำเสีย (ระบบทำงานปกติ)"
            description={form.system_operating === false ? "⚠ ทำเครื่องหมายว่าระบบผิดปกติ — ต้องระบุสาเหตุด้านล่าง" : "เปิดอยู่/ทำงานปกติ"}
          />
          {/* AppSheet enum vocabulary alongside the boolean (§2.1, ref 658–669).
              The boolean stays the source of truth; this select mirrors it. */}
          <div className="pl-14">
            <Field label="การทำงานของระบบบำบัดน้ำเสีย" htmlFor="system-operating-enum">
              <Select
                id="system-operating-enum"
                data-testid="system-operating-select"
                value={systemOperatingToEnum(form.system_operating as boolean | null)}
                onChange={(e) => set("system_operating", systemOperatingFromEnum(e.target.value))}
              >
                <option value="">— ไม่ระบุ —</option>
                {SYSTEM_OPERATING_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </Field>
          </div>
          {/* ผู้บันทึก — Valid If (ref 716–720): only active personnel whose
              position ∈ {นักวิชาการสาธารณสุข, พนักงานบริการ}. */}
          <div className="pl-14">
            <Field label="ผู้บันทึก" htmlFor="recorder-select" hint="แสดงเฉพาะบุคลากรตำแหน่ง นักวิชาการสาธารณสุข / พนักงานบริการ ที่สถานะทำงาน">
              <Select
                id="recorder-select"
                data-testid="recorder-select"
                value={String(form.reported_by ?? "")}
                onChange={(e) => set("reported_by", e.target.value)}
              >
                <option value="">— ไม่ระบุ —</option>
                {personnel
                  .filter((p) => isEligibleRecorder(p))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                      {p.position ? ` (${p.position})` : ""}
                    </option>
                  ))}
              </Select>
            </Field>
          </div>
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
          {/* §2.1 item 1 + §2.3 format rule: Min 0 / Max 100 with the
              verbatim Invalid value error (ref 461), and red + warning icon
              when the value is strictly > 2.5 (ref §10 line 6429). */}
          <Field
            label="คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)"
            unit="mg/L"
            error={fieldErrors.free_chlorine ?? undefined}
            htmlFor="free_chlorine"
          >
            {isFreeChlorineHigh(form.free_chlorine as string) ? (
              <span
                data-testid="free-chlorine-highlight"
                className="flex items-center gap-1.5 rounded-lg bg-alert-red/15 border border-alert-red/40 px-2 py-1"
              >
                <MSymbol name="warning" className="text-[18px] text-alert-red" />
                <NumberInput
                  id="free_chlorine"
                  data-testid="free-chlorine-input"
                  aria-invalid={fieldErrors.free_chlorine ? true : undefined}
                  value={String(form.free_chlorine)}
                  onChange={(e) => set("free_chlorine", e.target.value)}
                  className="text-alert-red border-transparent bg-transparent"
                />
              </span>
            ) : (
              <NumberInput
                id="free_chlorine"
                data-testid="free-chlorine-input"
                aria-invalid={fieldErrors.free_chlorine ? true : undefined}
                value={String(form.free_chlorine)}
                onChange={(e) => set("free_chlorine", e.target.value)}
              />
            )}
          </Field>
        </div>
      </AccordionSection>

      {/* SECTION 3 — คลอรีนและสารเคมี */}
      <AccordionSection title="คลอรีนและสารเคมี" subtitle="ปริมาณคลอรีนที่ใช้, อัตราผสม, ตะกอนส่วนเกิน">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="คลอรีนที่ใช้" unit="ลิตร">
            <NumberInput value={String(form.chlorine_used)} onChange={(e) => set("chlorine_used", e.target.value)} />
          </Field>
          {/* §2.1 — อัตราส่วนผสม(คลอรีน/น้ำ) enum (ref 750–761); P1.1 CHECK
              enforces on DB. Initial value 1:4 = UI default on create only. */}
          <Field label="อัตราส่วนผสม(คลอรีน/น้ำ)" htmlFor="mix-ratio-select">
            <Select
              id="mix-ratio-select"
              data-testid="mix-ratio-select"
              value={String(form.chlorine_mix_ratio ?? "")}
              onChange={(e) => set("chlorine_mix_ratio", e.target.value)}
            >
              <option value="">— ไม่ระบุ —</option>
              {MIX_RATIO_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          </Field>
          {/* §2.1 — ตะกอนส่วนเกินที่นำไปกำจัด (ref 670–675): quick-pick
              chips carry the four verbatim AppSheet values; the number stays
              editable for other measurements. */}
          <Field label="ตะกอนส่วนเกินที่นำไปกำจัด" unit="m³">
            <QuickChips
              options={[...EXCESS_SLUDGE_OPTIONS]}
              value={String(form.excess_sludge_removed ?? "")}
              onPick={(v) => set("excess_sludge_removed", v)}
              testIdPrefix="sludge-pick"
            />
            <NumberInput value={String(form.excess_sludge_removed)} onChange={(e) => set("excess_sludge_removed", e.target.value)} />
          </Field>
        </div>
      </AccordionSection>

      {/* SECTION 4 — เช็คลิสต์อุปกรณ์ */}
      <AccordionSection title="เช็คลิสต์อุปกรณ์ (10 ตัว)" subtitle="ตรวจสอบการทำงานของอุปกรณ์แต่ละชิ้น">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EQUIPMENT_CHECKS.map(({ key, code, family }) => (
            <div key={code} className="rounded-xl p-3 bg-aura-surfaceHigh/30 border border-aura-borderSubtle/60 space-y-2">
              <Toggle
                checked={(form[key] ?? null) as boolean | null}
                onChange={(v) => set(key, v as never)}
                label={APPSHEET_EQUIPMENT_LABELS[code] ?? equipLabel(code)}
              />
              {/* AppSheet enum vocabulary alongside the boolean (§2.1):
                  booleans REMAIN the source of truth — this select mirrors
                  the toggle and writes the P1.1 *_status column on save. */}
              <Select
                aria-label={`${APPSHEET_EQUIPMENT_LABELS[code] ?? code} (สถานะ)`}
                data-testid={`machine-select-${String(key)}`}
                value={family === "screen" ? screenCleanedToEnum(form[key] as boolean | null) : runningToEnum(form[key] as boolean | null)}
                onChange={(e) => {
                  const v = family === "screen" ? screenCleanedFromEnum(e.target.value) : runningFromEnum(e.target.value);
                  set(key, v as never);
                }}
              >
                <option value="">— ไม่ระบุ —</option>
                {FAMILY_OPTIONS[family].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* SECTION 5 — มิเตอร์ + ปริมาณน้ำ */}
      <AccordionSection title="มิเตอร์ + ปริมาณน้ำ + ไฟฟ้า" subtitle="มิเตอร์ปั๊ม, ปริมาณน้ำเข้า/ออก, ไฟฟ้า">
        {/* Honest warnings (§2.2) — informational chips, never blockers and
            never value substitutions (unknown ≠ 0). */}
        {(showWaterChip || showMeterChip) && (
          <div className="rounded-xl px-4 py-3 bg-alert-amber/10 border border-alert-amber/40 space-y-1.5">
            {showWaterChip && (
              <p data-testid="chip-water-missing" className="text-sm font-thai text-alert-amber flex items-center gap-1.5">
                <MSymbol name="warning" className="text-[18px]" /> {CHIP_NO_WATER_RECORD}
              </p>
            )}
            {showMeterChip && (
              <p data-testid="chip-meter-missing" className="text-sm font-thai text-alert-amber flex items-center gap-1.5">
                <MSymbol name="warning" className="text-[18px]" /> {CHIP_NO_PUMP_METERS}
              </p>
            )}
          </div>
        )}
        {/* Derived meter context (P1.2 view — display-only; the form never
            re-computes ×34/×12/streak math locally). */}
        {meterChainRow && (
          <div className="rounded-xl p-3 bg-aura-surfaceHigh/30 border border-aura-borderSubtle/60 text-xs font-thai text-aura-textMuted space-y-1">
            <p className="font-semibold text-aura-textMain flex items-center gap-1.5">
              <MSymbol name="calculate" className="text-[16px]" /> ค่าคำนวณจากระบบ (อ่านอย่างเดียว)
            </p>
            <p>มิเตอร์ปั๊ม 1 เมื่อวาน: {meterChainRow.prev_pump1_meter ?? "—"} · มิเตอร์ปั๊ม 2 เมื่อวาน: {meterChainRow.prev_pump2_meter ?? "—"}</p>
            {meterChainRow.delta_kwh !== null && meterChainRow.delta_kwh !== undefined && (
              <p>ไฟฟ้าที่ใช้ (delta): {String(meterChainRow.delta_kwh)} kWh</p>
            )}
            {meterChainRow.avg_westwater_4d !== null && meterChainRow.avg_westwater_4d !== undefined && (
              <p>น้ำเข้าระบบเฉลี่ย 4 วัน: {String(meterChainRow.avg_westwater_4d)} m³</p>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="มิเตอร์ปั๊ม 1" unit="kWh">
            <NumberInput value={String(form.pump1_meter)} onChange={(e) => set("pump1_meter", e.target.value)} />
          </Field>
          <Field label="มิเตอร์ปั๊ม 2" unit="kWh">
            <NumberInput value={String(form.pump2_meter)} onChange={(e) => set("pump2_meter", e.target.value)} />
          </Field>
          <Field label="ปริมาณน้ำที่ใช้ในทุกกิจกรรม" unit="m³" hint={showWaterChip ? CHIP_NO_WATER_RECORD : undefined}>
            {/* §2.2-1 — AppSheet defaulted blank lookups to 60; ENV keeps the
                field EMPTY when the day's น้ำประปา record is missing (the
                chip above carries the warning). Never 60, never 0. */}
            <NumberInput
              id="water_used_total"
              data-testid="water-used-input"
              value={String(form.water_used_total)}
              onChange={(e) => set("water_used_total", e.target.value)}
            />
          </Field>
          <Field label="ปริมาณน้ำเสียที่เข้าระบบบำบัด" unit="m³" error={fieldErrors.wastewater_in ?? undefined} htmlFor="wastewater_in">
            {/* §2.1 item 3 — Invalid value error (ref 643). The AppSheet
                text-prompt-into-value behavior is FORBIDDEN; the field is
                numeric-only and the honest meter chip above replaces it. */}
            <NumberInput
              id="wastewater_in"
              data-testid="wastewater-in-input"
              aria-invalid={fieldErrors.wastewater_in ? true : undefined}
              value={String(form.wastewater_in)}
              onChange={(e) => set("wastewater_in", e.target.value)}
            />
          </Field>
          <Field label="เลขมิเตอร์ไฟฟ้า" unit="kWh">
            <NumberInput value={String(form.electricity_meter_value)} onChange={(e) => set("electricity_meter_value", e.target.value)} />
          </Field>
          <Field
            label="ปริมาณการใช้ไฟฟ้าของระบบ"
            unit="kWh"
            error={fieldErrors.electricity_consumption ?? undefined}
            htmlFor="electricity_consumption"
          >
            {/* §2.1 item 2 — Valid If >0 (ref 607) + verbatim error
                (ref 613). The DERIVED value lives in the P1.2 view
                (delta_kwh, shown above); no client-side re-derivation. */}
            <NumberInput
              id="electricity_consumption"
              data-testid="electricity-input"
              aria-invalid={fieldErrors.electricity_consumption ? true : undefined}
              value={String(form.electricity_consumption)}
              onChange={(e) => set("electricity_consumption", e.target.value)}
            />
          </Field>
        </div>
        <div className="rounded-xl p-4 bg-aura-surfaceHigh/40 border border-aura-borderSubtle space-y-3">
          <Toggle
            checked={(form.wastewater_discharged ?? null) as boolean | null}
            onChange={(v) => set("wastewater_discharged", v)}
            label="การระบายน้ำทิ้งออกจากระบบ"
            description="บันทึกสถานะการระบายน้ำที่ผ่านการบำบัดแล้ว"
          />
          {/* AppSheet enum vocabulary alongside the boolean (ref 646–657). */}
          <div className="pl-14">
            <Field label="การระบายน้ำทิ้งออกจากระบบ" htmlFor="discharge-enum">
              <Select
                id="discharge-enum"
                data-testid="discharge-select"
                value={dischargeToEnum(form.wastewater_discharged as boolean | null)}
                onChange={(e) => set("wastewater_discharged", dischargeFromEnum(e.target.value))}
              >
                <option value="">— ไม่ระบุ —</option>
                {DISCHARGE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </AccordionSection>

      {/* SECTION 6 — หมายเหตุ */}
      <AccordionSection title="หมายเหตุ" subtitle="สี, กลิ่น, ข้อสังเกตอื่นๆ">
        {/* §2.1 — ลักษณะสี (ref 676–687): full verbatim value list incl. ดำ. */}
        <Field label="ลักษณะสี" hint="แตะเลือกค่าตาม AppSheet หรือพิมพ์เอง">
          <QuickChips options={[...COLOR_OPTIONS]} value={String(form.color_desc ?? "")} onPick={(v) => set("color_desc", v)} />
          <Input value={String(form.color_desc ?? "")} onChange={(e) => set("color_desc", e.target.value)} placeholder="เช่น น้ำตาลเข้ม" />
        </Field>
        {/* §2.1 — ลักษณะกลิ่น (ref 688–699): full verbatim value list. */}
        <Field label="ลักษณะกลิ่น" hint="แตะเลือกค่าตาม AppSheet หรือพิมพ์เอง">
          <QuickChips options={[...SMELL_OPTIONS]} value={String(form.smell_desc ?? "")} onPick={(v) => set("smell_desc", v)} />
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
