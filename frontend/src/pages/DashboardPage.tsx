import { Zap, Droplets, Activity, Calendar } from "lucide-react";
import { useDashboard, useReadings } from "../lib/hooks";
import { ProcessFlowDiagram } from "../components/pfd/ProcessFlowDiagram";
import { KpiTile } from "../components/KpiTile";
import { StatusBadge } from "../components/pfd/StatusBadge";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { fmt, thaiDate } from "../lib/utils";

export function DashboardPage() {
  const { data: rows, loading, error, refresh } = useDashboard(14);
  const { data: readings } = useReadings(14);

  const today = rows[0]; // newest first
  const daysNormal = rows.filter((r) => r.system_operating === false).length;
  const daysDischarged = rows.filter((r) => r.wastewater_discharged === true).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight">
            <span className="aura-text-gradient">แดชบอร์ด</span>
            <span className="text-aura-textMain"> ระบบบำบัดน้ำเสีย</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            14 วันล่าสุด · {rows.length} รายการ
            {today?.reading_date && <> · บันทึกล่าสุด {thaiDate(today.reading_date)}</>}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} loading={loading}>
          รีเฟรช
        </Button>
      </header>

      {/* Loading / error */}
      {loading && <div className="text-aura-textMuted font-thai">กำลังโหลด…</div>}
      {error && (
        <div className="rounded-2xl border border-alert-red/40 bg-alert-red/10 p-4 text-sm text-alert-red font-thai">
          โหลดข้อมูลไม่สำเร็จ: {error}
        </div>
      )}

      {/* KPI tiles — neon accents */}
      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="น้ำเข้าระบบวันนี้" value={today?.wastewater_in} unit="m³" icon={<Droplets className="w-5 h-5" />} accent="cyan" digits={1} />
          <KpiTile label="น้ำที่ใช้" value={today?.water_used_total} unit="m³" icon={<Activity className="w-5 h-5" />} accent="lime" digits={1} />
          <KpiTile label="วันผิดปกติ (14d)" value={daysNormal} unit="วัน" icon={<Zap className="w-5 h-5" />} accent="amber" digits={0} />
          <KpiTile label="วันระบายน้ำทิ้ง" value={daysDischarged} unit="วัน" icon={<Calendar className="w-5 h-5" />} accent="cyan" digits={0} />
        </div>
      )}

      {/* Process Flow Diagram */}
      <ProcessFlowDiagram row={today} />

      {/* 14-day log table */}
      <AuraCard className="p-0 overflow-hidden">
        <h2 className="font-display font-semibold text-aura-textMain p-4 border-b border-aura-borderSubtle font-thai">
          ประวัติ 14 วัน
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-aura-textMuted text-left border-b border-aura-borderSubtle">
                <th className="px-4 py-2 font-medium font-thai">วันที่</th>
                <th className="px-4 py-2 font-medium font-thai">DO เฉลี่ย</th>
                <th className="px-4 py-2 font-medium font-thai">pH</th>
                <th className="px-4 py-2 font-medium font-thai">Cl อิสระ</th>
                <th className="px-4 py-2 font-medium font-thai">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-borderSubtle/50">
              {(readings?.items || []).map((r) => (
                <tr key={r.id} className="hover:bg-aura-cyan/5 transition-colors">
                  <td className="px-4 py-2 text-aura-textMain font-thai">{thaiDate(r.reading_date)}</td>
                  <td className="px-4 py-2 font-mono text-aura-textMain">{fmt(r.do_average, 2)}</td>
                  <td className="px-4 py-2 font-mono text-aura-textMain">{fmt(r.ph, 1)}</td>
                  <td className="px-4 py-2 font-mono text-aura-textMain">{fmt(r.free_chlorine, 2)}</td>
                  <td className="px-4 py-2"><StatusBadge status={r.system_operating ?? null} /></td>
                </tr>
              ))}
              {(readings?.items || []).length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-aura-textMuted font-thai">ไม่มีข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </AuraCard>
    </div>
  );
}
