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
        // min-h-[--touch-min] matters here specifically: this is the control
        // staff tap 10+ times per reading, on a phone, standing at the pond.
        // The switch itself is only 24px tall, so without this the row was
        // under the 44px target.
        "flex items-center gap-3 cursor-pointer select-none min-h-[var(--touch-min)]",
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
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full",
          "transition-colors duration-[var(--duration-switch)] ease-[var(--ease-smooth)]",
          // ON keeps the accent gradient rather than the design's
          // var(--aura-gradient). That token is the SURFACE ramp, which light
          // mode holds deliberately pale (#E2EFF4 → #45DAB1) — the white knob
          // sits at the right-hand stop and would drop to ~1.9:1 against it.
          // cyan→lime reads correctly in both themes.
          isOn
            ? "bg-gradient-to-r from-aura-cyan to-aura-lime shadow-aura-glow-cyan"
            : "bg-aura-surfaceHigh border border-aura-borderSubtle"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white",
            "transition-transform duration-[var(--duration-switch)] ease-[var(--ease-smooth)]",
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
