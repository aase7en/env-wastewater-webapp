import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

/** Glass input. Pair with <Field> for label + unit. */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input ref={ref} className={cn("glass-input px-3 w-full", className)} {...rest} />
  )
);
Input.displayName = "Input";

/** Numeric input — opens decimal keypad on mobile. */
export const NumberInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...rest }, ref) => (
  <input
    ref={ref}
    type="number"
    inputMode="decimal"
    step="any"
    className={cn("glass-input px-3 w-full font-mono", className)}
    {...rest}
  />
));
NumberInput.displayName = "NumberInput";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...rest }, ref) => (
  <textarea ref={ref} className={cn("glass-input px-3 py-2 w-full", className)} {...rest} />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...rest }, ref) => (
  <select ref={ref} className={cn("glass-input px-3 pr-8 w-full", className)} {...rest}>
    {children}
  </select>
));
Select.displayName = "Select";

/**
 * Field wrapper — label + optional unit + hint + error.
 * Keeps consistent spacing across all form fields.
 */
export function Field({
  label,
  unit,
  hint,
  error,
  required,
  htmlFor,
  children,
}: {
  label: string;
  unit?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="flex items-baseline gap-1.5 text-sm font-medium text-aura-textMain">
        <span className="font-thai">{label}</span>
        {required && <span className="text-alert-red">*</span>}
        {unit && <span className="text-xs text-aura-textMuted font-mono">({unit})</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-aura-textMuted font-thai">{hint}</p>}
      {error && <p className="text-xs text-alert-red font-thai">{error}</p>}
    </div>
  );
}
