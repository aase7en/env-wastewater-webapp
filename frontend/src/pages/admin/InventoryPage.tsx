/**
 * ENV-PARITY-P3-002 — the admin-gated inventory page (lane P3.2): รับเข้า
 * lot entry per ถัง + stock view with per-lot remaining. Route
 * /admin/inventory (RequireAuth requireAdmin — the P1.4 /admin/equipment-specs
 * + P3.1 MastersPage pattern; route-only, no dock entry — admin nav lives
 * in AppShell which is outside this lane's scope, the /admin/masters
 * precedent).
 *
 * Seed reality (WO §2): chemical.inventory_lot is SOURCE_UNAVAILABLE — 0
 * seeded rows; the stock view shows the honest empty state, never a
 * fabricated stock number. The delivered /chemical manual movement entry
 * is UNCHANGED by this lane (this page ADDS per-lot semantics on top).
 */
import { LotReceiptSection } from "../../components/inventory/LotReceiptSection";
import { StockViewSection } from "../../components/inventory/StockViewSection";

export function InventoryPage() {
  return (
    <div data-testid="inventory-page" className="max-w-5xl mx-auto space-y-4 pb-24">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
          <span className="text-aura-textMain">สต๊อกคลอรีน</span>
          <span className="aura-text-gradient"> (ล็อต)</span>
        </h1>
        <p className="text-sm text-aura-textMuted font-thai mt-1">
          รับเข้าคลอรีน 10% เป็นจำนวนถัง/ตลับ พร้อมเลขล็อต วันผลิต (MFG) วันหมดอายุ (EXP) —
          และดูสต๊อกคงเหลือต่อล็อต ที่การบันทึกการใช้คลอรีนจะหักอัตโนมัติด้วยหลัก FEFO
        </p>
      </header>
      <StockViewSection />
      <LotReceiptSection />
    </div>
  );
}
