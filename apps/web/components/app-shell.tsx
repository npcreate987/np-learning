"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { EduSidebar } from "./edu-sidebar";
import { NotificationsProvider } from "./notifications-provider";
import { NotificationsToaster } from "./notifications-toaster";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-cream-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 p-3 lg:block">
        <div className="h-full overflow-hidden rounded-[2rem] shadow-[0_18px_60px_rgba(23,20,47,0.14)]">
          <EduSidebar />
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-ink/45 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-64 transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <EduSidebar onNavigate={() => setOpen(false)} />
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-cream-50/95 px-4 py-3 backdrop-blur lg:hidden">
        <span className="font-bold tracking-tight text-ink">NP Learning</span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full p-2 text-ink hover:bg-white"
          aria-label="เมนู"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Content */}
      <div className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">{children}</div>
      </div>

      <NotificationsToaster />
    </div>
    </NotificationsProvider>
  );
}
