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
`auth` (มี `GET/PATCH /auth/me` แก้โปรไฟล์ + notifyEmail + role), `courses`, `sections`, `lessons`, `enrollments` (มี `/mine/summary` สำหรับ dashboard — `nextLessonId` = บทเรียนแรกที่ยังไม่ครบ), `progress` (`POST /complete`, `GET /course/:id` — บังคับ enrollment/ownership ก่อน), `uploads` (`POST /presign` = INSTRUCTOR สำหรับคลังคอร์ส, `POST /avatar-presign` = ทุกคน image-only สำหรับรูปโปรไฟล์), `ai` (`POST /chat` บังคับ auth), `community`, `quiz` (+certificate), `learning-interest`, `notifications` (`GET`, `GET /unread-count`, `POST /read-all`, `PATCH /:id/read`), `device-tokens` (register/remove สำหรับ push — แต่ยังไม่มีการส่ง push จริง), `referral` (`GET /me` สร้าง code + สถิติ, `POST /apply` ผูกผู้แนะนำแบบ atomic), `admin` (เฉพาะ `ADMIN`: `GET /stats`, `GET/PATCH /users`, `GET/POST/DELETE /courses`, `GET/DELETE /posts`, `POST /notifications/broadcast`)

- Global: `ValidationPipe` + `PrismaExceptionFilter` (P2025→404, P2002→409, P2003→400) ลงทะเบียนใน `main.ts`
- `courses.getBySlug` คืนเฉพาะ `PUBLISHED` (draft ดูได้ที่ `getForEdit` ของเจ้าของเท่านั้น)

## Admin panel (เฉพาะ Role.ADMIN)
- ใช้ `@Roles("ADMIN")` ที่ระดับ class ของ `AdminController` + `RolesGuard` (ADMIN ผ่านได้ทุก role อยู่แล้ว)
- หน้าใต้ `(app)/admin/*` ครอบด้วย `AdminGuard` (เช็ค `profile.role === "ADMIN"` ฝั่ง client)
- Sidebar แสดง admin nav block เฉพาะ ADMIN
- ไม่มีระงับ/แบนผู้ใช้ (เปลี่ยน role อย่างเดียว, กันเปลี่ยน role ตัวเอง); broadcast = in-app notification เท่านั้น
- **Studio** (`/studio`): admin เข้าแก้เนื้อหา/อัปโหลดคลิปของคอร์สใดก็ได้ — หน้า `/studio` ดึง `/admin/courses` (คอร์สทั้งหมด) สำหรับ ADMIN, และ `RolesGuard`/`assertOwner` บายพาส ADMIN ให้เรียก `sections`/`lessons`/`uploads/presign`/`courses/:id/edit` ได้โดยตรง (มีลิงก์ "Studio (แก้เนื้อหา)" ใน admin nav block)

