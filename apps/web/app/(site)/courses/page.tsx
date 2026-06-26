"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Layers, Search, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  priceCents: number;
  instructor: { id: string; displayName: string | null };
  _count: { sections: number; enrollments: number };
}

const categories = ["AI", "Marketing", "Ecommerce", "Coding", "Design"];

export default function CatalogPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // Read the ?q= param without needing a Suspense boundary.
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setQuery(q);

    api
      .get<CourseListItem[]>("/courses")
      .then(setCourses)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q),
    );
  }, [courses, query]);

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-slate-900">คอร์สทั้งหมด</h1>
      <p className="mt-1 text-sm text-slate-500">เลือกเรียนคอร์สที่คุณสนใจ</p>

      {/* Search + categories */}
      <div className="mt-5 space-y-3">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาคอร์ส..."
            className="h-11 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setQuery("")}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              query === ""
                ? "bg-ink text-white"
                : "bg-white text-slate-600 hover:bg-slate-100",
            )}
          >
            ทั้งหมด
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setQuery(cat)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition",
                query.toLowerCase() === cat.toLowerCase()
                  ? "bg-ink text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-slate-500">
          {courses.length === 0
            ? "ยังไม่มีคอร์สที่เผยแพร่"
            : `ไม่พบคอร์สที่ตรงกับ "${query}"`}
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link key={c.id} href={`/courses/${c.slug}`}>
              <Card className="flex h-full flex-col overflow-hidden transition hover:shadow-md">
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                  {c.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.coverImageUrl}
                      alt={c.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="px-4 text-center text-lg font-semibold">
                      {c.title}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-semibold text-slate-900">{c.title}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">
                    {c.description ?? "ไม่มีคำอธิบาย"}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Layers size={14} /> {c._count.sections} บท
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} /> {c._count.enrollments}
                      </span>
                    </span>
                    <Badge>
                      {c.priceCents > 0 ? `฿${(c.priceCents / 100).toFixed(0)}` : "ฟรี"}
                    </Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
