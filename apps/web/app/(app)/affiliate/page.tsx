"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share2, Users } from "lucide-react";
import type { ReferralMe } from "@app/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Badge, Button, Card } from "@/components/ui";

export default function AffiliatePage() {
  const { profile, loading: authLoading } = useAuth();
  const [data, setData] = useState<ReferralMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!profile) {
      setLoading(false);
      return;
    }
    api
      .get<ReferralMe>("/referral/me", true)
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ"),
      )
      .finally(() => setLoading(false));
  }, [authLoading, profile]);

  async function copyLink() {
    if (!data) return;
    const link = `${origin}/signup?ref=${data.referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard permissions.
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function share() {
    if (!data) return;
    const link = `${origin}/signup?ref=${data.referralCode}`;
    const text = "สมัครเรียนกับ NP Learning ผ่านลิงก์ของฉัน";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "NP Learning", text, url: link });
      } catch {
        /* user cancelled */
      }
    } else {
      copyLink();
    }
  }

  if (authLoading || loading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />;
  }

  if (!profile) {
    return <p className="py-10 text-center text-slate-500">กรุณาเข้าสู่ระบบ</p>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md py-10">
        <Card className="p-8 text-center text-red-600">{error}</Card>
      </div>
    );
  }

  const referralLink = data ? `${origin}/signup?ref=${data.referralCode}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Affiliate</h1>
        <p className="mt-1 text-sm text-slate-500">
          แชร์ลิงก์แนะนำเพื่อชวนเพื่อนมาเรียน และติดตามยอดได้ที่นี่
        </p>
      </div>

      {/* Referral link card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-ink to-ink-800 p-6 text-white">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-gold-400" />
            <h2 className="font-semibold">ลิงก์แนะนำของคุณ</h2>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            ส่งลิงก์นี้ให้เพื่อน เมื่อพวกเขาสมัครจะถูกบันทึกเป็นยอดแนะนำของคุณ
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center rounded-full bg-white/10 px-4 py-2.5 text-sm text-white ring-1 ring-white/15">
              <span className="truncate">{referralLink || "กำลังสร้างลิงก์..."}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={copyLink}
                disabled={!data}
                className="bg-white text-ink hover:bg-slate-100"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "คัดลอกแล้ว" : "คัดลอก"}
              </Button>
              <Button
                variant="outline"
                onClick={share}
                disabled={!data}
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                <Share2 size={16} /> แชร์
              </Button>
            </div>
          </div>

          {data?.referredBy && (
            <p className="mt-4 text-xs text-slate-300">
              คุณถูกแนะนำโดย: {data.referredBy.displayName ?? data.referredBy.referralCode}
            </p>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Users size={22} />
          </span>
          <div>
            <p className="text-lg font-bold text-ink">{data?.stats.referrals ?? 0}</p>
            <p className="text-xs text-slate-400">ผู้ที่แนะนำ</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-400 text-ink">
            <Check size={22} />
          </span>
          <div>
            <p className="text-lg font-bold text-ink">{data?.stats.enrolled ?? 0}</p>
            <p className="text-xs text-slate-400">สมัครเรียนแล้ว</p>
          </div>
        </Card>
      </div>

      {/* Recent referrals */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink">รายชื่อที่แนะนำล่าสุด</h2>
          {(data?.recentReferrals.length ?? 0) > 0 && (
            <Badge>ทั้งหมด {data?.stats.referrals ?? 0}</Badge>
          )}
        </div>

        {(!data || data.recentReferrals.length === 0) ? (
          <p className="py-6 text-center text-sm text-slate-400">
            ยังไม่มีใครสมัครผ่านลิงก์ของคุณ — ลองแชร์ให้เพื่อนดูสิ
          </p>
        ) : (
          <div className="space-y-2">
            {data.recentReferrals.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                    {(r.displayName ?? r.email).charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {r.displayName ?? "ผู้ใช้ใหม่"}
                    </p>
                    <p className="text-xs text-slate-400">{r.email}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString("th-TH")}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
