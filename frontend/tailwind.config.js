/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Clinical-teal base + deep navy + water blues (PFD theme)
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
        alert: {
          amber: "#f59e0b", red: "#ef4444", green: "#22c55e",
        },
      },
      fontFamily: {
        // Distinctive display fonts (not Inter) + Thai support
        display: ['"Sora"', "system-ui", "sans-serif"],
        body: ['"IBM Plex Sans Thai"', '"Sora"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      animation: {
        // PFD: water flow + bubble rise + pulse
        "flow": "flow 3s linear infinite",
        "bubble": "bubble 2s ease-in infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "gauge-fill": "gauge-fill 0.8s ease-out forwards",
      },
      keyframes: {
        flow: {
          "0%": { strokeDashoffset: "20" },
          "100%": { strokeDashoffset: "0" },
        },
        bubble: {
          "0%": { transform: "translateY(0) scale(0.5)", opacity: "0" },
          "30%": { opacity: "0.8" },
          "100%": { transform: "translateY(-40px) scale(1)", opacity: "0" },
        },
        "gauge-fill": {
          "0%": { strokeDashoffset: "251" },
        },
      },
    },
  },
  plugins: [],
};
