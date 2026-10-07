import type { CSSProperties } from "react";
import { getImageProps } from "next/image";
import { photos } from "@/data/photos";
import { site } from "@/data/site";

/**
 * トップの最初の画面。
 *
 * ・置くのは、写真と、店名と、短いことばだけ。ボタンやリンクは置かない。
 * ・見出し（h1）は、店名と「どこの何の店か」の添え書き。
 *   検索語を大きく並べる場所にはしない（説明の文章は、この下の区画に書く）。
 * ・写真は1枚だけ、最優先で読み込む。PC は横位置、スマートフォンは縦位置の別の写真を出し分ける
 *   （<picture> なので、読み込まれるのは片方だけ）。
 */
export function Hero() {
  // PC とスマートフォンで別の写真を出すので、どちらにも当てはまる説明にする
  const common = { alt: `${site.name}の店内。木の柱と観葉植物のあいだに、テーブル席が並ぶ`, sizes: "100vw", quality: 85 } as const;
  const {
    props: { srcSet: desktopSet, ...desktop },
  } = getImageProps({ ...common, src: photos.interior01.image });
  // スマートフォンは回線が細いことが多いので、少し軽い画質にする（文字の下に陰を敷くので、差は見えない）
  const {
    props: { srcSet: mobileSet },
  } = getImageProps({ ...common, quality: 75, src: photos.interior02.image });

  const MOBILE = "(max-width: 767px)";
  const DESKTOP = "(min-width: 768px)";

  return (
    <section data-hero="" className="hero">
      <picture className="hero-media">
        <source media={MOBILE} srcSet={mobileSet} sizes="100vw" />
        <source media={DESKTOP} srcSet={desktopSet} sizes="100vw" />
        {/* いちばん大きな要素（LCP）になる写真。遅延させず、優先して読み込む */}
        <img {...desktop} alt={common.alt} loading="eager" fetchPriority="high" decoding="async" />
      </picture>
      <div className="hero-shade" aria-hidden="true" />

      <div className="wrap relative flex h-full flex-col justify-end pb-11 md:pb-16 lg:pb-20">
        <p className="hero-message fade-in" style={{ "--fade-delay": "0.5s" } as CSSProperties}>
          朝九時、水色の扉があきます。
        </p>
        {/* 語のあいだの空白（{" "}）は、画面には出ないが、文字として読み取るときに語がつながらないように入れてある */}
        <h1 className="fade-in mt-5 md:mt-6" style={{ "--fade-delay": "0.25s" } as CSSProperties}>
          <span className="hero-wordmark">{site.name}</span>{" "}
          <span className="hero-place mt-6 md:mt-8">
            <span>
              岩手・{site.address.locality} <span className="ml-[0.4em]">{site.address.area}のカフェ</span>
            </span>
          </span>
        </h1>
      </div>
    </section>
  );
}
