"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { AdminGuard } from "@/components/admin-guard";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

type Audience = "ALL" | "STUDENT" | "INSTRUCTOR";
type NotifType = "info" | "welcome" | "referral" | "certificate";

const AUDIENCES: { value: Audience; label: string; hint: string }[] = [
  { value: "ALL", label: "ผู้ใช้ทั้งหมด", hint: "นักเรียน + ผู้สอน + แอดมิน" },
  { value: "STUDENT", label: "นักเรียน", hint: "เฉพาะบทบาทนักเรียน" },
  { value: "INSTRUCTOR", label: "ผู้สอน", hint: "เฉพาะบทบาทผู้สอน" },
];

const TYPES: NotifType[] = ["info", "welcome", "referral", "certificate"];

function BroadcastAdmin() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NotifType>("info");
  const [audience, setAudience] = useState<Audience>("ALL");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<number | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(null);
    if (!title.trim() || !body.trim()) {
      setError("กรุณากรอกหัวข้อและเนื้อหา");
      return;
    }
    setSending(true);
    try {
      const res = await api.post<{ sent: number }>(
        "/admin/notifications/broadcast",
        { title: title.trim(), body: body.trim(), type, audience },
        true,
      );
      setSent(res.sent);
      setTitle("");
      setBody("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ส่งการแจ้งเตือนไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">ส่งการแจ้งเตือนทั้งระบบ</h1>
        <p className="mt-1 text-sm text-slate-500">
          ส่งการแจ้งเตือนในแอป (in-app) ถึงกลุ่มผู้ใช้ที่เลือกทันที
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {sent !== null && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Check size={16} /> ส่งการแจ้งเตือนแล้ว {sent} รายการ
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>กลุ่มผู้รับ</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {AUDIENCES.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAudience(a.value)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",
                    audience === a.value
                      ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-200"
                      : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <p className="text-sm font-semibold text-ink">{a.label}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{a.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="title">หัวข้อ</Label>
            <Input
              id="title"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ประกาศคลาสใหม่"
            />
          </div>

          <div>
            <Label htmlFor="body">เนื้อหา</Label>
            <Textarea
              id="body"
              rows={4}
              required
              maxLength={500}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="รายละเอียดการแจ้งเตือนที่ผู้ใช้จะเห็น"
            />
          </div>

          <div>
            <Label>ประเภทการแจ้งเตือน</Label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                    type === t
                      ? "bg-ink text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={sending}>
            <Send size={16} />
            {sending ? "กำลังส่ง..." : "ส่งการแจ้งเตือน"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function AdminNotificationsPage() {
  return (
    <AdminGuard>
      <BroadcastAdmin />
    </AdminGuard>
  );
}
