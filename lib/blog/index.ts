/**
 * ブログの記事を、ページから使うための入口。
 * 記事はビルド時に一度だけ読む（全ページが静的に書き出される）。
 */
import { cache } from "react";
import { blogCategories } from "@/data/blog-categories";
import { loadPosts, type Post } from "./core";
import { dice, keywordKey } from "./text";

export type { Post, PostMeta } from "./core";
export { formatDate } from "./core";

/** 一覧の1ページに出す本数 */
export const POSTS_PER_PAGE = 12;
/** 分類の一覧を検索エンジンに載せる、最低の記事数（少ない間は内容が薄いので載せない） */
export const CATEGORY_INDEX_MIN = 3;

export const getAllPosts = cache((): Post[] => loadPosts());

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getPostsByCategory(category: string): Post[] {
  return getAllPosts().filter((p) => p.category === category);
}

/** 記事が1本でもある分類（一覧の絞り込みに出す） */
export function getActiveCategories() {
  const posts = getAllPosts();
  return blogCategories
    .map((c) => ({ ...c, count: posts.filter((p) => p.category === c.slug).length }))
    .filter((c) => c.count > 0);
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
}

export function paginate<T>(items: T[], page: number): T[] {
  return items.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
}

/**
 * 関連する記事。
 * 同じ分類・近い検索語・同じ固定ページを支える記事を優先し、同点なら新しい順。
 * 記事が増えても、毎回同じ結果になる（順位づけに乱数を使わない）。
 */
export function getRelatedPosts(post: Post, count = 3): Post[] {
  const key = keywordKey(post.focusKeyword);
  const words = new Set(key.split(" ").filter(Boolean));
  // 読みものには読みものを、お知らせにはお知らせを並べる（営業日のお知らせが、読みものの関連に混ざらないように）
  const isNews = post.category === "news";
  return getAllPosts()
    .filter((p) => p.slug !== post.slug && (p.category === "news") === isNews)
    .map((p) => {
      let score = 0;
      if (p.category === post.category) score += 3;
      if (p.relatedPages[0] && p.relatedPages[0] === post.relatedPages[0]) score += 1;
      const shared = keywordKey(p.focusKeyword).split(" ").filter((w) => words.has(w)).length;
      score += Math.min(shared, 2);
      score += dice(p.title, post.title) * 2;
      for (const k of p.keywords) if (post.keywords.includes(k)) score += 0.5;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score || (a.p.publishedAt < b.p.publishedAt ? 1 : -1))
    .slice(0, count)
    .map((x) => x.p);
}

/** 前後の記事（公開順） */
export function getAdjacentPosts(post: Post): { newer?: Post; older?: Post } {
  const posts = getAllPosts();
  const i = posts.findIndex((p) => p.slug === post.slug);
  return { newer: i > 0 ? posts[i - 1] : undefined, older: i >= 0 && i < posts.length - 1 ? posts[i + 1] : undefined };
}
