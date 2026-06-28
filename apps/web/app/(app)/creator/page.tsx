import {
  ArrowUpRight,
  BookOpen,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Creator Center" };

const stats: {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  tint: string;
}[] = [
  { label: "ยอดขายเดือนนี้", value: "฿89,500", delta: "+12.4%", icon: Wallet, tint: "bg-gold-400 text-ink" },
  { label: "สมาชิกทั้งหมด", value: "2,580", delta: "+8.1%", icon: Users, tint: "bg-rose-100 text-rose-600" },
  { label: "Active วันนี้", value: "425", delta: "+3.2%", icon: TrendingUp, tint: "bg-sky-100 text-sky-600" },
  { label: "MRR", value: "฿142,300", delta: "+5.7%", icon: BookOpen, tint: "bg-violet-100 text-violet-600" },
];

const dailySales = [40, 65, 50, 80, 60, 95, 70, 55, 75, 90, 68, 82];
const maxSale = Math.max(...dailySales);

const topCourses = [
  { title: "TikTok Shop Mastery", sales: 412, revenue: "฿41,200" },
  { title: "TikTok Ads ยิงแอดให้ปัง", sales: 318, revenue: "฿31,800" },
  { title: "AI Creator เริ่มต้น", sales: 240, revenue: "฿24,000" },
];

export default function CreatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Creator Center</h1>
        <p className="mt-1 text-sm text-slate-500">
          ภาพรวมแพลตฟอร์มของคุณ — NP Learning
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl",
                  s.tint,
                )}
              >
                <s.icon size={20} />
              </span>
              <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600">
                <ArrowUpRight size={14} />
                {s.delta}
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-ink">{s.value}</p>
            <p className="mt-0.5 text-sm text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink">ยอดขายรายวัน</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              12 วันล่าสุด
            </span>
          </div>
          <div className="flex h-48 items-end justify-between gap-2">
            {dailySales.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-lg bg-ink/90 transition-all hover:bg-gold-600"
                style={{ height: `${(v / maxSale) * 100}%` }}
                title={`฿${(v * 1000).toLocaleString()}`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-ink">คลาสยอดนิยม</h2>
          <div className="space-y-3">
            {topCourses.map((c, i) => (
              <div key={c.title} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-ink">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.sales} ยอดขาย</p>
                </div>
                <span className="text-sm font-semibold text-ink">{c.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
