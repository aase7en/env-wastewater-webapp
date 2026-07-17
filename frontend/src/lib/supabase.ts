import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client — single shared instance.
 *
 * Uses the publishable/anon key (RLS-gated, safe to embed in the client
 * build). The service_role key is NEVER shipped to the browser — it lives
 * only in Edge Functions / SQL.
 *
 * Vite exposes VITE_* env vars at build time. For GitHub Pages deploys,
 * these are baked into the static bundle (still safe — RLS is the real
 * gate, not key secrecy).
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fail loud at module load rather than silently hitting an unconfigured client.
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy frontend/.env.example to frontend/.env"
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    // Persist session in localStorage so a refresh keeps you logged in.
    persistSession: true,
    // Auto-refresh tokens before they expire.
    autoRefreshToken: true,
    // Detect session from URL hash (OAuth redirect callback).
    detectSessionInUrl: true,
  },
});

/** Typed wrapper for the publishable env values (useful for debug + tests). */
export const supabaseConfig = { url, anonKey };
