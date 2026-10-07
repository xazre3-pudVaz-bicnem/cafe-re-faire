import type { Metadata, Viewport } from "next";
import { EB_Garamond } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { pages } from "@/data/pages";
import { site } from "@/data/site";
import { isIndexable, SITE_URL } from "@/lib/seo";
import "./globals.css";

/**
 * 欧文だけの書体（店名・数字・小さなラベルに使う）。
 * 和文は端末の書体を使い、Web フォントは読み込まない（日本語フォントは表示を大きく遅らせるため）。
 */
const garamondItalic = EB_Garamond({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  display: "swap",
  variable: "--font-garamond-italic",
  // トップの最初の画面に出る店名に使うので、これだけ先読みする
  preload: true,
});
const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal"],
  display: "swap",
  variable: "--font-garamond",
  // 数字と小さなラベル用。最初の画面の写真と回線を取り合わないよう、先読みはしない
  preload: false,
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

/**
 * 画面に入った写真をゆっくり現すための小さなスクリプト（CSS の [data-reveal] と対）。
 * - html に .js を付ける。付いたときだけ、CSS が写真をいったん隠す（JS が無ければ最初から見える）
 * - 位置の判定は IntersectionObserver だけで行う（全部の要素の位置を先に測ると、画面外の区画まで描画させてしまう）
 * - ページ移動で後から入る要素も MutationObserver で拾う
 */
const REVEAL_SCRIPT = `(function(){var d=document,h=d.documentElement;if(!('IntersectionObserver'in window)||!('MutationObserver'in window))return;h.classList.add('js');var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:0.01});function scan(r){if(r.nodeType!==1)return;if(r.hasAttribute('data-reveal'))io.observe(r);var l=r.querySelectorAll('[data-reveal]');for(var i=0;i<l.length;i++)io.observe(l[i])}new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var a=ms[i].addedNodes;for(var j=0;j<a.length;j++)scan(a[j])}}).observe(h,{childList:true,subtree:true})})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${garamond.variable} ${garamondItalic.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: REVEAL_SCRIPT }} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
