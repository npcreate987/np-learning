"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
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

  // Apply a pending referral code (saved by the signup page from ?ref=...) once,
  // right after the profile first loads and only if the user isn't already
  // linked to a referrer. The guard prevents duplicate attempts per session.
  const referralAppliedRef = useRef(false);
  useEffect(() => {
    if (!profile || profile.referredById || referralAppliedRef.current) return;
    const code =
      typeof window !== "undefined" ? localStorage.getItem("np_ref_code") : null;
    if (!code) return;
    // Guard against duplicate attempts in this session. The code is only
    // removed from localStorage on success, so a transient network/5xx
    // failure doesn't permanently lose the referral — a page reload retries
    // (the guard resets with the ref on remount).
    referralAppliedRef.current = true;
    api
      .post("/referral/apply", { code }, true)
      .then(() => {
        if (typeof window !== "undefined") localStorage.removeItem("np_ref_code");
        return loadProfile(session);
      })
      .catch(() => {
        /* leave np_ref_code in place so it can retry after a reload */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

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
