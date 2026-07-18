/**
 * CRB-3 — Unified Carbon dashboard (Scope 1+2+3).
 * Replaces CarbonPage V2b eventually — shows per-scope breakdown + grand
 * total + "ข้อมูล incomplete" flag for sources without data yet.
 */
import { AuraCard } from "../components/ui/AuraCard";
import { useCarbonRollup } from "../lib/carbon-rollup";

const SCOPE_NAMES: Record<number, string> = {
  1: "Scope 1 — การเผาไห้โดยตรง",
  2: "Scope 2 — ไฟฟ้าที่ซื้อ",
  3: "Scope 3 — อ้อม",
};

export function CarbonRollupPage() {
  const { data, loading, error } = useCarbonRollup(12);

  if (loading) return <div className="p-8 text-center font-thai text-aura-textMuted">กำลังโหลด…</div>;
  if (error) return <div className="p-8 text-center text-red-400 font-thai">{error}</div>;
  if (!data) return null;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold font-thai">Carbon Footprint — Scope 1+2+3</h1>

      <AuraCard className="p-6 text-center">
        <p className="text-sm text-aura-textMuted font-thai">รวม 12 เดือนล่าสุด</p>
        <p className="text-4xl font-bold text-aura-cyan font-mono">
          {(data.grandTotalKg / 1000).toFixed(3)} <span className="text-xl">tCO₂e</span>
        </p>
        {data.incompleteSources.length > 0 && (
          <p className="text-xs text-yellow-400 mt-2 font-thai">
            ⚠️ ข้อมูลยังไม่ครบ: {data.incompleteSources.length} source ยังไม่มีข้อมูล ({data.incompleteSources.join(", ")})
          </p>
        )}
      </AuraCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.byScope.map((s) => (
          <AuraCard key={s.scope} className="p-4">
            <h2 className="font-semibold font-thai text-sm">{SCOPE_NAMES[s.scope] ?? `Scope ${s.scope}`}</h2>
            {!s.has_data ? (
              <p className="text-aura-textMuted text-sm font-thai pt-2">ยังไม่มีข้อมูล</p>
            ) : (
              <>
                <p className="text-2xl font-bold font-mono pt-2">
                  {(s.total_kg_co2e / 1000).toFixed(3)} <span className="text-sm">tCO₂e</span>
                </p>
                <p className="text-xs text-aura-textMuted font-thai">{s.source_count} sources</p>
              </>
            )}
          </AuraCard>
        ))}
      </div>

      <AuraCard className="p-4">
        <h2 className="font-semibold mb-2 font-thai">รายละเอียดรายเดือน</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="text-left p-2">เดือน</th><th className="text-left p-2">Scope</th><th className="text-left p-2">Source</th><th className="text-right p-2">kgCO₂e</th><th className="text-right p-2">Rows</th></tr></thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2 font-mono">{r.month}</td>
                  <td className="p-2">{r.scope}</td>
                  <td className="p-2">{r.source}</td>
                  <td className="text-right p-2 font-mono">{Number(r.kg_co2e).toFixed(3)}</td>
                  <td className="text-right p-2">{r.row_count}</td>
                </tr>
              ))}
              {data.rows.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-aura-textMuted font-thai">ยังไม่มีข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
      </AuraCard>
    </div>
  );
}
