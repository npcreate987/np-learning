"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button, Card, Input, Label } from "@/components/ui";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Capture an affiliate referral code from the URL so the auth provider can
  // link this new account to its referrer right after the first login.
  useEffect(() => {
    const ref = params.get("ref");
    if (ref && typeof window !== "undefined") {
      localStorage.setItem("np_ref_code", ref.trim().toUpperCase());
    }
  }, [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push("/dashboard");
    } else {
      // Email OTP verification — user enters the 6-digit code on /verify.
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-slate-900">สมัครเรียน</h1>
        <p className="mt-1 text-sm text-slate-500">สร้างบัญชีเพื่อเริ่มเรียนได้ทันที</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">ชื่อที่แสดง</Label>
            <Input
              id="name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ชื่อของคุณ"
            />
          </div>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "กำลังสมัคร..." : "สมัครเรียน"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md py-10"><Card className="p-8"><p className="text-center text-sm text-slate-500">กำลังโหลด...</p></Card></div>}>
      <SignupForm />
    </Suspense>
  );
}
