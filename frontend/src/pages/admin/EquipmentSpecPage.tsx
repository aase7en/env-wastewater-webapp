/**
 * ENV-PARITY-P1-004 — equipment-spec admin page (owner ask A1: "ต้องมีระบบตั้งค่าสเปกปั้ม
 * เพราะเมื่อซ่อม/เปลี่ยนปั๊มในอนาคต ตัวเลขการสูบต่อ 1 ชม. อาจไม่เท่าเดิม").
 *
 * MINIMAL scope per WO §2.4-1: list the effective-dated spec history
 * (grouped by kind, Thai labels) + append a NEW effective-dated row.
 * History is APPEND-ONLY: there is no edit/delete UI and the RLS layer
 * grants no UPDATE/DELETE (migration 20261116000001) — the two layers
 * enforce the same discipline.
 *
 * Data: core.equipment_spec via the public security_invoker façade view
 * (the live PostgREST exposes only `public` — verified; RLS still gates
 * every row: SELECT staff-or-admin, INSERT admin-only).
 *
 * Auth: `RequireAuth requireAdmin` on the route (App.tsx) + RLS —
 * belt-and-suspenders, same as the other /admin/* pages.
 *
 * Pattern: copy AuditLogPage/AIAdminPage structure (hooks + toast +
 * TableSkeleton). Track Z: minimal markup; Track F owns polish.
 */
import { useMemo, useState, type FormEvent } from "react";
import { AuraCard } from "../../components/ui/AuraCard";
import { MSymbol } from "../../components/ui/MSymbol";
import { Button } from "../../components/ui/Button";
import { Field, Input, NumberInput, Select } from "../../components/ui/Input";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import { useCreateEquipmentSpec, useEquipmentSpecs } from "../../lib/hooks";
import { EQUIPMENT_SPEC_KINDS, type EquipmentSpec, type EquipmentSpecKind } from "../../lib/supabase-queries";
import { thaiDate } from "../../lib/utils";

/** Thai kind labels (WO §3.3). */
const KIND_LABELS: Record<EquipmentSpecKind, string> = {
  pump_wastewater_1: "ปั๊มน้ำเสีย 1",
  pump_wastewater_2: "ปั๊มน้ำเสีย 2",
  pump_groundwater: "ปั๊มน้ำบาดาล",
  chlorine_mix_groundwater: "สเปกผสมคลอรีนน้ำบาดาล",
};

/** The single spec value each pump kind requires (per the P1.2 CHECKs). */
const KIND_VALUE_FIELD: Record<EquipmentSpecKind, { column: "flow_m3_per_h" | "energy_kwh_per_h"; label: string; unit: string } | null> = {
  pump_wastewater_1: { column: "flow_m3_per_h", label: "อัตราการสูบ (flow)", unit: "m³/ชม." },
  pump_wastewater_2: { column: "flow_m3_per_h", label: "อัตราการสูบ (flow)", unit: "m³/ชม." },
  pump_groundwater: { column: "energy_kwh_per_h", label: "การกินไฟฟ้า", unit: "kWh/ชม." },
  chlorine_mix_groundwater: null, // two-part mix instead
};

function specValueDisplay(spec: EquipmentSpec): string {
  if (spec.flow_m3_per_h !== null && spec.flow_m3_per_h !== undefined) {
    return `${spec.flow_m3_per_h} m³/ชม.`;
  }
  if (spec.energy_kwh_per_h !== null && spec.energy_kwh_per_h !== undefined) return `${spec.energy_kwh_per_h} kWh/ชม.`;
  if (spec.mix_part_chlorine !== null && spec.mix_part_chlorine !== undefined) {
    return `ผสม ${spec.mix_part_chlorine} : ${spec.mix_part_water ?? "?"}`;
  }
  return "—";
}

const emptyAppend = () => ({
  kind: "" as EquipmentSpecKind | "",
  value: "",
  mix_chlorine: "",
  mix_water: "",
  valid_from: "",
  valid_to: "",
  note: "",
  source: "",
});

