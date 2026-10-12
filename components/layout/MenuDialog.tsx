"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

/** 閉じる動きの長さ（CSS の menu-out と同じ） */
const CLOSE_MS = 550;

/**
 * スマートフォン用の全画面メニュー。
 * <dialog> の showModal() を使うので、フォーカスの閉じ込め・Esc で閉じる・背面の操作不可はブラウザが受け持つ。
 * 中身（リンクの一覧）はサーバー側で描いたものを children で受け取る。
 *
 * 開くときは上から幕が下り、閉じるときは上へ引き上げる。
 * 別のページへのリンクを押したときは、開いたままページを移り、移ったあとに引き上げる
 * （メニューそのものが、ページの移り変わりの幕になる。data-no-veil は、共通の幕を重ねて出さないための印）。
 */
export function MenuDialog({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  const close = useCallback(() => {
    const el = ref.current;
    if (!el || !el.open || el.dataset.closing !== undefined) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.close();
      return;
    }
    el.dataset.closing = "";
    window.setTimeout(() => {
      delete el.dataset.closing;
      el.close();
    }, CLOSE_MS);
  }, []);

  // ページを移ったら閉じる
  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <>
      <button type="button" aria-haspopup="dialog" aria-controls="site-menu" onClick={() => ref.current?.showModal()} className="menu-btn lg:hidden">
        <span>Menu</span>
        <span className="sr-only">（メニューを開く）</span>
      </button>

      <dialog
        ref={ref}
        id="site-menu"
        aria-label="メニュー"
        className="menu-dialog m-0"
        data-no-veil=""
        onCancel={(e) => {
          // Esc でも、閉じる動きを見せてから閉じる
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          // 同じページへのリンクは移動が起きないので、ここで閉じる
          const a = (e.target as HTMLElement).closest("a");
          if (a && new URL(a.href, window.location.href).pathname === window.location.pathname) close();
        }}
      >
        <div className="flex h-[var(--header-h)] items-center justify-end px-[var(--gutter)]">
          <button type="button" onClick={close} className="menu-btn">
            <span>Close</span>
            <span className="sr-only">（メニューを閉じる）</span>
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}
