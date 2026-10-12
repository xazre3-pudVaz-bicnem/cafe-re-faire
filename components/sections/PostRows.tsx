import Image from "next/image";
import Link from "next/link";
import { Phrase } from "@/components/ui/Phrase";
import { categoryBySlug } from "@/data/blog-categories";
import { photos } from "@/data/photos";
import { formatDate, type Post } from "@/lib/blog";

/**
 * 記事の一覧（行の並び）。カードにせず、罫で区切った行に、日付・分類・大きな題名・小さな写真を置く。
 * 題名を見出しにする（headingLevel で、置く場所に合った階層を選ぶ）。
 * 載せると、写真がごくわずかに拡大し、題名が少し右へ動く（PC だけ）。
 */
export function PostRows({
  posts,
  headingLevel = 3,
  withSummary = false,
}: {
  posts: Post[];
  headingLevel?: 2 | 3;
  withSummary?: boolean;
}) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <ul className="rows" data-reveal="rows">
      {posts.map((post) => {
        const photo = photos[post.eyecatch];
        const category = categoryBySlug(post.category);
        return (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="zoom grid grid-cols-[minmax(0,1fr)_5.75rem] items-start gap-x-5 py-7 md:grid-cols-[minmax(0,1fr)_12rem] md:gap-x-12 md:py-10"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-4 text-[0.75rem] leading-[1.8] tracking-[0.1em] text-mute">
                  <time dateTime={post.publishedAt} className="num text-[1rem]">
                    {formatDate(post.publishedAt)}
                  </time>
                  {category && <span>{category.name}</span>}
                </p>
                <H className="zoom-shift mt-2 font-[family-name:var(--font-mincho)] text-[1.125rem] font-medium leading-[1.7] tracking-[0.05em] text-ink md:text-[1.5rem] md:leading-[1.65]">
                  <Phrase>{post.title}</Phrase>
                </H>
                {withSummary && <p className="mt-3 hidden max-w-[40em] text-[0.875rem] leading-[1.9] text-ink-2 md:block">{post.description}</p>}
              </div>
              <div className="frame aspect-[4/5] md:aspect-[4/3]">
                <Image src={photo.image} alt="" sizes="(max-width: 767px) 92px, 192px" />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
