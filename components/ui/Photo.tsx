import type { CSSProperties } from "react";
import Image from "next/image";
import type { Photo as PhotoData } from "@/data/photos";

type Props = {
  photo: PhotoData;
  /**
   * 枠（写真の置き場所）の幅。Tailwind の md は 768px、lg は 1024px からなので、境界は 767px・1023px で書く。
   * 例: "(max-width: 1023px) 100vw, 50vw"
   * 書くのは枠の幅だけでよい。切り抜きや視差で写真が枠より大きく描かれる分は、ここで足す（下の fitSizes）。
   */
  sizes: string;
  /** 枠の縦横比。"3/2" など。省くと写真そのままの比率 */
  ratio?: string;
  /** スマートフォン（767px 以下）だけ別の比率にするとき */
  ratioSp?: string;
  /** 枠（外側）に付ける class。position 系（absolute など）は渡さない。全面に敷くときは外側を div で包む */
  className?: string;
  /** 切り抜きの位置。"50% 30%" など */
  position?: string;
  /** スマートフォン（767px 以下）だけ別の位置で切り抜くとき */
  positionSp?: string;
  /** 最初の画面に入る写真だけ true（遅延読み込みをやめ、優先して読み込む。現れる動きも付けない） */
  priority?: boolean;
  quality?: 75 | 85;
  /**
   * 現れかた。枠は動かさず、幕が開く。
   *   up（既定）… 下から上へ ／ left … 左から右へ ／ right … 右から左へ ／ none … 動かさない
   * 隣り合う写真で向きを変えると、同じ動きのくり返しにならない。
   */
  reveal?: "up" | "left" | "right" | "none";
  /** 現れる動きを少し遅らせる（並んだ写真を順に出すとき）。秒 */
  delay?: number;
  /**
   * 視差。スクロールに合わせて、枠の中で写真が上下にこの px 数だけ動く（枠は動かない）。
   * 写真ごとに量を変えると、速さの違いで奥行きが出る。使えないブラウザと、動きを減らす設定のときは動かない。
   */
  parallax?: number;
  /**
   * 文章の器（.wrap）の中に置く写真は true。
   * 器は画面が広くなっても 76rem で止まるので、sizes の vw も、その幅で止める（広い画面に、大きすぎる画像を届けない）。
   */
  contained?: boolean;
  /** alt を差し替える（同じ写真を、別の文脈で使うとき） */
  alt?: string;
};

/** スマートフォンの上限（Tailwind の md の手前） */
const MOBILE_MAX = 767;
/** vw を px に直すときの、PC の画面の幅の目安 */
const REF_WIDTH = 1440;
/** これより広い画面では、写真は大きくならない（区画は 120rem、文章の器は 76rem＋左右の余白で止まる） */
const STOP_WIDE = 1920;
const STOP_CONTAINED = 1400;

