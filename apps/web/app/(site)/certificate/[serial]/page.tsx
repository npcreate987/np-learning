"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Award, Printer } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button, Card } from "@/components/ui";

interface Certificate {
  serial: string;
  issuedAt: string;
  courseTitle: string;
  recipientName: string;
}

export default function CertificatePage() {
  const { serial } = useParams<{ serial: string }>();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Certificate>(`/certificates/${serial}`)
      .then(setCert)
      .catch((e) => setError(e instanceof ApiError ? e.message : "ไม่พบใบประกาศนียบัตร"))
      .finally(() => setLoading(false));
  }, [serial]);

  if (loading) {
    return <div className="h-80 animate-pulse rounded-xl bg-slate-200" />;
  }

  if (error || !cert) {
    return (
      <Card className="mx-auto mt-10 max-w-md p-8 text-center">
        <p className="text-slate-600">{error ?? "ไม่พบใบประกาศนียบัตร"}</p>
      </Card>
    );
  }

  const issued = new Date(cert.issuedAt).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-4 flex justify-end print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer size={18} /> พิมพ์ / บันทึก PDF
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-3xl border-8 border-double border-ink bg-white p-10 text-center shadow-lg print:border-ink print:shadow-none">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(190,242,100,0.15),transparent_60%)]" />
        <div className="relative">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-400 text-ink">
            <Award size={32} />
          </span>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Certificate of Completion
          </p>
          <h1 className="mt-2 text-lg text-slate-500">ใบประกาศนียบัตรรับรองการเรียนจบหลักสูตร</h1>

          <p className="mt-8 text-sm text-slate-500">มอบให้แก่</p>
          <p className="mt-1 text-3xl font-extrabold text-ink">{cert.recipientName}</p>

          <p className="mt-6 text-sm text-slate-500">สำเร็จหลักสูตร</p>
          <p className="mt-1 text-xl font-bold text-brand-700">{cert.courseTitle}</p>

          <div className="mt-10 flex items-center justify-between text-xs text-slate-400">
            <div className="text-left">
              <p className="font-semibold text-slate-600">NP Learning</p>
              <p>แพลตฟอร์มเรียนออนไลน์</p>
            </div>
            <div className="text-right">
              <p>เลขที่: {cert.serial}</p>
              <p>ออกให้เมื่อ {issued}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
