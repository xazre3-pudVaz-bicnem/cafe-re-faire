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
 * ・写真は1枚だけ、最優先で読み込む。横長の画面には横位置、縦長の画面には縦位置の、別の写真を出し分ける
 *   （<picture> なので、読み込まれるのは片方だけ）。どちらも、黒い石の皿にのせたケーキ。
 *   分け目は、幅ではなく向き。縦に持ったタブレットには縦位置、横に倒したスマートフォンには横位置が出る
 *   （app/globals.css の .hero-media も、同じ条件で切り抜きの位置を替えている）。
 * ・.opening は、その訪問で一度だけ見せる最初の演出（生成りの幕が、扉のように左右に開く）。
 *   写真は幕の下で最初から描かれているので、表示の速さの計測（LCP）は遅れない。
 *   幕も、中の店名の文字（CSS で出す飾り）も、読み上げと検索の対象にはならない。
 */
export function Hero() {
  const [head, ...rest] = site.name.split(" ");
  // 横長の画面に出す写真（pc）と、縦長の画面に出す写真（sp）
  const pc = photos.cakeMatcha.image;
  const sp = photos.cakeTiramisu.image;
  // 画面の向きで別の写真を出すので、どちらにも当てはまる説明にする
  const alt = `黒い石のプレートにのせた、${site.name}のケーキ`;

  // <picture> の中の <img> には srcset を持たせないので、sizes も <source> の側へ移す
  const {
    props: { srcSet: desktopSet, sizes: desktopSizes, ...desktop },
  } = getImageProps({ alt, sizes: "100vw", quality: 85, src: pc });
  /*
    縦長の画面では、画面を写真の高さで埋めるので、写真は画面の幅より広く描かれる（左右が切れる）。
    実際に描かれる幅は画面の幅のおよそ 1.6 倍だが、sizes は 100vw にしてある。
    ・画素の細かい端末（iPhone など、3倍）… 100vw でも元の写真（幅 1,087px）がそのまま届く
    ・画素の粗い端末（2倍以下）… 幅 750〜828px の軽い画像が届く。回線も遅いことが多いので、表示の速さを優先する
    1.6 倍に合わせると、粗い端末にも元の写真が届いて、最初の表示が 0.2〜0.3 秒遅くなる。
  */
  const MOBILE_SIZES = "100vw";
  const {
    props: { srcSet: mobileSet },
  } = getImageProps({ alt, sizes: MOBILE_SIZES, quality: 75, src: sp });

  const PORTRAIT = "(orientation: portrait)";
  const LANDSCAPE = "(orientation: landscape)";

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
        <source media={PORTRAIT} srcSet={mobileSet} sizes={MOBILE_SIZES} />
        <source media={LANDSCAPE} srcSet={desktopSet} sizes={desktopSizes} />
        {/* いちばん大きな要素（LCP）になる写真。遅延させず、優先して読み込む */}
        <img {...desktop} alt={alt} loading="eager" fetchPriority="high" decoding="async" />
      </picture>
      <div className="hero-shade" aria-hidden="true" />

      <div className="opening" aria-hidden="true">
        <span className="opening-door opening-door-l" />
        <span className="opening-door opening-door-r" />
        {/* 幕の上の店名。飾りなので、文字は CSS が data-a・data-b から出す（本文の文字には入らない） */}
        <span className="opening-mark" data-a={head} data-b={rest.join(" ")} />
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
              岩手・{site.address.locality} <span className="ml-[0.4em] whitespace-nowrap">{site.address.area}のカフェ</span>
            </span>
          </span>
        </h1>
        <p className="hero-message">朝九時、水色の扉があきます。</p>

        {/* 下へ続くことを知らせる細い線。文字の置き場所（.hero-body）の右下に置く */}
        <div className="hero-scroll" aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
      </div>
    </section>
  );
}
