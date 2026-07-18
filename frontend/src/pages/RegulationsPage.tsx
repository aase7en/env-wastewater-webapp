/**
 * DOC-2 — Regulations page. Lists all laws/standards applicable to ENV_DB.
 * Filterable by module via dropdown.
 */
import { useState } from "react";
import { AuraCard } from "../components/ui/AuraCard";
import { Field, Select } from "../components/ui/Input";
import { useRegulations } from "../lib/regulations";

const MODULE_OPTIONS = [
  { value: "", label: "ทุกโมดูล" },
  { value: "wastewater", label: "น้ำเสีย" },
  { value: "water_supply", label: "น้ำประปาบาดาล" },
  { value: "carbon", label: "Carbon footprint" },
  { value: "garbage", label: "ขยะ" },
  { value: "fuel", label: "น้ำมันเชื้อเพลิง" },
  { value: "safety", label: "ความปลอดภัย" },
  { value: "building", label: "อาคาร" },
  { value: "chemical", label: "เคมี" },
  { value: "food", label: "สุขาภิบาลอาหาร" },
];

export function RegulationsPage() {
  const [filter, setFilter] = useState("");
  const { data, loading, error } = useRegulations(filter || undefined);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold font-thai">กฎหมาย / มาตรฐานที่เกี่ยวข้อง</h1>

      <Field label="กรองตามโมดูล">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {MODULE_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>
      </Field>

      <div className="space-y-3">
        {loading ? <p className="font-thai">กำลังโหลด…</p>
         : error ? <p className="text-red-400 font-thai">{error}</p>
         : data.length === 0 ? <p className="text-aura-textMuted font-thai">ไม่มีกฎหมายสำหรับโมดูลนี้</p>
         : data.map((r) => (
          <AuraCard key={r.id} className="p-4 space-y-1">
            <h2 className="font-semibold font-thai">{r.name}</h2>
            <p className="text-xs font-mono text-aura-textMuted">{r.citation}</p>
            {r.summary_th && <p className="font-thai text-sm">{r.summary_th}</p>}
            <div className="flex gap-1 flex-wrap pt-1">
              {r.applies_to.map((m) => (
                <span key={m} className="text-xs px-2 py-0.5 bg-aura-cyan/20 rounded font-mono">{m}</span>
              ))}
            </div>
            {r.official_url && (
              <a href={r.official_url} target="_blank" rel="noreferrer" className="text-aura-cyan text-sm hover:underline font-thai">
                ดูเอกสารทางการ →
              </a>
            )}
          </AuraCard>
        ))}
      </div>
    </div>
  );
}
