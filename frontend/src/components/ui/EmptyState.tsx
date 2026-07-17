import { type ReactNode } from "react";
import { Inbox } from "lucide-react";

/** Friendly empty state with optional CTA — replaces plain "ไม่มีข้อมูล". */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl bg-aura-surfaceHigh/40 border border-aura-borderSubtle flex items-center justify-center text-aura-textMuted mb-4">
        {icon ?? <Inbox className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-semibold text-aura-textMain font-thai mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-aura-textMuted font-thai max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
