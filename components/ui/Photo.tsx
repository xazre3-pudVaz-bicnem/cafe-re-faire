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
  /** 最初の画面に入る写真だけ true（遅延読み込みをやめ、優先して読み込む。現れる動きも付けない） */
  priority?: boolean;
  quality?: 75 | 85;
  /** 現れる動きを少し遅らせる（並んだ写真を順に出すとき）。秒 */
  delay?: number;
  /** alt を差し替える（同じ写真を、別の文脈で使うとき） */
  alt?: string;
};

/** 写真。角は落とさず、影も付けない。画面に入ると、幕が上がるように現れる */
export function Photo({ photo, sizes, ratio, ratioSp, className, position, priority, quality, delay, alt }: Props) {
  const { image } = photo;
  const base = ratio ?? `${image.width}/${image.height}`;
  const style = {
    "--ar": base,
    ...(ratioSp ? { "--ar-sp": ratioSp } : {}),
    ...(delay ? { "--reveal-delay": `${delay}s` } : {}),
  } as CSSProperties;

  return (
    <div className={`photo ${className ?? ""}`} style={style} data-reveal={priority ? undefined : ""}>
      <div className="photo-in">
        <Image
          src={image}
          alt={alt ?? photo.alt}
          sizes={sizes}
          quality={quality}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          placeholder="empty"
          style={position ? { objectPosition: position } : undefined}
        />
      </div>
    </div>
  );
}
