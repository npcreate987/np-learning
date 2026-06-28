"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

interface Cert {
  id: string;
  serial: string;
  issuedAt: string;
  course: { id: string; slug: string; title: string };
}

export default function CertificatesPage() {
  const { session, loading: authLoading } = useAuth();
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setLoading(false);
      return;
    }
    api
      .get<Cert[]>("/certificates/mine", true)
      .then(setCerts)
      .catch(() => setCerts([]))
      .finally(() => setLoading(false));
  }, [session, authLoading]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-400 text-ink">
          <Award size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink">ใบประกาศนียบัตรของฉัน</h1>
          <p className="text-sm text-slate-500">ใบประกาศที่ได้รับเมื่อสอบผ่านแบบทดสอบท้ายคลาส</p>
        </div>
      </div>

      {!session ? (
        <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            เข้าสู่ระบบ
          </Link>{" "}
          เพื่อดูใบประกาศนียบัตรของคุณ
        </div>
      ) : loading ? (
        <div className="flex justify-center py-10 text-slate-400">
          <Loader2 className="animate-spin" />
        </div>
      ) : certs.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          ยังไม่มีใบประกาศ — เรียนจบคลาสแล้วทำแบบทดสอบให้ผ่านเพื่อรับใบประกาศ
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certs.map((c) => (
            <Link
              key={c.id}
              href={`/certificate/${c.serial}`}
              className="rounded-3xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Award size={20} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{c.course.title}</p>
                  <p className="text-xs text-slate-400">
                    เลขที่ {c.serial} ·{" "}
                    {new Date(c.issuedAt).toLocaleDateString("th-TH")}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
