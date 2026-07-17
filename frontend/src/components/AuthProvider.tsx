import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
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
 */
interface AppUserRow {
  id: string;
  role: "admin" | "staff";
  display_name: string | null;
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
  const [loading, setLoading] = useState(true);

  // Fetch the role-bearing core.app_user row for the current auth.users.id.
  const loadAppUser = async (userId: string | undefined) => {
    if (!userId) {
      setAppUser(null);
      return;
    }
    const { data, error } = await supabase
      .from("app_user")
      .select("id, role, display_name")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (error) {
      // Most likely RLS — user has an auth.users row but no core.app_user yet.
      console.warn("app_user lookup failed:", error.message);
      setAppUser(null);
    } else {
      setAppUser(data as AppUserRow | null);
    }
  };

  useEffect(() => {
    // Initial load: pick up any existing session.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadAppUser(data.session?.user.id);
      setLoading(false);
    });

    // Subscribe to subsequent auth state changes.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      void loadAppUser(newSession?.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

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
    [session, appUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Convenience hook — throws if used outside AuthProvider. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
