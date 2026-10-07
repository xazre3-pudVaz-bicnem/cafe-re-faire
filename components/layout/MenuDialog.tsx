"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * スマートフォン用の全画面メニュー。
 * <dialog> の showModal() を使うので、フォーカスの閉じ込め・Esc で閉じる・背面の操作不可はブラウザが受け持つ。
 * 中身（リンクの一覧）はサーバー側で描いたものを children で受け取る。
 */
export function MenuDialog({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  // ページを移ったら閉じる
  useEffect(() => {
    if (ref.current?.open) ref.current.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-controls="site-menu"
        onClick={() => ref.current?.showModal()}
        className="-mr-3 flex size-12 items-center justify-center lg:hidden"
      >
        <span className="sr-only">メニューを開く</span>
        <span aria-hidden="true" className="flex w-7 flex-col gap-[7px]">
          <span className="block h-px w-full bg-current" />
          <span className="block h-px w-full bg-current" />
        </span>
      </button>

      <dialog
        ref={ref}
        id="site-menu"
        aria-label="メニュー"
        className="menu-dialog m-0"
        onClick={(e) => {
          // 同じページへのリンクを押したときも閉じる
          if ((e.target as HTMLElement).closest("a")) ref.current?.close();
        }}
      >
        <div className="wrap flex h-16 items-center justify-end">
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="-mr-3 flex h-12 items-center px-3 text-[0.8125rem] tracking-[0.16em] text-ink"
          >
            閉じる
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}
