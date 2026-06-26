"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { VerticalVideoPlayer } from "./vertical-video-player";
import { cn } from "@/lib/utils";

interface Clip {
  id: string;
  title: string;
  caption: string | null;
  videoUrl: string;
  durationSeconds: number | null;
}

interface Feed {
  slug: string;
  title: string;
  instructor: { displayName: string | null };
  clips: Clip[];
}

export function TiktokFeed({ slug }: { slug: string }) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<Feed>(`/courses/slug/${slug}/tiktok-feed`).then(setFeed).catch(() => setFeed(null));
  }, [slug]);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const h = el.clientHeight;
    const idx = Math.round(el.scrollTop / h);
    setActiveIdx(idx);
  }, []);

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
          กลับหน้าคลาส TikTok
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
        <ArrowLeft size={16} /> คลาส TikTok
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
              <VerticalVideoPlayer url={clip.videoUrl} active={i === activeIdx} />
            )}

            {/* gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

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
              <button className="flex flex-col items-center gap-1 text-white">
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
              <button className="flex flex-col items-center gap-1 text-white">
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
              <Link
                href="/ai-tutor"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1.5 text-xs font-semibold text-ink"
              >
                <Sparkles size={14} /> ถาม AI เกี่ยวกับคลิปนี้
              </Link>
            </div>

            {/* clip counter */}
            <div className="absolute right-3 top-14 z-10 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white">
              {i + 1}/{feed.clips.length}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
