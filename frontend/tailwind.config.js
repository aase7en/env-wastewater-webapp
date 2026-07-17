/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  // Aura Edition = dark default; "light" class opts into Luminous Mint variant later.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── UTH[AI]-EVN Aura Edition (dark, locked 2026-07-17) ──────────────
        // Primary design system; P10.6+ builds against this. See
        // design/uth_ai_evn_system_design_aura_edition.md + design/DESIGN.md.
        aura: {
          // Neon accents — the "Aura"
          cyan: "#00F0FF",     // primary neon
          lime: "#CCFF00",     // secondary neon
          cyanDim: "#00DBE9",  // primary-fixed-dim
          limeDim: "#ABD600",  // secondary-fixed-dim
          // Deep teal foundation
          bg: "#00161B",             // background
          bgDeep: "#03181C",         // background-deep (floor)
          surface: "#092429",        // raised card fill (opaque fallback)
          surfaceLow: "#041F24",
          surfaceHigh: "#142E33",
          surfaceHighest: "#1F383E",
          borderSubtle: "#13383E",
          // Text
          textMain: "#FFFFFF",
          textMuted: "#A1B5BB",
          onSurface: "#CCE7EE",
        },
        glass: {
          // Glassmorphism fills (rgba) — use with backdrop-blur
          dark: "rgba(0, 22, 27, 0.65)",
          white: "rgba(255, 255, 255, 0.70)", // Luminous Mint variant
        },
        // ── Legacy PFD palette (P10.1-4 dashboard) — kept until P10.7 migration
        teal: {
          50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4",
          400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e",
          800: "#115e59", 900: "#134e4a", 950: "#042f2e",
        },
        navy: {
          50: "#f8fafc", 100: "#f1f5f9", 500: "#475569",
          700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617",
        },
        water: {
          100: "#e0f2fe", 300: "#7dd3fc", 500: "#0ea5e9",
          600: "#0284c7", 700: "#0369a1",
        },
        alert: { amber: "#f59e0b", red: "#ef4444", green: "#22c55e" },
      },
      fontFamily: {
        // Plus Jakarta Sans = Aura display/body; IBM Plex Sans Thai = Thai fallback
        // (Plus Jakarta has no Thai glyphs — wrap Thai strings to fall through).
        display: ['"Plus Jakarta Sans"', '"IBM Plex Sans Thai"', "system-ui", "sans-serif"],
        body: ['"Plus Jakarta Sans"', '"IBM Plex Sans Thai"', "system-ui", "sans-serif"],
        thai: ['"IBM Plex Sans Thai"', '"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        aura: "24px", // primary card radius (DESIGN.md rounded-lg = 1.5rem here)
      },
      boxShadow: {
        // 3D elevation for floating cards above the deep-teal floor
        "aura-card":
          "inset 0 1px 1px rgba(255,255,255,0.10), inset 0 -1px 1px rgba(0,0,0,0.30), 0 10px 30px rgba(0,0,0,0.50)",
        "aura-glow-cyan": "0 0 20px rgba(0,240,255,0.35)",
        "aura-glow-lime": "0 0 20px rgba(204,255,0,0.30)",
        "aura-glow-red": "0 0 18px rgba(239,68,68,0.55)",
      },
      animation: {
        // PFD (legacy)
        "flow": "flow 3s linear infinite",
        "bubble": "bubble 2s ease-in infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "gauge-fill": "gauge-fill 0.8s ease-out forwards",
        // Aura Edition
        "aura-rotate": "aura-rotate 4s linear infinite",
        "aura-pulse-dot": "aura-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        flow: { "0%": { strokeDashoffset: "20" }, "100%": { strokeDashoffset: "0" } },
        bubble: {
          "0%": { transform: "translateY(0) scale(0.5)", opacity: "0" },
          "30%": { opacity: "0.8" },
          "100%": { transform: "translateY(-40px) scale(1)", opacity: "0" },
        },
        "gauge-fill": { "0%": { strokeDashoffset: "251" } },
        // Rotating conic-gradient border (masked ::before) — see .aura-card in index.css
        "aura-rotate": { to: { "--aura-angle": "360deg" } },
        "aura-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.1)" },
        },
      },
    },
  },
  plugins: [],
};
