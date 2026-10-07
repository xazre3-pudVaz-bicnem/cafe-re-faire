import type { MetadataRoute } from "next";
import { isIndexable, SITE_URL } from "@/lib/seo";

/**
 * robots.txt。
 * 公開 URL が決まっていない間（プレビュー・手元）は、すべて拒否する。
 * 本番では、自動投稿の入口（/api/）だけを外す。
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
