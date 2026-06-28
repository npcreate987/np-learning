"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { api, ApiError } from "@/lib/api";
import { Button, Card, Input, Label } from "@/components/ui";

const DEV_AUTH = process.env.NEXT_PUBLIC_DEV_AUTH === "true";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  async function devLogin(role: "STUDENT" | "INSTRUCTOR" | "ADMIN") {
    setError(null);
    setDemoLoading(role);
    try {
      const res = await api.post<{ access_token: string }>(
        "/auth/dev-login",
        { role },
        false,
      );
      localStorage.setItem("np_dev_token", res.access_token);
      const target = role === "STUDENT" ? "/dashboard" : role === "ADMIN" ? "/admin" : "/studio";
      window.location.href = target;
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "ไม่สามารถเข้าสู่ระบบเดโมได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setDemoLoading(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-ink">เข้าสู่ระบบ</h1>
        <p className="mt-1 text-sm text-slate-500">ยินดีต้อนรับกลับมา เข้าสู่ระบบเพื่อเรียนต่อ</p>

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
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>
        </form>

        {DEV_AUTH && (
          <div className="mt-6">
            <div className="relative flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              <span>หรือ</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <p className="mt-4 text-center text-xs text-slate-500">
              เข้าระบบเดโม (สำหรับทดลอง ไม่ต้องใช้รหัสผ่าน)
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={demoLoading !== null}
                onClick={() => devLogin("STUDENT")}
              >
                {demoLoading === "STUDENT" ? "..." : "นักเรียน"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={demoLoading !== null}
                onClick={() => devLogin("INSTRUCTOR")}
              >
                {demoLoading === "INSTRUCTOR" ? "..." : "ผู้สอน"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={demoLoading !== null}
                onClick={() => devLogin("ADMIN")}
              >
                {demoLoading === "ADMIN" ? "..." : "แอดมิน"}
              </Button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          ยังไม่มีบัญชี?{" "}
          <Link href="/signup" className="font-medium text-brand-600 hover:underline">
            สมัครเรียน
          </Link>
        </p>
      </Card>
    </div>
  );
}
