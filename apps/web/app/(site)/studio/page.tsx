"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Badge, Button, Card, Input, Label } from "@/components/ui";

interface BaseCourse {
  id: string;
  slug: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  _count: { sections: number; enrollments: number };
}
// Admin list (/admin/courses) additionally returns the instructor of each
// course so the admin can tell whose content they are about to edit.
interface AdminCourse extends BaseCourse {
  instructor: { id: string; displayName: string | null; email: string };
}

export default function StudioPage() {
  const { session, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<BaseCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const isInstructor = profile?.role === "INSTRUCTOR" || profile?.role === "ADMIN";
  const isAdmin = profile?.role === "ADMIN";

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.push("/login");
      return;
    }
    if (!isInstructor) {
      setLoading(false);
      return;
    }
    // Admin sees every course on the platform so they can edit content/upload
    // clips for any instructor. Instructors only see their own courses.
    const endpoint = isAdmin ? "/admin/courses" : "/courses/mine";
    api
      .get<AdminCourse[]>(endpoint, true)
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [session, authLoading, isInstructor, isAdmin, router]);

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const course = await api.post<{ id: string }>("/courses", {
        title: newTitle,
      });
      router.push(`/studio/courses/${course.id}`);
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  if (authLoading || loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-slate-200" />;
  }

  if (!isInstructor) {
    return (
      <Card className="mx-auto mt-10 max-w-lg p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">เฉพาะผู้สอนเท่านั้น</h1>
        <p className="mt-2 text-sm text-slate-500">
          ส่วนนี้สำหรับผู้สอนที่ได้รับสิทธิ์จากผู้ดูแลระบบ หากต้องการเปิดสอน กรุณาติดต่อทีมงาน
        </p>
        <Link href="/classes" className="mt-6 inline-block">
          <Button>ไปหน้าคลาสทั้งหมด</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAdmin ? "Studio — จัดการคอร์สทั้งหมด" : "แดชบอร์ดผู้สอน"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? "เข้าไปแก้ไขเนื้อหาหรืออัปโหลดคลิปของคอร์สใดก็ได้ในระบบ"
              : "สร้างและจัดการคลาสของคุณ"}
          </p>
        </div>
      </div>

      {isAdmin ? (
        <Card className="mt-6 p-5 text-sm text-slate-600">
          ต้องการสร้างคอร์สใหม่และมอบหมายให้ผู้สอน?{" "}
          <Link href="/admin/courses" className="font-medium text-brand-600 hover:underline">
            ไปหน้าจัดการคอร์ส (แอดมิน)
          </Link>
        </Card>
      ) : (
        <Card className="mt-6 p-5">
          <form onSubmit={createCourse} className="space-y-3">
            <div>
              <Label htmlFor="title">สร้างคลาสใหม่</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="ชื่อคลาส เช่น TikTok Marketing 101"
              />
              <p className="mt-1 text-xs text-slate-400">
                คลาส = คลิปการสอนสั้น เลื่อนดูแบบฟีด (วิดีโอ YouTube หรือ .mp4 แนวนอน/แนวตั้ง)
              </p>
            </div>
            <Button type="submit" disabled={creating}>
              <Plus size={18} /> {creating ? "กำลังสร้าง..." : "สร้างคลาส"}
            </Button>
          </form>
        </Card>
      )}

      <div className="mt-8 space-y-3">
        {courses.length === 0 ? (
          <p className="text-center text-slate-500">
            {isAdmin ? "ยังไม่มีคอร์สในระบบ" : "ยังไม่มีคลาส เริ่มสร้างคลาสแรกของคุณ"}
          </p>
        ) : (
          courses.map((c) => {
            const adminCourse = c as AdminCourse;
            return (
              <Link key={c.id} href={`/studio/courses/${c.id}`}>
                <Card className="flex items-center justify-between p-4 transition hover:shadow-md">
                  <div>
                    <h3 className="font-semibold text-slate-900">{c.title}</h3>
                    <p className="text-sm text-slate-500">
                      {isAdmin && adminCourse.instructor
                        ? `ผู้สอน: ${adminCourse.instructor.displayName ?? adminCourse.instructor.email} · `
                        : ""}
                      {c._count.sections} กลุ่มคลิป · {c._count.enrollments} ผู้เรียน
                    </p>
                  </div>
                  <Badge
                    className={
                      c.status === "PUBLISHED"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }
                  >
                    {c.status === "PUBLISHED" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                  </Badge>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
