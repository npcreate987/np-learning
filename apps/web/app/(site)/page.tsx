import Link from "next/link";
import { BookOpen, Rocket, Smartphone } from "lucide-react";
import { Button, Card } from "@/components/ui";

const features = [
  {
    icon: BookOpen,
    title: "เนื้อหาจัดเต็ม",
    desc: "คอร์สหลากหลายพร้อมบทเรียนและเนื้อหาแบบ rich text ครบถ้วน",
  },
  {
    icon: Smartphone,
    title: "เรียนได้ทุกที่",
    desc: "ใช้งานได้ลื่นทั้งมือถือและเดสก์ท็อป ติดตั้งเป็นแอป (PWA) ได้",
  },
  {
    icon: Rocket,
    title: "ติดตามความคืบหน้า",
    desc: "บันทึกบทเรียนที่เรียนจบ พร้อมแถบความคืบหน้าของแต่ละคอร์ส",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16 py-6">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-16 text-center text-white sm:px-12">
        <h1 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">
          เรียนรู้ทักษะใหม่ได้ทุกที่ ทุกเวลา
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-brand-100 sm:text-lg">
          แพลตฟอร์มเรียนออนไลน์ที่รวมคอร์สหลากหลาย พร้อมติดตามความคืบหน้าการเรียนได้อย่างง่ายดาย
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/courses">
            <Button size="lg" variant="secondary">
              เริ่มเรียนเลย
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20"
            >
              สมัครเรียน
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="p-6">
            <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <f.icon size={22} />
            </span>
            <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
