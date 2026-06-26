# NP Learning — Deploy Handoff (อ่านไฟล์นี้ก่อนเริ่ม)

> สำหรับ AI/คนที่จะ deploy: โปรเจกต์นี้พร้อม deploy แล้ว ไม่ต้องสร้างใหม่
> รายละเอียดเต็มอยู่ใน `DEPLOY.md` — ไฟล์นี้คือสรุปสั้นให้เริ่มได้เลย

## โปรเจกต์คืออะไร
- **pnpm monorepo + Turborepo** ตั้งอยู่ที่ `/Users/ii/online-learning`
- `apps/web` → **Next.js 15** (App Router, React 19, Tailwind, PWA) ← deploy ขึ้น **Vercel**
- `apps/api` → **NestJS + Prisma** (REST API) ← deploy ขึ้น **Railway** (มี `Dockerfile` + `railway.json` ให้แล้ว)
- `packages/shared` → types ที่ใช้ร่วมกัน
- **Database** → Supabase Postgres (migrate อัตโนมัติตอน API start)
- **Auth** → Supabase Auth

## เป้าหมาย deploy
1. **Web → Vercel** (ได้โดเมนชั่วคราว `xxx.vercel.app` ก่อน)
2. **API → Railway**
3. **DB → Supabase** (มีโปรเจกต์อยู่แล้ว)

## ⚠️ จุดสำคัญที่ห้ามพลาด (เพราะเป็น monorepo)
- บน Vercel ต้องตั้ง **Root Directory = `apps/web`** (ไม่งั้น build ไม่ผ่าน)
- **อย่า** ตั้ง env `NEXT_DIST_DIR` บน Vercel (ให้ใช้ `.next` ตามค่าเริ่มต้น)
- `transpilePackages: ["@app/shared"]` ตั้งไว้แล้วใน `next.config.mjs`

## ENV ที่ต้องใส่

### Vercel (apps/web)
```
NEXT_PUBLIC_API_URL            = <Railway API URL>
NEXT_PUBLIC_SUPABASE_URL       = https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = sb_publishable_...
NEXT_PUBLIC_DEV_AUTH           = false
```

### Railway (apps/api)
```
DATABASE_URL = <Supabase Session pooler URI>
SUPABASE_URL = https://<ref>.supabase.co
DEV_AUTH     = false
API_PORT     = 4000
WEB_ORIGIN   = <Vercel URL>   # ใส่ทีหลังหลัง web deploy เสร็จ เพื่อแก้ CORS
```

## วิธี deploy (เลือกทางใดทางหนึ่ง)

### ทาง A — ผ่าน GitHub + Dashboard (แนะนำ เสถียรสุด)
1. push โค้ดขึ้น GitHub: `bash scripts/push-to-github.sh`
2. Railway → New Project → Deploy from GitHub repo (เจอ `railway.json` เอง) → ใส่ env → Generate Domain
3. Vercel → Add New Project → Import repo → **Root Directory = apps/web** → ใส่ env → Deploy
4. เอา Vercel URL ไปใส่ `WEB_ORIGIN` ใน Railway

### ทาง B — Vercel CLI (web อย่างเดียว)
```bash
cd apps/web
npx vercel@latest login
npx vercel@latest link
npx vercel@latest deploy --prod
```
> หมายเหตุ: API ต้อง deploy แยก (Railway) เพราะ NestJS ไม่ใช่ serverless ของ Vercel

## ขั้นตอนละเอียด → ดู `DEPLOY.md`
