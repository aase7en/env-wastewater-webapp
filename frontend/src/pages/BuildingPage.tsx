/**
 * MOD-BL — Building inspection page.
 *
 * ENV-BUILDING-REPAIR-001 C1 (2026-10-08): a repair-needed round is
 * submitted through the ONE transactional RPC (create_building_repair)
 * with an explicit repair cause, the issues premise, and a durable
 * location; the client key is retained across ambiguous retries so the
 * same submission never duplicates. History truth: the 🔧 wrench and
 * its status render ONLY from the durable linked repair — never from
 * the flag alone (legacy flag-only rows show "ยังไม่มีใบแจ้งซ่อม").
 */
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toLocalISODate } from "../lib/utils";
import { useToast } from "../components/ui/Toast";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Input, Field, Textarea, Select } from "../components/ui/Input";
import { Toggle } from "../components/ui/Toggle";
import { fetchLocations } from "../lib/supabase-queries";
import {
  useBuildingRounds,
  createBuildingRound,
  createBuildingRoundWithRepair,
  deleteBuildingRound,
  type BuildingInput,
} from "../lib/building";

const REPAIR_STATUS_LABELS: Record<string, string> = {
  open: "รอดำเนินการ",
  in_progress: "กำลังซ่อม",
  resolved: "ซ่อมเสร็จ",
  cancelled: "ยกเลิก",
};

