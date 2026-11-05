import type { MetadataRoute } from "next";
import { isIndexable, SITE_URL } from "@/lib/seo";

/**
 * robots.txt。全ページの巡回を許す。本番では、sitemap の場所も書く。
 *
 * 公開 URL が決まっていない間（プレビュー・手元）も、巡回は止めない。
 * 止めると、検索エンジンは各ページの noindex（meta と、vercel.app に付ける X-Robots-Tag）を読めず、
 * ほかからリンクされた URL が、中身なしで検索結果に残ることがあるため。載せないのは noindex のほうで止める。
 */
export default function robots(): MetadataRoute.Robots {
  const rules = [{ userAgent: "*", allow: "/" }];
  if (!isIndexable) return { rules };
  return { rules, sitemap: `${SITE_URL}/sitemap.xml` };
}
