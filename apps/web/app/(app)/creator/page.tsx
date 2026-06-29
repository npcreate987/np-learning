"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, BookOpen, FileEdit, Plus, Users, Wand2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Badge, Button, Card } from "@/components/ui";

interface MyCourse {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  _count: { sections: number; enrollments: number };
  updatedAt: string;
}

export default function CreatorPage() {
  const { profile, loading } = useAuth();
  const [courses, setCourses] = useState<MyCourse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setError(null);
    api
      .get<MyCourse[]>("/courses/mine", true)
      .then(setCourses)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "โหลดข้อมูลไม่สำเร็จ"),
      );
  }, [profile]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />;
  }

  if (!profile) {
    return <p className="py-10 text-center text-slate-500">กรุณาเข้าสู่ระบบ</p>;
  }

  if (profile.role === "STUDENT") {
    return (
      <div className="mx-auto max-w-md py-10">
        <Card className="p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Wand2 size={22} />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink">Creator Center</h1>
          <p className="mt-3 text-sm text-slate-500">
            เมนูนี้สำหรับผู้สอน หากต้องการสร้างคลาสของคุณเอง สมัครเป็นผู้สอนได้ที่หน้า Settings
          </p>
          <Link href="/settings" className="mt-6 inline-block">
            <Button>สมัครเป็นผู้สอน</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const list = courses ?? [];
  const published = list.filter((c) => c.status === "PUBLISHED").length;
  const drafts = list.length - published;
  const totalStudents = list.reduce((sum, c) => sum + c._count.enrollments, 0);
  const totalSections = list.reduce((sum, c) => sum + c._count.sections, 0);

  const stats: { label: string; value: number; icon: LucideIcon; tint: string }[] = [
    { label: "คลาสทั้งหมด", value: list.length, icon: BookOpen, tint: "bg-brand-50 text-brand-600" },
    { label: "นักเรียนรวม", value: totalStudents, icon: Users, tint: "bg-gold-400 text-ink" },
    { label: "คลาสที่เผยแพร่", value: published, icon: BarChart3, tint: "bg-cream-100 text-ink-700" },
    { label: "กลุ่มคลิปรวม", value: totalSections, icon: FileEdit, tint: "bg-slate-100 text-slate-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Creator Center</h1>
          <p className="mt-1 text-sm text-slate-500">ภาพรวมคลาสและนักเรียนของคุณ</p>
        </div>
        <Link href="/studio">
          <Button>
            <Plus size={16} /> สร้างคลาสใหม่
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl bg-white p-5 shadow-sm">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.tint}`}
            >
              <s.icon size={20} />
            </span>
            <p className="mt-4 text-2xl font-bold text-ink">{s.value}</p>
            <p className="mt-0.5 text-sm text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold text-ink">คลาสของคุณ</h2>
        {courses === null ? (
          <p className="py-6 text-center text-sm text-slate-400">กำลังโหลด...</p>
        ) : list.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-500">ยังไม่มีคลาส สร้างคลาสแรกของคุณได้เลย</p>
            <Link href="/studio" className="mt-4 inline-block">
              <Button>เริ่มสร้างคลาส</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {list.map((c) => (
              <Link
                key={c.id}
                href={`/studio/courses/${c.id}`}
                className="-mx-2 flex items-center gap-4 rounded-xl px-2 py-3 transition hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{c.title}</p>
                  <p className="text-xs text-slate-400">
                    {c._count.sections} กลุ่มคลิป · {c._count.enrollments} นักเรียน
                  </p>
                </div>
                <Badge>{c.status === "PUBLISHED" ? "เผยแพร่" : "ร่าง"}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
