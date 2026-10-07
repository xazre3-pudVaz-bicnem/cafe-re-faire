/** ブログの一覧（2ページ目から）。記事が増えても、古い記事までリンクでたどれるようにするためのページ */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/sections/BlogIndex";
import { PageHead } from "@/components/sections/PageHead";
import { JsonLd } from "@/components/ui/JsonLd";
import { pages } from "@/data/pages";
import { site } from "@/data/site";
import { getAllPosts, pageCount, paginate } from "@/lib/blog";
import { breadcrumbNode, organizationNode, webPageNode, websiteNode, type Crumb } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ page: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  const total = pageCount(getAllPosts().length);
  // 1ページ目は /blog。ここは 2 ページ目から
  return Array.from({ length: Math.max(0, total - 1) }, (_, i) => ({ page: String(i + 2) }));
}

function resolve(raw: string) {
  const n = Number(raw);
  const all = getAllPosts();
  if (!Number.isInteger(n) || n < 2 || n > pageCount(all.length)) return undefined;
  return { n, all, path: `${pages.blog.path}/page/${n}` };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = resolve((await params).page);
  if (!r) return {};
  return buildMetadata({
    title: `ブログ（${r.n}ページ目）｜${site.name}`,
    description: `${pages.blog.description}（${r.n}ページ目）`,
    path: r.path,
    ogPhoto: pages.blog.ogPhoto,
  });
}

export default async function BlogPagedPage({ params }: Props) {
  const r = resolve((await params).page);
  if (!r) notFound();

  const crumbs: Crumb[] = [
    { name: pages.home.label, path: pages.home.path },
    { name: pages.blog.label, path: pages.blog.path },
    { name: `${r.n}ページ目`, path: r.path },
  ];
  const title = `ブログ（${r.n}ページ目）｜${site.name}`;

  return (
    <>
      <PageHead
        crumbs={crumbs}
        title={
          <>
            ブログ<span className="ml-[0.8em] text-[0.6em] tracking-[0.1em] text-mute">{r.n}ページ目</span>
          </>
        }
      />
      <section className="section no-cv">
        <BlogIndex posts={paginate(r.all, r.n)} total={r.all.length} page={r.n} basePath={pages.blog.path} />
      </section>
      <JsonLd
        graph={[
          organizationNode(),
          websiteNode(),
          webPageNode({ path: r.path, title, description: pages.blog.description, type: "CollectionPage", hasBreadcrumb: true }),
          breadcrumbNode(crumbs, r.path),
        ]}
      />
    </>
  );
}
