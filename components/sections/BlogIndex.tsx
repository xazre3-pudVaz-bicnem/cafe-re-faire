import Link from "next/link";
import { PostRows } from "@/components/sections/PostRows";
import { pages } from "@/data/pages";
import { getActiveCategories, pageCount, type Post } from "@/lib/blog";

/**
 * ブログの一覧（/blog・/blog/page/N・/blog/category/xxx で共通）。
 * 分類の絞り込みは、文字のリンクだけ（PC では、左に貼りつく）。記事は、罫で区切った行で並べる。
 */
export function BlogIndex({
  posts,
  total,
  page,
  basePath,
  currentCategory,
}: {
  /** このページに出す記事 */
  posts: Post[];
  /** 絞り込んだあとの全件数 */
  total: number;
  page: number;
  /** ページ送りの土台（/blog または /blog/category/xxx） */
  basePath: string;
  currentCategory?: string;
}) {
  const categories = getActiveCategories();
  const pages_ = pageCount(total);
  const hrefFor = (n: number) => (n === 1 ? basePath : `${basePath}/page/${n}`);

  return (
    <div className="wrap grid gap-y-8 lg:grid-cols-12 lg:gap-x-8">
      <nav aria-label="記事の分類" className="lg:col-span-3">
        <ul className="flex flex-wrap gap-x-6 gap-y-0 text-[0.875rem] tracking-[0.06em] lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:block">
          <li>
            <Link
              href={pages.blog.path}
              aria-current={!currentCategory ? "page" : undefined}
              className="nav-link text-[0.875rem] tracking-[0.06em] text-ink-2 aria-[current=page]:text-ink"
            >
              <span className="ul">すべての記事</span>
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/blog/category/${c.slug}`}
                aria-current={currentCategory === c.slug ? "page" : undefined}
                className="nav-link text-[0.875rem] tracking-[0.06em] text-ink-2 aria-[current=page]:text-ink"
              >
                <span className="ul">
                  {c.name}
                  <span className="num ml-[0.6em] text-[1rem] text-mute">{c.count}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="lg:col-span-9 lg:col-start-4">
        {posts.length > 0 ? <PostRows posts={posts} headingLevel={2} withSummary /> : <p>記事は、まだありません。</p>}

        {pages_ > 1 && (
          <nav aria-label="ページ送り" className="mt-10 flex items-center justify-between gap-6">
            {page > 1 ? (
              <Link href={hrefFor(page - 1)} rel="prev" className="link inline-flex min-h-11 items-center text-[0.9375rem]">
                新しい記事へ
              </Link>
            ) : (
              <span />
            )}
            <p className="text-[0.8125rem] tracking-[0.1em] text-mute">
              <span className="num text-[1.125rem] text-ink">{page}</span>
              <span className="mx-[0.5em]">/</span>
              <span className="num text-[1.125rem]">{pages_}</span>
            </p>
            {page < pages_ ? (
              <Link href={hrefFor(page + 1)} rel="next" className="link inline-flex min-h-11 items-center text-[0.9375rem]">
                古い記事へ
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
