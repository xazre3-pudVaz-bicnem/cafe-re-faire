/**
 * ブログの記事を読む部分。
 *
 * サイト（Next.js）と、自動投稿（API ルート・スクリプト）の両方から使う。
 * そのため、ここでは next/* や画像の import を使わない。
 *
 * 記事の置き場所
 *   content/blog/<年>/<YYYY-MM-DD>-<slug>.md   （frontmatter つきの Markdown）
 *   例: content/blog/2026/2026-10-07-terrine-cake-toha.md → /blog/terrine-cake-toha
 *
 * 年ごとのフォルダーに分けてあるのは、記事が数百本になっても1つのフォルダーが膨らまないようにするため。
 * frontmatter が壊れた記事は、警告を出して読み飛ばす（1本の不備でサイト全体のビルドを落とさない）。
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { categorySlugs } from "../../data/blog-categories";
import { isPhotoKey, type PhotoKey } from "../../data/photo-meta";
import { h2List, plainText } from "./text";

export const BLOG_DIR_REL = "content/blog";
export const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/** 記事の slug に使えない名前（/blog/page/…, /blog/category/… と衝突する） */
export const RESERVED_SLUGS = ["page", "category", "feed", "feed.xml"];

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FILE_PATTERN = /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

export type PostMeta = {
  slug: string;
  title: string;
  /** meta description（一覧の要約にも使う） */
  description: string;
  /** 公開日 YYYY-MM-DD（日本時間） */
  publishedAt: string;
  /** 更新日 YYYY-MM-DD */
  updatedAt: string;
  category: string;
  /** この記事が受け持つ検索語（1記事1つ。サイト内で重ねない）。お知らせは空でよい */
  focusKeyword: string;
  keywords: string[];
  /** 見出し写真（data/photo-meta.ts のキー） */
  eyecatch: PhotoKey;
  /** 関連する固定ページのパス（先頭が、いちばん関係の深いページ） */
  relatedPages: string[];
  /** 題材の ID（data/blog-topics.ts）。手書きの記事は無くてよい */
  topicId?: string;
  /** 書き方の型（自動投稿が毎回ちがう構成にするための記録） */
  format?: string;
  /** editor＝人が書いた／auto＝自動投稿 */
  author: "editor" | "auto";
  /** 自動投稿に使ったモデル */
  model?: string;
  /** 同じ日の記事の並び順（大きいほど上） */
  order: number;
  /** リポジトリ内のパス（content/blog/2026/2026-10-07-xxx.md） */
  file: string;
};

export type Post = PostMeta & {
  body: string;
  /** 本文の文字数（記法を除く） */
  chars: number;
  headings: { id: string; text: string }[];
};

function toDateString(v: unknown): string | undefined {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  return undefined;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim()) : [];
}

/** ファイル名から、日付と slug を取り出す */
export function parseFileName(file: string): { date: string; slug: string } | undefined {
  const m = path.posix.basename(file.replace(/\\/g, "/")).match(FILE_PATTERN);
  return m ? { date: m[1], slug: m[2] } : undefined;
}

/** 記事のファイル名を作る */
export function postFilePath(date: string, slug: string): string {
  return `${BLOG_DIR_REL}/${date.slice(0, 4)}/${date}-${slug}.md`;
}

