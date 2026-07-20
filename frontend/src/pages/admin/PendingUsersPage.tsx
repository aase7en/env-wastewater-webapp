/**
 * OAUTH-3 (2026-07-21) — admin approval page (/admin/users).
 *
 * Lists OAuth users awaiting approval (core.app_user role='pending') and
 * exposes Approve (→ staff) / Reject (→ is_active=false) actions via
 * SECURITY DEFINER RPCs.
 *
 * Pattern: copy AIAdminPage.tsx structure (useCallback refresh + toast +
 * TableSkeleton). UI is minimal Track Z — Track F polish (animations,
 * card emphasis, badge counts on the NAV entry) is deferred to Fable5.
 */
import { useState, useEffect, useCallback } from "react";
import { useToast } from "../../components/ui/Toast";
import { AuraCard } from "../../components/ui/AuraCard";
import { Button } from "../../components/ui/Button";
import { TableSkeleton } from "../../components/ui/Skeleton";
import {
  fetchPendingUsers, approveUser, rejectUser, type PendingUser,
} from "../../lib/admin/users";
import { thaiDate } from "../../lib/utils";

export function PendingUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchPendingUsers();
      setUsers(rows);
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { refresh(); }, [refresh]);

  async function onApprove(id: string) {
    try {
      await approveUser(id);
      toast("success", "อนุมัติผู้ใช้แล้ว — บัญชีพร้อมใช้งาน");
      refresh();
    } catch (e) {
      toast("error", (e as Error).message);
    }
  }

  async function onReject(id: string, email: string | null) {
    if (!confirm(`ปฏิเสธบัญชี ${email ?? id}? บัญชีจะถูกปิดใช้งาน (is_active=false) — ไม่สามารถย้อนกลับได้ง่าย`)) return;
    try {
      await rejectUser(id);
      toast("success", "ปฏิเสธบัญชีแล้ว");
      refresh();
    } catch (e) {
      toast("error", (e as Error).message);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <header className="space-y-1">
        <h1 className="font-display font-bold text-3xl aura-text-gradient">รออนุมัติผู้ใช้</h1>
        <p className="text-sm text-aura-textMuted font-thai">
          บัญชีที่ลงทะเบียนผ่าน Google/LINE และรอผู้ดูแลอนุมัติก่อนใช้งานแอป
        </p>
      </header>

      <AuraCard className="p-4">
        <h2 className="font-semibold mb-2 font-thai">ผู้ใช้รออนุมัติ ({users.length})</h2>
        {loading ? (
          <TableSkeleton rows={3} cols={4} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">อีเมล</th>
                <th className="text-left p-2">ชื่อ</th>
                <th className="text-left p-2">ลงทะเบียน</th>
                <th className="text-right p-2">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-2 font-mono text-xs">{u.email ?? "—"}</td>
                  <td className="p-2 font-thai">{u.display_name ?? "—"}</td>
                  <td className="p-2 font-thai text-aura-textMuted">
                    {thaiDate(u.created_at.slice(0, 10))}
                  </td>
                  <td className="p-2 text-right space-x-2">
                    <Button size="sm" variant="primary" onClick={() => onApprove(u.id)}>
                      อนุมัติ
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => onReject(u.id, u.email)}>
                      ปฏิเสธ
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-aura-textMuted font-thai">
                    ไม่มีผู้ใช้รออนุมัติ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </AuraCard>
    </div>
  );
}
