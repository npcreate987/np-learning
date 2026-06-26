"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { api, ApiError } from "@/lib/api";
import { Button, Card, Input, Label } from "@/components/ui";
import { useState } from "react";

const DEV_AUTH = process.env.NEXT_PUBLIC_DEV_AUTH === "true";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSupabaseForm, setShowSupabaseForm] = useState(false);

  async function devLogin(role: "STUDENT" | "INSTRUCTOR" | "ADMIN") {
    setError(null);
    try {
      const res = await api.post<{ access_token: string }>(
        "/auth/dev-login",
        { role },
        false,
      );
      localStorage.setItem("np_dev_token", res.access_token);
      window.location.href = role === "STUDENT" ? "/dashboard" : "/studio";
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : "เชื่อมต่อ API ไม่ได้ — เปิด Docker แล้วรัน: cd apps/api && pnpm start:dev";
      setError(msg);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/my-courses");
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-slate-900">เข้าสู่ระบบ</h1>
        <p className="mt-1 text-sm text-slate-500">
          {DEV_AUTH ? "โหมดเดโม — กดปุ่มด้านล่างเพื่อเข้าดูระบบ" : "ยินดีต้อนรับกลับมา"}
        </p>

        {DEV_AUTH && (
          <div className="mt-6 rounded-2xl border border-lime/40 bg-lime/10 p-5">
            <p className="text-center text-sm font-semibold text-ink">
              เข้าระบบเดโม (ไม่ต้องพิมพ์รหัสผ่าน)
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => devLogin("STUDENT")}>
                นักเรียน
              </Button>
              <Button variant="outline" size="sm" onClick={() => devLogin("INSTRUCTOR")}>
                ผู้สอน
              </Button>
              <Button variant="outline" size="sm" onClick={() => devLogin("ADMIN")}>
                แอดมิน
              </Button>
            </div>
            <p className="mt-3 text-center text-xs text-slate-600">
              ต้องรัน API ก่อน (เทอร์มินัล: <code className="rounded bg-white/80 px-1">pnpm db:up</code>{" "}
              แล้ว <code className="rounded bg-white/80 px-1">cd apps/api && pnpm start:dev</code>)
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {DEV_AUTH ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowSupabaseForm((v) => !v)}
              className="text-sm text-slate-500 hover:text-brand-600"
            >
              {showSupabaseForm ? "ซ่อนฟอร์มอีเมล/รหัสผ่าน" : "ใช้ Supabase (อีเมล + รหัสผ่าน) →"}
            </button>
            {showSupabaseForm && (
              <form onSubmit={onSubmit} className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                <p className="text-xs text-amber-700">
                  ฟอร์มนี้ใช้ได้เมื่อตั้งค่า Supabase จริงแล้ว — โหมดเดโมไม่มีรหัสผ่านให้พิมพ์
                </p>
                <div>
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วย Supabase"}
                </Button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-slate-500">
          ยังไม่มีบัญชี?{" "}
          <Link href="/signup" className="font-medium text-brand-600 hover:underline">
            สมัครเรียน
          </Link>
        </p>
      </Card>
    </div>
  );
}
