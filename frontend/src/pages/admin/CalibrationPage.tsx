/**
 * ENV-PARITY-P3-003 — the admin-gated maintenance/calibration page (lane
 * P3.3): per-tool calibration history + entry form. Route
 * /admin/calibration (RequireAuth requireAdmin — the /admin/inventory +
 * /admin/masters precedent; route-only, no dock entry — admin nav lives in
 * AppShell, outside this lane's scope).
 *
 * Seed reality: the guarded 11-row `maintaining` history ships with the
 * migration; an empty state stays honest ("ยังไม่มีรายการสอบเทียบ"). The
 * D1-5 D2 ruling pins: NO next-due is computed or shown anywhere — the
 * list shows ครั้งล่าสุด + จำนวนครั้ง and states the absence honestly.
 */
import { CalibrationListSection } from "../../components/calibration/CalibrationListSection";
import { CalibrationFormSection } from "../../components/calibration/CalibrationFormSection";

export function CalibrationPage() {
  return (
    <div data-testid="calibration-page" className="max-w-5xl mx-auto space-y-4 pb-24">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
          <span className="text-aura-textMain">สอบเทียบเครื่องมือ</span>
          <span className="aura-text-gradient"> (maintenance)</span>
        </h1>
        <p className="text-sm text-aura-textMuted font-thai mt-1">
          ประวัติการสอบเทียบเครื่องมือวัด (วันที่ / วิธี / ผล) ตามระบบเดิม —
          ดูครั้งล่าสุดต่อเครื่องมือ และบันทึกผลสอบเทียบครั้งใหม่ได้
        </p>
      </header>
      <CalibrationListSection />
      <CalibrationFormSection />
    </div>
  );
}
