"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * ヘッダーの外枠。いまトップページにいるかどうかだけを見て、印（data-over-hero）を付ける。
 *
 * トップの最初の画面では、ヘッダーは写真の上に白い文字で重なり、店名を出さない（見た目は CSS が受け持つ）。
 * ヘッダーは全ページ共通の枠（app/layout.tsx）に1つだけ置いてあるので、ページを移っても同じ要素のまま残る。
 * そのため「トップかどうか」は、ページの側から渡さず、ここで調べる。
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const overHero = usePathname() === "/";
  return (
    <header className="site-header" data-over-hero={overHero ? "" : undefined}>
      {children}
    </header>
  );
}
