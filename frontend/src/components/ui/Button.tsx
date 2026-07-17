import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Primary: cyan→lime gradient, deep-teal text (max contrast per DESIGN.md).
  primary:
    "aura-bg-gradient font-semibold hover:shadow-aura-glow-cyan active:scale-[0.98]",
  // Secondary: outlined, neon cyan border on translucent surface.
  secondary:
    "bg-transparent border border-aura-cyan/60 text-aura-cyan hover:bg-aura-cyan/10 hover:shadow-aura-glow-cyan",
  // Danger: red glow (used for delete — admin only).
  danger:
    "bg-alert-red/15 border border-alert-red text-alert-red hover:bg-alert-red/25 hover:shadow-aura-glow-red",
  // Ghost: no border, just muted text (cancel links).
  ghost: "bg-transparent text-aura-textMuted hover:text-aura-textMain hover:bg-aura-textMain/5",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg min-h-[36px]",
  md: "px-4 py-2.5 text-sm rounded-xl min-h-[44px]",
  lg: "px-6 py-3 text-base rounded-xl min-h-[48px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
