import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { NativeBridge } from "@/components/native-bridge";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NP Learning - เรียนออนไลน์",
    template: "%s | NP Learning",
  },
  description: "แพลตฟอร์มเรียนออนไลน์ สร้างและเรียนคลาสได้ทุกที่ทุกเวลา",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NP Learning",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <AuthProvider>
          {children}
          <ServiceWorkerRegister />
          <NativeBridge />
        </AuthProvider>
      </body>
    </html>
  );
}
