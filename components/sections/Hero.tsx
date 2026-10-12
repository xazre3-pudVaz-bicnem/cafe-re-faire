import type { CSSProperties } from "react";
import { getImageProps } from "next/image";
import { photos } from "@/data/photos";
import { site } from "@/data/site";

/**
 * トップの最初の画面。
 *
 * ・置くのは、写真と、店名と、短いことばだけ。ボタンやリンクは置かない。
 * ・見出し（h1）は、店名と「どこの何の店か」の添え書き。読み取れる文字は「Cafe Re faire 岩手・奥州市 水沢のカフェ」。
 *   店名は、画面の端まで使って大きく2行に組む（1語目は立体、残りは斜体）。
 * ・写真は1枚だけ、最優先で読み込む。PC は横位置、スマートフォンは縦位置の別の写真を出し分ける
 *   （<picture> なので、読み込まれるのは片方だけ）。どちらも、黒い石の皿にのせたケーキ。
 * ・.opening は、その訪問で一度だけ見せる最初の演出（生成りの幕が、扉のように左右に開く）。
 *   写真は幕の下で最初から描かれているので、表示の速さの計測（LCP）は遅れない。
 *   幕も、中の店名の文字（CSS で出す飾り）も、読み上げと検索の対象にはならない。
 */
export function Hero() {
  const [head, ...rest] = site.name.split(" ");
  const pc = photos.cakeMatcha.image;
  const sp = photos.cakeTiramisu.image;
  // PC とスマートフォンで別の写真を出すので、どちらにも当てはまる説明にする
  const alt = `黒い石のプレートにのせた、${site.name}のケーキ`;

  // <picture> の中の <img> には srcset を持たせないので、sizes も <source> の側へ移す
  const {
    props: { srcSet: desktopSet, sizes: desktopSizes, ...desktop },
  } = getImageProps({ alt, sizes: "100vw", quality: 85, src: pc });
  /*
    スマートフォンでは、縦長の画面を写真の高さで埋めるので、写真は画面の幅より広く描かれる（左右が切れる）。
    実際に描かれる幅は画面の幅のおよそ 1.6 倍だが、sizes は 100vw にしてある。
    ・画素の細かい端末（iPhone など、3倍）… 100vw でも元の写真（幅 1,087px）がそのまま届く
    ・画素の粗い端末（2倍以下）… 幅 750〜828px の軽い画像が届く。回線も遅いことが多いので、表示の速さを優先する
    1.6 倍に合わせると、粗い端末にも元の写真が届いて、最初の表示が 0.2〜0.3 秒遅くなる。
  */
  const MOBILE_SIZES = "100vw";
  const {
    props: { srcSet: mobileSet },
  } = getImageProps({ alt, sizes: MOBILE_SIZES, quality: 75, src: sp });

  const MOBILE = "(max-width: 767px)";
  const DESKTOP = "(min-width: 768px)";

  const mediaStyle = {
    // 読み込みが終わるまで敷いておく、ごく小さな写真（数百バイト）
    "--blur-pc": `url("${pc.blurDataURL}")`,
    "--blur-sp": `url("${sp.blurDataURL}")`,
    // 切り抜きの位置（写真ごとに決めている）
    "--pos-pc": "50% 62%",
    "--pos-sp": "58% 50%",
  } as CSSProperties;

  return (
    <section data-hero="" className="hero">
      <picture className="hero-media" style={mediaStyle}>
        <source media={MOBILE} srcSet={mobileSet} sizes={MOBILE_SIZES} />
        <source media={DESKTOP} srcSet={desktopSet} sizes={desktopSizes} />
        {/* いちばん大きな要素（LCP）になる写真。遅延させず、優先して読み込む */}
        <img {...desktop} alt={alt} loading="eager" fetchPriority="high" decoding="async" />
      </picture>
      <div className="hero-shade" aria-hidden="true" />

      <div className="opening" aria-hidden="true">
        <span className="opening-door opening-door-l" />
        <span className="opening-door opening-door-r" />
        <span className="opening-mark" />
      </div>

      <div className="hero-body">
        {/* 語のあいだの空白（{" "}）は、画面には出ないが、文字として読み取るときに語がつながらないように入れてある */}
        <h1>
          <span className="hero-lockup">
            <span className="line" style={{ "--i": 0 } as CSSProperties}>
              <span className="line-in">{head}</span>
            </span>{" "}
            <span className="line hero-l2" style={{ "--i": 1 } as CSSProperties}>
              <span className="line-in">
                <i>{rest.join(" ")}</i>
              </span>
            </span>
          </span>{" "}
          <span className="hero-place">
            <span>
              岩手・{site.address.locality} <span className="ml-[0.4em]">{site.address.area}のカフェ</span>
            </span>
          </span>
        </h1>
        <p className="hero-message">朝九時、水色の扉があきます。</p>
      </div>

      <div className="hero-scroll" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  );
}
