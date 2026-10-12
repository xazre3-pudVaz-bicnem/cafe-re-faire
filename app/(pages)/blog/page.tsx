/**
 * ブログの一覧（1ページ目）。
 *
 * 担当する検索語 … 「Cafe Re faire ブログ」。細かい検索語は、記事が1つずつ受け持つ
 * 役割          … 記事への入口。分類で絞り込める
 */
import type { Metadata } from "next";
import { BlogIndex } from "@/components/sections/BlogIndex";
import { PageHead } from "@/components/sections/PageHead";
import { JsonLd } from "@/components/ui/JsonLd";
import { pages } from "@/data/pages";
import { getAllPosts, paginate } from "@/lib/blog";
import { blogNode, crumbsFor, pageGraph } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const page = pages.blog;

export const metadata: Metadata = pageMetadata(page);

export default function BlogPage() {
  const all = getAllPosts();
  const posts = paginate(all, 1);

  return (
    <>
      <PageHead crumbs={crumbsFor(page)} label="Journal" title="ブログ" lead="メニューにまつわる話、カフェでの過ごし方、水沢と奥州のこと、季節のこと。店からのお知らせも、ここに載せています。" />
      <section className="section">
        <BlogIndex posts={posts} total={all.length} page={1} basePath={page.path} />
      </section>
      <JsonLd graph={pageGraph(page, [blogNode(posts)], { type: "CollectionPage" })} />
    </>
  );
}
