"use client";

import Link from "next/link";
import { useState } from "react";
import { GraduationCap, Menu, X } from "lucide-react";
import { useAuth } from "./auth-provider";
import { Button } from "./ui";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { session, profile, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const isInstructor = profile?.role === "INSTRUCTOR" || profile?.role === "ADMIN";

  const links = [
    { href: "/classes", label: "คลาสทั้งหมด" },
    { href: "/interest", label: "สนใจเรียน" },
    ...(session ? [{ href: "/my-courses", label: "คลาสของฉัน" }] : []),
    ...(session ? [{ href: "/dashboard", label: "แดชบอร์ด" }] : []),
    ...(isInstructor ? [{ href: "/studio", label: "ผู้สอน" }] : []),
    ...(isInstructor ? [{ href: "/interest/admin", label: "ผู้สนใจเรียน" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white">
            <GraduationCap size={20} />
          </span>
          <span className="text-lg tracking-tight text-ink">NP Learning</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? null : session ? (
            <>
              <span className="text-sm text-slate-500">
                {profile?.displayName ?? profile?.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                ออกจากระบบ
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  เข้าสู่ระบบ
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">สมัครสมาชิก</Button>
              </Link>
            </>
          )}
        </div>

        <button
        className="rounded-full p-2 text-slate-600 hover:bg-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="เมนู"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={cn("border-t border-slate-200 bg-cream-50 md:hidden", open ? "block" : "hidden")}>
        <div className="space-y-1 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2">
            {session ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
              >
                ออกจากระบบ
              </Button>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    เข้าสู่ระบบ
                  </Button>
                </Link>
                <Link href="/signup" className="flex-1" onClick={() => setOpen(false)}>
                  <Button size="sm" className="w-full">
                    สมัคร
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
