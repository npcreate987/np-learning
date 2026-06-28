"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  GraduationCap,
  Layers,
  MessageSquare,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { AdminGuard } from "@/components/admin-guard";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface AdminStats {
  users: { total: number; students: number; instructors: number; admins: number };
  courses: { total: number; published: number; draft: number };
  enrollments: number;
  certificates: number;
  leads: {
    total: number;
    pending: number;
    contacted: number;
    enrolled: number;
    cancelled: number;
  };
  recentLeads: {
    id: string;
    fullName: string;
    phone: string;
    status: string;
    createdAt: string;
    course: { title: string } | null;
  }[];
  recentEnrollments: {
    id: string;
    createdAt: string;
    user: { email: string; displayName: string | null };
    course: { title: string };
  }[];
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "รอติดต่อ",
  CONTACTED: "ติดต่อแล้ว",
  ENROLLED: "สมัครเรียนแล้ว",
  CANCELLED: "ยกเลิก",
};

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", tint)}>
        <Icon size={22} />
      </span>
      <div>
        <p className="text-lg font-bold text-ink">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </Card>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AdminStats>("/admin/stats", true)
      .then(setStats)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "โหลดสถิติไม่สำเร็จ"),
      );
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-md py-10">
        <Card className="p-8 text-center text-red-600">{error}</Card>
      </div>
    );
  }
  if (!stats) {
    return <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />;
  }

  const cards: { icon: LucideIcon; label: string; value: string; tint: string }[] = [
    { icon: Users, label: "ผู้ใช้ทั้งหมด", value: `${stats.users.total}`, tint: "bg-violet-100 text-violet-600" },
    { icon: GraduationCap, label: "นักเรียน", value: `${stats.users.students}`, tint: "bg-sky-100 text-sky-600" },
    { icon: UserCheck, label: "ผู้สอน", value: `${stats.users.instructors}`, tint: "bg-emerald-100 text-emerald-600" },
    { icon: Layers, label: "คอร์ส (เผยแพร่/ฉบับร่าง)", value: `${stats.courses.total} (${stats.courses.published}/${stats.courses.draft})`, tint: "bg-amber-100 text-amber-600" },
    { icon: BookOpen, label: "การลงทะเบียน", value: `${stats.enrollments}`, tint: "bg-rose-100 text-rose-600" },
    { icon: Award, label: "ใบประกาศ", value: `${stats.certificates}`, tint: "bg-gold-400 text-ink" },
    { icon: MessageSquare, label: "Leads (รอติดต่อ)", value: `${stats.leads.total} (${stats.leads.pending})`, tint: "bg-brand-100 text-brand-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">แดชบอร์ดผู้ดูแลระบบ</h1>
        <p className="mt-1 text-sm text-slate-500">ภาพรวมแพลตฟอร์มและกิจกรรมล่าสุด</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent leads */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink">ผู้สนใจเรียนล่าสุด</h2>
            <Link href="/admin/leads" className="text-sm font-medium text-brand-600 hover:underline">
              จัดการ
            </Link>
          </div>
          {stats.recentLeads.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">ยังไม่มี leads</p>
          ) : (
            <div className="space-y-2">
              {stats.recentLeads.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                  <div>
                    <p className="text-sm font-medium text-ink">{l.fullName}</p>
                    <p className="text-xs text-slate-400">
                      {l.course?.title ?? "ไม่ระบุคลาส"} · {new Date(l.createdAt).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800">
                    {STATUS_LABEL[l.status] ?? l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent enrollments */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink">การลงทะเบียนล่าสุด</h2>
            <Link href="/admin/users" className="text-sm font-medium text-brand-600 hover:underline">
              จัดการผู้ใช้
            </Link>
          </div>
          {stats.recentEnrollments.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">ยังไม่มีการลงทะเบียน</p>
          ) : (
            <div className="space-y-2">
              {stats.recentEnrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                  <div>
                    <p className="text-sm font-medium text-ink">{e.course.title}</p>
                    <p className="text-xs text-slate-400">
                      {e.user.displayName ?? e.user.email} · {new Date(e.createdAt).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}
