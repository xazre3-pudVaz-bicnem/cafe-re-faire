import type { NextConfig } from "next";

/**
 * 公開 URL（canonical・OGP・sitemap・構造化データの土台）。
 *
 * - 本番のドメインは、下の PRODUCTION_URL に1か所だけ書く。使うのは Vercel の本番ビルド（VERCEL_ENV=production）のときだけ。
 *   ここに書いてよいのは、店に確かめたドメインだけ（2026-11-04 店から「cafe-re-faire.com で大丈夫です」。www ありを主にしてある）。
 * - プレビュー・手元では空のまま。canonical も sitemap も出さず、全ページ noindex になる
 *   （プレビュー用の URL が検索結果に載るのを、仕組みとして防ぐため）。
 * - 環境変数 NEXT_PUBLIC_SITE_URL があれば、そちらを優先する（手元で、本番と同じ出力を確かめるときに使う）。
 */
const PRODUCTION_URL = "https://www.cafe-re-faire.com";
const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
const siteUrl = fromEnv || (process.env.VERCEL_ENV === "production" ? PRODUCTION_URL : "");

// 歯止め：Vercel につないである本番ドメインと、上の定数が違えば、ビルドの記録に出す（値には使わない。www なしが返ることがあるため）
const vercelProduction = (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "").replace(/^www\./, "");
if (
  process.env.VERCEL_ENV === "production" &&
  vercelProduction &&
  !vercelProduction.endsWith(".vercel.app") &&
  vercelProduction !== new URL(PRODUCTION_URL).host.replace(/^www\./, "")
) {
  console.warn(`[next.config] 公開 URL（${PRODUCTION_URL}）と、Vercel の本番ドメイン（${process.env.VERCEL_PROJECT_PRODUCTION_URL}）が違います`);
}

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
   * 記事の Markdown を、公開後にも読む関数に同梱する。
   * トップページ（/）は1時間ごとに描き直すとき、新しい記事の一覧を読む（app/(home)/page.tsx の revalidate）
   */
  outputFileTracingIncludes: {
    "/": ["./content/blog/**/*"],
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
  async redirects() {
    return [
      {
        // 確認用に共有していた vercel.app の URL は、本番ドメインへ移す
        source: "/:path*",
        has: [{ type: "host", value: "cafe-re-faire.vercel.app" }],
        destination: `${PRODUCTION_URL}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
