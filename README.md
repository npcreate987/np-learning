# LearnHub - แพลตฟอร์มเรียนออนไลน์ (MVP)

เว็บเรียนออนไลน์แบบ responsive + PWA สำหรับสร้าง/ใส่เนื้อหาคอร์ส และให้ผู้เรียนเข้าเรียนพร้อมติดตามความคืบหน้า

## Stack

| ส่วน | เทคโนโลยี |
| --- | --- |
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Next.js 15 (App Router) + Tailwind CSS + Tiptap + PWA |
| Backend | NestJS + Prisma |
| Database | PostgreSQL |
| Auth | Supabase Auth (ตรวจ JWT ฝั่ง NestJS) |
| Storage | Cloudflare R2 (presigned upload) |

> หมายเหตุ: Payment (Omise/GB Prime Pay/Stripe), Video (Bunny/Mux) และ AI Tutor (Gemini) ออกแบบ schema รองรับไว้แล้ว แต่ยังไม่ implement ใน MVP นี้

## โครงสร้าง

```
online-learning/
├── apps/
│   ├── web/      # Next.js (responsive + PWA)
│   └── api/      # NestJS API
├── packages/
│   └── shared/   # shared TypeScript types
├── docker-compose.yml
└── turbo.json
```

## เริ่มต้นใช้งาน (Local Dev)

### 1) ติดตั้ง dependencies

```bash
pnpm install
```

### 2) ตั้งค่า environment

คัดลอกค่าใน `.env.example` ไปยังไฟล์ของแต่ละแอป:

- `apps/api/.env` — ดู `apps/api/.env.example`
- `apps/web/.env.local` — ตั้งค่า `NEXT_PUBLIC_*`

ค่าที่ต้องเตรียม:

- **Supabase**: สร้างโปรเจกต์ใน Supabase แล้วนำ `Project URL`, `anon key` (สำหรับ web) และ `JWT Secret` (สำหรับ api) มาใส่
- **Cloudflare R2**: สร้าง bucket + API token (S3) แล้วใส่ `R2_*` (ไม่ต้องมีก็ได้ถ้ายังไม่ทดสอบอัปโหลด)

### 3) เปิดฐานข้อมูล + รัน migration

```bash
pnpm db:up                # docker postgres
pnpm prisma:migrate       # สร้างตาราง
pnpm prisma:seed          # (ออปชัน) ข้อมูลตัวอย่าง
```

### 4) รันทั้งระบบ

```bash
pnpm dev                  # รัน web + api พร้อมกันผ่าน turbo
```

- Web: http://localhost:3000
- API: http://localhost:4000/api (health: `/api/health`)

หรือรันแยก:

```bash
pnpm api:dev
pnpm web:dev
```

## บทบาทผู้ใช้ (Roles)

- ผู้ใช้ใหม่เริ่มต้นเป็น `STUDENT`
- กดปุ่ม "เป็นผู้สอน" ในหน้า `/dashboard` เพื่อเปลี่ยนเป็น `INSTRUCTOR` (MVP: เปลี่ยนเองได้)
- `ADMIN` ตั้งค่าได้ที่ตาราง `Profile` โดยตรง

## ฟีเจอร์หลัก (MVP)

- สมัคร/เข้าสู่ระบบด้วย Supabase Auth
- ผู้สอน: สร้างคอร์ส → เพิ่มบท (section) → เพิ่มบทเรียน → แก้ไขเนื้อหาด้วย rich text editor → อัปโหลดภาพปกไป R2 → เผยแพร่
- ผู้เรียน: ดู catalog → ลงทะเบียน → เรียนในหน้า course player → ทำเครื่องหมายบทเรียนที่จบ → ดูแถบความคืบหน้า
- PWA: ติดตั้งเป็นแอปบนมือถือ/เดสก์ท็อปได้ (manifest + service worker)

## การต่อยอด (เฟสถัดไป)

- Payment: ผูกกับ `Course.priceCents` + เพิ่มตาราง `Order`
- Video: `Lesson.type = VIDEO` + playback id จาก Bunny/Mux
- AI Tutor: endpoint chat ที่อิงเนื้อหาบทเรียน (Gemini)
