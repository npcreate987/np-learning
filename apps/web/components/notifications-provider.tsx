"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { useAuth } from "./auth-provider";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NotifContextValue {
  unread: number;
  items: AppNotification[];
  toasts: AppNotification[];
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
  dismissToast: (id: string) => void;
}

const NotifContext = createContext<NotifContextValue | undefined>(undefined);

const POLL_MS = 20000;

/**
 * Polls the user's notifications while they're signed in, keeps a live unread
 * count for the bell badge, and pushes a toast for each notification that
 * arrives AFTER the provider mounted (so reopening the app doesn't replay old
 * notifications). The baseline is per-session on purpose.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState<AppNotification[]>([]);

  // baselineId = newest id seen at mount; only notifications newer than this
  // get toasted. didBaseline gates the first fetch so we don't toast the
  // notifications that were already there when the user opened the app.
  const baselineIdRef = useRef<string | null>(null);
  const didBaselineRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!profile) return;
    try {
      const [list, countRes] = await Promise.all([
        api.get<AppNotification[]>("/notifications?take=10", true),
        api.get<{ count: number }>("/notifications/unread-count", true),
      ]);
      setItems(list);
      setUnread(countRes.count);

      const newestId = list.length > 0 ? list[0].id : baselineIdRef.current;

      if (!didBaselineRef.current) {
        // First fetch of the session: record baseline, don't toast.
        didBaselineRef.current = true;
        baselineIdRef.current = newestId;
        return;
      }

      const baseline = baselineIdRef.current;
      const newOnes: AppNotification[] = [];
      for (const n of list) {
        // list is newest-first; stop once we reach the previous baseline.
        if (baseline && n.id === baseline) break;
        newOnes.push(n);
      }
      if (newOnes.length > 0) {
        setToasts((prev) => [...prev, ...newOnes]);
      }
      baselineIdRef.current = newestId;
    } catch {
      /* network/auth blip — retry on next tick */
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) {
      setItems([]);
      setUnread(0);
      setToasts([]);
      didBaselineRef.current = false;
      baselineIdRef.current = null;
      return;
    }
    refresh();
    const iv = setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(iv);
      window.removeEventListener("focus", onFocus);
    };
  }, [profile, refresh]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!profile) return;
    const prevUnread = unread;
    setUnread(0);
    setItems((all) => all.map((n) => ({ ...n, read: true })));
    try {
      await api.post("/notifications/read-all", undefined, true);
    } catch {
      setUnread(prevUnread);
    }
  }, [profile, unread]);

  return (
    <NotifContext.Provider
      value={{ unread, items, toasts, refresh, markAllRead, dismissToast }}
    >
      {children}
    </NotifContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotifContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
