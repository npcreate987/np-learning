"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { useNotifications, type AppNotification } from "./notifications-provider";

/**
 * Fixed top-right stack of toasts for notifications that arrived while the app
 * is open. Each toast auto-dismisses after 6s; clicking it opens the
 * notifications page.
 */
export function NotificationsToaster() {
  const { toasts, dismissToast } = useNotifications();
  const router = useRouter();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          t={t}
          onDismiss={() => dismissToast(t.id)}
          onOpen={() => {
            dismissToast(t.id);
            router.push("/notifications");
          }}
        />
      ))}
    </div>
  );
}

function ToastItem({
  t,
  onDismiss,
  onOpen,
}: {
  t: AppNotification;
  onDismiss: () => void;
  onOpen: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(23,20,47,0.18)]">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Bell size={16} />
      </span>
      <button onClick={onOpen} className="flex-1 text-left">
        <p className="text-sm font-semibold text-ink">{t.title}</p>
        <p className="mt-0.5 text-xs text-slate-600">{t.body}</p>
      </button>
      <button
        onClick={onDismiss}
        className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label="ปิด"
      >
        <X size={14} />
      </button>
    </div>
  );
}
