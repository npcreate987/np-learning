import { Store } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Marketplace" };

export default function MarketplacePage() {
  return (
    <ComingSoon
      title="Marketplace"
      description="ตลาดซื้อขาย Template, Prompt Pack, Ebook และ AI Tools"
      icon={Store}
      features={["53 Prompt Pack", "AI Tools", "Templates", "Ebook"]}
    />
  );
}
