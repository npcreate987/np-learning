"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Layers, Lock, PlayCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Badge, Button, Card } from "@/components/ui";

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  priceCents: number;
  instructor: { id: string; displayName: string | null };
  sections: {
    id: string;
    title: string;
    order: number;
    lessons: { id: string; title: string; type: string; order: number }[];
  }[];
}

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    api
      .get<CourseDetail>(`/courses/slug/${slug}`)
      .then(setCourse)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (course && session) {
      api
        .get<{ enrolled: boolean }>(`/enrollments/check/${course.id}`, true)
        .then((r) => setEnrolled(r.enrolled))
        .catch(() => setEnrolled(false));
    }
  }, [course, session]);

  async function handleEnroll() {
    if (!session) {
      router.push("/login");
      return;
    }
    if (!course) return;
    setEnrolling(true);
    try {
      await api.post("/enrollments", { courseId: course.id });
      setEnrolled(true);
      router.push(`/learn/${course.slug}`);
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return <div className="h-96 animate-pulse rounded-xl bg-slate-200" />;
  }
  if (!course) {
    return <p className="py-10 text-center text-slate-500">ไม่พบคอร์สนี้</p>;
  }

  const totalLessons = course.sections.reduce((n, s) => n + s.lessons.length, 0);

  return (
    <div className="grid gap-8 py-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
        <p className="mt-2 text-slate-600">{course.description}</p>
        <p className="mt-3 text-sm text-slate-500">
          ผู้สอน: {course.instructor.displayName ?? "ไม่ระบุ"}
        </p>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">เนื้อหาคอร์ส</h2>
        <p className="mt-1 text-sm text-slate-500">
          {course.sections.length} บท · {totalLessons} บทเรียน
        </p>

        <div className="mt-4 space-y-4">
          {course.sections.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                <Layers size={16} className="text-brand-600" />
                <span className="font-medium text-slate-800">{section.title}</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {section.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700"
                  >
                    {enrolled ? (
                      <PlayCircle size={18} className="text-brand-600" />
                    ) : (
                      <Lock size={16} className="text-slate-400" />
                    )}
                    {lesson.title}
                  </li>
                ))}
                {section.lessons.length === 0 && (
                  <li className="px-4 py-3 text-sm text-slate-400">ยังไม่มีบทเรียน</li>
                )}
              </ul>
            </Card>
          ))}
        </div>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-20 overflow-hidden">
          <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            {course.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.coverImageUrl}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="px-4 text-center text-lg font-semibold">{course.title}</span>
            )}
          </div>
          <div className="space-y-4 p-5">
            <Badge>
              {course.priceCents > 0
                ? `฿${(course.priceCents / 100).toFixed(0)}`
                : "เรียนฟรี"}
            </Badge>
            {enrolled ? (
              <Button className="w-full" onClick={() => router.push(`/learn/${course.slug}`)}>
                <CheckCircle2 size={18} /> เข้าเรียนต่อ
              </Button>
            ) : (
              <Button className="w-full" onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? "กำลังลงทะเบียน..." : "ลงทะเบียนเรียน"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