## Notifications / Referral / Settings
- Profile มี field: `avatarUrl`, `phone`, `notifyEmail`, `referralCode` (unique, สร้าง lazy ตอนเข้า Affiliate), `referredById` (self-relation)
- ตาราง `Notification` (in-app log) + `DeviceToken` (push token ของ native/web)
- Affiliate flow: หน้า `/affiliate` สร้างลิงก์ `${origin}/signup?ref=CODE` → signup เก็บ `np_ref_code` ใน localStorage → `AuthProvider` เรียก `POST /referral/apply` หลังโหลด profile ครั้งแรก (ถ้ายังไม่มี `referredById`) — เคลียร์ `np_ref_code` เฉพาะตอน apply สำเร็จ
- Bell badge ใน sidebar ดึง unread count จาก `/notifications/unread-count` live ตอนเปลี่ยนหน้า (badge ปลอม 6 ของ Community ถูกลบแล้ว)
- Avatar upload: ใช้ `uploadAvatar()` ใน `lib/api` → `POST /uploads/avatar-presign` (นักเรียนใช้ได้, จำกัด image/*) ส่วน `uploadFile()` → `POST /uploads/presign` สำหรับคลังคอร์ส (INSTRUCTOR เท่านั้น)

## TikTok feed (คลาสแนวตั้ง)
- `components/tiktok-feed.tsx` เลื่อนคลิปแล้วบันทึก progress อัตโนมัติ (`POST /progress/complete` เฉพาะคนที่ enrolled)
- ปุ่ม "ถาม" / "ถาม AI เกี่ยวกับคลิปนี้" เขียน `np_lesson_context` ใน sessionStorage แล้วพาไป `/ai-tutor` (หน้า AI Tutor อ่าน context นี้)
- ปุ่ม share ใช้ `navigator.share` / clipboard; like/bookmark ยังเป็น local-only
- โหลด feed ไม่สำเร็จจะแสดง error UI แทนค้าง "กำลังโหลด..."

## รีวิวโค้ด + ปัญหาที่ทราบ (อัปเดต 2026-06-29)
รีวิวครั้งนี้ใช้ agent สำรวจ 3 ตัวขนาน (เว็บทุกหน้า / API ทุก module / cross-cutting) เมื่อ 2026-06-29 **ก่อนจะรื้อรีวิวใหม่ ให้อ่านรายการนี้ก่อน** เพื่อประหยัดเวลา ผล verify ด้วย `tsc --noEmit` ทั้งสองแอป + `ReadLints` ผ่าน (sandbox รัน dev/DB ไม่ได้ จึงตรวจจากโค้ด)

### แก้แล้ว (ครั้งนี้)
- **API**: progress IDOR → เช็ก enrollment/ownership (`progress.service.ts`); `courses.getBySlug` PUBLISHED-only; referral apply atomic + ชื่อใน notification เป็นผู้สมัครใหม่ + ซ่อน email (`referral.service.ts`); `ai/chat` บังคับ auth (`ai.controller.ts`); `nextLessonId` = บทแรกที่ยังไม่ครบ (`enrollments.service.ts`); `PrismaExceptionFilter` global P2025→404/P2002→409/P2003→400 (`main.ts` + `prisma-exception.filter.ts`)
- **API+Web**: `uploads/avatar-presign` สำหรับนักเรียน image-only + `uploadAvatar()` (`uploads.controller.ts`, `lib/api.ts`, `settings/page.tsx`)
- **Web**: tiktok-feed บันทึก progress + ส่ง `np_lesson_context` ไป AI + แก้ load ค้าง + share จริง (`tiktok-feed.tsx`); `api.ts` Supabase session ชนะ dev token; `auth-provider` เคลียร์ `np_ref_code` เฉพาะสำเร็จ; interest ผูกบัญชีคนล็อกอิน; `/verify` guard ไม่มี email; ลบ badge 6 ปลอม (`edu-sidebar.tsx`); ย้าย `/my-courses` เข้า `(app)`; Creator Center ใช้ข้อมูลจริง (`(app)/creator/page.tsx`); ลบ emoji `⚠️`/`🎉`

### ยังเหลือ / ที่ตั้งใจไม่แก้ (มี `file:line` ให้หา)
**Security/config**
- `apps/api/src/auth/dev-auth.controller.ts:31` — `POST /auth/dev-login` ลงทะเบียนเสมอ ปลอดภัยเฉพาะ `DEV_AUTH=false` ใน prod
- `apps/api/src/auth/dev-token.ts:8` — default `DEV_AUTH_SECRET` อ่อน (ใช้ได้เฉพาะ dev)
- `apps/api/src/enrollments/enrollments.service.ts:9` — `enroll()` ไม่เช็ก `priceCents` (ยังไม่มีระบบ payment)
- `apps/api/src/ai/ai.service.ts:56` — Gemini key อยู่ใน query string `?key=` (รั่วผ่าน log/proxy)
- ไม่มี rate limiting: `apps/api/src/ai/ai.controller.ts`, `apps/api/src/learning-interest/learning-interest.controller.ts:68`
- `apps/api/src/learning-interest/learning-interest.service.ts:35` — `list()` คืน leads ทั้งหมดให้ INSTRUCTOR/ADMIN (PII) ยังไม่ scope รายคน

**Correctness (เล็ก)**
- `apps/api/src/quiz/quiz.service.ts:176` — `submit()` สร้าง attempt + cert ไม่ใช่ `$transaction`
- `apps/api/src/quiz/quiz.service.ts:142` — ไม่จำกัดจำนวน retake
- `apps/api/src/quiz/quiz.controller.ts` (QuestionDto) — `correctIndex` ไม่มี upper bound เทียบ `options.length`
- `apps/api/src/auth/jwt.strategy.ts:145` — upsert อัปเดตแค่ `email` ไม่ refresh `displayName`
- `apps/web/components/tiktok-feed.tsx` — `hasQuiz` ไม่ re-fetch หลัง enroll (ต้อง reload หน้า)
- `apps/web/app/(app)/classes/page.tsx` — ไม่อ่าน `?q=` จากช่อง search ของ dashboard
- `apps/web/components/feed-video-player.tsx:70` — YouTube embed ไม่ pause ตอนเลื่อนหน้า (เฉพาะ `<video>` ที่ pause ได้)

**Type/cleanup**
- `packages/shared/src/index.ts` — `Lesson` ขาด `videoUrl`/`caption`/`durationSeconds`, `Course` ขาด `_count`, ไม่มี shared type สำหรับ quiz/certificate/community/summary → หน้าเว็บ define local type เอง (drift)
- คอมโพเนนต์ไม่ถูกใช้: `apps/web/components/video-player.tsx`, `tiptap-editor.tsx`, `lesson-content.tsx`
- `apps/web/app/(app)/live/page.tsx` — orphan route (redirect อย่างเดียว ไม่มีลิงก์เข้า)
- `apps/web/public/sw.js` — cache `/courses` (redirect alias) + ชื่อ cache `learnhub-v1` เก่า
- สี `#4f46e5` indigo off-brand: `apps/web/app/layout.tsx:29`, `components/native-bridge.tsx`, `capacitor/www/index.html`

**Polish (LOW)**
- หน้าที่ใช้ raw `<input>`/`<textarea>` แทน `@/components/ui`: `community/page.tsx`, `dashboard/page.tsx` (search), `ai-tutor/page.tsx`
- ใช้ `alert()` แสดง error: `community/page.tsx`, `tiktok-feed.tsx`, `studio/courses/[id]/page.tsx`
- fetch ไม่มี `.catch()`: `dashboard/page.tsx`, `classes/page.tsx`, `certificates/page.tsx`, `studio/page.tsx`

## งานที่ยังไม่ทำ (deferred — เฟสใหญ่)
- **Marketplace** ยังเป็น Coming Soon (Phase 2) — ยังไม่มี API module
- **Push notifications** มี `DeviceToken` + register API แต่ยังไม่มีการส่งจริง (FCM/APNs) และ native bridge ยังไม่ register token
- **Email notifications** `notifyEmail` เขียนได้แต่ยังไม่มี sender ใช้งานใน API
- **การชำระเงิน** `enroll()` ยังไม่เช็กราคา (ยังไม่มีระบบ payment) — คอร์สที่ตั้งราคาได้ enroll ฟรีอยู่
- **Rate limiting** ยังไม่มี (ใช้กับ `POST /ai/chat`, `POST /learning-interest`)
- โลโก้จริงจาก npcreate.co.th + icon PWA

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
