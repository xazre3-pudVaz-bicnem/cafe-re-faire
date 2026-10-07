import Image from "next/image";
import Link from "next/link";
import { Phrase } from "@/components/ui/Phrase";
import { categoryBySlug } from "@/data/blog-categories";
import { photos } from "@/data/photos";
import { formatDate, type Post } from "@/lib/blog";

/**
 * 記事の一覧（行の並び）。カードにせず、罫で区切った行に、小さな写真・日付・分類・題名を置く。
 * 題名を見出しにする（headingLevel で、置く場所に合った階層を選ぶ）。
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
    <ul className="rows">
      {posts.map((post) => {
        const photo = photos[post.eyecatch];
        const category = categoryBySlug(post.category);
        return (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="group grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-x-5 py-6 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-x-10 md:py-8">
              <div className="frame aspect-[4/3]">
                <Image
                  src={photo.image}
                  alt=""
                  sizes="(max-width: 767px) 88px, 176px"
                  className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none"
                />
              </div>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-4 text-[0.75rem] leading-[1.8] tracking-[0.1em] text-mute">
                  <time dateTime={post.publishedAt} className="num text-[0.9375rem]">
                    {formatDate(post.publishedAt)}
                  </time>
                  {category && <span>{category.name}</span>}
                </p>
                <H className="mt-2 font-[family-name:var(--font-mincho)] text-[1.0625rem] font-medium leading-[1.8] tracking-[0.05em] text-ink md:text-[1.1875rem]">
                  <span className="underline decoration-transparent decoration-1 underline-offset-[0.45em] transition-colors duration-500 group-hover:decoration-door">
                    <Phrase>{post.title}</Phrase>
                  </span>
                </H>
                {withSummary && <p className="mt-3 hidden text-[0.875rem] leading-[1.9] text-ink-2 md:block">{post.description}</p>}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
