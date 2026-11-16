/**
 * MOD-WS — Water Supply (groundwater) page.
 * Track Z scope: logic + minimal markup. Track F owns polish (WO MOD-WS-b).
 *
 * ENV-PARITY-P1-005 (AppSheet parity P1.5): adds the daily usage surface —
 * activity enum (verbatim ลงข้อมูลการใช้น้ำประจำวัน / ฟรีคลอรีน / TDS),
 * Hour_meter + Chlorine usage (usage group, Show If §2.3-1), Water_In
 * (Valid If >0 + verbatim error, Show If §2.3-3) — plus READ-ONLY derived
 * displays from water_supply.v_daily_check_chain (energy / water-in /
 * chlorine-real), each flagged as an estimate with its spec source. The
 * view owns the math — nothing is re-derived client-side; NO fallback
 * values ever (unknown stays empty + flagged). The 9 quality fields keep
 * their pre-P1.5 behavior untouched.
 */
import { useState } from "react";
import { toLocalISODate } from "../lib/utils";
import { useToast } from "../components/ui/Toast";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Input, NumberInput, Field, Select } from "../components/ui/Input";
import {
  useWaterSupplyDaily,
  useWaterSupplyChain,
  createWaterSupplyDaily,
  deleteWaterSupplyDaily,
  type WaterSupplyInput,
} from "../lib/water-supply";
import {
  ACTIVITY_OPTIONS,
  ACTIVITY_DEFAULT,
  ACTIVITY_USAGE_MODE,
  LABEL_ACTIVITY,
  LABEL_HOUR_METER,
  LABEL_CHLORINE_USAGE,
  LABEL_WATER_IN,
  PROMPT_ENERGY,
  PROMPT_WATER_IN,
  ERR_WATER_IN,
  FLAG_ENERGY_ESTIMATE,
  FLAG_WATER_IN_ESTIMATE,
  CHIP_NO_FLOW_SPEC,
  showUsageFields,
  showWaterIn,
  validateWaterIn,
} from "../lib/water-supply-parity";

const NUM = (v: string) => (v === "" ? null : Number(v));

