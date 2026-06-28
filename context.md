# context.md — NP Learning

สถานะปัจจุบันของโปรเจกต์ (อ้างอิงสำหรับ agent)

## โปรดักต์
แพลตฟอร์มเรียนออนไลน์ "NP Learning" — คอร์ส/บทเรียน, วิดีโอ, แบบทดสอบ + ใบประกาศ, AI Tutor, Community, คลาส TikTok (วิดีโอแนวตั้ง), ฟอร์มสนใจเรียน (lead), และแอปมือถือผ่าน Capacitor

## โครงสร้าง route (web)
- `(site)` = หน้าสาธารณะ: `/`, `/courses`, `/courses/[slug]`, `/learn/[slug]`, `/interest`, `/interest/admin`, `/login`, `/signup` (รับ `?ref=CODE` affiliate), `/quiz/[courseId]`, `/certificate/[serial]`, `/studio`, `/studio/courses/[id]`, `/studio/courses/[id]/quiz`
- `(app)` = หน้าหลังล็อกอิน (AppShell + sidebar): `/dashboard` (หน้าแรกหลัง login), `/my-courses`, `/ai-tutor`, `/certificates`, `/community`, `/classes`, `/classes/[slug]`, `/marketplace`, `/affiliate` (ลิงก์แนะนำ + สถิติ), `/notifications`, `/creator`, `/settings` (โปรไฟล์ + การแจ้งเตือน + สมัครผู้สอน), `/admin` (แดชบอร์ดแอดมิน — เฉพาะ ADMIN), `/admin/users`, `/admin/courses`, `/admin/leads`, `/admin/notifications` (broadcast), `/admin/posts` (ตรวจ community)

## Auth flow (ปัจจุบัน)
- หลัง login (Supabase หรือ dev) → redirect ไป `/dashboard`
- dev mode (`DEV_AUTH=true`): ปุ่ม นักเรียน/ผู้สอน/แอดมิน → `POST /auth/dev-login` → เก็บ `np_dev_token` ใน localStorage
- signup = นักเรียนเท่านั้น (ไม่มี become-instructor)

## API module ที่มี
`auth` (มี `GET/PATCH /auth/me` แก้โปรไฟล์ + notifyEmail + role), `courses`, `sections`, `lessons`, `enrollments` (มี `/mine/summary` สำหรับ dashboard), `progress`, `uploads`, `ai`, `community`, `quiz` (+certificate), `learning-interest`, `notifications` (`GET`, `GET /unread-count`, `POST /read-all`, `PATCH /:id/read`), `device-tokens` (register/remove สำหรับ push), `referral` (`GET /me` สร้าง code + สถิติ, `POST /apply` ผูกผู้แนะนำ), `admin` (เฉพาะ `ADMIN`: `GET /stats`, `GET/PATCH /users`, `GET/POST/DELETE /courses`, `GET/DELETE /posts`, `POST /notifications/broadcast`)

## Admin panel (เฉพาะ Role.ADMIN)
- ใช้ `@Roles("ADMIN")` ที่ระดับ class ของ `AdminController` + `RolesGuard` (ADMIN ผ่านได้ทุก role อยู่แล้ว)
- หน้าใต้ `(app)/admin/*` ครอบด้วย `AdminGuard` (เช็ค `profile.role === "ADMIN"` ฝั่ง client)
- Sidebar แสดง admin nav block เฉพาะ ADMIN
- ไม่มีระงับ/แบนผู้ใช้ (เปลี่ยน role อย่างเดียว, กันเปลี่ยน role ตัวเอง); broadcast = in-app notification เท่านั้น

## Notifications / Referral / Settings
- Profile มี field: `avatarUrl`, `phone`, `notifyEmail`, `referralCode` (unique, สร้าง lazy ตอนเข้า Affiliate), `referredById` (self-relation)
- ตาราง `Notification` (in-app log) + `DeviceToken` (push token ของ native/web)
- Affiliate flow: หน้า `/affiliate` สร้างลิงก์ `${origin}/signup?ref=CODE` → signup เก็บ `np_ref_code` ใน localStorage → `AuthProvider` เรียก `POST /referral/apply` หลังโหลด profile ครั้งแรก (ถ้ายังไม่มี `referredById`)
- Bell badge ใน sidebar ดึง unread count จาก `/notifications/unread-count` live ตอนเปลี่ยนหน้า

## Dashboard (หน้าแรกหลัง login)
- ดึงข้อมูลจริงจาก `/enrollments/mine/summary` + `/courses` + `/certificates/mine`
- ส่วน: stat cards, continue learning, คอร์สแนะนำ, คอร์สที่กำลังเรียน, ปฏิทิน, ใบประกาศล่าสุด
- ไม่มี mock data แล้ว

## Deployment
- Web → Vercel (Root Directory = `apps/web`)
- API → Railway (มี `railway.json` + `apps/api/Dockerfile`, รัน `prisma migrate deploy` อัตโนมัติ)
- DB → Supabase
- คู่มือละเอียดใน `DEPLOY.md` / `HANDOFF.md`
- Repo GitHub: https://github.com/npcreate987/np-learning

## Mobile
- Capacitor v6 ห่อเว็บเดิม (โหลดจาก `CAP_SERVER_URL`)
- ไฟล์: `capacitor.config.ts`, `capacitor/www/index.html` (fallback), `components/native-bridge.tsx`
- native dirs (`apps/web/android`, `apps/web/ios`) ถูก gitignore

## ที่ต้องรันในเครื่อง (sandbox ทำแทนไม่ได้)
```bash
pnpm install --no-frozen-lockfile
pnpm prisma:generate && pnpm prisma:migrate
pnpm dev
```
