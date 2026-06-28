import { Store } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Marketplace" };

export default function MarketplacePage() {
  return (
    <ComingSoon
      title="Marketplace"
      description="ตลาดซื้อขาย Template, คู่มือ, Ebook และเครื่องมือเสริมสำหรับการเรียน"
      icon={Store}
      features={["Template", "คู่มือใช้งาน", "Ebook", "เครื่องมือเสริม"]}
    />
  );
}
