import { type ReactNode } from "react";
import { cn } from "../../lib/utils";

/**
 * Toggle switch — equipment checklist (10 booleans) + system_operating +
 * wastewater_discharged. Cyan/lime neon when ON, idle outline when OFF.
 *
 * Accessible: wraps a hidden checkbox + role="switch" + aria-checked.
 * ≥44px touch target via the label wrapper.
 */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean | null;
  onChange: (next: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  const isOn = checked === true;
  return (
    <label
      className={cn(
        "flex items-center gap-3 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={isOn}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-checked={isOn}
        role="switch"
      />
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          isOn
            ? "bg-gradient-to-r from-aura-cyan to-aura-lime shadow-aura-glow-cyan"
            : "bg-aura-surfaceHigh border border-aura-borderSubtle"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            isOn ? "translate-x-6" : "translate-x-1"
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-aura-textMain font-thai">{label}</span>
        {description && (
          <span className="block text-xs text-aura-textMuted font-thai">{description}</span>
        )}
      </span>
    </label>
  );
}
