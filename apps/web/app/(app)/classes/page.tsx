"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Smartphone } from "lucide-react";
import { api } from "@/lib/api";

interface TiktokCourse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  instructor: { displayName: string | null };
  _count: { sections: number; enrollments: number };
}

export default function ClassesPage() {
  const [courses, setCourses] = useState<TiktokCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<TiktokCourse[]>("/courses/tiktok")
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-400 text-ink">
          <Smartphone size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink">คลาสทั้งหมด</h1>
          <p className="text-sm text-slate-500">
            คลิปการสอนสั้น กระชับ — เลื่อนดูแบบฟีด ได้ทั้ง YouTube และ .mp4
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[9/14] animate-pulse rounded-3xl bg-slate-200" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          ยังไม่มีคลาส — ผู้สอนสามารถสร้างได้จาก Studio
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/classes/${c.slug}`}
              className="group relative aspect-[9/14] overflow-hidden rounded-3xl bg-ink shadow-md transition hover:scale-[1.02] hover:shadow-xl"
            >
              {c.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.coverImageUrl}
                  alt={c.title}
                  className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-ink to-ink-800">
                  <Smartphone size={48} className="text-gold-400/45" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <span className="inline-flex items-center gap-1 rounded-full bg-gold-400 px-2 py-0.5 text-xs font-bold text-ink">
                  <Play size={12} fill="currentColor" /> TikTok Class
                </span>
                <h2 className="mt-2 text-lg font-bold leading-tight">{c.title}</h2>
                <p className="mt-1 text-xs text-white/70">
                  {c.instructor.displayName ?? "ผู้สอน"} · {c._count.enrollments} ผู้เรียน
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
