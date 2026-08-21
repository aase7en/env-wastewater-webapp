/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  // Dual theme (F1): `.dark` on <html> = Boost Aura dark, default = Luminous
  // Mint light. Values live in src/styles/tokens.css as CSS variables so the
  // same utility classes render correctly in both themes.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── UTH[AI]-ENV dual-theme tokens — see src/styles/tokens.css ──────
        // RGB-triplet vars keep Tailwind opacity modifiers working
        // (e.g. border-aura-cyan/40).
        aura: {
          cyan: "rgb(var(--aura-cyan) / <alpha-value>)",
          lime: "rgb(var(--aura-lime) / <alpha-value>)",
          cyanDim: "rgb(var(--aura-cyan-dim) / <alpha-value>)",
          limeDim: "rgb(var(--aura-lime-dim) / <alpha-value>)",
          bg: "rgb(var(--aura-bg) / <alpha-value>)",
          bgDeep: "rgb(var(--aura-bg-deep) / <alpha-value>)",
          surface: "rgb(var(--aura-surface) / <alpha-value>)",
          surfaceLow: "rgb(var(--aura-surface-low) / <alpha-value>)",
          surfaceHigh: "rgb(var(--aura-surface-high) / <alpha-value>)",
          surfaceHighest: "rgb(var(--aura-surface-highest) / <alpha-value>)",
          borderSubtle: "rgb(var(--aura-border-subtle) / <alpha-value>)",
          textMain: "rgb(var(--aura-text-main) / <alpha-value>)",
          textMuted: "rgb(var(--aura-text-muted) / <alpha-value>)",
          onSurface: "rgb(var(--aura-on-surface) / <alpha-value>)",
          // Full CSS values, not RGB triplets — these two must resolve
          // per-theme, so they cannot be literals. Trade-off: NO opacity
          // modifier (text-aura-onAccent/50 will not work).
          onAccent: "var(--aura-on-accent)",
          accentHover: "var(--aura-accent-hover)",
        },
        glass: {
          // Theme-aware glass fill (preferred) + fixed legacy fills.
          card: "var(--aura-glass)",
          dark: "rgba(0, 22, 27, 0.65)",
          white: "rgba(255, 255, 255, 0.70)", // Luminous Mint variant
        },
        // Literal hex, NOT var() — Tailwind can only inject an alpha channel
        // into a literal, and `bg-alert-amber/15` / `border-alert-amber/40`
        // are both in use. Mirrored as --alert-* in styles/tokens.css for
        // hand-written CSS; keep the two in sync.
        alert: { amber: "#f59e0b", red: "#ef4444", green: "#22c55e" },
        // PFD flow-line legend (design/ui-brief.md §1): 🔵 water ⚪ air
        // 🟤 sludge. Operators read the diagram by these, so no accent change
        // may repurpose them.
        // var() not literals — FLOW-1 made --flow-air theme-scoped (white on
        // the dark plant background, slate on the light page, where white was
        // invisible). Trade-off: no opacity modifier on these three.
        flow: {
          water: "var(--flow-water)",
          air: "var(--flow-air)",
          sludge: "var(--flow-sludge)",
        },
        // ── Legacy PFD palette (pre-Aura) — kept only for old stories/tests;
        // do not use in new code.
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
      },
      fontFamily: {
        // Plus Jakarta Sans = Aura display/body; IBM Plex Sans Thai = Thai fallback
        // (Plus Jakarta has no Thai glyphs — wrap Thai strings to fall through).
        display: ['"Plus Jakarta Sans"', '"IBM Plex Sans Thai"', "system-ui", "sans-serif"],
        body: ['"Plus Jakarta Sans"', '"IBM Plex Sans Thai"', "system-ui", "sans-serif"],
        thai: ['"IBM Plex Sans Thai"', '"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      // WO-UX-SCALE-001: the shipped pages use Tailwind's text-* utilities,
      // so bind the common sizes to the in-app type tokens instead of leaving
      // the design tokens disconnected from the rendered interface.
      fontSize: {
        xs: ["var(--text-ui-sm)", { lineHeight: "1.5" }],
        sm: ["var(--text-ui)", { lineHeight: "1.55" }],
        base: ["var(--text-app-base)", { lineHeight: "1.6" }],
        lg: ["var(--text-card-value)", { lineHeight: "1.45" }],
        xl: ["var(--text-card-title)", { lineHeight: "1.35" }],
        "2xl": ["var(--text-page-title)", { lineHeight: "1.25" }],
        "3xl": ["var(--text-page-title-md)", { lineHeight: "1.2" }],
      },
      borderRadius: {
        aura: "24px", // primary card radius (suite glass-card spec)
      },
      boxShadow: {
        // Theme-aware elevations (values in tokens.css)
        "aura-card": "var(--aura-card-shadow)",
        "aura-glow-cyan": "var(--aura-glow-cyan)",
        "aura-glow-lime": "var(--aura-glow-lime)",
        "aura-glow-red": "var(--aura-glow-red)",
      },
      animation: {
        // PFD
        "flow": "flow 3s linear infinite",
        "bubble": "bubble 2s ease-in infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "gauge-fill": "gauge-fill 0.8s ease-out forwards",
        // Aura Edition
        "aura-rotate": "aura-rotate 4s linear infinite",
        "aura-pulse-dot": "aura-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      // WARNING: a keyframe declared here is emitted ONLY if the matching
      // `animate-*` utility appears in the content scan. Everything below is
      // driven from hand-written CSS instead, so these entries produced no
      // output at all — aura-rotate/flow/bubble/aura-pulse are therefore
      // ALSO declared in src/index.css, which is what actually runs. Keep
      // both copies in sync. (`gauge-fill` and `pulse-slow` have no consumer
      // in src/ at all — left here rather than deleted in case a utility
      // wants them, but they render nothing today.)
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
