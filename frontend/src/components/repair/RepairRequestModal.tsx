import { useState } from "react";
import { createRepairRequest } from "../../lib/repair";
// PDF functions imported on demand inside printPdf — keeps the Dashboard
// bundle (which always loads this modal) free of jspdf/html2canvas.
// Type-only imports stay static.
import { useEquipment } from "../../lib/hooks";
import { useAuth } from "../AuthProvider";
import { useToast } from "../ui/Toast";
import { Button } from "../ui/Button";
import { MSymbol } from "../ui/MSymbol";
import { Field, Textarea } from "../ui/Input";
import { thaiDate } from "../../lib/utils";

/**
 * แจ้งเหตุผิดปกติ → core.repair_request (WO-V1b, closes SPEC §6 loop).
 * Optional equipment picker + mandatory cause; after saving offers the
 * ใบแจ้งซ่อม PDF (P16 template). Uses the V1a data layer as checkpointed.
 */
export function RepairRequestModal({
  open,
  onClose,
  readingId = null,
}: {
  open: boolean;
  onClose: () => void;
  readingId?: string | null;
}) {
  const { data: equipment } = useEquipment();
  const { appUser, user } = useAuth();
  const toast = useToast();
  const [cause, setCause] = useState("");
  const [equipmentId, setEquipmentId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [savedCause, setSavedCause] = useState<string | null>(null);
  const [savedEquipment, setSavedEquipment] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setCause("");
    setEquipmentId("");
    setSavedCause(null);
    setSavedEquipment(null);
  };

  const submit = async () => {
    const trimmed = cause.trim();
    if (!trimmed) {
      toast.error("กรุณาระบุสาเหตุที่ผิดปกติ");
      return;
    }
    setSaving(true);
    try {
      const eq = equipment.find((e) => e.id === equipmentId);
      await createRepairRequest({
        cause: trimmed,
        equipment_id: equipmentId || null,
        reading_id: readingId,
      });
      setSavedCause(trimmed);
      setSavedEquipment(eq ? eq.name_th ?? eq.code : null);
      toast.success("บันทึกใบแจ้งซ่อมแล้ว");
    } catch (e) {
      toast.error(`บันทึกไม่สำเร็จ: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const printPdf = async () => {
    if (!savedCause) return;
    // Dynamic import — only loads jspdf/html2canvas when the user actually
    // clicks "พิมพ์ PDF" from the repair modal.
    const { generateRepairRequest, downloadPDF } = await import("../../lib/pdf");
    const doc = generateRepairRequest({
      date: thaiDate(new Date().toISOString().slice(0, 10)),
      cause: savedCause,
      equipment: savedEquipment,
      reporter: appUser?.display_name || user?.email || null,
      status: "open",
    });
    downloadPDF(doc, `repair-request-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="ปิด"
        onClick={() => { reset(); onClose(); }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      {/* Panel */}
      <div className="relative w-full sm:max-w-md aura-card aura-card--static p-5 rounded-b-none sm:rounded-b-[24px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-aura-textMain font-thai flex items-center gap-2">
            <MSymbol name="build" className="text-[20px] text-alert-amber" />
            แจ้งเหตุผิดปกติ
          </h2>
          <button
            type="button"
            aria-label="ปิดหน้าต่าง"
            onClick={() => { reset(); onClose(); }}
            className="text-aura-textMuted hover:text-aura-textMain transition-colors"
          >
            <MSymbol name="close" className="text-[20px]" />
          </button>
        </div>

        {savedCause ? (
          <div className="space-y-4">
            <div className="rounded-2xl px-4 py-3 text-sm font-thai bg-alert-green/10 border border-alert-green/40 text-alert-green flex items-center gap-2">
              <MSymbol name="check_circle" className="text-[18px]" />
              บันทึกลงระบบแล้ว — พิมพ์ใบแจ้งซ่อมได้เลย
            </div>
            <div className="flex gap-2">
              <Button onClick={printPdf} className="flex-1">
                <MSymbol name="print" className="text-[18px]" /> พิมพ์ใบแจ้งซ่อม (PDF)
              </Button>
              <Button variant="ghost" onClick={() => { reset(); onClose(); }}>
                ปิด
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Field label="อุปกรณ์ที่เกี่ยวข้อง (ถ้ามี)" htmlFor="rr-equipment">
              <select
                id="rr-equipment"
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
                className="glass-input w-full px-3 font-thai text-sm"
              >
                <option value="">— ไม่ระบุ —</option>
                {equipment.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name_th ?? e.code}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="สาเหตุ / อาการที่พบ" required htmlFor="rr-cause">
              <Textarea
                id="rr-cause"
                rows={3}
                value={cause}
                onChange={(e) => setCause(e.target.value)}
                placeholder="เช่น เครื่องเติมอากาศ 2 มีเสียงดังผิดปกติ แล้วหยุดทำงาน"
              />
            </Field>
            <div className="flex gap-2 pt-1">
              <Button onClick={() => void submit()} loading={saving} className="flex-1">
                <MSymbol name="save" className="text-[18px]" /> บันทึกใบแจ้งซ่อม
              </Button>
              <Button variant="ghost" onClick={() => { reset(); onClose(); }}>
                ยกเลิก
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
