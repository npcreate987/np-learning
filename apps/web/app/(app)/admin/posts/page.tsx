"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { AdminGuard } from "@/components/admin-guard";
import { Badge, Card } from "@/components/ui";

interface AdminPost {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; displayName: string | null; email: string };
  _count: { comments: number; likes: number };
}

function PostsAdmin() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPosts(await api.get<AdminPost[]>("/admin/posts", true));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "โหลดโพสต์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("ต้องการลบโพสต์นี้ใช่ไหม?")) return;
    setBusyId(id);
    try {
      await api.del(`/admin/posts/${id}`, true);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ลบโพสต์ไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">ตรวจสอบ Community</h1>
        <p className="mt-1 text-sm text-slate-500">โพสต์ล่าสุดในชุมชน สามารถลบโพสต์ที่ไม่เหมาะสมได้</p>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-medium underline">ปิด</button>
        </div>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
      ) : posts.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">ยังไม่มีโพสต์ในชุมชน</Card>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink">
                      {p.author.displayName ?? p.author.email}
                    </p>
                    <span className="text-xs text-slate-400">
                      {new Date(p.createdAt).toLocaleString("th-TH")}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{p.content}</p>
                  <div className="mt-3 flex gap-2">
                    <Badge className="bg-slate-100 text-slate-600">
                      ความคิดเห็น {p._count.comments}
                    </Badge>
                    <Badge className="bg-slate-100 text-slate-600">
                      ถูกใจ {p._count.likes}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => remove(p.id)}
                  disabled={busyId === p.id}
                  className="inline-flex h-9 items-center justify-center rounded-full border border-red-200 px-3 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  title="ลบโพสต์"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPostsPage() {
  return (
    <AdminGuard>
      <PostsAdmin />
    </AdminGuard>
  );
}
