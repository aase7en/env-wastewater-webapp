import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { MSymbol } from "../components/ui/MSymbol";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/pfd/StatusBadge";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/ui/Toast";
import { thaiDate } from "../lib/utils";
import { cn } from "../lib/utils";

interface EquipmentRow {
  id: string;
  code: string;
  name_th: string; // aliased from DB column `name` at query time
  location_id: string | null;
  is_active: boolean;
}

interface RepairRow {
  id: string;
  equipment_id: string | null;
  cause: string;
  status: "open" | "in_progress" | "resolved" | "cancelled";
  created_at: string;
  resolved_at: string | null;
}

/** Status badge style for repair requests. */
function repairBadge(status: RepairRow["status"]) {
  switch (status) {
    case "open":
      return { label: "รอดำเนินการ", icon: "schedule", color: "text-alert-amber border-alert-amber/40 bg-alert-amber/10" };
    case "in_progress":
      return { label: "กำลังซ่อม", icon: "build", color: "text-aura-cyan border-aura-cyan/40 bg-aura-cyan/10" };
    case "resolved":
      return { label: "ซ่อมเสร็จ", icon: "check_circle", color: "text-alert-green border-alert-green/40 bg-alert-green/10" };
    case "cancelled":
      return { label: "ยกเลิก", icon: "cancel", color: "text-aura-textMuted border-aura-borderSubtle bg-aura-surfaceHigh/40" };
  }
}

export function EquipmentPage() {
  const toast = useToast();
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [repairs, setRepairs] = useState<RepairRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eqResp, repResp] = await Promise.all([
        supabase
          .from("equipment")
          .select("id, code, name_th:name, location_id, is_active")
          .order("code"),
        supabase
          .from("repair_request")
          .select("id, equipment_id, cause, status, created_at, resolved_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (eqResp.error) throw eqResp.error;
      if (repResp.error) throw repResp.error;
      setEquipment(eqResp.data ?? []);
      setRepairs(repResp.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      toast.error("โหลดข้อมูลอุปกรณ์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // Index repairs by equipment_id for quick lookup
  const openRepairsByEquip = new Map<string, RepairRow[]>();
  for (const r of repairs) {
    if (r.status === "open" || r.status === "in_progress") {
      const list = openRepairsByEquip.get(r.equipment_id ?? "") ?? [];
      list.push(r);
      openRepairsByEquip.set(r.equipment_id ?? "", list);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            <span className="text-aura-textMain">อุปกรณ์</span>
            <span className="aura-text-gradient"> &amp; ซ่อมบำรุง</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            รายการอุปกรณ์ {equipment.length} รายการ · ใบแจ้งซ่อม {repairs.length} ใบ
          </p>
        </div>
        <Link to="/reports">
          <Button size="sm" variant="secondary">
            <MSymbol name="add" className="text-[18px]" /> สร้างใบแจ้งซ่อม
          </Button>
        </Link>
      </header>

      {error && (
        <AuraCard>
          <p className="text-sm text-alert-red font-thai">โหลดข้อมูลไม่สำเร็จ: {error}</p>
        </AuraCard>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : equipment.length === 0 ? (
        <AuraCard>
          <EmptyState
            icon={<MSymbol name="build" className="text-[32px]" />}
            title="ยังไม่มีอุปกรณ์ในระบบ"
            description="อุปกรณ์ถูก seed ผ่าน migration — หากเห็นหน้านี้ แสดงว่ายังไม่ได้รัน migration P2"
          />
        </AuraCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {equipment.map((eq) => {
            const open = openRepairsByEquip.get(eq.id) ?? [];
            return (
              <AuraCard key={eq.id} className={cn("p-4 space-y-3", open.length > 0 && "border-alert-amber/40")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-aura-textMuted">{eq.code}</span>
                      {!eq.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-aura-surfaceHigh text-aura-textMuted">inactive</span>
                      )}
                    </div>
                    <div className="font-semibold text-aura-textMain font-thai">{eq.name_th}</div>
                  </div>
                  <StatusBadge status={open.length > 0 ? true : false} label={open.length > 0 ? "มีการแจ้งซ่อม" : "ปกติ"} />
                </div>

                {open.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-aura-borderSubtle/50">
                    {open.map((r) => {
                      const b = repairBadge(r.status);
                      return (
                        <div key={r.id} className={cn("rounded-lg border px-3 py-2 text-xs", b.color)}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center gap-1.5 font-semibold font-thai">
                              <MSymbol name={b.icon} className="text-[12px]" /> {b.label}
                            </span>
                            <span className="font-thai">{thaiDate(r.created_at)}</span>
                          </div>
                          <p className="font-thai text-aura-textMain">{r.cause}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </AuraCard>
            );
          })}
        </div>
      )}

      {/* Recent repair requests (all statuses) */}
      {!loading && repairs.length > 0 && (
        <AuraCard className="p-0 overflow-hidden">
          <h2 className="font-display font-semibold text-aura-textMain p-4 border-b border-aura-borderSubtle font-thai">
            ใบแจ้งซ่อมล่าสุด ({repairs.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-aura-textMuted border-b border-aura-borderSubtle text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3 font-bold font-thai">วันที่แจ้ง</th>
                  <th className="px-4 py-3 font-bold font-thai">สถานะ</th>
                  <th className="px-4 py-3 font-bold font-thai">สาเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aura-borderSubtle/50">
                {repairs.slice(0, 15).map((r) => {
                  const b = repairBadge(r.status);
                  return (
                    <tr key={r.id} className="hover:bg-aura-cyan/5">
                      <td className="px-4 py-2 text-aura-textMain font-thai">{thaiDate(r.created_at)}</td>
                      <td className="px-4 py-2">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-thai border", b.color)}>
                          <MSymbol name={b.icon} className="text-[12px]" /> {b.label}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-aura-textMain font-thai max-w-md truncate">{r.cause}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AuraCard>
      )}
    </div>
  );
}
