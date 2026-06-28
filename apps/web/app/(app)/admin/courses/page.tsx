"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { AdminGuard } from "@/components/admin-guard";
import { Badge, Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface AdminCourse {
  id: string;
  slug: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  priceCents: number;
  createdAt: string;
  instructor: { id: string; displayName: string | null; email: string };
  _count: { sections: number; enrollments: number };
}

function CoursesAdmin() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCourses(await api.get<AdminCourse[]>("/admin/courses", true));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "โหลดคอร์สไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: "PUBLISHED" | "DRAFT") {
    setBusyId(id);
    try {
      await api.post(`/admin/courses/${id}/${status === "PUBLISHED" ? "publish" : "unpublish"}`, undefined, true);
      setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "เปลี่ยนสถานะไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`ต้องการลบคอร์ส "${title}" ใช่ไหม? การกระทำนี้ย้อนกลับไม่ได้`)) return;
    setBusyId(id);
    try {
      await api.del(`/admin/courses/${id}`, true);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ลบคอร์สไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">จัดการคอร์สทั้งหมด</h1>
        <p className="mt-1 text-sm text-slate-500">ควบคุมสถานะและลบคอร์สของผู้สอนทุกคน</p>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-medium underline">ปิด</button>
        </div>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
      ) : courses.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">ยังไม่มีคอร์สในระบบ</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">คอร์ส</th>
                  <th className="px-4 py-3 font-medium">ผู้สอน</th>
                  <th className="px-4 py-3 font-medium">คลิป</th>
                  <th className="px-4 py-3 font-medium">ผู้เรียน</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 font-medium text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{c.title}</p>
                      <p className="text-xs text-slate-400">{c.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.instructor.displayName ?? c.instructor.email}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c._count.sections}</td>
                    <td className="px-4 py-3 text-slate-600">{c._count.enrollments}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          c.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700",
                        )}
                      >
                        {c.status === "PUBLISHED" ? "เผยแพร่" : "ฉบับร่าง"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === c.id}
                          onClick={() => setStatus(c.id, c.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")}
                        >
                          {c.status === "PUBLISHED" ? "เลิกเผยแพร่" : "เผยแพร่"}
                        </Button>
                        <button
                          onClick={() => remove(c.id, c.title)}
                          disabled={busyId === c.id}
                          className="inline-flex h-8 items-center justify-center rounded-full border border-red-200 px-3 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="ลบคอร์ส"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function AdminCoursesPage() {
  return (
    <AdminGuard>
      <CoursesAdmin />
    </AdminGuard>
  );
}
