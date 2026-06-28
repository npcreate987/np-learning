# SKILL.md — NP Learning

สไตล์และคู่มือฟีเจอร์ (skill ของโปรเจกต์)

## ธีม/UX
- โทน: สะอาด มืออาชีพ "ระบบเรียนจริง" — **ไม่ดู AI หรือเว่อร์**
- พื้นหลัง: `cream-50` (อุ่น) / ขาว; ข้อความหลัก `ink`; accent `brand` (violet) และ `gold`
- หลีกเลี่ยง: gradient หนัก, neon, glow, พื้นสีเข้มย้อมทั้งหน้า
- โค้งมน: `rounded-2xl`/`rounded-3xl` สำหรับ card, `rounded-full` สำหรับ button/pill
- Card shadow: `shadow-[0_18px_50px_rgba(23,20,47,0.06)]` (นุ่ม ไม่จัด)
- ฟอนต์: `var(--font-sans)` (Inter) + รองรับไทย

## โครงเรียน (information architecture)
- หน้าแรกหลัง login = `/dashboard` (ไม่ใช่ `/my-courses`)
- Sidebar (EduSidebar): Dashboard / Learn / คอร์สทั้งหมด / AI Tutor / ใบประกาศ / Community / คลาส TikTok / Marketplace / Affiliate / Creator Center / Settings + การ์ด "ปรึกษาหลักสูตร" → `/interest`
- CTA หลักของระบบ: "สนใจเรียน" (lead form) เพราะเน้นให้ทีมงานติดต่อกลับ

## ฟีเจอร์ที่ merge เข้า dashboard แล้ว
- คอร์สที่ลง + ความคืบหน้า (จาก `/enrollments/mine/summary`)
- คอร์สแนะนำ (จาก `/courses` ที่ยังไม่ได้ลง)
- ใบประกาศล่าสุด (จาก `/certificates/mine`)
- ปฏิทินจริง (client-side, ปี พ.ศ.)

## แนวทางเพิ่มฟีเจอร์ใหม่
1. วางไฟล์ตาม convention: API ใน `apps/api/src/<module>/`, หน้าเว็บใน `apps/web/app/(site)|(app)/`
2. ถ้าจะใช้ข้อมูล dashboard ใหม่ → ขยาย `/enrollments/mine/summary` แทนการเพิ่ม endpoint กระจัดกระจาย
3. หน้าใหม่ต้องใช้ `@/components/ui` และ palette ใน `tailwind.config.ts` เท่านั้น
4. หากมี model ใหม่ → แก้ `schema.prisma` + สร้าง migration SQL + อัปเดต `context.md`

## งานที่รอทำ (todo)
- โลโก้จริงจาก npcreate.co.th (รอไฟล์จากผู้ใช้)
- ปรับ icon PWA (`public/icon.svg`, `icon-maskable.svg`) ตามโลโก้
- Deploy Vercel + Railway (ดู `DEPLOY.md`)
