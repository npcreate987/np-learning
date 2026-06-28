"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import type { Notification } from "@app/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Notification[]>("/notifications", true);
      setItems(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "โหลดการแจ้งเตือนไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!profile) {
      setLoading(false);
      return;
    }
    load();
  }, [authLoading, profile, load]);

  async function markRead(id: string) {
    // Optimistic update so the UI feels instant.
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await api.patch(`/notifications/${id}/read`, undefined, true);
    } catch {
      // Revert on failure.
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
      );
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    const prev = items;
    setItems((all) => all.map((n) => ({ ...n, read: true })));
    try {
      await api.post("/notifications/read-all", undefined, true);
    } catch {
      setItems(prev);
    } finally {
      setMarkingAll(false);
    }
  }

  if (authLoading || loading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />;
  }

  if (!profile) {
    return <p className="py-10 text-center text-slate-500">กรุณาเข้าสู่ระบบ</p>;
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">การแจ้งเตือน</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unread > 0 ? `ยังไม่อ่าน ${unread} รายการ` : "อ่านครบแล้ว"}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={markingAll}>
            <CheckCheck size={16} />
            {markingAll ? "กำลังอ่าน..." : "อ่านทั้งหมด"}
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && items.length === 0 && (
        <Card className="p-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Bell size={22} />
          </span>
          <p className="mt-3 text-sm text-slate-500">ยังไม่มีการแจ้งเตือน</p>
        </Card>
      )}

      <div className="space-y-2">
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => !n.read && markRead(n.id)}
            className={cn(
              "block w-full rounded-2xl border p-4 text-left transition",
              n.read
                ? "border-slate-100 bg-white"
                : "border-brand-200 bg-brand-50/60 hover:bg-brand-50",
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  n.read ? "bg-transparent" : "bg-brand-600",
                )}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">{n.title}</p>
                <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(n.createdAt).toLocaleString("th-TH")}
                </p>
              </div>
              {!n.read && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                  ใหม่
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
