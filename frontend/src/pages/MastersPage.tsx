/**
 * ENV-PARITY-P3-001 — the admin master-management page (lane P3.1): the
 * four AppSheet master tables — Items / Vendors / Categories /
 * distributor — list + create + edit + delete (EDITABLE reference data,
 * unlike the append-only equipment_spec history), admin-gated by the
 * RequireAuth requireAdmin route + RLS.
 *
 * Seed reality (WO §2): distributor seeded 6/6 verbatim from the pond
 * workbook; Items/Vendors/Categories SOURCE_UNAVAILABLE — the sections
 * show honest empty states and never fabricate rows.
 *
 * Pattern: copy EquipmentSpecPage structure (hooks + toast +
 * TableSkeleton). Track Z: minimal markup; Track F owns polish.
 */
import { AuraCard } from "../components/ui/AuraCard";
import { ItemsSection } from "../components/masters/ItemsSection";
import { VendorsSection } from "../components/masters/VendorsSection";
import { CategoriesSection } from "../components/masters/CategoriesSection";
import { DistributorSection } from "../components/masters/DistributorSection";

export function MastersPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-24">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
          <span className="aura-text-gradient">จัดการข้อมูล master</span>
          <span className="text-aura-textMain"> (แอดมิน)</span>
        </h1>
        <p className="text-sm text-aura-textMuted font-thai mt-1">
          อุปกรณ์ (Items) · ผู้ขาย (Vendors) · หมวดหมู่ (Categories) · ผู้จัดจำหน่าย (distributor) —
          ข้อมูลอ้างอิงแก้ไขได้ตามระบบเดิม; ตัวที่ยังไม่มีข้อมูลจาก Sheets แสดงสถานะตรงไปตรงมา ไม่เดาค่าแทน
        </p>
      </header>

      <AuraCard className="p-3">
        <p className="text-xs text-aura-textMuted font-thai">
          ผู้ใช้งานทั่วไปอ่านได้จากฟอร์มที่เกี่ยวข้อง (อุปกรณ์ที่ใช้ตรวจ / ชนิดเครื่องมือตรวจ) ·
          หน้านี้สำหรับผู้ดูแลระบบเท่านั้น
        </p>
      </AuraCard>

      <ItemsSection />
      <VendorsSection />
      <CategoriesSection />
      <DistributorSection />
    </div>
  );
}
