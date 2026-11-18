/**
 * ENV-PARITY-P3-002 — stock view (lane P3.2): per-lot remaining
 * (amount_remaining from the public.inventory_lot security_invoker view) +
 * the master total. Honesty: no lots ⇒ the verbatim honest empty state
 * "ยังไม่มีล็อตสต๊อก — รอการรับเข้าจริง" — never a fabricated stock
 * number (WO §5); FEFO order preview = expiry ASC NULLS LAST (the same
 * order the deduction RPC consumes); พ.ศ. dates (thaiDate).
 *
 * Track Z minimal markup; Track F owns polish.
 */
import { AuraCard } from "../ui/AuraCard";
import { MSymbol } from "../ui/MSymbol";
import { TableSkeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { thaiDate } from "../../lib/utils";
import { EMPTY_LOTS_LABEL, fefoOrder, useInventoryLots } from "../../lib/inventory";

export function StockViewSection() {
  const { data: lots, loading, error, refresh } = useInventoryLots();

  const totalRemaining = lots.reduce((sum, l) => sum + (l.amount_remaining ?? 0), 0);
  const ordered = fefoOrder(lots.filter((l) => (l.amount_remaining ?? 0) > 0));
  const emptyLots = lots.filter((l) => (l.amount_remaining ?? 0) <= 0);

  return (
    <div data-testid="inventory-stock-view">
      <AuraCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-aura-borderSubtle/60 flex items-center gap-2 flex-wrap">
          <MSymbol name="monitoring" className="text-[20px] text-aura-cyan" />
          <h2 className="font-bold font-thai text-aura-textMain">สต๊อกคลอรีนคงเหลือ (ต่อล็อต)</h2>
          <span className="text-xs text-aura-textMuted font-mono ml-auto">
            {lots.length} ล็อต · รวม {totalRemaining} kg
          </span>
          <button
            className="text-xs text-aura-cyan underline"
            onClick={() => refresh()}
            type="button"
          >
            รีเฟรช
          </button>
        </div>
        {error && (
          <p className="px-4 py-2 text-sm text-alert-red font-thai">โหลดไม่สำเร็จ: {error}</p>
        )}
        {loading ? (
          <TableSkeleton rows={3} cols={5} />
        ) : lots.length === 0 ? (
          <div data-testid="inventory-stock-empty">
            <EmptyState
              icon={<MSymbol name="inventory_2" className="text-[32px]" />}
              title={EMPTY_LOTS_LABEL}
              description="รับเข้าล็อตแรกด้วยแบบฟอร์มด้านบน — ระบบจะไม่เดาค่าสต๊อกแทนของจริง"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-aura-textMuted border-b border-aura-borderSubtle/60">
                  <th className="px-4 py-2 font-thai">ล็อต</th>
                  <th className="px-4 py-2 font-thai">รับเข้า</th>
                  <th className="px-4 py-2 font-thai">ผลิต (MFG)</th>
                  <th className="px-4 py-2 font-thai">หมดอายุ (EXP)</th>
                  <th className="px-4 py-2 font-thai text-right">รับเข้า (kg)</th>
                  <th className="px-4 py-2 font-thai text-right">หักแล้ว (kg)</th>
                  <th className="px-4 py-2 font-thai text-right">คงเหลือ (kg)</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((l) => (
                  <tr key={l.id} className="border-b border-aura-borderSubtle/40">
                    <td className="px-4 py-2 font-mono text-xs">{l.lot_no ?? "—"}</td>
                    <td className="px-4 py-2 font-thai">{thaiDate(l.receipt_date)}</td>
                    <td className="px-4 py-2 font-thai">
                      {l.mfg_date ? thaiDate(l.mfg_date) : <span className="text-aura-textMuted">ไม่ทราบ</span>}
                    </td>
                    <td className="px-4 py-2 font-thai">
                      {l.expiry_date ? thaiDate(l.expiry_date) : <span className="text-aura-textMuted">ไม่ทราบ (FEFO ลำดับท้าย)</span>}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{l.amount_received}</td>
                    <td className="px-4 py-2 text-right font-mono">{l.amount_deducted}</td>
                    <td className="px-4 py-2 text-right font-mono">{l.amount_remaining}</td>
                  </tr>
                ))}
                {emptyLots.length > 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-2 text-xs text-aura-textMuted font-thai">
                      อีก {emptyLots.length} ล็อตถูกใช้ครบล็อตแล้ว (แสดงเฉพาะล็อตที่มีสต๊อกคงเหลือ)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <p className="px-4 py-2 text-xs text-aura-textMuted font-thai">
          การหักสต๊อกอัตโนมัติ (บันทึกคลอรีนที่ใช้ในฟอร์มน้ำเสีย/น้ำประปา) ใช้หลัก FEFO จากตารางนี้ —
          ล็อตที่หมดอายุเร็วที่สุดก่อน ล็อตไม่ทราบวันหมดอายุท้ายสุด · สต๊อกไม่พอ = บันทึกการใช้ได้ปกติ
          แต่การหักจะถูกข้ามพร้อมแจ้งเตือนตรงไปตรงมา
        </p>
      </AuraCard>
    </div>
  );
}
