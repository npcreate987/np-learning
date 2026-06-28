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
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "กำลังยืนยัน..." : "ยืนยันรหัส"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ไม่ได้รับรหัส? ตรวจสอบกล่องจดหมายรวมทั้งสแปม หรือ{" "}
          <Link
            href="/signup"
            className="font-medium text-brand-600 hover:underline"
          >
            สมัครใหม่
          </Link>
        </p>
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
