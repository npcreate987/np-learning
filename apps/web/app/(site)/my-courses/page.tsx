"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button, Card } from "@/components/ui";

interface EnrollmentItem {
  id: string;
  course: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    coverImageUrl: string | null;
    instructor: { displayName: string | null };
    _count: { sections: number };
  };
}

export default function MyCoursesPage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.push("/login");
      return;
    }
    api
      .get<EnrollmentItem[]>("/enrollments/mine", true)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [session, authLoading, router]);

  if (authLoading || loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-slate-200" />;
  }

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-slate-900">คอร์สของฉัน</h1>

      {items.length === 0 ? (
        <Card className="mt-8 p-10 text-center">
          <p className="text-slate-500">คุณยังไม่ได้ลงทะเบียนคอร์สใด</p>
          <Link href="/courses" className="mt-4 inline-block">
            <Button>เลือกคอร์สเรียน</Button>
          </Link>
        </Card>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ id, course }) => (
            <Link key={id} href={`/learn/${course.slug}`}>
              <Card className="flex h-full flex-col overflow-hidden transition hover:shadow-md">
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                  {course.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.coverImageUrl}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="px-4 text-center text-lg font-semibold">
                      {course.title}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-semibold text-slate-900">{course.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {course.instructor.displayName ?? "ไม่ระบุผู้สอน"}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
