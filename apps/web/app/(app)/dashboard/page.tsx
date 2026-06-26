"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpenCheck,
  Bookmark,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  MoreHorizontal,
  PenLine,
  Play,
  Plus,
  Search,
  Star,
  Target,
  TestTube2,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ----------------------------- mock data ----------------------------- */

const stats: { label: string; value: string; icon: LucideIcon; tint: string }[] = [
  { label: "เรียนจบแล้ว", value: "12 คอร์ส", icon: BookOpenCheck, tint: "bg-lime text-ink" },
  { label: "กำลังเรียน", value: "5 คอร์ส", icon: GraduationCap, tint: "bg-rose-100 text-rose-600" },
  { label: "คะแนนเฉลี่ย", value: "92%", icon: Target, tint: "bg-sky-100 text-sky-600" },
  { label: "ใบประกาศ", value: "8 ใบ", icon: Award, tint: "bg-violet-100 text-violet-600" },
];

const newCourses: {
  title: string;
  rate: string;
  type: string;
  icon: LucideIcon;
  tint: string;
}[] = [
  { title: "Content Writing", rate: "4.8", type: "Data Research", icon: PenLine, tint: "bg-rose-100 text-rose-600" },
  { title: "Usability Testing", rate: "5.0", type: "UI/UX Design", icon: TestTube2, tint: "bg-sky-100 text-sky-600" },
  { title: "Photography", rate: "5.0", type: "UI/UX Design", icon: Camera, tint: "bg-violet-100 text-violet-600" },
];

const activityData: Record<"weekly" | "monthly", { label: string; value: number; active?: boolean }[]> = {
  weekly: [
    { label: "Su", value: 30 },
    { label: "Mo", value: 55 },
    { label: "Tu", value: 40 },
    { label: "We", value: 95, active: true },
    { label: "Th", value: 35 },
    { label: "Fr", value: 70 },
    { label: "Sa", value: 50 },
  ],
  monthly: [
    { label: "W1", value: 60 },
    { label: "W2", value: 80, active: true },
    { label: "W3", value: 45 },
    { label: "W4", value: 70 },
  ],
};

const schedule: { title: string; meta: string; color: string }[] = [
  { title: "Design Systems", meta: "08:00 - 09:00", color: "bg-rose-400" },
  { title: "Typography", meta: "10:00 - 11:00", color: "bg-amber-400" },
  { title: "Color style", meta: "13:00 - 14:00", color: "bg-sky-400" },
  { title: "Visual Design", meta: "15:00 - 16:00", color: "bg-violet-400" },
];

const takingData: Record<
  "weekly" | "monthly",
  { title: string; meta: string; percent: number; tint: string }[]
> = {
  weekly: [
    { title: "TikTok Shop Mastery", meta: "8h 41min left", percent: 80, tint: "text-rose-500" },
    { title: "Development Basics", meta: "12h 12min left", percent: 75, tint: "text-sky-500" },
  ],
  monthly: [
    { title: "TikTok Shop Mastery", meta: "เหลือ 3 บท", percent: 80, tint: "text-rose-500" },
    { title: "AI Creator เริ่มต้น", meta: "เหลือ 6 บท", percent: 45, tint: "text-violet-500" },
    { title: "Development Basics", meta: "เหลือ 2 บท", percent: 75, tint: "text-sky-500" },
  ],
};

interface Assignment {
  id: number;
  title: string;
  meta: string;
  status: "progress" | "done";
}

const initialAssignments: Assignment[] = [
  { id: 1, title: "Methods of data", meta: "2 days left", status: "progress" },
  { id: 2, title: "Market research", meta: "Submitted", status: "done" },
  { id: 3, title: "Data collection", meta: "5 days left", status: "progress" },
];

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const monthNames = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

/* ----------------------------- helpers ----------------------------- */

function SectionCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-3xl bg-white p-5 shadow-sm", className)}>{children}</div>;
}

