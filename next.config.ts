import type { NextConfig } from "next";

/**
 * 公開 URL（canonical・OGP・sitemap・構造化データの土台）。
 *
 * - Vercel の Production 環境の環境変数 NEXT_PUBLIC_SITE_URL に、独自ドメインの URL を入れる
 *   （例: https://www.example.com）。末尾の / は付けても付けなくてもよい。
 * - 入っていない間（プレビュー・手元）は、canonical も sitemap も出さず、全ページ noindex になる。
 *   プレビュー用の URL が検索結果に載るのを、仕組みとして防ぐため。
 */
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
  poweredByHeader: false,
  // 親フォルダーに別の package-lock.json があっても、このフォルダーを起点にする
  turbopack: { root: process.cwd() },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    // 元の写真は長辺 1,700px ほど。それより大きい幅（2048・3840）の候補は同じ画像になるだけなので、出さない（HTML が軽くなる）
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // 写真はファイル名に内容のハッシュが付くので、長く持たせてよい
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  /**
   * 毎日の自動投稿（/api/cron/daily-post）は、公開済みの記事を読んで重複を調べる。
   * 記事の Markdown を、その関数にだけ同梱する。
   */
  outputFileTracingIncludes: {
    "/api/cron/daily-post": ["./content/blog/**/*"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // *.vercel.app で配信される分は、設定に関係なく検索エンジンに載せない
        source: "/:path*",
        has: [{ type: "host", value: "(?<sub>.*)\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
