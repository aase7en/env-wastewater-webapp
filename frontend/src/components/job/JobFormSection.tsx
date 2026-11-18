/**
 * ENV-PARITY-P3-004 — the job entry form (lane P3.4): the §3.24 staff
 * mobile flow — scan QR → resolve the location_area master → geofence
 * verdict → working multi-select (4 verbatim values) → ภาพ → issue.
 *
 * Verbatim pins: the QR field carries the §3.24 placeholder init
 * "สแกน QR CODE"; placeholder/blank/unresolved payloads fail with the
 * verbatim poem; the geofence client hint computes the SAME haversine the
 * SERVER trigger enforces (≤0.7 km of the verbatim hospital pin — D1-5
 * CONFIRMED; the AppSheet <=2 virtual-check bound is recorded, never a
 * gate) and an out-of-range entry is an honest reject — NO write (the
 * server would reject it identically). ภาพ attaches via the house
 * core.attachment flow (the P2.2 precedent); the payload NEVER carries a
 * legacy practician string (the PII hard pin — picker UUID only).
 *
 * Track Z minimal markup; Track F owns polish.
 */
import { useEffect, useState, type FormEvent } from "react";
import { AuraCard } from "../ui/AuraCard";
import { MSymbol } from "../ui/MSymbol";
import { Button } from "../ui/Button";
import { Field, Input } from "../ui/Input";
import { useToast } from "../ui/Toast";
import { QrScanner } from "../extinguisher/QrScanner";
import { uploadAttachment } from "../../lib/attachments";
import { supabase } from "../../lib/supabase";
import { useQuery } from "@tanstack/react-query";
import {
  QR_PLACEHOLDER,
  WORKING_OPTIONS,
  buildJobPayload,
  createJobLog,
  geofenceVerdict,
  isEligiblePractician,
  resolveJobArea,
} from "../../lib/job";

interface AreaResolved {
  id: string;
  legacy_id: string | null;
  area_name: string;
}

const emptyForm = () => ({
  qrPayload: "",
  working: [] as string[],
  issue: "",
});