function PeriodSelect({
  value,
  onChange,
}: {
  value: "weekly" | "monthly";
  onChange: (v: "weekly" | "monthly") => void;
}) {
  const [open, setOpen] = useState(false);
  const labels: Record<"weekly" | "monthly", string> = {
    weekly: "รายสัปดาห์",
    monthly: "รายเดือน",
  };
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
      >
        {labels[value]}
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-32 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
            {(["weekly", "monthly"] as const).map((o) => (
              <button
                key={o}
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full rounded-lg px-3 py-1.5 text-left text-sm hover:bg-slate-100",
                  value === o ? "font-semibold text-ink" : "text-slate-600",
                )}
              >
                {labels[o]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------ page ------------------------------ */

export default function DashboardPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [activityPeriod, setActivityPeriod] = useState<"weekly" | "monthly">("weekly");
  const [takingPeriod, setTakingPeriod] = useState<"weekly" | "monthly">("weekly");
  // Date is resolved on the client only to avoid SSR/build hydration mismatches.
  const [cal, setCal] = useState<{ year: number; month: number } | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    const d = new Date();
    setCal({ year: d.getFullYear(), month: d.getMonth() });
  }, []);

  const activity = activityData[activityPeriod];
  const taking = takingData[takingPeriod];

  const calendar = useMemo(() => {
    if (!cal) return null;
    const firstDay = new Date(cal.year, cal.month, 1).getDay();
    const daysInMonth = new Date(cal.year, cal.month + 1, 0).getDate();
    const now = new Date();
    const isCurrentMonth =
      cal.year === now.getFullYear() && cal.month === now.getMonth();
    return { firstDay, daysInMonth, isCurrentMonth, todayDate: now.getDate() };
  }, [cal]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/courses?q=${encodeURIComponent(q)}` : "/courses");
  }

  function shiftMonth(delta: number) {
    setCal((c) => {
      if (!c) return c;
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function addAssignment(e: React.FormEvent) {
    e.preventDefault();
    const t = newTitle.trim();
    if (!t) return;
    setAssignments((list) => [
      ...list,
      { id: Date.now(), title: t, meta: "เพิ่งเพิ่ม", status: "progress" },
    ]);
    setNewTitle("");
    setAdding(false);
  }

  function toggleStatus(id: number) {
    setAssignments((list) =>
      list.map((a) =>
        a.id === id
          ? {
              ...a,
              status: a.status === "done" ? "progress" : "done",
              meta: a.status === "done" ? a.meta : "Submitted",
            }
          : a,
      ),
    );
  }

  function removeAssignment(id: number) {
    setAssignments((list) => list.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">สวัสดี Hashi 👋</h1>
          <p className="mt-1 text-sm text-slate-500">มาเรียนรู้สิ่งใหม่กันต่อเลย</p>
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={onSearch} className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาคอร์ส..."
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none sm:w-64"
            />
          </form>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white">
            H
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
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
      <div className="overflow-hidden rounded-3xl bg-ink p-5 text-white shadow-sm sm:flex sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-xs text-slate-400">เรียนต่อจากที่ค้างไว้</p>
          <h3 className="mt-1 text-lg font-bold">TikTok Shop Mastery</h3>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 w-48 max-w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-lime" style={{ width: "80%" }} />
            </div>
            <span className="text-sm font-semibold text-lime">80%</span>
          </div>
        </div>
        <Link
          href="/my-courses"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-2.5 text-sm font-semibold text-ink hover:brightness-95 sm:mt-0"
        >
          <Play size={16} /> เรียนต่อ
        </Link>
      </div>

      {/* New Courses */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">คอร์สแนะนำ</h2>
          <Link href="/courses" className="text-sm font-medium text-brand-600 hover:underline">
            ดูทั้งหมด
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {newCourses.map((c) => (
            <Link key={c.title} href="/courses">
              <SectionCard className="h-full transition hover:shadow-md">
                <div className={cn("mb-4 flex h-11 w-11 items-center justify-center rounded-xl", c.tint)}>
                  <c.icon size={20} />
                </div>
                <h3 className="font-semibold text-ink">{c.title}</h3>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-slate-400">Rate</p>
                    <p className="mt-0.5 flex items-center gap-1 font-semibold text-ink">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      {c.rate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400">Type</p>
                    <p className="mt-0.5 font-semibold text-ink">{c.type}</p>
                  </div>
                </div>
              </SectionCard>
            </Link>
          ))}

          <Link
            href="/marketplace"
            className="relative overflow-hidden rounded-3xl bg-ink p-5 text-white shadow-sm transition hover:brightness-110"
          >
            <p className="text-xs text-slate-400">NP Learning</p>
            <h3 className="mt-1 text-lg font-bold">Go Premium</h3>
            <p className="mt-1 max-w-[10rem] text-xs text-slate-400">เปิด 73k+ คอร์ส & AI Tools</p>
            <span className="mt-4 inline-block rounded-lg bg-lime px-3 py-1.5 text-xs font-semibold text-ink">
              Get Access
            </span>
            <Bookmark size={64} className="absolute -bottom-3 -right-3 text-lime/20" />
          </Link>
        </div>
      </section>

      {/* Middle row */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Hours Activity */}
        <SectionCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink">ชั่วโมงเรียน</h2>
            <PeriodSelect value={activityPeriod} onChange={setActivityPeriod} />
          </div>
          <div className="flex h-40 items-end justify-between gap-2">
            {activity.map((b) => (
              <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative flex h-32 w-full items-end justify-center">
                  {b.active && (
                    <span className="absolute -top-1 rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-lime">
                      1.5h
                    </span>
                  )}
                  <div
                    className={cn("w-2.5 rounded-full", b.active ? "bg-ink" : "bg-slate-200")}
                    style={{ height: `${b.value}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{b.label}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Daily Schedule */}
        <SectionCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink">ตารางเรียนวันนี้</h2>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="space-y-3">
            {schedule.map((s) => (
              <div key={s.title} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <span className={cn("h-9 w-1.5 rounded-full", s.color)} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{s.title}</p>
                  <p className="text-xs text-slate-400">{s.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Calendar */}
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
            {calendar &&
              Array.from({ length: calendar.firstDay }).map((_, i) => (
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
                      isToday ? "bg-lime font-semibold text-ink" : "text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {day}
                  </span>
                );
              })}
          </div>
        </SectionCard>
      </section>

      {/* Bottom row */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Course You're Taking */}
        <SectionCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink">คอร์สที่กำลังเรียน</h2>
            <PeriodSelect value={takingPeriod} onChange={setTakingPeriod} />
          </div>
          <div className="space-y-3">
            {taking.map((t) => (
              <Link
                key={t.title}
                href="/my-courses"
                className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200 hover:shadow-sm"
              >
                <div className="relative flex h-12 w-12 items-center justify-center">
                  <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${(t.percent / 100) * 94.2} 94.2`}
                      className={t.tint}
                    />
                  </svg>
                  <span className="absolute text-xs font-semibold text-ink">{t.percent}%</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{t.title}</p>
                  <p className="text-xs text-slate-400">{t.meta}</p>
                </div>
                <Play size={16} className="text-brand-600" />
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Assignments */}
        <SectionCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink">งานที่ต้องส่ง</h2>
            <button
              onClick={() => setAdding((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-lime text-ink hover:brightness-95"
              aria-label="เพิ่มงาน"
            >
              <Plus size={16} className={cn("transition-transform", adding && "rotate-45")} />
            </button>
          </div>

          {adding && (
            <form onSubmit={addAssignment} className="mb-3 flex gap-2">
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="ชื่องาน..."
                className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm focus:border-brand-400 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-ink px-3 text-sm font-medium text-white hover:bg-ink-800"
              >
                เพิ่ม
              </button>
            </form>
          )}

          <div className="space-y-3">
            {assignments.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">ยังไม่มีงานที่ต้องส่ง</p>
            )}
            {assignments.map((a) => (
              <div key={a.id} className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <FileText size={18} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{a.title}</p>
                  <p className="text-xs text-slate-400">{a.meta}</p>
                </div>
                <button
                  onClick={() => toggleStatus(a.id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition",
                    a.status === "done"
                      ? "bg-green-50 text-green-600 hover:bg-green-100"
                      : "bg-amber-50 text-amber-600 hover:bg-amber-100",
                  )}
                >
                  {a.status === "done" ? "เสร็จแล้ว" : "กำลังทำ"}
                </button>
                <button
                  onClick={() => removeAssignment(a.id)}
                  className="text-slate-300 transition hover:text-red-500"
                  aria-label="ลบ"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
