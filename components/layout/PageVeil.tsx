"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

/** 幕が画面を覆いきるまでの時間（CSS の veil-in と同じ長さ） */
const COVER_MS = 500;
/** 幕が上へ抜けるまでの時間（CSS の veil-out と同じ長さ） */
const UNCOVER_MS = 750;

/**
 * ページの移り変わり。生成りの幕が下から上がって画面を覆い、次のページの上を、上へ抜ける。
 *
 * ・サイト内のリンクを押したときだけ動く。幕が覆ってから、ふつうのページ移動（router.push）をする。
 *   履歴には、ふつうのリンクと同じように1件だけ積まれる。
 * ・ブラウザの「戻る」「進む」には手を出さない（幕も出さない）。位置の復元は、ブラウザと Next.js に任せる。
 * ・別のタブで開く操作（Ctrl／⌘＋クリックなど）、ページ内の # へのリンク、サイト外のリンク、
 *   動きを減らす設定のときは、何もしない。
 * ・いま見ているページへのリンク（トップでロゴを押したとき、など）は、移動せずに、ページの先頭へ戻す。
 * ・移動が終わらないときは、4秒で幕を上げる（幕の下に閉じ込めない）。
 * ・スマートフォンの全画面メニューの中のリンクは、メニューそのものが幕の役をするので、ここでは扱わない（data-no-veil）。
 */
export function PageVeil() {
  const pathname = usePathname();
  const router = useRouter();
  const veil = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const uncover = useCallback(() => {
    if (!busy.current) return;
    busy.current = false;
    window.clearTimeout(timer.current);
    const el = veil.current;
    if (!el) return;
    el.dataset.state = "out";
    timer.current = window.setTimeout(() => {
      if (!busy.current) delete el.dataset.state;
    }, UNCOVER_MS + 50);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (url.pathname === window.location.pathname) {
        /*
          いま見ているページへのリンク（トップでロゴや「トップ」を押したとき、など）。
          そのままだと何も起きないように見えるので、ページの先頭へ戻す。
          ページ内の # へのリンク（記事の目次など）は、ブラウザに任せる。
        */
        if (!url.hash && url.search === window.location.search) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
          // キーボードで押したとき（リンクにフォーカスの輪が出ているとき）は、フォーカスもページの先頭へ移す。
          // 読み込み直したときと同じ位置から、続けられるように。マウスやタッチのときは、移さない（「本文へ移動」が出てしまう）
          if (e.detail === 0 || a.matches(":focus-visible")) {
            document.querySelector<HTMLElement>('.site-header a[href="#main"]')?.focus({ preventScroll: true });
          }
        }
        return;
      }
      if (a.closest("[data-no-veil]")) return;
      // ページではないもの（RSS・画像など）は、そのまま開く
      if (/\.[a-z0-9]+$/i.test(url.pathname) || url.pathname.startsWith("/api/")) return;
      if (reduced) return;

      e.preventDefault();
      if (busy.current) return;
      const el = veil.current;
      if (!el) {
        router.push(url.pathname + url.search + url.hash);
        return;
      }
      busy.current = true;
      window.clearTimeout(timer.current);
      el.dataset.state = "in";
      timer.current = window.setTimeout(() => {
        router.push(url.pathname + url.search + url.hash);
        timer.current = window.setTimeout(uncover, 4000);
      }, COVER_MS);
    };
    // 「戻る」「進む」のときに幕が残っていたら、すぐ上げる
    const onPop = () => uncover();

    window.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, [router, uncover]);

  // 次のページが描かれたら、幕を上げる
  useEffect(() => {
    uncover();
  }, [pathname, uncover]);

  return <div ref={veil} className="veil" aria-hidden="true" />;
}
