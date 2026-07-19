import { cn } from "../../lib/utils";

interface StatusBadgeProps {
  /**
   * Whether the system is operating normally.
   *   null/undefined = unknown (grey "—")
   *   true  = operating normally (green "ปกติ")
   *   false = abnormal          (red "ผิดปกติ" + glow)
   *
   * STAT-1 (2026-07-20): renamed from `status` (alert semantics: true =
   * abnormal) to `operating` (system semantics: true = normal). The 3
   * callsites passing `row.system_operating` (system semantics) can now
   * pass it straight through; the EquipmentPage callsite (which genuinely
   * has alert semantics — "มีการแจ้งซ่อม") negates at the call site.
   */
  operating: boolean | null | undefined;
  label?: string;
}

/** Traffic-light indicator: green (normal), red (abnormal), grey (unknown). */
export function StatusBadge({ operating, label }: StatusBadgeProps) {
  const color =
    operating === null || operating === undefined
      ? "bg-slate-300 text-slate-600"
      : operating === true
        ? "bg-alert-green text-white"
        : "bg-alert-red text-white status-glow-red";
  const text = label ?? (operating === null ? "—" : operating ? "ปกติ" : "ผิดปกติ");
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", color)}>
      {text}
    </span>
  );
}
