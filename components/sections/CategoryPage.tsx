import type { Metadata } from "next";
import { BlogIndex } from "@/components/sections/BlogIndex";
import { PageHead } from "@/components/sections/PageHead";
import { JsonLd } from "@/components/ui/JsonLd";
import { categoryBySlug } from "@/data/blog-categories";
import { pages } from "@/data/pages";
import { site } from "@/data/site";
import { CATEGORY_INDEX_MIN, getPostsByCategory, pageCount, paginate } from "@/lib/blog";
import { breadcrumbNode, organizationNode, webPageNode, websiteNode, type Crumb } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

/**
 * 分類ごとの一覧（/blog/category/xxx と、その2ページ目から）の共通部分。
 * 記事が少ないうちは内容が薄いので、検索エンジンには載せない（リンクはたどらせる）。
 */
export function resolveCategory(slug: string, pageRaw?: string) {
  const category = categoryBySlug(slug);
  if (!category) return undefined;
  const all = getPostsByCategory(slug);
  if (all.length === 0) return undefined;
  const n = pageRaw === undefined ? 1 : Number(pageRaw);
  if (!Number.isInteger(n) || n < 1 || n > pageCount(all.length)) return undefined;
  if (pageRaw !== undefined && n < 2) return undefined;
  const base = `${pages.blog.path}/category/${slug}`;
  return { category, all, n, base, path: n === 1 ? base : `${base}/page/${n}` };
}

type Resolved = NonNullable<ReturnType<typeof resolveCategory>>;

function titleOf(r: Resolved): string {
  return `${r.category.name}${r.n > 1 ? `（${r.n}ページ目）` : ""}｜${site.name}のブログ`;
}

export function categoryMetadata(r: Resolved): Metadata {
  return buildMetadata({
    title: titleOf(r),
    description: r.category.description,
    path: r.path,
    ogPhoto: r.all[0]?.eyecatch ?? pages.blog.ogPhoto,
    noindex: r.all.length < CATEGORY_INDEX_MIN,
  });
}

export function CategoryPage({ r }: { r: Resolved }) {
  const crumbs: Crumb[] = [
    { name: pages.home.label, path: pages.home.path },
    { name: pages.blog.label, path: pages.blog.path },
    { name: r.category.name, path: r.base },
    ...(r.n > 1 ? [{ name: `${r.n}ページ目`, path: r.path }] : []),
  ];

  return (
    <>
      <PageHead
        crumbs={crumbs}
        title={
          <>
            {r.category.name}
            {r.n > 1 && <span className="ml-[0.8em] text-[0.6em] tracking-[0.1em] text-mute">{r.n}ページ目</span>}
          </>
        }
        lead={r.n === 1 ? r.category.description : undefined}
      />
      <section className="section no-cv">
        <BlogIndex posts={paginate(r.all, r.n)} total={r.all.length} page={r.n} basePath={r.base} currentCategory={r.category.slug} />
      </section>
      <JsonLd
        graph={[
          organizationNode(),
          websiteNode(),
          webPageNode({ path: r.path, title: titleOf(r), description: r.category.description, type: "CollectionPage", hasBreadcrumb: true }),
          breadcrumbNode(crumbs, r.path),
        ]}
      />
    </>
  );
}
