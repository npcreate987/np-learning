import { Share2 } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Affiliate" };

export default function AffiliatePage() {
  return (
    <ComingSoon
      title="Affiliate"
      description="แนะนำคอร์สและรับค่าคอมมิชชัน"
      icon={Share2}
      features={["ลิงก์แนะนำ", "ติดตามยอด", "ถอนรายได้"]}
    />
  );
}
