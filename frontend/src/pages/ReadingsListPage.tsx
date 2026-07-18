import { Link, useNavigate } from "react-router-dom";
import { AuraCard } from "../components/ui/AuraCard";
import { MSymbol } from "../components/ui/MSymbol";
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
            <MSymbol name="refresh" className="text-[18px]" /> รีเฟรช
          </Button>
          <Link to="/form">
            <Button size="sm">
              <MSymbol name="add" className="text-[18px]" /> เพิ่มรายการ
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
            icon={<MSymbol name="description" className="text-[32px]" />}
            title="ยังไม่มีรายการบันทึก"
            description="เริ่มบันทึกค่าคุณภาพน้ำรายวันของระบบบำบัด — ข้อมูลจะปรากฏที่นี่"
            action={
              <Link to="/form">
                <Button>
                  <MSymbol name="add" className="text-[18px]" /> เพิ่มรายการแรก
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
                {/* Suite table-header pattern: small caps labels (fuel-fleet screens) */}
                <tr className="text-left text-aura-textMuted border-b border-aura-borderSubtle text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3 font-bold font-thai">วันที่</th>
                  <th className="px-4 py-3 font-bold">DO เฉลี่ย</th>
                  <th className="px-4 py-3 font-bold">pH</th>
                  <th className="px-4 py-3 font-bold">Cl อิสระ</th>
                  <th className="px-4 py-3 font-bold font-thai">สถานะ</th>
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
                      <MSymbol name="edit" className="text-[16px] text-aura-textMuted group-hover:text-aura-cyan transition-colors" />
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
