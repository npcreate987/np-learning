import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

export function ComingSoon({
  title,
  description,
  icon: Icon = Sparkles,
  features,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  features?: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-400 text-ink">
          <Icon size={30} />
        </span>
        <h2 className="mt-5 text-xl font-bold text-ink">เร็วๆ นี้</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          ฟีเจอร์นี้อยู่ระหว่างพัฒนา (Phase 2) — กำลังจะเปิดให้ใช้งานเร็วๆ นี้
        </p>

        {features && features.length > 0 && (
          <ul className="mt-6 grid max-w-md gap-2 text-left sm:grid-cols-2">
            {features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gold-600" />
                {f}
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/dashboard"
          className="mt-8 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-800"
        >
          กลับหน้า Dashboard
        </Link>
      </div>
    </div>
  );
}
