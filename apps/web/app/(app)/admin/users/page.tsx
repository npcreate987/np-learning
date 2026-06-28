"use client";

import { useCallback, useEffect, useState } from "react";
import type { Role } from "@app/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { AdminGuard } from "@/components/admin-guard";
import { Badge, Card, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  role: Role;
  createdAt: string;
  _count: { enrollments: number; referrals: number };
}

const ROLES: Role[] = ["STUDENT", "INSTRUCTOR", "ADMIN"];
const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "นักเรียน",
  INSTRUCTOR: "ผู้สอน",
  ADMIN: "ผู้ดูแลระบบ",
};
const ROLE_BADGE: Record<Role, string> = {
  STUDENT: "bg-sky-50 text-sky-700",
  INSTRUCTOR: "bg-emerald-50 text-emerald-700",
  ADMIN: "bg-violet-50 text-violet-700",
};

function UsersAdmin() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const query = new URLSearchParams();
    if (search.trim()) query.set("search", search.trim());
    if (roleFilter !== "ALL") query.set("role", roleFilter);
    const qs = query.toString();
    try {
      const data = await api.get<AdminUser[]>(`/admin/users${qs ? `?${qs}` : ""}`, true);
      setUsers(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "โหลดรายชื่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  // Debounce the search input so we don't fire on every keystroke.
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function changeRole(id: string, role: Role) {
    setSavingId(id);
    try {
      await api.patch(`/admin/users/${id}/role`, { role }, true);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "เปลี่ยน role ไม่สำเร็จ");
      load();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">จัดการผู้ใช้</h1>
        <p className="mt-1 text-sm text-slate-500">ค้นหาและเปลี่ยนบทบาทผู้ใช้ในระบบ</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="ค้นหาด้วยอีเมลหรือชื่อ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            {(["ALL", ...ROLES] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition",
                  roleFilter === r
                    ? "bg-ink text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                {r === "ALL" ? "ทั้งหมด" : ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="h-40 animate-pulse bg-slate-100" />
        ) : users.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">ไม่พบผู้ใช้ที่ตรงเงื่อนไข</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">ผู้ใช้</th>
                  <th className="px-4 py-3 font-medium">บทบาท</th>
                  <th className="px-4 py-3 font-medium">ลงทะเบียน</th>
                  <th className="px-4 py-3 font-medium">แนะนำ</th>
                  <th className="px-4 py-3 font-medium">สมัครเมื่อ</th>
                  <th className="px-4 py-3 font-medium">เปลี่ยนบทบาท</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => {
                  const isSelf = u.id === profile?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{u.displayName ?? "—"}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={ROLE_BADGE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u._count.enrollments}</td>
                      <td className="px-4 py-3 text-slate-600">{u._count.referrals}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          disabled={isSelf || savingId === u.id}
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value as Role)}
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-brand-500 focus:outline-none disabled:opacity-50"
                          title={isSelf ? "ไม่สามารถเปลี่ยนบทบาทของตัวเองได้" : undefined}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <UsersAdmin />
    </AdminGuard>
  );
}
