"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Google マップの埋め込み URL（data/site.ts の map.embedUrl） */
  embedUrl: string;
  title: string;
  /** 縦に大きく出す（アクセスのページ用） */
  tall?: boolean;
};

/**
 * 地図。枠が画面に近づいてから iframe を読む。
 * 最初から読むと、地図の外部スクリプトがページの表示を遅らせるため。
 */
export function MapEmbed({ embedUrl, title, tall }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "320px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`frame ${tall ? "aspect-[4/5] md:aspect-[16/10]" : "aspect-[4/5] md:aspect-[16/8]"}`}>
      {show ? (
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0 grayscale-[0.25]"
        />
      ) : null}
    </div>
  );
}