/** かっこの外にある区切りで分ける（min(…) や max(…) の中のカンマ・空白では分けない） */
function splitOutside(text: string, by: "comma" | "space"): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    const hit = depth === 0 && (by === "comma" ? ch === "," : /\s/.test(ch));
    if (hit) {
      if (cur) out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** 写真が、枠の幅の何倍の幅で描かれるか（幅 width px の枠に、cover で入れたとき） */
function coverFactor(sourceRatio: number, frameRatio: number, parallax: number, width: number): number {
  // 視差の箱は、枠より上下に parallax px ずつ大きい。その箱を、写真が覆う
  const boxRatio = width / (width / frameRatio + parallax * 2);
  return Math.min(2, Math.max(1, sourceRatio / boxRatio));
}

/**
 * sizes を、実際に描かれる大きさに合わせる。
 *
 * 写真は枠を覆うように入れる（object-fit: cover）。横位置の写真を縦長の枠に入れると、写真は枠の幅の
 * 1.3〜1.8倍の幅で描かれ、視差の分も加わる。sizes が枠の幅のままだと、届く画像が小さくて、PC でぼやける。
 * そこで、PC とタブレットの行にだけ、その倍率を掛ける。
 *   ・スマートフォンの行（max-width: 767px）は、そのまま。画素の細かい端末では、枠の幅の画像で足りる。
 *     大きくすると、通信量だけが増える。
 *   ・最後の行（PC）の vw は、写真がそれ以上大きくならない画面の幅で止める（px の上限を付ける）。
 * 出す vw は整数にして、前に空白を置く。next/image は「空白＋整数＋vw」を見て、srcset に入れる幅を決めている。
 */
export function fitSizes(sizes: string, sourceRatio: number, frameRatio: number, parallax: number, stop: number): string {
  const out: string[] = [];
  let mobileDone = false;

  for (const entry of splitOutside(sizes, "comma")) {
    const parts = splitOutside(entry.trim(), "space");
    const length = parts.pop() ?? "";
    const media = parts.join(" ");
    const head = media ? `${media} ` : "";
    const max = media.match(/max-width:\s*(\d+)px/);

    if (max && Number(max[1]) <= MOBILE_MAX) {
      mobileDone = true;
      out.push(`${head}${length}`);
      continue;
    }
    // スマートフォンにも当てはまる行（"(max-width: 1023px) …" や、条件のない行）は、スマートフォンの分を先に分けて、そのまま残す
    if (!mobileDone && !/min-width/.test(media)) {
      mobileDone = true;
      out.push(`(max-width: ${MOBILE_MAX}px) ${length}`);
    }

    const vw = length.match(/^(\d+(?:\.\d+)?)vw$/);
    if (vw) {
      const n = Number(vw[1]);
      const scaled = Math.ceil(n * coverFactor(sourceRatio, frameRatio, parallax, (n / 100) * REF_WIDTH));
      // 上限のある行（〜1023px など）は、その幅までしか使われないので、px の上限は要らない
      out.push(max ? `${head}${scaled}vw` : `${head}min(${Math.ceil((scaled * stop) / 100)}px, ${scaled}vw)`);
    } else if (/^0(px)?$/.test(length)) {
      out.push(`${head}${length}`);
    } else {
      // min(…) や max(…) で書いた幅（横に流れるメニューの写真）は、倍率だけ掛ける
      const k = coverFactor(sourceRatio, frameRatio, parallax, 420);
      out.push(k > 1.02 ? `${head}calc(${k.toFixed(2)} * ${length})` : `${head}${length}`);
    }
  }
  return out.join(", ");
}

/** "4/5" → 0.8 */
function toNumber(ratio: string): number {
  const [w, h] = ratio.split("/").map(Number);
  return w / (h || 1);
}

/** 写真。角は落とさず、影も付けない。画面に入ると、幕が開くように現れる */
export function Photo({ photo, sizes, ratio, ratioSp, className, position, positionSp, priority, quality, reveal = "up", delay, parallax, contained, alt }: Props) {
  const { image } = photo;
  const base = ratio ?? `${image.width}/${image.height}`;
  const style = {
    "--ar": base,
    ...(ratioSp ? { "--ar-sp": ratioSp } : {}),
    ...(position ? { "--pos": position } : {}),
    ...(positionSp ? { "--pos-sp": positionSp } : {}),
    ...(delay ? { "--d": `${delay}s` } : {}),
    ...(parallax ? { "--px": `${parallax}px` } : {}),
  } as CSSProperties;
  const animated = !priority && reveal !== "none";

  const img = (
    <Image
      src={image}
      alt={alt ?? photo.alt}
      sizes={fitSizes(sizes, image.width / image.height, toNumber(base), parallax ?? 0, contained ? STOP_CONTAINED : STOP_WIDE)}
      quality={quality}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      placeholder="empty"
    />
  );

  return (
    <div className={`photo ${className ?? ""}`} style={style} data-reveal={animated ? reveal : undefined} data-px={parallax ? "" : undefined}>
      <div className="photo-in">{parallax ? <div className="photo-px">{img}</div> : img}</div>
    </div>
  );
}
