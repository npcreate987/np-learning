"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  FileQuestion,
  Heart,
  LogIn,
  MessageCircle,
  Play,
  Share2,
  Sparkles,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { FeedVideoPlayer } from "./feed-video-player";
import { cn } from "@/lib/utils";

interface Clip {
  id: string;
  title: string;
  caption: string | null;
  videoUrl: string;
  durationSeconds: number | null;
}

interface Feed {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  instructor: { displayName: string | null };
  clips: Clip[];
}

function fmtDuration(s: number | null): string {
  if (!s || s <= 0) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function TiktokFeed({ slug }: { slug: string }) {
  const router = useRouter();
  const { session } = useAuth();
  const [feed, setFeed] = useState<Feed | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Lesson ids we've already recorded progress for this session, so we don't
  // POST /progress/complete repeatedly as the user scrolls back and forth.
  const markedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setLoadError(false);
    api
      .get<Feed>(`/courses/slug/${slug}/tiktok-feed`)
      .then((f) => setFeed(f))
      .catch(() => {
        setFeed(null);
        setLoadError(true);
      });
  }, [slug]);

  // Check enrollment + quiz presence once we have the course id and a session.
  useEffect(() => {
    if (!feed?.id) return;
    if (session) {
      api
        .get<{ enrolled: boolean }>(`/enrollments/check/${feed.id}`, true)
        .then((r) => setEnrolled(r.enrolled))
        .catch(() => setEnrolled(false));
      api
        .get<{ questions: unknown[] } | null>(`/quizzes/course/${feed.id}`, true)
        .then((q) => setHasQuiz(Boolean(q && q.questions.length > 0)))
        .catch(() => setHasQuiz(false));
    } else {
      setEnrolled(false);
      setHasQuiz(false);
    }
  }, [feed?.id, session]);

  // Record lesson progress: when a clip becomes the active one and the user
  // is enrolled, mark it complete. Viewing a short clip counts as completing
  // it (the API enforces enrollment before accepting the write).
  useEffect(() => {
    if (!feed || enrolled !== true) return;
    const clip = feed.clips[activeIdx];
    if (!clip || markedRef.current.has(clip.id)) return;
    markedRef.current.add(clip.id);
    api.post("/progress/complete", { lessonId: clip.id }, true).catch(() => {});
  }, [activeIdx, feed, enrolled]);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const h = el.clientHeight;
    const idx = Math.round(el.scrollTop / h);
    setActiveIdx(idx);
  }, []);

  async function startLearning() {
    if (!feed) return;
    if (!session) {
      router.push("/login");
      return;
    }
    setEnrolling(true);
    try {
      await api.post("/enrollments", { courseId: feed.id });
      setEnrolled(true);
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setEnrolling(false);
    }
  }

  // Hand the current clip's title/caption to the AI Tutor page so learners
  // can ask questions grounded in the lesson they just watched.
  function askAiAboutClip(clip: Clip) {
    if (!feed) return;
    const ctx = `คลาส "${feed.title}" คลิป "${clip.title}"${clip.caption ? ` — ${clip.caption}` : ""}`;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("np_lesson_context", ctx);
    }
    router.push("/ai-tutor");
  }

  async function shareClip() {
    if (!feed || typeof window === "undefined") return;
    const url = `${window.location.origin}/classes/${feed.slug}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: feed.title, url });
      } catch {
        /* user cancelled the share sheet — no-op */
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* clipboard blocked — ignore */
      }
    }
  }

  if (loadError) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-3 text-slate-500">
        <p>โหลดคลาสไม่สำเร็จ อาจเป็นคลาสที่ไม่มีอยู่หรือถูกลบไปแล้ว</p>
        <Link href="/classes" className="text-brand-600 hover:underline">
          กลับหน้าคลาสทั้งหมด
        </Link>
      </div>
    );
  }

  if (!feed) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-slate-400">
        กำลังโหลด...
      </div>
    );
  }

  if (feed.clips.length === 0) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-3 text-slate-500">
        <p>ยังไม่มีคลิปในคลาสนี้</p>
        <Link href="/classes" className="text-brand-600 hover:underline">
          กลับหน้าคลาสทั้งหมด
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-[calc(100vh-5rem)] max-w-md overflow-hidden rounded-3xl bg-black shadow-xl md:h-[calc(100vh-3rem)]">
      <Link
        href="/classes"
        className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur"
      >
        <ArrowLeft size={16} /> คลาสทั้งหมด
      </Link>

      <div
        ref={containerRef}
        onScroll={onScroll}
        className="h-full snap-y snap-mandatory overflow-y-scroll scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {feed.clips.map((clip, i) => (
          <section
            key={clip.id}
            className="relative h-full w-full shrink-0 snap-start snap-always"
          >
            {clip.videoUrl && (
              <FeedVideoPlayer url={clip.videoUrl} active={i === activeIdx} />
            )}

            {/* gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-black/30" />

            {/* right actions */}
            <div className="absolute bottom-28 right-3 z-10 flex flex-col items-center gap-5">
              <button
                onClick={() =>
                  setLiked((s) => {
                    const n = new Set(s);
                    if (n.has(clip.id)) n.delete(clip.id);
                    else n.add(clip.id);
                    return n;
                  })
                }
                className="flex flex-col items-center gap-1 text-white"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur",
                    liked.has(clip.id) && "bg-red-500/80",
                  )}
                >
                  <Heart size={22} className={cn(liked.has(clip.id) && "fill-white")} />
                </span>
                <span className="text-xs">{liked.has(clip.id) ? "1" : "0"}</span>
              </button>
              <button
                onClick={() => askAiAboutClip(clip)}
                className="flex flex-col items-center gap-1 text-white"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                  <MessageCircle size={22} />
                </span>
                <span className="text-xs">ถาม</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-white">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                  <Bookmark size={22} />
                </span>
                <span className="text-xs">บันทึก</span>
              </button>
              <button
                onClick={shareClip}
                className="flex flex-col items-center gap-1 text-white"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                  <Share2 size={20} />
                </span>
              </button>
            </div>

            {/* bottom info */}
            <div className="absolute bottom-4 left-0 right-14 z-10 px-4 text-white">
              <p className="text-sm font-bold">@{feed.instructor.displayName ?? "ผู้สอน"}</p>
              <p className="mt-1 text-xs text-white/70">{feed.title}</p>
              <p className="mt-2 text-sm font-semibold leading-snug">{clip.title}</p>
              {clip.caption && (
                <p className="mt-1 line-clamp-2 text-sm text-white/90">{clip.caption}</p>
              )}

              {enrolled ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => askAiAboutClip(clip)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1.5 text-xs font-semibold text-ink"
                  >
                    <Sparkles size={14} /> ถาม AI เกี่ยวกับคลิปนี้
                  </button>
                  {hasQuiz && (
                    <Link
                      href={`/quiz/${feed.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"
                    >
                      <FileQuestion size={14} /> แบบทดสอบท้ายคลาส
                    </Link>
                  )}
                </div>
              ) : (
                <button
                  onClick={startLearning}
                  disabled={enrolling}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-4 py-2 text-xs font-bold text-ink transition hover:bg-gold-300 disabled:opacity-60"
                >
                  {session ? (
                    <>
                      <Play size={14} fill="currentColor" />
                      {enrolling ? "กำลังเริ่ม..." : "เริ่มเรียน"}
                    </>
                  ) : (
                    <>
                      <LogIn size={14} /> เข้าสู่ระบบเพื่อเริ่มเรียน
                    </>
                  )}
                </button>
              )}
            </div>

            {/* clip counter + duration */}
            <div className="absolute right-3 top-14 z-10 flex items-center gap-2">
              {fmtDuration(clip.durationSeconds) && (
                <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs text-white">
                  {fmtDuration(clip.durationSeconds)}
                </span>
              )}
              <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs text-white">
                {i + 1}/{feed.clips.length}
              </span>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
