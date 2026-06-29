"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button, Card, Input, Label } from "@/components/ui";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    return (
      <div className="mx-auto max-w-md py-10">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-ink">ลิงก์ไม่ถูกต้อง</h1>
          <p className="mt-3 text-sm text-slate-500">
            ไม่พบอีเมลที่จะยืนยัน กรุณาสมัครใหม่อีกครั้งเพื่อรับรหัสยืนยัน
          </p>
          <Link href="/signup" className="mt-6 inline-block">
            <Button>ไปหน้าสมัคร</Button>
          </Link>
        </Card>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: "signup",
    });
    setLoading(false);
    if (error) {
      setError("รหัสไม่ถูกต้องหรือหมดอายุ กรุณาตรวจสอบแล้วลองอีกครั้ง");
      return;
    }
    if (data.session) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }

  async function onResend() {
    if (!email) return;
    setError(null);
    setInfo(null);
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo(`ส่งรหัสใหม่ไปยัง ${email} แล้ว`);
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-ink">ยืนยันอีเมล</h1>
        <p className="mt-1 text-sm text-slate-500">
          กรอกรหัส 6 หลักที่ส่งไปยังอีเมล{email ? ` ${email}` : ""} เพื่อยืนยันบัญชี
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="token">รหัสยืนยัน (OTP)</Label>
            <Input
              id="token"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="tracking-[0.5em] text-center text-lg"
            />
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">
              {info}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "กำลังยืนยัน..." : "ยืนยันรหัส"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onResend}
            disabled={resending || !email}
            className="font-medium text-brand-600 hover:underline disabled:opacity-50"
          >
            {resending ? "กำลังส่ง..." : "ส่งรหัสใหม่"}
          </button>
          <Link href="/signup" className="text-slate-500 hover:underline">
            สมัครใหม่
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md py-10">
          <Card className="p-8">
            <p className="text-center text-sm text-slate-500">กำลังโหลด...</p>
          </Card>
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
