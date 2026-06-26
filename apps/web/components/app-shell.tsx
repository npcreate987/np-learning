"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { EduSidebar } from "./edu-sidebar";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f5fa]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 p-3 lg:block">
        <div className="h-full overflow-hidden rounded-3xl">
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
            "absolute inset-0 bg-black/40 transition-opacity",
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
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <span className="font-bold text-ink">Eduplex</span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-ink hover:bg-slate-100"
          aria-label="เมนู"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Content */}
      <div className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
