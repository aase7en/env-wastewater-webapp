/**
 * ENV-PARITY-P2-002 — ตรวจรายถัง (extinguisher per-unit inspection, staff).
 *
 * AppSheet ตรวจสอบถัง flow (ref 12 §3.13; WO §4/§7):
 *   สแกน QR → auto-fill (RPC) → pipe/handle/tank/pressure/barrier →
 *   หมดอายุ auto-label → รูปชำรุด (attachment) → save (the Update_ExpDate
 *   trigger bumps the master expiry server-side).
 *
 * Form field visibility follows the verbatim Show If gates; enum lists +
 * initial values are verbatim (lib/extinguisher-inspection.ts); Thai
 * labels are the verbatim AppSheet column names; dates render พ.ศ.
 * Unknown stays unknown — no zero substitution anywhere.
 *
 * Mobile-first 360/390/430 (house mobile contract); Track Z minimal
 * markup, Track F owns polish.
 */
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/Input";
import { TableSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/Toast";
import { QrScanner } from "../components/extinguisher/QrScanner";
import { uploadAttachment } from "../lib/attachments";
import {
  BARRIER_DEFAULT,
  BARRIER_OPTIONS,
  CAUSE_OPTIONS,
  ITEM_DEFAULT,
  ITEM_OPTIONS,
  PRESSURE_OPTIONS,
  deriveBreakdownLabel,
  expiryStatusOf,
  generateInspectionId,
  isEligibleInspector,
  showBreakdownDetails,
  showCauseAndPhoto,
} from "../lib/extinguisher-inspection";
import { resolveExtinguisherQr, type ExtinguisherResolveResult } from "../lib/supabase-queries";
import {
  useCreateExtinguisherInspection,
  useExtinguisherInspections,
  useExtinguishers,
  useInspectors,
} from "../lib/hooks";
import { thaiDate } from "../lib/utils";
import { useQueryClient } from "@tanstack/react-query";

/** Date → "YYYY-MM-DDTHH:mm" in LOCAL time (datetime-local input value). */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** พ.ศ. date + time rendering of an ISO timestamp (unknown → "—"). */
function thaiDateTime(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${thaiDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())} น.`;
}

/** The พ.ศ. rendering of a datetime-local input value (unknown → "—"). */
function thaiFromInput(v: string): string {
  if (!v) return "—";
  return thaiDateTime(v);
}

const emptyItems = () => ({
  pipe: ITEM_DEFAULT,
  handle: ITEM_DEFAULT,
  tank: ITEM_DEFAULT,
  pressure_gauge: ITEM_DEFAULT,
  barrier: BARRIER_DEFAULT,
});

export function ExtinguisherInspectionPage() {
  const { data: inspections, loading, error, refresh } = useExtinguisherInspections();
  const { data: extinguishers } = useExtinguishers();
  const { data: inspectors } = useInspectors();
  const createMut = useCreateExtinguisherInspection();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);

  // ── resolve state (the [QR_CODE] gate — nothing shows before a resolve)
  const [resolved, setResolved] = useState<ExtinguisherResolveResult | null>(null);
  const [qrText, setQrText] = useState("");
  const [qrError, setQrError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  // ── form state (AppSheet init values verbatim)
  const [inspectionDate, setInspectionDate] = useState(() => toLocalInput(new Date()));
  const [items, setItems] = useState(emptyItems);
  const [breakdown, setBreakdown] = useState("");
  const [cause, setCause] = useState("");
  const [inspectorId, setInspectorId] = useState("");
  const [defectFile, setDefectFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const expired = resolved ? deriveBreakdownLabel(resolved.master.expiry_date, inspectionDate) === "หมดอายุ" : false;
  const masterStatus = resolved ? expiryStatusOf(resolved.master.expiry_date, toLocalInput(new Date()).slice(0, 10)) : null;

  const setItem = (key: keyof typeof items, value: string) => {
    const next = { ...items, [key]: value };
    setItems(next);
    // breakdown_details auto-label re-derives on item/date changes per the
    // verbatim init formula (editable afterwards — AppSheet init is an
    // initial value, not a computed column)
    setBreakdown(deriveBreakdownLabel(resolved?.master.expiry_date ?? null, inspectionDate));
  };

  const resolve = async (payload: string) => {
    setQrError(null);
    setResolving(true);
    try {
      const result = await resolveExtinguisherQr(payload);
      setResolved(result);
      setBreakdown(deriveBreakdownLabel(result.master.expiry_date, inspectionDate));
      setCause("");
      setDefectFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setResolved(null);
      // the RPC's verbatim Thai error ('ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ')
      // surfaces as-is — fail-closed, no auto-fill, no invented rows
      setQrError(e instanceof Error ? e.message : String(e));
    } finally {
      setResolving(false);
    }
  };

  const onManualPick = (id: string) => {
    if (!id) return;
    void resolve(id);
  };

  const resetForm = () => {
    setResolved(null);
    setQrText("");
    setItems(emptyItems());
    setBreakdown("");
    setCause("");
    setInspectionDate(toLocalInput(new Date()));
    setDefectFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!resolved) {
      setFormError("ยังไม่ได้ระบุถัง — สแกน QR หรือเลือกจากรายการก่อน");
      return;
    }
    if (!inspectionDate) {
      setFormError("ระบุวันที่ตรวจสอบก่อน");
      return;
    }
    const id = generateInspectionId();
    const blankToNull = (v: string) => (v === "" ? null : v);
    const payload = {
      id,
      legacy_id: null,
      inspection_date: new Date(inspectionDate).toISOString(),
      extinguisher_id: resolved.master.legacy_row_id,
      location_snapshot: blankToNull(resolved.master.location ?? ""),
      type_snapshot: blankToNull(resolved.master.extinguisher_type ?? ""),
      packed_date_snapshot: resolved.master.packed_date ?? null,
      chem_exp_snapshot: resolved.master.expiry_date ?? null,
      size_snapshot: blankToNull(resolved.master.size_label ?? ""),
      pipe: blankToNull(items.pipe),
      handle: blankToNull(items.handle),
      tank: blankToNull(items.tank),
      pressure_gauge: blankToNull(items.pressure_gauge),
      barrier: blankToNull(items.barrier),
      breakdown_details: blankToNull(breakdown),
      cause_of_damaged: showCauseAndPhoto(items) ? blankToNull(cause) : null,
      inspector_id: inspectorId === "" ? null : inspectorId,
    };
    const { error: saveError } = await createMut.mutate(payload);
    if (saveError) {
      setFormError(saveError);
      return;
    }
    // defect photo via the house attachments pattern (core.attachment +
    // Storage); a failure is an honest warning — the inspection row itself
    // is durably saved (never misreport a saved record as lost)
    let warning: string | null = null;
    if (defectFile) {
      try {
        await uploadAttachment(defectFile, "extinguisher_inspection", id, "defect_photo");
      } catch (attErr) {
        warning = attErr instanceof Error ? attErr.message : String(attErr);
      }
    }
    if (warning) {
      toast("warning", `บันทึกแล้ว แต่อัปโหลดรูปชำรุดไม่สำเร็จ: ${warning}`);
    } else {
      toast("success", "บันทึกการตรวจสอบเรียบร้อย");
    }
    setSavedId(id);
    resetForm();
    refresh();
    void qc.invalidateQueries({ queryKey: ["extinguishers"] });
  };

  const grouped = useMemo(
    () =>
      inspections.map((r) => ({
        ...r,
        status: expiryStatusOf(r.chem_exp_snapshot, toLocalInput(new Date()).slice(0, 10)),
      })),
    [inspections],
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-3 sm:p-4">
      <h1 className="text-lg font-semibold font-thai">ตรวจรายถังดับเพลิง</h1>

      <AuraCard>
        <h2 className="font-bold font-thai text-aura-textMain mb-3">บันทึกการตรวจสอบ</h2>
        <form onSubmit={(e) => void onSave(e)} className="space-y-4" data-testid="ext-insp-form">
          {/* สแกน QR + เลือกจากรายการ — the AppSheet scan/manual duality;
              manual pick is ALWAYS available */}
          <QrScanner onDetected={(payload) => void resolve(payload)} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="สแกนแล้วยังไม่ออก? กรอกรหัสใต้ QR" htmlFor="ext-qr-input">
              <Input
                id="ext-qr-input"
                data-testid="ext-qr-input"
                value={qrText}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQrText(e.target.value)}
                placeholder="รหัสถัง (PackedUUID หรือรหัสเดิม)"
                autoComplete="off"
              />
            </Field>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={resolving || qrText.trim() === ""}
                onClick={() => void resolve(qrText)}
                data-testid="ext-qr-resolve-btn"
              >
                ค้นหาถัง
              </Button>
            </div>
            <Field label="เลือกจากรายการถัง (manual)" htmlFor="ext-manual-pick">
              <Select
                id="ext-manual-pick"
                data-testid="ext-manual-pick"
                value=""
                onChange={(e) => onManualPick(e.target.value)}
              >
                <option value="">— เลือกถังดับเพลิง —</option>
                {extinguishers.map((x) => (
                  <option key={x.legacy_row_id} value={x.legacy_row_id}>
                    {x.location ?? "(ไม่ระบุตำแหน่ง)"} · {x.legacy_row_id}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {qrError ? (
            <p className="text-sm text-alert-red font-thai" data-testid="ext-qr-error" role="alert">
              {qrError}
            </p>
          ) : null}

          {/* snapshot auto-fill — READ-ONLY display (frozen copies at
              inspection time; Show If: the extinguisher is resolved) */}
          {resolved ? (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-aura-cyan/30 p-3" data-testid="ext-resolved-card">
              <div>
                <p className="text-xs text-aura-textMuted font-thai">ตำแหน่ง</p>
                <p className="text-sm font-thai" data-testid="ext-snap-location">{resolved.master.location ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-aura-textMuted font-thai">ประเภท</p>
                <p className="text-sm font-thai" data-testid="ext-snap-type">{resolved.master.extinguisher_type ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-aura-textMuted font-thai">วันที่บรรจุ</p>
                <p className="text-sm font-thai" data-testid="ext-snap-packed-date">
                  {resolved.master.packed_date ? thaiDate(resolved.master.packed_date) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-aura-textMuted font-thai">วันหมดอายุ (ฉลาก)</p>
                <p className="text-sm font-thai" data-testid="ext-snap-chem-exp">
                  {resolved.master.expiry_date ? thaiDate(resolved.master.expiry_date) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-aura-textMuted font-thai">ขนาดบรรจุ</p>
                <p className="text-sm font-thai" data-testid="ext-snap-size">{resolved.master.size_label ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-aura-textMuted font-thai">สถานะ</p>
                <p className="text-sm font-thai" data-testid="ext-expiry-status">
                  {masterStatus ?? "—"}
                </p>
              </div>
            </div>
          ) : null}

          <Field label="วันที่ตรวจสอบ" htmlFor="ext-inspection-date" required>
            <Input
              id="ext-inspection-date"
              data-testid="ext-inspection-date"
              type="datetime-local"
              value={inspectionDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setInspectionDate(e.target.value);
                setBreakdown(deriveBreakdownLabel(resolved?.master.expiry_date ?? null, e.target.value));
              }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="ท่อ" htmlFor="ext-item-pipe">
              <Select id="ext-item-pipe" data-testid="ext-item-pipe" value={items.pipe} onChange={(e) => setItem("pipe", e.target.value)}>
                {ITEM_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="หูจับ" htmlFor="ext-item-handle">
              <Select id="ext-item-handle" data-testid="ext-item-handle" value={items.handle} onChange={(e) => setItem("handle", e.target.value)}>
                {ITEM_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="ถัง" htmlFor="ext-item-tank">
              <Select id="ext-item-tank" data-testid="ext-item-tank" value={items.tank} onChange={(e) => setItem("tank", e.target.value)}>
                {ITEM_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="มาตรวัดแรงดัน" htmlFor="ext-item-pressure">
              <Select id="ext-item-pressure" data-testid="ext-item-pressure" value={items.pressure_gauge} onChange={(e) => setItem("pressure_gauge", e.target.value)}>
                {PRESSURE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="แนวกันโจมกระชอน (แผงกั้น)" htmlFor="ext-item-barrier">
              <Select id="ext-item-barrier" data-testid="ext-item-barrier" value={items.barrier} onChange={(e) => setItem("barrier", e.target.value)}>
                {BARRIER_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </Field>
          </div>

          {/* breakdown_details — Show If OR(any-abnormal, expired, resolved)
              (ref 3343 verbatim); auto-label per the verbatim init formula */}
          {showBreakdownDetails({ resolved: !!resolved, items, expired }) ? (
            <Field
              label="สถานะการหมดอายุ / รายละเอียดการชำรุด"
              htmlFor="ext-breakdown-details"
              hint="ระบบเติมอัตโนมัติตามสูตรเดิม (หมดอายุ/ไม่หมดอายุ)"
            >
              <Input
                id="ext-breakdown-details"
                data-testid="ext-breakdown-details"
                value={breakdown}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setBreakdown(e.target.value)}
              />
            </Field>
          ) : null}

          {/* cause_of_damaged + รูปชำรุด — Show If any-abnormal (ref
              3351/3389 verbatim) */}
          {showCauseAndPhoto(items) ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="สาเหตุที่ชำรุด" htmlFor="ext-cause-of-damaged">
                <Select
                  id="ext-cause-of-damaged"
                  data-testid="ext-cause-of-damaged"
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                >
                  <option value="">— ไม่ระบุ —</option>
                  {CAUSE_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </Select>
              </Field>
              <Field label="รูปชำรุด" htmlFor="ext-defect-photo">
                <Input
                  id="ext-defect-photo"
                  data-testid="ext-defect-photo"
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDefectFile(e.target.files?.[0] ?? null)}
                />
              </Field>
            </div>
          ) : null}

          {/* ผู้ตรวจสอบ — Valid If (ref 3358-3382) VERBATIM: position ∈
              {นักวิชาการสาธารณสุข, พนักงานบริการ} ∧ status ≠ ลาออก */}
          <Field
            label="ผู้ตรวจสอบ"
            htmlFor="ext-inspector-select"
            hint="แสดงเฉพาะบุคลากรตำแหน่ง นักวิชาการสาธารณสุข / พนักงานบริการ ที่ไม่ใช่สถานะลาออก"
          >
            <Select
              id="ext-inspector-select"
              data-testid="ext-inspector-select"
              value={inspectorId}
              onChange={(e) => setInspectorId(e.target.value)}
            >
              <option value="">— ไม่ระบุ —</option>
              {inspectors
                .filter((p) => isEligibleInspector(p))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                    {p.position ? ` (${p.position})` : ""}
                  </option>
                ))}
            </Select>
          </Field>

          {formError ? (
            <p className="text-sm text-alert-red font-thai" role="alert" data-testid="ext-form-error">
              {formError}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <Button type="submit" size="md" loading={createMut.loading} data-testid="ext-save-btn">
              บันทึกการตรวจสอบ
            </Button>
            {savedId ? (
              <span className="text-xs text-aura-textMuted" data-testid="ext-save-ok">
                บันทึกแล้ว (รหัส {savedId})
              </span>
            ) : null}
          </div>
        </form>
      </AuraCard>

      <AuraCard>
        <h2 className="font-bold font-thai text-aura-textMain mb-3">การตรวจสอบล่าสุด</h2>
        {loading ? (
          <TableSkeleton rows={3} />
        ) : error ? (
          <p className="text-sm text-alert-red font-thai" role="alert">{error}</p>
        ) : grouped.length === 0 ? (
          <EmptyState
            title="ยังไม่มีการตรวจสอบ"
            description="สแกน QR หรือเลือกถังจากรายการด้านบนเพื่อเริ่มบันทึก (ถังยังไม่ถูกเพิ่ม? ผู้ดูแลระบบเพิ่มได้ที่ /admin/extinguishers)"
          />
        ) : (
          <ul className="divide-y" data-testid="ext-insp-list">
            {grouped.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2">
                <span className="font-thai text-sm">
                  {r.location_snapshot ?? "(ไม่ระบุตำแหน่ง)"}
                  <span className="ml-1 font-mono text-xs text-aura-textMuted">{r.extinguisher_id}</span>
                </span>
                <span className="text-xs text-aura-textMuted font-thai">
                  {thaiFromInput(r.inspection_date)}
                  {r.chem_exp_snapshot ? ` · ฉลาก: ${thaiDate(r.chem_exp_snapshot)}` : ""}
                  {r.breakdown_details ? ` · ${r.breakdown_details}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AuraCard>
    </div>
  );
}
