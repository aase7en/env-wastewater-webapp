import { useEffect, useState } from "react";
import { getActiveTheme, type Theme } from "./theme";

/**
 * Re-render subscriber for the active theme (F2). Use in components that
 * resolve token colors imperatively (cssVar/cssVarRGB) — e.g. Recharts —
 * so they pick up new values when the user toggles dark/light.
 */
export function useAuraTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() => getActiveTheme());
  useEffect(() => {
    const onChange = () => setTheme(getActiveTheme());
    window.addEventListener("aura-theme", onChange);
    return () => window.removeEventListener("aura-theme", onChange);
  }, []);
  return theme;
}
