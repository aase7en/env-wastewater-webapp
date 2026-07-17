import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
//
// P12: the frontend now talks to Supabase directly via lib/supabase.ts;
// no FastAPI proxy needed. The proxy block below is retained but inert —
// it only matters if someone runs the legacy FastAPI locally (optional,
// see docs/adr/0004-supabase-first-no-fastapi-in-prod.md).
//
// For GitHub Pages deploys (P13), base must match the repo subpath:
// https://<user>.github.io/env-wastewater-webapp/ → base '/env-wastewater-webapp/'
// Vite reads this from GH_PAGES_BASE in CI; defaults to '/' for dev.
const base = process.env.GH_PAGES_BASE || '/'

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Legacy: only used if the developer runs uvicorn alongside (optional).
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
