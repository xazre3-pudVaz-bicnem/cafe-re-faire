import type { MetadataRoute } from "next";
import { pageList } from "@/data/pages";
import { CATEGORY_INDEX_MIN, getActiveCategories, getAllPosts } from "@/lib/blog";
import { absoluteUrl, isIndexable } from "@/lib/seo";

/**
 * sitemap.xml。
 * 載せるのは、検索エンジンに載せてよいページだけ（固定ページ・記事・記事が3本以上ある分類）。
 * 公開 URL が決まっていない間（プレビュー・手元）は、空にする。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexable) return [];

  const posts = getAllPosts();
  const latest = posts[0]?.updatedAt;
  const url = (path: string) => absoluteUrl(path)!;

  return [
    ...pageList.map((p) => ({
      url: url(p.path),
      // トップとブログの一覧は、新しい記事が出るたびに変わる
      lastModified: p.key === "home" || p.key === "blog" ? latest : undefined,
      changeFrequency: p.key === "blog" ? ("daily" as const) : ("weekly" as const),
      priority: p.key === "home" ? 1 : 0.8,
    })),
    ...getActiveCategories()
      .filter((c) => c.count >= CATEGORY_INDEX_MIN)
      .map((c) => ({
        url: url(`/blog/category/${c.slug}`),
        lastModified: posts.find((p) => p.category === c.slug)?.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
    ...posts.map((p) => ({
      url: url(`/blog/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
