import { Link, useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Pencil, FileText } from "lucide-react";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/pfd/StatusBadge";
import { EmptyState } from "../components/ui/EmptyState";
import { TableSkeleton } from "../components/ui/Skeleton";
import { useReadings } from "../lib/hooks";
import { fmt, thaiDate } from "../lib/utils";

export function ReadingsListPage() {
  const { data, loading, error, refresh } = useReadings(30);
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            <span className="text-aura-textMain">ประวัติ</span>
            <span className="aura-text-gradient"> การบันทึก</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            30 รายการล่าสุด · กดที่แถวเพื่อแก้ไข
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={refresh} loading={loading}>
            <RefreshCw className="w-4 h-4" /> รีเฟรช
          </Button>
          <Link to="/form">
            <Button size="sm">
              <Plus className="w-4 h-4" /> เพิ่มรายการ
            </Button>
          </Link>
        </div>
      </header>

      {error && (
        <AuraCard>
          <p className="text-sm text-alert-red font-thai">โหลดข้อมูลไม่สำเร็จ: {error}</p>
        </AuraCard>
      )}

      {loading ? (
        <AuraCard className="p-0">
          <TableSkeleton rows={6} cols={5} />
        </AuraCard>
      ) : !data || data.items.length === 0 ? (
        <AuraCard>
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="ยังไม่มีรายการบันทึก"
            description="เริ่มบันทึกค่าคุณภาพน้ำรายวันของระบบบำบัด — ข้อมูลจะปรากฏที่นี่"
            action={
              <Link to="/form">
                <Button>
                  <Plus className="w-4 h-4" /> เพิ่มรายการแรก
                </Button>
              </Link>
            }
          />
        </AuraCard>
      ) : (
        <AuraCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-aura-textMuted border-b border-aura-borderSubtle">
                  <th className="px-4 py-3 font-medium font-thai">วันที่</th>
                  <th className="px-4 py-3 font-medium font-thai">DO เฉลี่ย</th>
                  <th className="px-4 py-3 font-medium font-thai">pH</th>
                  <th className="px-4 py-3 font-medium font-thai">Cl อิสระ</th>
                  <th className="px-4 py-3 font-medium font-thai">สถานะ</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-aura-borderSubtle/50">
                {data.items.map((r) => (
                  <tr
                    key={r.id}
                    className="group hover:bg-aura-cyan/5 transition-colors cursor-pointer"
                    onClick={() => navigate(`/form/${r.id}`)}
                  >
                    <td className="px-4 py-3 text-aura-textMain font-thai">{thaiDate(r.reading_date)}</td>
                    <td className="px-4 py-3 font-mono text-aura-textMain">{fmt(r.do_average, 2)}</td>
                    <td className="px-4 py-3 font-mono text-aura-textMain">{fmt(r.ph, 1)}</td>
                    <td className="px-4 py-3 font-mono text-aura-textMain">{fmt(r.free_chlorine, 2)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.system_operating ?? null} /></td>
                    <td className="px-4 py-3 text-right">
                      <Pencil className="w-4 h-4 text-aura-textMuted inline group-hover:text-aura-cyan transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AuraCard>
      )}
    </div>
  );
}
