import type { CSSProperties } from "react";
import Image from "next/image";
import type { Photo as PhotoData } from "@/data/photos";

type Props = {
  photo: PhotoData;
  /**
   * 表示される幅。Tailwind の md は 768px、lg は 1024px からなので、境界は 767px・1023px で書く。
   * 例: "(max-width: 1023px) 100vw, 50vw"
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
  /** alt を差し替える（同じ写真を、別の文脈で使うとき） */
  alt?: string;
};

/** 写真。角は落とさず、影も付けない。画面に入ると、幕が開くように現れる */
export function Photo({ photo, sizes, ratio, ratioSp, className, position, positionSp, priority, quality, reveal = "up", delay, parallax, alt }: Props) {
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
      sizes={sizes}
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
