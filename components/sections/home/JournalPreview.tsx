import Link from "next/link";
import { PostRows } from "@/components/sections/PostRows";
import { pages } from "@/data/pages";
import { getAllPosts } from "@/lib/blog";

/** 07 ブログ。新しい記事を4本だけ。続きは一覧へ */
export function JournalPreview() {
  const posts = getAllPosts().slice(0, 4);
  if (posts.length === 0) return null;

  return (
    <section className="section">
      <div className="wrap grid gap-y-10 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-4">
          <h2 className="t-h2">ブログ</h2>
          <p className="measure mt-8">メニューにまつわる話、カフェでの過ごし方、水沢と奥州のこと、店からのお知らせを載せています。</p>
          <p className="mt-8 hidden lg:block">
            <Link href={pages.blog.path} className="more">
              ブログの記事一覧
            </Link>
          </p>
        </div>

        <div className="lg:col-span-8">
          <PostRows posts={posts} headingLevel={3} />
          <p className="mt-8 lg:hidden">
            <Link href={pages.blog.path} className="more">
              ブログの記事一覧
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
