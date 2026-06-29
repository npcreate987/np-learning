# AGENTS.md — NP Learning

กฎสำหรับ AI agents ที่ทำงานใน repo นี้ อ่านก่อนเริ่มทำงานทุกครั้ง

## บริบทโปรเจกต์
- ดูรายละเอียดเต็มใน `context.md`
- สไตล์/คู่มือฟีเจอร์ดูใน `SKILL.md`

## ก่อนรื้อรีวิวใหม่
- อ่าน section "รีวิวโค้ด + ปัญหาที่ทราบ" ใน `context.md` ก่อน — มีรายการ bug ที่แก้แล้ว + ที่ยังเหลือ พร้อม `file:line` (อัปเดต 2026-06-29) เพื่อไม่ต้องรื้อทั้งโปรเจ็คมารีวิวใหม่
- แพทเทิร์นที่ห้ามทำซ้ำ (progress/enrollment-gated, avatar-presign vs presign, ai/chat auth, PUBLISHED-only getBySlug, atomic referral, `$transaction` สำหรับ multi-step write) ดูใน `SKILL.md` → "แพทเทิร์นที่ต้องรักษา"

## สถาปัตยกรรม (ห้ามสลับ)
- **Monorepo** pnpm workspaces + Turborepo
- `apps/web` = Next.js 15 (App Router, React 19, Tailwind) — deploy Vercel
- `apps/api` = NestJS + Prisma + PostgreSQL — deploy Railway (Docker)
- `packages/shared` = types ที่ใช้ร่วม
- Database = Supabase Postgres, Auth = Supabase Auth (+ dev mode `DEV_AUTH`)

## กฎเขียนโค้ด
- ภาษา UI หลัก = **ไทย** (ข้อความต่อผู้ใช้) ชื่อไฟล์/ตัวแปร/comment = อังกฤษ
- ไม่ใส่ emoji ในโค้ด/UI เว้นแต่ผู้ใช้ขอ
- ห้าม export ข้อมูลลับ (.env) ขึ้น git — `.gitignore` ครอบ `.env`, `.env.local` แล้ว
- API: ใช้ guards ที่มี (`JwtAuthGuard`, `OptionalJwtAuthGuard`, `RolesGuard`, `@Roles(...)`) อย่างเดียวกับ controller อื่น
- API: global prefix `api` อยู่ใน `main.ts` → endpoint จริงคือ `/api/<path>` ตรงกับที่หน้าเว็บเรียก
- Web: เรียก API ผ่าน `@/lib/api` (`api.get/post/patch/del`, `auth=true|false`)
- Web: UI primitives ใช้จาก `@/components/ui` (Button/Card/Input/Label/Textarea/Badge) อย่างเดียว
- Prisma: แก้ schema แล้วต้องสร้าง migration SQL ใน `apps/api/prisma/migrations/<ts>_<name>/migration.sql` + แจ้งให้รัน `pnpm prisma:generate` และ `pnpm prisma:migrate`

## ธีม/แบรนด์ (สำคัญ)
- Palette อยู่ใน `apps/web/tailwind.config.ts`: `brand` (violet), `ink` (deep navy), `cream` (warm surface), `gold` (accent)
- **ห้ามใช้** `lime` (ถูกลบแล้ว) และห้าม gradient indigo หนักๆ
- โทน: clean, professional, “ระบบเรียนจริง” ไม่ดู AI/เว่อร์
- โลโก้ยังไม่ finalize (รอจาก npcreate.co.th) — ตอนนี้ใช้ GraduationCap icon + คำว่า "NP Learning"

## การรัน/เช็กก่อนส่งมอบ
- รัน `ReadLints` หลังแก้ไฟล์ แล้วแก้ error ที่ตัวเองทำขึ้น
- อย่าลืมว่า sandbox ของ Cursor บล็อก `.git`, `pnpm install` บางกรณี, และ Docker → คำสั่งที่ต้องรันจริงให้ผู้ใช้รันใน Terminal เครื่องตัวเอง

## การ commit
- คอมมิตเฉพาะเมื่อผู้ใช้ขอ
- ข้อความ commit ภาษาอังกฤษ สรุป "why"