export function JobFormSection() {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [area, setArea] = useState<AreaResolved | null>(null);
  const [geo, setGeo] = useState<{ lat: string; lng: string }>({ lat: "", lng: "" });
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [practitionerId, setPractitionerId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<ReturnType<typeof emptyForm>>) => setForm({ ...form, ...patch });

  const latNum = geo.lat.trim() === "" ? null : Number(geo.lat);
  const lngNum = geo.lng.trim() === "" ? null : Number(geo.lng);
  const verdict = geofenceVerdict(latNum, lngNum);

  // the practician picker — the Valid If gate verbatim (P1.4 ผู้บันทึก)
  const { data: practitioners } = useQuery({
    queryKey: ["job-practitioners"] as const,
    queryFn: async (): Promise<{ id: string; full_name: string; position: string | null; status: string | null }[]> => {
      const { data, error } = await supabase
        .from("personnel")
        .select("id, full_name, position, status")
        .order("full_name");
      if (error) throw new Error(error.message);
      return ((data ?? []) as { id: string; full_name: string; position: string | null; status: string | null }[]).filter(
        isEligiblePractician
      );
    },
  });

  // honest location capture: the §3.24 location App formula =here()
  const captureHere = () => {
    if (!navigator.geolocation) {
      setGeoStatus("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง — กรอกพิกัดด้วยมือแทน");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          lat: String(pos.coords.latitude),
          lng: String(pos.coords.longitude),
        });
        setGeoStatus(null);
      },
      () => setGeoStatus("ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง — กรอกพิกัดด้วยมือแทน"),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  // QR resolve — the IN([QR_CODE],location_area[id]) Valid If counterpart
  // runs in the effect below: any typed/scanned payload resolves against
  // the master; unresolved payloads stay null (the poem fails the submit).

  useEffect(() => {
    const v = form.qrPayload.trim();
    if (v === "" || v === QR_PLACEHOLDER) {
      setArea(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const resolved = await resolveJobArea(v);
        if (!cancelled) {
          if (resolved) {
            setArea({ id: resolved.id, legacy_id: resolved.legacy_id, area_name: resolved.area_name });
          } else {
            setArea(null);
          }
        }
      } catch {
        if (!cancelled) setArea(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.qrPayload]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    let payload: Record<string, unknown>;
    try {
      payload = buildJobPayload({
        qrPayload: form.qrPayload,
        area,
        location: latNum !== null && lngNum !== null ? { lat: latNum, lng: lngNum } : null,
        working: form.working,
        practitionerId,
        issue: form.issue,
      });
    } catch (err) {
      setFormError((err as Error).message);
      return;
    }
    setSaving(true);
    try {
      // pre-generate the row id so the photo attaches to the same entity
      // in ONE insert (staff RLS is INSERT-only — no UPDATE path)
      const rowId = crypto.randomUUID();
      let imageUrl: string | null = null;
      if (file) {
        const att = await uploadAttachment(file, "job_log", rowId, "job_photo");
        imageUrl = att.file_path;
      }
      await createJobLog({ ...payload, id: rowId, image_ref: imageUrl });
      toast("success", "บันทึกรายการงานแล้ว");
      setForm({ ...emptyForm() });
      setArea(null);
      setGeo({ lat: "", lng: "" });
      setPractitionerId("");
      setFile(null);
    } catch (err) {
      // a server geofence reject surfaces the verbatim error honestly —
      // the write never persisted (honest reject, no write)
      setFormError((err as Error).message);
      toast("error", "บันทึกรายการงานไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const toggleWorking = (v: string) => {
    const next = form.working.includes(v) ? form.working.filter((w) => w !== v) : [...form.working, v];
    set({ working: next });
  };

  return (
    <div data-testid="job-form-section">
      <AuraCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-aura-borderSubtle/60 flex items-center gap-2">
          <MSymbol name="qr_code_scanner" className="text-[20px] text-aura-cyan" />
          <h2 className="font-bold font-thai text-aura-textMain">บันทึกการทำงาน (สแกน QR)</h2>
        </div>
        <form data-testid="job-form" className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={onSubmit}>
          <div className="sm:col-span-2 space-y-2">
            <Field label="รหัส QR ของจุดงาน (QR_CODE)">
              <Input
                id="job-qr-input"
                data-testid="job-qr-input"
                value={form.qrPayload}
                placeholder={QR_PLACEHOLDER}
                onChange={(e) => set({ qrPayload: e.target.value })}
                autoComplete="off"
              />
            </Field>
            <QrScanner
              onDetected={(payload) => set({ qrPayload: payload })}
              scanButtonTestId="job-qr-scan-btn"
            />
            {form.qrPayload.trim() !== "" && form.qrPayload.trim() !== QR_PLACEHOLDER ? (
              area ? (
                <p className="text-xs font-thai text-aura-cyan" data-testid="job-area-resolved">
                  จุดงาน: {area.area_name} ({area.legacy_id})
                </p>
              ) : (
                <p className="text-xs font-thai text-alert-red" data-testid="job-area-unresolved" role="alert">
                  หาจุดงานจากรหัสนี้ไม่พบในทะเบียน location_area
                </p>
              )
            ) : null}
          </div>

          <Field label="ตำแหน่งปัจจุบัน (location = here())">
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={captureHere} data-testid="job-geo-here">
                ใช้ตำแหน่งปัจจุบัน
              </Button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="ละติจูด">
              <Input
                id="job-geo-lat"
                data-testid="job-geo-lat"
                value={geo.lat}
                onChange={(e) => setGeo({ ...geo, lat: e.target.value })}
                inputMode="decimal"
                autoComplete="off"
              />
            </Field>
            <Field label="ลองจิจูด">
              <Input
                id="job-geo-lng"
                data-testid="job-geo-lng"
                value={geo.lng}
                onChange={(e) => setGeo({ ...geo, lng: e.target.value })}
                inputMode="decimal"
                autoComplete="off"
              />
            </Field>
          </div>
          {geoStatus ? (
            <p className="sm:col-span-2 text-xs font-thai text-alert-red" role="alert">
              {geoStatus}
            </p>
          ) : null}
          {geo.lat.trim() !== "" && geo.lng.trim() !== "" ? (
            <p
              className={`sm:col-span-2 text-xs font-thai ${verdict.ok ? "text-aura-cyan" : "text-alert-red"}`}
              data-testid="job-geofence-verdict"
              role={verdict.ok ? undefined : "alert"}
            >
              {verdict.ok
                ? `อยู่ในรัศมี 0.7 กม. จาก รพ. (ราว ${verdict.distanceKm!.toFixed(3)} กม.) — เซิร์ฟเวอร์จะตรวจซ้ำอีกครั้งตอนบันทึก`
                : (verdict.error ?? "") + " — ระบบจะไม่บันทึกรายการนี้"}
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <Field label="งานที่ทำ (working — เลือกได้หลายประเภท)">
              <div className="flex flex-wrap gap-x-4 gap-y-1" data-testid="job-working-group">
                {WORKING_OPTIONS.map((v) => (
                  <label key={v} className="flex items-center gap-1.5 text-sm font-thai text-aura-textMain">
                    <input
                      type="checkbox"
                      data-testid={`job-working-${v}`}
                      checked={form.working.includes(v)}
                      onChange={() => toggleWorking(v)}
                    />
                    {v}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          <Field label="ผู้ปฏิบัติงาน (practician)">
            <select
              data-testid="job-practitioner-select"
              className="w-full rounded-md border border-aura-borderSubtle bg-transparent px-2 py-1.5 text-sm"
              value={practitionerId}
              onChange={(e) => setPractitionerId(e.target.value)}
            >
              <option value="">— เลือกผู้ปฏิบัติงาน —</option>
              {(practitioners ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.position})
                </option>
              ))}
            </select>
          </Field>

          <Field label="ภาพ (image)">
            <input
              id="job-photo"
              data-testid="job-photo"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="หมายเหตุ (issue — ถ้ามี)">
              <Input
                id="job-issue"
                data-testid="job-issue"
                value={form.issue}
                onChange={(e) => set({ issue: e.target.value })}
                autoComplete="off"
              />
            </Field>
          </div>

          {formError ? (
            <p className="sm:col-span-2 text-sm font-thai text-alert-red" data-testid="job-form-error" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={saving} data-testid="job-submit">
              {saving ? "กำลังบันทึก…" : "บันทึกการทำงาน"}
            </Button>
          </div>
        </form>
      </AuraCard>
    </div>
  );
}
