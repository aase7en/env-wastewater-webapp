/**
 * ENV-PARITY-P2-002 — minimal admin master entry for the UNSEEDED
 * `safety.fire_extinguisher` master (WO §6).
 *
 * The P2.1 closeout carried a REQUIRED note: the master is UNSEEDED
 * (SOURCE_UNAVAILABLE — the master sheet was absent from the public Drive
 * folder) and this lane MUST ship an admin path to populate it. No bulk
 * import UI; no master DDL/policy changes — writes go through the
 * UNCHANGED P2.1 admin INSERT policy via the new public security_invoker
 * façade view.
 *
 * The row id is generated UI-side in the observed AppSheet PackedUUID
 * shape (22 alphanumerics, never numeric); `legacy_id` mirrors it (house
 * traceability convention); `source_provenance` pins the entry path. QR
 * derives from the id — the preview shows the payload STRING only;
 * nothing QR-related is stored.
 *
 * Auth: `RequireAuth requireAdmin` on the route (App.tsx) + RLS —
 * belt-and-suspenders, same as the other /admin/* pages. Pattern: copy
 * EquipmentSpecPage structure (hooks + toast + table). Track Z minimal
 * markup; Track F owns polish.
 */
import { useState, type ChangeEvent, type FormEvent } from "react";
import { AuraCard } from "../../components/ui/AuraCard";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/Input";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import { useCreateExtinguisher, useExtinguishers } from "../../lib/hooks";
import { MASTER_TYPE_OPTIONS, expiryStatusOf, generateLegacyRowId } from "../../lib/extinguisher-inspection";
import type { ExtinguisherRow } from "../../lib/supabase-queries";
import { thaiDate } from "../../lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const emptyForm = () => ({
  location: "",
  extinguisher_type: "" as string,
  photo_path: "",
  packed_date: "",
  expiry_date: "",
  size_label: "",
});

