"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Circle, FileQuestion, Menu, Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui";
import { LessonContent } from "@/components/lesson-content";
import { VideoPlayer } from "@/components/video-player";
import { cn } from "@/lib/utils";

/** Recursively pull plain text out of a Tiptap JSON document. */
function extractText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { text?: string; content?: unknown[] };
  let out = n.text ?? "";
  if (Array.isArray(n.content)) {
    out += n.content.map(extractText).join(" ");
  }
  return out;
}

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  sections: {
    id: string;
    title: string;
    lessons: { id: string; title: string; order: number }[];
  }[];
}

interface LessonDetail {
  id: string;
  title: string;
  contentJson: unknown;
  type: string;
  videoUrl?: string | null;
}

export default function LearnPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false);

  const flatLessons = useMemo(
    () => course?.sections.flatMap((s) => s.lessons) ?? [],
    [course],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.push("/login");
      return;
    }
    api.get<CourseDetail>(`/courses/slug/${slug}`).then((c) => {
      setCourse(c);
      const first = c.sections.flatMap((s) => s.lessons)[0];
      if (first) setActiveLessonId(first.id);
    });
  }, [slug, session, authLoading, router]);

  const loadProgress = useCallback((courseId: string) => {
    api
      .get<{ completedLessonIds: string[] }>(`/progress/course/${courseId}`, true)
      .then((p) => setCompleted(new Set(p.completedLessonIds)))
      .catch(() => setCompleted(new Set()));
  }, []);

  useEffect(() => {
    if (course) loadProgress(course.id);
  }, [course, loadProgress]);

  useEffect(() => {
    if (!course) return;
    api
      .get<{ questions: unknown[] } | null>(`/quizzes/course/${course.id}`, true)
      .then((q) => setHasQuiz(Boolean(q && q.questions.length > 0)))
      .catch(() => setHasQuiz(false));
  }, [course]);

  function askAiAboutLesson() {
    if (!lesson) return;
    const text = extractText(lesson.contentJson).replace(/\s+/g, " ").trim();
    const ctx = `บทเรียน: ${lesson.title}\n\n${text}`.slice(0, 6000);
    sessionStorage.setItem("np_lesson_context", ctx);
    router.push("/ai-tutor");
  }

  useEffect(() => {
    if (!activeLessonId) return;
    setLoadingLesson(true);
    api
      .get<LessonDetail>(`/lessons/${activeLessonId}`, true)
      .then(setLesson)
      .catch((e) => {
        if (e instanceof ApiError) setLesson(null);
      })
      .finally(() => setLoadingLesson(false));
  }, [activeLessonId]);

  async function toggleComplete() {
    if (!activeLessonId) return;
    const isDone = completed.has(activeLessonId);
    const next = new Set(completed);
    try {
      if (isDone) {
        await api.del(`/progress/complete/${activeLessonId}`);
        next.delete(activeLessonId);
      } else {
        await api.post("/progress/complete", { lessonId: activeLessonId });
        next.add(activeLessonId);
      }
      setCompleted(next);
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    }
  }

  if (authLoading || !course) {
    return <div className="h-96 animate-pulse rounded-xl bg-slate-200" />;
  }

  const total = flatLessons.length;
  const done = flatLessons.filter((l) => completed.has(l.id)).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="-mt-6 grid min-h-[calc(100vh-4rem)] grid-cols-1 md:grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <aside
        className={cn(
          "border-r border-slate-200 bg-white md:block",
          sidebarOpen ? "block" : "hidden",
        )}
      >
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-semibold text-slate-900">{course.title}</h2>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500">
              <span>ความคืบหน้า</span>
              <span>{percent}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
        <nav className="max-h-[calc(100vh-12rem)] overflow-y-auto p-2">
          {course.sections.map((section) => (
            <div key={section.id} className="mb-3">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {section.title}
              </p>
              {section.lessons.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setActiveLessonId(l.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm",
                    activeLessonId === l.id
                      ? "bg-brand-50 font-medium text-brand-700"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  {completed.has(l.id) ? (
                    <CheckCircle2 size={16} className="shrink-0 text-green-600" />
                  ) : (
                    <Circle size={16} className="shrink-0 text-slate-300" />
                  )}
                  <span className="line-clamp-2">{l.title}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <section className="bg-white p-4 sm:p-8">
        <button
          className="mb-4 flex items-center gap-2 text-sm text-slate-600 md:hidden"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          <Menu size={18} /> รายการบทเรียน
        </button>

        {loadingLesson ? (
          <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
        ) : lesson ? (
          <article className="mx-auto max-w-3xl">
            <h1 className="text-2xl font-bold text-slate-900">{lesson.title}</h1>
            {lesson.videoUrl && (
              <div className="mt-6">
                <VideoPlayer url={lesson.videoUrl} />
              </div>
            )}
            <div className="mt-6">
              <LessonContent content={lesson.contentJson} />
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
              <Button
                onClick={toggleComplete}
                variant={
                  activeLessonId && completed.has(activeLessonId) ? "outline" : "primary"
                }
              >
                {activeLessonId && completed.has(activeLessonId) ? (
                  <>
                    <CheckCircle2 size={18} /> เรียนจบแล้ว (กดเพื่อยกเลิก)
                  </>
                ) : (
                  "ทำเครื่องหมายว่าเรียนจบ"
                )}
              </Button>
              <Button variant="outline" onClick={askAiAboutLesson}>
                <Sparkles size={18} /> ถาม AI เกี่ยวกับบทนี้
              </Button>
              {hasQuiz && (
                <Link href={`/quiz/${course.id}`}>
                  <Button variant="outline">
                    <FileQuestion size={18} /> ทำแบบทดสอบท้ายคอร์ส
                  </Button>
                </Link>
              )}
            </div>
          </article>
        ) : (
          <p className="text-slate-500">เลือกบทเรียนจากเมนูด้านซ้าย</p>
        )}
      </section>
    </div>
  );
}