export function BuildingPage() {
  const { data, loading, error, refresh } = useBuildingRounds(30);
  const { toast } = useToast();
  const today = toLocalISODate();
  const [form, setForm] = useState<BuildingInput>({
    round_date: today, location_id: null, inspector: null, findings: null,
    issues_found: false, repair_needed: false, round_type: "monthly",
    checklist: null, photos: null, severity: null, assigned_to: null, note: null,
  });
  const [cause, setCause] = useState("");
  const [saving, setSaving] = useState(false);
  const [causeError, setCauseError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  // C1: stable client key — one per submission chain; kept across
  // retries of the SAME submission (ambiguous failures), regenerated
  // only after success/reset so the server can dedupe.
  const clientKeyRef = useRef(crypto.randomUUID());

  const locations = useQuery({
    queryKey: ["c1-locations"] as const,
    queryFn: fetchLocations,
  });

  const set = (patch: Partial<BuildingInput>) => setForm({ ...form, ...patch });

  async function submit() {
    if (saving) return; // double-submit lock (clause 5)
    if (form.repair_needed) {
      const trimmed = cause.trim();
      setCauseError(trimmed ? null : "กรุณาระบุสาเหตุที่ต้องซ่อม");
      setLocationError(form.location_id ? null : "การแจ้งซ่อมต้องระบุสถานที่");
      if (!trimmed || !form.location_id) return;
    }
    setSaving(true);
    try {
      if (form.repair_needed) {
        await createBuildingRoundWithRepair(
          form, cause.trim(), clientKeyRef.current,
        );
        clientKeyRef.current = crypto.randomUUID(); // fresh key for the next submission
      } else {
        await createBuildingRound({ ...form, issues_found: form.issues_found });
      }
      toast("success", "บันทึกสำเร็จ");
      setForm({ ...form, findings: null, issues_found: false, repair_needed: false, note: null });
      setCause("");
      refresh();
    } catch (e) {
      // key retained: retrying the same submission is idempotent server-side
      toast("error", `ผิดพลาด: ${(e as Error).message} — กดบันทึกอีกครั้งได้ จะไม่ซ้ำ`);
    } finally {
      setSaving(false);
    }
  }
  async function remove(id: string) {
    if (!confirm("ลบ?")) return;
    try { await deleteBuildingRound(id); toast("success", "ลบแล้ว"); refresh(); } catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            <span className="text-aura-textMain">ตรวจ</span>
            <span className="aura-text-gradient">อาคารสถานที่</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            รอบตรวจอาคาร — พื้น / ฝาผนัง / ไฟ / น้ำ / สุขภัณฑ์ (แจ้งซ่อมผ่านระบบอัตโนมัติหนึ่งใบต่อรอบตรวจ)
          </p>
        </div>
      </header>
      <AuraCard className="p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="วันที่ตรวจ"><Input type="date" value={form.round_date} onChange={(e) => set({ round_date: e.target.value })} /></Field>
          <Field label="ประเภทรอบตรวจ">
            <Select value={form.round_type ?? "monthly"} onChange={(e) => set({ round_type: e.target.value })}>
              <option value="monthly">ประจำเดือน</option>
              <option value="quarterly">ไตรมาส</option>
              <option value="annual">ประจำปี</option>
            </Select>
          </Field>
          <Field label="ผู้ตรวจ"><Input value={form.inspector ?? ""} onChange={(e) => set({ inspector: e.target.value || null })} /></Field>
          <Field label="สถานที่" error={locationError ?? undefined}>
            <Select
              value={form.location_id ?? ""}
              onChange={(e) => { set({ location_id: e.target.value || null }); setLocationError(null); }}
              aria-label="สถานที่ตรวจ"
            >
              <option value="">— เลือกสถานที่ —</option>
              {(locations.data ?? []).map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.code}{loc.area_name ? ` · ${loc.area_name}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="ระดับความรุนแรง">
            <Select value={form.severity ?? ""} onChange={(e) => set({ severity: e.target.value || null })}>
              <option value="">—</option><option value="low">ต่ำ</option><option value="medium">กลาง</option><option value="high">สูง</option>
            </Select>
          </Field>
          <Field label="มอบหมายให้"><Input value={form.assigned_to ?? ""} onChange={(e) => set({ assigned_to: e.target.value || null })} /></Field>
          <div className="flex items-center gap-4 pt-6 col-span-2">
            <Toggle checked={form.issues_found} onChange={(v) => set({ issues_found: v, ...(v ? {} : { repair_needed: false }) })} label="พบปัญหา" />
            <Toggle
              checked={form.repair_needed}
              onChange={(v) => set({ repair_needed: v, ...(v ? { issues_found: true } : {}) })}
              label="ต้องแจ้งซ่อม"
            />
          </div>
        </div>
        <Field label="สิ่งที่พบ"><Textarea value={form.findings ?? ""} onChange={(e) => set({ findings: e.target.value || null })} rows={3} /></Field>
        {form.repair_needed && (
          <Field
            label="สาเหตุที่ต้องซ่อม (แยกจากสิ่งที่พบ)"
            required
            error={causeError ?? undefined}
            htmlFor="bl-cause"
          >
            <Textarea
              id="bl-cause"
              value={cause}
              onChange={(e) => { setCause(e.target.value); setCauseError(null); }}
              rows={2}
              aria-required="true"
              placeholder="เช่น ก๊อกน้ำชั้น 2 ห้องตรวจน้ำเสียชำรุด น้ำไหลไม่หยุด"
            />
          </Field>
        )}
        <Button onClick={submit} loading={saving}>บันทึก</Button>
      </AuraCard>

      <AuraCard className="p-4">
        {loading ? <TableSkeleton rows={5} cols={5} /> : error ? <p role="alert" className="text-red-400">{error}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="text-left p-2">วันที่</th><th className="text-left p-2">ผู้ตรวจ</th><th className="text-left p-2">ปัญหา</th><th className="text-left p-2">ซ่อม</th><th></th></tr></thead>
              <tbody>
                {data.map((r) => {
                  const linked = r.repair_request?.[0] ?? null;
                  return (
                    <tr key={r.id} className="border-t">
                      <td className="p-2 whitespace-nowrap">{r.round_date}</td>
                      <td className="p-2">{r.inspector ?? "-"}</td>
                      <td className="p-2" aria-label={r.issues_found ? "พบปัญหา" : "ไม่พบปัญหา"}>
                        {r.issues_found ? "⚠️ พบปัญหา" : "—"}
                      </td>
                      <td className="p-2">
                        {linked ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-xs font-thai text-amber-300"
                            aria-label={`แจ้งซ่อมแล้ว สถานะ ${REPAIR_STATUS_LABELS[linked.status] ?? linked.status}`}
                          >
                            🔧 แจ้งซ่อมแล้ว · {REPAIR_STATUS_LABELS[linked.status] ?? linked.status}
                          </span>
                        ) : r.repair_needed ? (
                          <span className="text-xs font-thai text-aura-textMuted" aria-label="ยังไม่มีใบแจ้งซ่อม (รายการเก่าก่อนระบบเชื่อมโยง)">
                            ยังไม่มีใบแจ้งซ่อม (รายการเดิม)
                          </span>
                        ) : (
                          <span aria-label="ไม่ต้องซ่อม">—</span>
                        )}
                      </td>
                      <td className="p-2">
                        {linked ? (
                          <span className="text-xs text-aura-textMuted font-thai" title="รายการที่เชื่อมโยงใบแจ้งซ่อมแล้วลบไม่ได้ (คงประวัติการซ่อม)">
                            คงประวัติ
                          </span>
                        ) : (
                          <button onClick={() => remove(r.id)} className="text-red-400 hover:underline font-thai min-h-[44px] px-2">ลบ</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AuraCard>
    </div>
  );
}