export function ExtinguisherMasterPage() {
  const { data: rows, loading, error, refresh } = useExtinguishers();
  const createMut = useCreateExtinguisher();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<ExtinguisherRow | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const today = new Date().toISOString().slice(0, 10);
  const formStatus = expiryStatusOf(form.expiry_date, today);

  const validate = (): string | null => {
    if (form.location.trim() === "") return "ระบุตำแหน่งติดตั้งก่อน";
    if (form.extinguisher_type === "") return "เลือกประเภทถังก่อน";
    if (form.expiry_date && form.packed_date && form.expiry_date < form.packed_date) {
      return "วันหมดอายุต้องไม่ก่อนวันที่บรรจุ";
    }
    return null;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const v = validate();
    if (v) {
      setFormError(v);
      return;
    }
    const rowId = generateLegacyRowId();
    const blankToNull = (s: string) => (s.trim() === "" ? null : s);
    const { data, error: saveError } = await createMut.mutate({
      legacy_row_id: rowId,
      location: blankToNull(form.location),
      extinguisher_type: form.extinguisher_type,
      photo_path: blankToNull(form.photo_path),
      packed_date: form.packed_date === "" ? null : form.packed_date,
      expiry_date: form.expiry_date === "" ? null : form.expiry_date,
      size_label: blankToNull(form.size_label),
      legacy_id: rowId, // house traceability convention — mirrors the id
      source_provenance: "manual admin entry (P2.2)",
    });
    if (saveError) {
      setFormError(saveError);
      return;
    }
    setLastCreated(data);
    toast("success", "เพิ่มถังดับเพลิงเรียบร้อย");
    setForm(emptyForm());
    refresh();
    void qc.invalidateQueries({ queryKey: ["extinguishers"] });
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-3 sm:p-4">
      <h1 className="text-lg font-semibold font-thai">ทะเบียนถังดับเพลิง (ผู้ดูแลระบบ)</h1>

      <AuraCard>
        <h2 className="font-bold font-thai text-aura-textMain mb-3">เพิ่มถังดับเพลิง</h2>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3" data-testid="ext-master-form">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="ตำแหน่งติดตั้ง" htmlFor="ext-master-location" required>
              <Input
                id="ext-master-location"
                data-testid="ext-master-location"
                value={form.location}
                onChange={(e: ChangeEvent<HTMLInputElement>) => set("location", e.target.value)}
              />
            </Field>
            <Field label="ประเภทถัง" htmlFor="ext-master-type" required>
              <Select
                id="ext-master-type"
                data-testid="ext-master-type"
                value={form.extinguisher_type}
                onChange={(e) => set("extinguisher_type", e.target.value)}
              >
                <option value="">— เลือกประเภท —</option>
                {MASTER_TYPE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="วันที่บรรจุ" htmlFor="ext-master-packed-date">
              <Input
                id="ext-master-packed-date"
                data-testid="ext-master-packed-date"
                type="date"
                value={form.packed_date}
                onChange={(e: ChangeEvent<HTMLInputElement>) => set("packed_date", e.target.value)}
              />
            </Field>
            <Field
              label="วันที่หมดอายุ"
              htmlFor="ext-master-expiry-date"
              hint={formStatus ? `สถานะวันนี้: ${formStatus}` : undefined}
            >
              <Input
                id="ext-master-expiry-date"
                data-testid="ext-master-expiry-date"
                type="date"
                value={form.expiry_date}
                onChange={(e: ChangeEvent<HTMLInputElement>) => set("expiry_date", e.target.value)}
              />
            </Field>
            <Field label="ขนาดบรรจุ" htmlFor="ext-master-size">
              <Input
                id="ext-master-size"
                data-testid="ext-master-size"
                value={form.size_label}
                onChange={(e: ChangeEvent<HTMLInputElement>) => set("size_label", e.target.value)}
                placeholder="เช่น 15 ปอนด์"
              />
            </Field>
            <Field label="รูปถ่าย (path — ไม่บังคับ)" htmlFor="ext-master-photo-path">
              <Input
                id="ext-master-photo-path"
                data-testid="ext-master-photo-path"
                value={form.photo_path}
                onChange={(e: ChangeEvent<HTMLInputElement>) => set("photo_path", e.target.value)}
              />
            </Field>
          </div>
          {formError ? (
            <p className="text-sm text-alert-red font-thai" role="alert" data-testid="ext-master-error">
              {formError}
            </p>
          ) : null}
          <Button type="submit" size="md" loading={createMut.loading} data-testid="ext-master-submit">
            เพิ่มถัง
          </Button>
          {lastCreated ? (
            <div className="rounded-xl border border-aura-cyan/30 p-3 text-sm" data-testid="ext-master-ok">
              <p className="font-thai">เพิ่มแล้ว: {lastCreated.location ?? "—"} · รหัส {lastCreated.legacy_row_id}</p>
              <p className="mt-1 font-thai text-xs text-aura-textMuted">
                QR payload (แสดงเพื่ออ้างอิงเท่านั้น — ระบบไม่เก็บรูป QR):
                <span className="ml-1 font-mono" data-testid="ext-master-qr-preview">{lastCreated.legacy_row_id}</span>
              </p>
            </div>
          ) : null}
        </form>
      </AuraCard>

      <AuraCard>
        <h2 className="font-bold font-thai text-aura-textMain mb-3">รายการถังทั้งหมด</h2>
        {loading ? (
          <TableSkeleton rows={3} />
        ) : error ? (
          <p className="text-sm text-alert-red font-thai" role="alert">{error}</p>
        ) : rows.length === 0 ? (
          <EmptyState
            title="ยังไม่มีทะเบียนถัง"
            description="แหล่งข้อมูลเดิม (ชีต ข้อมูลถังดับเพลิง) ยังไม่เปิดให้ดึงข้อมูล — เพิ่มรายการจากฟอร์มด้านบนได้ทันที"
          />
        ) : (
          <ul className="divide-y" data-testid="ext-master-list">
            {rows.map((x) => {
              const st = expiryStatusOf(x.expiry_date, today);
              return (
                <li key={x.legacy_row_id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2">
                  <span className="font-thai text-sm">
                    {x.location ?? "(ไม่ระบุตำแหน่ง)"}
                    <span className="ml-1 font-mono text-xs text-aura-textMuted">{x.legacy_row_id}</span>
                  </span>
                  <span className="text-xs text-aura-textMuted font-thai">
                    {x.extinguisher_type ?? "—"}
                    {x.expiry_date ? ` · หมดอายุ ${thaiDate(x.expiry_date)}${st ? ` (${st})` : ""}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </AuraCard>
    </div>
  );
}
