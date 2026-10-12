import type { CSSProperties } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { navKeys, pages, type PageKey } from "@/data/pages";
import { closedLine, fullAddress, sundayHours, weekdayHours } from "@/data/site";
import { MenuDialog } from "./MenuDialog";
import { NavLinks } from "./NavLinks";

/** 全画面メニューで、項目の右に小さく添える欧文（飾り。CSS で出すので、リンクの文言には入らない） */
const EN: Record<PageKey, string> = { home: "Top", menu: "Menu", about: "About", access: "Access", blog: "Journal" };

/**
 * ヘッダー。左に店名、右に4つのメニュー。予約や問い合わせのボタンは置かない。
 *
 * 最初は透けていて、下へ送ると上へ隠れ、上へ戻すと、ぼかした生成りの地を敷いて出てくる
 * （状態は lib/boot-script.ts が <html> に書き、見た目は CSS が受け持つ）。
 *
 * overHero はトップページ専用。最初の画面では写真の上に白い文字で重なり、店名を出さない
 * （ヒーローに大きく出ているため）。
 */
export function Header({ overHero = false }: { overHero?: boolean }) {
  const nav = navKeys.map((key) => ({ key, href: pages[key].path, label: pages[key].label }));
  const all = [{ key: "home" as PageKey, href: pages.home.path, label: pages.home.label }, ...nav];

  return (
    <header className="site-header" data-over-hero={overHero ? "" : undefined}>
      <a href="#main" className="sr-only-focusable">
        本文へ移動
      </a>
      <div className="flex h-full items-center justify-between gap-6 px-[var(--gutter)]">
        <Link href="/" className="hide-on-hero flex min-h-11 shrink-0 items-center">
          <span className="logo">
            <Wordmark />
          </span>
          <span className="sr-only">（トップページへ）</span>
        </Link>

        <div className="flex items-center">
          <nav aria-label="メインメニュー" className="hidden lg:block">
            <NavLinks items={nav} />
          </nav>

          <MenuDialog>
            <div className="flex min-h-[calc(100%-var(--header-h))] flex-col px-[var(--gutter)] pb-10 pt-2">
              <p className="logo menu-rise text-ink">
                <Wordmark />
              </p>
              <nav aria-label="メニュー" className="mt-8">
                <ul className="rows">
                  {all.map((item, i) => (
                    <li key={item.href} className="menu-rise" style={{ "--i": i + 1 } as CSSProperties}>
                      <Link href={item.href} className="menu-item" data-en={EN[item.key]}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <address className="t-note menu-rise mt-auto pt-12" style={{ "--i": 7 } as CSSProperties}>
                <p>{fullAddress}</p>
                <p>
                  {weekdayHours}／日曜・祝日 {sundayHours}
                </p>
                <p>定休日 {closedLine}</p>
              </address>
            </div>
          </MenuDialog>
        </div>
      </div>
    </header>
  );
}
