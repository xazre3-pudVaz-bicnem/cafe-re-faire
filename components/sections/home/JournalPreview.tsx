import Image from "next/image";
import Link from "next/link";
import { Phrase } from "@/components/ui/Phrase";
import { categoryBySlug } from "@/data/blog-categories";
import { pages } from "@/data/pages";
import { photos } from "@/data/photos";
import { formatDate, getAllPosts } from "@/lib/blog";

/**
 * 07 ブログ。新しい記事を4本だけ。続きは一覧へ。
 *
 * 組み方：同じ形のカードを並べない。題名を大きく並べる。
 *   ・PC … 一覧の右に、載せた（またはキーボードで選んだ）記事の写真が出る。何も選んでいないときは、いちばん新しい記事の写真。
 *   ・スマートフォン … 1本目は大きな写真、3本目は小さな写真を右に。ほかは文字だけ（記事のあいだに、写真が自然に入る）。
 * 写真は飾り（alt は空）。題名がリンクの文言になる。切り替えは CSS だけで行う（app/globals.css の .jr-*）。
 */
export function JournalPreview() {
  const posts = getAllPosts().slice(0, 4);
  if (posts.length === 0) return null;

  return (
    <section className="section">
      <div className="wide">
        <p className="t-label" data-reveal="wipe">
          <span className="inline-block">
            <span className="n">04</span>Journal
          </span>
        </p>

        <div className="mt-5 grid gap-y-8 lg:grid-cols-12 lg:items-end lg:gap-x-8">
          <div className="lg:col-span-7">
            <p className="latin jr-word" aria-hidden="true">
              <i>Journal</i>
            </p>
          </div>
          <div className="lg:col-span-4 lg:col-start-9 lg:pb-4">
            <h2 className="t-h3">ブログ</h2>
            <p className="mt-3">メニューにまつわる話、カフェでの過ごし方、水沢と奥州のこと、店からのお知らせを載せています。</p>
          </div>
        </div>

        <div className="jr-body mt-10 md:mt-16">
          <ul className="jr-list" data-reveal="rows">
            {posts.map((post, i) => {
              const photo = photos[post.eyecatch];
              const category = categoryBySlug(post.category);
              /*
                写真の枠は縦長（4:5）。横位置の写真は、枠の幅より広く描かれるので、その分だけ大きい画像を頼む。
                  PC … 一覧の右の枠（幅は区画の 3 割弱）。載せる前は 1.07 倍に引いてある
                  スマートフォン … 1本目は幅いっぱい（3:2 の枠）、3本目は右の小さな枠。ほかの記事の写真は出さない（読み込まれない）
              */
              const cover = Math.max(1, photo.image.width / photo.image.height / 0.8);
              const pc = Math.ceil(29 * cover * 1.07);
              const sp = i === 0 ? 94 : Math.ceil(30 * cover);
              const sizes = `(max-width: 1023px) ${sp}vw, min(${Math.ceil(pc * 19.2)}px, ${pc}vw)`;
              return (
                <li key={post.slug} className="jr-item">
                  <Link href={`/blog/${post.slug}`} className="jr-link">
                    <span className="jr-photo">
                      <Image src={photo.image} alt="" sizes={sizes} />
                    </span>
                    <span className="jr-meta flex flex-wrap items-center gap-x-4 text-[0.75rem] leading-[1.8] tracking-[0.1em] text-mute">
                      <time dateTime={post.publishedAt} className="num text-[1rem]">
                        {formatDate(post.publishedAt)}
                      </time>
                      {category && <span>{category.name}</span>}
                    </span>
                    <h3 className="jr-title">
                      <Phrase>{post.title}</Phrase>
                    </h3>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-9 md:mt-12">
          <Link href={pages.blog.path} className="more">
            ブログの記事一覧
          </Link>
        </p>
      </div>
    </section>
  );
}
