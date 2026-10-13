import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageVeil } from "@/components/layout/PageVeil";
import { pages } from "@/data/pages";
import { site } from "@/data/site";
import { BOOT_SCRIPT } from "@/lib/boot-script";
import { isIndexable, SITE_URL } from "@/lib/seo";
import "./globals.css";

/**
 * Web フォントは、欧文の Instrument Serif だけ（店名・区画の名前・数字に使う）。立体と斜体の2つ。
 * 和文は端末の書体を使い、Web フォントは読み込まない（日本語フォントは表示を大きく遅らせるため）。
 * 最初の画面の店名に使うので、先読みする。
 */
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
  title: { absolute: pages.home.title },
  description: pages.home.description,
  applicationName: site.name,
  formatDetection: { telephone: false, address: false, email: false },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  robots: isIndexable
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
    : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f6f4ef",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={instrument.variable} suppressHydrationWarning>
      <body>
        {/* 最初の描画の前に動かす（動きの準備・ヘッダーの状態）。中身は lib/boot-script.ts */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        {/* ヘッダーとフッターは、ここに1つずつ置く。ページを移っても同じ要素のまま残る（開いたメニューや、移り変わりの幕が途切れない） */}
        <Header />
        {children}
        <Footer />
        <PageVeil />
      </body>
    </html>
  );
}
