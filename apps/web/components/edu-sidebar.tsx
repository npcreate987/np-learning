"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Award,
  Bell,
  BookOpen,
  Bot,
  Flag,
  GraduationCap,
  LayoutGrid,
  type LucideIcon,
  Megaphone,
  MessageSquare,
  Settings,
  Share2,
  Shield,
  Smartphone,
  Store,
  Users,
  Wand2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "./auth-provider";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "คลาสของฉัน", href: "/my-courses", icon: GraduationCap },
  { label: "คลาสทั้งหมด", href: "/classes", icon: Smartphone },
  { label: "AI Tutor", href: "/ai-tutor", icon: Bot },
  { label: "ใบประกาศ", href: "/certificates", icon: Award },
  { label: "Community", href: "/community", icon: Users, badge: 6 },
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Affiliate", href: "/affiliate", icon: Share2 },
  { label: "Creator Center", href: "/creator", icon: Wand2 },
  { label: "การแจ้งเตือน", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

// Admin-only section. Rendered only when the signed-in profile is an ADMIN.
const adminItems: NavItem[] = [
  { label: "แดชบอร์ดแอดมิน", href: "/admin", icon: Shield, exact: true },
  { label: "จัดการผู้ใช้", href: "/admin/users", icon: Users },
  { label: "จัดการคอร์ส", href: "/admin/courses", icon: BookOpen },
  { label: "Leads", href: "/admin/leads", icon: MessageSquare },
  { label: "ส่งแจ้งเตือน", href: "/admin/notifications", icon: Megaphone },
  { label: "ตรวจ Community", href: "/admin/posts", icon: Flag },
];

export function EduSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [unread, setUnread] = useState(0);
  const isAdmin = profile?.role === "ADMIN";

  // Live unread notification count for the bell badge. Re-fetch on navigation
  // so the badge stays fresh after the user reads notifications elsewhere.
  useEffect(() => {
    let active = true;
    api
      .get<{ count: number }>("/notifications/unread-count", true)
      .then((r) => {
        if (active) setUnread(r.count);
      })
      .catch(() => {
        /* not logged in or network — leave at 0 */
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  return (
    <div className="flex h-full w-full flex-col bg-ink px-4 py-6 text-slate-300">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mb-8 flex items-center gap-3 px-2"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-gold-400 ring-1 ring-white/10">
          <Wand2 size={18} />
        </span>
        <span className="text-base font-bold leading-tight tracking-tight text-white">
          NP Learning
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
          // The notifications badge comes from the live unread count above.
          const badge = item.href === "/notifications" ? unread : item.badge;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white text-ink shadow-sm"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {badge ? (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                    active ? "bg-brand-100 text-brand-800" : "bg-white/10 text-white",
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              ผู้ดูแลระบบ
            </p>
            {adminItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-white text-ink shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <item.icon size={18} />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <Link
        href="/interest"
        onClick={onNavigate}
        className="mt-6 block rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-white transition hover:bg-white/[0.1]"
      >
        <p className="text-sm font-bold leading-tight">ปรึกษาคลาส</p>
        <p className="mt-1 text-xs text-slate-300">ให้ทีมงานช่วยแนะนำเส้นทางเรียนที่เหมาะกับคุณ</p>
        <div className="mt-3 flex items-end justify-between">
          <span className="rounded-full bg-gold-500 px-3 py-1.5 text-xs font-semibold text-ink">
            สนใจเรียน
          </span>
          <GraduationCap size={28} className="text-gold-400/60" />
        </div>
      </Link>
    </div>
  );
}
