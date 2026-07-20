import { type ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

/**
 * Auth context — exposes the Supabase session + helper methods.
 *
 * Wraps the whole app in main.tsx so any component can call useAuth()
 * instead of importing supabase directly. Session changes auto-propagate
 * via onAuthStateChange (covers login/logout/OAuth-redirect/token refresh).
 *
 * `appUser` is the role-bearing row in core.app_user (1:1 with auth.users).
 * It is fetched lazily — null until the lookup resolves.
 *
 * AUTH-1 (2026-07-20): `loading` stays true until BOTH the initial session
 * check completes AND — if a session exists — the matching appUser lookup
 * resolves. Otherwise RequireAuth would see isAuthenticated=false
 * momentarily on hard refresh and bounce to /login despite a valid session.
 */
interface AppUserRow {
  id: string;
  role: "admin" | "staff";
  display_name: string | null;
  /** AUTH-2: account-active flag — false means the account was disabled
   *  (left the unit, suspended). Treat as not-authenticated upstream. */
  is_active: boolean;
}

interface AuthContextValue {
  /** Supabase session — null when logged out, set when logged in. */
  session: Session | null;
  /** auth.users row — null when logged out. */
  user: User | null;
  /** core.app_user row (carries role) — null until lookup completes. */
  appUser: AppUserRow | null;
  /** True until the initial session check completes. */
  loading: boolean;
  /** Convenience: authenticated AND appUser loaded. */
  isAuthenticated: boolean;
  /** True iff appUser.role === "admin". */
  isAdmin: boolean;
  /** Email/password helpers — return {error} on failure. */
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  /** OAuth — kicks off the provider redirect. */
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithLine: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Public URL for OAuth redirects — origin + /auth/callback hash route. */
function redirectURL(): string {
  // Vite dev: http://localhost:5173/auth/callback
  // GitHub Pages: https://<user>.github.io/<repo>/auth/callback
  const origin = window.location.origin;
  const path = import.meta.env.BASE_URL || "/";
  return `${origin}${path === "/" ? "" : path}/auth/callback`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUserRow | null>(null);
  // AUTH-1: two loading flags — session check (fast, always runs once) and
  // appUser lookup (slow, only runs when a session exists). The combined
  // `loading` exposed to consumers is true until BOTH have settled, so
  // RequireAuth does not see a momentary false-negative isAuthenticated.
  const [sessionLoading, setSessionLoading] = useState(true);
  const [appUserLoading, setAppUserLoading] = useState(false);
  // Tracks the latest userId we kicked off a lookup for, so a stale lookup
  // (session changed mid-flight) does not overwrite the in-flight value.
  const latestUserIdRef = useRef<string | undefined>(undefined);

  // Fetch the role-bearing core.app_user row for the current auth.users.id.
  //
  // AUTH-2 (2026-07-19): previous query was broken — it filtered on
  // `auth_user_id` (no such column; the FK is on `id` directly) and selected
  // `display_name` before the column existed. PostgREST returned PGRST204,
  // catch → setAppUser(null) → isAuthenticated=false → login bounced back
  // to /login every time despite a valid session. Now matches schema.
  const loadAppUser = async (userId: string | undefined) => {
    latestUserIdRef.current = userId;
    if (!userId) {
      setAppUser(null);
      return;
    }
    setAppUserLoading(true);
    try {
      const { data, error } = await supabase
        .from("app_user")
        .select("id, role, display_name, is_active")
        .eq("id", userId)
        .maybeSingle();
      // Stale guard: a newer lookup may have started while we were awaiting.
      if (latestUserIdRef.current !== userId) return;
      if (error) {
        // PGRST204 (schema mismatch) or RLS deny — both mean we can't trust
        // isAuthenticated. Surface the message for debugging.
        console.warn("app_user lookup failed:", error.code, error.message);
        setAppUser(null);
      } else if (data && data.is_active === false) {
        // AUTH-2: account explicitly disabled — treat as not-authenticated.
        console.warn("app_user is_active=false:", data.id);
        setAppUser(null);
      } else {
        setAppUser(data as AppUserRow | null);
      }
    } finally {
      if (latestUserIdRef.current === userId) setAppUserLoading(false);
    }
  };

  useEffect(() => {
    // Initial load: pick up any existing session.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadAppUser(data.session?.user.id);
      setSessionLoading(false);
    });

    // Subscribe to subsequent auth state changes.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      void loadAppUser(newSession?.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Combined loading: true while session is being checked, OR while we have
  // a session but the matching appUser lookup hasn't resolved yet.
  const loading = sessionLoading || (!!session && appUserLoading);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      appUser,
      loading,
      isAuthenticated: !!session && !!appUser,
      isAdmin: appUser?.role === "admin",

      async signInWithEmail(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },

      async signUpWithEmail(email, password) {
        const { error } = await supabase.auth.signUp({ email, password });
        return { error: error?.message ?? null };
      },

      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectURL(),
        });
        return { error: error?.message ?? null };
      },

      async signInWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: redirectURL() },
        });
        return { error: error?.message ?? null };
      },

      async signInWithLine() {
        // LINE is not a built-in Supabase provider (only google/apple/azure/
        // facebook/kakao/etc. are). It must be registered in the Supabase
        // dashboard as a custom OIDC provider named "line" — then referenced
        // with the `custom:` prefix here.
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "custom:line",
          options: { redirectTo: redirectURL() },
        });
        return { error: error?.message ?? null };
      },

      async signOut() {
        await supabase.auth.signOut();
        setAppUser(null);
      },
    }),
    [session, appUser, sessionLoading, appUserLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Convenience hook — throws if used outside AuthProvider. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
