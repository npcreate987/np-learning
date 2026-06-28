"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { AdminGuard } from "@/components/admin-guard";
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

const NEXT_STATUS: InterestStatus[] = ["PENDING", "CONTACTED", "ENROLLED", "CANCELLED"];

function LeadsAdmin() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLeads(await api.get<Lead[]>("/learning-interest", true));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "โหลดรายชื่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: InterestStatus) {
    try {
      await api.patch(`/learning-interest/${id}/status`, { status }, true);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch {
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">รายชื่อผู้สนใจเรียน</h1>
          <p className="mt-1 text-sm text-slate-500">ทั้งหมด {leads.length} รายการ</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? "กำลังโหลด..." : "รีเฟรช"}
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && leads.length === 0 && (
        <Card className="p-8 text-center text-slate-500">ยังไม่มีผู้กรอกฟอร์มสนใจเรียน</Card>
      )}

      <div className="space-y-3">
        {leads.map((lead) => (
          <Card key={lead.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-ink">{lead.fullName}</h2>
                  <Badge>{STATUS_LABEL[lead.status]}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-700">
                  โทร:{" "}
                  <a href={`tel:${lead.phone}`} className="text-brand-600 hover:underline">
                    {lead.phone}
                  </a>
                </p>
                {lead.address && (
                  <p className="mt-1 text-sm text-slate-600">ที่อยู่: {lead.address}</p>
                )}
                {lead.course && (
                  <p className="mt-1 text-sm text-slate-600">สนใจคลาส: {lead.course.title}</p>
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

export default function AdminLeadsPage() {
  return (
    <AdminGuard>
      <LeadsAdmin />
    </AdminGuard>
  );
}
