"use client";

import type { ReactNode } from "react";
import { useAuth } from "./auth-provider";
import { Card } from "./ui";

/**
 * Wraps an admin page: shows a loading skeleton while auth resolves, a
 * "not allowed" card for non-admins, and the page content for ADMIN users.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />;
  }

  if (profile?.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-md py-10">
        <Card className="p-8 text-center text-slate-600">
          หน้านี้สำหรับผู้ดูแลระบบเท่านั้น
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
