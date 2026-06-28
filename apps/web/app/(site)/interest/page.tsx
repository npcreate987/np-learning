"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";

// Thai phone: 9-10 digits starting with 0, allowing spaces/dashes.
const PHONE_RE = /^0\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4}$/;

export default function InterestPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!PHONE_RE.test(phone.trim())) {
      setError("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (เช่น 0812345678)");
      return;
    }
    if (!consent) {
      setError("กรุณายอมรับการเก็บข้อมูลเพื่อให้เราติดต่อกลับ");
      return;
    }

    setLoading(true);
    try {
      // auth = false so both logged-in users and guests can submit. The API
      // uses an optional auth guard and links the account when a token exists.
      await api.post(
        "/learning-interest",
        {
          fullName: fullName.trim(),
          phone: phone.replace(/[\s-]/g, ""),
          address: address.trim() || undefined,
          note: note.trim() || undefined,
        },
        false,
      );
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่",
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md py-10">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">ขอบคุณที่สนใจ! 🎉</h1>
          <p className="mt-3 text-slate-600">
            เราได้รับข้อมูลของคุณแล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุด
          </p>
          <Link href="/classes">
            <Button className="mt-6">ดูคลาสเรียนทั้งหมด</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-slate-900">สนใจเรียน</h1>
        <p className="mt-1 text-sm text-slate-500">
          กรอกข้อมูลเพื่อให้ทีมงานติดต่อกลับและแนะนำคลาสที่เหมาะกับคุณ
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
            <Input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ชื่อจริงของคุณ"
            />
          </div>
          <div>
            <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
            <Input
              id="phone"
              required
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08X-XXX-XXXX"
            />
          </div>
          <div>
            <Label htmlFor="address">ที่อยู่</Label>
            <Textarea
              id="address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="บ้านเลขที่ / ถนน / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์"
            />
          </div>
          <div>
            <Label htmlFor="note">สนใจเรื่องอะไร / คำถามเพิ่มเติม (ถ้ามี)</Label>
            <Textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น คลาสที่สนใจ ช่วงเวลาที่สะดวกให้ติดต่อ"
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="mt-1"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              ฉันยินยอมให้เก็บข้อมูลส่วนบุคคล (ชื่อ เบอร์โทร ที่อยู่)
              เพื่อให้ทีมงานติดต่อกลับเกี่ยวกับการเรียนเท่านั้น
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "กำลังส่ง..." : "ส่งข้อมูลให้ติดต่อกลับ"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
