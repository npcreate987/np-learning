"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LibraryBig,
  Play,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

/* ----------------------------- types ----------------------------- */

interface SummaryCourse {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  instructor: { id: string; displayName: string | null };
}
interface SummaryItem {
  id: string;
  courseId: string;
  course: SummaryCourse;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  nextLessonId: string | null;
  createdAt: string;
}
interface Summary {
  enrollments: SummaryItem[];
  stats: { enrolled: number; completed: number; inProgress: number; certificates: number };
}
interface CatalogCourse {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  instructor: { id: string; displayName: string | null };
  _count: { sections: number; enrollments: number };
}
interface CertificateRow {
  id: string;
  serial: string;
  issuedAt: string;
  course: { id: string; slug: string; title: string };
}

/* ----------------------------- helpers ----------------------------- */

function SectionCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_rgba(23,20,47,0.05)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const monthNames = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

/* ------------------------------ page ------------------------------ */

export default function DashboardPage() {
  const router = useRouter();
  const { profile, session, loading: authLoading } = useAuth();

  const [query, setQuery] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [catalog, setCatalog] = useState<CatalogCourse[]>([]);
  const [certs, setCerts] = useState<CertificateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cal, setCal] = useState<{ year: number; month: number } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.push("/login");
      return;
    }
    Promise.all([
      api.get<Summary>("/enrollments/mine/summary", true),
      api.get<CatalogCourse[]>("/courses", true),
      api.get<CertificateRow[]>("/certificates/mine", true).catch(() => [] as CertificateRow[]),
    ])
      .then(([s, c, ct]) => {
        setSummary(s);
        setCatalog(c);
        setCerts(ct);
      })
      .finally(() => setLoading(false));
  }, [session, authLoading, router]);

  useEffect(() => {
    const d = new Date();
    setCal({ year: d.getFullYear(), month: d.getMonth() });
  }, []);

  const calendar = useMemo(() => {
    if (!cal) return null;
    const firstDay = new Date(cal.year, cal.month, 1).getDay();
    const daysInMonth = new Date(cal.year, cal.month + 1, 0).getDate();
    const now = new Date();
    const isCurrentMonth = cal.year === now.getFullYear() && cal.month === now.getMonth();
    return { firstDay, daysInMonth, isCurrentMonth, todayDate: now.getDate() };
  }, [cal]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/classes?q=${encodeURIComponent(q)}` : "/classes");
  }

  function shiftMonth(delta: number) {
    setCal((c) => {
      if (!c) return c;
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  if (authLoading || loading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />;
  }

  const stats = summary?.stats ?? { enrolled: 0, completed: 0, inProgress: 0, certificates: 0 };
  const enrolledIds = new Set(summary?.enrollments.map((e) => e.courseId) ?? []);
  const recommended = catalog.filter((c) => !enrolledIds.has(c.id)).slice(0, 3);

  // Continue learning: in-progress with the highest percent, else most recent enrollment.
  const inProgress = (summary?.enrollments ?? []).filter((e) => e.percent < 100 && e.totalLessons > 0);
  const continueItem =
    inProgress.sort((a, b) => b.percent - a.percent)[0] ?? summary?.enrollments?.[0] ?? null;

  const greetingName = profile?.displayName ?? profile?.email ?? "ผู้เรียน";
  const avatarInitial = (profile?.displayName ?? profile?.email ?? "U").charAt(0).toUpperCase();

  const statCards: { label: string; value: string; icon: LucideIcon; tint: string }[] = [
    { label: "เรียนจบแล้ว", value: `${stats.completed} คลาส`, icon: BookOpenCheck, tint: "bg-gold-400 text-ink" },
    { label: "กำลังเรียน", value: `${stats.inProgress} คลาส`, icon: GraduationCap, tint: "bg-rose-100 text-rose-600" },
    { label: "ลงทะเบียน", value: `${stats.enrolled} คลาส`, icon: LibraryBig, tint: "bg-sky-100 text-sky-600" },
    { label: "ใบประกาศ", value: `${stats.certificates} ใบ`, icon: Award, tint: "bg-violet-100 text-violet-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">สวัสดี {greetingName}</h1>
          <p className="mt-1 text-sm text-slate-500">มาเรียนรู้สิ่งใหม่กันต่อเลย</p>
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={onSearch} className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาคลาส..."
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none sm:w-64"
            />
          </form>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-semibold text-white">
            {avatarInitial}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statCards.map((s) => (
          <SectionCard key={s.label} className="flex items-center gap-4">
            <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", s.tint)}>
              <s.icon size={22} />
            </span>
            <div>
              <p className="text-lg font-bold text-ink">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </SectionCard>
        ))}
      </div>

      {/* Continue learning */}
      {continueItem ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(23,20,47,0.06)] sm:flex sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-brand-700">เรียนต่อจากที่ค้างไว้</p>
            <h3 className="mt-1 text-lg font-bold text-ink">{continueItem.course.title}</h3>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 w-48 max-w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gold-500" style={{ width: `${continueItem.percent}%` }} />
              </div>
              <span className="text-sm font-semibold text-gold-600">{continueItem.percent}%</span>
            </div>
          </div>
          <Link
            href={`/classes/${continueItem.course.slug}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-800 sm:mt-0"
          >
            <Play size={16} /> เรียนต่อ
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(23,20,47,0.06)] sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink">ยังไม่ได้ลงทะเบียนคลาส</h3>
            <p className="mt-1 text-sm text-slate-500">เลือกคลาสแรกของคุณแล้วเริ่มเรียนได้เลย</p>
          </div>
          <Link href="/classes" className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-800 sm:mt-0">
            <LibraryBig size={16} /> ดูคลาสทั้งหมด
          </Link>
        </div>
      )}

      {/* Recommended */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">คลาสแนะนำ</h2>
          <Link href="/classes" className="text-sm font-medium text-brand-600 hover:underline">
            ดูทั้งหมด
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {recommended.map((c) => (
            <Link key={c.id} href={`/classes/${c.slug}`}>
              <SectionCard className="h-full transition hover:shadow-md">
                <div className="mb-4 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-cream-100 text-brand-700">
                  {c.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.coverImageUrl} alt={c.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-4 text-center text-sm font-semibold">{c.title}</span>
                  )}
                </div>
                <h3 className="font-semibold text-ink">{c.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {c.instructor.displayName ?? "ไม่ระบุผู้สอน"}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400">
                  <Target size={12} /> {c._count.sections} คลิป
                </p>
              </SectionCard>
            </Link>
          ))}

          <Link
            href="/interest"
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-cream-100 p-5 text-ink shadow-sm transition hover:bg-cream-200"
          >
            <p className="text-xs text-slate-500">NP Learning</p>
            <h3 className="mt-1 text-lg font-bold">ปรึกษาหลักสูตร</h3>
            <p className="mt-1 max-w-[10rem] text-xs leading-5 text-slate-500">
              ให้ทีมงานช่วยแนะนำคลาสที่เหมาะกับเป้าหมาย
            </p>
            <span className="mt-4 inline-block rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
              สนใจเรียน
            </span>
            <Sparkles size={64} className="absolute -bottom-3 -right-3 text-brand-200" />
          </Link>
        </div>
      </section>

      {/* Middle row: courses in progress + calendar */}
      <section className="grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink">คลาสที่กำลังเรียน</h2>
            <Link href="/my-courses" className="text-sm font-medium text-brand-600 hover:underline">
              ดูทั้งหมด
            </Link>
          </div>
          {(summary?.enrollments ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">ยังไม่มีคลาสที่ลงทะเบียน</p>
          ) : (
            <div className="space-y-3">
              {(summary?.enrollments ?? []).slice(0, 5).map((t) => (
                <Link
                  key={t.id}
                  href={`/classes/${t.course.slug}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200 hover:shadow-sm"
                >
                  <div className="relative flex h-12 w-12 items-center justify-center">
                    <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100" />
                      <circle
                        cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={`${(t.percent / 100) * 94.2} 94.2`}
                        className="text-brand-600"
                      />
                    </svg>
                    <span className="absolute text-xs font-semibold text-ink">{t.percent}%</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{t.course.title}</p>
                    <p className="text-xs text-slate-400">
                      {t.completedLessons}/{t.totalLessons} คลิป
                    </p>
                  </div>
                  <Play size={16} className="text-brand-600" />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink">
              {cal ? `${monthNames[cal.month]} ${cal.year + 543}` : "ปฏิทิน"}
            </h2>
            <div className="flex gap-1 text-slate-400">
              <button onClick={() => shiftMonth(-1)} className="rounded-md p-1 hover:bg-slate-100">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => shiftMonth(1)} className="rounded-md p-1 hover:bg-slate-100">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {weekdays.map((d) => (
              <span key={d} className="py-1 font-medium text-slate-400">
                {d}
              </span>
            ))}
            {calendar && Array.from({ length: calendar.firstDay }).map((_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {calendar &&
              Array.from({ length: calendar.daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = calendar.isCurrentMonth && day === calendar.todayDate;
                return (
                  <span
                    key={day}
                    className={cn(
                      "flex h-8 items-center justify-center rounded-full",
                      isToday ? "bg-gold-400 font-semibold text-ink" : "text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {day}
                  </span>
                );
              })}
          </div>
        </SectionCard>
      </section>

      {/* Certificates */}
      <SectionCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink">ใบประกาศล่าสุด</h2>
          <Link href="/certificates" className="text-sm font-medium text-brand-600 hover:underline">
            ดูทั้งหมด
          </Link>
        </div>
        {certs.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            ยังไม่มีใบประกาศ — ทำแบบทดสอบท้ายคลาสให้ผ่านเพื่อรับใบประกาศ
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {certs.slice(0, 3).map((c) => (
              <Link
                key={c.id}
                href={`/certificate/${c.serial}`}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200 hover:shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400/20 text-gold-600">
                  <Award size={18} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{c.course.title}</p>
                  <p className="text-xs text-slate-400">{c.serial}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
