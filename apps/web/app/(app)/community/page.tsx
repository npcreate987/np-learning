"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Heart,
  Loader2,
  MessageCircle,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

interface Author {
  id: string;
  displayName: string | null;
}

interface PostItem {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
  commentCount: number;
  likeCount: number;
  liked: boolean;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "เมื่อสักครู่";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString("th-TH");
}

function initial(name: string | null): string {
  return (name?.trim()?.[0] ?? "U").toUpperCase();
}

export default function CommunityPage() {
  const { session, profile } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<PostItem[]>("/community/posts", true);
      setPosts(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "โหลดโพสต์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      const created = await api.post<PostItem>("/community/posts", { content: text }, true);
      setPosts((p) => [{ ...created, commentCount: 0, likeCount: 0, liked: false }, ...p]);
      setContent("");
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "โพสต์ไม่สำเร็จ");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime text-ink">
          <Users size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink">Community</h1>
          <p className="text-sm text-slate-500">พื้นที่พูดคุย แลกเปลี่ยน และถามตอบกับเพื่อนผู้เรียน</p>
        </div>
      </div>

      {/* Composer */}
      {session ? (
        <form onSubmit={submitPost} className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 font-semibold text-white">
              {initial(profile?.displayName ?? profile?.email ?? null)}
            </span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              placeholder="แชร์ความคิด ตั้งคำถาม หรือเล่าความสำเร็จของคุณ..."
              className="flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={posting || !content.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm font-semibold text-lime transition hover:bg-ink-800 disabled:opacity-40"
            >
              {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              โพสต์
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-3xl bg-white p-5 text-center text-sm text-slate-500 shadow-sm">
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            เข้าสู่ระบบ
          </Link>{" "}
          เพื่อร่วมพูดคุยและโพสต์ในคอมมูนิตี้
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-10 text-slate-400">
          <Loader2 className="animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">{error}</p>
          <button
            onClick={load}
            className="mt-3 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            ลองใหม่
          </button>
          <p className="mt-3 text-xs text-slate-400">
            (ต้องรัน API และตั้งค่าฐานข้อมูลก่อน คอมมูนิตี้จึงจะทำงาน)
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          ยังไม่มีโพสต์ มาเป็นคนแรกที่เริ่มพูดคุยกันเลย!
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              canPost={Boolean(session)}
              currentUserId={profile?.id ?? null}
              isAdmin={profile?.role === "ADMIN"}
              onDeleted={(id) => setPosts((p) => p.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  canPost,
  currentUserId,
  isAdmin,
  onDeleted,
}: {
  post: PostItem;
  canPost: boolean;
  currentUserId: string | null;
  isAdmin: boolean;
  onDeleted: (id: string) => void;
}) {
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [likeBusy, setLikeBusy] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [newComment, setNewComment] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  const canDelete = isAdmin || (currentUserId && currentUserId === post.author.id);

  async function toggleLike() {
    if (!canPost || likeBusy) return;
    setLikeBusy(true);
    const prev = { liked, likeCount };
    setLiked(!liked);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      const res = await api.post<{ liked: boolean; likeCount: number }>(
        `/community/posts/${post.id}/like`,
        undefined,
        true,
      );
      setLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch {
      setLiked(prev.liked);
      setLikeCount(prev.likeCount);
    } finally {
      setLikeBusy(false);
    }
  }

  async function openComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) {
      try {
        const data = await api.get<CommentItem[]>(`/community/posts/${post.id}/comments`);
        setComments(data);
      } catch {
        setComments([]);
      }
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    const text = newComment.trim();
    if (!text || commentBusy) return;
    setCommentBusy(true);
    try {
      const created = await api.post<CommentItem>(
        `/community/posts/${post.id}/comments`,
        { content: text },
        true,
      );
      setComments((c) => [...(c ?? []), created]);
      setCommentCount((n) => n + 1);
      setNewComment("");
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "คอมเมนต์ไม่สำเร็จ");
    } finally {
      setCommentBusy(false);
    }
  }

  async function remove() {
    if (!confirm("ลบโพสต์นี้?")) return;
    try {
      await api.del(`/community/posts/${post.id}`, true);
      onDeleted(post.id);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "ลบไม่สำเร็จ");
    }
  }

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-semibold text-lime">
          {initial(post.author.displayName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink">{post.author.displayName ?? "ผู้ใช้"}</p>
              <p className="text-xs text-slate-400">{timeAgo(post.createdAt)}</p>
            </div>
            {canDelete && (
              <button
                onClick={remove}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
                aria-label="ลบโพสต์"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {post.content}
          </p>

          <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
            <button
              onClick={toggleLike}
              disabled={!canPost}
              className={cn(
                "inline-flex items-center gap-1.5 transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60",
                liked && "text-red-500",
              )}
            >
              <Heart size={18} className={cn(liked && "fill-current")} />
              {likeCount}
            </button>
            <button
              onClick={openComments}
              className="inline-flex items-center gap-1.5 transition hover:text-brand-600"
            >
              <MessageCircle size={18} />
              {commentCount}
            </button>
          </div>

          {showComments && (
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              {comments === null ? (
                <div className="flex justify-center text-slate-300">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-slate-400">ยังไม่มีคอมเมนต์</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                      {initial(c.author.displayName)}
                    </span>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <p className="text-xs font-semibold text-ink">
                        {c.author.displayName ?? "ผู้ใช้"}
                        <span className="ml-2 font-normal text-slate-400">{timeAgo(c.createdAt)}</span>
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{c.content}</p>
                    </div>
                  </div>
                ))
              )}

              {canPost && (
                <form onSubmit={addComment} className="flex items-center gap-2 pt-1">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="เขียนคอมเมนต์..."
                    className="h-9 flex-1 rounded-full border border-slate-200 px-3 text-sm focus:border-brand-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={commentBusy || !newComment.trim()}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-lime disabled:opacity-40"
                    aria-label="ส่งคอมเมนต์"
                  >
                    <Send size={15} />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
