"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { AdminGuard } from "@/components/admin-guard";
import { Badge, Button, Card, Input, Label, Textarea } from "@/components/ui";
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

interface InstructorOption {
  id: string;
  displayName: string | null;
  email: string;
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

  // ---- create course ----
  const [showCreate, setShowCreate] = useState(false);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [form, setForm] = useState({
    title: "",
    instructorId: "",
    description: "",
    priceBaht: "",
    coverImageUrl: "",
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function openCreate() {
    setShowCreate(true);
    setFormError(null);
    if (instructors.length > 0) return;
    setLoadingInstructors(true);
    try {
      const users = await api.get<InstructorOption[]>("/admin/users?role=INSTRUCTOR", true);
      setInstructors(users);
      setForm((f) => ({ ...f, instructorId: users[0]?.id ?? "" }));
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "โหลดรายชื่อผู้สอนไม่สำเร็จ");
    } finally {
      setLoadingInstructors(false);
    }
  }

  function closeCreate() {
    setShowCreate(false);
    setFormError(null);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title || !form.instructorId) return;
    const baht = Number(form.priceBaht);
    const priceCents = form.priceBaht && Number.isFinite(baht) ? Math.round(baht * 100) : undefined;
    setCreating(true);
    setFormError(null);
    try {
      const created = await api.post<AdminCourse>(
        "/admin/courses",
        {
          title,
          instructorId: form.instructorId,
          description: form.description.trim() || undefined,
          coverImageUrl: form.coverImageUrl.trim() || undefined,
          priceCents,
        },
        true,
      );
      setCourses((prev) => [created, ...prev]);
      setForm({ title: "", instructorId: instructors[0]?.id ?? "", description: "", priceBaht: "", coverImageUrl: "" });
      setShowCreate(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "สร้างคอร์สไม่สำเร็จ");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">จัดการคอร์สทั้งหมด</h1>
          <p className="mt-1 text-sm text-slate-500">เพิ่ม ควบคุมสถานะ และลบคอร์สของผู้สอนทุกคน</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} /> เพิ่มคอร์ส
        </Button>
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

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={closeCreate}
        >
          <Card
            className="w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">เพิ่มคอร์สใหม่</h2>
              <button
                onClick={closeCreate}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="ปิด"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={submitCreate} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="ac-title">ชื่อคอร์ส</Label>
                <Input
                  id="ac-title"
                  required
                  minLength={3}
                  maxLength={160}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="เช่น TikTok Marketing 101"
                />
              </div>

              <div>
                <Label htmlFor="ac-instructor">ผู้สอน</Label>
                {loadingInstructors ? (
                  <p className="text-sm text-slate-400">กำลังโหลดรายชื่อผู้สอน...</p>
                ) : instructors.length === 0 ? (
                  <p className="text-sm text-amber-600">
                    ยังไม่มีผู้สอนในระบบ กรุณาตั้งผู้ใช้คนหนึ่งเป็นผู้สอนก่อนในหน้าจัดการผู้ใช้
                  </p>
                ) : (
                  <select
                    id="ac-instructor"
                    value={form.instructorId}
                    onChange={(e) => setForm((f) => ({ ...f, instructorId: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    {instructors.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName ?? u.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <Label htmlFor="ac-desc">รายละเอียด</Label>
                <Textarea
                  id="ac-desc"
                  rows={3}
                  maxLength={5000}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="คำอธิบายคอร์ส (ไม่บังคับ)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ac-price">ราคา (บาท)</Label>
                  <Input
                    id="ac-price"
                    type="number"
                    min={0}
                    step={1}
                    value={form.priceBaht}
                    onChange={(e) => setForm((f) => ({ ...f, priceBaht: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="ac-cover">URL รูปปก</Label>
                  <Input
                    id="ac-cover"
                    type="url"
                    maxLength={2048}
                    value={form.coverImageUrl}
                    onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                    placeholder="https://... (ไม่บังคับ)"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeCreate}>
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={creating || !form.title.trim() || !form.instructorId || instructors.length === 0}
                >
                  {creating ? "กำลังสร้าง..." : "สร้างคอร์ส"}
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                คอร์สจะถูกสร้างเป็น “ฉบับร่าง” ผู้สอนสามารถเข้าไปเพิ่มคลิปและเผยแพร่เองได้ที่ Studio
              </p>
            </form>
          </Card>
        </div>
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
