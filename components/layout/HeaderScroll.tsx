"use client";

import { useEffect } from "react";

/**
 * トップページ専用。ヒーローを過ぎたらヘッダーに data-scrolled を付ける。
 * 見た目の切り替えは CSS（.site-header[data-over-hero]）が受け持つ。
 */
export function HeaderScroll() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    let waiting = false;

    const update = () => {
      waiting = false;
      const limit = hero ? hero.offsetHeight - header.offsetHeight - 8 : 8;
      header.toggleAttribute("data-scrolled", window.scrollY > limit);
    };
    const onScroll = () => {
      if (waiting) return;
      waiting = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
