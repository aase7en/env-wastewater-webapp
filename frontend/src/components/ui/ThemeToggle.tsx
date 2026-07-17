import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getActiveTheme, toggleTheme, type Theme } from "../../lib/theme";
import { cn } from "../../lib/utils";

/**
 * Dark/Light switch (F1). Dark = Boost Aura, light = Luminous Mint.
 * Icon shows the theme you'd switch TO, label kept for screen readers.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(() => getActiveTheme());
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(toggleTheme())}
      aria-label={next === "dark" ? "สลับเป็นโหมดมืด" : "สลับเป็นโหมดสว่าง"}
      title={next === "dark" ? "โหมดมืด (Aura)" : "โหมดสว่าง (Luminous Mint)"}
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-xl border transition-all",
        "border-aura-borderSubtle text-aura-textMuted",
        "hover:text-aura-cyan hover:border-aura-cyan/40 hover:shadow-aura-glow-cyan",
        className
      )}
    >
      {next === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
