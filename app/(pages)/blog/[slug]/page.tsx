/**
 * ブログの記事。
 *
 * 1記事＝1つの検索語（frontmatter の focusKeyword）。固定ページやほかの記事と、同じ検索語を取り合わない。
 * 記事の最後に、関連する固定ページと関連する記事への行を置く（孤立した記事を作らない）。
 * 店の紹介の決まった枠（住所・営業時間のくり返し）は置かない。店舗情報は、全ページ共通のフッターにある。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/sections/ArticleBody";
import { Onward } from "@/components/sections/Onward";
import { PostRows } from "@/components/sections/PostRows";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { Photo } from "@/components/ui/Photo";
import { Phrase } from "@/components/ui/Phrase";
import { categoryBySlug } from "@/data/blog-categories";
import { pageList, pages } from "@/data/pages";
import { photos } from "@/data/photos";
import { site } from "@/data/site";
import { formatDate, getAdjacentPosts, getAllPosts, getPost, getRelatedPosts } from "@/lib/blog";
import { blogPostingNode, breadcrumbNode, organizationNode, webPageNode, websiteNode, type Crumb } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return buildMetadata({
    title: `${post.title}｜${site.name}`,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: [post.focusKeyword, ...post.keywords].filter(Boolean),
    ogPhoto: post.eyecatch,
    type: "article",
    publishedTime: `${post.publishedAt}T09:00:00+09:00`,
    modifiedTime: `${post.updatedAt}T09:00:00+09:00`,
    section: categoryBySlug(post.category)?.name,
  });
}

/** 記事の最後に出す固定ページ（記事が指定したもの → 店のこと → アクセス の順で、3つまで） */
function onwardLinks(relatedPages: string[]) {
  const paths = [...new Set([...relatedPages, pages.about.path, pages.access.path])];
  return paths
    .map((path) => pageList.find((p) => p.path === path))
    .filter((p): p is NonNullable<typeof p> => Boolean(p) && p!.key !== "blog")
    .slice(0, 3)
    .map((p) => ({ href: p.path, label: p.anchor, note: p.anchorNote }));
}

export default async function BlogPostPage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  const path = `/blog/${post.slug}`;
  const category = categoryBySlug(post.category);
  const photo = photos[post.eyecatch];
  const related = getRelatedPosts(post, 3);
  const { newer, older } = getAdjacentPosts(post);

  const crumbs: Crumb[] = [
    { name: pages.home.label, path: pages.home.path },
    { name: pages.blog.label, path: pages.blog.path },
    ...(category ? [{ name: category.name, path: `/blog/category/${category.slug}` }] : []),
    { name: post.title, path },
  ];

  return (
    <article>
      <header className="page-head wrap">
        <Breadcrumbs crumbs={crumbs} />
        <p className="mt-8 flex flex-wrap items-center gap-x-5 text-[0.8125rem] leading-[1.8] tracking-[0.1em] text-mute md:mt-12">
          <time dateTime={post.publishedAt} className="num text-[1rem]">
            {formatDate(post.publishedAt)}
          </time>
          {category && (
            <Link href={`/blog/category/${category.slug}`} className="inline-flex min-h-11 items-center hover:text-ink">
              {category.name}
            </Link>
          )}
        </p>
        <h1 className="t-h1 mt-2 max-w-[26em]">
          <Phrase>{post.title}</Phrase>
        </h1>
        <p className="t-lead measure mt-7 md:mt-9">{post.description}</p>
      </header>

      <div className="cq mt-12 md:mt-16">
        <div className="wrap">
          <Photo
            photo={photo}
            ratio="16/9"
            ratioSp="4/3"
            className="max-md:pull-r md:pull-l md:mr-[8%]"
            sizes="(max-width: 767px) 94vw, 86vw"
            quality={85}
            priority
          />
        </div>
      </div>

      <div className="wrap mt-14 grid gap-y-10 md:mt-20 lg:grid-cols-12 lg:gap-x-8">
        {post.headings.length >= 3 && (
          <nav aria-label="この記事の目次" className="lg:col-span-3">
            <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
              <p className="label">目次</p>
              <ol className="mt-4 text-[0.875rem] leading-[1.8]">
                {post.headings.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="inline-flex min-h-11 items-center py-1 text-ink-2 hover:text-ink">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>
        )}

        <div className={post.headings.length >= 3 ? "lg:col-span-7 lg:col-start-5" : "lg:col-span-7 lg:col-start-3"}>
          <ArticleBody body={post.body} headings={post.headings} />

          <footer className="mt-16 border-t border-line pt-8">
            <p className="t-note">
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)} 公開</time>
              {post.updatedAt !== post.publishedAt && (
                <>
                  <span className="mx-[0.6em]">/</span>
                  <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)} 更新</time>
                </>
              )}
              <span className="mx-[0.6em]">/</span>
              {site.name}
            </p>
          </footer>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <Onward title="店のこと" links={onwardLinks(post.relatedPages)} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="section pt-0!">
          <div className="wrap">
            <h2 className="label">関連する記事</h2>
            <div className="mt-6">
              <PostRows posts={related} headingLevel={3} />
            </div>

            <nav aria-label="前後の記事" className="mt-10 grid gap-y-2 text-[0.875rem] md:grid-cols-2 md:gap-x-8">
              <p>
                {older && (
                  <Link href={`/blog/${older.slug}`} rel="prev" className="link inline-flex min-h-11 items-center">
                    前の記事：{older.title}
                  </Link>
                )}
              </p>
              <p className="md:text-right">
                {newer && (
                  <Link href={`/blog/${newer.slug}`} rel="next" className="link inline-flex min-h-11 items-center">
                    次の記事：{newer.title}
                  </Link>
                )}
              </p>
            </nav>
          </div>
        </section>
      )}

      <JsonLd
        graph={[
          organizationNode(),
          websiteNode(),
          webPageNode({
            path,
            title: `${post.title}｜${site.name}`,
            description: post.description,
            photo: post.eyecatch,
            hasBreadcrumb: true,
          }),
          breadcrumbNode(crumbs, path),
          blogPostingNode({
            slug: post.slug,
            title: post.title,
            description: post.description,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
            eyecatch: post.eyecatch,
            section: category?.name ?? "",
            keywords: [post.focusKeyword, ...post.keywords].filter(Boolean),
          }),
        ]}
      />
    </article>
  );
}
