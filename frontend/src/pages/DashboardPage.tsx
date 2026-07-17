import { Zap, Droplets, Activity, Calendar } from "lucide-react";
import { useDashboard, useReadings } from "../lib/hooks";
import { ProcessFlowDiagram } from "../components/pfd/ProcessFlowDiagram";
import { KpiTile } from "../components/KpiTile";
import { StatusBadge } from "../components/pfd/StatusBadge";
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
          <h1 className="font-display font-bold text-2xl text-navy-900">แดชบอร์ดระบบบำบัดน้ำเสีย</h1>
          <p className="text-sm text-navy-500">14 วันล่าสุด · {rows.length} รายการ</p>
        </div>
        <button
          onClick={refresh}
          className="px-3 py-1.5 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
        >
          รีเฟรช
        </button>
      </header>

      {/* Loading / error */}
      {loading && <div className="text-navy-500">กำลังโหลด…</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          โหลดข้อมูลไม่สำเร็จ: {error}
        </div>
      )}

      {/* KPI tiles */}
      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="น้ำเข้าระบบวันนี้" value={today?.wastewater_in} unit="m³" icon={<Droplets className="w-5 h-5" />} accent="water" digits={1} />
          <KpiTile label="น้ำที่ใช้" value={today?.water_used_total} unit="m³" icon={<Activity className="w-5 h-5" />} accent="teal" digits={1} />
          <KpiTile label="วันผิดปกติ (14d)" value={daysNormal} unit="วัน" icon={<Zap className="w-5 h-5" />} accent="amber" digits={0} />
          <KpiTile label="วันระบายน้ำทิ้ง" value={daysDischarged} unit="วัน" icon={<Calendar className="w-5 h-5" />} accent="teal" digits={0} />
        </div>
      )}

      {/* Process Flow Diagram */}
      <ProcessFlowDiagram row={today} />

      {/* 14-day log table */}
      <section className="bg-white rounded-xl border border-navy-100 shadow-sm overflow-hidden">
        <h2 className="font-display font-semibold text-navy-900 p-4 border-b border-navy-100">
          ประวัติ 14 วัน
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy-50 text-navy-600 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">วันที่</th>
                <th className="px-4 py-2 font-medium">DO เฉลี่ย</th>
                <th className="px-4 py-2 font-medium">pH</th>
                <th className="px-4 py-2 font-medium">Cl อิสระ</th>
                <th className="px-4 py-2 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {(readings?.items || []).map((r) => (
                <tr key={r.id} className="hover:bg-navy-50">
                  <td className="px-4 py-2 text-navy-700">{thaiDate(r.reading_date)}</td>
                  <td className="px-4 py-2 font-mono text-navy-900">{fmt(r.do_average, 2)}</td>
                  <td className="px-4 py-2 font-mono text-navy-900">{fmt(r.ph, 1)}</td>
                  <td className="px-4 py-2 font-mono text-navy-900">{fmt(r.free_chlorine, 2)}</td>
                  <td className="px-4 py-2"><StatusBadge status={r.system_operating ?? null} /></td>
                </tr>
              ))}
              {(readings?.items || []).length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-navy-400">ไม่มีข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
