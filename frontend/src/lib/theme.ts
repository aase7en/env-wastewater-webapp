// Dual-theme controller (F1). The inline script in index.html applies the
// initial class before first paint; this module handles runtime switching.
// Owned by Track F (visual layer) — see MIGRATION.md "Two-track F/Z".

export type Theme = "dark" | "light";

const STORAGE_KEY = "theme";

export function getStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch {
    return null;
  }
}

/** Stored preference, else the OS preference. */
export function getActiveTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private mode etc. — theme still applies for this page load.
  }
}

export function toggleTheme(): Theme {
  const next: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
  applyTheme(next);
  return next;
}
