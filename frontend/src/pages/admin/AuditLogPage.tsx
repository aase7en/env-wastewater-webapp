/**
 * P4-audit-viewer (2026-07-21, ADR-0009 §3) — read-only audit-log admin page.
 *
 * Lists recent rows from `public.audit_log` (the security_invoker façade over
 * `core.audit_log`, populated by the SCHEMA-4 trigger). Read-only — no
 * INSERT/UPDATE/DELETE controls. Filters: date range, action, table_name.
 * old_data/new_data shown as expandable pretty-printed JSON.
 *
 * Auth: `RequireAuth requireAdmin` on the route (App.tsx) + `audit_log_admin_all`
 * RLS at the DB — belt-and-suspenders. A non-admin bounces at the route guard.
 *
 * Pattern: copy AIAdminPage.tsx structure (useCallback refresh + toast +
 * TableSkeleton). Track Z: minimal markup. Track F owns polish (animation,
 * filter card emphasis, expanded-row styling).
 */
import { Fragment, useState, useEffect, useCallback } from "react";
import { useToast } from "../../components/ui/Toast";
import { AuraCard } from "../../components/ui/AuraCard";
import { Button } from "../../components/ui/Button";
import { Input, Field, Select } from "../../components/ui/Input";
import { TableSkeleton } from "../../components/ui/Skeleton";
import {
  fetchAuditLog, type AuditLogRow, type AuditLogFilter,
} from "../../lib/admin/audit-log";

/** Tables covered by the SCHEMA-4 audit trigger (mirror DBAConsolePage TABLES).
 *  Kept short on purpose — full list lives there. */
const AUDITED_TABLES = [
  "wastewater.reading",
  "carbon.reading",
  "core.repair_request",
  "wastewater.threshold_alert",
  "water_supply.daily_check",
  "garbage.collection_log",
  "fuel.dispense_log",
  "garden.work_round",
  "building.inspection_round",
  "safety.monthly_check",
  "food.lab_test",
  "chemical.movement",
];

const ACTIONS = ["INSERT", "UPDATE", "DELETE"] as const;

/** Format ISO timestamp as Thai-BE date + local time (e.g. "19 ก.ค. 2569 14:30"). */
function thaiDateTime(iso: string): string {
  const d = new Date(iso);
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
                  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const be = d.getFullYear() + 543;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${months[d.getMonth()]} ${be} ${hh}:${mm}`;
}

export function AuditLogPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Filter inputs (form state — applied on กรอง click).
  const [fAction, setFAction] = useState<"" | "INSERT" | "UPDATE" | "DELETE">("");
  const [fTable, setFTable] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");

  const refresh = useCallback(async (filter?: AuditLogFilter) => {
    setLoading(true);
    try {
      const r = await fetchAuditLog(filter);
      setRows(r);
    } catch (e) {
      toast("error", (e as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initial load — newest 100 rows.
  useEffect(() => { void refresh(); }, [refresh]);

  function applyFilter() {
    const f: AuditLogFilter = { limit: 200 };
    if (fAction) f.action = fAction;
    if (fTable) f.table_name = fTable;
    if (fFrom) f.from = fFrom;
    if (fTo) f.to = fTo;
    setExpanded(new Set());
    void refresh(f);
  }

  function resetFilter() {
    setFAction("");
    setFTable("");
    setFFrom("");
    setFTo("");
    setExpanded(new Set());
    void refresh();
  }

  function toggleRow(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <header className="space-y-1">
        <h1 className="font-display font-bold text-3xl aura-text-gradient">
          บันทึกการตรวจสอบ (Audit Log)
        </h1>
        <p className="text-sm text-aura-textMuted font-thai">
          ประวัติการเปลี่ยนแปลงข้อมูลในระบบ — ดูอย่างเดียว (read-only)
        </p>
      </header>

      <AuraCard className="p-4 space-y-3">
        <h2 className="font-semibold font-thai">ตัวกรอง</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="จากวันที่">
            <Input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} />
          </Field>
          <Field label="ถึงวันที่">
            <Input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} />
          </Field>
          <Field label="การกระทำ">
            <Select value={fAction} onChange={(e) => setFAction(e.target.value as typeof fAction)}>
              <option value="">— ทั้งหมด —</option>
              {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
          </Field>
          <Field label="ตาราง">
            <Select value={fTable} onChange={(e) => setFTable(e.target.value)}>
              <option value="">— ทั้งหมด —</option>
              {AUDITED_TABLES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={applyFilter} disabled={loading}>กรอง</Button>
          <Button size="sm" variant="ghost" onClick={resetFilter} disabled={loading}>
            ล้างตัวกรอง
          </Button>
        </div>
      </AuraCard>

      <AuraCard className="p-4">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-semibold font-thai">ผลลัพธ์ ({rows.length})</h2>
          <span className="text-xs text-aura-textMuted font-thai">แสดงใหม่สุดก่อน · สูงสุด 200 แถว</span>
        </div>
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-aura-textMuted font-thai text-sm">
            ไม่มีบันทึกที่ตรงตัวกรอง
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-aura-surface">
                <tr>
                  <th className="text-left p-2 border-b">เวลา</th>
                  <th className="text-left p-2 border-b">ผู้กระทำ</th>
                  <th className="text-left p-2 border-b">การกระทำ</th>
                  <th className="text-left p-2 border-b">ตาราง</th>
                  <th className="text-left p-2 border-b">row_id</th>
                  <th className="p-2 border-b"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isOpen = expanded.has(r.id);
                  return (
                    <Fragment key={r.id}>
                      <tr className="border-b hover:bg-white/5">
                        <td className="p-2 font-thai whitespace-nowrap">{thaiDateTime(r.changed_at)}</td>
                        <td className="p-2 font-mono">
                          {r.actor ? r.actor.slice(0, 8) + "…" : <span className="text-aura-textMuted font-thai">ระบบ</span>}
                        </td>
                        <td className="p-2 font-mono">{r.action}</td>
                        <td className="p-2 font-mono">{r.table_name}</td>
                        <td className="p-2 font-mono">{r.row_id ?? "—"}</td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => toggleRow(r.id)}
                            className="text-aura-cyan hover:underline font-thai"
                          >
                            {isOpen ? "ซ่อน" : "ดู"}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-black/20">
                          <td colSpan={6} className="p-3 space-y-2">
                            <div>
                              <div className="text-[10px] uppercase text-aura-textMuted mb-1 font-thai">ข้อมูลใหม่ (new_data)</div>
                              <pre className="text-[11px] bg-black/40 p-2 rounded overflow-x-auto font-mono whitespace-pre-wrap break-words">
                                {r.new_data === null || r.new_data === undefined
                                  ? "—"
                                  : JSON.stringify(r.new_data, null, 2)}
                              </pre>
                            </div>
                            {(r.old_data !== null && r.old_data !== undefined) && (
                              <div>
                                <div className="text-[10px] uppercase text-aura-textMuted mb-1 font-thai">ข้อมูลเดิม (old_data)</div>
                                <pre className="text-[11px] bg-black/40 p-2 rounded overflow-x-auto font-mono whitespace-pre-wrap break-words">
                                  {JSON.stringify(r.old_data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
