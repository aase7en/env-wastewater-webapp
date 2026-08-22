import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Primary: SOLID accent fill + on-accent text, hover darkens (light) or
  // brightens (dark) via --aura-accent-hover.
  //
  // Was `aura-bg-gradient`. That now resolves to the *surface* ramp, which
  // light mode deliberately keeps pale (#E2EFF4 → #45DAB1) — a primary CTA
  // filled with it reads as a disabled chip. The accent pair is also the
  // contrast-checked one: white on #006b5a ≈ 7.5:1, and on the hover shade
  // #005446 it is 8.91:1.
  primary:
    "bg-aura-cyan text-aura-onAccent font-semibold hover:bg-aura-accentHover hover:shadow-aura-glow-cyan active:scale-[0.98]",
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
  sm: "px-3.5 py-2 text-sm rounded-lg min-h-[var(--touch-min)]",
  md: "px-4 py-2.5 text-sm rounded-xl min-h-12",
  lg: "px-6 py-3 text-base rounded-xl min-h-[52px]",
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
        // Token-driven timing: --duration-base / --ease-smooth are the
        // system's "state switch" pair, and motion.css zeroes the duration
        // under prefers-reduced-motion, so this needs no media query.
        "inline-flex items-center justify-center gap-2 font-medium",
        "transition-all duration-[var(--duration-base)] ease-[var(--ease-smooth)]",
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
