import { type ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Custom-styled accordion (controlled via the section's own open state).
 * One section open at a time? No — multiple can be open at once so the
 * operator can review all sections before submitting. Custom state (not
 * native <details>) so we can drive the chevron + the Aura border glow.
 */
export function AccordionSection({
  title,
  subtitle,
  defaultOpen = false,
  errorCount,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  errorCount?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      className={cn(
        "rounded-aura border overflow-hidden transition-colors",
        open
          ? "bg-aura-bg/70 border-aura-cyan/30 backdrop-blur-xl"
          : "bg-aura-bg/40 border-aura-borderSubtle backdrop-blur-md hover:border-aura-cyan/20"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-aura-textMain font-thai flex items-center gap-2">
            {title}
            {errorCount && errorCount > 0 ? (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full bg-alert-red/20 text-alert-red border border-alert-red/50">
                {errorCount}
              </span>
            ) : null}
          </h3>
          {subtitle && (
            <p className="text-xs text-aura-textMuted font-thai mt-0.5">{subtitle}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-aura-textMuted transition-transform shrink-0",
            open && "rotate-180 text-aura-cyan"
          )}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-aura-borderSubtle/50">
          {children}
        </div>
      )}
    </section>
  );
}
