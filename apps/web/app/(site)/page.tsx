import Link from "next/link";
import { BookOpen, CheckCircle2, ClipboardList, Smartphone } from "lucide-react";
import { Button, Card } from "@/components/ui";

const features = [
  {
    icon: BookOpen,
    title: "คลาสเป็นคลิปสั้น",
    desc: "เรียนทีละคลิป กระชับ เข้าใจง่าย กลับมาเลื่อนต่อได้ทันทีที่ค้างไว้",
  },
  {
    icon: Smartphone,
    title: "เรียนแบบแนวตั้งบนมือถือ",
    desc: "คลิปวิดีโอแนวตั้ง เลื่อนดูแบบฟีด TikTok เหมาะกับคนที่เรียนระหว่างวัน",
  },
  {
    icon: ClipboardList,
    title: "มีทีมงานติดตาม",
    desc: "ฟอร์มสนใจเรียนช่วยให้ทีมงานติดต่อกลับและแนะนำคลาสที่เหมาะกับเป้าหมาย",
  },
];

const stats = [
  { value: "Mobile first", label: "เรียนบนมือถือได้ลื่น" },
  { value: "Certificate", label: "ทำแบบทดสอบและรับใบประกาศ" },
  { value: "Community", label: "พูดคุยและเรียนรู้ร่วมกัน" },
];

export default function HomePage() {
  return (
    <div className="space-y-14 py-4">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(23,20,47,0.08)]">
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.08fr_0.92fr] lg:p-12">
          <div className="flex flex-col justify-center">
            <span className="mb-5 inline-flex w-fit rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800">
              NP Learning Platform
            </span>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
              เรียนรู้ผ่านคลิปการสอนสั้น เลื่อนดูแบบฟีด
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              รวมคลาสคลิปสั้นเกี่ยวกับ TikTok และการตลาดดิจิทัล พร้อมแบบทดสอบ ใบประกาศ
              และระบบติดตามผู้เรียนไว้ในที่เดียว เปิดดูได้ทั้งวิดีโอ YouTube และ .mp4
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/interest">
                <Button size="lg">สนใจเรียน / ให้ติดต่อกลับ</Button>
              </Link>
              <Link href="/classes">
                <Button size="lg" variant="outline">
                  ดูคลาสทั้งหมด
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-600">
              {["สมัครเรียนง่าย", "เรียนต่อได้ทุกอุปกรณ์", "มีประวัติและใบประกาศ"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-gold-600" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative rounded-[1.75rem] bg-cream-100 p-5">
            <div className="rounded-[1.35rem] bg-ink p-5 text-white">
              <p className="text-sm text-slate-300">Course Journey</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                เริ่มเรียนวันนี้
              </h2>
              <div className="mt-6 space-y-3">
                {["เลือกคลาสที่สนใจ", "เลื่อนดูคลิปสั้นแนวตั้ง", "ทำแบบทดสอบและรับใบประกาศ"].map(
                  (step, index) => (
                    <div key={step} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-ink">
                        {index + 1}
                      </span>
                      <span className="text-sm text-slate-100">{step}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {stats.map((item) => (
                <div key={item.value} className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-ink">{item.value}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="p-6">
            <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <f.icon size={22} />
            </span>
            <h3 className="text-lg font-semibold text-ink">{f.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{f.desc}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
