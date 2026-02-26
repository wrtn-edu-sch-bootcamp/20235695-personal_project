import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/inventory/bottom-nav";
import { ChatBot } from "@/components/inventory/chat-bot";
import { DevCacheReset } from "@/components/system/dev-cache-reset";
import {
  BRAND_OWNER_DISPLAY,
  BRAND_SIGNATURE_TEXT,
} from "@/lib/brand";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `ING EA 재고 확인 | ${BRAND_OWNER_DISPLAY}`,
  description: `바코드 스캔으로 빠르게 재고를 확인하세요 · ${BRAND_OWNER_DISPLAY}`,
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
        <DevCacheReset />
        <main className="min-h-screen pb-20">{children}</main>
        <div className="pointer-events-none fixed inset-x-0 bottom-[4.9rem] z-40 flex justify-center px-4">
          <p className="rounded-full border bg-background/90 px-3 py-1 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
            {BRAND_SIGNATURE_TEXT}
          </p>
        </div>
        <ChatBot />
        <BottomNav />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
