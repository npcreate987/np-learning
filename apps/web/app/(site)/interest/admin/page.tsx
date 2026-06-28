"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Badge, Button, Card } from "@/components/ui";

type InterestStatus = "PENDING" | "CONTACTED" | "ENROLLED" | "CANCELLED";

interface Lead {
  id: string;
  fullName: string;
  phone: string;
  address: string | null;
  note: string | null;
  status: InterestStatus;
  createdAt: string;
  course: { id: string; title: string; slug: string } | null;
  user: { id: string; displayName: string | null; email: string } | null;
}

const STATUS_LABEL: Record<InterestStatus, string> = {
  PENDING: "รอติดต่อ",
  CONTACTED: "ติดต่อแล้ว",
  ENROLLED: "สมัครเรียนแล้ว",
  CANCELLED: "ยกเลิก",
};

const NEXT_STATUS: InterestStatus[] = [
  "PENDING",
  "CONTACTED",
  "ENROLLED",
  "CANCELLED",
];

export default function InterestAdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStaff = profile?.role === "ADMIN" || profile?.role === "INSTRUCTOR";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Lead[]>("/learning-interest", true);
      setLeads(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isStaff) load();
  }, [authLoading, isStaff, load]);

  async function setStatus(id: string, status: InterestStatus) {
    try {
      await api.patch(`/learning-interest/${id}/status`, { status }, true);
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l)),
      );
    } catch {
      // Reload on failure to stay in sync with the server.
      load();
    }
  }

  if (authLoading) {
    return <p className="py-10 text-center text-slate-500">กำลังโหลด...</p>;
  }

  if (!isStaff) {
    return (
      <div className="mx-auto max-w-md py-10">
        <Card className="p-8 text-center text-slate-600">
          หน้านี้สำหรับผู้สอน/ผู้ดูแลระบบเท่านั้น
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">รายชื่อผู้สนใจเรียน</h1>
          <p className="text-sm text-slate-500">
            ทั้งหมด {leads.length} รายการ
          </p>
        </div>
        <Button onClick={load} disabled={loading}>
          {loading ? "กำลังโหลด..." : "รีเฟรช"}
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && leads.length === 0 && (
        <Card className="p-8 text-center text-slate-500">
          ยังไม่มีผู้กรอกฟอร์มสนใจเรียน
        </Card>
      )}

      <div className="space-y-3">
        {leads.map((lead) => (
          <Card key={lead.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-slate-900">{lead.fullName}</h2>
                  <Badge>{STATUS_LABEL[lead.status]}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-700">
                  โทร:{" "}
                  <a
                    href={`tel:${lead.phone}`}
                    className="text-brand-600 hover:underline"
                  >
                    {lead.phone}
                  </a>
                </p>
                {lead.address && (
                  <p className="mt-1 text-sm text-slate-600">
                    ที่อยู่: {lead.address}
                  </p>
                )}
                {lead.course && (
                  <p className="mt-1 text-sm text-slate-600">
                    สนใจคลาส: {lead.course.title}
                  </p>
                )}
                {lead.note && (
                  <p className="mt-1 text-sm text-slate-600">หมายเหตุ: {lead.note}</p>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(lead.createdAt).toLocaleString("th-TH")}
                  {lead.user ? ` · บัญชี: ${lead.user.email}` : " · ผู้ไม่ล็อกอิน"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {NEXT_STATUS.filter((s) => s !== lead.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(lead.id, s)}
                    className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    → {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
