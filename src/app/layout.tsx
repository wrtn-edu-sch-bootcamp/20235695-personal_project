import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/inventory/bottom-nav";
import { ChatBot } from "@/components/inventory/chat-bot";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "편의점 재고 확인",
  description: "바코드 스캔으로 빠르게 재고를 확인하세요",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "재고확인",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} antialiased bg-background`}>
        <main className="min-h-screen pb-20">{children}</main>
        <ChatBot />
        <BottomNav />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
