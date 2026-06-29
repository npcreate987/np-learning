"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Camera, Check, Mail, Shield, User } from "lucide-react";
import { api, ApiError, uploadAvatar } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

type SavedKind = "profile" | "notify" | "role" | null;

export default function SettingsPage() {
  const { profile, refreshProfile, loading: authLoading } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);

  const [saving, setSaving] = useState<SavedKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedKind, setSavedKind] = useState<SavedKind>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // Sync local form state whenever the profile loads/refreshes.
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setAvatarUrl(profile.avatarUrl ?? null);
    setPhone(profile.phone ?? "");
    setNotifyEmail(profile.notifyEmail);
  }, [profile]);

  function flash(kind: SavedKind) {
    setSavedKind(kind);
    setTimeout(() => setSavedKind((k) => (k === kind ? null : k)), 2500);
  }

  async function saveProfile() {
    if (!profile) return;
    setSaving("profile");
    setError(null);
    try {
      await api.patch("/auth/me", {
        displayName: displayName.trim() || undefined,
        avatarUrl,
        phone: phone.trim() || undefined,
      });
      await refreshProfile();
      flash("profile");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(null);
    }
  }

  async function saveNotify() {
    if (!profile) return;
    setSaving("notify");
    setError(null);
    try {
      await api.patch("/auth/me", { notifyEmail });
      await refreshProfile();
      flash("notify");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(null);
    }
  }

  async function becomeInstructor() {
    if (!profile) return;
    setSaving("role");
    setError(null);
    try {
      await api.patch("/auth/me", { role: "INSTRUCTOR" });
      await refreshProfile();
      flash("role");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "สมัครไม่สำเร็จ");
    } finally {
      setSaving(null);
    }
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (authLoading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />;
  }
  if (!profile) {
    return <p className="py-10 text-center text-slate-500">กรุณาเข้าสู่ระบบ</p>;
  }

  const initial = (profile.displayName ?? profile.email).charAt(0).toUpperCase();
  const isStaff = profile.role === "INSTRUCTOR" || profile.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">ตั้งค่าบัญชี</h1>
        <p className="mt-1 text-sm text-slate-500">
          จัดการโปรไฟล์ การแจ้งเตือน และบัญชีผู้ใช้ของคุณ
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Profile */}
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <User size={18} className="text-brand-600" />
          <h2 className="font-semibold text-ink">โปรไฟล์</h2>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-ink text-white">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-bold">
                  {initial}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <Camera size={14} />
              {uploadingAvatar ? "กำลังอัปโหลด..." : "เปลี่ยนรูป"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickAvatar}
            />
          </div>

          {/* Fields */}
          <div className="flex-1 space-y-4">
            <div>
              <Label htmlFor="displayName">ชื่อที่แสดง</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ชื่อของคุณ"
                maxLength={120}
              />
            </div>
            <div>
              <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08X-XXX-XXXX"
                inputMode="tel"
                maxLength={32}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={saveProfile} disabled={saving === "profile"}>
                {saving === "profile" ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
              </Button>
              {savedKind === "profile" && (
                <span className="inline-flex items-center gap-1 text-sm text-green-600">
                  <Check size={14} /> บันทึกแล้ว
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <Bell size={18} className="text-brand-600" />
          <h2 className="font-semibold text-ink">การแจ้งเตือน</h2>
        </div>

        <label className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">รับการแจ้งเตือนทางอีเมล</p>
            <p className="mt-0.5 text-xs text-slate-500">
              ส่งอีเมลเมื่อมีคลาสใหม่ ใบประกาศ หรือข่าวสารที่เกี่ยวกับคุณ
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notifyEmail}
            onClick={() => setNotifyEmail((v) => !v)}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              notifyEmail ? "bg-brand-600" : "bg-slate-200",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                notifyEmail ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
        </label>

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={saveNotify} disabled={saving === "notify"}>
            {saving === "notify" ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
          </Button>
          {savedKind === "notify" && (
            <span className="inline-flex items-center gap-1 text-sm text-green-600">
              <Check size={14} /> บันทึกแล้ว
            </span>
          )}
        </div>
      </Card>

      {/* Account */}
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <Shield size={18} className="text-brand-600" />
          <h2 className="font-semibold text-ink">บัญชี</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label>อีเมล</Label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Mail size={15} className="text-slate-400" />
              {profile.email}
            </div>
          </div>
          <div>
            <Label>บทบาท</Label>
            <div className="flex flex-wrap items-center gap-3">
              <Badge>
                {profile.role === "ADMIN"
                  ? "ผู้ดูแลระบบ"
                  : profile.role === "INSTRUCTOR"
                    ? "ผู้สอน"
                    : "นักเรียน"}
              </Badge>
              {profile.role === "STUDENT" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={becomeInstructor}
                  disabled={saving === "role"}
                >
                  {saving === "role" ? "กำลังสมัคร..." : "สมัครเป็นผู้สอน"}
                </Button>
              )}
              {savedKind === "role" && (
                <span className="inline-flex items-center gap-1 text-sm text-green-600">
                  <Check size={14} /> อัปเดตแล้ว
                </span>
              )}
            </div>
            {isStaff && (
              <p className="mt-2 text-xs text-slate-500">
                คุณสามารถสร้างและจัดการคลาสได้ที่เมนู Studio และดูสถิติแพลตฟอร์มได้ที่ Creator Center
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