/** 1本の記事を、文字列から読む。不備があれば理由を返す */
export function parsePostSource(file: string, raw: string): { post?: Post; error?: string } {
  const name = parseFileName(file);
  if (!name) return { error: "ファイル名は <YYYY-MM-DD>-<slug>.md（slug は半角英小文字・数字・ハイフン）" };
  if (RESERVED_SLUGS.includes(name.slug)) return { error: `slug「${name.slug}」は使えません` };

  let fm: matter.GrayMatterFile<string>;
  try {
    fm = matter(raw);
  } catch (e) {
    return { error: `frontmatter を解釈できません: ${(e as Error).message}` };
  }
  const d = fm.data as Record<string, unknown>;

  const title = str(d.title);
  const description = str(d.description);
  const category = str(d.category);
  const eyecatch = str(d.eyecatch);
  const publishedAt = toDateString(d.publishedAt) ?? name.date;

  const missing = Object.entries({ title, description, category, eyecatch })
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) return { error: `frontmatter に不足: ${missing.join(", ")}` };
  if (str(d.slug) && str(d.slug) !== name.slug) return { error: `frontmatter の slug（${str(d.slug)}）がファイル名（${name.slug}）と違います` };
  if (!categorySlugs.includes(category!)) return { error: `分類が登録にありません: ${category}` };
  if (!isPhotoKey(eyecatch!)) return { error: `eyecatch の写真が登録にありません: ${eyecatch}` };

  const body = fm.content.trim();
  if (!body) return { error: "本文がありません" };

  const post: Post = {
    slug: name.slug,
    title: title!,
    description: description!,
    publishedAt,
    updatedAt: toDateString(d.updatedAt) ?? publishedAt,
    category: category!,
    focusKeyword: str(d.focusKeyword) ?? "",
    keywords: strList(d.keywords),
    eyecatch: eyecatch as PhotoKey,
    relatedPages: strList(d.relatedPages),
    topicId: str(d.topicId),
    format: str(d.format),
    author: d.author === "auto" ? "auto" : "editor",
    model: str(d.model),
    order: typeof d.order === "number" ? d.order : 0,
    file: file.replace(/\\/g, "/"),
    body,
    chars: plainText(body).length,
    headings: h2List(body).map((text, i) => ({ id: `sec-${i + 1}`, text })),
  };
  return { post };
}

/** 記事のファイル。dir は年のフォルダー名（content/blog の直下に置いたファイルは空文字） */
function listPostFiles(): { dir: string; name: string }[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const out: { dir: string; name: string }[] = [];
  for (const entry of fs.readdirSync(BLOG_DIR, { withFileTypes: true })) {
    if (entry.isDirectory() && /^\d{4}$/.test(entry.name)) {
      for (const name of fs.readdirSync(path.join(process.cwd(), "content", "blog", entry.name))) {
        if (name.endsWith(".md") && !name.startsWith("_")) out.push({ dir: entry.name, name });
      }
    } else if (entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("_")) {
      out.push({ dir: "", name: entry.name });
    }
  }
  return out;
}

/**
 * 全記事を新しい順に読む。
 * 読む場所は content/blog に固定している（パスを自由に組み立てると、ビルドがプロジェクト全体を
 * サーバーの同梱対象として追跡してしまうため。必ず "content", "blog" から書き始める）。
 */
export function loadPosts(): Post[] {
  const posts: Post[] = [];
  const seen = new Map<string, string>();
  for (const { dir, name } of listPostFiles()) {
    const file = dir ? `${BLOG_DIR_REL}/${dir}/${name}` : `${BLOG_DIR_REL}/${name}`;
    let raw: string;
    try {
      raw = fs.readFileSync(path.join(process.cwd(), "content", "blog", dir, name), "utf8");
    } catch (e) {
      console.warn(`[blog] ${file} を読めません — ${(e as Error).message}`);
      continue;
    }
    const { post, error } = parsePostSource(file, raw);
    if (!post) {
      console.warn(`[blog] ${file} を読み飛ばしました — ${error}`);
      continue;
    }
    const dup = seen.get(post.slug);
    if (dup) {
      console.warn(`[blog] ${file} を読み飛ばしました — slug が ${dup} と同じです`);
      continue;
    }
    seen.set(post.slug, file);
    posts.push(post);
  }
  return posts.sort(comparePosts);
}

export function comparePosts(a: PostMeta, b: PostMeta): number {
  if (a.publishedAt !== b.publishedAt) return a.publishedAt < b.publishedAt ? 1 : -1;
  if (a.order !== b.order) return b.order - a.order;
  return a.slug < b.slug ? -1 : 1;
}

/** 2026-10-07 → 2026.10.07 */
export function formatDate(date: string): string {
  return date.replaceAll("-", ".");
}