export function EquipmentSpecPage() {
  const { data: specs, loading, error, refresh } = useEquipmentSpecs();
  const createMut = useCreateEquipmentSpec();
  const toastCtx = useToast();
  const [form, setForm] = useState(emptyAppend);
  const [formError, setFormError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<EquipmentSpecKind, EquipmentSpec[]>();
    for (const s of specs) {
      const list = map.get(s.kind) ?? [];
      list.push(s);
      map.set(s.kind, list);
    }
    return map;
  }, [specs]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const valueField = form.kind ? KIND_VALUE_FIELD[form.kind] : null;

  const validateAppend = (): string | null => {
    if (!form.kind) return "เลือกชนิดสเปกก่อน";
    if (!form.valid_from) return "ระบุวันที่เริ่มมีผล (valid_from) — บังคับ";
    if (form.valid_to && form.valid_to < form.valid_from) return "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มมีผล";
    const positive = (v: string) => v !== "" && Number(v) > 0 && Number.isFinite(Number(v));
    if (form.kind === "chlorine_mix_groundwater") {
      if (!positive(form.mix_chlorine) || !positive(form.mix_water)) return "สัดส่วนผสมต้องเป็นจำนวนมากกว่า 0 ทั้งสองค่า (ตามเงื่อนไขฐานข้อมูล)";
    } else if (valueField) {
      if (!positive(form.value)) return "ค่าสเปกต้องเป็นจำนวนมากกว่า 0 (ตามเงื่อนไขฐานข้อมูล)";
    }
    return null;
  };

  const onAppend = async (e: FormEvent) => {
    e.preventDefault();
    const err = validateAppend();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    // APPEND-ONLY: a brand-new effective-dated row; history is never
    // rewritten (no update/delete exists on this page or in the RLS).
    const payload = {
      kind: form.kind as EquipmentSpecKind,
      valid_from: form.valid_from,
      valid_to: form.valid_to || null,
      note: form.note.trim() || null,
      source: form.source.trim() || null,
      ...(form.kind === "chlorine_mix_groundwater"
        ? { mix_part_chlorine: Number(form.mix_chlorine), mix_part_water: Number(form.mix_water) }
        : valueField
          ? { [valueField.column]: Number(form.value) }
          : {}),
    } as Parameters<typeof createMut.mutate>[0];
    const { error: mutError } = await createMut.mutate(payload);
    if (mutError) {
      // Honest failure — RLS denials surface with the server's message.
      setFormError(mutError);
      toastCtx.error("เพิ่มสเปกไม่สำเร็จ");
      return;
    }
    toastCtx.success("เพิ่มสเปกใหม่แล้ว (ประวัติเดิมไม่ถูกแก้ไข)");
    setForm(emptyAppend());
  };

  const valueInput = (() => {
    if (form.kind === "chlorine_mix_groundwater") {
      return (
        <div className="grid grid-cols-2 gap-2">
          <Field label="ส่วนคลอรีน" unit="ส่วน">
            <NumberInput data-testid="spec-value-chlorine" value={form.mix_chlorine} onChange={(e) => set("mix_chlorine", e.target.value)} />
          </Field>
          <Field label="ส่วนน้ำ" unit="ส่วน">
            <NumberInput data-testid="spec-value-water" value={form.mix_water} onChange={(e) => set("mix_water", e.target.value)} />
          </Field>
        </div>
      );
    }
    if (valueField) {
      return (
        <Field label={valueField.label} unit={valueField.unit}>
          <NumberInput data-testid="spec-value-input" value={form.value} onChange={(e) => set("value", e.target.value)} />
        </Field>
      );
    }
    return null;
  })();

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-24">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
          <span className="aura-text-gradient">ตั้งค่าสเปกอุปกรณ์</span>
          <span className="text-aura-textMain"> (แอดมิน)</span>
        </h1>
        <p className="text-sm text-aura-textMuted font-thai mt-1">
          ประวัติสเปกแบบมีผลตามวันที่ — เพิ่มแถวใหม่ได้เท่านั้น ประวัติเดิมแก้ไข/ลบไม่ได้
        </p>
      </header>

      {error && (
        <AuraCard>
          <p className="text-sm text-alert-red font-thai">โหลดข้อมูลไม่สำเร็จ: {error}</p>
        </AuraCard>
      )}

      {loading ? (
        <AuraCard className="p-0">
          <TableSkeleton rows={4} cols={4} />
        </AuraCard>
      ) : specs.length === 0 ? (
        <AuraCard>
          <EmptyState
            icon={<MSymbol name="precision_manufacturing" className="text-[32px]" />}
            title="ยังไม่มีสเปกอุปกรณ์"
            description="เพิ่มสเปกแรกด้วยแบบฟอร์มด้านล่าง"
          />
        </AuraCard>
      ) : (
        EQUIPMENT_SPEC_KINDS.filter((k) => grouped.has(k)).map((kind) => (
          <AuraCard key={kind} className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-aura-borderSubtle/60 flex items-center gap-2">
              <MSymbol name="precision_manufacturing" className="text-[20px] text-aura-cyan" />
              <h2 className="font-bold font-thai text-aura-textMain">{KIND_LABELS[kind]}</h2>
              <span className="text-xs text-aura-textMuted font-mono ml-auto">{kind}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-aura-textMuted border-b border-aura-borderSubtle text-[11px] uppercase tracking-wider">
                    <th className="px-4 py-2.5 font-bold font-thai">ค่าสเปก</th>
                    <th className="px-4 py-2.5 font-bold font-thai">มีผลตั้งแต่</th>
                    <th className="px-4 py-2.5 font-bold font-thai">ถึงวันที่</th>
                    <th className="px-4 py-2.5 font-bold font-thai">หมายเหตุ/แหล่งที่มา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-aura-borderSubtle/50">
                  {(grouped.get(kind) ?? []).map((s) => (
                    <tr key={s.id} data-testid={`spec-row-${s.id}`} className="hover:bg-aura-cyan/5">
                      <td className="px-4 py-2.5 font-mono text-aura-textMain">{specValueDisplay(s)}</td>
                      <td className="px-4 py-2.5 font-thai text-aura-textMain">{thaiDate(s.valid_from)}</td>
                      <td className="px-4 py-2.5 font-thai text-aura-textMuted">{s.valid_to ? thaiDate(s.valid_to) : "— (ใช้งานอยู่)"}</td>
                      <td className="px-4 py-2.5 text-xs text-aura-textMuted font-thai">
                        {s.note ?? "—"}
                        {s.source ? <span className="block font-mono">{s.source}</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AuraCard>
        ))
      )}

      {/* Append form — the ONLY write path; creates a NEW effective-dated
          row. No edit/delete affordances exist anywhere on this page. */}
      <AuraCard>
        <form onSubmit={onAppend} className="space-y-3" data-testid="spec-append-form">
          <h2 className="font-bold font-thai text-aura-textMain flex items-center gap-2">
            <MSymbol name="add_circle" className="text-[20px] text-aura-cyan" /> เพิ่มสเปกใหม่ (แถวใหม่ตามวันที่)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="ชนิดสเปก" required htmlFor="spec-kind-select">
              <Select
                id="spec-kind-select"
                data-testid="spec-kind-select"
                value={form.kind}
                onChange={(e) => set("kind", e.target.value as EquipmentSpecKind | "")}
              >
                <option value="">— เลือกชนิด —</option>
                {EQUIPMENT_SPEC_KINDS.map((k) => (
                  <option key={k} value={k}>{KIND_LABELS[k]}</option>
                ))}
              </Select>
            </Field>
            {valueInput}
            <Field label="มีผลตั้งแต่ (valid_from)" required htmlFor="spec-valid-from">
              <Input
                id="spec-valid-from"
                data-testid="spec-valid-from-input"
                type="date"
                value={form.valid_from}
                onChange={(e) => set("valid_from", e.target.value)}
                required
              />
            </Field>
            <Field label="ถึงวันที่ (valid_to) — ว่าง = ใช้งานอยู่" htmlFor="spec-valid-to">
              <Input
                id="spec-valid-to"
                data-testid="spec-valid-to-input"
                type="date"
                value={form.valid_to}
                onChange={(e) => set("valid_to", e.target.value)}
              />
            </Field>
            <Field label="หมายเหตุ">
              <Input value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="เช่น เปลี่ยนปั๊มใหม่ ม.ค. 2570" />
            </Field>
            <Field label="แหล่งที่มา">
              <Input value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="เช่น ทะเบียนการซ่อมบำรุง" />
            </Field>
          </div>
          {formError && (
            <p role="alert" className="text-sm text-alert-red font-thai">{formError}</p>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" loading={createMut.loading}>
              <MSymbol name="add" className="text-[18px]" /> เพิ่มสเปกใหม่
            </Button>
            <Button type="button" variant="ghost" onClick={refresh} loading={loading}>
              <MSymbol name="refresh" className="text-[18px]" /> รีเฟรช
            </Button>
            <span className="text-xs text-aura-textMuted font-thai ml-auto">
              เข้าถึงได้เฉพาะแอดมิน · บันทึกผ่าน RLS (INSERT เท่านั้น)
            </span>
          </div>
        </form>
      </AuraCard>
    </div>
  );
}
