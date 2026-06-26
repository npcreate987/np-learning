"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "@app/shared";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(active: Session | null) {
    if (!active) {
      setProfile(null);
      return;
    }
    try {
      const me = await api.get<Profile>("/auth/me", true);
      setProfile(me);
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    let mounted = true;

    // Dev demo mode: a local token stands in for a Supabase session.
    const devToken =
      typeof window !== "undefined" ? localStorage.getItem("np_dev_token") : null;
    if (devToken) {
      const fakeSession = { access_token: devToken } as unknown as Session;
      setSession(fakeSession);
      loadProfile(fakeSession).finally(() => {
        if (mounted) setLoading(false);
      });
      return () => {
        mounted = false;
      };
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      if (!mounted) return;
      setSession(next);
      await loadProfile(next);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    profile,
    loading,
    refreshProfile: () => loadProfile(session),
    signOut: async () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("np_dev_token");
      }
      await supabase.auth.signOut().catch(() => {});
      setProfile(null);
      setSession(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
