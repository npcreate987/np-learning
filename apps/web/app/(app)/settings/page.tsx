import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      description="ตั้งค่าบัญชีและการแจ้งเตือน"
      icon={Settings}
      features={["โปรไฟล์", "การแจ้งเตือน", "การชำระเงิน", "ความปลอดภัย"]}
    />
  );
}
