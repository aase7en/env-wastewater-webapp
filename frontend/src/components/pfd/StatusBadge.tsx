import { cn } from "../../lib/utils";

interface StatusBadgeProps {
  /** null = unknown, true = abnormal, false = normal. */
  status: boolean | null | undefined;
  label?: string;
}

/** Traffic-light indicator: green (normal), red (abnormal), grey (unknown). */
export function StatusBadge({ status, label }: StatusBadgeProps) {
  const color =
    status === null || status === undefined
      ? "bg-slate-300 text-slate-600"
      : status === false
        ? "bg-alert-green text-white"
        : "bg-alert-red text-white status-glow-red";
  const text = label ?? (status === null ? "—" : status ? "ผิดปกติ" : "ปกติ");
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", color)}>
      {text}
    </span>
  );
}
