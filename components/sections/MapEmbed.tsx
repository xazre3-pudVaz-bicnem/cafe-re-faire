"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Google マップの埋め込み URL（data/site.ts の map.embedUrl） */
  embedUrl: string;
  title: string;
};

/**
 * 地図。区画の最後に、大きく置く。枠が画面に近づいてから iframe を読む
 * （最初から読むと、地図の外部スクリプトがページの表示を遅らせるため）。
 */
export function MapEmbed({ embedUrl, title }: Props) {
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
    <div ref={ref} className="frame map-frame aspect-[4/5] md:aspect-[16/9] lg:aspect-[21/9]">
      {show ? <iframe src={embedUrl} title={title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /> : null}
    </div>
  );
}
