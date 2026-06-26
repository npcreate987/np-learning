"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Bot,
  GraduationCap,
  LayoutGrid,
  LibraryBig,
  type LucideIcon,
  Settings,
  Share2,
  Smartphone,
  Store,
  Users,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Learn", href: "/my-courses", icon: GraduationCap },
  { label: "คอร์สทั้งหมด", href: "/courses", icon: LibraryBig },
  { label: "AI Tutor", href: "/ai-tutor", icon: Bot },
  { label: "ใบประกาศ", href: "/certificates", icon: Award },
  { label: "Community", href: "/community", icon: Users, badge: 6 },
  { label: "คลาส TikTok", href: "/classes", icon: Smartphone },
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Affiliate", href: "/affiliate", icon: Share2 },
  { label: "Creator Center", href: "/creator", icon: Wand2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function EduSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-full flex-col bg-ink px-4 py-6 text-slate-300">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mb-8 flex items-center gap-2 px-2"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime text-ink">
          <Wand2 size={18} />
        </span>
        <span className="text-base font-bold leading-tight text-white">
          NP<span className="text-lime"> Learning</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-lime text-ink"
                  : "text-slate-300 hover:bg-ink-700 hover:text-white",
              )}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                    active ? "bg-ink text-lime" : "bg-lime text-ink",
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/marketplace"
        onClick={onNavigate}
        className="mt-6 block rounded-2xl bg-lime p-4 text-ink transition hover:brightness-95"
      >
        <p className="text-sm font-bold leading-tight">Go Premium</p>
        <p className="mt-1 text-xs text-ink/70">ปลดล็อก 73k+ คอร์ส & AI Tools</p>
        <div className="mt-3 flex items-end justify-between">
          <span className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-lime">
            Get Access
          </span>
          <GraduationCap size={28} className="text-ink/40" />
        </div>
      </Link>
    </div>
  );
}
