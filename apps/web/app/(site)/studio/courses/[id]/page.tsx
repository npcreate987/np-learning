"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Trash2, Upload } from "lucide-react";
import { api, ApiError, uploadFile } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Badge, Button, Card, Input, Label, Textarea } from "@/components/ui";
import Link from "next/link";

interface EditLesson {
  id: string;
  title: string;
  contentJson: unknown;
  videoUrl?: string | null;
  caption?: string | null;
  durationSeconds?: number | null;
  order: number;
}
interface EditSection {
  id: string;
  title: string;
  order: number;
  lessons: EditLesson[];
}
interface EditCourse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  priceCents: number;
  status: "DRAFT" | "PUBLISHED";
  sections: EditSection[];
}

export default function CourseEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [course, setCourse] = useState<EditCourse | null>(null);
  const [loading, setLoading] = useState(true);

  // course meta buffer
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [savingMeta, setSavingMeta] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // clip editing
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonCaption, setLessonCaption] = useState("");
  const [lessonDuration, setLessonDuration] = useState<string>("");
  const [savingLesson, setSavingLesson] = useState(false);

  const reload = useCallback(async () => {
    const c = await api.get<EditCourse>(`/courses/${id}/edit`, true);
    setCourse(c);
    setTitle(c.title);
    setDescription(c.description ?? "");
    setPrice(Math.round(c.priceCents / 100));
    return c;
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.push("/login");
      return;
    }
    reload()
      .catch((e) => {
        if (e instanceof ApiError) alert(e.message);
        router.push("/studio");
      })
      .finally(() => setLoading(false));
  }, [session, authLoading, reload, router]);

  function selectLesson(lesson: EditLesson) {
    setActiveLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonVideoUrl(lesson.videoUrl ?? "");
    setLessonCaption(lesson.caption ?? "");
    setLessonDuration(lesson.durationSeconds ? String(lesson.durationSeconds) : "");
  }

  async function saveMeta() {
    setSavingMeta(true);
    try {
      await api.patch(`/courses/${id}`, {
        title,
        description,
        priceCents: Math.max(0, Math.round(price * 100)),
      });
      await reload();
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setSavingMeta(false);
    }
  }

  async function togglePublish() {
    if (!course) return;
    const action = course.status === "PUBLISHED" ? "unpublish" : "publish";
    await api.post(`/courses/${id}/${action}`);
    await reload();
  }

  async function onCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      await api.patch(`/courses/${id}`, { coverImageUrl: url });
      await reload();
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function onVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const url = await uploadFile(file);
      setLessonVideoUrl(url);
      if (!lessonTitle.trim() || lessonTitle === "คลิปใหม่") {
        setLessonTitle(file.name.replace(/\.[^.]+$/, ""));
      }
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  }

  async function addSection() {
    await api.post("/sections", { courseId: id, title: "กลุ่มคลิปใหม่" });
    await reload();
  }
  async function renameSection(sectionId: string, current: string) {
    const next = prompt("ชื่อกลุ่มคลิป", current);
    if (next === null) return;
    await api.patch(`/sections/${sectionId}`, { title: next });
    await reload();
  }
  async function deleteSection(sectionId: string) {
    if (!confirm("ลบกลุ่มคลิปนี้และคลิปทั้งหมดในกลุ่ม?")) return;
    await api.del(`/sections/${sectionId}`);
    await reload();
  }

  async function addLesson(sectionId: string) {
    const lesson = await api.post<{ id: string }>("/lessons", {
      sectionId,
      title: "คลิปใหม่",
    });
    const c = await reload();
    const created = c.sections
      .flatMap((s) => s.lessons)
      .find((l) => l.id === lesson.id);
    if (created) selectLesson(created);
  }
  async function deleteLesson(lessonId: string) {
    if (!confirm("ลบคลิปนี้?")) return;
    await api.del(`/lessons/${lessonId}`);
    if (activeLessonId === lessonId) setActiveLessonId(null);
    await reload();
  }

  async function saveLesson() {
    if (!activeLessonId) return;
    setSavingLesson(true);
    try {
      const duration = lessonDuration.trim();
      await api.patch(`/lessons/${activeLessonId}`, {
        title: lessonTitle,
        videoUrl: lessonVideoUrl,
        caption: lessonCaption || undefined,
        durationSeconds: duration ? Math.max(0, Math.round(Number(duration))) : undefined,
        type: lessonVideoUrl ? "VIDEO" : undefined,
      });
      await reload();
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setSavingLesson(false);
    }
  }

  if (authLoading || loading || !course) {
    return <div className="h-96 animate-pulse rounded-xl bg-slate-200" />;
  }

  return (
    <div className="py-4">
      <Link
        href="/studio"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> กลับหน้าผู้สอน
      </Link>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left: course meta + structure */}
        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">ข้อมูลคลาส</h2>
              <Badge
                className={
                  course.status === "PUBLISHED"
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700"
                }
              >
                {course.status === "PUBLISHED" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <Label>ชื่อคลาส</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>คำอธิบาย</Label>
                <Textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <Label>ราคา (บาท, 0 = ฟรี)</Label>
                <Input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>ภาพปก</Label>
                {course.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.coverImageUrl}
                    alt="cover"
                    className="mb-2 aspect-[9/14] w-full max-w-[10rem] rounded-lg object-cover"
                  />
                )}
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600 hover:bg-slate-50">
                  <Upload size={16} />
                  {uploading ? "กำลังอัปโหลด..." : "อัปโหลดภาพปก"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onCoverChange}
                    disabled={uploading}
                  />
                </label>
              </div>

              <div className="flex gap-2 pt-1">
                <Button onClick={saveMeta} disabled={savingMeta} className="flex-1">
                  <Save size={16} /> {savingMeta ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
                <Button variant="outline" onClick={togglePublish}>
                  {course.status === "PUBLISHED" ? "ยกเลิกเผยแพร่" : "เผยแพร่"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">โครงสร้างคลิป</h2>
              <Button size="sm" variant="outline" onClick={addSection}>
                <Plus size={14} /> เพิ่มกลุ่มคลิป
              </Button>
            </div>

            <div className="space-y-4">
              {course.sections.map((section) => (
                <div key={section.id}>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => renameSection(section.id, section.title)}
                      className="text-left text-sm font-medium text-slate-800 hover:text-brand-700"
                    >
                      {section.title}
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="text-slate-400 hover:text-red-600"
                      aria-label="ลบกลุ่มคลิป"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-1 space-y-1 border-l border-slate-200 pl-3">
                    {section.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                          activeLessonId === lesson.id
                            ? "bg-brand-50 text-brand-700"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <button
                          className="flex-1 text-left"
                          onClick={() => selectLesson(lesson)}
                        >
                          {lesson.title}
                        </button>
                        <button
                          onClick={() => deleteLesson(lesson.id)}
                          className="text-slate-400 hover:text-red-600"
                          aria-label="ลบคลิป"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addLesson(section.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-brand-600 hover:underline"
                    >
                      <Plus size={12} /> เพิ่มคลิป
                    </button>
                  </div>
                </div>
              ))}
              {course.sections.length === 0 && (
                <p className="text-sm text-slate-400">ยังไม่มีกลุ่มคลิป กด "เพิ่มกลุ่มคลิป" เพื่อเริ่ม</p>
              )}
            </div>
          </Card>

          <Link href={`/studio/courses/${id}/quiz`}>
            <Card className="flex items-center justify-between p-4 transition hover:shadow-md">
              <div>
                <p className="font-semibold text-slate-900">แบบทดสอบท้ายคลาส</p>
                <p className="text-sm text-slate-500">สร้างข้อสอบ + ออกใบประกาศเมื่อผ่าน</p>
              </div>
              <Plus size={18} className="text-brand-600" />
            </Card>
          </Link>
        </div>

        {/* Right: clip editor */}
        <Card className="p-5">
          {activeLessonId ? (
            <div className="space-y-4">
              <div>
                <Label>ชื่อคลิป</Label>
                <Input
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                />
              </div>
              <div>
                <Label>วิดีโอ (YouTube / .mp4 / Bunny Stream — แนวนอนหรือแนวตั้ง)</Label>
                <Input
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  placeholder="วางลิงก์ YouTube หรือ URL .mp4"
                />
                <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">
                  <Upload size={14} />
                  {uploadingVideo ? "กำลังอัปโหลดวิดีโอ..." : "อัปโหลดไฟล์วิดีโอ (.mp4 ฯลฯ)"}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={onVideoFileChange}
                    disabled={uploadingVideo}
                  />
                </label>
                <p className="mt-1 text-xs text-slate-400">
                  อัปโหลดแล้ว URL จะใส่ช่องด้านบนให้อัตโนมัติ จากนั้นกด “บันทึกคลิป”
                </p>
              </div>
              <div>
                <Label>คำบรรยายคลิป (แสดงบนฟีด)</Label>
                <Input
                  value={lessonCaption}
                  onChange={(e) => setLessonCaption(e.target.value)}
                  placeholder="สรุปสั้นๆ ว่าคลิปนี้สอนอะไร..."
                />
              </div>
              <div>
                <Label>ระยะเวลา (วินาที)</Label>
                <Input
                  type="number"
                  min={0}
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                  placeholder="เช่น 45"
                />
              </div>
              {course.status === "PUBLISHED" && (
                <Link
                  href={`/classes/${course.slug}`}
                  className="inline-block text-sm font-medium text-brand-600 hover:underline"
                >
                  ดูตัวอย่างฟีด →
                </Link>
              )}
              <Button onClick={saveLesson} disabled={savingLesson}>
                <Save size={16} /> {savingLesson ? "กำลังบันทึก..." : "บันทึกคลิป"}
              </Button>
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center text-slate-400">
              เลือกคลิปทางซ้าย หรือเพิ่มคลิปใหม่เพื่อแก้ไขเนื้อหา
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