export function WaterSupplyPage() {
  const { data, loading, error, refresh } = useWaterSupplyDaily(30);
  const chain = useWaterSupplyChain(30);
  const { toast } = useToast();
  const today = toLocalISODate();
  const [form, setForm] = useState<WaterSupplyInput>({
    check_date: today, location_id: null, activity: ACTIVITY_DEFAULT,
    hour_meter: null, water_in: null, chlorine_usage: null,
    ph: null, free_chlorine_residual: null, turbidity: null, total_coliform: null,
    fecal_coliform: null, iron: null, manganese: null, hardness: null,
    tds: null, note: null,
  });
  const set = (patch: Partial<WaterSupplyInput>) => setForm({ ...form, ...patch });

  // §2.3 Show-If groups — this page has no location picker yet, so
  // สถานที่ resolves to the AppSheet init default (โรงจ่ายคลอรีน) at the UI
  // layer (display only — location_id stays NULL in storage).
  const usageVisible = showUsageFields(form.activity, null);
  const waterInVisible = showWaterIn(form.activity);
  const waterInError = validateWaterIn(form.water_in);

  async function submit() {
    // Water_In Valid If >0 (ref 2561–2565) with the VERBATIM error — empty
    // passes (NULL ≠ violation); invalid input blocks the write.
    if (validateWaterIn(form.water_in)) {
      toast("error", ERR_WATER_IN);
      return;
    }
    try {
      await createWaterSupplyDaily(form);
      toast("success", "บันทึกสำเร็จ");
      refresh();
      chain.refresh();
    } catch (e) {
      toast("error", `ผิดพลาด: ${(e as Error).message}`);
    }
  }
  async function remove(id: string) {
    if (!confirm("ลบแถวนี้?")) return;
    try { await deleteWaterSupplyDaily(id); toast("success", "ลบแล้ว"); refresh(); chain.refresh(); }
    catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }

  // The latest chain row (view-ordered by check_date desc) drives the
  // derived displays — READ-ONLY, view-owned math, estimate-flagged.
  const latestChain = chain.data[0] ?? null;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            <span className="text-aura-textMain">น้ำประปา</span>
            <span className="aura-text-gradient">บาดาล</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            บันทึกคุณภาพน้ำบาดาล + การใช้น้ำรายวัน — pH / คลอรีน / ความขุ่น / coliform / ชั่วโมงปั๊ม
          </p>
        </div>
      </header>

      <AuraCard className="p-4 space-y-3">
        <h2 className="text-lg font-semibold font-thai">กรอกข้อมูล</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* §2.1 activity enum (ref 2519 verbatim) — init ลงข้อมูลการใช้น้ำประจำวัน
              is a UI default on create only; the DB column has NO default. */}
          <Field label={LABEL_ACTIVITY}>
            <Select
              data-testid="activity-select"
              value={form.activity ?? ""}
              onChange={(e) => set({ activity: (e.target.value || null) as WaterSupplyInput["activity"] })}
            >
              {ACTIVITY_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          </Field>
          <Field label="วันที่ตรวจ">
            <Input type="date" value={form.check_date} onChange={(e) => set({ check_date: e.target.value })} />
          </Field>
          {/* §2.3-1 usage group — Hour_meter = the hours the pump ran (owner A2). */}
          {usageVisible && (
            <Field label={LABEL_HOUR_METER}>
              <NumberInput
                data-testid="hour-meter-input"
                value={form.hour_meter ?? ""}
                onChange={(e) => set({ hour_meter: NUM(e.target.value) })}
              />
            </Field>
          )}
          {usageVisible && (
            <Field label={LABEL_CHLORINE_USAGE}>
              <NumberInput
                data-testid="chlorine-usage-input"
                value={form.chlorine_usage ?? ""}
                onChange={(e) => set({ chlorine_usage: NUM(e.target.value) })}
              />
            </Field>
          )}
          {/* §2.3-3 Water_In — Valid If >0 + the verbatim error; empty stays
              empty (NULL ≠ 0); the ×8 estimate is NEVER written here. */}
          {waterInVisible && (
            <Field label={LABEL_WATER_IN}>
              <NumberInput
                data-testid="water-in-input"
                value={form.water_in ?? ""}
                onChange={(e) => set({ water_in: NUM(e.target.value) })}
              />
              <p className="text-xs text-aura-textMuted font-thai">{PROMPT_WATER_IN}</p>
              {waterInError && (
                <p data-testid="water-in-error" className="text-xs text-red-400 font-thai mt-1">{waterInError}</p>
              )}
            </Field>
          )}
          <Field label="pH">
            <NumberInput value={form.ph ?? ""} onChange={(e) => set({ ph: NUM(e.target.value) })} />
          </Field>
          <Field label="คลอรีนอิสระ (mg/L)">
            <NumberInput value={form.free_chlorine_residual ?? ""} onChange={(e) => set({ free_chlorine_residual: NUM(e.target.value) })} />
          </Field>
          <Field label="ความขุ่น (NTU)">
            <NumberInput value={form.turbidity ?? ""} onChange={(e) => set({ turbidity: NUM(e.target.value) })} />
          </Field>
          <Field label="Total coliform">
            <Input value={form.total_coliform ?? ""} onChange={(e) => set({ total_coliform: e.target.value || null })} placeholder="ไม่พบ / พบ" />
          </Field>
          <Field label="Fecal coliform">
            <Input value={form.fecal_coliform ?? ""} onChange={(e) => set({ fecal_coliform: e.target.value || null })} />
          </Field>
          <Field label="เหล็ก Fe (mg/L)">
            <NumberInput value={form.iron ?? ""} onChange={(e) => set({ iron: NUM(e.target.value) })} />
          </Field>
          <Field label="แมงกานีส Mn (mg/L)">
            <NumberInput value={form.manganese ?? ""} onChange={(e) => set({ manganese: NUM(e.target.value) })} />
          </Field>
          <Field label="ความกระด้าง (mg/L)">
            <NumberInput value={form.hardness ?? ""} onChange={(e) => set({ hardness: NUM(e.target.value) })} />
          </Field>
          <Field label="TDS (mg/L)">
            <NumberInput value={form.tds ?? ""} onChange={(e) => set({ tds: NUM(e.target.value) })} />
          </Field>
        </div>
        <Button onClick={submit}>บันทึก</Button>
        <p className="text-xs text-aura-textMuted font-thai">
          โหมด {ACTIVITY_USAGE_MODE}: กรอกชั่วโมงปั๊ม/คลอรีน/น้ำเข้า · โหมด ฟรีคลอรีน / TDS: กรอกคุณภาพน้ำ
        </p>
      </AuraCard>

      {latestChain && (
        <AuraCard className="p-4" >
          <div data-testid="derived-chain-card" className="space-y-2">
            <h2 className="text-lg font-semibold font-thai">ค่าที่คำนวณจากสายมิเตอร์ (ล่าสุด {latestChain.check_date})</h2>
            <p className="text-xs text-aura-textMuted font-thai">
              แสดงจาก view — ค่าประมาณจากสเปกอุปกรณ์ ไม่ใช่ข้อมูล live จากเซนเซอร์
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-aura-textMuted font-thai">{LABEL_HOUR_METER}: </span>
                {latestChain.hour_meter ?? "—"}
                <span className="text-aura-textMuted font-thai"> · ก่อนหน้า: </span>
                {latestChain.prev_hour_meter ?? "—"}
              </div>
              <div>
                <span className="text-aura-textMuted font-thai">ชั่วโมงปั๊มทำงาน (Hour_Work): </span>
                {latestChain.hour_work ?? "—"}
                {latestChain.hour_boundary_flag && (
                  <span className="text-amber-400 font-thai"> ⚠ {latestChain.hour_boundary_reason}</span>
                )}
              </div>
              <div>
                <span className="text-aura-textMuted font-thai">{PROMPT_ENERGY} (Energy_use): </span>
                {latestChain.energy_use_estimate ?? "—"}
                {latestChain.energy_use_estimate != null && (
                  <span className="ml-1 text-xs rounded px-1 bg-aura-surfaceHigh font-thai">
                    {FLAG_ENERGY_ESTIMATE} ({latestChain.spec_energy_kwh_per_h} kWh/h · สเปก pump_groundwater)
                  </span>
                )}
              </div>
              <div>
                <span className="text-aura-textMuted font-thai">{PROMPT_WATER_IN} (ประมาณ): </span>
                {latestChain.water_in_estimate ?? "—"}
                {latestChain.water_in_estimate != null && (
                  <span className="ml-1 text-xs rounded px-1 bg-aura-surfaceHigh font-thai">
                    {FLAG_WATER_IN_ESTIMATE} ({latestChain.spec_flow_m3_per_h} m³/h · สเปก)
                  </span>
                )}
                {latestChain.water_in_estimate == null && latestChain.hour_work != null && (
                  <span className="ml-1 text-xs text-amber-400 font-thai">{CHIP_NO_FLOW_SPEC}</span>
                )}
              </div>
              <div>
                <span className="text-aura-textMuted font-thai">Chlorine_usage_realy (คำนวณ ÷ อัตราผสมจากสเปก): </span>
                {latestChain.chlorine_usage_realy ?? "—"}
                <span className="text-aura-textMuted font-thai">
                  {" "}(คลอรีน {latestChain.mix_part_chlorine ?? "—"} : น้ำ {latestChain.mix_part_water ?? "—"})
                </span>
              </div>
              {latestChain.spec_missing && (
                <div className="text-amber-400 font-thai text-xs">
                  ⚠ ยังไม่มีค่าในสเปก: {latestChain.spec_missing_kinds}
                </div>
              )}
            </div>
          </div>
        </AuraCard>
      )}

      <AuraCard className="p-4">
        <h2 className="text-lg font-semibold mb-3 font-thai">บันทึกล่าสุด 30 วัน</h2>
        {loading ? <TableSkeleton rows={5} cols={6} /> : error ? <p className="text-red-400 font-thai">{error}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="text-left p-2">วันที่</th><th className="text-right p-2">pH</th><th className="text-right p-2">Cl</th><th className="text-right p-2">NTU</th><th className="text-left p-2">Coliform</th><th></th></tr></thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.check_date}</td>
                    <td className="text-right p-2">{r.ph ?? "-"}</td>
                    <td className="text-right p-2">{r.free_chlorine_residual ?? "-"}</td>
                    <td className="text-right p-2">{r.turbidity ?? "-"}</td>
                    <td className="p-2">{r.total_coliform ?? "-"}</td>
                    <td className="p-2"><button onClick={() => remove(r.id)} className="min-h-[var(--touch-min)] min-w-[var(--touch-min)] px-2 rounded-lg text-red-400 hover:bg-alert-red/10 hover:underline font-thai">ลบ</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AuraCard>
    </div>
  );
}
