/**
 * MOD-CH — Chemical sub-store page skeleton.
 * Master catalog + movement log. Balance auto-recomputed by trigger.
 */
import { useState } from "react";
import { useToast } from "../components/ui/Toast";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Input, NumberInput, Field, Select, Textarea } from "../components/ui/Input";
import {
  useChemicalStock, useChemicalMovements, useLowStockChemicals,
  createChemicalMaster, createChemicalMovement,
  deleteChemicalMaster, deleteChemicalMovement,
  type ChemicalMasterInput, type ChemicalMovementInput,
} from "../lib/chemical";

const NUM = (v: string) => (v === "" ? null : Number(v));

export function ChemicalPage() {
  const stock = useChemicalStock();
  const moves = useChemicalMovements(50);
  const lowStock = useLowStockChemicals();
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);

  const [master, setMaster] = useState<ChemicalMasterInput>({
    name: "", cas_no: null, hazard_class: null, unit: "kg",
    reorder_point: null, is_active: true,
  });
  const [move, setMove] = useState<ChemicalMovementInput>({
    movement_date: today, chemical_name: "", direction: "in", quantity: 0,
    unit: "kg", balance_after: null, purpose: null, lot_no: null,
    expiry_date: null, supplier: null, unit_cost: null, master_id: null, note: null,
  });
  const setM = (patch: Partial<ChemicalMasterInput>) => setMaster({ ...master, ...patch });
  const setV = (patch: Partial<ChemicalMovementInput>) => setMove({ ...move, ...patch });

  async function addMaster() {
    try { await createChemicalMaster(master); toast("success", "เพิ่มเคมีใหม่"); stock.refresh(); }
    catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }
  async function addMove() {
    try { await createChemicalMovement(move); toast("success", "บันทึกการเคลื่อนไหว"); moves.refresh(); stock.refresh(); }
    catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }
  async function removeMaster(id: string) {
    if (!confirm("ลบเคมีนี้? จะไม่ลบ movement history")) return;
    try { await deleteChemicalMaster(id); toast("success", "ลบแล้ว"); stock.refresh(); } catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }
  async function removeMove(id: string) {
    if (!confirm("ลบ movement?")) return;
    try { await deleteChemicalMovement(id); toast("success", "ลบแล้ว"); moves.refresh(); stock.refresh(); } catch (e) { toast("error", `ผิดพลาด: ${(e as Error).message}`); }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
            <span className="text-aura-textMain">คลัง</span>
            <span className="aura-text-gradient">เคมี</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            ต้นแบบ / รับเข้า / เบิกออก — ยอดคงคลัง + การเคลื่อนไหว
          </p>
        </div>
      </header>

      {lowStock.data.length > 0 && (
        <AuraCard className="p-4 border-l-4 border-yellow-400">
          <p className="font-thai">⚠️ เคมีใกล้หมด ({lowStock.data.length}):</p>
          <ul className="text-sm list-disc pl-6">
            {lowStock.data.map((c) => (
              <li key={c.id}>{c.name}: {c.current_balance} {c.unit} (ต่ำกว่า {c.reorder_point})</li>
            ))}
          </ul>
        </AuraCard>
      )}

      <AuraCard className="p-4 space-y-3">
        <h2 className="text-lg font-semibold font-thai">เพิ่มเคมีใหม่ใน catalog</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="ชื่อ"><Input value={master.name} onChange={(e) => setM({ name: e.target.value })} /></Field>
          <Field label="CAS No."><Input value={master.cas_no ?? ""} onChange={(e) => setM({ cas_no: e.target.value || null })} /></Field>
          <Field label="Hazard class"><Input value={master.hazard_class ?? ""} onChange={(e) => setM({ hazard_class: e.target.value || null })} /></Field>
          <Field label="หน่วย"><Input value={master.unit} onChange={(e) => setM({ unit: e.target.value })} /></Field>
          <Field label="Reorder point"><NumberInput value={master.reorder_point ?? ""} onChange={(e) => setM({ reorder_point: NUM(e.target.value) })} /></Field>
        </div>
        <Button onClick={addMaster}>เพิ่ม</Button>
      </AuraCard>

      <AuraCard className="p-4 space-y-3">
        <h2 className="text-lg font-semibold font-thai">บันทึกรับเข้า / จ่ายออก</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="วันที่"><Input type="date" value={move.movement_date} onChange={(e) => setV({ movement_date: e.target.value })} /></Field>
          <Field label="ชื่อเคมี"><Input value={move.chemical_name} onChange={(e) => setV({ chemical_name: e.target.value })} /></Field>
          <Field label="ทิศทาง">
            <Select value={move.direction} onChange={(e) => setV({ direction: e.target.value as "in" | "out" })}>
              <option value="in">รับเข้า</option><option value="out">จ่ายออก</option>
            </Select>
          </Field>
          <Field label="จำนวน"><NumberInput value={move.quantity} onChange={(e) => setV({ quantity: NUM(e.target.value) ?? 0 })} /></Field>
          <Field label="หน่วย"><Input value={move.unit} onChange={(e) => setV({ unit: e.target.value })} /></Field>
          <Field label="Lot No."><Input value={move.lot_no ?? ""} onChange={(e) => setV({ lot_no: e.target.value || null })} /></Field>
          <Field label="วันหมดอายุ"><Input type="date" value={move.expiry_date ?? ""} onChange={(e) => setV({ expiry_date: e.target.value || null })} /></Field>
          <Field label="Supplier"><Input value={move.supplier ?? ""} onChange={(e) => setV({ supplier: e.target.value || null })} /></Field>
          <Field label="ต้นทุน/หน่วย (บาท)"><NumberInput value={move.unit_cost ?? ""} onChange={(e) => setV({ unit_cost: NUM(e.target.value) })} /></Field>
        </div>
        <Field label="วัตถุประสงค์"><Textarea value={move.purpose ?? ""} onChange={(e) => setV({ purpose: e.target.value || null })} rows={2} /></Field>
        <Button onClick={addMove}>บันทึก</Button>
      </AuraCard>

      <AuraCard className="p-4">
        <h2 className="text-lg font-semibold mb-3 font-thai">สต็อกปัจจุบัน</h2>
        {stock.loading ? <TableSkeleton rows={5} cols={5} /> : (
          <table className="w-full text-sm">
            <thead><tr><th className="text-left p-2">ชื่อ</th><th className="text-right p-2">คงเหลือ</th><th className="text-right p-2">Reorder</th><th className="text-left p-2">หน่วย</th><th></th></tr></thead>
            <tbody>
              {stock.data.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.name}</td>
                  <td className="text-right p-2">{c.current_balance}</td>
                  <td className="text-right p-2">{c.reorder_point ?? "-"}</td>
                  <td className="p-2">{c.unit}</td>
                  <td className="p-2"><button onClick={() => removeMaster(c.id)} className="text-red-400 hover:underline font-thai">ลบ</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AuraCard>

      <AuraCard className="p-4">
        <h2 className="text-lg font-semibold mb-3 font-thai">ประวัติการเคลื่อนไหว (50 ล่าสุด)</h2>
        {moves.loading ? <TableSkeleton rows={5} cols={6} /> : (
          <table className="w-full text-sm">
            <thead><tr><th className="text-left p-2">วันที่</th><th className="text-left p-2">เคมี</th><th className="text-left p-2">ทิศ</th><th className="text-right p-2">จำนวน</th><th className="text-left p-2">วัตถุประสงค์</th><th></th></tr></thead>
            <tbody>
              {moves.data.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-2">{m.movement_date}</td>
                  <td className="p-2">{m.chemical_name}</td>
                  <td className="p-2">{m.direction === "in" ? "↘ รับเข้า" : "↗ จ่ายออก"}</td>
                  <td className="text-right p-2">{m.quantity}</td>
                  <td className="p-2">{m.purpose ?? "-"}</td>
                  <td className="p-2"><button onClick={() => removeMove(m.id)} className="text-red-400 hover:underline font-thai">ลบ</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AuraCard>
    </div>
  );
}
