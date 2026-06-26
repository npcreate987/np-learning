# 🚀 Deploy NP Learning

สถาปัตยกรรม: **Web (Vercel)** + **API (Railway)** + **Database (Supabase Postgres)**

> โดเมนชั่วคราวจะได้เป็น `xxx.vercel.app` ก่อน — พอมีโดเมนจริงค่อยเพิ่มทีหลังได้ (ไม่ต้อง deploy ใหม่)

---

## เตรียมบัญชี (ฟรีทั้งหมด)
- GitHub — https://github.com
- Vercel — https://vercel.com (ล็อกอินด้วย GitHub)
- Railway — https://railway.app (ล็อกอินด้วย GitHub)
- Supabase — โปรเจกต์ `npleaning` ที่ตั้งไว้แล้ว

---

## ขั้นที่ 1 — Database (Supabase)

1. Supabase Dashboard → ปุ่ม **Connect** → แท็บ **Session pooler**
2. คัดลอก URI แล้วแทน `[YOUR-PASSWORD]` ด้วยรหัส DB ของคุณ → เก็บไว้เป็น **DATABASE_URL**
3. เอา **Project URL** (`https://xxx.supabase.co`) และ **anon/publishable key** มาเก็บไว้ด้วย

> ตาราง DB จะถูกสร้างอัตโนมัติตอน API deploy (Dockerfile รัน `prisma migrate deploy` ให้)

---

## ขั้นที่ 2 — Push โค้ดขึ้น GitHub

ใน **Terminal เครื่องคุณ** (ไม่ใช่ใน Cursor):

```bash
cd /Users/ii/online-learning
bash scripts/push-to-github.sh
```

สคริปต์จะ init git + commit + push (ใส่ URL repo ว่างที่สร้างจาก github.com/new)

---

## ขั้นที่ 3 — API ขึ้น Railway

1. Railway → **New Project** → **Deploy from GitHub repo** → เลือก repo
2. Railway จะเจอ `railway.json` + `apps/api/Dockerfile` เอง
3. ไปแท็บ **Variables** ใส่:
   ```
   DATABASE_URL = <Supabase Session pooler URI>
   SUPABASE_URL = https://xxx.supabase.co
   DEV_AUTH     = false
   API_PORT     = 4000
   ```
4. แท็บ **Settings → Networking → Generate Domain** → ได้ URL เช่น
   `https://np-learning-api.up.railway.app` → **คัดลอกเก็บไว้**

---

## ขั้นที่ 4 — Web ขึ้น Vercel

1. Vercel → **Add New → Project** → Import repo เดียวกัน
2. **Root Directory** → กด Edit → เลือก **`apps/web`**  ← สำคัญมาก
3. Framework = Next.js (auto)
4. **Environment Variables** ใส่:
   ```
   NEXT_PUBLIC_API_URL            = https://np-learning-api.up.railway.app
   NEXT_PUBLIC_SUPABASE_URL       = https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY  = sb_publishable_...
   NEXT_PUBLIC_DEV_AUTH           = false
   ```
5. **Deploy** → ได้ URL `https://np-learning.vercel.app`

---

## ขั้นที่ 5 — เชื่อม Web ↔ API (CORS)

1. กลับไป Railway → Variables เพิ่ม:
   ```
   WEB_ORIGIN = https://np-learning.vercel.app
   ```
2. Railway redeploy อัตโนมัติ

---

## ขั้นที่ 6 — Supabase Auth (เปิดให้สมัคร/ล็อกอินจริง)

1. Supabase → **Authentication → URL Configuration**
   - Site URL = `https://np-learning.vercel.app`
   - Redirect URLs เพิ่ม `https://np-learning.vercel.app/**`
2. **Authentication → Providers → Email** → ปิด *Confirm email* (ถ้าอยากให้สมัครแล้วใช้ได้เลย)

เสร็จแล้วเปิด `https://np-learning.vercel.app/signup` สมัครได้เลย

---

## ขั้นที่ 7 — เพิ่มโดเมนจริง (เมื่อมี)

- **Vercel** → Project → Settings → **Domains** → Add `learn.yourdomain.com` → ตั้ง DNS ตามที่ Vercel บอก
- อัปเดต `WEB_ORIGIN` (Railway) และ Supabase Site URL ให้เป็นโดเมนใหม่

---

## หมายเหตุ
- โหมดเดโม (`DEV_AUTH=true`) ใช้เฉพาะตอนรันในเครื่อง — บน production ตั้ง **`false`** เสมอ (ปิดปุ่มล็อกอินเดโม)
- ถ้า API เริ่มไม่ขึ้น ให้ดู Logs ใน Railway (มักเป็นเรื่อง `DATABASE_URL` ผิด)
